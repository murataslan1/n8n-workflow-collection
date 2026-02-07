Automate Email Triage with GPT-4.1-mini Classification and Gmail Auto-Replies

https://n8nworkflows.xyz/workflows/automate-email-triage-with-gpt-4-1-mini-classification-and-gmail-auto-replies-7399


# Automate Email Triage with GPT-4.1-mini Classification and Gmail Auto-Replies

### 1. Workflow Overview

This workflow automates the triage of incoming Gmail messages by leveraging GPT-4.1-mini AI models to extract sender information, classify emails into predefined categories, apply Gmail labels accordingly, and perform either auto-replies or draft creation. It is designed for solo operators and small teams, particularly agencies and coaches, to streamline handling diverse inbound emails without manual inbox management.

**Logical Blocks:**

- **1.1 Input Reception:**  
  Watches Gmail inbox for new unread messages.

- **1.2 Sender Name Extraction:**  
  Uses AI to extract the sender's name from email content for personalized responses.

- **1.3 Conditional Branching on Name Presence:**  
  Routes workflow depending on whether a sender name was found.

- **1.4 Intro Line Preparation:**  
  Sets a personalized or generic intro line based on sender name availability.

- **1.5 Email Content Preparation:**  
  Consolidates relevant variables (intro line, email body, message/thread IDs) for classification.

- **1.6 AI Classification & Sentiment Analysis:**  
  Classifies emails into four categories: Agency Lead, Course Request, Paid Collaborations, Miscellaneous.

- **1.7 Label Application & Response Handling:**  
  Applies corresponding Gmail label and triggers category-specific follow-up actions:
  - Agency Lead → labels + create GPT-generated draft.
  - Course Request → labels + send immediate auto-reply.
  - Paid Collaborations → labels + send auto-reply + update Google Sheets contact database.
  - Miscellaneous → labels only.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Continuously monitors Gmail for new unread messages to trigger the workflow.

- **Nodes Involved:**  
  - Gmail Trigger

- **Node Details:**  
  - **Gmail Trigger**  
    - Type: Gmail Trigger (polling)  
    - Configuration: Filters on unread emails; polls every minute.  
    - Credentials: Gmail OAuth2 connection for authorized inbox access.  
    - Inputs: None (trigger node).  
    - Outputs: Emits newly detected unread email data.  
    - Potential Failures: OAuth token expiry, API rate limits, network errors.

---

#### 2.2 Sender Name Extraction

- **Overview:**  
  Extracts the sender's name from the email text body using an AI information extractor to enable personalization.

- **Nodes Involved:**  
  - OpenAI Chat Model (for custom name extraction)  
  - Name Extractor

- **Node Details:**  
  - **OpenAI Chat Model**  
    - Type: OpenAI GPT-4.1-mini chat model (Langchain integration)  
    - Configuration: Uses GPT-4.1-mini for sophisticated text extraction.  
    - Inputs: Email text from Gmail Trigger.  
    - Outputs: JSON with extracted "sender_name" field.  
    - Credentials: OpenAI API key.  
    - Failures: API limits, malformed input, extraction misses.

  - **Name Extractor**  
    - Type: Langchain Information Extractor node  
    - Configuration: System prompt instructs to extract only "sender_name" from email text, based on signature or body. Returns empty string if unavailable.  
    - Inputs: Email text from Gmail Trigger.  
    - Outputs: JSON with "sender_name".  
    - Failures: Ambiguous or missing sender name in email content.

---

#### 2.3 Conditional Branching on Name Presence

- **Overview:**  
  Checks if a sender name was extracted to determine which personalized intro to use.

- **Nodes Involved:**  
  - If

- **Node Details:**  
  - **If**  
    - Type: Conditional node  
    - Configuration: Checks if `output.sender_name` is **not empty**.  
    - Inputs: Output from Name Extractor.  
    - Outputs: Two branches: Name Found (true), Name Not Found (false).  
    - Failures: Expression errors if input JSON malformed.

---

#### 2.4 Intro Line Preparation

