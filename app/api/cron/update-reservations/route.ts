// app/api/cron/update-reservations/route.ts
import { updateExpiredReservations } from "@/lib/reservationUtils";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.CRON_SECRET !== process.env.CRON_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await updateExpiredReservations();
    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
