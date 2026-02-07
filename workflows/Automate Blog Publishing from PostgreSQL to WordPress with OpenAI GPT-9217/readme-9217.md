Automate Blog Publishing from PostgreSQL to WordPress with OpenAI GPT

https://n8nworkflows.xyz/workflows/automate-blog-publishing-from-postgresql-to-wordpress-with-openai-gpt-9217


# Automate Blog Publishing from PostgreSQL to WordPress with OpenAI GPT

### 1. Workflow Overview

This workflow automates the process of publishing marketing blog posts to WordPress by leveraging data stored in a PostgreSQL database and AI-generated content from OpenAI GPT models. It is designed for marketing teams or content automation specialists who want to streamline blog content creation and publication, reducing manual effort and maintaining synchronization between the database and WordPress site.

The workflow is logically divided into four main blocks:

- **1.1 Trigger & Data Fetch:** Periodically triggers and retrieves the latest unprocessed blog record from PostgreSQL.
- **1.2 AI Content Generation:** Uses OpenAI GPT-based nodes to generate SEO-optimized, engaging blog content based on the blog title fetched.
- **1.3 Data Formatting & Safety:** Parses, validates, and structures the AI-generated content into a safe, WordPress-compatible format including metadata.
- **1.4 Publishing & Database Update:** Publishes the content on WordPress and updates the original database record with post details and processing status.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Data Fetch

**Overview:**  
This block initiates the workflow on a schedule, queries the PostgreSQL database for the most recent unprocessed blog record, and verifies the validity of the fetched record before proceeding.

**Nodes Involved:**  
- ⏰ Schedule Trigger  
- 🗄️ PostgreSQL Trigger  
- 🔍 Check Record Exists

**Node Details:**

- **⏰ Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Starts the workflow on a regular interval (default every minute, configurable)  
  - Configuration: Interval set to trigger execution periodically  
  - Inputs: None (trigger node)  
  - Outputs: Connects to PostgreSQL Trigger  
  - Edge Cases: Misconfigured intervals could cause missed or excessive triggers  

- **🗄️ PostgreSQL Trigger**  
  - Type: PostgreSQL node (Execute Query)  
  - Role: Executes SQL query fetching the newest record where “Processed” is false or null  
  - Configuration:  
    - Query: `SELECT * FROM "your_table_name" WHERE "Processed" = FALSE OR "Processed" IS NULL ORDER BY "Created_At" DESC LIMIT 1;`  
    - Credentials: Requires PostgreSQL connection credentials  
  - Inputs: Triggered by Schedule Trigger  
  - Outputs: Record data as JSON array (single record or empty)  
  - Edge Cases: Database connection failure, query errors, no unprocessed records found (empty output)  

- **🔍 Check Record Exists**  
  - Type: If node  
  - Role: Checks if the PostgreSQL query returned a valid record with an `id` and non-empty `Blog_Title`  
  - Configuration:  
    - Condition 1: `id` exists and is a number  
    - Condition 2: `Blog_Title` exists and is non-empty string  
    - Both conditions must be true to continue  
  - Inputs: Output of PostgreSQL Trigger  
  - Outputs:  
    - True path: Proceed to AI content generation  
    - False path: Ends workflow (no valid record)  
  - Edge Cases: Missing or malformed fields, empty results from DB, expression evaluation errors  

---

#### 1.2 AI Content Generation

**Overview:**  
Generates a fully structured marketing blog post using OpenAI GPT models based on the blog title from the database.

**Nodes Involved:**  
- OpenAI Chat Model  
- 🤖 Generates Blog Post

**Node Details:**

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model  
  - Role: Calls GPT-4o-mini model to process input text and generate content  
  - Configuration:  
    - Model: `gpt-4o-mini` (a smaller GPT-4 variant suited for chat)  
    - No additional options set  
    - Credentials: OpenAI API key required  
  - Inputs: Receives data from Check Record Exists (true branch)  
  - Outputs: Passes AI response to Blog Post Agent node  
  - Edge Cases: API rate limits, invalid API key, network errors, unexpected model responses  

- **🤖 Generates Blog Post**  
  - Type: Langchain Agent node  
  - Role: Applies a detailed prompt to generate a marketing blog post with SEO optimization and structured JSON output  
  - Configuration:  
    - Prompt: Asks to create an SEO-friendly blog post including title, intro, body, conclusion, and call-to-action  
    - Output format: JSON with keys `title`, `content` (HTML), `excerpt` (150-200 chars), `meta_description` (150-160 chars)  
  - Inputs: Text from OpenAI Chat Model  
  - Outputs: JSON formatted blog content passed to data formatting node  
  - Edge Cases: Malformed AI output, incomplete JSON, failure to include required fields  

---

#### 1.3 Data Formatting & Safety

**Overview:**  
Parses AI responses, validates JSON structure, applies fallback defaults, and prepares the data payload for WordPress publishing. Also attaches original database record references.

