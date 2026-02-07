Automate Spam Filtering with GPT-4 & Gmail

https://n8nworkflows.xyz/workflows/automate-spam-filtering-with-gpt-4---gmail-4091


# Automate Spam Filtering with GPT-4 & Gmail

### 1. Workflow Overview

This workflow automates the cleaning of a Gmail inbox by intelligently filtering and deleting unwanted marketing and spam emails. It is designed for professionals, solopreneurs, and teams who want to maintain a focused inbox without manual sorting.

The workflow logic is organized into four functional blocks:

- **1.1 Input Reception**: Periodic triggering to fetch new Gmail messages.
- **1.2 AI Classification**: Sending email snippets to GPT-4 for content-based classification.
- **1.3 Decision Logic**: Evaluating classification results to determine if emails should be deleted.
- **1.4 Action Execution**: Deleting emails marked as spam or promotional offers.

A sticky note provides a detailed workflow summary and contextual information.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block triggers the workflow hourly to scan the Gmail inbox for new incoming emails.

**Nodes Involved:**  
- Gmail Trigger

**Node Details:**  

- **Gmail Trigger**  
  - **Type:** n8n-nodes-base.gmailTrigger  
  - **Role:** Initiates the workflow by polling Gmail for new messages every hour.  
  - **Configuration:**  
    - Polling mode set to `everyHour` without additional filters (fetches all new messages).  
    - Connected to Gmail account via OAuth2 credentials.  
  - **Inputs:** None (trigger node).  
  - **Outputs:** Emits new email data including message snippets and IDs.  
  - **Edge Cases:**  
    - Authentication failure if Gmail OAuth2 token expires or is revoked.  
    - Rate limits or quota restrictions from Gmail API.  
    - Empty inbox or no new emails results in no workflow continuation.  
  - **Version Requirements:** Node version 1.2 (standard Gmail Trigger features).  

---

#### 2.2 AI Classification

**Overview:**  
This block sends the content snippet of each email to an AI agent (GPT-4) that classifies the message into one of three categories: IMPORTANT, OFFER, or SPAM.

**Nodes Involved:**  
- Validator of Email  
- OpenAI Chat Model

**Node Details:**  

- **Validator of Email**  
  - **Type:** @n8n/n8n-nodes-langchain.agent  
  - **Role:** Acts as an AI agent that processes email snippets and returns a classification label.  
  - **Configuration:**  
    - Input text parameter: Email snippet templated as `"Your email to check:\n {{ $json.snippet }}"`.  
    - System message defines classification rules, including detailed instructions and real examples in Polish language context.  
    - Classification labels strictly limited to: `SPAM`, `OFFER`, and `IMPORTANT`.  
    - Prompt encourages conservative classification, defaulting to IMPORTANT if uncertain.  
    - Uses Langchain agent capabilities integrated with GPT-4.  
  - **Inputs:** Receives incoming email snippet from Gmail Trigger node.  
  - **Outputs:** Returns a single classification string under field `output`.  
  - **Expressions:** Uses templated input expression for snippet injection.  
  - **Edge Cases:**  
    - AI model misclassification due to ambiguous content or prompt misunderstanding.  
    - OpenAI API rate limits, authentication errors.  
    - Network timeouts or unexpected API responses.  
  - **Version Requirements:** Node version 1.9 for Langchain agent compatibility.  

- **OpenAI Chat Model**  
  - **Type:** @n8n/n8n-nodes-langchain.lmChatOpenAi  
  - **Role:** Provides the underlying GPT-4 language model integration used by the Validator of Email agent.  
  - **Configuration:**  
    - Model set to `"gpt-4.1-nano"` (a GPT-4 variant).  
    - No additional options specified.  
    - Uses OpenAI API credentials.  
  - **Inputs:** Invoked internally by the Validator of Email agent node.  
  - **Outputs:** Delivers GPT-4 generated responses back to the agent node.  
  - **Edge Cases:**  
    - OpenAI API key invalid or quota exceeded.  
    - Model version deprecation or unavailability.  
  - **Version Requirements:** Node version 1.2.  

---

#### 2.3 Decision Logic

