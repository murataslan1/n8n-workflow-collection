Analyze Brand Mentions on Reddit with GPT-4o Mini and Notion Integration

https://n8nworkflows.xyz/workflows/analyze-brand-mentions-on-reddit-with-gpt-4o-mini-and-notion-integration-3244


# Analyze Brand Mentions on Reddit with GPT-4o Mini and Notion Integration

### 1. Workflow Overview

The **"Analyze Brand Mentions on Reddit with GPT-4o Mini and Notion Integration"** workflow automates the monitoring and analysis of brand mentions on Reddit. It leverages AI to perform sentiment and emotion analysis on Reddit comments mentioning a brand (including misspellings), filters relevant content, and logs actionable insights into a Notion database while preventing duplicates.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Input Initialization**  
  Starts the workflow on a schedule and sets up brand-related input parameters.

- **1.2 Brand Mention Sourcing & Misspelling Handling**  
  Searches Reddit for brand mentions and iterates over misspellings to broaden the search.

- **1.3 Data Merging & Duplicate Exclusion**  
  Merges Reddit posts from multiple searches and excludes those already logged in Notion.

- **1.4 AI-Powered Comment Analysis**  
  Uses GPT-4o Mini via n8n’s LangChain integration to analyze sentiment, emotions, and generate insights.

- **1.5 Notion Integration for Reporting**  
  Logs analyzed comments and insights into a Notion database, ensuring no duplicates.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Input Initialization

- **Overview:**  
  This block triggers the workflow on a defined schedule and initializes the input data, including brand name and business details, required for subsequent Reddit searches.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Add Your Info

- **Node Details:**  

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates the workflow periodically (e.g., daily or hourly) to automate monitoring.  
    - Configuration: Default schedule trigger settings (not detailed in JSON).  
    - Inputs: None (trigger node).  
    - Outputs: Connects to "Add Your Info".  
    - Edge Cases: Trigger misconfiguration may cause workflow not to run.

  - **Add Your Info**  
    - Type: Set Node  
    - Role: Sets brand name, business details, and possibly other parameters for searching Reddit.  
    - Configuration: Contains static or dynamic values representing brand info.  
    - Inputs: From Schedule Trigger.  
    - Outputs: Connects to three nodes in parallel: "search brand name", "misspellings", and "search for existing".  
    - Edge Cases: Missing or incorrect brand info will affect search accuracy.

---

#### 2.2 Brand Mention Sourcing & Misspelling Handling

- **Overview:**  
  This block performs Reddit searches for the brand name and its common misspellings to capture a broad set of relevant comments.

- **Nodes Involved:**  
  - search brand name (Reddit)  
  - misspellings (LangChain Agent)  
  - Loop Over Misspellings (SplitInBatches)  
  - iterate_on_misspellings (Reddit)  
  - Split Out (SplitOut)

- **Node Details:**  

  - **search brand name**  
    - Type: Reddit Node  
    - Role: Searches Reddit for posts/comments containing the exact brand name.  
    - Configuration: Query set to brand name from "Add Your Info".  
    - Inputs: From "Add Your Info".  
    - Outputs: Connects to "Merge Reddit Posts".  
    - Edge Cases: Reddit API rate limits or query errors.

  - **misspellings**  
    - Type: LangChain Agent Node  
    - Role: Generates a list of common misspellings or variations of the brand name using AI.  
    - Configuration: Uses OpenAI Chat Model (GPT-4o Mini) for misspelling generation.  
    - Inputs: From "Add Your Info" and "json schema" (output parser).  
    - Outputs: Connects to "Split Out".  
    - Edge Cases: AI generation failure or unexpected output format.

  - **Loop Over Misspellings**  
    - Type: SplitInBatches  
    - Role: Iterates over each misspelling in batches to perform Reddit searches.  
    - Configuration: Batch size not specified (default assumed).  
    - Inputs: From "Split Out".  
    - Outputs: Two outputs: one to "Merge Reddit Posts" and another to "iterate_on_misspellings".  
    - Edge Cases: Large number of misspellings may cause performance issues.

  - **iterate_on_misspellings**  
    - Type: Reddit Node  
    - Role: Searches Reddit for posts/comments containing each misspelling.  
    - Configuration: Query set dynamically per batch item.  
    - Inputs: From "Loop Over Misspellings".  
    - Outputs: Connects back to "Loop Over Misspellings" to continue iteration.  
    - Edge Cases: Reddit API limits, infinite loop risk if not properly configured.

  - **Split Out**  
    - Type: SplitOut  
    - Role: Extracts the array of misspellings from the AI response to feed into the batch loop.  
    - Inputs: From "misspellings".  
    - Outputs: Connects to "Loop Over Misspellings".  
    - Edge Cases: Incorrect parsing may break iteration.

