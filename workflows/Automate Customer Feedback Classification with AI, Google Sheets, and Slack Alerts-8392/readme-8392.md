Automate Customer Feedback Classification with AI, Google Sheets, and Slack Alerts

https://n8nworkflows.xyz/workflows/automate-customer-feedback-classification-with-ai--google-sheets--and-slack-alerts-8392


# Automate Customer Feedback Classification with AI, Google Sheets, and Slack Alerts

### 1. Workflow Overview

This workflow, titled **"Customer Feedback Loop Analyzer"**, automates the collection, classification, and notification of customer feedback sourced from two main inputs: form submissions and emails. It leverages AI (via LangChain and optionally Google Gemini Chat Model) to categorize and summarize feedback into actionable groups such as Bugs, Feature Requests, UX Issues, or Others. The processed feedback is logged into Google Sheets for tracking and routed via Slack notifications and email reports to ensure timely team awareness and response.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Captures feedback either from a web form submission or incoming emails labeled in Gmail.
- **1.2 Data Extraction:** Parses relevant details (reviewer name, review text) from the raw input.
- **1.3 AI Processing:** Uses LangChain’s Information Extractor and optionally Google Gemini Chat Model to classify and summarize feedback, including sentiment analysis.
- **1.4 Data Logging:** Appends the structured feedback data to a Google Sheets document for record-keeping.
- **1.5 Routing & Notification:** Uses a Switch node to route feedback by category, sending Slack alerts for critical issues and email reports summarizing categorized feedback.
- **1.6 Documentation & Metadata:** Sticky Notes provide explanatory context and purpose documentation embedded in the workflow.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block captures customer feedback from two sources: a web form and incoming emails tagged in Gmail.

- **Nodes Involved:**  
  - On form submission  
  - Receive review/feedbak  

- **Node Details:**  

  - **On form submission**  
    - Type: *Form Trigger*  
    - Role: Listens for submissions on a form titled "Customer Review" with mandatory "Name" and "Review" fields.  
    - Configuration: The form requires both fields; it triggers workflow execution on submission.  
    - Input: External user form submission  
    - Output: JSON object with "Name" and "Review" fields forwarded to AI processing.  
    - Edge cases: Missing required fields blocked by form; network issues preventing trigger firing could delay data capture.
  
  - **Receive review/feedbak**  
    - Type: *Gmail Trigger*  
    - Role: Watches Gmail inbox for emails labeled with a specific label ID; polls every minute.  
    - Configuration: Filters emails by label `"Label_536806471971916762"`.  
    - Input: Incoming emails  
    - Output: Raw email data (including sender and snippet) for extraction.  
    - Edge cases: Label misconfiguration may cause missed emails; API limits or auth failures possible; polling delay of up to one minute.

#### 2.2 Data Extraction

- **Overview:**  
  Extracts and sanitizes the reviewer's name and review text from raw email data.

- **Nodes Involved:**  
  - Extract details  

