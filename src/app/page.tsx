

/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback ,useRef} from 'react';
import type { FC } from 'react';
import Header from '@/components/layout/Header';
import FileUploadForm from '@/components/docuflow/FileUploadForm';
import ProcessingStatus from '@/components/docuflow/ProcessingStatus';
import ExtractedDataDisplay from '@/components/docuflow/ExtractedDataDisplay';
import type { ProcessingStep, ProcessingStepStatus } from '@/components/docuflow/types';
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // const updateStepStatus = useCallback((stepId: string, status: ProcessingStepStatus, details?: string) => {
  //   setProcessingSteps(prevSteps =>
  //     prevSteps.map(step =>
  //       step.id === stepId ? { ...step, status, details: details || step.details } : step
  //     )
  //   );
  // }, []);
  
  // const resetWorkflow = useCallback(() => {
  //   setProcessingSteps(initialSteps);
  //   setExtractedData(null);
  //   setErrorMessage(null);
  //   setCurrentDocumentName(null);
  //   setIsProcessing(false);
  // }, []);

  // const handleProcessStart = useCallback(() => {
  //   resetWorkflow();
  //   setIsProcessing(true);
  //   updateStepStatus('upload', 'in-progress', 'Preparing to upload document...');
  // }, [resetWorkflow, updateStepStatus]);

  // const handleProcessSuccess = useCallback(async (documentDataUri: string, fileName: string, description?: string, contentType?: string) => {
  //   try {
  //     setCurrentDocumentName(fileName);
  //     updateStepStatus('upload', 'completed', `Document "${fileName}" uploaded successfully.`);
  //     updateStepStatus('extraction', 'in-progress', 'AI is analyzing the document...');

  //     // Call your extraction API directly - no Inngest complexity
  //     const response = await fetch('/api/extract', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         documentDataUri,
  //         description: description || 'Extract all relevant data from this document',
  //         contentType,
  //         fileName
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Extraction failed: ${response.statusText}`);
  //     }

  //     const result = await response.json();

  //     console.log("Extracted data from the extract endpoint:", result);
      
  //     // Handle the result
  //     const extractedData = result.extractedData || {};
  //     setExtractedData(extractedData);

  //     console.log('Extracted data in pages from the extract endpoint:', extractedData);
      
  //     const dataSummary = Object.keys(extractedData).length > 0
  //       ? `${Object.keys(extractedData).length} fields extracted.`
  //       : 'No specific fields were extracted by AI.';

  //     updateStepStatus('extraction', 'completed', `AI processing complete. ${dataSummary}`);
  //     updateStepStatus('transformation', 'completed', 'Data structured and validated.');
  //     updateStepStatus('notification', 'completed', 'Stakeholders notified (simulation).');
  //     updateStepStatus('complete', 'completed', 'Workflow finished successfully.');
  //     setIsProcessing(false);

  //   } catch (error) {
  //     console.error('Processing error:', error);
  //     handleProcessError(error instanceof Error ? error.message : 'Unknown error occurred');
  //   }
  // }, [updateStepStatus]);

 
 
   const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateStepStatus = useCallback((stepId: string, status: ProcessingStepStatus, details?: string) => {
    setProcessingSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, status, details: details || step.details } : step
      )
    );
  }, []);
  
  const resetWorkflow = useCallback(() => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setProcessingSteps(initialSteps);
    setExtractedData(null);
    setErrorMessage(null);
    setCurrentDocumentName(null);
    setIsProcessing(false);
  }, []);

  const handleProcessStart = useCallback(() => {
    resetWorkflow();
    setIsProcessing(true);
    updateStepStatus('upload', 'in-progress', 'Preparing to upload document...');
  }, [resetWorkflow, updateStepStatus]);

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/check-result/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to check job status: ${response.statusText}`);
      }
      
      const jobResult = await response.json();
      console.log('Job status:', jobResult);
      
      switch (jobResult.status) {
        case 'processing':
          updateStepStatus('extraction', 'in-progress', 'AI is actively processing the document...');
          break;
          
        case 'completed':
          // Clear the polling interval
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Extract the data from the job result
          const output = jobResult.data;
          console.log("Complete job output:", output);
          
          // Handle your specific output structure
          const extractedData = output?.extractedData || {};
          setExtractedData(extractedData);
          
          console.log('Final extracted data:', extractedData);
          
          const dataSummary = Object.keys(extractedData).length > 0
            ? `${Object.keys(extractedData).length} fields extracted.`
            : 'No specific fields were extracted by AI.';

          updateStepStatus('extraction', 'completed', `AI processing complete. ${dataSummary}`);
          updateStepStatus('transformation', 'completed', 'Data structured and validated.');
          updateStepStatus('notification', 'completed', 'Stakeholders notified (simulation).');
          updateStepStatus('complete', 'completed', 'Workflow finished successfully.');
          setIsProcessing(false);
          break;
          
        case 'failed':
          // Clear the polling interval
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          throw new Error(jobResult.error || 'Job failed without specific error message');
          
        case 'pending':
          // Keep polling
          break;
          
        default:
          console.warn('Unknown job status:', jobResult.status);
      }
    } catch (error) {
      console.error('Polling error:', error);
      
      // Clear the polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      handleProcessError(error instanceof Error ? error.message : 'Unknown polling error');
    }
  }, [updateStepStatus]);

  const handleProcessSuccess = useCallback(async (documentDataUri: string, fileName: string, description?: string, contentType?: string) => {
    try {
      setCurrentDocumentName(fileName);
      updateStepStatus('upload', 'completed', `Document "${fileName}" uploaded successfully.`);
      updateStepStatus('extraction', 'in-progress', 'Triggering AI extraction...');

      // Trigger the Inngest job
      const response = await fetch('/api/trigger-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentDataUri,
          description: description || 'Extract all relevant data from this document',
          contentType,
          fileName
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger extraction: ${response.statusText}`);
      }

      const result = await response.json();
      const jobId = result.runId;
      
      console.log('Extraction job started with ID:', jobId);
      updateStepStatus('extraction', 'in-progress', 'AI extraction job queued. Waiting for processing...');

      // Start polling for job status
      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(jobId);
      }, 2000); // Poll every 2 seconds

      // Also poll immediately
      pollJobStatus(jobId);

    } catch (error) {
      console.error('Processing error:', error);
      handleProcessError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }, [updateStepStatus, pollJobStatus]);
 
 
 
  const handleProcessError = useCallback((error: string) => {
    setErrorMessage(error);
    setIsProcessing(false);
    
    setProcessingSteps(prevSteps => {
      const failedStep = prevSteps.find(step => step.status === 'in-progress') || 
                         prevSteps.find(step => step.id === 'upload');
      
      return prevSteps.map(step =>
        step.id === failedStep?.id 
          ? { ...step, status: 'failed' as ProcessingStepStatus, details: error }
          : step
      );
    });
  }, []);

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
          
          <ProcessingStatus 
            steps={processingSteps} 
            currentDocumentName={currentDocumentName}
          />
          
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
                    <p className="text-muted-foreground">The AI completed processing, but no specific data fields were returned. This could mean the document was empty, unreadable, or the content did not match patterns the AI is looking for.</p>
                </CardContent>
             </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default DocuFlowPage;


















// /* eslint-disable @typescript-eslint/no-unused-vars */
// 'use client';

// import { useState, useCallback, useEffect } from 'react';
// import type { FC } from 'react';
// import Header from '@/components/layout/Header';
// import FileUploadForm from '@/components/docuflow/FileUploadForm';
// import ProcessingStatus from '@/components/docuflow/ProcessingStatus';
// import ExtractedDataDisplay from '@/components/docuflow/ExtractedDataDisplay';
// import type { ProcessingStep, ProcessingStepStatus } from '@/components/docuflow/types';
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { AlertTriangle } from "lucide-react";
// import { useInngestPolling } from '@/lib/useInngestPolling';

// const initialSteps: ProcessingStep[] = [
//   { id: 'upload', name: 'Document Upload', status: 'pending', description: 'Select and upload your document for processing.' },
//   { id: 'extraction', name: 'AI Data Extraction', status: 'pending', description: 'AI is analyzing the document.' },
//   { id: 'transformation', name: 'Data Structuring', status: 'pending', description: 'Formatting extracted data for review.' },
//   { id: 'notification', name: 'Notifications', status: 'pending', description: 'Relevant parties will be alerted upon completion (simulated).' },
//   { id: 'complete', name: 'Process Complete', status: 'pending', description: 'The document workflow has finished.' },
// ];


// const DocuFlowPage: FC = () => {
//   const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>(initialSteps);
//   const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [currentDocumentName, setCurrentDocumentName] = useState<string | null>(null);
//   const [inngestRunId, setInngestRunId] = useState<string | null>(null);
//   const [isProcessing, setIsProcessing] = useState<boolean>(false);

//   //const { result: inngestResult, error: inngestError, status: inngestStatus } = useInngestPolling(inngestRunId);

//   const updateStepStatus = useCallback((stepId: string, status: ProcessingStepStatus, details?: string) => {
//     setProcessingSteps(prevSteps =>
//       prevSteps.map(step =>
//         step.id === stepId ? { ...step, status, details: details || step.details } : step
//       )
//     );
//   }, []);
  
//   const resetWorkflow = useCallback(() => {
//     setProcessingSteps(initialSteps);
//     setExtractedData(null);
//     setErrorMessage(null);
//     setCurrentDocumentName(null);
//   }, []);

//   const handleProcessStart = useCallback(() => {
//     resetWorkflow();
//     updateStepStatus('upload', 'in-progress', 'Preparing to upload document...');
//   }, [resetWorkflow, updateStepStatus]);

//     // Function to fetch Inngest run result
//   const fetchInngestResult = useCallback(async (runId: string) => {
//     try {
//       const response = await fetch(`/api/inngest/runs/${runId}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch run result: ${response.statusText}`);
//       }

//       const result = await response.json();
//       console.log('Fetched Inngest result:', result);

//       if (result.status === 'Completed') {
//         // Process completed successfully
//         const extractedData = result.output?.extractedData || {};
//         setExtractedData(extractedData);
        
//         const dataSummary = Object.keys(extractedData).length > 0
//           ? `${Object.keys(extractedData).length} fields extracted.`
//           : 'No specific fields were extracted by AI, or the document might be empty/unreadable by the current model.';

//         updateStepStatus('extraction', 'completed', `AI processing complete. ${dataSummary}`);
//         updateStepStatus('transformation', 'completed', 'Data structured and validated.');
//         updateStepStatus('notification', 'completed', 'Stakeholders notified (simulation).');
//         updateStepStatus('complete', 'completed', 'Workflow finished successfully.');
//         setIsProcessing(false);
        
//       } else if (result.status === 'Failed') {
//         // Process failed
//         const errorMsg = result.error || 'Inngest function failed';
//         handleProcessError(errorMsg);
        
//       } else if (result.status === 'Running') {
//         // Still processing, continue checking
//         updateStepStatus('extraction', 'in-progress', 'AI is still analyzing the document...');
        
//         // Set a timeout to check again after a delay
//         setTimeout(() => {
//           if (isProcessing) {
//             fetchInngestResult(runId);
//           }
//         }, 2000); // Check every 2 seconds
//       }
      
//     } catch (error) {
//       console.error('Error fetching Inngest result:', error);
//       handleProcessError(`Failed to get processing status: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }, [updateStepStatus, isProcessing]);


//   const handleProcessSuccess = useCallback((newRunId: string, fileName: string) => {
//     setCurrentDocumentName(fileName);
//     setInngestRunId(newRunId);
//     // Optionally update steps, e.g.:
//     updateStepStatus('upload', 'completed', `Document "${fileName}" uploaded successfully.`);
//     updateStepStatus('extraction', 'in-progress', 'AI is analyzing the document.');
//   }, [updateStepStatus]);

//   const handleProcessError = useCallback((error: string) => {
//     setErrorMessage(error);
//     setInngestRunId(null); // Stop polling on error
//     setProcessingSteps(prevSteps => {
//       let failedStepFound = false;
//       const newSteps = prevSteps.map(step => {
//         if (step.status === 'in-progress' && !failedStepFound) {
//           failedStepFound = true;
//           return { ...step, status: 'failed' as ProcessingStepStatus, details: error };
//         }
//         if (step.id === 'upload' && !failedStepFound) {
//           failedStepFound = true;
//           return { ...step, status: 'failed' as ProcessingStepStatus, details: error };
//         }
//         return step;
//       });

//       // If no specific step was marked as failed, mark upload as failed.
//       if (!failedStepFound && !newSteps.some(s => s.status === 'failed')) {
//         return newSteps.map(step =>
//           step.id === 'upload' ? { ...step, status: 'failed' as ProcessingStepStatus, details: error } : step
//         );
//       }
//       return newSteps;
//     });
//   }, []);

// //  console.log('Inngest result from the hook:', inngestResult);
//   // Effect to handle Inngest polling results
//   // useEffect(() => {
//   //   if (inngestStatus === 'in-progress') {
//   //     updateStepStatus('extraction', 'in-progress', 'AI is analyzing the document...');
//   //   } else if (inngestStatus === 'completed' && inngestResult) {
//   //     // Only update extractedData if it's actually different to prevent infinite loops
//   //     if (JSON.stringify(inngestResult.extractedData) !== JSON.stringify(extractedData)) {
//   //       setExtractedData(inngestResult.extractedData as Record<string, unknown>);
//   //     }

//   //     const dataSummary = Object.keys(inngestResult.extractedData).length > 0
//   //       ? `${Object.keys(inngestResult.extractedData).length} fields extracted.`
//   //       : 'No specific fields were extracted by AI, or the document might be empty/unreadable by the current model.';

//   //     updateStepStatus('extraction', 'completed', `AI processing complete. ${dataSummary}`);
//   //     updateStepStatus('transformation', 'completed', 'Data structured and validated.');
//   //     updateStepStatus('notification', 'completed', 'Stakeholders notified (simulation).');
//   //     updateStepStatus('complete', 'completed', 'Workflow finished successfully.');
//   //      console.log('Inngest polling datasummary:', dataSummary);
//   //   } else if (inngestStatus === 'failed' && inngestError) {
//   //     handleProcessError(`Inngest polling failed: ${inngestError}`);
//   //   }

//   //   console.log('Inngest polling status:', inngestStatus);
   
//   // }, [inngestResult, inngestError, inngestStatus, updateStepStatus, handleProcessError, extractedData]);


//   return (
//     <div className="min-h-screen flex flex-col">
//       <Header />
//       <main className="flex-grow container mx-auto px-4 py-8">
//         <div className="max-w-3xl mx-auto space-y-8">
//           <FileUploadForm
//             onProcessStart={handleProcessStart}
//             onProcessSuccess={handleProcessSuccess}
//             onProcessError={handleProcessError}
//           />

//           {errorMessage && (
//             <Alert variant="destructive" className="shadow-md">
//               <AlertTriangle className="h-4 w-4" />
//               <AlertTitle>Error</AlertTitle>
//               <AlertDescription>{errorMessage}</AlertDescription>
//             </Alert>
//           )}
          
//           <ProcessingStatus steps={processingSteps} currentDocumentName={currentDocumentName} />
          
//           {extractedData && Object.keys(extractedData).length > 0 && (
//             <ExtractedDataDisplay data={extractedData} />
//           )}
//           {extractedData && Object.keys(extractedData).length === 0 && processingSteps.find(s => s.id === 'extraction' && s.status === 'completed') && (
//              <Card className="w-full shadow-lg">
//                 <CardHeader>
//                     <CardTitle className="flex items-center gap-2 text-xl">
//                         Extraction Result
//                     </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     <p className="text-muted-foreground">The AI completed processing, but no specific data fields were returned. This could mean the document was empty, unreadable, or the content did not match patterns the AI is looking for. </p>
//                 </CardContent>
//              </Card>
//           )}

//         </div>
//       </main>
//       {/* <footer className="py-6 text-center text-sm text-muted-foreground">
//         © {new Date().getFullYear()} DocuFlow Automate. All rights reserved.
//       </footer> */}
//     </div>
//   );
// };

// export default DocuFlowPage;







