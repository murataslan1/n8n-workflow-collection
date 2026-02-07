Auto-Summarize Zoom Recordings with GPT-4 → Slack & Email

https://n8nworkflows.xyz/workflows/auto-summarize-zoom-recordings-with-gpt-4---slack---email-8060


# Auto-Summarize Zoom Recordings with GPT-4 → Slack & Email

### 1. Workflow Overview

This workflow automates the process of summarizing Zoom meeting recordings using GPT-4 and distributing the summaries via Slack and email. It is designed for organizations that want to streamline post-meeting communications by automatically generating concise meeting summaries from Zoom recordings.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives Zoom webhook events upon meeting recording completion.
- **1.2 Data Normalization:** Extracts and structures relevant data from the Zoom webhook payload.
- **1.3 AI Summarization:** Sends the extracted transcript and meeting details to GPT-4 to generate a summary.
- **1.4 Notification Delivery:** Posts the generated summary to Slack and sends it via email.
- **1.5 Setup Instructions:** Provides guidance on how to configure Zoom, OpenAI, Slack, and Email integrations.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block receives HTTP POST requests from Zoom when a recording is completed. It acts as the entry point to the workflow, triggered by Zoom's webhook event.

- **Nodes Involved:**  
  - Zoom Recording Webhook

- **Node Details:**  

  - **Zoom Recording Webhook**  
    - **Type:** Webhook  
    - **Technical Role:** Receives Zoom webhook POST payloads when a recording is completed.  
    - **Configuration Choices:**  
      - HTTP Method: POST  
      - Webhook Path: `/zoom-summary` (customizable endpoint)  
    - **Key Expressions/Variables:** Receives raw Zoom payload under `$input.first().json`.  
    - **Input/Output Connections:** No input (trigger node). Outputs to "Normalize Data".  
    - **Version-Specific Requirements:** Requires n8n instance accessible via public URL with this webhook path configured in Zoom App.  
    - **Potential Failures:**  
      - Missing or invalid Zoom webhook configuration.  
      - Network connectivity issues preventing Zoom from reaching the webhook.  
      - Unauthorized or malformed payloads.

---

#### 1.2 Data Normalization

- **Overview:**  
  Processes the raw Zoom webhook payload to extract and structure relevant meeting and recording information needed for summarization and notifications.

- **Nodes Involved:**  
  - Normalize Data

- **Node Details:**  

  - **Normalize Data**  
    - **Type:** Code (JavaScript)  
    - **Technical Role:** Parses the Zoom payload to extract key fields such as meeting ID, topic, host email, transcript, recording file URL, file type, file size, and timestamps.  
    - **Configuration Choices:**  
      - Custom JavaScript code accessing `e.payload.object` and related properties.  
      - Extracts the first recording file in the array.  
      - Ensures transcript is defaulted to empty string if missing.  
    - **Key Expressions/Variables:**  
      ```js
      const e = $input.first().json;
      const rec = e.payload.object.recording_files[0];
      return {
        json: {
          meeting_id: e.payload.object.id,
          topic: e.payload.object.topic,
          host: e.payload.object.host_email,
          transcript: e.payload.object.transcript || '',
          download_url: rec.download_url,
          file_type: rec.file_type,
          file_size: rec.file_size,
          created_at: e.payload.object.start_time,
          timestamp: new Date().toISOString()
        }
      };
      ```
    - **Input/Output Connections:** Input from "Zoom Recording Webhook". Output to "AI Summarize".  
    - **Potential Failures:**  
      - Missing or unexpected Zoom payload structure causing code errors.  
      - Empty or missing recording files array.  
      - Transcript may be unavailable or partial.  
    - **Version-Specific Requirements:** Uses n8n Code node version 2 to support modern JavaScript syntax.

---

#### 1.3 AI Summarization

- **Overview:**  
  Sends meeting data and transcript to OpenAI GPT-4 model to generate a concise summary of the Zoom recording.

- **Nodes Involved:**  
  - AI Summarize

- **Node Details:**  

  - **AI Summarize**  
    - **Type:** OpenAI (Chat Completion)  
    - **Technical Role:** Invokes GPT-4 to summarize the meeting transcript.  
    - **Configuration Choices:**  
      - Resource: Chat  
      - Operation: Create chat completion  
      - Model: GPT-4 (implied in Setup Instructions)  
      - Request options: default (no specific temperature or max tokens configured)  
      - Utilizes normalized data input, especially transcript and meeting metadata.  
    - **Key Expressions/Variables:** Inputs derived from previous node's JSON — e.g., transcript text sent as chat prompt (expression details not explicitly shown in JSON).  
    - **Input/Output Connections:** Input from "Normalize Data". Outputs to "Post to Slack" and "Send Email".  
    - **Potential Failures:**  
      - OpenAI API authentication errors or quota limits.  
      - Network timeouts or latency.  
      - Unexpected or empty transcript input causing poor summaries.  
    - **Version-Specific Requirements:** Requires OpenAI credentials configured in n8n.

