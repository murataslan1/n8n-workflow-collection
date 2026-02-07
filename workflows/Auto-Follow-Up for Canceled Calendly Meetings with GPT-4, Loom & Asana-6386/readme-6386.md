Auto-Follow-Up for Canceled Calendly Meetings with GPT-4, Loom & Asana

https://n8nworkflows.xyz/workflows/auto-follow-up-for-canceled-calendly-meetings-with-gpt-4--loom---asana-6386


# Auto-Follow-Up for Canceled Calendly Meetings with GPT-4, Loom & Asana

### 1. Workflow Overview

This workflow automates the process of following up with invitees who cancel Calendly meetings. It is designed for sales and consulting professionals who want to recover leads after cancellations by sending personalized follow-up emails enriched with a Loom video. Additionally, it creates an Asana task to prompt manual outreach, ensuring no potential client is overlooked.

**Target Use Cases:**  
- B2B consultants, agencies, and founders scheduling calls via Calendly  
- Sales teams aiming to automate lead recovery after no-shows or cancellations  
- Anyone seeking to convert cancellations into engagement opportunities  

**Logical Blocks:**  
- **1.1 Input Reception:** Triggered by Calendly webhook on meeting cancellation event  
- **1.2 Data Extraction:** Parses relevant information from the webhook payload  
- **1.3 AI Processing:** Uses GPT-4 to generate a warm, personalized follow-up message  
- **1.4 Content Enrichment:** Adds a Loom video link and subject line to the message  
- **1.5 Message Assembly:** Merges AI-generated message, Loom link, and invitee data  
- **1.6 Communication Dispatch:** Sends the personalized email via Gmail  
- **1.7 Task Management:** Creates a task in Asana for manual follow-up with context  

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Listens for Calendly webhook events specifically when an invitee cancels a meeting, triggering the entire workflow.

- **Nodes Involved:**  
  - Trigger on Meeting Cancellation

- **Node Details:**  
  - **Trigger on Meeting Cancellation**  
    - Type: Calendly Trigger  
    - Configuration: Listens to `invitee.canceled` event only  
    - Input: External webhook POST from Calendly when a meeting is canceled  
    - Output: Emits full webhook JSON payload for downstream processing  
    - Version: v1  
    - Potential Failures: Webhook misconfiguration, Calendly API downtime, event filtering errors  
    - Notes: Requires correct setup of Calendly webhook with the specific event `invitee.canceled`  

#### 1.2 Data Extraction

- **Overview:**  
  Extracts and formats essential information from the Calendly webhook payload for later use.

- **Nodes Involved:**  
  - Extract Meeting Info

- **Node Details:**  
  - **Extract Meeting Info**  
    - Type: Set Node  
    - Configuration: Parses JSON to extract meeting type, start time, cancel reason, invitee name, and email; prepares a simplified structured object  
    - Key Expressions: Static JSON example included to simulate expected data structure, actual data comes from webhook input  
    - Input: Output from Calendly Trigger  
    - Output: JSON with cleaned fields such as `event_type.name`, `scheduled_event.start_time`, `cancel_reason`, `invitee.name`, `invitee.email`  
    - Version: 3.4  
    - Edge Cases: Missing fields in payload, unexpected JSON structure, malformed webhook data  
    - Notes: This simplifies downstream node expressions for clarity and maintainability  

#### 1.3 AI Processing

- **Overview:**  
  Generates a personalized, friendly follow-up email body using OpenAI GPT-4 based on extracted meeting and invitee data.

- **Nodes Involved:**  
  - Write Follow-Up Message (GPT)

