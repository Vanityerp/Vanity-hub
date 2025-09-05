import { http, HttpResponse } from 'msw'

// Mock data
const mockAppointments = [
  {
    id: '1',
    clientName: 'John Doe',
    clientEmail: 'john@example.com',
    service: 'Haircut',
    staff: 'Alice Johnson',
    date: '2024-01-15T10:00:00Z',
    duration: 60,
    status: 'confirmed',
    location: 'loc1',
    price: 50,
  },
  {
    id: '2',
    clientName: 'Jane Smith',
    clientEmail: 'jane@example.com',
    service: 'Hair Color',
    staff: 'Bob Wilson',
    date: '2024-01-16T14:00:00Z',
    duration: 120,
    status: 'pending',
    location: 'loc2',
    price: 120,
  },
]

const mockClients = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    preferredLocation: 'loc1',
    status: 'Active',
    segment: 'Regular',
    totalSpent: 500,
    lastVisit: '2024-01-10',
    preferences: {
      preferredStylists: ['Alice Johnson'],
      preferredServices: ['Haircut'],
      preferredProducts: [],
      allergies: [],
      notes: 'Prefers morning appointments'
    }
  },
]

const mockStaff = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@salon.com',
    role: 'STAFF',
    specialties: ['Haircut', 'Styling'],
    locations: ['loc1'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Bob Wilson',
    email: 'bob@salon.com',
    role: 'STAFF',
    specialties: ['Hair Color', 'Highlights'],
    locations: ['loc2'],
    isActive: true,
  },
]

const mockServices = [
  {
    id: '1',
    name: 'Haircut',
    category: 'Hair',
    duration: 60,
    price: 50,
    description: 'Professional haircut and styling',
    locations: ['loc1', 'loc2'],
  },
  {
    id: '2',
    name: 'Hair Color',
    category: 'Hair',
    duration: 120,
    price: 120,
    description: 'Full hair coloring service',
    locations: ['loc1', 'loc2'],
  },
]

export const handlers = [
  // Appointments API
  http.get('/api/appointments', ({ request }) => {
    const url = new URL(request.url)
    const location = url.searchParams.get('location')
    const staff = url.searchParams.get('staff')
    const client = url.searchParams.get('client')

    let filteredAppointments = [...mockAppointments]

    if (location && location !== 'all') {
      filteredAppointments = filteredAppointments.filter(apt => apt.location === location)
    }

    if (staff) {
      filteredAppointments = filteredAppointments.filter(apt => apt.staff === staff)
    }

    if (client) {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.clientName.toLowerCase().includes(client.toLowerCase())
      )
    }

    return HttpResponse.json({
      appointments: filteredAppointments,
      total: filteredAppointments.length,
    })
  }),

  http.post('/api/appointments', async ({ request }) => {
    const body = await request.json() as any
    
    // Validate required fields
    if (!body.clientName || !body.service || !body.date || !body.staffId) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newAppointment = {
      id: String(mockAppointments.length + 1),
      ...body,
      status: 'pending',
      bookingReference: `BK${Date.now()}`,
    }

    mockAppointments.push(newAppointment)

    return HttpResponse.json(
      { appointment: newAppointment },
      { status: 201 }
    )
  }),

  http.patch('/api/appointments/:id', async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as any
    
    const appointmentIndex = mockAppointments.findIndex(apt => apt.id === id)
    
    if (appointmentIndex === -1) {
      return HttpResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    mockAppointments[appointmentIndex] = {
      ...mockAppointments[appointmentIndex],
      ...body,
    }

    return HttpResponse.json({
      appointment: mockAppointments[appointmentIndex],
    })
  }),

  // Clients API
  http.get('/api/clients', () => {
    return HttpResponse.json({
      clients: mockClients,
      total: mockClients.length,
    })
  }),

  http.get('/api/clients/:id', ({ params }) => {
    const { id } = params
    const client = mockClients.find(c => c.id === id)
    
    if (!client) {
      return HttpResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ client })
  }),

  // Staff API
  http.get('/api/staff', () => {
    return HttpResponse.json({
      staff: mockStaff,
      total: mockStaff.length,
    })
  }),

  // Services API
  http.get('/api/services', () => {
    return HttpResponse.json({
      services: mockServices,
      total: mockServices.length,
    })
  }),

  // Auth API
  http.post('/api/auth/signin', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.email === 'admin@salon.com' && body.password === 'password') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'admin@salon.com',
          role: 'ADMIN',
          name: 'Admin User',
        },
        token: 'mock-jwt-token',
      })
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  // Error simulation handlers
  http.get('/api/error-test', () => {
    return HttpResponse.json(
      { error: 'Simulated server error' },
      { status: 500 }
    )
  }),
]
