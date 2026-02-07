AI-Powered WhatsApp Customer Service with GPT-4, Smart Routing & Knowledge Base

https://n8nworkflows.xyz/workflows/ai-powered-whatsapp-customer-service-with-gpt-4--smart-routing---knowledge-base-7795


# AI-Powered WhatsApp Customer Service with GPT-4, Smart Routing & Knowledge Base

---

## 1. Workflow Overview

This workflow implements an AI-powered WhatsApp customer service system leveraging GPT-4 and integrates smart routing and a knowledge base to enhance customer interaction quality. It is designed to handle incoming WhatsApp messages (text or voice), classify intent, sentiment, and privacy concerns, enrich conversations with context from databases and knowledge bases, and decide on automated or human intervention paths. The logical blocks include:

- **1.1 Input Reception & Preprocessing:** Reception of WhatsApp messages, differentiation of voice or text, media download, and transcription.
- **1.2 AI Classification:** Classification of message intent, sentiment, and privacy level using specialized AI chains.
- **1.3 Context Generation & Memory Management:** Aggregation of data and generation of conversational context, including integration with external data sources (Google Sheets, Google Docs, Supabase, Postgres).
- **1.4 AI Agent & Smart Routing:** AI agent handling of customer interactions, deciding on automated responses or escalation to human agents.
- **1.5 Human Intervention & Escalation:** Handling cases flagged for human review with email notifications for escalation paths.
- **1.6 Response Dispatch:** Sending final responses back to customers on WhatsApp.
- **1.7 Auxiliary Functions:** Merging, aggregation, parsing structured outputs, and managing chat memory.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception & Preprocessing

**Overview:**  
This block handles receiving WhatsApp messages, distinguishing between voice and text inputs, downloading voice media, and transcribing voice to text for further processing.

**Nodes Involved:**  
- WhatsApp Trigger  
- Voice or Text (Switch)  
- Download media  
- Transcribe1  
- Text  
- Merge  

**Node Details:**

- **WhatsApp Trigger**  
  - *Type:* WhatsApp webhook trigger  
  - *Role:* Entry point capturing incoming WhatsApp messages (text or voice).  
  - *Config:* Webhook ID set; listens for new messages.  
  - *Outputs:* Connects to Voice or Text node.  
  - *Failure modes:* Webhook misconfiguration, message format errors.

- **Voice or Text (Switch)**  
  - *Type:* Switch node  
  - *Role:* Branches workflow depending on whether the incoming message is voice or text.  
  - *Config:* Condition based on message type (e.g., media type or presence of audio data).  
  - *Inputs:* WhatsApp Trigger  
  - *Outputs:* Two outputs — one to Download media (voice), one to Text node (text).  
  - *Edge cases:* Unrecognized media types, missing media URL.

- **Download media**  
  - *Type:* WhatsApp media downloader  
  - *Role:* Downloads voice message media from WhatsApp server.  
  - *Config:* Uses webhook ID for authentication, fetches media content.  
  - *Inputs:* Voice or Text (voice branch)  
  - *Outputs:* Transcribe1  
  - *Failure modes:* Network errors, expired media URLs.

- **Transcribe1**  
  - *Type:* OpenAI transcription (LangChain OpenAI node)  
  - *Role:* Transcribes downloaded voice media to text.  
  - *Config:* Default transcription settings (language detection, model).  
  - *Inputs:* Download media  
  - *Outputs:* Merge node  
  - *Edge cases:* Poor audio quality, transcription errors.

- **Text**  
  - *Type:* Set node  
  - *Role:* Sets or prepares text data directly for merging.  
  - *Inputs:* Voice or Text (text branch)  
  - *Outputs:* Merge node

- **Merge**  
  - *Type:* Merge node  
  - *Role:* Merges transcribed voice text and direct text inputs into a unified message stream for downstream processing.  
  - *Inputs:* Transcribe1 and Text  
  - *Outputs:* Intent classifier and subsequent nodes  
  - *Edge cases:* Synchronization errors if both inputs arrive simultaneously.

