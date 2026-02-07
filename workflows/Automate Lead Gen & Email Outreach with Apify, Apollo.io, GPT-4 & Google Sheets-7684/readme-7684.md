Automate Lead Gen & Email Outreach with Apify, Apollo.io, GPT-4 & Google Sheets

https://n8nworkflows.xyz/workflows/automate-lead-gen---email-outreach-with-apify--apollo-io--gpt-4---google-sheets-7684


# Automate Lead Gen & Email Outreach with Apify, Apollo.io, GPT-4 & Google Sheets

### 1. Workflow Overview

This workflow automates lead generation and email outreach by integrating multiple services and data sources. It begins with data extraction from a web actor (Apify) that collects company data, enriches this data via Apollo.io's APIs to retrieve detailed company and user information, and processes the combined data further with OpenAI's GPT-4 for message generation. The enriched data and outreach messages are then logged and updated in Google Sheets, providing a centralized and continuously updated lead management system.

Logical blocks:

- **1.1 Input Reception and Data Extraction:** Triggering the workflow manually and running an Apify actor to scrape company data.
- **1.2 Data Retrieval & Enrichment:** Fetching dataset items from Apify, then retrieving company and user details via Apollo.io APIs.
- **1.3 Data Processing & Merging:** Combining datasets and running custom code to prepare data for outreach.
- **1.4 Email Retrieval & Message Generation:** Extracting emails, generating personalized outreach messages using GPT-4.
- **1.5 Google Sheets Interaction:** Reading from and updating Google Sheets to track outreach progress and store enriched data.
- **1.6 Conditional Logic & Finalization:** Deciding whether to send messages or skip, updating records accordingly.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Data Extraction

**Overview:**  
Starts the workflow on-demand and triggers an Apify actor to scrape CB funded companies data.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Run an Actor

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Initiates the workflow manually.  
  - Configuration: Default; no parameters required.  
  - Inputs: None (starting node).  
  - Outputs: Connected to "Run an Actor".  
  - Edge cases: None typical; workflow won't start without manual trigger.

- **Run an Actor**  
  - Type: Apify Node  
  - Role: Executes an Apify actor to scrape company data from Crunchbase or similar sources.  
  - Configuration: Uses saved Apify credentials and specifies the actor to run (not explicitly detailed here).  
  - Inputs: Triggered from manual node.  
  - Outputs: Sends data to "Get dataset items".  
  - Edge cases: Actor run failures, API limits, timeout, or invalid actor configuration.

---

#### 1.2 Data Retrieval & Enrichment

**Overview:**  
Fetches raw data from Apify dataset and enriches company data with Apollo.io details, including company info and user contacts.

**Nodes Involved:**  
- Get dataset items  
- Apollo - Get Company Details  
- Apollo - Get User  
- Split Out  
- Merge

**Node Details:**

- **Get dataset items**  
  - Type: Apify Node  
  - Role: Retrieves the scraped company data from the Apify dataset.  
  - Configuration: Points to dataset created by the actor.  
  - Input: From "Run an Actor".  
  - Output: To "Apollo - Get Company Details".  
  - Edge cases: Dataset empty or unavailable, API errors.

- **Apollo - Get Company Details**  
  - Type: HTTP Request  
  - Role: Calls Apollo.io API to get detailed company information based on dataset input.  
  - Configuration: Uses Apollo API credentials, likely queries company by domain or name.  
  - Input: From "Get dataset items".  
  - Output: To "Apollo - Get User".  
  - Edge cases: API authentication failure, rate limits, invalid query parameters.

- **Apollo - Get User**  
  - Type: HTTP Request  
  - Role: Retrieves user/contact information associated with the company.  
  - Configuration: Uses Apollo API credentials, queries user data by company ID or similar.  
  - Input: From "Apollo - Get Company Details".  
  - Output: To "Split Out" and "Merge".  
  - Edge cases: No users found, API errors, data format issues.

- **Split Out**  
  - Type: Split Out  
  - Role: Separates data into individual items for processing.  
  - Configuration: Default splitting of array items.  
  - Input: From "Apollo - Get User".  
  - Output: To "Get Email".  
  - Edge cases: Empty arrays, splitting errors.

- **Merge**  
  - Type: Merge  
  - Role: Combines multiple data streams into one.  
  - Configuration: Likely configured to merge data from different sources keeping keys aligned.  
  - Input: Merges data from "Apollo - Get User" and "Get Email".  
  - Output: To "Code1".  
  - Edge cases: Mismatched keys, empty inputs.

---

#### 1.3 Data Processing & Merging

**Overview:**  
Runs code nodes to manipulate, filter, or enrich data before updating Google Sheets or sending outreach messages.

**Nodes Involved:**  
- Code1  
- Code  
- Append or update row in sheet

**Node Details:**

