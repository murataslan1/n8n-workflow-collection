Automate Email Classification & Summary with Gmail, GPT-4o-mini & Notion

https://n8nworkflows.xyz/workflows/automate-email-classification---summary-with-gmail--gpt-4o-mini---notion-7276


# Automate Email Classification & Summary with Gmail, GPT-4o-mini & Notion

### 1. Workflow Overview

This workflow automates the classification and summarization of unread emails from a Gmail inbox using GPT-4o-mini via Azure OpenAI, and archives the processed insights into Notion for long-term storage and reference. It is designed for personal or small business users who want to triage their email efficiently by categorizing messages into priority buckets and generating digestible summaries.

The workflow is logically structured into the following blocks:

- **1.1 Workflow Initiation:** Manual trigger to start the workflow on demand.
- **1.2 Email Retrieval:** Fetch unread emails from Gmail inbox.
- **1.3 Email Batch Processing:** Split bulk email data into individual items for parallel processing.
- **1.4 Data Formatting:** Extract and standardize key email fields for AI input.
- **1.5 AI Email Classification:** Use Azure OpenAI GPT-4o-mini model to classify email importance.
- **1.6 Summary Formatting:** Convert AI classification and email metadata into a structured summary.
- **1.7 Summary Aggregation:** Combine individual email summaries into a comprehensive digest.
- **1.8 Notion Archival:** Store the final aggregated summary into a Notion page for knowledge management.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Workflow Initiation

- **Overview:**  
  Provides a manual trigger interface to start the entire email processing and classification workflow on demand, facilitating testing and on-the-fly execution.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’  
  - Sticky Note (Workflow Initiator)

- **Node Details:**  
  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to manually initiate workflow execution.  
    - Config: Default manual trigger, no parameters.  
    - Input: None  
    - Output: Starts flow to "Get Unread Emails".  
    - Edge Cases: None specific; user must manually execute.  
  - **Sticky Note (Workflow Initiator)**  
    - Describes purpose and criticality of manual trigger.

---

#### Block 1.2: Email Retrieval

- **Overview:**  
  Retrieves all unread emails from the Gmail inbox using Gmail API, serving as the primary data source for downstream processing.

- **Nodes Involved:**  
  - Get Unread Emails  
  - Sticky Note (Email Retrieval Engine)

- **Node Details:**  
  - **Get Unread Emails**  
    - Type: Gmail Node (API integration)  
    - Role: Fetch all unread emails labeled "INBOX" and "UNREAD".  
    - Config: Operation `getAll` with label filters ["UNREAD", "INBOX"].  
    - Credentials: Gmail OAuth2 authentication required.  
    - Input: Trigger from manual start node.  
    - Output: Array of unread email message objects.  
    - Edge Cases: API rate limits, authentication errors, empty inbox (returns empty array).  
  - **Sticky Note (Email Retrieval Engine)**  
    - Emphasizes importance of fetching email metadata and content reliably.

---

#### Block 1.3: Email Batch Processing

- **Overview:**  
  Splits the array of emails into individual items to enable processing each email independently and in parallel.

- **Nodes Involved:**  
  - Split Emails  
  - Sticky Note (Email Batch Processor)

- **Node Details:**  
  - **Split Emails**  
    - Type: SplitInBatches  
    - Role: Converts bulk email array into separate workflow items for each email.  
    - Config: Default batching options, no batch size limit explicitly set.  
    - Input: Emails array from "Get Unread Emails".  
    - Output: Individual email JSON objects, routed one by one.  
    - Edge Cases: Large email volumes may cause execution delays; batch size tuning recommended if needed.  
  - **Sticky Note (Email Batch Processor)**  
    - Notes importance of parallel processing and avoiding bottlenecks.

---

#### Block 1.4: Data Formatting

- **Overview:**  
  Extracts and standardizes key fields (Subject, From, Text snippet) from each email to prepare clean input for AI classification.

- **Nodes Involved:**  
  - Edit Fields  
  - Sticky Note (Data Structure Optimizer)

