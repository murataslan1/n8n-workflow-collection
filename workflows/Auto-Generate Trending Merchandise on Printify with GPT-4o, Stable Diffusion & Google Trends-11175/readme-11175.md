Auto-Generate Trending Merchandise on Printify with GPT-4o, Stable Diffusion & Google Trends

https://n8nworkflows.xyz/workflows/auto-generate-trending-merchandise-on-printify-with-gpt-4o--stable-diffusion---google-trends-11175


# Auto-Generate Trending Merchandise on Printify with GPT-4o, Stable Diffusion & Google Trends

### 1. Workflow Overview

This workflow automates the creation and publishing of trending merchandise (specifically t-shirts) on Printify by leveraging AI and market data. It integrates user preferences collected via Typeform, current market trends from Google Trends, AI-driven design generation and evaluation, and automated publishing with dynamic pricing. The workflow is structured into three main logical blocks:

- **1.1 Configuration & Data Collection**: Sets up API credentials and gathers input data from Typeform (user preferences) and Google Trends (market trends).
- **1.2 AI Design & Generation**: Uses OpenAI GPT-4o to synthesize design prompts based on collected trends and preferences, then generates product images via Replicate’s AI model.
- **1.3 Quality Control & Publishing**: Rates generated designs using OpenAI Vision AI, filters out low-quality designs, calculates dynamic pricing based on quality, and publishes approved designs to Printify and logs them in Airtable.

---

### 2. Block-by-Block Analysis

#### 2.1 Configuration & Data Collection

**Overview:**  
This block initializes all necessary API keys and identifiers and collects external data from Typeform (customer preferences) and Google Trends (daily trending searches), merging these data streams to prepare for AI-driven design generation.

**Nodes Involved:**  
- Weekly Schedule Trigger1  
- Workflow Configuration1  
- Get Typeform Responses1  
- Get Google Trends Data1  
- Merge Trend Data1  
- Sticky Note 1, Sticky Note1 (documentation)

**Node Details:**

- **Weekly Schedule Trigger1**  
  - Type: Schedule Trigger  
  - Role: Triggers workflow weekly on Monday at 9 AM to automate trend-based merchandise creation.  
  - Configuration: Weekly interval, trigger at day 1 (Monday), hour 9.  
  - Input: None  
  - Output: Workflow Configuration1  
  - Edge cases: Missed trigger if workflow was offline; time zone considerations.

- **Workflow Configuration1**  
  - Type: Set  
  - Role: Stores API URLs, tokens, and shop/product settings as workflow variables for reuse.  
  - Configuration: Defines keys for Typeform API URL and credentials, Replicate API token, Printify API token and shop ID, base price for products.  
  - Expressions: Values are static placeholders to be replaced by user with real tokens.  
  - Input: Weekly Schedule Trigger1  
  - Output: Get Typeform Responses1, Get Google Trends Data1  
  - Edge cases: Missing/incorrect API keys will cause authentication failures downstream.

- **Get Typeform Responses1**  
  - Type: HTTP Request  
  - Role: Retrieves user preferences/survey responses from Typeform API.  
  - Configuration: GET request to Typeform responses endpoint, with Bearer token authorization header.  
  - Expressions: URL and Authorization header use values from Workflow Configuration1.  
  - Input: Workflow Configuration1  
  - Output: Merge Trend Data1 (input 0)  
  - Edge cases: API rate limits, expired tokens, malformed responses.

- **Get Google Trends Data1**  
  - Type: HTTP Request  
  - Role: Fetches daily trending search topics from Google Trends RSS feed for the US market.  
  - Configuration: GET request to Google Trends daily RSS feed URL (no auth required).  
  - Input: Workflow Configuration1  
  - Output: Merge Trend Data1 (input 1)  
  - Edge cases: Network outages, Google Trends format changes.

