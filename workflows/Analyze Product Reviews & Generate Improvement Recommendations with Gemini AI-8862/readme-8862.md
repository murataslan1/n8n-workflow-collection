Analyze Product Reviews & Generate Improvement Recommendations with Gemini AI

https://n8nworkflows.xyz/workflows/analyze-product-reviews---generate-improvement-recommendations-with-gemini-ai-8862


# Analyze Product Reviews & Generate Improvement Recommendations with Gemini AI

### 1. Workflow Overview

This n8n workflow, titled **"Analyze Product Reviews & Generate Improvement Recommendations with Gemini AI"**, automates the process of scraping product reviews, analyzing their sentiment, and generating actionable improvement recommendations using AI. It is designed for product managers, marketers, and customer experience teams who want to gain insights from user feedback efficiently.

The workflow is logically divided into four main blocks:

- **1.1 Input Reception & Scraping Initiation**: Trigger the workflow manually and start a scraping task via the BrowserAct API to collect product reviews.

- **1.2 Scraping Status Monitoring**: Periodically check the status of the scraping task, waiting and retrying until the data is ready.

- **1.3 AI Processing & Analysis**: Use an AI Agent powered by Google Gemini to analyze review summaries and generate improvement recommendations.

- **1.4 Notification Delivery**: Send the generated recommendations to stakeholders via Telegram and Email.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Scraping Initiation

**Overview:**  
This block allows manual triggering of the workflow and initiates a review scraping task through the BrowserAct API.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- HTTP Request (Start scraping task)  
- If (Check task creation success)  
- Wait1 (Pause before retry if task creation failed)

**Node Details:**  

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Starts the workflow manually  
  - Configuration: No parameters; this node waits for user execution  
  - Inputs: None  
  - Outputs: Connects to HTTP Request node  
  - Edge Cases: None (manual)  

- **HTTP Request**  
  - Type: HTTP Request  
  - Role: Starts a task on BrowserAct API to scrape product reviews  
  - Configuration:  
    - POST request to `https://api.browseract.com/v2/workflow/run-task`  
    - Body includes workflow_id (fixed: "53146166844202600")  
    - Authorization: HTTP Bearer Token via BrowserAct API credentials  
    - Retry enabled on failure  
  - Key Expressions: None dynamic; static workflow_id  
  - Input: Manual Trigger  
  - Output: Connects to If node for validation  
  - Error Handling: Continues on error but flagged in output JSON  
  - Potential Failures: Auth errors, network timeout, API errors  

- **If**  
  - Type: Conditional Check  
  - Role: Validates if the scraping task was created successfully  
  - Configuration:  
    - Checks that no `error` field exists in response JSON  
    - Confirms `id` field is not "null"  
  - Input: HTTP Request node output  
  - Outputs:  
    - True: proceed to HTTP Request1 node  
    - False: proceed to Wait1 node (retry)  
  - Edge Cases: Unexpected response structure or missing fields  

- **Wait1**  
  - Type: Wait  
  - Role: Pause workflow for 1 minute before retrying task creation  
  - Configuration: Wait 1 minute  
  - Input: If node (false branch)  
  - Output: Loops back to HTTP Request node to retry  
  - Edge Cases: Excessive retries may cause delays or API rate limits  

---

#### 1.2 Scraping Status Monitoring

**Overview:**  
This block polls the BrowserAct API to check if the scraping task has finished, waiting between retries if necessary.

**Nodes Involved:**  
- HTTP Request1 (Get task status)  
- If1 (Check if scraping is finished)  
- Wait (Pause before retry if task incomplete)

**Node Details:**  

- **HTTP Request1**  
  - Type: HTTP Request  
  - Role: Retrieves the status and results of the scraping task  
  - Configuration:  
    - GET request to `https://api.browseract.com/v2/workflow/get-task`  
    - Query parameter `task_id` set dynamically from previous HTTP Request response (`={{ $json.id }}`)  
    - Authorization: HTTP Bearer Token via BrowserAct API credentials  
  - Inputs: From If node (true branch)  
  - Outputs: Connects to If1 node  
  - Potential Failures: Invalid task_id, auth errors, network issues  

