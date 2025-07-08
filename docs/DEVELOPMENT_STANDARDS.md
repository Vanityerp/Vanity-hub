# Development Standards & Guidelines

## 🎯 **Overview**

This document establishes comprehensive development standards and guidelines for Vanity Hub to ensure code quality, maintainability, and team collaboration. These standards cover code organization, naming conventions, documentation requirements, and best practices.

## 📁 **Code Organization Structure**

### **Directory Structure**
```
vanity-hub/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Auth route group
│   ├── admin/                    # Admin dashboard routes
│   ├── api/                      # API routes
│   ├── booking/                  # Booking system routes
│   ├── client-portal/            # Client portal routes
│   ├── dashboard/                # Main dashboard routes
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Base UI components (shadcn/ui)
│   ├── forms/                    # Form components
│   ├── charts/                   # Chart components
│   ├── modals/                   # Modal components
│   └── [feature]/                # Feature-specific components
├── lib/                          # Utility libraries
│   ├── auth/                     # Authentication utilities
│   ├── database/                 # Database utilities
│   ├── validation/               # Validation schemas and rules
│   ├── security/                 # Security utilities
│   ├── monitoring/               # Monitoring and observability
│   ├── services/                 # Business logic services
│   └── utils/                    # General utilities
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── docs/                         # Documentation
├── scripts/                      # Database and utility scripts
├── __tests__/                    # Test files
├── e2e/                          # End-to-end tests
└── prisma/                       # Database schema and migrations
```

### **Component Organization**
```
components/
├── ui/                           # Base components (Button, Input, etc.)
├── forms/                        # Form components
│   ├── client-form.tsx
│   ├── appointment-form.tsx
│   └── validation-form.tsx
├── charts/                       # Data visualization
│   ├── revenue-chart.tsx
│   ├── appointment-chart.tsx
│   └── performance-chart.tsx
├── modals/                       # Modal dialogs
│   ├── confirmation-modal.tsx
│   ├── edit-modal.tsx
│   └── delete-modal.tsx
└── [feature]/                    # Feature-specific components
    ├── appointments/
    ├── clients/
    ├── inventory/
    └── staff/
```

## 🏗️ **Naming Conventions**

### **Files and Directories**
- **Components**: PascalCase for component files (`ClientForm.tsx`)
- **Utilities**: kebab-case for utility files (`data-fetching.ts`)
- **Hooks**: camelCase starting with 'use' (`useClientData.ts`)
- **Types**: kebab-case with `.types.ts` suffix (`client.types.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### **Variables and Functions**
```typescript
// Variables: camelCase
const clientData = await fetchClients()
const isLoading = true

// Functions: camelCase with descriptive verbs
function validateClientData(data: ClientData): ValidationResult
async function createAppointment(appointmentData: AppointmentInput): Promise<Appointment>

// Constants: UPPER_SNAKE_CASE
const MAX_APPOINTMENT_DURATION = 480
const DEFAULT_CACHE_TTL = 300

// Types and Interfaces: PascalCase
interface ClientData {
  id: string
  name: string
  email: string
}

type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
```

### **Component Naming**
```typescript
// Component files: PascalCase
export function ClientForm({ onSubmit }: ClientFormProps) {
  // Component logic
}

// Props interfaces: ComponentName + Props
interface ClientFormProps {
  onSubmit: (data: ClientData) => void
  initialData?: ClientData
}

// Component variants: descriptive names
export function ClientFormModal({ isOpen, onClose }: ClientFormModalProps)
export function ClientFormCard({ client }: ClientFormCardProps)
```

## 📝 **Documentation Standards**

### **Code Documentation**
```typescript
/**
 * Validates client data according to business rules
 * 
 * @param data - The client data to validate
 * @param options - Validation options
 * @returns Validation result with errors and warnings
 * 
 * @example
 * ```typescript
 * const result = validateClientData(clientData, { strict: true })
 * if (!result.success) {
 *   console.error('Validation failed:', result.errors)
 * }
 * ```
 */
export async function validateClientData(
  data: ClientData,
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  // Implementation
}
```

### **Component Documentation**
```typescript
/**
 * ClientForm - A comprehensive form for creating and editing client information
 * 
 * Features:
 * - Real-time validation
 * - Auto-save functionality
 * - Emergency contact management
 * - Preference settings
 * 
 * @param onSubmit - Callback fired when form is submitted with valid data
 * @param initialData - Initial form data for editing existing clients
 * @param isLoading - Whether the form is in a loading state
 * 
 * @example
 * ```tsx
 * <ClientForm
 *   onSubmit={handleCreateClient}
 *   initialData={existingClient}
 *   isLoading={isCreating}
 * />
 * ```
 */
export function ClientForm({ onSubmit, initialData, isLoading }: ClientFormProps) {
  // Component implementation
}
```

### **API Documentation**
```typescript
/**
 * POST /api/clients
 * 
 * Creates a new client with comprehensive validation and security checks
 * 
 * @route POST /api/clients
 * @access Private (Staff, Manager, Admin)
 * @rateLimit 20 requests per minute
 * 
 * @body {ClientCreateInput} Client data
 * @returns {Client} Created client object
 * 
 * @throws {400} Validation error
 * @throws {401} Unauthorized
 * @throws {409} Client already exists
 * @throws {429} Rate limit exceeded
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/clients', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(clientData)
 * })
 * ```
 */
export async function POST(request: NextRequest) {
  // API implementation
}
```

## 🔧 **Code Quality Standards**

### **TypeScript Standards**
```typescript
// Always use explicit types for function parameters and return values
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

// Use type guards for runtime type checking
function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// Use discriminated unions for complex state
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: any }
  | { status: 'error'; error: string }

