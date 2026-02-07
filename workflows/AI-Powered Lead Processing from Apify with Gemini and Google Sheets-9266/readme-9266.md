AI-Powered Lead Processing from Apify with Gemini and Google Sheets

https://n8nworkflows.xyz/workflows/ai-powered-lead-processing-from-apify-with-gemini-and-google-sheets-9266


# AI-Powered Lead Processing from Apify with Gemini and Google Sheets

### 1. Workflow Overview

This workflow automates the processing of scraped lead data obtained via Apify/Apollo APIs, leveraging Google Gemini AI for validation and enrichment, and storing results in Google Sheets. It is designed for batch processing large volumes of leads (up to 1000 per batch), ensuring data quality through AI-driven validation, deduplication, and formatting. After processing, a summarized report is sent via Telegram.

**Target Use Cases:**  
- Businesses or sales teams scraping leads from Apollo or Apify and wanting automated validation and integration into Google Sheets.  
- Scenarios requiring AI-powered data cleansing, unique ID generation, and deduplication.  
- Use cases needing batch processing with rate limiting and Telegram notifications.

**Logical Blocks:**  
- **1.1 Trigger & Input Reception:** Initiates workflow from an external trigger and receives raw lead data.  
- **1.2 Lead Data Acquisition:** Calls Apify/Apollo API to fetch leads in JSON format.  
- **1.3 Batch Splitting & Loop:** Splits large lead sets into manageable batches (1000 leads max) and implements loop with delay.  
- **1.4 AI Processing & Validation:** Uses Google Gemini AI agent with Langchain integration to validate, cleanse, generate IDs, deduplicate, and prepare data.  
- **1.5 Google Sheets Integration:** Reads existing sheet rows for deduplication and appends validated leads.  
- **1.6 Telegram Reporting:** Sends summarized batch processing reports via Telegram bot.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Trigger & Input Reception

**Overview:**  
Starts the workflow upon execution by another workflow, passing through lead data for further processing.

**Nodes Involved:**  
- When Executed by Another Workflow  
- Sticky Note1 (documentation)

**Node Details:**

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Entry point triggering this workflow; passthrough input data from calling workflow.  
  - Configuration: Input source set to passthrough for data forwarding.  
  - Inputs: Triggered externally.  
  - Outputs: Sends data to "APIFY Post Request".  
  - Edge Cases: Workflow not triggered → no processing; no input data → downstream failure.  
  - Version: 1.1

- **Sticky Note1**  
  - Serves purely for documentation.

---

#### 1.2 Lead Data Acquisition

**Overview:**  
Retrieves scraped leads via Apify/Apollo API using a POST request, then handles asynchronous scraping with a wait and GET request to retrieve results.

**Nodes Involved:**  
- APIFY Post Request  
- Wait for APIFY to Scrape  
- Apify Get Request  
- Sticky Note2 (API call info)

**Node Details:**

- **APIFY Post Request**  
  - Type: HTTP Request  
  - Role: Initiate scraping job by posting request to Apify/Apollo API endpoint.  
  - Configuration: POST method; URL and authentication headers configured externally.  
  - Inputs: Receives data from trigger node.  
  - Outputs: Sends to Loop Over Items and Wait for APIFY to Scrape.  
  - Edge Cases: API auth failure, invalid endpoint, network timeout, malformed response.  
  - Version: 4.2

- **Wait for APIFY to Scrape**  
  - Type: Wait  
  - Role: Delays next step by 30 seconds to allow scraping completion.  
  - Configuration: Fixed wait time of 30 seconds.  
  - Inputs: From APIFY Post Request.  
  - Outputs: To Apify Get Request.  
  - Edge Cases: Insufficient wait → incomplete data; too long → delays processing.  
  - Version: 1.1

- **Apify Get Request**  
  - Type: HTTP Request  
  - Role: Polls Apify API to retrieve scraping results.  
  - Configuration: GET method; uses scraping job identifier from previous node.  
  - Inputs: After wait.  
  - Outputs: To batch splitter node.  
  - Edge Cases: API timeout, no data yet, malformed data.  
  - Version: 4.2

- **Sticky Note2**  
  - Explains API call setup and parameters.

---

#### 1.3 Batch Splitting & Loop

**Overview:**  
Splits the retrieved leads into batches of 1000 items for manageable processing, then loops batches with 30s delay between iterations.

**Nodes Involved:**  
- Loop Over Items (SplitInBatches)  
- Sticky Note3 (batch processing explanation)  
- Sticky Note4 (rate limiting)  
- Wait for APIFY to Scrape (part of loop)  

