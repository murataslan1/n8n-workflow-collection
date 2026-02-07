Automate Lead Calls with an AI Agent using OpenAI, Twilio & Vapi

https://n8nworkflows.xyz/workflows/automate-lead-calls-with-an-ai-agent-using-openai--twilio---vapi-4026


# Automate Lead Calls with an AI Agent using OpenAI, Twilio & Vapi

### 1. Workflow Overview

This workflow automates lead qualification calls using an AI voice agent powered by OpenAI, Twilio, and Vapi.ai, integrated through n8n. It targets businesses and freelancers who want to automate outreach phone calls, extract key contact info such as emails from conversations, and maintain comprehensive logs and notifications for each interaction.

The workflow is logically organized into these functional blocks:

- **1.1 Lead Input & Filtering**: Load leads from Google Sheets and filter out already processed ones.
- **1.2 Call Preparation & Initiation**: Clean phone numbers, create a customer profile in Vapi, initiate AI calls via Vapi/Twilio.
- **1.3 Call Monitoring Loop**: Periodically check call status, decide whether to continue polling or end.
- **1.4 Call Result Handling**: Parse call data including transcript and audio, extract email if call was answered.
- **1.5 Branch: No Answer Handling**: Mark lead as no answer and notify Slack.
- **1.6 Branch: Successful Call Handling**: Update lead as processed with extracted data, notify Slack with details.
- **1.7 Post-Call Data Refresh & Workflow Loop**: Wait, refresh Google Sheets data, and continue or finish.
- **1.8 Workflow Completion Notification**: Send Slack message when all leads are processed.

Each node is configured to ensure robustness including retry logic, data consistency, and real-time alerts. This system enables fully no-code automation of voice-based lead qualification at scale.

---

### 2. Block-by-Block Analysis

#### 1.1 Lead Input & Filtering

**Overview:**  
Loads the lead data from Google Sheets and filters to retain only unprocessed leads for calling.

**Nodes Involved:**  
- Manual Trigger  
- Load Lead Sheet  
- Filter Valid Leads  
- Has Leads to Process?

**Node Details:**

- **Manual Trigger**  
  - Type: Manual trigger node  
  - Role: Entry point to start the workflow manually for testing or batch execution.  
  - Inputs: None  
  - Outputs: Leads to "Load Lead Sheet"  
  - Edge cases: None, simple manual start.

- **Load Lead Sheet**  
  - Type: Google Sheets node  
  - Role: Reads entire lead list from a specified Google Sheet using Google Service Account credentials.  
  - Key config: Sheet ID, worksheet name, read mode (all rows)  
  - Inputs: Manual Trigger output  
  - Outputs: Raw leads data to "Filter Valid Leads"  
  - Failures: Google API authentication errors, quota limits.

- **Filter Valid Leads**  
  - Type: Code node (JavaScript)  
  - Role: Filters leads, removing those already processed or flagged in the sheet.  
  - Key logic: Checks a status column or similar to exclude processed leads.  
  - Inputs: Lead data from "Load Lead Sheet"  
  - Outputs: Filtered leads to "Has Leads to Process?"  
  - Edge cases: Empty or malformed data, missing status fields.

- **Has Leads to Process?**  
  - Type: IF node  
  - Role: Checks if any leads remain after filtering to decide workflow continuation or termination.  
  - Inputs: Filtered leads  
  - Outputs:  
    - Yes: Leads proceed to phone cleaning  
    - No: Workflow ends with Slack notification  
  - Edge cases: No leads available – triggers early exit.

---

#### 1.2 Call Preparation & Initiation

**Overview:**  
Prepares phone numbers, creates Vapi customer profiles, and initiates AI calls.

**Nodes Involved:**  
- Clean Phone Number  
- Step 1 - Create Customer  
- Step 2 - Initiate Call  
- Loop Setup Variables  
- Set Attempt Count + Init Status

**Node Details:**

- **Clean Phone Number**  
  - Type: Code node  
  - Role: Formats phone numbers into E.164 format or Twilio-compatible format, sanitizing input.  
  - Logic: Removes spaces, adds country codes, strips non-numeric chars.  
  - Inputs: Lead phone number from "Has Leads to Process?"  
  - Outputs: Cleaned phone number to "Step 1 - Create Customer"  
  - Edge cases: Invalid phone numbers, missing country code.

