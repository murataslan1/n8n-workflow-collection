Automate Blog Content Creation with OpenAI, Google Sheets & Email Approval Flow

https://n8nworkflows.xyz/workflows/automate-blog-content-creation-with-openai--google-sheets---email-approval-flow-4371


# Automate Blog Content Creation with OpenAI, Google Sheets & Email Approval Flow

### 1. Workflow Overview

This n8n workflow automates the creation, review, revision, and storage of SEO-optimized blog content using OpenAI's GPT-4 model, Google Sheets, and Gmail for human approval. It is designed to streamline content production for marketers, agencies, bloggers, and SEO professionals by integrating AI content generation with manual quality control and content management.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Topic Retrieval**: Automatically triggers the workflow on a schedule and fetches the next pending blog topic from a Google Sheets tracking sheet.
- **1.2 AI Content Generation**: Uses an AI agent powered by OpenAI to generate an SEO-optimized blog post based on the topic.
- **1.3 Human Approval via Email**: Sends the generated content for review and approval through Gmail, pausing workflow until feedback is received.
- **1.4 Conditional Approval Handling**: Evaluates the approval outcome and either completes the process or triggers AI-assisted revision based on feedback.
- **1.5 Content Revision**: Uses AI to revise the blog post based on human comments and feedback.
- **1.6 Finalization**: Updates the topic status in Google Sheets to “Completed” and saves the approved blog post content in a designated Google Sheets document.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Topic Retrieval

- **Overview:**  
  This block initiates the workflow at a user-defined interval and retrieves the next topic marked as "Pending" from the "Topic List" Google Sheet for processing.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Get Topic from Google Sheets

- **Node Details:**  

  - **Schedule Trigger**  
    - Type: Schedule Trigger (n8n-nodes-base.scheduleTrigger)  
    - Role: Automatically starts the workflow at configured intervals (e.g., daily, hourly).  
    - Configuration: Interval is user-defined; defaults to a simple interval trigger.  
    - Inputs: None (trigger node).  
    - Outputs: Triggers “Get Topic from Google Sheets” node.  
    - Edge Cases: Misconfigured interval could cause too frequent or infrequent triggering.

  - **Get Topic from Google Sheets**  
    - Type: Google Sheets (n8n-nodes-base.googleSheets)  
    - Role: Fetches the first topic with the "Pending" status from the "Topic List" sheet.  
    - Configuration:  
      - Document ID and sheet name set to "Topic List".  
      - Filters for Status = "Pending".  
      - Returns first match only, including the topic title and row number for tracking.  
    - Inputs: Trigger from Schedule Trigger.  
    - Outputs: Passes topic data to the Copywriter AI Agent.  
    - Edge Cases: No pending topics found will result in no data and downstream nodes may fail or do nothing.  
    - Credentials: Requires Google Sheets OAuth2 credentials.  

---

#### 2.2 AI Content Generation

- **Overview:**  
  This block uses OpenAI’s GPT-4 model via a LangChain agent to generate a complete SEO-optimized blog post based on the retrieved topic.

- **Nodes Involved:**  
  - Copywriter AI Agent  
  - Structured Output Parser  
  - Set Data

- **Node Details:**  

  - **Copywriter AI Agent**  
    - Type: LangChain Agent (OpenAI) (@n8n/n8n-nodes-langchain.agent)  
    - Role: Generates an improved SEO-optimized title and a full blog post (800–1200 words) based on the original topic.  
    - Configuration:  
      - Prompt includes detailed instructions for structure (headings, bullet points), tone, length, SEO optimization.  
      - Input topic injected dynamically from "Get Topic from Google Sheets".  
      - Output is structured JSON with "title" and "content".  
    - Inputs: Topic JSON from Google Sheets.  
    - Outputs: Raw AI JSON output to Structured Output Parser.  
    - Edge Cases: API rate limits, prompt failure, or malformed output could cause errors. Requires valid OpenAI API key.

  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser (@n8n/n8n-nodes-langchain.outputParserStructured)  
    - Role: Parses the AI JSON output into structured data fields for further use.  
    - Configuration: JSON schema expects "title" and "content" fields.  
    - Inputs: Output from Copywriter AI Agent.  
    - Outputs: Parsed data to Set Data node.  
    - Edge Cases: Parsing failures if AI output deviates from expected JSON format.

  - **Set Data**  
    - Type: Set (n8n-nodes-base.set)  
    - Role: Assigns parsed title and content to named variables ("Topic Title", "Content") for downstream nodes.  
    - Configuration: Uses expressions to assign from parsed AI output.  
    - Inputs: Parsed blog post JSON.  
    - Outputs: To “Send Content for Approval”.  
    - Edge Cases: Expression evaluation errors if input data missing.

