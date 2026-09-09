import { FIBONACCI_ALLOWED_VALUES } from '../constants/fibonacci.constant';

export function validateFactorValue(
  type: string,
  value: number,
): string | null {
  switch (type) {
    case '0-10':
      if (value < 0 || value > 10) return 'Value must be between 0 and 10.';
      break;
    case '0-100':
      if (value < 0 || value > 100) return 'Value must be between 0 and 100.';
      break;
    case 'stars':
      if (value < 1 || value > 5 || !Number.isInteger(value)) {
        return 'Value must be an integer between 1 and 5.';
      }
      break;
    case 'fibonacci':
      if (!FIBONACCI_ALLOWED_VALUES.includes(value)) {
        return 'Value must be a valid Fibonacci number.';
      }
      break;
    case 'boolean':
      if (value !== 0 && value !== 1) return 'Value must be a boolean or 0/1.';
      break;
    default:
      return 'Invalid factor type.';
  }
  return null;
}
