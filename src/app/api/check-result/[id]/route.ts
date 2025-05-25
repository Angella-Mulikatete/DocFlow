
import { NextRequest, NextResponse } from 'next/server';

// You'll need to store job results somewhere (database, Redis, etc.)
// This is a simplified example using in-memory storage
const jobResults = new Map<string, { status: 'pending' | 'completed' | 'failed', data?: unknown, error?: string }>();

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  const { runId } = params;
  
  const result = jobResults.get(runId);

  console.log('Checking job status for runId:', runId, 'Result:', result);
  
  if (!result) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  
  return NextResponse.json(result);
}

// Helper function to update job status (call this from your Inngest job)
export function updateJobResult(runId: string, status: 'pending' | 'completed' | 'failed', data?: unknown, error?: string) {
  jobResults.set(runId, { status, data, error });
}