- **Step 1 - Create Customer**  
  - Type: HTTP Request node  
  - Role: Calls Vapi API to create or retrieve a customer profile associated with the current lead.  
  - Config: POST request with lead info (phone, name) using Vapi API credentials.  
  - Inputs: Clean phone number  
  - Outputs: Customer ID to "Step 2 - Initiate Call"  
  - Failures: API auth errors, network issues.

- **Step 2 - Initiate Call**  
  - Type: HTTP Request node  
  - Role: Sends a request to Vapi to start the AI voice call using the created customer profile.  
  - Config: POST with parameters including customer ID and phone number.  
  - Inputs: Customer profile data  
  - Outputs: Call session info to "Loop Setup Variables"  
  - Failures: API or Twilio call initiation errors.

- **Loop Setup Variables**  
  - Type: Set node  
  - Role: Initializes variables for retry count and call status tracking prior to monitoring loop.  
  - Inputs: Call initiation response  
  - Outputs: Variables to "Set Attempt Count + Init Status"  
  - Edge cases: Missing or malformed call session info.

- **Set Attempt Count + Init Status**  
  - Type: Code node  
  - Role: Sets initial attempt counter (usually 0 or 1) and status flags before polling call status.  
  - Inputs: Loop variables  
  - Outputs: To "Get Call Status from VAPI"  
  - Edge cases: Counter initialization errors.

---

#### 1.3 Call Monitoring Loop

**Overview:**  
Polls Vapi API repeatedly to check the current call status and decide if the call session is finished.

**Nodes Involved:**  
- Get Call Status from VAPI  
- Check Final Status + shouldContinue Logic  
- Should Continue Loop? (IF)  
- Wait Before Retry  
- Prepare Loop Payload

**Node Details:**

- **Get Call Status from VAPI**  
  - Type: HTTP Request node  
  - Role: GET request to Vapi API to fetch current call status and updates.  
  - Inputs: Attempt count and call session ID  
  - Outputs: Call status JSON to "Check Final Status + shouldContinue Logic"  
  - Failures: API errors, timeouts.

- **Check Final Status + shouldContinue Logic**  
  - Type: Code node  
  - Role: Parses call status JSON, determines if call is completed, failed, or ongoing.  
  - Logic: Sets flag for continuing or stopping.  
  - Inputs: Call status data  
  - Outputs: Boolean to "Should Continue Loop?"  
  - Edge cases: Unexpected status codes, malformed API response.

- **Should Continue Loop?**  
  - Type: IF node  
  - Role: Branches workflow: continue waiting or proceed to call data retrieval.  
  - Inputs: Flag from previous node  
  - Outputs:  
    - Yes: To "Wait Before Retry" (delay 3 seconds)  
    - No: To "Step 3 - Get Call Data"  
  - Edge cases: Infinite loop if logic fails.

- **Wait Before Retry**  
  - Type: Wait node  
  - Role: Delays for 3 seconds or configured interval before next status check.  
  - Inputs: From "Should Continue Loop?"  
  - Outputs: To "Prepare Loop Payload"  
  - Edge cases: Workflow timeouts if loop too long.

- **Prepare Loop Payload**  
  - Type: Set node  
  - Role: Updates attempt count and status variables for next iteration.  
  - Inputs: From "Wait Before Retry"  
  - Outputs: Loops back to "Set Attempt Count + Init Status"  
  - Edge cases: Variable mismanagement causing infinite loops.

---

#### 1.4 Call Result Handling

**Overview:**  
After call completion, retrieve call transcript and metadata, parse AI response for insights.

**Nodes Involved:**  
- Step 3 - Get Call Data  
- Step 4 - Set (Parse Call Result)  
- Step 5 - If (Call Answered?)

**Node Details:**

- **Step 3 - Get Call Data**  
  - Type: HTTP Request node  
  - Role: Retrieves full call details from Vapi API including transcript, audio URL, call duration.  
  - Inputs: Call session ID  
  - Outputs: Raw call data JSON to "Step 4 - Set (Parse Call Result)"  
  - Failures: API errors, missing data.

