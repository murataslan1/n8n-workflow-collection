Auto Source LinkedIn Candidates with GPT-4 Boolean Search & Google X-ray

https://n8nworkflows.xyz/workflows/auto-source-linkedin-candidates-with-gpt-4-boolean-search---google-x-ray-3259


# Auto Source LinkedIn Candidates with GPT-4 Boolean Search & Google X-ray

### 1. Workflow Overview

This workflow automates the sourcing of LinkedIn candidate profiles by leveraging GPT-4 to generate precise Boolean search strings tailored to a job description or ideal candidate specification. It then performs authenticated Google searches (X-ray searches) using these Boolean strings to find LinkedIn profiles, extracts profile URLs from the search results, and stores them in a newly created Google Sheet for easy review and further processing.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives user input describing the job or candidate profile.
- **1.2 Boolean Search String Generation:** Uses OpenAI GPT-4 to generate a LinkedIn-specific Boolean search string.
- **1.3 Google Sheet Setup:** Creates a new Google Sheet and prepares it for storing LinkedIn URLs.
- **1.4 Google Search Execution:** Performs authenticated Google searches using the Boolean string and paginates through results.
- **1.5 LinkedIn URL Extraction:** Parses Google search results to extract LinkedIn profile URLs.
- **1.6 Data Storage & Looping:** Appends extracted URLs to the Google Sheet and loops until the desired number of profiles is reached.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block waits for the user to input a job description or ideal candidate specification via a chat interface, triggering the workflow start.

- **Nodes Involved:**  
  - When chat message received  
  - Sticky Note (instructions for user input)

- **Node Details:**  
  - **When chat message received**  
    - Type: Chat Trigger (LangChain)  
    - Role: Entry point that listens for user input in natural language.  
    - Configuration: Default options; no special filters.  
    - Inputs: External chat message from user.  
    - Outputs: Passes user input as `chatInput` JSON property.  
    - Edge Cases: Input missing or malformed; no fallback configured.  
  - **Sticky Note**  
    - Type: Informational note for users.  
    - Content: Instructions to paste job description or candidate specs after activating workflow.

#### 2.2 Boolean Search String Generation

- **Overview:**  
  This block sends the user input to OpenAI GPT-4 to generate a precise LinkedIn Boolean search string and a sheet name for storing results.

- **Nodes Involved:**  
  - Generate a Boolean Search String  
  - Sticky Note1 (OpenAI API key instructions)

- **Node Details:**  
  - **Generate a Boolean Search String**  
    - Type: OpenAI (LangChain) node  
    - Role: Generates a Boolean search string formatted as `site:linkedin.com/in ("Job Title" AND "Skill1" AND "Skill2")` and a sheet name.  
    - Configuration: Uses GPT-4o-mini model; system prompt instructs to generate only the Boolean string and sheet name, no commentary.  
    - Key Expressions: Input message content is the user chat input (`{{$json.chatInput}}`).  
    - Outputs: JSON with `search_string` and `sheet_name`.  
    - Credentials: Requires OpenAI API key configured under credentials.  
    - Edge Cases: API failures, rate limits, malformed output.  
  - **Sticky Note1**  
    - Content: Instructions to add OpenAI API key credential with link.

#### 2.3 Google Sheet Setup

- **Overview:**  
  Creates a new sheet inside a pre-existing Google Sheets document to store LinkedIn profile URLs and initializes the sheet with the required columns.

- **Nodes Involved:**  
  - Create a new sheet  
  - Columns to add (code node)  
  - Add columns to new sheet  
  - Sticky Note5 (Google Sheets account connection instructions)

