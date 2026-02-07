Automate Customer Support with Mintlify Documentation & Zendesk AI Agent

https://n8nworkflows.xyz/workflows/automate-customer-support-with-mintlify-documentation---zendesk-ai-agent-5046


# Automate Customer Support with Mintlify Documentation & Zendesk AI Agent

---

## 1. Workflow Overview

This workflow automates customer support by integrating Zendesk ticketing with Mintlify documentation and an AI agent powered by OpenRouter models. It processes incoming customer inquiries, classifies their content, fetches relevant documentation context, generates AI-based responses, and updates Zendesk tickets accordingly. The workflow also includes escalation paths to human agents for cases involving billing, fraud, or uncertain AI replies.

The workflow is logically divided into these blocks:

- **1.1 Input Reception & Initial Data Fetch:** Receives webhook triggers and fetches Zendesk ticket data and conversations.
- **1.2 Conversation Parsing & AI Reply Counting:** Processes ticket comments to structure the conversation and count previous AI replies.
- **1.3 Message Classification & Routing:** Classifies customer messages into categories (billing, fraud, advertisement, other) and routes accordingly.
- **1.4 Mintlify Topic Handling:** Extracts or creates Mintlify documentation topics linked to tickets for AI context.
- **1.5 Mintlify AI Response Generation:** Sends customer messages to Mintlify chat API for generated responses.
- **1.6 AI Response Processing & Final Reply:** Processes AI-generated response, reformats it, checks for uncertainty, and posts reply to Zendesk.
- **1.7 Escalation & Exception Handling:** Detects when to escalate to human agents or drop AI replies due to uncertainty or multiple replies.
- **1.8 Human Agent Involvement Check:** Determines if a human agent is already assigned and acts accordingly.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception & Initial Data Fetch

**Overview:**  
Receives incoming Zendesk webhook calls, fetches ticket details and conversation comments for further processing.

**Nodes Involved:**  
- Webhook  
- Fetch Zendesk ticket  
- Check if human agent is assigned  
- Fetch ticket conversation

**Node Details:**

- **Webhook**  
  - Type: HTTP Webhook  
  - Role: Entry point listening for Zendesk webhook POST requests.  
  - Configuration: POST method, fixed path.  
  - Input: External Zendesk webhook payload.  
  - Output: Outputs request data for subsequent nodes.  
  - Failure: Invalid payload or network issues.  

- **Fetch Zendesk ticket**  
  - Type: HTTP Request  
  - Role: Retrieves full ticket details from Zendesk API using ticket ID from webhook.  
  - Config: Authenticated via Zendesk API credentials, uses ticket ID from webhook data.  
  - Input: Webhook node output.  
  - Output: JSON with ticket details.  
  - Failure: Authentication errors, invalid ticket ID, API rate limits.  

- **Check if human agent is assigned**  
  - Type: Switch  
  - Role: Checks if the ticket already has a human (support staff) assigned by comparing assignee_id.  
  - Config: Checks if assignee_id equals predefined support staff ID or is empty.  
  - Input: Fetch Zendesk ticket output.  
  - Outputs:  
    - "Don't involve" if assigned to support staff (no AI reply).  
    - "Involve" if no assignee (proceed with AI).  
  - Edge Cases: Missing assignee_id field.  

- **Fetch ticket conversation**  
  - Type: HTTP Request  
  - Role: Fetches all comments on the ticket to reconstruct the conversation.  
  - Config: Zendesk API call for ticket comments, authenticated.  
  - Input: From "Check if human agent is assigned" node branch "Involve".  
  - Output: JSON array of comments.  
  - Failure: API errors, insufficient permissions.

---

### 2.2 Conversation Parsing & AI Reply Counting

**Overview:**  
Filters and structures the conversation, counts prior AI replies to avoid excessive automation.

**Nodes Involved:**  
- Parse conversation  
- Count AI replies  
- Check how many times the AI replied  
- Flip conversation to get the last message  
- If more than x replies, don't reply

**Node Details:**

- **Parse conversation**  
  - Type: Code  
  - Role: Filters public comments, labels messages as from customer or support agent, outputs structured conversation and ticket info.  
  - Config: Uses hardcoded supportStaffId to identify agent messages.  
  - Input: Fetch ticket conversation output.  
  - Output: JSON with subject, conversation array, ticketId.  
  - Edge Cases: Missing comments, unexpected comment structure.  