- **Overview:**  
  Sets a personalized greeting line with the sender's name if found, else a generic greeting.

- **Nodes Involved:**  
  - Name Found (Set node)  
  - Name Not Found (Set node)  
  - Single Intro Line (Merge node)

- **Node Details:**  
  - **Name Found**  
    - Type: Set node  
    - Configuration: Sets `intro_line` as `"Dear {{ sender_name }}"` using extracted name.  
    - Inputs: If node's true branch.  
    - Outputs: JSON with `intro_line`.

  - **Name Not Found**  
    - Type: Set node  
    - Configuration: Sets `intro_line` as `"Hey,"` generic greeting.  
    - Inputs: If node's false branch.

  - **Single Intro Line**  
    - Type: Merge node  
    - Configuration: Combines results from Name Found and Name Not Found branches, joining on `intro_line` field.  
    - Inputs: Both Set nodes.  
    - Outputs: Unified intro line for downstream use.

---

#### 2.5 Email Content Preparation

- **Overview:**  
  Consolidates key variables including intro line, full email body text, message id, and thread id into a single data object for classification.

- **Nodes Involved:**  
  - Reducing content before LLM (Set node)

- **Node Details:**  
  - **Reducing content before LLM**  
    - Type: Set node  
    - Configuration: Assigns multiple fields:  
      - `intro_line`: from Single Intro Line node  
      - `email_body`: raw email text from Gmail Trigger  
      - `message_id` and `thread_id`: unique email identifiers  
    - Inputs: Single Intro Line output.  
    - Outputs: Prepared JSON for classification.

---

#### 2.6 AI Classification & Sentiment Analysis

- **Overview:**  
  Uses AI to classify the email content into one of four categories with descriptions, guiding routing decisions.

- **Nodes Involved:**  
  - AI-Classification & Sentiment Analysis (Langchain Text Classifier)  
  - OpenAI Chat Model1 (support node for classification)

- **Node Details:**  
  - **AI-Classification & Sentiment Analysis**  
    - Type: Langchain Text Classifier  
    - Configuration: Classifies `email_body` against four categories:  
      1. Agency Lead  
      2. Course Request  
      3. Paid Collaborations  
      4. Miscellaneous  
    - Inputs: Prepared JSON with email_body.  
    - Outputs: Classification result with category label.  
    - Failures: Ambiguous classification, API errors.

  - **OpenAI Chat Model1**  
    - Type: OpenAI GPT-4.1-mini chat model  
    - Role: Feeds classification input text to text classifier.  
    - Inputs: email_body from Set node.  
    - Outputs: To classifier node.

---

#### 2.7 Label Application & Response Handling

- **Overview:**  
  Applies Gmail labels based on classification and handles subsequent actions: replies, draft creation, or database updates.

- **Nodes Involved:**  
  - Label - Agency Lead (Gmail)  
  - Message a model (OpenAI for draft generation)  
  - Create a draft (Gmail)  
  - Label - Course Request (Gmail)  
  - Standard Answer (Gmail auto-reply)  
  - Label - Paid Collaborations (Gmail)  
  - Standard Answer 2 (Gmail auto-reply)  
  - Update DB (Google Sheets)  
  - Label - Miscellaneous (Gmail)

