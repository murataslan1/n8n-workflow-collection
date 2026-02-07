AI Real Estate Agent: End-to-End Ops Automation (Web, Data, Voice)

https://n8nworkflows.xyz/workflows/ai-real-estate-agent--end-to-end-ops-automation--web--data--voice--4368


# AI Real Estate Agent: End-to-End Ops Automation (Web, Data, Voice)

### 1. Workflow Overview

This workflow automates an end-to-end real estate operations process using AI and voice integration. It is designed to receive incoming leads via webhooks, classify and extract relevant information, enrich and validate property data, score leads for urgency and interest, and then generate voice calls to engage leads. The workflow also logs structured lead data and summaries into Google Sheets for tracking and further analysis.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Validation:** Handles incoming lead webhooks and validates the presence of user messages.
- **1.2 Message Cleaning & Intent Classification:** Cleans user text and uses AI to classify intent and urgency.
- **1.3 Data Extraction & Standardization:** Extracts lead details and standardizes fields for consistent processing.
- **1.4 Property Validation & Lead Scoring:** Checks property listings via API, determines if the listing is known, and calculates a lead score.
- **1.5 Lead Object Creation & AI Processing:** Structures the lead data and further processes it through AI agents and tools to enrich information.
- **1.6 Voice Generation & Call Placement:** Generates an introductory voice message and places a call to the lead using ElevenLabs and Twilio APIs.
- **1.7 Lead Data Storage & Summary:** Normalizes lead data, decides interest state, assigns scores, formats timestamps, and logs leads and summaries into Google Sheets.
- **1.8 Auxiliary Triggers and Manual Testing:** Includes schedule triggers and manual triggers for testing and batch processing.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Validation

- **Overview:** This block receives incoming lead data via a webhook, renames input fields for internal consistency, and validates that the lead message exists before proceeding.
- **Nodes Involved:** IncomingLeadWebhook, RenameInputFields, ValidateMessageExists
- **Node Details:**

  - **IncomingLeadWebhook**
    - Type: Webhook
    - Role: Entry point for receiving lead data from external sources (e.g., web forms).
    - Configuration: Uses a unique webhook ID to expose an endpoint.
    - Inputs: None (trigger node)
    - Outputs: Connects to RenameInputFields
    - Potential Failures: Network issues, webhook misconfiguration, invalid payloads.
  
  - **RenameInputFields**
    - Type: Set Node
    - Role: Renames or maps incoming fields to standardized internal field names.
    - Configuration: Custom mapping of incoming JSON keys to desired names.
    - Inputs: IncomingLeadWebhook
    - Outputs: Connects to ValidateMessageExists
    - Potential Failures: Missing expected fields causing errors downstream.

  - **ValidateMessageExists**
    - Type: If Node (conditional)
    - Role: Checks if the lead message content is present to continue processing.
    - Configuration: Conditional expression verifying non-empty message field.
    - Inputs: RenameInputFields
    - Outputs: True branch proceeds to CleanUserText; False branch stops flow.
    - Potential Failures: False negatives if message field is malformed or empty.

#### 1.2 Message Cleaning & Intent Classification

- **Overview:** Cleans the raw text input from the user to remove noise, then uses an AI model to classify the intent and urgency of the message.
- **Nodes Involved:** CleanUserText, OpenAI Chat Model, ClassifyIntentUrgency, ExtractClassification
- **Node Details:**

  - **CleanUserText**
    - Type: Code Node (JavaScript)
    - Role: Sanitizes and normalizes input text to improve AI model accuracy.
    - Configuration: Custom script cleaning whitespace, special characters, or unwanted tokens.
    - Inputs: ValidateMessageExists (true branch)
    - Outputs: ClassifyIntentUrgency
    - Potential Failures: Script errors, empty outputs if input is malformed.

  - **OpenAI Chat Model**
    - Type: AI Language Model (OpenAI chat)
    - Role: Provides language model capabilities for classification.
    - Configuration: Uses OpenAI API credentials and tailored prompt for classification.
    - Inputs: CleanUserText
    - Outputs: ClassifyIntentUrgency (as ai_languageModel input)
    - Potential Failures: API rate limits, auth errors, network timeouts.

  - **ClassifyIntentUrgency**
    - Type: LangChain Agent Node
    - Role: Classifies the intent and urgency using AI agent framework.
    - Configuration: Custom agent configuration with relevant prompts and models.
    - Inputs: OpenAI Chat Model (ai_languageModel), CleanUserText (main)
    - Outputs: ExtractClassification
    - Potential Failures: Model misclassification, timeout, unexpected output format.

  - **ExtractClassification**
    - Type: Set Node
    - Role: Extracts classification results from AI output and sets structured fields.
    - Configuration: Maps AI response fields to workflow variables.
    - Inputs: ClassifyIntentUrgency
    - Outputs: StandardizeFields
    - Potential Failures: Missing expected keys in AI response.

