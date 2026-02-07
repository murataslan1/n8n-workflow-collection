Auto-Generate & Polish Professional Bios with GPT-5 and Google Docs

https://n8nworkflows.xyz/workflows/auto-generate---polish-professional-bios-with-gpt-5-and-google-docs-9930


# Auto-Generate & Polish Professional Bios with GPT-5 and Google Docs

### 1. Workflow Overview

This workflow, titled **"Auto-Generate & Polish Professional Bios with GPT-5 and Google Docs"**, is designed to automate the creation and refinement of personal biographies using advanced AI language models (GPT-5). It targets freelancers, creators, agencies, HR, and marketing professionals who need polished, professional bios for LinkedIn, portfolio websites, or team introductions.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Triggered by incoming chat messages (or webhook-like input) containing personal details.
- **1.2 Biography Generation:** Uses an AI agent to generate a first draft biography based on the input.
- **1.3 Biography Evaluation:** An AI agent evaluates the draft for specific quality criteria and provides feedback.
- **1.4 Conditional Branching:** Determines if the bio meets quality standards or needs improvement.
- **1.5 Biography Optimization:** If needed, refines the biography using AI based on evaluation feedback.
- **1.6 Output & Storage:** Saves the final approved biography to a Google Docs document for easy access and sharing.

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception

**Overview:**  
This block listens for incoming chat messages containing user personal information to trigger the workflow.

**Nodes Involved:**  
- When chat message received

**Node Details:**

- **When chat message received**  
  - *Type:* `@n8n/n8n-nodes-langchain.chatTrigger`  
  - *Role:* Workflow trigger node that activates when a new chat message is received.  
  - *Configuration:* Default options; webhook ID provided for external connection.  
  - *Key variables:* Receives raw user input with personal details (name, role, personal info).  
  - *Connections:* Output connects to the "Biography Agent" node.  
  - *Potential failures:* Webhook connectivity issues, malformed inputs, or missing fields.  
  - *Sticky Note:* Explains this node triggers the workflow on user submission and suggests linking to forms or other input sources.

---

#### 2.2 Biography Generation

**Overview:**  
Generates the initial biography draft using the structured input from the trigger.

**Nodes Involved:**  
- Biography Agent  
- Set Bio

**Node Details:**

- **Biography Agent**  
  - *Type:* `@n8n/n8n-nodes-langchain.agent`  
  - *Role:* AI agent node, generates a professional biography based on the input.  
  - *Configuration:* System message instructs the agent to creatively write a profile using provided data.  
  - *Key expressions:* Uses `{{$json}}` data from the chat trigger implicitly.  
  - *Input:* Trigger node output.  
  - *Output:* Raw generated biography text.  
  - *Version:* Uses agent version 1.7.  
  - *Failures:* AI generation errors, API quota limits, malformed input causing poor output.  
  - *Sticky Note:* Describes cleaning and structuring input before sending to GPT-5.

- **Set Bio**  
  - *Type:* `n8n-nodes-base.set`  
  - *Role:* Stores the generated biography text into a workflow variable named `bio` for downstream use.  
  - *Configuration:* Assigns `bio` field from the output of Biography Agent.  
  - *Input:* Biography Agent output.  
  - *Output:* JSON with `bio` field.  
  - *Failures:* Expression errors if `output` field missing or malformed.

---

#### 2.3 Biography Evaluation

**Overview:**  
Evaluates the generated biography for quality and adherence to style criteria.

**Nodes Involved:**  
- Evaluator Agent  
- Evaluate (If node)

**Node Details:**

- **Evaluator Agent**  
  - *Type:* `@n8n/n8n-nodes-langchain.agent`  
  - *Role:* AI agent that reviews the biography and outputs feedback.  
  - *Configuration:*  
    - System message includes criteria: biography must include a quote, be light/humorous, and contain no emojis.  
    - Input text is the biography stored in the `bio` field.  
  - *Input:* Output of Set Bio node (the biography text).  
  - *Output:* Feedback text or "Finished" if all criteria met.  
  - *Failures:* AI evaluation errors, API issues, no or ambiguous feedback.  
  - *Sticky Note:* Explains feedback criteria and evaluation purpose.

