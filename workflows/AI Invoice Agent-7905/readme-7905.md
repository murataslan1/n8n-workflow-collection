AI Invoice Agent

https://n8nworkflows.xyz/workflows/ai-invoice-agent-7905


# AI Invoice Agent

### 1. Workflow Overview

The **AI Invoice Agent** workflow automates the generation, emailing, and tracking of client invoices for a creative agency named "Upward Engine." It is designed for use cases where invoice data is stored and maintained in a Google Sheets spreadsheet, and invoices are sent via Gmail with AI-generated email content and PDF attachments. The workflow logically divides into these blocks:

- **1.1 Input Reception:** Manual trigger to start the workflow and read invoice data from Google Sheets.
- **1.2 Filtering & Data Preparation:** Filter pending invoices and enrich invoice data by setting dates and mapping client/project fields.
- **1.3 Batch Processing:** Split invoice data into batches (single items) for sequential processing.
- **1.4 AI Email Generation:** Use a LangChain AI agent to compose a professional invoice email, then extract email subject and body.
- **1.5 PDF Invoice Generation:** Create a PDF invoice using CraftMyPDF with dynamic invoice and client details.
- **1.6 Email Dispatch:** Send the invoice email with the generated PDF attached via Gmail.
- **1.7 Status Update:** Update the invoice status to "Completed" in Google Sheets and record the invoice/due dates.

Two sticky notes provide setup instructions and a tutorial video link.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block initiates the workflow manually and reads all invoice data from a connected Google Sheet.
- **Nodes Involved:** `When clicking ‘Execute workflow’`, `Google Sheets`

##### Node: When clicking ‘Execute workflow’

- **Type & Role:** Manual trigger node; starts the workflow on user execution.
- **Configuration:** No parameters needed.
- **Inputs/Outputs:** No input; output triggers Google Sheets node.
- **Edge Cases:** None; manual trigger.
- **Version:** v1.

##### Node: Google Sheets

- **Type & Role:** Reads rows from the "Client Invoices" Google Sheet.
- **Configuration:** Reads from the first sheet (`gid=0`) of the document with ID `1d7CWcM_Ge6s2iaoGXOsxykLQFsDa_iyEFyP0qxJ9Qbs`.
- **Key Variables:** Loads all invoice rows, expecting columns like Invoice ID, Client Name, Client Email, Status, etc.
- **Input:** Trigger from manual node.
- **Output:** Passes data to the `Filter` node.
- **Edge Cases:** Google API auth errors, sheet structure changes, empty data.
- **Version:** 4.6.

---

#### 2.2 Filtering & Data Preparation

- **Overview:** Filters invoices with `Status = "Pending"` and sets default invoice and due dates, mapping relevant fields.
- **Nodes Involved:** `Filter`, `Edit Fields`

##### Node: Filter

- **Type & Role:** Filters incoming rows to process only invoices with `Status` exactly `"Pending"`.
- **Configuration:** Condition: `$json.Status == "Pending"`.
- **Inputs:** Data from Google Sheets.
- **Outputs:** Passes filtered invoices to `Edit Fields`.
- **Edge Cases:** Case sensitivity may cause missed invoices if status has different casing.
- **Version:** 2.2.

##### Node: Edit Fields

- **Type & Role:** Sets/updates fields for each invoice row.
- **Configuration:** 
  - Copies invoice fields (Invoice ID, Client Name, Client Address, Project Name, Amount).
  - Sets `Invoice Date` to current date.
  - Sets `Due Date` to 7 days after current date.
- **Key Expressions:** Uses expressions like `$now.format('yyyy-MM-dd')` and `$now.plus({day:7}).format('yyyy-MM-dd')`.
- **Input:** Filtered rows.
- **Output:** Sends enriched data to `Loop Over Items`.
- **Edge Cases:** Date formatting errors if system time misconfigured.
- **Version:** 3.4.

---

#### 2.3 Batch Processing

- **Overview:** Processes invoices one by one to facilitate individual email and PDF generation.
- **Nodes Involved:** `Loop Over Items`

