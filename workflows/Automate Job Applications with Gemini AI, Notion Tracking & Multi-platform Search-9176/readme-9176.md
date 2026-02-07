Automate Job Applications with Gemini AI, Notion Tracking & Multi-platform Search

https://n8nworkflows.xyz/workflows/automate-job-applications-with-gemini-ai--notion-tracking---multi-platform-search-9176


# Automate Job Applications with Gemini AI, Notion Tracking & Multi-platform Search

---

### 1. Workflow Overview

This workflow, titled **"Automate Job Applications with Gemini AI, Notion Tracking & Multi-platform Search"**, is designed to automate the process of job hunting by searching multiple job portals, analyzing job postings through AI, filtering desirable matches, and managing applications via Notion and notifications. It is ideal for job seekers who want to streamline job discovery, evaluation, application tracking, and personalized cover letter generation using AI.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Variable Setup**: Periodically triggers the job search and sets key search parameters.
- **1.2 Multi-Source Job Search**: Queries multiple job platforms (Jooble, JobStreet, Indeed, WhatJobs) concurrently to gather job listings.
- **1.3 Data Normalization & Merging**: Merges and normalizes job data from diverse APIs into a consistent format.
- **1.4 AI-Powered Job Analysis**: Uses Google Gemini AI to score job compatibility and generate tailored cover letters.
- **1.5 Auto-Application Decision & Tracking**: Filters jobs based on AI scores, adds qualifying jobs to Notion, saves cover letters to Google Drive, and sends Telegram alerts.
- **1.6 Error Handling & Notifications**: Captures and notifies errors encountered throughout the workflow.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Variable Setup

- **Overview:**  
  This block initiates the workflow every 8 hours and sets essential job search parameters such as keywords, location, radius, and result limits.

- **Nodes Involved:**  
  - Schedule Job Search  
  - Set Job Variables

- **Node Details:**

  - **Schedule Job Search**  
    - Type: Schedule Trigger  
    - Role: Triggers the workflow execution every 8 hours automatically.  
    - Configuration: Interval set with a recurring 8-hour period.  
    - Input: None (trigger node)  
    - Output: Connects to Set Job Variables  
    - Edge Cases: Trigger failure if n8n scheduler malfunctions or system clock issues.

  - **Set Job Variables**  
    - Type: Set  
    - Role: Defines job search parameters as workflow variables.  
    - Configuration:  
      - `job_keywords`: "software developer, web developer, full stack, javascript, react, node.js"  
      - `auto_apply_threshold`: 75 (AI compatibility score minimum for auto-application)  
      - `location`: "Indonesia"  
      - `radius`: "50" (search radius in km)  
      - `max_results_per_source`: "10" (max jobs per source API)  
    - Inputs: Triggered by Schedule Job Search  
    - Outputs: Feeds multiple job search HTTP nodes  
    - Edge Cases: Incorrect variable types or missing values could cause downstream errors.

---

#### 2.2 Multi-Source Job Search

- **Overview:**  
  Queries four job portals — Jooble, JobStreet, Indeed, and WhatJobs — in parallel using the set search parameters, retrieving job listings for further processing.

- **Nodes Involved:**  
  - Jooble Job Search  
  - JobStreet Search  
  - Indeed Job Search  
  - WhatJobs Search

