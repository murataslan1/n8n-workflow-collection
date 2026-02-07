Auto-Generate and Post Social Media Content to Bluesky using Groq LLM

https://n8nworkflows.xyz/workflows/auto-generate-and-post-social-media-content-to-bluesky-using-groq-llm-3455


# Auto-Generate and Post Social Media Content to Bluesky using Groq LLM

### 1. Workflow Overview

This workflow automates the generation and posting of social media content to Bluesky using a Large Language Model (LLM) API, specifically Groq LLM in this instance. It is designed for content creators and social media managers who want to streamline their Bluesky presence by automatically generating engaging posts and publishing them without manual intervention.

The workflow is logically divided into the following blocks:

- **1.1 Scheduling and Credential Setup:** Triggers the workflow on a schedule and sets up necessary credentials for Bluesky API access.
- **1.2 Bluesky Session Initialization:** Authenticates and creates a session with the Bluesky API.
- **1.3 Content Generation via LLM:** Uses Groq LLM to generate social media post content based on predefined prompts.
- **1.4 Content Processing and Validation:** Caps the generated content to 300 characters, validates JSON structure, and checks execution counts to control posting frequency.
- **1.5 Posting and Error Handling:** Posts the validated content to Bluesky and manages errors, including stopping execution on critical failures.
- **1.6 Execution Control and Retry Logic:** Uses counters and conditional checks to manage workflow loops, retries, and error paths.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduling and Credential Setup

**Overview:**  
This block triggers the workflow either on a schedule or manually and sets up the necessary credentials for Bluesky API authentication.

**Nodes Involved:**  
- Schedule Trigger  
- Define Credentials

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution based on a time schedule (e.g., daily at 9 AM) or manual run.  
  - Configuration: Default scheduling parameters (not explicitly set in JSON).  
  - Inputs: None (trigger node)  
  - Outputs: Connects to Define Credentials  
  - Edge Cases: Misconfigured schedule may cause no triggers; manual runs bypass schedule.

- **Define Credentials**  
  - Type: Set  
  - Role: Stores Bluesky API credentials (username and app password) for downstream HTTP requests.  
  - Configuration: Presumably sets credential variables (not detailed in JSON).  
  - Inputs: From Schedule Trigger  
  - Outputs: Connects to Create Bluesky Session  
  - Edge Cases: Missing or invalid credentials will cause authentication failures downstream.

---

#### 1.2 Bluesky Session Initialization

**Overview:**  
Establishes an authenticated session with Bluesky API to enable posting.

**Nodes Involved:**  
- Create Bluesky Session  
- HTTP error (error handling node connected here)

**Node Details:**

- **Create Bluesky Session**  
  - Type: HTTP Request  
  - Role: Performs API call to Bluesky to create an authenticated session using credentials.  
  - Configuration: Uses credentials defined earlier; retries on failure enabled.  
  - Inputs: From Define Credentials  
  - Outputs: On success, connects to LLM Chain; on error, connects to HTTP error node.  
  - Edge Cases: Authentication errors, network timeouts, API rate limits.  
  - Version: HTTP Request node v4.2 with retry enabled.

- **HTTP error** (connected to Create Bluesky Session)  
  - Type: HTTP Request (used here as error handler)  
  - Role: Handles errors by continuing error output to Stop and Error node.  
  - Inputs: From Create Bluesky Session error output  
  - Outputs: Connects to Stop and Error node  
  - Edge Cases: Ensures workflow stops gracefully on API errors.

---

#### 1.3 Content Generation via LLM

**Overview:**  
Generates social media post content using Groq LLM based on input prompts and chains the output for further processing.

**Nodes Involved:**  
- Groq Chat Model  
- LLM Chain

**Node Details:**

- **Groq Chat Model**  
  - Type: Langchain Groq LLM Chat Model  
  - Role: Calls Groq LLM API to generate text content based on system/user prompts.  
  - Configuration: Uses Groq API credentials and prompt templates (not detailed in JSON).  
  - Inputs: From Create Bluesky Session (successful output)  
  - Outputs: Connects to LLM Chain node via ai_languageModel input.  
  - Edge Cases: API key invalid, rate limits, malformed prompts, timeout.

