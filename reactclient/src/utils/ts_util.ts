export function getOrThrow<T>(ref: T | null | undefined, ref_name: string): T {
  if (ref === null) {
    throw new Error(`${ref_name} may not be null`);
  }
  if (ref === undefined) {
    throw new Error(`${ref_name} may not be undefined`);
  }
  return ref;
}