- **Merge Trend Data1**  
  - Type: Merge  
  - Role: Combines Typeform responses and Google Trends data into a single dataset for AI processing.  
  - Configuration: Default merge mode (likely merge by index).  
  - Input: Typeform responses (input 0), Google Trends data (input 1)  
  - Output: Chief Designer AI1  
  - Edge cases: Mismatched data lengths, empty inputs.

---

#### 2.2 AI Design & Generation

**Overview:**  
Synthesizes design concepts by combining user preferences and trending topics through GPT-4o, then uses Replicate AI to generate high-quality t-shirt design images from prompts.

**Nodes Involved:**  
- Chief Designer AI1  
- Parse Design Proposals1  
- Generate Image with Replicate1  
- Sticky Note 2 (documentation)

**Node Details:**

- **Chief Designer AI1**  
  - Type: OpenAI (LangChain integration)  
  - Role: Generates design concepts in natural language based on merged trend data.  
  - Configuration: Message operation, uses GPT-4o model under OpenAI API credentials.  
  - Input: Merge Trend Data1  
  - Output: Parse Design Proposals1  
  - Expressions: Input text dynamically derived from merged data.  
  - Edge cases: AI timeouts, incomplete/irrelevant responses, token limits.

- **Parse Design Proposals1**  
  - Type: Code (JavaScript)  
  - Role: Parses AI-generated text output to extract JSON-formatted design proposals (title, description, image prompt).  
  - Configuration: Extracts JSON array from AI response, removes markdown if present, throws error if parsing fails.  
  - Input: Chief Designer AI1  
  - Output: Generate Image with Replicate1 (one item per design)  
  - Edge cases: Malformed AI output, JSON parse errors.

- **Generate Image with Replicate1**  
  - Type: HTTP Request  
  - Role: Calls Replicate API to generate image files from AI-generated prompts.  
  - Configuration: POST request with JSON body specifying model version, prompt with added keywords (“t-shirt design, vector style, white background”), output format PNG, 1:1 aspect ratio.  
  - Headers: Authorization Bearer with Replicate token, Content-Type application/json.  
  - Input: Parse Design Proposals1  
  - Output: Quality Control AI Vision1  
  - Edge cases: API rate limits, token expiration, model version updates.

---

#### 2.3 Quality Control & Publishing

**Overview:**  
Evaluates generated images using OpenAI Vision AI for design quality, filters out low scoring designs (<7), dynamically calculates pricing, publishes approved designs to Printify, and logs products in Airtable.

**Nodes Involved:**  
- Quality Control AI Vision1  
- Parse Quality Score1  
- Quality Filter1  
- Dynamic Pricing Calculator1  
- Publish to Printify1  
- Save to Product Dashboard1  
- Sticky Note 3 (documentation)

**Node Details:**

- **Quality Control AI Vision1**  
  - Type: OpenAI Vision AI (LangChain)  
  - Role: Rates the t-shirt design images on a scale of 1-10.  
  - Configuration: Analyze operation with prompt “Rate this t-shirt design on a scale of 1-10”, model GPT-4o Vision, input image URL from Replicate output.  
  - Input: Generate Image with Replicate1  
  - Output: Parse Quality Score1  
  - Edge cases: Image URL missing, AI analysis failures.

- **Parse Quality Score1**  
  - Type: Code (JavaScript)  
  - Role: Extracts numeric quality score and reason from AI response JSON or text.  
  - Configuration: Tries to parse JSON, falls back to regex extraction, throws error if parsing fails.  
  - Input: Quality Control AI Vision1  
  - Output: Quality Filter1  
  - Edge cases: Parsing failures, unexpected AI output formats.

- **Quality Filter1**  
  - Type: If (conditional)  
  - Role: Filters designs scoring below 7 to prevent low-quality products from publishing.  
  - Configuration: Condition checks if qualityScore >= 7.  
  - Input: Parse Quality Score1  
  - Output: Dynamic Pricing Calculator1 (if true), discarded otherwise.  
  - Edge cases: Missing scores, numeric comparison edge cases.

