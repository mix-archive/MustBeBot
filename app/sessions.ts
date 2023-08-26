import { createMemorySessionStorage } from '@remix-run/node'

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
      secrets: [process.env.SESSION_SECRET as string],
    },
  })

export { getSession, commitSession, destroySession }

export const FLAG = process.env.FLAG ?? 'flag{this_is_a_fake_flag}'
