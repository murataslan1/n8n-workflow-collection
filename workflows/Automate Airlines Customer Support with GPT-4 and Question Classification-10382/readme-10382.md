Automate Airlines Customer Support with GPT-4 and Question Classification

https://n8nworkflows.xyz/workflows/automate-airlines-customer-support-with-gpt-4-and-question-classification-10382


# Automate Airlines Customer Support with GPT-4 and Question Classification

### 1. Workflow Overview

This workflow implements an intelligent Airlines Customer Support FAQ Bot using n8n, leveraging GPT-4 and AI-driven question classification. It automates answering travel-related customer inquiries by categorizing questions, fetching contextual knowledge, generating AI-based responses, and managing user satisfaction feedback. The workflow includes the following logical blocks:

- **1.1 Entry Point:** Receives user questions via a webhook API from chat interfaces.
- **1.2 Data Extraction:** Cleans and structures incoming question data and metadata.
- **1.3 Question Categorization:** Uses AI (OpenAI GPT-3.5-turbo) to classify questions into predefined travel-related categories.
- **1.4 Knowledge Base Retrieval:** Fetches relevant contextual information based on the detected category.
- **1.5 AI Response Generation:** Uses GPT-4 to generate a concise, warm, and informative answer using the knowledge context.
- **1.6 Response Formatting:** Adds quick links and structures the final reply for better user experience.
- **1.7 Satisfaction Detection:** Analyzes user feedback to detect satisfaction or the need for human support.
- **1.8 Satisfaction Path Handling:** Routes satisfied users and those needing follow-up differently, adding corresponding metadata.
- **1.9 Data Logging:** Logs the entire interaction, including satisfaction status, to an external database for analytics.
- **1.10 Response Delivery:** Sends the final formatted answer back to the user via webhook response.

---

### 2. Block-by-Block Analysis

#### 2.1 Entry Point

- **Overview:** Accepts incoming POST requests containing user travel questions from various chat platforms.
- **Nodes Involved:** 
  - Webhook - User Question
  - Sticky Note (Entry Point note)

- **Node Details:**

  - **Webhook - User Question**
    - Type: Webhook (HTTP POST endpoint)
    - Role: Receives incoming user question requests.
    - Configuration: 
      - HTTP method: POST
      - Path: `/airlines-faq`
      - Response mode: Respond via response node.
    - Inputs: External HTTP request.
    - Outputs: Passes raw request payload downstream.
    - Edge Cases: Payload missing question or malformed JSON.
    - Notes: Entry point for user interaction.

#### 2.2 Data Extraction

- **Overview:** Parses and cleans the user’s question, extracting user metadata and normalizing input for further processing.
- **Nodes Involved:**
  - Extract & Clean Question
  - Sticky Note1 (Data Extraction note)

- **Node Details:**

  - **Extract & Clean Question**
    - Type: Code node (JavaScript)
    - Role: Extracts question text and user/session metadata from the webhook payload; trims whitespace.
    - Key expressions:
      - Extract question from `body.question`, `body.message`, or `body.text`.
      - Extract userId, sessionId, userName with fallbacks.
      - Generate timestamp and question length.
    - Inputs: Raw webhook payload.
    - Outputs: JSON with cleaned question and metadata.
    - Edge Cases: Missing fields default to 'anonymous', generated session ID.
    - Failure modes: Expression failures if unexpected payload structure.

#### 2.3 Question Categorization

- **Overview:** Uses OpenAI GPT-3.5-turbo to classify the user question into one of ten predefined travel categories for targeted response handling.
- **Nodes Involved:**
  - Classify Question Category (HTTP Request)
  - Parse Category Result (Code)
  - Sticky Note2 (Categorization note)
  - Sticky Note3 (Category Parsing note)

