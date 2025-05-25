/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import type { ChangeEvent, FC, FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
//import { extractDataFromDocument, type ExtractDataFromDocumentInput, type ExtractDataFromDocumentOutput } from "../../ai/flows/extract-data-from-documents";
import { toast } from 'sonner';
import { Loader2, FileUp } from 'lucide-react';


interface FileUploadFormProps {
  onProcessStart: () => void;
  onProcessSuccess: (runId: string, fileName: string) => void;
  onProcessError: (error: string) => void;
}

const FileUploadForm: FC<FileUploadFormProps> = ({ onProcessStart, onProcessSuccess, onProcessError }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

      // Cloudinary constants are no longer needed as file is sent as data URI directly to Inngest
  // const CLOUDINARY_UPLOAD_PRESET = "note-book-companion";
  // const CLOUDINARY_CLOUD_NAME = "dcmjg2lmc";



  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for PDF and common image types
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid File Type', {
          description: 'Please upload a PDF, JPG, PNG, TIFF or WEBP file.',
        });
        setSelectedFile(null);
        event.target.value = ''; // Reset file input
        return;
      }
      setSelectedFile(file);
    }
  };

//   async function uploadFileToCloudinary(file: File): Promise<string> {
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

//     const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
//     const response = await fetch(uploadUrl, {
//       method: "POST",
//       body: formData,
//     });

//     if (!response.ok) {
//       throw new Error(`Cloudinary upload failed: ${response.statusText}`);
//     }

//     const data = await response.json();
//     return data.secure_url as string;
//  }

  const getFileType = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        switch (extension) {
          case 'pdf':
            return "pdf";
          case 'txt':
            return "txt";
          case 'doc':
          case 'docx':
            return "gdoc"; 
          default:
            return "txt"; 
        }
  };

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     if (!selectedFile) {
//       toast.error('No File Selected', {
//         description: 'Please select a document to upload.',
//       });
//       return;
//     }

//     setIsLoading(true);
//     onProcessStart();

//     try {
//       // 1. Upload the file to Cloudinary and get the URL
//       const fileUrl = await uploadFileToCloudinary(selectedFile);

//       // 2. Send event to Inngest via API route
//       const inngestResponse = await fetch("/api/trigger-extraction", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           documentDataUri: fileUrl, // Use the Cloudinary URL
//           description: `Document: ${selectedFile.name}`,
//           contentType: selectedFile.type,
//           fileName: selectedFile.name,
//         }),
//       });

//       if (!inngestResponse.ok) {
//         throw new Error(`Failed to trigger extraction: ${inngestResponse.statusText}`);
//       }

//       const { runId } = await inngestResponse.json();
//       onProcessSuccess(runId, selectedFile.name);
//       setSelectedFile(null);

//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
//       onProcessError(errorMessage);
//       toast.error('Processing Failed', { description: errorMessage });
//     } finally {
//       setIsLoading(false);
//     }
//  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error('No File Selected', {
        description: 'Please select a document to upload.',
      });
      return;
    }

    setIsLoading(true);
    onProcessStart();

    try {
      // 1. Convert selectedFile to a data URI (base64)
      const reader = new FileReader();
      const documentDataUriPromise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file as data URL.'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const documentDataUri = await documentDataUriPromise;
      //console.log('Document Data URI in file Upload form componenet:', documentDataUri);

      // 2. Send event to Inngest via API route
      const inngestResponse = await fetch("/api/trigger-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentDataUri,
          description: `Document: ${selectedFile.name}`,
          contentType: selectedFile.type,
          fileName: selectedFile.name,
        }),
      });

      if (!inngestResponse.ok) {
        throw new Error(`Failed to trigger extraction: ${inngestResponse.statusText}`);
      }

      const { runId } = await inngestResponse.json();
      console.log('Inngest run ID in fileUpload Component:', runId);
      onProcessSuccess(runId, selectedFile.name);
      setSelectedFile(null);

    }catch (error) {
      console.error('Error processing document:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      onProcessError(errorMessage);
      toast.error('Processing Failed', {
        description: errorMessage,
       });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileUp className="h-6 w-6 text-primary" />
          Upload Document
        </CardTitle>
        <CardDescription>
          Select a document (PDF, JPG, PNG, TIFF, WEBP) to automatically extract data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file-upload" className="text-base">Choose Document</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              disabled={isLoading}
              className="file:text-primary file:font-semibold hover:file:bg-primary/10"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif,.webp"
            />
            {selectedFile && <p className="text-sm text-muted-foreground pt-1">Selected: {selectedFile.name}</p>}
          </div>
          <Button type="submit" disabled={isLoading || !selectedFile} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Extract Data'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FileUploadForm;
