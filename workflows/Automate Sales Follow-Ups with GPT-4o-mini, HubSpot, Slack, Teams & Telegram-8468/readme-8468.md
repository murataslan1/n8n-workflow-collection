Automate Sales Follow-Ups with GPT-4o-mini, HubSpot, Slack, Teams & Telegram

https://n8nworkflows.xyz/workflows/automate-sales-follow-ups-with-gpt-4o-mini--hubspot--slack--teams---telegram-8468


# Automate Sales Follow-Ups with GPT-4o-mini, HubSpot, Slack, Teams & Telegram

### 1. Workflow Overview

This workflow automates sales follow-up messaging by leveraging AI-generated personalized messages combined with CRM data enrichment and multi-channel communication. It targets sales teams who need to send timely, context-aware follow-ups to prospects or clients after events such as product demos.

The workflow is logically divided into these blocks:

- **1.1 Input Reception & Context Setup:** Defines the target contact’s basic information and context about recent interactions as input data.
- **1.2 Contact Enrichment:** Uses HubSpot CRM to look up detailed contact information by email (with optional Monday.com integration disabled).
- **1.3 AI Follow-Up Message Generation:** Passes enriched contact data and context to an AI model (OpenAI GPT-4o-mini) to generate a short, professional, and personalized follow-up message.
- **1.4 Multi-Channel Communication:** Distributes the generated message across Slack, Telegram, and Microsoft Teams to ensure broad visibility of the follow-up reminder.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Context Setup

- **Overview:**  
  This block initializes the workflow with sample contact data and context about the last interaction, serving as the base input for subsequent CRM lookups and AI message generation.

- **Nodes Involved:**  
  - 🕐 Schedule Trigger  
  - 📝 Set Sample Data  
  - Sticky Note (📹 Input & Context Setup)

- **Node Details:**  

  - **🕐 Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow on a scheduled interval (default is every minute/hour/day depending on configuration).  
    - Configuration: Default interval trigger with no specific time customization shown.  
    - Connections: Output → 📝 Set Sample Data  
    - Edge Cases: Misconfiguration may cause unexpected trigger timing or no triggers.  

  - **📝 Set Sample Data**  
    - Type: Set  
    - Role: Sets static sample data representing contact details and context of last interaction.  
    - Configuration: Defines three string variables:  
      - `contact_name`: "John Doe"  
      - `context`: "had a product demo yesterday and showed strong interest in our enterprise features"  
      - `Email`: "john.doe@example.com"  
    - Key Expressions: Used by downstream nodes to personalize messages and lookups (`$json.contact_name`, `$json.context`, `$json.Email`).  
    - Connections: Output → 🔗 HubSpot Contact Lookup & 📋 Monday Contact Fetch (disabled)  
    - Edge Cases: Static data limits scalability; real implementations should use dynamic inputs.  

  - **Sticky Note (Input & Context Setup)**  
    - Purpose: Documenting the purpose of the block for users and maintainers.  
    - Content: Explains the role of initial data setup for HubSpot search and AI generation.  

---

#### 2.2 Contact Enrichment

- **Overview:**  
  Enriches initial contact data by querying HubSpot CRM to confirm or retrieve contact properties based on the provided email. Monday.com fetch is prepared but disabled.

- **Nodes Involved:**  
  - 🔗 HubSpot Contact Lookup  
  - 📋 Monday Contact Fetch (disabled)  
  - Sticky Note1 (📹 Contact Enrichment)