- **Node Details:**

  - **Jooble Job Search**  
    - Type: HTTP Request  
    - Role: Fetch jobs from Jooble API using POST request.  
    - Configuration:  
      - URL with placeholder for Jooble API key (must be replaced with valid key).  
      - Body parameters use expressions to inject keywords, location, radius, page number, and page size.  
      - Timeout: 15 seconds  
      - Headers: Content-Type set to application/json  
    - Inputs: Set Job Variables  
    - Outputs: Merges into Merge Job Results  
    - Edge Cases: API key missing/invalid, network timeout, rate limit errors.

  - **JobStreet Search**  
    - Type: HTTP Request  
    - Role: Fetch jobs from JobStreet API via GET request.  
    - Configuration:  
      - Query parameters use expressions for keywords, location code (fixed to "1000"), jobs per page, and page number.  
      - User-Agent and Accept headers mimic browser request.  
      - Timeout: 15 seconds  
    - Inputs: Set Job Variables  
    - Outputs: Merges into Merge Job Results  
    - Edge Cases: API changes, location code hardcoded (may need update), network errors.

  - **Indeed Job Search**  
    - Type: HTTP Request  
    - Role: Fetch jobs from Indeed website using GET request.  
    - Configuration:  
      - Query parameters for keywords, location, max results, recent postings (last 7 days), and radius.  
      - User-Agent and Accept headers set for browser-like access.  
      - Timeout: 15 seconds  
    - Inputs: Set Job Variables  
    - Outputs: Connected to Error Handler (no direct merge here).  
    - Edge Cases: HTML response parsing complexity, potential blocking by Indeed, captcha issues.

  - **WhatJobs Search**  
    - Type: HTTP Request  
    - Role: Fetch jobs from WhatJobs API using GET request.  
    - Configuration:  
      - Query parameters use expressions for keywords, location, limit, and radius.  
      - Requires API token in header (replace placeholder).  
      - Timeout: 15 seconds  
    - Inputs: Set Job Variables  
    - Outputs: Connected to Error Handler (no direct merge).  
    - Edge Cases: API key invalid, rate limits, network failures.

---

#### 2.3 Data Normalization & Merging

- **Overview:**  
  This block consolidates job listings from Jooble and JobStreet, normalizes diverse data structures into a uniform schema, and prepares data for AI analysis.

- **Nodes Involved:**  
  - Merge Job Results  
  - Normalize Job Data

- **Node Details:**

  - **Merge Job Results**  
    - Type: Merge  
    - Role: Combines results from Jooble and JobStreet into a single data stream.  
    - Configuration: Default merge settings (append).  
    - Inputs: Jooble Job Search (output 0), JobStreet Search (output 1)  
    - Outputs: Normalize Job Data  
    - Edge Cases: Empty inputs, data structure mismatch.

  - **Normalize Job Data**  
    - Type: Code (JavaScript)  
    - Role: Validates and standardizes job data into a consistent JSON format with fields like id, title, company, location, description, url, posted_date, source, salary, employment_type, and validation_score. Also filters out low-quality or invalid job entries.  
    - Configuration:  
      - Handles different API response formats (Jooble, JobStreet, Indeed/WhatJobs).  
      - Assigns default values for missing fields.  
      - Calculates a validation score based on completeness of key fields.  
      - Filters out jobs with validation_score < 50.  
    - Inputs: Merged job data from Merge Job Results  
    - Outputs: AI Job Analysis  
    - Edge Cases: Unexpected API response changes, code execution errors, empty or malformed data.

---

#### 2.4 AI-Powered Job Analysis

- **Overview:**  
  Uses Google Gemini AI (Google Palm API) to analyze each job posting, generate a compatibility score, identify matched/missing requirements, and produce a personalized cover letter in JSON format.

- **Nodes Involved:**  
  - AI Job Analysis

- **Node Details:**

  - **AI Job Analysis**  
    - Type: Google Gemini AI (LangChain integration)  
    - Role: Sends job details and user skills to Gemini AI model "gemini-1.5-pro" for analysis.  
    - Configuration:  
      - Temperature set to 0.3 for controlled generation.  
      - Message template includes job title, company, location, description, and user skills.  
      - Expects JSON output with fields: compatibility_score, reasons, cover_letter, key_requirements_match, missing_requirements.  
    - Credentials: Google PaLM API (credential configured separately).  
    - Inputs: Normalized job data from Normalize Job Data  
    - Outputs: Auto Apply Filter and Error Handler  
    - Edge Cases: API quota exceeded, response parsing errors, API downtime.

---

#### 2.5 Auto-Application Decision & Tracking

- **Overview:**  
  Filters jobs based on AI compatibility score, adds suitable jobs to Notion database, saves generated cover letters to Google Drive, and sends Telegram alerts with job details and AI insights.

- **Nodes Involved:**  
  - Auto Apply Filter  
  - Add to Notion Database  
  - Send Telegram Alert  
  - Save Cover Letter to Drive

