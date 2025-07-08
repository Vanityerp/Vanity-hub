# Database Integration Implementation Plan

## 🎯 **Overview**

This document outlines the migration from mock data to a production-ready PostgreSQL database with Prisma ORM for Vanity Hub.

## 📋 **Current State Analysis**

### **Existing Data Layer**
- ✅ Mock data in `lib/mock-data.ts`
- ✅ localStorage persistence for client-side data
- ✅ Basic data structures defined
- ❌ No persistent database
- ❌ No data validation
- ❌ No relationships enforcement
- ❌ No backup/recovery strategy

### **Data Entities Identified**
- **Users** (staff, clients, admins)
- **Appointments** (bookings, scheduling)
- **Services** (salon services, pricing)
- **Products** (inventory, retail)
- **Locations** (multi-location support)
- **Loyalty** (points, rewards, tiers)
- **Transactions** (sales, payments)

## 🔧 **Implementation Strategy**

### **Phase 1: Database Setup (Week 1)**

#### **1.1 Dependencies Installation**
```json
{
  "dependencies": {
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "pg": "^8.11.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/pg": "^8.10.0",
    "prisma-erd-generator": "^1.11.0"
  }
}
```

#### **1.2 Prisma Configuration**
```javascript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

generator erd {
  provider = "prisma-erd-generator"
  output   = "../docs/ERD.svg"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Management
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      UserRole @default(CLIENT)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  staffProfile   StaffMember?
  clientProfile  Client?
  appointments   Appointment[]
  transactions   Transaction[]

  @@map("users")
}

enum UserRole {
  ADMIN
  MANAGER
  STAFF
  CLIENT
}

// Staff Management
model StaffMember {
  id          String   @id @default(cuid())
  userId      String   @unique
  name        String
  phone       String?
  avatar      String?
  color       String?
  homeService Boolean  @default(false)
  status      StaffStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)
  locations    StaffLocation[]
  appointments Appointment[]
  services     StaffService[]
  schedule     StaffSchedule[]

  @@map("staff_members")
}

enum StaffStatus {
  ACTIVE
  INACTIVE
  ON_LEAVE
}

// Location Management
model Location {
  id        String   @id @default(cuid())
  name      String
  address   String
  city      String
  state     String?
  zipCode   String?
  country   String
  phone     String?
  email     String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  staff        StaffLocation[]
  appointments Appointment[]
  services     LocationService[]
  products     ProductLocation[]
  transactions Transaction[]

  @@map("locations")
}

// Services Management
model Service {
  id          String   @id @default(cuid())
  name        String
  description String?
  duration    Int      // in minutes
  price       Decimal  @db.Decimal(10, 2)
  category    String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  locations    LocationService[]
  staff        StaffService[]
  appointments AppointmentService[]

  @@map("services")
}

// Appointments Management
model Appointment {
  id               String            @id @default(cuid())
  bookingReference String            @unique
  clientId         String
  staffId          String
  locationId       String
  date             DateTime
  duration         Int               // in minutes
  totalPrice       Decimal           @db.Decimal(10, 2)
  status           AppointmentStatus @default(PENDING)
  notes            String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  // Relationships
  client   User     @relation(fields: [clientId], references: [id])
  staff    StaffMember @relation(fields: [staffId], references: [id])
  location Location @relation(fields: [locationId], references: [id])
  services AppointmentService[]
  products AppointmentProduct[]

  @@map("appointments")
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

// Products & Inventory
model Product {
  id          String   @id @default(cuid())
  name        String
  sku         String   @unique
  barcode     String?
  description String?
  category    String
  type        ProductType
  price       Decimal     @db.Decimal(10, 2)
  cost        Decimal     @db.Decimal(10, 2)
  isRetail    Boolean     @default(false)
  isActive    Boolean     @default(true)
  image       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relationships
  locations    ProductLocation[]
  appointments AppointmentProduct[]
  transactions TransactionItem[]

  @@map("products")
}

enum ProductType {
  HAIR_CARE
  SKIN_CARE
  NAIL_CARE
  TOOLS
  ACCESSORIES
  OTHER
}

// Loyalty Program
model LoyaltyProgram {
  id        String   @id @default(cuid())
  clientId  String   @unique
  points    Int      @default(0)
  tier      String   @default("Bronze")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  client       Client @relation(fields: [clientId], references: [id])
  transactions LoyaltyTransaction[]
  rewards      LoyaltyReward[]

  @@map("loyalty_programs")
}

// Junction Tables
model StaffLocation {
  staffId    String
  locationId String
  isActive   Boolean @default(true)

  staff    StaffMember @relation(fields: [staffId], references: [id])
  location Location    @relation(fields: [locationId], references: [id])

  @@id([staffId, locationId])
  @@map("staff_locations")
}

model LocationService {
  locationId String
  serviceId  String
  isActive   Boolean @default(true)

  location Location @relation(fields: [locationId], references: [id])
  service  Service  @relation(fields: [serviceId], references: [id])

  @@id([locationId, serviceId])
  @@map("location_services")
}

model AppointmentService {
  appointmentId String
  serviceId     String
  price         Decimal @db.Decimal(10, 2)

  appointment Appointment @relation(fields: [appointmentId], references: [id])
  service     Service     @relation(fields: [serviceId], references: [id])

  @@id([appointmentId, serviceId])
  @@map("appointment_services")
}
```

