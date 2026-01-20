/**
 * Chrome Native Messaging stdio protocol implementation
 *
 * Protocol:
 * - Messages are prefixed with a 4-byte little-endian unsigned integer length
 * - Message body is UTF-8 encoded JSON
 */

import { Buffer } from 'node:buffer';

/**
 * Reads a single message from stdin using the native messaging protocol
 * @returns Promise resolving to parsed JSON message, or null on EOF
 */
export async function readMessage<T>(): Promise<T | null> {
  // Read the 4-byte length prefix
  const lengthBuffer = await readBytes(4);
  if (lengthBuffer === null) {
    return null; // EOF
  }

  // Parse length as little-endian unsigned 32-bit integer
  const messageLength = lengthBuffer.readUInt32LE(0);

  // Read the message body
  const messageBuffer = await readBytes(messageLength);
  if (messageBuffer === null) {
    throw new Error('Unexpected EOF while reading message body');
  }

  // Parse JSON
  const messageText = messageBuffer.toString('utf-8');
  return JSON.parse(messageText) as T;
}

/**
 * Writes a message to stdout using the native messaging protocol
 * @param message The message object to send
 */
export function sendMessage<T>(message: T): void {
  // Encode message as JSON
  const messageText = JSON.stringify(message);
  const messageBuffer = Buffer.from(messageText, 'utf-8');

  // Create length prefix (4-byte little-endian)
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(messageBuffer.length, 0);

  // Write length prefix + message
  process.stdout.write(lengthBuffer);
  process.stdout.write(messageBuffer);
}

/**
 * Helper to read exact number of bytes from stdin
 */
function readBytes(count: number): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;

    // Check if we already have enough data buffered
    const buffered = stdin.read(count) as Buffer | null;
    if (buffered !== null) {
      resolve(buffered);
      return;
    }

    // Need to wait for more data
    const chunks: Buffer[] = [];
    let bytesRead = 0;

    const onReadable = () => {
      let chunk: Buffer | null;
      while (bytesRead < count && (chunk = stdin.read(count - bytesRead) as Buffer | null) !== null) {
        chunks.push(chunk);
        bytesRead += chunk.length;
      }

      if (bytesRead >= count) {
        cleanup();
        resolve(Buffer.concat(chunks));
      }
    };

    const onEnd = () => {
      cleanup();
      if (bytesRead === 0) {
        resolve(null); // Clean EOF
      } else {
        reject(new Error(`Unexpected EOF: expected ${count} bytes, got ${bytesRead}`));
      }
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      stdin.removeListener('readable', onReadable);
      stdin.removeListener('end', onEnd);
      stdin.removeListener('error', onError);
    };

    stdin.on('readable', onReadable);
    stdin.on('end', onEnd);
    stdin.on('error', onError);

    // Try reading immediately in case data is available
    onReadable();
  });
}
