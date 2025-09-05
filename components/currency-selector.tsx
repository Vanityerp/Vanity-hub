'use client';

import { useCurrency } from '@/lib/currency-provider';
import { currencies, popularCurrencyCodes } from '@/lib/currency-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CurrencySelectorProps {
  /** Show only popular currencies */
  popularOnly?: boolean;
  /** Show currency symbol in the trigger */
  showSymbol?: boolean;
  /** Show a badge with the current currency code */
  showBadge?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Currency Selector Component
 * 
 * This component allows users to select a currency from a dropdown.
 * It automatically triggers cache revalidation when the currency changes.
 */
export function CurrencySelector({
  popularOnly = false,
  showSymbol = true,
  showBadge = false,
  className = '',
}: CurrencySelectorProps) {
  const { currencyCode, setCurrency, currency } = useCurrency();
  
  // Get the list of currencies to display
  const currenciesToShow = popularOnly
    ? popularCurrencyCodes.map(code => currencies[code]).filter(Boolean)
    : Object.values(currencies);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showBadge && (
        <Badge variant="outline" className="text-xs">
          {currencyCode}
        </Badge>
      )}
      
      <Select
        value={currencyCode}
        onValueChange={(value) => setCurrency(value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            {showSymbol ? (
              <span>
                {currency.symbol} {currencyCode}
              </span>
            ) : (
              currencyCode
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currenciesToShow.map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              {curr.symbol} {curr.code} - {curr.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
