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
  // In a real application, this would contain the actual implementation for extracting data from the document.
  // This is a placeholder implementation that returns an empty object.
  console.log(`extractSpecificData called with fields: ${input.fields.join(', ')}`);
  return {};
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
    const {output} = await extractDataFromDocumentPrompt(input);
    return output!;
  }
);

export {extractDataFromDocument};