- **If1**  
  - Type: Conditional Check  
  - Role: Checks if the scraping task status is "finished"  
  - Configuration:  
    - Confirms no `error` field present  
    - Confirms `status` field equals "finished"  
  - Inputs: HTTP Request1 node output  
  - Outputs:  
    - True: proceed to AI Agent node  
    - False: proceed to Wait node (retry)  
  - Edge Cases: Partial or malformed responses  

- **Wait**  
  - Type: Wait  
  - Role: Pause workflow for 1 minute before rechecking task status  
  - Configuration: Wait 1 minute  
  - Inputs: If1 node (false branch)  
  - Outputs: Loops back to HTTP Request1 node  
  - Edge Cases: Excessive retries, API rate limiting  

---

#### 1.3 AI Processing & Analysis

**Overview:**  
This block analyzes the scraped product reviews using an AI Agent powered by Google Gemini to generate improvement recommendations.

**Nodes Involved:**  
- Google Gemini Chat Model (Language Model)  
- AI Agent (Analyze reviews and generate recommendations)  
- Send a text message1 (Telegram notification)  

**Node Details:**  

- **Google Gemini Chat Model**  
  - Type: Language Model (Google Gemini)  
  - Role: Provides advanced natural language processing capabilities to the AI Agent  
  - Configuration: Uses Google Gemini API credentials  
  - Input: Connected as an internal languageModel for AI Agent node  
  - Outputs: To AI Agent node as language model backend  
  - Potential Failures: API limits, auth errors, latency  

- **AI Agent**  
  - Type: AI Agent (LangChain Agent Node)  
  - Role:  
    - Receives scraped review data (`output.string` from previous HTTP Request1 node)  
    - Parses review summaries (expects list of maps with "Name", "Rating", "Summary")  
    - Performs sentiment analysis on each summary  
    - Generates actionable improvement recommendations  
    - Sends output text for notifications  
  - Configuration:  
    - Custom prompt instructing detailed analysis and multi-channel output requests  
    - Uses Google Gemini as language model  
    - Integrates with Telegram and Email send tools (via ai_tool connections)  
  - Inputs: From If1 node (true branch)  
  - Outputs: To Telegram notification node  
  - Edge Cases: Unexpected input formats, empty reviews, API or prompt execution errors  

- **Send a text message1**  
  - Type: Telegram node  
  - Role: Sends generated recommendations as Telegram message to group `@shoaywbs`  
  - Configuration:  
    - Text dynamically pulled from AI Agent output (`={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('Text', ``, 'string') }}`)  
    - Uses Telegram API credentials  
  - Input: AI Agent node output  
  - Outputs: Connects to Send email node  
  - Edge Cases: Invalid chat ID, Telegram API downtime  

---

#### 1.4 Notification Delivery

**Overview:**  
This block sends the AI-generated recommendations via email and Telegram for stakeholder notification.

**Nodes Involved:**  
- Send email  
- Send email in Send Email (linked as ai_tool in AI Agent)  
- Send a text message in Telegram (linked as ai_tool in AI Agent)  

**Node Details:**  

- **Send email**  
  - Type: Email Send  
  - Role: Sends the recommendation text as an email to a specified recipient  
  - Configuration:  
    - Subject: "Recommendation"  
    - To: "smj.kshp@gmail.com" (example recipient)  
    - From: "test@test" (configured sender)  
    - Text body: AI Agent output JSON field `output`  
    - Uses SMTP credentials for email delivery  
  - Input: From Telegram message node  
  - Outputs: None (terminal node)  
  - Edge Cases: SMTP auth failure, invalid email addresses  

- **Send email in Send Email**  
  - Type: Email Send Tool (used as ai_tool by AI Agent)  
  - Role: Available for AI Agent to send emails internally if needed  
  - Configuration: Similar to Send email node but controlled by AI Agent  
  - Inputs: AI Agent node (ai_tool connection)  
  - Outputs: None  
  - Edge Cases: Same as Send email node  

