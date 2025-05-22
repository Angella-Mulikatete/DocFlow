export type ProcessingStepStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface ProcessingStep {
  id: string;
  name: string;
  status: ProcessingStepStatus;
  description?: string;
  details?: string; 
}