---

#### 1.4 Notification Delivery

- **Overview:**  
  Delivers the AI-generated summary to end users by posting in Slack channels and sending emails.

- **Nodes Involved:**  
  - Post to Slack  
  - Send Email

- **Node Details:**  

  - **Post to Slack**  
    - **Type:** Slack node  
    - **Technical Role:** Posts a formatted message containing meeting details and summary to a Slack channel.  
    - **Configuration Choices:**  
      - Channel: Placeholder `YOUR_SLACK_CHANNEL` to be replaced with actual Slack channel ID.  
      - Message Text: Includes topic, host, date, and AI-generated summary.  
      - Uses mustache-style expressions to pull data from "Normalize Data" and "AI Summarize".  
    - **Key Expressions:**  
      ```
      📌 *Zoom Summary*

      *Topic:* {{ $('Normalize Data').item.json.topic }}
      *Host:* {{ $('Normalize Data').item.json.host }}
      *Date:* {{ $('Normalize Data').item.json.created_at }}

      *Summary:*
      {{ $json.choices[0].message.content }}
      ```
    - **Input/Output Connections:** Input from "AI Summarize". No outputs.  
    - **Potential Failures:**  
      - Slack authentication or permission errors.  
      - Invalid Slack channel ID or missing channel access.  
      - Message formatting errors.  

  - **Send Email**  
    - **Type:** Gmail node  
    - **Technical Role:** Sends an email with the meeting summary to specified recipients.  
    - **Configuration Choices:**  
      - Subject: Includes meeting topic dynamically.  
      - Message body: Includes host, date, and AI-generated summary.  
      - Requires connected Gmail or SMTP credentials.  
    - **Key Expressions:**  
      ```
      Meeting hosted by {{ $('Normalize Data').item.json.host }} on {{ $('Normalize Data').item.json.created_at }}

      Summary:
      {{ $json.choices[0].message.content }}
      ```
    - **Input/Output Connections:** Input from "AI Summarize". No outputs.  
    - **Potential Failures:**  
      - Email sending failures due to auth or quota issues.  
      - Incorrect recipient addresses (should be configured in the node’s credentials or parameters).  
      - Possible formatting or encoding issues in email body.  
    - **Version-Specific Requirements:** Uses Gmail node v2.

---

#### 1.5 Setup Instructions

- **Overview:**  
  Provides users with detailed instructions on the required configuration steps for Zoom, OpenAI, Slack, and Email to ensure the workflow functions correctly.

- **Nodes Involved:**  
  - Setup Instructions (Sticky Note)

- **Node Details:**  

  - **Setup Instructions**  
    - **Type:** Sticky Note  
    - **Technical Role:** Non-executable, documentation node containing setup guidance.  
    - **Content Summary:**  
      - Zoom: Create app with `recording.completed` event and configure webhook URL.  
      - OpenAI: Add API key and use GPT-4.  
      - Slack: Connect credentials and replace placeholder channel ID.  
      - Email: Connect Gmail/SMTP and configure recipient emails.  
    - **Input/Output Connections:** None.  
    - **Potential Failures:** None (informational only).

---

### 3. Summary Table

| Node Name              | Node Type         | Functional Role               | Input Node(s)           | Output Node(s)          | Sticky Note                                                                                              |
|------------------------|-------------------|------------------------------|------------------------|-------------------------|--------------------------------------------------------------------------------------------------------|
| Zoom Recording Webhook  | Webhook           | Receives Zoom recording event | None                   | Normalize Data          | See Setup Instructions for Zoom app and webhook setup.                                                 |
| Normalize Data         | Code (JavaScript)  | Extracts and normalizes Zoom data | Zoom Recording Webhook | AI Summarize            |                                                                                                        |
| AI Summarize            | OpenAI            | Generates meeting summary     | Normalize Data          | Post to Slack, Send Email | Use GPT-4 for best results. Requires OpenAI API key configured.                                        |
| Post to Slack           | Slack             | Posts summary to Slack channel | AI Summarize            | None                    | Replace `YOUR_SLACK_CHANNEL` with actual Slack channel ID. See Setup Instructions.                      |
| Send Email              | Gmail             | Sends summary via email       | AI Summarize            | None                    | Configure Gmail/SMTP credentials and recipient email(s). See Setup Instructions.                        |
| Setup Instructions      | Sticky Note       | Provides setup guidance       | None                   | None                    | Contains detailed steps for Zoom, OpenAI, Slack, and Email configuration.                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Zoom Recording Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `zoom-summary` (or your choice, but must match Zoom webhook configuration)  
   - No credentials needed  
   - This node will be the trigger for the workflow.