---

#### 2.3 Data Merging & Duplicate Exclusion

- **Overview:**  
  This block merges Reddit posts from both exact brand name and misspelling searches and filters out posts already present in the Notion database to avoid duplicates.

- **Nodes Involved:**  
  - Merge Reddit Posts (Merge)  
  - search for existing (Notion)  
  - Exclude Existing (Merge)

- **Node Details:**  

  - **Merge Reddit Posts**  
    - Type: Merge Node  
    - Role: Combines Reddit posts from exact brand name and misspelling searches into a single stream.  
    - Configuration: Mode likely set to "Merge By Index" or "Append".  
    - Inputs: From "search brand name" and "Loop Over Misspellings".  
    - Outputs: Connects to "Exclude Existing".  
    - Edge Cases: Data mismatch or empty inputs.

  - **search for existing**  
    - Type: Notion Node  
    - Role: Queries Notion database for existing Reddit posts/comments to identify duplicates.  
    - Configuration: Query filters based on Reddit post IDs or URLs.  
    - Inputs: From "Add Your Info".  
    - Outputs: Connects to "Exclude Existing".  
    - Edge Cases: Notion API rate limits, query errors.

  - **Exclude Existing**  
    - Type: Merge Node  
    - Role: Compares merged Reddit posts with existing Notion entries and excludes duplicates.  
    - Configuration: Mode set to "Remove Duplicates" or similar.  
    - Inputs: From "Merge Reddit Posts" (index 1) and "search for existing" (index 0).  
    - Outputs: Connects to "analyze".  
    - Edge Cases: Incorrect matching criteria may cause false positives or negatives.

---

#### 2.4 AI-Powered Comment Analysis

- **Overview:**  
  This block analyzes filtered Reddit comments using GPT-4o Mini to categorize sentiment, detect emotions, and generate actionable insights and response suggestions.

- **Nodes Involved:**  
  - analyze (LangChain Agent)  
  - OpenAI Chat Model  
  - json schema (Output Parser Structured)

- **Node Details:**  

  - **analyze**  
    - Type: LangChain Agent Node  
    - Role: Performs sentiment and emotion analysis, and generates insights and recommendations for each Reddit comment.  
    - Configuration: Uses GPT-4o Mini model via OpenAI Chat Model node.  
    - Inputs: From "Exclude Existing".  
    - Outputs: Connects to "Report to Notion".  
    - Retry: Up to 5 tries on failure.  
    - Edge Cases: AI model timeouts, unexpected output format.

  - **OpenAI Chat Model**  
    - Type: LangChain LM Chat OpenAI  
    - Role: Provides the GPT-4o Mini language model backend for AI nodes ("analyze" and "misspellings").  
    - Configuration: API credentials for OpenAI configured in n8n credentials.  
    - Inputs: From "analyze" and "misspellings" nodes (ai_languageModel input).  
    - Outputs: AI responses to the respective nodes.  
    - Edge Cases: API key invalid, rate limits, network errors.

  - **json schema**  
    - Type: Output Parser Structured  
    - Role: Parses AI output into structured JSON for reliable downstream processing.  
    - Inputs: From "analyze" (ai_outputParser).  
    - Outputs: To "analyze" node (ai_outputParser input).  
    - Edge Cases: Parsing errors if AI output deviates from schema.