- **Step 4 - Set (Parse Call Result)**  
  - Type: Set node  
  - Role: Extracts key fields such as transcript text, AI reply, conversation category, tone, and call end reason.  
  - Inputs: Raw call data  
  - Outputs: Parsed structured data to "Step 5 - If (Call Answered?)"  
  - Edge cases: Missing transcript or incomplete data.

- **Step 5 - If (Call Answered?)**  
  - Type: IF node  
  - Role: Branches based on whether the call was answered or not, using call status or end reason.  
  - Inputs: Parsed call result  
  - Outputs:  
    - No: To "Step 5.1 - Update Lead (No Answer)" and Slack notification  
    - Yes: To email extraction and lead update nodes  
  - Edge cases: Ambiguous call statuses.

---

#### 1.5 Branch: No Answer Handling

**Overview:**  
Handles leads who did not answer the call. Updates sheet and notifies Slack.

**Nodes Involved:**  
- Step 5.1 - Update Lead (No Answer)  
- Step 5.2 - Notify Slack (No Answer)  
- Wait Before Sheet Refresh

**Node Details:**

- **Step 5.1 - Update Lead (No Answer)**  
  - Type: Google Sheets node  
  - Role: Marks the lead as "No Answer" in the Google Sheet with timestamp and call attempt info.  
  - Inputs: Lead data and call status  
  - Outputs: To "Step 5.2 - Notify Slack (No Answer)"  
  - Failures: Google Sheets API errors, write conflicts.

- **Step 5.2 - Notify Slack (No Answer)**  
  - Type: Slack node  
  - Role: Sends a Slack message alerting that the lead did not answer the call, including lead info and attempt count.  
  - Inputs: Updated lead info  
  - Outputs: Ends branch or loops for next lead  
  - Failures: Slack API auth or network issues.

- **Wait Before Sheet Refresh**  
  - Type: Wait node  
  - Role: Short delay before refreshing Google Sheet data to ensure write consistency.  
  - Inputs: From Slack notification or lead update nodes  
  - Outputs: "Sync Updated Sheet"  
  - Edge cases: Delays too short causing race conditions.

---

#### 1.6 Branch: Successful Call Handling

**Overview:**  
Processes calls that were answered, extracts email from transcript, updates lead data, and sends Slack notifications.

**Nodes Involved:**  
- Step 5.1.1 - Extract Email (Regex)  
- Step 5.1.2 - Update Lead (Completed)  
- Step 5.1.3 - Notify Slack (Lead Success)  
- Wait Before Sheet Refresh

**Node Details:**

- **Step 5.1.1 - Extract Email (Regex)**  
  - Type: Code node  
  - Role: Uses regex and JavaScript to parse and extract a valid email address from the AI call transcript text. Handles spoken email formats like "at" and "dot".  
  - Inputs: Call transcript text  
  - Outputs: Extracted email (or empty) to "Step 5.1.2 - Update Lead (Completed)"  
  - Edge cases: No recognizable email, false positives.

- **Step 5.1.2 - Update Lead (Completed)**  
  - Type: Google Sheets node  
  - Role: Updates the lead row marking call as "Processed", saves email, summary, transcript URL, and other metadata.  
  - Inputs: Extracted email and call data  
  - Outputs: To "Wait Before Sheet Refresh" and Slack notification  
  - Failures: Google Sheets write errors.

- **Step 5.1.3 - Notify Slack (Lead Success)**  
  - Type: Slack node  
  - Role: Sends detailed Slack notification including lead info, extracted email, call summary, and audio links.  
  - Inputs: Updated lead data  
  - Outputs: Ends branch or loops for next lead  
  - Failures: Slack API issues.

- **Wait Before Sheet Refresh**  
  - Same as in no answer branch: short delay before sheet reload.

---

#### 1.7 Post-Call Data Refresh & Loop Continuation

**Overview:**  
Refreshes the Google Sheet data after calls to sync any updates and prepares for the next lead processing cycle.