**Overview:**  
This block evaluates the AI classification result and determines whether to delete the email or keep it.

**Nodes Involved:**  
- If

**Node Details:**  

- **If**  
  - **Type:** n8n-nodes-base.if  
  - **Role:** Conditional logic to check if the email classification is `SPAM` or `OFFER`.  
  - **Configuration:**  
    - Condition is an OR of two strict string equals checks:  
      - `$json.output == "SPAM"`  
      - `$json.output == "OFERTA"`  
    - Note: `"OFERTA"` is presumably a typo or alternative spelling for "OFFER" in Polish context, matching the prompt language.  
  - **Inputs:** Receives classification output from Validator of Email node.  
  - **Outputs:**  
    - True branch if classification matches SPAM or OFERTA (email to be deleted).  
    - False branch if classification is IMPORTANT (email retained).  
  - **Edge Cases:**  
    - Classification label mismatch due to case sensitivity or spelling errors.  
    - Missing or empty classification input.  
  - **Version Requirements:** Node version 2.2 for enhanced condition options.  

---

#### 2.4 Action Execution

**Overview:**  
This block deletes emails classified as spam or promotional offers from the Gmail inbox.

**Nodes Involved:**  
- Delate Email (Delete Email)

**Node Details:**  

- **Delate Email**  
  - **Type:** n8n-nodes-base.gmail  
  - **Role:** Deletes emails from Gmail based on message ID.  
  - **Configuration:**  
    - Operation set to `delete`.  
    - Message ID dynamically retrieved from the original Gmail Trigger node (`={{ $('Gmail Trigger').item.json.id }}`).  
    - Uses the same Gmail OAuth2 credentials as the trigger.  
  - **Inputs:** Activated only when If node condition is true (SPAM or OFFER).  
  - **Outputs:** Confirmation of deletion operation.  
  - **Edge Cases:**  
    - Email already deleted or missing (race conditions).  
    - Gmail API errors or permission issues.  
  - **Version Requirements:** Node version 2.1 for delete operation support.  

---

#### 2.5 Documentation and Metadata

**Overview:**  
A sticky note node provides an embedded description and usage instructions for users.

**Nodes Involved:**  
- Sticky Note

**Node Details:**  

- **Sticky Note**  
  - **Type:** n8n-nodes-base.stickyNote  
  - **Role:** Documentation and workflow summary within the editor.  
  - **Configuration:**  
    - Contains detailed textual content explaining workflow purpose, logic, AI classifier details, and ideal user profiles.  
    - Dimensions set to width 560px, height 660px for visibility.  
  - **Inputs/Outputs:** None.  
  - **Edge Cases:** None.  

---

### 3. Summary Table

| Node Name          | Node Type                            | Functional Role                      | Input Node(s)  | Output Node(s)   | Sticky Note                                                                                              |
|--------------------|------------------------------------|------------------------------------|----------------|------------------|--------------------------------------------------------------------------------------------------------|
| Gmail Trigger      | n8n-nodes-base.gmailTrigger         | Hourly trigger to fetch new emails | None           | Validator of Email | Part of auto spam cleaning; triggers workflow every hour.                                              |
| Validator of Email | @n8n/n8n-nodes-langchain.agent     | AI classification using GPT-4      | Gmail Trigger  | If               | Uses detailed Polish prompt with examples for classification: SPAM, OFFER, IMPORTANT.                   |
| OpenAI Chat Model  | @n8n/n8n-nodes-langchain.lmChatOpenAi | Provides GPT-4 model for AI agent  | Validator of Email (ai_languageModel) | Validator of Email | GPT-4 model variant "gpt-4.1-nano" used; requires valid OpenAI API key.                                |
| If                 | n8n-nodes-base.if                   | Decision on email classification   | Validator of Email | Delate Email     | Checks if classification is SPAM or OFERTA (offer).                                                    |
| Delate Email       | n8n-nodes-base.gmail                | Deletes classified spam/offer emails | If (true)      | None             | Deletes emails from Gmail inbox by message ID; uses Gmail OAuth2 credentials.                          |
| Sticky Note        | n8n-nodes-base.stickyNote           | Workflow documentation and summary | None           | None             | Contains full workflow description, use cases, and AI classifier logic.                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger Node:**  
   - Type: Gmail Trigger  
   - Set polling mode to `everyHour` (pollTimes → mode: everyHour).  
   - Connect OAuth2 Gmail credentials.  
   - No filters (fetch all new emails).  

