import { inngest } from "./client";

import { extractDataFromDocument } from "../ai/flows/extract-data-from-documents";
import { updateJobResult } from "../lib/jobResults";

export const extractDocumentDataJob = inngest.createFunction(
  { id: "extract-document-data" },
  { event: "document.uploaded" },
  async ({ event, step }) => {
    // event.data will contain documentDataUri, description, fileName, etc.
    const { documentDataUri,contentType, description,runId } = event.data;

     // Mark job as started
    updateJobResult(runId, 'pending');

    //handling retries
    const output = await step.run("Extract Data", async () => {
      return await extractDataFromDocument({
        documentDataUri,
        description,
        contentType
      });
    });
      console.log("Extracted data from inngest in the extractDocumentDataHob function:", {output});
      // Store the successful result
      updateJobResult(runId, 'completed', output);
    return output;
  }
);




// import { inngest } from "./client";
// import { extractDataFromDocument } from "../ai/flows/extract-data-from-documents";

// export const extractDocumentDataJob = inngest.createFunction(
//   { id: "extract-document-data" },
//   { event: "document.uploaded" },
//   async ({ event, step, runId }) => {
//     const { documentDataUri, description } = event.data;
    
//     try {
//       // Step 1: Fetch the document
//       const response = await step.fetch(documentDataUri, {
//         method: "GET",
//       });
//       console.log("Response object in functions file:", response.toString());

//       // Step 2: Extract data with retry handling
//       const output = await step.run("Extract Data", async () => {
//         return await extractDataFromDocument({ documentDataUri, description });
//       });

//       console.log("Extracted data:", output.extractedData);

//       // Step 3: Send result back to your application
//       await step.run("Send Result", async () => {
//         const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
//         await fetch(`${baseUrl}/api/inngest-result`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             runId: runId,
//             status: 'Completed',
//             output: output,
//           })
//         });
//       });

//       return output;

//     } catch (error) {
//       console.error("Error in extract document data job:", error);
      
//       // Send error result back to your application
//       try {
//         const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
//         await fetch(`${baseUrl}/api/inngest-result`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             runId: runId,
//             status: 'Failed',
//             error: error instanceof Error ? error.message : 'Unknown error',
//           })
//         });
//       } catch (callbackError) {
//         console.error("Failed to send error callback:", callbackError);
//       }

//       throw error; // Re-throw to mark the function as failed
//     }
//   }
// );
