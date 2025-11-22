// --- Base Data Structures ---
import type { Fund } from './data/fundData';

/**
 * Represents a standard physical address.
 * Used for both primary and mailing addresses in the UserProfile.
 */
export interface Address {
  country: string;
  street1: string;
  street2?: string; // Optional field for apartment, suite, etc.
  city: string;
  state: string;
  zip: string;
}

/**
 * Defines the possible states of an applicant's class verification process for a specific fund.
 * - 'unknown': The initial state before any verification has been attempted.
 * - 'pending': The verification process has been initiated but is not yet complete.
 * - 'passed': The user has successfully been verified for the fund.
 * - 'failed': The user failed the verification process.
 */
export type ClassVerificationStatus = 'unknown' | 'pending' | 'passed' | 'failed';

/**
 * Defines the user's eligibility status to apply for a grant from a specific fund.
 * This is typically determined after a successful class verification.
 */
export type EligibilityStatus = 'Eligible' | 'Not Eligible';

/**
 * Represents the eligibility status for a specific user identity.
 * (Currently not in active use, but available for more granular eligibility tracking).
 */
export interface IdentityEligibility {
  identityId: string;
  status: EligibilityStatus;
  updatedAt: string;
}

/**
 * A unique identifier for a FundIdentity, typically a composite of user email and fund code.
 * Example: `user-uid-DOM`
 */
export type FundIdentityId = string;

/**
 * Represents a user's relationship with a specific relief fund.
 * A single user (identified by `uid`) can have multiple identities if they are
 * eligible for more than one fund. Each identity is stored as a separate document in Firestore.
 */
export interface FundIdentity {
  id: FundIdentityId;
  uid: string; // The user's Firebase Auth UID.
  fundCode: string;
  fundName: string; // Denormalized for easy display in the UI.
  cvType: 'Domain' | 'Roster' | 'SSO' | 'Manual'; // The method used for class verification.
  eligibilityStatus: EligibilityStatus;
  classVerificationStatus: ClassVerificationStatus;
  createdAt: string; // ISO 8601 timestamp string.
  lastUsedAt?: string; // Tracks the last time this identity was the active one, used for sorting.
}
/**
 * A lightweight object representing the currently active fund identity for the logged-in user.
 * This is held in the main App state to determine which fund's applications and data are displayed.
 */
export interface ActiveIdentity {
  id: FundIdentityId;
  fundCode: string;
}

// FIX: Add a centralized Page type for navigation.
/**
 * A centralized type for all possible page routes in the application.
 * Using a single type ensures type-safe navigation and prevents magic strings.
 */
export type Page = 'login' | 'register' | 'home' | 'apply' | 'profile' | 'support' | 'submissionSuccess' | 'tokenUsage' | 'faq' | 'paymentOptions' | 'donate' | 'classVerification' | 'eligibility' | 'fundPortal' | 'ticketing' | 'programDetails' | 'proxy' | 'liveDashboard' | 'myApplications' | 'myProxyApplications' | 'forgotPassword' | 'reliefQueue' | 'aiApply' | 'applyExpenses';


/**
 * The main data model for a user's profile information.
 * This is a composite object that also reflects the state of their currently active FundIdentity
 * (e.g., fundCode, fundName, eligibilityStatus), which are denormalized here for performance.
 */