2. **Create Validator of Email Node:**  
   - Type: Langchain Agent (`@n8n/n8n-nodes-langchain.agent`)  
   - Connect to output of Gmail Trigger (main output).  
   - Set parameter `text` to:  
     ```
     Your email too check:
     {{ $json.snippet }}
     ```  
   - Under options, set `systemMessage` with detailed classification prompt including definitions of SPAM, OFFER, IMPORTANT classes and 9 example messages, closely matching the Polish-language context.  
   - Use prompt type: `define`.  
   - Connect OpenAI Chat Model node as AI language model reference.  

3. **Create OpenAI Chat Model Node:**  
   - Type: Langchain GPT-4 Chat Model (`@n8n/n8n-nodes-langchain.lmChatOpenAi`)  
   - Model: `gpt-4.1-nano`  
   - Connect OpenAI API credentials.  
   - Connect this node as AI language model for Validator of Email node.  

4. **Create If Node:**  
   - Type: If node (version 2.2)  
   - Connect from Validator of Email node (main output).  
   - Configure condition as OR:  
     - Left value: `{{$json.output}}` equals `"SPAM"`  
     - Left value: `{{$json.output}}` equals `"OFERTA"`  
   - Case sensitive, strict type comparison.  

5. **Create Delate Email Node:**  
   - Type: Gmail node (`n8n-nodes-base.gmail`)  
   - Operation: `delete`  
   - Parameter `messageId`:  
     ```
     {{ $('Gmail Trigger').item.json.id }}
     ```  
   - Connect OAuth2 Gmail credentials (same as Gmail Trigger).  
   - Connect from If node's true output branch (emails marked SPAM or OFFER).  

6. **Create Sticky Note Node:**  
   - Type: Sticky Note  
   - Content: Detailed workflow description including purpose, AI classification details, usage scenarios, and setup instructions.  
   - Set size to width 560px and height 660px.  

7. **Connect nodes in sequence:**  
   - Gmail Trigger → Validator of Email → If → Delate Email (true branch)  
   - Validator of Email → If  
   - OpenAI Chat Model connected as AI language model for Validator of Email node.  

8. **Credentials Setup:**  
   - Gmail OAuth2 credentials: Required for Gmail nodes with appropriate scopes for reading and deleting emails.  
   - OpenAI API Key credentials: Required for GPT-4 access in Langchain nodes.  

9. **Activate workflow:**  
   - Save and activate the workflow for automatic hourly execution.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                        | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The AI classification prompt is finely tuned with 9 real examples to ensure high accuracy in distinguishing between SPAM, OFFER, and IMPORTANT messages in Polish language contexts.                                                                                                | Embedded in Validator of Email systemMessage parameter.                                         |
| This workflow helps maintain a distraction-free inbox by automatically deleting irrelevant marketing and spam emails while preserving business-critical communications.                                                                                                           | Workflow purpose description.                                                                   |
| OAuth2 credentials for Gmail must have permissions to read emails and delete messages. OpenAI API key must be valid and have access to GPT-4 model.                                                                                                                               | Credential setup instructions.                                                                  |
| If customizing, consider adding logging nodes (e.g., Google Sheets) for backup before deletion, to review filtered emails later.                                                                                                                                                  | Suggested optional customization.                                                               |
| The workflow runs hourly without manual intervention, ensuring continuous inbox hygiene.                                                                                                                                                                                           | Trigger configuration detail.                                                                   |
| Sticky note in the workflow editor provides a comprehensive summary and user-friendly instructions for non-technical users.                                                                                                                                                       | Sticky Note node content.                                                                        |

---

**Disclaimer:**  
This content is generated exclusively from an automated workflow created with n8n, an integration and automation tool. The process complies strictly with content policies and contains no illegal, offensive, or protected material. All data processed are legal and public.