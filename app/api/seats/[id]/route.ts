/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { updateSeatSchema } from "@/lib/validation";
import { createApiResponse, createApiError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const seat = await prisma.seat.findUnique({
      where: { id: params.id },
      include: {
        reservations: {
          where: {
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
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!seat) {
      return createApiError("Seat not found", 404);
    }

    return createApiResponse(seat);
  } catch (error) {
    console.error("Get seat error:", error);
    return createApiError("Internal server error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return createApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validatedData = updateSeatSchema.parse(body);

    // Check if seat exists
    const existingSeat = await prisma.seat.findUnique({
      where: { id: params.id },
    });

    if (!existingSeat) {
      return createApiError("Seat not found", 404);
    }

    // Check if seat number is unique (if being updated)
    if (
      validatedData.seatNumber &&
      validatedData.seatNumber !== existingSeat.seatNumber
    ) {
      const seatWithNumber = await prisma.seat.findUnique({
        where: { seatNumber: validatedData.seatNumber },
      });

      if (seatWithNumber) {
        return createApiError("Seat with this number already exists", 400);
      }
    }

    const updatedSeat = await prisma.seat.update({
      where: { id: params.id },
      data: validatedData,
    });

    return createApiResponse(updatedSeat, "Seat updated successfully");
  } catch (error: any) {
    console.error("Update seat error:", error);

    if (error.name === "ZodError") {
      return createApiError("Invalid input data", 400, error.errors);
    }

    return createApiError("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return createApiError("Unauthorized", 401);
    }

    // Check if seat exists
    const existingSeat = await prisma.seat.findUnique({
      where: { id: params.id },
      include: {
        reservations: {
          where: {
            status: "ACTIVE",
            date: {
              gte: new Date(),
            },
          },
        },
      },
    });

    if (!existingSeat) {
      return createApiError("Seat not found", 404);
    }

    // Check if seat has active future reservations
    if (existingSeat.reservations.length > 0) {
      return createApiError(
        "Cannot delete seat with active future reservations",
        400
      );
    }

    // Soft delete by setting isActive to false
    await prisma.seat.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return createApiResponse(null, "Seat deleted successfully");
  } catch (error) {
    console.error("Delete seat error:", error);
    return createApiError("Internal server error", 500);
  }
}
