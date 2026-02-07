Auto-Categorize Gmail Emails with GPT-4o and Send Prioritized Slack Alerts

https://n8nworkflows.xyz/workflows/auto-categorize-gmail-emails-with-gpt-4o-and-send-prioritized-slack-alerts-7643


# Auto-Categorize Gmail Emails with GPT-4o and Send Prioritized Slack Alerts

### 1. Workflow Overview

This workflow automates the processing of unread Gmail emails by categorizing them using GPT-4o, then routing and alerting relevant teams via Slack based on the email category and priority. It targets use cases where organizations receive diverse incoming emails (sales inquiries, technical support requests, billing questions, complaints) and need to prioritize and distribute them efficiently for timely follow-up.

The workflow’s logic is structured into these functional blocks:

- **1.1 Input Reception:** Watches for unread emails in Gmail and retrieves full email content.
- **1.2 AI Processing:** Uses a language model-based AI agent to categorize and prioritize emails based on subject and body text.
- **1.3 Output Structuring:** Parses the AI output into strict JSON schema for consistency.
- **1.4 Routing Preparation:** Maps email categories to internal labels and Slack channels.
- **1.5 Slack Notification:** Sends summarized prioritized alerts to the appropriate Slack channels.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** This block detects new unread emails in Gmail and fetches their full details for processing.
- **Nodes Involved:**  
  - Trigger on Unread Email  
  - Get Email

- **Node Details:**

  - **Trigger on Unread Email**  
    - Type: Gmail Trigger  
    - Role: Watches Gmail inbox for unread emails every minute.  
    - Configuration: Filters set to only unread emails; polling mode every minute.  
    - Inputs: None (trigger node)  
    - Outputs: Emits new unread email metadata (including message ID).  
    - Edge cases: Gmail API rate limits; connectivity/authentication failures; no new unread emails result in no triggering.

  - **Get Email**  
    - Type: Gmail node (operation: get)  
    - Role: Retrieves full email content using message ID from trigger.  
    - Configuration: Uses message ID dynamically from Trigger on Unread Email node; full email content (not simple).  
    - Inputs: Receives message ID from Trigger on Unread Email.  
    - Outputs: Full email data including headers, subject, plain/text body.  
    - Edge cases: Message might be deleted or moved before retrieval; API errors; partial email content.

---

#### 1.2 AI Processing

- **Overview:** This block analyzes email content using GPT-4o to categorize and prioritize the email and generate a brief summary and rationale.
- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Structured Output Parser

- **Node Details:**

  - **AI Agent**  
    - Type: Langchain Agent node  
    - Role: Constructs prompt with email subject and body; requests JSON output with category, priority, summary, reason.  
    - Configuration:  
      - Prompt instructs model to assign one category from defined list and one priority from defined list.  
      - Outputs minified JSON only.  
      - Extracts sender’s email address from multiple possible JSON fields.  
    - Inputs: Full email data from Get Email node.  
    - Outputs: Raw AI output sent to language model and to output parser.  
    - Edge cases: AI output malformed or incomplete; prompt failures; API timeouts; no email body text available.

  - **OpenAI Chat Model**  
    - Type: Langchain OpenAI Chat Model node  
    - Role: Runs GPT-4o-mini model to generate AI response based on prompt.  
    - Configuration: Model set explicitly to "gpt-4o-mini".  
    - Inputs: Prompt from AI Agent.  
    - Outputs: AI response text sent back to AI Agent’s output parser.  
    - Edge cases: API quota exceeded; network errors; model unavailability.

  - **Structured Output Parser**  
    - Type: Langchain Output Parser (structured)  
    - Role: Validates and parses AI JSON output against strict schema with defined properties and enums.  
    - Configuration:  
      - Schema expects fields: category (enum), priority (enum), summary, reason, subject, from.  
      - Ensures no additional properties, and required fields are present.  
    - Inputs: Raw AI JSON output from AI Agent and OpenAI Chat Model.  
    - Outputs: Parsed and validated structured JSON object.  
    - Edge cases: Parsing errors if AI output does not conform; missing required fields; schema mismatch.

---

#### 1.3 Routing Preparation

- **Overview:** Maps AI-identified email categories to user-friendly labels and Slack channel IDs for alert routing.
- **Nodes Involved:**  
  - Routing Map

- **Node Details:**

  - **Routing Map**  
    - Type: Set node  
    - Role: Derives a human-readable label and Slack channel ID based on parsed category.  
    - Configuration:  
      - Uses conditional expressions on `output.category` field to assign:  
        - label: "Sales", "Support", "Billing", or "Complaint"  
        - slackChannel: Slack channel IDs per category (Slack User IDs or Channel IDs)  
      - Passes through other fields as-is.  
    - Inputs: Parsed JSON from Structured Output Parser.  
    - Outputs: Enriched JSON with routing info for Slack.  
    - Edge cases: Unexpected category values default to complaint Slack channel; missing category causes fallback.

