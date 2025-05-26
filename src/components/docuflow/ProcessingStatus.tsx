'use client';

import type { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, XCircle, ListChecks, FileClock } from 'lucide-react';
import type { ProcessingStep, ProcessingStepStatus } from './types';
import { Separator } from '../ui/separator';

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  currentDocumentName?: string | null;
}

const StatusIcon: FC<{ status: ProcessingStepStatus }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <FileClock className="h-5 w-5 text-muted-foreground" />;
    case 'in-progress':
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-destructive" />;
    default:
      return null;
  }
};

const ProcessingStatus: FC<ProcessingStatusProps> = ({ steps, currentDocumentName }) => {
  if (!steps || steps.length === 0 || steps.every(step => step.status === 'pending' && !step.details)) {
    return null;
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
         <ListChecks className="h-6 w-6 text-primary" />
          Processing Workflow
        </CardTitle>
        {currentDocumentName && (
           <CardDescription>Status for: <span className="font-semibold text-primary">{currentDocumentName}</span></CardDescription>
        )}
         {!currentDocumentName && (
           <CardDescription>Overview of the document processing stages.</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {steps.map((step, index) => (
            <li key={step.id} className="flex flex-col">
              <div className="flex items-center space-x-3">
                <StatusIcon status={step.status} />
                <div className="flex-1">
                  <p className={`font-medium ${step.status === 'in-progress' ? 'text-primary' : 'text-foreground'}`}>
                    {step.name}
                  </p>
                  {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
                </div>
              </div>
              {step.details && (
                <div className="mt-2 ml-8 pl-1 border-l-2 border-dashed border-border ">
                  <p className="text-xs bg-muted p-2 rounded-md text-muted-foreground">{step.details}</p>
                </div>
              )}
              {index < steps.length - 1 && <Separator className="my-4"/>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;
