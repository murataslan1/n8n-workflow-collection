Auto-Generate Instagram Content Schedule with GPT-4, Apify, and Google Sheets

https://n8nworkflows.xyz/workflows/auto-generate-instagram-content-schedule-with-gpt-4--apify--and-google-sheets-6977


# Auto-Generate Instagram Content Schedule with GPT-4, Apify, and Google Sheets

### 1. Workflow Overview

This workflow automates the generation of an Instagram content schedule by combining strategic inputs, scraped blog post data, and AI-driven caption and hashtag creation. It is designed for content creators, marketing teams, or local businesses to efficiently plan and personalize social media posts aligned with brand voice, seasonal context, and holidays.

The workflow comprises three primary logical blocks:

- **1.1 Input Acquisition and Preparation**  
  Reads and merges two types of inputs: manually defined content strategy data (pillars, objectives, frequency, formats, examples) and blog post metadata scraped from websites, including preferred posting months.

- **1.2 Content Scheduling and Enrichment**  
  Processes input data to generate a detailed posting calendar with dates, content pillars, formats, and seasonal context. It also identifies holidays to tailor posts accordingly.

- **1.3 AI-Powered Content Generation and Export**  
  Uses GPT-4 via an AI Agent to create Instagram captions, visual descriptions, and hashtags based on the scheduled content, then exports the finalized schedule and content to Google Sheets for review and publishing.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Acquisition and Preparation

**Overview:**  
This block collects initial content strategy inputs and blog post data, scrapes blog posts via Apify, extracts relevant metadata, and merges all inputs to prepare for scheduling.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Read data (Google Sheets)  
- Scrape blog posts (HTTP Request)  
- Extract title, description, url (Code)  
- Input preferred blog month (Google Sheets)  
- Wait to prevent request limit (Wait)  
- Read preferred blog month (Google Sheets)  
- Merge (Merge)  

**Node Details:**

- **When clicking ‘Test workflow’**  
  - *Type*: Manual Trigger  
  - *Role*: Entry point to manually start the workflow  
  - *Connections*: Outputs to "Read data" and "Scrape blog posts" in parallel  
  - *Failure cases*: None specific; depends on manual trigger  

- **Read data**  
  - *Type*: Google Sheets  
  - *Role*: Reads the initial content strategy inputs (pillars, objectives, frequency, format, structure, examples) from a Google Sheet tab (e.g., "Input" or "Strategy")  
  - *Credentials*: Google Sheets OAuth2  
  - *Connections*: Outputs to "Merge" node  
  - *Edge cases*: Sheet access permissions, empty or malformed data  

- **Scrape blog posts**  
  - *Type*: HTTP Request  
  - *Role*: Scrapes blog post data using Apify API (configured outside the JSON)  
  - *Parameters*: Method and URL tailored to Apify actor usage (POST for live scrape or GET for dataset retrieval), includes API token  
  - *Connections*: Outputs to "Extract title, description, url"  
  - *Edge cases*: HTTP errors, rate limits, malformed responses, API token issues  

- **Extract title, description, url**  
  - *Type*: Code  
  - *Role*: Parses scraped blog post JSON to extract and filter out blog posts with valid title and URL  
  - *Key expressions*: Extracts `metadata.title`, `metadata.canonicalUrl`, `metadata.description`  
  - *Connections*: Outputs to "Input preferred blog month"  
  - *Edge cases*: Missing fields in scraped data, empty results  

- **Input preferred blog month**  
  - *Type*: Google Sheets  
  - *Role*: Appends or updates the preferred posting month for each blog post in a dedicated sheet tab (e.g., "Input (blog month)")  
  - *Credentials*: Google Sheets OAuth2  
  - *Connections*: Outputs to "Wait to prevent request limit"  
  - *Edge cases*: Sheet access, rate limits  

- **Wait to prevent request limit**  
  - *Type*: Wait  
  - *Role*: Pauses workflow briefly to avoid exceeding API request limits before reading preferred months  
  - *Connections*: Outputs to "Read preferred blog month"  
  - *Edge cases*: None significant  

- **Read preferred blog month**  
  - *Type*: Google Sheets  
  - *Role*: Reads the preferred posting month data for blog posts from Google Sheets  
  - *Credentials*: Google Sheets OAuth2  
  - *Connections*: Outputs to "Merge" (second input)  
  - *Edge cases*: Sheet access issues  

- **Merge**  
  - *Type*: Merge  
  - *Role*: Combines the content strategy inputs and blog post data (including preferred months) into a unified dataset for scheduling  
  - *Connections*: Outputs to "Extract Information"  
  - *Edge cases*: Data alignment issues, empty inputs  

---

#### 2.2 Content Scheduling and Enrichment