---

#### 2.3 Human Approval via Email

- **Overview:**  
  Sends the generated blog content to a reviewer via Gmail for approval with an embedded form to capture approval status and feedback, pausing workflow until response.

- **Nodes Involved:**  
  - Send Content for Approval

- **Node Details:**  

  - **Send Content for Approval**  
    - Type: Gmail (n8n-nodes-base.gmail)  
    - Role: Sends an email with generated title and content, and requests approval via an interactive form.  
    - Configuration:  
      - “Send To” email address must be replaced by user’s reviewer email.  
      - Email body includes generated title and content dynamically inserted.  
      - Form fields: Dropdown “Approve Content?” (Yes/No/Cancel) and a textarea for “Content Feedback”.  
      - Uses “sendAndWait” operation which pauses execution until recipient responds.  
    - Inputs: Blog content from Set Data node.  
    - Outputs: Approval form response data to Approval Result switch.  
    - Credentials: Requires Gmail OAuth2 credentials.  
    - Edge Cases: Email delivery failure, delayed or missing responses, invalid form submission.

---

#### 2.4 Conditional Approval Handling

- **Overview:**  
  Determines next steps based on reviewer’s approval decision: complete workflow, trigger revision, or cancel.

- **Nodes Involved:**  
  - Approval Result (Switch)  
  - Copywriter Revision Agent (conditional path)  
  - Update Topic Status on Google Sheets

- **Node Details:**  

  - **Approval Result**  
    - Type: Switch (n8n-nodes-base.switch)  
    - Role: Routes workflow based on approval form response ("Yes", "No", "Cancel").  
    - Configuration: Checks "Approve Content?" field from email response exactly matching one of the three options.  
    - Inputs: Response from Send Content for Approval.  
    - Outputs:  
      - "Yes" → Update topic status as completed.  
      - "No" → Trigger Copywriter Revision Agent for content editing.  
      - "Cancel" → Update topic status as completed without saving changes.  
    - Edge Cases: Unexpected or missing response values cause routing failure.

  - **Copywriter Revision Agent**  
    - Type: LangChain Agent (@n8n/n8n-nodes-langchain.agent)  
    - Role: Revises blog content by incorporating reviewer feedback.  
    - Configuration:  
      - Prompt instructs rewriting content based on user feedback, preserving good parts, maintaining tone, and SEO focus.  
      - Inputs: Original topic, original content, and user feedback all dynamically injected.  
      - Output: Revised JSON content similar to initial generation.  
    - Inputs: Triggered on "No" path from Approval Result.  
    - Outputs: Revised content to Set Data for resubmission.  
    - Edge Cases: Same as initial AI generation; plus risk of infinite loops if feedback keeps requesting changes.

  - **Update Topic Status on Google Sheets**  
    - Type: Google Sheets (n8n-nodes-base.googleSheets)  
    - Role: Updates the status of the topic to "Completed" to prevent re-processing.  
    - Configuration:  
      - Uses row number from original topic fetch to update specific row.  
      - Updates "Status" column to "Completed" in "Topic List" sheet.  
    - Inputs: From Approval Result "Yes" or "Cancel" path, and from Copywriter Revision Agent after revision.  
    - Outputs: Triggers “Add Generated Content to Google Sheets” node on success.  
    - Edge Cases: Row number missing or sheet access issues may cause update failure.

---

#### 2.5 Content Finalization and Storage

- **Overview:**  
  Saves the approved or revised content permanently into a Google Sheets document and completes the workflow.

- **Nodes Involved:**  
  - Add Generated Content to Google Sheets

- **Node Details:**  

  - **Add Generated Content to Google Sheets**  
    - Type: Google Sheets (n8n-nodes-base.googleSheets)  
    - Role: Appends the finalized blog post data to the "Generated Content" sheet for permanent storage.  
    - Configuration:  
      - Columns: Title, Content, Generation Date (current timestamp).  
      - Document ID and sheet name set accordingly.  
      - Append operation mode.  
    - Inputs: Updated content data from Set Data or Update Topic Status node.  
    - Outputs: None (workflow end).  
    - Edge Cases: Permission issues or sheet structure changes can cause failure.  
    - Credentials: Requires Google Sheets OAuth2 credentials.