**Nodes Involved:**  
- Sync Updated Sheet  
- Load Lead Sheet

**Node Details:**

- **Sync Updated Sheet**  
  - Type: Google Sheets node  
  - Role: Reads the updated lead sheet data to reflect changes made during processing.  
  - Inputs: After wait node  
  - Outputs: Back to "Load Lead Sheet" to restart filtering and processing cycle.  
  - Failures: Google API issues, data consistency.

- **Load Lead Sheet**  
  - Same as initial load node, now loading fresh data for next iteration.

---

#### 1.8 Workflow Completion Notification

**Overview:**  
Sends a Slack message indicating that all leads have been processed and the workflow is complete.

**Nodes Involved:**  
- Slack - All Done

**Node Details:**

- **Slack - All Done**  
  - Type: Slack node  
  - Role: Sends a final notification to Slack channel summarizing that no leads remain to process.  
  - Inputs: From "Has Leads to Process?" when no leads are found  
  - Outputs: Workflow ends here  
  - Failures: Slack API errors.

---

### 3. Summary Table

| Node Name                      | Node Type          | Functional Role                       | Input Node(s)               | Output Node(s)                     | Sticky Note                                                                                         |
|-------------------------------|--------------------|------------------------------------|-----------------------------|----------------------------------|---------------------------------------------------------------------------------------------------|
| Manual Trigger                | Manual Trigger     | Workflow entry point                | None                        | Load Lead Sheet                   |                                                                                                   |
| Load Lead Sheet               | Google Sheets      | Read leads data                    | Manual Trigger, Sync Updated Sheet | Filter Valid Leads               |                                                                                                   |
| Filter Valid Leads            | Code               | Filter unprocessed leads           | Load Lead Sheet              | Has Leads to Process?             |                                                                                                   |
| Has Leads to Process?         | IF                 | Check if leads remain              | Filter Valid Leads           | Clean Phone Number, Slack - All Done |                                                                                                   |
| Clean Phone Number            | Code               | Format phone number for calls      | Has Leads to Process?        | Step 1 - Create Customer          |                                                                                                   |
| Step 1 - Create Customer      | HTTP Request       | Create Vapi customer profile       | Clean Phone Number           | Step 2 - Initiate Call            |                                                                                                   |
| Step 2 - Initiate Call        | HTTP Request       | Start AI call via Vapi             | Step 1 - Create Customer     | Loop Setup Variables              |                                                                                                   |
| Loop Setup Variables          | Set                | Initialize loop variables          | Step 2 - Initiate Call       | Set Attempt Count + Init Status   |                                                                                                   |
| Set Attempt Count + Init Status | Code             | Set attempt counter and status     | Loop Setup Variables, Prepare Loop Payload | Get Call Status from VAPI     |                                                                                                   |
| Get Call Status from VAPI     | HTTP Request       | Poll call status                   | Set Attempt Count + Init Status | Check Final Status + shouldContinue Logic |                                                                                                   |
| Check Final Status + shouldContinue Logic | Code      | Decide if loop continues           | Get Call Status from VAPI    | Should Continue Loop?             |                                                                                                   |
| Should Continue Loop?         | IF                 | Branch loop continuation           | Check Final Status           | Wait Before Retry, Step 3 - Get Call Data |                                                                                                   |
| Wait Before Retry             | Wait               | Delay before next poll             | Should Continue Loop?        | Prepare Loop Payload              |                                                                                                   |
| Prepare Loop Payload          | Set                | Update loop variables              | Wait Before Retry            | Set Attempt Count + Init Status   |                                                                                                   |
| Step 3 - Get Call Data        | HTTP Request       | Retrieve full call data            | Should Continue Loop? (No)   | Step 4 - Set (Parse Call Result) |                                                                                                   |
| Step 4 - Set (Parse Call Result) | Set             | Parse call transcript and metadata | Step 3 - Get Call Data       | Step 5 - If (Call Answered?)      |                                                                                                   |
| Step 5 - If (Call Answered?)  | IF                 | Branch on call answered status     | Step 4 - Set (Parse Call Result) | Step 5.1 - Update Lead (No Answer), Step 5.1.1 - Extract Email (Regex) |                                                                                                   |
| Step 5.1 - Update Lead (No Answer) | Google Sheets  | Mark lead as no answer             | Step 5 - If (No branch)      | Step 5.2 - Notify Slack (No Answer) |                                                                                                   |
| Step 5.2 - Notify Slack (No Answer) | Slack          | Notify no-answer call in Slack     | Step 5.1 - Update Lead (No Answer) | Wait Before Sheet Refresh        |                                                                                                   |
| Step 5.1.1- Extract Email (Regex) | Code            | Extract email from transcript      | Step 5 - If (Yes branch)     | Step 5.1.2 - Update Lead (Completed) |                                                                                                   |
| Step 5.1.2 - Update Lead (Completed) | Google Sheets | Update lead with call success data | Step 5.1.1- Extract Email    | Wait Before Sheet Refresh, Step 5.1.3 - Notify Slack (Lead Success) |                                                                                                   |
| Step 5.1.3 - Notify Slack (Lead Success) | Slack        | Notify successful lead call        | Step 5.1.2 - Update Lead (Completed) |                               |                                                                                                   |
| Wait Before Sheet Refresh     | Wait               | Pause to ensure sheet sync         | Step 5.2 - Notify Slack (No Answer), Step 5.1.2 - Update Lead (Completed) | Sync Updated Sheet              |                                                                                                   |
| Sync Updated Sheet            | Google Sheets      | Refresh leads list from sheet      | Wait Before Sheet Refresh    | Load Lead Sheet                  |                                                                                                   |
| Slack - All Done              | Slack              | Notify completion of all leads     | Has Leads to Process? (No)   | None                            |                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Purpose: Start workflow manually  
   - No special parameters.

