Automate Blog & LinkedIn Content Creation with OpenAI & Replicate AI Images

https://n8nworkflows.xyz/workflows/automate-blog---linkedin-content-creation-with-openai---replicate-ai-images-8083


# Automate Blog & LinkedIn Content Creation with OpenAI & Replicate AI Images

### 1. Workflow Overview

This workflow automates the creation and publishing of blog articles and LinkedIn posts by leveraging Notion for content ideas, OpenAI for content generation, and Replicate AI for image creation. It targets content creators, marketers, or technical professionals who want to streamline content production and publishing with minimal manual intervention.

**Logical Blocks:**

- **1.1 Initialization & Data Collection:**  
  Scheduled trigger initiates the workflow daily. It sets configuration variables, queries Notion for unpublished blog ideas, filters and cleans the data, and counts eligible ideas.

- **1.2 Content Processing & AI Generation:**  
  Processes each eligible idea individually, normalizes data for AI prompts, requests OpenAI to generate polished blog and LinkedIn content, and validates the AI output for quality and format.

- **1.3 Content Storage & Publish Decision:**  
  Saves AI-generated content to a Notion Articles database. Depending on the configuration, it decides whether to automatically publish the LinkedIn post or send a draft for review.

- **1.4 Publishing & Completion:**  
  For auto-publish, generates an AI image prompt, creates the image via Replicate AI, posts content to LinkedIn with the image, sends confirmation emails, and updates the status as Published. For drafts, sends draft emails for review and updates the status accordingly.

- **1.5 Error Handling:**  
  Captures and reports any workflow errors via email to ensure prompt notification and troubleshooting.

---

### 2. Block-by-Block Analysis

#### 1.1 Initialization & Data Collection

- **Overview:**  
  This block triggers the workflow on a schedule, sets necessary configuration parameters, queries the Notion database for unpublished blog ideas, filters and maps the data to a usable format, then counts how many ideas are eligible for processing.

- **Nodes Involved:**  
  - Cron (Schedule)  
  - Set (Configs)  
  - Notion → Query Ideas DB (all)  
  - Filter Unpublished + Map  
  - Count Eligible  
  - IF (Has Eligible?)  
  - Send a message (No eligible ideas email)  

- **Node Details:**

  - **Cron (Schedule):**  
    - Type: Trigger node  
    - Configured to trigger daily at 19:00 (7 PM) local time.  
    - Output: Triggers the workflow start.  
    - Failure modes: Scheduling errors are rare but possible if system time incorrect.

  - **Set (Configs):**  
    - Type: Set node  
    - Sets key configuration variables like Notion Database ID, LinkedIn URN, OpenAI model, and email address.  
    - Output: Provides these configs downstream for dynamic referencing.  
    - Edge cases: Missing or incorrect IDs cause failures in downstream API calls.

  - **Notion → Query Ideas DB (all):**  
    - Type: Notion node  
    - Queries all pages in the specified Notion database where the "published" checkbox is false (unpublished ideas).  
    - Sorted by creation time ascending.  
    - Requires Notion API credentials.  
    - Potential failures: API auth errors, rate limits, or invalid DB ID.

  - **Filter Unpublished + Map:**  
    - Type: Code node  
    - Filters out any published ideas just in case, extracts and safely maps properties (title, angle, tags, links, language, slug, etc.) into a simplified JSON structure.  
    - Handles multiple Notion property types robustly.  
    - Output: Cleaned list of unpublished ideas.  
    - Edge cases: Unexpected or missing properties are handled gracefully; no crash expected.

  - **Count Eligible:**  
    - Type: Code node  
    - Counts number of unpublished ideas returned to determine if workflow should proceed.  
    - Output: Single JSON with eligible_count property.

  - **IF (Has Eligible?):**  
    - Type: If node  
    - Checks if eligible_count > 0 to branch workflow.  
    - If false: triggers "Send a message" node to notify no eligible ideas found.

  - **Send a message:**  
    - Type: Gmail node  
    - Sends an email notifying that no unpublished blog ideas were found in the Notion DB at the current timestamp.  
    - Uses email address from config.  
    - Edge cases: Email sending failures due to auth or service outages.

