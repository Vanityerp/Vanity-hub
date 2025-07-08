/**
 * Utility functions for cleaning and formatting client names
 */

/**
 * Clean up client name by removing client ID prefix and location prefix if present
 * 
 * @param clientName - The raw client name that might contain prefixes
 * @returns Clean client name without prefixes
 * 
 * @example
 * getCleanClientName('[CMCD7CNKP0003TEG55RGP7ICK] Luna') // returns 'Luna'
 * getCleanClientName('[LOC1] Luna') // returns 'Luna'
 * getCleanClientName('Luna') // returns 'Luna'
 * getCleanClientName('') // returns 'Unknown Client'
 */
export function getCleanClientName(clientName: string): string {
  if (!clientName) return 'Unknown Client';
  
  // Remove client ID prefix like [CMCD7CNKP0003TEG55RGP7ICK] from client name
  const cleanName = clientName.replace(/^\[[\w\d]+\]\s*/, '');
  
  // Remove location prefix like [LOC1] from reflected appointments
  const finalName = cleanName.replace(/^\[[\w\d]+\]\s*/, '');
  
  return finalName || 'Unknown Client';
}

/**
 * Check if a client name has a client ID prefix
 * 
 * @param clientName - The client name to check
 * @returns True if the client name has a client ID prefix
 */
export function hasClientIdPrefix(clientName: string): boolean {
  if (!clientName) return false;
  return /^\[[\w\d]+\]\s*/.test(clientName);
}

/**
 * Check if a client name has a location prefix (from reflected appointments)
 * 
 * @param clientName - The client name to check
 * @returns True if the client name has a location prefix
 */
export function hasLocationPrefix(clientName: string): boolean {
  if (!clientName) return false;
  // After removing client ID prefix, check for location prefix
  const withoutClientId = clientName.replace(/^\[[\w\d]+\]\s*/, '');
  return /^\[[\w\d]+\]\s*/.test(withoutClientId);
}

/**
 * Extract the client ID from a client name if present
 * 
 * @param clientName - The client name that might contain a client ID prefix
 * @returns The client ID if found, null otherwise
 */
export function extractClientId(clientName: string): string | null {
  if (!clientName) return null;
  
  const match = clientName.match(/^\[([\w\d]+)\]/);
  return match ? match[1] : null;
}

/**
 * Format client name for display in different contexts
 * 
 * @param clientName - The raw client name
 * @param context - The display context ('card', 'dialog', 'list')
 * @returns Formatted client name appropriate for the context
 */
export function formatClientNameForDisplay(
  clientName: string, 
  context: 'card' | 'dialog' | 'list' = 'card'
): string {
  const cleanName = getCleanClientName(clientName);
  
  switch (context) {
    case 'card':
      // For appointment cards, keep it short and clean
      return cleanName.length > 20 ? `${cleanName.substring(0, 17)}...` : cleanName;
    
    case 'dialog':
      // For dialogs, show full name
      return cleanName;
    
    case 'list':
      // For lists, show full name but with reasonable truncation
      return cleanName.length > 30 ? `${cleanName.substring(0, 27)}...` : cleanName;
    
    default:
      return cleanName;
  }
}

/**
 * Debug function to analyze client name format
 * 
 * @param clientName - The client name to analyze
 * @returns Debug information about the client name
 */
export function debugClientName(clientName: string): {
  original: string;
  clean: string;
  hasClientId: boolean;
  hasLocation: boolean;
  clientId: string | null;
} {
  return {
    original: clientName,
    clean: getCleanClientName(clientName),
    hasClientId: hasClientIdPrefix(clientName),
    hasLocation: hasLocationPrefix(clientName),
    clientId: extractClientId(clientName)
  };
}
