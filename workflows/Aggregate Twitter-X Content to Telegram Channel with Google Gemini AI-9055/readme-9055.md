Aggregate Twitter/X Content to Telegram Channel with Google Gemini AI

https://n8nworkflows.xyz/workflows/aggregate-twitter-x-content-to-telegram-channel-with-google-gemini-ai-9055


# Aggregate Twitter/X Content to Telegram Channel with Google Gemini AI

### 1. Workflow Overview

This workflow automates the aggregation of social media content from Twitter/X, refines it using Google Gemini AI, and posts curated messages to a Telegram channel. It is designed to run on a scheduled basis (every 12 hours), leveraging external APIs and AI to both collect and process content, ensuring only valuable and concise posts are delivered to subscribers.

The workflow is logically divided into these blocks:

- **1.1 Trigger & Scraping Initiation:** Automatically triggers the scraping job via BrowserAct API to fetch the latest Twitter/X content.
- **1.2 Scraping Status Monitoring:** Polls the status of the scraping task repeatedly until it is finished.
- **1.3 AI Processing:** Uses Google Gemini AI to refine the raw scraped content by summarizing and removing duplicates.
- **1.4 Message Formatting & Sending:** Decides whether to send a photo or text message based on content availability and sends the message to a Telegram channel.
- **1.5 Utility & Control Nodes:** Includes wait nodes, conditional checks, and code transformation to format data appropriately.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Trigger & Scraping Initiation

**Overview:**  
This block initiates the scraping task by calling the BrowserAct API to run a predefined scraping workflow for Twitter/X content.

**Nodes Involved:**  
- Schedule Trigger  
- HTTP Request  

**Node Details:**  
- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Automatically triggers the entire workflow every 12 hours.  
  - Configuration: Interval set to 12 hours.  
  - Inputs: None (trigger node)  
  - Outputs: Connected to HTTP Request node.  
  - Edge Cases: If the workflow is deactivated, scraping won't run. Time zone considerations for scheduling.  

- **HTTP Request**  
  - Type: HTTP Request  
  - Role: Sends a POST request to BrowserAct API to start the scraping job.  
  - Configuration:  
    - URL: `https://api.browseract.com/v2/workflow/run-task`  
    - Method: POST  
    - Body: JSON containing BrowserAct workflow ID (default example: `52606771064261730`)  
    - Authentication: HTTP Bearer token via stored BrowserAct credentials  
    - Retry enabled on failure  
  - Inputs: Trigger from Schedule Trigger  
  - Outputs: Connected to "If" node for error and response validation  
  - Edge Cases: API authentication failure, invalid workflow ID, API downtime, network issues.

---

#### 2.2 Scraping Status Monitoring

**Overview:**  
This block monitors the status of the scraping task by repeatedly polling the BrowserAct API to check if the job is complete, using wait nodes for controlled retries.

**Nodes Involved:**  
- If  
- HTTP Request1  
- If1  
- Wait  
- Wait1  

**Node Details:**  
- **If**  
  - Type: If  
  - Role: Checks if the initial scraping job response is valid (no error and a valid task ID).  
  - Conditions:  
    - `$json.error` does not exist  
    - `$json.id` is not "null"  
  - Inputs: From HTTP Request (start job)  
  - Outputs:  
    - True: Proceed to HTTP Request1 to check task status  
    - False: Proceed to Wait1 node (delay before retry)  
  - Edge Cases: API returns errors or invalid data; task ID missing or null.  

- **HTTP Request1**  
  - Type: HTTP Request  
  - Role: Polls BrowserAct API to get the status of the scraping task using the task ID from previous node.  
  - Configuration:  
    - URL: `https://api.browseract.com/v2/workflow/get-task`  
    - Method: GET  
    - Query parameter: `task_id` set dynamically from previous node's output (`={{ $json.id }}`)  
    - Authentication: BrowserAct HTTP Bearer token  
  - Inputs: From If node (when scraping job started successfully)  
  - Outputs: Connected to If1 node for status check  
  - Edge Cases: API errors, invalid or expired task ID, network errors.  

