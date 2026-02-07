Auto-Stop Email Sequences Based on Replies with IMAP and Google Sheets

https://n8nworkflows.xyz/workflows/auto-stop-email-sequences-based-on-replies-with-imap-and-google-sheets-5506


# Auto-Stop Email Sequences Based on Replies with IMAP and Google Sheets

---

### 1. Workflow Overview

This workflow automates the process of stopping email sequences based on replies detected via IMAP email reading and cross-referenced with Google Sheets data. It is designed for sales or marketing automation scenarios where ongoing email sequences should be halted promptly when a recipient replies, ensuring efficient communication management and avoiding redundant follow-ups.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Captures incoming emails via IMAP.
- **1.2 Reply Tracking Logic**: Processes incoming emails to detect replies and prepare data for matching.
- **1.3 Smart Matching with Google Sheets**: Queries Google Sheets to find matching records corresponding to the reply sender.
- **1.4 Auto-Stop Sequence Decision**: Applies custom logic to decide whether to stop email sequences.
- **1.5 Update Records**: Updates Google Sheets to mark sequences as stopped based on the processed logic.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview**:  
  This block listens for incoming emails on an IMAP server, triggering the workflow whenever a new email arrives.

- **Nodes Involved**:  
  - Email Trigger (IMAP)

- **Node Details**:  

  - **Email Trigger (IMAP)**  
    - *Type and Role*: `emailReadImap` node version 2; receives emails from an IMAP mailbox.  
    - *Configuration*: Uses stored IMAP credentials (not explicitly shown in JSON). Default parameters are applied to fetch unread emails.  
    - *Key Variables*: Incoming email properties such as sender, subject, date, and body are captured as input data for downstream processing.  
    - *Input Connections*: None (starting trigger).  
    - *Output Connections*: Connected to “Track replies” node.  
    - *Version Requirements*: n8n version compatible with `emailReadImap` node v2.  
    - *Potential Failures*: Authentication errors (invalid or expired IMAP credentials), connection timeouts, malformed email data.  
    - *Notes*: This node is the event trigger and must be set up with valid IMAP credentials to function.

---

#### 2.2 Reply Tracking Logic

- **Overview**:  
  This block analyzes incoming email data to detect if the email is a reply and extracts necessary information for matching against stored records.

- **Nodes Involved**:  
  - Track replies (Code)

- **Node Details**:  

  - **Track replies**  
    - *Type and Role*: `code` node version 2; runs JavaScript to parse and filter email data.  
    - *Configuration*: Custom code to parse email headers or body to detect if the incoming email is a reply to a sequence. Likely extracts sender email, thread identifiers, or reply markers.  
    - *Key Expressions / Variables*: Uses input email fields (e.g., `from`, `subject`, `in-reply-to` headers) to identify replies. Outputs structured data for matching.  
    - *Input Connections*: From “Email Trigger (IMAP)”.  
    - *Output Connections*: To “SMART MATCHING” Google Sheets node.  
    - *Version Requirements*: None specific beyond code node v2.  
    - *Potential Failures*: Parsing errors if email format is unexpected; missing headers; unexpected input structure.  
    - *Notes*: Critical for filtering emails to those that should stop sequences.

---

#### 2.3 Smart Matching with Google Sheets

- **Overview**:  
  This block queries Google Sheets to find records that match the reply sender or related identifiers to determine which sequences to stop.

- **Nodes Involved**:  
  - SMART MATCHING (Google Sheets)

- **Node Details**:  

  - **SMART MATCHING**  
    - *Type and Role*: `googleSheets` node version 4.6; reads data from a Google Sheets document.  
    - *Configuration*: Configured to search rows in a specific sheet with filters or queries matching the reply sender or sequence ID extracted from prior code node.  
    - *Key Expressions / Variables*: Uses incoming data from “Track replies” to filter rows (e.g., matching email address or unique ID).  
    - *Input Connections*: From “Track replies”.  
    - *Output Connections*: To “AUTO-STOP SEQUENCES” code node.  
    - *Version Requirements*: Requires valid Google Sheets OAuth2 credentials with read permissions.  
    - *Potential Failures*: Authentication errors, quota limits, sheet not found, malformed queries.  
    - *Notes*: This node must be configured with proper sheet ID and range to match data correctly.

---

#### 2.4 Auto-Stop Sequence Decision

- **Overview**:  
  This block runs custom logic to decide if the email sequence should be stopped based on the matched data from Google Sheets.

- **Nodes Involved**:  
  - AUTO-STOP SEQUENCES (Code)

- **Node Details**:  

  - **AUTO-STOP SEQUENCES**  
    - *Type and Role*: `code` node version 2; executes JavaScript to apply business rules.  
    - *Configuration*: Contains logic to evaluate matched records and determine if conditions to stop sequences are met. Likely sets flags or status updates.  
    - *Key Expressions / Variables*: Processes matched records data, may reference dates, reply counts, or status fields.  
    - *Input Connections*: From “SMART MATCHING”.  
    - *Output Connections*: To “Update Record” Google Sheets node.  
    - *Version Requirements*: None specific beyond code node v2.  
    - *Potential Failures*: Logic errors, unexpected or empty input data.  
    - *Notes*: This node drives the actual decision-making process.

