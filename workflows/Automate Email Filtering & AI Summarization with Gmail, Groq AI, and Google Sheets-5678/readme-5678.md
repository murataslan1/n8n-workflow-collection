Automate Email Filtering & AI Summarization with Gmail, Groq AI, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-email-filtering---ai-summarization-with-gmail--groq-ai--and-google-sheets-5678


# Automate Email Filtering & AI Summarization with Gmail, Groq AI, and Google Sheets

---

### 1. Workflow Overview

This workflow automates the process of filtering incoming Gmail emails from a specific sender, generating concise AI summaries of their content, and logging the results into Google Sheets for easy review and analysis. It is designed for users who want to monitor emails from selected contacts, extract essential information quickly using AI, and maintain structured logs without manual intervention.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures new emails from Gmail labeled as "Personal" on an hourly basis.
- **1.2 Email Data Extraction and Validation:** Processes raw email data to extract sender info, date, subject, and content, then filters emails by sender.
- **1.3 AI Summarization:** Uses Groq AI via n8n’s Langchain integration to generate a short, concise summary of the email content.
- **1.4 Output Logging:** Appends or updates summarized email data into a Google Sheets document.
- **1.5 Testing and Configuration Notes:** Provides instructions and reminders to verify the workflow before full deployment.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block triggers the workflow on new incoming Gmail emails categorized under the "Personal" label, polling every hour.

- **Nodes Involved:**  
  - Gmail Trigger

- **Node Details:**  

  - **Node Name:** Gmail Trigger  
    - Type: Trigger node for Gmail integration  
    - Configuration: Watches emails with Gmail label ID "CATEGORY_PERSONAL" (i.e., Personal category). Polls every hour at minute 59. Attachments are not downloaded.  
    - Inputs: None (trigger node)  
    - Outputs: Emits raw Gmail email objects to next node  
    - Edge Cases: Gmail API quota limits, authentication errors, Gmail label changes, delayed email availability.  
    - Notes: Requires valid Gmail OAuth2 credentials linked in n8n.  
    - Sticky Note: "Step 1: Add Gmail Credentials 👇"  

#### 2.2 Email Data Extraction and Validation

- **Overview:**  
  This block processes the raw Gmail email data to extract structured fields (sender name/email, date, subject, content). It then filters emails by sender name to only allow specified senders to proceed.

- **Nodes Involved:**  
  - info1 (Code node)  
  - Check Valid Email (If node)

- **Node Details:**  

  - **Node Name:** info1  
    - Type: Code node (JavaScript)  
    - Role: Extracts and formats email metadata and content from Gmail raw data.  
    - Configuration:  
      - Parses sender name and email robustly from multiple possible formats.  
      - Formats email received date to localized string (MM/DD/YYYY, hh:mm AM/PM).  
      - Extracts email content prioritizing plain text, then converting HTML to text, with truncation at 5000 characters if necessary.  
      - Outputs JSON with keys: Date, Sender Name, Sender Email, Subject, Content, Has Attachments.  
    - Inputs: Raw Gmail email JSON  
    - Outputs: Structured email metadata JSON  
    - Edge Cases: Missing or malformed sender info, HTML content with complex markup, very large emails causing truncation, empty subjects.  
    - Sticky Note: "Step 2: Email Processing Node"  

  - **Node Name:** Check Valid Email  
    - Type: If node (conditional filter)  
    - Role: Filters the emails by comparing the sender name against a configured filter string.  
    - Configuration: Single condition: Sender Name equals "YOUR_SENDER_NAME_FILTER" (to be replaced by user).  
    - Inputs: Structured email data from info1  
    - Outputs: Passes emails matching sender condition; discards others.  
    - Edge Cases: Case sensitivity, empty sender name fields, multiple sender names not supported in current config.  
    - Sticky Note:  
      ```
      Step 3: Sender Filter
      • Replace 'YOUR_SENDER_NAME_FILTER'
      • Only emails from this sender will proceed
      • Supports multiple conditions
      ```  

#### 2.3 AI Summarization

- **Overview:**  
  This block uses the Groq AI language model integration to generate a concise summary of the email content. The summary is designed to retain only essential information in a short form.

- **Nodes Involved:**  
  - Groq Chat Model1  
  - AI Agent1