---

#### 1.2 Content Processing & AI Generation

- **Overview:**  
  This block takes each unpublished idea one by one, normalizes data arrays, sends a detailed prompt to OpenAI to generate a blog article and LinkedIn post, then parses and validates the AI output for correctness.

- **Nodes Involved:**  
  - Split In Batches (1)  
  - Normalize Arrays  
  - Content Creator (OpenAI)  
  - Parse & Validate JSON  

- **Node Details:**

  - **Split In Batches (1):**  
    - Type: SplitInBatches node  
    - Processes ideas one at a time (batch size = 1) to avoid API overload and handle per-item logic.  
    - Input: Cleaned unpublished ideas array.  
    - Output: Single idea per batch.

  - **Normalize Arrays:**  
    - Type: Code node  
    - Converts certain fields (tags, reference_links, images, keywords) into consistent arrays regardless of input format.  
    - Merges global config variables to each item for downstream use.  
    - Essential to ensure AI prompt receives data in expected format.

  - **Content Creator (OpenAI):**  
    - Type: OpenAI node (LangChain integration)  
    - Uses GPT-5-mini model (or GPT-4.1-mini for image prompt) to generate:  
      - A polished blog post in Markdown format with SEO metadata.  
      - LinkedIn post text optimized for engagement and character limits.  
    - Prompt includes detailed instructions about style, language, length, and output schema.  
    - AI output is JSON embedded in message content.  
    - Edge cases: API errors, rate limits, or malformed responses.

  - **Parse & Validate JSON:**  
    - Type: Code node  
    - Parses OpenAI output, including repairing common JSON formatting issues (e.g. code fences, special quotes).  
    - Validates mandatory fields in the blog and LinkedIn content (title, slug, markdown, final_text).  
    - Enforces character limits and truncation for LinkedIn posts.  
    - Captures safety flags as warnings rather than errors.  
    - Throws error if critical fields are missing or invalid, causing error workflow to trigger.

---

#### 1.3 Content Storage & Publish Decision

- **Overview:**  
  Stores the generated content into a Notion Articles database, then branches the workflow depending on whether LinkedIn auto-publish is enabled or if the content should be sent as a draft email for manual review.

- **Nodes Involved:**  
  - Create a Article Database Page  
  - If LinkedIn Published Check  
  - Draft Email  
  - Draft Update Database  

- **Node Details:**

  - **Create a Article Database Page:**  
    - Type: Notion node  
    - Creates a new page in the Articles database with the blog and LinkedIn content properties populated from AI output.  
    - Sets status to "Published" by default and records publish date/time.  
    - Adds relation to source idea page.  
    - Edge cases: API limits, duplicate slugs, or invalid property values.

  - **If LinkedIn Published Check:**  
    - Type: If node  
    - Checks the boolean config LINKEDIN_PUBLISH.  
    - If true → continues to image generation and publishing.  
    - If false → sends draft email for review.

  - **Draft Email:**  
    - Type: Gmail node  
    - Sends an email to configured address with LinkedIn draft content and title for review.  
    - Email body includes basic content for quick manual copy-paste or edits.  
    - Edge cases: Email service failures.

  - **Draft Update Database:**  
    - Type: Notion node  
    - Updates the newly created Article page status to "Draft" to mark that it is not yet published.  
    - Helps track content lifecycle.

---

#### 1.4 Publishing & Completion

- **Overview:**  
  For auto-publish scenarios, this block generates an image prompt, creates a related image using Replicate AI, downloads the image, posts the combined content and image to LinkedIn, sends a published confirmation email, and updates the Notion page status to Published.

