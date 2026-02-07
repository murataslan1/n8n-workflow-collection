Automate Sponsored Deal Email Responses with Gmail and GPT-4

https://n8nworkflows.xyz/workflows/automate-sponsored-deal-email-responses-with-gmail-and-gpt-4-7525


# Automate Sponsored Deal Email Responses with Gmail and GPT-4

### 1. Workflow Overview

This workflow automates the processing and response to sponsored deal emails received via Gmail, leveraging GPT-4 AI models for content analysis and response generation. It listens for incoming emails, detects whether the email is a sponsored offer, and if so, crafts a professional, courteous refusal email based on company policy guidelines, then replies automatically. If the email is not sponsored, it performs no action.

The workflow is logically divided into these main blocks:

- **1.1 Gmail Input and Extraction**: Poll Gmail inbox every minute for new emails, extract key fields such as sender, subject, and body.
- **1.2 Sponsored Email Detection AI**: Use a Langchain AI agent with GPT-4 to analyze the email content, determine if it is sponsored, and output a boolean with reasoning.
- **1.3 Conditional Routing**: Use an If node to route the flow based on whether the email is sponsored.
- **1.4 Sponsored Email Response Generation**: If sponsored, invoke a second AI agent to draft a polite refusal email based on defined company policies.
- **1.5 Gmail Reply**: Send the generated response back to the original sender as a reply email.
- **1.6 No-Op for Non-Sponsored Emails**: If not sponsored, the workflow terminates without action.

---

### 2. Block-by-Block Analysis

#### 2.1 Gmail Input and Extraction

- **Overview:**  
  This block triggers the workflow by polling Gmail every minute, capturing new emails. Then it extracts useful fields (From, Subject, Body) for downstream analysis.
  
- **Nodes Involved:**  
  - Gmail Trigger  
  - Edit Fields
  
- **Node Details:**

  - **Gmail Trigger**  
    - *Type*: Gmail Trigger node  
    - *Role*: Watches Gmail inbox, triggers on new emails every minute.  
    - *Configuration*: Poll mode set to every minute; no filters applied (captures all emails).  
    - *Credentials*: Connected to Gmail via OAuth2.  
    - *Input/Output*: No input; outputs full email JSON object.  
    - *Edge Cases*: Gmail API limits, OAuth token expiration, network issues.  
    - *Sticky Note*: “Read inbox every minute and then send to next node for Analysis”

  - **Edit Fields**  
    - *Type*: Set node  
    - *Role*: Extracts and renames key email fields for uniform downstream processing.  
    - *Configuration*: Assigns “From” from email headers.from, “Subject” from subject field, and “Email_Body” from text field of the email.  
    - *Input/Output*: Input from Gmail Trigger; output is JSON with concise keys.  
    - *Edge Cases*: Missing fields in email JSON, malformed emails.  
    - *Sticky Note*: “Extract - Header - Subject - EmailBody”

#### 2.2 Sponsored Email Detection AI

- **Overview:**  
  This block uses an AI agent with GPT-4 to analyze the email body and classify whether it is a sponsored email, returning a boolean and explanation in JSON format.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Structured Output Parser  
  - If

- **Node Details:**

  - **AI Agent**  
    - *Type*: Langchain Agent node  
    - *Role*: Runs a GPT-4 based prompt to detect if the email is sponsored and returns structured JSON.  
    - *Configuration*:  
      - System prompt defines role as “Email Sentiment & Sponsorship Detection Agent.”  
      - Instructions emphasize concise, objective output in a strict JSON format with fields `isSponsoredEmail` (boolean) and `reason` (string).  
      - Input text is the extracted Email_Body.  
    - *Input/Output*: Input from Edit Fields node; output is AI response text.  
    - *Edge Cases*: AI model misclassification, prompt errors, API rate limits, parsing failures.  
    - *Sticky Note*: “Process and validate Confirm If Sponsored - The AI agent will read through the email and confirm if the email is an sponsored email or not. It then pass this boolean to If Else node.”

  - **OpenAI Chat Model**  
    - *Type*: Langchain OpenAI Chat Model  
    - *Role*: Provides GPT-4o-mini model for AI Agent to run the prompt.  
    - *Configuration*: Model set to “gpt-4o-mini”.  
    - *Credentials*: Uses OpenAI API key.  
    - *Input/Output*: Connects to AI Agent as underlying language model.  
    - *Edge Cases*: API quota, key invalidation, latency.

  - **Structured Output Parser**  
    - *Type*: Langchain Structured Output Parser  
    - *Role*: Parses AI Agent output into validated JSON object with schema:  
      ```json
      {
        "isSponsoredEmail": boolean,
        "reason": string
      }
      ```  
    - *Input/Output*: Parses AI Agent output; passes structured JSON downstream.  
    - *Edge Cases*: Parsing errors, schema mismatch.

  - **If**  
    - *Type*: If node  
    - *Role*: Routes workflow based on `isSponsoredEmail` boolean.  
    - *Configuration*: Condition checks if `{{$json.output.isSponsoredEmail}} === true`.  
    - *Input/Output*: Input from AI Agent; two outputs: true branch and false branch.  
    - *Edge Cases*: Missing field or unexpected JSON format.

