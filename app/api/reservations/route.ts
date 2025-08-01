/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  createReservationSchema,
  reservationQuerySchema,
} from "@/lib/validation";
import { createApiResponse, createApiError } from "@/lib/utils";
import z from "zod";
import { updateExpiredReservations } from "@/lib/reservationUtils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return createApiError("Unauthorized", 401);

     // Update expired reservations before querying
    await updateExpiredReservations();

    const { searchParams } = new URL(request.url);

    // Clean query parameters - convert empty strings to undefined
    const cleanQuery = {
      userId: searchParams.get("userId") || undefined,
      seatId: searchParams.get("seatId") || undefined,
      status: searchParams.get("status") || undefined,
      date: searchParams.get("date") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    };

    // Only validate if at least one parameter has a value
    const validatedQuery: Partial<z.infer<typeof reservationQuerySchema>> =
      Object.values(cleanQuery).some((v) => v !== undefined)
        ? reservationQuerySchema.parse(cleanQuery)
        : {};

    // Build where clause
    const where: any = {};

    // Security: Non-admins only see their own reservations
    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id;
    } else if (validatedQuery.userId) {
      where.userId = validatedQuery.userId;
    }

    // Add other filters only if they exist in validatedQuery
    if (validatedQuery.seatId) where.seatId = validatedQuery.seatId;
    if (validatedQuery.status) where.status = validatedQuery.status;

    // Date handling
    if (validatedQuery.date) {
      where.date = new Date(validatedQuery.date);
    } else if (validatedQuery.startDate || validatedQuery.endDate) {
      where.date = {};
      if (validatedQuery.startDate)
        where.date.gte = new Date(validatedQuery.startDate);
      if (validatedQuery.endDate)
        where.date.lte = new Date(validatedQuery.endDate);
    }

    const reservations = await prisma.reservation.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        seat: {
          select: {
            id: true,
            seatNumber: true,
            location: true,
            hasMonitor: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return createApiResponse(reservations);
  } catch (error: any) {
    console.error("Get reservations error:", error);

    if (error instanceof z.ZodError) {
      return createApiError(
        "Invalid query parameters",
        400,
        error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }))
      );
    }

    return createApiError("Internal server error", 500);
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return createApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validatedData = createReservationSchema.parse(body);

    // Check if seat exists and is active
    const seat = await prisma.seat.findUnique({
      where: { id: validatedData.seatId },
    });

    if (!seat || !seat.isActive) {
      return createApiError("Seat not found or inactive", 404);
    }

    // Check if seat is already reserved for the date
    const existingReservation = await prisma.reservation.findUnique({
      where: {
        seatId_date: {
          seatId: validatedData.seatId,
          date: new Date(validatedData.date),
        },
      },
    });

    if (existingReservation && existingReservation.status === "ACTIVE") {
      return createApiError("Seat is already reserved for this date", 400);
    }

    // Check if user already has a reservation for this date
    const userReservation = await prisma.reservation.findFirst({
      where: {
        userId: session.user.id,
        date: new Date(validatedData.date),
        status: "ACTIVE",
      },
    });

    if (userReservation) {
      return createApiError(
        "You already have a reservation for this date",
        400
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: session.user.id,
        seatId: validatedData.seatId,
        date: new Date(validatedData.date),
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        notes: validatedData.notes,
      },
      include: {
        seat: {
          select: {
            seatNumber: true,
            location: true,
            hasMonitor: true,
          },
        },
      },
    });

    return createApiResponse(
      reservation,
      "Reservation created successfully",
      201
    );
  } catch (error: any) {
    console.error("Create reservation error:", error);

    if (error.name === "ZodError") {
      return createApiError("Invalid input data", 400, error.errors);
    }

    return createApiError("Internal server error", 500);
  }
}
