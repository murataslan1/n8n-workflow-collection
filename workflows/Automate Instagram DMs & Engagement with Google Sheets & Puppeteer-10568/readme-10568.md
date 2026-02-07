Automate Instagram DMs & Engagement with Google Sheets & Puppeteer

https://n8nworkflows.xyz/workflows/automate-instagram-dms---engagement-with-google-sheets---puppeteer-10568


# Automate Instagram DMs & Engagement with Google Sheets & Puppeteer

### 1. Workflow Overview

This n8n workflow automates Instagram direct messaging (DM) and user engagement by integrating Google Sheets and a Puppeteer-based backend service. It is designed for marketers and social media managers who want to automate personalized outreach and engagement tasks on Instagram while tracking progress and statuses within Google Sheets.

The workflow is structured into the following logical blocks:

- **1.1 Lead Retrieval and Filtering**: Fetch Instagram leads and messages from Google Sheets, filter based on message status, and limit batch size.
- **1.2 Instagram Account Login**: Authenticate Instagram accounts via an external Puppeteer backend to prepare for message sending.
- **1.3 Sending Instagram DMs**: Send personalized direct messages to Instagram users using the Puppeteer backend, incorporating delays and logging.
- **1.4 Post-Message Engagement Simulation**: Simulate human-like Instagram activity such as viewing stories and scrolling to increase engagement authenticity.
- **1.5 Status Updates and Error Handling**: Update Google Sheets with message sending status, handle API rate limits, and stop the workflow on critical errors.
- **1.6 Webhook Interfaces**: Two separate webhooks enable external triggering for login and messaging workflows.

---

### 2. Block-by-Block Analysis

#### 1.1 Lead Retrieval and Filtering

**Overview:**  
This block retrieves leads (Instagram usernames and messages) from Google Sheets, filters out those already messaged, and limits the number of leads processed per run.

**Nodes Involved:**  
- `Webhook1`  
- `Get row(s) in sheet3`  
- `Filter1`  
- `Limit1`  
- `Loop Over Items3`  
- `Sticky Note2` (context note)  
- `Sticky Note3` (context note)  
- `Sticky Note10` (context note)

**Node Details:**

- **Webhook1**  
  - *Type:* Webhook  
  - *Role:* Entry point to receive external trigger for lead processing.  
  - *Parameters:* Path `cdf1fb17-2208-4676-bc41-70e5fa0a2ecc`, response mode `responseNode`.  
  - *Connections:* Outputs to `Get row(s) in sheet3`.  
  - *Failure Modes:* Invalid trigger or network issues.

- **Get row(s) in sheet3**  
  - *Type:* Google Sheets  
  - *Role:* Fetch all leads from the `leads` sheet in Google Sheets.  
  - *Configuration:* Uses OAuth2 credentials; accesses spreadsheet ID `1ZNX9fypcwyObMT5tXV6U7iQ7lth2xYul-q8diaiohlo`; sheet named by `gid=0`.  
  - *Inputs:* From `Webhook1`.  
  - *Outputs:* To `Filter1`.  
  - *Edge Cases:* API quota limits, empty sheet, or invalid spreadsheet ID.  

- **Filter1**  
  - *Type:* Filter  
  - *Role:* Filter leads where the `Status` field is empty, meaning messages have not yet been sent.  
  - *Conditions:* `$json.Status` is empty.  
  - *Input:* From `Get row(s) in sheet3`.  
  - *Output:* Leads with empty Status to `Limit1`.  
  - *Failure Modes:* Expression errors if `Status` field missing.

- **Limit1**  
  - *Type:* Limit  
  - *Role:* Limit the batch size to 100 leads per execution to avoid overload.  
  - *Parameters:* `maxItems=100`.  
  - *Input:* From `Filter1`.  
  - *Output:* To `Loop Over Items3`.

- **Loop Over Items3**  
  - *Type:* SplitInBatches  
  - *Role:* Iterates over each filtered lead one by one for processing.  
  - *Input:* From `Limit1`.  
  - *Output:* To subsequent nodes for sending DMs.  
  - *Notes:* Processes leads sequentially to manage rate limits.