---

#### 2.5 Update Records

- **Overview**:  
  This block updates the Google Sheets document to mark sequences as stopped, ensuring future automation respects the updated status.

- **Nodes Involved**:  
  - Update Record (Google Sheets)

- **Node Details**:  

  - **Update Record**  
    - *Type and Role*: `googleSheets` node version 4.6; updates rows in Google Sheets.  
    - *Configuration*: Configured to update specific rows identified by previous logic, setting status flags or timestamps indicating sequence stoppage.  
    - *Key Expressions / Variables*: Uses data from “AUTO-STOP SEQUENCES” to identify rows and updated values.  
    - *Input Connections*: From “AUTO-STOP SEQUENCES”.  
    - *Output Connections*: None (terminal node).  
    - *Version Requirements*: Requires valid Google Sheets OAuth2 credentials with write permissions.  
    - *Potential Failures*: Authentication errors, write conflicts, invalid row IDs.  
    - *Notes*: Finalizes the workflow by persisting changes.

---

### 3. Summary Table

| Node Name           | Node Type          | Functional Role                      | Input Node(s)          | Output Node(s)       | Sticky Note           |
|---------------------|--------------------|------------------------------------|-----------------------|----------------------|-----------------------|
| Email Trigger (IMAP) | emailReadImap      | Captures incoming emails via IMAP  | —                     | Track replies         |                       |
| Track replies       | code               | Detects reply emails and parses data | Email Trigger (IMAP)  | SMART MATCHING       |                       |
| SMART MATCHING      | googleSheets       | Queries Google Sheets for matches  | Track replies          | AUTO-STOP SEQUENCES  |                       |
| AUTO-STOP SEQUENCES | code               | Decides if sequences should stop   | SMART MATCHING         | Update Record        |                       |
| Update Record       | googleSheets       | Updates Google Sheets to stop sequences | AUTO-STOP SEQUENCES | —                    |                       |
| Sticky Note 1       | stickyNote         | —                                  | —                     | —                    |                       |
| Sticky Note 2       | stickyNote         | —                                  | —                     | —                    |                       |
| Sticky Note 3       | stickyNote         | —                                  | —                     | —                    |                       |
| Sticky Note 4       | stickyNote         | —                                  | —                     | —                    |                       |
| Sticky Note 5       | stickyNote         | —                                  | —                     | —                    |                       |

(Note: Sticky notes are empty in the provided JSON.)

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Email Trigger (IMAP) Node**  
   - Add an `emailReadImap` node.  
   - Configure IMAP credentials (host, port, username, password).  
   - Set it to trigger on new unread emails.  
   - No filters needed unless desired (e.g., folder, subject).  

2. **Create the “Track replies” Code Node**  
   - Add a `code` node.  
   - Connect input from the Email Trigger node.  
   - Implement JavaScript logic to:  
     - Parse incoming email fields (e.g., `from`, `subject`, `in-reply-to`).  
     - Detect if the email is a reply to an ongoing sequence.  
     - Extract sender email and relevant identifiers.  
     - Output structured data for matching.  
   - Example considerations: check for “Re:” in subject, presence of thread IDs, or specific headers.

3. **Add the SMART MATCHING Google Sheets Node**  
   - Add `googleSheets` node configured for reading.  
   - Connect input from “Track replies”.  
   - Set up Google Sheets OAuth2 credential with read access.  
   - Configure:  
     - Spreadsheet ID and Sheet name.  
     - Read rows with a filter or query that matches sender email or sequence ID from previous node.  
     - Ensure correct range covers all relevant data.  

4. **Add the AUTO-STOP SEQUENCES Code Node**  
   - Add a `code` node.  
   - Connect input from “SMART MATCHING”.  
   - Implement logic to analyze matched rows:  
     - Determine if sequence should be stopped based on business rules (e.g., reply detected, status flags).  
     - Prepare update data (row IDs, status fields).  
   - Output structured data for the update step.

5. **Add the Update Record Google Sheets Node**  
   - Add `googleSheets` node configured for update operations.  
   - Connect input from “AUTO-STOP SEQUENCES”.  
   - Use Google Sheets OAuth2 credential with write access.  
   - Configure to update specific rows identified in the previous node:  
     - Set status or timestamp fields to mark sequence as stopped.  

6. **Connect All Nodes in Order**:  
   Email Trigger (IMAP) → Track replies → SMART MATCHING → AUTO-STOP SEQUENCES → Update Record.

7. **Test the Workflow**:  
   - Send test emails and confirm that replies trigger the workflow.  
   - Verify Google Sheets data is properly matched and updated.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                          |
|----------------------------------------------------------------------------------------------|----------------------------------------|
| Workflow automates stopping email sequences on replies detected via IMAP and Google Sheets. | Workflow purpose summary.               |
| Ensure Google Sheets OAuth2 credentials have appropriate read/write scopes.                  | Google Sheets API permissions.          |
| IMAP credentials must be valid and have access to the monitored mailbox.                     | IMAP server setup and credentials.      |
| Testing with various email formats recommended to handle edge cases in reply detection.     | Best practices for email parsing.       |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---