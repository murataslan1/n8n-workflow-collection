Auto-Label Gmail Emails using Gemini 2.5 Pro AI Classification

https://n8nworkflows.xyz/workflows/auto-label-gmail-emails-using-gemini-2-5-pro-ai-classification-8357


# Auto-Label Gmail Emails using Gemini 2.5 Pro AI Classification

### 1. Workflow Overview

This workflow provides an automated system to classify and label incoming unread Gmail emails using Google’s Gemini 2.5 Pro AI model. Its main purpose is to enhance email organization by automatically applying relevant Gmail labels based on AI classification of email subject and snippet content. It is targeted at users who want intelligent email sorting without manual intervention, leveraging dynamic label syncing and AI-driven classification.

The workflow is structured into five logical blocks:

- **1.1 Input Reception:** Watches for new unread Gmail emails.
- **1.2 Label Synchronization:** Retrieves the current Gmail labels dynamically from the user’s mailbox.
- **1.3 AI Classification:** Sends the email content to Gemini 2.5 Pro AI to classify and suggest appropriate Gmail label(s).
- **1.4 Label Mapping:** Translates AI-suggested label names into Gmail label IDs.
- **1.5 Label Application:** Applies the identified label IDs to the original email to auto-label it.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block triggers the workflow when new unread Gmail emails arrive. It ensures only unread messages are processed and checks for new emails every minute.

**Nodes Involved:**  
- Gmail Trigger

**Node Details:**  
- **Gmail Trigger**  
  - Type: Trigger node for Gmail  
  - Configuration: Filters set to only trigger on unread emails; polling every minute to check for new messages.  
  - Credentials: Uses OAuth2 credentials linked to the user’s Gmail account.  
  - Inputs: None (trigger node)  
  - Outputs: Emits each new unread email item, including metadata like Subject, snippet, and message ID.  
  - Edge Cases: Potential auth failures if OAuth token expires; excessive polling might hit API rate limits; missed emails if polling latency occurs.  
  - Version: 1.3

---

#### 1.2 Label Synchronization

**Overview:**  
Fetches all existing Gmail labels (names and IDs) dynamically to provide a current list of labels for AI classification and mapping.

**Nodes Involved:**  
- Get many labels  
- Aggregate  
- Edit Fields

**Node Details:**  
- **Get many labels**  
  - Type: Gmail API node (resource: label)  
  - Configuration: Returns all labels without pagination limit.  
  - Credentials: Reuses Gmail OAuth2 credentials.  
  - Input: From Gmail Trigger  
  - Output: List of label objects (name, id, etc.)  
  - Edge Cases: API failures, permission issues if Gmail scopes are insufficient.  
  - Version: 2.1

- **Aggregate**  
  - Type: Aggregate node  
  - Configuration: Aggregates all label items into a single array under the field "labels" (aggregateAllItemData).  
  - Input: From Get many labels  
  - Output: Single item containing an array of all labels.  
  - Edge Cases: Empty label list if no labels available or API errors.  
  - Version: 1

- **Edit Fields**  
  - Type: Set node  
  - Configuration: Creates a new string field "labelList" by joining all label names with commas from the aggregated labels array.  
  - Input: From Aggregate  
  - Output: Item with a string field "labelList" used for AI prompt context.  
  - Edge Cases: If label list empty, AI prompt may become invalid or incomplete.  
  - Version: 3.4

---

#### 1.3 AI Classification

**Overview:**  
Sends the new email’s subject and snippet to Gemini 2.5 Pro AI model with a system prompt instructing it to classify the email into one or more of the existing Gmail labels only.

**Nodes Involved:**  
- Message a model

**Node Details:**  
- **Message a model**  
  - Type: Google Gemini AI (Langchain integration)  
  - Configuration:  
    - Model: "models/gemini-2.5-pro"  
    - System message prompt restricts AI to respond only with comma-separated label names from the dynamic label list passed in.  
    - Message content includes the email’s subject and snippet from the Gmail Trigger node.  
  - Credentials: Uses Google Palm API credential for Gemini access.  
  - Input: From Edit Fields (providing labelList) and Gmail Trigger (email data)  
  - Output: AI response with label names as plain text separated by commas.  
  - Edge Cases: AI might return unexpected output if prompt misunderstood; API rate limits or auth failures; network errors; incomplete email content might reduce classification accuracy.  
  - Version: Not explicitly versioned; requires n8n nodes supporting Google Gemini integration.

