Auto-generate Product Comparison Pages with OpenAI & Google Sheets

https://n8nworkflows.xyz/workflows/auto-generate-product-comparison-pages-with-openai---google-sheets-5843


# Auto-generate Product Comparison Pages with OpenAI & Google Sheets

### 1. Workflow Overview

This workflow automates the generation of product comparison pages for SaaS tools, specifically tailored for eSIM providers, by integrating Google Sheets data with AI-generated content via OpenAI. It dynamically creates all possible product pairs (“Product A vs Product B”) from a single master list, then uses AI to write rich content sections for each comparison page. The final HTML content is assembled and published to a CMS via API.

Logical blocks:

- **1.1 Input Reception & Data Retrieval**  
  Trigger and fetch all necessary product and comparison data from multiple Google Sheets.

- **1.2 Pair Generation**  
  Dynamically generate all unique product comparison pairs with slugs.

- **1.3 AI Content Generation**  
  Use LangChain agents with OpenAI models to create different textual content blocks for each comparison page: introductory overview, comparison tables, activation guides, user ratings summaries, and FAQs.

- **1.4 Data Merging and Assembly**  
  Merge all AI-generated content blocks and spreadsheet data into a single JSON object per comparison.

- **1.5 HTML Construction & Publishing**  
  Construct full HTML pages from merged data and publish them via HTTP POST to the Dorik CMS API.

- **1.6 Memory/Session Handling**  
  Utilize LangChain’s Simple Memory nodes to maintain session context per provider or comparison for better AI consistency.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Data Retrieval

**Overview:**  
This block fetches all raw input data for products, their features, pricing, overviews, and user ratings from designated Google Sheets.

**Nodes involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Products (Google Sheets)  
- Features (Google Sheets)  
- Pricing (Google Sheets)  
- Product Overview (Google Sheets)  
- User Ratings (Google Sheets)

**Node Details:**  

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Initiates the workflow manually for testing or scheduled runs  
  - Config: No parameters  
  - Input: None  
  - Output: Triggers ‘Products’ node  
  - Failures: None expected  

- **Products**  
  - Type: Google Sheets (Read)  
  - Role: Loads product list and triggers downstream content generation  
  - Config: Reads from specific Google Sheet tab with product info  
  - Input: Manual Trigger  
  - Output: Feeds to AI agents and code nodes that generate pairs  
  - Failures: Auth errors, empty sheet, API limits  

- **Features, Pricing, Product Overview, User Ratings**  
  - Type: Google Sheets (Read)  
  - Role: Fetch respective data slices for features, pricing, overviews, and user reviews  
  - Config: Specific sheet tabs with defined data columns  
  - Input: Products node output, generally downstream processing  
  - Output: Feed into merge nodes and AI agents  
  - Failures: Same as Products (auth, rate limits, empty data)  

---

#### 1.2 Pair Generation

**Overview:**  
From the master list of products, this block generates all unique “Product A vs Product B” pairs with SEO-friendly slugs.

**Nodes involved:**  
- Code1 (Code)  
- Names and slugs (Google Sheets append)

**Node Details:**  

- **Code1**  
  - Type: Code (JavaScript)  
  - Role: Extracts product names and computes all unique pairs with lowercase slug URL-safe strings  
  - Key expressions: Iterates over product names, generates pairs, constructs slug by replacing non-alphanumeric chars with hyphens  
  - Input: Products node output  
  - Output: Array of JSON objects with `name`, `slug`, `product1`, `product2`  
  - Failures: Logic errors if product names missing or malformed  

- **Names and slugs**  
  - Type: Google Sheets (Append)  
  - Role: Stores generated pairs back into a Google Sheet for record-keeping and further use  
  - Config: Maps `slug` and `Product Vs. Dynamic` (pair name) columns  
  - Input: Code1 output  
  - Output: Feeds into merge block for final assembly  
  - Failures: Auth errors, API rate limits, data mapping issues  

---

#### 1.3 AI Content Generation

**Overview:**  
This block uses multiple LangChain AI Agent nodes linked to OpenAI Chat models to generate different page content sections for each comparison pair: Intro, Feature Comparison Table, Activation Process, User Ratings Table, and FAQs.

**Nodes involved:**  
- AI Agent (Intro)  
- AI Agent1 (Comparison Table)  
- AI Agent2 (Activation Process)  
- User Ratings Maker (User Ratings Table)  
- AI Agent3 (FAQs)  
- Corresponding OpenAI Chat Model nodes for each agent  
- Simple Memory nodes for session context (Simple Memory, Simple Memory1, Simple Memory2, Simple Memory3, Simple Memory4)

