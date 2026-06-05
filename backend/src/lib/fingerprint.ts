import { createHash } from 'crypto'

export function makeFingerprint(telegramUserId: string, sessionId: string): string {
  return createHash('sha256')
    .update(`${telegramUserId}:${sessionId}:${process.env.JWT_SECRET ?? 'salt'}`)
    .digest('hex')
}