- **Node Details:**  
  - **Write Follow-Up Message (GPT)**  
    - Type: OpenAI Chat Model (Langchain integration)  
    - Configuration: Uses GPT-4o-mini model with a system prompt instructing generation of a warm, casual email without subject or greeting. Context includes the invitee’s name and cancellation details.  
    - Key Expressions:  
      - System Prompt: Defines assistant role and tone  
      - User Prompt: Requests a short friendly follow-up mentioning the cancellation, Loom video, and invitation to reschedule  
      - Context variables: `{{ $json["payload"]["invitee"]["name"] }}` dynamically inserted  
    - Input: JSON output from Extract Meeting Info  
    - Output: AI-generated message content in `message.content`  
    - Version: 1.8  
    - Potential Failures: API key invalid or quota exhausted, network timeouts, unexpected input format, rate limiting  
    - Credentials: Requires configured OpenAI API key  
    - Notes: Prompt can be customized for tone and message content  

#### 1.4 Content Enrichment

- **Overview:**  
  Appends a predefined Loom video URL and subject line to the AI-generated message to finalize the email content.

- **Nodes Involved:**  
  - Add Loom Video URL

- **Node Details:**  
  - **Add Loom Video URL**  
    - Type: Set Node  
    - Configuration: Assigns static values: Loom video URL, email subject line, concatenates the AI message body with Loom link appended at the end  
    - Key Expressions:  
      - Loom link: `"https://www.loom.com/share/970a3fba1ed44352a2194f1ef6a8dc45"` (hardcoded)  
      - Subject: `"Sorry we missed each other — here’s a quick video"`  
      - Email body: Expression concatenating AI message + Loom link  
    - Input: Output from Write Follow-Up Message (GPT)  
    - Output: JSON containing `loom_link`, `subject`, `email_body` fields for email sending  
    - Version: 3.4  
    - Edge Cases: Loom URL must be valid and accessible; email body concatenation failures if AI output missing or malformed  

#### 1.5 Message Assembly

- **Overview:**  
  Combines the enriched email content with the original invitee and meeting data into a single JSON object for downstream use.

- **Nodes Involved:**  
  - Merge Message & Video

- **Node Details:**  
  - **Merge Message & Video**  
    - Type: Merge Node  
    - Configuration: Combine mode set to `combineAll` to merge inputs from Extract Meeting Info and Add Loom Video URL nodes  
    - Input: Two inputs — (1) Extract Meeting Info and (2) Add Loom Video URL  
    - Output: Single combined JSON object with all relevant fields (invitee data, AI message, Loom link, subject)  
    - Version: 3.2  
    - Edge Cases: Input mismatch, missing data from either branch, timing issues if upstream nodes fail or delay  

#### 1.6 Communication Dispatch

- **Overview:**  
  Sends the personalized follow-up email through the user’s Gmail account.

- **Nodes Involved:**  
  - Send Email with Gmail

- **Node Details:**  
  - **Send Email with Gmail**  
    - Type: Gmail Node  
    - Configuration:  
      - Recipient: dynamically set to invitee email from combined data  
      - Subject: dynamically set to email subject from combined data  
      - Message Body: dynamically set from combined email body  
      - OAuth2 credentials for Gmail authentication  
    - Input: Output from Merge Message & Video  
    - Output: Email sending confirmation or error response  
    - Version: 2.1  
    - Edge Cases: OAuth token expiration, Gmail API rate limits, invalid email addresses, network errors  
    - Credentials: Gmail OAuth2 required and must be authorized for sending emails  

#### 1.7 Task Management

- **Overview:**  
  Creates a task in Asana to alert the team for manual follow-up, including invitee name, meeting details, and Loom link.

- **Nodes Involved:**  
  - Create Task in Asana

- **Node Details:**  
  - **Create Task in Asana**  
    - Type: Asana Node  
    - Configuration:  
      - Task name dynamically includes invitee name  
      - Workspace and project IDs set to user’s Asana environment  
      - Notes include meeting info and Loom video URL  
      - Task assigned to specific team member via assignee ID  
      - Authentication via OAuth2  
    - Input: Output from Merge Message & Video  
    - Output: Created Asana task confirmation or error  
    - Version: 1  
    - Edge Cases: Incorrect workspace/project/assignee IDs, OAuth token expiration, Asana API errors, permission issues  
    - Credentials: Asana OAuth2 credentials with project access required  