- **Node Details:**  
  - **Create a new sheet**  
    - Type: Google Sheets node  
    - Role: Creates a new sheet named dynamically using the GPT-generated sheet name plus current timestamp.  
    - Configuration: Operation `create` on a fixed Google Sheets document ID; title expression uses GPT output and current time.  
    - Credentials: Google Sheets OAuth2 account required.  
    - Outputs: Returns new sheet ID for downstream use.  
    - Edge Cases: Permission errors, quota limits, invalid document ID.  
  - **Columns to add**  
    - Type: Code node (JavaScript)  
    - Role: Prepares initial data structure with empty `linkedin_url` field for appending.  
    - Outputs: JSON with empty `linkedin_url` property.  
  - **Add columns to new sheet**  
    - Type: Google Sheets node  
    - Role: Appends a row with the `linkedin_url` column header to the newly created sheet.  
    - Configuration: Operation `append`, sheet name and document ID dynamically set from previous node outputs.  
    - Credentials: Same Google Sheets OAuth2 account.  
    - Edge Cases: Sheet not found, append failures.  
  - **Sticky Note5**  
    - Content: Reminder to connect Google Sheets account and create a document.

#### 2.4 Google Search Execution

- **Overview:**  
  Performs authenticated Google searches using the Boolean search string, paginates through results 10 at a time, and respects rate limiting.

- **Nodes Involved:**  
  - set page number for google search (initializes start=0)  
  - If desired results not reached (checks if more pages needed)  
  - Wait (delays between requests)  
  - Google Boolean Search (HTTP request to Google)  
  - Adds 10 to start - Go to next page (increments pagination)  
  - Sticky Note2 (pagination instructions)  
  - Sticky Note3 (wait node explanation)  
  - Sticky Note4 (Google authentication via cookie header)

- **Node Details:**  
  - **set page number for google search**  
    - Type: Code node  
    - Role: Initializes the `start` query parameter for Google search pagination at 0.  
    - Outputs: JSON with `start: 0`.  
  - **If desired results not reached**  
    - Type: If node  
    - Role: Checks if the current `start` value is less than the desired maximum number of results (default 50).  
    - Configuration: Condition `{{$json.start}} < 50` (modifiable).  
    - Outputs: True branch loops to fetch next page; false branch ends loop.  
    - Edge Cases: Misconfiguration of threshold; infinite loops if condition logic fails.  
  - **Wait**  
    - Type: Wait node  
    - Role: Pauses 5 seconds between Google requests to avoid rate limiting.  
    - Configuration: Default 5 seconds delay.  
  - **Google Boolean Search**  
    - Type: HTTP Request node  
    - Role: Sends GET request to Google Search with query parameter `q` set to the Boolean string and `start` for pagination.  
    - Configuration:  
      - URL: `https://www.google.com/search`  
      - Query parameters: `q` = Boolean search string, `start` = pagination offset  
      - Headers: User-Agent set to mimic browser  
      - Authentication: HTTP Header Auth using a cookie string exported from browser (via Cookie-Editor extension)  
    - Credentials: Requires HTTP Header Auth credential with Google cookie header.  
    - Edge Cases: Google blocking, expired cookie, malformed cookie, HTTP errors.  
  - **Adds 10 to start - Go to next page**  
    - Type: Code node  
    - Role: Increments `start` by 10 to fetch next page of Google results.  
    - Inputs: Reads current `start` from If node output.  
    - Outputs: JSON with updated `start`.  
  - **Sticky Notes 2, 3, 4**  
    - Provide detailed instructions on pagination, wait time rationale, and how to export and use Google authentication cookie header.

#### 2.5 LinkedIn URL Extraction

- **Overview:**  
  Parses the raw HTML response from Google search results to extract unique LinkedIn profile URLs.

- **Nodes Involved:**  
  - Extracts all linkedin urls from the google http response

- **Node Details:**  
  - **Extracts all linkedin urls from the google http response**  
    - Type: Code node (JavaScript)  
    - Role: Uses regex patterns to find LinkedIn profile URLs in the HTML response, cleans and deduplicates them.  
    - Key Logic:  
      - Decodes HTML entities and escaped characters.  
      - Matches URLs with patterns targeting LinkedIn profile URLs (`linkedin.com/in/`).  
      - Removes tracking parameters and trailing slashes.  
      - Filters out any Google URLs mistakenly matched.  
      - Returns array of objects with `linkedin_url` property.  
    - Inputs: Raw HTML from Google Boolean Search node.  
    - Outputs: Array of LinkedIn profile URL objects for appending.  
    - Edge Cases: Changes in Google HTML structure, false positives, empty results.