- **Dynamic Pricing Calculator1**  
  - Type: Code (JavaScript)  
  - Role: Calculates final product price dynamically based on quality score.  
  - Configuration: Base price from configuration; applies 20% premium if score ≥ 9, 10% if score ≥ 8, else base price.  
  - Input: Quality Filter1 (passed designs)  
  - Output: Publish to Printify1  
  - Edge cases: Invalid base price, score missing.

- **Publish to Printify1**  
  - Type: HTTP Request  
  - Role: Creates new product on Printify store with design image and metadata.  
  - Configuration:
    - POST to Printify products endpoint with JSON body containing:
      - Title, description (with quality score and reason)
      - Blueprint ID, print provider ID, variant IDs (placeholders to be replaced)
      - Price based on dynamic calculation
      - Image placement in print area with scaling and positioning
    - Authorization via Bearer token from configuration
    - Content-Type application/json
  - Input: Dynamic Pricing Calculator1  
  - Output: Save to Product Dashboard1  
  - Edge cases: Missing or incorrect Printify IDs, API errors, rate limits.

- **Save to Product Dashboard1**  
  - Type: Airtable  
  - Role: Logs published product information (title, price, image URL, quality score, Printify product ID) into Airtable base/table for tracking.  
  - Configuration: Airtable base and table IDs (placeholders), fields mapped with current date, price, status “Published.”  
  - Input: Publish to Printify1  
  - Output: None (end of workflow)  
  - Edge cases: Airtable API limits, invalid base/table IDs.

---

### 3. Summary Table

| Node Name                  | Node Type                     | Functional Role                                  | Input Node(s)                 | Output Node(s)                 | Sticky Note                                                  |
|----------------------------|-------------------------------|-------------------------------------------------|------------------------------|-------------------------------|--------------------------------------------------------------|
| Weekly Schedule Trigger1    | Schedule Trigger              | Initiate workflow weekly                         | None                         | Workflow Configuration1        |                                                              |
| Workflow Configuration1     | Set                           | Defines all API keys and base parameters        | Weekly Schedule Trigger1      | Get Typeform Responses1, Get Google Trends Data1 | Sticky Note 1: Config & Data - API keys and data sources setup |
| Get Typeform Responses1     | HTTP Request                  | Fetch user preferences from Typeform            | Workflow Configuration1       | Merge Trend Data1 (input 0)    |                                                              |
| Get Google Trends Data1     | HTTP Request                  | Fetch trending search data from Google Trends   | Workflow Configuration1       | Merge Trend Data1 (input 1)    |                                                              |
| Merge Trend Data1           | Merge                         | Combine Typeform and Google Trends data         | Get Typeform Responses1, Get Google Trends Data1 | Chief Designer AI1           |                                                              |
| Chief Designer AI1          | OpenAI (LangChain)            | Generate design prompts from trend data         | Merge Trend Data1             | Parse Design Proposals1         | Sticky Note 2: AI Design - GPT-4o creates prompts            |
| Parse Design Proposals1     | Code (JavaScript)             | Extract structured design proposals from AI     | Chief Designer AI1            | Generate Image with Replicate1  |                                                              |
| Generate Image with Replicate1 | HTTP Request               | Generate t-shirt design images from prompts     | Parse Design Proposals1       | Quality Control AI Vision1      |                                                              |
| Quality Control AI Vision1  | OpenAI Vision AI (LangChain)  | Rate design images quality (1-10)                | Generate Image with Replicate1 | Parse Quality Score1           | Sticky Note 3: QC & Publish - Vision AI scores designs       |
| Parse Quality Score1        | Code (JavaScript)             | Parse numeric quality score from AI response    | Quality Control AI Vision1    | Quality Filter1                |                                                              |
| Quality Filter1             | If (Conditional)              | Filter out low-scoring designs (<7)              | Parse Quality Score1          | Dynamic Pricing Calculator1     |                                                              |
| Dynamic Pricing Calculator1 | Code (JavaScript)             | Calculate product price based on quality score  | Quality Filter1              | Publish to Printify1            |                                                              |
| Publish to Printify1        | HTTP Request                  | Publish product with image and metadata to Printify | Dynamic Pricing Calculator1 | Save to Product Dashboard1      |                                                              |
| Save to Product Dashboard1  | Airtable                      | Log product info in Airtable                      | Publish to Printify1          | None                          |                                                              |
| Sticky Note 1               | Sticky Note                   | Documentation for Configuration & Data block    | None                         | None                          | See content in Section 2.1                                   |
| Sticky Note 2               | Sticky Note                   | Documentation for AI Design & Generation block  | None                         | None                          | See content in Section 2.2                                   |
| Sticky Note 3               | Sticky Note                   | Documentation for QC & Publishing block          | None                         | None                          | See content in Section 2.3                                   |
| Sticky Note1                | Sticky Note                   | Project overview and setup instructions          | None                         | None                          | See Section 2.1 notes                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Name: Weekly Schedule Trigger1  
   - Type: Schedule Trigger  
   - Configure: Trigger weekly on Monday at 9 AM.