- **Sticky Notes 2, 3, 10**  
  - Provide contextual information:
    - "Getting the leads information"
    - "Filtering based on the send status that is available on google sheet"
    - "Run the below workflow first, before running this."

---

#### 1.2 Instagram Account Login

**Overview:**  
Authenticate Instagram accounts by sending credentials to a Puppeteer backend service. This prepares the session for sending DMs.

**Nodes Involved:**  
- `Webhook`  
- `Get row(s) in sheet2`  
- `Loop Over Items2`  
- `HTTP Request1`  
- `If`  
- `Append or update row in sheet1`  
- `Stop and Error`  
- `Sticky Note1`  
- `Sticky Note13`

**Node Details:**

- **Webhook**  
  - *Type:* Webhook  
  - *Role:* Entry point for login trigger.  
  - *Parameters:* Path `3cb5f159-4fc0-426e-8b16-8da1049fa7f1`.  
  - *Connection:* Output to `Get row(s) in sheet2`.

- **Get row(s) in sheet2**  
  - *Type:* Google Sheets  
  - *Role:* Fetch Instagram account credentials (`username`, `password`, `proxy`, `Active`) from `acc` sheet.  
  - *Config:* Uses Google OAuth2; spreadsheet and sheet ID same as above, sheet ID `1434077398`.  
  - *Output:* To `Loop Over Items2`.

- **Loop Over Items2**  
  - *Type:* SplitInBatches  
  - *Role:* Iterate over each account to login sequentially.  
  - *Output:* First output empty (?), second output to `HTTP Request1`.

- **HTTP Request1**  
  - *Type:* HTTP Request  
  - *Role:* POST login data (`username`, `password`, `proxy`) to Puppeteer backend `/login` endpoint at `http://host.docker.internal:3001/login`.  
  - *Output:* To `If` node.

- **If**  
  - *Type:* If  
  - *Role:* Conditional check if login succeeded (`$json.success === true`).  
  - *True Output:* To `Append or update row in sheet1` (mark active account).  
  - *False Output:* To `Stop and Error`.

- **Append or update row in sheet1**  
  - *Type:* Google Sheets  
  - *Role:* Update or append row in `acc` sheet setting `Active=TRUE` for the logged-in username.  
  - *Config:* Match on `username`, map `Active=TRUE`.  
  - *Output:* To `Wait2`.

- **Wait2**  
  - *Type:* Wait  
  - *Role:* Pause 2 seconds after update.  
  - *Output:* To `Respond to Webhook`.

- **Respond to Webhook**  
  - *Type:* Respond to Webhook  
  - *Role:* Send JSON response with login `success`, `message`, and `user` back to caller.

- **Stop and Error**  
  - *Type:* Stop and Error  
  - *Role:* Abort workflow with error "Try again login with the account" if login fails.

- **Sticky Note1 and Sticky Note13**  
  - Provide context: "Login with an Instagram account" and "This is the Flow of login with an Instagram account".

**Edge Cases:**  
- Login failures due to wrong credentials or network issues.  
- Puppeteer backend unavailable or timeout.  
- Google Sheets API rate limits.

---

#### 1.3 Sending Instagram DMs

**Overview:**  
Send Instagram direct messages to leads one by one, with randomized delays and logging. After sending, update the Google Sheet with status.

**Nodes Involved:**  
- `Loop Over Items3` (from lead retrieval)  
- `HTTP Request5`  
- `If3`  
- `Update row in sheet6`  
- `If4`  
- `Update row in sheet`  
- `Stop and Error1`  
- `Sticky Note8`, `Sticky Note9`, `Sticky Note4`, `Sticky Note7`, `Sticky Note6`, `Sticky Note5`, `Sticky Note` (various context notes)  
- `Code in JavaScript3`  
- `Wait5`  
- `Code in JavaScript4`  
- `Wait6`  
- `HTTP Request2`  
- `HTTP Request4`

**Node Details:**

- **HTTP Request5**  
  - *Type:* HTTP Request  
  - *Role:* POST to Puppeteer backend `/instagram` endpoint to send DM with parameters: `to` (username with trailing space trimmed), `message`.  
  - *Output:* To `If3`.

