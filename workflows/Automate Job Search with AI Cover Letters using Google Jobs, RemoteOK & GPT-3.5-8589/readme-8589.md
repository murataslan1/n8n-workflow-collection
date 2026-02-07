Automate Job Search with AI Cover Letters using Google Jobs, RemoteOK & GPT-3.5

https://n8nworkflows.xyz/workflows/automate-job-search-with-ai-cover-letters-using-google-jobs--remoteok---gpt-3-5-8589


# Automate Job Search with AI Cover Letters using Google Jobs, RemoteOK & GPT-3.5

### 1. Workflow Overview

This workflow automates the job search process by querying job listings from Google Jobs and RemoteOK, then generating AI-powered cover letters tailored to each job using GPT-3.5. It sends personalized job application emails automatically or notifies the user when no results are found. The logical flow is structured into the following blocks:

- **1.1 Scheduled Trigger & Setup:** Initiates the workflow on a schedule and sets up necessary parameters.
- **1.2 Job Search Requests:** Queries job listings from Google Jobs and RemoteOK APIs.
- **1.3 Results Merging and Processing:** Combines job listings, processes them, and decides the next steps based on availability.
- **1.4 Job-by-Job Letter Generation and Emailing:** Splits jobs into batches, generates tailored cover letters via GPT-3.5, formats emails, and sends applications.
- **1.5 No Results Handling:** Sends an alert email if no jobs are found.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Setup

- **Overview:** This block triggers the workflow automatically on a defined schedule and sets up any preset configurations or variables required downstream.
- **Nodes Involved:** `Schedule`, `Settings`
- **Node Details:**

  - **Schedule**
    - Type: Schedule Trigger
    - Role: Starts the workflow at regular intervals (e.g., daily or weekly).
    - Configuration: Uses default or user-defined cron/timer settings.
    - Inputs: None (trigger node).
    - Outputs: Triggers `Settings`.
    - Failures: Misconfigured schedule may cause no execution.
  
  - **Settings**
    - Type: Set
    - Role: Initializes and defines static parameters or variables (e.g., search keywords, email addresses).
    - Configuration: Likely sets query parameters, credentials references, or environment variables.
    - Inputs: From `Schedule`.
    - Outputs: Triggers both job search HTTP requests.
    - Failures: Missing or incorrect parameter values may cause downstream API calls to fail.

#### 2.2 Job Search Requests

- **Overview:** Performs HTTP requests to fetch job listings from Google Jobs and RemoteOK APIs based on search criteria.
- **Nodes Involved:** `Search Google Jobs`, `Search RemoteOK`, `Merge`
- **Node Details:**

  - **Search Google Jobs**
    - Type: HTTP Request
    - Role: Queries Google Jobs API with predefined parameters.
    - Configuration: HTTP method (likely GET), URL endpoint, query parameters including keywords, location, filters.
    - Inputs: From `Settings`.
    - Outputs: Feeds into `Merge`.
    - Failures: API errors (authentication, rate limits), network issues, malformed queries.

  - **Search RemoteOK**
    - Type: HTTP Request
    - Role: Queries RemoteOK API similarly.
    - Configuration: HTTP method, endpoint, parameters.
    - Inputs: From `Settings`.
    - Outputs: Feeds into `Merge`.
    - Failures: Similar to Google Jobs.

  - **Merge**
    - Type: Merge
    - Role: Combines job listings from both sources into one unified dataset.
    - Configuration: Likely using ‘Merge By Index’ or ‘Append’ to consolidate arrays.
    - Inputs: From `Search Google Jobs` (index 0) and `Search RemoteOK` (index 1).
    - Outputs: Passes combined data to `Process Jobs`.
    - Failures: Data format mismatches or empty inputs.

#### 2.3 Results Merging and Processing

