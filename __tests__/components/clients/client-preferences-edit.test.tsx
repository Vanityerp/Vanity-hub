import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientPreferencesCard } from '@/components/clients/client-preferences-card'
import { EditClientDialog } from '@/components/clients/edit-client-dialog'

// Mock the providers
jest.mock('@/lib/auth-provider', () => ({
  useAuth: () => ({
    currentLocation: 'loc1'
  })
}))

jest.mock('@/lib/client-provider', () => ({
  useClients: () => ({
    getClient: jest.fn(() => ({
      id: 'test-client-1',
      name: 'Test Client',
      email: 'test@example.com',
      phone: '555-0123',
      preferredLocation: 'loc1',
      status: 'Active',
      segment: 'Regular',
      preferences: {
        preferredStylists: ['John Doe'],
        preferredServices: ['Haircut'],
        preferredProducts: ['Shampoo'],
        allergies: ['Latex'],
        notes: 'Test notes'
      }
    })),
    updateClient: jest.fn((id, data) => ({ id, ...data }))
  })
}))

jest.mock('@/lib/location-provider', () => ({
  useLocations: () => ({
    locations: [
      { id: 'loc1', name: 'Downtown', status: 'Active' },
      { id: 'loc2', name: 'Westside', status: 'Active' }
    ],
    getLocationName: jest.fn((id) => id === 'loc1' ? 'Downtown' : 'Westside'),
    isHomeServiceEnabled: false
  })
}))

jest.mock('@/lib/staff-provider', () => ({
  useStaff: () => ({
    staff: [
      { id: 'staff1', name: 'John Doe', role: 'Stylist' },
      { id: 'staff2', name: 'Jane Smith', role: 'Stylist' }
    ]
  })
}))

jest.mock('@/lib/service-provider', () => ({
  useServices: () => ({
    staff: [
      { id: 'staff1', name: 'John Doe', role: 'Stylist' },
      { id: 'staff2', name: 'Jane Smith', role: 'Stylist' }
    ],
    categories: [
      { id: 'cat1', name: 'Hair Services' }
    ],
    services: [
      { id: 'svc1', name: 'Haircut', categoryId: 'cat1' },
      { id: 'svc2', name: 'Hair Color', categoryId: 'cat1' }
    ]
  })
}))

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

describe('Client Preferences Edit Functionality', () => {
  const mockPreferences = {
    preferredStylists: ['John Doe'],
    preferredServices: ['Haircut'],
    preferredProducts: ['Shampoo'],
    allergies: ['Latex'],
    notes: 'Test notes'
  }

  it('renders ClientPreferencesCard with edit button', () => {
    const mockOnEdit = jest.fn()
    
    render(
      <ClientPreferencesCard
        clientId="test-client-1"
        preferences={mockPreferences}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('Client Preferences')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Haircut')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnEdit = jest.fn()
    
    render(
      <ClientPreferencesCard
        clientId="test-client-1"
        preferences={mockPreferences}
        onEdit={mockOnEdit}
      />
    )

    const editButton = screen.getByText('Edit')
    await user.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledTimes(1)
  })

  it('opens EditClientDialog with preferences tab when initialTab is set', () => {
    render(
      <EditClientDialog
        clientId="test-client-1"
        open={true}
        onOpenChange={jest.fn()}
        initialTab="preferences"
      />
    )

    expect(screen.getByText('Edit Client')).toBeInTheDocument()
    expect(screen.getByText('Update client information and preferences.')).toBeInTheDocument()
    
    // Check that the preferences tab is active
    const preferencesTab = screen.getByRole('tab', { name: /preferences/i })
    expect(preferencesTab).toHaveAttribute('data-state', 'active')
  })

  it('displays client preferences form when preferences tab is active', () => {
    render(
      <EditClientDialog
        clientId="test-client-1"
        open={true}
        onOpenChange={jest.fn()}
        initialTab="preferences"
      />
    )

    // Check for preferences form elements
    expect(screen.getByText('Preferred Stylists')).toBeInTheDocument()
    expect(screen.getByText('Preferred Services')).toBeInTheDocument()
    expect(screen.getByText('Allergies & Sensitivities')).toBeInTheDocument()
    expect(screen.getByText('Notes & Special Instructions')).toBeInTheDocument()
  })
})
