Automate Invoice Processing from Gmail with Azure GPT-4.1 and Human Verification

https://n8nworkflows.xyz/workflows/automate-invoice-processing-from-gmail-with-azure-gpt-4-1-and-human-verification-6062


# Automate Invoice Processing from Gmail with Azure GPT-4.1 and Human Verification

### 1. Workflow Overview

This workflow automates the processing of invoices received via Gmail by leveraging Azure GPT-4.1 for AI-based invoice verification and human verification if needed. It is designed to detect invoice emails with PDF attachments, analyze their content to confirm if they are actual invoices, save valid invoices locally, and send notifications accordingly.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Filtering:** Triggered by new emails from a specific Gmail account, filtering for emails with PDF attachments and "Invoice" in the subject.
- **1.2 Invoice Content Extraction and AI Verification:** Extracts text from the PDF attachment and uses Azure GPT-4.1 to analyze if the content corresponds to an invoice.
- **1.3 Decision and Human Verification:** Based on AI output, either proceeds to save the invoice or requests manual user verification.
- **1.4 File Saving and Notifications:** Saves confirmed invoice PDFs locally and sends success or manual verification request emails.
- **1.5 Error Handling:** Handles cases where no valid PDF invoice is found or errors occur during extraction.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Filtering

- **Overview:**  
  This block triggers the workflow on receiving new emails from a specific sender, filters incoming emails for PDF attachments and the presence of the keyword "Invoice" in the subject.

- **Nodes Involved:**  
  - Gmail Trigger  
  - Is this PDF? (IF node)  
  - Error Handler

- **Node Details:**

  - **Gmail Trigger**  
    - Type: Gmail Trigger  
    - Role: Watches Gmail inbox for new emails from a specified sender.  
    - Configuration: Triggers every minute; filters emails by sender email `youremail@gmail.com`; downloads attachments.  
    - Inputs: None (trigger node)  
    - Outputs: Email data including subject, sender, and binary attachments.  
    - Edge Cases: OAuth2 authentication errors; Gmail API rate limits; no emails from sender.  

  - **Is this PDF? (IF node)**  
    - Type: IF (Conditional)  
    - Role: Checks if the email subject contains "Invoice" and if there is at least one binary attachment (PDF).  
    - Configuration: Two string conditions combined: subject contains "Invoice" AND attachment_0 is not empty.  
    - Inputs: Email data from Gmail Trigger  
    - Outputs:  
      - True branch: proceeds to merge and information extraction nodes.  
      - False branch: triggers Error Handler.  
    - Edge Cases: Emails with no attachments or incorrect subject line.  

  - **Error Handler**  
    - Type: Stop and Error  
    - Role: Stops workflow execution and raises an error with message "There is no pdf file!" when no valid invoice PDF is detected.  
    - Inputs: False branch from Is this PDF? node  
    - Outputs: Stops workflow  
    - Edge Cases: Workflow termination on missing or invalid attachments.

#### 2.2 Invoice Content Extraction and AI Verification

- **Overview:**  
  Extracts textual information from the PDF attachment and uses Azure GPT-4.1 via Langchain's Information Extractor node to determine if the document is an invoice.

- **Nodes Involved:**  
  - Merge  
  - Information Extractor  
  - Azure OpenAI Chat Model  
  - IF: AI Says Yes  
  - Send a message (for failed AI classification)

