Analyze Call Recordings with OpenAI and Update Zoho CRM Leads Automatically

https://n8nworkflows.xyz/workflows/analyze-call-recordings-with-openai-and-update-zoho-crm-leads-automatically-10913


# Analyze Call Recordings with OpenAI and Update Zoho CRM Leads Automatically

### 1. Workflow Overview

This workflow is designed to automatically analyze sales call recordings by leveraging OpenAI's AI models and update relevant Zoho CRM lead records with insightful data. It targets sales teams and CRM users who want to streamline call analysis, extract actionable insights, and maintain up-to-date lead information without manual effort.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives uploaded call recordings via webhook.
- **1.2 Workflow Configuration:** Sets static parameters for thresholds and confidence levels.
- **1.3 Audio Transcription:** Uses OpenAI Whisper to transcribe the call audio into text.
- **1.4 Data Extraction and Analysis:** Extracts key topics, analyzes sentiment, and detects commitments from the transcript using AI language models.
- **1.5 Follow-up Suggestion Generation:** Creates actionable next steps for sales representatives based on commitments and transcript.
- **1.6 Aggregation and CRM Update:** Combines all extracted insights and updates the corresponding lead record in Zoho CRM.
- **1.7 Informational Sticky Notes:** Provide workflow context, configuration explanations, and setup instructions for users.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block receives incoming HTTP POST requests containing call recording audio files. It triggers the workflow execution.

- **Nodes Involved:**  
  - Webhook Trigger

