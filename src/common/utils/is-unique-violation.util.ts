export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const err = error as Record<string, unknown>;
  const cause = err.cause as Record<string, unknown> | undefined;

  return err.code === '23505' || cause?.code === '23505';
}
