Automate Customer Support with Multilingual Chatbot using GPT-5 Nano for eCommerce

https://n8nworkflows.xyz/workflows/automate-customer-support-with-multilingual-chatbot-using-gpt-5-nano-for-ecommerce-7590


# Automate Customer Support with Multilingual Chatbot using GPT-5 Nano for eCommerce

### 1. Workflow Overview

This workflow automates multilingual customer support for eCommerce platforms by leveraging OpenAI’s GPT-5 Nano model within n8n. It receives chat messages from customers, detects the language used, selects the appropriate language-specific system prompt, and generates contextual, helpful responses. The workflow maintains conversation memory to ensure continuity and relevance in replies.

**Target Use Cases:**  
- eCommerce customer service automation  
- Multilingual support (English, Spanish, French)  
- Context-aware chatbot conversations via messaging platforms  

**Logical Blocks:**  
- **1.1 Input Reception:** Captures incoming chat messages.  
- **1.2 Language Detection:** Determines the language of the incoming message.  
- **1.3 Language Prompt Preparation:** Prepares language-specific system prompts and selects the matching one.  
- **1.4 AI Chat Processing:** Uses GPT-5 Nano to generate responses with memory context.  
- **1.5 Output Delivery:** Returns the chatbot response to the customer (implicit in the process).  
- **1.6 Setup & Documentation:** Provides instructions and contextual notes for users.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Listens for incoming chat messages and triggers the workflow.  
- **Nodes Involved:**  
  - When chat message received  
- **Node Details:**  
  - **Type:** LangChain Chat Trigger (Webhook)  
  - **Configuration:** Trigger node configured with a webhook ID to receive chat messages from an external source. No additional options set.  
  - **Key Expressions:** The session ID and chat input text are extracted from incoming JSON.  
  - **Connections:** Outputs to both Detect Language and Ecommerce Language Prompts nodes.  
  - **Edge Cases:** Webhook delivery failures, malformed or missing chat input, session ID absence.  

#### 1.2 Language Detection

- **Overview:** Identifies the language of the customer’s chat input to enable appropriate multilingual response.  
- **Nodes Involved:**  
  - Detect Language  
  - Structured Output Parser  
- **Node Details:**  
  - **Detect Language:**  
    - **Type:** LangChain Agent node  
    - **Role:** Runs an AI prompt to extract the language from input text.  
    - **Configuration:** Uses a system message instructing the AI to output the language in lowercase JSON format, e.g. `{ "language": "english" }`.  
    - **Input:** Connected from When chat message received node with chat input text.  
    - **Output:** JSON with detected language field.  
    - **Failure Points:** Misidentification of language, API errors, output parsing errors.  
  - **Structured Output Parser:**  
    - **Type:** LangChain Output Parser Structured  
    - **Role:** Parses the AI’s JSON output reliably into structured data.  
    - **Configuration:** Uses a JSON schema example with a “language” string field.  
    - **Input:** Connected from Detect Language node’s AI output.  
    - **Failure Points:** If the AI output does not conform to the expected JSON structure, parsing could fail.

#### 1.3 Language Prompt Preparation

- **Overview:** Prepares a list of language-specific system prompts and selects the relevant prompt matching the detected language.  
- **Nodes Involved:**  
  - Ecommerce Language Prompts  
  - Split Out  
  - Keep Only Selected Language  
- **Node Details:**  
  - **Ecommerce Language Prompts:**  
    - **Type:** Set node (data assignment)  
    - **Role:** Defines an array of languages with corresponding system prompts tailored to eCommerce customer support in English, Spanish, and French.  
    - **Configuration:** Hardcoded array including language keys and detailed system prompts emphasizing politeness, helpfulness, and customer satisfaction.  
    - **Output:** Passes the array downstream.  
  - **Split Out:**  
    - **Type:** Split Out node  
    - **Role:** Splits the array of language prompts into individual items for processing.  
    - **Configuration:** Uses the field “languages” to split the array.  
  - **Keep Only Selected Language:**  
    - **Type:** Merge node  
    - **Role:** Filters the split language prompts array to keep only the prompt where the language matches the detected language from the previous block.  
    - **Configuration:** Merge by field “language” from the language prompt and “output.language” from detection result. Fuzzy compare disabled for exact matching.  
    - **Input:** Connects both from Split Out (language prompt items) and from Structured Output Parser (detected language).  
    - **Failure Points:** No matching language found, case sensitivity issues, empty detection output.

#### 1.4 AI Chat Processing

- **Overview:** Generates a contextual chatbot response in the detected language using GPT-5 Nano, incorporating conversation memory.  
- **Nodes Involved:**  
  - Simple Memory  
  - OpenAI Chat Model2  
  - Chat Agent  
