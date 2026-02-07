Auto-Generate Platform-Specific Marketing Content with GPT-4, Google Sheets & Docs

https://n8nworkflows.xyz/workflows/auto-generate-platform-specific-marketing-content-with-gpt-4--google-sheets---docs-7998


# Auto-Generate Platform-Specific Marketing Content with GPT-4, Google Sheets & Docs

### 1. Workflow Overview

This workflow automates the generation of tailored marketing content for various social media platforms using GPT-4, Google Sheets, and Google Docs. It is designed to trigger upon updates in a Google Sheet that tracks marketing topics and their statuses, dynamically fetch social platform character limits, generate platform-specific AI content, and then store the results in a Google Document while updating the status in the sheet to reflect completion.

**Target Use Cases:**  
- Automated creation of social media posts optimized for platform constraints (Facebook, Instagram, Twitter/X).  
- SEO-friendly content generation aligned with brand voice and marketing campaigns.  
- Streamlined content management via Google Sheets and Google Docs integration.

**Logical Blocks:**  
- **1.1 Input Reception:** Trigger workflow on Google Sheet row updates and filter relevant rows.  
- **1.2 Platform Data Retrieval:** Fetch and structure social platform character limits.  
- **1.3 AI Prompt Preparation:** Build a detailed prompt for GPT-4 based on topic and platform data.  
- **1.4 AI Content Generation:** Use OpenAI GPT-4 to create marketing content.  
- **1.5 Content Storage:** Create and update a Google Document with the generated content.  
- **1.6 Workflow Finalization:** Update the sheet status to signal completion.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block initiates the workflow whenever a row in the "Topics" Google Sheet has its "Status" column updated. It filters rows to process only those with the status "Enabled," ensuring only relevant topics trigger content generation.

**Nodes Involved:**  
- Update Status Trigger  
- Filter out Enabled Status Row

**Node Details:**  

- **Update Status Trigger**  
  - Type: Google Sheets Trigger  
  - Role: Detects row updates specifically on the "Status" column in the "Topics" sheet of a specified Google Sheet document.  
  - Configuration: Polls every minute, watches the "Status" column only.  
  - Input: Google Sheet row update events.  
  - Output: Emits data for rows where updates occurred.  
  - Edge Cases:  
    - Trigger may miss very rapid successive updates if polling interval is too long.  
    - Requires proper Google Sheets OAuth2 credentials.  
    - Errors if sheet or document ID is incorrect or access is revoked.

- **Filter out Enabled Status Row**  
  - Type: If (conditional filter)  
  - Role: Passes only rows where the "Status" column equals "Enabled."  
  - Configuration: Case-sensitive strict equality check on `$json.Status`.  
  - Input: Output from trigger node.  
  - Output: Routes only enabled rows to next block; others are discarded.  
  - Edge Cases:  
    - Fails if the "Status" field is missing or null.  
    - Case sensitivity may cause misses if status values vary in casing.

---

#### 1.2 Platform Data Retrieval

**Overview:**  
Fetches platform-specific content character limits from a separate Google Sheet tab and converts the data into a JSON object for easy reference during prompt creation.

**Nodes Involved:**  
- Fetch Social Platform Limits  
- Create JSON for platform limts

**Node Details:**  

- **Fetch Social Platform Limits**  
  - Type: Google Sheets  
  - Role: Reads all rows from the "Platform Limits" sheet tab containing character limits and platform names.  
  - Configuration: Reads entire sheet (gid=106670834) in a given document.  
  - Input: Triggered from previous filter node.  
  - Output: Raw sheet rows with platform limit data.  
  - Edge Cases:  
    - Requires read OAuth2 credentials with proper scopes.  
    - Sheet structure changes may cause errors or missing data.

- **Create JSON for platform limts**  
  - Type: Code (JavaScript)  
  - Role: Converts fetched platform rows into a structured JSON object keyed by platform name, with min and max character limits for each.  
  - Configuration: Iterates over all input items, constructs an object like `{ Facebook: {min, max}, Instagram: {min, max}, Twitter: {min, max} }`.  
  - Input: Array of platform limit rows.  
  - Output: Single JSON object with platform limits for downstream usage.  
  - Edge Cases:  
    - Requires consistent column naming ("Platform", "Min_Limit", "Max_Limit").  
    - Missing or invalid numeric limit values could cause malformed JSON.

