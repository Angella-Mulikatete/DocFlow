'use client';

import type { ChangeEvent, FC, FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { extractDataFromDocument, type ExtractDataFromDocumentInput, type ExtractDataFromDocumentOutput } from "../../ai/flows/extract-data-from-documents";
import { toast } from 'sonner';
import { Loader2, FileUp } from 'lucide-react';

interface FileUploadFormProps {
  onProcessStart: () => void;
  onProcessSuccess: (data: ExtractDataFromDocumentOutput, fileName: string) => void;
  onProcessError: (error: string) => void;
}

const FileUploadForm: FC<FileUploadFormProps> = ({ onProcessStart, onProcessSuccess, onProcessError }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const reader = new FileReader();
      reader.onloadend = async () => {
        const documentDataUri = reader.result as string;
        const input: ExtractDataFromDocumentInput = {
          documentDataUri,
          description: `Document: ${selectedFile.name}`, // Optional: provide a description
        };
        
        const output = await extractDataFromDocument(input);
        onProcessSuccess(output, selectedFile.name);
        toast.success('Processing Successful', {
          description: `Data extracted from ${selectedFile.name}.`,
        });
        setSelectedFile(null); // Reset file input after successful upload
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
      };
      reader.onerror = () => {
        throw new Error('Error reading file.');
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
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
