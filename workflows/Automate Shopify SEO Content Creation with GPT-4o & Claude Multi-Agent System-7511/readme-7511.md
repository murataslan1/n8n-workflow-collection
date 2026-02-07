Automate Shopify SEO Content Creation with GPT-4o & Claude Multi-Agent System

https://n8nworkflows.xyz/workflows/automate-shopify-seo-content-creation-with-gpt-4o---claude-multi-agent-system-7511


# Automate Shopify SEO Content Creation with GPT-4o & Claude Multi-Agent System

### 1. Workflow Overview

This workflow automates the creation and updating of SEO-optimized content for Shopify products using a multi-agent AI system integrating GPT-4o, Claude, and other AI tools. It targets Shopify merchants, particularly in the French ecommerce supplement market, aiming to generate compliant, high-quality product descriptions, meta fields, and SEO meta descriptions. The workflow orchestrates data retrieval from Shopify and Airtable, performs deep AI-driven content generation and compliance checks, and updates Shopify product listings and Airtable records to track progress.

The workflow consists of the following logical blocks:

- **1.1 Trigger & Initial Data Retrieval:** Receives user input via form and fetches product data from Airtable and Shopify.
- **1.2 Title Optimization Branch:** Optionally updates product titles by appending vendor names.
- **1.3 Orchestrator Agent:** Central AI agent directing workflow steps based on selected content types.
- **1.4 Premium Keyword Discovery:** AI-assisted market and keyword research via Haloscan and Perplexity.
- **1.5 SEO Compliance Checking:** Ensures keyword selection avoids domain cannibalization.
- **1.6 Content Generation Agents:**
  - Product Description Agent: Produces SEO-optimized product descriptions.
  - Meta Fields Agent: Creates detailed structured metafields.
  - SEO Fields Agent: Generates SEO meta descriptions.
- **1.7 Shopify & Airtable Updates:** Updates Shopify product entries and Airtable status fields.
- **1.8 HTML to Shopify Rich Text Processing:** Converts generated HTML content into Shopify-compatible rich text format.
- **1.9 Parallel Uploads to Shopify:** Uploads multiple metafields simultaneously via GraphQL.
- **1.10 Completion & Logging:** Marks records as completed and logs workflow status.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Initial Data Retrieval

**Overview:**  
Starts when a user submits a form selecting a content type (description, meta, or SEO) and retrieves corresponding product data from Airtable and Shopify.

**Nodes Involved:**  
- `On form submission` (Form Trigger)  
- `Search records` (Airtable Search - multiple variants)  
- `Get product(s)` (Shopify Get Product nodes)  
- `Create record` (Airtable record creation for new entries)

**Node Details:**  
- **On form submission:**  
  - Triggers on form submission with a required dropdown field `content type` specifying tasks like `create_product_description`.  
  - Responds with "Wait for execution" to user.  
  - Possible failure: webhook call timeout or invalid form data.

- **Search records (Airtable):**  
  - Queries Airtable product tables filtering by `Handle` and status flags (`title_updated`, etc.).  
  - Returns product records for processing.  
  - Edge cases: No matching records, API rate limits, authentication failures.

- **Get product (Shopify):**  
  - Fetches full product details (ID, title, vendor, handle, HTML body, etc.) using Shopify API with OAuth credentials.  
  - Key parameters: `productId` from Airtable or trigger.  
  - Edge cases: invalid product IDs, API rate limits.

- **Create record (Airtable):**  
  - Adds products to tracking Airtable tables when new products arrive.  
  - Error handling for duplicate records or API errors.

---

#### 1.2 Title Optimization Branch

**Overview:**  
Updates Shopify product titles by appending vendor names and marks records as updated in Airtable.

**Nodes Involved:**  
- `Edit Fields` (Set node for title modification)  
- `Update product` (Shopify update API)  
- `Search records` (Airtable to find un-updated titles)  
- `Update record` (Airtable to mark title updated)

**Node Details:**  
- **Edit Fields:**  
  - Builds new title string combining original title and vendor, e.g., `"Original Title - Vendor"`.  
  - Uses expressions referencing prior node data.

- **Update product:**  
  - Sends updated title to Shopify via API.  
  - Requires OAuth credentials for Shopify.  
  - Handles API errors and retries.

- **Search records:**  
  - Finds Airtable records with `title_updated = 'no'` for processing.