- **If1**  
  - Type: If  
  - Role: Checks if scraping task is finished.  
  - Conditions:  
    - No error in JSON  
    - `status` equals "finished"  
  - Inputs: From HTTP Request1  
  - Outputs:  
    - True: Proceed to AI Agent block (start AI processing)  
    - False: Proceed to Wait node (pause before retry)  
  - Edge Cases: Task stuck in other statuses, API returning unexpected status values.  

- **Wait**  
  - Type: Wait  
  - Role: Pauses workflow 1 minute before checking status again.  
  - Inputs: From If1 (when task not finished)  
  - Outputs: Loops back to HTTP Request1  
  - Edge Cases: Long waiting times may increase workflow execution duration and resource usage.  

- **Wait1**  
  - Type: Wait  
  - Role: Initial wait for 20 seconds if the first HTTP request to run the task failed or returned invalid response.  
  - Inputs: From If (when initial job start failed)  
  - Outputs: Loops back to HTTP Request (retry start)  
  - Edge Cases: Continuous failures may lead to infinite loop unless workflow is manually stopped.

---

#### 2.3 AI Processing

**Overview:**  
Once the scraping task is completed, this block sends the raw scraped content to the Google Gemini AI agent to refine it by summarizing and removing duplicate posts. The processed output is then transformed into a format suitable for sending.

**Nodes Involved:**  
- AI Agent  
- Google Gemini Chat Model  
- Structured Output Parser  
- Code in JavaScript  

**Node Details:**  
- **Google Gemini Chat Model**  
  - Type: LangChain Google Gemini AI Model  
  - Role: Executes language model inference via Google Gemini API.  
  - Configuration: Uses default model options; credential linked to Google Gemini API account.  
  - Inputs: From AI Agent node (as language model backend)  
  - Outputs: To AI Agent (receives response)  
  - Edge Cases: API key limits, model errors, response timeouts.  

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses AI JSON structured response following the provided schema example.  
  - Configuration: Expects a JSON array of refined posts with fields Title, PublishedBy, Summary, Url, Pic.  
  - Inputs: From AI Agent (AI output)  
  - Outputs: To AI Agent (parsed data)  
  - Edge Cases: Parsing failure if AI output deviates from schema, malformed JSON.  

- **AI Agent**  
  - Type: LangChain Agent Node  
  - Role: Controls the prompt and orchestrates AI processing.  
  - Configuration:  
    - Prompt: Refines the input list of maps, summarizes summaries if needed, removes duplicates, outputs refined JSON list.  
    - Max tries: 2 with 1.5 seconds delay between attempts  
    - Waits for output parser to process AI response  
  - Inputs: From If1 (when scraping finished)  
  - Outputs: To Code in JavaScript node  
  - Edge Cases: AI errors, prompt misformatting, API rate limiting.  

- **Code in JavaScript**  
  - Type: Code Node (JavaScript)  
  - Role: Transforms the refined output array into individual items for downstream processing.  
  - Configuration: Uses JavaScript to iterate over AI agent output and emit each post as a separate item.  
  - Inputs: From AI Agent  
  - Outputs: To If2 node (content dispatch decision)  
  - Edge Cases: Input missing or malformed refined_output property, runtime errors.

---

#### 2.4 Message Formatting & Sending

**Overview:**  
This block decides whether to send a photo message or a text-only message to Telegram, based on the presence of an image URL in the post content. The messages are then sent to a predefined Telegram channel.

**Nodes Involved:**  
- If2  
- Send a text message (Telegram)  
- Send a photo message (Telegram)  