- **Evaluate (If node)**  
  - *Type:* `n8n-nodes-base.if`  
  - *Role:* Checks if the Evaluator Agent output equals "Finished".  
  - *Configuration:* String equality condition on `{{ $json.output }}` to "Finished".  
  - *Input:* Output of Evaluator Agent.  
  - *Output:* Two branches:  
    - If true (Finished): proceed to "Push to Docs".  
    - If false: proceed to "Optimizer Agent".  
  - *Failures:* Expression evaluation errors if output missing.

---

#### 2.4 Biography Optimization

**Overview:**  
Refines and polishes the biography based on evaluator feedback to improve quality.

**Nodes Involved:**  
- Optimizer Agent  
- Set Bio (second use)

**Node Details:**

- **Optimizer Agent**  
  - *Type:* `@n8n/n8n-nodes-langchain.agent`  
  - *Role:* AI agent that revises the biography using feedback to optimize tone, structure, and professionalism.  
  - *Configuration:*  
    - System message instructs the agent to revise the bio according to feedback.  
    - Input text includes the original biography and the feedback text.  
  - *Input:* Receives biography from "Set Bio" and feedback from "Evaluator Agent".  
  - *Output:* Improved biography text.  
  - *Failures:* AI generation errors, API limits, ambiguous feedback causing poor optimization.  
  - *Sticky Note:* Notes the optimization improves naturalness, structure, and removes redundancy.

- **Set Bio (reuse)**  
  - *Type:* `n8n-nodes-base.set`  
  - *Role:* Stores the optimized biography text back into the `bio` field for use downstream.  
  - *Input:* Optimizer Agent output.  
  - *Output:* JSON with updated `bio`.  
  - *Failures:* Expression errors if output missing or invalid.

---

#### 2.5 Output & Storage

**Overview:**  
Saves the final biography into a Google Docs document for easy access, sharing, or further editing.

**Nodes Involved:**  
- Push to Docs

**Node Details:**

- **Push to Docs**  
  - *Type:* `n8n-nodes-base.googleDocs`  
  - *Role:* Updates the specified Google Docs document by inserting the biography text.  
  - *Configuration:*  
    - Operation: "update"  
    - Document URL: User must fill in the target Google Docs URL.  
    - Action: Insert the biography text from `{{ $('Set Bio').item.json.bio }}`.  
  - *Credentials:* Uses Google Docs OAuth2 credentials.  
  - *Input:* Biography text from "Set Bio".  
  - *Output:* Result of Google Docs update operation.  
  - *Failures:* OAuth token errors, document URL missing/invalid, API rate limits, network errors.  
  - *Sticky Note:* Highlights this node’s role in saving the document.

---

### 3. Summary Table

| Node Name                | Node Type                          | Functional Role                  | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                         |
|--------------------------|----------------------------------|--------------------------------|-----------------------------|----------------------------|---------------------------------------------------------------------------------------------------|
| When chat message received | @n8n/n8n-nodes-langchain.chatTrigger | Trigger input                  | -                           | Biography Agent            | Triggers workflow when user submits name, role, personal info; can connect to Google Form, Notion |
| Biography Agent          | @n8n/n8n-nodes-langchain.agent  | Generate initial bio            | When chat message received  | Set Bio                    | Cleans and structures input text before sending to GPT-5                                          |
| Set Bio                  | n8n-nodes-base.set               | Store generated bio             | Biography Agent             | Evaluator Agent            |                                                                                                   |
| Evaluator Agent          | @n8n/n8n-nodes-langchain.agent  | Evaluate bio quality            | Set Bio                     | Evaluate                   | Provides feedback; ensures bio includes quote, is light & humorous, and has no emojis             |
| Evaluate                 | n8n-nodes-base.if                | Conditional check on evaluation | Evaluator Agent             | Push to Docs, Optimizer Agent |                                                                                                   |
| Optimizer Agent          | @n8n/n8n-nodes-langchain.agent  | Optimize/refine bio             | Evaluate                    | Set Bio                    | Refines bio to improve professionalism and readability                                            |
| Set Bio (reuse)          | n8n-nodes-base.set               | Store optimized bio             | Optimizer Agent             | Push to Docs               |                                                                                                   |
| Push to Docs             | n8n-nodes-base.googleDocs        | Save final bio to Google Docs   | Set Bio (optimized)         | -                          | Saves the document to Google Docs                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node**  
   - Add node: **When chat message received**  
   - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
   - Configure webhook or chat input to receive user data (name, role, personal info).  
   - No special parameters needed.