**Node Details:**  

- **AI Agents** (AI Agent, AI Agent1, AI Agent2, User Ratings Maker, AI Agent3)  
  - Type: LangChain Agent nodes  
  - Role: Each prompts OpenAI GPT-4o or GPT-4.1 to generate specific content blocks using contextual JSON data from Google Sheets  
  - Configuration: Custom prompt texts include placeholders for dynamic substitution of features, pricing, user ratings, etc. Ensures output is concise, relevant, and tailored to user intent (e.g., easy reading, informative tone)  
  - Input: Merged or individual JSON inputs from Sheets or prior nodes  
  - Output: JSON with generated text for each content segment  
  - Failures: API request limits, rate-limiting, prompt errors, session context loss  
  - Memory Nodes: Maintain conversation context keyed by provider or comparison pair to improve content consistency  

- **OpenAI Chat Model nodes**  
  - Type: OpenAI GPT-4 or GPT-4o-mini models via LangChain integration  
  - Role: Execute the AI generation requests with specified model and options  
  - Credentials: Requires configured OpenAI API key  
  - Failures: Authentication errors, usage limits, timeout  

---

#### 1.4 Data Merging and Assembly

**Overview:**  
All AI-generated content and base data are merged into a single JSON object per comparison page to prepare for final HTML assembly.

**Nodes involved:**  
- Merge (combines Features, Pricing, Overview data)  
- Merge2 (combines all final sections including AI outputs and pair info)

**Node Details:**  

- **Merge**  
  - Type: Merge (Combine by Position)  
  - Role: Combine multiple inputs representing different data slices (Features, Pricing, Overview) into one  
  - Input: Features, Pricing, Product Overview nodes  
  - Output: Feeds into AI Agent1 (comparison table generation)  
  - Failures: Data misalignment if input lengths differ  

- **Merge2**  
  - Type: Merge (Combine by Position)  
  - Role: Combine the outputs of all AI agents (intro, comparison table, activation, user ratings, FAQs) plus Names and slugs data into a single object per pair  
  - Input: Multiple AI agent outputs, Google Sheets outputs, and Names and slugs node  
  - Output: Feeds to final Code node for HTML assembly  
  - Failures: Input mismatch or missing data causing incomplete merges  

---

#### 1.5 HTML Construction & Publishing

**Overview:**  
Assembles the final HTML page from the merged data and publishes it to the CMS (Dorik) via an authenticated HTTP request.

**Nodes involved:**  
- Code (JavaScript)  
- Dorik CMS (HTTP Request)

**Node Details:**  

- **Code**  
  - Type: Code (JavaScript)  
  - Role: Constructs an HTML string for the full comparison page, including sections for intro, comparison table, activation, user ratings, and FAQs  
  - Logic: Sanitizes input, concatenates HTML sections with semantic tags, wraps content in `<section>` elements for CMS flexibility  
  - Input: Merge2 output JSON  
  - Output: JSON with `name`, `slug`, and `htmlContent` fields for CMS ingestion  
  - Failures: Missing content fields leading to empty sections, XSS risks if inputs not sanitized (though internal usage)  

- **Dorik CMS**  
  - Type: HTTP Request (POST)  
  - Role: Publishes the assembled HTML page to Dorik CMS via API  
  - Config: Sends JSON body with page name, slug, and HTML content; uses HTTP Header Authentication with X-Dorik-Key  
  - Input: Code node output  
  - Output: CMS response with success or failure status  
  - Failures: Authentication errors, API downtime, network issues, malformed payload  

---

#### 1.6 Memory/Session Handling

**Overview:**  
Simple Memory nodes provide session persistence to LangChain agents to maintain context for consistent AI responses per provider or comparison.

**Nodes involved:**  
- Simple Memory (for Intro)  
- Simple Memory1 (for Comparison Table)  
- Simple Memory2 (for Activation Process)  
- Simple Memory3 (for User Ratings)  
- Simple Memory4 (for FAQs)

**Node Details:**  

- **Simple Memory Nodes**  
  - Type: LangChain Memory Buffer Window  
  - Role: Store and recall recent messages or context keyed by session key (usually provider or comparison name)  
  - Configuration: Session keys derived dynamically from JSON attributes (e.g., provider names, comparison titles)  
  - Failures: Loss of session context if not properly keyed, leading to inconsistent AI outputs  

