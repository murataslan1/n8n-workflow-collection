Automate YouTube Community Posts with DeepSeek AI & Dynamic Image Generation using Google Sheets

https://n8nworkflows.xyz/workflows/automate-youtube-community-posts-with-deepseek-ai---dynamic-image-generation-using-google-sheets-6826


# Automate YouTube Community Posts with DeepSeek AI & Dynamic Image Generation using Google Sheets

### 1. Workflow Overview

This workflow automates the creation of YouTube Community Posts by generating engaging content and dynamic images daily at 10 AM EST. It integrates AI-powered language models and image generation APIs, while logging the results into Google Sheets for tracking and review.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Variable Initialization:** Triggers the workflow daily and sets day-specific variables.
- **1.2 AI Content Generation:** Uses a chain of large language models (LLMs) including DeepSeek to generate post content.
- **1.3 Content Extraction & Image Prompt Creation:** Extracts key details from the generated content and creates a dynamic prompt for image generation.
- **1.4 Dynamic Image Generation:** Uses an external API (Together AI) to generate an image based on the prompt.
- **1.5 Post-Processing & Data Recording:** Processes the image response and appends the post data to Google Sheets for record-keeping.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Variable Initialization

- **Overview:** Initiates the workflow daily at 10 AM EST and sets necessary date/time variables relevant for content generation.
- **Nodes Involved:** `Daily 10AM EST Trigger`, `Set Day Variables`

**Node Details:**

- **Daily 10AM EST Trigger**
  - Type: Schedule Trigger
  - Role: Initiates workflow execution every day at 10 AM EST.
  - Configuration: Uses default scheduling with timezone set to EST (implicit).
  - Inputs: None (trigger node).
  - Outputs: Triggers `Set Day Variables`.
  - Edge Cases: Potential failure if n8n server time is misconfigured or downtime occurs.
  
- **Set Day Variables**
  - Type: Code Node
  - Role: Sets day-specific variables such as current date, day of week, or other temporal context for content generation.
  - Configuration: Custom JavaScript code (not explicitly provided) presumably sets variables used downstream.
  - Inputs: From `Daily 10AM EST Trigger`.
  - Outputs: Passes data to `Generate Content - LLM Chain`.
  - Edge Cases: Code errors or date/time miscalculations could impact content relevance.

#### 2.2 AI Content Generation

- **Overview:** Generates YouTube Community post content using a chain of large language models, coordinating with DeepSeek's AI chat model.
- **Nodes Involved:** `Generate Content - LLM Chain`, `DeepSeek R1 Model`

**Node Details:**

- **Generate Content - LLM Chain**
  - Type: LangChain Chain LLM
  - Role: Orchestrates a sequence of LLM calls to generate draft post content.
  - Configuration: Uses LangChain framework with configured prompts and chains (details not fully exposed).
  - Inputs: Receives day variables from `Set Day Variables`.
  - Outputs: Sends generated content to `Extract Content Details` and also triggers the `DeepSeek R1 Model` AI chat.
  - Edge Cases: API rate limits, prompt misconfiguration, or model unavailability.
  - Version: 1.7 (supports LangChain features).

- **DeepSeek R1 Model**
  - Type: LangChain LM Chat OpenRouter
  - Role: Acts as a conversational AI model to refine or assist content generation.
  - Configuration: Connected as an AI language model provider to the `Generate Content - LLM Chain`.
  - Inputs: From `Generate Content - LLM Chain`.
  - Outputs: Feeds back into `Generate Content - LLM Chain` and `Generate Dynamic Image Prompt`.
  - Edge Cases: Authentication failures, latency, or content filter blocks.

#### 2.3 Content Extraction & Image Prompt Creation

- **Overview:** Processes generated text to extract relevant details and formulate a dynamic prompt for image generation.
- **Nodes Involved:** `Extract Content Details`, `Generate Dynamic Image Prompt`

**Node Details:**

