Auto-Generate WordPress Blog Tags with GPT-4.1-mini and Smart Tag Mapping

https://n8nworkflows.xyz/workflows/auto-generate-wordpress-blog-tags-with-gpt-4-1-mini-and-smart-tag-mapping-11136


# Auto-Generate WordPress Blog Tags with GPT-4.1-mini and Smart Tag Mapping

### 1. Workflow Overview

This workflow automates the generation and assignment of SEO-friendly tags to WordPress blog posts using AI (GPT-4.1-mini). The primary goal is to enhance blog post metadata for improved searchability without manual intervention. It intelligently handles existing tags to avoid duplicates and updates posts with the correct tag IDs.

**Target Use Cases:**
- WordPress site owners wanting automated, AI-driven blog tagging.
- SEO teams aiming to streamline metadata management.
- Content platforms requiring consistent and relevant tag application.

**Logical Blocks:**

- **1.1 Input Reception:** Manual trigger to start the process and fetch a single WordPress blog post.
- **1.2 AI Processing:** Use GPT-4.1-mini to analyze blog content and generate relevant tags with structured output parsing.
- **1.3 Tag Existence Check & Mapping:** Fetch all existing WordPress tags and map generated tags to existing IDs to prevent duplicates.
- **1.4 Tag Creation Loop:** Loop through tags, create new ones if not existing, or reuse existing IDs.
- **1.5 Aggregate and Update Post:** Aggregate all tag IDs and update the original WordPress post with the new tag list.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Starts the workflow manually and fetches one WordPress blog post for tagging.

**Nodes Involved:**  
- Execute (Manual Trigger)  
- Fetch One WordPress Blog

**Node Details:**  

- **Execute**  
  - Type: Manual Trigger  
  - Role: Initiates the workflow manually.  
  - Config: No parameters; simple trigger node.  
  - Inputs: None  
  - Outputs: Connects to "Fetch One WordPress Blog"  
  - Failures: None expected  

- **Fetch One WordPress Blog**  
  - Type: WordPress API  
  - Role: Retrieves a single blog post from WordPress (default is latest post).  
  - Config: Operation: getAll; Limit: 1; Credentials: WordPress with App Password.  
  - Inputs: From Execute node  
  - Outputs: JSON with post content and metadata  
  - Failures: API auth errors, network issues, no posts found  
  - Notes: Can be modified to fetch specific posts by ID  

---

#### 1.2 AI Processing

**Overview:**  
Uses GPT-4.1-mini to generate 5-10 relevant, SEO-friendly tags from the blog post content. Output is structured for easy parsing.

**Nodes Involved:**  
- 4.1 mini (OpenAI GPT model)  
- Structured Output Parser  
- Blog Tags Generator  
- Split Out for Loop

**Node Details:**  

- **4.1 mini**  
  - Type: OpenAI Chat Model (GPT-4.1-mini)  
  - Role: Generates tags based on blog content.  
  - Config: Model set to "gpt-4.1-mini"; no special options.  
  - Inputs: Blog content from "Fetch One WordPress Blog"  
  - Outputs: Raw AI response with tags  
  - Failures: API quota, timeout, invalid prompts  

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses AI response to JSON array of tags.  
  - Config: AutoFix enabled; expects JSON with "tags" array, e.g. ["tag1", "tag2"]  
  - Inputs: AI output from "5-mini" or "4.1 mini" (in this flow, "5-mini" connected but no direct output used here; main flow uses "4.1 mini")  
  - Outputs: Parsed structured data  
  - Failures: Parsing errors if AI output is malformed  

- **Blog Tags Generator**  
  - Type: LangChain LLM Chain  
  - Role: Contains prompt with strict rules to output only comma-separated tags without explanation.  
  - Config: Prompt includes instructions for SEO-friendly tags, examples, and forbids explanations or lists.  
  - Inputs: Blog content from "Fetch One WordPress Blog"  
  - Outputs: Tag string for parsing  
  - Failures: Incorrect AI output formatting  