---

### 3. Summary Table

| Node Name             | Node Type                           | Functional Role                       | Input Node(s)                              | Output Node(s)                     | Sticky Note                                                                                   |
|-----------------------|-----------------------------------|------------------------------------|--------------------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                    | Workflow start trigger              | -                                          | Products                          | ## 🕒 STEP 5 – RUN THE WORKFLOW ...                                                          |
| Products              | Google Sheets                     | Load products list                  | When clicking ‘Test workflow’               | AI Agent2, AI Agent3, Code1, Features, Pricing, User Ratings | ## ✅ STEP 1 – GOOGLE SHEET SETUP ...                                                        |
| Features              | Google Sheets                     | Load product features               | Products                                    | Merge                            | Features                                                                                    |
| Pricing               | Google Sheets                     | Load product pricing                | Products                                    | Merge                            | Pricing                                                                                     |
| Product Overview      | Google Sheets                     | Load product overview               | Products                                    | AI Agent, Merge                  | PRODUCT OVERVIEW                                                                           |
| User Ratings          | Google Sheets                     | Load user ratings                   | Products                                    | User Ratings Maker               | User Ratings data                                                                           |
| Code1                 | Code                             | Generate all product pairs          | Products                                    | Product Overview, Names and slugs | ## 🔁 STEP 2 – COMBINE PRODUCTS TO GENERATE “VS” PAIRS ...                                   |
| Names and slugs       | Google Sheets                     | Store pairs with slugs              | Code1                                       | Merge2                           |                                                                                             |
| AI Agent              | LangChain Agent                  | Generate intro paragraph            | Product Overview                            | Google Sheets6                   | Providers & their overview                                                                  |
| OpenAI Chat Model      | OpenAI GPT Model                 | AI model for intro generation       | AI Agent                                    | AI Agent                        |                                                                                             |
| Simple Memory         | LangChain Memory                 | Maintain AI session for intro       | AI Agent                                    | AI Agent                        |                                                                                             |
| Google Sheets6         | Google Sheets                     | Append intro text                   | AI Agent                                    | Merge2                           |                                                                                             |
| Merge                 | Merge                            | Combine feature, pricing, overview  | Features, Pricing, Product Overview         | AI Agent1                       |                                                                                             |
| AI Agent1             | LangChain Agent                  | Generate comparison table           | Merge                                       | Google Sheets7                  | Comparison Table                                                                           |
| OpenAI Chat Model1     | OpenAI GPT Model                 | AI model for comparison table       | AI Agent1                                   | AI Agent1                      |                                                                                             |
| Simple Memory1        | LangChain Memory                 | Maintain AI session for table       | AI Agent1                                   | AI Agent1                      |                                                                                             |
| Google Sheets7         | Google Sheets                     | Append comparison table             | AI Agent1                                   | Merge2                         |                                                                                             |
| AI Agent2             | LangChain Agent                  | Generate activation guide           | Products                                    | Google Sheets8                  | Product activation process                                                                 |
| OpenAI Chat Model2     | OpenAI GPT Model                 | AI model for activation process     | AI Agent2                                   | AI Agent2                      |                                                                                             |
| Simple Memory2        | LangChain Memory                 | Maintain AI session for activation  | AI Agent2                                   | AI Agent2                      |                                                                                             |
| Google Sheets8         | Google Sheets                     | Append activation process           | AI Agent2                                   | Merge2                         |                                                                                             |
| User Ratings Maker     | LangChain Agent                  | Generate user ratings table         | User Ratings                                | OpenAI Chat Model3              | User Ratings                                                                              |
| OpenAI Chat Model3     | OpenAI GPT Model                 | AI model for user ratings           | User Ratings Maker                          | User Ratings Maker             |                                                                                             |
| Simple Memory3        | LangChain Memory                 | Maintain AI session for ratings     | User Ratings Maker                          | User Ratings Maker             |                                                                                             |
| User Ratings           | Google Sheets                     | Append user ratings text            | User Ratings Maker                          | Merge2                         |                                                                                             |
| AI Agent3             | LangChain Agent                  | Generate FAQ section                | Products                                    | Google Sheets1                  | FAQs                                                                                      |
| OpenAI Chat Model4     | OpenAI GPT Model                 | AI model for FAQs                   | AI Agent3                                   | AI Agent3                      |                                                                                             |
| Simple Memory4        | LangChain Memory                 | Maintain AI session for FAQs        | AI Agent3                                   | AI Agent3                      |                                                                                             |
| Google Sheets1         | Google Sheets                     | Append FAQ text                    | AI Agent3                                   | Merge2                         |                                                                                             |
| Merge2                | Merge                            | Combine all content blocks          | Google Sheets1, Google Sheets, Google Sheets6, Google Sheets7, Google Sheets8, Names and slugs | Code                           | Assembling                                                                                |
| Code                  | Code                             | Assemble final HTML page            | Merge2                                       | Dorik CMS                      |                                                                                             |
| Dorik CMS             | HTTP Request                    | Publish final HTML page             | Code                                         | -                              |                                                                                             |
| Sticky Note2          | Sticky Note                     | Visual grouping - Providers overview | -                                          | -                              | Providers & their overview                                                                |
| Sticky Note3          | Sticky Note                     | Visual grouping - Features           | -                                          | -                              | Features                                                                                  |
| Sticky Note4          | Sticky Note                     | Visual grouping - Pricing            | -                                          | -                              | Pricing                                                                                   |
| Sticky Note5          | Sticky Note                     | Visual grouping - Product Comparison pages | -                                          | -                              | Product Comparison pages                                                                  |
| Sticky Note6          | Sticky Note                     | Motivational/placeholder note       | -                                          | -                              | ALL ROADS LEAD TO ROME                                                                   |
| Sticky Note7          | Sticky Note                     | Visual grouping - Comparison Table  | -                                          | -                              | Comparison Table                                                                         |
| Sticky Note8          | Sticky Note                     | Visual grouping - Product activation | -                                          | -                              | Product activation process                                                               |
| Sticky Note9          | Sticky Note                     | Visual grouping - User Ratings       | -                                          | -                              | User Ratings                                                                             |
| Sticky Note10         | Sticky Note                     | Visual grouping - FAQs               | -                                          | -                              | FAQs                                                                                    |
| Sticky Note11         | Sticky Note                     | Visual grouping - Product Overview   | -                                          | -                              | PRODUCT OVERVIEW                                                                        |
| Sticky Note12         | Sticky Note                     | Visual grouping - User Ratings data  | -                                          | -                              | User Ratings data                                                                       |
| Sticky Note13         | Sticky Note                     | Workflow description and intro      | -                                          | -                              | # 🧠 Generate SEO Product Comparisons Using AI & Google Sheets ...                        |
| Sticky Note14         | Sticky Note                     | Visual grouping - Assembling phase  | -                                          | -                              | Assembling                                                                              |
| Sticky Note15         | Sticky Note                     | Setup instructions for Google Sheets | -                                          | -                              | ## ✅ STEP 1 – GOOGLE SHEET SETUP ...                                                    |
| Sticky Note16         | Sticky Note                     | Explanation for product pairs generation | -                                          | -                              | ## 🔁 STEP 2 – COMBINE PRODUCTS TO GENERATE “VS” PAIRS ...                               |
| Sticky Note17         | Sticky Note                     | Explanation for AI content generation | -                                          | -                              | ## 💬 STEP 3 – GENERATE CONTENT USING AI ...                                            |
| Sticky Note           | Sticky Note                     | Explanation for final build and publish | -                                          | -                              | ## 🧱 STEP 4 – BUILD FINAL HTML & PUBLISH ...                                            |
| Sticky Note1          | Sticky Note                     | Explanation for running the workflow | -                                          | -                              | ## 🕒 STEP 5 – RUN THE WORKFLOW ...                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node** named `When clicking ‘Test workflow’` to start the workflow manually.