**Node Details:**  
- **If2**  
  - Type: If  
  - Role: Checks if the post has a valid picture URL or if the value is "no picture".  
  - Condition: `Pic` field equals "no picture" (string equality)  
  - Inputs: From Code in JavaScript (each refined post item)  
  - Outputs:  
    - True: Send text message (no picture)  
    - False: Send photo message (with picture)  
  - Edge Cases: Missing Pic property, invalid URLs, case sensitivity in "no picture".  

- **Send a text message**  
  - Type: Telegram Node (sendMessage)  
  - Role: Sends a text-only message to Telegram channel.  
  - Configuration:  
    - Chat ID: Preset channel username (example: `@Test`)  
    - Text: Combines Title, Summary, PublishedBy, and Url fields into formatted message body.  
  - Inputs: From If2 (when no picture)  
  - Outputs: Workflow end  
  - Edge Cases: Telegram API errors, invalid chat ID, message length limits.  

- **Send a photo message**  
  - Type: Telegram Node (sendPhoto)  
  - Role: Sends a photo message with caption to Telegram channel.  
  - Configuration:  
    - Chat ID: Same as text message node  
    - Photo URL: From `Pic` field  
    - Caption: Combines Title, Summary, PublishedBy, and Url fields into formatted caption.  
  - Inputs: From If2 (when picture present)  
  - Outputs: Workflow end  
  - Edge Cases: Invalid or unreachable photo URLs, Telegram API errors, message size limits.

---

#### 2.5 Utility & Control Nodes (Sticky Notes)

**Overview:**  
Sticky Notes provide documentation, instructions, and visual organization for the workflow within n8n. They include usage instructions, node role explanations, and links for help and resources.

**Nodes Involved:**  
- Multiple Sticky Note nodes scattered throughout the workflow for guidance and labeling.

**Node Details:**  
- Provide contextual information such as:  
  - Workflow introduction and purpose  
  - Instructions for credential setup (BrowserAct, Google Gemini, Telegram)  
  - Explanation of scraping, waiting, AI processing, and Telegram sending steps  
  - Links to videos, blogs, and Discord for support  
- No inputs or outputs; purely informational.

---

### 3. Summary Table

