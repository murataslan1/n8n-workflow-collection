Automate Competitor Research & Intelligence with Browser Use Cloud AI and Slack

https://n8nworkflows.xyz/workflows/automate-competitor-research---intelligence-with-browser-use-cloud-ai-and-slack-7033


# Automate Competitor Research & Intelligence with Browser Use Cloud AI and Slack

### 1. Workflow Overview

This workflow automates competitor research and intelligence gathering using Browser Use Cloud's AI-powered browsing API, combined with Slack notifications. It is designed to run exhaustive competitor analysis tasks based on user input from a form, then fetch structured research data from Browser Use Cloud, and finally format and send a comprehensive summary message to a Slack channel.

**Target Use Cases:**  
- Marketing teams performing ongoing competitor monitoring  
- Product managers tracking competitor feature releases and job openings  
- Analysts requiring structured competitor intelligence delivered to Slack  

**Logical Blocks:**

- **1.1 Input Reception:** Receives competitor name input via a form submission.  
- **1.2 Task Execution:** Starts a Browser Use Cloud AI task to research the competitor with a detailed prompt and structured JSON output specification.  
- **1.3 Task Status Check:** Listens to webhook callbacks from Browser Use Cloud indicating task completion and verifies task metadata and status.  
- **1.4 Data Retrieval and Processing:** Retrieves the completed task’s detailed output, parses the JSON data, and formats it into a Slack-friendly message.  
- **1.5 Notification Delivery:** Sends the formatted competitor intelligence message to Slack via HTTP POST.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Captures the competitor name to research through a form interface, triggering the workflow execution.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**  
  - **On form submission**  
    - Type: `Form Trigger`  
    - Role: Starts workflow upon user form submission with competitor name input.  
    - Configuration:  
      - Form title: "Run Competitor Analysis"  
      - One required field labeled "Competitor Name" with placeholder "(e.g. OpenAI)"  
    - Inputs: External user submission  
    - Outputs: JSON containing competitor name under key `Competitor Name`  
    - Edge cases: Missing or empty competitor name (form requires field, so minimal risk), form trigger webhook downtime.  

---

#### 1.2 Task Execution

- **Overview:**  
  Sends a detailed research task request to Browser Use Cloud API with the competitor name from the form, specifying the exact structured JSON format for expected output.

- **Nodes Involved:**  
  - BrowserUse Run Task

- **Node Details:**  
  - **BrowserUse Run Task**  
    - Type: `HTTP Request`  
    - Role: Initiates a research task on Browser Use Cloud using POST to `/api/v1/run-task`.  
    - Configuration:  
      - URL: `https://api.browser-use.com/api/v1/run-task`  
      - Method: POST  
      - JSON Body dynamically built with competitor name inserted in prompt text.  
      - Structured output JSON schema specifying fields for pricing, jobs, new features, announcements.  
      - Metadata tag `"source": "n8n-competitor-demo"` used to identify requests.  
      - Authentication: HTTP Bearer with Browser Use API Key credential.  
    - Inputs: JSON from form trigger with competitor name  
    - Outputs: Task initiation response including session ID  
    - Edge cases: API authentication failure, malformed JSON in prompt, API rate limits, network timeouts.  

---

#### 1.3 Task Status Check

- **Overview:**  
  Receives asynchronous webhook callbacks from Browser Use Cloud about task status. Filters callbacks to only proceed on successful completion of relevant tasks.

- **Nodes Involved:**  
  - Webhook  
  - If

