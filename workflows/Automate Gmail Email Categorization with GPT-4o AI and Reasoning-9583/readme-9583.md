Automate Gmail Email Categorization with GPT-4o AI and Reasoning

https://n8nworkflows.xyz/workflows/automate-gmail-email-categorization-with-gpt-4o-ai-and-reasoning-9583


# Automate Gmail Email Categorization with GPT-4o AI and Reasoning

### 1. Workflow Overview

This workflow automates the categorization of incoming Gmail emails using GPT-4o AI reasoning to assign the most relevant label. It is designed for users who want to keep their inbox organized by automatically labeling unread emails based on their content and context, applying AI-driven decision-making to improve accuracy and relevance. The workflow consists of the following logical blocks:

- **1.1 Gmail Monitoring & Label Retrieval**: Watches for new unread emails and fetches Gmail label IDs needed for AI referencing.
- **1.2 Email Processing & Marking**: Marks incoming emails as read and prepares content for AI labeling.
- **1.3 AI Label Selection**: Uses OpenAI GPT-4o to determine the most appropriate Gmail label for the email based on detailed prompt instructions.
- **1.4 AI Label Justification**: Utilizes a LangChain “think” tool to generate a reasoning explanation that justifies the label choice.
- **1.5 Label Application**: Adds the AI-selected label to the email in Gmail.

This logical flow ensures emails are processed sequentially from detection to labeling with AI validation and justification, enabling transparent automation of inbox categorization.

---

### 2. Block-by-Block Analysis

#### 2.1 Gmail Monitoring & Label Retrieval

- **Overview:** This block monitors the Gmail inbox for new unread emails and retrieves all label IDs from Gmail to enable AI to reference them by ID.
- **Nodes Involved:**  
  - Watch Incoming Emails  
  - Get Label Id's  
  - Sticky Note (Instructions for label ID retrieval)

- **Node Details:**

  - **Watch Incoming Emails**  
    - *Type:* Gmail Trigger  
    - *Role:* Triggers workflow when a new unread email arrives.  
    - *Configuration:*  
      - Filters for unread emails only.  
      - Polls every minute.  
      - Returns full email data (not simple).  
    - *Connections:* Output → Mark Email As Read  
    - *Edge Cases:* Gmail API quota limits, network errors, emails without body or subject.

  - **Get Label Id's**  
    - *Type:* Gmail (resource: label)  
    - *Role:* Retrieves all Gmail label IDs to use in the AI prompt for mapping labels.  
    - *Configuration:* Return all labels, no filter.  
    - *Connections:* No direct connection; used for manual setup reference.  
    - *Sticky Note:* Explains importance of replacing labels in AI prompt with actual Gmail label IDs.  
    - *Edge Cases:* Insufficient Gmail permissions, API failures.

  - **Sticky Note (Label Retrieval Instructions)**  
    - *Content:*  
      "## Important Info  
      ### Replace the Labels that are in the Chatgpt prompt with the labels that are in your gmail account.  
      ### Along with the label names you will need to find the Label Id's for each name which you can do using the node in RED Below"  
    - *Role:* User guidance for setup.

#### 2.2 Email Processing & Marking

- **Overview:** Marks the incoming unread email as read to avoid reprocessing and prepares the email data for AI label selection.
- **Nodes Involved:**  
  - Mark Email As Read  
  - Sticky Note (Marking Info)

- **Node Details:**

  - **Mark Email As Read**  
    - *Type:* Gmail  
    - *Role:* Marks the incoming email as read to prevent repeated triggers on the same message.  
    - *Configuration:*  
      - Uses the message ID from the triggered email.  
      - Operation: markAsRead.  
    - *Connections:* Input → Watch Incoming Emails; Output → Select most appropriate Label  
    - *Edge Cases:* If message ID is missing or invalid, marking may fail; Gmail API quota issues.

  - **Sticky Note (Marking Explanation)**  
    - *Content:* "## Marks Email As Read In your Account"  
    - *Role:* Explains the purpose of this node.

#### 2.3 AI Label Selection

- **Overview:** Sends the email content to OpenAI GPT-4o with a carefully crafted prompt that instructs the AI to select the most relevant Gmail label from a predefined set.
- **Nodes Involved:**  
  - Select most appropriate Label (OpenAI GPT-4o)  
  - Sticky Note (Labeling & Reasoning Info)

