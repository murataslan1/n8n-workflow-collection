AI-Powered Customer Service Automation with GPT, LangChain & Smart Routing

https://n8nworkflows.xyz/workflows/ai-powered-customer-service-automation-with-gpt--langchain---smart-routing-4626


# AI-Powered Customer Service Automation with GPT, LangChain & Smart Routing

### 1. Workflow Overview

This n8n workflow titled **"AI-Powered Customer Service Automation with GPT, LangChain & Smart Routing"** is designed to automate customer service interactions using advanced AI models and smart routing logic. It leverages Telegram as the input channel, processes both voice and text messages, employs OpenAI GPT models via LangChain for intent, sentiment, and privacy classification, manages conversation memory in Postgres, and routes interactions for human intervention if needed. The workflow also integrates external data sources such as Google Sheets and Google Docs as knowledge bases and order databases, enriching AI responses with contextual information.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Preprocessing:** Captures Telegram messages (voice or text), downloads voice files if applicable, and transcribes audio to text.
- **1.2 Message Classification and Parsing:** Uses AI to classify message intent, sentiment, and privacy concerns.
- **1.3 Conversation Context Generation and Memory Management:** Builds conversation context with historical data stored in Postgres and Supabase.
- **1.4 AI Agent Processing:** Runs a LangChain-based customer service agent that handles the conversation, referencing knowledge bases and order data.
- **1.5 Response and Routing:** Sends replies via Telegram and routes critical or human-requested cases to appropriate email escalation paths.
- **1.6 Aggregation and Merge Logic:** Manages branching and merging of parallel processing paths.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Preprocessing

**Overview:**  
This block listens for incoming Telegram messages, distinguishes between voice and text inputs, downloads voice files, and transcribes audio to text for further AI processing.

**Nodes Involved:**  
- Telegram Trigger1  
- Voice or Text (Switch)  
- Download File1  
- Transcribe1  
- Text  
- Merge

**Node Details:**

- **Telegram Trigger1**  
  - Type: Telegram Trigger  
  - Role: Entry point triggered by incoming Telegram messages.  
  - Configuration: Default webhook for Telegram updates.  
  - Input: Telegram messages (voice or text).  
  - Output: Passes data downstream to Voice or Text node.  
  - Edge Cases: Telegram webhook failures, unsupported message types.

- **Voice or Text**  
  - Type: Switch  
  - Role: Determines if message is voice or text.  
  - Configuration: Branches based on message type property.  
  - Inputs: Telegram Trigger1 output.  
  - Outputs: Voice branch → Download File1; Text branch → Text node.  
  - Edge Cases: Incorrect message type detection, missing data.

- **Download File1**  
  - Type: Telegram node (file download)  
  - Role: Downloads voice message file from Telegram.  
  - Configuration: Uses Telegram credentials and webhook.  
  - Inputs: Voice branch from Voice or Text.  
  - Outputs: File data to Transcribe1.  
  - Edge Cases: Download failure, file corruption.

- **Transcribe1**  
  - Type: LangChain OpenAI node  
  - Role: Transcribes audio file to text using OpenAI.  
  - Configuration: Uses OpenAI speech-to-text or GPT transcription.  
  - Inputs: File data from Download File1.  
  - Outputs: Transcribed text to Merge node.  
  - Edge Cases: Transcription errors, API limits.

- **Text**  
  - Type: Set node  
  - Role: Prepares plain text messages for merging.  
  - Inputs: Text branch from Voice or Text.  
  - Outputs: Text data to Merge node.  
  - Edge Cases: Empty or malformed text messages.

- **Merge**  
  - Type: Merge  
  - Role: Combines transcribed text and direct text inputs into a single stream for classification.  
  - Inputs: Transcribe1 and Text.  
  - Outputs: Unified text data to classification nodes.  
  - Edge Cases: Merge conflicts, data format inconsistencies.

---

#### 1.2 Message Classification and Parsing

**Overview:**  
This block classifies the incoming message on intent, sentiment, and privacy to understand user needs and potential risks.