- **Node Details:**  

  - **🔗 HubSpot Contact Lookup**  
    - Type: HubSpot  
    - Role: Searches HubSpot contacts by email to fetch detailed CRM data.  
    - Configuration:  
      - Operation: Search  
      - Filter: Email equals the provided email from Set Sample Data (`={{ $json.Email }}`)  
      - ReturnAll: True (fetch all matching contacts)  
      - Authentication: App Token  
    - Connections: Output → 🤖 Generate Follow-up Message  
    - Edge Cases:  
      - Authentication failure (invalid token).  
      - Email not found → empty results, fallback handling needed.  
      - Rate limiting by HubSpot API.  

  - **📋 Monday Contact Fetch (disabled)**  
    - Type: Monday.com  
    - Role: Intended to fetch contact data from Monday.com board (disabled here).  
    - Configuration: Board ID placeholder set; no active use.  
    - Connections: Disabled → No active outputs.  
    - Edge Cases: None active due to disabled state.  

  - **Sticky Note1 (Contact Enrichment)**  
    - Purpose: Explains the node’s role in CRM data enrichment and mentions optional Monday.com integration.  

---

#### 2.3 AI Follow-Up Message Generation

- **Overview:**  
  Uses an AI language model to generate a concise, professional, and personalized follow-up message referencing the prior contact context and including a fixed signature.

- **Nodes Involved:**  
  - 🤖 AI Language Model  
  - 🤖 Generate Follow-up Message  
  - Sticky Note2 (📹 AI Follow-Up Message Generation)

- **Node Details:**  

  - **🤖 AI Language Model**  
    - Type: LangChain OpenAI Chat (lmChatOpenAi)  
    - Role: Provides the underlying AI model (GPT-4o-mini) for text generation through LangChain integration.  
    - Configuration:  
      - Model: gpt-4o-mini  
      - Credentials: OpenAI API key required  
    - Connections: AI output → 🤖 Generate Follow-up Message  
    - Edge Cases:  
      - API key invalid or missing.  
      - API rate limiting or timeouts.  
      - Model selection may need updating for new versions or models.  

  - **🤖 Generate Follow-up Message**  
    - Type: LangChain Agent  
    - Role: Constructs prompt and requests AI to generate the follow-up message.  
    - Configuration:  
      - Prompt text dynamically incorporates contact first and last names from HubSpot data (`{{ $json.properties.firstname }}`, `{{ $json.properties.lastname }}`) and context from Set Sample Data.  
      - Instructions specify tone, length (<150 words), personalization, suggested next steps, and a fixed signature block.  
    - Connections: Output → Slack, Telegram, Teams Reminder nodes  
    - Edge Cases:  
      - If HubSpot data missing firstname/lastname fields, expressions may fail.  
      - AI output might not strictly adhere to instructions if prompt misunderstood.  
      - Network or API errors.  

  - **Sticky Note2 (AI Follow-Up Message Generation)**  
    - Purpose: Explains the AI model usage and the message generation logic including context and signature consistency.  

---

#### 2.4 Multi-Channel Communication

- **Overview:**  
  Sends the AI-generated follow-up message as reminders to Slack, Telegram, and Microsoft Teams channels, ensuring multiple touchpoints for sales follow-up visibility.

- **Nodes Involved:**  
  - 💬 Slack Reminder  
  - 💬 Telegram Reminder  
  - 💬 Teams Reminder  
  - Sticky Note3 (📹 Multi-Channel Communication)

- **Node Details:**  

  - **💬 Slack Reminder**  
    - Type: Slack  
    - Role: Posts a formatted follow-up reminder message to a specific Slack channel.  
    - Configuration:  
      - Channel: Predefined Slack channel ID  
      - Message text: Includes contact name, context, and AI-generated suggested message.  
      - Webhook ID and Slack API credential required.  
    - Connections: None (end node)  
    - Edge Cases:  
      - Invalid Slack webhook or credentials → message fails.  
      - Channel ID incorrect or inaccessible.  

  - **💬 Telegram Reminder**  
    - Type: Telegram  
    - Role: Sends the AI-generated message as a Telegram chat message.  
    - Configuration:  
      - Chat ID: Predefined Telegram chat/channel ID  
      - Message: AI-generated follow-up text only  
      - Attribution disabled for cleaner output.  
      - Telegram API credential required.  
    - Connections: None (end node)  
    - Edge Cases:  
      - Invalid Telegram credentials or chat ID.  
      - Message size limits.  

  - **💬 Teams Reminder**  
    - Type: Microsoft Teams  
    - Role: Posts the follow-up message in a specified Microsoft Teams channel.  
    - Configuration:  
      - Team ID and Channel ID specified  
      - Message uses AI-generated text  
      - OAuth2 credentials required for Teams API  
    - Connections: None (end node)  
    - Edge Cases:  
      - OAuth token expiry or invalid credentials.  
      - Incorrect team or channel IDs.  

  - **Sticky Note3 (Multi-Channel Communication)**  
    - Purpose: Highlights the multi-platform distribution to ensure no missed follow-ups.  