| Node Name             | Node Type                          | Functional Role                   | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                           |
|-----------------------|----------------------------------|---------------------------------|-----------------------|------------------------|-----------------------------------------------------------------------------------------------------|
| Schedule Trigger      | Schedule Trigger                  | Initiate scraping every 12 hours | None                  | HTTP Request            |                                                                                                     |
| HTTP Request          | HTTP Request                     | Start BrowserAct scraping job    | Schedule Trigger       | If                      | ## 1. Trigger the Job Scraper - Uses BrowserAct API to start scraping job.                          |
| If                    | If                              | Validate scraping job response   | HTTP Request           | HTTP Request1, Wait1    | ## 2. Wait for Scraping to Finish - Checks if task ID exists and no error to proceed accordingly.   |
| HTTP Request1         | HTTP Request                    | Poll BrowserAct for task status  | If                     | If1                     | ## 2. Wait for Scraping to Finish - Polls scraping task status.                                     |
| If1                   | If                              | Check if scraping finished       | HTTP Request1          | AI Agent, Wait          | ## 2. Wait for Scraping to Finish - Determines if scraping is complete or waits longer.            |
| Wait                  | Wait                            | Pause before next status check   | If1                    | HTTP Request1           | ## 2. Wait for Scraping to Finish - Waits 1 minute before retrying status check.                    |
| Wait1                 | Wait                            | Retry delay if scraping start failed | If                  | HTTP Request            | ## 2. Wait for Scraping to Finish - Waits 20 seconds before retrying scraping job start.            |
| AI Agent              | LangChain Agent                 | Refine scraped content with AI   | If1                    | Code in JavaScript      | ## 3. Refine Content with AI - Uses Google Gemini to summarize and deduplicate posts.               |
| Google Gemini Chat Model | LangChain Google Gemini LM    | AI language model inference      | AI Agent (internal)    | AI Agent (internal)     |                                                                                                     |
| Structured Output Parser | LangChain Output Parser       | Parse AI structured JSON output  | AI Agent (internal)    | AI Agent (internal)     |                                                                                                     |
| Code in JavaScript     | Code                            | Transform refined output to items | AI Agent               | If2                     |                                                                                                     |
| If2                   | If                              | Check if post has picture or not | Code in JavaScript     | Send a text message, Send a photo message | ## 4. Send to Telegram - Routes to proper Telegram node based on image presence.                   |
| Send a text message    | Telegram                        | Send text-only Telegram message  | If2 (true branch)      | None                    | ## 4. Send to Telegram - Sends text message if no picture available.                               |
| Send a photo message   | Telegram                        | Send photo Telegram message      | If2 (false branch)     | None                    | ## 4. Send to Telegram - Sends photo message with caption if picture URL available.                |
| Sticky Note-Intro      | Sticky Note                    | Workflow introduction and summary| None                  | None                    | Contains workflow overview, requirements, and usage summary.                                       |
| Sticky Note-Scraping   | Sticky Note                    | Explains scraping job trigger    | None                  | None                    | Explains BrowserAct job trigger and notes to set workflow ID.                                      |
| Sticky Note-Wait       | Sticky Note                    | Explains scraping status wait    | None                  | None                    | Describes wait and polling logic for scraping completion.                                          |
| Sticky Note-AI         | Sticky Note                    | Explains AI processing step      | None                  | None                    | Describes AI Agent usage and Gemini connection.                                                    |
| Sticky Note-Conditional Send | Sticky Note               | Explains Telegram sending logic  | None                  | None                    | Describes conditional routing to photo or text message nodes.                                     |
| Sticky Note-How to Use | Sticky Note                    | Instructions for setup and usage | None                  | None                    | Stepwise instructions for credential setup, BrowserAct config, and activation.                    |
| Sticky Note-Help       | Sticky Note                    | Links to help videos and tutorials | None                  | None                    | Links to BrowserAct API key and workflow ID videos.                                               |
| Sticky Note-Video      | Sticky Note                    | Link to workflow showcase video  | None                  | None                    | Link to YouTube video demonstrating workflow usage.                                               |
| Sticky Note, Sticky Note1, Sticky Note2, Sticky Note3, Sticky Note4, Sticky Note5, Sticky Note6, Sticky Note7 | Sticky Note | Visual organization and labeling | None                  | None                    | Label nodes for run, get, agent, and send node groups for clarity.                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node**  
   - Set the trigger to run every 12 hours.  
   - Position: Start of workflow.  

2. **Add HTTP Request Node ("HTTP Request")**  
   - Use POST method to `https://api.browseract.com/v2/workflow/run-task`.  
   - Add body parameter: `workflow_id` with your BrowserAct scraping workflow ID (e.g., `52606771064261730`).  
   - Authentication: Configure HTTP Bearer Auth with your BrowserAct API token.  
   - Enable retry on failure.  
   - Connect Schedule Trigger output to this node input.  

3. **Add an If Node ("If") to Validate Scraping Job Start**  
   - Condition 1: `$json.error` does not exist.  
   - Condition 2: `$json.id` is not `"null"`.  
   - Connect HTTP Request output to If input.  

4. **Add HTTP Request Node ("HTTP Request1") to Check Task Status**  
   - Use GET method to `https://api.browseract.com/v2/workflow/get-task`.  
   - Add query parameter `task_id` set to `={{ $json.id }}` from previous node.  
   - Use same BrowserAct HTTP Bearer credentials.  
   - Connect If node’s True output to this node.  

5. **Add If Node ("If1") to Check if Task Finished**  
   - Condition 1: `$json.error` does not exist.  
   - Condition 2: `$json.status` equals `"finished"`.  
   - Connect HTTP Request1 output to If1 input.  

6. **Add Wait Node ("Wait")**  
   - Wait 1 minute.  
   - Connect If1 False output (task not finished) to Wait.  
   - Connect Wait output back to HTTP Request1 input (poll loop).  

