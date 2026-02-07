Automate Gmail Inbox Organization with Rule-based Categorization and Smart Actions

https://n8nworkflows.xyz/workflows/automate-gmail-inbox-organization-with-rule-based-categorization-and-smart-actions-5518


# Automate Gmail Inbox Organization with Rule-based Categorization and Smart Actions

### 1. Workflow Overview

This workflow, titled **"Gmail Organizer"**, automates the organization of a Gmail inbox through rule-based categorization and corresponding actions. It is designed for professionals who receive numerous emails daily and want to maintain an organized inbox effortlessly.

The workflow is structured into three main logical blocks:

- **1.1 Input Reception**: Detects new incoming emails in Gmail via a trigger node.
- **1.2 AI/Logic Processing (Rule-based Categorization)**: Analyzes email metadata (sender, subject) using a switch node to categorize emails into Work, Shopping, Newsletter, or Other.
- **1.3 Automated Actions**: Applies Gmail labels and further smart actions (marking important, archiving) based on the determined category.

Each block is linked sequentially, ensuring emails flow through detection, categorization, and automated labeling/actions.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview**:  
  This block continuously monitors the Gmail inbox for new emails and triggers the workflow immediately upon email arrival.

- **Nodes Involved**:  
  - New Email Received

- **Node Details**:

  - **New Email Received**  
    - *Type*: Gmail Trigger  
    - *Role*: Initiates workflow on new email detection.  
    - *Configuration*:  
      - Polls Gmail every minute (`pollTimes` set to everyMinute).  
      - Full email data fetched (`simple` set to false).  
      - No filters applied (listens to all new emails).  
    - *Key Expressions*: None (trigger node).  
    - *Input*: None (start node).  
    - *Output*: Passes full email JSON to categorization.  
    - *Version*: 1  
    - *Potential Failures*:  
      - OAuth2 authentication errors or token expiration.  
      - Gmail API rate limits or downtime.  
      - Network connectivity issues.  
    - *Sticky Note*: "Step 1 - Email Detection" explains polling frequency and OAuth2 requirement.

#### 2.2 AI/Logic Processing (Rule-based Categorization)

- **Overview**:  
  Categorizes incoming emails into predefined buckets based on sender and subject patterns using a Switch node.

- **Nodes Involved**:  
  - Categorize Email by Content

- **Node Details**:

  - **Categorize Email by Content**  
    - *Type*: Switch  
    - *Role*: Routes emails to categories: Work Emails, Shopping Orders, Newsletters, or Other (implicit).  
    - *Configuration*:  
      - Multiple OR conditions per category, matching strings in sender (`from`) or subject fields.  
      - Categories:  
        - **Work Emails**: sender contains `@company.com`, or sender contains `work`, or subject contains `meeting` or `project`.  
        - **Shopping Orders**: sender contains `amazon` or `shop`, or subject contains `order` or `receipt`.  
        - **Newsletters**: subject contains `newsletter` or `unsubscribe`, or sender contains `noreply` or `no-reply`.  
      - Case insensitive, strict type validation.  
      - If none match, email is implicitly uncategorized and no further action nodes are connected.  
    - *Key Expressions*: Uses expressions like `{{$json.from}}` and `{{$json.subject}}` with `contains` operations.  
    - *Input*: Email JSON from trigger.  
    - *Output*: Routes to one of three labeled outputs.  
    - *Version*: 3.2  
    - *Potential Failures*:  
      - Expression evaluation failures if email fields are missing or malformed.  
      - Misclassification if keywords overlap or are too broad.  
    - *Sticky Note*: "Step 2 - Smart Categorization" describes the switch logic and routing.

#### 2.3 Automated Actions

- **Overview**:  
  Applies Gmail labels and performs additional actions like marking important or archiving based on category.

- **Nodes Involved**:  
  - Apply Work Label  
  - Mark Work Email as Important  
  - Apply Shopping Label  
  - Apply Newsletter Label  
  - Archive Newsletter Email

