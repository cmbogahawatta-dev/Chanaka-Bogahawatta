/**
 * Text Difference Utility for Version Comparison
 * Computes word-level and line-level differences between two document versions.
 */

export type DiffChangeType = 'added' | 'removed' | 'unchanged';

export interface DiffSegment {
  type: DiffChangeType;
  value: string;
}

/**
 * Strips HTML tags for clean diff calculation
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Simple word-level Longest Common Subsequence (LCS) diff
 */
export function computeWordDiff(oldText: string, newText: string): DiffSegment[] {
  const oldWords = (oldText || '').split(/(\s+)/);
  const newWords = (newText || '').split(/(\s+)/);

  const n = oldWords.length;
  const m = newWords.length;

  // For very long texts, limit matrix size to prevent quadratic memory blowup
  if (n * m > 1000000) {
    return computeFastLineDiff(oldText, newText);
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const segments: DiffSegment[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      segments.unshift({ type: 'unchanged', value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      segments.unshift({ type: 'added', value: newWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      segments.unshift({ type: 'removed', value: oldWords[i - 1] });
      i--;
    }
  }

  // Merge consecutive segments of the same type
  const merged: DiffSegment[] = [];
  for (const seg of segments) {
    if (merged.length > 0 && merged[merged.length - 1].type === seg.type) {
      merged[merged.length - 1].value += seg.value;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

/**
 * Fast line-level diff fallback for larger documents
 */
export function computeFastLineDiff(oldText: string, newText: string): DiffSegment[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const segments: DiffSegment[] = [];

  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === n) {
      if (o !== undefined) segments.push({ type: 'unchanged', value: o + '\n' });
    } else {
      if (o !== undefined) segments.push({ type: 'removed', value: o + '\n' });
      if (n !== undefined) segments.push({ type: 'added', value: n + '\n' });
    }
  }

  return segments;
}
