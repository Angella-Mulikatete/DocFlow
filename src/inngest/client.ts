import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "Doc-flow",
  //eventKey: process.env.INNGEST_API_KEY, // Use INNGEST_API_KEY from .env.local
});