#### 1.3 Data Extraction & Standardization

- **Overview:** Standardizes extracted fields and prepares data for property validation.
- **Nodes Involved:** StandardizeFields, PropertyCheckAPI, IsKnownListing
- **Node Details:**

  - **StandardizeFields**
    - Type: Code Node
    - Role: Converts extracted data into a consistent format (e.g., date, address normalization).
    - Configuration: Custom JavaScript for field normalization.
    - Inputs: ExtractClassification
    - Outputs: PropertyCheckAPI
    - Potential Failures: Script errors, unexpected data types.

  - **PropertyCheckAPI**
    - Type: HTTP Request
    - Role: Queries external property API to validate or enrich listing data.
    - Configuration: HTTP GET/POST with API key, uses standardized property address or ID.
    - Inputs: StandardizeFields
    - Outputs: IsKnownListing
    - Potential Failures: API endpoint unavailability, invalid credentials, rate limits.

  - **IsKnownListing**
    - Type: If Node
    - Role: Determines if the property listing is recognized/valid based on API response.
    - Configuration: Conditional check on API response status or flags.
    - Inputs: PropertyCheckAPI
    - Outputs: True branch to CalculateLeadScore; False branch may stop or redirect.
    - Potential Failures: Incorrect API data, logic errors.

#### 1.4 Property Validation & Lead Scoring

- **Overview:** Calculates a lead score based on property validity and lead information.
- **Nodes Involved:** CalculateLeadScore, CreateStructuredLeadObject
- **Node Details:**

  - **CalculateLeadScore**
    - Type: Code Node
    - Role: Implements custom scoring algorithm considering urgency, property status, and other factors.
    - Configuration: JavaScript code encoding scoring logic.
    - Inputs: IsKnownListing (true)
    - Outputs: CreateStructuredLeadObject
    - Potential Failures: Logic errors, division by zero, missing variables.

  - **CreateStructuredLeadObject**
    - Type: Set Node
    - Role: Constructs a structured JSON object representing the lead with all relevant details.
    - Configuration: Sets fields such as contact info, score, property details.
    - Inputs: CalculateLeadScore
    - Outputs: (Not directly connected downstream in JSON snippet — likely feeding AI Agent)
    - Potential Failures: Missing fields, serialization errors.

#### 1.5 Lead Object Creation & AI Processing