---

### 2.2 AI Classification

**Overview:**  
Classifies the incoming message for intent, sentiment, and privacy sensitivity using dedicated AI language model chains with structured output parsing.

**Nodes Involved:**  
- intent classifier  
- sentiment classifier  
- privacy classifier  
- OpenAI Chat Model10 (for intent)  
- OpenAI Chat Model11 (for sentiment)  
- OpenAI Chat Model8 (for privacy)  
- Structured Output Parser (for intent)  
- Structured Output Parser1 (for sentiment)  
- Structured Output Parser2 (for privacy)  
- Merge3  
- Merge4  

**Node Details:**

- **intent classifier**  
  - *Type:* Chain LLM  
  - *Role:* Predicts user intent from the message.  
  - *Config:* Uses OpenAI Chat Model10 as language model; structured output parsing via Structured Output Parser.  
  - *Inputs:* Merge (preprocessed message)  
  - *Outputs:* Merge4 and Merge3 for further aggregation.  
  - *Edge cases:* Misclassification, ambiguous inputs.

- **sentiment classifier**  
  - *Type:* Chain LLM (execute once)  
  - *Role:* Evaluates emotional tone of the message.  
  - *Config:* OpenAI Chat Model11; structured output parsing via Structured Output Parser1.  
  - *Inputs:* Merge  
  - *Outputs:* Merge3 and Merge4  
  - *Edge cases:* Neutral or mixed sentiment detection inaccuracies.

- **privacy classifier**  
  - *Type:* Chain LLM  
  - *Role:* Detects privacy-sensitive content.  
  - *Config:* OpenAI Chat Model8; structured output parsing via Structured Output Parser2.  
  - *Inputs:* Merge  
  - *Outputs:* Merge3  
  - *Edge cases:* False positives or negatives on privacy content.

- **Structured Output Parser (intent, sentiment, privacy)**  
  - *Type:* Output Parser Structured  
  - *Role:* Parses raw AI responses into structured JSON for logic branching.  
  - *Config:* Custom schema definitions per classification type.  
  - *Inputs:* Corresponding OpenAI Chat Models  
  - *Outputs:* Respective classifier nodes

- **Merge3 and Merge4**  
  - *Type:* Merge nodes  
  - *Role:* Aggregates classification outputs to synchronize parallel analyses.  
  - *Inputs:* Various classifier outputs  
  - *Outputs:* Aggregate3 and Aggregate nodes respectively

---

### 2.3 Context Generation & Memory Management

**Overview:**  
Aggregates classification results and enriches conversation with knowledge base data, order database info, and stores chat memory to create a rich context for AI interaction.

**Nodes Involved:**  
- Aggregate3  
- Aggregate  
- Generate conv context  
- Knowledge base (Google Docs)  
- orders database (Google Sheets)  
- Supabase1  
- Postgres Chat Memory  
- OpenAI Chat Model2  
- Aliment context for next messages  

**Node Details:**

- **Aggregate3 & Aggregate**  
  - *Type:* Aggregate nodes  
  - *Role:* Combine multiple inputs into a consolidated dataset for the AI agent.  
  - *Inputs:* Merge3 and Merge4  
  - *Outputs:* Customer service AGENT and Human intervention (via Aggregate)  

- **Generate conv context**  
  - *Type:* LangChain Agent  
  - *Role:* Builds conversation context using AI with data from Supabase and OpenAI Chat Model2.  
  - *Inputs:* Merge, Supabase1  
  - *Outputs:* Merge4  
  - *Edge cases:* Database connectivity issues, incomplete context generation.

- **Knowledge base**  
  - *Type:* Google Docs Tool  
  - *Role:* Provides relevant knowledge base documents for AI responses.  
  - *Inputs:* AI tool input from Customer service AGENT  
  - *Outputs:* Customer service AGENT  
  - *Edge cases:* Access permission errors, outdated docs.