2. **Set up Google Sheets nodes to read data:**

   - `Products`: Reads the master product list from a Google Sheet tab named "Products". Configure OAuth2 credentials for Google Sheets API.  
   - `Features`: Reads features data from the "Features Data" sheet.  
   - `Pricing`: Reads pricing data from "Product Pricing" sheet.  
   - `Product Overview`: Reads product overview blurbs from "Product Overview" sheet.  
   - `User Ratings`: Reads summary of user reviews from "Product User Reviews" sheet.  

3. **Add a Code node `Code1`** to generate all unique product pairs:

   - Use JavaScript to iterate through the "All Products" column in the input and create pairs with slugs (e.g., `product1 vs product2` and slug `product1-vs-product2`).  
   - Output JSON array with `name`, `slug`, `product1`, and `product2`.

4. **Add a Google Sheets node `Names and slugs`** to append these pairs back to a dedicated sheet for product pairs.

5. **Create LangChain AI Agent nodes** for each content section:

   - `AI Agent` for Intro paragraph generation, configured with a prompt that includes the overview and instructs the AI to write an engaging, simple introduction mentioning product strengths.  
   - `AI Agent1` for Comparison Table, taking features and pricing data, producing a clear table comparing products.  
   - `AI Agent2` for Activation Process paragraph, describing product activation steps.  
   - `User Ratings Maker` for User Ratings table, summarizing user sentiment data in an easy-to-read table.  
   - `AI Agent3` for FAQ section, creating FAQs with a bias towards Truely if present.