- **Update record:**  
  - Sets `title_updated` flag to 'yes' in Airtable.  
  - Ensures product tracking consistency.

---

#### 1.3 Orchestrator Agent

**Overview:**  
Central AI agent that, based on the product data and user-selected rules, directs downstream agents to perform keyword research, compliance checks, content generation, and updates.

**Nodes Involved:**  
- `Orchestrator` (AI Agent)  
- Connections to Premium Keyword Discovery, SEO Compliance Checker, Product Description, Meta Fields, and SEO Fields agents.

**Node Details:**  
- **Orchestrator:**  
  - Receives structured product data (`id`, `title`, `body_html`, `vendor`, `handle`, etc.) and task rules (`create_product_description`, etc.) from prior nodes.  
  - Contains a detailed system prompt describing operational logic and instructions for task sequencing.  
  - Based on rules, calls sub-agents sequentially:  
    - Premium Keyword Discovery → SEO Compliance Checker → Product Description → Shopify Update → Airtable update for descriptions.  
    - Similarly for meta and SEO fields.  
  - Handles errors, retries, and logging.  
  - Requires AI credentials (`OpenRouter`, `Anthropic`) and integration with memory nodes.

---

#### 1.4 Premium Keyword Discovery

**Overview:**  
AI agent performing keyword research using Haloscan API and Perplexity AI for market intelligence.

**Nodes Involved:**  
- `Premium Keyword Discovery` (AI Agent)  
- `keyword_overview` (HTTP Request to Haloscan API)  
- `Message a model in Perplexity` (AI search and summarization tool)  
- `Structured Output Parser` (JSON output validation)

**Node Details:**  
- **Premium Keyword Discovery:**  
  - Constructs payload with product title as keyword for Haloscan API.  
  - From Haloscan response, extracts top 3 entries per field (`metrics`, `keyword_match`, `similar_highlight`, etc.).  
  - Calls Perplexity once to get up-to-date SEO trends and buyer behavior in French market.  
  - Outputs JSON with research data and textual summary.

- **keyword_overview:**  
  - Posts JSON to Haloscan endpoint with API key credential.  
  - Handles rate limits and API errors.

- **Message a model in Perplexity:**  
  - Sends prompt combining keywords for market intelligence.

- **Structured Output Parser:**  
  - Ensures valid JSON output and error handling.

---

#### 1.5 SEO Compliance Checking

**Overview:**  
Checks keyword overlap to avoid cannibalization using Haloscan serp-compare API and returns a refined SEO strategy.

**Nodes Involved:**  
- `Seo Compliance Checker` (AI Agent)  
- `serp_overlap` (HTTP Request to Haloscan serp-compare API)  
- `Message a model in Perplexity` (AI processing)  
- `Structured Output Parser` (JSON validation)

**Node Details:**  
- Detects input type (Premium Keyword Discovery JSON or text) and routes accordingly.  
- For premium keyword input: calls serp-compare API for each candidate keyword to assess overlap with domain rankings.  
- Filters out keywords ranking for existing products to prevent cannibalization.  
- Selects optimal keywords and formulates SEO content strategy with Perplexity.  
- Updates Airtable with filtered shortlisted keywords.  
- Returns textual SEO strategy to Orchestrator.

---

#### 1.6 Content Generation Agents

**Overview:**  
AI-powered agents generate target content based on research and SEO strategy:

- **Product Description Agent:** generates detailed, compliant, and SEO-optimized French product descriptions in Shopify HTML format.  
- **Meta Fields Agent:** creates six distinct metafields (ingredients, recommendations, nutritional values, warnings, short description, arguments) with strict formatting and compliance.  
- **SEO Fields Agent:** produces meta descriptions optimized for Google SERP in French.

**Nodes Involved:**  
- `Product Description` (AI Agent)  
- `Meta Fields` (AI Agent)  
- `Seo Fields` (AI Agent)  
- `Message a model in Perplexity` (optional, for fact checking)  
- `Simple Memory` nodes (context preservation)  
- `Airtable` nodes for data fetch and update

**Node Details:**  
- Agents receive inputs including product data, SEO instructions, research outputs, and shortlisted keywords.  
- Each agent uses detailed system prompts enforcing editorial rules, forbidden terms, content structure (e.g., headline rules, HTML tags allowed), and compliance policies (e.g., no unverified claims).  
- Product Description agent emphasizes verified facts and compliance with French regulations.  
- Meta Fields agent produces multiple metafields with appropriate HTML tags and tokenized highlights.  
- Seo Fields agent follows strict length and formatting constraints for meta descriptions.  
- Agents interface with memory nodes to retain context across messages.  
- Output is clean HTML, JSON or structured text for downstream processing.

