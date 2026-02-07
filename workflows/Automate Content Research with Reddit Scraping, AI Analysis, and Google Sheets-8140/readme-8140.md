Automate Content Research with Reddit Scraping, AI Analysis, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-content-research-with-reddit-scraping--ai-analysis--and-google-sheets-8140


# Automate Content Research with Reddit Scraping, AI Analysis, and Google Sheets

### 1. Workflow Overview

This workflow, titled **"Content Research Engine"**, automates the process of gathering, analyzing, and storing content insights from Reddit posts to support marketing, lead generation, and business automation research. It targets content researchers, marketers, and business strategists who want to harvest community-generated insights automatically and structure them for easy consumption and further content creation.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Scheduled trigger initiates the workflow and Reddit nodes scrape new posts from multiple specified subreddits based on targeted keywords.
- **1.2 Data Aggregation and Preparation**: Merging Reddit outputs and formatting the raw data fields uniformly for AI processing.
- **1.3 AI Content Analysis**: An AI Agent processes the formatted Reddit posts to extract structured summaries, pain points, and content angles using a custom prompt and OpenAI GPT-4.
- **1.4 Output Storage**: The structured insights are appended as new rows in a Google Sheet for ongoing content research and idea generation.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block triggers the workflow on a daily schedule and scrapes Reddit posts from three different subreddits using keyword searches to gather fresh content relevant to marketing, lead generation, and business automation.

**Nodes Involved:**  
- Schedule Trigger1  
- r/smallbusiness/automation  
- r/smallbusiness/AI Automation  
- r/smallbusiness/automation1

**Node Details:**

- **Schedule Trigger1**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution daily at 7 AM.  
  - Configuration: Trigger set to run once every day at hour 7 (7 AM).  
  - Inputs: None (start node).  
  - Outputs: Three parallel connections to Reddit nodes.  
  - Edge Cases: If the n8n instance is down at trigger time, the run will be missed unless manual intervention occurs.

- **r/smallbusiness/automation**  
  - Type: Reddit node  
  - Role: Searches the "startups" subreddit for posts containing "Scaling Leads".  
  - Configuration: Limit 2 posts; sorted by newest.  
  - Credentials: Uses Reddit OAuth2 API credentials.  
  - Input: Trigger node.  
  - Output: Posts matching criteria.  
  - Edge Cases: Reddit API rate limits, OAuth token expiration, or no posts found.

- **r/smallbusiness/AI Automation**  
  - Type: Reddit node  
  - Role: Searches the "marketing" subreddit for posts containing "Lead Generation".  
  - Configuration: Limit 2 posts; sorted by newest.  
  - Credentials: Same Reddit OAuth2 API.  
  - Input: Trigger node.  
  - Output: Posts matching criteria.  
  - Edge Cases: Same as above.

- **r/smallbusiness/automation1**  
  - Type: Reddit node  
  - Role: Searches the "smallbusiness" subreddit for posts containing "Business Automation".  
  - Configuration: Limit 2 posts; sorted by newest.  
  - Credentials: Same Reddit OAuth2 API.  
  - Input: Trigger node.  
  - Output: Posts matching criteria.  
  - Edge Cases: Same as above.

---

#### 2.2 Data Aggregation and Preparation

**Overview:**  
Combines the separate Reddit query results into one data stream and prepares the posts by extracting and standardizing key fields for AI analysis.

**Nodes Involved:**  
- Merge  
- Edit Fields

**Node Details:**

- **Merge**  
  - Type: Merge node  
  - Role: Combines outputs from the three Reddit query nodes into one unified stream.  
  - Configuration: Number of inputs set to 3; merges all inputs without filtering (default mode).  
  - Inputs: r/smallbusiness/automation, r/smallbusiness/AI Automation, r/smallbusiness/automation1  
  - Output: Combined dataset of Reddit posts.  
  - Edge Cases: If one input fails or returns empty, merge still processes others; beware of empty arrays.

- **Edit Fields**  
  - Type: Set node  
  - Role: Extracts and renames fields for uniformity: subreddit, text (post body), and title.  
  - Configuration: Assigns three new fields:
    - `subreddit`: copied from `$json.subreddit`
    - `text`: copied from `$json.selftext`
    - `title`: copied from `$json.title`  
  - Inputs: Output from Merge node  
  - Outputs: Structured JSON ready for AI processing.  
  - Edge Cases: Posts without `selftext` (e.g., link posts) may have empty `text`; AI prompt should handle this gracefully.

