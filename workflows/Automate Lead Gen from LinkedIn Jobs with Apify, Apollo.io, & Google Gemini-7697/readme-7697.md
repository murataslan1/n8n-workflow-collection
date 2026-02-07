Automate Lead Gen from LinkedIn Jobs with Apify, Apollo.io, & Google Gemini

https://n8nworkflows.xyz/workflows/automate-lead-gen-from-linkedin-jobs-with-apify--apollo-io----google-gemini-7697


# Automate Lead Gen from LinkedIn Jobs with Apify, Apollo.io, & Google Gemini

### 1. Workflow Overview

This workflow automates AI-powered lead generation by extracting job postings from LinkedIn, enriching company and personnel data via Apollo.io, and generating personalized email content using Google Gemini’s language model. The final leads with validated email information are stored and updated in Google Sheets for easy access and follow-up.

The workflow is logically divided into these blocks:

- **1.1 Input Reception and Job Scraping**: Manual trigger initiates the workflow, which scrapes LinkedIn job data using Apify, then collects the scraped dataset.

- **1.2 Data Filtering and Cleaning**: Filters out irrelevant companies (e.g., HR industry), checks company size constraints, removes duplicates, and prepares company details for further processing.

- **1.3 Company Domain Verification and Limiting Search**: Validates company domain existence and limits the number of companies processed to control workflow scale.

- **1.4 Personnel Data Enrichment**: Queries Apollo.io to get targeted personnel based on company data, sanitizes retrieved personal details, and finds their emails via Apollo.io’s email finder API.

- **1.5 Lead Structuring and Storage**: Structures complete person details, adds leads to Google Sheets, and fetches existing lead data for validation.

- **1.6 Email Validation and AI-Powered Email Generation**: Validates email presence and content, then uses Google Gemini AI model with structured output parsing to generate personalized lead emails.

- **1.7 Updating Final Lead Data**: Updates Google Sheets with the generated email content to maintain an up-to-date lead database.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Job Scraping

- **Overview:** Starts the workflow manually, runs LinkedIn job scraper, and retrieves scraped job postings dataset.

- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Run the LinkedIn Job Scraper (Apify)  
  - Get dataset Items (Apify)

- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point for the workflow; waits for manual execution.  
    - Connections: Outputs to “Run the LinkedIn Job Scraper”  
    - Edge cases: Workflow won't start without manual trigger.

  - **Run the LinkedIn Job Scraper**  
    - Type: Apify Integration Node  
    - Role: Executes the LinkedIn job scraper actor on Apify to scrape job listings.  
    - Config: Uses stored Apify credentials and actor configuration.  
    - Inputs: From Manual Trigger  
    - Outputs: To “Get dataset Items”  
    - Edge cases: Apify API errors, actor failures, no dataset produced.

  - **Get dataset Items**  
    - Type: Apify Integration Node  
    - Role: Fetches items from the Apify dataset produced by the scraper.  
    - Inputs: From “Run the LinkedIn Job Scraper”  
    - Outputs: To “Checks Company Size < 250”  
    - Edge cases: Dataset empty, API rate limits.

---

#### 1.2 Data Filtering and Cleaning

- **Overview:** Filters job data by removing HR-related industries, companies with large size, and duplicates; prepares company details for the next steps.

- **Nodes Involved:**  
  - Checks Company Size < 250 (If node)  
  - Remove Duplicates (Remove Duplicates)  
  - Removes HR Related Industry (If node)  
  - Prepare Final Company Details (Code node)

- **Node Details:**

  - **Checks Company Size < 250**  
    - Type: Conditional If Node  
    - Role: Filters companies by size, only allowing those with less than 250 employees.  
    - Inputs: From “Get dataset Items”  
    - Outputs: To “Remove Duplicates”  
    - Edge cases: Missing size data, invalid data types.

  - **Remove Duplicates**  
    - Type: Remove Duplicates Node  
    - Role: Ensures unique company entries by removing duplicates from the dataset.  
    - Inputs: From “Checks Company Size < 250”  
    - Outputs: To “Removes HR Related Industry”  
    - Edge cases: Duplicates not detected due to inconsistent data format.

  - **Removes HR Related Industry**  
    - Type: Conditional If Node  
    - Role: Filters out companies operating in HR-related industries to avoid irrelevant leads.  
    - Inputs: From “Remove Duplicates”  
    - Outputs: To “Prepare Final Company Details”  
    - Edge cases: Incorrect or missing industry classification.

  - **Prepare Final Company Details**  
    - Type: Code Node (JavaScript)  
    - Role: Processes and formats company data into a structured form for domain checking.  
    - Inputs: From “Removes HR Related Industry”  
    - Outputs: To “Checks Domain Existence”  
    - Edge cases: Code exceptions, malformed input data.

