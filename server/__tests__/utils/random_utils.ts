export const randomBoolean = (likelihood: number = 0.5): boolean => {
  if (likelihood >= 1) {
    return true;
  }
  if (likelihood <= 0) {
    return false;
  }
  return Math.random() < likelihood;
}

export const randomNumberInRange = (until: number, from: number = 0): number => {
  const actual_from = from > until ? until : from;
  const actual_until = from > until ? from : until;
  const range = actual_until - actual_from;
  const non_offset = Math.random() * range;
  return non_offset + actual_from
}

export const randomIntInRange = (until: number, from: number = 0): number => {
  const non_int = randomNumberInRange(until, from);
  return Math.floor(non_int);
}

export function randomElementOf<T>(array: Array<T>): T {
  const index: number = randomIntInRange(array.length);
  return array[index];
}