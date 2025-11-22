import { GoogleGenAI, Chat, FunctionDeclaration, Type, Content } from "@google/genai";
import type { Application, Address, UserProfile, ApplicationFormData, EventData, EligibilityDecision, ChatMessage, Expense, FeatureId } from '../types';
import type { Fund } from '../data/fundData';
import { logEvent as logTokenEvent, estimateTokens } from './tokenTracker';
import { allEventTypes, employmentTypes, languages, expenseTypes } from '../data/appData';
import { AI_GUARDRAILS } from '../config/aiGuardrails';
import { modelConfigService } from './modelConfigurationService';

// Default model name used for generic logging or when specific feature config isn't retrievable.
// This resolves import errors in components that rely on this constant.
export const MODEL_NAME = 'gemini-2.5-flash';

// Initialize the Google Gemini AI client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a unique session ID for tracking a series of related AI interactions,
 * such as a single chat conversation or an application parsing event.
 * @param prefix - A string to prepend to the session ID for context (e.g., 'ai-chat').
 * @returns A unique session ID string.
 */
const generateSessionId = (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

// Define the JSON schema for an address object. This is used by Gemini for function calling
// and for generating structured JSON output when parsing addresses.
const addressSchema = {
    type: Type.OBJECT,
    properties: {
        country: { type: Type.STRING, description: "The country of the address." },
        street1: { type: Type.STRING, description: "The primary street line of the address." },
        street2: { type: Type.STRING, description: "The secondary street line (e.g., apartment number)." },
        city: { type: Type.STRING, description: "The city of the address." },
        state: { type: Type.STRING, description: "The state or province of the address." },
        zip: { type: Type.STRING, description: "The ZIP or postal code of the address." },
    }
};

/**
 * Defines the `updateUserProfile` tool for the Gemini model. This allows the AI
 * to request an update to the user's profile based on the conversation. The schema
 * tells the model what fields it can update and what type of data is expected.
 */
const updateUserProfileTool: FunctionDeclaration = {
  name: 'updateUserProfile',
  description: 'Updates the user profile information based on details provided in the conversation. Can be used for one or more fields at a time.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      firstName: { type: Type.STRING, description: 'The user\'s first name.' },
      middleName: { type: Type.STRING, description: 'The user\'s middle name.' },
      lastName: { type: Type.STRING, description: 'The user\'s last name.' },
      suffix: { type: Type.STRING, description: 'A suffix for the user\'s name, like Jr. or III.' },
      mobileNumber: { type: Type.STRING, description: 'The user\'s mobile phone number.' },
      primaryAddress: { ...addressSchema, description: "The user's primary residential address." },
      employmentStartDate: { type: Type.STRING, description: 'The date the user started their employment, in YYYY-MM-DD format.' },
      eligibilityType: { type: Type.STRING, description: 'The user\'s employment type.', enum: employmentTypes },
      householdIncome: { type: Type.NUMBER, description: 'The user\'s estimated annual household income as a number.' },
      householdSize: { type: Type.NUMBER, description: 'The number of people in the user\'s household.' },
      homeowner: { type: Type.STRING, description: 'Whether the user owns their home.', enum: ['Yes', 'No'] },
      preferredLanguage: { type: Type.STRING, description: "The user's preferred language for communication.", enum: languages },
      ackPolicies: { type: Type.BOOLEAN, description: "User confirms they have read and agree to the Privacy Policy and Cookie Policy." },
      commConsent: { type: Type.BOOLEAN, description: "User consents to receive emails and text messages regarding their application." },
      infoCorrect: { type: Type.BOOLEAN, description: "User confirms that all information provided is accurate." },
    },
  },
};

/**
 * Defines the `startOrUpdateApplicationDraft` tool for the Gemini model. This allows the AI
 * to proactively create or modify a draft application with event details mentioned by the user
 * in the chat.
 */
const startOrUpdateApplicationDraftTool: FunctionDeclaration = {
  name: 'startOrUpdateApplicationDraft',
  description: 'Creates or updates a draft for a relief application with event-specific details.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      event: { type: Type.STRING, description: "The type of event the user is applying for relief from.", enum: allEventTypes },
      eventName: { type: Type.STRING, description: "The official name of the hurricane or tropical storm, if applicable." },
      otherEvent: { type: Type.STRING, description: "The user-specified disaster if 'My disaster is not listed' is the event type." },
      eventDate: { type: Type.STRING, description: "The date the disaster occurred, in YYYY-MM-DD format." },
      evacuated: { type: Type.STRING, description: "Whether the user evacuated or plans to.", enum: ['Yes', 'No'] },
      evacuatingFromPrimary: { type: Type.STRING, description: "Whether the evacuation is from their primary residence.", enum: ['Yes', 'No'] },
      evacuationReason: { type: Type.STRING, description: "The reason for evacuation if not from primary residence." },
      stayedWithFamilyOrFriend: { type: Type.STRING, description: "Whether the user stayed with family or friends during evacuation.", enum: ['Yes', 'No'] },
      evacuationStartDate: { type: Type.STRING, description: "The start date of the evacuation, in YYYY-MM-DD format." },
      evacuationNights: { type: Type.NUMBER, description: "The number of nights the user was or will be evacuated." },
      powerLoss: { type: Type.STRING, description: "Whether the user lost power for more than 4 hours.", enum: ['Yes', 'No'] },
      powerLossDays: { type: Type.NUMBER, description: "The number of days the user was without power." },
      additionalDetails: { type: Type.STRING, description: "Any additional details provided by the user about their situation." },
    },
  },
};

const addOrUpdateExpenseTool: FunctionDeclaration = {
  name: 'addOrUpdateExpense',
  description: 'Adds or updates one or more expense items to the application draft. Can process a list of expenses provided by the user in a single message.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        expenses: {
            type: Type.ARRAY,
            description: "An array of expense items.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        description: "The type of expense. Must be one of the available enum options. You must match the user's description of an expense to the closest possible enum value. For example, if the user says 'disaster supplies' or 'basic supplies', you must use the value 'Basic Disaster Supplies'.",
                        enum: expenseTypes
                    },
                    amount: { type: Type.NUMBER, description: "The cost of the expense." },
                },
                required: ['type', 'amount'],
            }
        }
    },
    required: ['expenses'],
  },
};