- **If3**  
  - *Type:* If  
  - *Role:* Check if message sending was successful (`$json.success === true`).  
  - *True Output:* Update Google Sheet row to `Status = send`.  
  - *False Output:* Check if request was rate-limited via `If4`.

- **Update row in sheet6**  
  - *Type:* Google Sheets  
  - *Role:* Update row in `leads` sheet with status `"send"` and current timestamp for username.  
  - *Output:* To `start-viewing-storeies`.

- **If4**  
  - *Type:* If  
  - *Role:* Check if request exceeded limits (`$json.requestExceeded === true`).  
  - *True Output:* Stop workflow with error message from `$json.error`.  
  - *False Output:* Update Google Sheet row with error status.

- **Update row in sheet**  
  - *Type:* Google Sheets  
  - *Role:* Update row with status `"not-send (Error: ...)"` and timestamp if message failed.  
  - *Output:* Back to `Loop Over Items3` to continue with next lead.

- **Stop and Error1**  
  - *Type:* Stop and Error  
  - *Role:* Stop workflow on critical error (rate limit exceeded).

- **Code in JavaScript3 & Code in JavaScript4**  
  - *Type:* Code  
  - *Role:* Generate random delays between 20-30 seconds and 10-20 seconds respectively for realistic human-like pauses.  
  - *Output:* Delay seconds passed as JSON for Wait nodes.

- **Wait5 & Wait6**  
  - *Type:* Wait  
  - *Role:* Wait for randomized delay before starting and stopping story views or before processing next message.

- **HTTP Request2 & HTTP Request4**  
  - *Type:* HTTP Request  
  - *Role:* Log messages to Puppeteer backend `/logthis` endpoint for debugging and monitoring delays.

- **start-viewing-storeies & start-viewing-storeies1**  
  - *Type:* HTTP Request  
  - *Role:* Start and stop story viewing simulation by posting `status=start` and `status=stop` to backend `/viewstory`.

- **Sticky Notes 4, 5, 6, 7, 8, 9**  
  - Provide step explanations for updating sheets, waiting times, starting/stopping story views, and delay durations.

**Edge Cases:**  
- Message sending failures due to Instagram limits or backend errors.  
- Rate limit exceeded causing workflow stop.  
- Network or API timeout errors.  
- Google Sheets update failures.

---

#### 1.4 Status Updates and Error Handling

**Overview:**  
This block manages updating lead statuses in Google Sheets and handles errors, including rate limits and login failures.

**Nodes Involved:**  
- `Update row in sheet`  
- `Update row in sheet6`  
- `Stop and Error`  
- `Stop and Error1`  
- `If` (login success check)  
- `If3` (message send success check)  
- `If4` (rate limit check)  
- Sticky notes associated with error handling and flow explanations.

**Node Details:**  
Covered previously within Blocks 1.2 and 1.3.

---

#### 1.5 Webhook Interfaces

**Overview:**  
Two webhooks serve as entry points for the workflow:

- One webhook (`Webhook`) triggers Instagram account login and session preparation.
- Another webhook (`Webhook1`) triggers lead fetching and DM sending.

**Nodes Involved:**  
- `Webhook`  
- `Webhook1`  
- `Respond to Webhook`  
- `Respond to Webhook1`

**Node Details:**

- **Webhook**  
  - Path: `3cb5f159-4fc0-426e-8b16-8da1049fa7f1`  
  - Trigger login block.

- **Webhook1**  
  - Path: `cdf1fb17-2208-4676-bc41-70e5fa0a2ecc`  
  - Trigger lead retrieval and messaging block.

- **Respond to Webhook** and **Respond to Webhook1**  
  - Send JSON responses back to API callers confirming success or completion.

---

### 3. Summary Table

