AI-Powered LinkedIn Content Engine (n8n + OpenAI + Perplexity + Replicate)

https://n8nworkflows.xyz/workflows/ai-powered-linkedin-content-engine--n8n---openai---perplexity---replicate--5162


# AI-Powered LinkedIn Content Engine (n8n + OpenAI + Perplexity + Replicate)

### 1. Workflow Overview

This workflow automates the creation of high-quality LinkedIn content using AI-driven tools and integrates research, content refinement, image prompt generation, and visual content creation. It is designed for entrepreneurs or professionals seeking to generate engaging LinkedIn posts enriched with verified data and accompanied by conceptual images. The workflow follows a logical progression from input reception to content generation, refinement, scoring, visual conceptualization, image creation, and finally saving results.

Logical blocks:

- **1.1 Input Reception:** Captures user input via a webhook containing topic, post type, length, and other parameters.
- **1.2 Research & Data Gathering:** Uses Perplexity AI to fetch factual, verifiable, and recent information relevant to the topic.
- **1.3 Content Creation:** Comprises two OpenAI nodes; first generates draft content blending user context and research, second refines the voice and style.
- **1.4 Content Scoring:** Evaluates the refined content for engagement, length, and authenticity.
- **1.5 Image Prompt Generation:** Creates an abstract, metaphorical prompt reflecting the content’s emotion and concept.
- **1.6 Image Creation:** Calls Replicate API to generate a visual image based on the prompt.
- **1.7 Result Saving:** Stores the final post, image link, topic, and scoring metadata to Google Sheets.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception

- **Overview:** Receives incoming POST requests containing LinkedIn post parameters such as topic, post type, length, and other content-related fields.
- **Nodes Involved:** `Webhook`
- **Node Details:**

  - **Webhook**
    - Type & Role: HTTP webhook node; entry point for data.
    - Configuration: Listens on a specific path (`WEBHOOK_ID_HERE`), HTTP method POST.
    - Variables Used: Expects JSON payload with keys like `Topic`, `Post_Type`, `Length`, `Include_Company`, `Personal_Story`, `Additional_Context`, `Category`.
    - Input/Output: No input node; output connects to Research & Trends.
    - Edge Cases: Malformed requests, missing fields, or incorrect HTTP method may cause failures.
    - Version: n8n webhook v2.

---

#### 1.2 Research & Data Gathering

- **Overview:** Performs a focused, factual research on the given topic and additional context using the Perplexity AI API, ensuring content credibility with recent and verifiable data.
- **Nodes Involved:** `🔍 Research & Trends`
- **Node Details:**

  - **🔍 Research & Trends**
    - Type & Role: Perplexity AI node for factual research.
    - Configuration: Uses the "sonar" model; prompts Perplexity to find recent news, statistics, expert opinions, and discussions about the topic, formatted with verified insights, content angles, and limitations.
    - Variables: Pulls `Topic` and `Additional_Context` from webhook JSON body.
    - Input/Output: Input from Webhook; output to Content Creator - OpenAI.
    - Edge Cases: API errors, rate limiting, insufficient data found (handled by explicit fallback message).
    - Credentials: Requires valid Perplexity API key.
    - Version: Perplexity node v1.

---

#### 1.3 Content Creation

- **Overview:** Generates a LinkedIn post draft combining user context and research data, then polishes it to sound natural and conversational in the user's voice.
- **Nodes Involved:** `✍️ Content Creator - OpenAI`, `🎨 Voice Refiner - OpenAI`
- **Node Details:**

  - **✍️ Content Creator - OpenAI**
    - Type & Role: OpenAI (Langchain) node for initial creative content generation.
    - Configuration: Uses model "chatgpt-4o-latest" with a detailed prompt instructing the AI to create LinkedIn posts based on user profile, topic, post type, length, company inclusion rules, and research results.
    - Key Expressions: Extracts multiple fields from webhook body via expressions (e.g., `{{ $('Webhook').item.json.body.Topic }}`), includes research content from Perplexity in prompt.
    - Input/Output: Input from `🔍 Research & Trends`; output to `🎨 Voice Refiner - OpenAI`.
    - Edge Cases: API quota limits, prompt evaluation failures, unexpected input formats.
    - Credentials: OpenAI API key required.
    - Version: Langchain OpenAI node v1.8.

  - **🎨 Voice Refiner - OpenAI**
    - Type & Role: OpenAI (Langchain) node for stylistic refinement.
    - Configuration: Same model, prompt instructs polishing the draft to sound like the user’s natural voice while preserving content, length, and factual accuracy.
    - Variables: Reads content from previous node (`{{$json.message.content}}`), length from webhook body.
    - Input/Output: Input from `✍️ Content Creator - OpenAI`; output to Content Scorer.
    - Edge Cases: Response timing issues, exceeding token limits.
    - Credentials: OpenAI API key.
    - Version: Langchain OpenAI node v1.8.

