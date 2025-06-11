
// import { NextRequest, NextResponse } from 'next/server';
// import { getJobResult } from '@/lib/jobResults';

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { runId: string } }
// ) {
//   const { runId } = params;
  
//   const result = getJobResult(runId);

//   console.log('Checking job status for runId:', runId, 'Result:', result);
  
//   if (!result) {
//     return NextResponse.json({ error: 'Job not found' }, { status: 404 });
//   }
  
//   return NextResponse.json(result);
// }



import { NextRequest, NextResponse } from 'next/server';
import { getJobResult } from '@/lib/jobResults';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  // Await the params since they're now a Promise in Next.js 15
  const { runId } = await params;
  
  const result = getJobResult(runId);

  console.log('Checking job status for runId:', runId, 'Result:', result);
  
  if (!result) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  
  return NextResponse.json(result);
}