| Node Name                  | Node Type            | Functional Role                              | Input Node(s)                | Output Node(s)                     | Sticky Note                                      |
|----------------------------|----------------------|----------------------------------------------|------------------------------|-----------------------------------|-------------------------------------------------|
| Webhook                    | Webhook              | Entry trigger for Instagram login              |                              | Get row(s) in sheet2               |                                                 |
| Get row(s) in sheet2       | Google Sheets        | Fetch Instagram accounts for login             | Webhook                       | Loop Over Items2                   |                                                 |
| Loop Over Items2           | SplitInBatches       | Iterate over accounts for login                 | Get row(s) in sheet2          | HTTP Request1                     |                                                 |
| HTTP Request1              | HTTP Request         | Send login request to Puppeteer backend        | Loop Over Items2              | If                               |                                                 |
| If                        | If                   | Check login success                             | HTTP Request1                | Append or update row in sheet1 / Stop and Error |                                                 |
| Append or update row in sheet1 | Google Sheets    | Mark account as active after login              | If (true)                    | Wait2                            |                                                 |
| Wait2                      | Wait                 | Wait 2 seconds after login update               | Append or update row in sheet1 | Respond to Webhook               |                                                 |
| Respond to Webhook         | Respond to Webhook   | Respond to login webhook trigger                 | Wait2                        |                                   |                                                 |
| Stop and Error             | Stop and Error       | Stop workflow on login failure                   | If (false)                   |                                   |                                                 |
| Webhook1                   | Webhook              | Entry trigger for lead retrieval and messaging |                              | Get row(s) in sheet3               |                                                 |
| Get row(s) in sheet3       | Google Sheets        | Fetch leads from Google Sheets                   | Webhook1                     | Filter1                          |                                                 |
| Filter1                    | Filter               | Filter leads where Status is empty               | Get row(s) in sheet3          | Limit1                           |                                                 |
| Limit1                     | Limit                | Limit batch size to 100 leads                    | Filter1                      | Loop Over Items3                  |                                                 |
| Loop Over Items3           | SplitInBatches       | Iterate over leads for messaging                  | Limit1                       | HTTP Request5 / Respond to Webhook1 |                                                 |
| HTTP Request5              | HTTP Request         | Send DM via Puppeteer backend                     | Loop Over Items3              | If3                             |                                                 |
| If3                        | If                   | Check if DM sent successfully                     | HTTP Request5                | Update row in sheet6 / If4       |                                                 |
| Update row in sheet6       | Google Sheets        | Mark lead as sent in Google Sheets                | If3 (true)                   | start-viewing-storeies           |                                                 |
| If4                        | If                   | Check for rate limit exceeded                      | If3 (false)                  | Stop and Error1 / Update row in sheet |                                                 |
| Update row in sheet        | Google Sheets        | Mark lead as not sent with error                   | If4 (false)                  | Loop Over Items3                 |                                                 |
| Stop and Error1            | Stop and Error       | Stop workflow when rate limit exceeded             | If4 (true)                   |                                   |                                                 |
| start-viewing-storeies     | HTTP Request         | Start story viewing simulation                      | Update row in sheet6          | Code in JavaScript3              |                                                 |
| Code in JavaScript3        | Code                 | Generate random 20-30 sec delay                     | start-viewing-storeies        | HTTP Request2                   |                                                 |
| HTTP Request2              | HTTP Request         | Log delay start message                              | Code in JavaScript3           | Wait5                          |                                                 |
| Wait5                      | Wait                 | Wait random delay before story viewing               | HTTP Request2                | start-viewing-storeies1          |                                                 |
| start-viewing-storeies1    | HTTP Request         | Stop story viewing simulation                       | Wait5                        | Code in JavaScript4             |                                                 |
| Code in JavaScript4        | Code                 | Generate random 10-20 sec delay                      | start-viewing-storeies1       | HTTP Request4                  |                                                 |
| HTTP Request4              | HTTP Request         | Log delay before next user message                    | Code in JavaScript4           | Wait6                         |                                                 |
| Wait6                      | Wait                 | Wait random delay before next message                  | HTTP Request4                | Loop Over Items3               |                                                 |
| Respond to Webhook1        | Respond to Webhook   | Respond to lead processing webhook                     | Loop Over Items3 (first output) |                              |                                                 |
| Update row in sheet        | Google Sheets        | Update lead status with error                          | If4 (false)                  | Loop Over Items3               |                                                 |
| Stop and Error1            | Stop and Error       | Stop workflow on rate limit error                      | If4 (true)                   |                               |                                                 |
| Append or update row in sheet1 | Google Sheets    | Update account active status                            | If                          | Wait2                        |                                                 |
| Sticky Notes (various)     | Sticky Note          | Contextual explanations and instructions              |                              |                               | See notes below                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook node:**  
   - Name: `Webhook`  
   - Path: `3cb5f159-4fc0-426e-8b16-8da1049fa7f1`  
   - Response Mode: `responseNode`  
   - Purpose: Trigger Instagram account login.

