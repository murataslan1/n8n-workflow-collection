Automate Gmail Organization with AI-Powered Email Classification and Smart Labeling

https://n8nworkflows.xyz/workflows/automate-gmail-organization-with-ai-powered-email-classification-and-smart-labeling-11071


# Automate Gmail Organization with AI-Powered Email Classification and Smart Labeling

### 1. Workflow Overview

This workflow automates the tagging of WordPress blog posts using AI-powered semantic analysis. It is designed for content managers and SEO specialists who want to enhance the discoverability of blog posts through relevant, SEO-friendly tags generated and managed automatically.

The workflow logic is divided into these main functional blocks:

**1.1 Fetch and Prepare Blog Content**  
Retrieves a single WordPress blog post to be processed.

**1.2 AI-Powered Tag Generation**  
Uses OpenAI GPT models to analyze the blog content and generate a structured list of relevant tags.

**1.3 Existing Tags Retrieval and Cleaning**  
Fetches all existing WordPress tags to avoid duplicates and normalizes the data.

**1.4 Tag Processing Loop**  
Iterates over each AI-generated tag, checks if it exists, creates new tags if needed, or maps existing tags to their IDs.

**1.5 Tag Aggregation and Post Update**  
Aggregates all tag IDs from existing and newly created tags and updates the WordPress blog post with these tags.

---

### 2. Block-by-Block Analysis

#### 2.1 Fetch and Prepare Blog Content

- **Overview:**  
Fetches the latest WordPress blog post to analyze and tag. This node acts as the workflow’s entry point for blog data.

- **Nodes Involved:**  
  - Execute (Manual Trigger)  
  - Fetch One WordPress Blog  

- **Node Details:**  

  - **Execute (Manual Trigger)**  
    - Type: Manual trigger node  
    - Role: Starts the workflow manually  
    - Inputs: None  
    - Outputs: Triggers “Fetch One WordPress Blog”  
    - Edge cases: User must manually trigger; no automatic scheduling unless configured externally.

  - **Fetch One WordPress Blog**  
    - Type: WordPress node (API integration)  
    - Configuration: Fetches 1 post (`limit=1`), default to latest post  
    - Credentials: WordPress API credentials using App Password  
    - Inputs: Trigger from Execute node  
    - Outputs: JSON with full blog post data including content  
    - Edge cases: API errors, no posts available, authentication failure  
    - Note: Modifiable to fetch specific posts by ID or other criteria.

#### 2.2 AI-Powered Tag Generation

- **Overview:**  
Analyzes the blog content with AI to generate a structured set of relevant tags. Uses a structured output parser to enforce JSON format.

- **Nodes Involved:**  
  - Blog Tags Generator (LangChain LLM Chain)  
  - 4.1 mini (OpenAI GPT-4.1-mini)  
  - 5-mini (OpenAI GPT-5-mini)  
  - Structured Output Parser  

- **Node Details:**  

  - **Blog Tags Generator**  
    - Type: LangChain LLM Chain node designed for custom prompt handling  
    - Configuration: Takes blog content as input; prompt instructs AI to generate 5-10 SEO-friendly tags, comma-separated, no extra text  
    - Inputs: Blog content from “Fetch One WordPress Blog”  
    - Outputs: AI response with tags as JSON object, e.g. `{ "tags": [ "tag1", "tag2" ] }`  
    - Edge cases: AI response may fail format; parser auto-fix enabled to correct minor issues  
    - Version: Uses LangChain 1.7 features (structured parsing, batching)  

  - **4.1 mini** and **5-mini**  
    - Type: OpenAI GPT Chat nodes  
    - Configuration: Different GPT model versions (4.1-mini and 5-mini) for fallback or comparison  
    - Inputs: Text to analyze (blog content)  
    - Outputs: Raw AI response text sent to “Structured Output Parser”  
    - Credentials: OpenAI API token configured  
    - Edge cases: API rate limits, timeout, invalid credentials  

  - **Structured Output Parser**  
    - Type: LangChain output parser node  
    - Configuration: Parses AI text into JSON structure with tags array; autoFix enabled  
    - Inputs: AI chat outputs from GPT nodes  
    - Outputs: Parsed JSON with array of tags  
    - Edge cases: Parsing failures, malformed AI output  

