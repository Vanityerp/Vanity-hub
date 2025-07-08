"use client"

import React, { useEffect, useState } from "react"
import { useCurrency, useCurrencyEnforcer } from "@/lib/currency-provider"

interface CurrencyDisplayProps {
  /** The amount to display */
  amount: number;

  /** Optional CSS class name */
  className?: string;

  /** Whether to show the currency symbol */
  showSymbol?: boolean;

  /** Whether to use locale-specific formatting */
  useLocaleFormat?: boolean;
}

/**
 * A component to display monetary values with the correct currency formatting
 * This component automatically updates when the global currency changes
 */
export function CurrencyDisplay({
  amount,
  className,
  showSymbol = true,
  useLocaleFormat = true,
}: CurrencyDisplayProps) {
  // Use the currency enforcer to ensure this component updates when currency changes
  const { currency, currencyCode, formatCurrency } = useCurrencyEnforcer();
  const [formattedValue, setFormattedValue] = useState<string>("");

  // Validate and sanitize the amount
  const validAmount = React.useMemo(() => {
    // Handle invalid amounts
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      console.warn('CurrencyDisplay received invalid amount:', amount, 'defaulting to 0');
      return 0;
    }
    return amount;
  }, [amount]);

  // Update the formatted value whenever the currency or amount changes
  useEffect(() => {
    try {
      // Format the amount based on the current currency
      const formatted = useLocaleFormat
        ? new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: currency.decimalDigits,
            maximumFractionDigits: currency.decimalDigits,
          }).format(validAmount)
        : `${showSymbol ? currency.symbol + ' ' : ''}${validAmount.toFixed(currency.decimalDigits)}`;

      setFormattedValue(formatted);
    } catch (error) {
      console.error('Error formatting currency:', error, 'amount:', validAmount);
      // Fallback formatting
      setFormattedValue(`${showSymbol ? currency.symbol + ' ' : ''}${validAmount.toFixed(2)}`);
    }
  }, [validAmount, currency, currencyCode, showSymbol, useLocaleFormat]);

  return (
    <span
      className={`${className || ''} currency-display`}
      data-currency-code={currencyCode}
      data-currency-display="true"
      data-amount={validAmount.toString()}
      data-currency-symbol={currency.symbol}
      style={{
        position: 'relative',
        zIndex: 20,
        backgroundColor: 'white',
        backgroundImage: 'none !important',
        boxShadow: '0 0 0 4px white'
      }}
    >
      {formattedValue}
    </span>
  );
}