- **Nodes Involved:**  
  - Image prompt generator (OpenAI)  
  - Replicate Image Prediction  
  - Download Image  
  - Create a post (LinkedIn)  
  - Published Email  
  - Update a database page (Set as Published)  

- **Node Details:**

  - **Image prompt generator:**  
    - Type: OpenAI node  
    - Generates a photorealistic image prompt based on blog title, excerpt, LinkedIn draft, alt text, and keywords.  
    - Uses GPT-4.1-mini model with strict rules to exclude logos, text, faces, or brand names.  
    - Output is a single clean prompt for Replicate.

  - **Replicate Image Prediction:**  
    - Type: HTTP Request node  
    - Calls Replicate API with the generated prompt for the model "black-forest-labs/flux-schnell".  
    - Uses bearer token auth.  
    - Waits for completion to get image URL.  
    - Edge cases: API rate limits, network errors, or invalid prompts.

  - **Download Image:**  
    - Type: HTTP Request node  
    - Downloads the image from the URL returned by Replicate for use in LinkedIn post.  
    - Output: Binary image data.

  - **Create a post (LinkedIn):**  
    - Type: LinkedIn node  
    - Posts the LinkedIn text and attached image to the configured LinkedIn person account.  
    - Sets visibility as public and includes title metadata.  
    - Edge cases: LinkedIn API auth failures or content moderation blocks.

  - **Published Email:**  
    - Type: Gmail node  
    - Sends notification email confirming successful LinkedIn post publishing.  
    - Includes blog title, slug, and Notion idea page ID.

  - **Update a database page (Set as Published):**  
    - Type: Notion node  
    - Updates the Articles page status to "Published".  
    - Ensures accurate content lifecycle tracking.

---

#### 1.5 Error Handling

- **Overview:**  
  Catches any node failure during the workflow execution and sends a detailed error report email to the configured address for quick troubleshooting.

- **Nodes Involved:**  
  - Error Trigger (Any Node Fails)  
  - Failure Message  

- **Node Details:**

  - **Error Trigger (Any Node Fails):**  
    - Type: Error Trigger node  
    - Listens for any failure in downstream nodes.  
    - On trigger, passes error details to Failure Message node.

  - **Failure Message:**  
    - Type: Gmail node  
    - Sends an email containing:  
      - Name of the node that failed  
      - Error message and stack trace  
      - Last payload data (truncated) for debugging  
    - Uses configured email address from workflow or fallback.

---

### 3. Summary Table

