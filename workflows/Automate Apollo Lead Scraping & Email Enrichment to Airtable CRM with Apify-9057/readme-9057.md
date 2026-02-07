Automate Apollo Lead Scraping & Email Enrichment to Airtable CRM with Apify

https://n8nworkflows.xyz/workflows/automate-apollo-lead-scraping---email-enrichment-to-airtable-crm-with-apify-9057


# Automate Apollo Lead Scraping & Email Enrichment to Airtable CRM with Apify

### 1. Workflow Overview

This workflow automates the process of scraping leads from Apollo.io using Apify, enriches the data with email and LinkedIn information, removes duplicates, filters leads based on website presence, and finally synchronizes the enriched contacts into Airtable CRM tables. It separates contacts into two tables depending on whether they have an email address, facilitating targeted outreach and CRM management.

Logical blocks:

- **1.1 Input Acquisition:** Fetch Apollo.io search URLs from Airtable.
- **1.2 Lead Scraping:** Use Apify actor to scrape leads from the Apollo URLs.
- **1.3 Data Mapping and Deduplication:** Normalize and map scraped fields, then remove duplicates.
- **1.4 Filtering Leads:** Filter leads to those with websites.
- **1.5 Conditional Routing:** Branch leads based on presence of email and personal email fields.
- **1.6 Airtable Record Creation:** Insert leads into appropriate Airtable tables depending on email availability.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Acquisition

- **Overview:**  
  Retrieves Apollo people search URLs from a designated Airtable table to serve as input for the scraping process.

- **Nodes Involved:**  
  - Start (Manual Trigger)  
  - Get URL (Airtable node)  
  - Note: Get URL (Sticky Note)

- **Node Details:**  

  - **Start**  
    - Type: Manual Trigger  
    - Role: Entry point to initiate the workflow manually.  
    - Configuration: No parameters.  
    - Connections: Outgoing to "Get URL".  
    - Potential failures: None (manual trigger).  

  - **Get URL**  
    - Type: Airtable node  
    - Role: Fetches all records from the "Apollo URL" table in Airtable, which contains Apollo search URLs.  
    - Configuration:  
      - Base: User’s Airtable base (configured via OAuth2 credential).  
      - Table: "Apollo URL" (expected to hold URLs).  
      - Operation: Search (retrieves all records).  
      - Authentication: OAuth2 with Airtable.  
    - Key expressions: Extracts the URL field from each record to pass downstream.  
    - Input: From Start node.  
    - Output: To "Apollo Scraper".  
    - Edge cases:  
      - Empty or malformed URLs in the Airtable table.  
      - Authentication failure or insufficient scopes in Airtable OAuth2.  
      - Airtable API rate limits.  

  - **Note: Get URL**  
    - Type: Sticky Note  
    - Role: Documentation block describing the purpose and configuration of the Get URL node.  
    - Contains instructions about ensuring valid Apollo people search URLs in Airtable.  

#### 1.2 Lead Scraping

- **Overview:**  
  Invokes the Apify Apollo Scraper actor to collect lead data from Apollo.io URLs, requesting personal and work emails and limiting total records.

- **Nodes Involved:**  
  - Apollo Scraper (HTTP Request)  
  - Note: Scrape Leads (Sticky Note)

- **Node Details:**  

  - **Apollo Scraper**  
    - Type: HTTP Request  
    - Role: Calls Apify API to run the Apollo Scraper actor synchronously with parameters.  
    - Configuration:  
      - Method: POST  
      - URL: Apify actor endpoint for synchronous run and dataset retrieval.  
      - Headers: Content-Type and Accept as application/json; Authorization Bearer token (Apify API key).  
      - Body (JSON):  
        - getPersonalEmails: true  
        - getWorkEmails: true  
        - totalRecords: 1100 (max number of leads to scrape)  
        - url: Dynamic from Airtable input URL (expression: `{{ $json.URL }}`)  
      - Query parameters: timeout (600000 ms), memory (32768 MB) to support large scrape.  
      - Timeout set high (1000000 ms) due to scraping latency.  
    - Input: Receives URL from "Get URL".  
    - Output: JSON dataset of scraped leads.  
    - Version-specific: Uses HTTP Request v4.2.  
    - Edge cases:  
      - API key invalid or expired (authorization error).  
      - URL invalid or not a people search (results empty).  
      - Apify actor limits reached or memory/timeout exceeded.  
      - Network errors or response format changes.  

  - **Note: Scrape Leads**  
    - Type: Sticky Note  
    - Role: Explains purpose and config of the Apify scraper node, including memory and totalRecords settings.  

