// lib/validation.ts
import { z } from "zod";

// User validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Add this to your existing validation schemas
export const registerFormSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Seat validation schemas
export const createSeatSchema = z.object({
  seatNumber: z.string().min(1, "Seat number is required"),
  location: z.string().min(1, "Location is required"),
  hasMonitor: z.boolean().default(false),
  description: z.string().optional(),
});

export const updateSeatSchema = createSeatSchema.partial();

// Reservation validation schemas
export const createReservationSchema = z.object({
  seatId: z.string().min(1, "Seat ID is required"),
  date: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, "Cannot reserve seats for past dates"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
});

export const updateReservationSchema = z.object({
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "CANCELLED", "COMPLETED"]).optional(),
});

// Query validation schemas
export const seatQuerySchema = z.object({
  date: z.string().optional(),
  location: z.string().optional(),
  hasMonitor: z.boolean().optional(),
  available: z.boolean().optional(),
});

export const reservationQuerySchema = z.object({
  userId: z.string().optional(),
  seatId: z.string().optional(),
  status: z.string()
    .optional()
    .transform(val => val === "" ? undefined : val)
    .refine(
      val =>
        val === undefined ||
        val === "ACTIVE" ||
        val === "CANCELLED" ||
        val === "COMPLETED",
      { message: "Invalid status value" }
    ),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).strict();

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSeatInput = z.infer<typeof createSeatSchema>;
export type UpdateSeatInput = z.infer<typeof updateSeatSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type SeatQuery = z.infer<typeof seatQuerySchema>;
export type ReservationQuery = z.infer<typeof reservationQuerySchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
