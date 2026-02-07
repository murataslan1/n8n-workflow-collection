Automate GitHub Trending Data Collection with FireCrawl, GPT and Supabase

https://n8nworkflows.xyz/workflows/automate-github-trending-data-collection-with-firecrawl--gpt-and-supabase-7394


# Automate GitHub Trending Data Collection with FireCrawl, GPT and Supabase

### 1. Workflow Overview

This workflow automates the collection, extraction, and storage of GitHub trending projects data for daily, weekly, and monthly intervals. It is designed to scrape GitHub Trending pages, process the scraped Markdown content with AI to extract structured project information, and then save this data into a Supabase database.

The workflow is logically divided into the following blocks:

- **1.1 Schedule Triggers:** Initiate the workflow based on daily, weekly, or monthly schedules.
- **1.2 Type Assignment:** Assign the trending period type ("daily", "weekly", "monthly") as context for processing.
- **1.3 Web Scraping:** Use FireCrawl to scrape GitHub Trending pages corresponding to the assigned type.
- **1.4 AI Data Extraction:** Use an AI agent (LangChain with OpenAI GPT-4o-mini) to parse the scraped Markdown and extract project details.
- **1.5 Data Storage:** Insert the extracted structured data into a Supabase table.
- **1.6 Documentation Support:** Provide SQL schema instructions for Supabase table setup via a sticky note.

---

### 2. Block-by-Block Analysis

#### 2.1 Schedule Triggers

- **Overview:** Automatically start the workflow execution at defined intervals: daily, weekly, and monthly.
- **Nodes Involved:** `daily`, `weekly`, `monthly`

- **Node Details:**

  - **Node: daily**
    - Type: Schedule Trigger
    - Configuration: Runs every day (default interval)
    - Input: None (trigger)
    - Output: Triggers downstream nodes at each day start
    - Failures: None typical, but workflow pauses if n8n scheduler is off

  - **Node: weekly**
    - Type: Schedule Trigger
    - Configuration: Runs every week (field set to weeks)
    - Input: None (trigger)
    - Output: Triggers downstream nodes weekly
    - Failures: Same as daily

  - **Node: monthly**
    - Type: Schedule Trigger
    - Configuration: Runs every month (field set to months)
    - Input: None (trigger)
    - Output: Triggers downstream nodes monthly
    - Failures: Same as daily

#### 2.2 Type Assignment

- **Overview:** Assigns a string property `type` corresponding to the triggered schedule period, which is used to parameterize the scraping URL and label data.
- **Nodes Involved:** `B1`, `B2`, `B3`, `B_ALL`

- **Node Details:**

  - **Node: B1**
    - Type: Set
    - Configuration: Sets `type` = "daily"
    - Input: Trigger from `daily`
    - Output: Passes `type` to `B_ALL`
    - Failures: None expected

  - **Node: B2**
    - Type: Set
    - Configuration: Sets `type` = "weekly"
    - Input: Trigger from `weekly`
    - Output: Passes `type` to `B_ALL`
    - Failures: None expected

  - **Node: B3**
    - Type: Set
    - Configuration: Sets `type` = "monthly"
    - Input: Trigger from `monthly`
    - Output: Passes `type` to `B_ALL`
    - Failures: None expected

  - **Node: B_ALL**
    - Type: Set
    - Configuration: Copies `type` from previous node to current JSON context
    - Input: From `B1`, `B2`, or `B3`
    - Output: Passes enriched data to `firecrawl` node
    - Failures: None expected

#### 2.3 Web Scraping

- **Overview:** Scrapes GitHub Trending page for the specified period (`daily`, `weekly`, or `monthly`) using FireCrawl, extracting only main content relevant to trending projects.
- **Nodes Involved:** `firecrawl`

- **Node Details:**

  - **Node: firecrawl**
    - Type: FireCrawl Scraper Node
    - Configuration:
      - URL template: `https://github.com/trending?since={{ $json.type }}`
      - Operation: scrape
      - Custom JSON for scraping: only main content, excludes header, includes div[data-hpc]
    - Credentials: FireCrawl API credentials required
    - Input: Receives JSON with `{ type: "daily"|"weekly"|"monthly" }`
    - Output: Scraped Markdown content in JSON field `data.markdown`
    - Failures:
      - Network errors or rate limits from GitHub
      - Invalid or changed DOM structure causing content extraction failure
      - FireCrawl API auth or quota issues

#### 2.4 AI Data Extraction

- **Overview:** Uses an AI agent based on LangChain and OpenAI GPT-4o-mini to parse the scraped Markdown and extract structured project information in JSON format.
- **Nodes Involved:** `AI Agent`, `OpenAI Chat Model`