- **Node Details:**

  - **Merge**  
    - Type: Merge  
    - Role: Combines two input branches, used here to merge the workflow path after the IF: AI Says Yes decision and initial PDF validation.  
    - Configuration: Mode "chooseBranch" to select the branch dynamically.  
    - Inputs: True branch from "Is this PDF?" and True branch from "IF: AI Says Yes"  
    - Outputs: To "Save PDF Locally" or other nodes.  

  - **Information Extractor**  
    - Type: Langchain Information Extractor  
    - Role: Uses a system prompt to analyze text extracted from the PDF and respond with "Yes" or "No" if it is an invoice.  
    - Configuration:  
      - Input: Text from PDF (property `text` from JSON)  
      - System Prompt: Expert reviewing invoices to answer "Yes" or "No"  
      - Schema: Manual JSON schema defining expected output structure.  
      - On Error: Continue with error output (does not fail workflow on extraction errors).  
    - Inputs: Text data from binary PDF extraction via Merge node  
    - Outputs: AI classification result.  
    - Edge Cases: Parsing errors, unexpected AI output format, API errors with Azure GPT.  

  - **Azure OpenAI Chat Model**  
    - Type: Langchain Azure OpenAI Chat Model  
    - Role: Provides AI model backend for the Information Extractor node, using GPT-4.1.  
    - Configuration: Model set to "gpt-4.1" with default options.  
    - Credentials: Azure OpenAI API credentials required.  
    - Inputs: Text input from Merge node (indirectly)  
    - Outputs: AI-generated classification data to Information Extractor.  
    - Edge Cases: API throttling, authentication failures, latency.  

  - **IF: AI Says Yes**  
    - Type: IF  
    - Role: Evaluates AI output to check if the invoice classification is "Yes".  
    - Configuration: Checks if the string in `$json.output[0].insights[0].body` contains "Yes".  
    - Inputs: Output from Information Extractor  
    - Outputs:  
      - True branch: proceeds to Merge node to save the file.  
      - False branch: triggers Manual Verification email node.  
    - Edge Cases: AI output not containing expected keys; false negatives or positives from AI classification.  

  - **Send a message**  
    - Type: Gmail node (send and wait)  
    - Role: Sends an email requesting manual confirmation if AI is uncertain or says "No".  
    - Configuration:  
      - Recipient: `receiver@gmail.com`  
      - Message: Request to confirm if the file is an invoice.  
      - Subject: "Approval Required!"  
      - Operation: sendAndWait with double approval required (human verification).  
    - Inputs: False branch from IF: AI Says Yes  
    - Outputs: Waits for human response, which influences decision flow.  
    - Edge Cases: Email delivery failure, no human response, timeout on approval.

#### 2.3 Decision and Human Verification

- **Overview:**  
  If AI classification fails or returns "No", the workflow requests manual verification by sending an email. Upon human approval, the workflow updates the decision to "Yes" and proceeds with saving.

- **Nodes Involved:**  
  - Manual Verification (Gmail node)  
  - IF: AI Says Yes (re-evaluated via Merge node)

- **Node Details:**

  - **Manual Verification**  
    - Type: Gmail node (send)  
    - Role: Sends a notification email to a specific receiver to manually verify the legitimacy of the invoice.  
    - Configuration:  
      - Recipient: `receiveremail@gmail.com`  
      - Message: "The latest invoice does not seem to be legit. Please verify it manually."  
      - Subject: "Manual Verification Required"  
    - Inputs: False branch from IF: AI Says Yes  
    - Outputs: Ends flow or waits for manual input externally.  
    - Edge Cases: Email delivery issues, delayed human response.  

  - **Merge (used again)**  
    - Role: Combines human verification approval path with AI "Yes" path for subsequent nodes.  
    - Inputs: True branch from IF: AI Says Yes and approval from Manual Verification if applicable.  
    - Outputs: Leads to saving the PDF locally.

#### 2.4 File Saving and Notifications

- **Overview:**  
  Saves confirmed invoice PDFs to a specified local directory and sends confirmation emails to notify successful processing.

- **Nodes Involved:**  
  - Save PDF Locally  
  - Invoice Saved Message

- **Node Details:**

  - **Save PDF Locally**  
    - Type: Write Binary File  
    - Role: Saves the PDF attachment locally with a timestamped filename.  
    - Configuration:  
      - Filename: `C:/Test/Invoices/invoice_yyyyLLdd_HHmmss.pdf` with dynamic timestamp.  
      - Data source: `attachment_0` binary data from the email.  
    - Inputs: True branch from Merge node (confirmed invoices)  
    - Outputs: Invoice Saved Message node  
    - Edge Cases: File system permission errors, disk full, invalid filename characters.

  - **Invoice Saved Message**  
    - Type: Gmail node (send)  
    - Role: Sends an email notifying that the invoice has been saved successfully.  
    - Configuration:  
      - Recipient: `receiver@gmail.com`  
      - Subject: "Invoice Downloaded"  
      - Message: Includes invoice subject and sender name dynamically.  
    - Inputs: True branch from Save PDF Locally  
    - Outputs: Workflow end  
    - Edge Cases: Email delivery failures.

#### 2.5 Error Handling and Annotations

- **Overview:**  
  Handles error paths and provides user guidance via sticky notes for clarity about workflow roles.

- **Nodes Involved:**  
  - Sticky Note, Sticky Note1, Sticky Note2, Sticky Note3, Sticky Note4, Sticky Note5  
  - Error Handler (described above)