- **Overview:** Uses AI agents and tools to enrich lead information, extract additional insights, and prepare documents.
- **Nodes Involved:** AI Agent, OpenAI Chat Model1, Calculator, SerpAPI, Google Docs, Split Out, Real Estate Data, HTTP Request, Information Extractor
- **Node Details:**

  - **AI Agent**
    - Type: LangChain Agent
    - Role: Central AI processing node orchestrating multiple tools.
    - Configuration: Receives lead data, invokes tools like Calculator, SerpAPI.
    - Inputs: Information Extractor, OpenAI Chat Model1, Calculator, SerpAPI
    - Outputs: Google Docs, Split Out, OpenAI, OpenAI1
    - Potential Failures: API throttling, tool integration errors.

  - **OpenAI Chat Model1**
    - Type: AI Language Model (OpenAI chat)
    - Role: Provides conversational AI for the agent.
    - Configuration: OpenAI API with relevant prompts.
    - Inputs: AI Agent (ai_languageModel)
    - Outputs: AI Agent
    - Potential Failures: Rate limits, network errors.

  - **Calculator**
    - Type: LangChain Tool Calculator
    - Role: Performs calculations as requested by AI agent.
    - Inputs/Outputs: Connected to AI Agent as ai_tool
    - Potential Failures: Calculation errors, invalid input.

  - **SerpAPI**
    - Type: LangChain Tool SerpAPI
    - Role: Performs web search queries to enrich data.
    - Inputs/Outputs: Connected to AI Agent as ai_tool
    - Potential Failures: API limits, invalid queries.

  - **Google Docs**
    - Type: Google Docs Node
    - Role: Creates or updates documents with processed data.
    - Inputs: AI Agent
    - Outputs: None (end node)
    - Potential Failures: Credential expiration, API errors.

  - **Split Out**
    - Type: Split Out Node
    - Role: Splits array data into individual items, here likely for Google Sheets.
    - Inputs: AI Agent
    - Outputs: Real Estate Data
    - Potential Failures: Empty arrays, malformed data.

  - **Real Estate Data**
    - Type: Google Sheets Node
    - Role: Stores enriched real estate lead data in a spreadsheet.
    - Inputs: Split Out
    - Outputs: None
    - Potential Failures: Sheet permissions, quota limits.

  - **HTTP Request**
    - Type: HTTP Request
    - Role: Fetches external data or APIs during scheduled batch runs.
    - Inputs: Schedule Trigger, Manual Trigger
    - Outputs: Information Extractor
    - Potential Failures: Network errors, API failures.

  - **Information Extractor**
    - Type: LangChain Information Extractor
    - Role: Extracts structured data from unstructured input.
    - Inputs: HTTP Request, OpenAI Chat Model2
    - Outputs: AI Agent
    - Potential Failures: Extraction inaccuracies.

#### 1.6 Voice Generation & Call Placement

- **Overview:** Generates an introductory voice message from text and places an automated call to the lead.
- **Nodes Involved:** Set Lead Variables, Generate Intro Message, ElevenLabs - Generate Voice, Twilio - Place Call
- **Node Details:**

  - **Set Lead Variables**
    - Type: Set Node
    - Role: Initializes variables and prepares lead data for voice interaction.
    - Inputs: Webhook - New Lead1
    - Outputs: Generate Intro Message
    - Potential Failures: Missing variable initialization.

  - **Generate Intro Message**
    - Type: Function Node (JavaScript)
    - Role: Creates a personalized introductory text message for voice synthesis.
    - Inputs: Set Lead Variables
    - Outputs: ElevenLabs - Generate Voice
    - Potential Failures: Script errors.

  - **ElevenLabs - Generate Voice**
    - Type: HTTP Request
    - Role: Calls ElevenLabs API to convert text message into audio.
    - Inputs: Generate Intro Message
    - Outputs: Twilio - Place Call
    - Potential Failures: API key issues, audio generation errors.

  - **Twilio - Place Call**
    - Type: HTTP Request
    - Role: Uses Twilio API to place a phone call and play generated audio.
    - Inputs: ElevenLabs - Generate Voice
    - Outputs: AI Agent - Extract Lead Info
    - Potential Failures: Twilio credential errors, call failures.

#### 1.7 Lead Data Storage & Summary

