Automate Customer Support Emails using Gmail, OpenAI GPT-3.5, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-customer-support-emails-using-gmail--openai-gpt-3-5--and-google-sheets-3975


# Automate Customer Support Emails using Gmail, OpenAI GPT-3.5, and Google Sheets

### 1. Workflow Overview

This workflow automates customer support email handling by integrating Gmail, OpenAI GPT-3.5, and Google Sheets within n8n. It is designed to fetch new incoming emails labeled for support, classify and generate personalized replies using AI, send automated responses, and log all interactions for tracking and analytics.

**Target Use Cases:**  
- E-commerce brands managing repetitive support requests  
- Small teams aiming to reduce manual response time  
- Businesses seeking automated yet personalized customer service  

**Logical Blocks:**

- **1.1 Input Reception:** Trigger and fetch new support emails from Gmail filtered by label  
- **1.2 AI Processing:** Classify email content and generate a personalized reply using OpenAI GPT-3.5  
- **1.3 Response Delay:** Optional wait node to simulate human-like response time  
- **1.4 Data Preparation:** Parse AI output and prepare structured data for logging  
- **1.5 Logging:** Append interaction details to a Google Sheet for records  
- **1.6 Auto-Response:** Send the AI-generated personalized email reply back to the customer  

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Starts the workflow manually or via trigger, then fetches new unread or labeled support emails from Gmail.

- **Nodes Involved:**  
  - Start Workflow  
  - Fetch New Support Email

- **Node Details:**

  - **Start Workflow**  
    - Type: Manual Trigger  
    - Role: Entry point to manually start the workflow or connect to a scheduler if needed  
    - Configuration: Default manual trigger, no parameters  
    - Input: None  
    - Output: Triggers next node  
    - Edge Cases: No input errors; user must manually run or schedule  

  - **Fetch New Support Email**  
    - Type: Gmail Node  
    - Role: Retrieves all new support emails matching a Gmail label filter  
    - Configuration:  
      - Operation: getAll emails  
      - Filter: labelIds set to the specific label ID for support emails (e.g., "N8N-Test")  
      - Authentication: OAuth2 via Service Account  
    - Key Expressions: Uses filter to limit emails to the labeled support requests  
    - Input: Trigger from Start Workflow  
    - Output: List of fetched emails with metadata and content snippet  
    - Edge Cases:  
      - Authentication failures (expired token, permission issues)  
      - No new emails found (workflow can handle zero output gracefully)  
      - Gmail API rate limits  

#### 1.2 AI Processing

- **Overview:**  
  Classifies the email content into categories, determines tone, and generates a personalized reply using OpenAI's GPT-3.5 model.

- **Nodes Involved:**  
  - AI: Categorize Customer Request  
  - Wait for AI Response

- **Node Details:**

  - **AI: Categorize Customer Request**  
    - Type: OpenAI (via LangChain node)  
    - Role: Sends customer message snippet to GPT-3.5 to classify and generate reply JSON  
    - Configuration:  
      - Model: gpt-3.5-turbo  
      - Prompt: Custom system prompt instructing the AI to:  
        1. Read the customer message  
        2. Reply helpfully in a clear, friendly tone (excluding category/tone in the reply)  
        3. Return a JSON object with `reply`, `category` (from predefined list), and `tone` (from predefined list)  
      - Messages: Uses an expression injecting the fetched email snippet dynamically  
    - Input: Emails from Gmail node  
    - Output: AI response containing JSON with reply, category, tone  
    - Edge Cases:  
      - API key or quota errors  
      - AI returning malformed JSON causing parse errors downstream  
      - Timeout or latency issues  

  - **Wait for AI Response**  
    - Type: Wait Node  
    - Role: Inserts a delay (60 seconds) to simulate human response time or allow asynchronous processing  
    - Configuration: Wait for 60 seconds  
    - Input: AI node output  
    - Output: Proceeds to data preparation after delay  
    - Edge Cases:  
      - Workflow timeout if wait exceeds n8n limits  
      - Interruptions or manual workflow stop  

#### 1.3 Data Preparation

- **Overview:**  
  Parses the AI-generated JSON reply and extracts relevant fields to prepare data for logging into Google Sheets.

- **Nodes Involved:**  
  - Prepare Data for Sheet Entry

- **Node Details:**

  - **Prepare Data for Sheet Entry**  
    - Type: Set Node  
    - Role: Extracts and assigns `reply`, `category`, and `tone` from AI JSON response for downstream use  
    - Configuration:  
      - Assigns:  
        - `reply` = parsed JSON `reply` from AI message content  
        - `category` = parsed JSON `category`  
        - `tone` = parsed JSON `tone`  
    - Input: Output from Wait node (which holds AI response)  
    - Output: Structured data for logging and response  
    - Edge Cases:  
      - JSON parse errors if AI response is malformed  
      - Missing fields in AI output  

