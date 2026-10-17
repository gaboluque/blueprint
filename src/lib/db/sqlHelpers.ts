/** `%term%` for ILIKE with user input; escapes the LIKE wildcards. */
function containsPattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export const SqlHelpers = { containsPattern };