- **Node Details:**

  - **Classify Question Category**
    - Type: HTTP Request
    - Role: Calls OpenAI Chat Completion API to classify question.
    - Configuration:
      - Model: gpt-3.5-turbo
      - Messages: System prompt instructs classification into one category.
      - Temperature: 0.2 (low randomness for consistent classification)
      - Max tokens: 20
      - Headers: Content-Type application/json
    - Inputs: Cleaned question JSON.
    - Outputs: OpenAI response JSON.
    - Edge Cases: API rate limits, network issues, unexpected model responses.
  
  - **Parse Category Result**
    - Type: Code node
    - Role: Extracts and normalizes category name from GPT response.
    - Key logic:
      - Reads `choices[0].message.content`, trims, uppercases.
      - Merges category into previous data.
    - Inputs: GPT classification JSON.
    - Outputs: JSON enriched with `category` and `categoryDetected: true`.
    - Edge Cases: Missing or malformed response content.

#### 2.4 Knowledge Base Retrieval

- **Overview:** Retrieves detailed knowledge snippets relevant to the detected question category to provide context for AI response generation.
- **Nodes Involved:**
  - Fetch Knowledge Base Context (Code)
  - Sticky Note4 (Knowledge Base note)

- **Node Details:**

  - **Fetch Knowledge Base Context**
    - Type: Code node
    - Role: Selects appropriate knowledge text from a hardcoded knowledge base object keyed by category.
    - Knowledge Base Includes: Destinations, Packages, Visa, Transport, Hotels, Activities, Booking, Cancellation, Baggage, General.
    - Inputs: JSON with `category`.
    - Outputs: Extends JSON with `knowledgeContext` (string) and `contextLength`.
    - Edge Cases: Category not found → defaults to GENERAL.
    - Failure: Logic errors if category is undefined.

#### 2.5 AI Response Generation

- **Overview:** Uses GPT-4 to generate a precise, warm, and informative answer based on the user’s question and the fetched knowledge context.
- **Nodes Involved:**
  - Generate AI Answer (HTTP Request)
  - Sticky Note5 (AI Response note)

- **Node Details:**

  - **Generate AI Answer**
    - Type: HTTP Request
    - Role: Sends context and user question to OpenAI GPT-4 chat completion endpoint.
    - Configuration:
      - Model: gpt-4
      - Messages include system prompt embedding knowledge context and user question.
      - Tone: Warm, professional, concise.
      - Temperature: 0.7 (moderate creativity)
      - Max tokens: 500
      - Headers: Content-Type application/json
    - Inputs: JSON with knowledge context and user question.
    - Outputs: GPT response JSON.
    - Edge Cases: API limits, timeouts, input size limits.

#### 2.6 Response Formatting

- **Overview:** Extracts AI answer text and augments with category-specific quick links and metadata for user-friendly delivery.
- **Nodes Involved:**
  - Format Final Response (Code)
  - Sticky Note6 (Response Formatting note)

- **Node Details:**

  - **Format Final Response**
    - Type: Code node
    - Role: Extracts answer, associates category, and prepares related quick links.
    - Key expressions:
      - Extract answer from GPT response.
      - Map category to predefined quick links array.
      - Attach user metadata and usage tokens.
    - Inputs: GPT response JSON.
    - Outputs: Structured JSON with `answer`, `category`, `relatedLinks`, user/session info, token usage.
    - Edge Cases: Missing tokens usage data.

#### 2.7 Satisfaction Detection

- **Overview:** Checks if user feedback contains positive keywords indicating satisfaction to route accordingly.
- **Nodes Involved:**
  - Check User Satisfaction (If node)
  - Sticky Note7 (Satisfaction Check note)

- **Node Details:**

  - **Check User Satisfaction**
    - Type: If node
    - Role: Uses regex to detect keywords like "thank", "helpful", "great" in user response.
    - Configuration:
      - Case insensitive regex on `userQuestion.toLowerCase()`.
    - Inputs: Formatted response JSON.
    - Outputs: Two branches: satisfied or needs follow-up.
    - Edge Cases: False positives/negatives depending on free text input.

#### 2.8 Satisfaction Path Handling