- **Node Details:**

  - **Sticky Notes**  
    - Type: Sticky Note  
    - Role: Provide visual documentation and explanations within the workflow editor.  
    - Content Highlights:  
      - Trigger details and filtering criteria.  
      - Explanation about text extraction and invoice verification logic.  
      - Instructions on AI decision branching and manual verification.  
      - Saving and notification process.  
      - Overall purpose: automating invoice saving from emails.  
    - Inputs/Outputs: None (decorative).  

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                                   | Input Node(s)         | Output Node(s)           | Sticky Note                                                                                         |
|-------------------------|----------------------------------|-------------------------------------------------|-----------------------|--------------------------|---------------------------------------------------------------------------------------------------|
| Gmail Trigger           | Gmail Trigger                    | Detect new emails from specific sender           | None                  | Is this PDF?              | Triggers Gmail when new email from specific email account is received.                            |
| Is this PDF?             | IF                              | Checks for "Invoice" in subject and PDF attachment | Gmail Trigger         | Merge (true), Error Handler (false) | Checks if there is any pdf attachments in email, and Invoice is included in subject               |
| Error Handler            | Stop and Error                  | Stops workflow when no valid PDF found            | Is this PDF? (false)  | None                     | If both are true, it extracts the information from the pdf. If not, it gives an error about missing invoice file. |
| Merge                   | Merge                           | Merges true path from PDF check and AI "Yes" path | Is this PDF?, IF: AI Says Yes (true) | Save PDF Locally          |                                                                                                   |
| Information Extractor    | Langchain Information Extractor | Extracts and analyzes text to classify invoice    | Merge (true branch)   | IF: AI Says Yes (true), Send a message (false) | This checks the extracted information from the pdf and analyze if it is invoice. Based on information, outputs "Yes" or "No". |
| IF: AI Says Yes          | IF                              | Checks if AI classified document as invoice       | Information Extractor | Merge (true), Manual Verification (false) |                                                                                                   |
| Send a message           | Gmail (sendAndWait)             | Requests manual confirmation if AI says "No"      | Information Extractor (false) | Manual Verification (on approval) |                                                                                                   |
| Manual Verification      | Gmail (send)                   | Sends manual verification request                  | IF: AI Says Yes (false) | None                     |                                                                                                   |
| Save PDF Locally         | Write Binary File               | Saves invoice PDF locally                           | Merge                  | Invoice Saved Message     | After verifying invoice, saves file locally and sends success email.                             |
| Invoice Saved Message    | Gmail (send)                   | Sends confirmation email on successful save       | Save PDF Locally       | None                     |                                                                                                   |
| Azure OpenAI Chat Model  | Langchain Chat Model Azure GPT-4.1 | Backend AI model for text analysis                | Connected to Information Extractor | Information Extractor |                                                                                                   |
| Sticky Note              | Sticky Note                    | Documentation                                      | None                  | None                     | Triggers Gmail when new email from specific email account is received.                            |
| Sticky Note1             | Sticky Note                    | Documentation                                      | None                  | None                     | Checks if there is any pdf attachments in email, and Invoice is included in subject               |
| Sticky Note2             | Sticky Note                    | Documentation                                      | None                  | None                     | Explains extraction or error path if no invoice file included.                                   |
| Sticky Note3             | Sticky Note                    | Documentation                                      | None                  | None                     | Details AI verification logic and manual verification steps.                                     |
| Sticky Note4             | Sticky Note                    | Documentation                                      | None                  | None                     | Explains saving and notification after invoice confirmation.                                     |
| Sticky Note5             | Sticky Note                    | Documentation                                      | None                  | None                     | General purpose note: "Use this to automatically save invoice received in an email"              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Type: Gmail Trigger  
   - Credentials: Connect with Gmail OAuth2 account  
   - Parameters:  
     - Filter by sender: `youremail@gmail.com`  
     - Poll every minute  
     - Enable download attachments  
   - Connect output to "Is this PDF?" node.  

2. **Create IF Node "Is this PDF?"**  
   - Type: IF  
   - Conditions:  
     - Subject contains "Invoice" (string condition)  
     - Attachment_0 is not empty (binary attachment condition)  
   - Connect true output to "Merge" and "Information Extractor" nodes (see step 4 and 5)  
   - Connect false output to "Error Handler" node.  

3. **Create Stop and Error Node "Error Handler"**  
   - Type: Stop and Error  
   - Parameters:  
     - Error message: "There is no pdf file!"  
   - Connect input from false branch of "Is this PDF?".  