---

#### 1.4 Label Mapping

**Overview:**  
Parses the AI’s comma-separated label names and maps them to their corresponding Gmail label IDs using the previously fetched label list.

**Nodes Involved:**  
- Code

**Node Details:**  
- **Code** (JavaScript)  
  - Type: Code node (JavaScript)  
  - Configuration:  
    - Retrieves all input items: AI output and aggregated label list.  
    - Parses AI response text into an array of labels, trimming whitespace.  
    - Maps each label name to its corresponding label ID from the aggregated label list.  
    - Filters out any non-matching labels.  
    - Outputs an object with the array of label IDs to be used by the next node.  
  - Input: From Message a model (AI output) and Aggregate (label list) via node references.  
  - Output: JSON with "labelIds" array.  
  - Edge Cases: AI output labels not found in label list result in missing IDs and thus no labels applied; malformed AI output could cause parsing errors; empty labelIds means no labels applied.  
  - Version: 2

---

#### 1.5 Label Application

**Overview:**  
Applies the mapped Gmail label IDs to the original email message, effectively labeling the email per AI classification.

**Nodes Involved:**  
- Add label to message

**Node Details:**  
- **Add label to message**  
  - Type: Gmail node  
  - Configuration:  
    - Operation: addLabels  
    - Label IDs: taken from Code node output "labelIds" array.  
    - Message ID: from Gmail Trigger node (original email).  
  - Credentials: Reuses Gmail OAuth2 credentials.  
  - Input: From Code node  
  - Output: Confirmation of label application operation.  
  - Edge Cases: Applying labels to emails that may have been deleted or moved could fail; auth token expiry; invalid label IDs cause API errors; network issues.  
  - Version: 2.1

---

### 3. Summary Table

| Node Name            | Node Type                                | Functional Role                 | Input Node(s)       | Output Node(s)         | Sticky Note                                                                                          |
|----------------------|----------------------------------------|--------------------------------|---------------------|------------------------|----------------------------------------------------------------------------------------------------|
| Gmail Trigger        | Gmail Trigger (Trigger)                 | Detect new unread emails        | None                | Get many labels        | ## 📨 AI Gmail Auto-Labeler: How it Works<br>Trigger: Watches for new unread emails.               |
| Get many labels      | Gmail API node (label resource)        | Fetch all Gmail labels          | Gmail Trigger       | Aggregate              | ## 📨 AI Gmail Auto-Labeler: How it Works<br>Label Sync: Fetches all your current Gmail labels.    |
| Aggregate            | Aggregate node                         | Aggregate label list into array | Get many labels     | Edit Fields            | ## 📨 AI Gmail Auto-Labeler: How it Works<br>Label Sync: Fetches all your current Gmail labels.    |
| Edit Fields          | Set node                              | Create comma-separated label list string | Aggregate          | Message a model        | ## 📨 AI Gmail Auto-Labeler: How it Works<br>Label Sync: Fetches all your current Gmail labels.    |
| Message a model      | Google Gemini AI Node (Langchain)      | AI classification of email      | Edit Fields, Gmail Trigger | Code                | ## 📨 AI Gmail Auto-Labeler: How it Works<br>AI Classification: Sends email content to Gemini AI. |
| Code                 | Code node (JavaScript)                  | Map AI label names to label IDs | Message a model      | Add label to message   | ## 📨 AI Gmail Auto-Labeler: How it Works<br>Label Name → ID Mapping: Maps AI-predicted labels.    |
| Add label to message | Gmail node                            | Apply labels to Gmail message   | Code                 | None                   | ## 📨 AI Gmail Auto-Labeler: How it Works<br>Label Application: Assigns labels to the email.        |
| Sticky Note          | Sticky Note                            | Documentation                   | None                 | None                   | ## 📨 AI Gmail Auto-Labeler: How it Works<br>Overview of workflow functioning.                      |
| Sticky Note1         | Sticky Note                            | Usage instructions               | None                 | None                   | ## 🛠️ How to Use<br>- Connect Gmail and Gemini credentials<br>- AI never suggests labels outside Gmail<br>- Dynamic label syncing etc. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Type: Gmail Trigger  
   - Configure filter: "Read Status" = "unread"  
   - Poll interval: every 1 minute  
   - Connect Gmail OAuth2 credentials with appropriate scopes (read emails, label management).  
   - Position: Start of workflow.

