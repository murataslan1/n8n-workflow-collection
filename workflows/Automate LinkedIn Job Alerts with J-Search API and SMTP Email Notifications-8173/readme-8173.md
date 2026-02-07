Automate LinkedIn Job Alerts with J-Search API and SMTP Email Notifications

https://n8nworkflows.xyz/workflows/automate-linkedin-job-alerts-with-j-search-api-and-smtp-email-notifications-8173


# Automate LinkedIn Job Alerts with J-Search API and SMTP Email Notifications

### 1. Workflow Overview

This workflow automates the process of retrieving job listings from LinkedIn by leveraging the J-Search API and then sending curated job alert emails via SMTP. Its primary use case is to periodically fetch the latest job postings based on predefined preferences and notify users through formatted email reports.

The workflow logic is organized into the following blocks:

- **1.1 Input Trigger & Preferences Setup:** Manual initiation of the workflow and setting user-specific search preferences.
- **1.2 Job Listings Retrieval:** Querying the J-Search API to fetch relevant job postings.
- **1.3 Data Processing & Categorization:** Parsing and categorizing the retrieved job data to prepare for email formatting.
- **1.4 Email Drafting & Sending:** Generating HTML content for the email body and sending the job alerts through an SMTP email node.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Trigger & Preferences Setup

- **Overview:**  
  This block starts the workflow manually and sets up key parameters that define the job search criteria (e.g., keywords, location, filters).

- **Nodes Involved:**  
  - Manual Trigger  
  - Setting Preferences

- **Node Details:**  

  - **Manual Trigger**  
    - Type: Trigger node  
    - Role: Entry point, allows manual start of the workflow for testing or on-demand operation.  
    - Config: No additional parameters; simply triggers the workflow when activated.  
    - Input: None  
    - Output: Passes control to “Setting Preferences” node.  
    - Edge Cases: None specific, but manual operation means no automated scheduling unless externally triggered.

  - **Setting Preferences**  
    - Type: Set node  
    - Role: Defines and sets static or dynamic variables for job search preferences.  
    - Config: Presumably sets key-value pairs such as job titles, locations, or other filters used later in the API request.  
    - Input: Receives trigger output from Manual Trigger.  
    - Output: Passes the set variables downstream to the API request node.  
    - Edge Cases: Missing or incorrect preference parameters could lead to empty or failed API queries.

#### 1.2 Job Listings Retrieval

- **Overview:**  
  This block sends an HTTP request to the J-Search API to fetch current job listings based on the preferences set earlier.

- **Nodes Involved:**  
  - Job Listing Extraction

- **Node Details:**  

  - **Job Listing Extraction**  
    - Type: HTTP Request node  
    - Role: Fetches job data from an external API (J-Search API).  
    - Config: Configured with the API endpoint URL, HTTP method (likely GET), and query parameters derived from “Setting Preferences.” Authentication details would be set here if necessary.  
    - Input: Receives search parameters from “Setting Preferences.”  
    - Output: Raw job listing data passed to the next node for categorization.  
    - Edge Cases: API downtime, rate limiting, network errors, or invalid parameters could cause failures or empty responses. Needs error handling for HTTP status codes and timeouts.

#### 1.3 Data Processing & Categorization

- **Overview:**  
  This block processes the raw job listing data, categorizes the jobs (e.g., by type, location, or relevance), and prepares the content for email formatting.

- **Nodes Involved:**  
  - Categorizing Job Listings

- **Node Details:**  

  - **Categorizing Job Listings**  
    - Type: Code node (JavaScript)  
    - Role: Parses the JSON or raw data output from the API and organizes job listings into categories or structured arrays.  
    - Config: Custom JavaScript logic to filter, sort, or tag job entries based on predefined rules or criteria.  
    - Input: Receives raw job data from “Job Listing Extraction.”  
    - Output: Structured and categorized job data passed to the HTML drafting node.  
    - Edge Cases: Malformed API data, null or empty job arrays, or script errors in processing could cause failures or empty emails.

#### 1.4 Email Drafting & Sending

- **Overview:**  
  This final block formats the categorized job listings into an HTML email template and sends the resulting email via SMTP.

- **Nodes Involved:**  
  - Drafting HTML for Mail  
  - Sending Job Listings via Mail

- **Node Details:**  

  - **Drafting HTML for Mail**  
    - Type: Code node (JavaScript)  
    - Role: Builds an HTML string representing the job listings, including styling and structured layout for email clients.  
    - Config: Contains JavaScript code that transforms categorized job data into HTML markup.  
    - Input: Receives categorized job data from “Categorizing Job Listings.”  
    - Output: HTML content passed to the email sending node.  
    - Edge Cases: Incorrect HTML generation could lead to malformed emails or display issues. Needs validation or escaping of dynamic content.

  - **Sending Job Listings via Mail**  
    - Type: Email Send node  
    - Role: Sends the compiled job alert email via SMTP.  
    - Config: SMTP credentials set for outbound mail server (e.g., Outlook OAuth2 or other). Email fields such as “To,” “Subject,” and “Body” are dynamically populated.  
    - Input: Receives HTML content from “Drafting HTML for Mail.”  
    - Output: Final output indicating success or failure of email delivery.  
    - Edge Cases: SMTP authentication errors, network issues, invalid recipient addresses, or email size limits. Should include error handling and retries if applicable.

