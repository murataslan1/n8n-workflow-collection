Auto-classify Gmail emails with AI and apply labels for inbox organization

https://n8nworkflows.xyz/workflows/auto-classify-gmail-emails-with-ai-and-apply-labels-for-inbox-organization-4876


# Auto-classify Gmail emails with AI and apply labels for inbox organization

### 1. Workflow Overview

This workflow automates the classification of incoming Gmail emails using AI and applies appropriate Gmail labels to organize the inbox. The primary use case is to enhance email management by automatically categorizing emails into predefined labels such as “To respond,” “FYI,” “Marketing,” etc., based on their content and sender context.

The workflow consists of the following logical blocks:

- **1.1 Input Reception**: Trigger on new Gmail emails and aggregate their data.
- **1.2 Gmail Labels Retrieval & Processing**: Fetch all Gmail labels and map their names to IDs for later use.
- **1.3 Data Merging**: Combine email message data with label mapping to prepare for classification.
- **1.4 AI Classification**: Use an AI language model to classify emails into one of eight specific categories.
- **1.5 Label Application**: Apply the AI-determined label to the corresponding Gmail email.

This modular approach ensures email data is collected, enriched with label metadata, processed by AI for classification, and then updated in Gmail with the appropriate label.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Captures new incoming Gmail emails, aggregates message data for processing, and initiates the workflow.

- **Nodes Involved:**  
  - New Gmail Email Received  
  - Aggregate Gmail Messages

- **Node Details:**

  1. **New Gmail Email Received**  
     - Type: Gmail Trigger  
     - Role: Entry point detecting new emails in Gmail.  
     - Configuration: Polls once daily at 12:00 PM for new emails.  
     - Inputs: None (trigger node)  
     - Outputs: Passes raw Gmail email message data downstream.  
     - Edge Cases: Delay in polling could miss real-time emails; Gmail API quota limits; OAuth token expiration.  

  2. **Aggregate Gmail Messages**  
     - Type: Aggregate  
     - Role: Aggregates all input email message data into a single combined dataset.  
     - Configuration: Aggregates all input item data into one.  
     - Inputs: Receives emails from Gmail Trigger node.  
     - Outputs: Outputs aggregated email data for label fetching.  
     - Edge Cases: Large volume of emails could cause performance delays or memory issues.

---

#### 2.2 Gmail Labels Retrieval & Processing

- **Overview:**  
  Fetches all available Gmail labels and maps their names to corresponding IDs for later application.

- **Nodes Involved:**  
  - Fetch Available Gmail Labels  
  - Map Label Names to IDs

- **Node Details:**

  1. **Fetch Available Gmail Labels**  
     - Type: Gmail node (API call)  
     - Role: Retrieves all Gmail labels accessible by the user, returning full label metadata.  
     - Configuration: Returns all labels without filtering.  
     - Inputs: Triggered after message aggregation.  
     - Outputs: Provides label list JSON objects downstream.  
     - Edge Cases: API quota limits; permission errors if OAuth scopes insufficient.  

  2. **Map Label Names to IDs**  
     - Type: Code (JavaScript)  
     - Role: Converts array of label objects into a single object mapping label names to their Gmail IDs.  
     - Configuration: Uses JavaScript to reduce array to `{ labelName: labelId }` map.  
     - Inputs: Label list from previous node.  
     - Outputs: Object with combined label name-ID mappings.  
     - Key Expressions: JavaScript `reduce` function to flatten label data.  
     - Edge Cases: Missing or duplicate label names could cause overwrites; empty label list returns empty object.

---

#### 2.3 Data Merging

- **Overview:**  
  Combines the email messages with the label mapping object to prepare inputs for AI classification.

- **Nodes Involved:**  
  - Merge Labels & Messages

- **Node Details:**

  - **Merge Labels & Messages**  
    - Type: Merge  
    - Role: Combines email data and label mapping into a single data stream for AI processing.  
    - Configuration: Combines all input data ("combineAll") from two separate inputs: aggregated emails and label mapping.  
    - Inputs:  
      - Input 1: Aggregated Gmail messages  
      - Input 2: Label name-ID mapping  
    - Outputs: Combined data containing both email content and label dictionary.  
    - Edge Cases: Mismatched input data lengths or types could cause merge errors.