**Nodes Involved:**  
- intent classifier (chainLlm)  
- sentiment classifier (chainLlm)  
- privacy classifier (chainLlm)  
- Structured Output Parser (3 instances)  
- OpenAI Chat Model10, OpenAI Chat Model11, OpenAI Chat Model8  
- Merge3  
- Merge4

**Node Details:**

- **intent classifier**  
  - Type: LangChain LLM Chain  
  - Role: Classifies user intent from the message.  
  - Configuration: Uses OpenAI Chat Model10 with structured output parsing.  
  - Inputs: Merged text from Merge node.  
  - Outputs: Intent classification data to Merge3 and Merge4.  
  - Edge Cases: Misclassification, ambiguous intents.

- **sentiment classifier**  
  - Type: LangChain LLM Chain  
  - Role: Determines sentiment (e.g., positive, negative, neutral).  
  - Configuration: Uses OpenAI Chat Model11 with structured output parsing.  
  - Inputs: Merged text.  
  - Outputs: Sentiment data to Merge3 and Merge4.  
  - Edge Cases: Mixed sentiments, neutral bias.

- **privacy classifier**  
  - Type: LangChain LLM Chain  
  - Role: Detects privacy-sensitive content in the message.  
  - Configuration: Uses OpenAI Chat Model8 with structured output parsing.  
  - Inputs: Merged text.  
  - Outputs: Privacy flags to Merge3.  
  - Edge Cases: False positives/negatives on privacy content.

- **Structured Output Parser** (3 nodes)  
  - Type: LangChain Output Parser Structured  
  - Role: Parses AI model outputs into structured JSON for consistency.  
  - Configuration: Each parser linked to one classifier (intent, sentiment, privacy).  
  - Inputs: Corresponding OpenAI Chat Model outputs.  
  - Outputs: Parsed data to respective classifiers.  
  - Edge Cases: Parsing failures if AI response format changes.

- **OpenAI Chat Models (10,11,8)**  
  - Type: LangChain OpenAI Chat Model Nodes  
  - Role: Provide the AI processing power for classification tasks.  
  - Configuration: API keys, temperature settings (likely low for classification).  
  - Inputs: Text from Merge.  
  - Outputs: Raw classification responses to parsers.  
  - Edge Cases: API rate limits, network errors.

- **Merge3, Merge4**  
  - Type: Merge nodes  
  - Role: Combine outputs from classifiers to unify analysis results.  
  - Inputs: Classifier outputs.  
  - Outputs: Combined classification data downstream.  
  - Edge Cases: Data synchronization issues.

---

#### 1.3 Conversation Context Generation and Memory Management

**Overview:**  
This block generates context for the conversation by aggregating historical chat and feedback stored in external databases and maintains chat memory for continuity.

**Nodes Involved:**  
- Generate conv context (LangChain agent)  
- Postgres Chat Memory (LangChain memory node)  
- Supabase1 (Supabase tool)  
- Aliment context for next messages (Supabase node)  
- Historial Chat and feedback (Google Sheets)  
- Merge3, Merge4, Aggregate, Aggregate3

**Node Details:**

- **Generate conv context**  
  - Type: LangChain Agent  
  - Role: Builds conversation context based on past interactions and current input.  
  - Configuration: Uses OpenAI Chat Model2 and Supabase as memory backend.  
  - Inputs: Merged classification data and conversation memory.  
  - Outputs: Contextual data to Merge4 for further processing.  
  - Edge Cases: Missing past data, incomplete context.

- **Postgres Chat Memory**  
  - Type: LangChain Memory (Postgres)  
  - Role: Stores and retrieves conversation history for continuity.  
  - Configuration: Postgres credentials and database details.  
  - Inputs: Customer service agent interactions.  
  - Outputs: Historical conversation data to Generate conv context.  
  - Edge Cases: Database connection failures, data corruption.

- **Supabase1**  
  - Type: Supabase Tool  
  - Role: Another external memory source supporting context generation.  
  - Configuration: Supabase credentials.  
  - Inputs: Conversation data.  
  - Outputs: Contextual data to Generate conv context.  
  - Edge Cases: Network issues, expired tokens.