#### 1.4 Logging

- **Overview:**  
  Logs structured interaction data into a Google Sheet, including timestamp, email address, subject, category, tone, and AI reply.

- **Nodes Involved:**  
  - Log Request in Google Sheets

- **Node Details:**

  - **Log Request in Google Sheets**  
    - Type: Google Sheets Node  
    - Role: Appends a new row to a Google Sheet with customer support data  
    - Configuration:  
      - Operation: Append  
      - Sheet name: Uses specified Sheet tab (`gid=0`)  
      - Document ID: Set to the target Google Sheet ID  
      - Columns mapped: `Timestamp`, `Email`, `Subject`, `Category`, `Tone`, `Reply`  
      - Email extracted from "From" field using regex to parse email address  
      - Timestamp uses current workflow execution time  
      - Authentication: Google Service Account  
    - Input: Prepared data from Set node + original email details  
    - Output: Confirmation of append operation  
    - Edge Cases:  
      - Authentication or permission errors on Sheet API  
      - Google Sheets API rate limits  
      - Invalid or missing Sheet ID or tab name  

#### 1.5 Auto-Response

- **Overview:**  
  Sends the personalized AI-generated reply back to the customer via Gmail.

- **Nodes Involved:**  
  - Send Auto-Response to Customer

- **Node Details:**

  - **Send Auto-Response to Customer**  
    - Type: Gmail Node  
    - Role: Sends an email reply to the original sender with AI-generated message  
    - Configuration:  
      - Send To: Extracted email address from original `From` field  
      - Subject: Prefixed with "RE:" plus original email subject  
      - Message: AI-generated reply text from Google Sheets logged data (ensures latest cleaned reply)  
      - Email type: Plain text  
      - Authentication: OAuth2 via Service Account  
    - Input: Output from Google Sheets node (uses reply field)  
    - Output: Email send confirmation  
    - Edge Cases:  
      - Email send failures (SMTP issues, invalid recipient)  
      - Authentication or quota errors  
      - Missing email address parsing errors  

#### 1.6 Additional Notes

- **Sticky Note Node**  
  - Provides a detailed overview and explanation of workflow steps, useful for documentation and user reference  
  - Not connected to workflow logic but visually covers and annotates the entire flow  

---

### 3. Summary Table

| Node Name                     | Node Type                      | Functional Role                     | Input Node(s)                 | Output Node(s)              | Sticky Note                                                                                                 |
|-------------------------------|--------------------------------|-----------------------------------|------------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------|
| Start Workflow                | Manual Trigger                 | Entry point to start the workflow | None                         | Fetch New Support Email      | --- Overview of all steps is in the sticky note node covering the workflow                                   |
| Fetch New Support Email       | Gmail                         | Fetches new emails with label     | Start Workflow               | AI: Categorize Customer Request | --- Overview of all steps is in the sticky note node covering the workflow                                   |
| AI: Categorize Customer Request | OpenAI (LangChain)            | Classifies email & generates reply | Fetch New Support Email       | Wait for AI Response         | --- Overview of all steps is in the sticky note node covering the workflow                                   |
| Wait for AI Response          | Wait                          | Simulates response delay           | AI: Categorize Customer Request | Prepare Data for Sheet Entry  | --- Overview of all steps is in the sticky note node covering the workflow                                   |
| Prepare Data for Sheet Entry  | Set                           | Parses AI output for logging       | Wait for AI Response          | Log Request in Google Sheets | --- Overview of all steps is in the sticky note node covering the workflow                                   |
| Log Request in Google Sheets  | Google Sheets                 | Logs interaction into a spreadsheet | Prepare Data for Sheet Entry  | Send Auto-Response to Customer | --- Overview of all steps is in the sticky note node covering the workflow                                   |
| Send Auto-Response to Customer | Gmail                         | Sends AI-generated reply email     | Log Request in Google Sheets  | None                        | --- Overview of all steps is in the sticky note node covering the workflow                                   |
| Sticky Note                  | Sticky Note                   | Documentation and step overview    | None                         | None                        | Details workflow steps, from fetching emails to sending replies and logging                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: "Start Workflow"  
   - Type: Manual Trigger (default)  
   - No special parameters  

2. **Create Gmail Node to Fetch Emails**  
   - Name: "Fetch New Support Email"  
   - Type: Gmail  
   - Operation: `getAll`  
   - Filters: Set `labelIds` to your Gmail label ID for support emails (e.g., "N8N-Test")  
   - Authentication: Configure Gmail OAuth2 credentials linked to your account  
   - Connect "Start Workflow" output to this node input  