const updateAgreementsTool: FunctionDeclaration = {
  name: 'updateAgreements',
  description: "Updates the user's agreement choices for the application.",
  parameters: {
    type: Type.OBJECT,
    properties: {
        shareStory: { type: Type.BOOLEAN, description: "User's choice to share their story." },
        receiveAdditionalInfo: { type: Type.BOOLEAN, description: "User's choice to receive additional info." },
    },
  },
};


/**
 * The base system instruction (or "meta-prompt") for the AI Relief Assistant.
 * This prompt defines the AI's persona, capabilities, goals, and conversational flow.
 * It's a critical piece of prompt engineering that governs the chatbot's behavior.
 */
const applicationContext = `
You are the Relief Application Assistant, an expert AI chatbot for the 'E4E Relief' application.

Your **PRIMARY GOAL** is to answer user questions and help them update their profile information. You also guide users to the correct place to start their application.

**IMPORTANT**: You CANNOT create or update an application yourself. If a user expresses any intent to apply, fill out an application, or describes their situation for relief, you MUST direct them to the "AI Apply" page. Do not ask them for application details.

**Your Capabilities & Tools**:
- You can update a user's profile information (like name, address, or phone number) using the \`updateUserProfile\` tool.
- You can answer general questions about the application process, pages (Home, Apply, Profile, Support), and how to get support.

**Conversational Flow**:
1.  **Identify Intent**: Listen to the user's request.
2.  **Application Intent**: If the user wants to apply for relief (e.g., "I need help," "I was in a flood," "how do I apply?"), respond by guiding them to the "AI Apply" page. For example: "It sounds like you're ready to apply for relief. The best place for that is the 'AI Apply' page, where a dedicated assistant can guide you through the process step-by-step."
3.  **Profile Update Intent**: If the user provides new personal information (e.g., "My new phone number is..."), use the \`updateUserProfile\` tool to save it. After the tool call, confirm your action: "Thanks, I've updated your profile with the new phone number."
4.  **General Question**: If the user asks a question, answer it concisely based on the application context below.

---
**Application Context for Q&A**:
- **Purpose**: The app allows users to apply for financial assistance during times of need. To start an application, users should go to the "AI Apply" page.
- **Support Info**: Email is support@e4erelief.example, Phone is (800) 555-0199.
- **Fund Details**: For any questions about what events are covered or what the grant limits are, you MUST use the information provided under "Current Fund Information" and not your general knowledge.

**Response Style**:
- Your answers MUST be short and concise. Get straight to the point.
- When you provide a list of items, you MUST format it as a clean, bulleted list using hyphens.
- Do NOT use asterisks. Keep the text clean.
---
`;

