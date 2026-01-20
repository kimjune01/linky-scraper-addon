#!/usr/bin/env node
/**
 * Native messaging host for Hoarder Chrome extension
 *
 * This host receives messages from the extension via Chrome's native messaging API
 * and saves content to ChromaDB for later retrieval.
 */

import { readMessage, sendMessage } from './stdio.js';
import { validateNativeMessage, ValidationError } from './validator.js';
import { saveToChromaDb } from './chromadb.js';
import type { NativeMessage, MessageResponse, SaveResponse } from './types.js';

/**
 * Processes a single incoming message
 */
async function processMessage(data: unknown): Promise<SaveResponse> {
  try {
    validateNativeMessage(data);
    const message = data as NativeMessage;
    return await saveToChromaDb(message.url, message.content);
  } catch (error) {
    if (error instanceof ValidationError) {
      return { saved: false, error: `Validation error: ${error.message}` };
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { saved: false, error: errorMessage };
  }
}

/**
 * Main loop - reads messages from stdin and sends responses to stdout
 */
async function main(): Promise<void> {
  // Keep reading messages until stdin closes
  while (true) {
    try {
      const message = await readMessage<unknown>();

      // EOF - extension disconnected
      if (message === null) {
        break;
      }

      // Process and respond
      const response = await processMessage(message);
      sendMessage(response);
    } catch (error) {
      // Log errors to stderr (visible in Chrome's native messaging logs)
      console.error('Error processing message:', error);

      // Try to send an error response
      try {
        sendMessage({ saved: false, error: 'Internal error processing message' });
      } catch {
        // If we can't send a response, the connection is probably broken
        break;
      }
    }
  }
}

// Run the main loop
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