---

#### 1.4 Content Scoring

- **Overview:** Runs a custom JavaScript scoring function to evaluate the refined post’s length, engagement features, voice authenticity, and penalties for AI clichés, then classifies the post status.
- **Nodes Involved:** `📊 Content Scorer`
- **Node Details:**

  - **📊 Content Scorer**
    - Type & Role: Code node executing JavaScript for scoring.
    - Configuration: Scores based on length brackets, presence of questions, numbers, specific phrases, and penalizes overused AI buzzwords.
    - Input/Output: Input from `🎨 Voice Refiner - OpenAI`; output to `🖼️ Image Prompt Generator`.
    - Edge Cases: Null or empty input, unexpected content structure.
    - Version: n8n Code node v2.

---

#### 1.5 Image Prompt Generation

- **Overview:** Creates an abstract, conceptual image prompt representing the emotion and concept of the LinkedIn post, avoiding literal or branded references.
- **Nodes Involved:** `🖼️ Image Prompt Generator`
- **Node Details:**

  - **🖼️ Image Prompt Generator**
    - Type & Role: OpenAI (Langchain) node generating artistic image prompt.
    - Configuration: Uses detailed instructions to convert post content and post metadata (topic, category, post type) into an abstract visual metaphor prompt.
    - Variables: Uses `generated_post` from Content Scorer and webhook inputs.
    - Input/Output: Input from `📊 Content Scorer`; output to next Code node.
    - Credentials: OpenAI API.
    - Edge Cases: Overly literal prompts, prompt length limits.
    - Version: Langchain OpenAI v1.8.

---

#### 1.6 Image Creation

- **Overview:** Cleans the prompt to remove problematic characters, then sends it to Replicate API to generate a high-quality artistic image, waiting synchronously for the output.
- **Nodes Involved:** `Code`, `🎨 Image Generator`
- **Node Details:**

  - **Code**
    - Type & Role: JavaScript node for prompt sanitization.
    - Configuration: Escapes quotes, removes line breaks and excess whitespace from the prompt before sending to image generator.
    - Input/Output: Input from `🖼️ Image Prompt Generator`; output to `🎨 Image Generator`.
    - Edge Cases: Empty prompt, invalid characters.
    - Version: n8n Code node v2.

  - **🎨 Image Generator**
    - Type & Role: HTTP Request node to Replicate API for image generation.
    - Configuration: POST request to `black-forest-labs/flux-1.1-pro` model with JSON body parameters for prompt, resolution, quality, and safety tolerance. Uses HTTP header authentication.
    - Input/Output: Input from `Code`; output to `💾 Save Results`.
    - Credentials: Replicate API key.
    - Edge Cases: API failures, timeout, invalid API key, rate limits.
    - Version: HTTP Request v4.2.

---

#### 1.7 Result Saving

- **Overview:** Appends or updates a Google Sheets document with the final LinkedIn post, generated image link, topic, AI scoring, and status for tracking and further action.
- **Nodes Involved:** `💾 Save Results`
- **Node Details:**

  - **💾 Save Results**
    - Type & Role: Google Sheets node for appending/updating rows.
    - Configuration: Maps fields from refined post, image URL, topic, status, and AI score. Uses "append or update" operation matched by `Topic`.
    - Input/Output: Input from `🎨 Image Generator`.
    - Credentials: Google Sheets OAuth2.
    - Edge Cases: API authentication issues, sheet access permissions, data mapping errors.
    - Version: Google Sheets node v4.6.

---

### 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                  | Input Node(s)               | Output Node(s)                    | Sticky Note                                                    |
|------------------------------|----------------------------------|--------------------------------|-----------------------------|----------------------------------|---------------------------------------------------------------|
| Webhook                      | n8n-nodes-base.webhook            | Input Reception                | None                        | 🔍 Research & Trends              |                                                               |
| 🔍 Research & Trends          | n8n-nodes-base.perplexity         | Research & Data Gathering      | Webhook                     | ✍️ Content Creator - OpenAI        |                                                               |
| ✍️ Content Creator - OpenAI    | @n8n/n8n-nodes-langchain.openAi  | Initial Content Generation     | 🔍 Research & Trends         | 🎨 Voice Refiner - OpenAI          |                                                               |
| 🎨 Voice Refiner - OpenAI      | @n8n/n8n-nodes-langchain.openAi  | Content Voice Refinement       | ✍️ Content Creator - OpenAI  | 📊 Content Scorer                 |                                                               |
| 📊 Content Scorer             | n8n-nodes-base.code               | Content Quality Scoring        | 🎨 Voice Refiner - OpenAI    | 🖼️ Image Prompt Generator          |                                                               |
| 🖼️ Image Prompt Generator     | @n8n/n8n-nodes-langchain.openAi  | Image Prompt Generation        | 📊 Content Scorer            | Code                             |                                                               |
| Code                         | n8n-nodes-base.code               | Prompt Cleaning                | 🖼️ Image Prompt Generator     | 🎨 Image Generator               |                                                               |
| 🎨 Image Generator            | n8n-nodes-base.httpRequest        | Image Generation via Replicate| Code                        | 💾 Save Results                  |                                                               |
| 💾 Save Results               | n8n-nodes-base.googleSheets       | Save Final Data                | 🎨 Image Generator           | None                            |                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**
   - Type: `Webhook`
   - Settings: HTTP Method `POST`, Path: `WEBHOOK_ID_HERE` (replace with your webhook ID)
   - Purpose: Receive JSON with keys: Topic, Post_Type, Length, Include_Company, Personal_Story, Additional_Context, Category.