- **Node Details:**

  - **Node: OpenAI Chat Model**
    - Type: OpenAI GPT Chat Model Node
    - Configuration:
      - Model: `gpt-4o-mini`
      - No additional options set
    - Credentials: OpenAI API key required
    - Input: Provides language model capability to `AI Agent`
    - Output: Passes results to `AI Agent`
    - Failures:
      - API quota exceeded
      - Network timeouts
      - Model unavailability

  - **Node: AI Agent**
    - Type: LangChain Agent Node
    - Configuration:
      - System Message: Professional data extraction assistant with instructions to parse Markdown containing multiple GitHub trending projects.
      - Instructions: 
        - Identify projects separated by `---`
        - Extract fields: name, url, description, language (blank if missing), stars (number, commas removed, default 0)
        - Output JSON array only (no extra text)
      - Uses `B_ALL` node's `type` field to add `type` to each project record
      - Uses scraped Markdown content from `firecrawl`
    - Input: Receives scraped Markdown + type
    - Output: JSON array of extracted projects
    - Failures:
      - Parsing errors if Markdown format changes
      - AI output formatting errors (non-JSON output)
      - OpenAI API failures passed through
    - Sub-workflow: None

#### 2.5 Data Storage

- **Overview:** Inserts each extracted project record into Supabase table `githubtrending` with all specified fields.
- **Nodes Involved:** `Create a row in Supabase`

- **Node Details:**

  - **Node: Create a row in Supabase**
    - Type: Supabase Tool Node
    - Configuration:
      - Table: `githubtrending`
      - Fields mapped:
        - `url`
        - `project_id` (GitHub repo name, e.g. "user/repo")
        - `project_desc`
        - `code_language`
        - `stars` (converted to integer)
        - `type` ("daily", "weekly", or "monthly")
    - Credentials: Supabase API credentials required
    - Input: Receives JSON array from `AI Agent`, creates one row per project
    - Output: Confirmation of row creation (optional)
    - Failures:
      - API auth errors
      - Data validation errors (e.g., stars not numeric)
      - Network issues

#### 2.6 Documentation Support

- **Overview:** Provides SQL schema for the Supabase table via a sticky note for reference.
- **Nodes Involved:** `Sticky Note`

- **Node Details:**

  - **Node: Sticky Note**
    - Type: Sticky Note (Informational)
    - Content:
      ```
      # Run below sql to create table in supabase:  
      CREATE TABLE public.githubtrending (
        id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        data_date date DEFAULT now(),
        url text,
        project_id text,
        project_desc text,
        code_language text,
        stars bigint DEFAULT '0'::bigint,
        type text,
        CONSTRAINT githubtrending_pkey PRIMARY KEY (id)
      );
      ```
    - Position: Visible to user for setup assistance
    - Failures: None

---

### 3. Summary Table

| Node Name             | Node Type                                | Functional Role                | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                              |
|-----------------------|----------------------------------------|-------------------------------|-------------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------|
| daily                 | Schedule Trigger                       | Trigger daily workflow run    | None                          | B1                            |                                                                                                        |
| weekly                | Schedule Trigger                       | Trigger weekly workflow run   | None                          | B2                            |                                                                                                        |
| monthly               | Schedule Trigger                       | Trigger monthly workflow run  | None                          | B3                            |                                                                                                        |
| B1                    | Set                                   | Assign "daily" type           | daily                         | B_ALL                         |                                                                                                        |
| B2                    | Set                                   | Assign "weekly" type          | weekly                        | B_ALL                         |                                                                                                        |
| B3                    | Set                                   | Assign "monthly" type         | monthly                       | B_ALL                         |                                                                                                        |
| B_ALL                 | Set                                   | Pass type to downstream nodes | B1, B2, B3                   | firecrawl                     |                                                                                                        |
| firecrawl             | FireCrawl Scraper                     | Scrape GitHub trending page   | B_ALL                         | AI Agent                      |                                                                                                        |
| AI Agent              | LangChain Agent (OpenAI GPT)          | Extract project data from MD  | firecrawl, OpenAI Chat Model  | Create a row in Supabase       |                                                                                                        |
| OpenAI Chat Model      | OpenAI GPT Model                      | Provide language model        | None                          | AI Agent                      |                                                                                                        |
| Create a row in Supabase | Supabase Tool                       | Insert project data into DB   | AI Agent                      | None                          |                                                                                                        |
| Sticky Note           | Sticky Note                          | Provide SQL schema reference  | None                          | None                          | # Run below sql to create table in supabase: CREATE TABLE public.githubtrending (… see full SQL above) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Triggers:**

   - Add a **Schedule Trigger** node named `daily`.
     - Configure interval: every day (default).
   - Add a **Schedule Trigger** node named `weekly`.
     - Configure interval: every week.
   - Add a **Schedule Trigger** node named `monthly`.
     - Configure interval: every month.

2. **Add "Set" Nodes for Type Assignment:**

   - Create a **Set** node named `B1`.
     - Add assignment: `type` = `"daily"`.
     - Connect `daily` → `B1`.
   
   - Create a **Set** node named `B2`.
     - Add assignment: `type` = `"weekly"`.
     - Connect `weekly` → `B2`.
   
   - Create a **Set** node named `B3`.
     - Add assignment: `type` = `"monthly"`.
     - Connect `monthly` → `B3`.