- **Overview:** Processes two paths based on user satisfaction — logs satisfied users or offers human support options.
- **Nodes Involved:**
  - Log Satisfied User (Code)
  - Offer Human Support (Code)
  - Merge Satisfaction Paths (Merge)
  - Sticky Note8 (Satisfied Path note)
  - Sticky Note9 (Follow-up Path note)
  - Sticky Note10 (Path Merge note)

- **Node Details:**

  - **Log Satisfied User**
    - Type: Code node
    - Role: Marks interaction as 'satisfied' with no follow-up needed.
    - Outputs: JSON with satisfactionStatus = 'satisfied'.
    - Edge Cases: None expected.

  - **Offer Human Support**
    - Type: Code node
    - Role: Marks interaction as 'needs_followup', includes message and support options.
    - Outputs: JSON with followUpOffered = true, message, and supportOptions array.
    - Edge Cases: None expected.

  - **Merge Satisfaction Paths**
    - Type: Merge node
    - Role: Combines both satisfaction paths into one unified stream.
    - Mode: Combine
    - Inputs: From both satisfaction branches.
    - Outputs: Single stream with satisfaction metadata.

#### 2.9 Data Logging

- **Overview:** Sends complete interaction data including question, category, answer, satisfaction, and metadata to an external API for storage and analytics.
- **Nodes Involved:**
  - Log Interaction to Database (HTTP Request)
  - Sticky Note11 (Database Logging note)

- **Node Details:**

  - **Log Interaction to Database**
    - Type: HTTP Request
    - Role: POSTs JSON payload with interaction details to a configured external database API endpoint.
    - Config:
      - URL: `https://your-database-api.com/logs/interactions` (placeholder)
      - Headers: Content-Type application/json
      - Body parameters: userId, sessionId, question, category, answer, satisfaction, timestamp, tokensUsed.
    - Inputs: Merged satisfaction stream.
    - Outputs: Database API response.
    - Edge Cases: Network errors, API downtime, authentication failures if required.

#### 2.10 Response Delivery

- **Overview:** Sends the fully formatted answer and optional follow-up data back to the user via the webhook response.
- **Nodes Involved:**
  - Send Response to User (Respond to Webhook)
  - Sticky Note12 (Response Delivery note)

- **Node Details:**

  - **Send Response to User**
    - Type: Respond to Webhook
    - Role: Returns JSON response to the original HTTP request with all relevant data.
    - Configuration:
      - Response body includes: status, answer, category, relatedLinks, followUpMessage, supportOptions, sessionId, timestamp.
    - Inputs: Logged interaction data JSON.
    - Outputs: HTTP response to user.
    - Edge Cases: Timeout if response delayed beyond webhook limits.

---

### 3. Summary Table

| Node Name                   | Node Type           | Functional Role                             | Input Node(s)               | Output Node(s)               | Sticky Note                                                                                   |
|-----------------------------|---------------------|---------------------------------------------|-----------------------------|-----------------------------|-----------------------------------------------------------------------------------------------|
| Webhook - User Question      | Webhook             | Entry point receiving user questions        | -                           | Extract & Clean Question      | Receives travel questions from users                                                         |
| Extract & Clean Question     | Code                | Parses and cleans incoming question          | Webhook - User Question      | Classify Question Category    | Cleans and structures incoming question                                                      |
| Classify Question Category   | HTTP Request        | Calls AI to classify question category       | Extract & Clean Question     | Parse Category Result         | Classifies question into travel categories                                                   |
| Parse Category Result        | Code                | Extracts category from AI response            | Classify Question Category   | Fetch Knowledge Base Context  | Stores question category for routing                                                         |
| Fetch Knowledge Base Context | Code                | Retrieves knowledge base context by category | Parse Category Result        | Generate AI Answer            | Fetches relevant travel information                                                          |
| Generate AI Answer           | HTTP Request        | Generates AI answer with GPT-4                | Fetch Knowledge Base Context | Format Final Response         | Generates intelligent answer using GPT-4                                                     |
| Format Final Response        | Code                | Formats AI answer, adds quick links           | Generate AI Answer           | Check User Satisfaction       | Adds helpful links and structures reply                                                      |
| Check User Satisfaction      | If                  | Detects positive feedback in user response    | Format Final Response        | Log Satisfied User, Offer Human Support | Detects if user is satisfied with answer                                              |
| Log Satisfied User           | Code                | Logs satisfied user interaction                | Check User Satisfaction      | Merge Satisfaction Paths      | User is happy with the response                                                              |
| Offer Human Support          | Code                | Offers human support if user unsatisfied       | Check User Satisfaction      | Merge Satisfaction Paths      | Offers additional support options                                                            |
| Merge Satisfaction Paths     | Merge               | Combines satisfaction branches                 | Log Satisfied User, Offer Human Support | Log Interaction to Database | Combines different user paths                                                                |
| Log Interaction to Database  | HTTP Request        | Logs interaction data to external database     | Merge Satisfaction Paths     | Send Response to User         | Stores conversation for analytics                                                            |
| Send Response to User        | Respond to Webhook  | Sends final response back to user              | Log Interaction to Database  | -                           | Sends answer back to user interface                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**
   - Type: Webhook
   - Name: "Webhook - User Question"
   - HTTP Method: POST
   - Path: `airlines-faq`
   - Response Mode: Response Node