- **Count AI replies**  
  - Type: Code  
  - Role: Counts number of messages authored by support agent in parsed conversation.  
  - Input: Parse conversation output.  
  - Output: JSON with aiReplyCount.  
  - Edge Cases: Empty conversation array.  

- **Check how many times the AI replied**  
  - Type: Switch  
  - Role: Routes based on aiReplyCount ≤ 3 (keep AI replies) or > 3 (escalate to human).  
  - Input: Count AI replies output.  
  - Outputs:  
    - "Keep AI" for ≤ 3 replies.  
    - "Involve a human agent" for more than 3.  
  - Edge Cases: Missing or malformed aiReplyCount.  

- **Flip conversation to get the last message**  
  - Type: Code  
  - Role: Reverses conversation array to put the latest message first, facilitating classification.  
  - Input: Count AI replies output (same conversation).  
  - Output: Conversation with last message at index 0.  
  - Edge Cases: Empty conversation array.  

- **If more than x replies, don't reply**  
  - Type: NoOp  
  - Role: Placeholder node triggered when AI replies exceed threshold; effectively halts AI response.  
  - Input: Check how many times the AI replied ("Involve a human agent" branch).  

---

### 2.3 Message Classification & Routing

**Overview:**  
Classifies the latest customer message into categories and routes the ticket processing accordingly.

**Nodes Involved:**  
- Message classifier  
- Message router

**Node Details:**

- **Message classifier**  
  - Type: Langchain Agent Node  
  - Role: Uses AI to classify customer message into categories: billing, advertisement, fraud, or other.  
  - Configuration: System message defines classification criteria; input is the last message from customer's conversation.  
  - Input: Flip conversation to get the last message output.  
  - Output: JSON with category field.  
  - Failure: Model errors, misclassification.  

- **Message router**  
  - Type: Switch  
  - Role: Routes flow according to classification category.  
  - Config: Checks if output JSON contains category billing, advertisement, fraud, or other.  
  - Input: Message classifier output.  
  - Outputs:  
    - billing: escalate to billing handler.  
    - advertisement: currently no follow-up, likely deletes ticket.  
    - fraud: escalate to fraud handler.  
    - other: proceed to Mintlify topic handling.  
  - Edge Cases: Classification ambiguous or missing.

---

### 2.4 Mintlify Topic Handling

**Overview:**  
Handles association of Zendesk tickets with Mintlify documentation topics for context-aware AI replies.

**Nodes Involved:**  
- Look for Mintlify topicId  
- New ticket?  
- Create Mintlify Chat Topic  
- Add Mintlify topicId to ticket tags  
- Add Mintlify topicID to ticket

**Node Details:**

- **Look for Mintlify topicId**  
  - Type: Code  
  - Role: Scans Zendesk ticket tags for a Mintlify topic ID formatted as UUID.  
  - Input: Output of "Message router" node on "other" branch.  
  - Output: Passes original data plus topicId (UUID or null).  
  - Edge Cases: No UUID tag found, multiple UUID tags.  

- **New ticket?**  
  - Type: Switch  
  - Role: Checks if topicId is null/empty to determine if Mintlify topic must be created.  
  - Input: Look for Mintlify topicId output.  
  - Outputs:  
    - new: no existing topic, create new.  
    - existing: use existing topic.  

- **Create Mintlify Chat Topic**  
  - Type: HTTP Request  
  - Role: Creates a new chat topic in Mintlify via API.  
  - Config: POST to Mintlify chat topic endpoint with API key authorization.  
  - Input: New ticket? node "new" branch.  
  - Output: Mintlify topic creation response including topicId.  
  - Failure: API key missing, rate limits, network errors.  

- **Add Mintlify topicId to ticket tags**  
  - Type: HTTP Request  
  - Role: Updates Zendesk ticket tags to include Mintlify topicId UUID.  
  - Config: PUT request to Zendesk API to add tags with authentication.  
  - Input: Create Mintlify Chat Topic output.  
  - Output: Confirmation of tag update.  
  - Failure: Zendesk API errors, permission issues.  

- **Add Mintlify topicID to ticket**  
  - Type: Code  
  - Role: Consolidates conversation and topicId for next steps.  
  - Input: Add Mintlify topicId to ticket tags output and Parse conversation output.  
  - Output: JSON with conversation messages and topicId.  

---

### 2.5 Mintlify AI Response Generation

**Overview:**  
Generates AI responses using Mintlify chat message API based on topicId and customer messages.

