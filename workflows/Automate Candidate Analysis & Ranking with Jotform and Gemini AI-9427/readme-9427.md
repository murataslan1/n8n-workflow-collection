Automate Candidate Analysis & Ranking with Jotform and Gemini AI

https://n8nworkflows.xyz/workflows/automate-candidate-analysis---ranking-with-jotform-and-gemini-ai-9427


# Automate Candidate Analysis & Ranking with Jotform and Gemini AI

---
### 1. Workflow Overview

This workflow automates the evaluation and ranking of candidates submitting applications via a JotForm form, specifically targeting User-Generated Content (UGC) candidates for skincare campaigns at a company. Its main objective is to:

- Collect candidate data from form submissions
- Use AI (Google Gemini Chat Model via LangChain) to score candidates based on predefined criteria
- Store candidate information and AI-generated score in a Google Sheet, avoiding duplicates
- Conditionally filter candidates by score (threshold 6 or above)
- Send notification emails both to shortlisted candidates and internal HR contacts

The workflow is organized into the following logical blocks:

- **1.1 Input Reception:** Receiving candidate submissions from JotForm via webhook.
- **1.2 AI Processing:** Scoring candidates using a Gemini AI chat model integrated into LangChain.
- **1.3 Conditional Filtering:** Passing only candidates with scores ≥ 6.
- **1.4 Data Persistence:** Appending or updating candidate records in Google Sheets.
- **1.5 Communication:** Sending emails to shortlisted candidates and internal HR.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block triggers the workflow when a candidate submits a form on JotForm. It captures all candidate qualification and personal data.

**Nodes Involved:**

- JotForm Trigger
- Sticky Note (providing explanation)

**Node Details:**

- **JotForm Trigger**  
  - Type: `n8n-nodes-base.jotFormTrigger`  
  - Role: Entry point webhook listener for JotForm form submissions  
  - Configuration:  
    - Form ID placeholder to be replaced with actual JotForm Form ID  
    - Credentials: JotForm API with full access permissions to allow data retrieval  
  - Key Variables: Captures entire form submission JSON data  
  - Input: Incoming HTTP webhook from JotForm submission  
  - Output: Emits JSON data of candidate form fields to next node  
  - Failure types: Invalid webhook URL, API key auth errors, form ID misconfiguration, network timeouts  
  - Notes: Requires JotForm API key with "Full Access" to function correctly (see Sticky Note12)  

- **Sticky Note**  
  - Content: "Starts the workflow upon form submission. It captures all the candidate's qualification and personal data."  
  - Purpose: Clarifies node role for users  

---

#### 1.2 AI Processing

**Overview:**  
This block evaluates the candidate data using AI to produce a numeric score (0-10) reflecting candidate suitability based on predefined criteria related to UGC experience, demographics, and product affinity.

**Nodes Involved:**

- AI Agent
- Google Gemini Chat Model
- Sticky Note1

**Node Details:**

- **AI Agent**  
  - Type: `@n8n/n8n-nodes-langchain.agent`  
  - Role: Orchestrates the AI prompt interpretation and scoring  
  - Configuration:  
    - Prompt defines scoring rules explicitly, instructing the model to return only a number without explanation or JSON  
    - Injects candidate data from previous node using `{{ JSON.stringify($json, null, 2) }}` expression  
    - Uses Gemini Chat Model as backend language model  
  - Inputs: Candidate JSON data from JotForm Trigger  
  - Outputs: Numeric score as string in `output` field  
  - Failure modes: AI service downtime, rate limits, malformed expressions, unexpected AI responses not conforming to numeric output  
  - Version: 2.2 (LangChain Agent node version)  