- **orders database**  
  - *Type:* Google Sheets Tool  
  - *Role:* Supplies order-related data for customer inquiries.  
  - *Inputs:* AI tool input from Customer service AGENT  
  - *Outputs:* Customer service AGENT  
  - *Edge cases:* Data sync issues, incorrect sheet references.

- **Supabase1**  
  - *Type:* Supabase Tool  
  - *Role:* Fetches additional data from Supabase database to augment context.  
  - *Inputs:* None directly, used as AI tool for Generate conv context.  
  - *Outputs:* Generate conv context  
  - *Failure modes:* API auth errors, query failures.

- **Postgres Chat Memory**  
  - *Type:* Postgres Chat Memory (LangChain)  
  - *Role:* Stores and retrieves conversation history to maintain context continuity.  
  - *Inputs:* AI memory from Customer service AGENT  
  - *Outputs:* Customer service AGENT  
  - *Edge cases:* Database connectivity, data corruption.

- **Aliment context for next messages**  
  - *Type:* Supabase (standard node)  
  - *Role:* Updates conversation context in Supabase for future message handling.  
  - *Inputs:* Customer service AGENT  
  - *Outputs:* None (presumed success)  
  - *Edge cases:* Write failures, concurrency conflicts.

- **OpenAI Chat Model2**  
  - *Type:* Language Model (Chat)  
  - *Role:* Used within Generate conv context for AI-based context preparation.  
  - *Inputs:* AI language model input from Generate conv context  
  - *Outputs:* Generate conv context

---

### 2.4 AI Agent & Smart Routing

**Overview:**  
Central AI agent node uses all aggregated inputs and context to generate customer service responses or decide on escalation paths.

**Nodes Involved:**  
- Customer service AGENT  
- Think1  
- OpenAI Chat Model  
- OpenAI Chat Model1  
- OpenAI Chat Model2 (also part of context generation)  
- Human intervention  
- Human intervention classifier (textClassifier node)  
- Historial Chat and feedback (Google Sheets)  
- Send message (WhatsApp)  
- Merge3, Merge4, Aggregate nodes (supporting data flow)

**Node Details:**

- **Customer service AGENT**  
  - *Type:* LangChain Agent  
  - *Role:* Main AI agent handling customer conversations by integrating classification, databases, knowledge base, and chat memory.  
  - *Config:* Connected with multiple AI tools and memory nodes; outputs to chat history, context update, and message sending.  
  - *Inputs:* Aggregate3 (classification and context aggregated), Knowledge base, orders database, Postgres Chat Memory  
  - *Outputs:* Historial Chat and feedback, Aliment context for next messages, Send message  
  - *Edge cases:* AI response failures, context incoherence.

- **Think1**  
  - *Type:* LangChain Tool Think  
  - *Role:* Executes reasoning steps or tool invocations for the agent.  
  - *Inputs:* Not explicitly connected from description; likely used internally by Customer service AGENT.  
  - *Outputs:* Customer service AGENT  

- **OpenAI Chat Model**  
  - *Type:* Language Model (Chat)  
  - *Role:* Provides language modeling for Customer service AGENT.  
  - *Inputs:* AI languageModel input from Customer service AGENT  
  - *Outputs:* Customer service AGENT  

- **OpenAI Chat Model1**  
  - *Type:* Language Model (Chat)  
  - *Role:* Used by Human intervention node to generate messages for escalation or human review.  
  - *Inputs:* AI languageModel input from Human intervention  
  - *Outputs:* Human intervention  

- **Human intervention (textClassifier)**  
  - *Type:* LangChain Text Classifier  
  - *Role:* Determines whether a message requires human intervention, and if so, which escalation path.  
  - *Inputs:* Aggregate (aggregated classification data)  
  - *Outputs:* Owner escalation, Human request, Critical complaint, or Normal path / success  
  - *Edge cases:* Misclassification leading to unnecessary or missed escalations.