---

### 3. Summary Table

| Node Name               | Node Type                           | Functional Role                       | Input Node(s)                   | Output Node(s)                                        | Sticky Note                                                                                         |
|-------------------------|-----------------------------------|------------------------------------|--------------------------------|------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| 🕐 Schedule Trigger      | Schedule Trigger                  | Initiates workflow on schedule      | -                              | 📝 Set Sample Data                                    | 📹 Input & Context Setup                                                                            |
| 📝 Set Sample Data       | Set                              | Defines sample contact & context    | 🕐 Schedule Trigger             | 🔗 HubSpot Contact Lookup, 📋 Monday Contact Fetch    | 📹 Input & Context Setup                                                                            |
| 🔗 HubSpot Contact Lookup| HubSpot                          | Searches CRM by email               | 📝 Set Sample Data              | 🤖 Generate Follow-up Message                         | 📹 Contact Enrichment                                                                               |
| 📋 Monday Contact Fetch  | Monday.com (disabled)             | (Disabled) Fetch contacts from CRM | 📝 Set Sample Data              | (Disabled)                                           | 📹 Contact Enrichment                                                                               |
| 🤖 AI Language Model     | LangChain OpenAI Chat             | Provides AI model for text gen     | (AI input from HubSpot)         | 🤖 Generate Follow-up Message                         | 📹 AI Follow-Up Message Generation                                                                 |
| 🤖 Generate Follow-up Message | LangChain Agent               | Creates personalized follow-up msg | 🔗 HubSpot Contact Lookup, AI Language Model, Monday Contact Fetch (disabled) | 💬 Slack Reminder, 💬 Telegram Reminder, 💬 Teams Reminder | 📹 AI Follow-Up Message Generation                                                                 |
| 💬 Slack Reminder        | Slack                            | Sends message to Slack channel     | 🤖 Generate Follow-up Message   | -                                                    | 📹 Multi-Channel Communication                                                                     |
| 💬 Telegram Reminder     | Telegram                         | Sends message to Telegram chat     | 🤖 Generate Follow-up Message   | -                                                    | 📹 Multi-Channel Communication                                                                     |
| 💬 Teams Reminder        | Microsoft Teams                  | Sends message to Teams channel     | 🤖 Generate Follow-up Message   | -                                                    | 📹 Multi-Channel Communication                                                                     |
| Sticky Note             | Sticky Note                      | Documentation                      | -                              | -                                                    | See content in respective sections                                                                |
| Sticky Note1            | Sticky Note                      | Documentation                      | -                              | -                                                    | See content in respective sections                                                                |
| Sticky Note2            | Sticky Note                      | Documentation                      | -                              | -                                                    | See content in respective sections                                                                |
| Sticky Note3            | Sticky Note                      | Documentation                      | -                              | -                                                    | See content in respective sections                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Configure the trigger interval as needed (e.g., every hour).  
   - No credentials required.

2. **Create a Set node named "📝 Set Sample Data":**  
   - Add string fields:  
     - `contact_name`: "John Doe"  
     - `context`: "had a product demo yesterday and showed strong interest in our enterprise features"  
     - `Email`: "john.doe@example.com"  
   - Connect Schedule Trigger output to this node’s input.

3. **Create a HubSpot node named "🔗 HubSpot Contact Lookup":**  
   - Operation: Search  
   - Authentication: App Token (configure HubSpot credentials)  
   - FilterGroups: Filter by `email` equals expression `={{ $json.Email }}` from Set Sample Data  
   - Return all results  
   - Connect output of Set Sample Data to this node’s input.

