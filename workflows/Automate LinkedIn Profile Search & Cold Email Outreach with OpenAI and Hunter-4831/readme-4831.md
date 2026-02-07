Automate LinkedIn Profile Search & Cold Email Outreach with OpenAI and Hunter

https://n8nworkflows.xyz/workflows/automate-linkedin-profile-search---cold-email-outreach-with-openai-and-hunter-4831


# Automate LinkedIn Profile Search & Cold Email Outreach with OpenAI and Hunter

### 1. Workflow Overview

This workflow, named **LinkGPT**, automates the process of searching LinkedIn profiles and executing cold email outreach by integrating OpenAI’s language models and Hunter.io’s email finder service. It targets sales, recruitment, or marketing professionals who want to efficiently generate targeted contact lists and initiate outreach campaigns without manual data gathering.

The workflow logically divides into the following blocks:

- **1.1 Input Reception:** Triggered by a chat message via Langchain’s chat trigger node.
- **1.2 Boolean Search String Generation:** Uses OpenAI to create a Google Boolean search string tailored to the input.
- **1.3 Google Search & Data Extraction:** Executes Google searches, extracts LinkedIn URLs and workplace contexts, and manages pagination.
- **1.4 Contact Details Extraction:** Further refines extracted data to identify first name, last name, and domain name.
- **1.5 Email Discovery via Hunter:** Uses Hunter.io to find email addresses based on extracted data.
- **1.6 Google Sheets Management:** Creates a new Google Sheet, sets headers, and appends results progressively.
- **1.7 Control Flow & Looping:** Manages search pagination and loops until desired results are reached or stops.
- **1.8 Wait Mechanism:** Inserts delay between search iterations to comply with rate limits or avoid IP blocking.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for a chat message input to initiate the workflow.
- **Nodes Involved:** `When chat message received`
- **Node Details:**
  - **Type:** Langchain Chat Trigger node
  - **Role:** Entry point; receives the user's query or search parameters.
  - **Configuration:** Default chat trigger listening on webhook, no parameters.
  - **Connections:** Outputs to `Generate a Boolean Search String`.
  - **Edge Cases:** Missing or malformed chat messages; trigger webhook failures.
  - **Version:** 1.1

#### 2.2 Boolean Search String Generation

- **Overview:** Uses OpenAI to generate a tailored Google Boolean search string from the input.
- **Nodes Involved:** `Generate a Boolean Search String`
- **Node Details:**
  - **Type:** OpenAI node via Langchain integration
  - **Role:** Transforms chat input into a complex Google Boolean query.
  - **Configuration:** Uses prompt templates with dynamic inputs from the chat trigger.
  - **Input:** From `When chat message received`.
  - **Output:** Boolean search string to `Create a new sheet`.
  - **Edge Cases:** OpenAI API timeouts, prompt failures, or rate limits.
  - **Version:** 1.8

#### 2.3 Google Sheets Setup

- **Overview:** Creates a new Google Sheet for storing results and sets up column headers.
- **Nodes Involved:** `Create a new sheet`, `Columns to add: linkedin_url, first_name, last_name, email, context, domain`, `Add columns to new sheet`
- **Node Details:**

  - **Create a new sheet**
    - Type: Google Sheets node
    - Role: Creates a fresh Google Sheet document.
    - Input: From `Generate a Boolean Search String`.
    - Output: Sheet ID to next node.
    - Edge Cases: Authentication errors, quota limits.
    - Version: 4.5

  - **Columns to add: linkedin_url, first_name, last_name, email, context, domain**
    - Type: Code node (JavaScript)
    - Role: Defines columns headers as code output.
    - Input: From `Create a new sheet`.
    - Output: Column headers to `Add columns to new sheet`.
    - Edge Cases: Script errors or unexpected sheet structure.
    - Version: 2

  - **Add columns to new sheet**
    - Type: Google Sheets node
    - Role: Writes the column headers to the newly created sheet.
    - Input: From `Columns to add`.
    - Output: Passes control to `set page number for google search`.
    - Edge Cases: Write permission errors.
    - Version: 4.5