##### Node: Loop Over Items

- **Type & Role:** SplitInBatches node; processes invoices individually.
- **Configuration:** Default batch size (1).
- **Input:** Enriched invoice data from `Edit Fields`.
- **Outputs:** 
  - Main output with no data (used for control flow).
  - Secondary output passes single invoice data to AI Agent for email generation.
- **Edge Cases:** Large batch sizes could cause performance issues.
- **Version:** 3.

---

#### 2.4 AI Email Generation

- **Overview:** Uses AI to generate a professional email draft for each invoice and extracts structured subject and body.
- **Nodes Involved:** `AI Agent`, `Information Extractor`, `GPT - 4.1 mini`

##### Node: GPT - 4.1 mini

- **Type & Role:** OpenAI GPT language model node used by LangChain AI Agent.
- **Configuration:** Model set to `gpt-4.1-mini`.
- **Credentials:** OpenAI API key configured.
- **Input:** AI Agent's prompt.
- **Output:** Text completion results to AI Agent and Information Extractor.
- **Edge Cases:** API rate limits, network issues.
- **Version:** 1.2.

##### Node: AI Agent

- **Type & Role:** LangChain agent node that crafts an email text using invoice details.
- **Configuration:** 
  - Prompt instructs a professional, polite email including client name, project, amounts, invoice ID, dates.
  - Tone: friendly, business-oriented.
  - Sign off as "Upward Engine Team".
- **Input:** Single invoice data from batch.
- **Output:** Raw AI text passed to `Information Extractor`.
- **Edge Cases:** AI misunderstanding data, incomplete info causing poor emails.
- **Version:** 2.

##### Node: Information Extractor

- **Type & Role:** LangChain node extracting email subject and body from AI text output.
- **Configuration:** Extracts two attributes: `email subject` and `email body`.
- **Input:** AI Agent output.
- **Output:** Structured email content for Gmail node.
- **Edge Cases:** Extraction errors if AI text format changes.
- **Version:** 1.2.

---

#### 2.5 PDF Invoice Generation

- **Overview:** Creates a professional PDF invoice using a CraftMyPDF template, dynamically filled with invoice and client data.
- **Nodes Involved:** `CraftMyPDF`

##### Node: CraftMyPDF

- **Type & Role:** PDF generation node using CraftMyPDF service.
- **Configuration:** 
  - Uses a predefined template (replace `YOUR_TEMPLATE_ID` with actual).
  - Populates company info (Upward Engine), client info, invoice ID, dates, amount, project name.
  - Exports PDF as binary file attachment.
- **Input:** Structured invoice info from Information Extractor.
- **Output:** PDF file sent to Gmail node.
- **Edge Cases:** Missing template ID causes failure; network or API errors.
- **Version:** 1.
- **Notes:** Requires CraftMyPDF node installed in n8n.

---

#### 2.6 Email Dispatch

- **Overview:** Sends the AI-generated email with PDF attachment to the client using Gmail.
- **Nodes Involved:** `Gmail`

##### Node: Gmail

- **Type & Role:** Sends email via Gmail API.
- **Configuration:** 
  - Recipient email from original Google Sheets data (`Client Email`).
  - Subject and body from Information Extractor.
  - Attaches generated PDF (`output.pdf` binary).
  - Email type: plain text.
  - Attribution disabled.
- **Credentials:** Gmail OAuth2 configured.
- **Input:** PDF from CraftMyPDF and email content.
- **Output:** Triggers Google Sheets update.
- **Edge Cases:** Gmail API quota, auth token expiration, invalid email addresses.
- **Version:** 2.1.

---

#### 2.7 Status Update

- **Overview:** Updates the invoice row in Google Sheets marking the invoice as "Completed" with the updated dates.
- **Nodes Involved:** `Google Sheets1`

##### Node: Google Sheets1

- **Type & Role:** Append or update operation on Google Sheets to set `Status` to "Completed".
- **Configuration:** 
  - Updates row matching `Invoice ID`.
  - Updates `Status`, `Due Date`, and `Invoice Date` fields.
