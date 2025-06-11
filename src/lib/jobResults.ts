const jobResults = new Map<string, { status: 'pending' | 'completed' | 'failed', data?: unknown, error?: string }>();

export function updateJobResult(runId: string, status: 'pending' | 'completed' | 'failed', data?: unknown, error?: string) {
  jobResults.set(runId, { status, data, error });
}

export function getJobResult(runId: string) {
  return jobResults.get(runId);
}