- **Overview:** Extracts details from calls, stores extracted info, normalizes data, checks lead interest, assigns scores, logs the leads and summaries in Google Sheets.
- **Nodes Involved:** AI Agent - Extract Lead Info, Store Extracted Values, Normalize User Data, IF Lead Interested, Assign Lead Score, Format Timestamp, Google Sheets - Log Lead, AI Agent - Lead Summary, Google Sheets - Log Summary
- **Node Details:**

  - **AI Agent - Extract Lead Info**
    - Type: LangChain Agent
    - Role: Extracts lead details from voice call interactions.
    - Inputs: Twilio - Place Call, OpenAI Chat Model4
    - Outputs: Store Extracted Values
    - Potential Failures: Extraction errors.

  - **Store Extracted Values**
    - Type: Function Node
    - Role: Saves extracted lead information into workflow variables.
    - Inputs: AI Agent - Extract Lead Info
    - Outputs: Normalize User Data
    - Potential Failures: Data loss or corruption.

  - **Normalize User Data**
    - Type: Set Node
    - Role: Normalizes and formats user data for further processing.
    - Inputs: Store Extracted Values
    - Outputs: IF Lead Interested
    - Potential Failures: Incorrect data normalization.

  - **IF Lead Interested**
    - Type: If Node
    - Role: Determines if the lead shows interest based on extracted data.
    - Inputs: Normalize User Data
    - Outputs: True branch to Assign Lead Score
    - Potential Failures: Misclassification.

  - **Assign Lead Score**
    - Type: Function Node
    - Role: Calculates or adjusts lead scores.
    - Inputs: IF Lead Interested (true)
    - Outputs: Format Timestamp
    - Potential Failures: Logic errors.

  - **Format Timestamp**
    - Type: DateTime Node
    - Role: Formats timestamps for logging consistency.
    - Inputs: Assign Lead Score
    - Outputs: Google Sheets - Log Lead
    - Potential Failures: Invalid date formats.

  - **Google Sheets - Log Lead**
    - Type: Google Sheets Node
    - Role: Logs lead data into a Google Sheet.
    - Inputs: Format Timestamp
    - Outputs: AI Agent - Lead Summary
    - Potential Failures: API quota, permission issues.

  - **AI Agent - Lead Summary**
    - Type: LangChain Agent
    - Role: Generates a summary of the lead for reporting.
    - Inputs: Google Sheets - Log Lead, OpenAI Chat Model3
    - Outputs: Google Sheets - Log Summary
    - Potential Failures: AI misinterpretation.

  - **Google Sheets - Log Summary**
    - Type: Google Sheets Node
    - Role: Logs the summary data into a separate Google Sheet.
    - Inputs: AI Agent - Lead Summary
    - Outputs: None
    - Potential Failures: Same as above.

#### 1.8 Auxiliary Triggers and Manual Testing

