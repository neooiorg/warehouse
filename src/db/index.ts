import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Database = ReturnType<typeof drizzle<typeof schema>>;

let instance: Database | undefined;

// Lazy on purpose: Next.js evaluates every route module (including this one,
// transitively, via service.ts imports) while collecting page data during
// `next build` — before any real request happens and before runtime env vars
// are available in the build environment. Constructing the client eagerly at
// module scope would throw during the build. Deferring construction to first
// actual use means DATABASE_URL is only ever required at request time, so it
// never needs to be baked into the Docker build (which would leak it into
// image layers).
function getDb(): Database {
  if (!instance) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    instance = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return instance;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  }
});
