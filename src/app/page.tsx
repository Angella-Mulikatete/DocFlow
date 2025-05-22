'use client';

import { useState, useCallback } from 'react';
import type { FC } from 'react';
import Header from '@/components/layout/Header';
import FileUploadForm from '@/components/docuflow/FileUploadForm';
import ProcessingStatus from '@/components/docuflow/ProcessingStatus';
import ExtractedDataDisplay from '@/components/docuflow/ExtractedDataDisplay';
import type { ProcessingStep, ProcessingStepStatus } from '@/components/docuflow/types';
import type { ExtractDataFromDocumentOutput } from '../ai/flows/extract-data-from-documents';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const initialSteps: ProcessingStep[] = [
  { id: 'upload', name: 'Document Upload', status: 'pending', description: 'Select and upload your document for processing.' },
  { id: 'extraction', name: 'AI Data Extraction', status: 'pending', description: 'AI is analyzing the document.' },
  { id: 'transformation', name: 'Data Structuring', status: 'pending', description: 'Formatting extracted data for review.' },
  { id: 'notification', name: 'Notifications', status: 'pending', description: 'Relevant parties will be alerted upon completion (simulated).' },
  { id: 'complete', name: 'Process Complete', status: 'pending', description: 'The document workflow has finished.' },
];


const DocuFlowPage: FC = () => {
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>(initialSteps);
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentDocumentName, setCurrentDocumentName] = useState<string | null>(null);

  const updateStepStatus = useCallback((stepId: string, status: ProcessingStepStatus, details?: string) => {
    setProcessingSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, status, details: details || step.details } : step
      )
    );
  }, []);
  
  const resetWorkflow = useCallback(() => {
    setProcessingSteps(initialSteps);
    setExtractedData(null);
    setErrorMessage(null);
    setCurrentDocumentName(null);
  }, []);

  const handleProcessStart = useCallback(() => {
    resetWorkflow();
    updateStepStatus('upload', 'in-progress', 'Preparing to upload document...');
  }, [resetWorkflow, updateStepStatus]);

  const simulateStepCompletion = useCallback(async (stepId: string, nextStepId?: string, delay: number = 700, details?: string) => {
    updateStepStatus(stepId, 'completed', details);
    if (nextStepId) {
      await new Promise(resolve => setTimeout(resolve, delay));
      updateStepStatus(nextStepId, 'in-progress');
    }
  }, [updateStepStatus]);


  const handleProcessSuccess = useCallback(async (data: ExtractDataFromDocumentOutput, fileName: string) => {
    setErrorMessage(null);
    setCurrentDocumentName(fileName);
    updateStepStatus('upload', 'completed', `Document "${fileName}" uploaded successfully.`);
    
    await new Promise(resolve => setTimeout(resolve, 300)); // Short delay
    updateStepStatus('extraction', 'in-progress', 'Extracting data using AI...');

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setExtractedData(data.extractedData);
    
    const dataSummary = Object.keys(data.extractedData).length > 0 
      ? `${Object.keys(data.extractedData).length} fields extracted.`
      : 'No specific fields were extracted by AI, or the document might be empty/unreadable by the current model.';
    
    await simulateStepCompletion('extraction', 'transformation', 700, `AI processing complete. ${dataSummary}`);
    await simulateStepCompletion('transformation', 'notification', 700, 'Data structured and validated.');
    await simulateStepCompletion('notification', 'complete', 700, 'Stakeholders notified (simulation).');
    updateStepStatus('complete', 'completed', 'Workflow finished successfully.');

  }, [updateStepStatus, simulateStepCompletion]);

  const handleProcessError = useCallback((error: string) => {
    setErrorMessage(error);
    // Find the current in-progress step and mark it as failed
    setProcessingSteps(prevSteps => {
      let failedStepFound = false;
      return prevSteps.map(step => {
        if (step.status === 'in-progress' && !failedStepFound) {
          failedStepFound = true;
          return { ...step, status: 'failed', details: error };
        }
        // If upload failed, mark it as failed
        if(step.id === 'upload' && !failedStepFound) {
           failedStepFound = true;
           return { ...step, status: 'failed', details: error };
        }
        return step;
      });
    });
     // If no specific step was in-progress (e.g. error before starting), mark upload as failed.
    if (!processingSteps.some(s => s.status === 'failed')) {
        updateStepStatus('upload', 'failed', error);
    }
  }, [updateStepStatus, processingSteps]);


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <FileUploadForm
            onProcessStart={handleProcessStart}
            onProcessSuccess={handleProcessSuccess}
            onProcessError={handleProcessError}
          />

          {errorMessage && (
            <Alert variant="destructive" className="shadow-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <ProcessingStatus steps={processingSteps} currentDocumentName={currentDocumentName} />
          
          {extractedData && Object.keys(extractedData).length > 0 && (
            <ExtractedDataDisplay data={extractedData} />
          )}
          {extractedData && Object.keys(extractedData).length === 0 && processingSteps.find(s => s.id === 'extraction' && s.status === 'completed') && (
             <Card className="w-full shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        Extraction Result
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The AI completed processing, but no specific data fields were returned. This could mean the document was empty, unreadable, or the content did not match patterns the AI is looking for. </p>
                </CardContent>
             </Card>
          )}

        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} DocuFlow Automate. All rights reserved.
      </footer>
    </div>
  );
};

export default DocuFlowPage;