**Nodes Involved:**  
- Mintlify generated response (new)  
- Mintlify generated response (existing)  
- Parse mintlify response

**Node Details:**

- **Mintlify generated response (new)**  
  - Type: HTTP Request  
  - Role: Sends first customer message with newly created topicId to Mintlify for AI-generated answer.  
  - Input: Output of Add Mintlify topicID to ticket node.  
  - Config: POST with Authorization header, base URL header, JSON body includes topicId and message.  
  - Output: Raw Mintlify API response string.  
  - Failure: API key issues, network failures.  

- **Mintlify generated response (existing)**  
  - Type: HTTP Request  
  - Role: Sends last message from existing conversation to Mintlify for AI response.  
  - Input: New ticket? node "existing" branch output.  
  - Config: Similar to above but uses existing topicId and last message.  
  - Output: Raw Mintlify API response.  

- **Parse mintlify response**  
  - Type: Code  
  - Role: Parses Mintlify response splitting answer and citations; formats final response string with related docs links.  
  - Input: Mintlify generated response outputs.  
  - Output: JSON with aiResponse (answer), citations array, and finalResponse (formatted text).  
  - Edge Cases: Malformed response string, missing citations.

---

### 2.6 AI Response Processing & Final Reply

**Overview:**  
Processes the AI-generated answer, rephrases it into a customer-friendly Zendesk ticket comment via AI, checks uncertainty, and posts reply.

**Nodes Involved:**  
- AI Agent  
- OpenRouter Chat Model  
- Parse AI response  
- Check uncertainty  
- Uncertainty router  
- Reply ticket and put on pending  
- If uncertain, don't reply

**Node Details:**

- **AI Agent**  
  - Type: Langchain Agent Node  
  - Role: Rewrites and summarizes Mintlify AI response into a polite, clear, and concise Zendesk ticket reply.  
  - Config: System prompt instructs format, style, and JSON output structure for Zendesk ticket comment.  
  - Input: aiResponse from Parse mintlify response.  
  - Output: String with JSON reply.  

- **Parse AI response**  
  - Type: Code  
  - Role: Extracts JSON object from AI Agent's raw output string, validating correctness.  
  - Input: AI Agent output.  
  - Output: Parsed JSON object representing Zendesk ticket update.  
  - Failure: Invalid JSON, missing fields.  

- **Check uncertainty**  
  - Type: Langchain Agent Node  
  - Role: Classifies AI reply as uncertain or confident based on presence of hedging phrases.  
  - Input: Parsed AI response comment body.  
  - Output: JSON with isUncertain boolean.  

- **Uncertainty router**  
  - Type: Switch  
  - Role: Routes uncertain replies to no action and confident replies to Zendesk update.  
  - Input: Check uncertainty output.  
  - Outputs:  
    - uncertain: triggers "If uncertain, don't reply" (NoOp).  
    - certain: proceeds to update ticket.  

- **Reply ticket and put on pending**  
  - Type: HTTP Request  
  - Role: Updates Zendesk ticket with AI-generated public comment and sets status to pending.  
  - Config: PUT request with JSON body from Parse AI response, authenticated.  
  - Input: Uncertainty router "certain" branch.  
  - Failure: Zendesk API errors, malformed JSON.  

- **If uncertain, don't reply**  
  - Type: NoOp  
  - Role: Stops processing when AI reply is uncertain to avoid confusing customers.

---

### 2.7 Escalation & Exception Handling

**Overview:**  
Handles special cases such as billing or fraud tickets by escalating to human agents or deleting irrelevant tickets.

**Nodes Involved:**  
- Billing suspected - escalate  
- Fraud suspected - escalate  
- Delete ticket

**Node Details:**

- **Billing suspected - escalate**  
  - Type: HTTP Request  
  - Role: Updates Zendesk ticket with a public comment indicating billing issue, sets status to open for human follow-up.  
  - Config: PUT request with predefined message about billing forwarding.  
  - Input: Message router "billing" branch.  
  - Failure: API errors, permission issues.  

- **Fraud suspected - escalate**  
  - Type: HTTP Request  
  - Role: Adds a public comment about possible Acceptable Use Policy violation and sets ticket to pending for review.  
  - Input: Message router "fraud" branch.  
  - Failure: Same as above.  

- **Delete ticket**  
  - Type: HTTP Request  
  - Role: Deletes ticket for certain categories like advertisement or other undesired cases.  
  - Input: Message router "advertisement" branch or certain conditions.  
  - Failure: Requires proper permissions; risk of data loss.

