/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createApiResponse, createApiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return createApiError("Unauthorized", 401);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all stats in parallel
    const [
      totalSeats,
      totalUsers,
      totalReservations,
      todayReservations,
      activeSeatsToday,
    ] = await Promise.all([
      // Total active seats
      prisma.seat.count({
        where: { isActive: true },
      }),

      // Total users
      prisma.user.count(),

      // Total reservations
      prisma.reservation.count(),

      // Today's reservations
      prisma.reservation.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
          status: "ACTIVE",
        },
      }),

      // Active seats for today (for occupancy rate)
      prisma.reservation.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
          status: "ACTIVE",
        },
      }),
    ]);

    // Calculate occupancy rate
    const occupancyRate =
      totalSeats > 0 ? Math.round((activeSeatsToday / totalSeats) * 100) : 0;

    // Get reservation trends (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyReservations = await prisma.reservation.groupBy({
      by: ["date"],
      where: {
        date: {
          gte: weekAgo,
          lt: tomorrow,
        },
        status: "ACTIVE",
      },
      _count: {
        id: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Get popular locations
    const locationStats = await prisma.reservation.groupBy({
      by: ["seatId"],
      where: {
        date: {
          gte: weekAgo,
          lt: tomorrow,
        },
        status: "ACTIVE",
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    // Get seat details for popular locations
    const popularSeats = await Promise.all(
      locationStats.map(async (stat) => {
        const seat = await prisma.seat.findUnique({
          where: { id: stat.seatId },
          select: { location: true, seatNumber: true },
        });
        return {
          location: seat?.location,
          seatNumber: seat?.seatNumber,
          reservations: stat._count.id,
        };
      })
    );

    const stats = {
      totalSeats,
      totalUsers,
      totalReservations,
      todayReservations,
      occupancyRate,
      weeklyTrend: weeklyReservations.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        reservations: r._count.id,
      })),
      popularLocations: popularSeats.filter((s) => s.location),
    };

    return createApiResponse(stats);
  } catch (error) {
    console.error("Get admin stats error:", error);
    return createApiError("Internal server error", 500);
  }
}
