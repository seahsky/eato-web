import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function createContext() {
  const { userId } = await auth();

  // Get database user by clerkId
  let dbUser = null;
  if (userId) {
    dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
  }

  return {
    userId, // Clerk user ID
    dbUser, // Database user record
    prisma,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