**Overview:**  
This block generates the Instagram posting schedule between specified dates, determines posting days, assigns content pillars and formats, incorporates blog posts according to preferred months, and identifies holidays to customize posts.

**Nodes Involved:**  
- Extract Information (Code)  
- Loop Over Items (SplitInBatches)  
- Identify holiday (Code)  

**Node Details:**

- **Extract Information**  
  - *Type*: Code  
  - *Role*: Core scheduling logic that iterates over a date range (July 7, 2025 to January 30, 2026), selecting only Monday, Wednesday, and Friday for posts, and assigns content pillars and formats based on frequency and availability of blog posts. It also cycles through sub-themes for service and process pillars, applies fallback pillars, and calculates the season stage (e.g., Early Winter, Mid Spring).  
  - *Key expressions*: Custom functions for date calculations, seasonal stage determination, frequency interpretation, and selection logic for blog posts and fallback content.  
  - *Connections*: Outputs scheduled content items to "Loop Over Items" for batch processing  
  - *Edge cases*: Overlapping pillar assignments, no blog posts for preferred months, date range misconfiguration  

- **Loop Over Items**  
  - *Type*: SplitInBatches  
  - *Role*: Processes scheduled content items one at a time or in batches to handle API rate limits and sequential processing  
  - *Parameters*: Default batch size (unspecified)  
  - *Connections*: Outputs each item to "No Operation, do nothing" and "Identify holiday" nodes  
  - *Edge cases*: Batch size too large causing API throttling  

- **Identify holiday**  
  - *Type*: Code  
  - *Role*: For each scheduled post, detects if the date coincides with a US holiday (fixed or floating, e.g., Mother’s Day, Easter) and adds a "Holiday" field to the post JSON for contextual AI content customization  
  - *Key expressions*: Functions to calculate nth weekday, last weekday of the month, hardcoded Easter dates for accuracy  
  - *Connections*: Outputs to "AI Agent - content schedule"  
  - *Edge cases*: Unrecognized holidays, rare date edge cases (e.g., Halloween on October 31st correctly handled)  

---

#### 2.3 AI-Powered Content Generation and Export

**Overview:**  
This block uses GPT-4 via n8n's LangChain AI Agent to generate Instagram captions, visual descriptions, and hashtags tailored to the scheduled post details and holidays. The enriched content is then formatted and exported to Google Sheets.

**Nodes Involved:**  
- AI Agent - content schedule (@n8n/n8n-nodes-langchain.agent)  
- reference (@n8n/n8n-nodes-langchain.toolCode)  
- Caption, Description, Hashtags (Code)  
- Rename Fields (Set)  
- Wait (Wait)  
- Export Data (Google Sheets)  
- No Operation, do nothing (NoOp)  

**Node Details:**

- **AI Agent - content schedule**  
  - *Type*: LangChain AI Agent (GPT-4)  
  - *Role*: Generates a tailored Instagram caption, visual description, and hashtags based on inputs: Pillar, Format, Holiday, SeasonStage, Blog Title & URL, Blog Description, and provided examples. Employs detailed instructions to maintain brand voice (luxury, sincere, emotionally grounded), seasonal sensitivity, and engagement strategies.  
  - *Configuration*: Uses a system message defining brand tone and content rules; prompt text dynamically populated from the scheduled post item fields.  
  - *Connections*: Receives input from "Identify holiday"; outputs to "Caption, Description, Hashtags"  
  - *Edge cases*: API rate limits, prompt formatting issues, unexpected AI output structure  

- **reference**  
  - *Type*: LangChain ToolCode  
  - *Role*: Provides the AI Agent with visual description references from a curated list of themed examples (e.g., "Framed Portrait in Home", "Father’s Day Collage") to guide generation of image descriptions matching brand style.  
  - *Key expressions*: Matches input query to themes and returns a relevant description or a random fallback.  
  - *Connections*: Connected as an AI tool to "AI Agent - content schedule" to enrich prompt context  
  - *Edge cases*: No theme match found, fallback randomness  

- **Caption, Description, Hashtags**  
  - *Type*: Code  
  - *Role*: Parses the AI Agent’s multi-line output (caption, visual description, hashtags) into separate JSON fields by detecting section headers and cleaning whitespace.  
  - *Connections*: Outputs parsed fields to "Rename Fields"  
  - *Edge cases*: Unexpected AI output format, missing sections  

- **Rename Fields**  
  - *Type*: Set  
  - *Role*: Maps parsed fields and scheduling metadata (Date, Day, Pillar, Format, Description) into final output structure for export.  
  - *Connections*: Outputs to "Wait" node  
  - *Edge cases*: Missing fields, misalignment with original data  

