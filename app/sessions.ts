import { createMemorySessionStorage } from '@remix-run/node'
import { randomBytes } from 'node:crypto'

type SessionData = {
  step: number
  answer: Record<string, number>
}

type SessionFlashData = {
  error: string
}

const { getSession, commitSession, destroySession } =
  createMemorySessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: '__session',
      secrets: [randomBytes(16).toString('hex')],
    },
  })

export { getSession, commitSession, destroySession }

export const FLAG = process.env.FLAG ?? 'flag{this_is_a_fake_flag}'
