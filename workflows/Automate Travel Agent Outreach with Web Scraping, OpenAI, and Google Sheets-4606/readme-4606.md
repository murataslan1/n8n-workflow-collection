Automate Travel Agent Outreach with Web Scraping, OpenAI, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-travel-agent-outreach-with-web-scraping--openai--and-google-sheets-4606


# Automate Travel Agent Outreach with Web Scraping, OpenAI, and Google Sheets

---

## 1. Workflow Overview

This workflow automates outreach to travel agents by scraping travel agent data from a specified website, standardizing and storing that data in Google Sheets, and sending personalized survey invitation emails. It is designed for use cases where travel industry professionals seek to collect survey responses from travel agents efficiently, leveraging web scraping, AI-based data processing, and email automation.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Manual trigger to start the workflow.
- **1.2 Web Scraping & Data Extraction**: Scrape travel agent listings from a travel website and standardize the extracted data using OpenAI.
- **1.3 Data Storage**: Append standardized travel agent data to a Google Sheets spreadsheet.
- **1.4 Data Retrieval & Email Personalization**: Retrieve stored records; for each travel agent, generate personalized email content using OpenAI.
- **1.5 Data Update & Email Sending**: Update Google Sheets with generated email content and send personalized emails to agents.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception

- **Overview**: Initiates the workflow manually to begin the scraping and outreach process.
- **Nodes Involved**:  
  - `When clicking ‘Test workflow’`
  - `Google Sheet Data Store`
  - `Sticky Note1` (comment)
  
- **Node Details**:

  - **When clicking ‘Test workflow’**
    - Type: Manual Trigger
    - Role: Entry point to manually start the workflow.
    - Configuration: Default, no parameters.
    - Input: None
    - Output: Initiates next node `Google Sheet Data Store`.
    - Edge Cases: None typical; user must manually trigger.
  
  - **Google Sheet Data Store**
    - Type: Google Sheets (Read)
    - Role: Retrieve existing travel agent records from the spreadsheet to process for email outreach.
    - Configuration: Reads from spreadsheet "Travel Agents List", sheet "TestTravelAgents".
    - Inputs: Trigger from manual node
    - Outputs: Data for email personalization (feeds `OpenAI1 Mail Composer`)
    - Credentials: Google Sheets OAuth2 API (configured)
    - Edge Cases: Sheet access failures, auth problems, empty data.
  
  - **Sticky Note1**
    - Content: Explains this block reads stored records and sends survey emails.
    - Role: Documentation only.

---

### 2.2 Web Scraping & Data Extraction

- **Overview**: Scrapes travel agent information from a specified travel trade website, then processes the scraped markdown data using OpenAI to extract and standardize relevant fields.
- **Nodes Involved**:  
  - `HTTP Scrape Website`
  - `OpenAI Standardise Data`
  - `Split Out`
  - `Google Sheet - Data Store`
  - `Sticky Note`
  