- **Overview:** Provides scheduled and manual triggers for batch processing or testing.
- **Nodes Involved:** Schedule Trigger, When clicking ‘Test workflow’, HTTP Request
- **Node Details:**

  - **Schedule Trigger**
    - Type: Schedule Trigger
    - Role: Runs periodic batch HTTP requests for data processing.
    - Outputs: HTTP Request
    - Potential Failures: Scheduling conflicts.

  - **When clicking ‘Test workflow’**
    - Type: Manual Trigger
    - Role: Allows manual initiation of the workflow for testing.
    - Outputs: HTTP Request
    - Potential Failures: Manual errors.

  - **HTTP Request**
    - Type: HTTP Request
    - Role: Fetches data or triggers external systems for batch runs.
    - Inputs: Schedule Trigger, When clicking ‘Test workflow’
    - Outputs: Information Extractor
    - Potential Failures: Network or API errors.

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                             | Input Node(s)               | Output Node(s)                  | Sticky Note                                   |
|----------------------------|----------------------------------|---------------------------------------------|-----------------------------|--------------------------------|-----------------------------------------------|
| IncomingLeadWebhook         | Webhook                          | Receives incoming lead data                  | None                        | RenameInputFields              |                                               |
| RenameInputFields           | Set                              | Renames input fields for consistency         | IncomingLeadWebhook          | ValidateMessageExists          |                                               |
| ValidateMessageExists       | If                               | Validates presence of message                 | RenameInputFields            | CleanUserText (true branch)    |                                               |
| CleanUserText               | Code                             | Cleans user text input                        | ValidateMessageExists        | ClassifyIntentUrgency          |                                               |
| OpenAI Chat Model           | LangChain lmChatOpenAi           | Provides AI language model for classification| CleanUserText                | ClassifyIntentUrgency (ai_languageModel)|                                       |
| ClassifyIntentUrgency       | LangChain Agent                  | Classifies intent and urgency                 | OpenAI Chat Model, CleanUserText | ExtractClassification      |                                               |
| ExtractClassification       | Set                              | Extracts classification results               | ClassifyIntentUrgency        | StandardizeFields              |                                               |
| StandardizeFields           | Code                             | Standardizes extracted fields                  | ExtractClassification        | PropertyCheckAPI               |                                               |
| PropertyCheckAPI            | HTTP Request                    | Validates property listing via external API   | StandardizeFields            | IsKnownListing                |                                               |
| IsKnownListing              | If                               | Checks if listing is known                      | PropertyCheckAPI             | CalculateLeadScore             |                                               |
| CalculateLeadScore          | Code                             | Calculates lead score                           | IsKnownListing               | CreateStructuredLeadObject     |                                               |
| CreateStructuredLeadObject  | Set                              | Creates structured lead object                  | CalculateLeadScore           | (Feeds AI Agent indirectly)   |                                               |
| AI Agent                   | LangChain Agent                  | Enriches lead data and orchestrates tools     | Information Extractor, OpenAI Chat Model1, Calculator, SerpAPI | Google Docs, Split Out, OpenAI, OpenAI1 |                                               |
| OpenAI Chat Model1          | LangChain lmChatOpenAi           | AI chat model for AI Agent                      | AI Agent                    | AI Agent                      |                                               |
| Calculator                 | LangChain Tool Calculator         | Performs calculations                           | AI Agent                    | AI Agent                      |                                               |
| SerpAPI                   | LangChain Tool SerpApi            | Performs web searches                           | AI Agent                    | AI Agent                      |                                               |
| Google Docs               | Google Docs                      | Creates/updates Google Docs                      | AI Agent                    | None                         |                                               |
| Split Out                  | Split Out                       | Splits array data for processing                | AI Agent                    | Real Estate Data              |                                               |
| Real Estate Data           | Google Sheets                   | Stores lead data                                | Split Out                   | None                         |                                               |
| HTTP Request               | HTTP Request                    | Fetches data for batch processing                | Schedule Trigger, Manual Trigger | Information Extractor      |                                               |
| Information Extractor      | LangChain Information Extractor | Extracts structured data from responses         | HTTP Request, OpenAI Chat Model2 | AI Agent                 |                                               |
| OpenAI Chat Model2         | LangChain lmChatOpenAi           | AI model for Information Extractor              | Information Extractor       | Information Extractor          |                                               |
| Set Lead Variables         | Set                              | Initializes variables for voice interaction     | Webhook - New Lead1         | Generate Intro Message         |                                               |
| Generate Intro Message     | Function                         | Generates text for voice synthesis               | Set Lead Variables          | ElevenLabs - Generate Voice    |                                               |
| ElevenLabs - Generate Voice| HTTP Request                    | Generates voice audio from text                   | Generate Intro Message      | Twilio - Place Call            |                                               |
| Twilio - Place Call        | HTTP Request                    | Places call to lead with generated audio          | ElevenLabs - Generate Voice | AI Agent - Extract Lead Info   |                                               |
| AI Agent - Extract Lead Info| LangChain Agent                 | Extracts lead info from call interaction          | Twilio - Place Call, OpenAI Chat Model4 | Store Extracted Values  |                                               |
| Store Extracted Values     | Function                         | Stores extracted lead info                         | AI Agent - Extract Lead Info| Normalize User Data            |                                               |
| Normalize User Data        | Set                              | Normalizes user data                               | Store Extracted Values      | IF Lead Interested             |                                               |
| IF Lead Interested         | If                               | Checks if lead is interested                        | Normalize User Data         | Assign Lead Score (true branch)|                                               |
| Assign Lead Score          | Function                         | Assigns or adjusts lead scores                      | IF Lead Interested          | Format Timestamp              |                                               |
| Format Timestamp           | DateTime                        | Formats timestamps for logging                      | Assign Lead Score           | Google Sheets - Log Lead       |                                               |
| Google Sheets - Log Lead   | Google Sheets                   | Logs lead data                                     | Format Timestamp            | AI Agent - Lead Summary        |                                               |
| AI Agent - Lead Summary    | LangChain Agent                  | Generates lead summary                              | Google Sheets - Log Lead, OpenAI Chat Model3 | Google Sheets - Log Summary |                                               |
| Google Sheets - Log Summary| Google Sheets                   | Logs summary data                                  | AI Agent - Lead Summary     | None                         |                                               |
| Webhook - New Lead1        | Webhook                          | Alternative entry point for new leads               | None                        | Set Lead Variables            |                                               |
| Schedule Trigger           | Schedule Trigger                | Triggers batch processing periodically              | None                        | HTTP Request                  |                                               |
| When clicking ‘Test workflow’| Manual Trigger                | Manual trigger for testing workflow                  | None                        | HTTP Request                  |                                               |
| OpenAI Chat Model3         | LangChain lmChatOpenAi           | AI model for lead summary                            | AI Agent - Lead Summary     | AI Agent - Lead Summary        |                                               |
| OpenAI Chat Model4         | LangChain lmChatOpenAi           | AI model for extracting lead info                    | AI Agent - Extract Lead Info| AI Agent - Extract Lead Info   |                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create IncomingLeadWebhook (Webhook Node)**
   - Configure webhook with unique ID.
   - No credentials needed.
   - Set to listen for incoming lead data.