2. **Add Get many labels Node (Gmail API)**  
   - Type: Gmail (label resource)  
   - Operation: List all labels  
   - Set "Return All" to true  
   - Use same Gmail OAuth2 credentials  
   - Connect input from Gmail Trigger node.

3. **Add Aggregate Node**  
   - Type: Aggregate  
   - Operation: aggregateAllItemData  
   - Destination field: "labels"  
   - Connect input from Get many labels node.

4. **Add Set Node ("Edit Fields")**  
   - Type: Set  
   - Add new string field "labelList"  
   - Expression: `{{$json.labels.map(item => item.name).join(', ')}}` (joins all label names into one comma-separated string)  
   - Connect input from Aggregate node.

5. **Add Google Gemini AI Node ("Message a model")**  
   - Type: Google Gemini (Langchain)  
   - Model: "models/gemini-2.5-pro"  
   - System message prompt:  
     ```
     You are an email classifier assistant.
     Only respond with the most suitable existing Gmail label for this email from the following list: {{ $json.labelList }}.
     Never invent a label—not in the list. Respond with multiple matching label names which are separated with single comma's make sure every labels are seperated using a comma, and nothing else.
     ```  
   - Message content:  
     ```
     Below is a new email.
     Subject: {{ $('Gmail Trigger').item.json.Subject }}
     Body: {{ $('Gmail Trigger').item.json.snippet }}
     Which Gmail label does this email belong to?
     ```  
   - Use Google Palm API credentials (Gemini access).  
   - Connect input from Edit Fields node.

6. **Add Code Node ("Code")**  
   - Type: Code (JavaScript)  
   - Paste the provided code to:  
     - Parse AI response text into label names array  
     - Map each label name to its corresponding label ID from the aggregated labels  
     - Output JSON object with "labelIds" array  
   - Connect input from Message a model node.

7. **Add Gmail Node ("Add label to message")**  
   - Type: Gmail  
   - Operation: addLabels  
   - Label IDs: `={{ $json.labelIds }}` (from Code node)  
   - Message ID: `={{ $('Gmail Trigger').item.json.id }}`  
   - Use Gmail OAuth2 credentials  
   - Connect input from Code node.

8. **Add Sticky Notes (Optional)**  
   - Add two sticky notes with workflow explanation and usage instructions for documentation purposes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                     | Context or Link                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| AI will never suggest labels not present in your Gmail; label list is dynamically fetched each run, ensuring up-to-date classification.                                                                                                         | Sticky Note1 content                                |
| The workflow monitors unread emails only; to change this, adjust the Gmail Trigger node filters accordingly.                                                                                                                                     | Sticky Note1 content                                |
| Works best with clear, distinct label names to improve AI classification accuracy.                                                                                                                                                               | Sticky Note1 content                                |
| Google Gemini 2.5 Pro requires valid Google Palm API credentials with quota and access enabled.                                                                                                                                                   | Node "Message a model" configuration                 |
| Gmail OAuth2 credentials must include scopes for reading emails, managing labels, and modifying messages.                                                                                                                                         | Gmail nodes configuration                            |
| AI outputs comma-separated label names; parsing errors can occur if output is malformed or empty. Proper error handling or fallback labeling may be required for production use cases.                                                              | Code node considerations                            |
| For further enhancements, consider adding filters before or after AI classification to refine which emails get labeled automatically.                                                                                                           | Sticky Note1 content                                |
| The system message prompt for AI explicitly restricts responses to known labels to avoid invalid labels being applied.                                                                                                                           | Node "Message a model" prompt design                |

---

**Disclaimer:**  
The provided description and analysis are derived exclusively from an automated n8n workflow. It complies fully with applicable content policies and contains no illegal, offensive, or copyrighted material. All data processed is legal and publicly accessible.