- **Node Details**:

  - **Apply Work Label**  
    - *Type*: Gmail  
    - *Role*: Adds "Work" label to email.  
    - *Configuration*:  
      - Label: "Work"  
      - Operation: addLabels  
      - Message ID taken from incoming email JSON (`{{$json.id}}`).  
    - *Input*: From "Work Emails" output of switch node.  
    - *Output*: Connects to "Mark Work Email as Important".  
    - *Version*: 2.1  
    - *Failures*: OAuth2 issues, label not existing, Gmail API errors.  

  - **Mark Work Email as Important**  
    - *Type*: Gmail  
    - *Role*: Marks work emails as important.  
    - *Configuration*:  
      - Operation: markAsImportant  
      - Uses message ID from input.  
    - *Input*: From "Apply Work Label".  
    - *Output*: None (end).  
    - *Version*: 2.1  
    - *Failures*: Same as above, plus failure marking importance.  

  - **Apply Shopping Label**  
    - *Type*: Gmail  
    - *Role*: Adds "Shopping" label to email.  
    - *Configuration*:  
      - Label: "Shopping"  
      - Operation: addLabels  
      - Message ID from email JSON.  
    - *Input*: From "Shopping Orders" output of switch node.  
    - *Output*: None (end).  
    - *Version*: 2.1  
    - *Failures*: Label existence, auth, API errors.  

  - **Apply Newsletter Label**  
    - *Type*: Gmail  
    - *Role*: Adds "Newsletter" label.  
    - *Configuration*:  
      - Label: "Newsletter"  
      - Operation: addLabels  
      - Message ID from email JSON.  
    - *Input*: From "Newsletters" output of switch.  
    - *Output*: Connects to "Archive Newsletter Email".  
    - *Version*: 2.1  
    - *Failures*: As above.  

  - **Archive Newsletter Email**  
    - *Type*: Gmail  
    - *Role*: Archives newsletter emails by adding "ARCHIVE" label.  
    - *Configuration*:  
      - Label: "ARCHIVE" (Gmail system label)  
      - Operation: addLabels  
      - Message ID from email JSON.  
    - *Input*: From "Apply Newsletter Label".  
    - *Output*: None (end).  
    - *Version*: 2.1  
    - *Failures*: Label existence, auth, API errors.  

- *Sticky Note*: "Step 3 - Automated Actions" summarizes label application and email actions per category.

---

### 3. Summary Table

| Node Name                  | Node Type          | Functional Role                      | Input Node(s)               | Output Node(s)                  | Sticky Note                                                                                          |
|----------------------------|--------------------|------------------------------------|-----------------------------|---------------------------------|----------------------------------------------------------------------------------------------------|
| New Email Received          | Gmail Trigger      | Detects new incoming emails        | None                        | Categorize Email by Content      | Step 1 - Email Detection: Polls every minute; requires Gmail OAuth2                                 |
| Categorize Email by Content | Switch             | Categorizes email by sender/subject| New Email Received          | Apply Work Label, Apply Shopping Label, Apply Newsletter Label | Step 2 - Smart Categorization: Routes based on content patterns                                     |
| Apply Work Label            | Gmail              | Adds "Work" label                  | Categorize Email by Content | Mark Work Email as Important     | Step 3 - Automated Actions: Adds label and marks as important                                      |
| Mark Work Email as Important| Gmail              | Marks work emails as important     | Apply Work Label            | None                            | Step 3 - Automated Actions                                                                          |
| Apply Shopping Label        | Gmail              | Adds "Shopping" label              | Categorize Email by Content | None                            | Step 3 - Automated Actions                                                                          |
| Apply Newsletter Label      | Gmail              | Adds "Newsletter" label            | Categorize Email by Content | Archive Newsletter Email         | Step 3 - Automated Actions                                                                          |
| Archive Newsletter Email    | Gmail              | Archives newsletter emails         | Apply Newsletter Label      | None                            | Step 3 - Automated Actions                                                                          |
| Main Workflow Explanation   | Sticky Note        | Describes overall workflow purpose | None                        | None                            | Provides detailed explanation of workflow purpose and setup                                        |
| Step 1 - Email Detection    | Sticky Note        | Explains Gmail trigger usage       | None                        | None                            | Explains trigger polling and credentials                                                          |
| Step 2 - Smart Categorization| Sticky Note       | Explains switch node categorization| None                        | None                            | Details categorization logic                                                                       |
| Step 3 - Automated Actions  | Sticky Note        | Summarizes labeling and actions    | None                        | None                            | Details category-specific Gmail actions                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Node Type: Gmail Trigger  
   - Name: "New Email Received"  
   - Parameters:  
     - Set `simple` to false (fetch full email data).  
     - Poll every minute (`pollTimes`: everyMinute).  
     - No filters (listen to all new emails).  
   - Credentials: Configure Gmail OAuth2 with appropriate scopes (mail.readonly, mail.modify).  

