// lib/reservationUtils.ts
import { prisma } from './prisma';

export async function updateExpiredReservations() {
  const now = new Date();
  
  // Get the start of today (midnight)
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  // Update reservations in two cases:
  // 1. Reservations with date before today (regardless of time)
  // 2. Reservations from yesterday (date = today - 1 day) that have no time specified
  return await prisma.reservation.updateMany({
    where: {
      OR: [
        // Case 1: Date is before today
        {
          date: { lt: todayStart },
          status: 'ACTIVE'
        },
        // Case 2: Date is exactly yesterday and has no time specified
        {
          date: {
            gte: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000), // Yesterday
            lt: todayStart
          },
          startTime: null,
          endTime: null,
          status: 'ACTIVE'
        }
      ]
    },
    data: { status: 'COMPLETED' }
  });
}