---

### 3. Summary Table

| Node Name                     | Node Type                                    | Functional Role                        | Input Node(s)                  | Output Node(s)                      | Sticky Note                                                                                                   |
|-------------------------------|----------------------------------------------|-------------------------------------|-------------------------------|-----------------------------------|---------------------------------------------------------------------------------------------------------------|
| Schedule Trigger               | Schedule Trigger (n8n-nodes-base.scheduleTrigger) | Triggers workflow at intervals      | None                          | Get Topic from Google Sheets      | 🕒 WORKFLOW STARTER This triggers the content generation process automatically. Setup Required: • Set your preferred trigger interval. |
| Get Topic from Google Sheets   | Google Sheets (n8n-nodes-base.googleSheets)  | Fetches next pending topic           | Schedule Trigger              | Copywriter AI Agent               | 📊 TOPIC RETRIEVAL Fetches the first "Pending" topic from your topic list. Setup Required: • Connect your Google account • Update Sheet ID and ensure Topic List sheet with required columns |
| Copywriter AI Agent            | LangChain Agent (@n8n/n8n-nodes-langchain.agent) | Generates SEO-optimized blog post    | Get Topic from Google Sheets  | Set Data                         | 🤖 CONTENT CREATION AI writes SEO-optimized blog posts (800-1200 words). Setup Required: • Add OpenAI API key in credentials • Uses structured prompts for consistency |
| Structured Output Parser       | LangChain Output Parser (@n8n/n8n-nodes-langchain.outputParserStructured) | Parses AI JSON output                | Copywriter AI Agent           | Copywriter AI Agent (ai_outputParser) |                                                                                                               |
| Set Data                      | Set (n8n-nodes-base.set)                      | Assigns title and content variables  | Structured Output Parser      | Send Content for Approval         |                                                                                                               |
| Send Content for Approval      | Gmail (n8n-nodes-base.gmail)                  | Sends content email for approval     | Set Data                     | Approval Result                   | 📧 HUMAN REVIEW Sends the generated content via email for approval. Update the To Email Field in the Gmail node with your own email address. Workflow pauses until response. |
| Approval Result               | Switch (n8n-nodes-base.switch)                 | Routes based on approval response    | Send Content for Approval     | Update Topic Status, Copywriter Revision Agent |                                                                                                               |
| Copywriter Revision Agent      | LangChain Agent (@n8n/n8n-nodes-langchain.agent) | Revises content based on feedback    | Approval Result (No path)     | Set Data                         | ✏️ CONTENT REVISION AI improves content based on human feedback. Triggered when: Approval = "No" Uses original topic, feedback, and content |
| Update Topic Status on Google Sheets | Google Sheets (n8n-nodes-base.googleSheets)  | Marks topic as completed              | Approval Result (Yes/Cancel), Copywriter Revision Agent | Add Generated Content to Google Sheets | ✅ TOPIC STATUS UPDATE Updates topic status to "Completed" in tracking sheet to prevent duplicate processing. |
| Add Generated Content to Google Sheets | Google Sheets (n8n-nodes-base.googleSheets)  | Saves approved content for record    | Update Topic Status on Google Sheets | None                            | 💾 ADD GENERATED CONTENT Saves approved content to "Generated Content" sheet with Title, Content, and Date columns. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure to run at your preferred interval (e.g., daily at 8 AM).  
   - No credentials needed.

2. **Add Google Sheets Node: Get Topic from Google Sheets**  
   - Type: Google Sheets  
   - Operation: Lookup / Read rows  
   - Connect your Google Sheets OAuth2 credentials.  
   - Document ID: Your Google Sheet ID containing the topics.  
   - Sheet Name: “Topic List” (ensure this sheet exists).  
   - Filter: Status equals “Pending”.  
   - Return First Match only.  
   - Output fields: Topic (string), row_number (string or number).  
   - Connect Schedule Trigger output to this node.

3. **Add LangChain Agent Node: Copywriter AI Agent**  
   - Type: LangChain Agent  
   - Connect OpenAI API credentials (API key).  
   - Model: GPT-4 or GPT-4o-mini as available.  
   - Prompt: Define a detailed SEO content creation prompt instructing the agent to improve the topic title and write a full blog post (800-1200 words) with SEO best practices and output JSON with "title" and "content".  
   - Input variable: Pass the topic from the previous Google Sheets node.  
   - Connect Get Topic from Google Sheets output to this node.