- **Split Out for Loop**  
  - Type: Split Out  
  - Role: Splits the array of tags into individual items for processing.  
  - Config: Splits on `output.tags` field.  
  - Inputs: Parsed tags from "Blog Tags Generator"  
  - Outputs: Individual tags for looping  
  - Failures: Empty or missing tags array  

---

#### 1.3 Tag Existence Check & Mapping

**Overview:**  
Fetches all existing WordPress tags and maps generated tags to existing tag IDs to avoid duplicates.

**Nodes Involved:**  
- Fetch All Tags  
- Clean Data  
- Merge  
- Merge Old and Mapped Tags  
- Switch

**Node Details:**  

- **Fetch All Tags**  
  - Type: HTTP Request (WordPress REST API)  
  - Role: Retrieves all tags from WordPress (up to 100 per page).  
  - Config: GET request to `/wp-json/wp/v2/tags?per_page=100`; uses WordPress credentials.  
  - Inputs: Parallel to tag generation flow  
  - Outputs: List of existing tags with IDs and names  
  - Failures: API limits, auth errors  

- **Clean Data**  
  - Type: Split Out  
  - Role: Extracts only relevant tag fields (name and id) for matching.  
  - Config: Keeps fields: "name" and splits out "id"  
  - Inputs: Tag list from Fetch All Tags  
  - Outputs: Cleaned tag objects  
  - Failures: Missing fields  

- **Merge**  
  - Type: Merge  
  - Role: Combines AI-generated tags with existing tags by matching tag names.  
  - Config: Mode: Combine; matches by "name" field.  
  - Inputs: Cleaned existing tags and newly generated tags (from Split Out for Loop)  
  - Outputs: Merged data with info if tags exist or not  
  - Failures: Matching errors if fields missing  

- **Switch**  
  - Type: Switch  
  - Role: Decides if a tag exists (has an ID) or is new (no ID).  
  - Config: Conditions check if `id` exists or not.  
  - Inputs: From Merge node  
  - Outputs:  
    - "Old Tags" branch: tag exists, send to Merge Old and Mapped Tags  
    - "New Tags" branch: tag missing, send to Create New Tag  
  - Failures: Logic errors if input is malformed  

- **Merge Old and Mapped Tags**  
  - Type: Merge  
  - Role: Combines tags that already exist with those newly created to prepare for aggregation.  
  - Config: Default merge mode.  
  - Inputs: From Switch "Old Tags" and from Return Name Only (new tags)  
  - Outputs: Combined list of tags for aggregation  
  - Failures: None expected  

---

#### 1.4 Tag Creation Loop

**Overview:**  
Processes each tag individually: creates new tags if they don't exist, or returns existing tag IDs.

**Nodes Involved:**  
- Tagging Loop (Split in Batches)  
- Create New Tag (HTTP Request)  
- Return Tag ID & Name (Set)  
- Return Name Only (Set)

**Node Details:**  

- **Tagging Loop**  
  - Type: Split in Batches  
  - Role: Loops through each tag (new or old) for processing.  
  - Config: Default batch size 1; processes tags one by one.  
  - Inputs: From Split Out for Loop and Return Name Only  
  - Outputs: To Switch node and Create New Tag  
  - Failures: Batch errors, empty inputs  

- **Create New Tag**  
  - Type: HTTP Request (WordPress REST API)  
  - Role: Creates a new tag via WordPress API if it does not exist.  
  - Config: POST to `/wp-json/wp/v2/tags` with body parameter "name" set to tag name.  
  - Inputs: From Switch "New Tags" branch  
  - Outputs: Returns created tag data with ID and name  
  - Failures: API errors, duplicate tag rejection, network errors  
  - OnError: Continues on error to avoid workflow stop  

- **Return Tag ID & Name**  
  - Type: Set  
  - Role: Formats the output to include tag ID and name for further processing.  
  - Config: Sets fields: id (number) and name (string) from HTTP response JSON.  
  - Inputs: From Create New Tag  
  - Outputs: To Tagging Loop for further merging  
  - Failures: Missing fields in response  

