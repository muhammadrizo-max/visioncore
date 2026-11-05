/**
 * Generates a unique 12-character ID starting with "vcg", 
 * containing 1 delimiter ('-' or '_') and 8 numeric digits.
 * Example: "vcg-74920183" (length = 12)
 */
export function generateVcgUserId(): string {
  const delimiter = Math.random() > 0.5 ? '-' : '_';
  // Generate 8-digit random number between 10000000 and 99999999
  const digits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `vcg${delimiter}${digits}`;
}