- **Aliment context for next messages**  
  - Type: Supabase node  
  - Role: Updates context storage for upcoming messages.  
  - Configuration: Supabase credentials and relevant table setup.  
  - Inputs: Customer service agent output.  
  - Outputs: Confirmation of context update.  
  - Edge Cases: Write failures.

- **Historial Chat and feedback**  
  - Type: Google Sheets  
  - Role: Logs conversations and feedback for audit and training.  
  - Configuration: Google Sheets API credentials and target sheet.  
  - Inputs: Customer service agent output.  
  - Outputs: Data persisted in spreadsheet.  
  - Edge Cases: Sheet access denied, quota exceeded.

- **Merge3, Merge4, Aggregate, Aggregate3**  
  - Type: Merge and Aggregate  
  - Role: Combine and summarize multiple data streams for agent input.  
  - Inputs/Outputs: Various classifier and context data streams.  
  - Edge Cases: Data mismatch, aggregation errors.

---

#### 1.4 AI Agent Processing

**Overview:**  
This is the core AI processing block where the LangChain customer service agent uses all aggregated data, knowledge bases, and order databases to generate context-aware responses.

**Nodes Involved:**  
- Customer service AGENT (LangChain Agent)  
- Knowledge base (Google Docs Tool)  
- orders database (Google Sheets Tool)  
- OpenAI Chat Model (lmChatOpenAi)  
- Postgres Chat Memory  
- Think1 (LangChain toolThink)  
- Sticky Notes related to AI agent function (for documentation only)

**Node Details:**

- **Customer service AGENT**  
  - Type: LangChain Agent  
  - Role: Processes the conversation using AI, referencing external data and memory.  
  - Configuration: Connected to OpenAI Chat Model, Postgres Chat Memory, Google Docs and Sheets tools as data sources.  
  - Inputs: Aggregated context, knowledge base, orders database.  
  - Outputs: Response generation to Telegram and context updates.  
  - Edge Cases: API failures, unexpected input format, knowledge base access issues.

- **Knowledge base**  
  - Type: Google Docs Tool  
  - Role: Supplies domain knowledge documents to the AI agent.  
  - Configuration: Google Docs API credentials.  
  - Inputs: Queries from the AI agent.  
  - Outputs: Document content to AI agent.  
  - Edge Cases: Permission denied, document missing.

- **orders database**  
  - Type: Google Sheets Tool  
  - Role: Provides order-related data to augment AI responses.  
  - Configuration: Google Sheets API credentials.  
  - Inputs: Queries from AI agent.  
  - Outputs: Relevant order data.  
  - Edge Cases: Sheet structure changes, access issues.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Core language model powering the AI agent.  
  - Configuration: OpenAI API key, chat model parameters.  
  - Inputs: Context and queries from agent.  
  - Outputs: Textual AI responses.  
  - Edge Cases: API limits, network failures.

- **Postgres Chat Memory**  
  - Role as above: Maintains chat history for the agent.  
  - Inputs: Current conversation.  
  - Outputs: Memory context for next steps.

- **Think1**  
  - Type: LangChain toolThink  
  - Role: Enables the agent to perform internal reasoning or tool calls.  
  - Inputs: Agent's intermediate thoughts.  
  - Outputs: Next action for Customer service AGENT.

---

#### 1.5 Response and Routing

**Overview:**  
This block sends responses back to users via Telegram and routes messages flagged for human intervention via email escalation paths based on message criticality.

**Nodes Involved:**  
- respond (Telegram node)  
- Human intervention (LangChain textClassifier)  
- Owner escalation (Gmail)  
- Critical complaint. (Gmail)  
- Human request. (Gmail)  
- Normal path / success (NoOp)  
- OpenAI Chat Model1 (for Human intervention)

**Node Details:**

- **respond**  
  - Type: Telegram node  
  - Role: Sends message responses back to Telegram users.  
  - Configuration: Uses Telegram credentials to send messages.  
  - Inputs: Customer service agent output.  
  - Edge Cases: Telegram API errors, message formatting issues.