#### 2.4 Pagination Setup for Google Search

- **Overview:** Manages the pagination index to control Google search result pages.
- **Nodes Involved:** `set page number for google search`, `Adds 10 to start - Go to next page`
- **Node Details:**

  - **set page number for google search**
    - Type: Code node
    - Role: Initializes or updates the start index for Google search pagination.
    - Input: From `Add columns to new sheet`.
    - Output: To `If desired results not reached`.
    - Edge Cases: Incorrect start index calculation.
    - Version: 2

  - **Adds 10 to start - Go to next page**
    - Type: Code node
    - Role: Increments the pagination start index by 10 for next Google search page.
    - Input: From `Appends the results to the sheet`.
    - Output: Loops back to `If desired results not reached`.
    - Edge Cases: Infinite loops if exit condition fails.
    - Version: 2

#### 2.5 Google Search Execution and Extraction

- **Overview:** Performs Google search using the Boolean string and extracts LinkedIn URLs and workplace context.
- **Nodes Involved:** `Google Boolean Search`, `Extracts all linkedin urls and workplace context from the google http response`
- **Node Details:**

  - **Google Boolean Search**
    - Type: HTTP Request node
    - Role: Sends Google search requests with constructed Boolean query and pagination.
    - Input: From `Wait` node (which feeds from `If desired results not reached`).
    - Output: Raw HTML response to extraction code node.
    - Edge Cases: HTTP errors, captcha, rate-limiting by Google.
    - Version: 4.2

  - **Extracts all linkedin urls and workplace context from the google http response**
    - Type: Code node
    - Role: Parses Google search HTML to extract LinkedIn profile URLs and contextual info.
    - Input: From `Google Boolean Search`.
    - Output: To `Extract Contact Details`.
    - Edge Cases: Parsing failures due to changes in Google HTML structure.
    - Version: 2

#### 2.6 Contact Details Extraction

- **Overview:** Extracts first name, last name, and domain name from LinkedIn URLs and context.
- **Nodes Involved:** `Extract Contact Details`, `Extracts fname, lname, domainname`
- **Node Details:**

  - **Extract Contact Details**
    - Type: OpenAI node (Langchain)
    - Role: Uses AI to parse and extract structured contact details from unstructured data.
    - Input: From `Extracts all linkedin urls and workplace context from the google http response`.
    - Output: To `Extracts fname, lname, domainname`.
    - Edge Cases: AI misinterpretation, API rate limits.
    - Version: 1.8

  - **Extracts fname, lname, domainname**
    - Type: Code node
    - Role: Further processes AI output to isolate first name, last name, and domain name.
    - Input: From `Extract Contact Details`.
    - Output: To `Hunter`.
    - Edge Cases: Parsing errors.
    - Version: 2

#### 2.7 Email Discovery via Hunter.io

- **Overview:** Finds emails associated with extracted names and domains.
- **Nodes Involved:** `Hunter`
- **Node Details:**
  - **Type:** Hunter node (Hunter.io integration)
  - **Role:** Queries Hunter.io API to find professional email addresses.
  - **Input:** From `Extracts fname, lname, domainname`.
  - **Output:** To `Appends the results to the sheet`.
  - **Configuration:** Uses configured Hunter.io API credentials.
  - **Edge Cases:** API limits, missing emails, invalid domains.
  - **Version:** 1

#### 2.8 Results Appending & Loop Control