2. **Add Google Sheets node:**  
   - Name: `Get row(s) in sheet2`  
   - Operation: Read rows  
   - Document ID: `1ZNX9fypcwyObMT5tXV6U7iQ7lth2xYul-q8diaiohlo`  
   - Sheet Name: Sheet with ID `1434077398` (Accounts sheet)  
   - Credentials: Google Sheets OAuth2  
   - Connect input from `Webhook`.

3. **Add SplitInBatches node:**  
   - Name: `Loop Over Items2`  
   - Purpose: Iterate over accounts from Sheet2.  
   - Connect input from `Get row(s) in sheet2`.

4. **Add HTTP Request node:**  
   - Name: `HTTP Request1`  
   - Method: POST  
   - URL: `http://host.docker.internal:3001/login`  
   - Body Parameters: username, password, proxy (mapped from current item JSON)  
   - Connect input from second output of `Loop Over Items2`.

5. **Add If node:**  
   - Name: `If`  
   - Condition: `$json.success === true`  
   - Connect input from `HTTP Request1`.

6. **Add Google Sheets node:**  
   - Name: `Append or update row in sheet1`  
   - Operation: Append or Update  
   - Document ID and Sheet: same as Step 2  
   - Matching column: `username`  
   - Set `Active` to `TRUE` for matching username  
   - Connect true output of `If` to this node.

7. **Add Wait node:**  
   - Name: `Wait2`  
   - Amount: 2 seconds  
   - Connect from `Append or update row in sheet1`.

8. **Add Respond to Webhook node:**  
   - Name: `Respond to Webhook`  
   - Respond With: JSON  
   - Response Body: Include success, message, and user from `HTTP Request1`  
   - Connect from `Wait2`.

9. **Add Stop and Error node:**  
   - Name: `Stop and Error`  
   - Error Message: "Try again login with the account"  
   - Connect false output of `If`.

---

10. **Create second Webhook node:**  
    - Name: `Webhook1`  
    - Path: `cdf1fb17-2208-4676-bc41-70e5fa0a2ecc`  
    - Response Mode: `responseNode`  
    - Purpose: Trigger lead retrieval and messaging.

11. **Add Google Sheets node:**  
    - Name: `Get row(s) in sheet3`  
    - Document ID: same as above  
    - Sheet Name: `gid=0` (Leads sheet)  
    - Credentials: Google Sheets OAuth2  
    - Connect input from `Webhook1`.

12. **Add Filter node:**  
    - Name: `Filter1`  
    - Condition: `$json.Status` is empty  
    - Connect input from `Get row(s) in sheet3`.

13. **Add Limit node:**  
    - Name: `Limit1`  
    - Max Items: 100  
    - Connect input from `Filter1`.

14. **Add SplitInBatches node:**  
    - Name: `Loop Over Items3`  
    - Connect input from `Limit1`.

15. **Add HTTP Request node:**  
    - Name: `HTTP Request5`  
    - Method: POST  
    - URL: `http://host.docker.internal:3001/instagram`  
    - Body Parameters: `to` (username), `message` (from current item)  
    - Connect input from `Loop Over Items3`.

16. **Add If node:**  
    - Name: `If3`  
    - Condition: `$json.success === true`  
    - Connect input from `HTTP Request5`.

17. **Add Google Sheets node:**  
    - Name: `Update row in sheet6`  
    - Operation: Update  
    - Sheet: Leads sheet (gid=0)  
    - Set `Status` to `send`, update `Time Stamp`  
    - Match on username  
    - Connect true output of `If3`.

18. **Add HTTP Request node:**  
    - Name: `start-viewing-storeies`  
    - Method: POST  
    - URL: `http://host.docker.internal:3001/viewstory`  
    - Body: `{ "status": "start" }`  
    - Connect from `Update row in sheet6`.