4. **Add LangChain Output Parser Node: Structured Output Parser**  
   - Use a JSON schema expecting fields “title” and “content”.  
   - Connect Copywriter AI Agent output to this node.

5. **Add Set Node: Set Data**  
   - Assign variables:  
     - Topic Title = parsed JSON field "title"  
     - Content = parsed JSON field "content"  
   - Connect Structured Output Parser output to this node.

6. **Add Gmail Node: Send Content for Approval**  
   - Type: Gmail  
   - Credentials: Connect Gmail OAuth2 credentials.  
   - Operation: Send and wait (to pause until user response).  
   - To: Set your reviewer email address.  
   - Subject: e.g., “Approval Required for Blog Content”.  
   - Message Body: Include “Generated Title” and “Generated Content” using expressions from Set Data node.  
   - Add Form Fields:  
     - Dropdown “Approve Content?” with options Yes, No, Cancel (required).  
     - Textarea “Content Feedback” (optional).  
   - Connect Set Data output to this node.

7. **Add Switch Node: Approval Result**  
   - Conditions on “Approve Content?” field:  
     - Yes → path 1  
     - No → path 2  
     - Cancel → path 3  
   - Connect Send Content for Approval output to this node.

8. **Add LangChain Agent Node: Copywriter Revision Agent**  
   - Same model and credentials as Copywriter AI Agent.  
   - Prompt: Instructions to revise the blog post using original content, topic, and user feedback.  
   - Inputs:  
     - Topic from Google Sheets.  
     - Original content from Copywriter AI Agent.  
     - User feedback from Send Content for Approval.  
   - Connect Switch Node “No” output to this node.

9. **Add Set Node: Set Data (for revised content)**  
   - Same as previous Set Data node, assign “Topic Title” and “Content” fields from parsed revision output.  
   - Connect Copywriter Revision Agent output to this node.

10. **Add Google Sheets Node: Update Topic Status on Google Sheets**  
    - Operation: Update row  
    - Credentials: Google Sheets OAuth2.  
    - Document ID and Sheet Name: Same as initial topic list.  
    - Use row number from initial topic fetch.  
    - Update “Status” column to “Completed”.  
    - Connect Switch Node outputs "Yes" and "Cancel" here and also connect from Set Data after revision (i.e., after revision is approved).  

11. **Add Google Sheets Node: Add Generated Content to Google Sheets**  
    - Operation: Append row  
    - Credentials: Google Sheets OAuth2.  
    - Document ID and Sheet Name: Separate sheet named “Generated Content”.  
    - Columns: Title, Content, Generation Date (use expression $now).  
    - Connect Update Topic Status node output to this node.

12. **Connect Nodes in sequence as per the flow:**  
    Schedule Trigger → Get Topic → Copywriter AI Agent → Structured Output Parser → Set Data → Send Content for Approval → Approval Result (Switch)  
    - Switch "Yes" → Update Topic Status → Add Generated Content  
    - Switch "No" → Copywriter Revision Agent → Structured Output Parser (if needed) → Set Data → Send Content for Approval (loop back if workflow supports) or Update Topic Status → Add Generated Content  
    - Switch "Cancel" → Update Topic Status → Add Generated Content (optional or end)  

13. **Validation & Testing:**  
    - Test each step individually with sample data.  
    - Confirm Google Sheets have correct structure and permissions.  
    - Replace all placeholder emails and credentials with real values.  
    - Review timeout and error handling options on critical nodes.

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Google Sheets must have two sheets with exact columns: "Topic List" (Topic, Status, row_number) and "Generated Content" (Title, Content, Generation Date). | See Sticky Note2 and Sticky Note7 in workflow for details. |
| OpenAI API Key is required with GPT-4 or GPT-4o-mini enabled for content creation and revision. | Refer to OpenAI account setup. |
| Gmail OAuth2 credentials are required for sending approval emails with embedded forms. | Gmail node configuration. |
| The workflow includes pauses awaiting manual email approval responses, which may introduce delays in automation. | See Sticky Note6 and Send Content for Approval node configuration. |
| Avoid infinite revision loops by limiting revision cycles externally or by manual intervention. | Suggested best practice to prevent workflow lock. |
| This workflow is ideal for content marketers, agencies, bloggers, and SEO professionals looking for scalable content creation with human quality checks. | See Sticky Note8 and Sticky Note9 for overview and use cases. |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.