---

#### 2.3 AI Content Analysis

**Overview:**  
Uses an AI Agent configured with LangChain and OpenAI GPT-4 to analyze each Reddit post and produce a structured JSON containing a concise summary, the core pain point, and actionable content angles.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model2  
- Structured Output Parser

**Node Details:**

- **AI Agent**  
  - Type: LangChain Agent node  
  - Role: Sends formatted Reddit posts to the AI model with a defined system prompt to extract insights.  
  - Configuration:
    - Input text template includes subreddit, text, and title fields.
    - System message instructs the AI to:
      1. Summarize the post in ≤20 words neutrally.
      2. Identify the core pain point in ≤15 words, from the poster’s perspective.
      3. Generate 2–3 actionable content angles ≤10 words each.
      4. Output valid JSON only, matching a strict schema.
    - Output parser enabled to enforce JSON output.  
  - Inputs: Data from Edit Fields node  
  - Outputs: Raw AI response JSON string.  
  - Edge Cases: AI may produce malformed JSON; mitigated by auto-fix in parser. API limits and latency possible.  
  - Sub-workflow: Uses OpenAI Chat Model2 and Structured Output Parser internally.

- **OpenAI Chat Model2**  
  - Type: LangChain OpenAI Chat Model node  
  - Role: Performs the actual GPT-4.1-mini model call.  
  - Configuration: Model set to "gpt-4.1-mini".  
  - Credentials: OpenAI API credentials configured.  
  - Inputs: From AI Agent  
  - Outputs: Model generated text.  
  - Edge Cases: Rate limits, network errors, or invalid API key can cause failures.

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser node  
  - Role: Validates and parses AI output into structured JSON according to schema:
    ```json
    {
      "summary": "<1 sentence, ≤20 words>",
      "pain_point": "<1 sentence, ≤15 words>",
      "content_angle": ["<idea 1>", "<idea 2>", "<idea 3 or optional>"]
    }
    ```  
  - Configuration: Auto-fix enabled to handle minor JSON formatting errors.  
  - Inputs: AI Model output  
  - Outputs: Clean parsed JSON for further processing.  
  - Edge Cases: If parsing fails, AI Agent node will receive error or empty data.

---

#### 2.4 Output Storage

**Overview:**  
Appends the structured insights extracted by AI into a Google Sheet, enabling ongoing content research and easy access to generated marketing ideas.

**Nodes Involved:**  
- Append row in sheet

**Node Details:**

- **Append row in sheet**  
  - Type: Google Sheets node  
  - Role: Appends new rows to a Google Sheet with columns Summary, Pain Point, and Content Angle.  
  - Configuration:
    - Document ID points to a specific Google Sheet (shared via sticky note link).
    - Sheet name is "Sheet1" (gid=0).
    - Columns mapped from the AI output JSON fields:
      - Summary → output.summary
      - Pain Point → output.pain_point
      - Content Angle → output.content_angle (array/string)  
    - Append operation mode enabled.  
  - Credentials: Google Sheets OAuth2 API credentials configured.  
  - Inputs: Parsed AI output JSON from AI Agent node.  
  - Outputs: None (final node).  
  - Edge Cases: Google Sheets API quota limits, authentication expiration, or malformed data causing append failures.

---

### 3. Summary Table