---

#### 1.3 Company Domain Verification and Limiting Search

- **Overview:** Checks that company domains exist and limits the number of companies to process to control API usage and workflow runtime.

- **Nodes Involved:**  
  - Checks Domain Existence (If node)  
  - Limit Companies Search (Limit node)  
  - Merge (Merge node)

- **Node Details:**

  - **Checks Domain Existence**  
    - Type: Conditional If Node  
    - Role: Ensures the company has a valid domain before proceeding.  
    - Inputs: From “Prepare Final Company Details”  
    - Outputs: To “Limit Companies Search”  
    - Edge cases: Missing domain info, invalid domain formats.

  - **Limit Companies Search**  
    - Type: Limit Node  
    - Role: Caps the number of companies processed in next steps for performance and API quota management.  
    - Inputs: From “Checks Domain Existence”  
    - Outputs: To “Merge” and “Apollo Get Targeted Personnel”  
    - Edge cases: Limit set too low or too high affecting throughput.

  - **Merge**  
    - Type: Merge Node  
    - Role: Combines multiple input streams (structured details and sanitized emails) into one for further processing.  
    - Inputs: Multiple, including from “Sanitising Email Details” and “Limit Companies Search”  
    - Outputs: To “Structuring Complete Details of Person”  
    - Edge cases: Data synchronization issues, input mismatch.

---

#### 1.4 Personnel Data Enrichment

- **Overview:** Uses Apollo.io API to enrich personnel data for targeted contacts; sanitizes personal details and finds emails.

- **Nodes Involved:**  
  - Apollo Get Targeted Personnel (HTTP Request)  
  - Sanitising Person Details (Code node)  
  - Apollo Email Finder (HTTP Request)  
  - Sanitising Email Details (Code node)

- **Node Details:**

  - **Apollo Get Targeted Personnel**  
    - Type: HTTP Request  
    - Role: Calls Apollo.io’s API to retrieve targeted personnel based on company data.  
    - Inputs: From “Limit Companies Search”  
    - Outputs: To “Sanitising Person Details”  
    - Config: Requires Apollo.io API credentials (API key or OAuth).  
    - Edge cases: API authentication failure, rate limits, empty results.

  - **Sanitising Person Details**  
    - Type: Code Node  
    - Role: Cleans and structures personnel data for further processing.  
    - Inputs: From “Apollo Get Targeted Personnel”  
    - Outputs: To “Apollo Email Finder” and “Merge” (second input)  
    - Edge cases: Data format inconsistencies, null values.

  - **Apollo Email Finder**  
    - Type: HTTP Request  
    - Role: Queries Apollo.io’s email finder API to get emails for each person.  
    - Inputs: From “Sanitising Person Details”  
    - Outputs: To “Sanitising Email Details”  
    - Config: Uses Apollo.io credentials.  
    - Edge cases: API call failures, no emails found.

  - **Sanitising Email Details**  
    - Type: Code Node  
    - Role: Cleans and formats the email data returned from Apollo.  
    - Inputs: From “Apollo Email Finder”  
    - Outputs: To “Merge” (third input)  
    - Edge cases: Malformed emails, missing data.

---

#### 1.5 Lead Structuring and Storage

- **Overview:** Structures the complete lead details and stores them in Google Sheets for record keeping and later validation.

- **Nodes Involved:**  
  - Structuring Complete Details of Person (Code node)  
  - Adding Leads to Sheets (Google Sheets)  
  - Fetching Leads Data (Google Sheets)

- **Node Details:**

  - **Structuring Complete Details of Person**  
    - Type: Code Node  
    - Role: Combines and formats all collected company and contact data into a final structured lead representation.  
    - Inputs: From “Merge”  
    - Outputs: To “Adding Leads to Sheets”  
    - Edge cases: Code errors, incomplete data.

  - **Adding Leads to Sheets**  
    - Type: Google Sheets Node  
    - Role: Inserts the structured leads into a designated Google Sheets spreadsheet and worksheet.  
    - Inputs: From “Structuring Complete Details of Person”  
    - Outputs: To “Fetching Leads Data”  
    - Config: Requires Google Sheets OAuth2 credentials, target spreadsheet and sheet setup.  
    - Edge cases: Credential expiry, sheet access issues.

  - **Fetching Leads Data**  
    - Type: Google Sheets Node  
    - Role: Retrieves existing lead data from Google Sheets for validation and filtering.  
    - Inputs: From “Adding Leads to Sheets”  
    - Outputs: To “Validates Email Id and Email Content”  
    - Edge cases: Sheet access errors, empty results.