- **Owner escalation, Human request., Critical complaint. (Gmail nodes)**  
  - *Type:* Gmail nodes  
  - *Role:* Send emails to human agents or owners based on intervention classification.  
  - *Config:* OAuth2 credentials for Gmail, configured with recipient addresses and email content.  
  - *Inputs:* Human intervention  
  - *Outputs:* None  
  - *Edge cases:* Email delivery failures, credential expiration.

- **Historial Chat and feedback**  
  - *Type:* Google Sheets  
  - *Role:* Records chat transcripts and user feedback for quality and auditing.  
  - *Inputs:* Customer service AGENT  
  - *Outputs:* None

- **Send message**  
  - *Type:* WhatsApp  
  - *Role:* Sends AI-generated or human-validated messages back to the customer on WhatsApp.  
  - *Inputs:* Customer service AGENT  
  - *Outputs:* None  
  - *Edge cases:* Message delivery failures, WhatsApp API rate limits.

---

### 2.5 Auxiliary Functions and Notes

**Sticky Notes:**  
Multiple sticky notes are positioned near nodes to provide context or instructions, though their content is empty or not provided in the JSON. They likely serve as placeholders for operator annotations or reminders.

---

## 3. Summary Table

| Node Name               | Node Type                            | Functional Role                         | Input Node(s)                      | Output Node(s)                         | Sticky Note |
|-------------------------|------------------------------------|---------------------------------------|----------------------------------|--------------------------------------|-------------|
| WhatsApp Trigger        | WhatsApp Trigger                   | Entry point for incoming WhatsApp messages | None                             | Voice or Text                        |             |
| Voice or Text           | Switch                            | Branch for voice or text message processing | WhatsApp Trigger                 | Download media, Text                 |             |
| Download media          | WhatsApp                          | Downloads voice media                  | Voice or Text                    | Transcribe1                         |             |
| Transcribe1             | OpenAI transcription (LangChain) | Transcribes voice to text              | Download media                   | Merge                              |             |
| Text                    | Set                              | Prepares text input                    | Voice or Text                   | Merge                              |             |
| Merge                   | Merge                            | Combines transcribed and text inputs  | Transcribe1, Text               | intent classifier, sentiment classifier, privacy classifier, Merge4, Generate conv context, Merge3 |             |
| intent classifier       | Chain LLM                        | Classifies user intent                 | Merge                          | Merge4, Merge3                     |             |
| sentiment classifier    | Chain LLM                        | Classifies sentiment                   | Merge                          | Merge3, Merge4                    |             |
| privacy classifier      | Chain LLM                        | Classifies privacy sensitivity         | Merge                          | Merge3                            |             |
| Structured Output Parser | Output Parser Structured         | Parses intent classifier output        | OpenAI Chat Model10             | intent classifier                 |             |
| Structured Output Parser1 | Output Parser Structured        | Parses sentiment classifier output     | OpenAI Chat Model11             | sentiment classifier              |             |
| Structured Output Parser2 | Output Parser Structured        | Parses privacy classifier output       | OpenAI Chat Model8              | privacy classifier                |             |
| Merge3                  | Merge                            | Aggregates privacy, sentiment, intent outputs | privacy classifier, intent classifier, sentiment classifier | Aggregate3                         |             |
| Aggregate3              | Aggregate                        | Aggregates classification data         | Merge3                         | Customer service AGENT             |             |
| Merge4                  | Merge                            | Aggregates intent and sentiment outputs | intent classifier, sentiment classifier, Generate conv context, Merge | Aggregate                        |             |
| Aggregate               | Aggregate                        | Combines data for human intervention    | Merge4                         | Human intervention                |             |
| Generate conv context   | LangChain Agent                 | Generates enriched conversation context | Merge, Supabase1               | Merge4                           |             |
| Knowledge base          | Google Docs Tool                | Provides knowledge base data            | Customer service AGENT          | Customer service AGENT             |             |
| orders database         | Google Sheets Tool              | Provides order info                     | Customer service AGENT          | Customer service AGENT             |             |
| Supabase1               | Supabase Tool                  | Fetches additional context data         | None                          | Generate conv context             |             |
| Postgres Chat Memory    | Postgres Chat Memory (LangChain) | Stores and retrieves chat history       | Customer service AGENT          | Customer service AGENT             |             |
| Aliment context for next messages | Supabase                    | Updates conversation context            | Customer service AGENT          | None                             |             |
| Customer service AGENT  | LangChain Agent                | Main AI agent for customer interaction  | Aggregate3, Knowledge base, orders database, Postgres Chat Memory | Historial Chat and feedback, Aliment context for next messages, Send message |             |
| Historial Chat and feedback | Google Sheets                 | Logs chat and feedback                   | Customer service AGENT          | None                             |             |
| Send message            | WhatsApp                       | Sends message back to customer          | Customer service AGENT          | None                             |             |
| Human intervention      | LangChain Text Classifier      | Determines need for human intervention  | Aggregate                      | Owner escalation, Human request., Critical complaint., Normal path / success |             |
| Owner escalation        | Gmail                         | Sends escalation email to owner         | Human intervention             | None                             |             |
| Human request.          | Gmail                         | Sends email for human review request    | Human intervention             | None                             |             |
| Critical complaint.     | Gmail                         | Sends email for critical complaint      | Human intervention             | None                             |             |
| Normal path / success   | NoOp                          | Passes normal cases without escalation  | Human intervention             | None                             |             |
| OpenAI Chat Model       | Language Model (Chat)          | Provides language model for AI agent    | Customer service AGENT          | Customer service AGENT             |             |
| OpenAI Chat Model1      | Language Model (Chat)          | Provides language model for human intervention | Human intervention             | Human intervention                |             |
| OpenAI Chat Model2      | Language Model (Chat)          | Supports conversation context generation | Generate conv context          | Generate conv context             |             |
| Think1                  | LangChain Tool Think           | Supports agent reasoning and tool use   | Customer service AGENT          | Customer service AGENT             |             |
| Supabase                 | Supabase                      | Stores updated conversation context     | Customer service AGENT          | None                             |             |