---

#### 1.3 AI Prompt Preparation

**Overview:**  
Combines topic details from the filtered row and the platform limit JSON to create a comprehensive AI prompt for generating marketing content compliant with platform-specific constraints.

**Nodes Involved:**  
- Create Prompt

**Node Details:**  

- **Create Prompt**  
  - Type: Set  
  - Role: Constructs a detailed prompt string for GPT-4 by interpolating topic, keywords, tone, social platforms, and platform-specific character limits.  
  - Configuration: Uses expressions to pull data from the filtered topic row and the platform limits JSON, embedding them into a multi-line string describing instructions and constraints.  
  - Input: JSON object with platform limits and topic details.  
  - Output: Single field `prompt` containing the final prompt string.  
  - Edge Cases:  
    - If any referenced fields (e.g., Topic, Keyword, Tone) are missing, prompt may be incomplete.  
    - Platform limits must be correctly structured to avoid prompt errors.  
    - Complex expressions may fail if node names or paths change.

---

#### 1.4 AI Content Generation

**Overview:**  
Sends the constructed prompt to OpenAI's GPT-4 model to generate SEO-friendly, platform-specific marketing posts.

**Nodes Involved:**  
- OpenAI

**Node Details:**  

- **OpenAI**  
  - Type: Langchain OpenAI Node (GPT-4)  
  - Role: Uses GPT-4 to generate marketing content based on the prompt.  
  - Configuration: Model set to "gpt-4," message content taken from `prompt` field. No advanced options configured.  
  - Credentials: Requires valid OpenAI API key.  
  - Input: Takes the prompt string from the previous node.  
  - Output: AI-generated text response accessible at `json.message.content`.  
  - Edge Cases:  
    - API key errors or quota limits may cause failure.  
    - Model response timeouts or incomplete responses possible.  
    - Prompt formatting errors may result in irrelevant output.

---

#### 1.5 Content Storage

**Overview:**  
Creates a new Google Document named after the topic and current timestamp, and updates it with the generated marketing content.

**Nodes Involved:**  
- Create new Document  
- Update newly Created Document

**Node Details:**  

- **Create new Document**  
  - Type: Google Docs  
  - Role: Generates a new Google Document to host the AI-generated content.  
  - Configuration: Document title built dynamically from topic name and timestamp; created in default folder.  
  - Credentials: Requires Google Docs OAuth2 credentials.  
  - Input: Triggered by successful AI content generation.  
  - Output: Document metadata including document ID.  
  - Edge Cases:  
    - Permission issues if Google Docs credentials lack write access.  
    - Title collisions unlikely but possible if timestamp format changes.

- **Update newly Created Document**  
  - Type: Google Docs  
  - Role: Inserts the generated marketing content text into the newly created document.  
  - Configuration: Inserts text at start; uses document ID from previous node.  
  - Credentials: Same as above.  
  - Input: Document ID and AI-generated content string.  
  - Output: Confirmation of document update.  
  - Edge Cases:  
    - Document ID must be valid; failure causes update errors.  
    - Large content may hit Google Docs API limits.

---

#### 1.6 Workflow Finalization

**Overview:**  
Marks the processed topic row in the Google Sheet as "Completed" to indicate successful content generation and workflow completion.

**Nodes Involved:**  
- Update Status to Completed in Sheet

**Node Details:**  

- **Update Status to Completed in Sheet**  
  - Type: Google Sheets  
  - Role: Updates the "Status" field of the processed row to "Completed" in the "Topics" sheet.  
  - Configuration: Matches row by unique "ID" field; updates only the "Status" column.  
  - Credentials: Requires Google Sheets OAuth2 credentials with write permissions.  
  - Input: ID from filtered row, status string.  
  - Output: Confirmation of sheet update.  
  - Edge Cases:  
    - If ID field is missing or duplicated, incorrect rows may be updated.  
    - Permissions or API limits may cause update failures.

