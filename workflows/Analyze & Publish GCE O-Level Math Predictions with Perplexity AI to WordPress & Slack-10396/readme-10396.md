Analyze & Publish GCE O-Level Math Predictions with Perplexity AI to WordPress & Slack

https://n8nworkflows.xyz/workflows/analyze---publish-gce-o-level-math-predictions-with-perplexity-ai-to-wordpress---slack-10396


# Analyze & Publish GCE O-Level Math Predictions with Perplexity AI to WordPress & Slack

### 1. Workflow Overview

This workflow automates the analysis and prediction of GCE O-Level Mathematics exam topics for the year 2025, leveraging AI to process syllabus content and historical exam context. It is designed for educators and students preparing for Singapore’s O-Level Mathematics exams by delivering data-driven insights and predictions published directly to WordPress and Slack.

The workflow logically divides into the following functional blocks:

- **1.1 Input Reception and Data Acquisition**: Manual start trigger, downloading the official 2025 O-Level Math syllabus PDF from SEAB, and extracting its textual content.
- **1.2 Historical Context Loading**: Injecting predefined historical topics and challenging areas to enrich AI analysis.
- **1.3 AI Processing and Reasoning**: Feeding syllabus data and historical context into an AI agent (OpenRouter Chat Model with a specialized prompt) to produce structured exam insights and predictions.
- **1.4 Post-Processing and Report Generation**: Parsing AI JSON output, formatting it into Markdown, then converting to HTML.
- **1.5 Publication and Notification**: Publishing the HTML report to WordPress and sending a summarized notification message to a Slack channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Data Acquisition

- **Overview:**  
  Initiates the workflow manually, fetches the official 2025 O-Level Mathematics syllabus PDF from SEAB’s website, and extracts the syllabus text content for AI analysis.

- **Nodes Involved:**  
  - Manual Trigger  
  - Fetch O-Level Math Syllabus (HTTP Request)  
  - Extract Syllabus Text (Extract from File)  
  - Prepare Analysis Data (Set)

- **Node Details:**

  - **Manual Trigger**  
    - Type: Manual start node  
    - Role: Allows user to manually initiate the workflow  
    - Configuration: Default, no parameters needed  
    - Connections: Outputs to both Fetch O-Level Math Syllabus and Load Historical Context nodes  
    - Potential Issues: None (manual activation)

  - **Fetch O-Level Math Syllabus**  
    - Type: HTTP Request  
    - Role: Retrieves the PDF syllabus from the official SEAB URL  
    - Configuration: GET request to `"https://www.seab.gov.sg/docs/default-source/national-examinations/syllabus/olevel/2025syllabus/4048_y25_sy.pdf"`  
    - Input: Trigger output  
    - Output: Binary PDF file content  
    - Edge cases: Network failure, URL changes, HTTP errors (404, 500), timeout, SSL issues

  - **Extract Syllabus Text**  
    - Type: Extract from File  
    - Role: Extracts text from the fetched PDF binary data  
    - Configuration: Operation set to `text` extraction  
    - Input: PDF binary from HTTP node  
    - Output: Syllabus text as string in JSON data field  
    - Edge cases: PDF parsing failure, corrupted PDF, extraction errors

  - **Prepare Analysis Data**  
    - Type: Set  
    - Role: Assigns extracted syllabus text and analysis year to variables for downstream AI processing  
    - Configuration:  
      - `syllabus_content` set to extracted text (`{{$json.data}}`)  
      - `analysis_year` set to `2025`  
    - Input: Extracted syllabus text JSON  
    - Output: JSON with `syllabus_content` and `analysis_year` fields  
    - Edge cases: Empty or malformed text input

#### 2.2 Historical Context Loading

- **Overview:**  
  Loads static historical exam topics and challenging areas as strings to provide AI context on recurring exam themes and known difficult topics.

- **Nodes Involved:**  
  - Load Historical Context (Set)

- **Node Details:**

  - **Load Historical Context**  
    - Type: Set  
    - Role: Provides predefined knowledge of past exam topics and challenging areas for AI reasoning  
    - Configuration:  
      - `historical_topics` string listing common recurring topics like Algebra, Geometry, Trigonometry, etc.  
      - `challenging_areas` string listing difficult topics such as Circle Theorems, Trigonometric proofs, Probability, etc.  
    - Input: Manual Trigger output  
    - Output: JSON with these two string fields  
    - Edge cases: None (static data)

