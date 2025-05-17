import domainExclusions from './domain-exclusions.json';

export function isContentLoading(content: string, url: string): { result: boolean; meaningfulLines: string[] } {
  // Extract domain from URL
  let domain: string | undefined;
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = undefined;
  }
  // Get loadingIndicators for the domain, fallback to _default
  let loadingIndicators: string[] = [];
  if (domain && (domainExclusions as any)[domain] && (domainExclusions as any)[domain].loadingIndicators) {
    loadingIndicators = (domainExclusions as any)[domain].loadingIndicators;
  } else if ((domainExclusions as any)._default && (domainExclusions as any)._default.loadingIndicators) {
    loadingIndicators = (domainExclusions as any)._default.loadingIndicators;
  }
  let loadingIndicatorMatch: 'substring' | 'exact' = 'substring';
  if (domain && (domainExclusions as any)[domain] && (domainExclusions as any)[domain].loadingIndicatorMatch) {
    loadingIndicatorMatch = (domainExclusions as any)[domain].loadingIndicatorMatch;
  } else if ((domainExclusions as any)._default && (domainExclusions as any)._default.loadingIndicatorMatch) {
    loadingIndicatorMatch = (domainExclusions as any)._default.loadingIndicatorMatch;
  }
  if (!content || !content.trim()) return { result: true, meaningfulLines: [] };
  const lowerContent = content.trim().toLowerCase();
  // Check for exact or prefix match
  if (loadingIndicators.some(indicator => lowerContent === indicator || lowerContent.startsWith(indicator))) {
    return { result: true, meaningfulLines: [] };
  }
  // Check for any indicator as a substring (for error/UI text)
  if (loadingIndicators.some(indicator => lowerContent.includes(indicator))) {
    return { result: true, meaningfulLines: [] };
  }
  // Remove lines that are just images, empty, or UI noise
  const lines = content.split('\n').map(line => line.trim());
  const meaningfulLines = lines.filter(line => {
    // Remove markdown images, empty lines, and lines with only symbols
    if (!line) return false;
    if (/^!\[.*\]\(.*\)$/.test(line)) return false;
    if (/^#+$/.test(line)) return false;
    if (/^\W+$/.test(line)) return false;
    // Remove lines that are just numbers or NaN
    if (/^(nan|\d+\s*\/\s*\d+|\d+)$/.test(line.toLowerCase())) return false;
    // Remove lines that are just UI text
    if (loadingIndicatorMatch === 'exact') {
      return !loadingIndicators.some(indicator => line.toLowerCase() === indicator);
    } else {
      return !loadingIndicators.some(indicator => line.toLowerCase().includes(indicator));
    }
  });
  // If no meaningful lines remain, treat as loading/placeholder
  if (meaningfulLines.length === 0) return { result: true, meaningfulLines };
  // If the only remaining lines are very short or generic, treat as loading
  if (meaningfulLines.length <= 2 && meaningfulLines.every(l => l.length < 10))
    return { result: true, meaningfulLines };
  return { result: false, meaningfulLines };
}
