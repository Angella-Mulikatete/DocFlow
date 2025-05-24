// import { useEffect, useState } from 'react';

// export const useInngestPolling = (runId: string | null) => {
//   const [status, setStatus] = useState<string | null>(null);
//   const [result, setResult] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!runId) return;

//     const poll = async () => {
//       try {
//         const res = await fetch(`/api/inngest-result?runId=${runId}`);
//         const data = await res.json();

//         if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

//         setStatus(data.status);
//         setResult(data.result);
//         setError(data.error);

//         if (data.status === 'completed' || data.status === 'failed') {
//           clearInterval(interval);
//         }
//       } catch (err: unknown) {
//         setError(err.message || 'Failed to fetch');
//         clearInterval(interval);
//       }
//     };

//     const interval = setInterval(poll, 2000);
//     poll(); // initial fetch

//     return () => clearInterval(interval);
//   }, [runId]);

//   return { status, result, error };
// };


// ./src/app/api/inngest-result/route.ts

import { NextRequest, NextResponse } from 'next/server';

interface InngestRunData {
  status?: string;
  output?: unknown;
  error?: string;
}

const INNGEST_DEV_SERVER_URL = 'http://localhost:8288/api/v1/runs/';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const runId = searchParams.get('runId');

  if (!runId) {
    return NextResponse.json({ error: 'runId is required' }, { status: 400 });
  }

  try {
    const inngestApiKey = process.env.INNGEST_API_KEY;

    if (!inngestApiKey) {
      console.error('INNGEST_API_KEY is not set in environment variables.');
      return NextResponse.json({ status: 'error', error: 'Server configuration error: INNGEST_API_KEY is missing.' }, { status: 500 });
    }

    const response = await fetch(`${INNGEST_DEV_SERVER_URL}${runId}`, {
      headers: {
        'Authorization': `Bearer ${inngestApiKey}`,
        'Accept': 'application/json', // Request JSON response
      },
    });

    if (!response.ok) {
      // Attempt to parse error response as JSON, fallback to text
      const errorBody = await response.text();
      throw new Error(`Failed to fetch Inngest run details: HTTP ${response.status} - ${errorBody}`);
    }

    const runData: InngestRunData = await response.json();
    console.log('Inngest run data from the inngest-result api :', runData);

    const status =
      typeof runData.status === 'string' && runData.status
        ? runData.status.toLowerCase()
        : 'unknown';

    console.log('Inngest run status:', status);

    return NextResponse.json({
      status,
      result: runData.output ?? null,
      error: runData.error ?? null,
    }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`Error fetching Inngest run details for runId ${runId}:`, errorMessage);
    return NextResponse.json(
      { status: 'error', error: errorMessage },
      { status: 500 }
    );
  }
}