- **Node Details:**  

  - **Node Name:** Groq Chat Model1  
    - Type: AI Language Model node (Groq-specific)  
    - Role: Language model invocation using Groq LLaMA 3.1 8B instant model.  
    - Configuration: Model set to "llama-3.1-8b-instant" with default options.  
    - Inputs: Text prompt from AI Agent1 node (via Langchain agent connection)  
    - Outputs: AI-generated summary text passed to AI Agent1  
    - Edge Cases: API key missing or invalid, model timeouts, rate limits, unexpected output formatting.  
    - Sticky Note:  
      ```
      Step 5: AI Configuration
      1. Add Groq API key
      2. Or replace with other AI model
      ```  

  - **Node Name:** AI Agent1  
    - Type: Langchain Agent node (AI prompt orchestrator)  
    - Role: Defines prompt template and sends email content for AI summarization.  
    - Configuration: Prompt text instructs to read the email content and produce a very short, concise summary containing only the most important information, minimizing length without losing essentials.  
    - Inputs: Filtered email JSON with "Content" field  
    - Outputs: Summary text to Google Sheets logging node  
    - Edge Cases: Empty or malformed content, expression errors in prompt interpolation, AI output reliability.  
    - Sticky Note:  
      ```
      Step 4: Customize AI Prompt
      • Default: Short email summary
      • Change tone/formality as needed
      ```  

#### 2.4 Output Logging

- **Overview:**  
  This block appends or updates a Google Sheet with the summarized email data, organizing columns for sender, date, subject, and AI-generated summary.

- **Nodes Involved:**  
  - Log to Google Sheets1

- **Node Details:**  

  - **Node Name:** Log to Google Sheets1  
    - Type: Google Sheets node  
    - Role: Appends or updates rows in a specified Google Sheets document based on sender name matching.  
    - Configuration:  
      - Document ID and Sheet URL placeholders to be replaced by user.  
      - Columns mapped: Date, summary (AI output), subject, sender name, sender email.  
      - Operation: appendOrUpdate using "sender name" as matching column.  
    - Inputs: AI-generated summary and original email metadata (from AI Agent1 and info1)  
    - Outputs: None (terminal node)  
    - Edge Cases: Google API authentication errors, sheet permissions, wrong document IDs, concurrency conflicts on updates.  
    - Sticky Note:  
      ```
      Step 6: Google Sheets Setup
      1. Add Google credentials
      2. Paste Sheet URL
      3. Select target sheet
      4. Columns auto-map to email data
      ```  

#### 2.5 Testing and Configuration Notes

- **Overview:**  
  This block consists of sticky notes providing testing instructions, configuration reminders, and expected output formatting visuals to guide users before deployment.

- **Nodes Involved:**  
  - Test Note  
  - Sticky Note7  
  - Sticky Note8  
  - Sticky Note9  
  - Sticky Note10  
  - Sticky Note11  
  - Sticky Note12  
  - Sticky Note13

- **Node Details:**  
  - These nodes are sticky notes only, providing textual guidance on each step’s purpose and setup.  
  - They include reminders to test with sample emails, verify Google Sheets output, adjust filters and AI prompts, add credentials, and understand expected output formats with an example table image link.  
  - Sticky notes cover multiple nodes contextually, reinforcing the logical steps from credentials setup to final output verification.

---

### 3. Summary Table

| Node Name           | Node Type                              | Functional Role                      | Input Node(s)     | Output Node(s)       | Sticky Note                                                                                      |
|---------------------|--------------------------------------|------------------------------------|-------------------|----------------------|-------------------------------------------------------------------------------------------------|
| Gmail Trigger       | Gmail Trigger (Trigger)               | Capture new Gmail emails            | None              | info1                | Step 1: Add Gmail Credentials 👇                                                                |
| info1               | Code node (JavaScript)                | Extract & format email metadata     | Gmail Trigger     | Check Valid Email     | Step 2: Email Processing Node                                                                   |
| Check Valid Email   | If node                              | Filter emails by sender name        | info1             | AI Agent1            | Step 3: Sender Filter • Replace 'YOUR_SENDER_NAME_FILTER' • Only emails from this sender proceed |
| AI Agent1           | Langchain Agent node                  | Define AI prompt & orchestrate AI   | Check Valid Email | Log to Google Sheets1 | Step 4: Customize AI Prompt • Default: Short email summary                                      |
| Groq Chat Model1    | AI Language Model (Groq)              | Generate AI summary for email       | AI Agent1         | AI Agent1 (input side)| Step 5: AI Configuration • Add Groq API key or replace with other AI model                       |
| Log to Google Sheets1| Google Sheets node                   | Append/update email summary to sheet| AI Agent1         | None                 | Step 6: Google Sheets Setup • Add Google credentials, paste Sheet URL, select sheet, map columns |
| Test Note           | Sticky Note                         | Testing instructions & reminders    | None              | None                 | ## 🧪 TEST BEFORE DEPLOYING ...                                                                 |
| Sticky Note7        | Sticky Note                         | Gmail credential reminder           | None              | None                 | ## 🔑 Step 1: Add Gmail Credentials 👇                                                          |
| Sticky Note8        | Sticky Note                         | Email processing reminder           | None              | None                 | ## 📧 Step 2: Email Processing Node                                                             |
| Sticky Note9        | Sticky Note                         | Sender filter reminder              | None              | None                 | ## ⚙️ Step 3: Sender Filter ...                                                                  |
| Sticky Note10       | Sticky Note                         | AI prompt customization hint       | None              | None                 | ## ✍️ Step 4: Customize AI Prompt ...                                                           |
| Sticky Note11       | Sticky Note                         | AI config reminder                  | None              | None                 | ## 🤖 Step 5: AI Configuration ...                                                              |
| Sticky Note12       | Sticky Note                         | Google Sheets setup reminder        | None              | None                 | ## 📊 Step 6: Google Sheets Setup ...                                                           |
| Sticky Note13       | Sticky Note                         | Output format example               | None              | None                 | ## ✅ Expected Output Format ...                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Gmail Trigger node:**  
   - Type: Gmail Trigger  
   - Credentials: Add Gmail OAuth2 credentials.  
   - Filters: Set labelIds to ["CATEGORY_PERSONAL"].  
   - Polling: Set trigger to run every hour at minute 59.  
   - Disable attachment download.  