- **Node Details:**  
  - **Webhook Trigger**  
    - Type: HTTP Webhook Trigger  
    - Configuration:  
      - Path: `call-recording-upload`  
      - Method: POST  
      - Response Mode: Last node (returns the last node's response to the caller)  
    - Input: HTTP POST data (expected to include the call recording file)  
    - Output: Passes the received data to the next node  
    - Edge Cases: Missing or invalid audio file in the request; HTTP errors; webhook URL misconfiguration  
    - Version: 2.1

#### 2.2 Workflow Configuration

- **Overview:**  
  Defines static numeric parameters used throughout the workflow for consistency and ease of updates.

- **Nodes Involved:**  
  - Workflow Configuration

- **Node Details:**  
  - **Workflow Configuration**  
    - Type: Set Node  
    - Configuration:  
      - Assigns:  
        - `sentimentThreshold` = 0.7 (Threshold for sentiment evaluation)  
        - `minCommitmentConfidence` = 0.8 (Minimum confidence threshold to consider a commitment valid)  
      - Includes other fields pass-through enabled  
    - Input: Data from Webhook Trigger  
    - Output: Passes the configured parameters along with input data  
    - Edge Cases: None expected, but missing or invalid parameter values could affect downstream logic  
    - Version: 3.4

#### 2.3 Audio Transcription

- **Overview:**  
  Converts the audio call recording into a text transcript using OpenAI’s Whisper model.

- **Nodes Involved:**  
  - Transcribe Call Recording

- **Node Details:**  
  - **Transcribe Call Recording**  
    - Type: OpenAI Audio Transcription (LangChain OpenAI node)  
    - Configuration:  
      - Resource: `audio`  
      - Operation: `transcribe`  
    - Credentials: OpenAI API Key  
    - Input: Audio data from Workflow Configuration node (which passes webhook data)  
    - Output: JSON with `text` field containing transcript  
    - Edge Cases: Audio format unsupported; transcription timeout; API quota exceeded; transcription errors  
    - Version: 2

#### 2.4 Data Extraction and Analysis

- **Overview:**  
  Extracts several layers of information from the transcript: key topics, main subject, action items, sentiment analysis, and commitments made during the call.

- **Nodes Involved:**  
  - Extract Key Topics  
  - OpenAI Model for Topics  
  - Analyze Sentiment  
  - OpenAI Model for Sentiment  
  - Extract Commitments  
  - OpenAI Model for Commitments

- **Node Details:**  

  - **Extract Key Topics**  
    - Type: Information Extractor (LangChain)  
    - Role: Extracts key topics, main subject, and action items from transcript text  
    - Configuration:  
      - Text input from transcription node’s `.text` field  
      - Attributes extracted: `topics`, `mainSubject`, `actionItems`  
    - Input: Transcription text  
    - Output: Structured JSON with extracted attributes  
    - Edge Cases: Ambiguous or noisy transcript; incomplete extraction  
    - Version: 1.2  
    - Connected AI Model: OpenAI Model for Topics

  - **OpenAI Model for Topics**  
    - Type: Language Model Chat (LangChain)  
    - Role: Supports Extract Key Topics node as AI model backend  
    - Configuration: GPT-4.1-mini model selected  
    - Credentials: OpenAI API Key  
    - Input: Text from Extract Key Topics to process  
    - Output: AI-enhanced extraction results  
    - Edge Cases: API rate limits, model response latency  
    - Version: 1.3

  - **Analyze Sentiment**  
    - Type: Information Extractor (LangChain)  
    - Role: Analyzes overall sentiment, sentiment score, customer mood, and sales rep tone from transcript  
    - Configuration:  
      - Input text from Transcribe Call Recording node `.text` field  
      - Attributes extracted: `overallSentiment`, `sentimentScore` (number from -1 to 1), `customerMood`, `salesRepTone`  
    - Input: Transcription text  
    - Output: JSON with sentiment attributes  
    - Edge Cases: Misinterpretation of tone; neutral or mixed sentiments  
    - Version: 1.2  
    - Connected AI Model: OpenAI Model for Sentiment

  - **OpenAI Model for Sentiment**  
    - Type: Language Model Chat (LangChain)  
    - Role: AI backend for Sentiment analysis node  
    - Configuration: GPT-4.1-mini model  
    - Credentials: OpenAI API Key  
    - Input: Sentiment analysis request text  
    - Output: Sentiment data  
    - Edge Cases: Model latency or API errors  
    - Version: 1.3

  - **Extract Commitments**  
    - Type: Information Extractor (LangChain)  
    - Role: Extracts commitments made during the call, including party, description, deadline, confidence  
    - Configuration:  
      - Input text from Transcribe Call Recording `.text`  
      - Schema manually defined JSON: array of commitment objects with fields: party, commitment, deadline, confidence  
    - Input: Transcription text  
    - Output: JSON array of commitments with confidence scores  
    - Edge Cases: Low confidence in commitment detection; missing deadlines  
    - Version: 1.2  
    - Connected AI Model: OpenAI Model for Commitments

  - **OpenAI Model for Commitments**  
    - Type: Language Model Chat (LangChain)  
    - Role: AI backend for commitment extraction  
    - Configuration: GPT-4.1-mini model  
    - Credentials: OpenAI API Key  
    - Input: Commitment extraction prompt  
    - Output: Parsed commitments JSON  
    - Edge Cases: Model failing to parse complex commitments; API issues  
    - Version: 1.3

#### 2.5 Follow-up Suggestion Generation

- **Overview:**  
  Generates a numbered list of 3-5 actionable follow-up suggestions for the sales representative based on the transcript and identified commitments.

- **Nodes Involved:**  
  - Generate Follow-up Suggestions

- **Node Details:**  
  - **Generate Follow-up Suggestions**  
    - Type: OpenAI Completion (LangChain)  
    - Configuration:  
      - Model: GPT-4o-mini (OpenAI GPT-4 variant optimized for outputs)  
      - Prompt:  
        - Includes full call transcript and extracted commitments  
        - Instructions to produce a numbered list of actionable follow-ups focusing on next steps, scheduling, and commitment fulfillment  
      - Output: Text content of suggestions list  
    - Credentials: OpenAI API Key  
    - Input: Transcription text and commitments JSON  
    - Output: Text list of suggestions  
    - Edge Cases: Vague or irrelevant suggestions; incomplete context handling; API throttling  
    - Version: 2

#### 2.6 Aggregation and CRM Update

- **Overview:**  
  Combines all previous analysis results into a single JSON object and updates the corresponding Lead record in Zoho CRM with custom field mappings.

- **Nodes Involved:**  
  - Combine Analysis Results  
  - Update CRM with Analysis

- **Node Details:**  

  - **Combine Analysis Results**  
    - Type: Set Node  
    - Role: Consolidates outputs from transcription, topic extraction, sentiment analysis, commitments, and follow-up suggestions into a structured data object  
    - Configuration:  
      - Assigns:  
        - `transcription` (transcript text)  
        - `keyTopics` (list)  
        - `mainSubject` (string)  
        - `sentiment` (overall sentiment)  
        - `sentimentScore` (numerical)  
        - `customerMood` (string)  
        - `followUpSuggestions` (string from generated suggestions)  
        - `analysisTimestamp` (current ISO timestamp)  
        - `commitment` (commitments JSON array)  
      - Includes other fields pass-through  
    - Input: Output from Generate Follow-up Suggestions and Extract Commitments  
    - Output: Combined structured data for CRM update  
    - Edge Cases: Missing or partial data from upstream nodes  
    - Version: 3.4

  - **Update CRM with Analysis**  
    - Type: Zoho CRM Node  
    - Role: Updates an existing Lead record in Zoho CRM with AI-generated insights  
    - Configuration:  
      - Resource: `lead`  
      - Operation: `update`  
      - LeadId: (dynamic, needs mapping from external context or webhook payload)  
      - Custom Fields Updated:  
        - `Topic` ← key topics list  
        - `Main_Subject` ← main subject string  
        - `Action_Items` ← action items extracted  
        - `Customer_Mood` ← customer mood from sentiment analysis  
        - `Sentiment_Scores` ← numerical sentiment score  
        - `Sentiment` ← overall sentiment description  
        - `FollowUp_Text` ← follow-up suggestions text  
    - Credentials: Zoho OAuth2 API  
    - Input: Combined analysis from previous node  
    - Output: Zoho API response confirming update  
    - Edge Cases: Missing or incorrect Lead ID; API authentication errors; field mapping errors; rate limits  
    - Version: 1

#### 2.7 Informational Sticky Notes

- **Overview:**  
  These nodes provide detailed documentation for human users, explaining the workflow purpose, configuration, and setup instructions.

- **Nodes Involved:**  
  - Sticky Note1 (Transcription and Data Extraction explanation)  
  - Sticky Note2 (General workflow explanation and setup steps)  
  - Sticky Note (Workflow Configuration explanation)  
  - Sticky Note3 (Combining results and updating CRM explanation)

- **Node Details:**  
  - All are n8n Sticky Note nodes, containing markdown-formatted content for user guidance.  
  - They do not affect workflow execution and have no inputs or outputs.  
  - Positioned for visibility in the editor.

---

### 3. Summary Table

| Node Name                 | Node Type                              | Functional Role                        | Input Node(s)                   | Output Node(s)                    | Sticky Note                                                                                      |
|---------------------------|--------------------------------------|-------------------------------------|--------------------------------|---------------------------------|-------------------------------------------------------------------------------------------------|
| Webhook Trigger           | Webhook Trigger                      | Receive call recording HTTP POST    | -                              | Workflow Configuration           | See Sticky Note2 for detailed workflow overview and setup steps                                |
| Workflow Configuration    | Set                                 | Define static parameters             | Webhook Trigger                | Transcribe Call Recording        | See Sticky Note for configuration explanation                                                  |
| Transcribe Call Recording | OpenAI Audio Transcription (LangChain) | Convert audio to text transcript     | Workflow Configuration         | Extract Key Topics               | See Sticky Note1 for transcription and data extraction explanation                             |
| Extract Key Topics        | Information Extractor (LangChain)   | Extract key topics, main subject, action items | Transcribe Call Recording      | Analyze Sentiment               | See Sticky Note1                                                                                 |
| OpenAI Model for Topics   | Language Model Chat (LangChain)     | AI backend for topic extraction      | Extract Key Topics (ai_languageModel) | Extract Key Topics              |                                                                                                 |
| Analyze Sentiment         | Information Extractor (LangChain)   | Analyze sentiment, customer mood     | Extract Key Topics             | Extract Commitments             | See Sticky Note1                                                                                 |
| OpenAI Model for Sentiment| Language Model Chat (LangChain)     | AI backend for sentiment analysis    | Analyze Sentiment (ai_languageModel) | Analyze Sentiment             |                                                                                                 |
| Extract Commitments       | Information Extractor (LangChain)   | Extract commitments with confidence  | Analyze Sentiment              | Generate Follow-up Suggestions  | See Sticky Note1                                                                                 |
| OpenAI Model for Commitments | Language Model Chat (LangChain)  | AI backend for commitments extraction | Extract Commitments (ai_languageModel) | Extract Commitments            |                                                                                                 |
| Generate Follow-up Suggestions | OpenAI Completion (LangChain)    | Generate actionable follow-up list   | Extract Commitments            | Combine Analysis Results        | See Sticky Note1                                                                                 |
| Combine Analysis Results  | Set                                 | Aggregate all analysis data           | Generate Follow-up Suggestions | Update CRM with Analysis        | See Sticky Note3 for combining and updating CRM explanation                                   |
| Update CRM with Analysis  | Zoho CRM                            | Update Lead record with insights     | Combine Analysis Results       | -                               | See Sticky Note2 for overall workflow context                                                  |
| Sticky Note1              | Sticky Note                        | Documentation: Transcription and extraction | -                              | -                               |                                                                                                 |
| Sticky Note2              | Sticky Note                        | Documentation: Workflow overview and setup | -                              | -                               | Covers multiple nodes including Webhook, Update CRM, general workflow explanation              |
| Sticky Note                | Sticky Note                        | Documentation: Configuration details  | -                              | -                               | Covers Workflow Configuration node                                                              |
| Sticky Note3              | Sticky Note                        | Documentation: Combining results and CRM update | -                              | -                               | Covers Combine Analysis Results and Update CRM nodes                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Trigger node:**  
   - Type: Webhook Trigger  
   - Path: `call-recording-upload`  
   - Method: POST  
   - Response Mode: Last Node  
   - Purpose: Receive call recording POST requests to start the workflow

2. **Create Set node named "Workflow Configuration":**  
   - Assign two numeric parameters:  
     - `sentimentThreshold` = 0.7  
     - `minCommitmentConfidence` = 0.8  
   - Enable passthrough of other fields

3. **Connect Webhook Trigger → Workflow Configuration**

4. **Create OpenAI Audio Transcription node named "Transcribe Call Recording":**  
   - Resource: `audio`  
   - Operation: `transcribe`  
   - Set credentials for OpenAI API (OpenAI API Key)  
   - Input: audio file from previous node

5. **Connect Workflow Configuration → Transcribe Call Recording**

6. **Create Information Extractor node named "Extract Key Topics":**  
   - Text: Use expression to get transcript text `={{ $json.text }}` from Transcribe Call Recording  
   - Extract attributes:  
     - `topics` (list of key topics)  
     - `mainSubject` (primary subject)  
     - `actionItems` (action items identified)  

7. **Create Language Model Chat node named "OpenAI Model for Topics":**  
   - Model: `gpt-4.1-mini`  
   - Credentials: OpenAI API Key  
   - Connect to Extract Key Topics AI model input

8. **Connect Transcribe Call Recording → Extract Key Topics**  
   Connect OpenAI Model for Topics → Extract Key Topics (ai_languageModel input)

9. **Create Information Extractor node named "Analyze Sentiment":**  
   - Text: Use expression to read transcript text from Transcribe Call Recording `={{ $('Transcribe Call Recording').item.json.text }}`  
   - Extract attributes:  
     - `overallSentiment` (positive/negative/neutral)  
     - `sentimentScore` (number from -1 to 1)  
     - `customerMood`  
     - `salesRepTone`

10. **Create Language Model Chat node named "OpenAI Model for Sentiment":**  
    - Model: `gpt-4.1-mini`  
    - Credentials: OpenAI API Key  
    - Connect to Analyze Sentiment AI language model input

11. **Connect Extract Key Topics → Analyze Sentiment**  
    Connect OpenAI Model for Sentiment → Analyze Sentiment (ai_languageModel input)

12. **Create Information Extractor node named "Extract Commitments":**  
    - Text: Transcript text (`={{ $('Transcribe Call Recording').item.json.text }}`)  
    - Schema: Manual JSON schema specifying array of commitments with:  
      - party (string)  
      - commitment (string)  
      - deadline (string)  
      - confidence (number, 0-1)  

13. **Create Language Model Chat node named "OpenAI Model for Commitments":**  
    - Model: `gpt-4.1-mini`  
    - Credentials: OpenAI API Key  
    - Connect to Extract Commitments AI language model input

14. **Connect Analyze Sentiment → Extract Commitments**  
    Connect OpenAI Model for Commitments → Extract Commitments (ai_languageModel input)

15. **Create OpenAI Completion node named "Generate Follow-up Suggestions":**  
    - Model: `gpt-4o-mini`  
    - Prompt:  
      - Includes transcript text and extracted commitments  
      - Instruction to output a numbered list of 3-5 actionable follow-up suggestions for the sales rep focusing on next steps and commitments  
    - Credentials: OpenAI API Key

16. **Connect Extract Commitments → Generate Follow-up Suggestions**

17. **Create Set node named "Combine Analysis Results":**  
    - Assign fields:  
      - `transcription`: transcript text from Transcribe Call Recording  
      - `keyTopics`: from Extract Key Topics  
      - `mainSubject`: from Extract Key Topics  
      - `sentiment`: overall sentiment from Analyze Sentiment  
      - `sentimentScore`: sentiment score from Analyze Sentiment  
      - `customerMood`: from Analyze Sentiment  
      - `followUpSuggestions`: from Generate Follow-up Suggestions output text  
      - `analysisTimestamp`: current datetime (use `$now.toISO()`)  
      - `commitment`: commitments from Extract Commitments  
    - Include other fields as passthrough

18. **Connect Generate Follow-up Suggestions → Combine Analysis Results**

19. **Create Zoho CRM node named "Update CRM with Analysis":**  
    - Resource: `lead`  
    - Operation: `update`  
    - LeadId: Configure dynamically depending on integration or webhook data (must map to the correct Lead ID)  
    - Custom Fields to update (map fields accordingly):  
      - `Topic` ← keyTopics  
      - `Main_Subject` ← mainSubject  
      - `Action_Items` ← actionItems from Extract Key Topics  
      - `Customer_Mood` ← customerMood  
      - `Sentiment_Scores` ← sentimentScore  
      - `Sentiment` ← sentiment  
      - `FollowUp_Text` ← followUpSuggestions  
    - Credentials: Zoho OAuth2 API credentials

20. **Connect Combine Analysis Results → Update CRM with Analysis**

21. **Add Sticky Note nodes as documentation (optional):**  
    - Add notes for workflow overview, configuration, transcription & extraction, and combining results.  
    - Position them appropriately in the editor for clarity.

22. **Test the workflow:**  
    - Upload a sample audio recording via the configured webhook URL  
    - Verify transcription, analysis, and CRM updates occur correctly  
    - Check for errors, API quota limits, and data correctness

23. **Activate the workflow for real-time processing**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                          | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow automatically processes call recordings uploaded via webhook and enriches Zoho CRM Leads with AI-generated insights including transcription, key topics, sentiment, commitments, and follow-up actions. It eliminates manual note-taking and accelerates sales intelligence. | Sticky Note2 content in workflow                                                                 |
| For setup, import the workflow JSON, add OpenAI and Zoho CRM credentials, configure telephony system to POST recordings, map Zoho custom fields, and test with sample recordings before activation.                                                                          | Sticky Note2 content in workflow                                                                 |
| Configuration parameters like `sentimentThreshold` and `minCommitmentConfidence` centralize threshold values, facilitating easy tuning and consistent behavior across nodes.                                                                                            | Sticky Note content in workflow                                                                  |
| The transcription and data extraction block leverages OpenAI Whisper and GPT-4.1-mini models via LangChain nodes for high-quality text and semantic analysis.                                                                                                       | Sticky Note1 content in workflow                                                                 |
| Combining results into a single object before updating Zoho CRM ensures atomic updates and easier maintenance.                                                                                                                                                        | Sticky Note3 content in workflow                                                                 |
| Zoho CRM custom fields must be pre-created to match field IDs used in the workflow (`Topic`, `Main_Subject`, `Action_Items`, `Customer_Mood`, `Sentiment_Scores`, `Sentiment`, `FollowUp_Text`).                                                                         | Zoho CRM documentation for custom fields                                                       |
| OpenAI API usage requires valid API keys with access to Whisper and GPT-4 models. Rate limits and quotas should be monitored to avoid workflow failures.                                                                                                            | OpenAI API documentation                                                                        |
| Webhook URL must be secured and correctly integrated with the telephony system to ensure smooth audio file uploads.                                                                                                                                                  | Telephony system integration guidelines                                                        |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.