---

#### 1.7 Shopify & Airtable Updates

**Overview:**  
Updates Shopify product data (descriptions, meta fields, SEO fields) and marks records as completed in Airtable.

**Nodes Involved:**  
- `Update product` (Shopify update API)  
- `Airtable` update nodes (`Airtable_product_description`, `Airtable_product_meta`, `Airtable_product_seo`)  
- `meta`, `meta_description` (Sub-workflow calls for content upload)  
- `Http Request` nodes for Shopify GraphQL mutations

**Node Details:**  
- Updates product HTML description field using Shopify API.  
- Updates Airtable fields such as `product_description_created = 'yes'`.  
- Uses GraphQL mutations to upload metafields in Shopify.  
- Handles bulk or parallel updates for metafields.  
- Manages API credentials and error handling.  
- Airtable updates ensure process tracking and prevent reprocessing.

---

#### 1.8 HTML to Shopify Rich Text Processing

**Overview:**  
Converts HTML content generated by AI into Shopify-compatible rich text JSON structure.

**Nodes Involved:**  
- `Html generator_meta_parser` (AI agent to split metafield JSON)  
- `Code` nodes (multiple variants) running JavaScript to parse HTML and convert to Shopify rich text JSON.  
- `Structured Output Parser` nodes to validate output.

**Node Details:**  
- JavaScript code aggressively preprocesses HTML: removes unwanted tags, fixes broken paragraphs, eliminates redundant `<p></p>` tags.  
- Parses inline elements (`<strong>`, `<b>`, `<em>`, `<i>`, `<a>`) and maintains formatting.  
- Parses block elements (`<p>`, `<ul>`, `<ol>`, `<li>`, `<h1>`-`<h6>`) into structured nodes.  
- Ensures no malformed or incomplete tags remain.  
- Outputs JSON object representing rich text structure compatible with Shopify.  
- Multiple code nodes handle different metafields in parallel.

---

#### 1.9 Parallel Uploads to Shopify

**Overview:**  
Uploads individual metafields (ingredients, recommendations, nutritional values, warnings, short description, arguments) to Shopify product records.

**Nodes Involved:**  
- `Http Request` nodes calling Shopify GraphQL API for each metafield (e.g., `ingredients`, `recommandations`, `avertissement`, etc.)

**Node Details:**  
- Each node performs a GraphQL mutation to set a specific metafield on a product identified by GraphQL ID.  
- Receives Shopify product ID from prior nodes.  
- Requires Shopify OAuth credential.  
- Implements error handling and validation of mutation success.

---

#### 1.10 Completion & Logging

**Overview:**  
Marks product processing tasks as completed in Airtable and handles workflow control flow.

**Nodes Involved:**  
- `Airtable` update nodes for flags like `product_description_created`, `product_meta_created`, `product_seo_created`.  
- Conditional logic in Orchestrator to decide next steps or end.