---

### 2.8 Human Agent Involvement Check

**Overview:**  
Ensures that if a human agent is already assigned to the ticket, no AI reply is sent.

**Nodes Involved:**  
- Check if human agent is assigned  
- If human assigned, don't reply

**Node Details:**

- **Check if human agent is assigned**  
  - Described in 2.1.  

- **If human assigned, don't reply**  
  - Type: NoOp  
  - Role: Stops automation if ticket is already assigned to support staff.  

---

## 3. Summary Table

| Node Name                     | Node Type                             | Functional Role                          | Input Node(s)                       | Output Node(s)                        | Sticky Note                                                                                      |
|-------------------------------|-------------------------------------|----------------------------------------|-----------------------------------|-------------------------------------|-------------------------------------------------------------------------------------------------|
| Webhook                       | HTTP Webhook                        | Entry point for Zendesk webhook        | -                                 | Fetch Zendesk ticket                |                                                                                                 |
| Fetch Zendesk ticket          | HTTP Request                       | Retrieves ticket details                | Webhook                           | Check if human agent is assigned    |                                                                                                 |
| Check if human agent is assigned | Switch                             | Checks if ticket has human assignee    | Fetch Zendesk ticket              | If human assigned, don't reply; Fetch ticket conversation |                                                                                                 |
| If human assigned, don't reply | NoOp                              | Stops if human agent assigned           | Check if human agent is assigned  | -                                   |                                                                                                 |
| Fetch ticket conversation     | HTTP Request                      | Gets all ticket comments                | Check if human agent is assigned ("Involve") | Parse conversation                 |                                                                                                 |
| Parse conversation            | Code                              | Structures conversation and filters    | Fetch ticket conversation         | Count AI replies                   |                                                                                                 |
| Count AI replies              | Code                              | Counts AI replies in conversation      | Parse conversation                | Check how many times the AI replied |                                                                                                 |
| Check how many times the AI replied | Switch                             | Limits AI reply count                   | Count AI replies                 | Flip conversation to get the last message; If more than x replies, don't reply |                                                                                                 |
| Flip conversation to get the last message | Code                              | Reverses conversation to last message first | Check how many times the AI replied | Message classifier                |                                                                                                 |
| If more than x replies, don't reply | NoOp                              | Stops processing if too many AI replies| Check how many times the AI replied | -                                 |                                                                                                 |
| Message classifier            | Langchain Agent                   | Classifies customer message category   | Flip conversation to get the last message | Message router                  |                                                                                                 |
| Message router               | Switch                            | Routes flow based on classification    | Message classifier               | Billing suspected - escalate; Delete ticket; Fraud suspected - escalate; Look for Mintlify topicId |                                                                                                 |
| Billing suspected - escalate  | HTTP Request                     | Escalates billing tickets to humans    | Message router ("billing")       | -                                 |                                                                                                 |
| Fraud suspected - escalate    | HTTP Request                     | Escalates fraud tickets to humans      | Message router ("fraud")         | -                                 |                                                                                                 |
| Delete ticket                | HTTP Request                     | Deletes tickets for advertisement etc. | Message router ("advertisement") | -                                 |                                                                                                 |
| Look for Mintlify topicId     | Code                              | Extracts Mintlify topicId from tags    | Message router ("other")          | New ticket?                       |                                                                                                 |
| New ticket?                  | Switch                            | Checks if Mintlify topic exists        | Look for Mintlify topicId        | Create Mintlify Chat Topic; Mintlify generated response (existing) |                                                                                                 |
| Create Mintlify Chat Topic    | HTTP Request                     | Creates new Mintlify chat topic         | New ticket? ("new")              | Add Mintlify topicId to ticket tags |                                                                                                 |
| Add Mintlify topicId to ticket tags | HTTP Request                     | Adds topicId tag to Zendesk ticket     | Create Mintlify Chat Topic       | Add Mintlify topicID to ticket     |                                                                                                 |
| Add Mintlify topicID to ticket | Code                              | Prepares conversation with topicId     | Add Mintlify topicId to ticket tags; Parse conversation | Mintlify generated response (new) |                                                                                                 |
| Mintlify generated response (new) | HTTP Request                     | Gets AI response from Mintlify for new topic | Add Mintlify topicID to ticket | Parse mintlify response           |                                                                                                 |
| Mintlify generated response (existing) | HTTP Request                     | Gets AI response from Mintlify for existing topic | New ticket? ("existing")        | Parse mintlify response           |                                                                                                 |
| Parse mintlify response       | Code                              | Parses Mintlify AI answer and citations | Mintlify generated response (new); Mintlify generated response (existing) | AI Agent                         |                                                                                                 |
| AI Agent                     | Langchain Agent                   | Rephrases and formats AI response      | Parse mintlify response          | Parse AI response                 |                                                                                                 |
| Parse AI response             | Code                              | Extracts JSON reply from AI Agent output| AI Agent                        | Check uncertainty                |                                                                                                 |
| Check uncertainty             | Langchain Agent                   | Detects uncertainty in AI reply         | Parse AI response               | Uncertainty router               |                                                                                                 |
| Uncertainty router            | Switch                            | Routes based on AI reply certainty      | Check uncertainty               | If uncertain, don't reply; Reply ticket and put on pending |                                                                                                 |
| If uncertain, don't reply     | NoOp                              | Stops processing on uncertain AI reply | Uncertainty router ("uncertain") | -                                |                                                                                                 |
| Reply ticket and put on pending | HTTP Request                     | Updates Zendesk ticket with AI reply    | Uncertainty router ("certain")  | -                                |                                                                                                 |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: HTTP Webhook  
   - Method: POST  
   - Path: Set unique webhook path (e.g., "d5df4915-3245-468d-970f-54e7bf8f4084")  
   - Purpose: Receive Zendesk webhook triggers.