---

## 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger node:**  
   - Type: WhatsApp Trigger  
   - Configure webhook for incoming WhatsApp messages.  
   - Position at workflow start.

2. **Add Switch node "Voice or Text":**  
   - Type: Switch  
   - Condition: Check if incoming message is voice or text (e.g., based on media type or presence of audio).  
   - Connect WhatsApp Trigger output to Switch input.

3. **Add "Download media" node:**  
   - Type: WhatsApp  
   - Configuration: Use webhook ID for media download.  
   - Connect Switch voice output to this node.

4. **Add "Transcribe1" node:**  
   - Type: OpenAI (LangChain OpenAI node)  
   - Configuration: Use OpenAI transcription model for audio to text.  
   - Connect Download media output here.

5. **Add "Text" node:**  
   - Type: Set  
   - Configuration: Pass text payload forward.  
   - Connect Switch text output here.

6. **Add "Merge" node:**  
   - Type: Merge  
   - Configuration: Merge transcribed audio and direct text inputs.  
   - Connect Transcribe1 and Text nodes to Merge inputs.

7. **Add "intent classifier" node:**  
   - Type: Chain LLM  
   - Connect Merge output to input.  
   - Configure with OpenAI Chat Model10 and corresponding Structured Output Parser for intent.

8. **Add "sentiment classifier" node:**  
   - Type: Chain LLM  
   - Connect Merge output.  
   - Configure with OpenAI Chat Model11 and Structured Output Parser1.

9. **Add "privacy classifier" node:**  
   - Type: Chain LLM  
   - Connect Merge output.  
   - Configure with OpenAI Chat Model8 and Structured Output Parser2.

10. **Add Structured Output Parser nodes:**  
    - For each classifier, create a parser node to parse AI output into structured data.  
    - Connect corresponding OpenAI Chat Model outputs to parsers, parsers to classifiers.

11. **Add "Merge3" and "Merge4" nodes:**  
    - Merge3: Combine outputs from privacy classifier, intent classifier, sentiment classifier.  
    - Merge4: Combine outputs from intent classifier, sentiment classifier, Generate conv context, and Merge.  
    - Connect classifiers accordingly.

