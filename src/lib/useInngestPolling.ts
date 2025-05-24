"use client";

import { useEffect, useState } from "react";
import { ExtractDataFromDocumentOutput } from "../ai/flows/extract-data-from-documents";
import { ProcessingStepStatus } from "../components/docuflow/types";

export function useInngestPolling(runId: string | null) {
  const [status, setStatus] = useState<ProcessingStepStatus | null>(null);
  const [result, setResult] = useState<ExtractDataFromDocumentOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) {
      setStatus(null);
      setResult(null);
      setError(null);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/inngest-result?runId=${runId}`);
        const data = await res.json();

        console.log("Polling result:", data);

        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        if (data.error) {
          setStatus("failed"); // Explicitly set to failed if there's an error
          setError(data.error);
          setResult(null); // Clear result if there's an error
          clearInterval(interval); // Stop polling on error
        } else {
          setStatus(data.status);
          setResult(data.result as ExtractDataFromDocumentOutput);
          setError(null); // Clear error if no error
          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred during polling.");
        }
        clearInterval(interval);
      }
    };

    // Start polling immediately and then every 2 seconds
    poll(); // Initial call
    const interval: NodeJS.Timeout = setInterval(poll, 2000);

    // Cleanup function: clear interval when component unmounts or runId changes
    return () => {
      clearInterval(interval);
    };
  }, [runId]);

  return { status, result, error };
}
