Automated AI & LLM Newsletter with BrowserAI and email/Telegram Delivery

https://n8nworkflows.xyz/workflows/automated-ai---llm-newsletter-with-browserai-and-email-telegram-delivery-7975


# Automated AI & LLM Newsletter with BrowserAI and email/Telegram Delivery

### 1. Workflow Overview

This workflow automates the generation and delivery of a daily newsletter focused on the latest news, articles, and updates related to Artificial Intelligence (AI) and Large Language Models (LLMs). It leverages BrowserAI's API to crawl and summarize relevant content up to the previous day, then distributes the cleaned summary via both email and Telegram.

The workflow is logically divided into the following blocks:

- **1.1 Schedule & Date Calculation:** Triggers the workflow daily at 8 AM and calculates yesterday’s date to set the temporal boundary for the news search.
- **1.2 BrowserAI Task Creation & Monitoring:** Creates a task on BrowserAI to summarize AI news up to yesterday's date, then polls the task status until completion.
- **1.3 Output Processing & Delivery:** Cleans the raw summary output from BrowserAI and sends it to configured email and Telegram recipients.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule & Date Calculation

- **Overview:**  
Starts the workflow daily at 8 AM and computes yesterday’s date formatted as `dd-MONTH-yyyy`. This date is used to set the news cutoff for the BrowserAI crawler.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get yesterday's date  
  - Sticky Note (Start the workflow at 8AM each day and get yesterday's date)

- **Node Details:**

  - **Schedule Trigger**  
    - *Type:* Schedule Trigger  
    - *Role:* Initiates workflow once daily at a fixed hour (8 AM).  
    - *Configuration:* Set to trigger at hour 8 every day.  
    - *Inputs:* None (trigger node)  
    - *Outputs:* Connects to "Get yesterday's date" node.  
    - *Edge Cases:* Misconfiguration can cause no trigger or multiple triggers per day.

  - **Get yesterday's date**  
    - *Type:* Code  
    - *Role:* Calculates the date string for the previous day relative to the workflow trigger timestamp.  
    - *Configuration:* JavaScript code subtracts one day from the trigger timestamp and formats it as `dd-MONTH-yyyy` (e.g., 21-January-2024).  
    - *Inputs:* Receives workflow trigger timestamp from Schedule Trigger.  
    - *Outputs:* Outputs `formattedYesterday` in JSON for downstream use.  
    - *Edge Cases:* If workflow trigger timestamp is missing or malformed, calculation may fail.

  - **Sticky Note**  
    - Displays high-level explanation: "Start the workflow at 8AM each day and get yesterday's date."

---

#### 2.2 BrowserAI Task Creation & Monitoring

- **Overview:**  
Creates a new BrowserAI crawling task instructing it to summarize AI and LLM news up to yesterday’s date, then continuously checks the task status every 30 seconds until it is finalized.

- **Nodes Involved:**  
  - Create a new task  
  - Get task's metadata  
  - Wait for BrowserAI status change  
  - Check if finished (switch)  
  - Sticky Notes (for task creation and status monitoring)

- **Node Details:**

  - **Create a new task**  
    - *Type:* HTTP Request (POST)  
    - *Role:* Sends a POST request to BrowserAI API to initiate a new crawling task with instructions.  
    - *Configuration:*  
      - URL: `https://browser.ai/api/v1/tasks`  
      - JSON body includes instructions to summarize AI news up to `{{ $json.formattedYesterday }}`.  
      - Geographic filter set to US.  
      - Uses HTTP Bearer authentication with stored BrowserAI API token.  
    - *Inputs:* Receives `formattedYesterday` from "Get yesterday's date".  
    - *Outputs:* Outputs task metadata including `executionId`.  
    - *Edge Cases:* API authentication errors, malformed request body, network timeouts.  
    - *Sticky Note:* Explains usage and links BrowserAI API docs for task creation.

  - **Get task's metadata**  
    - *Type:* HTTP Request (GET)  
    - *Role:* Retrieves current status and results of the created BrowserAI task using its `executionId`.  
    - *Configuration:*  
      - URL constructed dynamically: `https://browser.ai/api/v1/tasks/{{ executionId }}`  
      - Uses same HTTP Bearer authentication.  
    - *Inputs:* Gets `executionId` from previous node.  
    - *Outputs:* Provides current task status and partial or final results.  
    - *Edge Cases:* API errors, invalid `executionId`, rate limits.  
    - *Sticky Note:* Explains status polling and links BrowserAI API docs for metadata retrieval.

  - **Wait for BrowserAI status change**  
    - *Type:* Wait  
    - *Role:* Delays workflow execution for 30 seconds before checking the task status again.  
    - *Configuration:* Wait for 30 seconds.  
    - *Inputs:* Receives task metadata.  
    - *Outputs:* Connects back to status check node to form polling loop.  
    - *Edge Cases:* If wait node fails or is interrupted, could cause indefinite wait or premature continuation.

  - **Check if finished (switch)**  
    - *Type:* Switch  
    - *Role:* Evaluates if the BrowserAI task status is `"finalized"`.  
    - *Configuration:* Checks if `status` field equals `"finalized"`.  
    - *Inputs:* Receives metadata from "Wait for BrowserAI status change".  
    - *Outputs:*  
      - If finalized: routes to output cleaning and delivery.  
      - Else: routes back to "Get task's metadata" to continue polling.  
    - *Edge Cases:* Unexpected or missing status values could cause infinite loops or premature stops.

  - **Sticky Notes**  
    - Provide explanations and usage tips for task creation and status checking.

---

#### 2.3 Output Processing & Delivery

- **Overview:**  
Processes the raw summary text from BrowserAI by removing markdown-like prefixes, then sends the cleaned text as a newsletter via Telegram and email.

- **Nodes Involved:**  
  - Clean output  
  - Send a text message (Telegram)  
  - Send email  
  - Sticky Note (delivery explanation)

- **Node Details:**

  - **Clean output**  
    - *Type:* Code  
    - *Role:* Cleans the raw summary string by removing "**Title:**" and "**Description:**" prefixes for readability.  
    - *Configuration:* JavaScript replaces occurrences of these labels with empty strings.  
    - *Inputs:* Receives BrowserAI summary text from finalized task metadata.  
    - *Outputs:* Provides `cleanedText` JSON for sending nodes.  
    - *Edge Cases:* If input text is missing or not a string, may cause errors or no cleaning effect.

  - **Send a text message (Telegram)**  
    - *Type:* Telegram node  
    - *Role:* Sends the cleaned newsletter text to a configured Telegram chat.  
    - *Configuration:*  
      - Uses Telegram Bot API credentials.  
      - Text content is `{{ $json.cleanedText }}`.  
      - Chat ID must be specified (`DESTINATION_CHAT_ID` placeholder).  
      - Attribution appended disabled.  
    - *Inputs:* Receives cleaned text JSON.  
    - *Outputs:* None (terminal).  
    - *Edge Cases:* Invalid chat ID, expired bot token, network errors.

  - **Send email**  
    - *Type:* Email Send  
    - *Role:* Sends the newsletter via SMTP email to a specified recipient.  
    - *Configuration:*  
      - Text body: `{{ $json.cleanedText }}`  
      - Subject fixed as "Your daily AI & LLM newsletter is here!"  
      - From and To email addresses must be configured.  
      - SMTP credentials configured.  
      - Plain text format.  
    - *Inputs:* Receives cleaned text JSON.  
    - *Outputs:* None (terminal).  
    - *Edge Cases:* SMTP auth failures, invalid email addresses, network timeouts.

  - **Sticky Note**  
    - Highlights to fill in Telegram chat ID and email credentials for successful delivery.

---

### 3. Summary Table

| Node Name                  | Node Type           | Functional Role                             | Input Node(s)             | Output Node(s)                 | Sticky Note                                                                                                 |
|----------------------------|---------------------|--------------------------------------------|---------------------------|-------------------------------|-------------------------------------------------------------------------------------------------------------|
| Schedule Trigger           | Schedule Trigger    | Daily trigger at 8 AM                      | None                      | Get yesterday's date           | Start the workflow at 8AM each day and get yesterday's date                                                 |
| Get yesterday's date       | Code                | Compute formatted yesterday's date        | Schedule Trigger           | Create a new task              | Start the workflow at 8AM each day and get yesterday's date                                                 |
| Create a new task          | HTTP Request (POST) | Create BrowserAI task with instructions   | Get yesterday's date       | Get task's metadata            | Create a BrowserAI task. See https://docs.browser.ai/api-reference/endpoint/tasks for more details          |
| Get task's metadata        | HTTP Request (GET)  | Retrieve task status and results           | Create a new task / Wait for BrowserAI status change | Wait for BrowserAI status change | Wait for the task to be completed by checking its status. See https://docs.browser.ai/api-reference/endpoint/taskMetadata |
| Wait for BrowserAI status change | Wait         | Pause 30 seconds before status check       | Get task's metadata        | Check if finished              |                                                                                                             |
| Check if finished          | Switch              | Check if BrowserAI task is finalized       | Wait for BrowserAI status change | Clean output / Get task's metadata |                                                                                                             |
| Clean output               | Code                | Remove markdown prefixes from summary      | Check if finished          | Send a text message / Send email |                                                                                                             |
| Send a text message        | Telegram            | Send newsletter via Telegram                | Clean output               | None                          | Send it to your email/Telegram. Fill in your telegram chat ID and credentials.                              |
| Send email                 | Email Send          | Send newsletter via email                   | Clean output               | None                          | Send it to your email/Telegram. Fill in your email credentials.                                             |
| Sticky Note                | Sticky Note         | Explanation for Schedule & Date block      | None                      | None                          | Start the workflow at 8AM each day and get yesterday's date                                                 |
| Sticky Note1               | Sticky Note         | Explanation for BrowserAI task creation    | None                      | None                          | Create a BrowserAI task. See https://docs.browser.ai/api-reference/endpoint/tasks for more details          |
| Sticky Note2               | Sticky Note         | Explanation for task status monitoring      | None                      | None                          | Wait for the task to be completed. See https://docs.browser.ai/api-reference/endpoint/taskMetadata          |
| Sticky Note3               | Sticky Note         | Explanation for delivery nodes              | None                      | None                          | Send it to your email/Telegram. Fill in your telegram chat ID and email credentials.                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 8 AM (hour 8).  
   - No input connections.  

2. **Create Code Node "Get yesterday's date"**  
   - Connect input from Schedule Trigger.  
   - JavaScript code:  
     - Reads trigger timestamp, subtracts one day, formats date as `dd-MONTH-yyyy` (e.g., 21-January-2024).  
     - Outputs JSON property `formattedYesterday`.  

3. **Create HTTP Request Node "Create a new task"**  
   - Connect input from "Get yesterday's date".  
   - Method: POST  
   - URL: `https://browser.ai/api/v1/tasks`  
   - Authentication: HTTP Bearer with BrowserAI API token credential.  
   - Request body (JSON):  
     ```json
     {
       "instructions": [
         {
           "action": "Please summarize me all the latest news, articles and updates regarding AI and LLMs up to {{ $json.formattedYesterday }}, including title, description and source"
         }
       ],
       "geoLocation": {
         "country": "us"
       },
       "project": "Project_1",
       "type": "crawler_automation",
       "inspect": true
     }
     ```  
   - Send body as JSON.  

4. **Create HTTP Request Node "Get task's metadata"**  
   - Connect input from "Create a new task".  
   - Method: GET  
   - URL: `https://browser.ai/api/v1/tasks/{{ $('Create a new task').item.json.executionId }}` (dynamic expression).  
   - Authentication: HTTP Bearer with BrowserAI API token credential.  

5. **Create Wait Node "Wait for BrowserAI status change"**  
   - Connect input from "Get task's metadata".  
   - Wait for 30 seconds.  

6. **Create Switch Node "Check if finished"**  
   - Connect input from "Wait for BrowserAI status change".  
   - Condition: Check if `status` from "Get task's metadata" equals `"finalized"`.  
   - If yes: connect to "Clean output".  
   - If no: connect back to "Get task's metadata" (creates polling loop).  

7. **Create Code Node "Clean output"**  
   - Connect input from "Check if finished" (finalized path).  
   - JavaScript code to remove "**Title:**" and "**Description:**" prefixes from BrowserAI summary text in `result` field.  
   - Outputs cleaned text as `cleanedText`.  

8. **Create Telegram Node "Send a text message"**  
   - Connect input from "Clean output".  
   - Configure Telegram API credentials with bot token.  
   - Set chat ID to your target Telegram chat.  
   - Message text: `{{ $json.cleanedText }}`.  
   - Disable attribution.  

9. **Create Email Send Node "Send email"**  
   - Connect input from "Clean output".  
   - Configure SMTP credentials for your email provider.  
   - Set "toEmail" and "fromEmail" addresses.  
   - Subject: "Your daily AI & LLM newsletter is here!"  
   - Email format: plain text.  
   - Text body: `{{ $json.cleanedText }}`.  

10. **Add Sticky Notes (optional)**  
    - Add notes describing each major block for clarity and maintenance.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                | Context or Link                                                                                       |
|-----------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow triggers daily at 8 AM and summarizes AI & LLM news from BrowserAI, then sends it via Telegram and email.     | General workflow purpose                                                                              |
| BrowserAI API documentation for task creation: https://docs.browser.ai/api-reference/endpoint/tasks                         | Reference for HTTP Request "Create a new task"                                                      |
| BrowserAI API documentation for task metadata retrieval: https://docs.browser.ai/api-reference/endpoint/taskMetadata        | Reference for HTTP Request "Get task's metadata"                                                    |
| Telegram node requires a Bot API token and valid chat ID for message delivery.                                               | Telegram bot setup details                                                                           |
| Email node requires SMTP credentials and configured from/to email addresses.                                                 | Email delivery setup                                                                                |
| Replace placeholder `DESTINATION_CHAT_ID` and email addresses with actual values before activating workflow.                | Critical configuration detail                                                                        |

---

**Disclaimer:** The provided text originates exclusively from an automated n8n workflow, adhering strictly to content policies with no illegal or protected content. All data handled is legal and public.