---

#### 1.6 Email Validation and AI-Powered Email Generation

- **Overview:** Validates email presence and content, then generates personalized lead emails using Google Gemini AI with structured output parsing.

- **Nodes Involved:**  
  - Validates Email Id and Email Content (If node)  
  - Filter (Filter node)  
  - Google Gemini Chat Model (Langchain AI model)  
  - Structured Output Parser (Langchain Output Parser)  
  - Lead Email Generator (Langchain Chain LLM)

- **Node Details:**

  - **Validates Email Id and Email Content**  
    - Type: Conditional If Node  
    - Role: Checks that email IDs and content are present before proceeding.  
    - Inputs: From “Fetching Leads Data”  
    - Outputs: To “Filter”  
    - Edge cases: Missing or invalid emails.

  - **Filter**  
    - Type: Filter Node  
    - Role: Further filters leads based on validation results or criteria.  
    - Inputs: From “Validates Email Id and Email Content”  
    - Outputs: To “Lead Email Generator”  
    - Edge cases: No leads passing filter.

  - **Google Gemini Chat Model**  
    - Type: Langchain Google Gemini Chat LLM Node  
    - Role: Sends prompts to Google Gemini AI to generate personalized email content for leads.  
    - Inputs: From “Filter” (via Langchain chain)  
    - Outputs: To “Lead Email Generator” (as AI model)  
    - Config: Requires Google Cloud credentials with Gemini API access.  
    - Edge cases: API quota limits, network errors, malformed prompts.

  - **Structured Output Parser**  
    - Type: Langchain Structured Output Parser Node  
    - Role: Parses AI model responses into structured data fields for further use.  
    - Inputs: From “Google Gemini Chat Model” (ai_outputParser)  
    - Outputs: To “Lead Email Generator” (ai_outputParser)  
    - Edge cases: Parsing errors if AI response deviates from expected format.

  - **Lead Email Generator**  
    - Type: Langchain Chain LLM Node  
    - Role: Orchestrates prompt generation, sends to AI, and processes response to generate final lead email content.  
    - Inputs: From “Filter” and AI model/parser nodes  
    - Outputs: To “Update Sheet with Email”  
    - Edge cases: AI response errors, timeouts.

---

#### 1.7 Updating Final Lead Data

- **Overview:** Updates the Google Sheets with the generated email content to maintain an updated and actionable lead database.

- **Nodes Involved:**  
  - Update Sheet with Email (Google Sheets)

- **Node Details:**

  - **Update Sheet with Email**  
    - Type: Google Sheets Node  
    - Role: Updates existing lead records in Google Sheets with newly generated email content.  
    - Inputs: From “Lead Email Generator”  
    - Outputs: None (end of workflow)  
    - Config: Requires Google Sheets OAuth2 credentials, correct sheet and update ranges.  
    - Edge cases: Credential expiry, update conflicts.

---

### 3. Summary Table

