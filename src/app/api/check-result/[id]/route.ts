
import { NextRequest, NextResponse } from 'next/server';

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


export function updateJobResult(runId: string, status: 'pending' | 'completed' | 'failed', data?: unknown, error?: string) {
  jobResults.set(runId, { status, data, error });
}