#### 2.3 Sponsored Email Response Generation

- **Overview:**  
  If email is sponsored, this block uses an AI agent to draft a professional and courteous refusal email aligned with company policy.

- **Nodes Involved:**  
  - AI Agent1  
  - OpenAI Chat Model1

- **Node Details:**

  - **AI Agent1**  
    - *Type*: Langchain Agent node  
    - *Role*: Generates the refusal email body text based on a detailed system prompt describing company response policy and tone.  
    - *Configuration*:  
      - Prompt instructs agent to prepare a polite refusal message, explaining sponsorship criteria, maintaining friendly tone, including placeholders for company and sender names.  
      - Input includes original email details for context.  
    - *Input/Output*: Input from If node (true branch); outputs email body text.  
    - *Edge Cases*: AI generation errors, prompt misinterpretation.

  - **OpenAI Chat Model1**  
    - *Type*: Langchain OpenAI Chat Model  
    - *Role*: Provides GPT-4o-mini model for AI Agent1 to generate email.  
    - *Credentials*: Same OpenAI API key.  
    - *Edge Cases*: Same as above.

  - *Sticky Note*: “Prepare Email Body - This node will prepare email body with company policies on accepting any sponsored deals.”

#### 2.4 Gmail Reply

- **Overview:**  
  Sends the generated refusal email as a reply to the original sender using Gmail.

- **Nodes Involved:**  
  - Gmail

- **Node Details:**

  - **Gmail**  
    - *Type*: Gmail node (send email)  
    - *Role*: Replies to original email with the generated refusal message.  
    - *Configuration*:  
      - Operation set to “reply”.  
      - Message body taken from AI Agent1 output.  
      - Message ID set from original Gmail Trigger email ID to ensure reply threading.  
      - Email type set to plain text.  
    - *Credentials*: Same Gmail OAuth2 credentials as Gmail Trigger.  
    - *Input/Output*: Input from AI Agent1.  
    - *Edge Cases*: Gmail API errors, reply threading issues, permission errors.  
    - *Sticky Note*: “Reply - This node will send an email to the Sender”

#### 2.5 No Operation for Non-Sponsored Emails

- **Overview:**  
  If the email is not identified as sponsored, this block does nothing and gracefully ends.

- **Nodes Involved:**  
  - No Operation, do nothing

- **Node Details:**

  - **No Operation, do nothing**  
    - *Type*: NoOp node  
    - *Role*: Terminates workflow silently without action on non-sponsored emails.  
    - *Input/Output*: Input from If node (false branch).  
    - *Edge Cases*: None significant.  
    - *Sticky Note*: “If not a Sponsored Email. Do Nothing.”

---

### 3. Summary Table

| Node Name               | Node Type                           | Functional Role                                    | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                          |
|-------------------------|-----------------------------------|--------------------------------------------------|------------------------|--------------------------|----------------------------------------------------------------------------------------------------|
| Gmail Trigger           | Gmail Trigger                     | Poll Gmail inbox every minute for new emails     | —                      | Edit Fields              | Read inbox every minute and then send to next node for Analysis                                    |
| Edit Fields             | Set                              | Extract sender, subject, and body fields          | Gmail Trigger          | AI Agent                 | Extract - Header - Subject - EmailBody                                                             |
| AI Agent                | Langchain Agent                  | Detect if email is sponsored via GPT-4 prompt    | Edit Fields            | If                       | Process and validate Confirm If Sponsored - The AI agent will read through the email and confirm if the email is an sponsored email or not. It then pass this boolean to If Else node. |
| OpenAI Chat Model       | Langchain OpenAI Chat Model      | Provides GPT-4o-mini model for AI Agent           | —                      | AI Agent                 |                                                                                                    |
| Structured Output Parser| Langchain Output Parser Structured| Parse AI Agent output into JSON                    | AI Agent               | If                       |                                                                                                    |
| If                      | If                               | Route based on isSponsoredEmail boolean           | Structured Output Parser| AI Agent1 / No Operation  |                                                                                                    |
| AI Agent1               | Langchain Agent                  | Generate refusal email text for sponsored emails | If (true branch)       | Gmail                    | Prepare Email Body - This node will prepare email body with company policies on accepting any sponsored deals. |
| OpenAI Chat Model1      | Langchain OpenAI Chat Model      | Provides GPT-4o-mini model for AI Agent1          | —                      | AI Agent1                |                                                                                                    |
| Gmail                   | Gmail                            | Reply to original email with generated refusal   | AI Agent1               | —                        | Reply - This node will send an email to the Sender                                                |
| No Operation, do nothing| No Operation                     | Terminates workflow for non-sponsored emails      | If (false branch)      | —                        | If not a Sponsored Email. Do Nothing.                                                             |
| Sticky Note             | Sticky Note                      | Comments / annotations                             | —                      | —                        |                                                                                                    |
| Sticky Note1            | Sticky Note                      | Comments / annotations                             | —                      | —                        |                                                                                                    |
| Sticky Note2            | Sticky Note                      | Comments / annotations                             | —                      | —                        |                                                                                                    |
| Sticky Note3            | Sticky Note                      | Comments / annotations                             | —                      | —                        |                                                                                                    |
| Sticky Note4            | Sticky Note                      | Comments / annotations                             | —                      | —                        |                                                                                                    |
| Sticky Note5            | Sticky Note                      | Comments / annotations                             | —                      | —                        |                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Gmail Trigger node:**
   - Set to trigger on new emails every minute (`pollTimes` set to everyMinute).
   - No filters applied (captures all emails).
   - Connect to Gmail account via OAuth2 credentials.
   