#### 2.6 Data Storage & Looping

- **Overview:**  
  Appends extracted LinkedIn URLs to the Google Sheet and loops back to fetch more results until the desired number is reached.

- **Nodes Involved:**  
  - Appends the results to the sheet  
  - Adds 10 to start - Go to next page  
  - If desired results not reached (loop control)

- **Node Details:**  
  - **Appends the results to the sheet**  
    - Type: Google Sheets node  
    - Role: Appends the extracted LinkedIn URLs to the dynamically created sheet.  
    - Configuration:  
      - Operation: Append  
      - Columns: Defines `linkedin_url` and many other optional columns (e.g., Full Name, Headline, Skills) with only `linkedin_url` populated currently.  
      - Sheet name and document ID dynamically set from earlier nodes.  
    - Credentials: Google Sheets OAuth2 account.  
    - Edge Cases: Append failures, quota limits, sheet access revoked.  
  - **Adds 10 to start - Go to next page**  
    - See above in 2.4.  
  - **If desired results not reached**  
    - See above in 2.4; controls looping until threshold met.

---

### 3. Summary Table

| Node Name                            | Node Type                      | Functional Role                              | Input Node(s)                        | Output Node(s)                       | Sticky Note                                                                                         |
|------------------------------------|--------------------------------|----------------------------------------------|------------------------------------|------------------------------------|---------------------------------------------------------------------------------------------------|
| When chat message received          | Chat Trigger (LangChain)        | Receives user input to start workflow         | -                                  | Generate a Boolean Search String    | Click "Open Chat" after activating the workflow. Here, paste in a job description or describe your ideal candidate. |
| Sticky Note                        | Sticky Note                    | User instruction                              | -                                  | -                                  | Click "Open Chat" after activating the workflow. Here, paste in a job description or describe your ideal candidate. |
| Generate a Boolean Search String    | OpenAI (LangChain)              | Generates LinkedIn Boolean search string      | When chat message received          | Create a new sheet                  | Under "Credential to connect with" add your OpenAI API key. Find at: https://platform.openai.com/settings/organization/api-keys |
| Sticky Note1                       | Sticky Note                    | OpenAI API key instruction                     | -                                  | -                                  | Under "Credential to connect with" add your OpenAI API key. Find at: https://platform.openai.com/settings/organization/api-keys |
| Create a new sheet                  | Google Sheets                  | Creates new sheet for storing results         | Generate a Boolean Search String    | Columns to add                     | Connect your google sheets account and create a document.                                         |
| Columns to add                     | Code                          | Prepares initial empty columns                  | Create a new sheet                  | Add columns to new sheet            | Connect your google sheets account and create a document.                                         |
| Add columns to new sheet            | Google Sheets                  | Adds initial columns to new sheet               | Columns to add                     | set page number for google search   | Connect your google sheets account and create a document.                                         |
| set page number for google search  | Code                          | Initializes Google search pagination start=0   | Add columns to new sheet            | If desired results not reached      | For the first condition: {{ $json.start }} is less than 50, so change "50" to your desired number of results. Each loop fetches the next page, returning 10 results per iteration. |
| If desired results not reached      | If                            | Checks if more Google search pages needed      | set page number for google search, Adds 10 to start - Go to next page | Wait (true branch), end (false branch) | For the first condition: {{ $json.start }} is less than 50, so change "50" to your desired number of results. Each loop fetches the next page, returning 10 results per iteration. |
| Wait                              | Wait                          | Delays 5 seconds between Google requests       | If desired results not reached      | Google Boolean Search               | Waits 5 seconds to avoid rate limiting by Google. While it's unlikely you'll be rate-limited since you're authenticated with your cookie, this is just a precaution. |
| Google Boolean Search              | HTTP Request                  | Performs authenticated Google search           | Wait                              | Extracts all linkedin urls from the google http response | Get this Cookie-Editor. https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm. Export your header string and paste under Header Auth in this node. |
| Extracts all linkedin urls from the google http response | Code                          | Extracts LinkedIn profile URLs from Google HTML | Google Boolean Search              | Appends the results to the sheet    |                                                                                                   |
| Appends the results to the sheet    | Google Sheets                  | Appends extracted LinkedIn URLs to sheet       | Extracts all linkedin urls from the google http response | Adds 10 to start - Go to next page |                                                                                                   |
| Adds 10 to start - Go to next page  | Code                          | Increments pagination start by 10               | Appends the results to the sheet    | If desired results not reached      |                                                                                                   |
| Sticky Note2                      | Sticky Note                    | Pagination and results count instructions       | -                                  | -                                  | For the first condition: {{ $json.start }} is less than 50, so change "50" to your desired number of results. Each loop fetches the next page, returning 10 results per iteration. |
| Sticky Note3                      | Sticky Note                    | Wait node explanation                            | -                                  | -                                  | Waits 5 seconds to avoid rate limiting by Google. While it's unlikely you'll be rate-limited since you're authenticated with your cookie, this is just a precaution. |
| Sticky Note4                      | Sticky Note                    | Google authentication cookie instructions       | -                                  | -                                  | Get this Cookie-Editor. https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm. Export your header string and paste under Header Auth in this node. |
| Sticky Note5                      | Sticky Note                    | Google Sheets connection instructions           | -                                  | -                                  | Connect your google sheets account and create a document.                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node:**  
   - Add a **Chat Trigger (LangChain)** node named `When chat message received`.  
   - Configure with default options to listen for user input. This will receive the job description or candidate specs.

