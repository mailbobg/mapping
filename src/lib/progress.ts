/**
 * Calculate the average progress percentage from an array of progress values
 * This gives the overall completion status based on actual TF progress
 */
export function calcAverageProgress(progressValues: number[]) {
  if (progressValues.length === 0) return 0;
  const sum = progressValues.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / progressValues.length);
}

/**
 * Count how many items are 100% complete
 */
export function countCompleted(progressValues: number[]) {
  return progressValues.filter((value) => value >= 100).length;
}

/**
 * @deprecated Use calcAverageProgress instead
 * Calculate completion percent based on done/total ratio
 */
export function calcCompletionPercent(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}