// Use const assertions for immutable data
const API_ENDPOINTS = {
  CLIENTS: '/api/clients',
  APPOINTMENTS: '/api/appointments',
  STAFF: '/api/staff'
} as const
```

### **React Standards**
```typescript
// Use functional components with TypeScript
interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (clientId: string) => void
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  // Use custom hooks for complex logic
  const { isLoading, error } = useClientData(client.id)
  
  // Use useCallback for event handlers
  const handleEdit = useCallback(() => {
    onEdit(client)
  }, [client, onEdit])
  
  // Use useMemo for expensive calculations
  const formattedData = useMemo(() => {
    return formatClientData(client)
  }, [client])
  
  return (
    <div className="client-card">
      {/* Component JSX */}
    </div>
  )
}
```

### **Error Handling Standards**
```typescript
// Use Result pattern for operations that can fail
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

async function createClient(data: ClientInput): Promise<Result<Client>> {
  try {
    const validatedData = await validateClientData(data)
    if (!validatedData.success) {
      return { success: false, error: new ValidationError(validatedData.errors) }
    }
    
    const client = await database.client.create({ data: validatedData.data })
    return { success: true, data: client }
  } catch (error) {
    logger.error('Failed to create client', error)
    return { success: false, error: error as Error }
  }
}

// Use error boundaries for React components
export function ClientManagement() {
  return (
    <ErrorBoundary fallback={<ClientErrorFallback />}>
      <ClientList />
      <ClientForm />
    </ErrorBoundary>
  )
}
```

## 🧪 **Testing Standards**

### **Unit Testing**
```typescript
// Test file naming: [component/function].test.ts
// tests/components/ClientForm.test.tsx

describe('ClientForm', () => {
  it('should validate email format', async () => {
    const { getByLabelText, getByText } = render(<ClientForm onSubmit={jest.fn()} />)
    
    const emailInput = getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)
    
    await waitFor(() => {
      expect(getByText('Invalid email format')).toBeInTheDocument()
    })
  })
  
  it('should submit valid data', async () => {
    const mockSubmit = jest.fn()
    const { getByLabelText, getByRole } = render(<ClientForm onSubmit={mockSubmit} />)
    
    // Fill form with valid data
    fireEvent.change(getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(getByLabelText('Email'), { target: { value: 'john@example.com' } })
    
    fireEvent.click(getByRole('button', { name: 'Submit' }))
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'John',
        email: 'john@example.com'
      }))
    })
  })
})
```

### **Integration Testing**
```typescript
// tests/integration/client-management.test.ts