7. **Add Wait Node ("Wait1")**  
   - Wait 20 seconds.  
   - Connect If False output from first If node (invalid job start) to Wait1.  
   - Connect Wait1 output back to HTTP Request (retry job start).  

8. **Add AI Agent Node ("AI Agent")**  
   - Configure prompt to refine the list of scraped posts, summarize summaries, remove duplicates, and output structured JSON as per prompt given.  
   - Set max tries to 2, wait 1500 ms between tries.  
   - Use Google Gemini Chat Model as LM backend.  
   - Use Structured Output Parser with schema expecting array of posts with fields: Title, PublishedBy, Summary, Url, Pic.  
   - Connect If1 True output (scraping finished) to AI Agent input.  

9. **Add Google Gemini Chat Model Node**  
   - Use Google Gemini API credentials.  
   - Connect AI Agent's LM input to this node.  

10. **Add Structured Output Parser Node**  
    - Paste JSON schema example to validate AI response structure.  
    - Connect AI Agent's output parser input to this node.  

11. **Add Code Node ("Code in JavaScript")**  
    - Paste code to convert `refined_output` array into individual items for further processing:  
      ```javascript
      const refinedOutput = $input.first().json.output.refined_output;
      const processedItems = [];
      for (const item of refinedOutput) {
        processedItems.push({ json: item });
      }
      return processedItems;
      ```  
    - Connect AI Agent output to this node.  

12. **Add If Node ("If2") to Check for Picture**  
    - Condition: `$json.Pic` equals `"=no picture"`.  
    - Connect Code node output to this If2 node.  

13. **Add Telegram Node ("Send a text message")**  
    - Operation: Send message.  
    - Chat ID: Your Telegram channel username (e.g., `@Test`).  
    - Text content template:  
      ```
      {{$json.Title}}
      {{$json.Summary}}

      BY: {{$json.PublishedBy}}
      {{$json.Url}}
      ```  
    - Connect If2 True output (no picture) here.  
    - Configure Telegram API credentials via OAuth2.  

14. **Add Telegram Node ("Send a photo message")**  
    - Operation: Send photo.  
    - Chat ID: Same as text message node.  
    - File: Set to `{{$json.Pic}}`.  
    - Caption template:  
      ```
      {{$json.Title}} 

      {{$json.Summary}} 

      BY: {{$json.PublishedBy}}

      {{$json.Url}}
      ```  
    - Connect If2 False output (has picture) here.  
    - Use same Telegram credentials.  

15. **Add Sticky Notes (Optional)**  
    - Add documentation nodes in the editor to provide guidance on usage, API keys, workflow overview, and help links.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                          | Context or Link                                                             |
|-------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| Join the Discord community for help and updates.                                                                                   | https://discord.com/invite/UpnCKd7GaU                                     |
| Read detailed blog posts on BrowserAct and n8n integration.                                                                         | https://www.browseract.com/blog                                            |
| Video: How to Find Your BrowserAct API Key & Workflow ID                                                                            | https://www.youtube.com/watch?v=pDjoZWEsZlE                               |
| Video: How to Connect n8n to BrowserAct                                                                                             | https://www.youtube.com/watch?v=RoYMdJaRdcQ                               |
| Video: How to Use & Customize BrowserAct Templates                                                                                   | https://www.youtube.com/watch?v=CPZHFUASncY                               |
| Workflow showcase video: Automate Your Social Media: Get All X/Twitter Updates Directly in Telegram!                                 | https://youtu.be/6CXe6k9vihk                                              |

---

This documentation fully captures the workflow’s structure, logic, and configuration, enabling advanced users and automated agents to understand, reproduce, or adapt the process with clarity and precision.

---

**Disclaimer:** The provided content is derived exclusively from an n8n automated workflow. It complies with all applicable content policies and contains no illegal or offensive material. All data processed are legal and publicly accessible.