---

### 3. Summary Table

| Node Name                  | Node Type          | Functional Role                | Input Node(s)       | Output Node(s)               | Sticky Note         |
|----------------------------|--------------------|-------------------------------|---------------------|-----------------------------|---------------------|
| Manual Trigger             | Trigger            | Workflow entry point           | -                   | Setting Preferences          |                     |
| Setting Preferences        | Set                | Sets job search criteria       | Manual Trigger      | Job Listing Extraction       |                     |
| Job Listing Extraction     | HTTP Request       | Retrieves jobs from API        | Setting Preferences | Categorizing Job Listings    |                     |
| Categorizing Job Listings  | Code               | Parses and categorizes jobs    | Job Listing Extraction | Drafting HTML for Mail       |                     |
| Drafting HTML for Mail     | Code               | Generates HTML email content   | Categorizing Job Listings | Sending Job Listings via Mail |                     |
| Sending Job Listings via Mail | Email Send        | Sends job alert email          | Drafting HTML for Mail | -                           |                     |
| Sticky Note                | Sticky Note        | Annotation                    | -                   | -                           |                     |
| Sticky Note1               | Sticky Note        | Annotation                    | -                   | -                           |                     |
| Sticky Note2               | Sticky Note        | Annotation                    | -                   | -                           |                     |
| Sticky Note3               | Sticky Note        | Annotation                    | -                   | -                           |                     |
| Sticky Note4               | Sticky Note        | Annotation                    | -                   | -                           |                     |
| Sticky Note5               | Sticky Note        | Annotation                    | -                   | -                           |                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node**  
   - Purpose: Start workflow manually.  
   - No special configuration needed.

2. **Add Set node named “Setting Preferences”**  
   - Purpose: Define job search parameters (e.g., keywords, location).  
   - Add key-value pairs such as:  
     - `jobTitle`: e.g., “Software Engineer”  
     - `location`: e.g., “New York”  
     - `filters`: any additional filters needed  
   - Connect output from Manual Trigger to this node.

3. **Add HTTP Request node named “Job Listing Extraction”**  
   - Purpose: Query J-Search API for jobs.  
   - Set HTTP Method: GET or POST as required by API.  
   - Set URL: J-Search API endpoint for job listings.  
   - Use query parameters or body to pass preferences from previous node (use expressions referencing “Setting Preferences” variables).  
   - Configure authentication if API requires (e.g., API key in headers).  
   - Connect output from “Setting Preferences” to this node.

4. **Add Code node named “Categorizing Job Listings”**  
   - Purpose: Process and categorize raw job data.  
   - Paste JavaScript code that parses the API JSON response and organizes listings into categories or filters out unwanted entries.  
   - Input: Raw JSON from HTTP Request.  
   - Output: Structured data for email generation.  
   - Connect output from “Job Listing Extraction” to this node.

5. **Add Code node named “Drafting HTML for Mail”**  
   - Purpose: Generate HTML email content from categorized jobs.  
   - Write JavaScript code that creates an HTML string, including headings, job details, links, and basic styling.  
   - Input: Categorized job data.  
   - Output: HTML string for email body.  
   - Connect output from “Categorizing Job Listings” to this node.

6. **Add Email Send node named “Sending Job Listings via Mail”**  
   - Purpose: Send job alert email.  
   - Configure SMTP credentials (e.g., Outlook OAuth2 or SMTP username/password).  
   - Set “To” field with recipient email(s).  
   - Set “Subject” field (e.g., “Your LinkedIn Job Alerts”).  
   - For “Body” field, use the HTML output from “Drafting HTML for Mail” node.  
   - Ensure “Send as HTML” option is enabled.  
   - Connect output from “Drafting HTML for Mail” to this node.

7. **Test the workflow**  
   - Trigger manually to verify data retrieval, processing, and email sending.  
   - Monitor for errors or unexpected outputs and adjust parameters or code accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                               |
|-----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| The workflow leverages the J-Search API to fetch job listings — ensure you have valid API credentials and quota.      | API provider documentation                                    |
| SMTP credentials must be correctly configured to avoid email delivery failures.                                        | n8n Email Send node documentation                             |
| Consider setting up error handling (e.g., catch failures on HTTP or email nodes) and retries for robustness.          | n8n error workflow guides                                     |
| For automated scheduling, replace the Manual Trigger with a Cron node to run alerts at regular intervals.             | n8n Cron node documentation                                  |
| HTML email formatting should be tested across major clients to ensure compatibility (Outlook, Gmail, Apple Mail, etc.) | General email design best practices                           |

---

**Disclaimer:** The content above is an analysis and documentation of an n8n workflow designed solely for legitimate and public data processing and automation. It complies fully with n8n’s usage policies and does not engage in any unauthorized or illegal data handling.