2. **Add a Code node named "info1":**  
   - Paste the JavaScript code that:  
     - Extracts sender email and name from multiple possible email formats.  
     - Formats the email received date to US locale string with date and time.  
     - Extracts email content prioritizing text, then converts HTML to plain text, and truncates at 5000 characters.  
     - Outputs JSON with keys: Date, Sender Name, Sender Email, Subject, Content, Has Attachments.  
   - Connect Gmail Trigger output to this node’s input.  

3. **Add an If node named "Check Valid Email":**  
   - Condition: String equals  
     - Left value: Expression: `{{$json["Sender Name"]}}`  
     - Right value: "YOUR_SENDER_NAME_FILTER" (replace with desired sender name)  
   - Connect info1 output to this node’s input.  

4. **Add a Langchain Agent node named "AI Agent1":**  
   - Prompt Type: Define  
   - Prompt Text:  
     ```
     Please read this email "{{ $json.Content }}" and provide a very short, concise summary containing only the most important information. Keep the summary as brief as possible without losing essential details.
     ```  
   - Connect the "true" output of Check Valid Email to this node.  

5. **Add a Groq Chat Model node named "Groq Chat Model1":**  
   - Model: "llama-3.1-8b-instant"  
   - Connect AI Agent1’s AI language model input to this node.  
   - Configure Groq API credentials as required in n8n.  

6. **Connect AI Agent1 output to Google Sheets node named "Log to Google Sheets1":**  
   - Operation: Append or update  
   - Matching columns: "sender name"  
   - Columns mapped:  
     - Date: `={{ $('info1').item.json.Date }}`  
     - Summary: `={{ $json.output }}` (AI summary)  
     - Subject: `={{ $('info1').item.json.Subject }}`  
     - Sender Name: `={{ $('info1').item.json["Sender Name"] }}`  
     - Sender Email: `={{ $('info1').item.json["Sender Email"] }}`  
   - Credentials: Add Google Sheets OAuth2 credentials.  
   - Document ID: Paste your Google Sheets document ID.  
   - Sheet Name: Use the sheet ID or name (e.g., "gid=0" or "Sheet1").  

7. **Add Sticky Note nodes to each step as guidance:**  
   - For credentials, processing, filter, AI prompt, AI config, Sheets setup, and testing instructions.  
   - Include visual notes to remind users of placeholders and configuration steps.  

8. **Test the workflow:**  
   - Send test emails matching the sender filter.  
   - Verify summaries appear correctly in Google Sheets.  
   - Adjust the AI prompt or sender filter as needed.  

---

### 5. General Notes & Resources

| Note Content                                                                                                            | Context or Link                                                                                                                        |
|-------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| Ensure all API credentials (Gmail, Groq AI, Google Sheets) are valid and have necessary scopes enabled.                  | Credentials setup reminder                                                                                                            |
| To adjust the sender filter, replace "YOUR_SENDER_NAME_FILTER" with exact sender name string as received in emails.       | Sender filtering customization                                                                                                       |
| The AI prompt can be customized to change summary tone, length, or detail level by editing the prompt text in AI Agent1. | AI prompt customization guide                                                                                                        |
| Google Sheets columns must match the mapping keys exactly for successful append/update operations.                       | Google Sheets integration requirements                                                                                               |
| Example output formatting: ![Example Table](https://cdn.ablebits.com/_img-blog/google-sheets-create-table/table-format.webp) | Visual reference for expected Google Sheets log output                                                                                |
| Testing instructions: Send test email, check sheet output, verify summary quality, adjust filters or prompt as needed.    | Testing checklist from Test Note sticky node                                                                                          |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---