import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaAdminGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaAdminGlobal ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaAdminGlobal = prisma;
}

export default prisma;