**Node Details:**  
- Updates Airtable records to reflect completed tasks, preventing duplicate processing.  
- Ensures proper workflow termination or continuation for batch processing.  
- Logs errors and retries as needed.

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                                       | Input Node(s)                           | Output Node(s)                        | Sticky Note                                                                                  |
|-------------------------------|----------------------------------|------------------------------------------------------|---------------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------|
| On form submission             | Form Trigger                     | Triggers workflow on form submission                  | —                                     | Search records (Airtable)            |                                                                                              |
| Search records                | Airtable Search                  | Fetches product records to process                    | On form submission                    | Edit Fields                         |                                                                                              |
| Edit Fields                   | Set                             | Modifies product title                                | Search records                       | Update product                      |                                                                                              |
| Update product                | Shopify Update                  | Updates product title on Shopify                       | Edit Fields                         | Search records / Orchestrator        |                                                                                              |
| Search records (Airtable)     | Airtable Search                 | Retrieves product data for AI agents                   | On form submission                   | Get product                        |                                                                                              |
| Get product                  | Shopify Get Product             | Fetches detailed product info                          | Search records                      | Orchestrator                      |                                                                                              |
| Orchestrator                 | AI Agent                       | Central orchestrator directing downstream tasks       | Get product                        | Premium Keyword Discovery, SEO Compliance Checker, Product Description, Meta Fields, SEO Fields | See system prompt for detailed operational logic                                              |
| Premium Keyword Discovery     | AI Agent                       | Performs keyword research and market intelligence      | Orchestrator                      | SEO Compliance Checker             |                                                                                              |
| keyword_overview             | HTTP Request                   | Calls Haloscan API for keyword overview                 | Premium Keyword Discovery          | Premium Keyword Discovery          | Requires Haloscan API key credential                                                         |
| Message a model in Perplexity | AI Tool                        | Performs AI search and summarization                    | Premium Keyword Discovery          | Premium Keyword Discovery          |                                                                                              |
| Structured Output Parser      | AI Parser                      | Parses and validates JSON output                         | Premium Keyword Discovery          | Orchestrator                      |                                                                                              |
| Seo Compliance Checker        | AI Agent                       | Checks keyword overlap and prevents cannibalization     | Premium Keyword Discovery          | Orchestrator                      |                                                                                              |
| serp_overlap                 | HTTP Request                   | Calls Haloscan serp-compare API                         | Seo Compliance Checker             | Seo Compliance Checker             |                                                                                              |
| Message a model in Perplexity | AI Tool                        | Generates SEO strategy text                              | Seo Compliance Checker             | Orchestrator                      |                                                                                              |
| Product Description          | AI Agent                       | Generates SEO-optimized product description            | Orchestrator                      | Update product, Airtable update     | Detailed editorial and compliance rules                                                     |
| Meta Fields                 | AI Agent                       | Creates detailed product metafields                      | Orchestrator                      | Airtable update                    | Strict HTML formatting and compliance                                                       |
| Seo Fields                  | AI Agent                       | Generates SEO meta description                           | Orchestrator                      | Airtable update                    | Strict length and SEO rules                                                                 |
| Airtable updates (desc, meta, seo) | Airtable Update             | Marks content creation steps as completed               | Content Agents                    | Orchestrator                      |                                                                                              |
| Html generator_meta_parser   | AI Agent                       | Parses metafield JSON and prepares HTML for Shopify    | Content Agents                   | Code processors                    |                                                                                              |
| Code (multiple)              | Code                           | Converts HTML to Shopify rich text JSON                 | Html generator_meta_parser       | Http Request (Shopify GraphQL)     | JavaScript with aggressive cleaning and parsing                                             |
| Http Request (Shopify GraphQL) (multiple) | HTTP Request             | Uploads metafields to Shopify product                   | Code processors                  | —                                   | Parallel uploads for each metafield                                                         |
| Airtable (various)           | Airtable Search/Update          | Data retrieval and status updates                        | Various                         | Various                          |                                                                                              |
| Structured Output Parser (various) | AI Parser                  | Validates AI-generated JSON output                       | AI Agents                      | Next nodes                       |                                                                                              |
| MCP Nodes (Premium Keyword Discovery, Airtable, SEO Compliance) | MCP Client/Trigger           | Integrates with external AI microservices               | Orchestrator                    | Orchestrator                      | Requires external MCP API endpoints                                                        |
| Sticky Notes                 | Sticky Note                    | Documentation and comments                              | —                               | —                                   | Multiple notes explaining blocks and process flows                                         |

---

### 4. Reproducing the Workflow Step-by-Step

**Prerequisites:**  
- Set up OAuth credentials for Shopify with appropriate permissions.  
- Set up Airtable OAuth credentials with access to relevant bases and tables.  
- Obtain Haloscan API key and Perplexity API credentials.  
- Configure OpenRouter and Anthropic (Claude) AI credentials in n8n.

---

**Step 1: Create Trigger and Initial Data Fetch**

1. Add a **Form Trigger** node named `On form submission` with a dropdown field `content type` having options:  
   - `create_product_description`  
   - `create_product_meta`  
   - `create_product_seo`

2. Connect to an **Airtable Search** node (`Search records`) that queries the product tracking table filtering by `Handle` and task status flags (`title_updated`, etc.).

3. Add a **Shopify Get Product** node (`Get product`) that fetches product details using product ID from Airtable.

---

**Step 2: Title Optimization Branch**

4. Add a **Set** node (`Edit Fields`) to create a new title by concatenating original title and vendor.