| Node Name                   | Node Type                      | Functional Role                            | Input Node(s)                                         | Output Node(s)          | Sticky Note                                                                                                        |
|-----------------------------|--------------------------------|--------------------------------------------|-------------------------------------------------------|------------------------|-------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger1            | Schedule Trigger                | Triggers workflow daily at 7 AM            | None                                                  | r/smallbusiness/automation, r/smallbusiness/AI Automation, r/smallbusiness/automation1 | See “Setting up the workflow” sticky note for usage instructions and Google Sheet link.                           |
| r/smallbusiness/automation  | Reddit                         | Search "startups" subreddit for "Scaling Leads" | Schedule Trigger1                                      | Merge                  | See sticky note: "Select the Subreddit and the keywords you would like to scrape"                                |
| r/smallbusiness/AI Automation | Reddit                         | Search "marketing" subreddit for "Lead Generation" | Schedule Trigger1                                      | Merge                  | See sticky note: "Select the Subreddit and the keywords you would like to scrape"                                |
| r/smallbusiness/automation1 | Reddit                         | Search "smallbusiness" subreddit for "Business Automation" | Schedule Trigger1                                      | Merge                  | See sticky note: "Select the Subreddit and the keywords you would like to scrape"                                |
| Merge                       | Merge                          | Combines all Reddit search outputs          | r/smallbusiness/automation, r/smallbusiness/AI Automation, r/smallbusiness/automation1 | Edit Fields            |                                                                                                                   |
| Edit Fields                 | Set                            | Extracts and standardizes key post fields  | Merge                                                 | AI Agent               |                                                                                                                   |
| AI Agent                    | LangChain Agent                | Processes posts with AI to extract structured insights | Edit Fields                                            | Append row in sheet    | See sticky note: "AI Agent will go through the items to find the pain point and content angle"                    |
| OpenAI Chat Model2          | LangChain OpenAI Chat Model    | Calls GPT-4.1-mini to generate AI output   | AI Agent (internal)                                   | AI Agent (internal)    |                                                                                                                   |
| Structured Output Parser    | LangChain Structured Output Parser | Parses and validates AI JSON output        | OpenAI Chat Model2 (internal)                         | AI Agent (internal)    |                                                                                                                   |
| Append row in sheet         | Google Sheets                  | Appends AI insights into Google Sheet       | AI Agent                                              | None                   | See sticky note: "Data is stored in google sheet. Whenever you need content idea, you’ll find a list with great ideas inside" |
| Sticky Note                 | Sticky Note                   | Instructions and workflow setup guide       | None                                                  | None                   | Contains overview and setup instructions with Google Sheet link: https://docs.google.com/spreadsheets/d/1vmLGPnlCVdSU5_3IpYVEUzhTGvUn0p6u2v_RZo7ULmk/edit?usp=sharing |
| Sticky Note1                | Sticky Note                   | Instructions on subreddit and keyword choice | None                                                  | None                   | "Select the Subreddit and the keywords you would like to scrape"                                                 |
| Sticky Note2                | Sticky Note                   | AI Agent explanation                         | None                                                  | None                   | "AI Agent will go through the items to find the pain point and content angle"                                    |
| Sticky Note3                | Sticky Note                   | Google Sheets data storage explanation      | None                                                  | None                   | "Data is stored in google sheet. Whenever you need content idea, you’ll find a list with great ideas inside"     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to run daily at 7:00 AM.  
   - Position it as the first node.

2. **Add Reddit Nodes (3 total)**  
   - For each node:
     - Type: Reddit  
     - Connect Reddit OAuth2 API credentials.  
     - Configure as follows:

     a. Node Name: "r/smallbusiness/automation"  
        - Subreddit: "startups"  
        - Keyword: "Scaling Leads"  
        - Operation: "search"  
        - Limit: 2  
        - Sort: "new"

     b. Node Name: "r/smallbusiness/AI Automation"  
        - Subreddit: "marketing"  
        - Keyword: "Lead Generation"  
        - Operation: "search"  
        - Limit: 2  
        - Sort: "new"

     c. Node Name: "r/smallbusiness/automation1"  
        - Subreddit: "smallbusiness"  
        - Keyword: "Business Automation"  
        - Operation: "search"  
        - Limit: 2  
        - Sort: "new"

   - Connect each Reddit node’s input from the Schedule Trigger (parallel).

3. **Add Merge Node**  
   - Type: Merge  
   - Set Number of Inputs: 3  
   - Connect each Reddit node output to the Merge node inputs.

4. **Add Set Node (Edit Fields)**  
   - Type: Set  
   - Configure to assign three new fields:  
     - `subreddit` = `{{$json["subreddit"]}}`  
     - `text` = `{{$json["selftext"]}}`  
     - `title` = `{{$json["title"]}}`  
   - Connect Merge node output to this node.