#### 1.3 Data Mapping and Deduplication

- **Overview:**  
  Transforms the raw scraped data by mapping fields to desired names matching Airtable columns, handles nested JSON, then removes duplicate leads before further processing.

- **Nodes Involved:**  
  - Edit Fields (Set node)  
  - Remove Duplicates (Remove Duplicates node)  
  - Note: Edit Fields (Sticky Note)  
  - Note: Dedupe & Filter (Sticky Note)

- **Node Details:**  

  - **Edit Fields**  
    - Type: Set node  
    - Role: Maps and assigns lead data fields to normalized property names for Airtable.  
    - Configuration:  
      - Assignments include first_name, last_name, name, linkedin_url, Job Title, Company Name, Website, Company Linkedin, personal_email, Twitter_url, email_status, email.  
      - Handles nested fields like organization.name, organization.website_url.  
      - Uses expressions like `={{ $json.first_name }}` to preserve data.  
    - Input: From "Apollo Scraper".  
    - Output: To "Remove Duplicates".  
    - Edge cases:  
      - Missing nested fields causing undefined values.  
      - Changes in Apify output structure requiring updates here.  

  - **Remove Duplicates**  
    - Type: Remove Duplicates node  
    - Role: Eliminates duplicate lead records based on default criteria (all fields).  
    - Configuration: Default options, no custom keys set.  
    - Input: From "Edit Fields".  
    - Output: To "Filter" node.  
    - Edge cases:  
      - Duplicates not detected due to insufficient criteria (may require custom key fields like email+name).  
      - No output if all records are duplicates.  

  - **Note: Edit Fields**  
    - Sticky Note describing the field mapping purpose and handling of nested data.  

  - **Note: Dedupe & Filter**  
    - Sticky Note explaining deduplication and filtering steps, with advice on customizing duplicate keys.  

#### 1.4 Filtering Leads

- **Overview:**  
  Filters the lead records, only passing those that contain a website field (non-empty), focusing on leads with verified company websites.

- **Nodes Involved:**  
  - Filter (Filter node)

- **Node Details:**  

  - **Filter**  
    - Type: Filter node  
    - Role: Allows only leads where `Website` field exists and is non-empty.  
    - Configuration: Condition on field `Website`, operation "exists".  
    - Input: From "Remove Duplicates".  
    - Output: To "If" node (conditional routing).  
    - Edge cases:  
      - Leads without websites are excluded, possibly losing some contacts.  
      - Field name case-sensitive; if field name changes upstream, filter fails.  

#### 1.5 Conditional Routing

- **Overview:**  
  Routes leads into two branches based on the presence of email data, separating those with emails from those without for different Airtable tables.

- **Nodes Involved:**  
  - If (If node)  
  - IF (If node)  
  - Note: Conditions (Sticky Note)  

- **Node Details:**  

  - **If**  
    - Type: If node  
    - Role: Checks if the `email` field exists (work or generic email).  
    - Configuration: Condition "email" exists and is non-empty.  
    - Input: From "Filter".  
    - Output: True branch to "Email Present" node; False branch to "IF" node.  
    - Edge cases:  
      - Improper email formats or empty strings may cause misrouting.  

  - **IF**  
    - Type: If node  
    - Role: Further checks if `personal_email` field exists in leads that failed the previous check.  
    - Configuration: Condition "personal_email" exists and is non-empty.  
    - Input: From "If" false branch.  
    - Output: True branch to "Personal email present" node; False branch to "Email Absent" node.  
    - Edge cases:  
      - Similar to above for empty or malformed personal_email.  

  - **Note: Conditions**  
    - Sticky Note explaining the purpose of these if nodes and their role in branching leads by email presence.  