- **Input:** Triggered after email sent.
- **Output:** Loops back to batch node for next invoice.
- **Edge Cases:** Sheet locking, sync conflicts, missing invoice ID.
- **Version:** 4.6.

---

#### 2.8 Sticky Notes (Setup & Tutorial)

- **Sticky Note (General Setup):** Explains installation of CraftMyPDF node, sheet preparation, filtering criteria, AI email generation, PDF generation, email sending, and status update.
- **Sticky Note (Tutorial):** Link and thumbnail to a YouTube video demonstrating the workflow usage.

---

### 3. Summary Table

| Node Name                   | Node Type                         | Functional Role                      | Input Node(s)                  | Output Node(s)                | Sticky Note                                                                                                                         |
|-----------------------------|----------------------------------|------------------------------------|-------------------------------|------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Workflow start trigger              | None                          | Google Sheets                 |                                                                                                                                     |
| Google Sheets               | Google Sheets                    | Reads invoice data from sheet      | When clicking ‘Execute workflow’ | Filter                       |                                                                                                                                     |
| Filter                     | Filter                          | Filters only pending invoices      | Google Sheets                 | Edit Fields                  |                                                                                                                                     |
| Edit Fields                | Set                             | Sets invoice and due dates, maps fields | Filter                      | Loop Over Items              |                                                                                                                                     |
| Loop Over Items            | SplitInBatches                  | Processes invoices one by one      | Edit Fields, Google Sheets1    | AI Agent (secondary output)  |                                                                                                                                     |
| AI Agent                   | LangChain Agent                 | Generates professional email text  | Loop Over Items               | Information Extractor        |                                                                                                                                     |
| GPT - 4.1 mini             | OpenAI GPT Model                | AI language model for agent         | AI Agent (ai_languageModel)   | AI Agent, Information Extractor |                                                                                                                                     |
| Information Extractor      | LangChain Information Extractor | Extracts email subject and body     | AI Agent                     | CraftMyPDF                  |                                                                                                                                     |
| CraftMyPDF                 | PDF Generator                   | Generates invoice PDF               | Information Extractor         | Gmail                       | ✅ Make sure **CraftMyPDF** node is installed in your n8n otherwise it will show error. If first time it doesn't shows the node then install and reload workflow. |
| Gmail                      | Gmail Node                     | Sends email with PDF attachment    | CraftMyPDF                   | Google Sheets1              |                                                                                                                                     |
| Google Sheets1             | Google Sheets                  | Updates invoice status to Completed | Gmail                        | Loop Over Items             |                                                                                                                                     |
| Sticky Note                | Sticky Note                    | Setup instructions and guide       | None                        | None                       | ✅ Make sure **CraftMyPDF** node is installed in your n8n otherwise it will show error. Detailed setup steps included.             |
| Sticky Note3               | Sticky Note                    | Tutorial video link                 | None                        | None                       | ## Start here: Step by Step Youtube Tutorial :star:\n[![AI Invoice Agent](https://img.youtube.com/vi/r8Cg7hTMFdg/sddefault.jpg)](https://youtu.be/r8Cg7hTMFdg) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**
   - Add `Manual Trigger` node.
   - No parameters required.
   - Name it: `When clicking ‘Execute workflow’`.

2. **Add Google Sheets Node to Read Invoices:**
   - Add `Google Sheets` node.
   - Set operation to read rows.
   - Select connected Google Sheets credential.
   - Set Document ID: `1d7CWcM_Ge6s2iaoGXOsxykLQFsDa_iyEFyP0qxJ9Qbs`.
   - Set Sheet Name: `gid=0` (first sheet).
   - Name it: `Google Sheets`.
   - Connect output of manual trigger to this node.

3. **Add Filter Node to Filter Pending Invoices:**
   - Add `Filter` node.
   - Add condition: `$json.Status` equals `"Pending"`.
   - Name it: `Filter`.
   - Connect Google Sheets output to Filter input.

