export function getApiErrorCodes(error: unknown): string[] {
  const errors = (error as { response?: { data?: { errors?: unknown } } }).response?.data
    ?.errors;
  if (!Array.isArray(errors)) return [];
  return errors.filter((item): item is string => typeof item === 'string');
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err.response?.data?.message || err.message || fallback;
}