#### 1.6 Airtable Record Creation

- **Overview:**  
  Inserts lead data into one of two Airtable tables depending on email presence:  
  - "Contacts with email" table for leads with either work or personal email  
  - "Contacts without emails" table for leads lacking email  

- **Nodes Involved:**  
  - Email Present (Airtable node)  
  - Personal email present (Airtable node)  
  - Email Absent (Airtable node)  
  - Note: Airtable Creates (Sticky Note)  

- **Node Details:**  

  - **Email Present**  
    - Type: Airtable node  
    - Role: Creates records in the "Contacts with email" table.  
    - Configuration:  
      - Base: Airtable base ID as per user setup.  
      - Table: "Contacts with email".  
      - Operation: Create record.  
      - Mapped columns: Email (uses `$ifEmpty(personal_email, email)`), Company, Website, Full Name, Job Title, Last Name, First Name, Email Status, Business LinkedIn URL, Personal LinkedIn URL.  
      - Authentication: Airtable OAuth2.  
    - Input: From "If" true branch.  
    - Output: None (end of branch).  
    - Edge cases:  
      - Permission errors if OAuth token expired or scopes insufficient.  
      - Duplicate records if deduplication failed upstream.  

  - **Personal email present**  
    - Type: Airtable node  
    - Role: Creates records in "Contacts with email" table for leads with personal emails.  
    - Configuration: Same as "Email Present", ensuring fallback email logic.  
    - Input: From "IF" true branch.  
    - Output: None (end of branch).  
    - Edge cases: Same as above.  

  - **Email Absent**  
    - Type: Airtable node  
    - Role: Creates records in "Contacts without emails" table.  
    - Configuration:  
      - Base: Same Airtable base.  
      - Table: "Contacts without emails".  
      - Operation: Create record.  
      - Columns mapped similarly but email fields may be empty.  
      - Authentication: Airtable OAuth2.  
    - Input: From "IF" false branch.  
    - Output: None (end of workflow).  
    - Edge cases: Empty emails handled here, but missing critical data could affect CRM usability.  

  - **Note: Airtable Creates**  
    - Sticky Note describing the purpose of these Airtable nodes and reminding about permissions and base/table IDs.  

---

### 3. Summary Table