- **Node Details:**

  - **Select most appropriate Label**  
    - *Type:* OpenAI (Chat Completion)  
    - *Role:* Uses GPT-4o model to analyze email subject and body, then outputs the ID of the most relevant label.  
    - *Configuration:*  
      - Model: GPT-4o.  
      - System prompt defines the AI as a professional inbox manager.  
      - User prompt includes:  
        - Four label options with descriptions and Gmail label IDs (must be customized for the user’s account).  
        - Email subject and body dynamically inserted from the incoming email node.  
        - Strict rules to output only the label ID string.  
      - Credentials: OpenAI API key configured.  
    - *Connections:* Input → Mark Email As Read; Output → Add Label  
    - *Edge Cases:* API rate limits, prompt misconfiguration, missing email content, invalid label IDs, partial or ambiguous responses.

  - **Sticky Note (Label Selection Explanation)**  
    - *Content:* "## Selects Label to put email under and justify's / reasons as to why it has chosen the label it has."  
    - *Role:* User guidance on AI label selection step.

#### 2.4 AI Label Justification

- **Overview:** Uses a LangChain “think” tool node to generate reasoning which justifies the AI’s label choice, adding transparency and auditability to the decision.
- **Nodes Involved:**  
  - Justify/Reason the Label AI has chosen  
  - Sticky Note (Reasoning Info)

- **Node Details:**

  - **Justify/Reason the Label AI has chosen**  
    - *Type:* LangChain toolThink node  
    - *Role:* Appends a thought log that explains why the AI chose the label, without altering data.  
    - *Configuration:*  
      - Descriptive text instructing the tool to provide justification for the label choice.  
    - *Connections:* Input via ai_tool from Select most appropriate Label node.  
    - *Output:* To Select most appropriate Label via ai_tool channel (loop for reasoning).  
    - *Edge Cases:* Expression failures in logging, reasoning output not used downstream, possible infinite loops if misconfigured.

  - **Sticky Note (Reasoning Explanation)**  
    - *Content:* "## Selects Label to put email under and justify's / reasons as to why it has chosen the label it has."  
    - *Role:* Clarifies the purpose of AI justification.

#### 2.5 Label Application

- **Overview:** Applies the AI-selected Gmail label to the email, completing the automated categorization process.
- **Nodes Involved:**  
  - Add Label  
  - Sticky Note (Label Application Info)

- **Node Details:**

  - **Add Label**  
    - *Type:* Gmail  
    - *Role:* Adds the label ID returned by the AI to the email in Gmail.  
    - *Configuration:*  
      - Label ID taken dynamically from AI output (`$json.message.content`).  
      - Message ID from the original incoming email.  
      - Operation: addLabels.  
    - *Connections:* Input from Select most appropriate Label node.  
    - *Edge Cases:* Invalid label IDs, permission errors on Gmail API, message ID mismatches.

  - **Sticky Note (Final Label Application Explanation)**  
    - *Content:* "## Finally, a label is added to the email"  
    - *Role:* Explains the final labeling step.

---

### 3. Summary Table

| Node Name                    | Node Type                     | Functional Role                            | Input Node(s)           | Output Node(s)              | Sticky Note                                              |
|------------------------------|-------------------------------|-------------------------------------------|-------------------------|-----------------------------|----------------------------------------------------------|
| Get Label Id's                | Gmail                         | Retrieve all Gmail label IDs               | —                       | —                           | ## Important Info: Replace Labels in AI prompt with your Gmail labels and IDs |
| Watch Incoming Emails         | Gmail Trigger                 | Trigger workflow on new unread email      | —                       | Mark Email As Read           | ## Watches Incoming Emails                                |
| Mark Email As Read            | Gmail                         | Marks email as read to avoid reprocessing | Watch Incoming Emails    | Select most appropriate Label | ## Marks Email As Read In your Account                   |
| Select most appropriate Label | OpenAI (Chat Completion)      | AI chooses the most relevant Gmail label  | Mark Email As Read       | Add Label                   | ## Selects Label to put email under and justifies choice |
| Justify/Reason the Label AI has chosen | LangChain toolThink        | Provides reasoning for AI label choice    | Select most appropriate Label (ai_tool) | Select most appropriate Label (ai_tool) | ## Selects Label to put email under and justifies choice |
| Add Label                    | Gmail                         | Adds the AI-selected label to the email   | Select most appropriate Label | —                         | ## Finally, a label is added to the email                 |
| Sticky Note                  | Sticky Note                   | User guidance and instructions             | —                       | —                           | See above for sticky note contents                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node:**  
   - Name: "Watch Incoming Emails"  
   - Type: Gmail Trigger  
   - Set filter to "Unread" emails only.  
   - Set polling interval to every minute.  
   - Set output to include full email content (not simple).  
   - Connect this node as the workflow’s trigger.