2. **Add Biography Generation Node**  
   - Add node: **Biography Agent**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Set system message:  
     ```
     Overview
     You are an expert biography writer. You will receive information about a person, and your job is to create an entire profile using the information they give you. You are allowed to be creative.
     ```
   - Connect output of trigger node to this node's input.

3. **Add Set Node to Store Bio**  
   - Add node: **Set Bio**  
   - Type: `n8n-nodes-base.set`  
   - Set field `bio` to expression: `={{ $json.output }}` (output from Biography Agent).  
   - Connect Biography Agent output to this node.

4. **Add Biography Evaluation Node**  
   - Add node: **Evaluator Agent**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Configure with:  
     - Text input: `=Here is the biography:\n{{ $json.bio }}`  
     - System message:  
       ```
       Overview
       You are an expert biography evaluator. Your job is to provide feedback on the biography.

       Criteria
       - Make sure the biography includes a quote from the person. This could be their favorite saying or a piece of advice. It is essential that every biography has a quote.
       - Make sure the biography is light and humorous.
       - Make sure the biography has NO emojis.

       Output
       You only need to output feedback. If the biography is finished and all the criteria are met, simply output "Finished".
       ```
   - Connect Set Bio node output to this node.

5. **Add Conditional Node to Check Evaluation Result**  
   - Add node: **Evaluate** (If node)  
   - Type: `n8n-nodes-base.if`  
   - Condition: Check if `{{ $json.output }}` equals `"Finished"` (case-sensitive).  
   - Connect Evaluator Agent output to this node.

6. **Add Biography Optimization Node**  
   - Add node: **Optimizer Agent**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Set text input using expression:  
     ```
     Biography: {{ $('Set Bio').item.json.bio }}

     Feedback: {{ $('Evaluator Agent').item.json.output }}
     ```  
   - System message:  
     ```
     Overview
     You are an expert biography revisor. Your job is to take the biography and optimize it based on the feedback.
     ```
   - Connect false branch of Evaluate node to this node.

7. **Add Second Set Node to Store Optimized Bio**  
   - Add node: **Set Bio** (second instance)  
   - Type: `n8n-nodes-base.set`  
   - Set `bio` field to `={{ $json.output }}` (Optimizer Agent output).  
   - Connect Optimizer Agent output to this node.

8. **Connect Both Paths to Output Node**  
   - Connect true branch of Evaluate node directly to output node.  
   - Connect Set Bio (optimized) node to output node.

9. **Add Google Docs Node to Save Bio**  
   - Add node: **Push to Docs**  
   - Type: `n8n-nodes-base.googleDocs`  
   - Operation: `update`  
   - Document URL: Insert your target Google Docs URL.  
   - Action: `insert` text, value: `={{ $('Set Bio').item.json.bio }}`  
   - Configure Google Docs OAuth2 credentials.  
   - Connect both Evaluate true branch and optimized Set Bio node outputs to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                          | Context or Link                                                                                       |
|---------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Bio-Graphy Agent — Auto-Generate & Polish Personal Bios with GPT-5                                                                   | Workflow title sticky note                                                                           |
| Can connect trigger to Google Form, Notion, or Webhook for automation                                                                 | Sticky note on "When chat message received" node                                                    |
| Clean and structure input text (remove extra spaces, fix case) before sending to GPT-5                                                | Sticky note on Biography Agent node                                                                 |
| Provides feedback: bio must include a quote, be light and humorous, and have no emojis                                                | Sticky note on Evaluator Agent node                                                                 |
| Save the document to Google Docs                                                                                                     | Sticky note on Push to Docs node                                                                     |
| Optimize biography to improve naturalness, polish, and remove redundancy                                                              | Sticky note on Optimizer Agent node                                                                 |
| GPT-5 Chat Model used for generation and optimization                                                                                 | Sticky note near GPT-5 node                                                                          |
| Workflow designed for freelancers, agencies, HR, marketing teams needing polished bios                                                 | Sticky note summarizing audience and requirements                                                   |
| Requirements include OpenAI GPT-5 or GPT-4 credentials, n8n Cloud or self-hosted setup, optional Google Sheets/Notion for storage     | Sticky note on user audience and prerequisites                                                      |
| Workflow overview and detailed sticky notes available inside workflow for easy reference                                              | Sticky note with detailed workflow summary                                                          |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created using n8n, respecting all relevant content policies and containing no illegal, offensive, or protected elements. All processed data is legal and publicly available.