2. **Add Google Sheets Node: Load Lead Sheet**  
   - Operation: Read rows from your leads spreadsheet.  
   - Credentials: Google Service Account with access to the sheet.  
   - Sheet ID and worksheet configured for leads data.

3. **Add Code Node: Filter Valid Leads**  
   - Write JavaScript to filter out leads already marked as processed or no answer.  
   - Input: Loaded lead data  
   - Output: Filtered leads array.

4. **Add IF Node: Has Leads to Process?**  
   - Condition: Check if filtered leads array length > 0.  
   - True branch proceeds; false branch ends workflow.

5. **Add Code Node: Clean Phone Number**  
   - Script to sanitize and format phone numbers to E.164 or Twilio compatible format.  
   - Input: Lead phone number.  
   - Output: Cleaned number.

6. **Add HTTP Request Node: Step 1 - Create Customer**  
   - Method: POST  
   - URL: Vapi customer creation endpoint  
   - Body: Include cleaned phone number and lead info  
   - Authentication: Vapi API key or OAuth token.

7. **Add HTTP Request Node: Step 2 - Initiate Call**  
   - Method: POST  
   - URL: Vapi call initiation endpoint  
   - Body: Customer ID from previous node, phone number  
   - Authentication: Vapi API credentials.

8. **Add Set Node: Loop Setup Variables**  
   - Initialize retry attempts and status flags, e.g., `attemptCount = 1`, `callStatus = 'initiated'`.

9. **Add Code Node: Set Attempt Count + Init Status**  
   - Manage counters and status flags for call monitoring.

10. **Add HTTP Request Node: Get Call Status from VAPI**  
    - Method: GET  
    - URL: Vapi call status endpoint with call ID  
    - Authentication: Vapi API credentials.

11. **Add Code Node: Check Final Status + shouldContinue Logic**  
    - Parse API response, decide if call is finished or polling should continue.

12. **Add IF Node: Should Continue Loop?**  
    - Condition: Continue if call ongoing; else proceed to data retrieval.

13. **Add Wait Node: Wait Before Retry**  
    - Duration: 3 seconds delay.

14. **Add Set Node: Prepare Loop Payload**  
    - Increment attempt count, update status variables.

15. **Connect Prepare Loop Payload back to Set Attempt Count + Init Status** for loop.

16. **Add HTTP Request Node: Step 3 - Get Call Data**  
    - Method: GET  
    - URL: Vapi call data endpoint  
    - Fetch transcript, audio, metadata.

