Auto-label incoming Gmail messages with AI nodes

https://n8nworkflows.xyz/workflows/auto-label-incoming-gmail-messages-with-ai-nodes-2197


# Auto-label incoming Gmail messages with AI nodes

### 1. Workflow Overview

This workflow automates the labeling of incoming Gmail messages using AI to analyze email content and apply contextually relevant labels. It is designed for users who want to organize their inbox automatically based on message content without manual intervention.

**Target Use Cases:**  
- Automatically categorize incoming emails for easier management.  
- Use AI-based contextual understanding to assign meaningful labels.  
- Adapt label sets to specific business or personal workflows.  

**Logical Blocks:**  
- **1.1 Input Reception:** Poll for new Gmail messages using a Gmail Trigger node.  
- **1.2 Message Retrieval:** Download full message content based on message ID.  
- **1.3 AI Processing:** Use an AI Chain node powered by OpenAI to analyze email text and generate recommended labels.  
- **1.4 Label Parsing:** Parse AI output to extract labels in a structured format.  
- **1.5 Label Preparation:** Fetch all Gmail labels, split AI label outputs, and merge to identify label IDs.  
- **1.6 Label Application:** Aggregate label IDs and update the Gmail message with these labels.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block triggers the workflow on new incoming Gmail messages via polling.

- **Nodes Involved:**  
  - Gmail trigger

- **Node Details:**  
  - **Gmail trigger**  
    - Type: `gmailTrigger`  
    - Role: Watches Gmail inbox for new messages, polling every minute by default.  
    - Configuration: Polling interval set to every minute; can be changed as needed. No filters applied (fetches all new messages).  
    - Inputs: None (start node).  
    - Outputs: Passes message metadata including message IDs downstream.  
    - Credentials: Requires Gmail OAuth2 credentials.  
    - Failure modes: Potential auth failure, API rate limits, network timeouts.  
    - Sticky Note: Explains polling interval and usage.  

#### 2.2 Message Retrieval

- **Overview:**  
  Retrieves the full content of the new message (body, headers, etc.) using the message ID from the trigger.

- **Nodes Involved:**  
  - Get message content

- **Node Details:**  
  - **Get message content**  
    - Type: `gmail` (operation: get message by ID)  
    - Role: Downloads the complete email content to supply the AI node.  
    - Configuration: Uses `messageId` from Gmail trigger node's output.  
    - Inputs: Message ID from Gmail trigger.  
    - Outputs: Full email data including text and HTML content.  
    - Credentials: Gmail OAuth2 (same as trigger).  
    - Failure modes: Message not found, API errors, auth issues.  
    - Sticky Note: Describes role of getting content for AI.  

#### 2.3 AI Processing

- **Overview:**  
  Sends email text to an AI language model (OpenAI GPT-4o-mini) for classification and label assignment.

- **Nodes Involved:**  
  - Assign labels for message (LangChain AI Chain)  
  - OpenAI Chat (AI language model)  
  - JSON Parser (structured output parser)

- **Node Details:**  
  - **Assign labels for message**  
    - Type: LangChain Chain LLM  
    - Role: Orchestrates AI prompt and output parsing.  
    - Configuration: Input text from Gmail trigger's message text. Uses a custom prompt instructing AI on label assignment. Output parser enabled for structured JSON.  
    - Inputs: Email text.  
    - Outputs: AI response with label recommendations.  
    - Failure modes: AI service downtime, prompt parsing errors, malformed AI JSON output.  
  - **OpenAI Chat**  
    - Type: LangChain OpenAI Chat model  
    - Role: Executes the AI model call (GPT-4o-mini).  
    - Configuration: Model set to GPT-4o-mini, no special options.  
    - Credentials: OpenAI API key required.  
    - Failure modes: API quota exceeded, network issues, invalid credentials.  
  - **JSON Parser**  
    - Type: LangChain output parser structured  
    - Role: Parses AI output into JSON object with labels array.  
    - Configuration: JSON schema defines "labels" as array with enum values: Inquiry, Partnership, Notification.  
    - Failure modes: Parsing failure if AI output does not match schema, missing labels field.  
    - Sticky Note: Warns to keep label names consistent with prompt and schema.

#### 2.4 Label Preparation

- **Overview:**  
  Prepares label data by fetching Gmail labels, splitting assigned labels from AI, and merging to find corresponding Gmail label IDs.

- **Nodes Involved:**  
  - Set label values  
  - Get all labels  
  - Split out assigned labels  
  - Merge corresponding labels

