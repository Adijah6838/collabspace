import { PrismaClient } from '@prisma/client';

// Instantiate Prisma Client
export const prisma = new PrismaClient();

// Optional: Log queries in development mode for easier debugging
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query' as never, (e: any) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
  });
}