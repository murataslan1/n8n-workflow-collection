Automate Job Post Expiry Reminders with Google Sheets, HTTP Checks & Gmail

https://n8nworkflows.xyz/workflows/automate-job-post-expiry-reminders-with-google-sheets--http-checks---gmail-8390


# Automate Job Post Expiry Reminders with Google Sheets, HTTP Checks & Gmail

### 1. Workflow Overview

This workflow automates reminders for job post expiry and refresh needs by integrating Google Sheets, HTTP header checks, and Gmail notifications. It is designed for HR or recruitment teams who maintain job posts in a Google Sheet and want automated alerts when posts become stale. The workflow is structured into distinct logical blocks:

- **1.1 Configuration Initialization:** Loads global parameters and settings.
- **1.2 Schedule Trigger:** Runs the workflow daily at a specific time.
- **1.3 Data Fetch & Validation:** Retrieves job post data from Google Sheets and filters out invalid entries.
- **1.4 Weekend Execution Control:** Optionally skips processing on weekends based on configuration.
- **1.5 HTTP HEAD Requests:** Checks each job post URL’s last modified header to detect staleness.
- **1.6 Age Calculation:** Calculates the age of job posts based on last modified date.
- **1.7 Threshold Check & Email Notification:** Sends reminder emails if job posts exceed a configurable age threshold.
- **1.8 Logging:** Logs invalid or skipped rows for audit and troubleshooting.

---

### 2. Block-by-Block Analysis

#### 2.1 Configuration Initialization

- **Overview:** Sets global parameters such as spreadsheet ID, thresholds, user agent, retry counts, timezone, email templates, and dry run mode.
- **Nodes Involved:** `configuration sheet`
- **Node Details:**
  - Type: Set — assigns static key-value pairs to the workflow context.
  - Configuration: Includes parameters like `THRESHOLD_DAYS` (default 30), `INCLUDE_WEEKENDS` (true), `DRY_RUN` (false), HTTP timeout and retry settings, email templates, and OAuth2 credentials identifiers.
  - Inputs: Triggered by `Schedule Trigger`.
  - Outputs: Provides configuration data to subsequent nodes.
  - Edge cases: Misconfiguration or missing parameters could cause downstream failures.
  - Notes: Acts as a centralized hub for all configurable variables.

#### 2.2 Schedule Trigger

- **Overview:** Initiates the workflow daily at 10:32:10 AM server time.
- **Nodes Involved:** `Schedule Trigger`
- **Node Details:**
  - Type: Schedule Trigger — cron-based trigger node.
  - Configuration: Cron expression `"10 32 10 * * *"` runs once per day.
  - Input: None (trigger node).
  - Output: Starts the workflow chain by triggering `configuration sheet`.
  - Edge cases: Cron expression misconfiguration might prevent execution.
  - Version: Uses n8n v1.2 node version.

#### 2.3 Data Fetch & Validation

- **Overview:** Fetches job post rows from the configured Google Sheet and filters out invalid rows based on URL presence and valid recruiter email/name.
- **Nodes Involved:** `Fetch Job URLs`, `Filter Invalid Rows`, `Log Invalid Rows`
- **Node Details:**

  - **Fetch Job URLs**
    - Type: Google Sheets
    - Configuration: Reads data from the sheet named "Job Posts" within a specific Google Sheet document (ID provided).
    - Credentials: Uses Google Sheets OAuth2 credential.
    - Output: Emits rows as JSON objects with fields like `job_url`, `recruiter_email`, `recruiter_name`.
    - Edge cases: API auth failure, rate limits, empty sheets.
  
  - **Filter Invalid Rows**
    - Type: If
    - Configuration: Validates three conditions combined with AND:
      - `job_url` is non-empty.
      - `recruiter_email` matches email regex pattern.
      - `recruiter_email` is non-empty.
    - Output: Valid rows proceed; invalid rows are routed to logging.
    - Edge cases: Regex failures or unexpected data formats.
  
  - **Log Invalid Rows**
    - Type: Set
    - Configuration: Assigns a `reason` for invalidation depending on which validation failed, marks status as "SKIPPED", and stores the full row JSON for review.
    - Output: Does not proceed further.
    - Edge cases: Large invalid data sets could cause log bloat.

