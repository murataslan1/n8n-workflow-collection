Analyze YouTube Channels & Send Performance Reports with GPT-4o-mini and Gmail

https://n8nworkflows.xyz/workflows/analyze-youtube-channels---send-performance-reports-with-gpt-4o-mini-and-gmail-8167


# Analyze YouTube Channels & Send Performance Reports with GPT-4o-mini and Gmail

### 1. Workflow Overview

This workflow automates the analysis of YouTube channel data retrieved from a Google Sheet and sends performance reports via email. It targets content creators, marketers, or data analysts who want AI-driven insights on multiple YouTube channels and automated report delivery.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Manual trigger initiates the workflow, and channel data rows are fetched from Google Sheets.
- **1.2 Data Iteration & Extraction:** Each row (representing a YouTube channel) is processed individually; relevant content is extracted via HTTP requests.
- **1.3 Data Segregation and Formatting:** Extracted data is parsed, segregated, and formatted to prepare for AI analysis.
- **1.4 AI-driven Analysis:** The formatted data is passed to a Langchain Azure OpenAI Chat Model and then to a Langchain agent for detailed analysis.
- **1.5 Email Preparation and Sending:** AI-generated analysis is converted into an email format and sent out via an email node.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Starts the workflow manually and retrieves YouTube channel data from Google Sheets.
- **Nodes Involved:** 
  - When clicking ‘Execute workflow’
  - Get row(s) in sheet
- **Node Details:**
  - **When clicking ‘Execute workflow’**
    - Type: Manual Trigger
    - Role: Entry point for manual workflow execution.
    - Configuration: Default manual trigger node.
    - Inputs: None
    - Outputs: Triggers "Get row(s) in sheet".
    - Failures: None typical; manual trigger.
  - **Get row(s) in sheet**
    - Type: Google Sheets
    - Role: Fetches rows containing YouTube channel data.
    - Configuration: Connects to a Google Sheets file and sheet containing data.
    - Key Expressions: None specified, but likely configured to fetch all or filtered rows.
    - Inputs: Trigger from manual node.
    - Outputs: Sends data rows to "Loop Over Items".
    - Failures: Possible errors include auth failures, API limits, sheet not found.

#### 2.2 Data Iteration & Extraction

- **Overview:** Processes each YouTube channel row individually; extracts detailed content from an external source via HTTP requests.
- **Nodes Involved:** 
  - Loop Over Items
  - Content extraction
- **Node Details:**
  - **Loop Over Items**
    - Type: SplitInBatches
    - Role: Processes channel rows one at a time or in batches to control API load.
    - Configuration: Default batch size (not specified).
    - Inputs: Rows from Google Sheet.
    - Outputs: Two outputs; first empty, second connected to "Content extraction".
    - Failures: Batch size misconfiguration can cause slow or failed runs.
  - **Content extraction**
    - Type: HTTP Request
    - Role: Retrieves detailed raw data about each YouTube channel or video.
    - Configuration: Configured with URL and HTTP method to fetch data; likely uses dynamic expressions for URL based on input row.
    - Key Expressions: URL parameters dynamically set.
    - Inputs: Receives one batch item at a time.
    - Outputs: Raw content to "Comments segergation".
    - Failures: HTTP errors, timeouts, invalid URLs.

#### 2.3 Data Segregation and Formatting

- **Overview:** Parses the extracted content to separate comments and other relevant data, then formats it for AI analysis.
- **Nodes Involved:** 
  - Comments segergation (note: likely typo, "segregation")
  - Formatting Data
- **Node Details:**
  - **Comments segergation**
    - Type: Code (JavaScript)
    - Role: Parses and segregates comments or data elements from raw HTTP response.
    - Configuration: Custom JavaScript code to filter and separate data.
    - Inputs: Raw HTTP content.
    - Outputs: Structured data to "Formatting Data".
    - Failures: Code errors, unexpected data formats.
  - **Formatting Data**
    - Type: Code (JavaScript)
    - Role: Formats parsed data into a structure suitable for AI input.
    - Configuration: Custom JavaScript to create prompt-ready data.
    - Inputs: Segregated data.
    - Outputs: Formatted data to "Creating Analysis".
    - Failures: Code exceptions, malformed input.

#### 2.4 AI-driven Analysis

- **Overview:** Processes the formatted data using an Azure OpenAI Chat Model and a Langchain agent to generate insightful analysis.
- **Nodes Involved:** 
  - Azure OpenAI Chat Model
  - Creating Analysis
- **Node Details:**
  - **Azure OpenAI Chat Model**
    - Type: Langchain LM Chat Azure OpenAI
    - Role: Sends formatted data as a prompt to Azure OpenAI GPT-4o-mini.
    - Configuration: Azure OpenAI credentials, model selection, prompt template.
    - Inputs: Formatted data.
    - Outputs: AI response to "Creating Analysis".
    - Failures: Authentication errors, API rate limits, model errors.
  - **Creating Analysis**
    - Type: Langchain Agent
    - Role: Further processes AI model output for final analysis.
    - Configuration: Agent setup with tasks and tools.
    - Inputs: AI chat model output.
    - Outputs: Analysis content for email creation.
    - Failures: Agent misconfiguration, unexpected AI output.

#### 2.5 Email Preparation and Sending

- **Overview:** Converts AI analysis into an email format and sends the report via email.
- **Nodes Involved:** 
  - Creating Email
  - Sending report via email