- **Node Details:**  
  - **Edit Fields**  
    - Type: Set Node  
    - Role: Assigns/renames fields from raw email JSON for consistency.  
    - Config:  
      - Subject ← extracted from email.headers.subject  
      - From ← extracted from email.headers.from  
      - Text ← extracted from email.text  
    - Input: Single email item from "Split Emails" node.  
    - Output: Cleaned single email JSON with standardized fields.  
    - Edge Cases: Missing headers or text fields fallback silently; may cause incomplete input to AI.  
  - **Sticky Note (Data Structure Optimizer)**  
    - Highlights importance of consistent data format for AI input.

---

#### Block 1.5: AI Email Classification

- **Overview:**  
  Runs a language model chain using Azure OpenAI GPT-4o-mini to classify each email into one of four categories: Important, Ignore, Delegate, or Reply Later.

- **Nodes Involved:**  
  - Basic LLM Chain  
  - Azure OpenAI Chat Model  
  - Sticky Note (AI Email Analyzer)  
  - Sticky Note (Enterprise AI Engine)

- **Node Details:**  
  - **Basic LLM Chain**  
    - Type: Langchain LLM Chain  
    - Role: Constructs a classification prompt with email fields and sends it to the language model.  
    - Config:  
      - Prompt includes Subject, From, Text snippet.  
      - Request: One-word classification output (Important, Ignore, Delegate, Reply Later).  
      - Messaging style defines the assistant as an email triage AI.  
    - Input: Single email fields from "Edit Fields".  
    - Output: Classification text string.  
    - Edge Cases: AI response may be ambiguous or off-format; no fallback handling shown.  
  - **Azure OpenAI Chat Model**  
    - Type: Langchain Azure OpenAI LLM  
    - Role: Provides actual GPT-4o-mini model inference.  
    - Config: Uses Azure OpenAI credentials with GPT-4o-mini model.  
    - Input: From "Basic LLM Chain" (LLM connection).  
    - Output: Classification response text.  
    - Edge Cases: API errors, rate limits, network issues.  
  - **Sticky Note (AI Email Analyzer)**  
    - Describes AI’s role in extracting actionable email insights.  
  - **Sticky Note (Enterprise AI Engine)**  
    - Notes enterprise-grade AI reliability and configuration.

---

#### Block 1.6: Summary Formatting

- **Overview:**  
  Formats the classification result together with email metadata into a professional summary string for reporting.

- **Nodes Involved:**  
  - Format Summary  
  - Sticky Note (Insight Formatter)

- **Node Details:**  
  - **Format Summary**  
    - Type: Code Node (JavaScript)  
    - Role: Builds a markdown summary line combining classification, subject, and sender.  
    - Code Summary:  
      - Extract classification from AI output.  
      - Extract subject and from fields from original email.  
      - Compose summary string: `**<Classification>**: <Subject> (from: <From>)`.  
    - Input: Classification and original email JSON.  
    - Output: JSON with classification, subject, from, and summary string.  
    - Edge Cases: Missing fields fallback to “No Subject” or “Unknown Sender.”  
  - **Sticky Note (Insight Formatter)**  
    - Emphasizes transformation of AI output into actionable insights.

---

#### Block 1.7: Summary Aggregation

- **Overview:**  
  Aggregates all individual email summaries into a combined dataset for batch reporting.

- **Nodes Involved:**  
  - Aggregate Summary  
  - Sticky Note (Intelligence Consolidator)

- **Node Details:**  
  - **Aggregate Summary**  
    - Type: Aggregate Node  
    - Role: Collects all individual summaries into a single aggregated output array.  
    - Config: Aggregates all item data into one array.  
    - Input: From "Format Summary".  
    - Output: Aggregated summaries array.  
    - Edge Cases: Aggregation failure if input is missing or malformed.  
  - **Sticky Note (Intelligence Consolidator)**  
    - Notes the creation of overview dashboards and trend analytics.

---