- **Send a text message in Telegram**  
  - Type: Telegram Tool (used as ai_tool by AI Agent)  
  - Role: Available for AI Agent to send Telegram messages internally if needed  
  - Configuration: Chat ID `@shoaywbs`, uses Telegram credentials  
  - Inputs: AI Agent node (ai_tool connection)  
  - Outputs: None  
  - Edge Cases: Same as Send a text message1 node  

---

### 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                                      | Input Node(s)          | Output Node(s)               | Sticky Note                                                                                                     |
|--------------------------------|----------------------------------|-----------------------------------------------------|-----------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’| Manual Trigger                   | Manual start of workflow                             | None                  | HTTP Request                |                                                                                                                |
| HTTP Request                   | HTTP Request                     | Start scraping task via BrowserAct API              | Manual Trigger        | If                         |                                                                                                                |
| If                            | If                              | Check if scraping task created successfully          | HTTP Request          | HTTP Request1 (true), Wait1 (false) |                                                                                                                |
| Wait1                         | Wait                            | Pause 1 minute before retrying task creation         | If (false branch)     | HTTP Request                |                                                                                                                |
| HTTP Request1                 | HTTP Request                     | Retrieve scraping task status and data               | If (true branch)      | If1                        |                                                                                                                |
| If1                           | If                              | Check if scraping task is finished                    | HTTP Request1         | AI Agent (true), Wait (false) |                                                                                                                |
| Wait                          | Wait                            | Pause 1 minute before retrying task status check     | If1 (false branch)    | HTTP Request1               |                                                                                                                |
| Google Gemini Chat Model       | AI Language Model                | Provide language model backend for AI Agent          | None                  | AI Agent                   |                                                                                                                |
| AI Agent                      | AI Agent (LangChain)             | Analyze reviews, generate recommendations, trigger notifications | If1 (true branch), Google Gemini Chat Model (lmChat) | Send a text message1           | Contains complex prompt for review analysis and recommendation generation. See https://docs.n8n.io/integrations/builtin/ai/agent-nodes/n8n-nodes-langchain.agent/ |
| Send a text message1          | Telegram                        | Send recommendations to Telegram group                | AI Agent              | Send email                 |                                                                                                                |
| Send email                   | Email Send                      | Send recommendations via email                         | Send a text message1  | None                      |                                                                                                                |
| Send email in Send Email     | Email Send Tool (ai_tool)       | AI Agent’s internal email sender                       | AI Agent (ai_tool)    | None                      |                                                                                                                |
| Send a text message in Telegram | Telegram Tool (ai_tool)        | AI Agent’s internal Telegram sender                    | AI Agent (ai_tool)    | None                      |                                                                                                                |
| Sticky Note-Start             | Sticky Note                    | Overview and instructions for the workflow            | None                  | None                      | ## Try It Out! ... Join the [Discord](https://discord.com/invite/UpnCKd7GaU) or Visit Our [Blog](https://www.browseract.com/blog)! |
| Sticky Note-Scraping          | Sticky Note                    | Explanation of scraping initiation                     | None                  | None                      | ## 1. Trigger the Product Review Scraper ...                                                                   |
| Sticky Note-Wait              | Sticky Note                    | Explanation of waiting and retry logic                 | None                  | None                      | ## 2. Wait for Scraping to Finish ...                                                                           |
| Sticky Note3                  | Sticky Note                    | Explanation of AI Agent usage                           | None                  | None                      | ## 3. Use an AI Agent to Analyze Reviews and Generate Recommendations ... [Read more about the AI Agent node](https://docs.n8n.io/integrations/builtin/ai/agent-nodes/n8n-nodes-langchain.agent/) |
| Sticky Note4                  | Sticky Note                    | Explanation of notification delivery                    | None                  | None                      | ## 4. Send the Recommendations via Email and Telegram ... [Read more about the Email Send node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.emailSend/) [Read more about the Telegram node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To start the workflow manually.