- **Node Details:**
  - **Creating Email**
    - Type: Code (JavaScript)
    - Role: Generates email subject, body, and recipient details from AI output.
    - Configuration: Custom code to format the email content.
    - Inputs: AI analysis.
    - Outputs: Email node.
    - Failures: Code errors, missing data leading to incomplete emails.
  - **Sending report via email**
    - Type: Email Send
    - Role: Sends the email report.
    - Configuration: SMTP or OAuth2 credentials set up, email parameters populated dynamically.
    - Inputs: Email content.
    - Outputs: None (end node).
    - Failures: Authentication errors, SMTP server issues, invalid email addresses.

---

### 3. Summary Table

| Node Name               | Node Type                              | Functional Role                         | Input Node(s)                   | Output Node(s)                    | Sticky Note                        |
|-------------------------|--------------------------------------|---------------------------------------|--------------------------------|---------------------------------|----------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                       | Initiates the workflow                 | None                           | Get row(s) in sheet              |                                  |
| Get row(s) in sheet      | Google Sheets                        | Retrieves YouTube channel data         | When clicking ‘Execute workflow’ | Loop Over Items                 |                                  |
| Loop Over Items          | SplitInBatches                      | Iterates over each channel row         | Get row(s) in sheet            | Content extraction              |                                  |
| Content extraction       | HTTP Request                        | Extracts detailed channel content      | Loop Over Items                | Comments segergation            |                                  |
| Comments segergation     | Code                               | Parses and segregates comments/data    | Content extraction             | Formatting Data                |                                  |
| Formatting Data          | Code                               | Formats data for AI input              | Comments segergation           | Creating Analysis               |                                  |
| Azure OpenAI Chat Model  | Langchain LM Chat Azure OpenAI     | Sends prompt to GPT-4o-mini model      | Formatting Data                | Creating Analysis (ai_languageModel) |                                  |
| Creating Analysis        | Langchain Agent                    | Processes AI output for final analysis | Azure OpenAI Chat Model        | Creating Email                 |                                  |
| Creating Email           | Code                               | Formats AI analysis into email content | Creating Analysis             | Sending report via email        |                                  |
| Sending report via email | Email Send                        | Sends performance report email          | Creating Email                 | Loop Over Items (second output) |                                  |
| Sticky Note(s)           | Sticky Note                        | Comments and notes                     | Various                       | Various                        | See node-specific notes above    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**
   - Name: "When clicking ‘Execute workflow’"
   - Default settings.

2. **Create Google Sheets Node:**
   - Name: "Get row(s) in sheet"
   - Credentials: Google Sheets OAuth2 credentials.
   - Operation: Get rows from the specified spreadsheet and sheet containing YouTube channels.
   - Connect output of Manual Trigger to this node.

3. **Create SplitInBatches Node:**
   - Name: "Loop Over Items"
   - Parameters: Default batch size or as required.
   - Connect output of Google Sheets node to this node.

4. **Create HTTP Request Node:**
   - Name: "Content extraction"
   - Parameters: Set HTTP method (likely GET).
   - URL: Dynamically set using expressions referencing current batch item (e.g., channel ID).
   - Connect second output of SplitInBatches node to this node.

5. **Create Code Node:**
   - Name: "Comments segergation"
   - Language: JavaScript
   - Purpose: Parse HTTP response to separate comments and relevant data.
   - Connect output of HTTP Request node to this node.

6. **Create Code Node:**
   - Name: "Formatting Data"
   - Language: JavaScript
   - Purpose: Format parsed data into AI prompt structure.
   - Connect output of Comments segergation node to this node.

7. **Create Langchain LM Chat Azure OpenAI Node:**
   - Name: "Azure OpenAI Chat Model"
   - Credentials: Azure OpenAI API with GPT-4o-mini model access.
   - Parameters: Model selection, prompt template using formatted data.
   - Connect output of Formatting Data node to this node.

8. **Create Langchain Agent Node:**
   - Name: "Creating Analysis"
   - Configure agent tasks/tools as per analysis requirements.
   - Connect AI model output (Azure OpenAI Chat Model) to this node.

9. **Create Code Node:**
   - Name: "Creating Email"
   - Language: JavaScript
   - Purpose: Format AI analysis output into email subject, body, and recipients.
   - Connect output of Langchain Agent node to this node.

10. **Create Email Send Node:**
    - Name: "Sending report via email"
    - Credentials: SMTP or OAuth2 email credentials (e.g., Gmail).
    - Parameters: Use expressions from Creating Email node for subject, body, to address.
    - Connect output of Creating Email node to this node.

11. **Optional Loop Restart:**
    - Connect output of Sending report via email node back to the "Loop Over Items" node’s first output if repeated processing is desired or for cleanup.

---

### 5. General Notes & Resources

| Note Content                                                                                                       | Context or Link                       |
|--------------------------------------------------------------------------------------------------------------------|-------------------------------------|
| The workflow uses GPT-4o-mini model via Azure OpenAI Chat Model node for AI-driven YouTube channel analysis.       | Azure OpenAI GPT-4o-mini             |
| Email sending requires valid SMTP or OAuth2 credentials configured in the Email node (e.g., Gmail OAuth2).          | n8n Email Node documentation         |
| Batch processing ensures API rate limits are respected and avoids overloading external services.                    | n8n SplitInBatches node              |
| Parsing and formatting JavaScript code nodes should be adapted if the YouTube data structure changes.              | Custom coding required                |
| This workflow is designed for manual activation but can be adapted to scheduled triggers for automation.            | n8n Trigger nodes                    |

---

Disclaimer: The provided text is based exclusively on an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.