- **Overview:** Processes the combined job listings, filters or formats them, then checks if results exist to proceed or send notifications.
- **Nodes Involved:** `Process Jobs`, `Check Results`, `No Results Email`, `Split Jobs`
- **Node Details:**

  - **Process Jobs**
    - Type: Code (JavaScript)
    - Role: Custom processing logic to parse, filter, or enrich job data.
    - Configuration: Script likely normalizes job fields, removes duplicates, or applies criteria.
    - Inputs: From `Merge`.
    - Outputs: To `Check Results`.
    - Failures: Script errors, unexpected data structure.

  - **Check Results**
    - Type: If
    - Role: Conditional branching based on presence or count of job listings.
    - Configuration: Checks if processed jobs list is empty or not.
    - Inputs: From `Process Jobs`.
    - Outputs: 
      - If no results: triggers `No Results Email`.
      - If results present: triggers `Split Jobs`.
    - Failures: Logic errors or incorrect condition evaluation.

  - **No Results Email**
    - Type: Email Send
    - Role: Notifies user that no jobs matched the search criteria.
    - Configuration: To address, subject, and message body preset.
    - Inputs: From `Check Results` (no results branch).
    - Outputs: None (end flow).
    - Failures: Email sending issues (SMTP config, auth).

  - **Split Jobs**
    - Type: Split In Batches
    - Role: Divides job listings into manageable chunks for sequential processing.
    - Configuration: Batch size set to control parallelism or API rate limits.
    - Inputs: From `Check Results` (results branch).
    - Outputs: Feeds each job batch to `Extract Job`.
    - Failures: Improper batch size can cause inefficiency or overload.

#### 2.4 Job-by-Job Letter Generation and Emailing

- **Overview:** Extracts job details, generates personalized cover letters using GPT-3.5, composes application emails, aggregates results, and sends them.
- **Nodes Involved:** `Extract Job`, `Generate Letter`, `Combine Letter`, `Aggregate`, `Format Email`, `Send Email`
- **Node Details:**

  - **Extract Job**
    - Type: Code
    - Role: Extracts individual job data (title, company, description) from batch.
    - Configuration: Script tailored to job data structure.
    - Inputs: From `Split Jobs`.
    - Outputs: To `Generate Letter`.
    - Failures: Parsing errors, empty or malformed job entries.

  - **Generate Letter**
    - Type: HTTP Request
    - Role: Calls OpenAI GPT-3.5 API to generate a custom cover letter based on extracted job details.
    - Configuration: POST request with prompt built from job info, using OpenAI credentials.
    - Inputs: From `Extract Job`.
    - Outputs: To `Combine Letter`.
    - Failures: API key issues, rate limits, prompt errors, network failures.

  - **Combine Letter**
    - Type: Code
    - Role: Combines the GPT-generated letter with job and user info into a structured format for emailing.
    - Configuration: Script to merge data and prepare for aggregation.
    - Inputs: From `Generate Letter`.
    - Outputs: To `Aggregate`.
    - Failures: Data mismatch or script errors.

  - **Aggregate**
    - Type: Aggregate
    - Role: Collects all generated letters and job data into a single dataset for batch email formatting.
    - Configuration: Grouping or concatenation settings.
    - Inputs: From `Combine Letter`.
    - Outputs: To `Format Email`.
    - Failures: Memory or data size limits.

  - **Format Email**
    - Type: Code
    - Role: Formats the aggregated data into email body content, including subject lines and recipients.
    - Configuration: Script constructs email templates personalized per job or batch.
    - Inputs: From `Aggregate`.
    - Outputs: To `Send Email`.
    - Failures: Template errors or malformed email content.

  - **Send Email**
    - Type: Email Send
    - Role: Sends the personalized job application emails with AI-generated cover letters.
    - Configuration: SMTP or email service credentials, recipient addresses, email content.
    - Inputs: From `Format Email`.
    - Outputs: Workflow end.
    - Failures: SMTP configuration errors, rejected emails, quota exceeded.

---

### 3. Summary Table

| Node Name           | Node Type          | Functional Role                                  | Input Node(s)            | Output Node(s)            | Sticky Note                      |
|---------------------|--------------------|-------------------------------------------------|--------------------------|---------------------------|---------------------------------|
| Sticky Note - Overview | Sticky Note       | Visual comment/overview                          |                          |                           |                                 |
| Sticky Note - Setup  | Sticky Note        | Visual comment/setup notes                       |                          |                           |                                 |
| Schedule            | Schedule Trigger   | Triggers workflow on schedule                    |                          | Settings                  |                                 |
| Settings            | Set                | Initializes parameters for job search queries   | Schedule                 | Search Google Jobs, Search RemoteOK |                           |
| Search Google Jobs  | HTTP Request       | Fetches job listings from Google Jobs API       | Settings                 | Merge                     |                                 |
| Search RemoteOK     | HTTP Request       | Fetches job listings from RemoteOK API           | Settings                 | Merge                     |                                 |
| Merge               | Merge              | Combines job listings from both sources          | Search Google Jobs, Search RemoteOK | Process Jobs            |                                 |
| Process Jobs        | Code               | Processes and filters combined job listings      | Merge                    | Check Results             |                                 |
| Check Results       | If                 | Branches based on job listing availability       | Process Jobs             | No Results Email, Split Jobs |                              |
| No Results Email    | Email Send         | Sends email when no jobs found                    | Check Results (no)       |                           |                                 |
| Split Jobs          | Split In Batches   | Splits jobs into batches for individual processing | Check Results (yes)      | Extract Job               |                                 |
| Extract Job         | Code               | Extracts details from each job in batch           | Split Jobs               | Generate Letter           |                                 |
| Generate Letter     | HTTP Request       | Calls GPT-3.5 to generate cover letter           | Extract Job              | Combine Letter            |                                 |
| Combine Letter      | Code               | Combines letter with job/user info                | Generate Letter          | Aggregate                 |                                 |
| Aggregate           | Aggregate          | Aggregates all letters and job data               | Combine Letter           | Format Email              |                                 |
| Format Email        | Code               | Formats email content for sending                  | Aggregate                 | Send Email                |                                 |
| Send Email          | Email Send         | Sends personalized job application emails          | Format Email             |                           |                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**
   - Set it to run at desired intervals (e.g., daily at 9 AM).
   - No input required.