| Node Name                      | Node Type              | Functional Role                         | Input Node(s)                  | Output Node(s)                     | Sticky Note                                                                                              |
|--------------------------------|------------------------|---------------------------------------|--------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------|
| Cron (Schedule)                | Cron                   | Triggers workflow daily at 7 PM       | -                              | Set (Configs)                    | INITIALIZATION & DATA COLLECTION: Cron triggers daily at 7 PM                                         |
| Set (Configs)                 | Set                    | Sets config variables                  | Cron (Schedule)                | Notion → Query Ideas DB (all)    | INITIALIZATION & DATA COLLECTION: Set configs (DB IDs, email, LinkedIn settings)                       |
| Notion → Query Ideas DB (all) | Notion                 | Queries unpublished ideas              | Set (Configs)                  | Filter Unpublished + Map          | INITIALIZATION & DATA COLLECTION: Query Notion for unpublished ideas                                  |
| Filter Unpublished + Map       | Code                   | Filters and maps Notion data           | Notion → Query Ideas DB (all)  | Split In Batches (1), Count Eligible | INITIALIZATION & DATA COLLECTION: Filter & clean the data                                              |
| Count Eligible                | Code                   | Counts eligible unpublished ideas      | Filter Unpublished + Map       | IF (Has Eligible?)               | INITIALIZATION & DATA COLLECTION: Count eligible posts                                                 |
| IF (Has Eligible?)             | If                     | Checks if there are eligible ideas     | Count Eligible                 | Split In Batches (1) / Send a message | INITIALIZATION & DATA COLLECTION: If no posts found → Send "nothing to do" email                      |
| Send a message                | Gmail                  | Sends "no eligible ideas" notification | IF (Has Eligible?)             | -                              | INITIALIZATION & DATA COLLECTION: Sends email if no unpublished ideas found                            |
| Split In Batches (1)           | SplitInBatches         | Processes ideas one by one              | Filter Unpublished + Map       | Normalize Arrays                | CONTENT PROCESSING & AI GENERATION: Process ideas one by one (batch size 1)                            |
| Normalize Arrays              | Code                   | Normalizes arrays and merges configs   | Split In Batches (1)           | Content Creator                | CONTENT PROCESSING & AI GENERATION: Normalize data for AI prompts                                     |
| Content Creator               | OpenAI (LangChain)     | Generates blog and LinkedIn content    | Normalize Arrays              | Parse & Validate JSON           | CONTENT PROCESSING & AI GENERATION: OpenAI creates blog, LinkedIn post, and metadata                  |
| Parse & Validate JSON          | Code                   | Parses and validates AI output          | Content Creator               | Create a Article Database Page  | CONTENT PROCESSING & AI GENERATION: Validates and formats AI output                                   |
| Create a Article Database Page | Notion                 | Stores AI content in Articles DB       | Parse & Validate JSON          | If LinkedIn Published Check    | CONTENT STORAGE & PUBLISH DECISION: Save AI content to Articles database                              |
| If LinkedIn Published Check    | If                     | Checks if auto-publish to LinkedIn     | Create a Article Database Page | Image prompt generator / Draft Email | CONTENT STORAGE & PUBLISH DECISION: Branches to publish or draft flow                                |
| Draft Email                   | Gmail                  | Sends draft LinkedIn email for review  | If LinkedIn Published Check    | Draft Update Database          | CONTENT STORAGE & PUBLISH DECISION: Email draft for review                                            |
| Draft Update Database         | Notion                 | Updates article status to Draft         | Draft Email                   | -                              | CONTENT STORAGE & PUBLISH DECISION: Mark as Draft                                                     |
| Image prompt generator        | OpenAI                 | Generates image prompt for Replicate AI | If LinkedIn Published Check    | Replicate Image Prediction     | PUBLISHING & COMPLETION: Generate image prompt                                                       |
| Replicate Image Prediction    | HTTP Request           | Calls Replicate API to create image     | Image prompt generator        | Download Image                 | PUBLISHING & COMPLETION: Create AI image                                                             |
| Download Image                | HTTP Request           | Downloads image from Replicate          | Replicate Image Prediction    | Create a post                 | PUBLISHING & COMPLETION: Download created image                                                       |
| Create a post                 | LinkedIn               | Posts LinkedIn content with image       | Download Image                | Published Email               | PUBLISHING & COMPLETION: Post to LinkedIn with image                                                 |
| Published Email               | Gmail                  | Sends confirmation email on publish    | Create a post                 | Update a database page         | PUBLISHING & COMPLETION: Send success email                                                          |
| Update a database page        | Notion                 | Updates article status to Published     | Published Email               | -                              | PUBLISHING & COMPLETION: Mark as Published                                                           |
| Error Trigger (Any Node Fails) | Error Trigger          | Catches any node failure                 | All nodes                    | Failure Message               | ERROR HANDLING: Captures workflow errors                                                             |
| Failure Message              | Gmail                  | Sends detailed error report email       | Error Trigger                | -                              | ERROR HANDLING: Sends failure email                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cron (Schedule) node:**  
   - Type: Cron  
   - Set trigger time to daily at 19:00 hours (7 PM).