#### 2.3 AI Processing and Reasoning

- **Overview:**  
  Combines syllabus content and historical context, sends to the AI agent using OpenRouter’s Perplexity Sonar Reasoning model for detailed exam analysis and question prediction in a structured JSON format.

- **Nodes Involved:**  
  - AI Analysis Agent (LangChain AI Agent)  
  - OpenRouter Chat Model (LangChain LM Chat)

- **Node Details:**

  - **AI Analysis Agent**  
    - Type: LangChain agent node (specialized AI prompt processor)  
    - Role: Sends a detailed prompt including syllabus text and historical context to the AI model, requesting structured exam analysis and predictions as JSON  
    - Configuration:  
      - Complex prompt embedding syllabus content, historical topics, and challenging areas  
      - Specifies required JSON output structure with fields like exam_summary, top recurring topics, challenging areas, topic weightage, predicted questions  
      - System message enforces expert educational analyst persona specialized in Singapore GCE O-Level Mathematics  
    - Inputs:  
      - `syllabus_content` and `analysis_year` from Prepare Analysis Data  
      - `historical_topics` and `challenging_areas` from Load Historical Context  
    - Outputs: AI-generated JSON analysis string  
    - Edge cases: AI response errors, rate limits, malformed JSON output, prompt failures, API connectivity issues  
    - Sub-Workflow: Uses OpenRouter Chat Model as underlying language model

  - **OpenRouter Chat Model**  
    - Type: LangChain LM Chat node  
    - Role: Connects to OpenRouter API using Perplexity Sonar Reasoning model to fulfill AI prompt requests from AI Analysis Agent  
    - Configuration:  
      - Model: `perplexity/sonar-reasoning`  
      - Credentials: OpenRouter API key configured  
    - Input: AI prompt from AI Analysis Agent  
    - Output: AI textual response (JSON)  
    - Edge cases: API key invalid, quota exceeded, network timeout, model unavailability

#### 2.4 Post-Processing and Report Generation

- **Overview:**  
  Parses AI JSON output, formats insights into Markdown, then converts Markdown to HTML for web publishing.

- **Nodes Involved:**  
  - Parse AI Output (Set)  
  - Format Report (Markdown)  
  - Convert to HTML (HTML node)

- **Node Details:**

  - **Parse AI Output**  
    - Type: Set  
    - Role: Parses and normalizes AI JSON output for formatting  
    - Configuration: Default (no explicit parsing shown, assumed to just pass JSON data)  
    - Input: AI Analysis Agent JSON output  
    - Output: Structured JSON ready for formatting  
    - Edge cases: Malformed or invalid JSON from AI

  - **Format Report**  
    - Type: Markdown  
    - Role: Converts AI JSON insights into human-readable Markdown report with topics, trends, predictions  
    - Configuration: Default (assumed to use expressions referencing parsed JSON)  
    - Input: Parsed AI output JSON  
    - Output: Markdown text  
    - Edge cases: Missing data fields, formatting errors

  - **Convert to HTML**  
    - Type: HTML  
    - Role: Converts Markdown report into HTML for WordPress publishing  
    - Configuration: Default, no parameters required  
    - Input: Markdown text from Format Report  
    - Output: HTML content  
    - Edge cases: Conversion errors, invalid Markdown syntax

#### 2.5 Publication and Notification

- **Overview:**  
  Publishes the formatted report to WordPress as a new post and sends a summary notification to Slack with highlights and direct links.

- **Nodes Involved:**  
  - Publish to WordPress (WordPress node)  
  - Send Slack Summary (Slack node)