---

#### 1.4 Slack Notification

- **Overview:** Sends a formatted Slack message alert to the designated channel/user with email priority and summary.
- **Nodes Involved:**  
  - Send Notification to Slack

- **Node Details:**

  - **Send Notification to Slack**  
    - Type: Slack node  
    - Role: Sends notification message to Slack user/channel as per routing map.  
    - Configuration:  
      - Message text includes priority, sender, summary, and reason fields from AI output.  
      - Sends to user identified by `slackChannel` field.  
      - OAuth2 authentication configured for Slack API access.  
      - No link back to workflow included in notification.  
    - Inputs: Output from Routing Map node.  
    - Outputs: Slack API response confirming message sent.  
    - Edge cases: Slack API rate limits; invalid channel/user IDs; auth token expiration; network errors.

---

### 3. Summary Table

| Node Name               | Node Type                             | Functional Role                 | Input Node(s)               | Output Node(s)              | Sticky Note                        |
|-------------------------|-------------------------------------|--------------------------------|-----------------------------|-----------------------------|----------------------------------|
| Trigger on Unread Email | Gmail Trigger                       | Detect unread emails            | None                        | Get Email                   |                                  |
| Get Email               | Gmail                              | Retrieve full email content     | Trigger on Unread Email      | AI Agent                    |                                  |
| AI Agent                | Langchain Agent                    | Generate categorized AI output | Get Email                   | Routing Map, Structured Output Parser, OpenAI Chat Model |                                  |
| OpenAI Chat Model       | Langchain OpenAI Chat Model        | Run GPT-4o model                | AI Agent                    | AI Agent (via outputParser) |                                  |
| Structured Output Parser| Langchain Output Parser Structured | Validate AI JSON output         | AI Agent (ai_outputParser)  | Routing Map                 |                                  |
| Routing Map             | Set                               | Map category to label & Slack  | AI Agent                    | Send Notification to Slack  |                                  |
| Send Notification to Slack | Slack                           | Send Slack alerts              | Routing Map                 | None                        |                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger on Unread Email (Gmail Trigger) Node:**  
   - Set filter to detect only unread emails.  
   - Configure polling mode to run every minute.  
   - No credentials needed beyond Gmail OAuth2 setup.

2. **Add Get Email (Gmail) Node:**  
   - Operation: Get  
   - Message ID: Use expression `{{$json.id}}` from trigger output.  
   - Set "Simple" to false for full content.  
   - Connect Trigger on Unread Email node output to this node input.

3. **Add AI Agent (Langchain Agent) Node:**  
   - Set text prompt with instructions to categorize email into JSON with fields: category, from, subject, priority, summary, reason.  
   - Extract email body using `{{$json.textPlain || $json.text || ''}}`.  
   - Set output parser enabled.  
   - Connect Get Email node output to AI Agent input.

4. **Add OpenAI Chat Model Node:**  
   - Select model `"gpt-4o-mini"`.  
   - Connect AI Agent node’s ai_languageModel output to this node input.  
   - Configure OpenAI credentials with API key.

5. **Add Structured Output Parser Node:**  
   - Use manual JSON schema with required fields and enums as per workflow.  
   - Connect AI Agent node’s ai_outputParser output to this node.

6. **Add Routing Map (Set) Node:**  
   - Configure two new fields:  
     - `label`: conditional string based on parsed category.  
     - `slackChannel`: conditional Slack channel ID string based on category.  
   - Pass all other fields through unchanged.  
   - Connect Structured Output Parser output to Routing Map input.

7. **Add Send Notification to Slack Node:**  
   - Configure authentication with Slack OAuth2 credentials.  
   - Set message text using expressions to include priority, from, summary, reason fields.  
   - Set recipient user/channel dynamically using `{{$json.slackChannel}}`.  
   - Connect Routing Map output to Slack node input.

8. **Test and Activate:**  
   - Ensure all credentials are valid.  
   - Test with a sample unread email.  
   - Activate the trigger node.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                    |
|-----------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Slack channel IDs are hardcoded; update them to your workspace channels or user IDs accordingly.    | Internal Slack configuration                                      |
| The AI prompt defines strict categorization rules based on keywords and sender intent.               | Prompt engineering for email routing                              |
| Output parser schema prevents malformed or incomplete AI outputs, increasing workflow robustness.    | JSON schema validation                                            |
| Polling every minute may incur Gmail API quota usage; adjust frequency as needed.                    | Gmail API quota and rate limits                                   |
| OAuth2 credentials must be properly configured for Gmail and Slack nodes to execute successfully.    | n8n credential management                                         |

---

**Disclaimer:**  
The text provided is exclusively derived from an n8n automated workflow. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.