---

#### 2.5 Notion Integration for Reporting

- **Overview:**  
  This block logs the analyzed Reddit comments and AI-generated insights into a Notion database, enabling centralized tracking and preventing duplicate entries.

- **Nodes Involved:**  
  - Report to Notion

- **Node Details:**  

  - **Report to Notion**  
    - Type: Notion Node  
    - Role: Creates or updates entries in a Notion database with Reddit comment data and analysis results.  
    - Configuration: Maps analyzed data fields to Notion database properties.  
    - Inputs: From "analyze".  
    - Outputs: None (end of workflow).  
    - On Error: Continues regular output to avoid workflow failure on Notion errors.  
    - Edge Cases: Notion API limits, permission errors, schema mismatches.

---

### 3. Summary Table

| Node Name             | Node Type                          | Functional Role                          | Input Node(s)                 | Output Node(s)                  | Sticky Note |
|-----------------------|----------------------------------|----------------------------------------|------------------------------|--------------------------------|-------------|
| Schedule Trigger       | Schedule Trigger                 | Starts workflow on schedule             | None                         | Add Your Info                  |             |
| Add Your Info          | Set                             | Initializes brand and business details  | Schedule Trigger             | search brand name, misspellings, search for existing |             |
| search brand name      | Reddit                          | Searches Reddit for exact brand mentions| Add Your Info                | Merge Reddit Posts             |             |
| misspellings           | LangChain Agent                 | Generates brand name misspellings       | Add Your Info, json schema   | Split Out                     |             |
| Split Out              | SplitOut                       | Extracts misspellings array              | misspellings                 | Loop Over Misspellings         |             |
| Loop Over Misspellings | SplitInBatches                 | Iterates over misspellings batchwise    | Split Out                   | Merge Reddit Posts, iterate_on_misspellings |             |
| iterate_on_misspellings| Reddit                        | Searches Reddit for each misspelling    | Loop Over Misspellings       | Loop Over Misspellings         |             |
| Merge Reddit Posts     | Merge                          | Combines Reddit posts from all searches | search brand name, Loop Over Misspellings | Exclude Existing              |             |
| search for existing    | Notion                         | Queries Notion for existing Reddit posts| Add Your Info                | Exclude Existing              |             |
| Exclude Existing       | Merge                          | Removes Reddit posts already in Notion  | search for existing, Merge Reddit Posts | analyze                      |             |
| analyze                | LangChain Agent                | Performs sentiment, emotion, and insight analysis | Exclude Existing           | Report to Notion              |             |
| OpenAI Chat Model      | LangChain LM Chat OpenAI        | Provides GPT-4o Mini AI model backend   | analyze, misspellings (ai_languageModel) | analyze, misspellings (ai_languageModel) |             |
| json schema            | Output Parser Structured        | Parses AI output into structured JSON   | analyze (ai_outputParser)    | analyze (ai_outputParser)      |             |
| Report to Notion       | Notion                         | Logs analyzed comments and insights     | analyze                      | None                         |             |
| Sticky Note11          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note12          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note13          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note14          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note15          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note16          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note17          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note18          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note19          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note20          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note21          | Sticky Note                    | (Empty)                                 | None                         | None                         |             |
| Sticky Note            | Sticky Note                    | (Empty)                                 | None                         | None                         |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Set desired schedule (e.g., daily at a specific time).  
   - No input required. This node triggers the workflow.

2. **Add a Set node named "Add Your Info"**  
   - Configure to set variables: brand name, business details, and any other parameters needed for Reddit search and Notion queries.  
   - Connect Schedule Trigger → Add Your Info.

3. **Create a Reddit node named "search brand name"**  
   - Configure to search Reddit posts/comments for the exact brand name (use expression referencing "Add Your Info" brand name).  
   - Connect Add Your Info → search brand name.