4. **(Optional) Create a Monday.com node named "📋 Monday Contact Fetch":**  
   - Operation: Get items from specific board (set Board ID)  
   - Configure Monday.com API credentials  
   - Disable this node if not used.

5. **Create a LangChain OpenAI Chat node named "🤖 AI Language Model":**  
   - Set Model: "gpt-4o-mini"  
   - Configure OpenAI API credentials  
   - Connect output of HubSpot Contact Lookup to the AI Language Model’s input under the `ai_languageModel` type connection.

6. **Create a LangChain Agent node named "🤖 Generate Follow-up Message":**  
   - Set prompt with the following logic (adjust expression syntax as needed):  
     ```
     Generate a short, professional follow-up message for {{ $json.properties.firstname }} {{ $json.properties.lastname }}, who {{ $('📝 Set Sample Data').item.json.context }}.

     The tone should be friendly, personalized, and reference the previous interaction.

     Clearly suggest relevant next steps (e.g., scheduling a call, sharing resources, or continuing the discussion).

     Keep it under 150 words.

     At the end of the message, include this signature block exactly as written (no placeholders):

     Best regards,  
     [Your Name]  
     [Your Title] | [Your Company]  
     📧 [your.email@company.com]

     Return only the final message, fully ready to send, with no extra notes or placeholders.
     ```
   - Connect outputs of HubSpot Contact Lookup, Monday Contact Fetch (if enabled), and AI Language Model to this node’s inputs as appropriate.  
   - This node’s output will be the generated follow-up message.

7. **Create a Slack node named "💬 Slack Reminder":**  
   - Configure Slack API credentials with OAuth or webhook.  
   - Set channel to your desired Slack channel ID.  
   - Message text example:  
     ```
     📞 Follow-up Reminder

     **Contact:** {{ $('📝 Set Sample Data').item.json.contact_name }}
     **Context:** {{ $('📝 Set Sample Data').item.json.context }}

     **Suggested Message:**
     {{ $json.output }}
     ```
   - Connect output of Generate Follow-up Message to Slack node input.

8. **Create a Telegram node named "💬 Telegram Reminder":**  
   - Configure Telegram API credentials.  
   - Set chat ID to your Telegram group or channel.  
   - Message text: `={{ $json.output }}` (the AI-generated message)  
   - Connect output of Generate Follow-up Message to Telegram node input.

9. **Create a Microsoft Teams node named "💬 Teams Reminder":**  
   - Configure Microsoft Teams OAuth2 API credentials.  
   - Set Team ID and Channel ID for posting messages.  
   - Message: `={{ $json.output }}`  
   - Connect output of Generate Follow-up Message to Teams node input.

10. **Add Sticky Note nodes for documentation at appropriate workflow positions:**  
    - Add notes explaining Input & Context Setup, Contact Enrichment, AI Generation, and Multi-Channel Communication blocks, referencing the provided content.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                      | Context or Link                                                                                           |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| The workflow is designed to be modular and extendable, allowing integration with additional CRMs or messaging platforms by replicating the contact enrichment and messaging blocks. | Workflow architecture best practices.                                                                    |
| For secure operations, ensure all API credentials are stored securely in n8n credentials and never hard-coded into nodes.                                                        | n8n Credential Management documentation.                                                                 |
| The AI prompt is crafted to include a fixed signature block to maintain brand consistency across messages.                                                                        | Prompt engineering best practices.                                                                       |
| Slack, Telegram, and Teams nodes require proper API tokens and permissions; verify channel IDs and chat IDs before deployment.                                                  | Official Slack, Telegram, and Microsoft Teams API docs.                                                  |
| The Monday.com node is disabled but can be enabled and configured to supplement or replace HubSpot data depending on organizational CRM usage.                                   | Monday.com API documentation if CRM integration needed.                                                  |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow built with n8n integration and automation platform. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.