2. **Create Gmail Node to Mark Email as Read:**  
   - Name: "Mark Email As Read"  
   - Type: Gmail  
   - Operation: markAsRead  
   - Message ID: Use expression `={{ $json.id }}` referencing the incoming email ID.  
   - Connect input from "Watch Incoming Emails".  
   - Connect output to the AI label selection node.

3. **Create OpenAI Node for Label Selection:**  
   - Name: "Select most appropriate Label"  
   - Type: OpenAI (Chat Completion)  
   - Model: GPT-4o  
   - Credentials: Configure with your OpenAI API key.  
   - System prompt: Define the AI as a professional email inbox manager.  
   - User prompt: Include the four Gmail labels with their IDs (replace placeholders with your actual Gmail label IDs). Include detailed instructions and rules for choosing the label. Use dynamic expressions to pass the email’s subject and body from the "Watch Incoming Emails" node (`{{ $('Watch Incoming Emails').item.json.subject }}`, `{{ $('Watch Incoming Emails').item.json.text }}`).  
   - Connect input from "Mark Email As Read".  
   - Connect output to the "Add Label" node.

4. **Create LangChain toolThink Node for Label Justification:**  
   - Name: "Justify/Reason the Label AI has chosen"  
   - Type: LangChain toolThink  
   - Description: Set to append reasoning why the AI chose the specific label.  
   - Connect ai_tool input from "Select most appropriate Label" node.  
   - Connect ai_tool output back to "Select most appropriate Label" node to enable reasoning logging.

5. **Create Gmail Node to Add Label:**  
   - Name: "Add Label"  
   - Type: Gmail  
   - Operation: addLabels  
   - Label IDs: Use expression `={{ $json.message.content }}` to get the label ID from AI output.  
   - Message ID: Use expression `={{ $('Watch Incoming Emails').item.json.id }}` to get the email ID.  
   - Connect input from "Select most appropriate Label".

6. **(Optional) Create Gmail Node to Retrieve Labels:**  
   - Name: "Get Label Id's"  
   - Type: Gmail  
   - Resource: label  
   - Return All: true  
   - Purpose: Run once to fetch your Gmail label IDs to use in the AI prompt.  
   - No connections needed; manual setup use only.

7. **Add Sticky Notes for User Guidance:**  
   - Add sticky notes near each logical block explaining their purpose and setup instructions, especially for label ID replacement and AI prompt customization.

8. **Workflow Settings:**  
   - Set execution order: default (sequential).  
   - Activate the workflow.  
   - Test by sending unread emails to your Gmail inbox.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| AI inbox labelling manager with reasoning attached to ChatGPT inbox manager within n8n. Monitors Gmail inbox for unread emails, uses AI to select the most relevant label, justifies the choice with LangChain “think” tool, and applies the label automatically. Highly effective and scalable automation. Setup requires Gmail and OpenAI API credentials, retrieval of Gmail label IDs, and prompt customization. Tip: Use pinning of trigger data to speed up testing. Full setup video tutorial available.                                                                                                                                                     | https://www.youtube.com/watch?v=7nda4drHcWw                                                           |
| LinkedIn profile of workflow author Seb Gardner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | https://www.linkedin.com/in/seb-gardner-5b439a260/                                                    |
| To use OpenAI API: Create an account at https://platform.openai.com/, generate API key, and ensure billing/funds are available (e.g., $5 USD). Copy API key to n8n credentials.                                                                                                                                                                                                                                                                                                                                                                                                                              | https://platform.openai.com/                                                                           |
| To map Gmail labels correctly in AI prompts, first run the “Get Label Id's” Gmail node to fetch all label IDs from your account. Replace placeholder label names and IDs in the OpenAI node prompt with those exact IDs. Failure to do so will cause label assignment errors.                                                                                                                                                                                                                                                                                                                                | Workflow Sticky Note and internal instructions                                                       |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This process strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.