6. **Connect each AI Agent to an OpenAI Chat Model node** (GPT-4o or GPT-4.1), providing the model and credentials for OpenAI API access.

7. **Add Simple Memory nodes** for each LangChain agent to maintain session context keyed by relevant identifiers (provider or comparison pair).

8. **Add Google Sheets nodes** to append each AI-generated content section (Intro, Comparison Table, Activation, User Ratings, FAQs) back to the master Google Sheet.

9. **Use Merge nodes:**

   - `Merge` to combine Features, Pricing, and Product Overview data before feeding AI Agent1.  
   - `Merge2` to combine all final data streams — AI outputs and pair metadata — into a single JSON object per product pair.

10. **Add a Code node `Code`** to assemble the final HTML content:

    - Build an HTML string with `<h1>` for the title and `<section>` tags for each content block (Intro, Comparison Table, Activation, User Ratings, FAQs).  
    - Output a JSON object containing `name`, `slug`, and `htmlContent`.

11. **Add an HTTP Request node `Dorik CMS`** to publish the assembled HTML to the CMS:

    - Configure a POST request to the CMS API endpoint.  
    - Use HTTP Header Authentication with the provided API key header `X-Dorik-Key`.  
    - Send the JSON body including `name`, `slug`, and `htmlContent`.

12. **Link nodes in the correct execution order:**

    - Manual Trigger → Products → (Features, Pricing, Product Overview, User Ratings) → Code1 → Names and slugs → Merge & AI Agents → Google Sheets append nodes → Merge2 → Code → Dorik CMS.

13. **Set credentials:**

    - Google Sheets OAuth2 credentials for reading/writing sheets.  
    - OpenAI API key credentials for AI generation.  
    - HTTP Header Auth credentials for CMS publishing.

14. **Test the workflow** by running manually, ensure all nodes execute successfully and content appears in Google Sheets and CMS.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                  | Context or Link                                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| This workflow enables fully automated SEO product comparison page creation using AI and Google Sheets as a control panel.                                                                        | Sticky Note13: # 🧠 Generate SEO Product Comparisons Using AI & Google Sheets                                        |
| The Google Sheet must be structured with columns: All Products, Product Overview, Features Data, Product Pricing, Product User Reviews.                                                          | Sticky Note15: ## ✅ STEP 1 – GOOGLE SHEET SETUP                                                                     |
| The system automatically creates 2-product comparison pairs from the master product list, no manual pairing needed.                                                                             | Sticky Note16: ## 🔁 STEP 2 – COMBINE PRODUCTS TO GENERATE “VS” PAIRS                                                |
| Content sections generated by AI include Intro, Comparison Table, Pricing Summary, Activation Guide, User Ratings, and FAQs, written in an easy and neutral tone.                               | Sticky Note17: ## 💬 STEP 3 – GENERATE CONTENT USING AI                                                              |
| Final HTML is assembled and published via API to the Dorik CMS, allowing for seamless integration and immediate page deployment.                                                               | Sticky Note: ## 🧱 STEP 4 – BUILD FINAL HTML & PUBLISH                                                               |
| The workflow supports manual or scheduled triggering for flexible operation.                                                                                                                     | Sticky Note1: ## 🕒 STEP 5 – RUN THE WORKFLOW                                                                         |
| OpenAI GPT-4o-mini is used as the primary model; ensure API keys have adequate quota and permissions.                                                                                           | OpenAI Chat Model nodes configuration                                                                                 |
| Google Sheets API credentials must have read/write access to all relevant sheets.                                                                                                                | Google Sheets nodes configuration                                                                                      |
| Dorik CMS API key must be valid with permission to create collection items.                                                                                                                     | HTTP Request node configuration                                                                                        |

---

This documentation comprehensively describes the workflow's structure, logic, and node configurations, enabling efficient understanding, reproduction, and maintenance of the automated product comparison page generation system.