**Node Details:**

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Splits lead array into batches of 1000.  
  - Configuration: batchSize=1000, reset=false (does not reset batch counter).  
  - Inputs: Lead data array from Apify Get Request.  
  - Outputs:  
    - Output 1: Current batch to AI processing.  
    - Output 2: Loop for next batch via Wait node.  
  - Edge Cases: Input array empty or smaller than batch size; batches with fewer than 1000 leads.  
  - Version: 3

- **Sticky Note3 & Sticky Note4**  
  - Describe batch processing logic and 30-second wait to avoid API limits.

---

#### 1.4 AI Processing & Validation

**Overview:**  
This is the core data processing block. The Google Gemini AI agent validates lead data, applies formatting rules, generates unique Lead IDs, deduplicates by email (checking existing Google Sheets data), and prepares batch summary statistics. It uses Langchain integration with memory for contextual awareness.

**Nodes Involved:**  
- Knowledge Base Agent (Langchain Agent Node)  
- Google Gemini Chat Model (AI Language Model Node)  
- Simple Memory (Context Buffer)  
- Get row(s) in sheet in Google Sheets (to read existing leads)  
- Append row in sheet in Google Sheets (to write validated leads)  
- Sticky Note5 (AI engine explanation)  
- Sticky Note6 (Google Sheets integration details)

**Node Details:**

- **Knowledge Base Agent**  
  - Type: Langchain Agent  
  - Role: Main AI logic node; parses leads batch, validates required fields (Name, Email, Company Name), formats phone/location, generates Lead IDs in `AP-DDMMYY-xxxx` format, deduplicates by email.  
  - Configuration: Uses custom prompt instructing detailed validation, formatting, and summary generation.  
  - Inputs: Batch of leads from Loop Over Items, existing sheet rows from Get row(s) node.  
  - Outputs: Formatted data for appending to Google Sheets, and summary message text for Telegram.  
  - Edge Cases: Missing critical fields → leads skipped; missing optional fields → flagged; AI response failures or timeouts.  
  - Version: 1.9  
  - Special: Uses AI memory buffer for 20-message context.

- **Google Gemini Chat Model**  
  - Type: Language Model (Google Gemini)  
  - Role: Provides AI natural language processing capabilities for Knowledge Base Agent.  
  - Configuration: Default; linked to agent node.  
  - Edge Cases: API quota limits, auth errors.

- **Simple Memory**  
  - Type: Memory Buffer for Langchain  
  - Role: Stores conversation context to provide continuity for AI agent.  
  - Configuration: 20-message window, session key based on Telegram message ID.  
  - Edge Cases: Memory overflow or reset.

- **Get row(s) in sheet in Google Sheets**  
  - Type: Google Sheets Tool (Read)  
  - Role: Reads existing leads from Google Sheet to enable deduplication by email.  
  - Configuration: Reads from specific sheet/tab "Raw Scraping" in designated Google Sheet document.  
  - Edge Cases: Sheet access errors, empty sheet, API limits.

- **Append row in sheet in Google Sheets**  
  - Type: Google Sheets Tool (Append)  
  - Role: Writes validated and processed leads row-by-row to Google Sheets.  
  - Configuration: Maps AI output fields to sheet columns including Lead ID, Name, Email, Phone, Company, etc.  
  - Edge Cases: Sheet write errors, quota limits.

- **Sticky Note5 & Sticky Note6**  
  - Provide detailed explanation of AI processing and Google Sheets integration.

---

#### 1.5 Telegram Reporting

**Overview:**  
Sends a consolidated Telegram message per batch summarizing total leads processed, successfully added, flagged for missing optional fields, and skipped for missing critical fields.

**Nodes Involved:**  
- Send a text message (Telegram node)  
- Sticky Note7 (Telegram reporting details)  

**Node Details:**

- **Send a text message**  
  - Type: Telegram  
  - Role: Sends batch summary message to Telegram chat.  
  - Configuration: Message text received from AI agent output; chat ID dynamically set from Telegram trigger input data.  
  - Inputs: Text string from Knowledge Base Agent node output.  
  - Edge Cases: Telegram API errors, invalid chat ID, message formatting issues.  
  - Version: 1.2

- **Sticky Note7**  
  - Describes message content and formatting, including success, warning, and error counts plus lead identifiers.

---

### 3. Summary Table