- **Wait**  
  - *Type*: Wait  
  - *Role*: Provides a short delay before exporting data to manage API load and timing  
  - *Connections*: Outputs to "Export Data"  
  - *Edge cases*: None significant  

- **Export Data**  
  - *Type*: Google Sheets  
  - *Role*: Appends the finalized content schedule with captions, descriptions, hashtags, and metadata into the "Output" tab of the Google Sheet for manual review and publishing.  
  - *Credentials*: Google Sheets OAuth2  
  - *Edge cases*: Sheet access permissions, API rate limits, data format issues  

- **No Operation, do nothing**  
  - *Type*: NoOp  
  - *Role*: Placeholder node for workflow branching, no functional processing  
  - *Connections*: Receives from "Loop Over Items" but outputs no further nodes  
  - *Edge cases*: None  

---

### 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                                    | Input Node(s)                    | Output Node(s)                | Sticky Note                                                                                                             |
|------------------------------|----------------------------------|---------------------------------------------------|---------------------------------|------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                   | Workflow entry point                              | -                               | Read data, Scrape blog posts  | Try It Out! Explains overall workflow purpose, inputs, outputs, and setup instructions                                   |
| Read data                    | Google Sheets                   | Reads content strategy data                        | When clicking ‘Test workflow’    | Merge                        | See Input #1 sticky note with screenshot of initial input tab                                                           |
| Scrape blog posts            | HTTP Request                   | Scrapes blog post metadata from website           | When clicking ‘Test workflow’    | Extract title, description, url | See Input #2 sticky note with screenshot of blog input tab                                                               |
| Extract title, description, url | Code                           | Extracts blog metadata fields                       | Scrape blog posts                | Input preferred blog month    |                                                                                                                         |
| Input preferred blog month   | Google Sheets                   | Appends preferred posting month for blogs         | Extract title, description, url  | Wait to prevent request limit |                                                                                                                         |
| Wait to prevent request limit | Wait                           | Delays workflow to manage API rate limits          | Input preferred blog month       | Read preferred blog month     |                                                                                                                         |
| Read preferred blog month    | Google Sheets                   | Reads preferred posting months                     | Wait to prevent request limit    | Merge                        |                                                                                                                         |
| Merge                       | Merge                          | Combines content strategy and blog post data       | Read data, Read preferred blog month | Extract Information          |                                                                                                                         |
| Extract Information          | Code                           | Generates posting schedule with dates, pillars, and formats | Merge                          | Loop Over Items              |                                                                                                                         |
| Loop Over Items             | SplitInBatches                 | Processes scheduled posts in batches                | Extract Information             | No Operation, Identify holiday |                                                                                                                         |
| No Operation, do nothing    | NoOp                           | Placeholder, no processing                           | Loop Over Items                 | -                            |                                                                                                                         |
| Identify holiday             | Code                           | Detects holidays for scheduled posts                | Loop Over Items                 | AI Agent - content schedule  |                                                                                                                         |
| AI Agent - content schedule  | LangChain AI Agent             | Generates Instagram caption, visual description, hashtags | Identify holiday               | Caption, Description, Hashtags | See sticky note describing AI content generation, brand voice, and output format                                        |
| reference                   | LangChain ToolCode             | Provides visual description reference library       | AI Agent - content schedule (ai_tool) | AI Agent - content schedule |                                                                                                                         |
| Caption, Description, Hashtags | Code                           | Parses AI output text into structured fields        | AI Agent - content schedule      | Rename Fields                 |                                                                                                                         |
| Rename Fields               | Set                            | Maps parsed fields and metadata for export          | Caption, Description, Hashtags   | Wait                         |                                                                                                                         |
| Wait                       | Wait                           | Delays before exporting data                         | Rename Fields                   | Export Data                  |                                                                                                                         |
| Export Data                | Google Sheets                   | Appends final content schedule to Google Sheets     | Wait                           | Loop Over Items              | See Output sticky note with screenshot of final output sheet                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger (Manual Trigger)  
   - Purpose: Start workflow on-demand  

2. **Add Google Sheets Node to Read Content Strategy**  
   - Operation: Read rows from your content strategy sheet/tab (e.g., "Input" or "Strategy")  
   - Credentials: Configure Google Sheets OAuth2 with access to your spreadsheet  

3. **Add HTTP Request Node for Blog Post Scraping**  
   - Method: POST or GET depending on Apify usage  
   - URL: Apify actor endpoint or dataset URL  
   - Parameters: Include API token in query or header  
   - Purpose: Retrieve blog post data  

4. **Add Code Node to Extract Blog Metadata**  
   - JavaScript: Extract `title`, `url`, and `description` from scraped data  
   - Filter out entries without title or URL  