---

### 3. Summary Table

| Node Name                      | Node Type                        | Functional Role                                        | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                                                      |
|-------------------------------|---------------------------------|--------------------------------------------------------|------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Update Status Trigger          | Google Sheets Trigger            | Triggers workflow on "Status" column updates           | -                            | Filter out Enabled Status Row    | ## Update Status Trigger This node triggers the automation whenever a row update occurs in the Topics Google Sheet, specifically when the Status column is changed. It initiates the workflow for content generation, making it an essential part of Google Sheets automation and status-based workflow triggers. |
| Filter out Enabled Status Row  | If                              | Filters rows to only those with Status = "Enabled"     | Update Status Trigger         | Fetch Social Platform Limits     | ## Filter Out Enabled Status Row This step ensures only rows with the Enabled status proceed, filtering out unnecessary data to optimize workflow automation. By applying conditional logic, it keeps the process efficient and relevant for content creation tasks.             |
| Fetch Social Platform Limits   | Google Sheets                   | Reads platform character limits from Google Sheet      | Filter out Enabled Status Row | Create JSON for platform limts   | ## Fetch Social Platform Limits This node reads platform-specific content limits such as character count for Twitter, LinkedIn, and Instagram from a Google Sheet. It enables social media content automation by ensuring your marketing posts comply with platform rules before generation.          |
| Create JSON for platform limts | Code (JavaScript)               | Converts platform limits rows into structured JSON     | Fetch Social Platform Limits  | Create Prompt                   | ## Create JSON for Platform Limits Here, the platform limits are converted into structured JSON format for seamless processing in later steps. This transformation is key for accurate workflow automation, making it easy for the AI to reference platform-specific guidelines.           |
| Create Prompt                 | Set                             | Builds AI prompt with topic and platform limits        | Create JSON for platform limts| OpenAI                         | ## Create Prompt This step builds a custom AI prompt using topic details and platform rules. It lays the foundation for effective AI prompt engineering, enabling OpenAI to generate content that is both engaging and platform-ready.                   |
| OpenAI                        | Langchain OpenAI (GPT-4)        | Generates marketing content from AI prompt             | Create Prompt                | Create new Document             | ## OpenAI (Message Model) The OpenAI node uses advanced GPT models to produce SEO-friendly, platform-specific marketing content. This step powers the AI copywriting automation, ensuring the output aligns with brand tone, platform limits, and campaign objectives.                  |
| Create new Document           | Google Docs                     | Creates new Google Document for content storage         | OpenAI                      | Update newly Created Document   | ## Create New Document This node creates a new Google Document to store all generated marketing content. It streamlines Google Docs automation, offering an organized, centralized space for reviewing and managing your AI-powered marketing assets.                          |
| Update newly Created Document | Google Docs                     | Updates created Google Document with AI-generated text | Create new Document          | Update Status to Completed in Sheet | ## Update Newly Created Document After creating the document, this node updates it with the finalized AI-generated content for each platform. It ensures the document is complete and properly formatted, making it ready for marketing campaigns and team collaboration.                |
| Update Status to Completed in Sheet | Google Sheets              | Marks the topic status as "Completed" in Google Sheet  | Update newly Created Document | -                             | ## Update Status to Completed in Sheet The final step updates the Status column in the Google Sheet to Completed, signaling that the topic has been successfully processed. This keeps your content pipeline transparent and supports accurate tracking of marketing workflows.           |
| Sticky Note                   | Sticky Note                     | Informational overview                                  | -                            | -                             | # Try It Out! This n8n workflow automates marketing content creation by generating high-quality, platform-specific posts for social media, blogs, and ad campaigns. It uses AI-driven content generation combined with dynamic templates to produce engaging, SEO-optimized content aligned with your brand voice. |
| Sticky Note1                  | Sticky Note                     | Notes on Update Status Trigger                          | -                            | -                             | ## Update Status Trigger This node triggers the automation whenever a row update occurs in the Topics Google Sheet, specifically when the Status column is changed. It initiates the workflow for content generation, making it an essential part of Google Sheets automation and status-based workflow triggers. |
| Sticky Note2                  | Sticky Note                     | Notes on Filter Out Enabled Status Row                  | -                            | -                             | ## Filter Out Enabled Status Row This step ensures only rows with the Enabled status proceed, filtering out unnecessary data to optimize workflow automation. By applying conditional logic, it keeps the process efficient and relevant for content creation tasks.             |
| Sticky Note3                  | Sticky Note                     | Notes on Fetch Social Platform Limits                   | -                            | -                             | ## Fetch Social Platform Limits This node reads platform-specific content limits such as character count for Twitter, LinkedIn, and Instagram from a Google Sheet. It enables social media content automation by ensuring your marketing posts comply with platform rules before generation.          |
| Sticky Note4                  | Sticky Note                     | Notes on Create JSON for Platform Limits                | -                            | -                             | ## Create JSON for Platform Limits Here, the platform limits are converted into structured JSON format for seamless processing in later steps. This transformation is key for accurate workflow automation, making it easy for the AI to reference platform-specific guidelines.           |
| Sticky Note5                  | Sticky Note                     | Notes on Create Prompt                                   | -                            | -                             | ## Create Prompt This step builds a custom AI prompt using topic details and platform rules. It lays the foundation for effective AI prompt engineering, enabling OpenAI to generate content that is both engaging and platform-ready.                   |
| Sticky Note6                  | Sticky Note                     | Notes on OpenAI Node                                    | -                            | -                             | ## OpenAI (Message Model) The OpenAI node uses advanced GPT models to produce SEO-friendly, platform-specific marketing content. This step powers the AI copywriting automation, ensuring the output aligns with brand tone, platform limits, and campaign objectives.                  |
| Sticky Note7                  | Sticky Note                     | Notes on Create New Document                             | -                            | -                             | ## Create New Document This node creates a new Google Document to store all generated marketing content. It streamlines Google Docs automation, offering an organized, centralized space for reviewing and managing your AI-powered marketing assets.                          |
| Sticky Note8                  | Sticky Note                     | Notes on Update Newly Created Document                   | -                            | -                             | ## Update Newly Created Document After creating the document, this node updates it with the finalized AI-generated content for each platform. It ensures the document is complete and properly formatted, making it ready for marketing campaigns and team collaboration.                |
| Sticky Note9                  | Sticky Note                     | Notes on Update Status to Completed in Sheet             | -                            | -                             | ## Update Status to Completed in Sheet The final step updates the Status column in the Google Sheet to Completed, signaling that the topic has been successfully processed. This keeps your content pipeline transparent and supports accurate tracking of marketing workflows.           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger node "Update Status Trigger":**  
   - Type: Google Sheets Trigger  
   - Credentials: Google Sheets OAuth2 with read access  
   - Document ID: `1R1QpTXinI8zLi5MqoiywTE5Kfr_Eb0i5N9kiJKnKn4w`  
   - Sheet name: `gid=0` (Topics sheet)  
   - Event: "Row Update"  
   - Columns to watch: ["Status"]  
   - Polling interval: Every minute  

