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
  documentDataUri: z
    .string()
    .describe(
      "The document to extract data from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe('Optional description of the document.'),
});
export type ExtractDataFromDocumentInput = z.infer<typeof ExtractDataFromDocumentInputSchema>;

const ExtractedDataSchema = z.record(z.string(), z.any()).describe('Extracted data fields from the document');

const ExtractDataFromDocumentOutputSchema = z.object({
  extractedData: ExtractedDataSchema,
});
export type ExtractDataFromDocumentOutput = z.infer<typeof ExtractDataFromDocumentOutputSchema>;

async function extractDataFromDocument(input: ExtractDataFromDocumentInput): Promise<ExtractDataFromDocumentOutput> {
  return extractDataFromDocumentFlow(input);
}

// const extractSpecificData = ai.defineTool({

const extractSpecificData = ai.defineTool({
  name: 'extractSpecificData',
  description: 'Extracts specific data fields from a document.',
  inputSchema: z.object({
    documentDataUri: z
      .string()
      .describe(
        "The document to extract data from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
    fields: z.array(z.string()).describe('The data fields to extract from the document.'),
  }),
  outputSchema: ExtractedDataSchema,
}, async (input) => {
   console.log('>>> extractSpecificData tool received input.documentDataUri:', input.documentDataUri);
  console.log(`extractSpecificData called with fields: ${input.fields.join(', ')}`);

  // --- Start modification: Extract contentType --- 
  let contentType = '';
  // Regex to capture the MIME type from the data URI
  const match = input.documentDataUri.match(/^data:([a-zA-Z0-9\/\.\-+]+);base64,/);
  if (match && match[1]) {
    contentType = match[1];
    console.log(`Extracted contentType: ${contentType}`);
  } else {
    // Handle error if MIME type cannot be extracted
    console.error('Could not extract MIME type from documentDataUri. Ensure it follows "data:<mimetype>;base64,<data>" format.');
    // Throw an error to stop processing if the format is invalid
    throw new Error('Invalid documentDataUri format: Missing or invalid MIME type.');
  }
  // --- End modification --- 

  const promptContent = `You are an expert data extractor. From the provided document, extract the following specific fields: ${input.fields.join(', ')}.\n  Return the extracted data as a JSON object where keys are the field names and values are the extracted data. If a field is not found, set its value to null.\n  Do not include any other text or formatting, only the JSON object.`;

  const response = await ai.generate({
    model: 'googleai/gemini-1.5-flash', // Corrected model name based on common usage, verify if needed
    prompt: [
      { text: promptContent },
      // --- Pass both url and contentType --- 
      { media: { url: input.documentDataUri, contentType: contentType } }
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

  Document: {{media url=documentDataUri}}
  Description: {{{description}}}

  Based on the document, use the extractSpecificData tool to extract all relevant information.
  Return the extracted data in the output. You should decide which fields need to be extracted.
  Do not include any introductory or concluding remarks. Only provide the extracted data. Always invoke extractSpecificData even if the description is empty.
`,
});

const extractDataFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractDataFromDocumentFlow',
    inputSchema: ExtractDataFromDocumentInputSchema,
    outputSchema: ExtractDataFromDocumentOutputSchema,
  },
 async input => {
    // <<< Add this log >>>
    console.log('>>> extractDataFromDocumentFlow received input.documentDataUri:', input.documentDataUri);
    const {output} = await extractDataFromDocumentPrompt(input);
    return output!;
  }
);

export {extractDataFromDocument};