- **Return Name Only**  
  - Type: Set  
  - Role: Returns only the tag name when tag creation fails or tag already exists.  
  - Config: Sets field "name" from original tag name.  
  - Inputs: From Create New Tag error or Switch outputs  
  - Outputs: To Tagging Loop for reprocessing  
  - Failures: None expected  

---

#### 1.5 Aggregate and Update Post

**Overview:**  
Aggregates all tag IDs and updates the original WordPress post to assign these tags.

**Nodes Involved:**  
- Aggregate  
- Update a post

**Node Details:**  

- **Aggregate**  
  - Type: Aggregate  
  - Role: Combines all tag IDs into one array for update.  
  - Config: Aggregates the "id" field from merged tags.  
  - Inputs: From Merge Old and Mapped Tags  
  - Outputs: Array of tag IDs  
  - Failures: Empty aggregation if no tags processed  

- **Update a post**  
  - Type: WordPress API  
  - Role: Updates the WordPress post with the aggregated tag IDs.  
  - Config: Operation: update; Post ID from the original fetched post; Tags field updated with aggregated tag IDs.  
  - Inputs: From Aggregate node  
  - Outputs: Confirmation of post update  
  - Failures: API errors, invalid post ID, network issues  

---

### 3. Summary Table

| Node Name                | Node Type                       | Functional Role                           | Input Node(s)                  | Output Node(s)                | Sticky Note                                                                                                              |
|--------------------------|--------------------------------|-----------------------------------------|-------------------------------|------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Execute                  | Manual Trigger                 | Workflow Start                          |                               | Fetch One WordPress Blog      |                                                                                                                          |
| Fetch One WordPress Blog | WordPress API                  | Fetch single blog post                   | Execute                       | Blog Tags Generator           | ## 1. Fetch only one WordPress Blog(post)\n- Modify this according your use-case                                          |
| Blog Tags Generator      | LangChain LLM Chain            | Generate tags via AI                     | Fetch One WordPress Blog       | Split Out for Loop, Fetch All Tags | ## 2.  Give relevant tags\n🤖 AI Decide which tags are perfect for Blog post. We use structure output parser here for desired output. |
| 4.1 mini                 | OpenAI Chat Model              | AI model generating tags                 | Fetch One WordPress Blog       | Blog Tags Generator           |                                                                                                                          |
| Structured Output Parser | LangChain Output Parser        | Parses AI response to structured JSON   | 5-mini                        | Blog Tags Generator           |                                                                                                                          |
| Split Out for Loop       | Split Out                     | Split tags array into individual tags   | Blog Tags Generator            | Tagging Loop                 |                                                                                                                          |
| Fetch All Tags           | HTTP Request (WordPress API)  | Retrieve existing tags from WordPress   | Blog Tags Generator            | Clean Data                   | ## Fetch All Tags 🏷️                                                                                                     |
| Clean Data               | Split Out                     | Extract name and id fields from tags    | Fetch All Tags                 | Merge                        |                                                                                                                          |
| Merge                    | Merge                         | Combine AI generated and existing tags  | Clean Data, Split Out for Loop | Switch                       |                                                                                                                          |
| Switch                   | Switch                        | Decide if tag exists or needs creation  | Merge                         | Merge Old and Mapped Tags, Create New Tag |                                                                                                                          |
| Merge Old and Mapped Tags| Merge                         | Combine mapped existing tags and new tags | Switch, Return Name Only       | Aggregate                    | ## ➿ Logic for label mapping\nIt map already exist Tag name to it's actual Tag ID                                         |
| Tagging Loop             | Split in Batches              | Loop through each tag for creation/mapping | Split Out for Loop, Return Name Only | Switch, Create New Tag        | ## 🏷️ Tagging loop \nIt is responsible for Create Tag and if Tag is already exist it return only name.                   |
| Create New Tag           | HTTP Request (WordPress API)  | Create new tag in WordPress              | Switch                       | Return Tag ID & Name, Return Name Only |                                                                                                                          |
| Return Tag ID & Name     | Set                           | Format created tag data                   | Create New Tag                | Tagging Loop                 |                                                                                                                          |
| Return Name Only         | Set                           | Return tag name only when creation fails | Create New Tag               | Tagging Loop                 |                                                                                                                          |
| Aggregate                | Aggregate                     | Aggregate all tag IDs                     | Merge Old and Mapped Tags      | Update a post                |                                                                                                                          |
| Update a post            | WordPress API                  | Update blog post with tag IDs             | Aggregate                    |                              |                                                                                                                          |
| Sticky Note              | Sticky Note                   | Notes on tag creation loop                 |                               |                              | ## 🏷️ Tagging loop \nIt is responsible for Create Tag and if Tag is already exist it return only name.                   |
| Sticky Note2             | Sticky Note                   | Note on fetching all tags                   |                               |                              | ## Fetch All Tags 🏷️                                                                                                     |
| Sticky Note3             | Sticky Note                   | Note on fetching one blog post               |                               |                              | ## 1. Fetch only one WordPress Blog(post)\n- Modify this according your use-case                                          |
| Sticky Note4             | Sticky Note                   | Note on AI tag generation                     |                               |                              | ## 2.  Give relevant tags\n🤖 AI Decide which tags are perfect for Blog post. We use structure output parser here for desired output. |
| Sticky Note5             | Sticky Note                   | Note on tag mapping logic                      |                               |                              | ## ➿ Logic for label mapping\nIt map already exist Tag name to it's actual Tag ID                                         |
| Sticky Note1             | Sticky Note                   | Full workflow description and usage notes     |                               |                              | ## AI-Powered WordPress Blog Auto-Tagging\nAutomates tag generation and assignment with AI and smart duplicate prevention. |