- **LLM Chain**  
  - Type: Langchain LLM Chain  
  - Role: Processes the LLM output, possibly applying prompt chaining or formatting.  
  - Configuration: Configured to retry on failure.  
  - Inputs: From Groq Chat Model (ai_languageModel), and from Execution Count Check 2 (conditional loop).  
  - Outputs: Connects to "Code code to cap posts at 300 characters" node.  
  - Edge Cases: Expression failures, invalid LLM output format.

---

#### 1.4 Content Processing and Validation

**Overview:**  
Processes the generated content to ensure it fits Bluesky's character limit, validates JSON structure, and manages execution count to control posting frequency and retries.

**Nodes Involved:**  
- Code code to cap posts at 300 characters  
- Check if JSON is Valid  
- Execution Count Code  
- Execution Count Check  
- Execution Count Code 2  
- Execution Count Check 2  
- Wait

**Node Details:**

- **Code code to cap posts at 300 characters**  
  - Type: Code (JavaScript)  
  - Role: Truncates or formats the generated post content to ensure it does not exceed 300 characters, complying with Bluesky limits.  
  - Inputs: From LLM Chain  
  - Outputs: Connects to Check if JSON is Valid  
  - Edge Cases: Unexpected data structure, empty content.

- **Check if JSON is Valid**  
  - Type: If  
  - Role: Validates that the content is valid JSON before proceeding.  
  - Inputs: From Code node  
  - Outputs: If valid, connects to Execution Count Code; if invalid, connects to Wait node (retry delay).  
  - Edge Cases: Malformed JSON, empty response.

- **Execution Count Code**  
  - Type: Code  
  - Role: Increments or manages a counter to track how many times the workflow has executed or retried.  
  - Inputs: From Check if JSON is Valid (valid branch)  
  - Outputs: Connects to Execution Count Check  
  - Edge Cases: Counter overflow, variable persistence issues.

- **Execution Count Check**  
  - Type: If  
  - Role: Checks if execution count exceeds a threshold to decide whether to proceed or trigger error handling.  
  - Inputs: From Execution Count Code  
  - Outputs: If count exceeded, connects to HTTP error node; else, connects to Post to Bluesky node.  
  - Edge Cases: Incorrect threshold logic.

- **Execution Count Code 2**  
  - Type: Code  
  - Role: Secondary execution count management, likely for retry or loop control after Wait node.  
  - Inputs: From Wait node  
  - Outputs: Connects to Execution Count Check 2  
  - Edge Cases: Same as Execution Count Code.

- **Execution Count Check 2**  
  - Type: If  
  - Role: Checks if retry count exceeded; if yes, stops workflow with error; else, loops back to LLM Chain for another content generation attempt.  
  - Inputs: From Execution Count Code 2  
  - Outputs: On failure, connects to Stop and Error and HTTP error nodes; on success, connects to LLM Chain.  
  - Edge Cases: Infinite loops if not configured properly.

- **Wait**  
  - Type: Wait  
  - Role: Delays workflow execution before retrying content generation when JSON validation fails.  
  - Inputs: From Check if JSON is Valid (invalid branch)  
  - Outputs: Connects to Execution Count Code 2  
  - Edge Cases: Long delays may cause timeout; no delay may cause rapid retries.

---

#### 1.5 Posting and Error Handling

**Overview:**  
Posts the validated content to Bluesky and handles any HTTP or API errors gracefully, stopping the workflow if necessary.

**Nodes Involved:**  
- Post to Bluesky  
- HTTP error  
- Stop and Error

**Node Details:**

- **Post to Bluesky**  
  - Type: HTTP Request  
  - Role: Sends the final post content to Bluesky API for publishing.  
  - Configuration: Uses authenticated session; retries enabled; handles errors by forwarding to HTTP error node.  
  - Inputs: From Execution Count Check (valid branch)  
  - Outputs: On success, ends; on error, connects to HTTP error node.  
  - Edge Cases: API rate limits, authentication failure, content rejection by Bluesky.

- **HTTP error** (shared error handler)  
  - Type: HTTP Request (used as error handler)  
  - Role: Captures HTTP errors and forwards to Stop and Error node to halt workflow.  
  - Inputs: From Post to Bluesky, Create Bluesky Session, Execution Count Check, etc.  
  - Outputs: Connects to Stop and Error node  
  - Edge Cases: Ensures consistent error handling.

