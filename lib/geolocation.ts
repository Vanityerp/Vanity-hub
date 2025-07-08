// Geolocation utility for detecting user's country and setting appropriate defaults

interface GeolocationResponse {
  country_code: string;
  country_name: string;
  city: string;
  currency: string;
  currency_name: string;
  ip: string;
}

// Map of country codes to currency codes
export const countryCurrencyMap: Record<string, string> = {
  // Middle East
  "QA": "QAR", // Qatar - Qatari Riyal
  "AE": "AED", // United Arab Emirates - UAE Dirham
  "SA": "SAR", // Saudi Arabia - Saudi Riyal
  "KW": "KWD", // Kuwait - Kuwaiti Dinar
  "BH": "BHD", // Bahrain - Bahraini Dinar
  "OM": "OMR", // Oman - Omani Rial

  // North America
  "US": "USD", // United States - US Dollar
  "CA": "CAD", // Canada - Canadian Dollar
  "MX": "MXN", // Mexico - Mexican Peso

  // Europe
  "GB": "GBP", // United Kingdom - British Pound
  "DE": "EUR", // Germany - Euro
  "FR": "EUR", // France - Euro
  "IT": "EUR", // Italy - Euro
  "ES": "EUR", // Spain - Euro

  // Asia
  "IN": "INR", // India - Indian Rupee
  "CN": "CNY", // China - Chinese Yuan
  "JP": "JPY", // Japan - Japanese Yen
  "PK": "PKR", // Pakistan - Pakistani Rupee

  // Oceania
  "AU": "AUD", // Australia - Australian Dollar
  "NZ": "NZD", // New Zealand - New Zealand Dollar
};

// Default currency to use if geolocation fails or country is not in the map
export const DEFAULT_CURRENCY = "QAR";

/**
 * Fetch with timeout to prevent hanging requests
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  });

  clearTimeout(id);
  return response;
}

/**
 * Detect user's country and return the appropriate currency code
 * Uses multiple geolocation services with fallbacks
 */
export async function detectUserCurrency(): Promise<string> {
  // Try primary API (ipapi.co)
  try {
    // Use ipapi.co for geolocation with a timeout
    const response = await fetchWithTimeout('https://ipapi.co/json/', {}, 3000);

    if (response.ok) {
      const data: GeolocationResponse = await response.json();

      if (data.country_code) {
        // Get the currency code for the detected country
        const countryCode = data.country_code;
        const currencyCode = countryCurrencyMap[countryCode] || data.currency || DEFAULT_CURRENCY;
        console.log('Successfully detected currency using ipapi.co:', currencyCode);
        return currencyCode;
      }
    }

    console.warn('Primary geolocation API failed, trying fallback...');
  } catch (error) {
    console.warn('Error with primary geolocation API:', error);
    // Continue to fallback
  }

  // Try fallback API (ipinfo.io)
  try {
    const response = await fetchWithTimeout('https://ipinfo.io/json', {}, 3000);

    if (response.ok) {
      const data = await response.json();

      if (data.country) {
        const countryCode = data.country;
        const currencyCode = countryCurrencyMap[countryCode] || DEFAULT_CURRENCY;
        console.log('Successfully detected currency using fallback API:', currencyCode);
        return currencyCode;
      }
    }

    console.warn('Fallback geolocation API failed');
  } catch (error) {
    console.warn('Error with fallback geolocation API:', error);
  }

  // If all APIs fail, use browser's navigator.language as a last resort
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const locale = navigator.language;
      const country = locale.split('-')[1]?.toUpperCase();

      if (country && countryCurrencyMap[country]) {
        console.log('Using browser locale for currency detection:', countryCurrencyMap[country]);
        return countryCurrencyMap[country];
      }
    }
  } catch (error) {
    console.warn('Error using browser locale for detection:', error);
  }

  // If all else fails, return the default currency
  console.log('All geolocation methods failed, using default currency:', DEFAULT_CURRENCY);
  return DEFAULT_CURRENCY;
}

/**
 * Client-side function to get the user's currency from localStorage or detect it
 * This avoids making API calls on every page load
 */
export function getUserCurrency(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return DEFAULT_CURRENCY;
  }

  // Try to get from localStorage first
  const storedCurrency = localStorage.getItem('vanity_currency');
  if (storedCurrency) {
    return storedCurrency;
  }

  // If not in localStorage, we'll need to detect it
  // But return the default for now to avoid blocking rendering
  return DEFAULT_CURRENCY;
}

/**
 * Set the user's currency preference in localStorage
 */
export function setUserCurrency(currencyCode: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vanity_currency', currencyCode);
  }
}