---

### 3. Summary Table

| Node Name                   | Node Type                     | Functional Role                    | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                                                                               |
|-----------------------------|-------------------------------|----------------------------------|-------------------------------|--------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Trigger on Meeting Cancellation | Calendly Trigger              | Detect canceled Calendly meetings | (Webhook)                     | Extract Meeting Info            | Starts the workflow when someone cancels a meeting. No extra filters needed. [Calendly Credentials docs](https://docs.n8n.io/integrations/builtin/credentials/calendly/) |
| Extract Meeting Info         | Set                           | Extract relevant meeting data     | Trigger on Meeting Cancellation | Write Follow-Up Message (GPT), Merge Message & Video | Pulls out meeting type, invitee name/email, cancel reason for simpler use later. [Edit Node docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.set/) |
| Write Follow-Up Message (GPT) | OpenAI Chat Model (Langchain) | Generate personalized email body  | Extract Meeting Info            | Add Loom Video URL             | AI writes a friendly, warm follow-up email mentioning cancellation and Loom video. [Chat Model docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/) |
| Add Loom Video URL           | Set                           | Append Loom link and email subject| Write Follow-Up Message (GPT)  | Merge Message & Video          | Adds Loom link and subject line to message.                                                                                  |
| Merge Message & Video        | Merge                         | Combine invitee data with message | Extract Meeting Info, Add Loom Video URL | Send Email with Gmail, Create Task in Asana | Combines AI message, Loom link, and invitee info into one object for sending and task creation.                             |
| Send Email with Gmail        | Gmail                         | Send follow-up email              | Merge Message & Video          | (End)                         | Sends email via Gmail OAuth2. [Gmail node docs](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/)   |
| Create Task in Asana         | Asana                         | Log follow-up task for team       | Merge Message & Video          | (End)                         | Creates Asana task with invitee info and Loom link for manual follow-up. [Asana node docs](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.asana/) |
| Sticky Note                  | Sticky Note                   | Workflow overview and instructions| None                         | None                          | Contains detailed workflow description, setup instructions, user guidance, and links to Discord and forum.                 |
| Sticky Note1                 | Sticky Note                   | Workflow breakdown summary        | None                         | None                          | Summarizes workflow steps in 7 points.                                                                                     |
| Sticky Note3                 | Sticky Note                   | Calendly Trigger explanation      | None                         | None                          | Explains Calendly trigger function and credential link.                                                                    |
| Sticky Note4                 | Sticky Note                   | Edit Node explanation             | None                         | None                          | Describes the purpose of the Edit node to simplify data downstream.                                                        |
| Sticky Note5                 | Sticky Note                   | GPT message generation explanation| None                         | None                          | Details the AI generation purpose and tone.                                                                                |
| Sticky Note6                 | Sticky Note                   | Loom link and message merging     | None                         | None                          | Explains merging Loom video with AI message and invitee info.                                                              |
| Sticky Note7                 | Sticky Note                   | Gmail node explanation            | None                         | None                          | Details Gmail node usage and credential requirement.                                                                        |
| Sticky Note8                 | Sticky Note                   | Demo video link                   | None                         | None                          | Link to Loom setup guide video: [https://www.loom.com/share/c3ea85bbb00c4640917983d3dba9a5ec](https://www.loom.com/share/c3ea85bbb00c4640917983d3dba9a5ec) |
| Sticky Note9                 | Sticky Note                   | Asana task creation explanation   | None                         | None                          | Explains Asana task creation purpose and configuration.                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Calendly Trigger Node**  
   - Node Type: Calendly Trigger  
   - Configure to listen for `invitee.canceled` event only  
   - Enable webhook and copy its URL to Calendly webhook configuration  

2. **Create Set Node (Extract Meeting Info)**  
   - Node Type: Set  
   - Configure JSON output to extract:  
     - `event` as `"invitee.canceled"` (static or dynamic from webhook)  
     - `payload.event_type.name` (e.g., "Discovery Call")  
     - `payload.scheduled_event.start_time`  
     - `payload.cancel_reason`  
     - `payload.invitee.name`  
     - `payload.invitee.email`  
   - Connect input from Calendly Trigger  

3. **Create OpenAI Chat Model Node (Write Follow-Up Message)**  
   - Node Type: `@n8n/n8n-nodes-langchain.openAi`  
   - Set model to `gpt-4o-mini` or equivalent GPT-4 model  
   - Add system message: instruct assistant to write a friendly, casual email body without subject or greeting  
   - Add user message: prompt to write a short, warm follow-up for the canceled meeting including invitee name and mention of Loom video and invite to reschedule  
   - Use expressions to inject invitee name from previous node output  
   - Connect input from Extract Meeting Info node  
   - Assign OpenAI API credentials  

4. **Create Set Node (Add Loom Video URL)**  
   - Node Type: Set  
   - Assign static fields:  
     - `loom_link`: your Loom video URL (e.g., `"https://www.loom.com/share/970a3fba1ed44352a2194f1ef6a8dc45"`)  
     - `subject`: `"Sorry we missed each other — here’s a quick video"`  
     - `email_body`: Expression combining AI message content + Loom link (e.g., `{{$json["message"]["content"] + "\n\nWatch here: " + loom_link}}`)  
   - Connect input from Write Follow-Up Message node  

5. **Create Merge Node (Merge Message & Video)**  
   - Node Type: Merge  
   - Set mode to `combineAll`  
   - Connect two inputs:  
     - First from Extract Meeting Info node  
     - Second from Add Loom Video URL node  

6. **Create Gmail Node (Send Email with Gmail)**  
   - Node Type: Gmail  
   - Configure recipient using expression from merged data: `{{$json["payload"]["invitee"]["email"]}}`  
   - Subject: `{{$json.subject}}`  
   - Message: `{{$json.email_body}}`  
   - Authenticate with Gmail OAuth2 credentials  
   - Connect input from Merge Message & Video node  

7. **Create Asana Node (Create Task in Asana)**  
   - Node Type: Asana  
   - Configure task name: `"Follow-up with {{$json.payload.invitee.name}} after missed call"`  
   - Workspace and project IDs: set according to your Asana setup  
   - Notes: `"Missed meeting with {{$json.payload.invitee.name}}.\nEmail sent with this Loom: {{$json.loom_link}}"`  
   - Assignee: your team member’s user ID  
   - Authenticate with Asana OAuth2 credentials  
   - Connect input from Merge Message & Video node  

8. **Verify Node Connections:**  
   - Calendly Trigger → Extract Meeting Info → Write Follow-Up Message (GPT) → Add Loom Video URL → Merge Message & Video → (Send Email with Gmail AND Create Task in Asana)  

9. **Test Workflow:**  
   - Send a test cancellation event from Calendly or simulate webhook data  
   - Confirm AI generates message, email sends, and Asana task is created  

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow helps turn canceled meetings into engagement opportunities using AI, video, and task tracking. | Main workflow purpose overview                                                                     |
| Join the n8n community for help and discussions.                                                     | Discord: https://discord.com/invite/XPKeKXeB7d, Forum: https://community.n8n.io/                   |
| Demo video walkthrough of this workflow setup is available on Loom.                                   | https://www.loom.com/share/c3ea85bbb00c4640917983d3dba9a5ec                                       |
| Calendly credentials setup guide for n8n integration.                                                | https://docs.n8n.io/integrations/builtin/credentials/calendly/                                    |
| Edit Node documentation for data transformation in n8n.                                            | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.set/                            |
| Chat Model node documentation for OpenAI integration in n8n.                                        | https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/ |
| Gmail node documentation for sending emails.                                                        | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/                          |
| Asana node documentation for task creation.                                                        | https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.asana/                          |

---

**Disclaimer:**  
The text provided is derived exclusively from an automated n8n workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All data handled is lawful and public.