| Node Name             | Node Type                | Functional Role                                   | Input Node(s)           | Output Node(s)                   | Sticky Note                                                                                              |
|-----------------------|--------------------------|--------------------------------------------------|-------------------------|---------------------------------|--------------------------------------------------------------------------------------------------------|
| Start                 | Manual Trigger           | Entry point to start the workflow manually       |                         | Get URL                         |                                                                                                        |
| Get URL               | Airtable                 | Fetch Apollo search URLs from Airtable           | Start                   | Apollo Scraper                  | ## 📥 Get URL: Fetches Apollo URLs from Airtable. Ensure valid Apollo people search links exist.       |
| Apollo Scraper        | HTTP Request             | Scrape leads from Apollo via Apify API           | Get URL                 | Edit Fields                    | ## 🔍 Scrape Leads: Runs Apify actor, enable personal/work emails, set totalRecords and memory.         |
| Edit Fields           | Set                      | Map and rename scraped fields for Airtable       | Apollo Scraper          | Remove Duplicates              | ## ✏️ Node: Edit Fields: Maps data fields including nested organization info.                          |
| Remove Duplicates      | Remove Duplicates         | Remove duplicate lead records                      | Edit Fields             | Filter                        | ## Remove Duplicates & Filter: Deduplicate leads, filter those with websites.                           |
| Filter                | Filter                   | Filter leads with existing website URLs           | Remove Duplicates       | If                            | ## Remove Duplicates & Filter: Filter for leads having websites.                                       |
| If                    | If                       | Check presence of work/generic email              | Filter                  | Email Present (true), IF (false) | ## 🔀 Nodes: If & IF: Branch based on email presence.                                               |
| Email Present         | Airtable                 | Create records for leads with email                | If (true)               |                                 | ## 📤 Email Present, Personal email present, Email Absent: Create records in Airtable tables.          |
| IF                    | If                       | Check presence of personal_email                    | If (false)              | Personal email present (true), Email Absent (false) | ## 🔀 Nodes: If & IF: Branch based on email presence.                                   |
| Personal email present | Airtable                 | Create records for leads with personal email       | IF (true)               |                                 | ## 📤 Email Present, Personal email present, Email Absent: Create records in Airtable tables.          |
| Email Absent          | Airtable                 | Create records for leads without email              | IF (false)              |                                 | ## 📤 Email Present, Personal email present, Email Absent: Create records in Airtable tables.          |
| Sticky Note           | Sticky Note              | Documentation and instructions                      |                         |                                 | # Apollo Lead Scraper to Airtable CRM: Full workflow description and prerequisites.                    |
| Note: Get URL         | Sticky Note              | Explains Get URL node                               |                         |                                 | ## 📥 Get URL: Fetch Apollo URLs from Airtable.                                                       |
| Note: Scrape Leads    | Sticky Note              | Explains Apollo Scraper node                        |                         |                                 | ## 🔍 Scrape Leads: Run Apify actor with emails enabled.                                              |
| Note: Edit Fields     | Sticky Note              | Explains Edit Fields node                           |                         |                                 | ## ✏️ Node: Edit Fields: Maps and renames lead data fields.                                          |
| Note: Dedupe & Filter | Sticky Note              | Explains deduplication and filtering logic         |                         |                                 | ## Remove Duplicates & Filter: Deduplicate and filter leads with websites.                            |
| Note: Conditions      | Sticky Note              | Explains conditional routing based on emails      |                         |                                 | ## 🔀 Nodes: If & IF: Branch leads by email presence.                                                |
| Note: Airtable Creates| Sticky Note              | Explains Airtable record creation nodes            |                         |                                 | ## 📤 Email Present, Personal email present, Email Absent: Airtable create record nodes explained.   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Name: "Start"  
   - No parameters.

2. **Create Airtable Node to Get URLs:**  
   - Name: "Get URL"  
   - Type: Airtable  
   - Credentials: Assign Airtable OAuth2 credentials.  
   - Operation: Search (list all records).  
   - Base: Your Airtable base ID containing Apollo URLs.  
   - Table: "Apollo URL" (or your equivalent).  
   - Ensure table has a field "URL" with valid Apollo people search URLs.  
   - Connect "Start" → "Get URL".