---

#### 2.4 AI Classification

- **Overview:**  
  Uses an AI language model to classify each email snippet into one of eight predefined labels, following explicit classification rules.

- **Nodes Involved:**  
  - OpenRouter Chat Model  
  - Classify Email with AI

- **Node Details:**

  1. **OpenRouter Chat Model**  
     - Type: LangChain OpenRouter LLM Node  
     - Role: Provides the language model instance (Google Gemini 2.5 Flash Preview).  
     - Configuration: Uses OpenRouter API credentials; no additional options set.  
     - Inputs: None (provides language model for chaining)  
     - Outputs: Supplies model interface to classification chain node.  
     - Version Notes: Requires valid OpenRouter API credentials and access to Gemini model.  
     - Edge Cases: API key expiration, model availability or latency issues.

  2. **Classify Email with AI**  
     - Type: LangChain Chain LLM  
     - Role: Processes email content through AI prompt to classify email into one label.  
     - Configuration:  
       - Prompt includes detailed instructions with 8 classification categories and rules.  
       - Dynamic variables inserted for From, To, Subject, and snippet from email.  
       - Output limited strictly to one label number and name (e.g., "2. FYI").  
       - Batch processing setup empty (processes emails individually).  
     - Inputs: Receives combined email and label data; linked to OpenRouter Chat Model for inference.  
     - Outputs: AI-generated classification label text.  
     - Edge Cases:  
       - AI could return unexpected output if prompt misunderstood.  
       - Missing email fields could reduce classification accuracy.  
       - API rate limits or timeout errors.

---

#### 2.5 Label Application

- **Overview:**  
  Applies the AI-determined Gmail label to the corresponding email message in the user’s Gmail inbox.

- **Nodes Involved:**  
  - Apply Classification Label

- **Node Details:**

  - **Apply Classification Label**  
    - Type: Gmail node (API call)  
    - Role: Adds the Gmail label (determined by AI classification) to the target email message.  
    - Configuration:  
      - Uses dynamic mapping from label name (from AI output) to Gmail label ID via the combined label map.  
      - Targets the email message ID from merged email data.  
      - Operation set to “addLabels.”  
    - Inputs: Classification label text and merged email message data.  
    - Outputs: Confirmation of label application success.  
    - Edge Cases:  
      - Label name not found in label map causes failure.  
      - Gmail API errors (authorization, rate limits).  
      - Message ID invalid or already labeled.

---

### 3. Summary Table

| Node Name                | Node Type                       | Functional Role                               | Input Node(s)                      | Output Node(s)                  | Sticky Note                                                                              |
|--------------------------|--------------------------------|-----------------------------------------------|----------------------------------|---------------------------------|------------------------------------------------------------------------------------------|
| New Gmail Email Received  | Gmail Trigger                  | Trigger workflow on new incoming Gmail email | None                             | Aggregate Gmail Messages, Merge Labels & Messages |                                                                                          |
| Aggregate Gmail Messages  | Aggregate                     | Aggregate incoming Gmail emails into one batch | New Gmail Email Received          | Fetch Available Gmail Labels     |                                                                                          |
| Fetch Available Gmail Labels | Gmail                        | Retrieve list of all Gmail labels             | Aggregate Gmail Messages          | Map Label Names to IDs           |                                                                                          |
| Map Label Names to IDs    | Code                          | Map Gmail label names to their IDs             | Fetch Available Gmail Labels      | Merge Labels & Messages          |                                                                                          |
| Merge Labels & Messages   | Merge                         | Combine email messages with label map          | New Gmail Email Received, Map Label Names to IDs | Classify Email with AI           |                                                                                          |
| OpenRouter Chat Model     | LangChain OpenRouter LLM      | Provide AI language model instance             | None                             | Classify Email with AI           |                                                                                          |
| Classify Email with AI    | LangChain Chain LLM           | Classify emails into one of eight categories   | Merge Labels & Messages, OpenRouter Chat Model | Apply Classification Label       |                                                                                          |
| Apply Classification Label | Gmail                        | Apply AI classification label to Gmail message | Classify Email with AI            | None                           |                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node**  
   - Type: Gmail Trigger  
   - Set to poll new emails once daily at 12:00 PM.  
   - Configure Gmail OAuth2 credentials with appropriate scopes (read emails).  