- **Node Details:**

  - **Publish to WordPress**  
    - Type: WordPress  
    - Role: Creates a new WordPress post with AI-generated exam analysis report  
    - Configuration:  
      - Post title: `"GCE O-Level Math Predictions 2025"` (dynamic with analysis year)  
      - Content: HTML from Convert to HTML node  
      - Credentials: WordPress API credentials configured  
    - Input: HTML report  
    - Output: WordPress post response with link info  
    - Edge cases: Auth failures, API errors, content size limits, network issues

  - **Send Slack Summary**  
    - Type: Slack  
    - Role: Sends a formatted Slack message summarizing key analysis points and predicted topics with confidence scores  
    - Configuration:  
      - Slack webhook URL configured  
      - Message built dynamically from parsed AI output (top topics, confidence scores, report link)  
    - Input: WordPress publication confirmation (for link) and parsed AI output  
    - Output: Slack message posted to specified channel  
    - Edge cases: Webhook invalid, rate limits, message formatting errors

---

### 3. Summary Table

| Node Name                    | Node Type                      | Functional Role                                | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                                                                                        |
|------------------------------|--------------------------------|-----------------------------------------------|-------------------------------|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Manual Trigger               | Manual Trigger                 | Workflow start trigger                         | —                             | Fetch O-Level Math Syllabus, Load Historical Context | ## **Introduction** Exams create stress... (full sticky note content covers nodes up to AI processing)                        |
| Fetch O-Level Math Syllabus  | HTTP Request                  | Fetch official 2025 syllabus PDF               | Manual Trigger                | Extract Syllabus Text          | Same as above                                                                                                                    |
| Extract Syllabus Text        | Extract from File              | Extract text from syllabus PDF                 | Fetch O-Level Math Syllabus   | Prepare Analysis Data          | Same as above                                                                                                                    |
| Prepare Analysis Data        | Set                           | Prepare syllabus text and year for AI input   | Extract Syllabus Text         | AI Analysis Agent              | Same as above                                                                                                                    |
| Load Historical Context      | Set                           | Load static historical topics and challenges  | Manual Trigger                | AI Analysis Agent              | Same as above                                                                                                                    |
| AI Analysis Agent            | LangChain AI Agent            | Analyze syllabus + historical context via AI  | Prepare Analysis Data, Load Historical Context, OpenRouter Chat Model | Parse AI Output               | Same as above                                                                                                                    |
| OpenRouter Chat Model        | LangChain LM Chat             | OpenRouter AI model for query processing       | AI Analysis Agent (ai_languageModel) | AI Analysis Agent             | Same as above                                                                                                                    |
| Parse AI Output              | Set                           | Parse and normalize AI JSON output             | AI Analysis Agent             | Format Report                 | ## **Workflow Steps** 1. Fetch & extract syllabus... (sticky note covers post-AI steps)                                        |
| Format Report               | Markdown                      | Format AI output into Markdown report           | Parse AI Output               | Convert to HTML               | Same as above                                                                                                                    |
| Convert to HTML             | HTML                          | Convert Markdown to HTML for publishing         | Format Report                 | Publish to WordPress          | Same as above                                                                                                                    |
| Publish to WordPress        | WordPress                     | Publish formatted report as WordPress post      | Convert to HTML               | Send Slack Summary            | Same as above                                                                                                                    |
| Send Slack Summary          | Slack                         | Send summary notification with key highlights  | Publish to WordPress          | —                             | Same as above                                                                                                                    |
| Sticky Note                 | Sticky Note                   | Documentation and overview                      | —                             | —                             | Covers overall workflow introduction, steps, setup instructions, use cases, benefits, and customization notes                   |
| Sticky Note1                | Sticky Note                   | Workflow steps summary and setup instructions   | —                             | —                             | Covers workflow steps and setup details                                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - No configuration needed  
   - Position: Start node for workflow activation

2. **Add HTTP Request Node (Fetch O-Level Math Syllabus)**  
   - Connect from Manual Trigger  
   - Method: GET  
   - URL: `https://www.seab.gov.sg/docs/default-source/national-examinations/syllabus/olevel/2025syllabus/4048_y25_sy.pdf`  
   - Ensure timeout and SSL defaults are appropriate

3. **Add Extract From File Node (Extract Syllabus Text)**  
   - Connect from HTTP Request  
   - Operation: `text` extraction  
   - Input: Binary PDF from HTTP node

4. **Add Set Node (Prepare Analysis Data)**  
   - Connect from Extract Syllabus Text  
   - Assign two fields:  
     - `syllabus_content`: Expression referencing extracted text (`{{$json.data}}`)  
     - `analysis_year`: Number `2025`