12. **Add "Aggregate3" and "Aggregate" nodes:**  
    - Aggregate3 input from Merge3, output to Customer service AGENT.  
    - Aggregate input from Merge4, output to Human intervention.

13. **Add "Generate conv context" node:**  
    - Type: LangChain Agent  
    - Inputs: Merge and Supabase1.  
    - Outputs: Merge4.  
    - Configure with OpenAI Chat Model2 and Supabase credentials.

14. **Add "Knowledge base" node:**  
    - Type: Google Docs Tool  
    - Connect AI tool input from Customer service AGENT.  
    - Configure Google Docs credentials.

15. **Add "orders database" node:**  
    - Type: Google Sheets Tool  
    - Connect AI tool input from Customer service AGENT.  
    - Configure Google Sheets credentials.

16. **Add "Supabase1" node:**  
    - Type: Supabase Tool  
    - Provide database access credentials.  
    - Connect to Generate conv context AI tool input.

17. **Add "Postgres Chat Memory" node:**  
    - Type: LangChain Postgres Chat Memory  
    - Connect AI memory input/output with Customer service AGENT.  
    - Configure Postgres credentials.

18. **Add "Aliment context for next messages" node:**  
    - Type: Supabase node  
    - Connect input from Customer service AGENT.  
    - Configure to update conversation context in Supabase.

19. **Add "Customer service AGENT" node:**  
    - Type: LangChain Agent  
    - Inputs: Aggregate3, Knowledge base, orders database, Postgres Chat Memory.  
    - Outputs: Historial Chat and feedback, Aliment context for next messages, Send message.  
    - Connect OpenAI Chat Model for AI language model input.  
    - Configure with appropriate AI model and credentials.

20. **Add "Historial Chat and feedback" node:**  
    - Type: Google Sheets  
    - Connect input from Customer service AGENT.  
    - Configure Google Sheets credentials for logging.

21. **Add "Send message" node:**  
    - Type: WhatsApp  
    - Connect input from Customer service AGENT.  
    - Configure WhatsApp API credentials.

22. **Add "Human intervention" node:**  
    - Type: LangChain Text Classifier  
    - Connect input from Aggregate.  
    - Configure OpenAI Chat Model1 for classification.

23. **Add Gmail nodes:**  
    - Owner escalation, Human request., Critical complaint.  
    - Connect from Human intervention outputs respectively.  
    - Configure OAuth2 Gmail credentials and email templates.

24. **Add "Normal path / success" node:**  
    - Type: NoOp  
    - Connect from Human intervention normal outcome.

25. **Add "Think1" node:**  
    - Type: LangChain Tool Think  
    - Connect AI tool input/output with Customer service AGENT as needed.

26. **Final connections and testing:**  
    - Ensure all nodes are connected as per above logic.  
    - Validate credential setups (OpenAI, WhatsApp, Gmail, Google Sheets, Google Docs, Supabase, Postgres).  
    - Test voice and text message flows, classification accuracy, context enrichment, AI agent response, and escalation emails.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                     | Context or Link                                           |
|--------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| Workflow uses GPT-4 and LangChain integrations extensively for AI reasoning and classification.                                                  | n8n LangChain nodes documentation                          |
| Uses WhatsApp API integration with media handling and transcription for voice messages.                                                         | WhatsApp Business API references                           |
| Smart routing via AI classification allows escalation to human agents via Gmail notifications.                                                  | Gmail OAuth2 integration                                   |
| Knowledge base is integrated via Google Docs and order info via Google Sheets for dynamic response enrichment.                                  | Google Docs and Sheets API documentation                   |
| Conversational memory maintained in Postgres and Supabase for multi-session continuity.                                                         | Postgres and Supabase API references                       |
| Sticky notes placed for operator annotations or future documentation additions (content empty in JSON).                                         | Workflow annotations                                       |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly available.

---