2. **Create HTTP Request Node - Fetch Zendesk ticket**  
   - Connect from Webhook main output  
   - URL: `https://<YOUR-DOMAIN>.zendesk.com/api/v2/tickets/{{ $json.body.ticket.id }}`  
   - Authentication: Zendesk API OAuth2 or API token credentials  
   - Method: GET  
   - Output: Full ticket details.

3. **Create Switch Node - Check if human agent is assigned**  
   - Connect from "Fetch Zendesk ticket"  
   - Condition: If `ticket.assignee_id` equals supportStaffId (19780258553884), output "Don't involve" else "Involve"  
   - "Don't involve" branch connects to NoOp node "If human assigned, don't reply"  
   - "Involve" branch connects to "Fetch ticket conversation"

4. **Create NoOp Node - If human assigned, don't reply**  
   - Stops workflow for tickets assigned to human agents.

5. **Create HTTP Request Node - Fetch ticket conversation**  
   - Connect from "Check if human agent is assigned" ("Involve" branch)  
   - URL: `https://<YOUR-DOMAIN>.zendesk.com/api/v2/tickets/{{ $json.ticket.id }}/comments`  
   - Authentication: Zendesk API  
   - Method: GET

6. **Create Code Node - Parse conversation**  
   - Connect from "Fetch ticket conversation"  
   - Purpose: Filter public comments, identify author roles (support agent vs customer), build structured conversation array  
   - Use provided JavaScript code logic to extract `conversation`, `subject`, `ticketId`.

7. **Create Code Node - Count AI replies**  
   - Connect from "Parse conversation"  
   - Purpose: Count messages where role === 'support_agent'  
   - Output: `aiReplyCount`

8. **Create Switch Node - Check how many times the AI replied**  
   - Connect from "Count AI replies"  
   - Condition: If `aiReplyCount` ≤ 3, output "Keep AI" else "Involve a human agent"  
   - "Keep AI" branch connects to "Flip conversation to get the last message"  
   - "Involve a human agent" branch connects to "If more than x replies, don't reply" NoOp node.

9. **Create Code Node - Flip conversation to get the last message**  
   - Connect from "Check how many times the AI replied" ("Keep AI")  
   - Purpose: Reverse conversation array to have latest message first.

10. **Create Langchain Agent Node - Message classifier**  
    - Connect from "Flip conversation to get the last message"  
    - Model: OpenRouter (e.g., deepseek-r1-distill-llama-70b)  
    - Prompt: Classify customer message into billing, advertisement, fraud, or other categories.  
    - Input: `conversation[0].message`

11. **Create Switch Node - Message router**  
    - Connect from "Message classifier"  
    - Condition: route based on JSON field `"category"`  
    - Outputs: billing, advertisement, fraud, other

12. **Create HTTP Request Node - Billing suspected - escalate**  
    - Connect from "Message router" billing branch  
    - Method: PUT to Zendesk ticket API  
    - Body: Comment about billing forwarded to human agent, status open  
    - Auth: Zendesk API