4. **Create Merge Node "Merge"**  
   - Type: Merge  
   - Mode: chooseBranch  
   - Inputs:  
     - True branch from "Is this PDF?"  
     - True branch from "IF: AI Says Yes" (step 9)  
   - Connect output to "Save PDF Locally".  

5. **Create Langchain Azure OpenAI Chat Model Node**  
   - Type: Langchain Chat Azure OpenAI  
   - Credentials: Azure OpenAI API credentials  
   - Model: GPT-4.1  
   - Connect output to Information Extractor node.  

6. **Create Information Extractor Node**  
   - Type: Langchain Information Extractor  
   - Parameters:  
     - Text input from PDF text property  
     - System prompt: "You are an expert reviewing invoices. Analyze the texts and say if it is an invoice. Just answer 'Yes' or 'No'."  
     - Schema: Manual JSON schema expecting "topic" and "insights" with "title" and "body" fields  
     - On error: Continue with error output  
   - Connect input from Merge node (true branch from "Is this PDF?")  
   - Connect AI language model input to Azure OpenAI Chat Model node output  
   - Connect outputs to IF node "IF: AI Says Yes" (true) and "Send a message" (false).  

7. **Create IF Node "IF: AI Says Yes"**  
   - Type: IF  
   - Condition: Check if `$json.output[0].insights[0].body` contains "Yes"  
   - Connect true output to Merge node (second input)  
   - Connect false output to "Manual Verification" node.  

8. **Create Gmail Node "Send a message"**  
   - Type: Gmail (sendAndWait)  
   - Credentials: Gmail OAuth2  
   - Parameters:  
     - To: `receiver@gmail.com`  
     - Subject: "Approval Required!"  
     - Message: "I had trouble parsing the recent invoice. Can you please confirm that it is an invoice?"  
     - Operation: sendAndWait  
     - Approval: double approval required  
   - Connect input from false output of "IF: AI Says Yes"  
   - Connect output to "Manual Verification" node on approval.  

9. **Create Gmail Node "Manual Verification"**  
   - Type: Gmail (send)  
   - Credentials: Gmail OAuth2  
   - Parameters:  
     - To: `receiveremail@gmail.com`  
     - Subject: "Manual Verification Required"  
     - Message: "The latest invoice does not seem to be legit. Please verify it manually."  
   - Connect input from "Send a message" approval output  
   - This node ends this branch or waits for further manual input externally.  

10. **Create Write Binary File Node "Save PDF Locally"**  
    - Type: Write Binary File  
    - Parameters:  
      - File name: `C:/Test/Invoices/invoice_{{ $now.toFormat('yyyyLLdd_HHmmss') }}.pdf`  
      - Data property: `attachment_0` (binary PDF)  
    - Connect input from Merge node (true branch)  
    - Connect output to "Invoice Saved Message".  

11. **Create Gmail Node "Invoice Saved Message"**  
    - Type: Gmail (send)  
    - Credentials: Gmail OAuth2  
    - Parameters:  
      - To: `receiver@gmail.com`  
      - Subject: `Invoice Downloaded`  
      - Message: Dynamic content with invoice subject and sender name.  
    - Connect input from "Save PDF Locally" output  

12. **Add Sticky Notes (optional, for documentation)**  
    - Add explanatory sticky notes at relevant workflow points to clarify logic to users.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Use Gmail OAuth2 credentials with appropriate scopes to access emails and send messages securely.      | Gmail OAuth2 credentials setup in n8n credentials section.                                          |
| Azure OpenAI GPT-4.1 requires valid Azure OpenAI API credentials with access to the GPT-4.1 model.      | https://learn.microsoft.com/en-us/azure/cognitive-services/openai/                                 |
| The workflow includes approval steps requiring a human to confirm uncertain invoice emails.             | Approval handled via Gmail sendAndWait operation with double approval option.                       |
| Local file saving path must exist and have write permissions for workflow to save invoice PDFs.         | File path: `C:/Test/Invoices/` must be accessible to n8n runtime environment.                       |
| Sticky notes provide in-editor documentation; consider maintaining them to assist future users.         | Sticky notes are visual only; no runtime effect.                                                   |

---

**Disclaimer:** The provided description and analysis are exclusively from an n8n automated workflow and strictly comply with content policies. No illegal, offensive, or protected content is included. All handled data are legal and public.