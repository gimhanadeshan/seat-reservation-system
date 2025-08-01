import { PrismaClient } from "@prisma/client";

// Type-safe extension for reservation methods
type ExtendedPrismaClient = ReturnType<typeof extendPrismaClient>;

const extendPrismaClient = (client: PrismaClient) => {
  return client.$extends({
    model: {
      reservation: {
        async updateExpiredStatus() {
          const now = new Date();
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);

          return await client.reservation.updateMany({
            where: {
              OR: [
                // Case 1: Date is before today (all reservations)
                {
                  date: { lt: new Date(now.setHours(0, 0, 0, 0)) },
                  status: "ACTIVE",
                },
                // Case 2: All-day reservations from yesterday
                {
                  date: {
                    gte: yesterday,
                    lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
                  },
                  startTime: null,
                  endTime: null,
                  status: "ACTIVE",
                },
              ],
            },
            data: { status: "COMPLETED" },
          });
        },
      },
    },
    query: {
      reservation: {
        async $allOperations({ operation, args, query }) {
          // Auto-update before any reservation query operation
          if (["findMany", "findFirst", "findUnique"].includes(operation)) {
            await (
              client as unknown as ExtendedPrismaClient
            ).reservation.updateExpiredStatus();
          }
          return query(args);
        },
      },
    },
  });
};

// Global instance management
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

const prismaClient = extendPrismaClient(new PrismaClient());
export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Utility functions
export async function updateExpiredReservations(): Promise<{ count: number }> {
  return prisma.reservation.updateExpiredStatus();
}

export async function getReservationsWithStatusUpdate() {
  await updateExpiredReservations();
  return prisma.reservation.findMany();
}