2. **Add Instruction Sticky Note:**  
   - Add a **Sticky Note** near the trigger with content:  
     `"Click \"Open Chat\" after activating the workflow. Here, paste in a job description or describe your ideal candidate."`

3. **Add OpenAI Node:**  
   - Add an **OpenAI (LangChain)** node named `Generate a Boolean Search String`.  
   - Set model to `gpt-4o-mini`.  
   - Configure system prompt to instruct generating a LinkedIn Boolean search string only, formatted as:  
     `site:linkedin.com/in [Boolean search string]`  
     Also request a `sheet_name` less than 100 characters.  
   - Set user message to use expression: `{{$json.chatInput}}` (input from chat trigger).  
   - Enable JSON output.  
   - Connect OpenAI credentials with your OpenAI API key.  
   - Connect output of `When chat message received` to this node.

4. **Add Sticky Note for OpenAI API Key:**  
   - Add a **Sticky Note** near the OpenAI node with content:  
     `"Under \"Credential to connect with\" add your OpenAI API key. Find at: https://platform.openai.com/settings/organization/api-keys"`

5. **Create Google Sheets Node to Create New Sheet:**  
   - Add a **Google Sheets** node named `Create a new sheet`.  
   - Operation: `create` a new sheet inside an existing Google Sheets document (provide your document ID).  
   - Set sheet title dynamically using expression:  
     `={{ $('Generate a Boolean Search String').item.json.choices[0].message.content.sheet_name + ' ' + $now }}`  
   - Connect Google Sheets OAuth2 credentials.  
   - Connect output of OpenAI node to this node.

6. **Add Code Node to Prepare Columns:**  
   - Add a **Code** node named `Columns to add`.  
   - JavaScript code:  
     ```js
     return [{ json: { "linkedin_url": "" } }];
     ```  
   - Connect output of `Create a new sheet` to this node.

7. **Add Google Sheets Node to Append Columns:**  
   - Add a **Google Sheets** node named `Add columns to new sheet`.  
   - Operation: `append`  
   - Document ID: same as above  
   - Sheet Name: use expression to get new sheet ID from `Create a new sheet` node:  
     `={{ $('Create a new sheet').item.json.sheetId }}`  
   - Columns: auto-map input data with `linkedin_url` field.  
   - Connect Google Sheets OAuth2 credentials.  
   - Connect output of `Columns to add` node to this node.

8. **Add Code Node to Initialize Pagination:**  
   - Add a **Code** node named `set page number for google search`.  
   - JavaScript code:  
     ```js
     return [{ json: { start: 0 } }];
     ```  
   - Connect output of `Add columns to new sheet` node to this node.