2. **Add Perplexity Node for Research**
   - Type: `Perplexity` (requires Perplexity API credentials)
   - Model: `sonar`
   - Message prompt: Research topic and additional context for factual, verifiable info with direct URLs.
   - Connect input from Webhook output.

3. **Add OpenAI Node for Content Creation**
   - Type: `OpenAI (Langchain)`
   - Model: `chatgpt-4o-latest`
   - Prompt: Detailed content creation prompt integrating user context, post parameters, and research results.
   - Credentials: OpenAI API key.
   - Connect input from Perplexity node output.

4. **Add OpenAI Node for Voice Refinement**
   - Type: `OpenAI (Langchain)`
   - Model: `chatgpt-4o-latest`
   - Prompt: Refine the draft to sound like user’s natural voice with conversational style, keeping length constraints.
   - Credentials: OpenAI API key.
   - Connect input from Content Creator node output.

5. **Add Code Node for Content Scoring**
   - Type: `Code`
   - Script: Custom JavaScript that scores content on length, engagement elements, authentic voice markers, and applies penalties.
   - Connect input from Voice Refiner node output.

6. **Add OpenAI Node for Image Prompt Generation**
   - Type: `OpenAI (Langchain)`
   - Model: `chatgpt-4o-latest`
   - Prompt: Generate an abstract, metaphorical image prompt based on the final post content, topic, category, and post type.
   - Credentials: OpenAI API key.
   - Connect input from Content Scorer node output.

7. **Add Code Node for Prompt Cleaning**
   - Type: `Code`
   - Script: Escape quotes and remove line breaks from prompt for JSON-safe transmission.
   - Connect input from Image Prompt Generator node output.

8. **Add HTTP Request Node for Image Generation**
   - Type: `HTTP Request`
   - Method: POST
   - URL: `https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions`
   - Headers: Content-Type: application/json, Prefer: wait, Authorization via HTTP Header Authentication (Replicate API key)
   - Body: JSON with prompt from previous node, configured for 1024x1024, output quality 100, safety tolerance 2.
   - Connect input from Code node output.

9. **Add Google Sheets Node for Saving Results**
   - Type: `Google Sheets`
   - Operation: `appendOrUpdate`
   - Document ID and Sheet Name set to your Google Sheet.
   - Map columns: Post (final refined content), Image (generated image URL), Topic, Status (from scoring), AI_Score.
   - Authentication: Google OAuth2 credentials.
   - Connect input from Image Generator node output.

10. **Connect all nodes in this order:**

    `Webhook` → `🔍 Research & Trends` → `✍️ Content Creator - OpenAI` → `🎨 Voice Refiner - OpenAI` → `📊 Content Scorer` → `🖼️ Image Prompt Generator` → `Code (prompt clean)` → `🎨 Image Generator` → `💾 Save Results`

---

### 5. General Notes & Resources

| Note Content                                                                                                        | Context or Link                                 |
|---------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| The workflow integrates multiple AI services: OpenAI for text generation and refinement, Perplexity for research, and Replicate for image generation. | Overall Architecture                            |
| The content creation prompts enforce strict rules on company name inclusion, ensuring compliance with user preferences. | Content Creation Node Prompt                     |
| The image prompt generation focuses on abstract metaphors rather than literal visuals, suitable for impactful LinkedIn posts. | Image Prompt Generator Node                      |
| Scoring logic penalizes AI buzzwords to encourage authentic, human-like writing style.                              | Content Scorer Node                              |
| Google Sheets is used as a simple backend for tracking post content, images, and quality metrics.                   | Save Results Node                                |
| Replace all placeholder credential IDs with your actual API keys and OAuth2 credentials before running the workflow. | Credentials Setup                               |
| Webhook URL must be exposed publicly (e.g., via n8n cloud or tunneling) to accept incoming POST requests.           | Webhook Node Configuration                      |

---

**Disclaimer:**  
The content provided is entirely generated and processed through an automated workflow built with n8n and AI services. It adheres strictly to current content policies and contains no illegal, offensive, or protected elements. All data handled is public and lawful.