# Regression Suite: AI Features & AI Apply Deep Dive

**Priority:** Critical
**Prerequisites:** User is logged in, verified, and eligible.
**Note:** When testing AI, do not expect exact text matches in responses. Focus on the **Data State** (what appears in the Application Progress / Preview Pane) and the **Logic Flow** (what the AI asks next).

---

## TC-011: AI Application Starter (Parser Logic)
**Objective:** Verify the "Let AI fill in..." text box correctly parses unstructured text into structured form data.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to **Apply** (Standard Form). | Step 1 loads. "Let's Get Started" section is visible. |
| 2 | Expand "Let AI fill in...". | Text area appears. |
| 3 | Paste: *"I am a homeowner. My phone is 555-0199. I lost power for 4 days due to the Hurricane. I need $400 for spoiled food."* | |
| 4 | Click "Submit Description". | Spinner appears ("We are applying your details..."). Success message appears. |
| 5 | **Check:** Contact Section | "Mobile Number" is `(555) 000-0199`. |
| 6 | **Check:** Additional Details | "Homeowner" is selected as "Yes". |
| 7 | Click "Next" to Event Details. | "Event" is "Tropical Storm/Hurricane". "Power Loss" is "Yes". "Days" is "4". |
| 8 | Click "Next" to Expenses. | "Food Spoilage" amount is `$400.00`. |

---

## TC-012: AI Apply - Linear Flow (Happy Path)
**Objective:** Verify the AI guides the user sequentially through the application sections and updates the UI in real-time.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to **AI Apply**. | **Desktop:** Chat on left, "Application Progress" pane on right. **Mobile:** Chat only (check "Preview" button periodically). |
| 2 | **Chat:** "I want to apply." | AI asks for missing **Additional Details** (e.g., Employment Start Date, Income). |
| 3 | **Check:** UI State | "Additional Details" section in Preview Pane should be *Expanded*. Circles are empty. |
| 4 | **Chat:** Provide missing profile info (Date, Income, Household Size). | AI confirms updates. |
| 5 | **Check:** UI State | "Additional Details" items turn to **Green Checkmarks**. |
| 6 | **Chat:** AI should ask for **Acknowledgements** (Policy, Consent, Accuracy). Confirm them. | "Profile Acknowledgements" section turns to Green Checkmarks. AI moves to **Event Details**. |
| 7 | **Chat:** "It was a Flood yesterday. No power loss." | AI updates Event Type and Date. "Event Details" section updates. |
| 8 | **Chat:** AI asks about Expenses. Reply: "I spent $500 on food." | AI updates "Expenses" section. Total Request updates to $500. |
| 9 | **Chat:** AI asks final Agreements. Reply: "Yes to sharing story." | AI updates "Agreements" section. |
| 10 | **Check:** Completion | All sections in Preview Pane have Green Checkmarks. |
| 11 | **Action:** Click "Submit Application" in the Preview Pane. | Redirects to **Submission Success Page**. |

---

## TC-013: The "Over-Sharer" (Non-Linear Data Entry)
**Objective:** Verify the AI correctly captures information provided *out of order* while maintaining the interview flow (fixing the "Sequential Gatekeeper" flaw).

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Start a fresh **AI Apply** session (Clear Draft if needed). | Preview Pane is empty. |
| 2 | **Chat:** "Hi, I lost my home in a Fire yesterday. I need $1000 for meals." | User provides Event and Expense info *before* Profile info. |
| 3 | **Check:** UI State (Crucial) | 1. **Event Details:** "House Fire" and Date should be populated/checked. <br> 2. **Expenses:** "Meals" should show $1000. <br> 3. **Additional Details:** Should remain incomplete (empty circles). |
| 4 | **Check:** AI Response | The AI should acknowledge the fire/meals BUT explicitly ask for the missing **Profile/Additional Details** next (e.g., "I've noted the fire and meal costs. First, I need your employment start date..."). |
| 5 | **Chat:** Provide Profile Info. | AI fills Profile section. Then moves to Acknowledgements. |
| 6 | **Chat:** Confirm Acknowledgements. | AI should recognize Event/Expenses are *already done* and skip asking about them again, moving straight to Agreements or asking for any tiny missing details (like Evacuation status). |

---

## TC-014: Corrections & Hallucination Check
**Objective:** Verify the user can correct mistakes and that the AI handles invalid expense types gracefully.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Start **AI Apply**. Provide Income: "$50,000". | UI shows Household Income: $50,000. |
| 2 | **Chat:** "Actually, I made a mistake. My income is $40,000." | AI confirms update. UI immediately reflects $40,000. |
| 3 | Navigate to Expenses phase. | |
| 4 | **Chat:** "I need $2000 for roof repairs." | "Roof Repairs" is NOT a valid category. |
| 5 | **Check:** AI Response | AI should NOT hallucinate a "Roof Repair" category. It should either: <br> A) Map it to "Basic Disaster Supplies" (if generous logic). <br> B) State it can only cover specific categories (Food, Meals, Supplies). <br> **Crucial:** The UI Expense list must NOT break or show undefined categories. |
| 6 | **Chat:** "Okay, $200 for basic supplies." | UI updates "Basic Disaster Supplies" to $200. |

---

## TC-015: Persistence & "Clear Draft"
**Objective:** Verify application state saves across reloads and can be explicitly cleared.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Start **AI Apply**. Fill out "First Name" and "Income". | UI updates. |
| 2 | **Action:** Refresh the browser page. | Page reloads. |
| 3 | **Check:** State | Chat history is preserved. Preview Pane still shows "Income" as filled. |
| 4 | **Action:** Click the **"Clear Draft"** (Refresh Icon) button in the chat header. | Confirmation prompt appears. |
| 5 | Confirm Clear. | 1. Chat history is wiped. <br> 2. Preview Pane resets to empty/defaults. <br> 3. AI starts over with the greeting. |

---

## TC-016: Admin Proxy Application (AI Assisted)
**Objective:** Admin uses AI to parse an email/description for a proxy applicant.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Log in as **Admin**. Navigate to **Fund Portal**. | |
| 2 | Click "Proxy". | Proxy Application page loads. |
| 3 | Use "Let AI fill in..." at top. | |
| 4 | Paste: *"Applying for pikachu.raichu@example.com. They lost their home in a fire."* | |
| 5 | Click Submit. | AI extracts email and event. |
| 6 | **Check:** Search Result | "Applicant Found: Pikachu Raichu" appears below. |
| 7 | Click "Start Application for this User". | Wizard loads with "House Fire" pre-selected in Step 2. |

---

## TC-017: Token Analytics Logging
**Objective:** Confirm that AI interactions generate proper audit logs.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Perform a chat in **AI Apply** (TC-012). | |
| 2 | Log in as **Admin**. Navigate to **Fund Portal** > **Tokens**. | |
| 3 | **Check:** Detailed Usage Table | |
| 4 | **Verify:** AI Assistant | Look for rows with Feature: `AI Apply Chat`. |
| 5 | **Verify:** Model | Verify correct model (e.g., `gemini-2.5-flash`) is logged. |
| 6 | **Verify:** Tool Calls | If user updated profile via chat, ensure input/output tokens reflect the tool usage (higher token count). |