#### 2.3 Existing Tags Retrieval and Cleaning

- **Overview:**  
Fetches all existing WordPress tags to prevent duplication and normalize tag data for mapping.

- **Nodes Involved:**  
  - Fetch All Tags (HTTP Request)  
  - Clean Data (Split Out)  

- **Node Details:**  

  - **Fetch All Tags**  
    - Type: HTTP Request node  
    - Configuration: GET request to WordPress REST API `/wp-json/wp/v2/tags` with `per_page=100` to retrieve tags  
    - Credentials: WordPress API credentials  
    - Inputs: Triggered after AI tag generation  
    - Outputs: List of existing tags with fields like id, name  
    - Edge cases: Pagination if tags > 100, API errors, authentication failures  

  - **Clean Data**  
    - Type: Split Out node  
    - Configuration: Extracts only `name` and `id` fields from each tag record  
    - Inputs: Output from “Fetch All Tags”  
    - Outputs: Cleaned tag list for mapping  

#### 2.4 Tag Processing Loop

- **Overview:**  
Processes each AI-generated tag individually, decides whether to create new tags or map existing ones, handling errors gracefully.

- **Nodes Involved:**  
  - Split Out for Loop  
  - Tagging Loop (Split In Batches)  
  - Switch  
  - Create New Tag (HTTP Request)  
  - Return Tag ID & Name (Set)  
  - Return Name Only (Set)  

- **Node Details:**  

  - **Split Out for Loop**  
    - Type: Split Out node  
    - Configuration: Splits the array of tags into individual items for iteration  
    - Inputs: Parsed tags JSON from AI output parser  
    - Outputs: Single tag per item  

  - **Tagging Loop**  
    - Type: Split In Batches node  
    - Configuration: Processes tags one-by-one or in small batches (default) to handle API rate limits and logic flow  
    - Inputs: Single tags from “Split Out for Loop”  
    - Outputs: Feeds into “Switch” node for decision making  

  - **Switch**  
    - Type: Switch node  
    - Configuration: Checks if the tag exists (based on tag ID presence)  
    - Outputs:  
      - “Old Tags” branch: tag exists, map existing ID  
      - “New Tags” branch: tag does not exist, create new tag  
    - Inputs: Tag item with potential ID from merging existing tags  
    - Outputs: Routes to either “Return Name Only” or “Create New Tag”  

  - **Create New Tag**  
    - Type: HTTP Request node  
    - Configuration: POST request to WordPress `/wp-json/wp/v2/tags` to create a new tag with field `name`  
    - Authentication: WordPress API credentials  
    - Inputs: Tag name from AI-generated tags  
    - Outputs: Response with new tag ID and name  
    - On Error: Continue workflow despite failures (e.g., duplicate name errors)  

  - **Return Tag ID & Name**  
    - Type: Set node  
    - Configuration: Extracts and sets tag ID and name from API response for aggregation  
    - Inputs: Response from “Create New Tag”  
    - Outputs: Tag object with id and name  

  - **Return Name Only**  
    - Type: Set node  
    - Configuration: Sets tag name only for existing tags to pass back into loop  
    - Inputs: Existing tag name from “Switch”  
    - Outputs: Tag name for further processing  

#### 2.5 Tag Aggregation and Post Update

- **Overview:**  
Merges mapped old and newly created tags, aggregates their IDs, and updates the original WordPress blog post with the correct tags.

- **Nodes Involved:**  
  - Merge  
  - Merge Old and Mapped Tags  
  - Aggregate  
  - Update a post  