describe('Client Management Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase()
  })
  
  afterEach(async () => {
    await cleanupTestDatabase()
  })
  
  it('should create client through API', async () => {
    const clientData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890'
    }
    
    const response = await request(app)
      .post('/api/clients')
      .send(clientData)
      .expect(201)
    
    expect(response.body).toMatchObject({
      id: expect.any(String),
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    })
  })
})
```

## 🔒 **Security Standards**

### **Input Validation**
```typescript
// Always validate and sanitize input
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Validate with Zod schema
  const validation = await enhancedValidation.validate(clientSchema, body, {
    sanitize: true,
    strict: true
  })
  
  if (!validation.success) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 }
    )
  }
  
  // Use validated data
  const client = await createClient(validation.data)
  return NextResponse.json(client)
}
```

### **Authentication & Authorization**
```typescript
// Use authentication wrapper for protected routes
export const GET = withAuth(async (req: NextRequest) => {
  // Route implementation
}, {
  requiredRole: 'staff',
  rateLimit: { windowMs: 60000, maxRequests: 100 }
})

// Check permissions in components
export function ClientManagement() {
  const { user, hasPermission } = useAuth()
  
  if (!hasPermission('clients:read')) {
    return <AccessDenied />
  }
  
  return <ClientList />
}
```

## 📊 **Performance Standards**

### **Code Splitting**
```typescript
// Use dynamic imports for large components
const ClientManagement = dynamic(() => import('./ClientManagement'), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

// Use React.lazy for route-level splitting
const AdminDashboard = lazy(() => import('../admin/AdminDashboard'))
```

### **Caching Standards**
```typescript
// Use React Query for data fetching
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Use Next.js caching for API routes
export async function GET() {
  const clients = await fetchClients()
  
  return NextResponse.json(clients, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
```

## 🎨 **Styling Standards**

### **Tailwind CSS Guidelines**
```typescript
// Use consistent spacing scale
const spacing = {
  xs: 'p-2',      // 8px
  sm: 'p-4',      // 16px
  md: 'p-6',      // 24px
  lg: 'p-8',      // 32px
  xl: 'p-12',     // 48px
}

// Use semantic color classes
const colors = {
  primary: 'bg-blue-600 text-white',
  secondary: 'bg-gray-600 text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-600 text-white',
  danger: 'bg-red-600 text-white',
}

// Component styling example
export function Button({ variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors'
  const variantClasses = colors[variant]
  const sizeClasses = spacing[size]
  
  return (
    <button
      className={cn(baseClasses, variantClasses, sizeClasses)}
      {...props}
    >
      {children}
    </button>
  )
}
```

## 🔄 **Git Workflow Standards**

### **Commit Message Format**
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(clients): add real-time validation to client form

- Implement debounced validation
- Add field-level error display
- Include validation suggestions

Closes #123
```

### **Branch Naming**
```
feature/client-validation-enhancement
bugfix/appointment-scheduling-conflict
hotfix/security-vulnerability-patch
docs/api-documentation-update
```

## 📋 **Code Review Checklist**

### **Functionality**
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable

### **Code Quality**
- [ ] Code is readable and well-structured
- [ ] Naming conventions are followed
- [ ] No code duplication
- [ ] Functions are single-purpose

### **Security**
- [ ] Input validation is present
- [ ] Authentication/authorization is correct
- [ ] No sensitive data exposure
- [ ] SQL injection prevention

### **Testing**
- [ ] Unit tests are present and passing
- [ ] Integration tests cover main flows
- [ ] Test coverage is adequate
- [ ] Tests are maintainable

### **Documentation**
- [ ] Code is properly documented
- [ ] API changes are documented
- [ ] README is updated if needed
- [ ] Breaking changes are noted

---

**Last Updated**: 2025-06-27  
**Next Review**: 2025-07-27