2. **Add If node "Filter out Enabled Status Row":**  
   - Condition: `$json.Status` equals "Enabled" (case-sensitive)  
   - Connect input from "Update Status Trigger" main output  

3. **Add Google Sheets node "Fetch Social Platform Limits":**  
   - Credentials: Google Sheets OAuth2 read access  
   - Document ID: same as above  
   - Sheet name: `106670834` (Platform Limits sheet)  
   - Operation: Read all rows (default)  
   - Connect input from "Filter out Enabled Status Row" true output  

4. **Add Code node "Create JSON for platform limts":**  
   - Language: JavaScript  
   - Code:  
     ```javascript
     let obj = {};

     for (const item of $input.all()) {
       const platform = item.json.Platform;
       const min = item.json.Min_Limit;
       const max = item.json.Max_Limit;

       obj[platform] = {
         platform,
         min: min,
         max: max
       };
     }

     return [{ json: obj }];
     ```  
   - Connect input from "Fetch Social Platform Limits" main output  

5. **Add Set node "Create Prompt":**  
   - Add a new field `prompt` (string) with expression:  
     ```
     You are a marketing content creation AI.
     Based on the provided details, create the requested content in the correct format.

     Details:
     Topic: {{ $('Filter out Enabled Status Row').first().json.Topic }}
     Keywords: {{ $('Filter out Enabled Status Row').first().json.Keyword }}
     Tone: {{ $('Filter out Enabled Status Row').first().json.Tone }}
     Social Platforms: {{ $('Filter out Enabled Status Row').first().json['Social Platform'] }}

     Character Limits by Platform:

     Facebook: {{ $json.Facebook.min }}–{{ $json.Facebook.max }} characters (aim for engaging and concise posts within this range)

     Instagram: {{ $json.Instagram.min }}–{{ $json.Instagram.max }} characters (write captivating captions, include hashtags)

     Twitter (X): {{ $json.Twitter.min }}–{{ $json.Twitter.max }} characters (strict limit, concise and impactful)

     Output Requirements:

     Ensure the post fits within the respective platform's character range (min to max) and follows platform-specific best practices.
     ```  
   - Connect input from "Create JSON for platform limts" main output  