4. **Create a LangChain Agent node named "misspellings"**  
   - Configure to use GPT-4o Mini via OpenAI Chat Model credentials.  
   - Prompt the model to generate common misspellings or variations of the brand name.  
   - Connect Add Your Info → misspellings.

5. **Create an Output Parser Structured node named "json schema"**  
   - Configure to parse AI output from "misspellings" into structured JSON array of misspellings.  
   - Connect misspellings (ai_outputParser) → json schema.

6. **Create a SplitOut node named "Split Out"**  
   - Configure to extract the array of misspellings from the parsed AI output.  
   - Connect json schema → Split Out.

7. **Create a SplitInBatches node named "Loop Over Misspellings"**  
   - Configure batch size (default or as needed).  
   - Connect Split Out → Loop Over Misspellings.

8. **Create a Reddit node named "iterate_on_misspellings"**  
   - Configure to search Reddit for each misspelling (query set dynamically from current batch item).  
   - Connect Loop Over Misspellings → iterate_on_misspellings.

9. **Connect iterate_on_misspellings → Loop Over Misspellings**  
   - This creates a loop to process all misspellings.

10. **Connect search brand name and Loop Over Misspellings to a Merge node named "Merge Reddit Posts"**  
    - Configure to merge posts from both sources (append or merge by index).  
    - Connect search brand name → Merge Reddit Posts (input 1).  
    - Connect Loop Over Misspellings → Merge Reddit Posts (input 2).

11. **Create a Notion node named "search for existing"**  
    - Configure to query the Notion database for existing Reddit posts/comments to detect duplicates (filter by Reddit post ID or URL).  
    - Connect Add Your Info → search for existing.

12. **Create a Merge node named "Exclude Existing"**  
    - Configure to remove Reddit posts already existing in Notion.  
    - Connect search for existing → Exclude Existing (input 0).  
    - Connect Merge Reddit Posts → Exclude Existing (input 1).

13. **Create a LangChain Agent node named "analyze"**  
    - Configure to analyze Reddit comments for sentiment, emotion, and generate insights using GPT-4o Mini.  
    - Set retry attempts to 5.  
    - Connect Exclude Existing → analyze.

14. **Create an Output Parser Structured node named "json schema"** (for analysis output)  
    - Configure to parse AI analysis output into structured JSON.  
    - Connect analyze (ai_outputParser) → json schema.

15. **Create an OpenAI Chat Model node**  
    - Configure with OpenAI credentials for GPT-4o Mini.  
    - Connect OpenAI Chat Model (ai_languageModel) → analyze and misspellings nodes.

16. **Create a Notion node named "Report to Notion"**  
    - Configure to create or update entries in Notion database with analyzed comment data and AI insights.  
    - Set onError to "continueRegularOutput" to avoid workflow failure on errors.  
    - Connect analyze → Report to Notion.

17. **Test the workflow end-to-end**  
    - Validate Reddit API credentials, OpenAI API credentials, and Notion API credentials.  
    - Check for correct data mappings and expected outputs.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow uses GPT-4o Mini via n8n’s LangChain integration for AI-powered text generation and parsing.| n8n LangChain nodes documentation: https://docs.n8n.io/integrations/builtin/ai/langchain/        |
| Notion integration requires OAuth2 credentials with database read/write permissions.                     | Notion API docs: https://developers.notion.com/docs/getting-started                               |
| Reddit node requires Reddit API credentials with appropriate scopes for reading posts and comments.     | Reddit API docs: https://www.reddit.com/dev/api/                                                 |
| To avoid API rate limits, consider adding delays or error handling for retries in Reddit and OpenAI nodes.| n8n workflow best practices: https://docs.n8n.io/nodes/best-practices/                            |
| The workflow includes empty sticky notes for future documentation or annotations.                        | Sticky notes can be used to add contextual comments or instructions in the n8n editor interface. |

---

This structured documentation provides a comprehensive understanding of the workflow’s architecture, node configurations, and operational logic, enabling advanced users and AI agents to reproduce, modify, or troubleshoot it effectively.