- **Node Details:**  
  - **Simple Memory:**  
    - **Type:** LangChain Memory Buffer Window  
    - **Role:** Maintains conversation context by storing recent dialogue per session.  
    - **Configuration:** Uses sessionKey derived dynamically from the incoming session ID to isolate conversation history.  
    - **Input:** Feeds chat history to the Chat Agent node.  
    - **Failure Points:** SessionKey not found, memory overflow if too large, data persistence issues.  
  - **OpenAI Chat Model2:**  
    - **Type:** LangChain OpenAI Chat Model  
    - **Role:** Provides the GPT-5 Nano language model for chat completions in context.  
    - **Configuration:** Model set to “gpt-5-nano”, linked with valid OpenAI API credentials. No additional options set.  
    - **Input:** Connected as ai_languageModel for Chat Agent node.  
    - **Failure Points:** API auth errors, rate limits, model unavailability.  
  - **Chat Agent:**  
    - **Type:** LangChain Agent node  
    - **Role:** Executes the main chat AI prompt using the selected system prompt and user input.  
    - **Configuration:**  
      - Text input: extracted customer chat input.  
      - System message: dynamically assigned from the selected language’s system prompt.  
      - Uses “define” prompt type to explicitly provide system prompt.  
    - Input connections: from Keep Only Selected Language (for prompt) and Simple Memory (for context).  
    - Output: chatbot text response (implicit in workflow).  
    - Failure Points:** Incorrect prompt input, API failures, memory context mismatch.

#### 1.5 Output Delivery

- **Overview:** The workflow does not explicitly show a dedicated output node, but the final Chat Agent node’s response is intended to be returned via the initial webhook response or routed externally.  
- **Nodes Involved:** None explicitly shown.  
- **Notes:** Implementation depends on webhook response handling or integration with messaging platform.

#### 1.6 Setup & Documentation

- **Overview:** Provides user instructions and contextual information about the workflow, credentials setup, and usage.  
- **Nodes Involved:**  
  - Sticky Note7  
  - Sticky Note8  
  - Sticky Note12  
- **Node Details:**  
  - These nodes contain markdown content describing:  
    - How to set up OpenAI credentials and billing.  
    - How to configure languages and system prompts.  
    - General workflow purpose and contact information for support.  
  - Positioned visually for user reference.  
  - No functional role in the automation.

---

### 3. Summary Table

| Node Name                 | Node Type                                    | Functional Role                          | Input Node(s)                  | Output Node(s)                      | Sticky Note                                                             |
|---------------------------|----------------------------------------------|----------------------------------------|-------------------------------|-----------------------------------|-------------------------------------------------------------------------|
| When chat message received | @n8n/n8n-nodes-langchain.chatTrigger         | Entry point, receives chat messages    | —                             | Detect Language, Ecommerce Language Prompts | See Sticky Note7, Sticky Note8, Sticky Note12 for setup and info       |
| Detect Language           | @n8n/n8n-nodes-langchain.agent                | Detects input language via AI prompt   | When chat message received     | Structured Output Parser, Keep Only Selected Language (via merge) |                                                                         |
| Structured Output Parser  | @n8n/n8n-nodes-langchain.outputParserStructured | Parses AI JSON output                   | Detect Language (AI output)    | Detect Language (main)            |                                                                         |
| Ecommerce Language Prompts| n8n-nodes-base.set                            | Defines language prompts array          | When chat message received     | Split Out                        |                                                                         |
| Split Out                | n8n-nodes-base.splitOut                        | Splits language prompts array           | Ecommerce Language Prompts     | Keep Only Selected Language       |                                                                         |
| Keep Only Selected Language | n8n-nodes-base.merge                         | Filters prompts for detected language   | Split Out, Structured Output Parser | Chat Agent                     |                                                                         |
| Simple Memory             | @n8n/n8n-nodes-langchain.memoryBufferWindow  | Maintains chat session memory           | Chat Agent                    | Chat Agent                       |                                                                         |
| OpenAI Chat Model2        | @n8n/n8n-nodes-langchain.lmChatOpenAi         | GPT-5 Nano model for chat completion    | Chat Agent                    | Chat Agent                       | Credential: OpenAI API key required                                    |
| Chat Agent                | @n8n/n8n-nodes-langchain.agent                | Generates chatbot response               | Keep Only Selected Language, Simple Memory, OpenAI Chat Model2 | —                        |                                                                         |
| Sticky Note7              | n8n-nodes-base.stickyNote                      | Setup instructions and contact info     | —                             | —                               | Setup instructions for OpenAI connection and prompt configuration      |
| Sticky Note8              | n8n-nodes-base.stickyNote                      | Workflow description and context        | —                             | —                               | Overview of multilingual eCommerce chatbot                             |
| Sticky Note12             | n8n-nodes-base.stickyNote                      | OpenAI API key setup instructions       | —                             | —                               | Additional OpenAI API key billing instructions                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create “When chat message received” Node**  
   - Type: LangChain Chat Trigger  
   - Configure webhook to receive chat messages with fields: `sessionId`, `chatInput`.  
   - No additional options needed.