- **Node Details:**  

  - **Label - Agency Lead**  
    - Type: Gmail node  
    - Configuration: Adds “Agency Lead” label to message.  
    - Inputs: From classification node when category is Agency Lead.  
    - Outputs: Triggers draft generation.

  - **Message a model**  
    - Type: OpenAI GPT-4.1-mini chat model  
    - Configuration: Generates a personalized draft reply using the intro line and email content.  
    - Inputs: Email subject, body, and intro_line.  
    - Outputs: JSON with subject and body for draft.

  - **Create a draft**  
    - Type: Gmail node  
    - Configuration: Creates a draft email in Gmail using generated subject/body, linked to original thread.  
    - Inputs: Generated draft from Message a model.  
    - Outputs: None (final step for Agency Lead).

  - **Label - Course Request**  
    - Type: Gmail node  
    - Configuration: Adds “Course Request” label.  
    - Inputs: Classification category Course Request.  
    - Outputs: Triggers immediate auto-reply.

  - **Standard Answer**  
    - Type: Gmail node  
    - Configuration: Sends a predefined courtesy reply for course requests, personalized with intro line.  
    - Inputs: Email message id.  
    - Outputs: None.

  - **Label - Paid Collaborations**  
    - Type: Gmail node  
    - Configuration: Applies “Paid Collaborations” label.  
    - Inputs: Classification category Paid Collaborations.  
    - Outputs: Triggers auto-reply and DB update.

  - **Standard Answer 2**  
    - Type: Gmail node  
    - Configuration: Sends predefined auto-reply for paid collaborations, personalized with intro line.  
    - Inputs: Email message id.  
    - Outputs: Triggers database update.

  - **Update DB**  
    - Type: Google Sheets node  
    - Configuration: Appends or updates a Google Sheet with contact info: Name (from intro line), Email (from Gmail), and Subject. Matching is done on email for upsert behavior.  
    - Inputs: From Standard Answer 2 node.  
    - Outputs: None.

  - **Label - Miscellaneous**  
    - Type: Gmail node  
    - Configuration: Adds “Miscellaneous” label to emails not falling into other categories.  
    - Inputs: Classification category Miscellaneous.  
    - Outputs: None.

- **Potential Failures:**  
  - Gmail API errors: label or draft creation failures, reply failures, quota limits.  
  - Google Sheets API: permission issues, rate limits, schema mismatches.  
  - AI generation: unexpected output format or latency.

---

### 3. Summary Table

| Node Name                  | Node Type                              | Functional Role                          | Input Node(s)                   | Output Node(s)                 | Sticky Note                                                                                                                             |
|----------------------------|--------------------------------------|----------------------------------------|--------------------------------|-------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| Gmail Trigger              | Gmail Trigger                        | Watches for new unread emails           | None                           | Name Extractor                |                                                                                                                                         |
| Name Extractor             | Langchain Information Extractor     | Extracts sender name from email content | Gmail Trigger                  | If                           | ## Name Extractor                                                                                                                       |
| If                        | If                                 | Checks if sender name was found         | Name Extractor                 | Name Found, Name Not Found    | ## Personalised Intro                                                                                                                   |
| Name Found                 | Set                                | Sets personalized intro line (with name) | If (true branch)               | Single Intro Line             | ## Personalised Intro                                                                                                                   |
| Name Not Found             | Set                                | Sets generic intro line                  | If (false branch)              | Single Intro Line             | ## Personalised Intro                                                                                                                   |
| Single Intro Line          | Merge                              | Combines intro lines into single stream | Name Found, Name Not Found     | Reducing content before LLM    | ## Personalised Intro                                                                                                                   |
| Reducing content before LLM | Set                                | Prepares consolidated data for AI input | Single Intro Line              | OpenAI Chat Model1, AI-Classification & Sentiment Analysis | ## Sentiment Analysis                                                                                                                   |
| OpenAI Chat Model          | OpenAI GPT-4.1-mini                 | Supports Name Extractor AI               | Gmail Trigger                  | Name Extractor (ai_languageModel input) |                                                                                                                                         |
| OpenAI Chat Model1         | OpenAI GPT-4.1-mini                 | Supports email classification AI        | Reducing content before LLM    | AI-Classification & Sentiment Analysis (ai_languageModel input) |                                                                                                                                         |
| AI-Classification & Sentiment Analysis | Langchain Text Classifier        | Classifies email into 4 categories       | Reducing content before LLM    | Label - Agency Lead, Label - Course Request, Label - Paid Collaborations, Label - Miscellaneous | ## Sentiment Analysis                                                                                                                   |
| Label - Agency Lead        | Gmail                              | Applies "Agency Lead" label               | AI-Classification & Sentiment Analysis | Message a model              | ## Personalised Intro                                                                                                                   |
| Message a model            | OpenAI GPT-4.1-mini                 | Generates personalized draft reply       | Label - Agency Lead            | Create a draft                | ## Personalised Intro                                                                                                                   |
| Create a draft             | Gmail                              | Creates draft email in Gmail              | Message a model                | None                         | ## Personalised Intro                                                                                                                   |
| Label - Course Request     | Gmail                              | Applies "Course Request" label             | AI-Classification & Sentiment Analysis | Standard Answer              | ## Personalised Intro                                                                                                                   |
| Standard Answer            | Gmail                              | Sends auto-reply for course requests      | Label - Course Request         | None                         |                                                                                                                                         |
| Label - Paid Collaborations | Gmail                              | Applies "Paid Collaborations" label       | AI-Classification & Sentiment Analysis | Standard Answer 2            | ## Personalised Intro                                                                                                                   |
| Standard Answer 2          | Gmail                              | Sends auto-reply for paid collaborations  | Label - Paid Collaborations    | Update DB                    |                                                                                                                                         |
| Update DB                  | Google Sheets                      | Upserts contact info into Google Sheets  | Standard Answer 2              | None                         |                                                                                                                                         |
| Label - Miscellaneous      | Gmail                              | Applies "Miscellaneous" label              | AI-Classification & Sentiment Analysis | None                         |                                                                                                                                         |
| Sticky Note                | Sticky Note                       | Visual note: "Name Extractor"             | None                         | None                         | ## Name Extractor                                                                                                                       |
| Sticky Note1               | Sticky Note                       | Visual note: "Personalised Intro"          | None                         | None                         | ## Personalised Intro                                                                                                                   |
| Sticky Note2               | Sticky Note                       | Visual note: "Sentiment Analysis"          | None                         | None                         | ## Sentiment Analysis                                                                                                                   |
| Sticky Note3               | Sticky Note                       | Visual note: "Personalised Intro"          | None                         | None                         | ## Personalised Intro                                                                                                                   |
| Sticky Note4               | Sticky Note                       | Overview and instructions note             | None                         | None                         | # Overview... [Full content in node, see section 5]                                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Set up Credentials:**  
   - Gmail OAuth2 with full read/write access.  
   - OpenAI API key with GPT-4.1-mini enabled.  
   - Google Sheets OAuth2 for access to the target spreadsheet.