2. **Create Set (Configs) node:**  
   - Type: Set  
   - Add string variables:  
     - NOTION_DB_ID (e.g., your Notion database ID for ideas)  
     - NOTION_PAGE_PARENT (parent page ID in Notion)  
     - LINKEDIN_PERSON_URN (LinkedIn person URN)  
     - OPENAI_MODEL (e.g., "gpt-4.1-mini")  
     - EMAIL_TO (notification email address)  
   - Add boolean variable:  
     - LINKEDIN_PUBLISH (true or false to auto-publish or draft)

3. **Connect Cron → Set (Configs).**

4. **Create Notion → Query Ideas DB (all) node:**  
   - Resource: databasePage  
   - Operation: getAll  
   - Database ID: reference `NOTION_DB_ID` from Set (Configs)  
   - Filter: property "published" checkbox equals false  
   - Sort ascending by created_time  
   - Set credentials for Notion API.

5. **Connect Set (Configs) → Notion → Query Ideas DB (all).**

6. **Create Code node "Filter Unpublished + Map":**  
   - Code filters out any published entries, safely maps fields (title, angle, tags, links, language, slug, etc.) into simple JSON.  
   - Output only unpublished ideas.

7. **Connect Notion → Query Ideas DB (all) → Filter Unpublished + Map.**

8. **Create Code node "Count Eligible":**  
   - Returns one item with `eligible_count` = length of input items.

9. **Connect Filter Unpublished + Map → Count Eligible.**

10. **Create If node "IF (Has Eligible?)":**  
    - Condition: `eligible_count > 0` (boolean true)  
    - True branch continues processing  
    - False branch sends notification

11. **Connect Count Eligible → IF (Has Eligible?)**

12. **Create Gmail "Send a message" node for no eligible ideas:**  
    - To: `EMAIL_TO` from Set (Configs)  
    - Subject: "Blog Pipeline: No Eligible Notion Rows!"  
    - Message: "No rows found in [NOTION_DB_ID] with published != true at [current time]."  
    - Use Gmail OAuth2 credentials.

13. **Connect IF (Has Eligible?) false branch → Send a message.**

14. **Connect IF (Has Eligible?) true branch → Split In Batches (1):**  
    - Batch size: 1.

15. **Create Code node "Normalize Arrays":**  
    - Converts fields to arrays (tags, reference_links, images).  
    - Merges config variables from Set (Configs).

16. **Connect Split In Batches (1) → Normalize Arrays.**

17. **Create OpenAI node "Content Creator":**  
    - Model: GPT-5-mini or GPT-4.1-mini as preferred  
    - Input: detailed prompt with instructions, including blog and LinkedIn output schema.  
    - Credentials: OpenAI API key.

18. **Connect Normalize Arrays → Content Creator.**

19. **Create Code node "Parse & Validate JSON":**  
    - Parses OpenAI output content, repairs JSON formatting, validates fields (blog title, slug, markdown, LinkedIn text), truncates if needed, collects warnings.  
    - Throws error on critical validation failure.

20. **Connect Content Creator → Parse & Validate JSON.**

21. **Create Notion node "Create a Article Database Page":**  
    - Resource: databasePage  
    - Operation: create  
    - Database ID: Articles DB in Notion  
    - Set properties from parsed AI output (title, slug, excerpt, keywords, canonical_url, suggested_cover_caption, image_alt_texts, language, tags, status=Published, published_at=current time, source_idea relation to original Notion page, linkedin_draft text)  
    - Use Notion credentials.

22. **Connect Parse & Validate JSON → Create a Article Database Page.**

23. **Create If node "If LinkedIn Published Check":**  
    - Condition: `LINKEDIN_PUBLISH` boolean from Set (Configs) equals true.

24. **Connect Create a Article Database Page → If LinkedIn Published Check.**

25. **Create Gmail node "Draft Email":**  
    - To: EMAIL_TO  
    - Subject: "LinkedIn Draft Ready"  
    - Message: includes title and LinkedIn draft content.  
    - Use Gmail credentials.