- **Node Details:**

  - **Auto Apply Filter**  
    - Type: If (Conditional)  
    - Role: Checks if compatibility_score from AI analysis meets or exceeds the auto_apply_threshold (default 75).  
    - Configuration: Compares parsed compatibility_score JSON field against threshold variable.  
    - Inputs: AI Job Analysis node  
    - Outputs:  
      - True: Add to Notion Database (apply)  
      - False: Error Handler (to catch potential issues)  
    - Edge Cases: JSON parsing failures, missing compatibility_score.

  - **Add to Notion Database**  
    - Type: Notion  
    - Role: Creates a new page in a Notion database to track the job application status and details.  
    - Configuration:  
      - Database ID placeholder to be replaced with actual Notion database id.  
      - Properties set include Title, Company, Status ("Applied"), Match Score, Applied Date, Job URL, Location, and Source.  
    - Credentials: Notion API integration.  
    - Inputs: Auto Apply Filter (true branch)  
    - Outputs: Send Telegram Alert, Save Cover Letter to Drive, Error Handler  
    - Edge Cases: Invalid database ID, API rate limits, permission errors.

  - **Send Telegram Alert**  
    - Type: Telegram  
    - Role: Sends formatted Markdown notification to a Telegram chat about the new job match, including job details, AI reasons, matched requirements, and application link.  
    - Configuration:  
      - Uses Telegram Bot API credentials.  
      - Chat ID placeholder to be replaced.  
      - Disable web page preview enabled.  
    - Inputs: Add to Notion Database  
    - Outputs: None  
    - Edge Cases: Network issues, invalid chat ID, API limits.

  - **Save Cover Letter to Drive**  
    - Type: Google Drive  
    - Role: Saves the AI-generated cover letter as a text file in a specified Google Drive folder for easy access.  
    - Configuration:  
      - File name constructed from company, job title, and current date with sanitized characters.  
      - Folder ID placeholder must be replaced with actual folder ID.  
    - Credentials: Google Drive OAuth2 credentials.  
    - Inputs: Add to Notion Database  
    - Outputs: None  
    - Edge Cases: Drive API errors, permission issues, naming conflicts.

---

#### 2.6 Error Handling & Notifications

- **Overview:**  
  Centralized error capture and notification mechanism that sets error details and sends alerts to Telegram for operational awareness.

- **Nodes Involved:**  
  - Error Handler  
  - Send Error Notification

- **Node Details:**

  - **Error Handler**  
    - Type: Set  
    - Role: Constructs an error object with details about the error occurrence, message, timestamp, and the node where it failed.  
    - Configuration: Extracts error info from `$json.error` or sets defaults.  
    - Inputs: Multiple nodes connect errors here (catch/failure workflow).  
    - Outputs: Send Error Notification  
    - Edge Cases: Missing error details could reduce diagnostics quality.

  - **Send Error Notification**  
    - Type: Telegram  
    - Role: Sends a formatted Markdown message to Telegram with error details for prompt intervention.  
    - Configuration: Uses the same Telegram chat ID as alerts node.  
    - Inputs: Error Handler  
    - Outputs: None  
    - Edge Cases: Telegram API failures, invalid chat ID.

---

### 3. Summary Table