19. **Add Code node:**  
    - Name: `Code in JavaScript3`  
    - JavaScript: Generate random delay between 20-30 seconds  
    - Connect from `start-viewing-storeies`.

20. **Add HTTP Request node:**  
    - Name: `HTTP Request2`  
    - Method: POST to `/logthis` with message about delay  
    - Connect from `Code in JavaScript3`.

21. **Add Wait node:**  
    - Name: `Wait5`  
    - Amount: Delay seconds from `Code in JavaScript3`  
    - Connect from `HTTP Request2`.

22. **Add HTTP Request node:**  
    - Name: `start-viewing-storeies1`  
    - Method: POST  
    - URL: `/viewstory`  
    - Body: `{ "status": "stop" }`  
    - Connect from `Wait5`.

23. **Add Code node:**  
    - Name: `Code in JavaScript4`  
    - JavaScript: Generate random delay between 10-20 seconds  
    - Connect from `start-viewing-storeies1`.

24. **Add HTTP Request node:**  
    - Name: `HTTP Request4`  
    - POST to `/logthis` with delay message  
    - Connect from `Code in JavaScript4`.

25. **Add Wait node:**  
    - Name: `Wait6`  
    - Amount: Delay seconds from `Code in JavaScript4`  
    - Connect from `HTTP Request4`.

26. **Connect Wait6 output to `Loop Over Items3` input**  
    - To proceed with next lead.

27. **Add If node:**  
    - Name: `If4`  
    - Condition: `$json.requestExceeded === true`  
    - Connect false output of `If3` to `If4`.

28. **Add Stop and Error node:**  
    - Name: `Stop and Error1`  
    - Connect true output of `If4`.

29. **Add Google Sheets node:**  
    - Name: `Update row in sheet`  
    - Update lead status with error message and timestamp  
    - Connect false output of `If4`, then connect output back to `Loop Over Items3` for next item.

30. **Add Respond to Webhook node:**  
    - Name: `Respond to Webhook1`  
    - Respond with JSON `{ "myField": "done man" }`  
    - Connect first output of `Loop Over Items3`.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                       | Context or Link                                                                                                    |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| **🤖 Instagram DM Automation Workflow**: Automates Instagram DMs and engagement using Puppeteer backend and Google Sheets integration. Includes human-like delays and story viewing simulation to avoid spam detection.                                            | Sticky Note12 content in workflow.                                                                                |
| Setup instructions include connecting Google Sheets with OAuth2, hosting Puppeteer backend handling `/login`, `/instagram`, `/viewstory`, `/logthis` endpoints, and triggering workflow via n8n Webhooks.                                                         | Sticky Note12 content.                                                                                            |
| Puppeteer backend service is expected to run locally (on `host.docker.internal:3001`) and handle Instagram login, sending messages, viewing stories, and logging actions.                                                                                         | Implied by HTTP Request node URLs.                                                                                |
| Sheet IDs and GIDs: Spreadsheet ID `1ZNX9fypcwyObMT5tXV6U7iQ7lth2xYul-q8diaiohlo` with sheets `acc` (ID 1434077398) for accounts and `leads` (gid=0) for lead data.                                                                                                | Google Sheets nodes.                                                                                              |
| Rate limit handling is implemented by checking `requestExceeded` flag and stopping workflow on limit reached to prevent account bans.                                                                                                                           | Nodes `If4` and `Stop and Error1`.                                                                                |
| Random delays are generated in JavaScript nodes to simulate human-like interaction timing, critical for avoiding Instagram spam detection.                                                                                                                      | `Code in JavaScript3` and `Code in JavaScript4` nodes.                                                           |
| Logging requests to Puppeteer backend help in monitoring delays and actions for debugging.                                                                                                                                                                        | HTTP Request2 and HTTP Request4 nodes.                                                                             |
| The workflow must be triggered via Webhooks with appropriate payloads; no direct triggers inside n8n.                                                                                                                                                            | Webhook nodes `Webhook` and `Webhook1`.                                                                           |

---

*Disclaimer:*  
The text provided originates exclusively from an n8n automated workflow. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.