2. **Add RenameInputFields (Set Node)**
   - Map incoming fields (e.g., `message` to `userMessage`) to standardized names.
   - Connect IncomingLeadWebhook output to this node.

3. **Add ValidateMessageExists (If Node)**
   - Set condition to check if `userMessage` is not empty.
   - Connect RenameInputFields output.
   - On True, connect to next block; on False, stop flow.

4. **Add CleanUserText (Code Node)**
   - Write JavaScript to sanitize `userMessage` (trim spaces, remove special chars).
   - Connect True output of ValidateMessageExists.

5. **Add OpenAI Chat Model (LangChain lmChatOpenAi Node)**
   - Configure OpenAI credentials (API key).
   - Set model (e.g., GPT-4 or GPT-3.5).
   - Set prompt to classify intent and urgency.
   - Connect CleanUserText output as main, configure as ai_languageModel for downstream.

6. **Add ClassifyIntentUrgency (LangChain Agent)**
   - Configure with prompt and tools if needed.
   - Connect OpenAI Chat Model (ai_languageModel) and CleanUserText (main).
   - Output to ExtractClassification.

7. **Add ExtractClassification (Set Node)**
   - Map AI output fields (e.g., intent, urgency) to workflow variables.
   - Connect ClassifyIntentUrgency output.

8. **Add StandardizeFields (Code Node)**
   - Normalize extracted fields (e.g., format date, standardize address).
   - Connect ExtractClassification output.

9. **Add PropertyCheckAPI (HTTP Request Node)**
   - Configure HTTP request to property validation API.
   - Use standardized address or property ID in request.
   - Connect StandardizeFields output.

10. **Add IsKnownListing (If Node)**
    - Condition: Check API response to confirm listing validity.
    - Connect PropertyCheckAPI output.
    - True branch connects to CalculateLeadScore.

11. **Add CalculateLeadScore (Code Node)**
    - Implement scoring algorithm based on urgency, listing status.
    - Connect IsKnownListing True output.

12. **Add CreateStructuredLeadObject (Set Node)**
    - Create structured JSON with lead info and score.
    - Connect CalculateLeadScore output.

13. **Add AI Agent (LangChain Agent)**
    - Configure with tools: Calculator, SerpAPI, OpenAI Chat Models.
    - Connect CreateStructuredLeadObject output.
    - Set up tool nodes Calculator, SerpAPI, OpenAI Chat Models, and connect as ai_tools or ai_languageModel inputs.
    - Connect outputs to Google Docs, Split Out, OpenAI, OpenAI1.

14. **Add Google Docs (Google Docs Node)**
    - Configure Google OAuth2 credentials.
    - Connect AI Agent output.

15. **Add Split Out (Split Out Node)**
    - Connect AI Agent output.
    - Output connects to Real Estate Data.

16. **Add Real Estate Data (Google Sheets Node)**
    - Configure Google Sheets credentials.
    - Specify spreadsheet and worksheet.
    - Connect Split Out output.

17. **Add Schedule Trigger (Schedule Trigger Node)**
    - Configure interval (e.g., hourly/day).
    - Connect output to HTTP Request.

