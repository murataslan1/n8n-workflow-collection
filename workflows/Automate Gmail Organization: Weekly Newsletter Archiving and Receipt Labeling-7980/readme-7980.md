Automate Gmail Organization: Weekly Newsletter Archiving and Receipt Labeling

https://n8nworkflows.xyz/workflows/automate-gmail-organization--weekly-newsletter-archiving-and-receipt-labeling-7980


# Automate Gmail Organization: Weekly Newsletter Archiving and Receipt Labeling

### 1. Workflow Overview

This workflow automates the organization of a Gmail inbox on a weekly basis, specifically targeting newsletters and receipts. It runs every Sunday at 9 PM to:

- Identify and softly archive old newsletters (removing them from the inbox but not deleting permanently).
- Find recent receipts and apply a specific label to them for easier tracking.

The workflow is logically divided into two parallel branches triggered by a single scheduled event:

- **1.1 Weekly Trigger:** Initiates the process every Sunday at 9 PM.
- **1.2 Newsletter Processing:** Searches for old newsletters and archives them softly.
- **1.3 Receipt Processing:** Searches for receipts and labels them accordingly.

---

### 2. Block-by-Block Analysis

#### 1.1 Weekly Trigger

- **Overview:**  
  This block acts as the starting point, triggering the workflow once per week on Sunday at 9 PM to initiate inbox organization.

- **Nodes Involved:**  
  - Sun 9 PM Trigger

- **Node Details:**  

  - **Sun 9 PM Trigger**  
    - Type: Cron Trigger  
    - Role: Scheduled trigger node that fires weekly according to a cron expression.  
    - Configuration: Default weekly schedule; triggers every Sunday at 21:00 (9 PM).  
    - Inputs: None (trigger node).  
    - Outputs: Two parallel outputs connected to “Find Old Newsletters” and “Find Receipts” nodes.  
    - Version Requirements: n8n version supporting cron node type v1.1 or higher.  
    - Edge Cases/Potential Failures: Misconfiguration of time zone or cron expression could cause missed or mistimed runs.  
    - Sub-workflow: None.

---

#### 1.2 Newsletter Processing

- **Overview:**  
  This block identifies newsletters considered old and archives them softly by removing them from the inbox without permanent deletion.

- **Nodes Involved:**  
  - Find Old Newsletters  
  - Archive Softly

- **Node Details:**  

  - **Find Old Newsletters**  
    - Type: Gmail Node (IMAP-based)  
    - Role: Searches Gmail inbox for emails categorized as newsletters that meet criteria to be considered old.  
    - Configuration:  
      - Operation: Search or List Messages (implicitly).  
      - Query: Not explicitly set in provided JSON; likely configured to find newsletters older than a certain age.  
    - Inputs: Trigger from “Sun 9 PM Trigger”.  
    - Outputs: Connects to “Archive Softly” node.  
    - Version: Gmail node v2.  
    - Edge Cases:  
      - Search queries returning no results.  
      - API limitations or quota errors.  
      - Authentication expiry.  

  - **Archive Softly**  
    - Type: Gmail Node  
    - Role: Removes emails found by “Find Old Newsletters” from the inbox by deleting them softly (archive action).  
    - Configuration:  
      - Operation: Delete (soft delete to archive, not permanent delete).  
      - Parameters: Not fully detailed but set to archive messages.  
    - Inputs: Messages from “Find Old Newsletters”.  
    - Outputs: None (end of branch).  
    - Version: Gmail node v2.  
    - Edge Cases:  
      - Deleting messages that are already archived or deleted.  
      - API rate limits or failures.  
      - Authentication issues.

---

#### 1.3 Receipt Processing

- **Overview:**  
  This block finds receipt emails in the inbox and applies a specific label to them for better organization.

- **Nodes Involved:**  
  - Find Receipts  
  - Label Receipts

- **Node Details:**  

  - **Find Receipts**  
    - Type: Gmail Node  
    - Role: Searches inbox for emails identified as receipts.  
    - Configuration:  
      - Operation: Search or List Messages.  
      - Query: Not explicitly provided but presumably targets keywords or senders related to receipts.  
    - Inputs: Trigger from “Sun 9 PM Trigger”.  
    - Outputs: Connects to “Label Receipts” node.  
    - Version: Gmail node v2.  
    - Edge Cases:  
      - No matching receipts found.  
      - API quota or authentication issues.  

  - **Label Receipts**  
    - Type: Gmail Node  
    - Role: Applies a label to emails identified as receipts.  
    - Configuration:  
      - Operation: Add Label.  
      - Label: Specific label not detailed in JSON; expected to be configured to a label like “Receipts”.  
    - Inputs: Messages from “Find Receipts”.  
    - Outputs: None (end of branch).  
    - Version: Gmail node v2.  
    - Edge Cases:  
      - Label does not exist in Gmail account (may cause failure).  
      - Adding label to already labeled messages.  
      - API limits or auth issues.