- **Node Details**:

  - **HTTP Scrape Website**
    - Type: HTTP Request
    - Role: Scrape the travel agent webpage via an API providing markdown format data.
    - Configuration:
      - POST to `https://api.firecrawl.dev/v1/scrape`
      - JSON body specifies target URL: `"https://www.japan.travel/en/my/travel-trade/my-travel-agencies-list/"`
      - Request header includes `Content-Type: application/json`.
      - Authentication: HTTP Header Auth (custom header credential configured).
    - Inputs: Triggered upstream (none in this workflow, but logically from manual trigger)
    - Outputs: Markdown content with travel agent listings.
    - Edge Cases: Request timeout, invalid response, auth failure.
  
  - **OpenAI Standardise Data**
    - Type: OpenAI Node (Langchain)
    - Role: Parse the scraped markdown to extract structured travel agent data.
    - Configuration:
      - Model: `gpt-4.1-mini-2025-04-14`
      - System prompt instructs to extract specific fields (Agent name, Summary, Email, Telephone, Website, Country, City) and respond in JSON.
      - Input: Markdown from previous node.
      - Output: JSON structured travel agent records.
    - Inputs: Markdown from HTTP scrape.
    - Outputs: JSON records to be split.
    - Credentials: OpenAI API (configured).
    - Edge Cases: Parsing errors, incomplete data, token limits, rate limits.
  
  - **Split Out**
    - Type: Split Out
    - Role: Splits the array of travel agent JSON objects into individual items for processing.
    - Configuration:
      - Field to split: `message.content["Travel Agents"]`
    - Inputs: JSON array from OpenAI Standardise Data.
    - Outputs: Individual travel agent JSON objects.
    - Edge Cases: Empty or malformed JSON input.

  - **Google Sheet - Data Store**
    - Type: Google Sheets (Append)
    - Role: Append each standardized travel agent record into the "ScrapedList" sheet for storage.
    - Configuration:
      - Target spreadsheet: "Travel Agents List"
      - Sheet: "ScrapedList"
      - Columns: Maps all extracted fields plus default statuses such as "Status" = "InProgress", "Mail Sent" = "ToDo", "Survey Received" and "Response Received" = "Pending".
    - Inputs: Individual parsed agent records.
    - Outputs: Stored data confirmation.
    - Credentials: Google Sheets OAuth2 API.
    - Edge Cases: Write failures, auth errors, duplicate entries.

  - **Sticky Note**
    - Content: Describes this block’s purpose: scraping travel agent websites with standardized output.
    - Role: Documentation only.

---

### 2.3 Data Retrieval & Email Personalization

- **Overview**: Reads stored travel agent records from the spreadsheet and uses OpenAI to generate personalized email components for each agent, encouraging participation in a survey.
- **Nodes Involved**:  
  - `Google Sheet Data Store` (already described in 2.1)
  - `OpenAI1 Mail Composer`
  
- **Node Details**:

  - **OpenAI1 Mail Composer**
    - Type: OpenAI Node (Langchain)
    - Role: Generate personalized email content including Subject, Icebreaker, AI Agent description, Call to Action, and PS based on travel agent data.
    - Configuration:
      - Model: `gpt-4o`
      - System prompt: Long, detailed instructions and email template focused on travel domain and survey encouragement.
      - Input: Travel agent fields such as Agent Name, Email Address, Summary, Website.
      - Output: JSON with personalized email sections.
    - Inputs: Data from Google Sheet Data Store.
    - Outputs: JSON email content to update sheet and send email.
    - Credentials: OpenAI API.
    - Edge Cases: Generation failures, unexpected JSON format, rate limits.

---

### 2.4 Data Update & Email Sending

- **Overview**: Updates the Google Sheet with the generated email content and sends personalized emails to each travel agent.
- **Nodes Involved**:  
  - `Google Sheet Update Records`
  - `Send Email`
  
- **Node Details**:

  - **Google Sheet Update Records**
    - Type: Google Sheets (Update)
    - Role: Updates existing travel agent records with the generated email content and changes mail status.
    - Configuration:
      - Sheet: "TestTravelAgents"
      - Matching column: "Email Address" to find the correct row.
      - Updates fields such as Subject, Icebreaker, Call to Action, PS, AI Agent description, and status fields ("Mail Sent" set to "Sent").
    - Inputs: Email content from OpenAI1 Mail Composer and agent data from Google Sheet.
    - Outputs: Confirmation of updated rows.
    - Credentials: Google Sheets OAuth2 API.
    - Edge Cases: Mismatched rows, update conflicts, auth failures.

  - **Send Email**
    - Type: Email Send (SMTP)
    - Role: Sends the personalized email to each travel agent.
    - Configuration:
      - To: Agent's Email Address
      - From: contact@mohangopal.com
      - CC: mohan.gopal001@gmail.com
      - Subject: Personalized subject from OpenAI output
      - Body: Text format with multiple personalized sections (Icebreaker, AI Agent info, Call to Action, PS)
      - Credentials: SMTP account configured.
    - Inputs: Updated record with email content.
    - Outputs: Email sent confirmation.
    - Edge Cases: SMTP failures, invalid emails, email rejections.