#### **1.3 Environment Configuration**
```bash
# .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/vanity_hub"
DIRECT_URL="postgresql://username:password@localhost:5432/vanity_hub"
SHADOW_DATABASE_URL="postgresql://username:password@localhost:5432/vanity_hub_shadow"
```

### **Phase 2: Data Migration (Week 2)**

#### **2.1 Migration Scripts**
```typescript
// scripts/migrate-data.ts
import { PrismaClient } from '@prisma/client'
import { mockStaff, mockClients, mockServices, mockAppointments } from '../lib/mock-data'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function migrateUsers() {
  console.log('Migrating users...')
  
  // Migrate staff as users
  for (const staff of mockStaff) {
    const hashedPassword = await bcrypt.hash('defaultPassword123', 10)
    
    await prisma.user.create({
      data: {
        email: staff.email,
        password: hashedPassword,
        role: staff.role === 'manager' ? 'MANAGER' : 'STAFF',
        staffProfile: {
          create: {
            name: staff.name,
            phone: staff.phone,
            avatar: staff.avatar,
            color: staff.color,
            homeService: staff.homeService,
            status: staff.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
          }
        }
      }
    })
  }
  
  // Migrate clients as users
  for (const client of mockClients) {
    const hashedPassword = await bcrypt.hash('clientPassword123', 10)
    
    await prisma.user.create({
      data: {
        email: client.email,
        password: hashedPassword,
        role: 'CLIENT',
        clientProfile: {
          create: {
            name: client.name,
            phone: client.phone,
            preferences: client.preferences,
            notes: client.notes,
          }
        }
      }
    })
  }
}

async function migrateServices() {
  console.log('Migrating services...')
  
  for (const service of mockServices) {
    await prisma.service.create({
      data: {
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        category: service.category,
        isActive: service.isActive,
      }
    })
  }
}

async function migrateAppointments() {
  console.log('Migrating appointments...')
  
  for (const appointment of mockAppointments) {
    // Find corresponding users
    const client = await prisma.user.findFirst({
      where: { clientProfile: { name: appointment.clientName } }
    })
    
    const staff = await prisma.user.findFirst({
      where: { staffProfile: { name: appointment.staffName } }
    })
    
    if (client && staff) {
      await prisma.appointment.create({
        data: {
          bookingReference: appointment.bookingReference || `VH-${Date.now()}`,
          clientId: client.id,
          staffId: staff.staffProfile!.id,
          locationId: 'default-location-id',
          date: new Date(appointment.date),
          duration: appointment.duration,
          totalPrice: appointment.price,
          status: appointment.status.toUpperCase() as any,
          notes: appointment.notes,
        }
      })
    }
  }
}

async function main() {
  try {
    await migrateUsers()
    await migrateServices()
    await migrateAppointments()
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
```

#### **2.2 Data Validation with Zod**
```typescript
// lib/validations/appointment.ts
import { z } from 'zod'

export const createAppointmentSchema = z.object({
  clientId: z.string().cuid(),
  staffId: z.string().cuid(),
  locationId: z.string().cuid(),
  serviceIds: z.array(z.string().cuid()).min(1),
  date: z.string().datetime(),
  notes: z.string().optional(),
})

export const updateAppointmentSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
  date: z.string().datetime().optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
```