2. **Add HTTP Request Node to Start Scraping Task**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.browseract.com/v2/workflow/run-task`  
   - Authentication: HTTP Bearer Auth with BrowserAct API credentials  
   - Body Parameters: JSON with `workflow_id` set to `"53146166844202600"`  
   - Retry On Fail: Enabled  
   - Connect Manual Trigger output to this node.

3. **Add If Node to Check Task Creation Success**  
   - Type: If  
   - Conditions (AND):  
     - `error` field does NOT exist in JSON response  
     - `id` field is NOT equal to `"null"`  
   - Connect HTTP Request output to this node.

4. **Add Wait Node (Wait1) for Retry Delay**  
   - Type: Wait  
   - Duration: 1 minute  
   - Connect If node (false output) to this Wait node.

5. **Connect Wait1 back to HTTP Request**  
   - Creates retry loop if task creation failed.

6. **Add HTTP Request Node to Get Scraping Task Status**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.browseract.com/v2/workflow/get-task`  
   - Query Parameter: `task_id` set dynamically from previous HTTP Request output (`={{ $json.id }}`)  
   - Authentication: HTTP Bearer Auth with BrowserAct API credentials  
   - Connect If node (true output) to this node.

7. **Add If Node (If1) to Check if Scraping is Finished**  
   - Type: If  
   - Conditions (AND):  
     - `error` field does NOT exist  
     - `status` field equals `"finished"`  
   - Connect HTTP Request1 output to this node.

8. **Add Wait Node (Wait) for Status Polling Delay**  
   - Type: Wait  
   - Duration: 1 minute  
   - Connect If1 node (false output) to this Wait node.

9. **Connect Wait back to HTTP Request1**  
   - Creates polling retry loop until scraping finishes.

10. **Add Google Gemini Chat Model Node**  
    - Type: AI Language Model (Google Gemini)  
    - Configure with Google Palm API credentials  
    - No direct input connections; link from AI Agent node’s language model input.

11. **Add AI Agent Node**  
    - Type: AI Agent (LangChain Agent)  
    - Configure prompt:  
      - Analyze the review summaries from scraped data (accessed via `{{ $json.output.string }}`)  
      - Perform sentiment analysis on each summary  
      - Generate improvement recommendations  
      - Prepare output text for notifications  
    - Link Google Gemini Chat Model node as language model backend  
    - Connect If1 node (true output) to AI Agent node.

12. **Add Telegram Node to Send Recommendations**  
    - Type: Telegram  
    - Chat ID: `@shoaywbs` (Telegram group/channel)  
    - Message Text: Dynamically from AI Agent output (override text from AI)  
    - Connect AI Agent output to this node.

13. **Add Email Send Node to Email Recommendations**  
    - Type: Email Send  
    - SMTP Credentials configured for your email provider  
    - From Email: e.g. `test@test`  
    - To Email: e.g. `smj.kshp@gmail.com`  
    - Subject: "Recommendation"  
    - Email Body: AI Agent output text  
    - Connect Telegram node output to this node.

14. **Configure AI Agent’s ai_tool Connections**  
    - Add Email Send Tool node and Telegram Tool node with similar settings as above.  
    - Connect both as ai_tool inputs to AI Agent node to enable AI-driven messaging if needed.

15. **Optionally, add Sticky Notes**  
    - Add descriptive sticky notes explaining each block for better documentation and maintainability.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                   | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow demonstrates product review sentiment analysis and recommendation generation using the BrowserAct API and Google Gemini AI Agent.                                                                              | Overview and workflow concept                                                                        |
| Join the [Discord community](https://discord.com/invite/UpnCKd7GaU) or visit the [BrowserAct Blog](https://www.browseract.com/blog) for support and updates.                                                                  | Support and additional resources                                                                    |
| AI Agent node documentation: https://docs.n8n.io/integrations/builtin/ai/agent-nodes/n8n-nodes-langchain.agent/                                                                                                               | Official n8n documentation for AI Agent node                                                       |
| Email Send node documentation: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.emailSend/                                                                                                                  | Official n8n documentation for Email Send node                                                     |
| Telegram node documentation: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.telegram/                                                                                                                     | Official n8n documentation for Telegram node                                                      |

---

**Disclaimer:** The provided content is exclusively derived from an automated n8n workflow. It fully complies with content policies and handles only legal and publicly available data.