---

### 4. Reproducing the Workflow from Scratch

1. **Add a Manual Trigger node** named `Execute`. This node will start the workflow manually.

2. **Add a WordPress API node** named `Fetch One WordPress Blog`:  
   - Credentials: WordPress API with App Password.  
   - Operation: `getAll`.  
   - Limit: 1 (fetch latest post).  
   - Connect `Execute` → `Fetch One WordPress Blog`.

3. **Add a LangChain LLM Chain node** named `Blog Tags Generator`:  
   - Configure the prompt to instruct AI to output 5-10 comma-separated SEO-friendly tags based on the input blog content.  
   - Input expression: `=Input:\n{{ $json.content.rendered }}` (pull blog content).  
   - Attach an output parser (Structured Output Parser) to format AI response as JSON array of tags.  
   - Connect `Fetch One WordPress Blog` → `Blog Tags Generator`.

4. **Add a Structured Output Parser node**:  
   - Set `autoFix` to true.  
   - Provide JSON schema example: `{ "tags": ["tag1", "tag2", "tag3"] }`.  
   - Connect the AI model output to this parser.

5. **Add a Split Out node** named `Split Out for Loop`:  
   - Field to split out: `output.tags`.  
   - Connect `Blog Tags Generator` → `Split Out for Loop`.

6. **Add an HTTP Request node** named `Fetch All Tags`:  
   - Method: GET.  
   - URL: `https://<your-website-domain>/wp-json/wp/v2/tags?per_page=100`.  
   - Authentication: WordPress credentials.  
   - Connect `Blog Tags Generator` → `Fetch All Tags`.

7. **Add a Split Out node** named `Clean Data`:  
   - Fields to include: `name`.  
   - Field to split out: `id`.  
   - Connect `Fetch All Tags` → `Clean Data`.

8. **Add a Merge node** named `Merge`:  
   - Mode: Combine.  
   - Match fields: `name` (string).  
   - Connect `Clean Data` and `Split Out for Loop` to this node.

9. **Add a Switch node** named `Switch`:  
   - Add two rules:  
     - Output "Old Tags" if `id` is NOT present (tag already exists).  
     - Output "New Tags" if `id` EXISTS (tag does not exist).  
   - Connect `Merge` → `Switch`.