**Nodes Involved:**  
- 📝 Format Blog Data

**Node Details:**

- **📝 Format Blog Data**  
  - Type: Code (JavaScript) node  
  - Role:  
    - Extracts JSON content from AI response safely using regex  
    - Handles cases when AI output is malformed or missing JSON  
    - Defines fallback values for title, content, excerpt, and meta description  
    - Attaches categories (`Marketing`), tags, and original DB record ID and data  
  - Inputs: Output from 🤖 Generates Blog Post  
  - Outputs: Structured JSON ready for WordPress Publisher  
  - Key Expressions:  
    - Uses regex to find JSON block within AI response text  
    - Tries/catches JSON.parse to avoid crashes  
    - References original DB record from PostgreSQL Trigger node data  
  - Edge Cases: AI response missing JSON, parsing errors, missing original DB data  

---

#### 1.4 Publishing & Database Update

**Overview:**  
Publishes the blog post to WordPress with metadata and updates the original PostgreSQL record to mark it as processed with WordPress post details.

**Nodes Involved:**  
- ✍️ WordPress Publisher  
- 💾 Update Database

**Node Details:**

- **✍️ WordPress Publisher**  
  - Type: WordPress node  
  - Role: Publishes blog post using WordPress REST API  
  - Configuration:  
    - Title, content, excerpt mapped from formatted data node  
    - Status set to `publish` for immediate posting  
    - Categories: `Marketing`  
    - Tags: `AI, PostgreSQL, WordPress, Marketing, Automation`  
    - Meta description set as SEO metadata  
    - Credentials: WordPress API OAuth2 credentials required  
  - Inputs: From Format Blog Data  
  - Outputs: WordPress post data (includes post ID and URL)  
  - Edge Cases: Auth failure, API rate limits, invalid data errors, network issues  

- **💾 Update Database**  
  - Type: PostgreSQL node (Execute Query)  
  - Role: Updates the original database record with:  
    - `Processed` = TRUE  
    - `Wordpress_Post_Id` = post ID from WordPress  
    - `Wordpress_Post_Url` = post URL from WordPress  
    - `Blog_Title` = title as published  
    - `Processed_At` = current timestamp  
  - Configuration:  
    - SQL UPDATE with parameters mapping to WordPress response and original record ID  
    - Credentials: PostgreSQL connection credentials  
  - Inputs: From WordPress Publisher  
  - Outputs: None (final step)  
  - Edge Cases: DB connection failure, SQL errors, parameter mapping issues  

---

### 3. Summary Table

| Node Name               | Node Type                        | Functional Role                       | Input Node(s)           | Output Node(s)            | Sticky Note                                                                                          |
|-------------------------|---------------------------------|-------------------------------------|------------------------|---------------------------|----------------------------------------------------------------------------------------------------|
| ⏰ Schedule Trigger       | Schedule Trigger                 | Initiates workflow on schedule      | None                   | 🗄️ PostgreSQL Trigger      | ## 1. Trigger & Data Fetch: Initiates workflow regularly                                           |
| 🗄️ PostgreSQL Trigger    | PostgreSQL                      | Fetches latest unprocessed DB record | ⏰ Schedule Trigger     | 🔍 Check Record Exists      | ## 1. Trigger & Data Fetch: Queries unprocessed blog records                                       |
| 🔍 Check Record Exists    | If                             | Validates DB record presence        | 🗄️ PostgreSQL Trigger   | 🤖 Generates Blog Post (true), End (false) | ## 1. Trigger & Data Fetch: Ensures record validity                                               |
| OpenAI Chat Model        | Langchain OpenAI Chat Model     | Calls OpenAI GPT for content        | 🔍 Check Record Exists (true) | 🤖 Generates Blog Post      | ## 2. AI Content Generation: Generates blog content                                                |
| 🤖 Generates Blog Post    | Langchain Agent                 | Structures AI output into JSON blog | OpenAI Chat Model       | 📝 Format Blog Data         | ## 2. AI Content Generation: Creates SEO-friendly blog post JSON                                  |
| 📝 Format Blog Data       | Code (JavaScript)               | Parses and formats AI response      | 🤖 Generates Blog Post   | ✍️ WordPress Publisher      | ## 3. Data Formatting & Safety: Prepares safe, structured payload for WordPress                    |
| ✍️ WordPress Publisher    | WordPress                      | Publishes the blog post             | 📝 Format Blog Data      | 💾 Update Database          | ## 4. Publishing & Database Update: Publishes blog and updates DB                                 |
| 💾 Update Database        | PostgreSQL                      | Updates DB record post-publication  | ✍️ WordPress Publisher   | None                      | ## 4. Publishing & Database Update: Marks record processed with post ID and URL                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval to desired frequency (e.g., every 1 minute)  
   - Connect output to PostgreSQL Trigger node  