- **Code1**  
  - Type: Code (JavaScript)  
  - Role: Likely processes merged data, formats it, or prepares it for further API calls or sheet insertion.  
  - Configuration: Custom JavaScript (not fully described).  
  - Input: From "Merge".  
  - Output: To "Code".  
  - Edge cases: Code runtime errors, unexpected data structure.

- **Code**  
  - Type: Code (JavaScript)  
  - Role: Additional data processing or formatting before data insertion into Google Sheets.  
  - Configuration: Custom script.  
  - Input: From "Code1".  
  - Output: To "Append or update row in sheet".  
  - Edge cases: Code errors, invalid data.

- **Append or update row in sheet**  
  - Type: Google Sheets  
  - Role: Adds new rows or updates existing rows with enriched company and user data.  
  - Configuration: Uses Google Sheets credentials, targets specific spreadsheet and sheet.  
  - Input: From "Code".  
  - Output: To "Get row(s) in sheet".  
  - Edge cases: Google API limits, credential errors, sheet not found.

---

#### 1.4 Email Retrieval & Message Generation

**Overview:**  
Extracts email addresses, generates personalized outreach messages using GPT-4, and updates Google Sheets with messages.

**Nodes Involved:**  
- Get Email  
- Message a model  
- Update row in sheet

**Node Details:**

- **Get Email**  
  - Type: HTTP Request  
  - Role: Obtains email address data likely from Apollo or another service.  
  - Configuration: Configured with API credentials, queries based on user/company data.  
  - Input: From "Split Out".  
  - Output: To "Merge".  
  - Edge cases: Missing email, API errors.

- **Message a model**  
  - Type: OpenAI (LangChain)  
  - Role: Sends input data to GPT-4 to generate personalized outreach messages.  
  - Configuration: Uses OpenAI GPT-4 credentials, prompt templates likely include company/user data.  
  - Input: From "If" node (conditional pass).  
  - Output: To "Update row in sheet".  
  - Edge cases: API rate limits, prompt errors, no response.

- **Update row in sheet**  
  - Type: Google Sheets  
  - Role: Updates existing spreadsheet rows with generated outreach messages or status.  
  - Configuration: Uses Google Sheets credentials, targets specific rows.  
  - Input: From "Message a model".  
  - Output: None (end node).  
  - Edge cases: Sheet lock, update conflicts.

---

#### 1.5 Google Sheets Interaction

**Overview:**  
Reads existing rows to check for duplicates or prior outreach and controls workflow branching based on sheet data.

**Nodes Involved:**  
- Get row(s) in sheet  
- If  
- No Operation, do nothing

**Node Details:**

- **Get row(s) in sheet**  
  - Type: Google Sheets  
  - Role: Retrieves existing rows to check if a company/user already exists or if outreach was done.  
  - Configuration: Uses Google credentials; filters and reads rows.  
  - Input: From "Append or update row in sheet".  
  - Output: To "If".  
  - Edge cases: Empty result set, sheet access errors.

- **If**  
  - Type: Conditional  
  - Role: Decides whether to proceed with message generation or skip based on sheet data presence/criteria.  
  - Configuration: Condition likely checks if row exists or status flags.  
  - Input: From "Get row(s) in sheet".  
  - Output: True branch to "Message a model", false branch to "No Operation, do nothing".  
  - Edge cases: Condition misconfiguration, empty input.

- **No Operation, do nothing**  
  - Type: NoOp  
  - Role: Placeholder node for skipping message generation.  
  - Configuration: Default.  
  - Input: From "If" (false branch).  
  - Output: None.  
  - Edge cases: None.

---

### 3. Summary Table