const getAIApplyContext = (userProfile: UserProfile | null, applicationDraft: Partial<ApplicationFormData> | null): string => {
    let dynamicContext = `
You are the E4E Relief AI assistant, with a single, highly-focused mission on this page.

**Your ONLY GOAL**: Help the user complete their application by asking questions to fill the 'Missing Information' list below.

**!! STRICT GUARDRAILS - YOU MUST OBEY !!**
- **DO NOT ANSWER USER QUESTIONS.** Your only function is to ask for the next piece of missing information.
- **NEVER REVEAL LOGIC.** Do not explain why information is needed or what makes someone eligible or ineligible.
- **NEVER DISCUSS ELIGIBILITY.** If the user asks if they are eligible, if an event is covered, about grant amounts, or any other policy question, you MUST respond with: "My role is to help you complete the application. For questions about eligibility or fund rules, please see the 'Support' page."
- **FOCUS ON THE CURRENT SECTION.** The application has multiple sections: **Additional Details**, **Profile Acknowledgements**, **Event Details**, **Expenses**, and **Final Agreements**. You must complete them **IN ORDER**. Do not jump ahead.
- **PROFILE ACKNOWLEDGEMENTS:** This is a MANDATORY section. Even if you just updated the Additional Details, you **MUST STOP** and ask the user to confirm the acknowledgement statements (Privacy Policy, Communication Consent, and Accuracy) before asking about the Event. The checkboxes in the UI are for display only; the user must confirm with you.

**Your Process**:
1.  **Analyze & Infer**: The user's message may contain answers to one or more questions. For example, if a user mentions "hurricane," you MUST infer the 'event' field is 'Tropical Storm/Hurricane' in addition to extracting the 'eventName'. Be proactive.
2.  **Act**: Use your tools (\`updateUserProfile\`, \`startOrUpdateApplicationDraft\`, \`addOrUpdateExpense\`, \`updateAgreements\`) to save ALL the information you can gather from the user's message in a single turn.
3.  **Confirm**: After a successful tool call, briefly confirm what you saved. Example: "Thanks, I've noted the event date."
4.  **Ask**: Look at the updated 'Missing Information' list. Ask for the single NEXT item that is still missing from the CURRENT section. Be direct. Example: "What was the date of the event?"
    - **Sequence Rule**: You MUST collect 'Additional Details' first. Once those are done, you MUST collect 'Profile Acknowledgements'. Only when ALL acknowledgements are confirmed can you move to 'Event Details'.
5.  **Transition**: Once a section is complete, tell the user you will now move on to the next section.
    - **Example (Profile -> Acknowledgements)**: "That completes your profile details. Next, please confirm the following acknowledgements."
    - **Example (Acknowledgements -> Event)**: "Thank you for confirming. Now let's talk about your Event Details."
    - **CRITICAL RULE**: Do NOT say you are moving on to expenses if the 'Event Details' list under 'Missing Information' is NOT empty.
    - **IMPORTANT - EXPENSE SECTION**: After transitioning to expenses, you MUST ask for the amount for each expense type ONE BY ONE. Do NOT ask a general question like "What expenses did you have?". Your first question MUST be for the first expense in the 'Expense Details' list. Example: "What was your total for Basic Disaster Supplies?"
6.  **Complete & Hand-off**: When the 'Missing Information to Collect' list shows 'All details are complete', your final task is to instruct the user to perform the manual submission steps. Your final message MUST clearly tell them to go to the 'Agreements & Submission' section, check the box to agree to the 'Terms of Acceptance', and then click the 'Submit Application' button.

You have access to the \`updateUserProfile\`, \`startOrUpdateApplicationDraft\`, \`addOrUpdateExpense\`, and \`updateAgreements\` tools.
---
`;
    // Combine the base user profile with any data already entered in the current application draft.
    const combinedProfile = { ...userProfile, ...(applicationDraft?.profileData || {}) };
    const combinedEvent = { ...(applicationDraft?.eventData || {}) };
    const combinedAgreements = { ...(applicationDraft?.agreementData || {}) };

    const currentProfileInfo: string[] = [];
    if (combinedProfile.employmentStartDate) currentProfileInfo.push(`Employment Start Date: ${combinedProfile.employmentStartDate}`);
    if (combinedProfile.eligibilityType) currentProfileInfo.push(`Eligibility Type: ${combinedProfile.eligibilityType}`);
    if (combinedProfile.householdIncome) currentProfileInfo.push(`Household Income: ${combinedProfile.householdIncome}`);
    if (combinedProfile.householdSize) currentProfileInfo.push(`Household Size: ${combinedProfile.householdSize}`);
    if (combinedProfile.homeowner) currentProfileInfo.push(`Homeowner: ${combinedProfile.homeowner}`);
    if (combinedProfile.preferredLanguage) currentProfileInfo.push(`Preferred Language: ${combinedProfile.preferredLanguage}`);
    if (combinedProfile.ackPolicies) currentProfileInfo.push(`Policies Agreed: Yes`);
    if (combinedProfile.commConsent) currentProfileInfo.push(`Comm Consent: Yes`);
    if (combinedProfile.infoCorrect) currentProfileInfo.push(`Info Correct: Yes`);
    
    const currentEventInfo: string[] = [];
    if (combinedEvent.event) currentEventInfo.push(`Event Type: ${combinedEvent.event}`);
    if (combinedEvent.eventName) currentEventInfo.push(`Event Name: ${combinedEvent.eventName}`);
    if (combinedEvent.eventDate) currentEventInfo.push(`Event Date: ${combinedEvent.eventDate}`);
    if (combinedEvent.powerLoss) currentEventInfo.push(`Power Loss: ${combinedEvent.powerLoss}`);
    if (combinedEvent.powerLossDays) currentEventInfo.push(`Power Loss Days: ${combinedEvent.powerLossDays}`);
    if (combinedEvent.evacuated) currentEventInfo.push(`Evacuated: ${combinedEvent.evacuated}`);
    if (combinedEvent.evacuatingFromPrimary) currentEventInfo.push(`Evacuating From Primary: ${combinedEvent.evacuatingFromPrimary}`);
    if (combinedEvent.evacuationReason) currentEventInfo.push(`Evacuation Reason: Provided`);
    if (combinedEvent.stayedWithFamilyOrFriend) currentEventInfo.push(`Stayed with Family/Friend: ${combinedEvent.stayedWithFamilyOrFriend}`);
    if (combinedEvent.evacuationStartDate) currentEventInfo.push(`Evacuation Start Date: ${combinedEvent.evacuationStartDate}`);
    if (combinedEvent.evacuationNights) currentEventInfo.push(`Evacuation Nights: ${combinedEvent.evacuationNights}`);
    if (combinedEvent.expenses && combinedEvent.expenses.length > 0) {
        const expenseList = combinedEvent.expenses.map(e => `${e.type}: $${e.amount}`).join('; ');
        currentEventInfo.push(`Expenses: ${expenseList}`);
    }


    if ([...currentProfileInfo, ...currentEventInfo].length > 0) {
        dynamicContext += `
**Current Information Known**:
${currentProfileInfo.length > 0 ? `\n*Profile Details*\n- ` + currentProfileInfo.join('\n- ') : ''}
${currentEventInfo.length > 0 ? `\n*Event Details*\n- ` + currentEventInfo.join('\n- ') : ''}
---
`;
    }

    const missingBasicProfileFields: string[] = [];
    if (!combinedProfile.employmentStartDate) missingBasicProfileFields.push('Employment Start Date (YYYY-MM-DD format)');
    if (!combinedProfile.eligibilityType) missingBasicProfileFields.push(`Eligibility Type (one of: ${employmentTypes.join(', ')})`);
    if (combinedProfile.householdIncome === '' || combinedProfile.householdIncome === undefined || combinedProfile.householdIncome === null) missingBasicProfileFields.push('Estimated Annual Household Income (as a number)');
    if (combinedProfile.householdSize === '' || combinedProfile.householdSize === undefined || combinedProfile.householdSize === null) missingBasicProfileFields.push('Number of people in household (as a number)');
    if (!combinedProfile.homeowner) missingBasicProfileFields.push('Homeowner status (Yes or No)');
    if (!combinedProfile.preferredLanguage) missingBasicProfileFields.push('Preferred Language');
    
    // Note: we check basicProfileComplete later to decide if we can move to Events, 
    // but we ALWAYS list the missing acknowledgements so the AI knows they are part of the required flow.
    // This prevents the AI from jumping straight to Event details if it thinks "Basic Profile" is the only part of "Profile".

    const missingAcknowledgementFields: string[] = [];
    if (!combinedProfile.ackPolicies) missingAcknowledgementFields.push('Agreement to Privacy Policy and Cookie Policy (ackPolicies: true)');
    if (!combinedProfile.commConsent) missingAcknowledgementFields.push('Consent to receive emails and texts (commConsent: true)');
    if (!combinedProfile.infoCorrect) missingAcknowledgementFields.push('Confirmation that all information is accurate (infoCorrect: true)');

    // Logic for transitions
    const basicProfileComplete = missingBasicProfileFields.length === 0;
    const allProfileComplete = basicProfileComplete && missingAcknowledgementFields.length === 0;

    const missingEventFields: string[] = [];
    // Only move to event details if ALL profile sections (basic + acknowledgements) are done
    if (allProfileComplete) {
        if (!combinedEvent.event) missingEventFields.push('The type of disaster experienced (event)');
        if (combinedEvent.event === 'Tropical Storm/Hurricane' && !combinedEvent.eventName) missingEventFields.push("The name of the event (eventName), *only if it's a Tropical Storm/Hurricane*");
        if (!combinedEvent.eventDate) missingEventFields.push("Date of the event (eventDate)");
        if (!combinedEvent.powerLoss) missingEventFields.push("If they lost power for more than 4 hours (powerLoss: 'Yes' or 'No')");
        if (combinedEvent.powerLoss === 'Yes' && (!combinedEvent.powerLossDays || combinedEvent.powerLossDays <= 0)) missingEventFields.push("How many days they were without power (powerLossDays), *only if powerLoss is 'Yes'*");
        if (!combinedEvent.evacuated) missingEventFields.push("If they evacuated or plan to (evacuated: 'Yes' or 'No')");
        if (combinedEvent.evacuated === 'Yes') {
            if (!combinedEvent.evacuatingFromPrimary) missingEventFields.push("If they are evacuating from their primary residence (evacuatingFromPrimary), *only if evacuated is 'Yes'*");
            if (combinedEvent.evacuatingFromPrimary === 'No' && !combinedEvent.evacuationReason) missingEventFields.push("The reason for evacuation if not from primary residence (evacuationReason)");
            if (!combinedEvent.stayedWithFamilyOrFriend) missingEventFields.push("Did they stay with family or a friend (stayedWithFamilyOrFriend), *only if evacuated is 'Yes'*");
            if (!combinedEvent.evacuationStartDate) missingEventFields.push("Evacuation start date (evacuationStartDate), *only if evacuated is 'Yes'*");
            if (!combinedEvent.evacuationNights || combinedEvent.evacuationNights <= 0) missingEventFields.push("How many nights they were evacuated (evacuationNights), *only if evacuated is 'Yes'*");
        }
    }

    const allEventFieldsComplete = allProfileComplete && missingEventFields.length === 0;

    const missingExpenseFields: string[] = [];
    if (allEventFieldsComplete) {
        const knownExpenseTypes = new Set((combinedEvent.expenses || []).map(e => e.type));
        expenseTypes.forEach(type => {
            if (!knownExpenseTypes.has(type)) {
                missingExpenseFields.push(`Amount for '${type}'`);
            }
        });
    }

    const allExpensesComplete = allEventFieldsComplete && missingExpenseFields.length === 0;
    
    const missingAgreementFields: string[] = [];
    if (allExpensesComplete) {
        if (combinedAgreements.shareStory === null || combinedAgreements.shareStory === undefined) {
            missingAgreementFields.push("If they are willing to share their story (shareStory: true or false)");
        }
        if (combinedAgreements.receiveAdditionalInfo === null || combinedAgreements.receiveAdditionalInfo === undefined) {
            missingAgreementFields.push("If they are interested in receiving additional information (receiveAdditionalInfo: true or false)");
        }
    }

    if ([...missingBasicProfileFields, ...missingAcknowledgementFields, ...missingEventFields, ...missingExpenseFields, ...missingAgreementFields].length > 0) {
        dynamicContext += `
**Missing Information to Collect**:
${missingBasicProfileFields.length > 0 ? `\n*Additional Details*\n- ` + missingBasicProfileFields.join('\n- ') : ''}
${missingAcknowledgementFields.length > 0 ? `\n*Profile Acknowledgements* (ASK THESE NEXT if Additional Details are empty)\n- ` + missingAcknowledgementFields.join('\n- ') : ''}
${missingEventFields.length > 0 ? `\n*Event Details*\n- ` + missingEventFields.join('\n- ') : ''}
${missingExpenseFields.length > 0 ? `\n*Expense Details*\n- ` + missingExpenseFields.join('\n- ') : ''}
${missingAgreementFields.length > 0 ? `\n*Final Agreements*\n- ` + missingAgreementFields.join('\n- ') : ''}
`;
    } else {
        dynamicContext += `
**Missing Information to Collect**:
- All details are complete.
`;
    }

    return dynamicContext;
};