#### 2.4 Weekend Execution Control

- **Overview:** Checks if the workflow should skip processing during weekends based on configuration.
- **Nodes Involved:** `Check Weekend`, `Weekend Filter`, `Log weekend skip`
- **Node Details:**

  - **Check Weekend**
    - Type: Code
    - Configuration: Reads `INCLUDE_WEEKENDS` boolean from configuration. If false and today is Saturday or Sunday, outputs status `"SKIPPED_WEEKEND"`, else `"PROCESSING"`.
    - Edge cases: Timezone differences might affect day calculation.
  
  - **Weekend Filter**
    - Type: If
    - Configuration: Passes only items with status `"PROCESSING"` to next steps; routes weekend skips to logging.
  
  - **Log weekend skip**
    - Type: Code
    - Configuration: Adds a log reason marking the item as skipped due to weekend setting.
    - Edge cases: None critical.

#### 2.5 HTTP HEAD Requests

- **Overview:** Performs HTTP HEAD requests on valid job URLs to fetch the `Last-Modified` header, indicating last update time.
- **Nodes Involved:** `Wait Before HTTP`, `HTTP Request`, `configure mapping`
- **Node Details:**

  - **Wait Before HTTP**
    - Type: Wait
    - Configuration: Implements rate limiting or delay between HTTP requests if needed.
    - Edge cases: Workflow holding too long under heavy load.
  
  - **HTTP Request**
    - Type: HTTP Request
    - Configuration:
      - Method: HEAD (only headers)
      - URL: From `job_url` field.
      - Timeout: 5 seconds.
      - Header: Custom `User-Agent` from config `"n8n-job-checker/1.0"`.
      - On error: Continues workflow (does not fail on HTTP errors).
    - Edge cases: Timeouts, 404/403 responses, network failures.
  
  - **configure mapping**
    - Type: Set
    - Configuration: Extracts `last-modified` header or sets `"Unknown"`, copies recruiter info and job URL forward.
    - Edge cases: Missing headers, malformed responses.

#### 2.6 Age Calculation

- **Overview:** Calculates the number of days since the job post was last modified.
- **Nodes Involved:** `calculate Age`
- **Node Details:**
  - Type: Code
  - Configuration: Parses `last_modified` string to Date; compares it to current date; calculates difference in full days; defaults to 0 if parsing fails.
  - Edge cases: Invalid date strings, timezone offset issues, parsing errors.

#### 2.7 Threshold Check & Email Notification

- **Overview:** Checks if job post age exceeds threshold (default 30 days) and sends reminder emails to recruiters.
- **Nodes Involved:** `Is Age ≥ THRESHOLD_DAYS?`, `Gmail`
- **Node Details:**

  - **Is Age ≥ THRESHOLD_DAYS?**
    - Type: If
    - Configuration: Compares the numeric `age_days` to threshold (30 days).
    - Output: If true, proceeds to email node; else terminates.
  
  - **Gmail**
    - Type: Gmail
    - Configuration:
      - Sends to recruiter’s email.
      - Subject includes dynamic age_days.
      - Message is an HTML formatted reminder including job URL, age, and last modified date.
      - Uses Gmail OAuth2 credentials.
      - On error: Continues workflow (does not fail).
    - Edge cases: Email quota limits, invalid email addresses, OAuth token expiration.

#### 2.8 Logging

- **Overview:** Logs invalid data and skipped executions for accountability.
- **Nodes Involved:** `Log Invalid Rows`, `Log weekend skip`
- **Node Details:** See above under respective nodes.