2. **Create “Detect Language” Node**  
   - Type: LangChain Agent  
   - Set system message:  
     ```
     Identify what language this is written in. output the language. 

     output like this. all lower case

     {
       "language": "english"
     }
     ```  
   - Enable output parser.  
   - Connect input from “When chat message received” node’s chat input.  

3. **Create “Structured Output Parser” Node**  
   - Type: LangChain Output Parser Structured  
   - Provide JSON schema example:  
     ```
     {
       "language": "English"
     }
     ```  
   - Connect input from AI output of “Detect Language” node.  

4. **Create “Ecommerce Language Prompts” Node**  
   - Type: Set node  
   - Define a field `languages` as an array of objects, each with:  
     - `language`: string (e.g., "english", "spanish", "french")  
     - `system_prompt`: string with customer service instructions tailored per language.  
   - Example:  
     ```json
     [
       {
         "language": "english",
         "system_prompt": "You are a friendly and professional ecommerce customer service assistant..."
       },
       {
         "language": "spanish",
         "system_prompt": "Eres un asistente de servicio al cliente de comercio electrónico amigable..."
       },
       {
         "language": "french",
         "system_prompt": "Vous êtes un assistant de service client e-commerce amical et professionnel..."
       }
     ]
     ```  
   - Connect input from “When chat message received” node.  

5. **Create “Split Out” Node**  
   - Type: Split Out  
   - Configure to split the array field `languages` from “Ecommerce Language Prompts”.  
   - Connect input from “Ecommerce Language Prompts”.  

6. **Create “Keep Only Selected Language” Node**  
   - Type: Merge (mode: combine, advanced)  
   - Merge by fields:  
     - From left input: `language` (from Split Out)  
     - From right input: `output.language` (from Structured Output Parser)  
   - Fuzzy compare disabled for exact match.  
   - Connect left input from “Split Out” node.  
   - Connect right input from “Structured Output Parser” node.  

7. **Create “Simple Memory” Node**  
   - Type: LangChain Memory Buffer Window  
   - Set session key: `={{ $('When chat message received').item.json.sessionId }}`  
   - Session ID type: custom key  
   - Connect input from “Chat Agent” node’s AI memory input port (to be created in next step).  

8. **Create “OpenAI Chat Model2” Node**  
   - Type: LangChain OpenAI Chat Model  
   - Set model to “gpt-5-nano”.  
   - Attach OpenAI API credentials (requires valid API key configured in n8n).  
   - Connect output to “Chat Agent” node’s ai_languageModel input.  

9. **Create “Chat Agent” Node**  
   - Type: LangChain Agent  
   - Text input: `={{ $('When chat message received').item.json.chatInput }}`  
   - System message: `={{ $json.system_prompt }}` (from merged selected language prompt)  
   - Prompt type: define  
   - Connect main input from “Keep Only Selected Language” node.  
   - Connect ai_memory input from “Simple Memory” node.  
   - Connect ai_languageModel input from “OpenAI Chat Model2” node.  

10. **Connect Nodes Appropriately**  
    - “When chat message received” → “Detect Language” and “Ecommerce Language Prompts”  
    - “Detect Language” → “Structured Output Parser” → “Keep Only Selected Language” (right input)  
    - “Ecommerce Language Prompts” → “Split Out” → “Keep Only Selected Language” (left input)  
    - “Keep Only Selected Language” → “Chat Agent” (main input)  
    - “Simple Memory” → “Chat Agent” (ai_memory input)  
    - “OpenAI Chat Model2” → “Chat Agent” (ai_languageModel input)  
    - “Chat Agent” output returns the chatbot response.

11. **Optional: Add Sticky Notes**  
    - Create sticky notes for setup instructions, workflow overview, and API key management as per original content for user reference.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                              | Context or Link                                                                                                      |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Setup instructions include obtaining OpenAI API keys at https://platform.openai.com/api-keys and managing billing at https://platform.openai.com/settings/organization/billing/overview                                                      | Sticky Note7, Sticky Note12                                                                                          |
| Workflow description: Multilingual eCommerce chatbot powered by GPT-5 Nano, fully implemented in n8n with conversational memory for English, Spanish, and French support.                                                                  | Sticky Note8                                                                                                        |
| Contact: Robert Breen – Email: robert@ynteractive.com, LinkedIn: https://www.linkedin.com/in/robert-breen-29429625/, Website: https://ynteractive.com                                                                                      | Sticky Note7                                                                                                        |

---

**Disclaimer:** The provided content is derived solely from an automated n8n workflow. It complies fully with content policies and contains no illegal, offensive, or protected material. All processed data is legal and publicly available.