- **Node Details:**  
  - **Webhook**  
    - Type: `Webhook`  
    - Role: Receives POST callbacks from Browser Use Cloud at path `/get-research-data`.  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `get-research-data`  
    - Inputs: External POST requests with task payloads from Browser Use Cloud  
    - Outputs: JSON payload with task status and metadata  
    - Edge cases: Webhook unavailability, invalid payloads, unauthorized requests.  

  - **If**  
    - Type: `If` conditional node  
    - Role: Filters webhook calls to proceed only if:  
      - `payload.status` equals `"finished"`  
      - `payload.metadata.source` equals `"n8n-competitor-demo"` (to ensure it matches this workflow's tasks)  
    - Inputs: JSON from Webhook node  
    - Outputs: Passes data to next node if conditions met  
    - Edge cases: Missing fields, case sensitivity issues, changes in API payload structure.  

---

#### 1.4 Data Retrieval and Processing

- **Overview:**  
  Retrieves detailed task results from Browser Use Cloud using the session ID from webhook, then parses and formats the JSON output into a structured message for Slack.

- **Nodes Involved:**  
  - Get Task details  
  - Generate Slack message

- **Node Details:**  
  - **Get Task details**  
    - Type: `HTTP Request`  
    - Role: Fetches detailed task output JSON from Browser Use Cloud API.  
    - Configuration:  
      - URL dynamically built as `https://api.browser-use.com/api/v1/task/{{session_id}}` where `session_id` is extracted from webhook payload.  
      - Method: GET (default)  
      - Authentication: HTTP Bearer with Browser Use API Key credential  
    - Inputs: JSON with session ID from If node  
    - Outputs: JSON containing task output as stringified JSON in `output` field  
    - Edge cases: Invalid session ID, API errors, auth failures, network issues.  

  - **Generate Slack message**  
    - Type: `Code` (JavaScript)  
    - Role: Parses the nested JSON output, formats sections (pricing, jobs, features, announcements) into bullet-point text blocks suitable for Slack markdown.  
    - Configuration:  
      - Reads input JSON output string and parses it.  
      - Uses helper function to format arrays as bullet points, substituting "N/A" if empty or missing.  
      - Constructs a multiline Slack message with headings and bullet points per category.  
    - Inputs: JSON from Get Task details node  
    - Outputs: Object with `text` property containing Slack message string  
    - Edge cases: Malformed or missing JSON fields, empty arrays, parsing exceptions.  

---

#### 1.5 Notification Delivery

- **Overview:**  
  Sends the formatted competitor research summary message to Slack via HTTP POST.

- **Nodes Involved:**  
  - Send to Slack

- **Node Details:**  
  - **Send to Slack**  
    - Type: `HTTP Request`  
    - Role: Posts the formatted message to Slack webhook or API endpoint.  
    - Configuration:  
      - Method: POST  
      - URL: Not specified in JSON (must be configured with Slack webhook URL or Slack API chat.postMessage endpoint)  
      - Body parameters: JSON with `text` field from previous node output  
      - Sends body as JSON  
    - Inputs: JSON with message text from Generate Slack message node  
    - Outputs: Slack API response  
    - Edge cases: Missing Slack URL, invalid webhook URL, auth failure, Slack rate limits, malformed message content.  

---

### 3. Summary Table

| Node Name           | Node Type           | Functional Role                              | Input Node(s)         | Output Node(s)       | Sticky Note                                                |
|---------------------|---------------------|----------------------------------------------|-----------------------|----------------------|------------------------------------------------------------|
| Webhook             | Webhook             | Receives task status callbacks from Browser Use Cloud | None                  | If                   |                                                            |
| If                  | If                  | Filters for finished tasks from this workflow's source | Webhook               | Get Task details      |                                                            |
| On form submission  | Form Trigger        | Captures competitor name input from user form | None                  | BrowserUse Run Task   |                                                            |
| BrowserUse Run Task  | HTTP Request        | Initiates competitor research task on Browser Use Cloud | On form submission    | None (async)          | Authenticated with Browser Use API Key                      |
| Get Task details     | HTTP Request        | Retrieves detailed task output by session ID | If                    | Generate Slack message| Authenticated with Browser Use API Key                      |
| Generate Slack message | Code (JavaScript)  | Parses JSON output and formats Slack message | Get Task details       | Send to Slack         |                                                            |
| Send to Slack        | HTTP Request        | Sends formatted message to Slack channel     | Generate Slack message | None                 | Slack URL must be configured in node parameters             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node**  
   - Name: `On form submission`  
   - Type: `Form Trigger`  
   - Configure form title as "Run Competitor Analysis"  
   - Add one required text field labeled "Competitor Name" with placeholder "(e.g. OpenAI)"  

2. **Create HTTP Request Node to Start Browser Use Task**  
   - Name: `BrowserUse Run Task`  
   - Type: `HTTP Request`  
   - Set method to POST  
   - Set URL to `https://api.browser-use.com/api/v1/run-task`  
   - Set authentication to HTTP Bearer Auth using Browser Use API Key credentials (create credentials if needed)  
   - In JSON Body, construct a task request using an expression to insert `Competitor Name` from form input:  
     ```json
     {
       "task": "Do exhaustive research on {{ $json['Competitor Name'] }} and extract all pricing information, job postings, new features and announcements",
       "save_browser_data": true,
       "structured_output_json": "{ \"pricing\": {\"plans\": [\"string\"], \"prices\": [\"string\"], \"features\": [\"string\"]}, \"jobs\": {\"titles\": [\"string\"], \"departments\": [\"string\"], \"locations\": [\"string\"]}, \"new_features\": {\"titles\": [\"string\"], \"description\": [\"string\"]}, \"announcements\": {\"titles\": [\"string\"], \"description\": [\"string\"]}}",
       "metadata": {"source": "n8n-competitor-demo"}
     }
     ```
   - Connect `On form submission` node main output to this node’s input  

3. **Create Webhook Node to Receive Task Status Callbacks**  
   - Name: `Webhook`  
   - Type: `Webhook`  
   - Set HTTP Method to POST  
   - Set path to `get-research-data` (must match Browser Use Cloud callback URL configuration)  

4. **Create If Node to Filter Completed Tasks**  
   - Name: `If`  
   - Type: `If`  
   - Add two conditions (AND):  
     - Expression: `{{$json["body"]["payload"]["status"]}}` equals `finished`  
     - Expression: `{{$json["body"]["payload"]["metadata"]["source"]}}` equals `n8n-competitor-demo`  
   - Connect `Webhook` node output to this `If` node input  

5. **Create HTTP Request Node to Get Task Details**  
   - Name: `Get Task details`  
   - Type: `HTTP Request`  
   - Set URL as expression: `https://api.browser-use.com/api/v1/task/{{ $json.body.payload.session_id }}`  
   - Use HTTP Bearer Auth with Browser Use API Key credentials  
   - Connect `If` node’s true output to this node  

6. **Create Code Node to Generate Slack Message**  
   - Name: `Generate Slack message`  
   - Type: `Code` (JavaScript)  
   - Paste the following script:
     ```javascript
     const output_data = $input.first().json.output;
     const data = JSON.parse(output_data);

     const pricing = data?.pricing;
     const jobs = data?.jobs;
     const newFeatures = data?.new_features;
     const announcements = data?.announcements;

     const formatAsBullets = (arr, prefix = "• ") => {
       if (!arr || arr.length === 0) return "• N/A";
       return arr.map(item => `${prefix}${item}`).join("\n");
     };

     return {
       text: `🏷️ *Pricing*
     Plans:
     ${formatAsBullets(pricing?.plans)}

     Prices:
     ${formatAsBullets(pricing?.prices)}

     Features:
     ${formatAsBullets(pricing?.features)}

     💼 *Jobs*
     Titles:
     ${formatAsBullets(jobs?.titles)}

     Departments:
     ${formatAsBullets(jobs?.departments)}

     Locations:
     ${formatAsBullets(jobs?.locations)}

     ✨ *New Features*
     Titles:
     ${formatAsBullets(newFeatures?.titles)}

     Description:
     ${formatAsBullets(newFeatures?.description)}

     📢 *Announcements*
     ${formatAsBullets(announcements?.description)}`
     };
     ```
   - Connect `Get Task details` node output to this node  

7. **Create HTTP Request Node to Send to Slack**  
   - Name: `Send to Slack`  
   - Type: `HTTP Request`  
   - Set method to POST  
   - Set URL to your Slack Incoming Webhook URL or Slack API endpoint (must be configured)  
   - Set Body Parameters with one parameter:  
     - Name: `text`  
     - Value: Expression `{{ $json.text }}`  
   - Send body as JSON  
   - Connect `Generate Slack message` output to this node  

8. **Configure Credentials**  
   - Create or import Browser Use API Key credentials for HTTP Bearer Authentication used in `BrowserUse Run Task` and `Get Task details` nodes.  
   - Setup Slack Incoming Webhook URL or Slack OAuth token with correct permissions for `Send to Slack` node.  

9. **Connect Node Flow**  
   - `On form submission` → `BrowserUse Run Task`  
   - `Webhook` → `If`  
   - `If` (true output) → `Get Task details` → `Generate Slack message` → `Send to Slack`  

10. **Test Workflow**  
    - Submit form with a competitor name  
    - Confirm Browser Use task is created  
    - Confirm webhook receives finished status  
    - Confirm Slack message received with formatted competitor data  

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                     |
|---------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| The workflow uses Browser Use Cloud API for AI-driven browsing and research automation.                        | https://browser-use.com/                                                                           |
| Slack message formatting uses simple markdown with bullet points and emoji headers for readability.           | Slack message formatting reference: https://api.slack.com/reference/surfaces/formatting           |
| The API key credential for Browser Use must have permissions to create tasks and get task details.            | Browser Use API Keys management in Browser Use Cloud dashboard                                     |
| Webhook URL path `get-research-data` must be configured in Browser Use Cloud to receive task status callbacks. | Browser Use webhook integration setup documentation                                               |
| This workflow illustrates integration of asynchronous API callbacks with conditional filtering in n8n.        | n8n documentation on Webhooks and If node usage                                                  |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to content policies and contains no illegal, offensive, or protected elements. All processed data are legal and public.