---

### 3. Summary Table

| Node Name           | Node Type             | Functional Role                         | Input Node(s)           | Output Node(s)            | Sticky Note                                                                                                    |
|---------------------|-----------------------|---------------------------------------|-------------------------|---------------------------|----------------------------------------------------------------------------------------------------------------|
| Schedule Trigger     | Schedule Trigger      | Starts workflow daily at 10:32:10 AM  | None                    | configuration sheet       |                                                                                                                |
| configuration sheet  | Set                   | Loads global config variables          | Schedule Trigger        | Fetch Job URLs            | ## CONFIGURATION HUB THRESHOLD_DAYS = 30 (change to test) - DRY_RUN = false (set true for testing) - SPREADSHEET_ID = your sheet ID - INCLUDE_WEEKENDS = true |
| Fetch Job URLs       | Google Sheets         | Reads job post rows from Google Sheet | configuration sheet     | Filter Invalid Rows       |                                                                                                                |
| Filter Invalid Rows  | If                    | Filters invalid job post entries       | Fetch Job URLs          | Check Weekend, Log Invalid Rows | ## 🚨 DATA VALIDATION CHECKPOINT - Non-empty job_url - Valid email format - Non-empty recruiter_name          |
| Log Invalid Rows     | Set                   | Logs invalid rows with reasons         | Filter Invalid Rows     | None                     |                                                                                                                |
| Check Weekend        | Code                  | Decides if workflow should skip weekends | Filter Invalid Rows     | Weekend Filter            | ## WEEKEND LOGIC If INCLUDE_WEEKENDS = false: - Saturday/Sunday → status = 'SKIPPED_WEEKEND' - Weekdays → status = 'PROCESSING' |
| Weekend Filter       | If                    | Filters for processing vs weekend skip | Check Weekend           | Wait Before HTTP, Log weekend skip |                                                                                                                |
| Log weekend skip     | Code                  | Logs weekend skips                     | Weekend Filter          | None                     |                                                                                                                |
| Wait Before HTTP     | Wait                  | Rate-limits HTTP requests              | Weekend Filter          | HTTP Request              | ## 🌐 HEAD REQUEST FOR HEADERS Fetches Last-Modified header from job URLs ⏱️ Timeout: 10 seconds 🔄 Retries: 2 attempts 📡 User-Agent: n8n-job-checker/1.0 |
| HTTP Request        | HTTP Request           | Sends HEAD request to job URL          | Wait Before HTTP        | configure mapping         |                                                                                                                |
| configure mapping    | Set                   | Extracts last-modified header and maps fields | HTTP Request           | calculate Age             |                                                                                                                |
| calculate Age        | Code                  | Calculates age in days since last modified | configure mapping       | Is Age ≥ THRESHOLD_DAYS?  | ## AGE CALCULATION ENGINE - Parse last_modified date - Compare with current date - Return difference in days - If error → age_days = 0 |
| Is Age ≥ THRESHOLD_DAYS? | If                | Checks if job post age ≥ threshold      | calculate Age           | Gmail (true), None (false) |                                                                                                                |
| Gmail                | Gmail                 | Sends reminder email to recruiter      | Is Age ≥ THRESHOLD_DAYS? | None                     |                                                                                                                |
| Sticky Note          | Sticky Note           | Configuration hub notes                 | None                    | None                     | ## CONFIGURATION HUB THRESHOLD_DAYS = 30 (change to test) - DRY_RUN = false (set true for testing) - SPREADSHEET_ID = your sheet ID - INCLUDE_WEEKENDS = true |
| Sticky Note1         | Sticky Note           | Data validation checkpoint notes       | None                    | None                     | ## 🚨 DATA VALIDATION CHECKPOINT - Non-empty job_url - Valid email format - Non-empty recruiter_name          |
| Sticky Note2         | Sticky Note           | Weekend logic explanation               | None                    | None                     | ## WEEKEND LOGIC If INCLUDE_WEEKENDS = false: - Saturday/Sunday → status = 'SKIPPED_WEEKEND' - Weekdays → status = 'PROCESSING' |
| Sticky Note3         | Sticky Note           | HTTP request info and timeout details  | None                    | None                     | ## 🌐 HEAD REQUEST FOR HEADERS Fetches Last-Modified header from job URLs ⏱️ Timeout: 10 seconds 🔄 Retries: 2 attempts 📡 User-Agent: n8n-job-checker/1.0 |
| Sticky Note4         | Sticky Note           | Age calculation explanation             | None                    | None                     | ## AGE CALCULATION ENGINE - Parse last_modified date - Compare with current date - Return difference in days - If error → age_days = 0 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node:**
   - Type: Schedule Trigger
   - Cron Expression: `10 32 10 * * *` (daily at 10:32:10 AM)
   - No credentials needed.