26. **Create Notion node "Draft Update Database":**  
    - Resource: databasePage  
    - Operation: update  
    - Page ID: from Article created page  
    - Update status to "Draft".

27. **Connect If LinkedIn Published Check false branch → Draft Email → Draft Update Database.**

28. **Create OpenAI node "Image prompt generator":**  
    - Model: GPT-4.1-mini  
    - Prompt: Generates a photorealistic text prompt for Replicate AI using blog and LinkedIn content details.  
    - Credentials: OpenAI API.

29. **Connect If LinkedIn Published Check true branch → Image prompt generator.**

30. **Create HTTP Request node "Replicate Image Prediction":**  
    - Method: POST  
    - URL: https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions  
    - Headers: Authorization Bearer token, Content-Type application/json, Prefer: wait  
    - Body: JSON with input prompt from previous node, aspect_ratio "16:9"  
    - Credentials: Replicate bearer token.

31. **Connect Image prompt generator → Replicate Image Prediction.**

32. **Create HTTP Request node "Download Image":**  
    - Method: GET  
    - URL: output URL from Replicate prediction.  
    - Returns binary data.

33. **Connect Replicate Image Prediction → Download Image.**

34. **Create LinkedIn node "Create a post":**  
    - Text: LinkedIn final_text from AI output  
    - Person URN: from config or credentials  
    - Attach image binary data downloaded  
    - Visibility: PUBLIC  
    - Credentials: LinkedIn OAuth2.

35. **Connect Download Image → Create a post.**

36. **Create Gmail node "Published Email":**  
    - To: configured email (example "mail@budhathokisagar.com.np")  
    - Subject: "LinkedIn Post Published!"  
    - Message: includes published blog title, slug, LinkedIn post confirmation, Notion idea page ID.

37. **Connect Create a post → Published Email.**

38. **Create Notion node "Update a database page" for publishing:**  
    - Operation: update  
    - Page ID: Article page ID  
    - Update status to "Published".

39. **Connect Published Email → Update a database page.**

40. **Create Error Trigger node "Error Trigger (Any Node Fails)":**  
    - Listens for any node failure.

41. **Create Gmail node "Failure Message":**  
    - Sends detailed error report email with node name, error message, stack trace, last payload (truncated).  
    - To: EMAIL_TO from config or fallback.

42. **Connect Error Trigger → Failure Message.**

---

### 5. General Notes & Resources

| Note Content                                                                                                           | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow triggers daily at 7 PM to automate timely blog and LinkedIn content creation.                                  | Scheduling                                                                                       |
| Uses Notion as a CMS for content ideas and article metadata management.                                                | Notion integration                                                                              |
| OpenAI models used: GPT-5-mini for content generation and GPT-4.1-mini for image prompt creation.                      | OpenAI API                                                                                      |
| Replicate AI model "black-forest-labs/flux-schnell" generates photorealistic images for LinkedIn posts.                 | Replicate AI                                                                                   |
| LinkedIn posts limited to ≤1200 characters with hashtags for engagement.                                               | LinkedIn content constraints                                                                    |
| Safety flags in AI output treated as warnings, allowing manual review if needed.                                        | AI content moderation                                                                           |
| Emails notify on no eligible content, drafts ready for review, successful publishing, and errors for prompt alerts.    | Notifications via Gmail OAuth2                                                                  |
| Error handling captures detailed error info and last node payload for debugging.                                        | Robust error reporting                                                                          |
| The workflow structure supports easy toggling between auto-publish and draft workflow via `LINKEDIN_PUBLISH` boolean.  | Configurable publish mode                                                                        |
| The blog article output includes SEO metadata fields for slug, excerpt, keywords, and canonical URL.                   | SEO ready blog posts                                                                            |
| Blog content output is in Markdown with clear structure and actionable insights, tailored to DevOps/CloudOps audience. | Content style and target audience                                                               |

---

**Disclaimer:**  
The provided content originates exclusively from an automated workflow built with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly available.