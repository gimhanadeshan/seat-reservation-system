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

    const seats = await prisma.seat.findMany({
      where: { isActive: true },
      include: {
        reservations: {
          where: {
            date: today,
            status: "ACTIVE",
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            reservations: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
      orderBy: {
        seatNumber: "asc",
      },
    });

    // Transform data for admin view
    const seatsWithStatus = seats.map((seat) => ({
      id: seat.id,
      seatNumber: seat.seatNumber,
      location: seat.location,
      hasMonitor: seat.hasMonitor,
      description: seat.description,
      isActive: seat.isActive,
      currentReservation: seat.reservations[0] || null,
      totalReservations: seat._count.reservations,
      createdAt: seat.createdAt,
      updatedAt: seat.updatedAt,
    }));

    return createApiResponse(seatsWithStatus);
  } catch (error) {
    console.error("Get admin seats error:", error);
    return createApiError("Internal server error", 500);
  }
}