2. **Create Set node named `configuration sheet`:**
   - Assign variables:
     - `SPREADSHEET_ID`: your Google Sheet ID (e.g., `"1n_AIqOd10Q0ErQZSO4q4LBMekwgsR4cP7EW2q9nEzdk"`)
     - `SOURCE_SHEET`: `"Job Posts"`
     - `TIMEZONE`: `"Asia/Kolkata"`
     - `THRESHOLD_DAYS`: `30`
     - `USER_AGENT`: `"n8n-job-checker/1.0"`
     - `HTTP_TIMEOUT_SECONDS`: `10`
     - `HTTP_RETRIES`: `2`
     - `RATE_LIMIT_HTTP_SECONDS`: `5`
     - `RATE_LIMIT_EMAIL_SECONDS`: `2`
     - `SMTP_FROM`: `"hiring-ops@company.com"`
     - `SUBJECT_TEMPLATE`: `"Please review your stale job post"`
     - `HTML_TEMPLATE`: `"<p>Hello {{recruiter_name}},</p><p>Your job post at {{job_url}} is {{age_days}} days old (last updated on {{last_modified}}). Consider updating it.</p>"`
     - `TEXT_TEMPLATE`: `"Hi {{recruiter_name}}, your job {{job_url}} is {{age_days}} days old. Last updated on {{last_modified}}."`
     - `INCLUDE_WEEKENDS`: `true`
     - `DRY_RUN`: `false`
   - Connect `Schedule Trigger` → `configuration sheet`.

3. **Create Google Sheets node named `Fetch Job URLs`:**
   - Operation: Read Rows
   - Document ID: use `SPREADSHEET_ID` from config
   - Sheet name: `SOURCE_SHEET` from config
   - Credentials: Google Sheets OAuth2 (set up beforehand)
   - Connect `configuration sheet` → `Fetch Job URLs`.