2. **Create Code Node for Extraction:**
   - Name: "Extract & Clean Question"
   - Code (JavaScript):
     - Extract `question` from body fields: `question`, `message`, or `text`
     - Extract `userId`, `sessionId`, `userName` with fallbacks
     - Trim question string
     - Add timestamp and question length
   - Connect output of webhook node to this node.

3. **Create HTTP Request Node for Classification:**
   - Name: "Classify Question Category"
   - Method: POST
   - URL: `https://api.openai.com/v1/chat/completions`
   - Authentication: Use OpenAI API Key credential
   - Body JSON:
     ```json
     {
       "model": "gpt-3.5-turbo",
       "messages": [
         {"role": "system", "content": "You are a travel question classifier. Classify the following travel question into ONE of these categories: DESTINATIONS, PACKAGES, VISA, TRANSPORT, HOTELS, ACTIVITIES, BOOKING, CANCELLATION, BAGGAGE, GENERAL. Respond with only the category name in uppercase."},
         {"role": "user", "content": "{{$json.userQuestion}}"}
       ],
       "temperature": 0.2,
       "max_tokens": 20
     }
     ```
   - Set header `Content-Type: application/json`
   - Connect from Extraction node.

4. **Create Code Node to Parse Category:**
   - Name: "Parse Category Result"
   - Extract category string from `choices[0].message.content`
   - Uppercase and trim category
   - Merge with previous data
   - Connect from Classification node.

5. **Create Code Node for Knowledge Base Lookup:**
   - Name: "Fetch Knowledge Base Context"
   - Implement a JS object with category keys and detailed travel info strings.
   - Use category from input; default to GENERAL if missing.
   - Add `knowledgeContext` and `contextLength` to output JSON.
   - Connect from Parse Category Result node.

6. **Create HTTP Request Node for AI Answer Generation:**
   - Name: "Generate AI Answer"
   - Method: POST
   - URL: `https://api.openai.com/v1/chat/completions`
   - Authentication: OpenAI GPT-4 API key
   - Body JSON:
     ```json
     {
       "model": "gpt-4",
       "messages": [
         {"role": "system", "content": "You are a helpful and friendly airlines travel assistant. Answer travel questions accurately based on the provided context. Be concise but informative. Use a warm, professional tone. If you don't have specific information, provide general guidance and suggest contacting customer support for details. Always prioritize customer satisfaction and safety.\n\nContext Information:\n{{$json.knowledgeContext}}"},
         {"role": "user", "content": "{{$json.userQuestion}}"}
       ],
       "temperature": 0.7,
       "max_tokens": 500
     }
     ```
   - Set header `Content-Type: application/json`
   - Connect from Knowledge Base node.