5. Add a **Shopify Update Product** node (`Update product`) to update the product title.

6. Add an **Airtable Update** node to set `title_updated` to 'yes' for the product record.

---

**Step 3: Orchestrator Agent**

7. Add a **LangChain AI Agent** node (`Orchestrator`) with a detailed system prompt to direct workflow steps based on the form input `rule`.

8. Configure it to receive product data and rules, and based on rules, call sub-agents in sequence.

---

**Step 4: Premium Keyword Discovery**

9. Add an **AI Agent** node (`Premium Keyword Discovery`) that prepares a Haloscan API payload with the product title.

10. Add an **HTTP Request** node (`keyword_overview`) to call Haloscan's `/keywords/overview` API.

11. Add a **Perplexity AI Tool** node (`Message a model in Perplexity`) to perform market intelligence search.

12. Add a **JSON Parser** node (`Structured Output Parser`) to validate Haloscan and Perplexity outputs.

---

**Step 5: SEO Compliance Checker**

13. Add an **AI Agent** node (`Seo Compliance Checker`) that processes Premium Keyword Discovery JSON.

14. Add an **HTTP Request** node (`serp_overlap`) to call Haloscan’s `/keywords/serp-compare` API per keyword.

15. Add a **Perplexity AI Tool** node (`Message a model in Perplexity`) for SEO strategy generation.

16. Add a **JSON Parser** node (`Structured Output Parser`) to parse SEO strategy output.

---

**Step 6: Content Generation Agents**

17. Add AI Agent nodes for:  
    - `Product Description` with strict editorial and compliance prompts.  
    - `Meta Fields` generating six detailed metafields.  
    - `Seo Fields` generating meta description.

18. Connect each agent to memory nodes (`Simple Memory`) to maintain context.

---

**Step 7: Shopify & Airtable Updates**

19. Add **Shopify Update** nodes to upload content:  
    - `Update product` for descriptions.  
    - GraphQL mutation HTTP Request nodes for metafields uploads.

20. Add **Airtable Update** nodes to mark tasks as completed (`product_description_created`, etc.).

---

**Step 8: HTML to Shopify Rich Text Conversion**

21. Add AI Agent (`Html generator_meta_parser`) to extract and prepare metafield JSON.

22. Add multiple **Code** nodes running JavaScript to parse and convert HTML to Shopify rich text JSON.

23. Add **Structured Output Parser** nodes to validate parsed output.

---

**Step 9: Parallel Metafield Uploads**

24. Add multiple **HTTP Request** nodes for Shopify GraphQL API to upload each metafield (ingredients, recommendations, nutritional values, warnings, short description, arguments).

25. Configure each with product GraphQL ID from previous steps.

---

**Step 10: Finalization**

26. Add Airtable update nodes to mark meta and SEO creation done.

27. Ensure proper error handling and retries in all nodes handling external APIs.

28. Optionally add logging or notification nodes for success/failure.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                        |
|----------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| Use Haloscan API key with proper authentication and rate limit handling.                                 | https://haloscan.com/api-docs                          |
| Perplexity AI tool used for French market-specific SEO research and content validation.                   | https://www.perplexity.ai/                             |
| Editorial rules strictly enforce no invention, verified facts only, forbidden terms, and compliance.     | See system prompts in Orchestrator and Product Description agents |
| Shopify rich text JSON format conversion is crucial to prevent rendering errors in Shopify themes.       | Shopify developer docs on rich text and metafields    |
| Airtable base and table schemas must match field names used in the workflow for seamless data flow.      | https://airtable.com/api                                |
| Workflow is designed for French ecommerce supplement segment with compliance to local regulations.       | Internal company policy and French regulatory standards |
| Use of OpenRouter (GPT-4o) and Anthropic Claude models for content generation and parsing.               | OpenRouter and Anthropic developer portals             |
| Memory nodes maintain conversation context for multi-step AI calls.                                      | https://docs.n8n.io/integrations/agents/langchain/    |
| MCP (Micro-Client Platform) nodes integrate external AI microservices.                                  | Internal MCP API documentation                          |
| Sticky notes in workflow provide detailed documentation for block-level understanding and compliance tips.| Embedded within workflow for developer reference       |

---

**Disclaimer:** This documentation is based solely on the provided n8n workflow JSON and adheres to all applicable policies and legality. All data handled is publicly accessible and compliant with regulations.

# End of Document