5. **Add Set Node (Load Historical Context)**  
   - Connect from Manual Trigger (parallel to HTTP node)  
   - Assign two string fields:  
     - `historical_topics`: List recurring topics as string (Algebra, Geometry, Trigonometry, Statistics, Number patterns, Mensuration, Coordinate geometry, Vectors, Matrices, Sets)  
     - `challenging_areas`: List difficult topics as string (Circle theorems, Trigonometric identities, Probability, Algebraic manipulation, Multi-step problems)

6. **Add LangChain LM Chat Node (OpenRouter Chat Model)**  
   - Connect to AI Analysis Agent via ai_languageModel input  
   - Model: `perplexity/sonar-reasoning`  
   - Credential: Configure OpenRouter API key  
   - No other special parameters needed

7. **Add LangChain Agent Node (AI Analysis Agent)**  
   - Connect main inputs from Prepare Analysis Data and Load Historical Context nodes  
   - Set prompt text with embedded expressions:  
     - Insert `syllabus_content` from Prepare Analysis Data  
     - Insert `historical_topics` and `challenging_areas` from Load Historical Context  
   - Provide detailed JSON schema in prompt for output structure (exam summary, topics, predictions)  
   - Link AI Analysis Agent's language model input to OpenRouter Chat Model node

8. **Add Set Node (Parse AI Output)**  
   - Connect from AI Analysis Agent output  
   - No explicit parsing config required (assumed to normalize JSON)

9. **Add Markdown Node (Format Report)**  
   - Connect from Parse AI Output  
   - Use expressions referencing parsed AI data to create Markdown report including:  
     - Summary of exam overview  
     - Top recurring topics list  
     - Challenging areas with tips  
     - Predicted questions with confidence

10. **Add HTML Node (Convert to HTML)**  
    - Connect from Format Report  
    - Default settings to convert Markdown to HTML

11. **Add WordPress Node (Publish to WordPress)**  
    - Connect from Convert to HTML  
    - Configure WordPress credentials (API key or OAuth)  
    - Set post title dynamically:  
      - Example: `GCE O-Level Math Predictions {{ $json.analysis_year }}`  
    - Post content: Use HTML from previous node

12. **Add Slack Node (Send Slack Summary)**  
    - Connect from Publish to WordPress  
    - Configure Slack webhook URL  
    - Compose message dynamically referencing parsed AI output for key highlights and predicted topics with confidence scores  
    - Include notification about report published on WordPress

13. **Add Sticky Notes for Documentation (Optional but recommended)**  
    - Add sticky notes summarizing workflow purpose, steps, setup instructions, and benefits for users and maintainers

14. **Test Workflow**  
    - Trigger manually  
    - Verify syllabus fetch and extraction  
    - Confirm AI analysis returns valid JSON  
    - Check formatting outputs correct Markdown and HTML  
    - Confirm WordPress post creation and Slack notification delivery

---

### 5. General Notes & Resources

| Note Content                                                                                                                            | Context or Link                                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Exams create significant stress for students. This workflow automates syllabus analysis and predicts exam trends using AI.              | General introduction to workflow purpose                                                                        |
| Workflow Steps: Fetch syllabus → Extract text → Load history → AI analysis → Parse → Format → Convert → Publish → Notify                | Workflow execution order summary                                                                                 |
| Prerequisites: OpenRouter account, WordPress API access, Slack webhook, SEAB syllabus URL                                                | Setup requirements                                                                                               |
| Use Cases: Predict 2025 GCE Math topics, generate AI insights, publish summaries for educators                                          | Intended user scenarios                                                                                           |
| Customization: Adapt for other subjects or examination boards by changing syllabus source and AI prompt                                | Workflow flexibility and extensibility                                                                           |
| Benefits: Enables fast, data-driven exam forecasting and automated report publication                                                   | Value proposition                                                                                                |
| OpenRouter Perplexity Sonar Reasoning model used for advanced AI reasoning in exam analysis                                            | AI model specification                                                                                           |
| SEAB official syllabus URL: https://www.seab.gov.sg/docs/default-source/national-examinations/syllabus/olevel/2025syllabus/4048_y25_sy.pdf | Official syllabus source                                                                                          |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and publicly accessible.