/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/users/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { createApiResponse, createApiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return createApiError('Unauthorized', 401)
    }
    
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    
    // Build where clause
    const where: any = {}
    
    if (role) {
      where.role = role
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            reservations: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    })
    
    return createApiResponse(users)
    
  } catch (error) {
    console.error('Get users error:', error)
    return createApiError('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return createApiError('Unauthorized', 401)
    }
    
    // This would be for admin to create users
    // Implementation similar to register but with role assignment
    return createApiError('Not implemented', 501)
    
  } catch (error) {
    console.error('Create user error:', error)
    return createApiError('Internal server error', 500)
  }
}