13. **Create HTTP Request Node - Fraud suspected - escalate**  
    - Connect from "Message router" fraud branch  
    - Method: PUT to Zendesk ticket API  
    - Body: Comment about Acceptable Use Policy violation, status pending  
    - Auth: Zendesk API

14. **Create HTTP Request Node - Delete ticket**  
    - Connect from "Message router" advertisement branch  
    - Method: DELETE to Zendesk ticket API  
    - Auth: Zendesk API

15. **Create Code Node - Look for Mintlify topicId**  
    - Connect from "Message router" other branch  
    - Purpose: Extract UUID-formatted tag from ticket tags (Mintlify topicId)

16. **Create Switch Node - New ticket?**  
    - Connect from "Look for Mintlify topicId"  
    - Condition: topicId empty or not  
    - Outputs: "new" (create topic), "existing" (use existing topic)

17. **Create HTTP Request Node - Create Mintlify Chat Topic**  
    - Connect from "New ticket?" new branch  
    - POST to Mintlify API endpoint for chat topics  
    - Headers: Authorization Bearer `<YOUR-API-KEY>`, Content-Type application/json  
    - Body: JSON (empty or minimal as required by Mintlify API)  

18. **Create HTTP Request Node - Add Mintlify topicId to ticket tags**  
    - Connect from "Create Mintlify Chat Topic"  
    - PUT to Zendesk ticket tags API adding the new topicId as a tag  
    - Auth: Zendesk API  

19. **Create Code Node - Add Mintlify topicID to ticket**  
    - Connect from "Add Mintlify topicId to ticket tags"  
    - Purpose: Combine conversation messages and topicId for next step.  
    - Input: Output of "Add Mintlify topicId to ticket tags" and "Parse conversation"

20. **Create HTTP Request Node - Mintlify generated response (new)**  
    - Connect from "Add Mintlify topicID to ticket"  
    - POST to Mintlify chat message API  
    - Headers: Authorization, Content-Type, X-Mintlify-Base-Url (docs URL)  
    - Body: topicId and first conversation message  

21. **Create HTTP Request Node - Mintlify generated response (existing)**  
    - Connect from "New ticket?" existing branch  
    - POST to Mintlify chat message API with existing topicId and last conversation message  

22. **Create Code Node - Parse mintlify response**  
    - Connect from both Mintlify generated response nodes  
    - Purpose: Extract answer and citations, format final text response  

23. **Create Langchain Agent Node - AI Agent**  
    - Connect from "Parse mintlify response"  
    - Role: Summarizes and rewrites Mintlify answer into a Zendesk-ready JSON comment  
    - Prompt: Includes detailed formatting, tone, length, and output JSON structure instructions  

24. **Create Code Node - Parse AI response**  
    - Connect from AI Agent  
    - Extract JSON object from raw AI output string  

25. **Create Langchain Agent Node - Check uncertainty**  
    - Connect from "Parse AI response"  
    - Role: Classifies if AI reply contains uncertainty expressions  

26. **Create Switch Node - Uncertainty router**  
    - Connect from "Check uncertainty"  
    - Routes uncertain replies to NoOp ("If uncertain, don't reply") or confident replies to Zendesk update  

27. **Create NoOp Node - If uncertain, don't reply**  
    - Stops processing if AI reply is uncertain  

28. **Create HTTP Request Node - Reply ticket and put on pending**  
    - Connect from "Uncertainty router" certain branch  
    - PUT to Zendesk ticket API with AI-generated public comment and status pending  

---

## 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                           |
|----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| Replace placeholders `<YOUR-DOMAIN>` and `<YOUR-API-KEY>` with your actual Zendesk domain and Mintlify API key respectively.    | Setup instructions                       |
| AI Agent prompts are designed to produce JSON-formatted responses compatible with Zendesk ticket comment API schema.             | See AI Agent node prompt                  |
| Mintlify chat API requires topic management; new tickets must create topics, existing tickets reuse topicIds stored as tags.     | Mintlify API docs at https://docs.mintlify.com |
| Zendesk API credentials must have permissions to read tickets, update tags, post comments, and delete tickets if applicable.    | Zendesk API documentation                 |
| AI uncertainty detection helps avoid posting confusing replies; uncertain AI responses are not sent and require human fallback. | Improves customer experience              |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow constructed with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---