- **Human intervention**  
  - Type: LangChain textClassifier  
  - Role: Determines if the case requires escalation or human assistance.  
  - Configuration: Uses OpenAI Chat Model1 for classification.  
  - Inputs: Aggregated AI agent output.  
  - Outputs: Routed to one of the Gmail nodes or normal path.  
  - Edge Cases: Misclassification, false positives.

- **Owner escalation**  
  - Type: Gmail node  
  - Role: Sends email alerts to owners for escalation.  
  - Configuration: Gmail OAuth2 credentials.  
  - Inputs: Human intervention classification.  
  - Edge Cases: Email delivery failures.

- **Critical complaint.**  
  - Type: Gmail node  
  - Role: Emails critical complaint notifications.  
  - Configuration: Gmail credentials, preconfigured recipient.  
  - Edge Cases: Email blocked or delayed.

- **Human request.**  
  - Type: Gmail node  
  - Role: Handles general human assistance requests via email.  
  - Edge Cases: Same as above.

- **Normal path / success**  
  - Type: NoOp (no operation)  
  - Role: Represents normal flow when no escalation is needed.  

---

#### 1.6 Aggregation and Merge Logic

**Overview:**  
These nodes manage the synchronization and aggregation of parallel AI processing streams for coherent downstream use.

**Nodes Involved:**  
- Merge3  
- Merge4  
- Aggregate  
- Aggregate3

**Node Details:**

- **Merge3 & Merge4**  
  - Type: Merge  
  - Role: Combine outputs from multiple classifiers or context generators.  
  - Edge Cases: Potential data loss if nodes do not output as expected.

