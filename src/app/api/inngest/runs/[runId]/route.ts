// app/api/inngest/runs/[runId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;
    
    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
    }

    // Fetch from Inngest API
    const inngestResponse = await fetch(
      `https://api.inngest.com/v1/runs/${runId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.INNGEST_SIGNING_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Inngest response status in the inngest/runs/runId:', inngestResponse);

    if (!inngestResponse.ok) {
      console.error('Inngest API error:', await inngestResponse.text());
      return NextResponse.json(
        { error: `Inngest API error: ${inngestResponse.statusText}` },
        { status: inngestResponse.status }
      );
    }

    const runData = await inngestResponse.json();
    
    // Transform the response to match your expected format
    const response = {
      status: runData.status, 
      output: runData.output,
      error: runData.error,   
      createdAt: runData.created_at,
      finishedAt: runData.finished_at,
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching Inngest run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch run status' },
      { status: 500 }
    );
  }
}