7. **Create Code Node for Response Formatting:**
   - Name: "Format Final Response"
   - Extract answer text from GPT response.
   - Add quick links for categories (use predefined arrays).
   - Pass user info, category, timestamp, tokens used.
   - Connect from Generate AI Answer node.

8. **Create If Node to Check Satisfaction:**
   - Name: "Check User Satisfaction"
   - Condition: Regex on lowercase user question text for keywords: `thank|thanks|helpful|great|perfect|excellent|satisfied`
   - Connect from Format Final Response node.
   - True path → Log Satisfied User node.
   - False path → Offer Human Support node.

9. **Create Code Node for Logging Satisfied Users:**
   - Name: "Log Satisfied User"
   - Mark `satisfactionStatus: 'satisfied'`, `followUpOffered: false`, `needsHumanSupport: false`.
   - Connect from If node true path.

10. **Create Code Node for Offering Human Support:**
    - Name: "Offer Human Support"
    - Mark `satisfactionStatus: 'needs_followup'`, `followUpOffered: true`
    - Add `followUpMessage` and array `supportOptions` like ['Chat with Agent', 'Schedule Call', 'Send Email', 'Continue with Bot'].
    - Connect from If node false path.

11. **Create Merge Node to Combine Satisfaction Paths:**
    - Name: "Merge Satisfaction Paths"
    - Mode: Combine
    - Connect inputs from Log Satisfied User and Offer Human Support nodes.

12. **Create HTTP Request Node for Database Logging:**
    - Name: "Log Interaction to Database"
    - Method: POST
    - URL: Your database API endpoint (e.g., `https://your-database-api.com/logs/interactions`)
    - Headers: Content-Type application/json
    - Body Parameters: userId, sessionId, question, category, answer, satisfaction, timestamp, tokensUsed
    - Connect from Merge node.

13. **Create Respond to Webhook Node:**
    - Name: "Send Response to User"
    - Response type: JSON
    - Response body: Compose JSON with status, answer, category, relatedLinks, optional followUpMessage and supportOptions, sessionId, timestamp.
    - Connect from Log Interaction node.

14. **Test Workflow:**
    - Deploy and test webhook with sample travel questions.
    - Check category classification, AI answers, satisfaction detection, database logging, and response delivery.

15. **Credential Setup:**
    - Add OpenAI API credentials for GPT-3.5-turbo and GPT-4 access.
    - Configure database API authentication if needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                   | Context or Link                                                                                       |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow automates airline customer support using AI categorization and GPT-4 response generation, handling a wide range of travel-related queries.       | Workflow introduction and setup notes                                                               |
| Knowledge base content is hardcoded in the workflow but can be externalized for scalability or dynamic updates.                                               | Knowledge Base Retrieval block                                                                        |
| Satisfaction detection uses simple regex matching on user feedback; adapting or expanding keywords may improve accuracy.                                     | Satisfaction Detection block                                                                         |
| Database logging endpoint is a placeholder; replace with a real analytics or CRM system API for production use.                                               | Data Logging block                                                                                   |
| OpenAI API keys must have access to GPT-3.5-turbo and GPT-4 models; usage costs and rate limits apply.                                                       | AI nodes configuration                                                                              |
| User session and ID extraction uses fallback defaults to ensure smooth processing even with partial data.                                                    | Data Extraction block                                                                                |
| Response formatting includes quick links which improve user engagement by directing users to relevant resources.                                            | Response Formatting block                                                                            |
| The workflow assumes the chat interface will handle follow-up messages and support options if human assistance is requested.                                | Satisfaction Path Handling                                                                           |
| For advanced users: Consider adding error handling and retry mechanisms especially for external API calls (OpenAI, database) to increase robustness.          | General best practice                                                                                |
| Detailed project overview and setup instructions are included as a sticky note within the workflow for easy reference.                                       | Sticky Note with Airlines FAQ Bot overview                                                          |

---

**Disclaimer:** The text provided is exclusively derived from an automated n8n workflow. It adheres strictly to applicable content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.