- **Stop and Error**  
  - Type: Stop and Error  
  - Role: Stops workflow execution and marks it as failed with an error message.  
  - Inputs: From HTTP error and Execution Count Check 2 (failure branch)  
  - Outputs: None (terminates workflow)  
  - Edge Cases: Final safeguard to prevent unwanted posts or infinite loops.

---

#### 1.6 Execution Control and Retry Logic

**Overview:**  
Manages the workflow’s control flow, including retries, delays, and stopping conditions to ensure robust operation without infinite loops or unwanted posts.

**Nodes Involved:**  
- Execution Count Code  
- Execution Count Check  
- Execution Count Code 2  
- Execution Count Check 2  
- Wait

**Node Details:**  
(Described in 1.4 Content Processing and Validation block as they overlap in function.)

---

### 3. Summary Table

| Node Name                     | Node Type                      | Functional Role                                  | Input Node(s)                 | Output Node(s)                 | Sticky Note |
|-------------------------------|--------------------------------|-------------------------------------------------|-------------------------------|-------------------------------|-------------|
| Schedule Trigger               | Schedule Trigger               | Initiates workflow on schedule/manual trigger   | None                          | Define Credentials             |             |
| Define Credentials            | Set                            | Sets Bluesky API credentials                      | Schedule Trigger              | Create Bluesky Session         |             |
| Create Bluesky Session        | HTTP Request                   | Authenticates and creates Bluesky session       | Define Credentials            | LLM Chain, HTTP error          |             |
| Groq Chat Model               | Langchain Groq LLM Chat Model | Generates social media content via Groq LLM      | Create Bluesky Session        | LLM Chain                     |             |
| LLM Chain                    | Langchain LLM Chain            | Processes LLM output and chains prompts          | Groq Chat Model, Execution Count Check 2 | Code code to cap posts at 300 characters |             |
| Code code to cap posts at 300 characters | Code                      | Truncates content to 300 characters               | LLM Chain                    | Check if JSON is Valid         |             |
| Check if JSON is Valid        | If                             | Validates JSON structure of content               | Code code to cap posts at 300 characters | Execution Count Code, Wait    |             |
| Execution Count Code          | Code                           | Manages execution count for posting control      | Check if JSON is Valid (valid) | Execution Count Check          |             |
| Execution Count Check         | If                             | Checks if execution count exceeds threshold       | Execution Count Code          | HTTP error, Post to Bluesky    |             |
| Post to Bluesky               | HTTP Request                   | Posts content to Bluesky API                       | Execution Count Check (valid) | HTTP error                    |             |
| HTTP error                   | HTTP Request (error handler)   | Handles HTTP errors and forwards to stop node    | Multiple error outputs        | Stop and Error                |             |
| Stop and Error               | Stop and Error                 | Stops workflow on critical errors                 | HTTP error, Execution Count Check 2 (fail) | None                        |             |
| Wait                         | Wait                           | Delays workflow before retrying                    | Check if JSON is Valid (invalid) | Execution Count Code 2        |             |
| Execution Count Code 2        | Code                           | Secondary execution count for retry control       | Wait                         | Execution Count Check 2        |             |
| Execution Count Check 2       | If                             | Checks retry count; loops or stops workflow       | Execution Count Code 2        | Stop and Error, HTTP error, LLM Chain |             |
| Sticky Note                  | Sticky Note                    | (Empty content)                                    | None                         | None                         |             |
| Sticky Note1                 | Sticky Note                    | (Empty content)                                    | None                         | None                         |             |
| Sticky Note2                 | Sticky Note                    | (Empty content)                                    | None                         | None                         |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure to run at desired intervals (e.g., daily at 9 AM) or manual trigger.

2. **Create Set Node "Define Credentials"**  
   - Type: Set  
   - Add fields for Bluesky API credentials (username, app password).  
   - These credentials will be used in HTTP Request nodes.

3. **Create HTTP Request Node "Create Bluesky Session"**  
   - Type: HTTP Request (v4.2)  
   - Configure to authenticate with Bluesky API using credentials from "Define Credentials".  
   - Enable retry on failure.  
   - Connect input from "Define Credentials".  
   - On success, connect output to "Groq Chat Model" node.  
   - On error, connect to "HTTP error" node.

4. **Create Langchain Groq LLM Chat Model Node "Groq Chat Model"**  
   - Type: Langchain Groq LLM Chat Model  
   - Configure with Groq API credentials and system prompt (e.g., "Write a witty Bluesky post about AI automation").  
   - Connect input from "Create Bluesky Session".  
   - Connect output to "LLM Chain" node's ai_languageModel input.