- **Node Details:**  

  - **Merge**  
    - Type: Merge node (combine mode)  
    - Configuration: Combines existing tags from “Clean Data” and new tags from “Tagging Loop” matching by tag name  
    - Inputs: Cleaned existing tags and processed tags from loop  
    - Outputs: Complete list of tag objects with IDs  

  - **Merge Old and Mapped Tags**  
    - Type: Merge node  
    - Configuration: Combines outputs from “Switch” branches to unify all tags before aggregation  
    - Inputs: Outputs from “Switch” for old and new tags  
    - Outputs: Unified tag list  

  - **Aggregate**  
    - Type: Aggregate node  
    - Configuration: Aggregates all tag IDs into an array suitable for WordPress post update  
    - Inputs: Unified tag list  
    - Outputs: Aggregated array of tag IDs  

  - **Update a post**  
    - Type: WordPress node  
    - Configuration: Updates the blog post’s tags field with aggregated tag IDs  
    - Inputs: Post ID from “Fetch One WordPress Blog” and aggregated tag IDs  
    - Credentials: WordPress API credentials  
    - Outputs: Confirmation of update or error  
    - Edge cases: API errors, tag ID mismatches

---

### 3. Summary Table

| Node Name               | Node Type                          | Functional Role                                 | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                                                           |
|-------------------------|----------------------------------|------------------------------------------------|------------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Execute                 | Manual Trigger                   | Workflow start trigger                          | None                         | Fetch One WordPress Blog     |                                                                                                                                     |
| Fetch One WordPress Blog | WordPress API                   | Fetches one blog post                           | Execute                      | Blog Tags Generator          | ## 1. Fetch only one WordPress Blog(post) - Modify this according your use-case                                                       |
| Blog Tags Generator     | LangChain LLM Chain             | AI generates relevant tags                      | Fetch One WordPress Blog      | Split Out for Loop, Fetch All Tags | ## 2. Give relevant tags - AI Decide which tags are perfect for Blog post. We use structure output parser here for desired output. |
| 4.1 mini                | OpenAI GPT Chat (model 4.1-mini) | AI model for tag generation                      | Blog Tags Generator           | Blog Tags Generator          |                                                                                                                                     |
| 5-mini                  | OpenAI GPT Chat (model 5-mini)  | Alternative AI model for tag generation          | Blog Tags Generator           | Structured Output Parser      |                                                                                                                                     |
| Structured Output Parser | LangChain Output Parser         | Parses AI response into structured JSON          | 5-mini                       | Blog Tags Generator          |                                                                                                                                     |
| Split Out for Loop      | Split Out                      | Splits tags array into individual items          | Blog Tags Generator           | Tagging Loop                |                                                                                                                                     |
| Fetch All Tags          | HTTP Request (WordPress API)    | Fetches existing WordPress tags                   | Blog Tags Generator           | Clean Data                  | ## Fetch All Tags 🏷️                                                                                                               |
| Clean Data              | Split Out                      | Extracts id and name from tags                    | Fetch All Tags                | Merge                       |                                                                                                                                     |
| Tagging Loop            | Split In Batches               | Processes tags one by one in batches              | Split Out for Loop, Return Name Only, Return Tag ID & Name | Switch                      | ## 🏷️ Tagging loop - It is responsible for Create Tag and if Tag is already exist it return only name.                            |
| Switch                  | Switch                        | Routes tags based on existence (new or old)       | Tagging Loop                 | Merge, Merge Old and Mapped Tags | ## ➿ Logic for label mapping - It map already exist Tag name to it's actual Tag ID                                                  |
| Create New Tag          | HTTP Request (WordPress API)    | Creates new tag via API if not existing            | Switch (new tags branch)      | Return Tag ID & Name, Return Name Only |                                                                                                                                     |
| Return Tag ID & Name    | Set                           | Sets tag ID and name from created tag             | Create New Tag               | Tagging Loop                |                                                                                                                                     |
| Return Name Only        | Set                           | Sets tag name only for existing tags              | Create New Tag               | Tagging Loop                |                                                                                                                                     |
| Merge                   | Merge                         | Combines existing tags and mapped tags            | Clean Data, Switch            | Merge Old and Mapped Tags    |                                                                                                                                     |
| Merge Old and Mapped Tags | Merge                         | Merges all tags into a unified list                | Merge, Switch                | Aggregate                   |                                                                                                                                     |
| Aggregate               | Aggregate                     | Aggregates all tag IDs for post update             | Merge Old and Mapped Tags     | Update a post               |                                                                                                                                     |
| Update a post           | WordPress API                 | Updates the blog post with final tag IDs           | Aggregate                    | None                       |                                                                                                                                     |
| Sticky Note             | Sticky Note                    | Notes on tagging loop                              | None                         | None                       | ## 🏷️ Tagging loop - It is responsible for Create Tag and if Tag is already exist it return only name.                            |
| Sticky Note1            | Sticky Note                    | Overview and project description                   | None                         | None                       | ## AI-Powered WordPress Blog Auto-Tagging ... See detailed overview in node content                                                |
| Sticky Note2            | Sticky Note                    | Notes on AI tag generation block                    | None                         | None                       | ## 2.  Give relevant tags - AI Decide which tags are perfect for Blog post. We use structure output parser here for desired output. |
| Sticky Note3            | Sticky Note                    | Notes on fetching one WordPress blog                | None                         | None                       | ## 1. Fetch only one WordPress Blog(post) - Modify this according your use-case                                                       |
| Sticky Note4            | Sticky Note                    | Notes on AI-generated tags                           | None                         | None                       | ## 2.  Give relevant tags - AI Decide which tags are perfect for Blog post. We use structure output parser here for desired output. |
| Sticky Note5            | Sticky Note                    | Notes on label mapping logic                         | None                         | None                       | ## ➿ Logic for label mapping - It map already exist Tag name to it's actual Tag ID                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create `Execute` node (Manual Trigger):**  
   - Type: Manual Trigger  
   - Purpose: To start workflow manually.