18. **Add When clicking ‘Test workflow’ (Manual Trigger Node)**
    - For manual testing.
    - Connect output to HTTP Request.

19. **Add HTTP Request (HTTP Request Node)**
    - Configure to fetch batch data or external API.
    - Connect Schedule Trigger and Manual Trigger outputs.

20. **Add Information Extractor (LangChain Information Extractor Node)**
    - Configure extraction patterns or prompts.
    - Connect HTTP Request output.
    - Connect OpenAI Chat Model2 as ai_languageModel input.

21. **Add OpenAI Chat Model2 (LangChain lmChatOpenAi Node)**
    - Configure credentials.
    - Connect to Information Extractor.

22. **Add Webhook - New Lead1 (Webhook Node)**
    - Secondary webhook for new leads.
    - Connect output to Set Lead Variables.

23. **Add Set Lead Variables (Set Node)**
    - Initialize variables for voice interaction.
    - Connect Webhook - New Lead1 output.

24. **Add Generate Intro Message (Function Node)**
    - Write JS function to generate personalized intro text.
    - Connect Set Lead Variables output.

25. **Add ElevenLabs - Generate Voice (HTTP Request)**
    - Configure API call to ElevenLabs for text-to-speech.
    - Connect Generate Intro Message output.

26. **Add Twilio - Place Call (HTTP Request)**
    - Configure Twilio API credentials and call parameters.
    - Connect ElevenLabs - Generate Voice output.

27. **Add AI Agent - Extract Lead Info (LangChain Agent)**
    - Configure agent to extract info from call interaction.
    - Connect Twilio - Place Call output and OpenAI Chat Model4 as ai_languageModel input.

28. **Add OpenAI Chat Model4 (LangChain lmChatOpenAi Node)**
    - Configure credentials.
    - Connect to AI Agent - Extract Lead Info.

29. **Add Store Extracted Values (Function Node)**
    - Store extracted lead info into workflow variables.
    - Connect AI Agent - Extract Lead Info output.

30. **Add Normalize User Data (Set Node)**
    - Normalize and format lead data.
    - Connect Store Extracted Values output.

31. **Add IF Lead Interested (If Node)**
    - Condition to check if lead is interested.
    - Connect Normalize User Data output.
    - True branch to Assign Lead Score.

32. **Add Assign Lead Score (Function Node)**
    - Adjust or assign lead score based on interest.
    - Connect IF Lead Interested true output.

33. **Add Format Timestamp (DateTime Node)**
    - Format date/time for logging.
    - Connect Assign Lead Score output.

34. **Add Google Sheets - Log Lead (Google Sheets Node)**
    - Configure to log lead info.
    - Connect Format Timestamp output.

35. **Add AI Agent - Lead Summary (LangChain Agent)**
    - Summarize lead info.
    - Connect Google Sheets - Log Lead output and OpenAI Chat Model3 input.

36. **Add OpenAI Chat Model3 (LangChain lmChatOpenAi Node)**
    - Configure credentials.
    - Connect AI Agent - Lead Summary.

37. **Add Google Sheets - Log Summary (Google Sheets Node)**
    - Log summary data.
    - Connect AI Agent - Lead Summary output.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow leverages advanced LangChain AI agents and tools integrated with OpenAI models. | n8n LangChain node documentation: https://docs.n8n.io/nodes/n8n-nodes-langchain/               |
| Voice generation is done via ElevenLabs API, and calls are placed through Twilio API.        | ElevenLabs API: https://elevenlabs.io/docs; Twilio API: https://www.twilio.com/docs/api         |
| Google Sheets and Google Docs integrations require OAuth2 credentials and proper API scopes.  | Google API docs: https://developers.google.com/apis-explorer                                  |
| The workflow uses multiple conditional (If) nodes to ensure robust processing and error handling. | Best practice: Add error workflows or fallback nodes for API failures and empty inputs.         |
| Manual and scheduled triggers enable flexible testing and batch processing capabilities.     |                                                                                                 |

---

**Disclaimer:**  
The provided text is derived solely from an automated workflow constructed with n8n, an integration and automation tool. This process strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly permissible.