| Node Name                     | Node Type                            | Functional Role                             | Input Node(s)                     | Output Node(s)                    | Sticky Note                          |
|-------------------------------|------------------------------------|---------------------------------------------|----------------------------------|----------------------------------|------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                     | Workflow entry point                         |                                  | Run the LinkedIn Job Scraper     |                                    |
| Run the LinkedIn Job Scraper  | Apify                              | Launch LinkedIn jobs scraper                  | When clicking ‘Execute workflow’ | Get dataset Items                |                                    |
| Get dataset Items             | Apify                              | Retrieve scraped job postings dataset       | Run the LinkedIn Job Scraper     | Checks Company Size < 250        |                                    |
| Checks Company Size < 250     | If Node                           | Filter companies by size < 250 employees    | Get dataset Items                | Remove Duplicates                |                                    |
| Remove Duplicates             | Remove Duplicates                  | Remove duplicate company entries             | Checks Company Size < 250        | Removes HR Related Industry      |                                    |
| Removes HR Related Industry   | If Node                           | Filter out HR-related industries             | Remove Duplicates                | Prepare Final Company Details    |                                    |
| Prepare Final Company Details | Code Node                        | Format company details for domain checking  | Removes HR Related Industry      | Checks Domain Existence          |                                    |
| Checks Domain Existence       | If Node                           | Verify company domain existence               | Prepare Final Company Details    | Limit Companies Search           |                                    |
| Limit Companies Search        | Limit Node                       | Limit number of companies processed          | Checks Domain Existence          | Merge, Apollo Get Targeted Personnel |                                    |
| Apollo Get Targeted Personnel | HTTP Request                    | Query Apollo.io for personnel data           | Limit Companies Search           | Sanitising Person Details        |                                    |
| Sanitising Person Details     | Code Node                        | Clean personnel data                          | Apollo Get Targeted Personnel    | Apollo Email Finder, Merge       |                                    |
| Apollo Email Finder           | HTTP Request                    | Find emails via Apollo.io                      | Sanitising Person Details        | Sanitising Email Details         |                                    |
| Sanitising Email Details      | Code Node                        | Clean and structure email data                | Apollo Email Finder              | Merge                           |                                    |
| Merge                        | Merge Node                      | Combine company and person data streams      | Limit Companies Search, Sanitising Email Details, Sanitising Person Details | Structuring Complete Details of Person |                                    |
| Structuring Complete Details of Person | Code Node                | Final lead data structuring                    | Merge                           | Adding Leads to Sheets           |                                    |
| Adding Leads to Sheets        | Google Sheets                   | Insert leads into Google Sheets                | Structuring Complete Details of Person | Fetching Leads Data             |                                    |
| Fetching Leads Data           | Google Sheets                   | Retrieve existing leads for validation         | Adding Leads to Sheets           | Validates Email Id and Email Content |                                    |
| Validates Email Id and Email Content | If Node                   | Validate presence and content of emails       | Fetching Leads Data              | Filter                         |                                    |
| Filter                       | Filter Node                     | Filter leads based on validation               | Validates Email Id and Email Content | Lead Email Generator           |                                    |
| Google Gemini Chat Model      | Langchain Google Gemini LLM      | Generate personalized email content            | Lead Email Generator (ai_languageModel) | Lead Email Generator (ai_languageModel) |                                    |
| Structured Output Parser      | Langchain Output Parser          | Parse AI-generated email into structured data | Google Gemini Chat Model (ai_outputParser) | Lead Email Generator (ai_outputParser) |                                    |
| Lead Email Generator          | Langchain Chain LLM              | Orchestrate AI prompt and response handling    | Filter, Google Gemini Chat Model, Structured Output Parser | Update Sheet with Email          |                                    |
| Update Sheet with Email       | Google Sheets                   | Update Google Sheets with generated email      | Lead Email Generator            |                                  |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: "When clicking ‘Execute workflow’"  
   - Purpose: Start workflow manually.

2. **Add Apify Node to Run LinkedIn Job Scraper**  
   - Name: "Run the LinkedIn Job Scraper"  
   - Connect input from manual trigger.  
   - Configure Apify credentials and specify the LinkedIn job scraper actor.

3. **Add Apify Node to Get Dataset Items**  
   - Name: "Get dataset Items"  
   - Connect input from “Run the LinkedIn Job Scraper”.  
   - Configure to fetch the dataset from scraper run.

4. **Add If Node to Check Company Size < 250**  
   - Name: "Checks Company Size < 250"  
   - Set condition to filter companies with size less than 250.  
   - Connect input from “Get dataset Items”.

5. **Add Remove Duplicates Node**  
   - Name: "Remove Duplicates"  
   - Connect input from “Checks Company Size < 250”.  
   - Configure to remove duplicates based on company identifiers.

6. **Add If Node to Remove HR Related Industry**  
   - Name: "Removes HR Related Industry"  
   - Set condition to filter out companies in HR industry sectors.  
   - Connect input from “Remove Duplicates”.

7. **Add Code Node to Prepare Final Company Details**  
   - Name: "Prepare Final Company Details"  
   - Write JavaScript to format and clean company data for domain validation.  
   - Connect input from “Removes HR Related Industry”.

8. **Add If Node to Check Domain Existence**  
   - Name: "Checks Domain Existence"  
   - Set condition to ensure domain field exists and valid.  
   - Connect input from “Prepare Final Company Details”.