- **Aggregate & Aggregate3**  
  - Type: Aggregate  
  - Role: Consolidate multiple inputs into single unified datasets for AI agents and routing.  
  - Edge Cases: Empty inputs causing downstream errors.

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                            | Input Node(s)                 | Output Node(s)                      | Sticky Note                          |
|-------------------------|----------------------------------|--------------------------------------------|------------------------------|-----------------------------------|------------------------------------|
| Telegram Trigger1       | Telegram Trigger                 | Entry point for Telegram messages          | -                            | Voice or Text                     |                                    |
| Voice or Text           | Switch                          | Routes voice or text messages               | Telegram Trigger1            | Download File1, Text              |                                    |
| Download File1          | Telegram                        | Downloads voice messages                     | Voice or Text (voice branch) | Transcribe1                      |                                    |
| Transcribe1             | LangChain OpenAI                | Transcribes audio to text                    | Download File1               | Merge                           |                                    |
| Text                    | Set                            | Prepares text messages                       | Voice or Text (text branch)  | Merge                           |                                    |
| Merge                   | Merge                          | Merges text from transcription and direct  | Transcribe1, Text            | intent classifier, sentiment classifier, privacy classifier |                                    |
| intent classifier       | LangChain Chain LLM             | Classifies user intent                       | Merge                       | Merge4, Merge3                  |                                    |
| sentiment classifier    | LangChain Chain LLM             | Classifies sentiment                         | Merge                       | Merge3, Merge4                  |                                    |
| privacy classifier      | LangChain Chain LLM             | Classifies privacy content                   | Merge                       | Merge3                         |                                    |
| Structured Output Parser| LangChain Output Parser         | Parses AI outputs into structured JSON      | OpenAI Chat Models           | Classifier nodes                |                                    |
| OpenAI Chat Model10     | LangChain OpenAI Chat Model     | Provides intent classification              | Merge                       | Structured Output Parser         |                                    |
| OpenAI Chat Model11     | LangChain OpenAI Chat Model     | Provides sentiment classification           | Merge                       | Structured Output Parser1        |                                    |
| OpenAI Chat Model8      | LangChain OpenAI Chat Model     | Provides privacy classification             | Merge                       | Structured Output Parser2        |                                    |
| Merge3                  | Merge                          | Combines privacy, intent, sentiment data    | privacy classifier, intent classifier, sentiment classifier | Aggregate3                   |                                    |
| Merge4                  | Merge                          | Combines intent, sentiment, context data    | intent classifier, sentiment classifier, Generate conv context | Aggregate                   |                                    |
| Aggregate               | Aggregate                      | Aggregates data for human intervention       | Merge4                      | Human intervention              |                                    |
| Aggregate3              | Aggregate                      | Aggregates data for customer service agent   | Merge3                      | Customer service AGENT          |                                    |
| Generate conv context   | LangChain Agent                | Builds conversation context                   | Merge, Supabase1            | Merge4                         |                                    |
| Supabase1               | Supabase Tool                  | Retrieves/stores conversation context        |                             | Generate conv context           |                                    |
| Postgres Chat Memory    | LangChain Memory Postgres       | Stores conversation memory                    | Customer service AGENT       | Customer service AGENT          |                                    |
| Aliment context for next messages | Supabase                 | Updates context with latest messages          | Customer service AGENT       |                             |                                    |
| Historial Chat and feedback | Google Sheets               | Logs chat and feedback                         | Customer service AGENT       |                             |                                    |
| Customer service AGENT  | LangChain Agent                | Main AI agent for customer service            | Aggregate3                  | Historial Chat and feedback, respond, Aliment context for next messages |                                    |
| respond                 | Telegram                      | Sends response messages                        | Customer service AGENT       |                             |                                    |
| Human intervention      | LangChain Text Classifier       | Determines need for human escalation          | Aggregate                   | Owner escalation, Human request., Critical complaint., Normal path / success |                                    |
| Owner escalation        | Gmail                         | Sends escalation emails to owners             | Human intervention          |                             |                                    |
| Critical complaint.     | Gmail                         | Sends emails for critical complaints          | Human intervention          |                             |                                    |
| Human request.          | Gmail                         | Sends emails for human assistance requests    | Human intervention          |                             |                                    |
| Normal path / success   | NoOp                          | Default path when no escalation needed        | Human intervention          |                             |                                    |
| OpenAI Chat Model1      | LangChain OpenAI Chat Model     | Used in human intervention classification     | Aggregate                   | Human intervention              |                                    |
| OpenAI Chat Model2      | LangChain OpenAI Chat Model     | Used in conversation context generation        |                             | Generate conv context           |                                    |
| Think1                  | LangChain toolThink            | Supports AI agent internal reasoning          |                             | Customer service AGENT          |                                    |
| Knowledge base          | Google Docs Tool               | Supplies documents to AI agent                  |                             | Customer service AGENT          |                                    |
| orders database         | Google Sheets Tool             | Supplies order data to AI agent                  |                             | Customer service AGENT          |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Type: Telegram Trigger  
   - Configure Telegram bot credentials and webhook for message reception.

2. **Add Switch node "Voice or Text"**  
   - Type: Switch  
   - Condition: Check if incoming message contains voice (audio) or text.  
   - Connect Telegram Trigger output to this node.

3. **Add Telegram node "Download File1"**  
   - Type: Telegram  
   - Configure with Telegram credentials.  
   - Connect "Voice" branch of Switch to this node to download voice messages.

4. **Add LangChain OpenAI node "Transcribe1"**  
   - Type: LangChain OpenAI  
   - Configure with OpenAI API credentials for speech-to-text.  
   - Connect output of Download File1 to this node.

5. **Add Set node "Text"**  
   - Type: Set  
   - Configure to pass through or format text messages.  
   - Connect "Text" branch of Switch to this node.

6. **Add Merge node "Merge"**  
   - Type: Merge  
   - Configure to combine outputs from Transcribe1 and Text nodes.  
   - Connect outputs of Transcribe1 and Text nodes to this Merge.

7. **Create LangChain OpenAI Chat Model nodes for classification:**  
   - "OpenAI Chat Model10" for intent classification  
   - "OpenAI Chat Model11" for sentiment classification  
   - "OpenAI Chat Model8" for privacy classification  
   - Configure each with OpenAI API credentials and suitable prompt templates for classification.

8. **Add Structured Output Parser nodes (3 total)**  
   - Each connected to one of the above Chat Model nodes to parse structured JSON output.

9. **Add LangChain LLM Chain nodes:**  
   - "intent classifier", "sentiment classifier", "privacy classifier"  
   - Connect respective parsers to these classifiers.

