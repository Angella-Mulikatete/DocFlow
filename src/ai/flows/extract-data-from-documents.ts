'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting data from documents using AI.
 *
 * The flow takes a document (as a data URI) and an optional description as input, and outputs the extracted data.
 * It uses a tool to extract specific data fields from the document, as requested by the LLM.
 *
 * @interface ExtractDataFromDocumentInput - The input type for the extractDataFromDocument function.
 * @interface ExtractDataFromDocumentOutput - The output type for the extractDataFromDocument function.
 * @function extractDataFromDocument - The main function to trigger the data extraction flow.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

const ExtractDataFromDocumentInputSchema = z.object({
  documentDataUri: z.string().describe("The document to extract data from, as a data URI or a public file URL."),
  contentType: z.string().optional().describe('The MIME type of the document (required for file URLs, optional for data URIs).'),
  description: z.string().optional().describe('Optional description of the document.'),
});


export type ExtractDataFromDocumentInput = z.infer<typeof ExtractDataFromDocumentInputSchema>;

// Define a new schema for the prompt's input
// const ExtractDataFromDocumentPromptInputSchema = ExtractDataFromDocumentInputSchema.extend({
//   contentType: z.string().describe('The MIME type of the document.'),
// });

const ExtractedDataSchema = z.record(z.string(), z.any()).describe('Extracted data fields from the document');

const ExtractDataFromDocumentOutputSchema = z.object({
  extractedData: ExtractedDataSchema,
});

export type ExtractDataFromDocumentOutput = z.infer<typeof ExtractDataFromDocumentOutputSchema>;

async function extractDataFromDocument(input: ExtractDataFromDocumentInput): Promise<ExtractDataFromDocumentOutput> {
  return extractDataFromDocumentFlow(input);
}

// const extractSpecificData = ai.defineTool({

const extractSpecificData = ai.defineTool(
  {
    name: 'extractSpecificData',
    description: 'Extracts specific data fields from a document.',
    inputSchema: z.object({
      documentDataUri: z.string().describe("The document to extract data from, as a data URI or a public file URL."),
      contentType: z.string().describe('The MIME type of the document.'),
      fields: z.array(z.string()).describe('The data fields to extract from the document.'),
    }),
    outputSchema: ExtractedDataSchema,
  },async (input) => {
   console.log('>>> extractSpecificData tool received input.documentDataUri:', input.documentDataUri);
   console.log(`extractSpecificData called with fields: ${input.fields.join(', ')}`);

  const promptContent = `You are an expert data extractor. From the provided document, extract the following specific fields: ${input.fields.join(', ')}.\n  Return the extracted data as a JSON object where keys are the field names and values are the extracted data. If a field is not found, set its value to null.\n  Do not include any other text or formatting, only the JSON object.`;
  const response = await ai.generate({
    model: 'googleai/gemini-1.5-flash', // Corrected model name based on common usage, verify if needed
    prompt: [
      { text: promptContent },
      // --- Pass both url and contentType --- 
      { media: { url: input.documentDataUri, contentType: input.contentType } }
    ],
    output: { format: 'json' },
  });

  try {
    // Add a check for empty response text
    if (!response.text) {
        console.error("AI response text is empty.");
        return {}; // Return empty object or handle as appropriate
    }
    const extractedData = JSON.parse(response.text);
    return extractedData;
  } catch (e) {
    // Log the actual text that failed to parse
    console.error("Failed to parse AI response as JSON:", response.text, e);
    return {}; // Return empty object or handle error appropriately
  }
});

const extractDataFromDocumentPrompt = ai.definePrompt({
  name: 'extractDataFromDocumentPrompt',
  input: {schema: ExtractDataFromDocumentInputSchema}, 
  output: {schema: ExtractDataFromDocumentOutputSchema},
  tools: [extractSpecificData],
  prompt: `You are an AI document processor. Your task is to extract relevant data from the provided document.

  Document: {{media url=documentDataUri contentType=contentType}} // Use contentType here
  Description: {{{description}}}

  Based on the document, use the extractSpecificData tool to extract all relevant information.
  Return the extracted data in the output. You should decide which fields need to be extracted.
  Do not include any introductory or concluding remarks. Only provide the extracted data. Always invoke extractSpecificData even if the description is empty.
`,
});

const extractDataFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractDataFromDocumentFlow',
    inputSchema: ExtractDataFromDocumentInputSchema, // Original input schema for the flow
    outputSchema: ExtractDataFromDocumentOutputSchema,
  },
 async input => {
   // console.log('>>> extractDataFromDocumentFlow received input.documentDataUri:', input.documentDataUri);
    //console.log('>>> Flow Start - Input:', JSON.stringify(input, null, 2));

    let effectiveContentType = '';
        // Check if it's a data URI
    const dataUriMatch = input.documentDataUri.match(/^data:([a-zA-Z0-9\/\.\-+]+);base64,/);
    console.log('>>> Data URI match:', dataUriMatch);

    if (dataUriMatch && dataUriMatch[1]) {
      // It's a data URI, extract contentType from it
      effectiveContentType = dataUriMatch[1];
      console.log(`Extracted contentType from data URI: ${effectiveContentType}`);
    } else if (input.documentDataUri.startsWith('http' )) {
      // It looks like a URL, use the contentType passed in the input
      if (input.contentType) {
        effectiveContentType = input.contentType;
        console.log(`Using provided contentType for URL: ${effectiveContentType}`);
      } else {
        // If it's a URL but no contentType was provided, we cannot proceed
        console.error('Error: contentType is required when documentDataUri is a URL.');
        throw new Error('contentType is required when documentDataUri is a URL.');
      }
    } else {
      // It's neither a valid data URI nor a URL we recognize
      console.error('Error: Invalid documentDataUri format. Must be a data URI or a public URL.');
      throw new Error('Invalid documentDataUri format.');
    }

    // Now call the prompt, ensuring the effectiveContentType is passed
    // The prompt itself expects 'contentType' in its input based on your schema
    
    //console.log('>>> Calling Prompt with input:', JSON.stringify({ ...input, contentType: effectiveContentType }, null, 2));
    const { output } = await extractDataFromDocumentPrompt({ ...input, contentType: effectiveContentType });
    console.log('>>> Prompt finished');
    return output!;

  }
);

export {extractDataFromDocument};





// 'use server';

// /**
//  * @fileOverview This file defines a Genkit flow for extracting data from documents using AI.
//  *
//  * The flow takes a document (as a data URI or file URI) and an optional description as input, and outputs the extracted data.
//  * It uses a tool to extract specific data fields from the document, as requested by the LLM.
//  *
//  * @interface ExtractDataFromDocumentInput - The input type for the extractDataFromDocument function.
//  * @interface ExtractDataFromDocumentOutput - The output type for the extractDataFromDocument function.
//  * @function extractDataFromDocument - The main function to trigger the data extraction flow.
//  */

// import {ai} from '../genkit';
// import {z} from 'genkit';

// const ExtractDataFromDocumentInputSchema = z.object({
//   documentDataUri: z
//     .string()
//     .describe(
//       "The document to extract data from, either as a data URI (data:<mimetype>;base64,<encoded_data>) or as a file URI/ID."
//     ),
//   contentType: z
//     .string()
//     .optional()
//     .describe('The MIME type of the document (required for file URIs, optional for data URIs).'),
//   description: z.string().optional().describe('Optional description of the document.'),
// });
// export type ExtractDataFromDocumentInput = z.infer<typeof ExtractDataFromDocumentInputSchema>;

// const ExtractedDataSchema = z.record(z.string(), z.any()).describe('Extracted data fields from the document');

// const ExtractDataFromDocumentOutputSchema = z.object({
//   extractedData: ExtractedDataSchema,
// });
// export type ExtractDataFromDocumentOutput = z.infer<typeof ExtractDataFromDocumentOutputSchema>;

// async function extractDataFromDocument(input: ExtractDataFromDocumentInput): Promise<ExtractDataFromDocumentOutput> {
//   return extractDataFromDocumentFlow(input);
// }