| Node Name                         | Node Type                         | Functional Role                          | Input Node(s)              | Output Node(s)               | Sticky Note                                                                                                     |
|----------------------------------|----------------------------------|----------------------------------------|----------------------------|-----------------------------|-----------------------------------------------------------------------------------------------------------------|
| Sticky Note                      | Sticky Note                      | Documentation                          |                            |                             | 📋 LEAD SCRAPING AUTOMATION - SETUP GUIDE (full setup and data rules explained)                                |
| Sticky Note1                     | Sticky Note                      | Documentation                          |                            |                             | 🚀 TRIGGER (starts workflow when executed by another workflow)                                                 |
| Sticky Note2                     | Sticky Note                      | Documentation                          |                            |                             | 🌐 API CALL (details on Apify/Apollo API request setup)                                                       |
| Sticky Note3                     | Sticky Note                      | Documentation                          |                            |                             | 🔁 BATCH PROCESSING (batch size 1000, loop explanation)                                                       |
| Sticky Note4                     | Sticky Note                      | Documentation                          |                            |                             | ⏱️ RATE LIMITING (30 seconds wait between batches)                                                            |
| Sticky Note5                     | Sticky Note                      | Documentation                          |                            |                             | 🤖 AI PROCESSING ENGINE (Google Gemini AI validation and processing details)                                  |
| Sticky Note6                     | Sticky Note                      | Documentation                          |                            |                             | 📊 GOOGLE SHEETS (append and read logic explained)                                                            |
| Sticky Note7                     | Sticky Note                      | Documentation                          |                            |                             | 📱 TELEGRAM REPORT (batch summary message content)                                                            |
| When Executed by Another Workflow | Execute Workflow Trigger         | Workflow entry trigger                  |                            | APIFY Post Request           | 🚀 TRIGGER (starts workflow when executed by another workflow)                                                 |
| APIFY Post Request               | HTTP Request                     | Initiate Apify/Apollo scraping request | When Executed by Another Workflow | Loop Over Items, Wait for APIFY to Scrape | 🌐 API CALL (configure URL, headers, body, POST method)                                                        |
| Wait for APIFY to Scrape         | Wait                            | Wait 30s for scraping completion       | APIFY Post Request          | Apify Get Request            | ⏱️ RATE LIMITING (waits 30 seconds to avoid API limits)                                                       |
| Apify Get Request                | HTTP Request                     | Retrieve scraping results               | Wait for APIFY to Scrape    | Loop Over Items              | 🌐 API CALL (polls Apify for results)                                                                         |
| Loop Over Items                  | SplitInBatches                   | Batch splitting of leads (1000 items)  | Apify Get Request           | Knowledge Base Agent, Wait for APIFY to Scrape | 🔁 BATCH PROCESSING (splits leads into 1000 item batches, loops)                                              |
| Knowledge Base Agent             | Langchain Agent                  | AI validation, formatting, deduplication | Loop Over Items, Get row(s) in sheet in Google Sheets, Append row in sheet in Google Sheets, Simple Memory, Google Gemini Chat Model | Send a text message                                   | 🤖 AI PROCESSING ENGINE (validates leads, generates IDs, produces summary)                                    |
| Google Gemini Chat Model         | Langchain Language Model         | Provides AI NLP processing              | Knowledge Base Agent        | Knowledge Base Agent         | 🤖 AI PROCESSING ENGINE (Google Gemini AI)                                                                     |
| Simple Memory                   | Langchain Memory Buffer          | Maintains AI conversation context      | Knowledge Base Agent        | Knowledge Base Agent         | 🤖 AI PROCESSING ENGINE (20-message context window)                                                            |
| Get row(s) in sheet in Google Sheets | Google Sheets Tool (Read)        | Reads existing leads for deduplication | Knowledge Base Agent        | Knowledge Base Agent         | 📊 GOOGLE SHEETS (reads existing sheet data for deduplication)                                                |
| Append row in sheet in Google Sheets | Google Sheets Tool (Append)      | Appends validated leads to Google Sheets | Knowledge Base Agent        | Knowledge Base Agent         | 📊 GOOGLE SHEETS (writes processed leads to sheet)                                                            |
| Send a text message             | Telegram                        | Sends Telegram batch summary report    | Knowledge Base Agent        |                             | 📱 TELEGRAM REPORT (sends consolidated batch summary)                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add **Execute Workflow Trigger** node named "When Executed by Another Workflow".  
   - Set input source to "passthrough".

2. **Set up Apify/Apollo Scraping Request:**  
   - Add **HTTP Request** node named "APIFY Post Request".  
   - Configure method to POST.  
   - Set URL to Apify/Apollo scraping API endpoint.  
   - Add necessary authentication headers or credentials.  
   - Connect "When Executed by Another Workflow" → "APIFY Post Request".

3. **Add Wait Node for Scraping Completion:**  
   - Add **Wait** node named "Wait for APIFY to Scrape".  
   - Set wait time to 30 seconds.  
   - Connect "APIFY Post Request" → "Wait for APIFY to Scrape".

