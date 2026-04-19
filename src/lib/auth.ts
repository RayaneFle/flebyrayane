import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session { user: { id: string; name?: string | null; email?: string | null; image?: string | null; role: string } }
  interface User { role: string }
}
declare module "next-auth/jwt" { interface JWT { id: string; role: string } }

// Rate limiting for login attempts (in-memory)
// Note: on Vercel serverless, each instance has its own memory.
// This blocks basic bots and most brute-force attempts.
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_EMAIL = 5;

function isRateLimited(email: string): boolean {
  const key = email.toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(key);

  // Clean up old entries periodically (opportunistic)
  if (loginAttempts.size > 500) {
    for (const [k, v] of loginAttempts.entries()) {
      if (now - v.firstAttempt > RATE_LIMIT_WINDOW_MS) loginAttempts.delete(k);
    }
  }

  if (!record) return false;
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return record.count >= MAX_ATTEMPTS_PER_EMAIL;
}

function recordFailedAttempt(email: string) {
  const key = email.toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    record.count++;
  }
}

function clearRateLimit(email: string) {
  loginAttempts.delete(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Identifiants",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Mot de passe", type: "password" } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit: silently reject if blocked (no info leaked to attacker)
        if (isRateLimited(credentials.email)) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.hashedPassword) {
          recordFailedAttempt(credentials.email);
          return null;
        }
        const valid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!valid) {
          recordFailedAttempt(credentials.email);
          return null;
        }

        // Successful login: reset the counter for this email
        clearRateLimit(credentials.email);

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) { token.id = user.id; token.role = user.role; } return token; },
    async session({ session, token }) { if (session.user) { session.user.id = token.id; session.user.role = token.role; } return session; },
  },
};
