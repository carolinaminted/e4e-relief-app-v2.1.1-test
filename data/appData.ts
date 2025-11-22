// FIX: Import the Expense type to create a more specific type for expenseTypes.
import type { Expense } from '../types';

export const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
  ja: "日本語",
};

// Extracted from image
export const employmentTypes: string[] = [
    'Active Full Time',
    'Active Part Time',
    'Full Time Short Term Disability',
    'Full-Time on FMLA (U.S. only)',
    'Part Time Short Term Disability',
    'Part-Time on FMLA (U.S. only)',
];

export const disasterEvents: string[] = [
    'Commercial Carrier Accident', // Shortened for usability
    'Earthquake',
    'Flood',
    'House Fire',
    'Landslide',
    'Sinkhole',
    'Tornado',
    'Tropical Storm/Hurricane',
    'Typhoon',
    'Volcanic Eruption',
    'Wildfire',
    'Winter Storm',
];

export const hardshipEvents: string[] = [
    'Crime',
    'Death',
    'Home Damage (leaks or broken pipes)',
    'Household Loss of Income',
    'Housing Crisis',
    'Mental Health and Well-Being',
    'Workplace Disruption',
];

// Combined list for forms and AI
export const allEventTypes: string[] = [
    ...disasterEvents,
    ...hardshipEvents,
    'My disaster is not listed'
];


// FIX: Use a more specific type for expenseTypes to align with the Expense type definition. This resolves type errors where a generic 'string' was being passed to functions expecting a specific literal type.
export const expenseTypes: Exclude<Expense['type'], ''>[] = [
    'Basic Disaster Supplies',
    'Food Spoilage',
    'Meals'
];

export const languages: string[] = [
    "Arabic",
    "Bengali",
    "Chinese",
    "Dutch",
    "English",
    "French",
    "German",
    "Hindi",
    "Italian",
    "Japanese",
    "Korean",
    "Mandarin Chinese",
    "Portuguese",
    "Russian",
    "Spanish",
    "Turkish",
    "Urdu",
    "Vietnamese",
];