### **Phase 3: API Integration (Week 3)**

#### **3.1 Database Service Layer**
```typescript
// lib/services/appointment-service.ts
import { PrismaClient } from '@prisma/client'
import { CreateAppointmentInput, UpdateAppointmentInput } from '../validations/appointment'

const prisma = new PrismaClient()

export class AppointmentService {
  static async create(data: CreateAppointmentInput) {
    const { serviceIds, ...appointmentData } = data
    
    // Calculate total price
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    })
    
    const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0)
    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0)
    
    return await prisma.appointment.create({
      data: {
        ...appointmentData,
        bookingReference: `VH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        totalPrice,
        duration: totalDuration,
        services: {
          create: services.map(service => ({
            serviceId: service.id,
            price: service.price,
          }))
        }
      },
      include: {
        client: { include: { clientProfile: true } },
        staff: true,
        location: true,
        services: { include: { service: true } }
      }
    })
  }

  static async findMany(filters?: {
    locationId?: string
    staffId?: string
    clientId?: string
    date?: { gte?: Date; lte?: Date }
    status?: string[]
  }) {
    return await prisma.appointment.findMany({
      where: filters,
      include: {
        client: { include: { clientProfile: true } },
        staff: true,
        location: true,
        services: { include: { service: true } }
      },
      orderBy: { date: 'asc' }
    })
  }

  static async update(id: string, data: UpdateAppointmentInput) {
    return await prisma.appointment.update({
      where: { id },
      data,
      include: {
        client: { include: { clientProfile: true } },
        staff: true,
        location: true,
        services: { include: { service: true } }
      }
    })
  }

  static async delete(id: string) {
    return await prisma.appointment.delete({
      where: { id }
    })
  }
}
```

#### **3.2 Updated API Routes**
```typescript
// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AppointmentService } from '@/lib/services/appointment-service'
import { createAppointmentSchema } from '@/lib/validations/appointment'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const staffId = searchParams.get('staffId')
    const clientId = searchParams.get('clientId')
    
    const appointments = await AppointmentService.findMany({
      locationId: locationId || undefined,
      staffId: staffId || undefined,
      clientId: clientId || undefined,
    })
    
    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createAppointmentSchema.parse(body)
    
    const appointment = await AppointmentService.create(validatedData)
    
    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
```

### **Phase 4: Testing & Optimization (Week 4)**

#### **4.1 Database Testing**
```typescript
// __tests__/services/appointment-service.test.ts
import { AppointmentService } from '@/lib/services/appointment-service'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('AppointmentService', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('creates appointment with services', async () => {
    // Create test data
    const client = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'CLIENT',
        clientProfile: { create: { name: 'Test Client' } }
      }
    })

    const appointment = await AppointmentService.create({
      clientId: client.id,
      staffId: 'staff-id',
      locationId: 'location-id',
      serviceIds: ['service-id'],
      date: new Date().toISOString(),
    })

    expect(appointment).toHaveProperty('id')
    expect(appointment.bookingReference).toMatch(/^VH-/)
  })
})
```

## 📊 **Performance Optimization**

### **Database Indexing**
```sql
-- Add indexes for common queries
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);
CREATE INDEX idx_appointments_location ON appointments(location_id);
CREATE INDEX idx_appointments_status ON appointments(status);
```

### **Connection Pooling**
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## 🚀 **Implementation Timeline**

### **Week 1: Setup**
- [ ] Install Prisma and dependencies
- [ ] Design database schema
- [ ] Set up development database
- [ ] Create initial migrations

### **Week 2: Migration**
- [ ] Create data migration scripts
- [ ] Migrate existing mock data
- [ ] Set up data validation
- [ ] Test data integrity

### **Week 3: Integration**
- [ ] Update API routes
- [ ] Create service layer
- [ ] Update frontend data fetching
- [ ] Test API endpoints

### **Week 4: Testing & Optimization**
- [ ] Write database tests
- [ ] Optimize queries and indexes
- [ ] Set up backup strategy
- [ ] Performance testing

## 📈 **Success Criteria**

- ✅ All mock data successfully migrated
- ✅ API routes working with database
- ✅ Data validation implemented
- ✅ Performance benchmarks met
- ✅ Backup and recovery tested

This database integration will provide a solid, scalable foundation for the Vanity Hub application.
