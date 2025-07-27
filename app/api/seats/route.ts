/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createSeatSchema, seatQuerySchema } from "@/lib/validation";
import { createApiResponse, createApiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Convert null to undefined for validation
    const query = {
      date: searchParams.get("date") || undefined,
      location: searchParams.get("location") || undefined,
      hasMonitor: searchParams.get("hasMonitor") || undefined,
      available: searchParams.get("available") || undefined,
    };

    // Validate query parameters
    const validatedQuery = seatQuerySchema.parse(query);

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (validatedQuery.location) {
      where.location = validatedQuery.location;
    }

    if (validatedQuery.hasMonitor !== undefined) {
      where.hasMonitor = validatedQuery.hasMonitor;
    }

    // Get seats with reservation info for the specified date
    const seats = await prisma.seat.findMany({
      where,
      include: {
        reservations: {
          where: validatedQuery.date
            ? {
                date: new Date(validatedQuery.date),
                status: "ACTIVE",
              }
            : undefined,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        seatNumber: "asc",
      },
    });

    // Transform data to include availability status
    const seatsWithAvailability = seats.map((seat) => {
      const currentReservation = seat.reservations?.[0];
      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        location: seat.location,
        hasMonitor: seat.hasMonitor,
        description: seat.description,
        isAvailable: !currentReservation,
        reservedBy: currentReservation?.user,
        reservedDate: currentReservation?.date,
      };
    });

    // Filter by availability if requested
    const filteredSeats =
      validatedQuery.available !== undefined
        ? seatsWithAvailability.filter(
            (seat) => seat.isAvailable === validatedQuery.available
          )
        : seatsWithAvailability;

    return createApiResponse(filteredSeats);
  } catch (error: any) {
    console.error("Get seats error:", error);

    if (error.name === "ZodError") {
      return createApiError("Invalid query parameters", 400, error.errors);
    }

    return createApiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return createApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validatedData = createSeatSchema.parse(body);

    // Check if seat number already exists
    const existingSeat = await prisma.seat.findUnique({
      where: { seatNumber: validatedData.seatNumber },
    });

    if (existingSeat) {
      return createApiError("Seat with this number already exists", 400);
    }

    const seat = await prisma.seat.create({
      data: validatedData,
    });

    return createApiResponse(seat, "Seat created successfully", 201);
  } catch (error: any) {
    console.error("Create seat error:", error);

    if (error.name === "ZodError") {
      return createApiError("Invalid input data", 400, error.errors);
    }

    return createApiError("Internal server error", 500);
  }
}