/**
 * Creates a new chat session with the Gemini model.
 * It dynamically constructs the system instruction by injecting user-specific context,
 * such as their active fund's details, application history, and language preference.
 * @param userProfile - The current user's profile.
 * @param activeFund - The configuration for the user's currently active fund.
 * @param applications - The user's past applications.
 * @param history - The recent chat history to seed the new session with.
 * @param context - The context of the chat, determines the system prompt and tools used.
 * @param applicationDraft - The current application draft, used for the 'aiApply' context.
 * @returns A `Chat` session object from the @google/genai SDK.
 */
export function createChatSession(
    userProfile: UserProfile | null, 
    activeFund: Fund | null, 
    applications?: Application[], 
    history?: ChatMessage[],
    context: 'general' | 'aiApply' = 'general',
    applicationDraft: Partial<ApplicationFormData> | null = null
): Chat {
  let dynamicContext;
  let tools;
  let featureId: FeatureId;

  if (context === 'aiApply') {
    dynamicContext = getAIApplyContext(userProfile, applicationDraft);
    tools = [{ functionDeclarations: [updateUserProfileTool, startOrUpdateApplicationDraftTool, addOrUpdateExpenseTool, updateAgreementsTool] }];
    featureId = 'AI_APPLY';
  } else {
    dynamicContext = applicationContext;
    tools = [{ functionDeclarations: [updateUserProfileTool] }];
    featureId = 'AI_ASSISTANT';
  }

  // Personalize the chat experience by instructing the model to respond in the user's preferred language.
  if (userProfile && userProfile.preferredLanguage && userProfile.preferredLanguage.toLowerCase() !== 'english') {
    dynamicContext += `\n**User's Language Preference**: The user's preferred language is ${userProfile.preferredLanguage}. You MUST respond in ${userProfile.preferredLanguage}.`;
  }
  
  // For the general assistant, provide fund-specific and historical context.
  // The AI Apply assistant is strictly firewalled from this information to keep it focused on data collection.
  if (context !== 'aiApply') {
      // If an active fund is available, inject its specific details (name, limits, covered events) into the prompt.
      // This grounds the model in the correct data and prevents it from hallucinating or using general knowledge.
      if (activeFund) {
        dynamicContext = dynamicContext.replace(
          "for the 'E4E Relief' application",
          `for the '${activeFund.name}' application`
        );
        const limits = activeFund.limits;
        const allCoveredEvents = [...activeFund.eligibleDisasters, ...activeFund.eligibleHardships];

        const fundDetails = `
**Current Fund Information (${activeFund.name})**:
- Single Request Maximum: $${limits.singleRequestMax.toLocaleString()}
- 12-Month Maximum: $${limits.twelveMonthMax.toLocaleString()}
- Lifetime Maximum: $${limits.lifetimeMax.toLocaleString()}

**What events are covered?**
The ${activeFund.name} covers a variety of events, including:
- ${allCoveredEvents.join('\n- ')}
`;
        dynamicContext += fundDetails;
      }

      // Provide the user's application history so the AI can answer questions about past submissions.
      if (applications && applications.length > 0) {
        const applicationList = applications.map(app => {
          const submittedDate = new Date(app.submittedDate);
          const formattedDate = submittedDate.toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/New_York' // Standardize to a common timezone for consistent output
          });
          let appDetails = `Application ID: ${app.id}\nEvent: ${app.event}\nAmount: $${app.requestedAmount}\nStatus: ${app.status}`;
          if (app.reasons && (app.status === 'Declined' || app.status === 'Submitted')) {
            appDetails += `\nDecision Reasons: ${app.reasons.join(' ')}`;
          }
          return appDetails;
        }).join('\n---\n');

        dynamicContext += `
**User's Application History**:
You have access to the user's submitted applications. If they ask about one, use this data. 
If an application status is 'Declined' or 'Submitted' (which means 'Under Review'), you MUST use the 'Decision Reasons' provided to explain why. Be direct and clear.
${applicationList}
`;
      } else {
        dynamicContext += `\nThe user currently has no submitted applications for this fund.`;
      }
  }

  // Map the application's ChatMessage format to the format required by the Gemini SDK.
  // CRITICAL FIX: Filter out 'error' role messages as Gemini SDK only accepts 'user' and 'model'.
  const validRoles = ['user', 'model'];
  const mappedHistory: Content[] | undefined = history
    ?.filter(m => validRoles.includes(m.role))
    .map(message => ({
      role: message.role,
      parts: [{ text: message.content }],
    }));
  
  const modelConfig = modelConfigService.getModelConfig(featureId);

  return ai.chats.create({
    model: modelConfig.model,
    history: mappedHistory,
    config: {
      systemInstruction: dynamicContext,
      tools: tools,
      maxOutputTokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
    },
  });
}

/**
 * A deterministic rules engine that performs a preliminary evaluation of an application.
 * This function checks for hard failures (e.g., exceeding grant limits, invalid dates)
 * before any AI processing is done. This ensures that core business rules are always enforced.
 * @param appData - The application data and current grant balances.
 * @returns An `EligibilityDecision` object with a decision of 'Approved', 'Denied', or 'Review'.
 */
export function evaluateApplicationEligibility(
  appData: {
    id: string;
    employmentStartDate: string;
    eventData: EventData;
    currentTwelveMonthRemaining: number;
    currentLifetimeRemaining: number;
    singleRequestMax: number;
    eligibleEvents: string[];
  }
): EligibilityDecision {
  const { eventData, currentTwelveMonthRemaining, currentLifetimeRemaining, employmentStartDate, singleRequestMax, eligibleEvents } = appData;
  
  // Capture the exact decision time before manipulating date objects for logic
  const decisionTimestamp = new Date().toISOString();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

  const policy_hits: EligibilityDecision['policy_hits'] = [];
  const reasons: string[] = [];
  let decision: EligibilityDecision['decision'] = 'Approved';

  const eventDateStr = eventData.eventDate || '';
  const eventDate = eventDateStr ? new Date(eventDateStr) : null;
  if (eventDate) {
    eventDate.setHours(0,0,0,0);
  }

  const requestedAmount = Number(eventData.requestedAmount) || 0;
  const normalizedEvent = eventData.event === 'My disaster is not listed' ? (eventData.otherEvent || '').trim() : (eventData.event || '').trim();
  
  // Rule R1: Event must be specified and eligible.
  if (!normalizedEvent) {
    decision = 'Denied';
    reasons.push("An event type must be selected. If 'My disaster is not listed' is chosen, the specific event must be provided.");
    policy_hits.push({ rule_id: 'R1', passed: false, detail: `Event field (201: ${eventData.event}, 202: ${eventData.otherEvent}) resulted in an empty event name.` });
  } else if (!eligibleEvents.includes(normalizedEvent)) {
    decision = 'Denied';
    reasons.push(`The selected event '${normalizedEvent}' is not covered by this fund.`);
    policy_hits.push({ rule_id: 'R1A', passed: false, detail: `Event '${normalizedEvent}' not found in eligible events list.` });
  } else {
    policy_hits.push({ rule_id: 'R1', passed: true, detail: `Event specified as '${normalizedEvent}'.` });
    policy_hits.push({ rule_id: 'R1A', passed: true, detail: `Event '${normalizedEvent}' is an eligible event.` });
  }

  // Rule R2: Event date must be within the last 90 days.
  if (!eventDate || isNaN(eventDate.getTime()) || eventDate < ninetyDaysAgo || eventDate > today) {
    decision = 'Denied';
    reasons.push(`Event date is older than 90 days or invalid. Event must be between ${ninetyDaysAgoStr} and today.`);
    policy_hits.push({ rule_id: 'R2', passed: false, detail: `Event date '${eventDateStr}' is outside the 90-day window starting from '${ninetyDaysAgoStr}'.` });
  } else {
    policy_hits.push({ rule_id: 'R2', passed: true, detail: `Event date '${eventDateStr}' is recent.` });
  }

  // Rule R3: Employment must have started before the event.
  const empStartDate = employmentStartDate ? new Date(employmentStartDate) : null;
  if (empStartDate) empStartDate.setHours(0,0,0,0);
  if (!empStartDate || isNaN(empStartDate.getTime()) || (eventDate && empStartDate > eventDate)) {
    decision = 'Denied';
    reasons.push("Employment start date is invalid or after the event date.");
    policy_hits.push({ rule_id: 'R3', passed: false, detail: `Employment start date '${employmentStartDate}' is after event date '${eventDateStr}'.` });
  } else {
    policy_hits.push({ rule_id: 'R3', passed: true, detail: 'Employment start date is valid.' });
  }

  // Rule R4/R5: Requested amount must be within all grant limits.
  if (requestedAmount <= 0) {
     decision = 'Denied';
     reasons.push(`Requested amount must be greater than zero.`);
     policy_hits.push({ rule_id: 'R4/R5', passed: false, detail: `Requested amount of $${requestedAmount.toFixed(2)} is not greater than zero.` });
  } else if (typeof singleRequestMax === 'number' && requestedAmount > singleRequestMax) {
    decision = 'Denied';
    reasons.push(`Requested amount of $${requestedAmount.toFixed(2)} exceeds the maximum of $${singleRequestMax.toFixed(2)}.`);
    policy_hits.push({ rule_id: 'R5', passed: false, detail: `Requested amount $${requestedAmount.toFixed(2)} exceeds absolute cap of $${singleRequestMax.toFixed(2)}.` });
  } else if (requestedAmount > currentTwelveMonthRemaining) {
    decision = 'Denied';
    reasons.push(`Requested amount of $${requestedAmount.toFixed(2)} exceeds the remaining 12-month limit of $${currentTwelveMonthRemaining.toFixed(2)}.`);
    policy_hits.push({ rule_id: 'R4', passed: false, detail: `Requested amount $${requestedAmount.toFixed(2)} exceeds 12-month limit $${currentTwelveMonthRemaining.toFixed(2)}.` });
  } else if (requestedAmount > currentLifetimeRemaining) {
    decision = 'Denied';
    reasons.push(`Requested amount of $${requestedAmount.toFixed(2)} exceeds the remaining lifetime limit of $${currentLifetimeRemaining.toFixed(2)}.`);
    policy_hits.push({ rule_id: 'R4', passed: false, detail: `Requested amount $${requestedAmount.toFixed(2)} exceeds lifetime limit $${currentLifetimeRemaining.toFixed(2)}.` });
  } else {
    policy_hits.push({ rule_id: 'R4', passed: true, detail: `Requested amount $${requestedAmount.toFixed(2)} is within all limits.` });
    policy_hits.push({ rule_id: 'R5', passed: true, detail: `Requested amount $${requestedAmount.toFixed(2)} is within absolute cap.` });
  }

  // If not denied, check for missing details that would require manual review.
  if (decision !== 'Denied') {
    // Rule R6: If evacuation or power loss is claimed, supporting details must be provided.
    if (eventData.evacuated === 'Yes') {
      const missingEvacFields = !eventData.evacuatingFromPrimary || !eventData.stayedWithFamilyOrFriend || !eventData.evacuationStartDate || !eventData.evacuationNights || eventData.evacuationNights <= 0;
      if (missingEvacFields) {
        decision = 'Review';
        reasons.push("Evacuation was indicated, but required details (e.g., evacuation start date, number of nights) are missing or invalid.");
        policy_hits.push({ rule_id: 'R6', passed: false, detail: 'Evacuation indicated (204: Yes) but required fields are missing or invalid.' });
      } else {
        policy_hits.push({ rule_id: 'R6', passed: true, detail: 'Evacuation fields are complete.' });
      }
    }

    if (eventData.powerLoss === 'Yes') {
      if (!eventData.powerLossDays || eventData.powerLossDays <= 0) {
        decision = 'Review';
        reasons.push("Power loss was indicated, but the number of days is missing or invalid.");
        policy_hits.push({ rule_id: 'R6', passed: false, detail: `Power loss indicated (210: Yes) but powerLossDays (211: ${eventData.powerLossDays || 'N/A'}) is invalid.` });
      } else {
        policy_hits.push({ rule_id: 'R6', passed: true, detail: 'Power loss fields are complete.' });
      }
    }
  }

  // Rule R7: Normalize data for consistency (e.g., if power loss is 'No', days must be 0).
  let normalizedPowerLossDays = Number(eventData.powerLossDays) || 0;
  if (eventData.powerLoss === 'No' && normalizedPowerLossDays > 0) {
    const originalDays = normalizedPowerLossDays;
    normalizedPowerLossDays = 0;
    policy_hits.push({ rule_id: 'R7', passed: true, detail: `PowerLoss was 'No' (210), but powerLossDays was ${originalDays}. Coerced to 0.` });
  }

  if (reasons.length === 0 && decision === 'Approved') {
    reasons.push("Application meets all automatic approval criteria.");
  }
  
  // Calculate final award and remaining balances.
  let recommended_award = 0;
  let remaining_12mo = currentTwelveMonthRemaining;
  let remaining_lifetime = currentLifetimeRemaining;

  if (decision === 'Approved') {
    recommended_award = Math.min(requestedAmount, currentTwelveMonthRemaining, currentLifetimeRemaining);
    remaining_12mo -= recommended_award;
    remaining_lifetime -= recommended_award;
  }
  
  return {
    decision,
    reasons,
    policy_hits,
    recommended_award,
    remaining_12mo,
    remaining_lifetime,
    normalized: {
      event: normalizedEvent,
      eventDate: eventDate?.toISOString().split('T')[0] || eventDateStr,
      evacuated: eventData.evacuated || '',
      powerLossDays: normalizedPowerLossDays
    },
    decisionedDate: decisionTimestamp
  };
}

// Defines the JSON schema for the AI's final decision output. This ensures the model
// responds in a predictable, structured format that the application can parse.
const finalDecisionSchema = {
    type: Type.OBJECT,
    properties: {
        finalDecision: { type: Type.STRING, enum: ['Approved', 'Denied'], description: "Your final decision." },
        finalReason: { type: Type.STRING, description: "A single, concise, and empathetic reason for your final decision. This will be shown to the user." },
        finalAward: { type: Type.NUMBER, description: "The calculated award amount if the decision is 'Approved', otherwise 0. It is the minimum of the requested amount, the 12-month remaining balance, and the lifetime remaining balance." }
    },
    required: ["finalDecision", "finalReason", "finalAward"]
};


/**
 * Uses Gemini to make a final, AI-assisted decision on an application.
 * This function is called after the deterministic rules engine. It provides the AI with all
 * application data and the preliminary decision, asking it to act as a final reviewer.
 * @param appData - The raw application data.
 * @param preliminaryDecision - The output from the `evaluateApplicationEligibility` function.
 * @param applicantProfile - The profile of the user for whom the application is being decided, for token logging.
 * @returns A final `EligibilityDecision` object, either from the AI or falling back to the preliminary one on error.
 */
export async function getAIAssistedDecision(
    appData: {
        eventData: EventData,
        currentTwelveMonthRemaining: number,
        currentLifetimeRemaining: number,
    },
    preliminaryDecision: EligibilityDecision,
    applicantProfile?: UserProfile | null
): Promise<EligibilityDecision> {
    // Critical safeguard: If the rules engine issued a hard denial, do not let the AI override it.
    // This prevents AI from approving an application that definitively breaks a core business rule.
    if (preliminaryDecision.decision === 'Denied') {
        return preliminaryDecision;
    }

    // This prompt engineers the AI to act as a "senior grant approver," giving it context and instructions
    // for making a final, holistic review. It is provided with all data and the preliminary findings.
    const prompt = `
        You are a senior grant approver AI. Your task is to perform a final review of a relief application.
        An automated, deterministic rules engine has already processed the application and provided a preliminary decision. You have the final say.

        **Instructions:**
        1.  **Review all provided information holistically.**
        2.  **Make a final decision:** 'Approved' or 'Denied'. Your decision is final.
        3.  **If you decide to approve**, you MUST calculate the final award amount. The award is the MINIMUM of these three values: the 'requestedAmount', the '12-Month Remaining' balance, and the 'Lifetime Remaining' balance. If you deny, the award is 0.
        4.  **Write a single, concise, and empathetic reason for your decision.** This will be shown directly to the applicant.
            -   **For Approvals:** Start with a positive confirmation. State the approved event and include the calculated award amount. Example: "Congratulations, your application for relief from the Flood has been approved for an award of $1500.00."
            -   **For Denials:** Be clear and direct, but empathetic. State the primary reason for the denial based on the preliminary findings. Example: "We're sorry, but your application could not be approved because the requested amount exceeds your available lifetime grant limit."
        5.  **Your response MUST be in JSON format and adhere to the specified schema.**

        ---
        APPLICANT'S SUBMITTED DATA:
        ${JSON.stringify(appData.eventData, null, 2)}
        
        CURRENT GRANT BALANCES:
        - 12-Month Remaining: $${appData.currentTwelveMonthRemaining}
        - Lifetime Remaining: $${appData.currentLifetimeRemaining}

        ---
        PRELIMINARY AUTOMATED DECISION:
        ${JSON.stringify(preliminaryDecision, null, 2)}
        ---
    `;
    
    const inputTokens = estimateTokens(prompt);
    const sessionId = generateSessionId('ai-decisioning');
    const modelConfig = modelConfigService.getModelConfig('AI_DECISIONING');

    try {
        const response = await ai.models.generateContent({
            model: modelConfig.model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: finalDecisionSchema,
                maxOutputTokens: modelConfig.maxTokens,
                temperature: modelConfig.temperature,
            },
        });
        
        const outputTokens = estimateTokens(response.text);
        logTokenEvent({ feature: 'Final Decision', model: modelConfig.model, inputTokens, outputTokens, sessionId }, applicantProfile);

        const jsonString = response.text.trim();
        const aiResponse = JSON.parse(jsonString) as { finalDecision: 'Approved' | 'Denied', finalReason: string, finalAward: number };

        // Recalculate remaining balances based on the AI's final award amount.
        const finalRecommendedAward = aiResponse.finalAward;
        let finalRemaining12mo = appData.currentTwelveMonthRemaining;
        let finalRemainingLifetime = appData.currentLifetimeRemaining;

        if (aiResponse.finalDecision === 'Approved') {
            finalRemaining12mo -= finalRecommendedAward;
            finalRemainingLifetime -= finalRecommendedAward;
        }

        // Return a new decision object, carrying over audit data but using the AI's final judgment.
        return {
            ...preliminaryDecision, // Carry over normalized data and policy hits for audit
            decision: aiResponse.finalDecision,
            reasons: [aiResponse.finalReason], // Use the AI's reason as the definitive one
            recommended_award: finalRecommendedAward,
            remaining_12mo: finalRemaining12mo,
            remaining_lifetime: finalRemainingLifetime,
        };

    } catch (error) {
        console.error("Gemini final decision failed:", error);
        // Fallback: If the AI call fails, trust the preliminary decision. This ensures the application
        // process isn't halted by an AI service interruption.
        return {
            ...preliminaryDecision,
            reasons: [...preliminaryDecision.reasons, "AI final review failed; this decision is based on the automated rules engine only."],
        };
    }
}


const addressJsonSchema = {
    type: Type.OBJECT,
    properties: {
        street1: { type: Type.STRING, description: "The primary street line, including street number and name. Formatted in Title Case (e.g., '123 Main St')." },
        street2: { type: Type.STRING, description: "The secondary street line (e.g., apartment, suite, or unit number). Formatted in Title Case (e.g., 'Apt 4B')." },
        city: { type: Type.STRING, description: "The city, formatted in Title Case (e.g., 'New York')." },
        state: { type: Type.STRING, description: "The state or province. For US addresses, use the uppercase 2-letter abbreviation (e.g., 'CA')." },
        zip: { type: Type.STRING, description: "The ZIP or postal code." },
        country: { type: Type.STRING, description: "The country, formatted in Title Case (e.g., 'United States')." },
    },
    required: ["street1", "city", "state", "zip", "country"]
};

/**
 * Uses Gemini to parse an unstructured address string into a structured JSON object.
 * The prompt includes rules for standardization (e.g., casing, state abbreviations).
 * @param addressString - The unstructured address string provided by the user.
 * @param forUser - The user profile for whom the address is being parsed, for token logging.
 * @returns A promise that resolves to a partial `Address` object.
 */
export async function parseAddressWithGemini(addressString: string, forUser?: UserProfile | null): Promise<Partial<Address>> {
  if (!addressString) return {};
  
  if (addressString.length > AI_GUARDRAILS.MAX_ADDRESS_CHARS) {
      throw new Error(`Address too long. Max ${AI_GUARDRAILS.MAX_ADDRESS_CHARS} characters.`);
  }

  const prompt = `
    Parse the provided address string into a structured JSON object.
    Rules:
    1. For addresses in the United States, validate and correct any misspellings in the street name, city, or state.
    2. Standardize capitalization:
       - Street names and city should be in Title Case (e.g., "Main Street", "San Francisco").
       - The state for US addresses must be a 2-letter uppercase abbreviation (e.g., "CA").
    3. Omit any keys for address components that are not present in the original string (like \`street2\`).
    
    Address to parse: "${addressString}"
  `;
  
  const inputTokens = estimateTokens(prompt);
  const sessionId = generateSessionId('ai-address-parsing');
  const modelConfig = modelConfigService.getModelConfig('ADDRESS_PARSING');

  try {
    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: addressJsonSchema,
        maxOutputTokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
      },
    });

    const outputTokens = estimateTokens(response.text);
    logTokenEvent({ feature: 'Address Parsing', model: modelConfig.model, inputTokens, outputTokens, sessionId }, forUser);

    const jsonString = response.text.trim();
    if (jsonString) {
      const parsed = JSON.parse(jsonString);
      // Clean up the response by removing any fields the model returned as null.
      Object.keys(parsed).forEach(key => {
        if (parsed[key] === null) {
          delete parsed[key];
        }
      });
      return parsed as Partial<Address>;
    }
    return {};
  } catch (error) {
    console.error("Gemini address parsing failed:", error);
    throw new Error("Failed to parse address with AI.");
  }
}

// Defines the comprehensive JSON schema for parsing a user's free-text description of their situation.
// This allows the "AI Application Starter" to extract a wide range of details into a structured format.
const applicationDetailsJsonSchema = {
    type: Type.OBJECT,
    properties: {
        profileData: {
            type: Type.OBJECT,
            properties: {
                firstName: { type: Type.STRING, description: 'The user\'s first name.' },
                lastName: { type: Type.STRING, description: 'The user\'s last name.' },
                primaryAddress: { ...addressSchema, description: "The user's primary residential address." },
                employmentStartDate: { type: Type.STRING, description: 'The date the user started their employment, in YYYY-MM-DD format.' },
                eligibilityType: { type: Type.STRING, description: 'The user\'s employment type.', enum: employmentTypes },
                householdIncome: { type: Type.NUMBER, description: 'The user\'s estimated annual household income as a number.' },
                householdSize: { type: Type.NUMBER, description: 'The number of people in the user\'s household.' },
                homeowner: { type: Type.STRING, description: 'Whether the user owns their home.', enum: ['Yes', 'No'] },
                mobileNumber: { type: Type.STRING, description: "The user's mobile phone number." },
                preferredLanguage: { type: Type.STRING, description: "The user's preferred language for communication." },
            }
        },
        eventData: {
            type: Type.OBJECT,
            properties: {
                event: { type: Type.STRING, description: "The type of event the user is applying for relief from.", enum: allEventTypes },
                eventName: { type: Type.STRING, description: "The official name of the hurricane or tropical storm, if applicable." },
                otherEvent: { type: Type.STRING, description: "The user-specified disaster if 'My disaster is not listed' is the event type." },
                eventDate: { type: Type.STRING, description: "The date the disaster occurred, in YYYY-MM-DD format." },
                evacuated: { type: Type.STRING, description: "Whether the user evacuated or plans to.", enum: ['Yes', 'No'] },
                powerLoss: { type: Type.STRING, description: "Whether the user lost power for more than 4 hours.", enum: ['Yes', 'No'] },
                powerLossDays: { type: Type.NUMBER, description: "The number of days the user was without power." },
                additionalDetails: { type: Type.STRING, description: "Any additional details provided by the user about their situation." },
                requestedAmount: { type: Type.NUMBER, description: 'The amount of financial relief the user is requesting.' },
            }
        }
    }
};

/**
 * Uses Gemini to parse a free-text description of a user's situation and extract
 * structured data to pre-fill an application form.
 * @param description - The user's unstructured text description.
 * @param isProxy - A boolean indicating if the submission is from an admin on behalf of a user.
 * @param applicantProfile - The profile of the user for whom the application is being parsed, for token logging.
 * @returns A promise that resolves to a partial `ApplicationFormData` object.
 */
export async function parseApplicationDetailsWithGemini(
  description: string,
  isProxy: boolean = false,
  applicantProfile?: UserProfile | null
): Promise<Partial<ApplicationFormData>> {
  if (!description) return {};

  if (description.length > AI_GUARDRAILS.MAX_APPLICATION_DESCRIPTION_CHARS) {
      throw new Error(`Description too long. Max ${AI_GUARDRAILS.MAX_APPLICATION_DESCRIPTION_CHARS} characters.`);
  }

  const instruction = isProxy
    ? `You are parsing a description submitted by a proxy on behalf of an applicant. Your task is to extract the **applicant's** details from the text. The applicant is the person who experienced the hardship.`
    : `Parse the user's description of their situation into a structured JSON object for a relief application.`;

  const prompt = `
    ${instruction}
    Extract any mentioned details that match the schema, including personal info, address, event details (like evacuation status or power loss), and other profile information.
    
    Rules for address parsing:
    1. For addresses in the United States, validate and correct any misspellings in the street name, city, or state.
    2. Standardize capitalization:
       - Street names and city should be in Title Case (e.g., "Main Street", "San Francisco").
       - The state for US addresses must be a 2-letter uppercase abbreviation (e.g., "CA").
    3. Omit any keys for address components that are not present in the original string (like \`street2\`).

    Rules for other fields:
    1. eventDate, employmentStartDate: Must be in YYYY-MM-DD format. Infer the year if not specified (assume current year).
    2. eventName: If the event is a hurricane or tropical storm, extract its specific name (e.g., 'Hurricane Ian').
    3. householdIncome, powerLossDays: Extract as a number, ignoring currency symbols or commas.
    4. homeowner, evacuated, powerLoss: Should be "Yes" or "No".
    5. mobileNumber: Extract any phone number mentioned by the user.

    User's description: "${description}"
  `;
  
  const inputTokens = estimateTokens(prompt);
  const sessionId = generateSessionId('ai-app-parsing');
  const modelConfig = modelConfigService.getModelConfig('APP_PARSING');

  try {
    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: applicationDetailsJsonSchema,
        maxOutputTokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
      },
    });

    const outputTokens = estimateTokens(response.text);
    logTokenEvent({ feature: 'Application Parsing', model: modelConfig.model, inputTokens, outputTokens, sessionId }, applicantProfile);

    const jsonString = response.text.trim();
    if (jsonString) {
      const parsed = JSON.parse(jsonString);
      // Recursively clean up any null values from the nested JSON response.
      if (parsed.profileData) {
        Object.keys(parsed.profileData).forEach(key => {
            if (parsed.profileData[key] === null) delete parsed.profileData[key];
        });
        if (parsed.profileData.primaryAddress) {
            Object.keys(parsed.profileData.primaryAddress).forEach(key => {
                if (parsed.profileData.primaryAddress[key] === null) delete parsed.profileData.primaryAddress[key];
            });
        }
      }
      if (parsed.eventData) {
          Object.keys(parsed.eventData).forEach(key => {
            if (parsed.eventData[key] === null) delete parsed.eventData[key];
        });
      }
      return parsed as Partial<ApplicationFormData>;
    }
    return {};
  } catch (error) {
    console.error("Gemini application details parsing failed:", error);
    throw new Error("Failed to parse application details with AI.");
  }
}