- **Node Details:**  
  - **Set label values**  
    - Type: Set node  
    - Role: Assigns the array of labels from AI output to a workflow variable.  
    - Input: Output from AI chain node.  
    - Output: Passes labels array downstream.  
  - **Get all labels**  
    - Type: Gmail (resource: label, returnAll: true)  
    - Role: Retrieves all labels in the Gmail account with IDs and names.  
    - Credentials: Gmail OAuth2.  
    - Failure modes: API issues, auth errors.  
  - **Split out assigned labels**  
    - Type: SplitOut  
    - Role: Splits the array of AI-assigned labels into separate items for merging.  
  - **Merge corresponding labels**  
    - Type: Merge  
    - Role: Combines Gmail labels and AI-assigned labels by matching Gmail label "name" to AI label string to find label IDs.  
    - Configuration: Merge mode "combine", merging on fields "name" and "labels".  
    - Failure modes: Labels mismatch, no matching label found if label names differ.

#### 2.5 Label Application

- **Overview:**  
  Aggregates IDs of matched labels and applies them to the original Gmail message.

- **Nodes Involved:**  
  - Aggregate label IDs  
  - Add labels to message

- **Node Details:**  
  - **Aggregate label IDs**  
    - Type: Aggregate  
    - Role: Collects all label IDs into a single array for the API call.  
  - **Add labels to message**  
    - Type: Gmail (operation: addLabels)  
    - Role: Updates the Gmail message by adding aggregated label IDs.  
    - Parameters: Uses message ID from Gmail trigger and aggregated label IDs.  
    - Credentials: Gmail OAuth2.  
    - Failure modes: API quota, message not found, label ID invalid.  
    - Sticky Note: Describes merging and adding labels.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                           | Input Node(s)             | Output Node(s)                     | Sticky Note                                                                                                                                                         |
|-------------------------|----------------------------------|-----------------------------------------|---------------------------|-----------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Sticky Note             | stickyNote                       | Informational note                      | None                      | None                              | ## Add AI labels to Gmail messages With this workflow you can automatically set labels for your Gmail message according to its content. In this workflow available are 3 labels: "Partnership", "Inquiry" and "Notification". Feel free to adjust labels according to your needs. **Please remember to set label names both in your Gmail account and workflow.** |
| Sticky Note1            | stickyNote                       | Informational note                      | None                      | None                              | ## ⚠️ Note 1. Complete video guide for this workflow is available [on my YouTube](https://youtu.be/a8Dhj3Zh9vQ). 2. Remember to add your credentials and configure nodes (covered in the video guide). 3. If you like this workflow, please subscribe to [my YouTube channel](https://www.youtube.com/@workfloows) and/or [my newsletter](https://workfloows.com/). **Thank you for your support!** |
| Sticky Note2            | stickyNote                       | Informational note                      | None                      | None                              | ### Gmail Trigger Receive data from Gmail about new incoming message. ⚠️ Set polling interval according to your needs.                                                                                                   |
| Sticky Note4            | stickyNote                       | Informational note                      | None                      | None                              | ### JSON schema Edit JSON schema and label names according to your needs. ⚠️ **Label names in system prompt and JSON schema should be the same.**                                                                       |
| Sticky Note5            | stickyNote                       | Informational note                      | None                      | None                              | ### Merge labels Combine labels retrieved from Gmail account and assigned by AI together.                                                                                                                                |
| Sticky Note6            | stickyNote                       | Informational note                      | None                      | None                              | ### Aggregarte labels and add to message Create array of label IDs and add to the desired email message in Gmail.                                                                                                         |
| Sticky Note7            | stickyNote                       | Informational note                      | None                      | None                              | ### Get message content Based on Gmail message ID retrieve body content of the email and pass it to AI chain.                                                                                                             |
| Sticky Note8            | stickyNote                       | Informational note                      | None                      | None                              | ### Assign labels Let the AI decide which labels suit the best content of the message. ⚠️ **Remember to edit system prompt** - modify label names and instructions according to your needs.                          |
| Gmail trigger           | gmailTrigger                    | Input reception (new Gmail messages)   | None                      | Get message content               | Sticky Note2                                                                                                                                                     |
| Get message content     | gmail                          | Retrieve full message content           | Gmail trigger             | Assign labels for message         | Sticky Note7                                                                                                                                                     |
| Assign labels for message| LangChain Chain LLM            | AI processing and label assignment      | Get message content       | Set label values                  | Sticky Note8                                                                                                                                                     |
| OpenAI Chat             | LangChain OpenAI Chat          | AI language model execution              | Assign labels for message | Assign labels for message (AI LLM)|                                                                                                                                                                   |
| JSON Parser             | LangChain outputParserStructured| Parse AI output to structured JSON      | Assign labels for message | Set label values                  | Sticky Note4                                                                                                                                                     |
| Set label values        | set                           | Prepare label array for merging         | Assign labels for message | Get all labels, Split out assigned labels |                                                                                                                                                                   |
| Get all labels          | gmail                          | Fetch all Gmail labels                   | Set label values          | Merge corresponding labels        | Sticky Note5                                                                                                                                                     |
| Split out assigned labels| splitOut                      | Split AI label array for merging        | Set label values          | Merge corresponding labels        | Sticky Note5                                                                                                                                                     |
| Merge corresponding labels| merge                        | Match AI labels with Gmail label IDs    | Get all labels, Split out assigned labels | Aggregate label IDs        | Sticky Note5                                                                                                                                                     |
| Aggregate label IDs     | aggregate                     | Aggregate label IDs into array           | Merge corresponding labels| Add labels to message             | Sticky Note6                                                                                                                                                     |
| Add labels to message   | gmail                          | Apply labels to Gmail message            | Aggregate label IDs       | None                            | Sticky Note6                                                                                                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node**  
   - Type: `gmailTrigger`  
   - Set to poll every minute (adjustable as needed).  
   - No filters (or add filters if desired).  
   - Credentials: Connect Gmail OAuth2 credentials.  