2. **Create Gmail Trigger node:**  
   - Type: Gmail Trigger  
   - Parameters: Filter on unread messages, poll every minute.  
   - Credential: Gmail OAuth2.  
   - Connect output to Name Extractor.

3. **Create OpenAI Chat Model node (for Name Extraction):**  
   - Type: OpenAI GPT-4.1-mini (Langchain Chat Model)  
   - Purpose: Support name extraction logic.  
   - Connect Gmail Trigger output to this node’s input.  
   - Connect output to Name Extractor node’s AI language model input.

4. **Create Name Extractor node:**  
   - Type: Langchain Information Extractor  
   - Parameters: Extract attribute `sender_name` from email text, required but return empty string if not found.  
   - Input: Email text from Gmail Trigger node.  
   - Connect output to If node.

5. **Create If node:**  
   - Type: If  
   - Condition: Check if `output.sender_name` is not empty.  
   - Outputs: True → Name Found; False → Name Not Found.

6. **Create Name Found Set node:**  
   - Type: Set  
   - Assign `intro_line` = `"Dear {{ $json.output.sender_name }}"`.  
   - Input: If (true).  
   - Connect to Single Intro Line node.

7. **Create Name Not Found Set node:**  
   - Type: Set  
   - Assign `intro_line` = `"Hey,"`.  
   - Input: If (false).  
   - Connect to Single Intro Line node.

8. **Create Single Intro Line Merge node:**  
   - Type: Merge (combine mode)  
   - Joins on `intro_line` field.  
   - Input: Both Name Found and Name Not Found nodes.  
   - Connect output to Reducing content before LLM.