2. **Add a Set node named 'Settings':**
   - Connect it to Schedule.
   - Define all necessary parameters such as:
     - Job search keywords
     - Locations
     - Email recipient addresses
     - API credentials references (OpenAI, email)
   - These settings will be reused in HTTP requests.

3. **Add two HTTP Request nodes:**
   - Name one `Search Google Jobs`, the other `Search RemoteOK`.
   - Connect both to `Settings`.
   - Configure:
     - HTTP method: GET
     - URL endpoints for respective job APIs
     - Query parameters using expressions from `Settings` variables
     - Authentication if required
     - Accept JSON responses.

4. **Add a Merge node:**
   - Connect `Search Google Jobs` to input 0 and `Search RemoteOK` to input 1.
   - Set merge mode to append or merge by index to combine job arrays.

5. **Add a Code node named 'Process Jobs':**
   - Connect Merge to this node.
   - Write JavaScript code to:
     - Normalize job listing fields
     - Filter duplicates or unwanted jobs
     - Prepare data structure for next steps.

6. **Add an If node named 'Check Results':**
   - Connect `Process Jobs` to this node.
   - Configure condition to check if job list length > 0.

7. **Add an Email Send node 'No Results Email':**
   - Connect it to the false branch of `Check Results`.
   - Configure SMTP credentials.
   - Set recipient, subject ("No jobs found"), and message body.

8. **Add a Split In Batches node 'Split Jobs':**
   - Connect it to the true branch of `Check Results`.
   - Set batch size (e.g., 1) to process jobs one by one.

9. **Add a Code node 'Extract Job':**
   - Connect to `Split Jobs`.
   - Script extracts relevant job details (title, company, description).

10. **Add an HTTP Request node 'Generate Letter':**
    - Connect to `Extract Job`.
    - Configure POST request to OpenAI API GPT-3.5 endpoint.
    - Use OpenAI API key credential.
    - Build prompt dynamically with extracted job info.

11. **Add a Code node 'Combine Letter':**
    - Connect to `Generate Letter`.
    - Merge GPT response with job and user info for email.

12. **Add an Aggregate node 'Aggregate':**
    - Connect to `Combine Letter`.
    - Set to collect all processed jobs and letters.

13. **Add a Code node 'Format Email':**
    - Connect to `Aggregate`.
    - Format complete email body, subject, and recipients.

14. **Add an Email Send node 'Send Email':**
    - Connect to `Format Email`.
    - Configure SMTP or email service credentials.
    - Use email content from previous node.

15. **Test the entire workflow end-to-end:**
    - Validate API calls.
    - Check email delivery.
    - Monitor logs for errors or rate limits.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                             |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| Workflow tags include: jobs, ai, automation, career, indicating focus on automating job search. | Workflow metadata                                          |
| Uses GPT-3.5 (OpenAI) for cover letter generation requiring valid OpenAI API credentials.       | Relevant for credential setup                               |
| Email nodes require properly configured SMTP or email service credentials for sending emails.    | Setup SMTP or OAuth2 email credentials                      |
| Batch processing helps manage API rate limits and avoid overloading email sending service.      | Workflow design best practice                               |

---

**Disclaimer:**  
This document is based solely on an automated workflow created with n8n, respecting all content policies. It contains no illegal or offensive content. All data processed is lawful and public.