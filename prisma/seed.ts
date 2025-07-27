// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@company.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Created admin user:', admin.email)

  // Create test users
  const users = [
    {
      name: 'John Doe',
      email: 'john@company.com',
      password: await bcrypt.hash('password123', 12),
    },
    {
      name: 'Jane Smith',
      email: 'jane@company.com',
      password: await bcrypt.hash('password123', 12),
    },
    {
      name: 'Mike Johnson',
      email: 'mike@company.com',
      password: await bcrypt.hash('password123', 12),
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah@company.com',
      password: await bcrypt.hash('password123', 12),
    },
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
    console.log('✅ Created user:', user.email)
  }

  // Create seats
  const seats = [
    // Floor 1 - Open Space
    { seatNumber: 'A1', location: 'Floor 1 - Open Space', hasMonitor: true },
    { seatNumber: 'A2', location: 'Floor 1 - Open Space', hasMonitor: true },
    { seatNumber: 'A3', location: 'Floor 1 - Open Space', hasMonitor: false },
    { seatNumber: 'A4', location: 'Floor 1 - Open Space', hasMonitor: true },
    { seatNumber: 'A5', location: 'Floor 1 - Open Space', hasMonitor: false },
    { seatNumber: 'A6', location: 'Floor 1 - Open Space', hasMonitor: true },
    
    // Floor 1 - Quiet Zone
    { seatNumber: 'B1', location: 'Floor 1 - Quiet Zone', hasMonitor: true },
    { seatNumber: 'B2', location: 'Floor 1 - Quiet Zone', hasMonitor: true },
    { seatNumber: 'B3', location: 'Floor 1 - Quiet Zone', hasMonitor: false },
    { seatNumber: 'B4', location: 'Floor 1 - Quiet Zone', hasMonitor: true },
    
    // Floor 2 - Collaboration Area
    { seatNumber: 'C1', location: 'Floor 2 - Collaboration Area', hasMonitor: false },
    { seatNumber: 'C2', location: 'Floor 2 - Collaboration Area', hasMonitor: true },
    { seatNumber: 'C3', location: 'Floor 2 - Collaboration Area', hasMonitor: false },
    { seatNumber: 'C4', location: 'Floor 2 - Collaboration Area', hasMonitor: true },
    { seatNumber: 'C5', location: 'Floor 2 - Collaboration Area', hasMonitor: false },
    
    // Floor 2 - Window Side
    { seatNumber: 'D1', location: 'Floor 2 - Window Side', hasMonitor: true },
    { seatNumber: 'D2', location: 'Floor 2 - Window Side', hasMonitor: true },
    { seatNumber: 'D3', location: 'Floor 2 - Window Side', hasMonitor: true },
    { seatNumber: 'D4', location: 'Floor 2 - Window Side', hasMonitor: false },
    
    // Floor 3 - Executive Area
    { seatNumber: 'E1', location: 'Floor 3 - Executive Area', hasMonitor: true },
    { seatNumber: 'E2', location: 'Floor 3 - Executive Area', hasMonitor: true },
    { seatNumber: 'E3', location: 'Floor 3 - Executive Area', hasMonitor: true },
  ]

  for (const seatData of seats) {
    const seat = await prisma.seat.upsert({
      where: { seatNumber: seatData.seatNumber },
      update: {},
      create: {
        ...seatData,
        description: `${seatData.location} - Seat ${seatData.seatNumber}`,
      },
    })
    console.log('✅ Created seat:', seat.seatNumber)
  }

  // Create some sample reservations
  const allUsers = await prisma.user.findMany()
  const allSeats = await prisma.seat.findMany()
  
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  // Sample reservations
  const reservations = [
    {
      userId: allUsers[1].id, // John
      seatId: allSeats[0].id, // A1
      date: today,
      startTime: '09:00',
      endTime: '17:00',
      notes: 'Working on the new project',
    },
    {
      userId: allUsers[2].id, // Jane
      seatId: allSeats[5].id, // A6
      date: today,
      startTime: '10:00',
      endTime: '16:00',
      notes: 'Client calls scheduled',
    },
    {
      userId: allUsers[1].id, // John
      seatId: allSeats[1].id, // A2
      date: tomorrow,
      startTime: '08:30',
      endTime: '17:30',
      notes: 'Early start for presentation prep',
    },
    {
      userId: allUsers[3].id, // Mike
      seatId: allSeats[10].id, // C1
      date: tomorrow,
      startTime: '09:00',
      endTime: '17:00',
      notes: 'Team collaboration day',
    },
    {
      userId: allUsers[4].id, // Sarah
      seatId: allSeats[15].id, // D1
      date: dayAfterTomorrow,
      startTime: '09:00',
      endTime: '17:00',
      notes: 'Need the window view for video calls',
    },
  ]

  for (const reservationData of reservations) {
    try {
      const reservation = await prisma.reservation.create({
        data: reservationData,
      })
      console.log('✅ Created reservation:', `${reservation.id}`)
    } catch (error) {
      console.log('⚠️ Reservation already exists or conflict')
    }
  }

  console.log('🎉 Database seed completed successfully!')
  
  console.log('\n📋 Login Credentials:')
  console.log('Admin: admin@company.com / admin123')
  console.log('Users: john@company.com / password123')
  console.log('       jane@company.com / password123')
  console.log('       mike@company.com / password123')
  console.log('       sarah@company.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })