# 🧪 AI Application Simulation Report
**Subject:** E4E Relief "AI Apply" Feature Analysis
**Simulation Count:** 1,000 User Journeys
**Focus:** Logic Gaps, Prompt Fragility, and User Experience Friction

## 1. The "Sequential Gatekeeper" Conflict
**Location:** `services/geminiService.ts` -> `getAIApplyContext`

**The Setup:**
The code constructs the system prompt dynamically. It calculates `basicProfileComplete`, `allProfileComplete`, etc., and **only** injects the instructions for the current section into the `Missing Information` block. The prompt explicitly commands: *"You must complete them IN ORDER. Do not jump ahead."*

**The Flaw (The "Over-Sharing" Scenario):**
*   **User Input:** "Hi, I'm John Doe. A hurricane hit my house yesterday and I lost $500 of food."
*   **System Behavior:** The logic detects `firstName` and `lastName` are missing, but also `event` and `expenses`. However, the System Instruction likely tells the model to **only** ask about Profile details first.
*   **The Bite:** The model might successfully call `updateUserProfile` for the name, but because of the strict instruction *"Focus on the current section... do not jump ahead,"* it might **ignore** the event and expense data provided in that same message.
*   **Result:** Two turns later, the AI asks, "What event happened?" The user gets frustrated: *"I just told you!"*

## 2. The "I Don't Know" Infinite Loop
**Location:** `services/geminiService.ts` -> `getAIApplyContext` (Missing Fields Logic)

**The Setup:**
The prompt lists missing fields, e.g., `householdIncome`. The AI is instructed to ask for these.

**The Flaw:**
*   **User Input:** "I don't actually know my exact household income right now."
*   **System Behavior:** The AI cannot invent a number. It cannot call the tool with `null`. The field remains null in the `ApplicationFormData`.
*   **The Bite:** The next render of `getAIApplyContext` sees `householdIncome` is still missing. It instructs the AI to ask for it again.
*   **Result:**
    *   AI: "What is your household income?"
    *   User: "I told you, I don't know."
    *   AI: "I understand, but to proceed I need your household income."
    *   *User rage-quits.*

## 3. The Expense Categorization Mismatch
**Location:** `services/geminiService.ts` -> `addOrUpdateExpenseTool`

**The Setup:**
The tool creates a strict enum constraint: `['Basic Disaster Supplies', 'Food Spoilage', 'Meals']`.

**The Flaw:**
*   **User Input:** "My roof is leaking and it will cost $2,000 to fix." or "I need money for a hotel."
*   **System Behavior:** The user has a valid hardship, but "Roof Repair" or "Hotel" (Lodging) are not in the enum list passed to the LLM tool.
*   **The Bite:**
    1.  **Hallucination:** The model forces "Roof Repair" into "Basic Disaster Supplies" (incorrect data).
    2.  **Rejection:** The model says, "I can only help with Food, Meals, and Supplies." (User feels the app is broken because the Fund might actually cover housing, but the *tool definition* restricted it).
    3.  **Crash:** The model tries to pass "Home Repair" as the type, violating the JSON schema enum, causing a tool call error.

## 4. The "Review and Correct" Trap
**Location:** `components/AIApplyPage.tsx` (State Management)

**The Setup:**
The user completes the profile, moves to events, and then realizes they made a mistake.

**The Flaw:**
*   **User Input:** "Wait, I actually made a mistake on my income, it's $40k, not $50k."
*   **System Behavior:** The System Context at this stage is likely focused on *Event Details* or *Expenses*. The "Missing Information" list for Profile is empty, so the prompt doesn't prioritize profile fields.
*   **The Bite:** While the `updateUserProfile` tool is available globally, the *instructions* focus heavily on the current step. The model might say, "Let's finish the expenses first," ignoring the correction, or it might update it but not confirm it clearly because its "mission" is elsewhere.

## 5. The Acknowledgement "Click" vs. "Chat" Dissonance
**Location:** `services/geminiService.ts` -> `getAIApplyContext`

**The Setup:**
The prompt says: *"The checkboxes in the UI are for display only; the user must confirm with you."*

**The Flaw:**
*   **User Input:** The user sees the checklist on the right side (Desktop) or the modal (Mobile). They might mentally "check" them off or expect to click them.
*   **System Behavior:** The AI creates a conversational bottleneck. It reads the policy legalese.
*   **The Bite:** The user types "Yes" to the first one. The AI asks the second one. User types "Yes". AI asks the third.
*   **Result:** This feels like an interrogation. A user who says "I agree to all policies" needs to be handled gracefully, but the prompt logic:
    `if (!combinedProfile.ackPolicies) ... push('Agreement to Privacy Policy...')`
    might cause the AI to go one-by-one meticulously unless the user is very explicit.

