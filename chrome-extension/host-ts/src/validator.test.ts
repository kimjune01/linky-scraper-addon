import { describe, it, expect } from 'vitest';
import { validateNativeMessage, ValidationError } from './validator.js';

describe('validateNativeMessage', () => {
  const validMessage = {
    action: 'sendNativeMarkdown',
    url: 'https://example.com',
    type: 'content',
    content: 'Hello world',
  };

  it('accepts valid messages', () => {
    expect(() => validateNativeMessage(validMessage)).not.toThrow();
  });

  it('accepts all valid types', () => {
    expect(() => validateNativeMessage({ ...validMessage, type: 'profile' })).not.toThrow();
    expect(() => validateNativeMessage({ ...validMessage, type: 'search' })).not.toThrow();
    expect(() => validateNativeMessage({ ...validMessage, type: 'content' })).not.toThrow();
  });

  describe('rejects invalid messages', () => {
    it('rejects non-object messages', () => {
      expect(() => validateNativeMessage(null)).toThrow(ValidationError);
      expect(() => validateNativeMessage('string')).toThrow(ValidationError);
      expect(() => validateNativeMessage(123)).toThrow(ValidationError);
    });

    it('rejects missing action', () => {
      const { action, ...rest } = validMessage;
      expect(() => validateNativeMessage(rest)).toThrow(ValidationError);
      expect(() => validateNativeMessage(rest)).toThrow(/Missing required fields.*action/);
    });

    it('rejects missing url', () => {
      const { url, ...rest } = validMessage;
      expect(() => validateNativeMessage(rest)).toThrow(/Missing required fields.*url/);
    });

    it('rejects missing type', () => {
      const { type, ...rest } = validMessage;
      expect(() => validateNativeMessage(rest)).toThrow(/Missing required fields.*type/);
    });

    it('rejects missing content', () => {
      const { content, ...rest } = validMessage;
      expect(() => validateNativeMessage(rest)).toThrow(/Missing required fields.*content/);
    });

    it('rejects invalid action', () => {
      expect(() => validateNativeMessage({ ...validMessage, action: 'wrongAction' })).toThrow(/Invalid action/);
    });

    it('rejects invalid type', () => {
      expect(() => validateNativeMessage({ ...validMessage, type: 'invalid' })).toThrow(/Invalid type/);
    });

    it('rejects non-string url', () => {
      expect(() => validateNativeMessage({ ...validMessage, url: 123 })).toThrow(/url must be a string/);
    });

    it('rejects non-string content', () => {
      expect(() => validateNativeMessage({ ...validMessage, content: { text: 'hi' } })).toThrow(
        /content must be a string/,
      );
    });
  });
});