#### Block 1.8: Notion Archival

- **Overview:**  
  Sends the aggregated email digest summary into a Notion page, creating an archival record for tracking and reference.

- **Nodes Involved:**  
  - Send to Notion  
  - Sticky Note (Knowledge Base Integration)

- **Node Details:**  
  - **Send to Notion**  
    - Type: Notion Node  
    - Role: Creates a new Notion page titled with current date/time and classification summary.  
    - Config:  
      - Title: `"Inbox Digest - <current date and time> <first classification>"`  
      - Page ID: Set to a predefined Notion page URL (workspace root).  
      - Content: Inserts the summary text from aggregated data into a text block.  
    - Credentials: Notion API key/token with write permissions.  
    - Input: Aggregated summaries array from "Aggregate Summary".  
    - Output: Confirmation of page creation.  
    - Edge Cases: API errors, permissions issues, invalid page ID URL.  
  - **Sticky Note (Knowledge Base Integration)**  
    - Highlights importance of searchable archive and trend analysis.

---

### 3. Summary Table

| Node Name               | Node Type                       | Functional Role                       | Input Node(s)           | Output Node(s)        | Sticky Note                                                                                       |
|-------------------------|--------------------------------|-------------------------------------|------------------------|-----------------------|-------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                | Workflow manual start trigger        | None                   | Get Unread Emails     | 🚀 WORKFLOW INITIATOR: Starts email processing and AI pipeline manually                          |
| Get Unread Emails       | Gmail Node                     | Fetch unread emails from Gmail       | When clicking ‘Execute workflow’ | Split Emails          | 📧 EMAIL RETRIEVAL ENGINE: Primary data source fetching unread emails                            |
| Split Emails            | SplitInBatches                 | Split emails into individual items   | Get Unread Emails       | Edit Fields           | 🔄 EMAIL BATCH PROCESSOR: Enables parallel processing of individual emails                      |
| Edit Fields             | Set Node                      | Standardize email metadata fields    | Split Emails            | Basic LLM Chain       | ✏️ DATA STRUCTURE OPTIMIZER: Cleans and formats email data for AI input                         |
| Azure OpenAI Chat Model | Langchain Azure OpenAI LLM    | Provides GPT-4o-mini AI inference    | Basic LLM Chain (as LLM) | Basic LLM Chain       | 🤖 AI EMAIL ANALYZER, 🧠 ENTERPRISE AI ENGINE: Core AI engine for email classification          |
| Basic LLM Chain         | Langchain LLM Chain           | Constructs prompt and classifies email | Edit Fields             | Format Summary        | 🤖 AI EMAIL ANALYZER, 🧠 ENTERPRISE AI ENGINE: Classifies email into 4 categories                |
| Format Summary          | Code Node                    | Formats AI output and email metadata | Basic LLM Chain         | Aggregate Summary     | 📊 INSIGHT FORMATTER: Converts raw AI output into structured email summaries                    |
| Aggregate Summary       | Aggregate Node                | Aggregates all summaries into digest | Format Summary          | Send to Notion        | 📈 INTELLIGENCE CONSOLIDATOR: Provides holistic batch report                                   |
| Send to Notion          | Notion Node                  | Archives digest into Notion workspace | Aggregate Summary       | Split Emails          | 📝 KNOWLEDGE BASE INTEGRATION: Stores email insights for long-term reference                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow on demand.

2. **Create Gmail Node ("Get Unread Emails")**  
   - Type: Gmail  
   - Operation: `getAll` messages  
   - Additional Fields: Label IDs set to ["UNREAD", "INBOX"]  
   - Credentials: Connect Gmail OAuth2 account with required scopes (read emails).  
   - Connect output of Manual Trigger to this node.

3. **Create SplitInBatches Node ("Split Emails")**  
   - Type: SplitInBatches  
   - Default options (no batch size limit by default)  
   - Connect output of "Get Unread Emails" to this node.

