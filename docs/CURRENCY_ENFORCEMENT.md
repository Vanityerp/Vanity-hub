# Currency Enforcement in Vanity Hub

This document explains how currency is enforced consistently across the entire application.

## Overview

Vanity Hub uses a comprehensive approach to ensure that all monetary values are displayed using the user's selected currency. This includes:

1. A global currency provider that manages the current currency
2. A currency enforcer that ensures consistency across the application
3. A currency display component for rendering monetary values
4. Utility functions for formatting and converting currency values
5. CSS variables and rules for styling currency-related elements
6. A MutationObserver to catch and fix dynamically added content

## Components and Utilities

### CurrencyProvider

The `CurrencyProvider` is the central source of truth for currency settings. It:

- Detects the user's location and sets the appropriate currency
- Stores the user's currency preference
- Provides the current currency to all components
- Dispatches events when the currency changes

### GlobalCurrencyEnforcer

The `GlobalCurrencyEnforcer` ensures that all parts of the application use the correct currency. It:

- Sets CSS variables for the current currency
- Adds data attributes to the HTML element
- Uses a MutationObserver to catch and fix dynamically added content
- Dispatches global events when the currency changes

### CurrencyDisplay Component

The `CurrencyDisplay` component is used to render monetary values. It:

- Automatically formats values using the current currency
- Updates when the currency changes
- Adds data attributes for styling and identification
- Supports various formatting options

### Utility Functions

Several utility functions are provided for working with currency:

- `formatCurrency`: Formats a number as a monetary value
- `autoConvertCurrencyInText`: Converts currency symbols in text
- `useCurrencyFormatter`: A hook with comprehensive formatting options

### CSS Rules

CSS variables and rules ensure consistent styling:

- `--currency-symbol`: The current currency symbol
- `--currency-code`: The current currency code
- `--currency-name`: The current currency name
- `--currency-decimal-digits`: The number of decimal digits

## How It Works

1. The `CurrencyProvider` is initialized at the application root
2. The `GlobalCurrencyEnforcer` is placed high in the component tree
3. Components use the `CurrencyDisplay` component to render monetary values
4. The `useCurrencyFormatter` hook provides formatting options
5. CSS variables and rules ensure consistent styling
6. The MutationObserver catches and fixes dynamically added content

## Best Practices

1. Always use the `CurrencyDisplay` component for monetary values
2. Use the `useCurrencyFormatter` hook for custom formatting
3. Add the `data-currency-display="true"` attribute to custom currency elements
4. Use CSS variables for currency symbols in CSS
5. Listen for the `global-currency-changed` event to react to currency changes

## Example Usage

### Using the CurrencyDisplay Component

```tsx
import { CurrencyDisplay } from "@/components/ui/currency-display"

function PriceDisplay({ amount }: { amount: number }) {
  return (
    <div>
      Price: <CurrencyDisplay amount={amount} />
    </div>
  )
}
```

### Using the useCurrencyFormatter Hook

```tsx
import { useCurrencyFormatter } from "@/lib/use-currency-formatter"

function CustomPriceDisplay({ amount }: { amount: number }) {
  const { format, symbol } = useCurrencyFormatter()
  
  return (
    <div>
      Price: {format(amount, { showSymbol: true, useLocaleFormat: true })}
    </div>
  )
}
```

### Using CSS Variables

```css
.price::before {
  content: var(--currency-symbol);
}
```

### Listening for Currency Changes

```tsx
import { useGlobalCurrencyChange } from "@/components/global-currency-enforcer"

function CurrencySensitiveComponent() {
  const [formattedValues, setFormattedValues] = useState<string[]>([])
  
  useGlobalCurrencyChange((currencyCode) => {
    // Re-format values when currency changes
    console.log(`Currency changed to ${currencyCode}`)
  })
  
  return <div>...</div>
}
```

## Troubleshooting

If you encounter issues with currency display:

1. Make sure the component is wrapped in the `CurrencyProvider`
2. Use the `CurrencyDisplay` component for monetary values
3. Add the `data-currency-display="true"` attribute to custom currency elements
4. Check the console for currency-related errors
5. Verify that the `GlobalCurrencyEnforcer` is working correctly

## Conclusion

By following these guidelines, you can ensure that all monetary values in the application are displayed using the user's selected currency, providing a consistent and localized experience.
