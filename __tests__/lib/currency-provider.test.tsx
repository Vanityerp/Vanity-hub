import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the Next.js cache functions
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
  revalidateTag: jest.fn(),
}))

import { CurrencyProvider, useCurrency } from '@/lib/currency-provider'

// Test component to interact with the currency context
const TestComponent = () => {
  const { currency, currencyCode, setCurrency, formatCurrency } = useCurrency()

  return (
    <div>
      <div data-testid="currency-code">{currencyCode}</div>
      <div data-testid="currency-symbol">{currency.symbol}</div>
      <div data-testid="currency-name">{currency.name}</div>
      <div data-testid="formatted-amount">{formatCurrency(100)}</div>
      <button onClick={() => setCurrency('USD')}>Set USD</button>
      <button onClick={() => setCurrency('EUR')}>Set EUR</button>
      <button onClick={() => setCurrency('QAR')}>Set QAR</button>
    </div>
  )
}

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('CurrencyProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('provides default currency context (QAR)', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )

    expect(screen.getByTestId('currency-code')).toHaveTextContent('QAR')
    expect(screen.getByTestId('currency-symbol')).toHaveTextContent('QAR')
    expect(screen.getByTestId('currency-name')).toHaveTextContent('Qatari Riyal')
  })

  it('formats currency correctly', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )

    // The exact format depends on Intl.NumberFormat, so we check for key components
    const formattedAmount = screen.getByTestId('formatted-amount')
    expect(formattedAmount).toHaveTextContent(/100/)
    expect(formattedAmount).toHaveTextContent(/QAR/)
  })

  it('updates currency when changed', async () => {
    const user = userEvent.setup()

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )

    await user.click(screen.getByText('Set USD'))

    await waitFor(() => {
      expect(screen.getByTestId('currency-code')).toHaveTextContent('USD')
      expect(screen.getByTestId('currency-symbol')).toHaveTextContent('$')
      expect(screen.getByTestId('currency-name')).toHaveTextContent('US Dollar')
    })
  })

  it('persists currency selection to localStorage', async () => {
    const user = userEvent.setup()

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )

    await user.click(screen.getByText('Set EUR'))

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('vanity_currency', 'EUR')
    })
  })

  it('loads currency from localStorage on mount', () => {
    mockLocalStorage.getItem.mockReturnValue('EUR')

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )

    expect(screen.getByTestId('currency-code')).toHaveTextContent('EUR')
    expect(screen.getByTestId('currency-symbol')).toHaveTextContent('€')
  })

  it('handles invalid currency codes gracefully', async () => {
    const user = userEvent.setup()

    // Mock console.warn to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

    const TestComponentWithInvalidCurrency = () => {
      const { setCurrency, currencyCode } = useCurrency()

      return (
        <div>
          <div data-testid="currency-code">{currencyCode}</div>
          <button onClick={() => setCurrency('INVALID')}>Set Invalid</button>
        </div>
      )
    }

    render(
      <CurrencyProvider>
        <TestComponentWithInvalidCurrency />
      </CurrencyProvider>
    )

    await user.click(screen.getByText('Set Invalid'))

    // Should remain on default currency
    expect(screen.getByTestId('currency-code')).toHaveTextContent('QAR')

    consoleSpy.mockRestore()
  })

  it('formats different currencies correctly', async () => {
    const user = userEvent.setup()

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )

    // Test USD formatting
    await user.click(screen.getByText('Set USD'))
    await waitFor(() => {
      const formattedAmount = screen.getByTestId('formatted-amount')
      expect(formattedAmount).toHaveTextContent(/100/)
      expect(formattedAmount).toHaveTextContent(/\$|USD/)
    })

    // Test EUR formatting
    await user.click(screen.getByText('Set EUR'))
    await waitFor(() => {
      const formattedAmount = screen.getByTestId('formatted-amount')
      expect(formattedAmount).toHaveTextContent(/100/)
      expect(formattedAmount).toHaveTextContent(/€|EUR/)
    })
  })

  it('provides currency formatting functionality', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )

    // The formatted amount should be displayed
    const formattedAmount = screen.getByTestId('formatted-amount')
    expect(formattedAmount).toBeInTheDocument()
    expect(formattedAmount).toHaveTextContent(/100/)
  })

  it('throws error when used outside provider', () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useCurrency must be used within a CurrencyProvider')

    consoleSpy.mockRestore()
  })

  it('handles multiple currency changes rapidly', async () => {
    const user = userEvent.setup()

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )

    // Rapidly change currencies
    await user.click(screen.getByText('Set USD'))
    await user.click(screen.getByText('Set EUR'))
    await user.click(screen.getByText('Set QAR'))

    await waitFor(() => {
      expect(screen.getByTestId('currency-code')).toHaveTextContent('QAR')
    })
  })

  it('maintains currency state across re-renders', async () => {
    const user = userEvent.setup()

    const { rerender } = render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )

    await user.click(screen.getByText('Set USD'))

    await waitFor(() => {
      expect(screen.getByTestId('currency-code')).toHaveTextContent('USD')
    })

    // Re-render the provider
    rerender(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )

    // Currency should still be USD
    expect(screen.getByTestId('currency-code')).toHaveTextContent('USD')
  })

  it('formats zero and negative amounts correctly', () => {
    const TestFormattingComponent = () => {
      const { formatCurrency } = useCurrency()

      return (
        <div>
          <div data-testid="zero-amount">{formatCurrency(0)}</div>
          <div data-testid="negative-amount">{formatCurrency(-50)}</div>
          <div data-testid="decimal-amount">{formatCurrency(99.99)}</div>
        </div>
      )
    }

    render(
      <CurrencyProvider>
        <TestFormattingComponent />
      </CurrencyProvider>
    )

    // Check for key components rather than exact format
    expect(screen.getByTestId('zero-amount')).toHaveTextContent(/0/)
    expect(screen.getByTestId('negative-amount')).toHaveTextContent(/-.*50|50.*-/)
    expect(screen.getByTestId('decimal-amount')).toHaveTextContent(/99\.99/)
  })
})
