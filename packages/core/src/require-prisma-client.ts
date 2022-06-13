import path from 'path';

export function requirePrismaClient(cwd: string) {
  return require(path.join(cwd, 'node_modules/.prisma/client')).PrismaClient;
}
