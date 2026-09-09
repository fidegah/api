import { createHmac, timingSafeEqual } from 'node:crypto';

export function generateVerificationToken(
  externalId: string,
  secretKey: string,
): string {
  return createHmac('sha256', secretKey).update(externalId).digest('hex');
}

export function verifyVerificationToken(
  externalId: string,
  token: string,
  secretKey: string,
): boolean {
  const expected = generateVerificationToken(externalId, secretKey);
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);

  if (expectedBuffer.length !== tokenBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, tokenBuffer);
}