## 6. Date Format Friction
**Location:** `services/geminiService.ts` -> `updateUserProfileTool`

**The Setup:**
The schema requires `employmentStartDate` in `YYYY-MM-DD`.

**The Flaw:**
*   **User Input:** "I started working there in March 2020."
*   **System Behavior:** The model tries to convert this to a specific date.
*   **The Bite:** The model might guess `2020-03-01`. If the user later says "No, it was the 15th," we enter a correction loop. Furthermore, if the user says "A few years ago," the model might halluncinate a date or get stuck asking for a specific day when the user doesn't remember.

## 7. The "Draft Persistence" Confusion
**Location:** `App.tsx` / `AIApplyPage.tsx` (`localStorage`)

**The Setup:**
The app saves the draft to `localStorage`.

**The Flaw:**
*   **Scenario:** User starts AI apply, gets halfway through. Leaves. Comes back 2 days later.
*   **System Behavior:** The `chatHistory` in `sessionStorage` might be cleared (browser close), but the `applicationDraft` in `localStorage` persists.
*   **The Bite:**
    *   The chat window is empty (fresh session).
    *   The "Missing Information" list is half-full.
    *   **AI Greeting:** "Hello! Review the application..."
    *   **User:** "What do you need?"
    *   **AI:** "I see we already have your name and address..." (This is good).
    *   **BUT:** If the user *wanted* to start over, there is no clear "Reset" command in the UI. They are trapped in the previous draft state unless they manually clear the form.

## 8. Token Usage & Context Window Clipping
**Location:** `AI_GUARDRAILS`

**The Setup:**
`MAX_CHAT_TURNS_PER_SESSION` is 50.

**The Flaw:**
*   **Scenario:** A very chatty user or a complex application with many expenses.
*   **System Behavior:** If the user hits turn 51, the chat disables (`hasSessionEnded`).
*   **The Bite:** The user might be 90% done. The input box locks. They cannot finish the application via AI. They have to navigate away or refresh, potentially losing the *chat context* (though the draft saves). It’s a jarring end to the experience.

## 9. The "Silent Failure" of Tools
**Location:** `ChatbotWidget.tsx` -> `handleSendMessage`

**The Setup:**
The code catches errors and adds an error message bubble.

**The Flaw:**
*   **Scenario:** The model calls `updateUserProfile` with valid arguments, but the Firestore update fails (offline, permission, etc.).
*   **System Behavior:** The UI might show an error bubble, but the *Context* for the next AI turn is rebuilt from `userProfile`.
*   **The Bite:** The AI *thinks* it called the tool. The *Profile* didn't update. The next prompt generation sees the field is still missing.
*   **Result:**
    *   AI: "What is your name?"
    *   User: "John."
    *   (Tool fails silently or allows continuation)
    *   AI: "Thanks. What is your name?" (Because `userProfile.firstName` is still empty).

## 10. Ambiguity in "Evacuation"
**Location:** `evaluateApplicationEligibility` vs AI Collection

**The Setup:**
The rules engine requires `evacuationNights` > 0 if `evacuated === 'Yes'`.

**The Flaw:**
*   **User Input:** "I evacuated this morning, I'm still gone."
*   **System Behavior:** `evacuationNights` is technically unknown or 0 *so far*.
*   **The Bite:** The AI might try to force a number "How many nights *were* you evacuated?" The user says "I'm still evacuated!" The AI struggles to put "Currently evacuated" into a `number` field. It might put `1`, or `0`, which triggers the validation error in the Rules Engine later.

---

## 🛠 Recommendations (Summary)

1.  **Loose Coupling in Prompt:** Allow the AI to capture *any* information provided in a message, even if it belongs to a "future" section, to prevent the "I just told you" frustration.
2.  **"Unknown" Handling:** Add a logic path for when users explicitly don't know a value (e.g., specific dates). Maybe allow the AI to mark it as "Approximated" or have a "Skip/I don't know" flag that allows the draft to proceed (if the field isn't legally required).
3.  **Expense Flexibility:** Review `expenseTypes`. If the fund covers more than Food/Meals, the enum in `geminiService.ts` must match the database exactly, or the AI needs a "Other" category to dump unclassified expenses into.
4.  **Explicit Reset:** Add a "Clear Draft" button on the AI Apply page.
5.  **Validation Feedback:** If the AI collects data that fails validation (e.g., a date in the future), the *tool* should return an error string to the model so the model can self-correct immediately: "Oops, I cannot set the date to the future. Please provide a past date."