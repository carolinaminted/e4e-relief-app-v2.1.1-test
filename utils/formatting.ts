/**
 * Formats a phone number string as the user types, applying US-style formatting.
 * It's designed to be used in an `onChange` handler of an input field.
 *
 * This function performs the following steps:
 * 1.  Checks if the number starts with '+', treating it as an international number.
 * 2.  Strips all non-digit characters from the input.
 * 3.  Enforces a maximum limit of 16 digits to prevent excessively long inputs.
 * 4.  If international, it returns the '+' followed by the cleaned digits (e.g., `+447...`).
 * 5.  If not international, it applies US-style formatting `(XXX) XXX-XXXX` as the user types.
 *
 * @param value The raw string value from the input field.
 * @returns The formatted phone number string.
 */
export function formatPhoneNumber(value: string): string {
    if (!value) {
        return '';
    }

    // Check for international format and clean the input to get only digits.
    const isInternational = value.trim().startsWith('+');
    let digits = value.replace(/[^\d]/g, '');

    // Enforce a 16-digit limit.
    const maxDigits = 16;
    if (digits.length > maxDigits) {
        digits = digits.slice(0, maxDigits);
    }

    // Apply formatting based on whether it's international or US-style.
    if (isInternational) {
        // For international numbers, just return the '+' and the cleaned digits.
        return `+${digits}`;
    }

    // Apply standard US-style formatting: (XXX) XXX-XXXX
    const len = digits.length;
    if (len === 0) return '';
    if (len <= 3) return `(${digits}`;
    if (len <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    
    // Format for 7 to 10 digits.
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}