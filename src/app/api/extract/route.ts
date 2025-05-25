// // // src/app/api/extract/route.ts
// // import { NextRequest, NextResponse } from "next/server";
// // import { inngest } from "../../../inngest/client";

// // export async function POST(request: NextRequest) {
// //   const { documentDataUri, description } = await request.json();
// //   if (!documentDataUri || !description) {
// //     return NextResponse.json({ error: "Missing data" }, { status: 400 });
// //   }

// //   // Send event and wait for the run to finish (no polling)
// //   const extractedData = await inngest.send({
// //     name: "document/uploaded",
// //     data: { documentDataUri, description },
// //     options: { waitFor: "completed" }, // Waits for the function to finish
// //   });

// //   console.log("extracted data from the api in the extract api:", extractedData);

// //   // The run output is directly returned when waitFor: "completed"

// //   return NextResponse.json({ extractedData });
// // }







// // app/api/extract-document/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { inngest } from '@/inngest/client';

// export async function POST(request: NextRequest) {
//   try {
//     const { documentDataUri,contentType, description, fileName } = await request.json();

//     if (!documentDataUri) {
//       return NextResponse.json({ error: 'Document data URI is required' }, { status: 400 });
//     }

//      // <<< Add validation for contentType if it's a URL >>>
//     if (documentDataUri.startsWith('http' ) && !contentType) {
//         return NextResponse.json({ error: 'contentType is required for URL-based documents' }, { status: 400 });
//     }

//     // Send event to Inngest and wait for the result
//     const { ids } = await inngest.send({
//       name: "document.uploaded",
//       data: {
//         documentDataUri,
//         contentType,
//         description: description || 'Extract all relevant data from this document',
//         fileName: fileName || 'Unknown Document'
//       }
//     });

//     const runId = ids[0];
//     console.log('Inngest job started with ID:', runId);

//     // Poll for the result with a reasonable timeout
//     const result = await pollForResult(runId, 30000); // 30 second timeout
//     console.log("result data from Inngest in extract endpoint:", result);
    
//     return NextResponse.json(result);

//   } catch (error) {
//     console.error('Error in extract-document API:', error);
//     return NextResponse.json(
//       { error: error instanceof Error ? error.message : 'Unknown error occurred' },
//       { status: 500 }
//     );
//   }
// }

// async function pollForResult(runId: string, timeout: number) {
//   const startTime = Date.now();
//   const pollInterval = 1000; // Check every second
  
//   while (Date.now() - startTime < timeout) {
//     try {
//       // Check if we have a result stored somewhere
//       // For simplicity, let's use a simple approach with the Inngest function itself
//       // const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/check-result/${runId}`);
//     const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
//     const response = await fetch(`${baseUrl}/api/check-result/${runId}`);

//       console.log('Polling for result:', response.status, response.statusText);
      
//       if (response.ok) {
//         const result = await response.json();
//         if (result.status === 'completed') {
//           return result.data;
//         } else if (result.status === 'failed') {
//           throw new Error(result.error || 'Processing failed');
//         }
//       }
      
//       // Wait before next poll
//       await new Promise(resolve => setTimeout(resolve, pollInterval));
      
//     } catch (error) {
//       console.error('Error polling for result:', error);
//       // Continue polling unless it's a critical error
//     }
//   }
  
//   throw new Error('Processing timeout - the operation took too long to complete');
// }




// import { NextRequest, NextResponse } from 'next/server';
// import { inngest } from '@/inngest/client';

// export async function POST(request: NextRequest) {
//   try {
//     const { documentDataUri, description, contentType, fileName } = await request.json();

//     if (!documentDataUri || !contentType) {
//       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
//     }

//     const { ids } = await inngest.send({
//       name: "document.uploaded",
//       data: { documentDataUri, description, contentType, fileName },
//       options: { waitFor: "completed" } // Wait for workflow completion
//     });

//     const extractedData = ids?.[0]?.output?.extractedData ?? null;

//     return NextResponse.json({ extractedData });

//   } catch (error) {
//     console.error('Extraction API error:', error);
//     return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
//   }
// }