6. **Add OpenAI LangChain node "OpenAI":**  
   - Credentials: OpenAI API key with GPT-4 access  
   - Model: GPT-4  
   - Messages: single message with content expression `={{ $json.prompt }}`  
   - Connect input from "Create Prompt" main output  

7. **Add Google Docs node "Create new Document":**  
   - Credentials: Google Docs OAuth2 with write access  
   - Title: Expression `={{ $('Update Status Trigger').first().json.Topic }} - {{ $now }}`  
   - Folder: Default (or specify folder ID if needed)  
   - Connect input from "OpenAI" main output  

8. **Add Google Docs node "Update newly Created Document":**  
   - Credentials: same as above  
   - Operation: Update document  
   - Document URL/ID: `={{ $json.id }}` from "Create new Document"  
   - Actions: Insert text with value `={{ $('OpenAI').first().json.message.content }}`  
   - Connect input from "Create new Document" main output  

9. **Add Google Sheets node "Update Status to Completed in Sheet":**  
   - Credentials: Google Sheets OAuth2 with write access  
   - Document ID and Sheet name: same as initial trigger  
   - Operation: Update row  
   - Matching column: "ID"  
   - Columns to update: Set "Status" to "Completed"  
   - ID value: `={{ $('Filter out Enabled Status Row').first().json.ID }}`  
   - Connect input from "Update newly Created Document" main output  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                    | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This n8n workflow automates marketing content creation by generating high-quality, platform-specific posts for social media, blogs, and ad campaigns. It uses AI-driven content generation combined with dynamic templates to produce engaging, SEO-optimized content aligned with your brand voice. | Overview sticky note at workflow start                                                           |
| OpenAI GPT-4 is used to ensure content is SEO-friendly and adapted to platform-specific character limits and tone.                                                                                                                                                                             | Sticky Note6 - OpenAI Node                                                                        |
| Google Sheets is the primary input source for topics and platform limits, while Google Docs is used to store the generated content in an organized, accessible manner.                                                                                                                          | Sticky Notes 1, 3, 7, 8                                                                          |
| The workflow requires properly configured OAuth2 credentials for Google Sheets (read and write) and Google Docs, as well as a valid OpenAI API key with access to GPT-4.                                                                                                                         | Credentials notes throughout workflow                                                           |
| For detailed API usage and credential setup, refer to: https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-base.googleSheets/ and https://docs.n8n.io/integrations/builtin/nodes/n8n-nodes-base.googleDocs/ and https://platform.openai.com/docs/api-reference/introduction               | Official n8n and OpenAI API documentation links                                                 |
| By updating the "Status" column in the Topics sheet, users can batch control content generation and track progress effectively.                                                                                                                                                                | Workflow logic description                                                                       |

---

**Disclaimer:**  
The provided text is sourced exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and publicly accessible.