2. **Create Set Node for Workflow Configuration**  
   - Name: Workflow Configuration1  
   - Type: Set  
   - Add variables:  
     - `typeformApiUrl`: `"https://api.typeform.com"`  
     - `typeformFormId`: `"YOUR_TYPEFORM_FORM_ID"` (replace)  
     - `typeformApiToken`: `"YOUR_TYPEFORM_API_TOKEN"` (replace)  
     - `replicateApiToken`: `"YOUR_REPLICATE_API_TOKEN"` (replace)  
     - `printifyApiToken`: `"YOUR_PRINTIFY_API_TOKEN"` (replace)  
     - `printifyShopId`: `"YOUR_PRINTIFY_SHOP_ID"` (replace)  
     - `basePrice`: number (default 25)  
   - Connect output of Weekly Schedule Trigger1 to this node.

3. **Create HTTP Request Node for Typeform Responses**  
   - Name: Get Typeform Responses1  
   - Method: GET  
   - URL: `={{ $json.typeformApiUrl + "/forms/" + $json.typeformFormId + "/responses" }}`  
   - Add Header: Authorization = `Bearer {{$json.typeformApiToken}}`  
   - Connect Workflow Configuration1 output to this node.

4. **Create HTTP Request Node for Google Trends Data**  
   - Name: Get Google Trends Data1  
   - Method: GET  
   - URL: `https://trends.google.com/trends/trendingsearches/daily/rss?geo=US`  
   - Connect Workflow Configuration1 output to this node.

5. **Create Merge Node**  
   - Name: Merge Trend Data1  
   - Mode: Merge inputs (default)  
   - Connect Get Typeform Responses1 (input 0) and Get Google Trends Data1 (input 1) outputs.

6. **Create OpenAI Node for Design Generation**  
   - Name: Chief Designer AI1  
   - Operation: Message  
   - Model: GPT-4o (via LangChain OpenAI integration)  
   - Connect Merge Trend Data1 output.

7. **Create Code Node to Parse AI Design Proposals**  
   - Name: Parse Design Proposals1  
   - Mode: Run once per input  
   - Paste JavaScript code to extract JSON array from AI message content (see node details).  
   - Connect Chief Designer AI1 output.

8. **Create HTTP Request Node to Generate Images (Replicate)**  
   - Name: Generate Image with Replicate1  
   - Method: POST  
   - URL: `https://api.replicate.com/v1/predictions`  
   - Body (JSON):  
     ```json
     {
       "version": "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
       "input": {
         "prompt": "{{ $json.imagePrompt }}, t-shirt design, vector style, white background, high quality, commercial print ready",
         "num_outputs": 1,
         "aspect_ratio": "1:1",
         "output_format": "png",
         "output_quality": 90
       }
     }
     ```  
   - Headers:  
     - Authorization: `Bearer {{ $json.replicateApiToken }}` (from config)  
     - Content-Type: application/json  
   - Connect Parse Design Proposals1 output.