- **Extract Content Details**
  - Type: Code Node
  - Role: Parses the generated text to extract key phrases, themes, or tags needed for image prompt generation.
  - Configuration: Custom JavaScript code (not visible) parses the output from the LLM chain.
  - Inputs: Output from `Generate Content - LLM Chain`.
  - Outputs: Passes structured data to `Generate Dynamic Image Prompt`.
  - Edge Cases: Parsing errors, unexpected content formats.

- **Generate Dynamic Image Prompt**
  - Type: LangChain Chain LLM
  - Role: Uses AI to generate a descriptive image prompt tailored to the extracted content details.
  - Configuration: Uses a LangChain model with prompts designed to generate image descriptions.
  - Inputs: Structured content details from `Extract Content Details`, also receives AI input from `DeepSeek R1 Model`.
  - Outputs: Sends prompt to `Generate Image - Together AI`.
  - Edge Cases: Prompt generation failures, malformed outputs.

#### 2.4 Dynamic Image Generation

- **Overview:** Sends the dynamic prompt to an image-generation API and handles the image response.
- **Nodes Involved:** `Generate Image - Together AI`, `Process Image Response`

**Node Details:**

- **Generate Image - Together AI**
  - Type: HTTP Request Node
  - Role: Calls the Together AI image generation API with the dynamic prompt.
  - Configuration: HTTP POST request with prompt in body; API key and endpoint configured in credentials.
  - Inputs: Receives prompt from `Generate Dynamic Image Prompt`.
  - Outputs: Sends image generation response to `Process Image Response`.
  - Edge Cases: API failures, rate limits, invalid prompt errors, network issues.
  - Version: 4.1 (supports latest HTTP features).

- **Process Image Response**
  - Type: Code Node
  - Role: Processes the API response to extract image URLs or metadata for further use.
  - Configuration: Custom JavaScript parses HTTP response JSON.
  - Inputs: Response from `Generate Image - Together AI`.
  - Outputs: Passes processed data to `Add to Google Sheets`.
  - Edge Cases: Malformed JSON, missing fields, API response changes.

#### 2.5 Post-Processing & Data Recording

- **Overview:** Records the generated post content and image data into Google Sheets for archival and review.
- **Nodes Involved:** `Add to Google Sheets`

**Node Details:**

- **Add to Google Sheets**
  - Type: Google Sheets Node
  - Role: Appends a new row with content and image data to a Google Sheets spreadsheet.
  - Configuration: Sheet ID, range, and authentication configured in credentials.
  - Inputs: Processed data from `Process Image Response`.
  - Outputs: None (terminal node).
  - Edge Cases: Authentication token expiry, sheet access permissions, quota limits.

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                         | Input Node(s)               | Output Node(s)                      | Sticky Note                           |
|---------------------------|----------------------------------|---------------------------------------|-----------------------------|------------------------------------|-------------------------------------|
| Daily 10AM EST Trigger     | Schedule Trigger                  | Triggers workflow daily at 10 AM EST  | None                        | Set Day Variables                  |                                     |
| Set Day Variables          | Code                             | Sets date/time variables for content  | Daily 10AM EST Trigger      | Generate Content - LLM Chain       |                                     |
| Generate Content - LLM Chain | LangChain Chain LLM             | Generates post content using LLM chain| Set Day Variables           | Extract Content Details, DeepSeek R1 Model |                             |
| DeepSeek R1 Model          | LangChain LM Chat OpenRouter     | AI chat model assisting content gen   | Generate Content - LLM Chain| Generate Content - LLM Chain, Generate Dynamic Image Prompt |                    |
| Extract Content Details    | Code                             | Extracts key details from content      | Generate Content - LLM Chain| Generate Dynamic Image Prompt      |                                     |
| Generate Dynamic Image Prompt | LangChain Chain LLM            | Creates image prompt dynamically       | Extract Content Details, DeepSeek R1 Model | Generate Image - Together AI |                     |
| Generate Image - Together AI | HTTP Request                    | Calls image generation API             | Generate Dynamic Image Prompt| Process Image Response             |                                     |
| Process Image Response     | Code                             | Processes image API response           | Generate Image - Together AI| Add to Google Sheets               |                                     |
| Add to Google Sheets       | Google Sheets                    | Logs post and image data to spreadsheet| Process Image Response      | None                              |                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**
   - Type: `Schedule Trigger`
   - Configure to run daily at 10:00 AM EST.
   - No inputs, outputs connected to next node.