9. **Create Reducing content before LLM Set node:**  
   - Type: Set  
   - Assign fields:  
     - `intro_line` from Single Intro Line  
     - `email_body` from Gmail Trigger `text`  
     - `message_id` and `thread_id` from Gmail Trigger.  
   - Connect output to OpenAI Chat Model1 and AI-Classification & Sentiment Analysis nodes.

10. **Create OpenAI Chat Model1 node:**  
    - Type: OpenAI GPT-4.1-mini chat model  
    - Input: `email_body` from Reducing content node.  
    - Output: To AI-Classification & Sentiment Analysis node’s AI language model input.

11. **Create AI-Classification & Sentiment Analysis node:**  
    - Type: Langchain Text Classifier  
    - Categories: Agency Lead, Course Request, Paid Collaborations, Miscellaneous with descriptions.  
    - Input: Prepared content from Reducing content node.  
    - Output: Four branches for each category.

12. **Create Label nodes for each category:**  
    - Gmail nodes that add the corresponding Gmail label to the incoming message using `message_id`.  
    - Labels: Agency Lead, Course Request, Paid Collaborations, Miscellaneous.  
    - Connect classification output branches accordingly.

13. **For Agency Lead branch:**  
    - Create Message a model node (OpenAI GPT-4.1-mini chat model) to generate draft reply.  
    - Input: `intro_line`, email body, subject from Gmail Trigger.  
    - Create Create a draft Gmail node that uses generated subject/body and original thread ID.  
    - Connect Label - Agency Lead → Message a model → Create a draft.

14. **For Course Request branch:**  
    - Create Standard Answer Gmail node.  
    - Predefined message with intro line and phone number.  
    - Connect Label - Course Request → Standard Answer.

15. **For Paid Collaborations branch:**  
    - Create Standard Answer 2 Gmail node with custom message.  
    - Create Update DB Google Sheets node to append or update contact info: Name (from intro line), email, subject.  
    - Connect Label - Paid Collaborations → Standard Answer 2 → Update DB.

16. **For Miscellaneous branch:**  
    - Only label applied, no further action.

17. **Test workflow end-to-end:**  
    - Send test emails covering all categories and with/without sender names.  
    - Monitor logs and outputs for errors or misclassifications.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                      | Context or Link                                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| This workflow triages incoming Gmail in real time using GPT, extracting sender names and classifying messages into 4 categories, then applying labels and generating replies or drafts accordingly.                                                                 | Full overview and instructions provided in Sticky Note4 node within the workflow.                               |
| Categories are tailored for Agencies and Coaches: Agency Lead, Course Request, Paid Collaborations, Miscellaneous.                                                                                                                                               | Suitable for solo operators and small teams managing mixed inbound emails.                                       |
| Requires setup of Gmail, OpenAI, and Google Sheets credentials. Create Gmail labels matching categories and a Google Sheet with columns: Name, email, subject.                                                                                                    | Credentials must be configured securely in n8n credential manager.                                              |
| Auto-reply messages contain placeholders for phone number and can be customized in Standard Answer nodes.                                                                                                                                                        | Phone number placeholder ‘XXXX’ should be replaced with actual contact info.                                    |
| Google Sheet update uses append or update operation matching on email field to avoid duplicates in Paid Collaborations category.                                                                                                                                 | Sheet ID and name must be set correctly in Update DB node.                                                      |
| GPT-4.1-mini model is used consistently for classification, extraction, and draft generation for balanced cost and performance.                                                                                                                                    | Can be adjusted if needed based on API availability or cost constraints.                                        |
| Sticky Notes in the workflow provide visual grouping and explanation: “Name Extractor”, “Personalised Intro”, “Sentiment Analysis”, and detailed overview.                                                                                                         | Useful for onboarding new users or collaborators reviewing the workflow design.                                 |
| The workflow includes error potential points like API rate limits, missing sender names, ambiguous classification, Gmail or Sheets API failures; implement monitoring and retry policies in production deployment.                                                    | Consider adding error handling nodes or fallback mechanisms in n8n.                                            |

---

**Disclaimer:**  
The text provided is exclusively from an n8n automated workflow. It complies with content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.