| Node Name             | Node Type                         | Functional Role                                | Input Node(s)                      | Output Node(s)                                      | Sticky Note                                                                                             |
|-----------------------|----------------------------------|------------------------------------------------|----------------------------------|----------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Schedule Job Search    | Schedule Trigger                 | Triggers workflow every 8 hours                | None                             | Set Job Variables                                   | Contains full installation and usage instructions with API setup and customization details.           |
| Set Job Variables      | Set                             | Defines job search parameters                   | Schedule Job Search              | Jooble Job Search, JobStreet Search, Indeed Job Search, WhatJobs Search | Contains full installation and usage instructions with API setup and customization details.           |
| Jooble Job Search      | HTTP Request                    | Queries Jooble API for job listings             | Set Job Variables               | Merge Job Results, Error Handler                    | Contains full installation and usage instructions with API setup and customization details.           |
| JobStreet Search       | HTTP Request                    | Queries JobStreet API for job listings          | Set Job Variables               | Merge Job Results, Error Handler                    | Contains full installation and usage instructions with API setup and customization details.           |
| Indeed Job Search      | HTTP Request                    | Queries Indeed for job listings                  | Set Job Variables               | Error Handler                                      | Contains full installation and usage instructions with API setup and customization details.           |
| WhatJobs Search        | HTTP Request                    | Queries WhatJobs API for job listings            | Set Job Variables               | Error Handler                                      | Contains full installation and usage instructions with API setup and customization details.           |
| Merge Job Results      | Merge                           | Merges Jooble and JobStreet job listings         | Jooble Job Search, JobStreet Search | Normalize Job Data                                | Contains full installation and usage instructions with API setup and customization details.           |
| Normalize Job Data     | Code (JavaScript)               | Normalizes and validates job data                 | Merge Job Results              | AI Job Analysis                                    | Contains full installation and usage instructions with API setup and customization details.           |
| AI Job Analysis        | Google Gemini AI (LangChain)    | Scores job compatibility and generates cover letters | Normalize Job Data             | Auto Apply Filter, Error Handler                   | Contains full installation and usage instructions with API setup and customization details.           |
| Auto Apply Filter      | If (Conditional)                | Filters jobs based on AI compatibility score    | AI Job Analysis                | Add to Notion Database (true), Error Handler (false) | Contains full installation and usage instructions with API setup and customization details.           |
| Add to Notion Database | Notion                         | Adds qualifying job applications to Notion      | Auto Apply Filter (true)         | Send Telegram Alert, Save Cover Letter to Drive, Error Handler | Contains full installation and usage instructions with API setup and customization details.           |
| Send Telegram Alert    | Telegram                       | Sends Telegram notification on new job match    | Add to Notion Database          | None                                               | Contains full installation and usage instructions with API setup and customization details.           |
| Save Cover Letter to Drive | Google Drive                  | Saves AI-generated cover letter to Google Drive | Add to Notion Database          | None                                               | Contains full installation and usage instructions with API setup and customization details.           |
| Error Handler          | Set                             | Captures error details for notification          | Multiple nodes (on failure)      | Send Error Notification                            | Contains full installation and usage instructions with API setup and customization details.           |
| Send Error Notification| Telegram                       | Sends Telegram alert on workflow errors          | Error Handler                  | None                                               | Contains full installation and usage instructions with API setup and customization details.           |
| Sticky Note            | Sticky Note                    | Installation, setup, and usage instructions      | None                          | None                                               | Detailed multi-step instructions and external links for API keys, credentials, and customization.     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval to every 8 hours (hoursInterval: 8)  
   - Connect output to the next node.

2. **Create Set Node for Job Variables**  
   - Type: Set  
   - Add variables:  
     - `job_keywords` (string): "software developer, web developer, full stack, javascript, react, node.js"  
     - `auto_apply_threshold` (number): 75  
     - `location` (string): "Indonesia"  
     - `radius` (string): "50"  
     - `max_results_per_source` (string): "10"  
   - Connect input from Schedule Trigger.

3. **Create HTTP Request Nodes for Job Searches**

   - **Jooble Job Search:**  
     - Method: POST  
     - URL: `https://jooble.org/api/{{YOUR_JOOBLE_API_KEY}}` (replace placeholder)  
     - Headers: Content-Type: application/json  
     - Body parameters: keywords, location, radius, page=1, ResultOnPage=max_results_per_source (use expressions)  
     - Timeout: 15 seconds  
     - Connect input from Set Job Variables.

   - **JobStreet Search:**  
     - Method: GET  
     - URL: https://www.jobstreet.co.id/api/chalice-search/v4/search  
     - Query parameters: keywords, locations=1000 (fixed), jobsPerPage=max_results_per_source, pageNumber=1  
     - Headers: User-Agent and Accept as in example  
     - Timeout: 15 seconds  
     - Connect input from Set Job Variables.

   - **Indeed Job Search:**  
     - Method: GET  
     - URL: https://id.indeed.com/jobs  
     - Query parameters: q=job_keywords, l=location, limit=max_results_per_source, fromage=7, radius=radius  
     - Headers: User-Agent and Accept as in example  
     - Timeout: 15 seconds  
     - Connect input from Set Job Variables.

   - **WhatJobs Search:**  
     - Method: GET  
     - URL: https://api.whatjobs.com/api/v1/jobs/search  
     - Query parameters: keywords, location, limit, radius (all from variables)  
     - Header: x-api-token set to your WhatJobs API token  
     - Timeout: 15 seconds  
     - Connect input from Set Job Variables.

4. **Create a Merge Node for Jooble and JobStreet Results**  
   - Type: Merge  
   - Mode: Append (default)  
   - Connect Jooble Job Search output 0 and JobStreet Search output 1 as inputs.