2. **Add Code Node: Set Day Variables**
   - Type: `Code`
   - Write JavaScript to set current date, day of week, or other needed variables.
   - Connect input from Schedule Trigger.
   - Output to next node.

3. **Add LangChain Chain LLM Node: Generate Content - LLM Chain**
   - Type: `@n8n/n8n-nodes-langchain.chainLlm`
   - Configure prompt templates for YouTube post content generation.
   - Connect input from `Set Day Variables`.
   - Outputs to:
     - `Extract Content Details`
     - `DeepSeek R1 Model` (as AI Language Model input).

4. **Add LangChain LM Chat OpenRouter Node: DeepSeek R1 Model**
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenRouter`
   - Configure OpenRouter credentials for DeepSeek AI.
   - Connect as AI language model input to `Generate Content - LLM Chain` and also to `Generate Dynamic Image Prompt`.

5. **Add Code Node: Extract Content Details**
   - Type: `Code`
   - Write JS to parse generated content and extract keywords/themes.
   - Input from `Generate Content - LLM Chain`.
   - Output to `Generate Dynamic Image Prompt`.

6. **Add LangChain Chain LLM Node: Generate Dynamic Image Prompt**
   - Type: `@n8n/n8n-nodes-langchain.chainLlm`
   - Configure prompt template to create descriptive image prompts.
   - Inputs from `Extract Content Details` and `DeepSeek R1 Model`.
   - Output to `Generate Image - Together AI`.

7. **Add HTTP Request Node: Generate Image - Together AI**
   - Type: `HTTP Request`
   - Configure HTTP POST request to Together AI image generation endpoint.
   - Include API key in credentials.
   - Send prompt from `Generate Dynamic Image Prompt`.
   - Output to `Process Image Response`.

8. **Add Code Node: Process Image Response**
   - Type: `Code`
   - Parse JSON response to extract image URL and metadata.
   - Input from `Generate Image - Together AI`.
   - Output to `Add to Google Sheets`.

9. **Add Google Sheets Node: Add to Google Sheets**
   - Type: `Google Sheets`
   - Configure credentials with OAuth2.
   - Set spreadsheet ID and target sheet.
   - Append row with post content, image URL, timestamp, etc.
   - Input from `Process Image Response`.
   - No output (terminal).

10. **Connect all nodes as per the above sequence.**

11. **Configure all credentials:**
    - OpenRouter API key for DeepSeek.
    - Together AI API key.
    - Google Sheets OAuth2 credentials with write access.

12. **Test workflow with manual trigger or wait for scheduled run.**

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                              |
|----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| Workflow automates YouTube Community Posts with AI-generated text and dynamic images, logged for auditing purposes. | Workflow description provided by user.                       |
| DeepSeek AI integration uses OpenRouter for conversational AI capabilities in content generation.                   | OpenRouter docs: https://openrouter.ai/docs                  |
| Together AI is used for image generation via HTTP API calls.                                                        | https://together.xyz/docs/api                                |
| Google Sheets node requires OAuth2 credentials with editing permissions on the target spreadsheet.                   | https://docs.n8n.io/integrations/builtin/google-sheets       |
| Ensure server timezone and daylight saving adjustments align with 10 AM EST trigger for accurate scheduling.         | n8n timezone configuration docs                              |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All manipulated data is legal and public.