- **Node Details:**  

  - **Extract details**  
    - Type: *Code (JavaScript)*  
    - Role: Parses the "From" field from the email to extract the sender's name, and grabs the message snippet as review text.  
    - Configuration: Custom JS code checks for angle brackets in the "From" field to isolate the name, defaults to the entire string if no brackets.  
    - Input: Email JSON from Gmail Trigger  
    - Output: JSON with two keys: `name` (reviewer's name) and `Review` (feedback snippet).  
    - Expressions: Uses `$input.first().json.From` and `$input.first().json.snippet`  
    - Edge cases: Unexpected email formats may yield incorrect names; snippet may be truncated or incomplete.

#### 2.3 AI Processing

- **Overview:**  
  Analyzes the feedback text using AI models to categorize, summarize, and detect sentiment. Optionally enhances this with Google Gemini Chat.

- **Nodes Involved:**  
  - Transform and summarise  
  - Google Gemini Chat Model (optional, not connected to main flow but available)  

- **Node Details:**  

  - **Transform and summarise**  
    - Type: *LangChain Information Extractor*  
    - Role: Receives raw feedback text, categorizes it into defined types, extracts a concise summary, and detects sentiment.  
    - Configuration: Uses a system prompt defining categories (Bug, Feature Request, UX Issue, Other) and instructs to summarize core complaint/suggestion.  
    - Input: JSON with `Review` text from either form or email extraction  
    - Output: JSON with keys: `category`, `summary`, `sentiment`, and original `Feedback text`  
    - Expressions: Text input is set dynamically as `={{ $json.Review }}`  
    - Edge cases: AI misclassification or ambiguity; prompt tuning may be required for domain-specific feedback; API rate limits or auth failures.

  - **Google Gemini Chat Model**  
    - Type: *Google Gemini LM Chat*  
    - Role: Optional advanced AI model for summarization/classification; linked to `Transform and summarise` as a language model input.  
    - Configuration: Uses the model "models/gemini-1.5-flash" and Google Palm API credentials.  
    - Input: Not connected in main flow but can enhance processing.  
    - Output: Feeds into "Transform and summarise" node.  
    - Edge cases: Requires valid Google Palm credentials; possible quota or latency issues.  

#### 2.4 Data Logging

- **Overview:**  
  Appends the AI-processed feedback data to a designated Google Sheets document for tracking and analysis.

- **Nodes Involved:**  
  - Review data  

- **Node Details:**  

  - **Review data**  
    - Type: *Google Sheets*  
    - Role: Appends categorized feedback data to a sheet with columns for summary, category, timestamp, sentiment, and original feedback.  
    - Configuration: Mapping defines columns explicitly from AI output JSON keys; operation set to "append".  
    - Input: JSON output from "Transform and summarise"  
    - Output: Confirmation of append operation  
    - Edge cases: Google Sheets API authentication issues; quota limits; schema mismatch if sheet structure changes.

#### 2.5 Routing & Notification

- **Overview:**  
  Routes feedback by category to different communication channels: Slack alerts for bugs and email reports for other categories.

- **Nodes Involved:**  
  - Categories (Switch)  
  - Slack  
  - Send Report  

- **Node Details:**  

  - **Categories**  
    - Type: *Switch*  
    - Role: Routes feedback based on the `category` field value. Specifically checks for "Bug" and "Feature Request" categories; other categories implicitly not routed further here.  
    - Configuration: Two rules for exact string equals: "Bug" and "Feature Request".  
    - Input: Feedback JSON from Google Sheets node.  
    - Output: Routes to Slack for "Bug" and Send Report (email) for "Feature Request".  
    - Edge cases: Categories outside these two are not explicitly handled; could cause dropped notifications.

  - **Slack**  
    - Type: *Slack node*  
    - Role: Sends alert messages about critical feedback (bugs) to a Slack channel or user.  
    - Configuration: Message includes dynamic insertion of candidate name and role applied fields (likely misconfigured placeholders unrelated to this workflow's data).  
    - Input: Routed from "Categories" on "Bug" category.  
    - Output: Slack message sent.  
    - Credentials: Slack OAuth2 expected but not explicitly detailed.  
    - Edge cases: Message placeholders do not match this workflow’s data schema; requires adjustment. Slack API auth failures or rate limits.

  - **Send Report**  
    - Type: *Gmail*  
    - Role: Sends email reports summarizing categorized feedback (e.g., feature requests) to stakeholders.  
    - Configuration: Subject fixed as "Energy Report" with message body referencing a URL from JSON (likely misconfigured or placeholder).  
    - Input: Routed from "Categories" node on "Feature Request" category.  
    - Output: Email sent via Gmail.  
    - Credentials: Gmail OAuth2 expected but not detailed.  
    - Edge cases: Placeholder variables may not resolve correctly; email recipient not set in parameters; auth or quota errors.

#### 2.6 Documentation & Metadata

- **Overview:**  
  Provides embedded documentation and project context for users and maintainers.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  

- **Node Details:**  

  - **Sticky Note**  
    - Type: *Sticky Note*  
    - Role: Describes the entire workflow’s purpose, core logic steps, and expected outcome in detail.  
    - Content: Explains inputs, AI processing, routing, and logging; clarifies the objective of streamlining customer feedback loops.

  - **Sticky Note1**  
    - Type: *Sticky Note*  
    - Role: Displays the workflow title "Customer Feedback Loop Analyzer" as a header.  

---

### 3. Summary Table

| Node Name              | Node Type                             | Functional Role                           | Input Node(s)              | Output Node(s)             | Sticky Note                                                                                          |
|------------------------|-------------------------------------|-----------------------------------------|---------------------------|----------------------------|----------------------------------------------------------------------------------------------------|
| On form submission     | Form Trigger                        | Input reception from customer form      | -                         | Transform and summarise     | **Purpose:** Automatically capture customer reviews from forms or emails, analyze them with AI... |
| Receive review/feedbak | Gmail Trigger                      | Input reception from labeled emails     | -                         | Extract details            | **Purpose:** Automatically capture customer reviews from forms or emails, analyze them with AI... |
| Extract details        | Code                              | Parse email sender name and review text | Receive review/feedbak     | Transform and summarise     | **Purpose:** Automatically capture customer reviews from forms or emails, analyze them with AI... |
| Transform and summarise| LangChain Information Extractor    | AI classify and summarize feedback       | On form submission, Extract details | Review data            | **Purpose:** Automatically capture customer reviews from forms or emails, analyze them with AI... |
| Google Gemini Chat Model| Google Gemini LM Chat              | Optional advanced AI processing          | -                         | Transform and summarise (ai_languageModel) | **Purpose:** Automatically capture customer reviews from forms or emails, analyze them with AI... |
| Review data            | Google Sheets                     | Log feedback data in spreadsheet         | Transform and summarise    | Categories                 | **Purpose:** Automatically capture customer reviews from forms or emails, analyze them with AI... |
| Categories             | Switch                           | Route feedback by category                | Review data               | Slack, Send Report         | **Purpose:** Automatically capture customer reviews from forms or emails, analyze them with AI... |
| Slack                  | Slack                            | Notify team of critical (Bug) feedback   | Categories                | -                          | **Purpose:** Automatically capture customer reviews from forms or emails, analyze them with AI... |
| Send Report            | Gmail                            | Email categorized report to stakeholders | Categories                | -                          | **Purpose:** Automatically capture customer reviews from forms or emails, analyze them with AI... |
| Sticky Note            | Sticky Note                      | Workflow purpose and logic documentation | -                         | -                          | **Purpose:** Automatically capture customer reviews from forms or emails, analyze them with AI... |
| Sticky Note1           | Sticky Note                      | Workflow title header                     | -                         | -                          |                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n and name it "Customer Feedback Loop Analyzer".**

2. **Add a Form Trigger node**  
   - Name: `On form submission`  
   - Configure: Set form title to "Customer Review". Add two required fields: "Name" and "Review".  
   - Position: Place at the top-left area for clarity.  
   - This node triggers workflow on form submission.

3. **Add a Gmail Trigger node**  
   - Name: `Receive review/feedbak`  
   - Configure: Set label filter to `"Label_536806471971916762"` (replace with your actual Gmail label ID).  
   - Set polling interval to every minute.  
   - Provide Gmail OAuth2 credentials.  
   - Position near the top-left but separate from the form trigger.

4. **Add a Code node**  
   - Name: `Extract details`  
   - Connect input from `Receive review/feedbak`.  
   - Paste the following JavaScript code:

    ```javascript
    const fromEmail = $input.first().json.From;
    let name = '';

    if (fromEmail.includes('<') && fromEmail.includes('>')) {
        name = fromEmail.substring(0, fromEmail.indexOf('<')).trim();
    } else {
        name = fromEmail.trim();
    }

    return { json: { name: name, Review: $input.first().json.snippet } };
    ```

   - This extracts sender name and review snippet from email data.

5. **Add a LangChain Information Extractor node**  
   - Name: `Transform and summarise`  
   - Connect inputs from both `On form submission` and `Extract details` nodes (merge via multiple inputs if needed).  
   - Set the text input to `={{ $json.Review }}` to dynamically pass the review text.  
   - Configure the system prompt to:

    ```
    You are a feedback analyst. Categorize the following user feedback into one of:
    - Bug
    - Feature Request
    - UX Issue
    - Other

    Also extract the core complaint or suggestion in a concise sentence.

    Feedback:  {{ $json.Review }}
    ```

   - Ensure LangChain credentials and API access are configured.

6. **(Optional) Add Google Gemini Chat Model node**  
   - Name: `Google Gemini Chat Model`  
   - Set model to "models/gemini-1.5-flash".  
   - Provide Google Palm API credentials.  
   - Connect this node as the `ai_languageModel` input to `Transform and summarise` for enhanced AI processing.

7. **Add a Google Sheets node**  
   - Name: `Review data`  
   - Connect input from `Transform and summarise`.  
   - Set operation to "Append".  
   - Configure document ID and sheet name to your Google Sheets feedback log.  
   - Define columns mapping:  
     - summary → `={{ $json.output.summary }}`  
     - category → `={{ $json.output.category }}`  
     - sentiment → `={{ $json.output.sentiment }}`  
     - Feedback text → `={{ $json.output["Feedback text"] }}`  
     - Timestamp → `={{ $json.output.Timestamp }}`  
   - Supply Google Sheets OAuth2 credentials.

8. **Add a Switch node**  
   - Name: `Categories`  
   - Connect input from `Review data`.  
   - Create rules for the `category` field:  
     - Equals "Bug"  
     - Equals "Feature Request"  
   - Configure outputs accordingly.

9. **Add a Slack node**  
   - Name: `Slack`  
   - Connect from the "Bug" output of `Categories`.  
   - Configure message text to notify about new bug feedback.  
   - Adjust placeholders to use fields from current JSON (e.g., `={{ $json.summary }}` or `={{ $json.name }}`).  
   - Provide Slack OAuth2 credentials.

10. **Add a Gmail node**  
    - Name: `Send Report`  
    - Connect from the "Feature Request" output of `Categories`.  
    - Configure email recipient(s).  
    - Set subject ("Feature Request Report" or similar).  
    - Compose message to summarize or link to the feedback.  
    - Provide Gmail OAuth2 credentials.

11. **Add Sticky Note nodes**  
    - Add a large Sticky Note summarizing the workflow purpose and core logic (copy content from the provided Sticky Note).  
    - Add a smaller Sticky Note with the workflow title.

12. **Connect nodes to follow the flow:**  
    - `On form submission` → `Transform and summarise`  
    - `Receive review/feedbak` → `Extract details` → `Transform and summarise`  
    - `Transform and summarise` → `Review data` → `Categories`  
    - `Categories` "Bug" output → `Slack`  
    - `Categories` "Feature Request" output → `Send Report`

13. **Test the workflow:**  
    - Submit test form entries and send labeled emails.  
    - Verify AI categorization and logging.  
    - Check Slack notifications and email reports dispatch.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                 | Context or Link                                               |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| The workflow automates customer feedback processing to ensure faster triage and response by combining form/email inputs, AI classification, and multi-channel notifications.                                                                                                                                                                   | Workflow purpose summary (Sticky Note content)                 |
| Slack message placeholders in the current workflow appear to reference unrelated fields (`candidate_name`, `role_applied`). These should be updated to relevant fields such as feedback summary or reviewer name to avoid runtime errors.                                                                                                      | Slack node misconfiguration note                               |
| Gmail "Send Report" node uses a placeholder `{{ $json.url }}` which is likely undefined in this workflow context. Replace with actual URLs or summaries to avoid blank or broken reports.                                                                                                                                                      | Gmail node template caution                                    |
| Google Gemini Chat Model node is included but not actively integrated in the main workflow path. It can be enabled for enhanced AI processing if Google Palm API credentials are available and quota permits.                                                                                                                               | Optional AI enhancement                                        |
| Review the Google Sheets document schema regularly to ensure columns match the node mapping, preventing data append failures.                                                                                                                                                                                                               | Google Sheets mapping advice                                   |
| For detailed AI prompt tuning and LangChain usage, refer to [n8n LangChain Documentation](https://docs.n8n.io/integrations/builtin/n8n-nodes-langchain/).                                                                                                                                                                                    | Official documentation                                         |

---

**Disclaimer:** The provided text is generated exclusively from an automated workflow built with n8n, a workflow automation tool. The process complies strictly with content policies and contains no illegal, offensive, or protected content. All data handled are legal and public.