- **Overview:** Writes collected data into Google Sheets and controls iterative search paging.
- **Nodes Involved:** `Appends the results to the sheet`, `If desired results not reached`, `Wait`
- **Node Details:**

  - **Appends the results to the sheet**
    - Type: Google Sheets node
    - Role: Appends extracted contact records to the existing sheet.
    - Input: From `Hunter`.
    - Output: To `Adds 10 to start - Go to next page`.
    - Edge Cases: Sheet write permissions, quota exhaustion.
    - Version: 4.5

  - **If desired results not reached**
    - Type: If node
    - Role: Checks if the number of results meets a predefined threshold; decides to continue or stop.
    - Input: From `set page number for google search` and `Adds 10 to start - Go to next page`.
    - Output: Loops to `Wait` to delay before next search iteration or terminates.
    - Edge Cases: Incorrect result counting, infinite loops.
    - Version: 2.2

  - **Wait**
    - Type: Wait node
    - Role: Introduces delay between search requests to avoid rate limiting.
    - Input: From `If desired results not reached`.
    - Output: To `Google Boolean Search`.
    - Edge Cases: Delay too short causing blocking, or too long causing inefficiency.
    - Version: 1.1

---

### 3. Summary Table

| Node Name                                            | Node Type                  | Functional Role                                  | Input Node(s)                               | Output Node(s)                               | Sticky Note                                    |
|-----------------------------------------------------|----------------------------|-------------------------------------------------|---------------------------------------------|----------------------------------------------|------------------------------------------------|
| When chat message received                           | Langchain Chat Trigger     | Entry point for chat input                       | -                                           | Generate a Boolean Search String              |                                                |
| Generate a Boolean Search String                     | OpenAI (Langchain)         | Creates Google Boolean search string             | When chat message received                   | Create a new sheet                            |                                                |
| Create a new sheet                                  | Google Sheets              | Creates new Google Sheet                          | Generate a Boolean Search String             | Columns to add: linkedin_url, first_name, last_name, email, context, domain |                                                |
| Columns to add: linkedin_url, first_name, last_name, email, context, domain | Code                       | Defines column headers                            | Create a new sheet                           | Add columns to new sheet                       |                                                |
| Add columns to new sheet                             | Google Sheets              | Adds headers to the sheet                         | Columns to add: linkedin_url, first_name, last_name, email, context, domain | set page number for google search             |                                                |
| set page number for google search                    | Code                       | Initializes/updates search pagination index      | Add columns to new sheet                      | If desired results not reached                 |                                                |
| If desired results not reached                       | If                         | Checks if search should continue                  | set page number for google search, Adds 10 to start - Go to next page | Wait (if continue), (end if stop)             |                                                |
| Wait                                                | Wait                       | Delays between search requests                    | If desired results not reached                | Google Boolean Search                         |                                                |
| Google Boolean Search                               | HTTP Request               | Executes Google search with Boolean query        | Wait                                         | Extracts all linkedin urls and workplace context from the google http response |                                                |
| Extracts all linkedin urls and workplace context from the google http response | Code                       | Parses search HTML to extract LinkedIn URLs      | Google Boolean Search                         | Extract Contact Details                        |                                                |
| Extract Contact Details                             | OpenAI (Langchain)         | Extracts structured contact info                  | Extracts all linkedin urls and workplace context from the google http response | Extracts fname, lname, domainname             |                                                |
| Extracts fname, lname, domainname                   | Code                       | Processes AI output to isolate names and domain  | Extract Contact Details                       | Hunter                                        |                                                |
| Hunter                                              | Hunter.io                  | Finds emails for extracted contacts               | Extracts fname, lname, domainname             | Appends the results to the sheet              |                                                |
| Appends the results to the sheet                    | Google Sheets              | Appends new contact data to Google Sheet          | Hunter                                        | Adds 10 to start - Go to next page             |                                                |
| Adds 10 to start - Go to next page                   | Code                       | Increments search start index for pagination      | Appends the results to the sheet              | If desired results not reached                 |                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the trigger node:**
   - Add a **Langchain Chat Trigger** node named `When chat message received`.
   - Configure webhook URL as per your n8n instance.

2. **Generate Boolean Search String:**
   - Add an **OpenAI (Langchain)** node named `Generate a Boolean Search String`.
   - Connect output of `When chat message received` to its input.
   - Configure with prompts to transform chat input into a Google Boolean search string.
   - Provide OpenAI credentials.

