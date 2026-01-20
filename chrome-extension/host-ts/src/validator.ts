/**
 * Message validation for native messaging protocol
 */

import type { NativeMessage, NativeMessageType } from './types.js';

const VALID_TYPES: Set<string> = new Set(['profile', 'search', 'content']);

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates an incoming native message
 * @throws ValidationError if message is invalid
 */
export function validateNativeMessage(data: unknown): asserts data is NativeMessage {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Message must be an object');
  }

  const message = data as Record<string, unknown>;

  // Check required fields
  const requiredFields = ['action', 'url', 'type', 'content'];
  const missingFields = requiredFields.filter(field => !(field in message));

  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Check action is exactly 'sendNativeMarkdown'
  if (message.action !== 'sendNativeMarkdown') {
    throw new ValidationError(`Invalid action: expected 'sendNativeMarkdown', got '${message.action}'`);
  }

  // Check url and content are strings
  if (typeof message.url !== 'string') {
    throw new ValidationError('url must be a string');
  }

  if (typeof message.content !== 'string') {
    throw new ValidationError('content must be a string');
  }

  // Check type is one of the allowed values
  if (!VALID_TYPES.has(message.type as string)) {
    throw new ValidationError(`Invalid type: expected one of ${[...VALID_TYPES].join(', ')}, got '${message.type}'`);
  }
}
