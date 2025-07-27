/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { updateReservationSchema } from '@/lib/validation'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return createApiError('Unauthorized', 401)
    }
    
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        seat: {
          select: {
            id: true,
            seatNumber: true,
            location: true,
            hasMonitor: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })
    
    if (!reservation) {
      return createApiError('Reservation not found', 404)
    }
    
    // Check if user can access this reservation
    if (session.user.role !== 'ADMIN' && reservation.userId !== session.user.id) {
      return createApiError('Forbidden', 403)
    }
    
    return createApiResponse(reservation)
    
  } catch (error) {
    console.error('Get reservation error:', error)
    return createApiError('Internal server error', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return createApiError('Unauthorized', 401)
    }
    
    const body = await request.json()
    const validatedData = updateReservationSchema.parse(body)
    
    // Check if reservation exists
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: params.id }
    })
    
    if (!existingReservation) {
      return createApiError('Reservation not found', 404)
    }
    
    // Check if user can modify this reservation
    if (session.user.role !== 'ADMIN' && existingReservation.userId !== session.user.id) {
      return createApiError('Forbidden', 403)
    }
    
    // Prevent modification of past reservations (except status)
    const reservationDate = new Date(existingReservation.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (reservationDate < today && validatedData.date) {
      return createApiError('Cannot modify past reservations', 400)
    }
    
    // If changing date, check availability
    if (validatedData.date && validatedData.date !== existingReservation.date.toISOString().split('T')[0]) {
      const conflictingReservation = await prisma.reservation.findFirst({
        where: {
          seatId: existingReservation.seatId,
          date: new Date(validatedData.date),
          status: 'ACTIVE',
          id: { not: params.id }
        }
      })
      
      if (conflictingReservation) {
        return createApiError('Seat is already reserved for the new date', 400)
      }
    }
    
    const updatedReservation = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        date: validatedData.date ? new Date(validatedData.date) : undefined,
      },
      include: {
        seat: {
          select: {
            seatNumber: true,
            location: true,
            hasMonitor: true,
          }
        }
      }
    })
    
    return createApiResponse(updatedReservation, 'Reservation updated successfully')
    
  } catch (error: any) {
    console.error('Update reservation error:', error)
    
    if (error.name === 'ZodError') {
      return createApiError('Invalid input data', 400, error.errors)
    }
    
    return createApiError('Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return createApiError('Unauthorized', 401)
    }
    
    // Check if reservation exists
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: params.id }
    })
    
    if (!existingReservation) {
      return createApiError('Reservation not found', 404)
    }
    
    // Check if user can cancel this reservation
    if (session.user.role !== 'ADMIN' && existingReservation.userId !== session.user.id) {
      return createApiError('Forbidden', 403)
    }
    
    // Check if reservation can be cancelled (not in the past)
    const reservationDate = new Date(existingReservation.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (reservationDate < today) {
      return createApiError('Cannot cancel past reservations', 400)
    }
    
    // Update status to cancelled instead of deleting
    await prisma.reservation.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' }
    })
    
    return createApiResponse(null, 'Reservation cancelled successfully')
    
  } catch (error) {
    console.error('Cancel reservation error:', error)
    return createApiError('Internal server error', 500)
  }
}