2. **Create `Fetch One WordPress Blog` node:**  
   - Type: WordPress node  
   - Operation: `getAll` with `limit=1` (fetch latest post)  
   - Credentials: Configure WordPress API with App Password  
   - Connect `Execute` → `Fetch One WordPress Blog`.

3. **Create `4.1 mini` node:**  
   - Type: OpenAI GPT Chat  
   - Model: GPT-4.1-mini  
   - Input: Pass blog content (e.g., `{{$json["content"]["rendered"]}}`)  
   - Credentials: OpenAI API token configured.

4. **Create `5-mini` node:**  
   - Type: OpenAI GPT Chat  
   - Model: GPT-5-mini  
   - Credentials: Same as above.

5. **Create `Structured Output Parser` node:**  
   - Type: LangChain output parser  
   - Configure with JSON schema example:  
     ```json
     { "tags": ["tag1", "tag2", "tag3"] }
     ```  
   - Enable `autoFix` to correct minor issues.  
   - Connect `5-mini` → `Structured Output Parser`.

6. **Create `Blog Tags Generator` node:**  
   - Type: LangChain LLM Chain  
   - Prompt:  
     - Input: `{{$json.content.rendered}}`  
     - Instructions: Generate 5-10 SEO-friendly tags, comma separated, no extra text or explanations.  
   - Output parser: Enabled (linked to `Structured Output Parser`).  
   - Connect `Fetch One WordPress Blog` → `Blog Tags Generator`.  
   - Connect `Structured Output Parser` → `Blog Tags Generator` (output parser).

7. **Create `Split Out for Loop` node:**  
   - Type: Split Out  
   - Field to split: `output.tags`  
   - Connect `Blog Tags Generator` → `Split Out for Loop`.

8. **Create `Fetch All Tags` node:**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://<your-website-domain>/wp-json/wp/v2/tags`  
   - Query Parameter: `per_page=100`  
   - Authentication: WordPress API credentials  
   - Connect `Blog Tags Generator` → `Fetch All Tags`.

9. **Create `Clean Data` node:**  
   - Type: Split Out  
   - Extract fields: `id` and `name` from fetched tags  
   - Connect `Fetch All Tags` → `Clean Data`.

10. **Create `Tagging Loop` node:**  
    - Type: Split In Batches  
    - Default batch size (1 or more)  
    - Connect `Split Out for Loop` → `Tagging Loop`.

11. **Create `Switch` node:**  
    - Type: Switch  
    - Rules:  
      - Output “Old Tags” if `id` does NOT exist (tag does not exist)  
      - Output “New Tags” if `id` exists (tag exists)  
    - Connect `Tagging Loop` → `Switch`.