| Node Name                  | Node Type                    | Functional Role                               | Input Node(s)                   | Output Node(s)                     | Sticky Note                        |
|----------------------------|------------------------------|-----------------------------------------------|---------------------------------|-----------------------------------|----------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger               | Starts workflow manually                       | None                            | Run an Actor                      |                                  |
| Run an Actor               | Apify Node                   | Runs Apify actor to scrape company data       | When clicking ‘Execute workflow’ | Get dataset items                 |                                  |
| Get dataset items          | Apify Node                   | Retrieves scraped data from Apify              | Run an Actor                   | Apollo - Get Company Details      |                                  |
| Apollo - Get Company Details| HTTP Request                | Retrieves detailed company info from Apollo.io| Get dataset items              | Apollo - Get User                 |                                  |
| Apollo - Get User          | HTTP Request                 | Retrieves user/contact info from Apollo.io     | Apollo - Get Company Details   | Split Out, Merge                 |                                  |
| Split Out                 | Split Out                    | Splits user data array for processing          | Apollo - Get User              | Get Email                       |                                  |
| Get Email                 | HTTP Request                 | Retrieves email addresses                       | Split Out                     | Merge                          |                                  |
| Merge                     | Merge                        | Combines user and email data                    | Apollo - Get User, Get Email   | Code1                          |                                  |
| Code1                     | Code                         | Processes merged data                           | Merge                         | Code                           |                                  |
| Code                      | Code                         | Further data formatting                         | Code1                         | Append or update row in sheet  |                                  |
| Append or update row in sheet | Google Sheets              | Adds or updates rows in Google Sheets          | Code                          | Get row(s) in sheet            |                                  |
| Get row(s) in sheet       | Google Sheets                | Reads existing sheet rows                        | Append or update row in sheet  | If                            |                                  |
| If                        | Conditional                  | Decides to send message or skip                 | Get row(s) in sheet            | Message a model, No Operation, do nothing |                                  |
| Message a model           | OpenAI (LangChain)           | Generates outreach message with GPT-4           | If (true branch)               | Update row in sheet            |                                  |
| Update row in sheet       | Google Sheets                | Updates sheet with generated message            | Message a model                | None                          |                                  |
| No Operation, do nothing  | NoOp                        | Skips message generation                         | If (false branch)              | None                          |                                  |
| Sticky Note               | Sticky Note                  | Comments and annotations                         | None                          | None                          | (Various, no content in this JSON) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node** named “When clicking ‘Execute workflow’” with default settings.

2. **Add Apify Node** “Run an Actor”:  
   - Configure with your Apify credentials.  
   - Select the appropriate actor that scrapes Crunchbase or target data.  
   - Connect from manual trigger.

3. **Add Apify Node** “Get dataset items”:  
   - Configure to fetch dataset from the actor run in step 2.  
   - Connect from “Run an Actor”.

4. **Add HTTP Request Node** “Apollo - Get Company Details”:  
   - Configure with Apollo.io API credentials (API key).  
   - Set method and endpoint to get company details by domain or name from dataset items.  
   - Connect from “Get dataset items”.

5. **Add HTTP Request Node** “Apollo - Get User”:  
   - Configure with Apollo.io API credentials.  
   - Set method and endpoint to fetch user/contact info for the company from previous node.  
   - Connect from “Apollo - Get Company Details”.

6. **Add Split Out Node** “Split Out”:  
   - Configure to split user/contact array into individual items.  
   - Connect from “Apollo - Get User”.

7. **Add HTTP Request Node** “Get Email”:  
   - Configure to retrieve email address for each user, possibly Apollo or another source.  
   - Connect from “Split Out”.

8. **Add Merge Node** “Merge”:  
   - Configure to merge user data and email data streams, preserving keys.  
   - Connect inputs from “Apollo - Get User” and “Get Email”.

9. **Add Code Node** “Code1”:  
   - Insert JavaScript to process merged data (e.g., filtering, formatting).  
   - Connect from “Merge”.

10. **Add Code Node** “Code”:  
    - Additional JavaScript to prepare data for Google Sheets insertion.  
    - Connect from “Code1”.

11. **Add Google Sheets Node** “Append or update row in sheet”:  
    - Configure with Google OAuth2 credentials.  
    - Set target spreadsheet and sheet for lead data.  
    - Enable append or update logic based on unique keys.  
    - Connect from “Code”.

12. **Add Google Sheets Node** “Get row(s) in sheet”:  
    - Configure to read rows to check existing leads or outreach status.  
    - Connect from “Append or update row in sheet”.

13. **Add If Node** “If”:  
    - Configure condition to check if lead already exists or outreach was sent (e.g., check specific columns).  
    - Connect from “Get row(s) in sheet”.

14. **Add OpenAI Node** “Message a model”:  
    - Configure with OpenAI GPT-4 credentials.  
    - Set prompt template to generate personalized outreach based on company/user data.  
    - Connect from “If” true output.

15. **Add Google Sheets Node** “Update row in sheet”:  
    - Configure to update the row with the generated message and status.  
    - Connect from “Message a model”.

16. **Add No Operation Node** “No Operation, do nothing”:  
    - Default no-op node to handle the false branch of “If”.  
    - Connect from “If” false output.

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                                   |
|------------------------------------------------------------------------------|--------------------------------------------------|
| This workflow integrates Apify, Apollo.io, OpenAI GPT-4, and Google Sheets for automated lead enrichment and outreach. | Workflow title and description                    |
| Requires valid API credentials for Apify, Apollo.io, Google Sheets, and OpenAI GPT-4. | Credential setup                                  |
| The OpenAI node utilizes LangChain wrapper for GPT-4 message generation.     | Node detail                                       |
| Google Sheets nodes require OAuth2 credentials with read/write access.       | Credential setup                                  |
| Apify actor and dataset IDs must be configured according to the specific data source and scraping needs. | Apify configuration                               |
| Rate limits and API quota management should be considered for Apollo and OpenAI APIs. | Integration considerations                         |

---

*Disclaimer:* The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.