---

### 3. Summary Table

| Node Name           | Node Type        | Functional Role                      | Input Node(s)       | Output Node(s)       | Sticky Note                                |
|---------------------|------------------|------------------------------------|---------------------|----------------------|--------------------------------------------|
| Sun 9 PM Trigger    | Cron Trigger     | Weekly scheduled trigger            | None                | Find Old Newsletters, Find Receipts |                                            |
| Find Old Newsletters | Gmail Node       | Search for old newsletters          | Sun 9 PM Trigger    | Archive Softly        |                                            |
| Archive Softly       | Gmail Node       | Archive found newsletters softly    | Find Old Newsletters | None                 |                                            |
| Find Receipts        | Gmail Node       | Search for receipt emails           | Sun 9 PM Trigger    | Label Receipts        |                                            |
| Label Receipts       | Gmail Node       | Apply label to receipts             | Find Receipts       | None                 |                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n and name it**: “Sunday Sweep Gmail Zero”.

2. **Add a Cron Trigger node**:  
   - Name: “Sun 9 PM Trigger”  
   - Set schedule to “Every Week” on Sunday at 21:00 (9 PM).  
   - Save.

3. **Add a Gmail Node for finding old newsletters**:  
   - Name: “Find Old Newsletters”  
   - Set operation to “List” or “Search Messages”.  
   - Configure credentials with Gmail OAuth2 credentials.  
   - Set search query to find newsletters older than desired threshold (e.g., `category:promotions older_than:30d` or similar).  
   - Connect “Sun 9 PM Trigger” output (main 0) to this node input.  
   - Save.

4. **Add a Gmail Node for archiving newsletters**:  
   - Name: “Archive Softly”  
   - Operation: “Delete” (Soft delete/archive).  
   - Credentials: Use same Gmail OAuth2 credentials.  
   - Connect output of “Find Old Newsletters” to this node input.  
   - Save.

5. **Add a Gmail Node for finding receipts**:  
   - Name: “Find Receipts”  
   - Operation: “List” or “Search Messages”.  
   - Credentials: Gmail OAuth2 credentials.  
   - Set search query to find receipts, e.g., `subject:receipt OR subject:invoice` or sender addresses related to receipts.  
   - Connect second output of “Sun 9 PM Trigger” (main 1) to this node input.  
   - Save.

6. **Add a Gmail Node for labeling receipts**:  
   - Name: “Label Receipts”  
   - Operation: “Add Label”.  
   - Credentials: Gmail OAuth2 credentials.  
   - Set the label to the desired Gmail label (e.g., “Receipts”). This label must exist in the Gmail account beforehand.  
   - Connect output of “Find Receipts” to this node input.  
   - Save.

7. **Test the workflow** by executing manually or waiting for the scheduled trigger.  
   - Verify that newsletters older than the threshold are archived (removed from inbox but still accessible).  
   - Verify that receipt emails are labeled appropriately.

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                              |
|------------------------------------------------------------------------------|----------------------------------------------|
| Gmail node operations depend on proper OAuth2 credentials with sufficient scopes (Gmail API). Ensure the credentials include read, modify, and label permissions. | Gmail API documentation: https://developers.google.com/gmail/api |
| The label applied to receipts must pre-exist in Gmail; otherwise, the labeling operation will fail. Create labels manually or add a node to create labels dynamically if needed. | Gmail label management: https://support.google.com/mail/answer/118708 |
| Cron node uses server timezone by default; verify timezone settings to ensure correct trigger time. | n8n cron node docs: https://docs.n8n.io/nodes/n8n-nodes-base.cron/ |
| The workflow assumes inbox categorization is enabled in Gmail for newsletters to be identified effectively. | Gmail categories: https://support.google.com/mail/answer/3055016 |
| Archiving via “delete” operation in Gmail node is a soft delete removing the inbox label but not permanently deleting the email. | Gmail message states: https://developers.google.com/gmail/api/guides/filtering#archive |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.