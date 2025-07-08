// Currency data for the application
// This file contains a comprehensive list of world currencies

export interface Currency {
  code: string;      // ISO 4217 currency code (e.g., USD, EUR)
  name: string;      // Full name of the currency
  symbol: string;    // Currency symbol
  symbolNative: string; // Native currency symbol
  decimalDigits: number; // Number of decimal digits typically used
  rounding: number;  // Rounding increment
  namePlural: string; // Plural name of the currency
}

export const currencies: Record<string, Currency> = {
  "USD": {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    symbolNative: "$",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "US dollars"
  },
  "EUR": {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    symbolNative: "€",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "euros"
  },
  "QAR": {
    code: "QAR",
    name: "Qatari Riyal",
    symbol: "QAR",
    symbolNative: "ر.ق.‏",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "Qatari riyals"
  },
  "GBP": {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    symbolNative: "£",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "British pounds"
  },
  "CAD": {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "CA$",
    symbolNative: "$",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "Canadian dollars"
  },
  "AED": {
    code: "AED",
    name: "United Arab Emirates Dirham",
    symbol: "AED",
    symbolNative: "د.إ.‏",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "UAE dirhams"
  },
  "SAR": {
    code: "SAR",
    name: "Saudi Riyal",
    symbol: "SR",
    symbolNative: "ر.س.‏",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "Saudi riyals"
  },
  "KWD": {
    code: "KWD",
    name: "Kuwaiti Dinar",
    symbol: "KD",
    symbolNative: "د.ك.‏",
    decimalDigits: 3,
    rounding: 0,
    namePlural: "Kuwaiti dinars"
  },
  "BHD": {
    code: "BHD",
    name: "Bahraini Dinar",
    symbol: "BD",
    symbolNative: "د.ب.‏",
    decimalDigits: 3,
    rounding: 0,
    namePlural: "Bahraini dinars"
  },
  "OMR": {
    code: "OMR",
    name: "Omani Rial",
    symbol: "OMR",
    symbolNative: "ر.ع.‏",
    decimalDigits: 3,
    rounding: 0,
    namePlural: "Omani rials"
  },
  "EGP": {
    code: "EGP",
    name: "Egyptian Pound",
    symbol: "EGP",
    symbolNative: "ج.م.‏",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "Egyptian pounds"
  },
  "INR": {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    symbolNative: "₹",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "Indian rupees"
  },
  "PKR": {
    code: "PKR",
    name: "Pakistani Rupee",
    symbol: "PKRs",
    symbolNative: "₨",
    decimalDigits: 0,
    rounding: 0,
    namePlural: "Pakistani rupees"
  },
  "JPY": {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    symbolNative: "￥",
    decimalDigits: 0,
    rounding: 0,
    namePlural: "Japanese yen"
  },
  "CNY": {
    code: "CNY",
    name: "Chinese Yuan",
    symbol: "CN¥",
    symbolNative: "CN¥",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "Chinese yuan"
  },
  "AUD": {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    symbolNative: "$",
    decimalDigits: 2,
    rounding: 0,
    namePlural: "Australian dollars"
  }
};

// Popular currencies to show at the top of selection lists
export const popularCurrencyCodes = ["USD", "EUR", "GBP", "QAR", "AED", "SAR"];

// Get a formatted display name for a currency (e.g., "USD - US Dollar ($)")
export function getCurrencyDisplayName(currencyCode: string): string {
  const currency = currencies[currencyCode];
  if (!currency) return currencyCode;
  return `${currency.code} - ${currency.name} (${currency.symbol})`;
}

// Get all currencies as an array, sorted with popular currencies first
export function getAllCurrencies(): Currency[] {
  const popular = popularCurrencyCodes.map(code => currencies[code]).filter(Boolean);
  const others = Object.values(currencies)
    .filter(currency => !popularCurrencyCodes.includes(currency.code))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  return [...popular, ...others];
}