3. **Create OpenAI Node for Classification & Reply**  
   - Name: "AI: Categorize Customer Request"  
   - Type: OpenAI (LangChain)  
   - Model: `gpt-3.5-turbo`  
   - Messages: Construct system prompt instructing AI to read customer message, provide friendly reply, and return JSON with `reply`, `category`, and `tone`. Inject email snippet dynamically with expression: `{{ $json["snippet"] }}`  
   - Authentication: OpenAI API key configured  
   - Connect "Fetch New Support Email" output to this node input  

4. **Add Wait Node**  
   - Name: "Wait for AI Response"  
   - Type: Wait  
   - Parameters: Wait 60 seconds (adjustable)  
   - Connect "AI: Categorize Customer Request" output to this node input  

5. **Add Set Node for Data Preparation**  
   - Name: "Prepare Data for Sheet Entry"  
   - Type: Set  
   - Assignments:  
     - `reply` = `={{ JSON.parse($json["message"]["content"]).reply }}`  
     - `category` = `={{ JSON.parse($json["message"]["content"]).category }}`  
     - `tone` = `={{ JSON.parse($json["message"]["content"]).tone }}`  
   - Connect "Wait for AI Response" output to this node input  

6. **Add Google Sheets Node for Logging**  
   - Name: "Log Request in Google Sheets"  
   - Type: Google Sheets  
   - Operation: Append  
   - Document ID: Paste your Google Sheet ID  
   - Sheet Name: Use your sheet tab (e.g., `gid=0`)  
   - Columns to map:  
     - `Timestamp` = `={{ $now }}`  
     - `Email` = Extract from Gmail "From" with regex: `={{ $node["Fetch New Support Email"].json["From"].match(/<(.+)>/)?.[1] || $node["Fetch New Support Email"].json["From"] }}`  
     - `Subject` = `={{ $node["Fetch New Support Email"].json["Subject"] }}`  
     - `Category` = `={{ $json["category"] }}`  
     - `Tone` = `={{ $json["tone"] }}`  
     - `Reply` = `={{ $json["reply"] }}`  
   - Authentication: Google Sheets Service Account credentials  
   - Connect "Prepare Data for Sheet Entry" output to this node input  

7. **Add Gmail Node to Send Auto-Response**  
   - Name: "Send Auto-Response to Customer"  
   - Type: Gmail  
   - Send To: Extract email from original "From": `={{ $node["Fetch New Support Email"].json["From"].match(/<(.*)>/)?.[1] || $node["Fetch New Support Email"].json["From"] }}`  
   - Subject: Prefix with "RE:" plus original subject: `=RE: {{ $node["Fetch New Support Email"].json["Subject"] }}`  
   - Message: Use reply from logged data: `={{ $node["Log Request in Google Sheets"].json["Reply"] }}`  
   - Email Type: Plain text  
   - Authentication: Gmail OAuth2 (same as fetch node)  
   - Connect "Log Request in Google Sheets" output to this node input  

8. **Optional: Add Sticky Note Node**  
   - For documentation inside the workflow, add a sticky note with overview and instructions  

9. **Test and Schedule**  
   - Run manual trigger to test  
   - Optionally replace manual trigger with Cron or Webhook trigger for automation  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                   | Context or Link                                                                                               |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Full workflow demo video available for visual guidance.                                                                                                                                                                        | [Vimeo Demo Video](https://vimeo.com/1070420977/417e0490c5?share=copy)                                        |
| Workflow is highly customizable: modify AI prompt for categories, add filters, integrate Slack/Discord, or add translation nodes for multilingual support.                                                                     | Customization Guidance section in the workflow description                                                    |
| Requires proper setup of Gmail OAuth2, Google Sheets Service Account with Sheets API enabled, and OpenAI API keys. Credentials must have correct scopes and permissions.                                                        | Setup Instructions section                                                                                     |
| Email parsing uses regex to extract email address from "From" field; be aware of edge cases with non-standard email formats.                                                                                                   | Node details under Gmail nodes                                                                                  |
| AI response depends on well-formed JSON output; consider adding error handling or validation if expanding workflow.                                                                                                           | AI node edge cases                                                                                              |
| Google Sheets must have columns: Date/Timestamp, Email, Subject, Category, Reply, Tone for proper logging and analytics.                                                                                                       | Requirements section                                                                                            |
| Useful for automating customer support in e-commerce and SMBs to reduce manual workload while maintaining personalized replies.                                                                                                | Use Case section                                                                                                |
| Contact and support available via email or website for further customization.                                                                                                                                                   | [Contact Me](mailto:contact@tuguidragos.com), [tuguidragos.com](https://tuguidragos.com)                       |

---

**Disclaimer:** The content provided is extracted and documented solely from the given n8n workflow JSON. It respects all applicable policies and contains no illegal or protected data. All processed data is legal and public.