5. **Create Langchain LLM Chain Node "LLM Chain"**  
   - Type: Langchain LLM Chain  
   - Configure to process Groq LLM output, possibly chaining prompts or formatting.  
   - Enable retry on failure.  
   - Connect input from "Groq Chat Model" and from "Execution Count Check 2" (for retry loop).  
   - Connect output to "Code code to cap posts at 300 characters".

6. **Create Code Node "Code code to cap posts at 300 characters"**  
   - Type: Code (JavaScript)  
   - Implement logic to truncate or format the post content to max 300 characters.  
   - Connect input from "LLM Chain".  
   - Connect output to "Check if JSON is Valid".

7. **Create If Node "Check if JSON is Valid"**  
   - Type: If  
   - Configure to validate if the content is valid JSON.  
   - If true, connect to "Execution Count Code".  
   - If false, connect to "Wait".

8. **Create Code Node "Execution Count Code"**  
   - Type: Code  
   - Implement logic to increment and store execution count for controlling posting frequency.  
   - Connect input from "Check if JSON is Valid" (true branch).  
   - Connect output to "Execution Count Check".

9. **Create If Node "Execution Count Check"**  
   - Type: If  
   - Configure to check if execution count exceeds a threshold (e.g., max retries or posts per day).  
   - If exceeded, connect to "HTTP error".  
   - If not, connect to "Post to Bluesky".

10. **Create HTTP Request Node "Post to Bluesky"**  
    - Type: HTTP Request (v4.2)  
    - Configure to post content to Bluesky API using authenticated session.  
    - Enable retry on failure.  
    - Connect input from "Execution Count Check" (valid branch).  
    - On error, connect to "HTTP error".

11. **Create HTTP Request Node "HTTP error"**  
    - Type: HTTP Request (used as error handler)  
    - Configure to handle errors and forward to "Stop and Error".  
    - Connect error outputs from "Create Bluesky Session", "Post to Bluesky", "Execution Count Check", and "Execution Count Check 2" here.  
    - Connect output to "Stop and Error".

12. **Create Stop and Error Node "Stop and Error"**  
    - Type: Stop and Error  
    - Configure to stop workflow execution and mark as failed with error message.  
    - Connect input from "HTTP error" and "Execution Count Check 2" failure branch.

13. **Create Wait Node "Wait"**  
    - Type: Wait  
    - Configure delay duration (e.g., few seconds or minutes) before retrying content generation.  
    - Connect input from "Check if JSON is Valid" (false branch).  
    - Connect output to "Execution Count Code 2".

14. **Create Code Node "Execution Count Code 2"**  
    - Type: Code  
    - Implement secondary execution count logic for retry attempts.  
    - Connect input from "Wait".  
    - Connect output to "Execution Count Check 2".

15. **Create If Node "Execution Count Check 2"**  
    - Type: If  
    - Configure to check if retry count exceeds limit.  
    - If exceeded, connect to "Stop and Error" and "HTTP error".  
    - If not exceeded, connect back to "LLM Chain" to retry content generation.

16. **Optional: Add Sticky Notes**  
    - Add sticky notes for documentation or instructions as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow automates Bluesky content creation and posting using Groq LLM and Bluesky API.              | Workflow purpose and description.                                                               |
| Setup requires Bluesky API credentials (username and app password) and Groq API key.                 | Setup instructions in workflow description.                                                     |
| Ensure posts are capped at 300 characters to comply with Bluesky limits.                             | Implemented in "Code code to cap posts at 300 characters" node.                                 |
| Error handling stops workflow on critical failures to prevent unwanted posts.                        | Managed by "HTTP error" and "Stop and Error" nodes.                                            |
| Suggested enhancements include multi-platform posting, image generation, analytics, and approval.   | Workflow description section "Suggested Enhancements".                                         |
| For more info on Bluesky API and authentication, refer to official Bluesky developer documentation. | External resource (not linked here).                                                            |
| Groq LLM integration requires valid API key and prompt configuration.                               | Refer to Groq API documentation for prompt design and authentication.                           |

---

This completes the comprehensive reference documentation for the "Auto-Generate and Post Social Media Content to Bluesky using Groq LLM" n8n workflow.