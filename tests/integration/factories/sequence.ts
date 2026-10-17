let counter = 0;

function next(): number {
  counter += 1;
  return counter;
}

/** Resets between tests so slugs/emails stay deterministic within a case. */
function reset(): void {
  counter = 0;
}

export const IntegrationSequence = { next, reset };