4. **Retrieve Scraping Results:**  
   - Add **HTTP Request** node named "Apify Get Request".  
   - Configure as GET request to fetch scraping results, using job ID from previous POST response.  
   - Connect "Wait for APIFY to Scrape" → "Apify Get Request".

5. **Batch Splitter:**  
   - Add **SplitInBatches** node named "Loop Over Items".  
   - Set batch size to 1000, reset: false.  
   - Connect "Apify Get Request" → "Loop Over Items".

6. **Google Sheets Setup:**  
   - Create a Google Sheet with columns: Lead ID, Name, Email, Phone Number, Company Name, Job Title, Website / LinkedIn, Address, Company Summary, Relevant Partner (and optional fields as needed).  
   - Share with appropriate service account email.  
   - Add Google Sheets OAuth2 credentials in n8n.

7. **Google Sheets Read Node:**  
   - Add **Google Sheets Tool** node named "Get row(s) in sheet in Google Sheets".  
   - Configure to read all rows from the leads sheet (e.g., "Raw Scraping" tab).  
   - Connect this node as an AI tool input later (see step 9).

8. **Google Sheets Append Node:**  
   - Add **Google Sheets Tool** node named "Append row in sheet in Google Sheets".  
   - Map columns to incoming AI-processed data fields (Name, Email, Lead ID, etc.).  
   - Connect this node as an AI tool input later (see step 9).

9. **Add AI Language Model Node:**  
   - Add **Google Gemini Chat Model** node named "Google Gemini Chat Model".  
   - Configure API credentials for Google Gemini AI.  
   - Connect to the Langchain Agent node.

10. **Add AI Memory Node:**  
    - Add **Simple Memory** Langchain node named "Simple Memory".  
    - Configure with 20-message context window and session key based on Telegram message ID or unique batch key.

11. **Add Langchain Agent Node:**  
    - Add **Langchain Agent** node named "Knowledge Base Agent".  
    - Configure prompt text with detailed instructions on validating leads, generating Lead IDs, deduplicating by email, formatting fields, and producing a Telegram summary per batch.  
    - Connect inputs:  
      - From "Loop Over Items" batch output (current batch).  
      - From "Get row(s) in sheet in Google Sheets" (existing leads).  
      - From "Append row in sheet in Google Sheets" (for writing leads).  
      - From "Simple Memory" (for context).  
      - From "Google Gemini Chat Model" (for AI processing).  
    - Connect output to Telegram node.

12. **Connect Batch Loop:**  
    - From second output of "Loop Over Items", connect back to "Wait for APIFY to Scrape" for loop continuation.

13. **Add Telegram Node:**  
    - Add **Telegram** node named "Send a text message".  
    - Configure chat ID dynamically (using input from Telegram trigger or external data).  
    - Set text to AI agent output (summary message).  
    - Connect output of "Knowledge Base Agent" → "Send a text message".

14. **Final Checks:**  
    - Ensure all nodes have proper credentials set (Google Sheets OAuth2, Telegram Bot Token, Google Gemini API key).  
    - Validate API endpoints and auth for Apify/Apollo.  
    - Test workflow with sample data batches.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                     |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Detailed setup guide and data processing rules are included in initial sticky note for easy reference. | See Sticky Note at workflow start for full instructions.                                          |
| Telegram bot creation requires @BotFather and token integration into n8n credentials.            | https://core.telegram.org/bots#6-botfather                                                        |
| Google Gemini API key must be obtained from Google AI Studio and configured in n8n credentials.  | https://studio.google.ai/                                                                          |
| Google Sheets must be shared with the service account email associated with OAuth2 credentials. | https://support.google.com/docs/answer/2494822                                                    |
| Lead ID format: AP-DDMMYY-xxxx where xxxx is incremental per batch starting at 0001.             | Enforced by AI agent logic in Langchain prompt.                                                   |
| One Telegram summary message per batch is generated, no per-lead messages to avoid spam.          | See Sticky Note7 for message formatting examples.                                                 |
| Workflow handles up to 1000 leads per batch to avoid API limits and processing overload.          | Batch size set in SplitInBatches node.                                                            |
| AI processing includes memory buffer of 20 messages for context continuity.                      | Configured in Simple Memory node.                                                                 |
| Skips leads missing required fields (Name, Email, Company Name); flags those missing optional fields. | Ensures clean, reliable data in Google Sheets.                                                    |

---

**Disclaimer:** The provided document is a detailed technical reference for an n8n workflow automating lead processing with Apify, Google Gemini AI, Google Sheets, and Telegram integration. It respects all applicable content policies and handles only legal, public data.