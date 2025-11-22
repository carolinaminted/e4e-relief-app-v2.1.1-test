import type { TokenEvent, ModelPricing, UserProfile } from '../types';
import { usersRepo, tokenEventsRepo } from './firestoreRepo';

// --- State ---
// This module holds the currently authenticated user's profile in-memory
// to avoid having to pass it into every `logEvent` call.
let currentUser: UserProfile | null = null;
const currentAccount: string = 'E4E-Relief-Inc';
// In a real app, this might come from an environment variable (e.g., process.env.NODE_ENV).
const currentEnv: 'Production' | 'Development' = 'Production';

// Pricing data for different Gemini models. Used to calculate the estimated cost of each API call.
const MODEL_PRICING: ModelPricing = {
  'gemini-2.5-flash': {
    input: 0.00035, // Price per 1000 tokens
    output: 0.00070,
  },
  'gemini-2.5-pro': {
    input: 0.0035,
    output: 0.0070,
  },
  'gemini-3-pro-preview': {
    input: 0.0035, // Estimated using Pro pricing
    output: 0.0070,
  },
};

// --- Core Functions ---

/**
 * Initializes the tracker with the authenticated user's profile.
 * This should be called once on login or when the user profile is first loaded.
 * @param user - The `UserProfile` object of the currently logged-in user.
 */
export function init(user: UserProfile) {
  currentUser = user; 
  console.log('Token Tracker Initialized/Updated for user:', user.email);
}

/**
 * Resets the tracker by clearing the current user.
 * This should be called on logout to prevent logging events for a non-existent session.
 */
export function reset() {
  currentUser = null;
  console.log('Token Tracker Reset.');
}

/**
 * A simple, client-side approximation for token counting.
 * Since the client-side SDK doesn't expose a precise tokenizer, this uses a common
 * rule of thumb where 1 token is roughly equivalent to 4 characters of text.
 * @param text - The string to estimate the token count for.
 * @returns The estimated number of tokens.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Logs a new AI interaction event to Firestore. This function performs two "fire-and-forget"
 * operations, meaning it initiates the writes but doesn't wait for them to complete,
 * allowing the UI to remain responsive.
 * 
 * 1.  It atomically increments the aggregate `tokensUsedTotal` and `estimatedCostTotal` on the user's profile document.
 * 2.  It creates a new, detailed document in the `tokenEvents` collection for granular analytics.
 * 
 * @param data - An object containing details about the Gemini API call.
 * @param forUser - An optional UserProfile. If provided, the event is logged for this user. If not, it defaults to the currently logged-in user.
 */
export async function logEvent(
  data: {
    feature: TokenEvent['feature'];
    model: string;
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens?: number;
    sessionId: string;
  },
  forUser?: UserProfile | null
) {
  const userToLog = forUser || currentUser;

  if (!userToLog) {
    console.warn('Token Tracker not initialized or no user context provided, skipping log.');
    return;
  }

  const totalTokens = data.inputTokens + (data.cachedInputTokens || 0) + data.outputTokens;
  const pricing = MODEL_PRICING[data.model] || { input: 0, output: 0 };
  const cost = ((data.inputTokens / 1000) * pricing.input) + ((data.outputTokens / 1000) * pricing.output);

  // Update aggregate totals on the user's profile document. This is a "fire-and-forget"
  // operation; we don't `await` it so the UI isn't blocked.
  usersRepo.incrementTokenUsage(userToLog.uid, totalTokens, cost).catch(error => {
    // We log the error but don't re-throw, as failing to update analytics shouldn't break the user experience.
    console.error("Failed to update aggregate token usage in Firestore:", error);
  });

  const newEvent: Omit<TokenEvent, 'id'> = {
    uid: userToLog.uid,
    sessionId: data.sessionId,
    userId: userToLog.email,
    userName: `${userToLog.firstName} ${userToLog.lastName}`,
    timestamp: new Date().toISOString(),
    feature: data.feature,
    model: data.model,
    inputTokens: data.inputTokens,
    cachedInputTokens: data.cachedInputTokens || 0,
    outputTokens: data.outputTokens,
    environment: currentEnv,
    account: currentAccount,
    fundCode: userToLog.fundCode,
  };

  // Create a detailed log document in the tokenEvents collection. This is also fire-and-forget.
  tokenEventsRepo.add(newEvent).catch(error => {
      console.error("Failed to log token event to Firestore:", error);
  });
}