2. **Add Aggregate Node**  
   - Type: Aggregate  
   - Set to aggregate all incoming email message data from the Gmail Trigger node into a single batch.  
   - Connect Gmail Trigger → Aggregate.

3. **Add Gmail Node to Fetch Labels**  
   - Type: Gmail (Resource: Label)  
   - Configure to return all Gmail labels (`returnAll: true`).  
   - Use the same Gmail OAuth2 credentials.  
   - Connect Aggregate → Fetch Available Gmail Labels.

4. **Add Code Node to Map Label Names to IDs**  
   - Type: Code (JavaScript)  
   - Paste code to reduce label array into an object mapping names to IDs:  
     ```js
     const items = $input.all();
     const combinedObject = items.reduce((acc, item) => {
       return { ...acc, [item.json.name]: item.json.id };
     }, {});
     return { combinedObject };
     ```  
   - Connect Fetch Available Gmail Labels → Map Label Names to IDs.

5. **Add Merge Node**  
   - Type: Merge  
   - Set mode to `combine` and `combineAll` inputs.  
   - Connect two inputs:  
     - Input 1: From Gmail Trigger (new email data)  
     - Input 2: From Map Label Names to IDs (label map)  

6. **Add OpenRouter Chat Model Node**  
   - Type: LangChain OpenRouter LLM  
   - Select model "google/gemini-2.5-flash-preview-05-20" or equivalent.  
   - Configure with valid OpenRouter API credentials.  

7. **Add Chain LLM Node for AI Classification**  
   - Type: LangChain Chain LLM  
   - Set prompt to the detailed classification instructions including all 8 label categories and rules.  
   - Use expressions to inject email fields dynamically: `From`, `To`, `Subject`, `snippet`.  
   - Connect Merge → Chain LLM node.  
   - Link OpenRouter Chat Model node as the language model provider.

8. **Add Gmail Node to Apply Label**  
   - Type: Gmail (operation: addLabels)  
   - Use expression to map AI classification label name to Gmail label ID using the combined label map from earlier:  
     `labelIds = {{ $('Map Label Names to IDs').item.json.combinedObject[$json.text] }}`  
   - Use message ID from merged email data:  
     `messageId = {{ $('Merge Labels & Messages').item.json.id }}`  
   - Connect Chain LLM node → Gmail Apply Label node.  
   - Use Gmail OAuth2 credentials.

---

### 5. General Notes & Resources

| Note Content                                                                                                                              | Context or Link                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| The email classification prompt enforces strict single-label output with no additional text for reliable downstream label assignment.    | Prompt detail embedded in the "Classify Email with AI" node.                                            |
| Gmail API usage requires OAuth2 credentials with scopes to read emails, read labels, and modify labels on messages.                      | Gmail OAuth2 credentials setup necessary in n8n.                                                        |
| OpenRouter API must be configured with valid credentials and access to the specified Gemini model version.                                | See OpenRouter account credential in n8n credentials configuration.                                     |
| Polling frequency is set to once daily at 12:00 PM; consider adjusting for more real-time processing if needed.                          | Configured in the Gmail Trigger node under pollTimes.                                                  |
| Gmail label names must exactly match those used by AI in classification to ensure correct label application; update label list accordingly. | Maintain label consistency in Gmail and AI prompt categories.                                          |

---

**Disclaimer**: The content provided is exclusively from an automated workflow created in n8n, respecting all applicable content policies. It contains no illegal or offensive material. All data processed is legal and publicly accessible.