5. **Add Google Sheets Node to Input Preferred Blog Month**  
   - Operation: Append or update preferred month for each blog post in a dedicated sheet/tab (e.g., "Input (blog month)")  

6. **Add Wait Node to Prevent API Rate Limit Issues**  
   - Add a short fixed delay (e.g., a few seconds)  

7. **Add Google Sheets Node to Read Preferred Blog Month Data**  
   - Operation: Read rows from "Input (blog month)" sheet/tab  

8. **Add Merge Node**  
   - Merge data from content strategy inputs and preferred blog months (two inputs)  

9. **Add Code Node for Scheduling Logic**  
   - Configure date range (2025-07-07 to 2026-01-30)  
   - Select posting days (Monday, Wednesday, Friday)  
   - Implement logic for assigning pillars, cycling sub-themes, incorporating blog posts based on preferred month, fallback pillars, and seasonal stage calculation  
   - Output scheduled posts as items  

10. **Add SplitInBatches Node**  
    - To process scheduled posts sequentially or in manageable batches  

11. **Add No Operation Node**  
    - Placeholder for branching, no configuration needed  

12. **Add Code Node to Identify Holidays**  
    - Implement holiday detection logic for US holidays (fixed and floating)  
    - Append "Holiday" field to item JSON  

13. **Add LangChain AI Agent Node**  
    - Model: GPT-4 or similar  
    - System message: Define brand voice and AI instructions per the workflow prompt  
    - Prompt: Use dynamic expressions to pass Pillar, Format, Holiday, SeasonStage, Blog info, and examples  
    - Attach "reference" tool node as AI tool for visual description guidance  

14. **Add LangChain ToolCode Node (reference)**  
    - Provide curated visual description reference data  
    - Used by AI Agent via ai_tool connection  

15. **Add Code Node to Parse AI Output**  
    - Detect sections (Caption, Visual Description, Hashtags) from AI text output  
    - Split and clean text into separate fields  

16. **Add Set Node to Rename and Reorganize Fields**  
    - Map parsed Caption, Hashtags, and other scheduling metadata into structured output fields  

17. **Add Wait Node Before Exporting**  
    - Short delay to manage API rate limits  

18. **Add Google Sheets Node to Export Final Data**  
    - Append rows to "Output" tab in Google Sheets containing full content schedule with captions and hashtags  

19. **Connect nodes in sequence per the above steps**  
    - Manual Trigger → Read data & Scrape blog posts → Extract metadata → Input preferred blog month → Wait → Read preferred blog month → Merge → Extract Information → Loop over Items → Identify holiday → AI Agent → Parse AI output → Rename fields → Wait → Export data  

20. **Credentials Setup**  
    - Google Sheets OAuth2 Credentials with access to relevant spreadsheets  
    - Apify API token for scraping blog posts  
    - OpenAI API key (GPT-4) for AI Agent  

21. **Default Values and Constraints**  
    - Date range and posting days fixed in code node  
    - Frequency and pillar cycling handled programmatically  
    - Maintain brand voice and hashtag consistency as per AI Agent system message  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This n8n template automates Instagram content scheduling combining AI, blog scraping, and Google Sheets. Perfect for content creators and marketing teams to organize and scale posts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Workflow description (Sticky Note)                                                               |
| Inputs: Content strategy (pillars, frequency, format) and blog posts (scraped via Apify) with preferred posting months. Workflow merges and analyzes these inputs for scheduling.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Sticky Note6 (Two Sets of Input)                                                                 |
| AI customization of posts based on holiday detection, brand voice, and seasonal context using GPT-4. Outputs captions, visual descriptions, hashtags, and schedule to Google Sheets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Sticky Note7 (AI content generation and export)                                                  |
| Apify usage tips: Use POST for live scraping with dynamic input, GET for retrieving dataset results, include API token.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Sticky Note (Try It Out!)                                                                        |
| Google Sheets tabs setup: "Input" or "Strategy" for initial data, "Input (blog month)" for blog metadata and preferred month, "Output" for final content schedule.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Sticky Notes with screenshots (Input #1, Input #2, Output)                                      |
| Branding and style guide for AI captions: Elegant, sincere, emotionally grounded tone, 2-4 sentences, varied emotional hooks, no clichés, consistent hashtags including brand and local tags.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | AI Agent system message and prompt instructions                                                 |
| Join n8n community for help: Discord and Forum.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Workflow description (Sticky Note)                                                               |

---

This completes the thorough documentation and analysis of the "Auto-Generate Instagram Content Schedule with GPT-4, Apify, and Google Sheets" workflow, enabling understanding, reproduction, and modification with anticipation of edge cases and integration considerations.