10. **Add Merge nodes "Merge3" and "Merge4"**  
    - Merge3: Combine outputs from privacy classifier, intent classifier, sentiment classifier.  
    - Merge4: Combine intent classifier, sentiment classifier, and Generate conv context outputs.

11. **Add LangChain Agent node "Generate conv context"**  
    - Configure with OpenAI Chat Model2 and Supabase credentials.  
    - Connect Supabase tool node "Supabase1" for memory retrieval.  
    - Connect Merge output and Supabase1 output to this agent.

12. **Create Supabase Tool node "Supabase1"**  
    - Configure with Supabase credentials.  
    - Connect as input to Generate conv context node.

13. **Add Aggregate nodes "Aggregate" and "Aggregate3"**  
    - Aggregate: Combine data for Human intervention.  
    - Aggregate3: Combine data for Customer service agent.

14. **Add LangChain Agent node "Customer service AGENT"**  
    - Configure with OpenAI Chat Model, Postgres Chat Memory, Google Docs Tool ("Knowledge base"), and Google Sheets Tool ("orders database").  
    - Connect Aggregate3 output to this agent.

15. **Add Postgres Chat Memory node**  
    - Configure with Postgres credentials.  
    - Connect to Customer service AGENT as memory backend.

16. **Add Google Docs Tool node "Knowledge base"**  
    - Configure with Google Docs API credentials.  
    - Connect to Customer service AGENT.

17. **Add Google Sheets Tool node "orders database"**  
    - Configure with Google Sheets API credentials.  
    - Connect to Customer service AGENT.

18. **Add Google Sheets node "Historial Chat and feedback"**  
    - Configure to log conversations.  
    - Connect Customer service AGENT output to this node.

19. **Add Supabase node "Aliment context for next messages"**  
    - Configure with Supabase credentials.  
    - Connect Customer service AGENT output to update context.

20. **Add Telegram node "respond"**  
    - Configure with Telegram credentials.  
    - Connect Customer service AGENT output to send messages to users.

21. **Add LangChain textClassifier node "Human intervention"**  
    - Configure with OpenAI Chat Model1 for classification of escalation needs.  
    - Connect Aggregate output to this node.

22. **Add Gmail nodes:**  
    - "Owner escalation", "Critical complaint.", "Human request."  
    - Configure with Gmail OAuth2 credentials and recipient emails.  
    - Connect outputs from Human intervention node to corresponding Gmail nodes based on classification.

23. **Add NoOp node "Normal path / success"**  
    - Connect for cases with no escalation.

24. **Add LangChain toolThink node "Think1"**  
    - Connect to Customer service AGENT to enable internal AI reasoning.

25. **Add Merge nodes "Merge3" and "Merge4"**  
    - Connect as per classification and context aggregation.

26. **Test end-to-end with Telegram messages including voice and text inputs.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                    | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow integrates Telegram, OpenAI GPT models, LangChain, Postgres, Supabase, Google Docs, Google Sheets, and Gmail for a robust customer service setup. | Workflow title and description.                                                                 |
| Ensure all API credentials (Telegram, OpenAI, Google, Supabase, Postgres, Gmail) are configured correctly with sufficient permissions and quota.                | Credential setup critical for operation.                                                        |
| Voice messages are transcribed via OpenAI, allowing seamless voice-to-text integration for multi-modal input.                                                  | Node: Transcribe1.                                                                              |
| Human escalation is smartly routed via Gmail based on classification by AI to ensure timely responses.                                                        | Nodes: Human intervention, Owner escalation, Critical complaint., Human request.                 |
| The workflow uses LangChain’s structured output parsers to ensure consistency in AI responses, reducing errors downstream.                                     | Structured Output Parser nodes.                                                                 |
| Extensive use of Merge and Aggregate nodes ensures synchronization of parallel AI analyses and data sources.                                                  | Merge and Aggregate nodes throughout workflow.                                                 |

---

**Disclaimer:** The provided text is generated exclusively from an n8n automated workflow. This process adheres strictly to current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.