9. **Add Limit Node to Control Number of Companies**  
   - Name: "Limit Companies Search"  
   - Configure maximum number of companies to process (set appropriate limit).  
   - Connect input from “Checks Domain Existence”.

10. **Add HTTP Request Node to Apollo Get Targeted Personnel**  
    - Name: "Apollo Get Targeted Personnel"  
    - Set request method and URL for Apollo.io personnel search API.  
    - Use Apollo.io API credentials.  
    - Connect input from “Limit Companies Search”.

11. **Add Code Node to Sanitize Person Details**  
    - Name: "Sanitising Person Details"  
    - Clean and format Apollo personnel data.  
    - Connect input from “Apollo Get Targeted Personnel”.

12. **Add HTTP Request Node for Apollo Email Finder**  
    - Name: "Apollo Email Finder"  
    - Configure Apollo.io email finder API request using sanitized person data.  
    - Connect input from “Sanitising Person Details”.

13. **Add Code Node to Sanitize Email Details**  
    - Name: "Sanitising Email Details"  
    - Clean and format email data from Apollo.  
    - Connect input from “Apollo Email Finder”.

14. **Add Merge Node to Combine Streams**  
    - Name: "Merge"  
    - Connect inputs from “Limit Companies Search” (company details), “Sanitising Email Details” (email data), and “Sanitising Person Details” (person data).  
    - Set merge mode to combine all inputs.

15. **Add Code Node to Structure Complete Details of Person**  
    - Name: "Structuring Complete Details of Person"  
    - Code to unify company, person, and email data into a single lead record.  
    - Connect input from “Merge”.

16. **Add Google Sheets Node to Add Leads**  
    - Name: "Adding Leads to Sheets"  
    - Configure Google Sheets credentials, target spreadsheet, and worksheet for lead storage.  
    - Connect input from “Structuring Complete Details of Person”.

17. **Add Google Sheets Node to Fetch Leads Data**  
    - Name: "Fetching Leads Data"  
    - Configure to read existing leads for validation.  
    - Connect input from “Adding Leads to Sheets”.

18. **Add If Node to Validate Email ID and Content**  
    - Name: "Validates Email Id and Email Content"  
    - Conditions to ensure email and content exist and are valid.  
    - Connect input from “Fetching Leads Data”.

19. **Add Filter Node**  
    - Name: "Filter"  
    - Further filter leads based on validation results.  
    - Connect input from “Validates Email Id and Email Content”.

20. **Add Langchain Google Gemini Chat Model Node**  
    - Name: "Google Gemini Chat Model"  
    - Configure with Google Cloud API credentials and Gemini model parameters.  
    - Connect input from “Lead Email Generator” node's AI model input.

21. **Add Langchain Structured Output Parser Node**  
    - Name: "Structured Output Parser"  
    - Configure to parse Gemini AI responses into structured JSON.  
    - Connect input from “Google Gemini Chat Model”.

22. **Add Langchain Chain LLM Node**  
    - Name: "Lead Email Generator"  
    - Configure chain to use prompt templates, the Google Gemini Chat Model node, and the Structured Output Parser node.  
    - Connect input from “Filter” and AI nodes.

23. **Add Google Sheets Node to Update Sheet with Email**  
    - Name: "Update Sheet with Email"  
    - Configure to update existing lead rows with generated email content.  
    - Connect input from “Lead Email Generator”.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                               |
|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| Workflow integrates Apify for scraping LinkedIn jobs, Apollo.io for personnel data, and Google Gemini for AI email generation. | Overall workflow architecture                                               |
| Google Sheets is used both as a data source and target for lead storage and updates.          | Data storage and persistence                                                 |
| Google Gemini LLM integration requires Google Cloud credentials with access to Gemini API.    | AI integration details                                                       |
| Apollo.io API credentials must be configured securely; rate limits and API quotas should be monitored. | Third-party API integration and potential failure points                     |
| Apify actor configuration must point to a LinkedIn job scraper actor; ensure it is operational and authorized. | Apify integration specifics                                                  |
| Code nodes contain JavaScript for data formatting and sanitization; verify exceptions and data shape to avoid workflow crashes. | Custom scripting details                                                     |

---

**Disclaimer:** The provided text originates exclusively from an n8n automated workflow. All data processed is legal and public, with strict adherence to content policies. This documentation excludes any illegal, offensive, or protected elements.