17. **Add Set Node: Step 4 - Set (Parse Call Result)**  
    - Extract useful fields: transcript text, tone, call end reason, AI reply.

18. **Add IF Node: Step 5 - If (Call Answered?)**  
    - Branch based on call answered status.

19. **No Answer Branch:**  
    - Add Google Sheets Node: Step 5.1 - Update Lead (No Answer)  
      - Update lead row marking no answer, timestamp, status.  
    - Add Slack Node: Step 5.2 - Notify Slack (No Answer)  
      - Compose and send Slack alert for no answer.  
    - Add Wait Node: Wait Before Sheet Refresh (short delay).  
    - Connect to Sync Updated Sheet.

20. **Answered Call Branch:**  
    - Add Code Node: Step 5.1.1 - Extract Email (Regex)  
      - Use regex to parse email from transcript text, normalize spoken email formats.  
    - Add Google Sheets Node: Step 5.1.2 - Update Lead (Completed)  
      - Update lead row with status "Processed", extracted email, transcript, audio URL, call summary.  
    - Add Slack Node: Step 5.1.3 - Notify Slack (Lead Success)  
      - Notify Slack with detailed call and lead info.  
    - Add Wait Node: Wait Before Sheet Refresh.  
    - Connect to Sync Updated Sheet.

21. **Add Google Sheets Node: Sync Updated Sheet**  
    - Read updated lead list again for next iteration.

22. **Connect Sync Updated Sheet to Load Lead Sheet** to restart cycle.

23. **Add Slack Node: Slack - All Done**  
    - On no leads to process, send final Slack notification.

**Credentials Required:**  
- Google Service Account with Sheets API access.  
- Vapi.ai API credentials for customer creation, call initiation, and status polling.  
- Twilio phone number integrated within Vapi calls (handled via Vapi).  
- Slack Bot token with chat:write permission.

**Default Values / Constraints:**  
- Wait node delay fixed at 3 seconds for polling.  
- Retry attempts and maximum call duration logic handled in code nodes.  
- Email extraction regex robust to spoken email variants.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                           | Context or Link                                                                                          |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Full call transcripts, summaries, and audio recordings are saved to Google Sheets for audit and follow-up.                                                         | Workflow feature; screenshots available in description.                                                |
| Slack notifications configured for both missed and successful calls keep teams informed in real-time.                                                              | Slack integration with webhook IDs; useful for monitoring.                                             |
| Vapi.ai voice agent prompt is customized to understand broken or slow English and confirm data with smart questions.                                                | Custom Vapi prompt screenshot and configuration referenced in description.                             |
| The system supports retry logic for unanswered calls, ensuring no lead is lost.                                                                                      | Implemented through loop nodes and Slack alerts.                                                       |
| Email extraction handles complex spoken email formats, converting phrases like "at" and "dot" into valid email addresses.                                           | See code node “Extract Email (Regex)”; link to demonstration image provided.                           |
| Workflow is fully no-code except for small JavaScript snippets for data filtering and extraction.                                                                    | Enables easy adaptation and customization without coding expertise.                                   |
| Use cases include local business outreach, freelancer cold outreach, e-commerce follow-up, SaaS lead qualification, and appointment confirmation.                   | Practical value outlined for various business types.                                                   |
| Workflow license is MIT; fully open source and modifiable.                                                                                                           | https://github.com/TuguiDragos/n8n-ai-call-agent/blob/main/LICENSE                                    |
| Audio demo of the AI call agent "Amelia" available online for listening to real interaction examples.                                                                | https://raw.githubusercontent.com/TuguiDragos/n8n-ai-call-agent/main/audio.mp3                         |
| Workflow works with n8n cloud or self-hosted instances and requires only basic setup of API credentials and tokens.                                                 | Setup instructions summarized in description.                                                         |
| Slack message formatting and Google Sheets update cells are customizable inside respective nodes to fit different data schemas or notification styles.              | Flexible customization recommended for users.                                                         |

---

**Disclaimer:**  
The content above is exclusively derived from an automated workflow created with n8n, complying fully with content policies and legality. All processed data is public and lawful.