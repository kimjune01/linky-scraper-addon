import { HtmlProcessor } from './HtmlProcessor';

describe('HtmlProcessor', () => {
  describe('removeSequentialRepeatedWords', () => {
    it('removes sequentially repeated words', () => {
      expect(HtmlProcessor.removeSequentialRepeatedWords('hello hello world')).toBe('hello world');
      expect(HtmlProcessor.removeSequentialRepeatedWords('foo foo foo bar')).toBe('foo bar');
      expect(HtmlProcessor.removeSequentialRepeatedWords('a a a a')).toBe('a');
      expect(HtmlProcessor.removeSequentialRepeatedWords('one two two three')).toBe('one two three');
      expect(HtmlProcessor.removeSequentialRepeatedWords('word  word')).toBe('word ');
    });
    it('handles spaces and punctuation', () => {
      expect(HtmlProcessor.removeSequentialRepeatedWords('hi, hi, there')).toBe('hi, there');
      expect(HtmlProcessor.removeSequentialRepeatedWords('test   test test')).toBe('test test');
    });
  });

  describe('removeSequentialRepeatedPairs', () => {
    it('removes sequentially repeated pairs', () => {
      expect(HtmlProcessor.removeSequentialRepeatedPairs('David Choe David Choe')).toBe('David Choe');
      expect(HtmlProcessor.removeSequentialRepeatedPairs('foo bar foo bar baz')).toBe('foo bar baz');
      expect(HtmlProcessor.removeSequentialRepeatedPairs('a b a b a b')).toBe('a b');
      expect(HtmlProcessor.removeSequentialRepeatedPairs('one two one two three')).toBe('one two three');
    });
    it('handles spaces and punctuation', () => {
      expect(HtmlProcessor.removeSequentialRepeatedPairs('hi, there hi, there')).toBe('hi, there');
      expect(HtmlProcessor.removeSequentialRepeatedPairs('test test test test')).toBe('test test');
    });
    it('does not remove non-repeated pairs', () => {
      expect(HtmlProcessor.removeSequentialRepeatedPairs('foo bar baz foo bar')).toBe('foo bar baz foo bar');
    });
  });
});