9. **Create OpenAI Vision AI Node for Quality Control**  
   - Name: Quality Control AI Vision1  
   - Operation: Analyze  
   - Model: GPT-4o (Vision)  
   - Input: Image URL from Replicate output (`{{$json.output[0]}}` or `{{$json.urls[0]}}`)  
   - Prompt: "Rate this t-shirt design on a scale of 1-10"  
   - Connect Generate Image with Replicate1 output.

10. **Create Code Node to Parse Quality Score**  
    - Name: Parse Quality Score1  
    - Mode: Run once per item  
    - JavaScript code to parse JSON or extract numeric score from AI response text (see node details).  
    - Connect Quality Control AI Vision1 output.

11. **Create If Node for Quality Filter**  
    - Name: Quality Filter1  
    - Condition: Check if `qualityScore >= 7` (numeric, strict)  
    - Connect Parse Quality Score1 output.

12. **Create Code Node for Dynamic Pricing**  
    - Name: Dynamic Pricing Calculator1  
    - Mode: Run once per item  
    - Use JavaScript to calculate price based on `basePrice` and `qualityScore` with premiums for scores 8+ and 9+.  
    - Connect Quality Filter1 "true" output.

13. **Create HTTP Request Node to Publish on Printify**  
    - Name: Publish to Printify1  
    - Method: POST  
    - URL: `https://api.printify.com/v1/shops/{{ $json.printifyShopId }}/products.json`  
    - Body: JSON with product data including title, description (with quality score and reason), blueprint_id, print_provider_id, variants with prices, and image placement.  
    - Headers:  
      - Authorization: `Bearer {{ $json.printifyApiToken }}`  
      - Content-Type: application/json  
    - Replace Printify placeholders with actual blueprint, print provider, and variant IDs.  
    - Connect Dynamic Pricing Calculator1 output.

14. **Create Airtable Node to Save Product Data**  
    - Name: Save to Product Dashboard1  
    - Operation: Create  
    - Configure base and table (replace placeholders)  
    - Map fields: Date (current ISO time), Price, Title, Status ("Published"), Image_URL, Description, Quality_Score, Quality_Reason, Printify_Product_ID  
    - Connect Publish to Printify1 output.

15. **Add Sticky Notes**  
    - Add three sticky notes with documentation content as per original workflow positions for clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                               | Context or Link                                                                                     |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| This workflow automates print-on-demand merchandising from data collection through publishing, maximizing use of GPT-4o and Replicate AI for creative generation and OpenAI Vision AI for quality control. Dynamic pricing adjusts profit margins based on design quality.                      | Project description and usage overview from Sticky Note1                                          |
| Replace all `YOUR_...` placeholders and Printify/Airtable IDs with actual credentials and IDs before running. Ensure OpenAI API credentials include access to GPT-4o and Vision models.                                                                                                    | Workflow Configuration1 and Publish to Printify1 node comments                                  |
| For Printify publishing, blueprint_id, print_provider_id, and variant IDs must correspond to actual product types and providers in your Printify shop (e.g., Bella+Canvas 3001 t-shirt). Consult Printify API docs for these values.                                                        | Printify API documentation: https://developers.printify.com/                                     |
| Google Trends data is fetched as an RSS feed and may require parsing if used beyond merging with Typeform data. Consider additional parsing or filtering to refine trending topics.                                                                                                        | Google Trends RSS: https://trends.google.com/trends/trendingsearches/daily/rss?geo=US             |
| Airtable base and table must exist, with fields matching the mapped columns for smooth logging. Ensure Airtable API tokens and permissions are configured in n8n credentials.                                                                                                              | Airtable API documentation: https://airtable.com/api                                              |

---

This document provides a thorough understanding of the workflow architecture, node configurations, and integration points, enabling efficient reproduction, modification, and troubleshooting in n8n.