---

## 3. Summary Table

| Node Name               | Node Type                  | Functional Role                        | Input Node(s)                 | Output Node(s)             | Sticky Note                                                                                                          |
|-------------------------|----------------------------|-------------------------------------|------------------------------|----------------------------|----------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger            | Start workflow manually              | None                         | Google Sheet Data Store     |                                                                                                                      |
| Google Sheet Data Store  | Google Sheets (Read)        | Retrieve stored travel agent records | When clicking ‘Test workflow’| OpenAI1 Mail Composer       | ## Read Scrapped and Stored Records in SpreadSheet and Send Survey Email \n** Simple Read and Compose Personalised email and send...** |
| OpenAI Standardise Data  | OpenAI (Langchain)          | Standardize scraped markdown data    | HTTP Scrape Website           | Split Out                  |                                                                                                                      |
| Split Out               | Split Out                   | Split array of travel agents         | OpenAI Standardise Data       | Google Sheet - Data Store   |                                                                                                                      |
| Google Sheet - Data Store| Google Sheets (Append)      | Store standardized travel agent data | Split Out                    |                            | ## This is workflow of scrapping list of travel agents website...\n\n**use this for scrapping different sites that has information in standard format information information** |
| HTTP Scrape Website      | HTTP Request                | Scrape travel agent website          |                              | OpenAI Standardise Data     |                                                                                                                      |
| OpenAI1 Mail Composer    | OpenAI (Langchain)          | Generate personalized email content  | Google Sheet Data Store       | Google Sheet Update Records |                                                                                                                      |
| Google Sheet Update Records | Google Sheets (Update)    | Update records with email content    | OpenAI1 Mail Composer         | Send Email                 |                                                                                                                      |
| Send Email               | Email Send (SMTP)           | Send personalized survey emails      | Google Sheet Update Records   |                            |                                                                                                                      |
| Sticky Note              | Sticky Note                 | Documentation                       |                              |                            | ## This is workflow of scrapping list of travel agents website...\n\n**use this for scrapping different sites that has information in standard format information information** |
| Sticky Note1             | Sticky Note                 | Documentation                       |                              |                            | ## Read Scrapped and Stored Records in SpreadSheet and Send Survey Email \n** Simple Read and Compose Personalised email and send...** |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Name: `When clicking ‘Test workflow’`
   - Type: Manual Trigger
   - No parameters.
   
2. **Create HTTP Request Node to Scrape Website**
   - Name: `HTTP Scrape Website`
   - Type: HTTP Request
   - Method: POST
   - URL: `https://api.firecrawl.dev/v1/scrape`
   - Body Content (JSON):
     ```json
     {
       "url": "https://www.japan.travel/en/my/travel-trade/my-travel-agencies-list/",
       "formats": ["markdown"]
     }
     ```
   - Content-Type header: `application/json`
   - Authentication: HTTP Header Auth Credential (set with API key or token)
   
3. **Create OpenAI Node to Standardize Data**
   - Name: `OpenAI Standardise Data`
   - Type: OpenAI (Langchain)
   - Model: `gpt-4.1-mini-2025-04-14`
   - System Prompt: Instruct to extract travel agent info from markdown into JSON with fields: Agent Name, Summary, Email Address, Telephone, Website, Country, City.
   - Input: Pass the markdown scraped data.
   - Credentials: OpenAI API
   
4. **Create Split Out Node**
   - Name: `Split Out`
   - Type: Split Out
   - Field to split: `message.content["Travel Agents"]`
   - Input: Output from OpenAI Standardise Data
   