9. **Add If Node to Control Loop:**  
   - Add an **If** node named `If desired results not reached`.  
   - Condition: Check if `{{$json.start}} < 50` (default max results; adjust as needed).  
   - Connect output of `set page number for google search` node to this node.

10. **Add Wait Node:**  
    - Add a **Wait** node named `Wait`.  
    - Set wait time to 5 seconds.  
    - Connect the **true** output of the If node to this node.

11. **Add HTTP Request Node for Google Search:**  
    - Add an **HTTP Request** node named `Google Boolean Search`.  
    - Method: GET  
    - URL: `https://www.google.com/search`  
    - Query Parameters:  
      - `q`: expression from OpenAI node output:  
        `={{ $('Generate a Boolean Search String').first().json.choices[0].message.content.search_string }}`  
      - `start`: expression from pagination code node: `{{$json.start}}`  
    - Headers: Add `User-Agent` header mimicking a browser.  
    - Authentication: HTTP Header Auth using a credential containing your Google cookie header string (exported via Cookie-Editor extension).  
    - Connect output of `Wait` node to this node.

12. **Add Code Node to Extract LinkedIn URLs:**  
    - Add a **Code** node named `Extracts all linkedin urls from the google http response`.  
    - Paste the provided JavaScript code that parses HTML and extracts LinkedIn profile URLs.  
    - Connect output of `Google Boolean Search` node to this node.

13. **Add Google Sheets Node to Append Results:**  
    - Add a **Google Sheets** node named `Appends the results to the sheet`.  
    - Operation: `append`  
    - Document ID and Sheet Name: same dynamic expressions as before.  
    - Columns: Define `linkedin_url` and other optional columns; only `linkedin_url` is populated from code node output.  
    - Connect Google Sheets OAuth2 credentials.  
    - Connect output of extraction code node to this node.

14. **Add Code Node to Increment Pagination:**  
    - Add a **Code** node named `Adds 10 to start - Go to next page`.  
    - JavaScript code:  
      ```js
      const startValue = $('If desired results not reached').first().json.start;
      const start = startValue + 10;
      return [{ json: { start } }];
      ```  
    - Connect output of `Appends the results to the sheet` node to this node.

15. **Loop Back to If Node:**  
    - Connect output of `Adds 10 to start - Go to next page` node back to the `If desired results not reached` node to continue pagination loop.

16. **Add Sticky Notes:**  
    - Add Sticky Notes with the exact content as in the original workflow to provide user instructions on:  
      - Inputting job description  
      - OpenAI API key setup  
      - Google Sheets connection  
      - Pagination and result count adjustment  
      - Wait node rationale  
      - Google authentication cookie export and usage (with link to Cookie-Editor extension)

---

### 5. General Notes & Resources

| Note Content                                                                                                                       | Context or Link                                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Click "Open Chat" after activating the workflow. Here, paste in a job description or describe your ideal candidate.               | User instruction for input reception.                                                                           |
| Under "Credential to connect with" add your OpenAI API key. Find at: https://platform.openai.com/settings/organization/api-keys  | OpenAI API key setup instructions.                                                                               |
| Connect your Google Sheets account and create a document.                                                                          | Google Sheets connection prerequisite.                                                                           |
| For the first condition: {{ $json.start }} is less than 50, so change "50" to your desired number of results. Each loop fetches the next page, returning 10 results per iteration. | Pagination and loop control instructions.                                                                        |
| Waits 5 seconds to avoid rate limiting by Google. While it's unlikely you'll be rate-limited since you're authenticated with your cookie, this is just a precaution. | Explanation for wait node delay.                                                                                  |
| Get this Cookie-Editor. https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm                  | Browser extension to export Google authentication cookie header for HTTP requests.                               |
| Do a Google search --> click this extension --> Export --> Header string. Then, open the HTTP Request node --> under Header Auth --> edit --> and under cookie value paste in your header string. This is to perform an authenticated Google search. | Detailed instructions for setting up authenticated Google search in the workflow.                                |

---

This documentation provides a complete, structured understanding of the workflow, enabling reproduction, modification, and troubleshooting by advanced users or AI agents.