4. **Add Set Node to Edit Fields:**
   - Add `Set` node.
   - Map fields from input JSON (Invoice ID, Client Name, Client Address, Project Name, Amount).
   - Add new fields: 
     - `Invoice Date` set to current date (`{{$now.format('yyyy-MM-dd')}}`).
     - `Due Date` set to 7 days after current date (`{{$now.plus({day:7}).format('yyyy-MM-dd')}}`).
   - Name it: `Edit Fields`.
   - Connect Filter output to this node.

5. **Add SplitInBatches Node:**
   - Add `SplitInBatches` node.
   - Use default batch size (1).
   - Name it: `Loop Over Items`.
   - Connect Edit Fields output to this node.

6. **Add LangChain AI Agent Node:**
   - Add `LangChain Agent` node.
   - Define prompt with invoice email template including client name, project name, amount, invoice ID, invoice and due dates.
   - Tone: friendly, professional.
   - Connect secondary output of `Loop Over Items` to this node.
   - Name it: `AI Agent`.

7. **Add OpenAI GPT Model Node:**
   - Add `LangChain LM Chat OpenAI` node.
   - Model: `gpt-4.1-mini`.
   - Set OpenAI API credentials.
   - Connect AI Agent's AI language model input to this node.
   - Connect AI Agent outputs from this node.

8. **Add LangChain Information Extractor Node:**
   - Add `Information Extractor` node.
   - Configure extraction of two attributes: `email subject`, `email body`.
   - Input text set to AI Agent output.
   - Connect AI Agent output to this node.
   - Name it: `Information Extractor`.

9. **Add CraftMyPDF Node:**
   - Install CraftMyPDF node from n8n community nodes if not installed.
   - Add node and connect Information Extractor output to it.
   - Set resource to `pdf`.
   - Set `templateId` to your CraftMyPDF template ID.
   - Fill data JSON with company info and invoice details mapped from `Edit Fields` node outputs.
   - Name it: `CraftMyPDF`.

10. **Add Gmail Node:**
    - Add `Gmail` node.
    - Configure Gmail OAuth2 credentials.
    - Set `sendTo` to client email from Google Sheets data (`{{$json["Client Email"]}}`).
    - Set email subject and message body using extracted email components.
    - Attach the PDF binary output from CraftMyPDF (`output.pdf`).
    - Name it: `Gmail`.
    - Connect CraftMyPDF output to Gmail node.

11. **Add Google Sheets Node to Update Status:**
    - Add another `Google Sheets` node.
    - Set operation to `appendOrUpdate`.
    - Match rows by `Invoice ID`.
    - Update `Status` to `Completed`, `Invoice Date`, and `Due Date` fields.
    - Use the same sheet and document as before.
    - Connect Gmail output to this node.
    - Name it: `Google Sheets1`.

12. **Connect Google Sheets1 node output back to Loop Over Items node input:**
    - This ensures the loop continues processing the next invoice.

13. **Add Sticky Notes:**
    - Add two sticky notes with setup instructions and tutorial link for user guidance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                     | Context or Link                                                                                          |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| ✅ Make sure **CraftMyPDF** node is installed in your n8n otherwise it will show error. If first time it doesn't show the **CraftMyPDF** node then install it, delete the workflow, and re-import it again. Setup instructions included in note. | Setup instructions for CraftMyPDF node and workflow preparation.                                        |
| ## Start here: Step by Step Youtube Tutorial :star:\n[![AI Invoice Agent](https://img.youtube.com/vi/r8Cg7hTMFdg/sddefault.jpg)](https://youtu.be/r8Cg7hTMFdg)                                                                   | YouTube video tutorial for the AI Invoice Agent workflow.                                               |
| [CraftMyPDF](https://craftmypdf.com/) is used for generating PDF invoices dynamically based on templates.                                                                                                                       | External service for PDF generation.                                                                    |

---

**Disclaimer:** The provided text comes exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected content. All manipulated data is legal and public.