// const extractSpecificData = ai.defineTool({
//   name: 'extractSpecificData',
//   description: 'Extracts specific data fields from a document.',
//   inputSchema: z.object({
//     documentDataUri: z
//       .string()
//       .describe(
//         "The document to extract data from, either as a data URI or as a file URI/ID."
//       ),
//     contentType: z
//       .string()
//       .optional()
//       .describe('The MIME type of the document.'),
//     fields: z.array(z.string()).describe('The data fields to extract from the document.'),
//   }),
//   outputSchema: ExtractedDataSchema,
// }, async (input) => {
//    console.log('>>> extractSpecificData tool received input.documentDataUri:', input.documentDataUri);
//   console.log(`extractSpecificData called with fields: ${input.fields.join(', ')}`);

//   // Determine if this is a data URI or file URI
//   const isDataUri = input.documentDataUri.startsWith('data:');
//   let contentType = input.contentType || '';
//   const mediaUrl = input.documentDataUri;

//   if (isDataUri) {
//     // Extract contentType from data URI
//     const match = input.documentDataUri.match(/^data:([a-zA-Z0-9\/\.\-+]+);base64,/);
//     if (match && match[1]) {
//       contentType = match[1];
//       console.log(`Extracted contentType from data URI: ${contentType}`);
//     } else {
//       console.error('Could not extract MIME type from data URI.');
//       throw new Error('Invalid data URI format: Missing or invalid MIME type.');
//     }
//   } else {
//     // This is a file URI - contentType must be provided
//     if (!contentType) {
//       console.error('contentType is required when using file URIs');
//       throw new Error('contentType is required when using file URIs with Gemini');
//     }
//     console.log(`Using provided contentType for file URI: ${contentType}`);
//   }

//   const promptContent = `You are an expert data extractor. From the provided document, extract the following specific fields: ${input.fields.join(', ')}.\n  Return the extracted data as a JSON object where keys are the field names and values are the extracted data. If a field is not found, set its value to null.\n  Do not include any other text or formatting, only the JSON object.`;

//   const response = await ai.generate({
//     model: 'googleai/gemini-1.5-flash',
//     prompt: [
//       { text: promptContent },
//       { media: { url: mediaUrl, contentType: contentType } }
//     ],
//     output: { format: 'json' },
//   });

//   try {
//     if (!response.text) {
//         console.error("AI response text is empty.");
//         return {};
//     }
//     const extractedData = JSON.parse(response.text);
//     return extractedData;
//   } catch (e) {
//     console.error("Failed to parse AI response as JSON:", response.text, e);
//     return {};
//   }
// });

// const extractDataFromDocumentPrompt = ai.definePrompt({
//   name: 'extractDataFromDocumentPrompt',
//   input: {schema: ExtractDataFromDocumentInputSchema},
//   output: {schema: ExtractDataFromDocumentOutputSchema},
//   tools: [extractSpecificData],
//   prompt: `You are an AI document processor. Your task is to extract relevant data from the provided document.

//   {{#if contentType}}
//   Document: {{media url=documentDataUri contentType=contentType}}
//   {{else}}
//   Document: {{media url=documentDataUri}}
//   {{/if}}
//   Description: {{{description}}}

//   Based on the document, use the extractSpecificData tool to extract all relevant information.
//   Make sure to pass both the documentDataUri and contentType (if available) to the tool.
//   Return the extracted data in the output. You should decide which fields need to be extracted.
//   Do not include any introductory or concluding remarks. Only provide the extracted data. Always invoke extractSpecificData even if the description is empty.
// `,
// });

// const extractDataFromDocumentFlow = ai.defineFlow(
//   {
//     name: 'extractDataFromDocumentFlow',
//     inputSchema: ExtractDataFromDocumentInputSchema,
//     outputSchema: ExtractDataFromDocumentOutputSchema,
//   },
//  async input => {
//     console.log('>>> extractDataFromDocumentFlow received input.documentDataUri:', input.documentDataUri);
//     console.log('>>> extractDataFromDocumentFlow received input.contentType:', input.contentType);
//     const {output} = await extractDataFromDocumentPrompt(input);
//     return output!;
//   }
// );

// export {extractDataFromDocument};