2. **Add a Set node named “Edit Fields”:**
   - Extract and assign these fields from the Gmail Trigger output:
     - `From` = expression `{{$json["headers"]["from"]}}`
     - `Subject` = expression `{{$json.subject}}`
     - `Email_Body` = expression `{{$json.text}}`
   - Connect the Gmail Trigger node output to this node input.

3. **Add a Langchain Agent node named “AI Agent”:**
   - Configure a system prompt to detect sponsored emails. The prompt should:
     - Define the role as “Email Sentiment & Sponsorship Detection Agent.”
     - Ask to classify emails as sponsored or not, outputting JSON with `isSponsoredEmail` (boolean) and `reason` (string).
     - Input text: use `Email_Body` from previous node.
   - Set prompt type to “define” and enable output parser.
   - Connect the “Edit Fields” node output to this AI Agent input.

4. **Add an OpenAI Chat Model node:**
   - Select model “gpt-4o-mini.”
   - Connect it as the language model for the “AI Agent” node.
   - Configure OpenAI API credentials.

5. **Add a Structured Output Parser node:**
   - Define the JSON schema:
     ```json
     {
       "type": "object",
       "properties": {
         "isSponsoredEmail": { "type": "boolean" },
         "reason": { "type": "string" }
       }
     }
     ```
   - Connect the AI Agent output to this parser.

6. **Add an If node:**
   - Configure condition:  
     - Check if `{{$json.output.isSponsoredEmail}}` equals `true` (strict boolean).
   - Connect the Structured Output Parser output to this If node.

7. **On the If node’s “true” branch:**

   - **Add a second Langchain Agent node named “AI Agent1”:**
     - Create a detailed system prompt to draft a polite refusal email for sponsored deal offers.
     - Include company policy criteria, friendly tone, and placeholders for company and sender names.
     - Input includes original email fields (`From`, `Subject`, `Email_Body`) for context.
     - Set prompt type to “define.”
     - Connect the If node’s true output to this AI Agent1.

   - **Add a second OpenAI Chat Model node:**
     - Use the same “gpt-4o-mini” model.
     - Connect it as the language model for AI Agent1.
     - Use the same OpenAI API credentials.

   - **Add a Gmail node to send a reply:**
     - Operation: set to “reply.”
     - Message content: use output from AI Agent1.
     - Message ID: set to `{{$node["Gmail Trigger"].json["id"]}}` to reply in thread.
     - Email type: “text.”
     - Connect AI Agent1 output to this Gmail node.
     - Use the same Gmail OAuth2 credentials.

8. **On the If node’s “false” branch:**

   - **Add a No Operation node:**
     - Simply terminates the workflow silently.
     - Connect If node false output to this node.

9. **Add Sticky Notes as required for clarity:**
   - For example:
     - On Gmail Trigger node: “Read inbox every minute and then send to next node for Analysis.”
     - On Edit Fields node: “Extract - Header - Subject - EmailBody.”
     - On AI Agent node: “Process and validate Confirm If Sponsored.”
     - On AI Agent1 node: “Prepare Email Body with company policies.”
     - On Gmail reply node: “Reply - This node will send an email to the Sender.”
     - On No Operation node: “If not a Sponsored Email. Do Nothing.”

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                           |
|-----------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Workflow uses GPT-4o-mini variant from Langchain integration for AI processing.                      | OpenAI GPT-4 model usage in n8n Langchain nodes.                                                        |
| Gmail OAuth2 credentials must have permissions for reading and sending emails to function properly. | Gmail API scopes include reading inbox and sending replies.                                              |
| AI prompt design is critical for correct classification and polite reply generation.                 | Prompts provided in the workflow are pre-tuned for purpose but can be customized per company needs.      |
| This workflow runs every minute and may incur API usage and Gmail quota limits.                       | Monitor API and Gmail usage quotas to avoid interruptions.                                               |
| Sticky notes are included in the workflow for user guidance and documentation purposes.              | See Sticky Notes attached at key nodes for quick reference.                                              |

---

**Disclaimer:** The provided text is exclusively from an automated workflow designed in n8n, adhering strictly to content policies. No illegal, offensive, or protected content is included. All data processed is legal and public.