5. **Add LangChain AI Agent Node**  
   - Type: LangChain Agent  
   - Connect OpenAI GPT API credentials.  
   - Configure prompt text template to include:  
     ```
     Subreddit: {{$json["subreddit"]}}
     Text: {{$json["text"]}}
     Title: {{$json["title"]}}
     ```  
   - Copy the system message exactly as:  
     ```
     You are a content research analyst AI trained to study raw Reddit posts and extract structured insights for marketing, lead generation, and business automation research.

     Your role is to transform messy, conversational Reddit text into short, business-ready insights that can be stored in a database and later used for content creation, strategy, or trend analysis.

     When analyzing a Reddit post (title + body):
       1. Summarize the post clearly and concisely.
          • Use neutral, plain English.
          • One sentence, ≤20 words.
          • No filler, no speculation beyond what is written.
       2. Identify the core pain point.
          • Express it in ≤15 words.
          • Use the poster’s perspective (“Can’t find…”, “Struggling with…”, “Wants to know…”).
          • Boil it down to the single biggest problem they are expressing.
       3. Generate 2–3 actionable content angles.
          • Each ≤10 words.
          • Frame them as potential articles, guides, or content pieces someone could create.
          • They should answer or address the pain point.
          • Keep them concrete and practical (e.g. “Best tools for automating client onboarding” vs “Automation thoughts”).
       4. Output must be valid JSON only.
          • No extra commentary, no markdown, no explanations.
          • Format must exactly match the schema below.
     ```  
   - Enable output parser and link the Structured Output Parser.

6. **Add LangChain OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Configure model to "gpt-4.1-mini".  
   - Connect OpenAI API credentials.  
   - Connect this node inside the AI Agent node’s language model slot.

7. **Add LangChain Structured Output Parser Node**  
   - Type: LangChain Structured Output Parser  
   - Paste example JSON schema:  
     ```json
     {
       "summary": "<1 sentence, ≤20 words, neutral overview of what the post is about>",
       "pain_point": "<1 short sentence, ≤15 words, the core problem the poster is facing>",
       "content_angle": [
         "<idea 1: ≤10 words, actionable topic framing for content/insight>",
         "<idea 2: ≤10 words, actionable topic framing>",
         "<idea 3: ≤10 words, optional>"
       ]
     }
     ```  
   - Enable Auto Fix.  
   - Connect this node inside the AI Agent node’s output parser slot.

8. **Add Google Sheets Node (Append row in sheet)**  
   - Type: Google Sheets  
   - Connect Google Sheets OAuth2 API credentials.  
   - Configure operation to "append".  
   - Document ID: Use your Google Sheet ID. (Use the provided template or your own.)  
   - Sheet Name: "Sheet1" or your target sheet.  
   - Map columns:  
     - Summary -> `{{$json["output"]["summary"]}}`  
     - Pain Point -> `{{$json["output"]["pain_point"]}}`  
     - Content Angle -> `{{$json["output"]["content_angle"]}}`  
   - Connect AI Agent node output to this node.

9. **Connect All Nodes**  
   - Schedule Trigger → Each Reddit node (parallel)  
   - Each Reddit node → Merge  
   - Merge → Edit Fields  
   - Edit Fields → AI Agent  
   - AI Agent → Append row in sheet

10. **Save and Activate Workflow**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                | Context or Link                                                                                                                               |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| Workflow automates scraping of Reddit posts, AI-powered summarization, and storing insights in Google Sheets for ongoing content research.                                                                                                                  | General workflow purpose                                                                                                                      |
| Google Sheet template link for storing results: https://docs.google.com/spreadsheets/d/1vmLGPnlCVdSU5_3IpYVEUzhTGvUn0p6u2v_RZo7ULmk/edit?usp=sharing                                                                                                       | Used by Google Sheets node for appending data                                                                                                 |
| Ensure Reddit OAuth2 API credentials are correctly configured to avoid authentication errors.                                                                                                                                                                | Reddit API integration                                                                                                                         |
| Use OpenAI GPT-4 API key with sufficient quota; handle rate limits and latency gracefully.                                                                                                                                                                   | AI model integration                                                                                                                           |
| AI prompt enforces strict JSON output format to facilitate automatic parsing and reliable data extraction.                                                                                                                                                  | AI prompt design best practice                                                                                                                |
| Schedule triggers can be customized to different run times; consider timezone effects.                                                                                                                                                                       | Scheduling setup                                                                                                                               |
| Posts without body text ("selftext") are handled by sending empty string; AI prompt accommodates this scenario.                                                                                                                                                | Data edge case handling                                                                                                                        |
| Merge node set to 3 inputs; to add more Reddit queries, increase merge input count and add corresponding nodes.                                                                                                                                               | Workflow extensibility                                                                                                                         |
| Sticky Notes within the workflow provide setup instructions and operational hints for users.                                                                                                                                                                  | In-workflow documentation                                                                                                                     |

---

**Disclaimer:**  
The provided text is extracted exclusively from an automated workflow created with n8n, a workflow automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected content. All data handled is legal and publicly accessible.