2. **Create Gmail node "Get message content"**  
   - Type: `gmail` (operation: get message)  
   - Parameter: `messageId` set to `={{ $json["id"] }}` from Gmail Trigger output.  
   - Credentials: Same Gmail OAuth2 credentials.  
   - Connect input from Gmail Trigger node.  

3. **Create LangChain AI Chain node "Assign labels for message"**  
   - Type: `@n8n/n8n-nodes-langchain.chainLlm`  
   - Input parameter: `text` set to `={{ $('Gmail trigger').item.json.text }}` or message text from Get message content.  
   - Enable output parser.  
   - Define system prompt with instructions for assigning labels (e.g. Partnership, Inquiry, Notification). Customize as needed.  
   - Connect input from "Get message content" node.  

4. **Create LangChain OpenAI Chat model node "OpenAI Chat"**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`  
   - Model: `gpt-4o-mini` or preferred OpenAI model.  
   - Credentials: Connect OpenAI API credentials.  
   - Connect as AI language model for the "Assign labels for message" AI Chain node.  

5. **Create LangChain output parser node "JSON Parser"**  
   - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
   - Define JSON schema with a property `labels` as an array of strings with enum: ["Inquiry", "Partnership", "Notification"].  
   - Connect output parser for the AI Chain node.  

6. **Create Set node "Set label values"**  
   - Type: `set`  
   - Assign variable `labels` to `={{ $json.output.labels }}` from AI Chain output.  
   - Connect from "Assign labels for message" node.  

7. **Create Gmail node "Get all labels"**  
   - Type: `gmail` with resource `label` and `returnAll` enabled.  
   - Credentials: Gmail OAuth2.  
   - Connect from "Set label values" node.  

8. **Create SplitOut node "Split out assigned labels"**  
   - Type: `splitOut`  
   - Field to split out: `labels` (the array set in Set node).  
   - Connect from "Set label values" node.  

9. **Create Merge node "Merge corresponding labels"**  
   - Type: `merge`  
   - Mode: `combine`  
   - Advanced merge by fields: `name` from Gmail labels and `labels` from AI output.  
   - Connect inputs: "Get all labels" and "Split out assigned labels".  

10. **Create Aggregate node "Aggregate label IDs"**  
    - Type: `aggregate`  
    - Aggregate field: `id` (label IDs).  
    - Connect from "Merge corresponding labels" node.  

11. **Create Gmail node "Add labels to message"**  
    - Type: `gmail` (operation: addLabels)  
    - Parameters:  
      - `labelIds` set to aggregated IDs `={{ $json.id }}`  
      - `messageId` set to original message ID `={{ $('Gmail trigger').item.json["id"] }}`  
    - Credentials: Gmail OAuth2.  
    - Connect from "Aggregate label IDs" node.  

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Complete video guide available for this workflow showing Gmail automation in action.                           | [YouTube Video](https://youtu.be/a8Dhj3Zh9vQ)                                                      |
| Please ensure label names in your Gmail account exactly match those in the AI prompt and JSON schema.         | Workflow setup instructions                                                                         |
| Subscribe to the author’s YouTube channel and newsletter for more workflows and updates.                       | [YouTube Channel](https://www.youtube.com/@workfloows) / [Newsletter](https://workfloows.com/)      |
| Adjust polling interval of Gmail trigger according to your email volume and needs to avoid API rate limits.   | Workflow setup notes                                                                                |
| AI prompt can be customized to add or change labels and instructions for better fit to your use case.         | Node "Assign labels for message" configuration                                                     |