3. **Create a new Google Sheet:**
   - Add a **Google Sheets** node named `Create a new sheet`.
   - Connect output of `Generate a Boolean Search String` to its input.
   - Configure with Google Sheets OAuth2 credentials, set operation to create a new sheet.

4. **Define columns headers in a Code node:**
   - Add a **Code** node named `Columns to add: linkedin_url, first_name, last_name, email, context, domain`.
   - Connect output of `Create a new sheet` to this node.
   - Code should output an array with these headers.

5. **Add columns headers to the sheet:**
   - Add a **Google Sheets** node named `Add columns to new sheet`.
   - Connect from the previous code node.
   - Configure with the sheet ID from the creation node, operation to append row(s) with the headers.

6. **Set initial page number for Google Search:**
   - Add a **Code** node named `set page number for google search`.
   - Connect from `Add columns to new sheet`.
   - Initialize a variable for search pagination start index, typically 0.

7. **Add an If node to control search continuation:**
   - Add an **If** node named `If desired results not reached`.
   - Connect from `set page number for google search`.
   - Configure condition to check if the number of retrieved results is less than desired (e.g., 100).

8. **Add a Wait node:**
   - Add a **Wait** node named `Wait`.
   - Connect the true branch of the If node to this Wait node.
   - Configure a delay (e.g., 5-10 seconds) to avoid rate limits.

9. **Add Google Boolean Search via HTTP Request:**
   - Add an **HTTP Request** node named `Google Boolean Search`.
   - Connect output of `Wait` node.
   - Configure to perform Google search with the Boolean query and pagination parameters.
   - Handle user-agent headers and proxies if necessary.

10. **Extract LinkedIn URLs and context in Code node:**
    - Add a **Code** node named `Extracts all linkedin urls and workplace context from the google http response`.
    - Connect from `Google Boolean Search`.
    - Implement HTML parsing logic to extract LinkedIn profile URLs and workplace context.

11. **Use OpenAI to extract contact details:**
    - Add an **OpenAI (Langchain)** node named `Extract Contact Details`.
    - Connect from previous code node.
    - Configure prompt to extract structured data such as first name, last name, domain.

12. **Further extract names and domain in Code node:**
    - Add a **Code** node named `Extracts fname, lname, domainname`.
    - Connect from `Extract Contact Details`.
    - Process AI output to isolate individual fields.

13. **Use Hunter.io to find emails:**
    - Add a **Hunter** node named `Hunter`.
    - Connect from previous code node.
    - Configure with Hunter.io credentials.
    - Input fields: first name, last name, domain.
    - Set to execute once for each contact.

14. **Append results to Google Sheet:**
    - Add a **Google Sheets** node named `Appends the results to the sheet`.
    - Connect from `Hunter`.
    - Configure to append rows with full contact data.

15. **Increment pagination counter:**
    - Add a **Code** node named `Adds 10 to start - Go to next page`.
    - Connect from `Appends the results to the sheet`.
    - Increment the start index by 10 for Google search pagination.

16. **Loop back to If node:**
    - Connect output of this code node back to the `If desired results not reached` node to check if another page should be fetched.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                           |
|----------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| This workflow leverages OpenAI GPT models via Langchain integration for natural language processing | n8n Langchain nodes documentation                          |
| Uses Hunter.io API for professional email discovery; requires valid Hunter.io API credentials       | https://hunter.io/api                                      |
| Google search scraping is susceptible to rate limits, captchas, and HTML structure changes          | Consider proxy rotation and error handling                 |
| Google Sheets node usage requires OAuth2 credentials with write access                              | Google Sheets API documentation                            |
| Pagination logic increments by 10, matching Google’s page size for search results                   | Google search pagination details                           |
| Delay between requests helps avoid IP blocking or rate limiting                                    | Adjustable in Wait node                                    |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected material. All data handled are legal and publicly accessible.