4. **Create Set Node ("Edit Fields")**  
   - Type: Set  
   - Assign fields:  
     - Subject = `{{$json.headers.subject}}`  
     - From = `{{$json.headers.from}}`  
     - Text = `{{$json.text}}`  
   - Connect second output of "Split Emails" to this node.

5. **Create Azure OpenAI Chat Model Node**  
   - Type: Langchain LM Azure OpenAI  
   - Model: GPT-4o-mini  
   - Credentials: Azure OpenAI API key with access to GPT-4o-mini.  
   - No direct input connections; will be linked as LLM for Langchain node.

6. **Create Langchain LLM Chain Node ("Basic LLM Chain")**  
   - Type: Langchain LLM Chain  
   - Prompt:  
     ```
     Email Details:
     {{ $json.Subject }}
     {{ $json.From }}
     Snippet: {{ $json.Text }}

     Classify this email into one of the following:
     Important, Ignore, Delegate, or Reply Later.

     Respond with only one word.
     ```
   - Messages: System message instructing the AI to respond with one of four categories only.  
   - Configure to use the Azure OpenAI Chat Model node as the LLM provider.  
   - Connect output of "Edit Fields" to this node.

7. **Create Code Node ("Format Summary")**  
   - Type: Code (JavaScript)  
   - Code:  
     ```js
     const classification = $input.first().json.text.trim();
     const email = $('Split Emails').first().json;
     const subject = email.headers?.subject || email.subject || "No Subject";
     const from = email.headers?.from || email.from || "Unknown Sender";
     const summary = `**${classification}**: ${subject} (from: ${from})`;
     return [{
       json: { classification, subject, from, summary }
     }];
     ```  
   - Connect output of "Basic LLM Chain" to this node.

8. **Create Aggregate Node ("Aggregate Summary")**  
   - Type: Aggregate  
   - Operation: Aggregate all item data into one array.  
   - Connect output of "Format Summary" to this node.

9. **Create Notion Node ("Send to Notion")**  
   - Type: Notion  
   - Set Page ID to your target Notion page URL (workspace root or specific page).  
   - Title: `"Inbox Digest - {{ $now.format('D HH:mm') }} {{ $json.data[0].classification }}"`  
   - Content: Insert text block with `{{ $json.data[0].summary }}` or aggregated summaries.  
   - Credentials: Notion API key/token with write access.  
   - Connect output of "Aggregate Summary" to this node.

10. **Link Nodes**  
    - Manual Trigger → Get Unread Emails → Split Emails → Edit Fields → Basic LLM Chain → Format Summary → Aggregate Summary → Send to Notion  
    - Azure OpenAI Chat Model node linked as LLM provider to Basic LLM Chain node.

11. **Test and Validate**  
    - Run the manual trigger; verify unread emails are fetched, classified, summarized, aggregated, and archived in Notion.  
    - Monitor for API errors or missing data fields and adjust credentials/scopes as necessary.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                     | Context or Link                                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Workflow designed for personal inbox automation but adaptable to small business email triage.                                                                   | General use case                                                                                                  |
| GPT-4o-mini model selected for cost-effective yet capable email classification.                                                                                  | Azure OpenAI configuration                                                                                        |
| Notion page ID must be a valid URL of a page within your workspace where the digest will be created.                                                            | Notion API integration                                                                                            |
| Gmail OAuth2 credentials require appropriate scopes to read emails and labels.                                                                                   | Gmail API documentation                                                                                           |
| Batch size for SplitInBatches can be tuned for performance optimization depending on email volume.                                                              | Performance tuning                                                                                                |
| AI prompt strictly requests one-word responses to simplify parsing and reduce ambiguity.                                                                         | AI prompt engineering best practices                                                                              |
| Potential failure points include API quota limits, authentication errors (Gmail, Azure OpenAI, Notion), and malformed email data missing expected headers.       | Error handling recommendations                                                                                    |
| Sticky Notes provide contextual documentation embedded alongside nodes for workflow maintainability and ease of handoff.                                        | Internal documentation best practice                                                                              |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.