12. **Create `Create New Tag` node:**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://<your-domain>/wp-json/wp/v2/tags`  
    - Body Parameter: `name` = current tag name (`{{$json['output.tags']}}`)  
    - Authentication: WordPress API credentials  
    - On error: Continue workflow (to handle duplicate or failure gracefully)  
    - Connect `Switch (New Tags)` → `Create New Tag`.

13. **Create `Return Tag ID & Name` node:**  
    - Type: Set  
    - Fields:  
      - `id` = `{{$json.id}}` (from created tag response)  
      - `name` = `{{$json.name}}`  
    - Connect `Create New Tag` → `Return Tag ID & Name`.

14. **Create `Return Name Only` node:**  
    - Type: Set  
    - Field: `name` = `{{$json['output.tags']}}`  
    - Connect `Create New Tag` error output → `Return Name Only` (to continue loop on failure).  
    - Also connect `Switch (Old Tags)` → `Return Name Only`.

15. **Connect `Return Tag ID & Name` and `Return Name Only` back to `Tagging Loop` to continue processing.**

16. **Create `Merge` node:**  
    - Mode: Combine  
    - Field to match: `name`  
    - Connect `Clean Data` and `Switch (Old Tags)` outputs → `Merge`.

17. **Create `Merge Old and Mapped Tags` node:**  
    - Mode: Default (merge all inputs)  
    - Connect `Merge` and `Switch (New Tags)` → `Merge Old and Mapped Tags`.

18. **Create `Aggregate` node:**  
    - Aggregate field: `id` (collect all tag IDs)  
    - Connect `Merge Old and Mapped Tags` → `Aggregate`.

19. **Create `Update a post` node:**  
    - Type: WordPress  
    - Operation: Update post  
    - Post ID: Set to `{{$node["Fetch One WordPress Blog"].json["id"]}}`  
    - Update field: `tags` = aggregated array of tag IDs  
    - Credentials: WordPress API credentials  
    - Connect `Aggregate` → `Update a post`.

20. **Add Sticky Notes:** Add descriptive sticky notes at key blocks for clarity and maintenance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                  | Context or Link                                                                                                                   |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| The workflow automates SEO tag management for WordPress blogs by leveraging AI-generated tags and intelligent checking for duplicates, avoiding issues like case-sensitive duplicates (e.g., "AI" vs "Ai").                                                                                      | Workflow overview, Sticky Note1                                                                                                  |
| Replace all placeholder URLs (`https://<your-domain>`) in HTTP Request nodes with your actual WordPress site domain. Ensure WordPress REST API is accessible and your credentials have appropriate permissions.                                                                                 | Configuration instructions in HTTP Request nodes                                                                                 |
| WordPress credentials require App Password authentication configured in n8n credential manager. OpenAI credentials require API keys with access to GPT-4.1-mini and GPT-5-mini models.                                                                                                      | Credential setup notes                                                                                                           |
| The AI prompt is carefully crafted to produce comma-separated tags only, with no extra text or explanation, ensuring cleaner parsing and consistency. The structured output parser helps enforce this format.                                                                                 | Prompt design details in Blog Tags Generator node                                                                                |
| The tagging loop handles errors gracefully during tag creation, allowing the workflow to continue even if a tag already exists or an API error occurs.                                                                                                                                      | Error handling in Create New Tag node                                                                                            |
| The workflow currently fetches only the latest blog post by default. Modify the “Fetch One WordPress Blog” node to target specific posts or batch process multiple posts as needed.                                                                                                           | Sticky Note3                                                                                                                    |
| For large tag sets exceeding 100 items, pagination may be required in “Fetch All Tags” node to retrieve all existing tags from WordPress.                                                                                                                                                   | WordPress REST API pagination documentation                                                                                      |
| This workflow uses n8n native nodes and community LangChain nodes for AI integration, providing a flexible and extensible architecture for AI-powered WordPress content management.                                                                                                          | General architecture notes                                                                                                      |
| For more information about WordPress REST API tags endpoint: https://developer.wordpress.org/rest-api/reference/tags/                                                                                                                                                                        | Official WordPress REST API documentation                                                                                       |
| For OpenAI model info and best practices: https://platform.openai.com/docs/models                                                                                                                                                                                                             | OpenAI official docs                                                                                                            |

---

**Disclaimer:** The text provided stems solely from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.