4. **Create If node named `Filter Invalid Rows`:**
   - Conditions (AND):
     - `job_url` is not empty
     - `recruiter_email` matches regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`
     - `recruiter_email` is not empty
   - Connect `Fetch Job URLs` → `Filter Invalid Rows`.

5. **Create Set node named `Log Invalid Rows`:**
   - Assignments:
     - `reason`: Use expression logic to explain invalidity:
       - If missing `job_url`: "Missing job URL"
       - Else if invalid email format: "Invalid email format"
       - Else if missing recruiter name: "Missing recruiter name"
       - Else: "Unknown validation error"
     - `row_data`: JSON stringified original data
     - `status`: `"SKIPPED"`
   - Connect `Filter Invalid Rows` (False branch) → `Log Invalid Rows`.

6. **Create Code node named `Check Weekend`:**
   - JavaScript to check day of week and `INCLUDE_WEEKENDS`:
     ```js
     const includeWeekends = $items('configuration sheet')[0].json.INCLUDE_WEEKENDS;
     const today = new Date();
     const dayOfWeek = today.getDay(); // 0=Sun,6=Sat
     if (!includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
       return [{ json: { ...$input.item.json, status: 'SKIPPED_WEEKEND', skip_reason: 'Weekend execution disabled' } }];
     }
     return [{ json: { ...$input.item.json, status: 'PROCESSING' } }];
     ```
   - Connect `Filter Invalid Rows` (True branch) → `Check Weekend`.

7. **Create If node named `Weekend Filter`:**
   - Condition: `status` equals `"PROCESSING"`
   - Connect `Check Weekend` → `Weekend Filter`.

8. **Create Code node named `Log weekend skip`:**
   - Adds a field `logged_reason` with value `"Execution skipped - weekend and INCLUDE_WEEKENDS is false"`.
   - Connect `Weekend Filter` (False branch) → `Log weekend skip`.

9. **Create Wait node named `Wait Before HTTP`:**
   - Used for rate limiting HTTP requests.
   - Connect `Weekend Filter` (True branch) → `Wait Before HTTP`.

10. **Create HTTP Request node named `HTTP Request`:**
    - Method: HEAD
    - URL: `{{$json.job_url}}`
    - Headers:
      - `User-Agent`: Use `USER_AGENT` from config (e.g., `"n8n-job-checker/1.0"`)
    - Timeout: 5 seconds
    - On error: Continue workflow (do not fail)
    - Connect `Wait Before HTTP` → `HTTP Request`.

11. **Create Set node named `configure mapping`:**
    - Map fields:
      - `last_modified`: from HTTP headers `last-modified` or `"Unknown"`
      - `recruiter_email`: pass through
      - `recruiter_name`: pass through
      - `job_url`: pass through
    - Connect `HTTP Request` → `configure mapping`.

12. **Create Code node named `calculate Age`:**
    - JavaScript to parse `last_modified` and compute age in days:
      ```js
      const lastModifiedStr = $input.item.json.last_modified;
      let ageDays = 0;
      if (lastModifiedStr && lastModifiedStr !== 'Unknown') {
        try {
          const lastModified = new Date(lastModifiedStr);
          const now = new Date();
          const diffMs = now.getTime() - lastModified.getTime();
          ageDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        } catch (error) {
          ageDays = 0;
        }
      }
      return [{ ...$input.item.json, age_days: ageDays }];
      ```
    - Connect `configure mapping` → `calculate Age`.

13. **Create If node named `Is Age ≥ THRESHOLD_DAYS?`:**
    - Condition: `age_days >= THRESHOLD_DAYS` (30 days default)
    - Connect `calculate Age` → `Is Age ≥ THRESHOLD_DAYS?`.

14. **Create Gmail node named `Gmail`:**
    - Send email to `recruiter_email`
    - Subject: `"Gentle Reminder: Update Your Job Post (${json.age_days} days old)"`
    - Message: HTML formatted with recruiter name, job URL, age days, last modified date, and reminder text.
    - Credentials: Gmail OAuth2 (set up beforehand)
    - On error: Continue workflow
    - Connect `Is Age ≥ THRESHOLD_DAYS?` (True branch) → `Gmail`.

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                  |
|-----------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| This workflow requires valid Google Sheets and Gmail OAuth2 credentials configured in n8n.                       | Credential setup                                 |
| The `DRY_RUN` flag in configuration can be implemented to skip sending emails for testing purposes (not active currently). | Testing support                                  |
| User-Agent header in HTTP requests identifies this workflow as `n8n-job-checker/1.0` to avoid blocks.            | HTTP Request node configuration                   |
| Timezone is set to `Asia/Kolkata` but can be changed according to user region in the configuration node.         | Timezone configuration                           |
| The workflow includes detailed logging of invalid rows and weekend skips for audit and troubleshooting purposes. | Workflow robustness and monitoring               |
| Cron expression triggers the workflow daily; adjust as needed for different schedules.                          | Schedule Trigger                                  |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.