2. **Add Normalize Data Node**  
   - Type: Code (JavaScript)  
   - Connect input from Zoom Recording Webhook node.  
   - Paste the following JavaScript code:  
     ```js
     // Normalize Zoom payload
     const e = $input.first().json;
     const rec = e.payload.object.recording_files[0];
     
     return {
       json: {
         meeting_id: e.payload.object.id,
         topic: e.payload.object.topic,
         host: e.payload.object.host_email,
         transcript: e.payload.object.transcript || '',
         download_url: rec.download_url,
         file_type: rec.file_type,
         file_size: rec.file_size,
         created_at: e.payload.object.start_time,
         timestamp: new Date().toISOString()
       }
     };
     ```
   - Set node version to 2 (if applicable).

3. **Add AI Summarize Node**  
   - Type: OpenAI (Chat Completion)  
   - Connect input from Normalize Data node.  
   - Set resource to "chat" and operation to "create".  
   - Use GPT-4 model by default (ensure credentials are configured).  
   - Configure messages parameter to include the transcript and context for summarization, for example:  
     ```json
     [
       {
         "role": "system",
         "content": "You are an assistant that summarizes Zoom meeting transcripts."
       },
       {
         "role": "user",
         "content": "Summarize the following meeting transcript:\n{{ $json.transcript }}"
       }
     ]
     ```  
   - Add OpenAI API credentials in n8n settings.

4. **Add Post to Slack Node**  
   - Type: Slack  
   - Connect input from AI Summarize node.  
   - Set channel to your Slack channel ID (replace `YOUR_SLACK_CHANNEL`).  
   - Configure message text using expressions:  
     ```
     📌 *Zoom Summary*

     *Topic:* {{ $('Normalize Data').item.json.topic }}
     *Host:* {{ $('Normalize Data').item.json.host }}
     *Date:* {{ $('Normalize Data').item.json.created_at }}

     *Summary:*
     {{ $json.choices[0].message.content }}
     ```  
   - Connect Slack credentials.

5. **Add Send Email Node**  
   - Type: Gmail (or SMTP)  
   - Connect input from AI Summarize node (same as Slack).  
   - Configure email parameters:  
     - Subject: `Zoom Meeting Summary: {{ $('Normalize Data').item.json.topic }}`  
     - Message:  
       ```
       Meeting hosted by {{ $('Normalize Data').item.json.host }} on {{ $('Normalize Data').item.json.created_at }}

       Summary:
       {{ $json.choices[0].message.content }}
       ```  
   - Connect Gmail or SMTP credentials.  
   - Configure recipient email addresses as needed.

6. **Add Setup Instructions Node (optional)**  
   - Type: Sticky Note  
   - Content:  
     ```
     ## 🛠️ Setup Steps
     ### 1. Zoom
     - Create a Zoom App with the **`recording.completed`** event.  
     - Add workflow webhook URL.
     
     ### 2. OpenAI
     - Add your **API key** to n8n.  
     - Use **GPT-4** for best results.
     
     ### 3. Slack
     - Connect Slack credentials.  
     - Replace `YOUR_SLACK_CHANNEL` with your channel ID.
     
     ### 4. Email
     - Connect Gmail or SMTP.  
     - Replace recipient email(s).
     ```  
   - No connections needed.

7. **Connect all nodes as per described flow:**  
   - Zoom Recording Webhook → Normalize Data → AI Summarize → Post to Slack  
                                                   → Send Email

8. **Verify all credentials and permissions:**  
   - Zoom app with webhook URL matching webhook node path.  
   - OpenAI API key with GPT-4 access.  
   - Slack credentials with permission to post in selected channel.  
   - Gmail or SMTP credentials authorized to send emails.

---

### 5. General Notes & Resources

| Note Content                                                                                                             | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Create a Zoom App subscribing to the `recording.completed` event to trigger this workflow via webhook.                   | Zoom Developer Portal ([https://marketplace.zoom.us/](https://marketplace.zoom.us/))               |
| Use GPT-4 model in OpenAI for best summarization quality.                                                                | OpenAI API Documentation ([https://platform.openai.com/docs/](https://platform.openai.com/docs/)) |
| Replace `YOUR_SLACK_CHANNEL` placeholder with your actual Slack channel ID.                                               | Slack API & Channel Info ([https://api.slack.com/channels](https://api.slack.com/channels))        |
| Ensure Gmail or SMTP credentials are set up in n8n for sending emails.                                                    | Gmail Setup ([https://support.google.com/mail/answer/7126229](https://support.google.com/mail/answer/7126229)) |
| The workflow assumes the Zoom recording file array contains at least one recording file; error handling for empty arrays is not implemented. | Consider adding validation or error nodes for robustness.                                          |

---

**Disclaimer:** The provided text is generated exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.