- **Google Gemini Chat Model**  
  - Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`  
  - Role: Provides AI language model capabilities (Gemini 2.5 flash lite)  
  - Configuration:  
    - Temperature set to 0.2 for low randomness, aiming for deterministic scoring  
  - Input: Receives prompt from AI Agent node  
  - Output: AI-generated response (score)  
  - Failure modes: API key issues, model unavailability, network errors  
  - Version: 1  

- **Sticky Note1**  
  - Content: "Calculates a numerical UGC candidate score (0-10) based on the predefined rules from the input data. It uses the Gemini Chat Model for the evaluation."  

---

#### 1.3 Conditional Filtering

**Overview:**  
This block filters out candidates with AI scores below 6, allowing only stronger candidates to proceed.

**Nodes Involved:**

- If (conditional node)
- Sticky Note2

**Node Details:**

- **If**  
  - Type: `n8n-nodes-base.if`  
  - Role: Conditional gate based on AI score  
  - Configuration:  
    - Condition: Checks if `{{$json.output}}` (the AI score) is greater than or equal to 6  
    - Loose type validation to allow flexible comparison  
  - Input: AI score output from AI Agent  
  - Outputs:  
    - True branch: candidates with score >= 6  
    - False branch: candidates with score < 6 (not connected further)  
  - Failure modes: Missing or malformed `output` field, non-numeric AI score, expression evaluation errors  
  - Version: 2.2  

- **Sticky Note2**  
  - Content: "A conditional gate that allows only candidates with an AI Rate of 6 or higher to proceed through the rest of the workflow."  

---

#### 1.4 Data Persistence

**Overview:**  
This block appends or updates the candidate’s data and AI score in a Google Sheet, using email as a unique key to avoid duplicates.

**Nodes Involved:**

- Append or update row in sheet
- Sticky Note3

**Node Details:**

- **Append or update row in sheet**  
  - Type: `n8n-nodes-base.googleSheets`  
  - Role: Append new or update existing candidate records in the spreadsheet  
  - Configuration:  
    - Spreadsheet ID and sheet name placeholders to be replaced with actual Google Sheet document ID and sheet GID  
    - Mapping: Candidate fields mapped individually from JotForm Trigger JSON fields and AI score (`$json.output`)  
    - Matching column: Email is used to detect existing rows for update  
    - Timestamp (`التاريخ`) automatically added with current date-time (`$now`)  
  - Inputs: Candidate form data and AI score  
  - Outputs: Passes data to email notification nodes  
  - Failure modes: Google API authentication errors, quota limits, malformed sheet configuration, mismatched column names  
  - Version: 4.7  

- **Sticky Note3**  
  - Content: "Adds the candidate's full data and their calculated AI Rate to the Google Sheet. It uses the Email to prevent duplicate entries."  

---

#### 1.5 Communication

**Overview:**  
This block sends two separate emails: one to the shortlisted candidate notifying them of their selection, and one internal email to HR for follow-up.

**Nodes Involved:**

- Send Candidate Shortlist Email
- Notify HR of Shortlist
- Sticky Note4
- Sticky Note5

**Node Details:**

- **Send Candidate Shortlist Email**  
  - Type: `n8n-nodes-base.gmail`  
  - Role: Sends an email to the candidate’s email address  
  - Configuration:  
    - Recipient: dynamic from candidate Email field  
    - Subject and body are unspecified in raw JSON, assumed to be configured with a relevant message (may require manual setup)  
    - Credentials: Gmail OAuth2 or equivalent must be configured  
  - Input: Candidate data from Google Sheets node  
  - Output: None further connected  
  - Failure modes: Email API auth errors, invalid email format, sending limits  
  - Version: 2.1  

- **Notify HR of Shortlist**  
  - Type: `n8n-nodes-base.gmail`  
  - Role: Sends an internal notification email to HR  
  - Configuration:  
    - Recipient: hardcoded to Marketing@yourcompany.com  
    - Email body presumably includes candidate name and score (not explicitly detailed)  
    - Credentials: Gmail OAuth2 configured  
  - Input: Candidate data from Google Sheets node  
  - Output: None further connected  
  - Failure modes: Same as above  

- **Sticky Note4**  
  - Content: "Sends a customized email to the candidate's address, notifying them that they have been shortlisted based on their high score."  

- **Sticky Note5**  
  - Content: "Sends an internal email to the HR contact (Marketingr@yourcompany.com) with the shortlisted candidate's name and score for quick follow-up."  

---

### 3. Summary Table

| Node Name                      | Node Type                         | Functional Role                                      | Input Node(s)           | Output Node(s)                               | Sticky Note                                                                                           |
|--------------------------------|----------------------------------|-----------------------------------------------------|------------------------|----------------------------------------------|-----------------------------------------------------------------------------------------------------|
| JotForm Trigger                | n8n-nodes-base.jotFormTrigger    | Receives candidate form submissions via webhook    | —                      | AI Agent                                     | Starts the workflow upon form submission. It captures all the candidate's qualification and personal data. |
| AI Agent                      | @n8n/n8n-nodes-langchain.agent   | Generates candidate score using Gemini AI            | JotForm Trigger        | If                                           | Calculates a numerical UGC candidate score (0-10) based on the predefined rules from the input data. It uses the Gemini Chat Model for the evaluation. |
| Google Gemini Chat Model      | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | Gemini AI language model backend for scoring         | AI Agent (ai_languageModel) | AI Agent (ai_languageModel)                  |                                                                                                     |
| If                           | n8n-nodes-base.if                | Filters candidates with AI score >= 6                | AI Agent               | Append or update row in sheet                 | A conditional gate that allows only candidates with an AI Rate of 6 or higher to proceed through the rest of the workflow. |
| Append or update row in sheet | n8n-nodes-base.googleSheets      | Stores/updates candidate data and score in Google Sheet | If                     | Send Candidate Shortlist Email, Notify HR of Shortlist | Adds the candidate's full data and their calculated AI Rate to the Google Sheet. It uses the Email to prevent duplicate entries. |
| Send Candidate Shortlist Email | n8n-nodes-base.gmail             | Sends notification email to shortlisted candidate   | Append or update row in sheet | —                                            | Sends a customized email to the candidate's address, notifying them that they have been shortlisted based on their high score. |
| Notify HR of Shortlist        | n8n-nodes-base.gmail             | Sends internal notification email to HR             | Append or update row in sheet | —                                            | Sends an internal email to the HR contact (Marketingr@yourcompany.com) with the shortlisted candidate's name and score for quick follow-up. |
| Sticky Note                   | n8n-nodes-base.stickyNote        | Explains JotForm Trigger node                        | —                      | —                                            | Starts the workflow upon form submission. It captures all the candidate's qualification and personal data. |
| Sticky Note1                  | n8n-nodes-base.stickyNote        | Explains AI Agent and scoring process                | —                      | —                                            | Calculates a numerical UGC candidate score (0-10) based on the predefined rules from the input data. It uses the Gemini Chat Model for the evaluation. |
| Sticky Note2                  | n8n-nodes-base.stickyNote        | Explains conditional filtering of candidates         | —                      | —                                            | A conditional gate that allows only candidates with an AI Rate of 6 or higher to proceed through the rest of the workflow. |
| Sticky Note3                  | n8n-nodes-base.stickyNote        | Explains Google Sheets data persistence               | —                      | —                                            | Adds the candidate's full data and their calculated AI Rate to the Google Sheet. It uses the Email to prevent duplicate entries. |
| Sticky Note4                  | n8n-nodes-base.stickyNote        | Explains candidate email notification                 | —                      | —                                            | Sends a customized email to the candidate's address, notifying them that they have been shortlisted based on their high score. |
| Sticky Note5                  | n8n-nodes-base.stickyNote        | Explains internal HR notification                      | —                      | —                                            | Sends an internal email to the HR contact (Marketingr@yourcompany.com) with the shortlisted candidate's name and score for quick follow-up. |
| Sticky Note12                 | n8n-nodes-base.stickyNote        | Provides JotForm webhook & API key setup instructions | —                      | —                                            | # JotForm Setup Guide: Step 1: Link webhook; Step 2: Generate API key with Full Access; Step 3: Configure nodes. See full note content. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create JotForm Trigger node**  
   - Type: `JotForm Trigger`  
   - Set your JotForm Form ID in the parameters (`form`)  
   - Configure JotForm API credentials with a full access API key  
   - This node listens for new form submissions  
   - Connect output to next node  

2. **Create Google Gemini Chat Model node**  
   - Type: `LangChain Google Gemini Chat Model`  
   - Set Model Name to `models/gemini-2.5-flash-lite`  
   - Set Temperature to `0.2` (low randomness)  

3. **Create AI Agent node**  
   - Type: `LangChain Agent`  
   - Use prompt type `define`  
   - Enter scoring prompt:  
     ```
     You are a UGC candidate evaluator for [Company Name] skincare campaigns.

     Read the candidate form data and calculate a score (0–10) based on these rules:
     +3 if has previous UGC/content experience
     +1 if lives in Helwan
     +1 if age 20–25
     +0.5 if 15–20
     +2 if no kids
     +1 if has child 0–2 years
     +1 if mentions liking or using XQ products
     +0.5 if skin is normal/dry/combination
     +0.5 if not sensitive

     Return only the number — no text, no JSON, no explanation.

     Candidate data:
     {{ JSON.stringify($json, null, 2) }}
     ```  
   - Connect AI Agent’s language model input to the Gemini Chat Model node output  
   - Connect JotForm Trigger output to AI Agent input  

4. **Create If node (conditional filter)**  
   - Type: `If`  
   - Add condition: check if `{{$json.output}} >= 6`  
   - Connect AI Agent output to If node input  

5. **Create Google Sheets node**  
   - Type: `Append or update row in sheet`  
   - Set document ID and sheet name (gid) to your Google Sheet ID and sheet tab  
   - Define columns mapping: map all candidate fields from JotForm Trigger plus `AI Rate` from AI Agent output (`$json.output`)  
   - Set matching column to `Email` (to prevent duplicates)  
   - Connect If node’s “true” output to this node  

6. **Create Send Candidate Shortlist Email node**  
   - Type: `Gmail`  
   - Configure OAuth2 credentials for Gmail  
   - Set `Send To` to candidate’s email from Google Sheets node data  
   - Compose subject and body to notify candidate of shortlisting  
   - Connect Google Sheets node output to this node  

7. **Create Notify HR of Shortlist Email node**  
   - Type: `Gmail`  
   - Configure OAuth2 credentials as above  
   - Set `Send To` to internal HR email, e.g., Marketing@yourcompany.com  
   - Compose body to include candidate name and AI score for follow-up  
   - Connect Google Sheets node output to this node  

8. **Add Sticky Notes**  
   - Add descriptive sticky notes near each logical block for clarity (optional but recommended)  

9. **Final Testing**  
   - Replace all placeholders (JotForm ID, Google Sheet ID, emails) with real values  
   - Test by submitting a candidate form entry on JotForm  
   - Verify AI scoring, sheet update, and emails sent correctly  

---

### 5. General Notes & Resources

| Note Content                                                                                                                    | Context or Link                                                                                                               |
|---------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| **JotForm Setup Guide:**<br>1. Link the JotForm webhook URL to your form via Settings → Integrations → Webhooks.<br>2. Generate a JotForm API key with “Full Access” permission.<br>3. Configure this API key in the JotForm Trigger node credentials.<br>See full guide in Sticky Note12. | Embedded in Sticky Note12 in the workflow UI.                                                                                 |
| Gemini AI model "models/gemini-2.5-flash-lite" is used for scoring to balance response speed and quality.                       | Requires correct LangChain and Google Gemini API credentials configured in n8n environment.                                   |
| Email nodes require Gmail OAuth2 credentials configured with sending permissions.                                                | Ensure OAuth2 tokens have send mail scope and refresh tokens set properly.                                                    |
| The workflow assumes candidate emails are unique identifiers for Google Sheet updates.                                          | Duplicates or missing emails may cause update failures or multiple records.                                                  |
| AI scoring prompt strictly instructs to return only a number to simplify parsing and reduce errors.                             | Unexpected AI output can cause workflow failures or incorrect filtering in If node.                                            |

---

**Disclaimer:** The provided text is generated exclusively from an n8n automated workflow. It complies strictly with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.