3. **Consolidate Type with a Set Node:**

   - Create a **Set** node named `B_ALL`.
     - Add assignment: `type` = `={{ $json.type }}` (pass-through).
     - Connect `B1` → `B_ALL`, `B2` → `B_ALL`, `B3` → `B_ALL`.

4. **Add FireCrawl Scraper Node:**

   - Add a FireCrawl node named `firecrawl`.
     - Set URL: `https://github.com/trending?since={{ $json.type }}`
     - Operation: `scrape`
     - Additional Fields → Custom Properties JSON:
       ```json
       {
         "onlyMainContent": true,
         "excludeTags": [".Box .Box-header"],
         "includeTags": ["div[data-hpc]"]
       }
       ```
     - Connect `B_ALL` → `firecrawl`.
     - Configure FireCrawl API credentials.

5. **Add OpenAI Chat Model Node:**

   - Add LangChain OpenAI Chat Model node named `OpenAI Chat Model`.
     - Model: `gpt-4o-mini`.
     - Configure OpenAI API credentials.
     - No special options required.

6. **Add AI Agent Node:**

   - Add LangChain Agent node named `AI Agent`.
     - Text input expression:
       ```
       =This is a Markdown text containing multiple projects:
       ---
       {{ $json.data.markdown }}
       Please extract all project information and insert it into Supabase.
       When storing the data, make sure to include the field "type" with the value from:
       {{ $('B_ALL').item.json.type }},
       which will be one of: "daily", "weekly", or "monthly".
       now, please extract all projects out and save to supabase.
       ```
     - System message:
       ```
       You are a professional data extraction assistant.
       Your task is to extract all key information from the provided Markdown text, which contains multiple GitHub Trending projects.

       Please follow these rules strictly:
         1. Identify all projects: Locate each individual project in the text. Projects are typically separated by a horizontal divider ---.
         2. For each project, extract the following fields:
            • name: The project name in the format "username/repository".
            • url: The GitHub URL of the project.
            • description: The project description.
            • language: The main programming language of the project. If not provided, use an empty string "".
            • stars: The total number of stars. This must be a number, and all thousand separators (such as commas) must be removed. If not provided, set to 0.
         3. Output format: Your output must be a JSON array only. Each element in the array must be a JSON object representing a single project.
         4. No extra content: Do not include any extra text, explanations, or Markdown syntax (e.g., ```json) before or after the JSON array.

       Example output format:
       [
         {
           "name": "user1/repo1",
           "url": "https://github.com/user1/repo1",
           "description": "This is the first project.",
           "language": "TypeScript",
           "stars": 12000
         },
         {
           "name": "user2/repo2",
           "url": "https://github.com/user2/repo2",
           "description": "This is the second project.",
           "language": "Python",
           "stars": 5432
         }
       ]
       ```
     - Connect `firecrawl` → `AI Agent`.
     - Connect `OpenAI Chat Model` as AI language model to `AI Agent`.
     - Connect `B_ALL` node's `type` value is referenced inside the prompt for insertion in output.

7. **Add Supabase Insert Node:**

   - Add Supabase Tool node named `Create a row in Supabase`.
     - Set table to `githubtrending`.
     - Map fields from AI Agent output JSON array:
       - `url` → `url`
       - `project_id` → `name` from extracted project
       - `project_desc` → `description`
       - `code_language` → `language`
       - `stars` → `stars`
       - `type` → passed from `B_ALL` node's `type` value
     - Configure Supabase credentials.
     - Connect `AI Agent` → `Create a row in Supabase`.

8. **Add Sticky Note for Schema Reference:**

   - Add Sticky Note with the following SQL:
     ```
     CREATE TABLE public.githubtrending (
       id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
       created_at timestamp with time zone NOT NULL DEFAULT now(),
       data_date date DEFAULT now(),
       url text,
       project_id text,
       project_desc text,
       code_language text,
       stars bigint DEFAULT '0'::bigint,
       type text,
       CONSTRAINT githubtrending_pkey PRIMARY KEY (id)
     );
     ```
   - Place it for user reference; no connections needed.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| SQL schema provided in sticky note must be run in Supabase before inserting data                | Ensures table `githubtrending` exists with proper columns                                       |
| FireCrawl node uses custom JSON properties to precisely extract main content from GitHub Trending | This avoids noisy headers or unrelated content                                                 |
| OpenAI GPT model `gpt-4o-mini` selected for efficient yet capable natural language processing     | Balance cost and performance for data extraction                                              |
| AI Agent prompt strictly enforces JSON-only output without extra text to facilitate parsing      | Avoids parsing errors downstream when inserting into database                                  |
| Workflow supports three separate scheduled runs for daily, weekly, and monthly trending data    | Allows flexible data collection frequency                                                      |

---

**Disclaimer:**  
This document is based exclusively on an automated workflow created with n8n, an integration and automation tool. The processing strictly complies with current content policies and contains no illegal, offensive, or protected content. All data handled is legal and publicly available.