3. **Create HTTP Request Node to Call Apify Apollo Scraper:**  
   - Name: "Apollo Scraper"  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.apify.com/v2/acts/jljBwyyQakqrL1wae/run-sync-get-dataset-items`  
   - Headers:  
     - Content-Type: application/json  
     - Accept: application/json  
     - Authorization: Bearer `<Your Apify API Key>` (replace with your actual key).  
   - Body: JSON (raw) containing:  
     ```json
     {
       "getPersonalEmails": true,
       "getWorkEmails": true,
       "totalRecords": 1100,
       "url": "{{ $json.URL }}"
     }
     ```  
   - Query Parameters:  
     - timeout: 600000 (for long scrape)  
     - memory: 32768 (to allow large scrape)  
   - Timeout: 1000000 ms  
   - Connect "Get URL" → "Apollo Scraper"

4. **Create Set Node to Map and Rename Fields:**  
   - Name: "Edit Fields"  
   - Type: Set  
   - Assign fields (mapping scraped data to normalized names):  
     - first_name = `{{$json.first_name}}`  
     - last_name = `{{$json.last_name}}`  
     - name = `{{$json.name}}`  
     - linkedin_url = `{{$json.linkedin_url}}`  
     - Job Title = `{{$json.title}}`  
     - Company Name = `{{$json.organization.name}}`  
     - Website = `{{$json.organization.website_url}}`  
     - Company Linkedin = `{{$json.organization.linkedin_url}}`  
     - personal_email = `{{$json.personal_email}}`  
     - Twitter_url = `{{$json.organization.twitter_url}}`  
     - email_status = `{{$json.email_status}}`  
     - email = `{{$json.email}}`  
   - Connect "Apollo Scraper" → "Edit Fields"

5. **Create Remove Duplicates Node:**  
   - Name: "Remove Duplicates"  
   - Use default options (compare all fields) or customize keys to email+name for better deduplication if needed.  
   - Connect "Edit Fields" → "Remove Duplicates"

6. **Create Filter Node to Keep Leads with Website:**  
   - Name: "Filter"  
   - Condition: Field `Website` exists and is not empty.  
   - Connect "Remove Duplicates" → "Filter"

7. **Create If Node to Check for General Email Presence:**  
   - Name: "If"  
   - Condition: Field `email` exists and is not empty.  
   - Connect "Filter" → "If"

8. **Create Airtable Node for Leads with Email:**  
   - Name: "Email Present"  
   - Base: Your Airtable base for contacts.  
   - Table: "Contacts with email" (or your table name).  
   - Operation: Create record.  
   - Map columns accordingly, using expression:  
     - Email: `$ifEmpty($json.personal_email, $json.email)`  
     - Company, Website, Full Name, Job Title, Last Name, First Name, Email Status, Business LinkedIn URL, Personal LinkedIn URL with respective fields.  
   - Credentials: Airtable OAuth2.  
   - Connect "If" true branch → "Email Present"

9. **Create Second If Node to Check for Personal Email:**  
   - Name: "IF" (second If node)  
   - Condition: Field `personal_email` exists and is not empty.  
   - Connect "If" false branch → "IF"

10. **Create Airtable Node for Leads with Personal Email:**  
    - Name: "Personal email present"  
    - Same base/table as "Email Present" node.  
    - Same column mapping.  
    - Connect "IF" true branch → "Personal email present"

11. **Create Airtable Node for Leads without Email:**  
    - Name: "Email Absent"  
    - Base: Same Airtable base.  
    - Table: "Contacts without emails" (a separate table).  
    - Operation: Create record.  
    - Map columns similar to above but email fields may be empty.  
    - Credentials: Airtable OAuth2.  
    - Connect "IF" false branch → "Email Absent"

12. **Add Sticky Notes for Documentation:**  
    - Create Sticky Note nodes near relevant nodes containing all the descriptive content provided in the original workflow, such as prerequisites, configuration steps, troubleshooting tips, and explanations for each logical block.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                            | Context or Link                                                                                                     |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| This workflow requires an Apollo.io account with valid people search URLs and an Airtable base with three tables: one for the URLs input and two for contacts with and without emails.                                                                                                                                                                                                                   | Workflow prerequisites section                                                                                        |
| Airtable OAuth2 API credential setup requires registering an OAuth integration with specific scopes: data.records:read, data.records:write, schema.bases:read. Use the n8n redirect URI during registration.                                                                                                                                                                                              | Airtable API Setup instructions                                                                                      |
| Apify API credential setup involves copying your API token from the Apify console under Settings > Integrations and adding it to n8n credentials.                                                                                                                                                                                                                                                      | Apify API Setup instructions                                                                                          |
| Troubleshooting tips include validating Apollo URLs (must be people search), monitoring Apify logs for scrape issues, re-granting Airtable scopes on authentication errors, and customizing duplicate removal keys if duplicates persist.                                                                                                                                                                   | Troubleshooting section                                                                                              |
| This workflow supports use cases such as enriching B2B sales pipelines with targeted leads, automating prospecting from Apollo filters, sourcing candidates by job title/location, and building marketing datasets.                                                                                                                                                                                         | Use cases section                                                                                                    |
| Monitoring Apify usage limits and adjusting "totalRecords" to avoid timeouts or memory overload is recommended for large datasets.                                                                                                                                                                                                                                                                    | Performance notes in sticky notes                                                                                     |
| Airtable tables "Contacts with email" and "Contacts without emails" are designed to keep outreach organized based on email availability, facilitating targeted CRM campaigns.                                                                                                                                                                                                                            | CRM organization strategy                                                                                            |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected content. All data handled is legal and public.