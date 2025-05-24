/* eslint-disable @typescript-eslint/no-explicit-any */

import { inngest } from "../../../inngest/client";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { documentDataUri, description, fileName } = await request.json();
    const result = await inngest.send({
      name: "document.uploaded",
      data: { documentDataUri, description, fileName }
    });

     console.log('Inngest result from the api:', result);
    let runId = null;
    // Check if result is an object with an 'ids' array containing at least one string
    if (result && typeof result === 'object' && Array.isArray((result as any).ids) && (result as any).ids.length > 0 && typeof (result as any).ids[0] === 'string') {
      runId = (result as any).ids[0]; // Get the first ID from the 'ids' array
      console.log('Inngest run ID:', runId);
    } else {
      console.warn('Could not extract runId from Inngest result:', result);
    }

    return NextResponse.json({ runId }, { status: 200 });
  } catch (error) {  console.error('Detailed error triggering extraction:', JSON.stringify(error, null, 2));
  if (error instanceof Error) {
    console.error('Error stack:', error.stack);
  }
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
  return NextResponse.json({ error: errorMessage }, { status: 500 });

  }
}