5. **Create Google Sheets Append Node**
   - Name: `Google Sheet - Data Store`
   - Type: Google Sheets (Append)
   - Spreadsheet: Select or specify spreadsheet ID for "Travel Agents List"
   - Sheet Name: "ScrapedList"
   - Map columns including Travel Agent Name, Summary, Email Address, Telephone, Website, Country, City
   - Set default columns: Status="InProgress", Mail Sent="ToDo", Survey Received="Pending", Response Received="Pending"
   - Credentials: Google Sheets OAuth2 API
   - Input: Individual entries from Split Out node
   
6. **Connect Nodes for Scrape & Store Flow**
   - Connect `HTTP Scrape Website` → `OpenAI Standardise Data` → `Split Out` → `Google Sheet - Data Store`
   
7. **Create Google Sheets Read Node**
   - Name: `Google Sheet Data Store`
   - Type: Google Sheets (Read)
   - Spreadsheet: Same as above
   - Sheet Name: "TestTravelAgents"
   - Credentials: Google Sheets OAuth2 API
   
8. **Create OpenAI Node for Email Generation**
   - Name: `OpenAI1 Mail Composer`
   - Type: OpenAI (Langchain)
   - Model: `gpt-4o`
   - System Prompt: Personalized email generation using travel agent details, return JSON with Subject line, Icebreaker, AI Agent in Travel Business, Call to Action, PS.
   - Input: Agent data from Google Sheets read node.
   - Credentials: OpenAI API
   
9. **Create Google Sheets Update Node**
   - Name: `Google Sheet Update Records`
   - Type: Google Sheets (Update)
   - Spreadsheet: Same as above
   - Sheet Name: "TestTravelAgents"
   - Match column: "Email Address"
   - Update columns with generated email content fields and status ("Mail Sent" = "Sent", "Status" = "In-Progress")
   - Credentials: Google Sheets OAuth2 API
   
10. **Create Email Send Node**
    - Name: `Send Email`
    - Type: Email Send (SMTP)
    - From Email: `contact@mohangopal.com`
    - To Email: from data field `Email Address`
    - CC Email: `mohan.gopal001@gmail.com`
    - Subject: from OpenAI generated `Subject`
    - Email Body: text format with placeholders for Icebreaker, AI Agent info, Call to Action, PS from OpenAI output
    - Credentials: SMTP credentials configured with valid account
    
11. **Connect Nodes for Email Flow**
    - Connect `When clicking ‘Test workflow’` → `Google Sheet Data Store` → `OpenAI1 Mail Composer` → `Google Sheet Update Records` → `Send Email`
    
12. **Final Connections**
    - Connect the scrape and store flow to be triggered manually or scheduled as needed.
    - Ensure error handling is setup as per n8n best practices for API rate limits, email errors, and spreadsheet access.
    
---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Context or Link                                                                                       |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow scrapes a list of travel agents from the Japan National Tourism Organization website and automates survey email outreach with personalized AI-generated content. It is adaptable for scraping other sites with standardized listing formats.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Sticky Note attached to scraping and storing nodes                                                  |
| The email personalization leverages GPT-4 with specific prompts to generate semi-formal conversational emails tailored to travel agents, encouraging survey participation with confidentiality and incentives.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | OpenAI1 Mail Composer node description                                                             |
| Google Sheets is used for both staging (ScrapedList) and the outreach list (TestTravelAgents), enabling tracking the mail status and survey responses.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Throughout workflow                                                                                 |
| SMTP credentials need to be valid and allow sending emails from the specified "from" address to avoid deliverability issues.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Send Email node                                                                                     |
| The scraping API used (Firecrawl) requires HTTP header authentication and returns markdown which is then parsed by OpenAI. Ensure quota and API limits are managed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | HTTP Scrape Website node                                                                             |
| The workflow assumes the spreadsheet column schema matches the mapped fields exactly for updates and appends. Schema changes require updating node mappings accordingly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Google Sheets nodes                                                                                 |
| Rate limits and token limits for OpenAI calls should be monitored; consider batching or throttling large records.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | OpenAI nodes                                                                                        |

---

# Disclaimer

The provided text is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.

---