2. **Create Switch Node for Categorization**  
   - Node Type: Switch  
   - Name: "Categorize Email by Content"  
   - Parameters:  
     - Create multiple outputs with the following rules (OR combinator, case insensitive):  
       - Output "Work Emails":  
         - from contains "@company.com" OR  
         - from contains "work" OR  
         - subject contains "meeting" OR  
         - subject contains "project"  
       - Output "Shopping Orders":  
         - from contains "amazon" OR "shop" OR  
         - subject contains "order" OR "receipt"  
       - Output "Newsletters":  
         - subject contains "newsletter" OR "unsubscribe" OR  
         - from contains "noreply" OR "no-reply"  
   - Use expressions referencing incoming email fields (`{{$json.from}}`, `{{$json.subject}}`).  

3. **Create Gmail Node to Apply Work Label**  
   - Node Type: Gmail  
   - Name: "Apply Work Label"  
   - Parameters:  
     - Operation: addLabels  
     - Label IDs: ["Work"] (ensure label exists in Gmail)  
     - Message ID: `{{$json.id}}`  
   - Credentials: Use the same Gmail OAuth2 credentials.  

4. **Create Gmail Node to Mark Work Email as Important**  
   - Node Type: Gmail  
   - Name: "Mark Work Email as Important"  
   - Parameters:  
     - Operation: markAsImportant  
     - Message ID: `{{$json.id}}`  
   - Connect input from "Apply Work Label".  

5. **Create Gmail Node to Apply Shopping Label**  
   - Node Type: Gmail  
   - Name: "Apply Shopping Label"  
   - Parameters:  
     - Operation: addLabels  
     - Label IDs: ["Shopping"]  
     - Message ID: `{{$json.id}}`  
   - Connect input from "Categorize Email by Content" output for Shopping.  

6. **Create Gmail Node to Apply Newsletter Label**  
   - Node Type: Gmail  
   - Name: "Apply Newsletter Label"  
   - Parameters:  
     - Operation: addLabels  
     - Label IDs: ["Newsletter"]  
     - Message ID: `{{$json.id}}`  
   - Connect input from "Categorize Email by Content" output for Newsletters.  

7. **Create Gmail Node to Archive Newsletter Email**  
   - Node Type: Gmail  
   - Name: "Archive Newsletter Email"  
   - Parameters:  
     - Operation: addLabels  
     - Label IDs: ["ARCHIVE"] (Gmail system label)  
     - Message ID: `{{$json.id}}`  
   - Connect input from "Apply Newsletter Label".  

8. **Connect Nodes**  
   - Connect "New Email Received" output to "Categorize Email by Content" input.  
   - Connect each switch output to corresponding label application nodes:  
     - Work Emails → Apply Work Label → Mark Work Email as Important  
     - Shopping Orders → Apply Shopping Label  
     - Newsletters → Apply Newsletter Label → Archive Newsletter Email  

9. **Create Sticky Notes (Optional for Documentation)**  
   - Add explanatory sticky notes near relevant nodes for workflow clarity:  
     - Workflow overview and purpose.  
     - Step 1: Email Detection explanation.  
     - Step 2: Categorization logic explanation.  
     - Step 3: Automated actions explanation.  

10. **Testing and Activation**  
    - Verify Gmail OAuth2 credentials have appropriate permissions.  
    - Ensure Gmail labels "Work", "Shopping", "Newsletter" exist.  
    - Activate the workflow.  
    - Test by sending test emails matching criteria and verify labels/actions applied correctly.  

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| The workflow is optimized for professionals receiving 20+ emails daily who want automatic organization without manual rule setup. | Main Workflow Explanation sticky note in the workflow |
| Gmail OAuth2 setup requires scopes for reading and modifying emails: `https://www.googleapis.com/auth/gmail.modify` is recommended. | Google API documentation on Gmail OAuth2 |
| Gmail labels "Work", "Shopping", and "Newsletter" must be pre-created in the Gmail account for labels to be applied correctly. | Gmail labels management |
| Polling every 1 minute may approach Gmail API limits for heavy inboxes; adjust polling frequency accordingly to avoid quota errors. | Gmail API usage limits |
| "ARCHIVE" label is a Gmail system label used to effectively archive emails (removes Inbox label). | Gmail system labels documentation |

---

**Disclaimer:**  
The provided text is exclusively derived from an n8n automated workflow. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.