export interface UserProfile {
  uid: string; // The user's Firebase Auth UID.
  identityId: string; // Corresponds to the user's primary identifier, usually their email.
  // FIX: Added 'activeIdentityId' to track the user's currently selected fund identity.
  activeIdentityId: string | null; // The ID of the currently active document in the `identities` collection.
  firstName: string;
  lastName:string;
  middleName?: string;
  suffix?: string;
  email: string; // Should be read-only after creation.
  mobileNumber: string;
  primaryAddress: Address;
  mailingAddress?: Address;
  employmentStartDate: string; // ISO 8601 date string (YYYY-MM-DD).
  eligibilityType: string;
  householdIncome: number | ''; // Empty string represents an unanswered field in the form.
  householdSize: number | ''; // Empty string represents an unanswered field in the form.
  homeowner: 'Yes' | 'No' | ''; // Empty string represents an unanswered field in the form.
  preferredLanguage?: string;
  isMailingAddressSame: boolean | null; // null represents "not yet answered".
  ackPolicies: boolean;
  commConsent: boolean;
  infoCorrect: boolean;
  reliefQueueTicket?: string; // Unique ticket number for users in the relief queue.
  // --- Denormalized fields from the active FundIdentity for quick access ---
  fundCode: string; // The fund code of the *active* identity.
  fundName?: string; // The fund name of the *active* identity.
  classVerificationStatus: ClassVerificationStatus; // Status for the *active* identity.
  eligibilityStatus: EligibilityStatus; // Status for the *active* identity.
  // --- Authorization and Analytics ---
  role: 'User' | 'Admin'; // The source of truth for the Firebase Auth custom claim. This is a synchronized copy.
  tokensUsedTotal?: number; // Aggregated total from all token events for this user.
  estimatedCostTotal?: number; // Aggregated total cost from all token events.
}

/**
 * Represents a single expense item within a relief application.
 */
export interface Expense {
  id: string; // A unique identifier for the expense item.
  type: 'Basic Disaster Supplies' | 'Food Spoilage' | 'Meals' | ''; // Empty string for new/unselected items.
  amount: number | ''; // Empty string for empty form fields.
  fileName: string; // Name of the uploaded receipt file, if any.
  fileUrl?: string; // URL to the uploaded file in Firebase Storage.
}

/**
 * Contains all data related to the specific event for which a user is applying for relief.
 */
export interface EventData {
  event: string; // The primary type of event (e.g., 'Flood', 'Wildfire').
  eventName?: string; // The specific name of the event, e.g., "Hurricane Ian"
  otherEvent?: string; // Details if 'My disaster is not listed' is selected.
  eventDate: string; // ISO 8601 date string (YYYY-MM-DD).
  evacuated: 'Yes' | 'No' | '';
  evacuatingFromPrimary?: 'Yes' | 'No' | '';
  evacuationReason?: string;
  stayedWithFamilyOrFriend?: 'Yes' | 'No' | '';
  evacuationStartDate?: string; // ISO 8601 date string (YYYY-MM-DD).
  evacuationNights?: number | '';
  powerLoss: 'Yes' | 'No' | '';
  powerLossDays?: number | '';
  additionalDetails?: string;
  requestedAmount: number;
  expenses: Expense[];
}

/**
 * A composite object representing the complete state of an application form during the submission process.
 * This structure is passed between the different steps of the application flow.
 */
export interface ApplicationFormData {
  profileData: UserProfile;
  eventData: EventData;
  agreementData: {
    shareStory: boolean | null; // null represents "not yet answered".
    receiveAdditionalInfo: boolean | null;
  };
}

/**
 * Represents a submitted application record, including the decision and resulting grant balances.
 * This interface extends EventData with metadata about the submission and decision.
 */
export interface Application extends EventData {
  id: string; // The Firestore document ID.
  uid: string; // The Firebase Auth UID of the applicant.
  profileSnapshot: UserProfile; // A snapshot of the user's profile at the time of submission for auditing.
  submittedDate: string; // ISO 8601 timestamp string.
  status: 'Submitted' | 'Awarded' | 'Declined'; // 'Submitted' implies Under Review.
  reasons: string[]; // Justification for the decision, can be from the rules engine or AI.
  decisionedDate: string; // ISO 8601 timestamp string.
  twelveMonthGrantRemaining: number; // The user's 12-month balance *after* this application's award.
  lifetimeGrantRemaining: number; // The user's lifetime balance *after* this application's award.
  shareStory: boolean;
  receiveAdditionalInfo: boolean;
  submittedBy: string; // UID of the user who submitted (can be applicant or admin proxy).
  isProxy: boolean; // True if submitted by an admin on behalf of a user.
}