5. **Create a Code Node to Normalize Job Data**  
   - Type: Code (JavaScript)  
   - Use the provided normalization script to unify job data formats and filter low-quality jobs.  
   - Connect input from Merge node.

6. **Create Google Gemini AI Node for Job Analysis**  
   - Type: Google Gemini AI (LangChain)  
   - Model: gemini-1.5-pro  
   - Temperature: 0.3  
   - Message: Template with job details and personal skills (see overview).  
   - Credentials: Configure Google PaLM API credentials in n8n with your API key.  
   - Connect input from Normalize Job Data.

7. **Create If Node for Auto Apply Filter**  
   - Type: If  
   - Condition: Check if compatibility_score (parsed JSON from AI response) >= auto_apply_threshold variable.  
   - Connect input from AI Job Analysis.

8. **Create Notion Node to Add Job to Database**  
   - Type: Notion  
   - Resource: databasePage  
   - Database ID: Replace placeholder with your Notion database ID.  
   - Map properties: Title, Company, Status (set to "Applied"), Match Score, Applied Date, Job URL, Location, Source.  
   - Credentials: Configure Notion API integration.  
   - Connect True output from Auto Apply Filter.

9. **Create Telegram Node to Send Job Alert**  
   - Type: Telegram  
   - Text: Use Markdown with job and AI details.  
   - Chat ID: Replace with your Telegram chat ID.  
   - Credentials: Configure Telegram Bot credentials.  
   - Connect input from Notion node.

10. **Create Google Drive Node to Save Cover Letter**  
    - Type: Google Drive  
    - File name: Construct using company, job title, and current date, sanitized for safe file names.  
    - Folder ID: Replace placeholder with your Google Drive folder ID.  
    - Credentials: Configure OAuth2 credentials for Google Drive.  
    - Connect input from Notion node.

11. **Create Set Node for Error Handling**  
    - Type: Set  
    - Assign: error_occurred (boolean true), error_message (from $json.error.message), error_timestamp (ISO string), failed_node (from $json.node).  
    - Connect failure outputs from all nodes that may fail (Job searches, AI, Notion, etc.).

12. **Create Telegram Node for Error Notification**  
    - Type: Telegram  
    - Text: Markdown message with error details (node, timestamp, message).  
    - Chat ID: Same as alert node.  
    - Credentials: Telegram Bot credentials.  
    - Connect input from Error Handler.

13. **Final Connections and Activation**  
    - Ensure all nodes are properly connected as per above instructions.  
    - Replace all placeholders with actual API keys, tokens, IDs.  
    - Test run manually to verify functionality.  
    - Activate the workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| **Complete Installation & Usage Instructions:** Detailed step-by-step guidance for setting up API credentials, creating Notion databases, configuring Telegram bots, and Google Drive folder setup. Includes links to Jooble Partner API, WhatJobs API documentation, Google AI Studio, and instructions on customizing job search parameters.                                                                                                                                                                                                                                                                                                                                                  | Embedded Sticky Note in workflow; external links: https://jooble.org/api/about, https://developer.whatjobs.com, https://makersuite.google.com/app/apikey |
| **Notion Database Setup:** Requires a database with specific properties (Title, Company, Status, Match Score, Applied Date, Job URL, Location, Source). Integration must be shared with Notion API integration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Notion official documentation for database and integration setup.                                 |
| **Google Gemini AI (PaLM) API:** Use Google AI Studio to generate API keys. Credentials must be configured in n8n for the Google Palm API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | https://makersuite.google.com/app/apikey                                                           |
| **Telegram Bot Setup:** Create Telegram bot via @BotFather, obtain chat ID and bot token, configure credentials in n8n. Used for both alerts and error notifications.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Telegram Bot API documentation.                                                                   |
| **Google Drive Setup:** Enable Drive API in Google Cloud Console, create folder for cover letters, configure OAuth2 credentials in n8n.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Google Drive API documentation.                                                                   |
| **Error Handling Strategy:** Centralized error capture with detailed notifications to Telegram ensures prompt awareness and easier troubleshooting for all nodes which may fail.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | n8n error handling best practices.                                                                |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This treatment strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All handled data are legal and publicly accessible.

---