2. **Create PostgreSQL Trigger Node**  
   - Type: PostgreSQL (Execute Query)  
   - Credentials: Set PostgreSQL connection credentials  
   - Query:  
     ```sql
     SELECT *
     FROM "your_table_name"
     WHERE "Processed" = FALSE OR "Processed" IS NULL
     ORDER BY "Created_At" DESC
     LIMIT 1;
     ```  
   - Connect output to Check Record Exists node  

3. **Create Check Record Exists Node**  
   - Type: If node  
   - Conditions (AND):  
     - `id` exists and is a number (expression: `={{ $json.id }}`)  
     - `Blog_Title` exists and is not empty string (expression: `={{ $json.Blog_Title }}`)  
   - True output connects to OpenAI Chat Model node  
   - False output ends workflow  

4. **Create OpenAI Chat Model Node**  
   - Type: Langchain OpenAI Chat Model  
   - Credentials: Set OpenAI API key  
   - Model: `gpt-4o-mini`  
   - Connect output to Generates Blog Post node  

5. **Create Generates Blog Post Node**  
   - Type: Langchain Agent  
   - Prompt:  
     ```
     You are an expert marketing content writer. Create engaging, SEO-optimized blog posts that convert readers into customers.

     User Message:
     Create a comprehensive marketing blog post based on this title: 
     {{ $json.Blog_Title }}

     The blog post should include:
     1. A catchy, SEO-friendly title
     2. An engaging introduction that hooks the reader
     3. Well-structured body content with subheadings
     4. A compelling conclusion with a call-to-action
     5. Optimize for marketing and conversion

     Format the response as JSON with these fields:
     - title: The blog post title
     - content: The full HTML content of the blog post
     - excerpt: A brief excerpt (150-200 characters)
     - meta_description: SEO meta description (150-160 characters)
     ```  
   - Connect output to Format Blog Data node  

6. **Create Format Blog Data Node**  
   - Type: Code (JavaScript)  
   - Paste the provided code for parsing AI output, applying defaults, and structuring data for WordPress (see Node Details above)  
   - Connect output to WordPress Publisher node  

7. **Create WordPress Publisher Node**  
   - Type: WordPress  
   - Credentials: Set WordPress API OAuth2 credentials  
   - Configure fields:  
     - Title: `={{ $json.title }}`  
     - Content: `={{ $json.content }}`  
     - Excerpt: `={{ $json.excerpt }}`  
     - Status: `publish`  
     - Categories: `Marketing`  
     - Tags: `AI, PostgreSQL, WordPress, Marketing, Automation`  
     - Meta: Set meta_description field using `={{ $json.meta_description }}`  
   - Connect output to Update Database node  

8. **Create Update Database Node**  
   - Type: PostgreSQL (Execute Query)  
   - Credentials: Use same PostgreSQL connection  
   - Query:  
     ```sql
     UPDATE "your_table_name"
     SET 
         "Processed" = TRUE,
         "Wordpress_Post_Id" = $1,
         "Wordpress_Post_Url" = $2,
         "Blog_Title" = $3,
         "Processed_At" = NOW()
     WHERE "id" = $4;
     ```  
   - Parameters (map from WordPress Publisher output and original DB record):  
     - $1 = `={{ $json.id }}` (WordPress post ID)  
     - $2 = `={{ $json.link }}` (WordPress post URL)  
     - $3 = `={{ $json.title.rendered }}` (WordPress post title)  
     - $4 = `={{ $('📝 Format Blog Data').item.json.original_record_id }}` (original DB record ID)  
   - Final node with no output  

---

### 5. General Notes & Resources

| Note Content                                                                                                        | Context or Link                                                                                           |
|---------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| This workflow uses the Langchain n8n nodes integration for GPT model calls, requiring separate OpenAI API credentials. | Langchain n8n node docs, OpenAI API setup                                                               |
| Ensure PostgreSQL and WordPress API credentials have correct scopes and access permissions for query and post ops.  | PostgreSQL user permissions, WordPress REST API OAuth2 setup                                             |
| The AI prompt is tailored for marketing blog creation with SEO best practices and JSON formatted output.            | Adjust prompt for other content types as needed                                                          |
| The code node includes robust JSON parsing and fallback to handle imperfect AI responses gracefully.                | Critical for avoiding workflow crashes on malformed AI outputs                                           |
| For best results, ensure your PostgreSQL table schema supports fields: id, Processed (boolean), Blog_Title, etc.    | Database schema design                                                                                     |
| WordPress categories and tags are hardcoded but can be parameterized for flexibility.                               | Modify categories/tags arrays in code node and WordPress node configuration                               |
| Workflow can be extended to support multiple records by adjusting the PostgreSQL query and iteration logic.         | Useful for batch processing                                                                                 |

---

**Disclaimer:** The provided text is exclusively derived from an automated n8n workflow designed with legal and publicly available content. It complies strictly with applicable content policies and contains no illegal, offensive, or protected materials. All processed data is legal and public.