10. **Add a Merge node** named `Merge Old and Mapped Tags`:  
    - Connect "Old Tags" output of `Switch` → `Merge Old and Mapped Tags`.

11. **Add a Split in Batches node** named `Tagging Loop`:  
    - Connect `Split Out for Loop` and output of `Return Name Only` (step 14) → `Tagging Loop`.  
    - Connect `Tagging Loop` → `Switch` and `Create New Tag`.

12. **Add an HTTP Request node** named `Create New Tag`:  
    - Method: POST.  
    - URL: `https://<your-domain>/wp-json/wp/v2/tags`.  
    - Body Parameter: `name` = `={{ $json['output.tags'] }}`.  
    - Authentication: WordPress credentials.  
    - On Error: Continue workflow.  
    - Connect `Switch` (New Tags output) → `Create New Tag`.

13. **Add a Set node** named `Return Tag ID & Name`:  
    - Assign variables:  
      - `id` = `={{ $json.id }}` (number)  
      - `name` = `={{ $json.name }}` (string)  
    - Connect `Create New Tag` success output → `Return Tag ID & Name`.

14. **Add a Set node** named `Return Name Only`:  
    - Assign variable:  
      - `name` = `={{ $json['output.tags'] }}`  
    - Connect `Create New Tag` error output → `Return Name Only`.  
    - Connect `Return Name Only` → `Tagging Loop`.

15. **Connect `Return Tag ID & Name` → `Tagging Loop`** so new tags are reprocessed.

16. **Connect `Merge Old and Mapped Tags` → `Aggregate` node**:  
    - Aggregate field: `id` (all tag IDs).

17. **Add a WordPress API node** named `Update a post`:  
    - Operation: Update.  
    - Post ID: `={{ $('Fetch One WordPress Blog').item.json.id }}`.  
    - Update field: `tags` = `={{ $json.id }}` (aggregated tag IDs array).  
    - Connect `Aggregate` → `Update a post`.

18. **Add Sticky Notes (optional but recommended)** to document blocks and logic for maintainability.

19. **Replace placeholder URLs** (`https://<your-domain>`) in HTTP Request nodes with your actual WordPress domain.

20. **Configure Credentials:**  
    - WordPress API with App Password credentials for WordPress nodes and HTTP Requests.  
    - OpenAI API credentials for LangChain nodes using GPT-4.1-mini.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                      | Context or Link                                           |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| This workflow automates your SEO strategy by using AI to generate relevant tags for your WordPress posts, preventing duplicates such as "AI" and "Ai". It fetches blog content, generates tags, checks existing tags, creates new tags if needed, and updates the post accordingly.                                                                                                             | Workflow overview sticky note                             |
| Setup requires configuration of WordPress credentials (App Password) and OpenAI API keys. Update the URLs in "Fetch All Tags" and "Create New Tag" nodes to your WordPress domain before running.                                                                                                                                                                                               | Setup instructions sticky note                            |
| The AI prompt enforces strict output rules to ensure only tags are returned, formatted as comma-separated values without explanations or extra text, supporting SEO best practices.                                                                                                                                                                                                               | Prompt design in Blog Tags Generator node                 |
| Tag creation handles errors gracefully, continuing the workflow if a tag cannot be created to avoid process interruption.                                                                                                                                                                                                                                                                          | Create New Tag node onError setting                       |
| The workflow uses batching and splitting techniques for efficient tag processing and to handle WordPress API rate limits gracefully.                                                                                                                                                                                                                                                              | Tagging Loop node and Split Out nodes                     |
| For more information on WordPress REST API tags endpoint: https://developer.wordpress.org/rest-api/reference/tags/                                                                                                                                                                                                                                                                               | WordPress REST API documentation                          |
| For OpenAI API usage and LangChain nodes, see n8n documentation on integrating OpenAI and LangChain: https://docs.n8n.io/integrations/builtin/n8n-nodes-langchain/                                                                                                                                                                                                                             | n8n LangChain and OpenAI docs                             |

---

**Disclaimer:** The content provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.