/**
 * Represents the output of the eligibility decision engine (local or AI-assisted).
 * This provides a structured breakdown of the decision-making process for auditing and review.
 */
export interface EligibilityDecision {
  decision: 'Approved' | 'Denied' | 'Review'; // 'Review' means it requires manual intervention.
  reasons: string[]; // Human-readable reasons for the decision.
  policy_hits: { rule_id: string; passed: boolean; detail: string; }[]; // Audit trail of which rules passed or failed.
  recommended_award: number; // The calculated award amount.
  remaining_12mo: number; // The projected 12-month balance if approved.
  remaining_lifetime: number; // The projected lifetime balance if approved.
  normalized: {
    event: string;
    eventDate: string;
    evacuated: string;
    powerLossDays: number;
  };
  decisionedDate: string;
}

// --- Chat-related Types ---

/**
 * Defines the sender of a message in the chat interface.
 */
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  ERROR = 'error',
}

/**
 * Represents a single message within a chat conversation.
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

// --- AI Configuration Types ---

/**
 * Defines the configuration for a specific AI feature model.
 */
export interface ModelConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
}

/**
 * Keys for the different AI features available in the application.
 */
export type FeatureId = 'AI_APPLY' | 'AI_DECISIONING' | 'AI_ASSISTANT' | 'ADDRESS_PARSING' | 'APP_PARSING';


// --- Token Usage Analytics Types ---

/**
 * Defines the cost per 1000 tokens for input and output for a given Gemini model.
 */
export interface ModelPricing {
  [key: string]: {
    input: number; // Price per 1000 tokens
    output: number;
  };
}

/**
 * Represents a single logged event of a Gemini API call.
 * This is the raw data used for generating analytics, stored in the `tokenEvents` collection.
 */
export interface TokenEvent {
  id: string; // The Firestore document ID.
  sessionId: string; // Groups multiple calls within a single user interaction (e.g., one chat conversation).
  uid: string; // The user's Firebase Auth UID.
  userId: string; // The user's email, for easier filtering in analytics.
  userName: string; // The user's full name, denormalized for easier display.
  timestamp: string; // ISO 8601 timestamp string.
  feature: 'AI Assistant' | 'Address Parsing' | 'Application Parsing' | 'Final Decision' | 'AI Apply Chat';
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-3-pro-preview' | string; // String allowing for future models
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  environment: 'Production' | 'Development';
  account: string; // The client account name (e.g., 'E4E-Relief-Inc').
  fundCode: string; // The fund associated with this API call.
}

// FIX: Added missing type definitions for Token Usage Analytics.
/**
 * Represents a single row in the token usage table, aggregated by user, session, and feature.
 * This is a client-side derived type for display purposes.
 */
export interface TokenUsageTableRow {
  user: string; // email
  userName: string;
  date: string;
  session: string;
  feature: string;
  model: string; // Model used for this session/feature interaction
  fundCode: string;
  fundName: string;
  input: number;
  cached: number;
  output: number;
  total: number;
  cost: number;
}

/**
 * Defines the structure for the filters used on the token usage analytics page.
 */
export interface TokenUsageFilters {
  account: string;
  dateRange: {
    start: string;
    end: string;
  };
  feature: string;
  user: string;
  model: string;
  environment: string;
}

/**
 * Represents aggregated token usage data for the session with the highest token count.
 */
export interface TopSessionData {
  sessionId: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Represents aggregated daily token usage for a specific feature (like AI Assistant).
 */
export interface DailyUsageData {
  date: string; // YYYY-MM-DD
  totalTokens: number;
}

/**
 * Represents a single data point for real-time charts, like usage over the last hour.
 */
export interface LastHourUsageDataPoint {
  timestamp: string; // ISO 8601 timestamp string.
  totalTokens: number;
}

/**
 * Represents aggregated token usage data for the user with the highest token count.
 */
export interface TopUserData {
  userName: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
}