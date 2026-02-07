Analyze Competitor LinkedIn Posts with Bright Data + Google Gemini to Google Sheets

https://n8nworkflows.xyz/workflows/analyze-competitor-linkedin-posts-with-bright-data---google-gemini-to-google-sheets-6619


# Analyze Competitor LinkedIn Posts with Bright Data + Google Gemini to Google Sheets

### 1. Workflow Overview

This workflow automates the competitive analysis of LinkedIn posts by scraping post data, analyzing it with Google Gemini AI models, and saving structured insights into Google Sheets. It is designed to help marketing teams, consultants, and analysts quickly understand competitors’ social media activities without manual data gathering or analysis.

The workflow is logically divided into three main blocks:

- **1.1 Input Reception & Trigger:** Manual user initiation and URL input for the LinkedIn post to analyze.
- **1.2 Data Extraction & AI Analysis:** Scraping the LinkedIn post details using Bright Data, then applying AI agents powered by Google Gemini to generate structured insights.
- **1.3 Output Storage:** Saving the AI-generated analysis results into a Google Sheet for ongoing competitive intelligence.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception & Trigger

**Overview:**  
This block serves as the workflow’s entry point. A user manually triggers the workflow and inputs a LinkedIn post URL to be analyzed.

**Nodes Involved:**  
- Start Analysis (Manual Trigger)  
- Set LinkedIn Post URL

**Node Details:**

- **Start Analysis (Manual Trigger)**  
  - *Type:* Manual Trigger  
  - *Role:* Initiates the workflow execution on user command.  
  - *Configuration:* No parameters; simply a button trigger.  
  - *Inputs:* None  
  - *Outputs:* Connects to "Set LinkedIn Post URL" node.  
  - *Failure Modes:* None typical. User must manually trigger.  
  - *Version:* Standard.

- **Set LinkedIn Post URL**  
  - *Type:* Set  
  - *Role:* Holds the LinkedIn post URL as a fixed input for scraping.  
  - *Configuration:* A single string field named `post URL` containing a LinkedIn post link (example URL preset).  
  - *Inputs:* From manual trigger.  
  - *Outputs:* Passes URL to Bright Data scrapper node.  
  - *Failure Modes:* Incorrect URL format or private post URL may cause downstream scraping failure.  
  - *Version:* 3.4.

---

#### 2.2 Data Extraction & AI Analysis

**Overview:**  
This is the core block that extracts data from the LinkedIn post via Bright Data, then processes that data with a Google Gemini AI agent to generate insightful, structured analysis.

**Nodes Involved:**  
- Scrape LinkedIn Post Details (Bright Data)  
- Google Gemini Chat Model1  
- Auto-fixing Output Parser  
- Structured Output Parser  
- Post Analyzer agent  

**Node Details:**

- **Scrape LinkedIn Post Details**  
  - *Type:* Bright Data (webScrapper)  
  - *Role:* Scrapes LinkedIn post metadata including company, followers, post content, comments, likes, and dates.  
  - *Configuration:*  
    - Scrapes URL assigned from previous node (`post URL`).  
    - Uses preset dataset ID for LinkedIn post data extraction (`gd_lyy3tktm25m4avu764`).  
    - Bright Data API credentials configured.  
  - *Inputs:* Receives URL from "Set LinkedIn Post URL" node.  
  - *Outputs:* Passes scraped JSON data to AI agent.  
  - *Failure Modes:*  
    - Network or API quota errors  
    - Private or non-existent LinkedIn post URLs  
    - Changes in LinkedIn page structure breaking scraper dataset  
  - *Version:* 1.

- **Google Gemini Chat Model1**  
  - *Type:* LangChain Google Gemini Chat Model  
  - *Role:* Provides AI language model for post analysis agent.  
  - *Configuration:* Uses Google Gemini (PaLM) API credentials (account 2).  
  - *Inputs:* Feeds AI model into "Post Analyzer agent".  
  - *Outputs:* Passes model output to agent.  
  - *Failure Modes:*  
    - API authentication errors  
    - Rate limits or timeouts  
  - *Version:* 1.

- **Auto-fixing Output Parser**  
  - *Type:* LangChain Output Parser Autofixing  
  - *Role:* Automatically fixes and validates JSON output from the AI model for structural correctness.  
  - *Configuration:* Default options, no custom schema.  
  - *Inputs:* Receives raw AI output from "Post Analyzer agent".  
  - *Outputs:* Passes fixed JSON output back to the agent or downstream nodes.  
  - *Failure Modes:*  
    - Cannot fix highly malformed outputs  
  - *Version:* 1.

- **Structured Output Parser**  
  - *Type:* LangChain Output Parser Structured  
  - *Role:* Parses AI output into a predefined JSON schema for easier downstream processing.  
  - *Configuration:* Uses a JSON schema example that includes fields like summary, post_intent, engagement_level, engagement_reason, audience_insight, marketing_takeaway.  
  - *Inputs:* Receives AI raw output from Google Gemini Chat Model.  
  - *Outputs:* Passes structured JSON data to the Auto-fixing Output Parser.  
  - *Failure Modes:*  
    - Schema mismatches causing parsing errors  
  - *Version:* 1.3.

- **Post Analyzer agent**  
  - *Type:* LangChain Agent  
  - *Role:* Orchestrates the AI prompt with the scraped LinkedIn post data, instructing the AI to analyze and produce insights such as summary, intent, engagement, audience, and marketing takeaway.  
  - *Configuration:*  
    - Prompt includes detailed placeholders for scraped data fields (company name, followers, post text, likes, comments, top comment, etc.).  
    - Output parser enabled to structure AI response.  
  - *Inputs:* Receives scraped post JSON data and AI model from "Google Gemini Chat Model1".  
  - *Outputs:* Sends analyzed structured output to "Save Analysis to Google Sheet".  
  - *Failure Modes:*  
    - Malformed input data may confuse AI  
    - API errors or timeouts  
  - *Version:* 2.1.

---

#### 2.3 Output Storage

**Overview:**  
Stores the AI-generated analysis data into a Google Sheet, appending a new row for each analyzed LinkedIn post to build a competitive intelligence database.

**Nodes Involved:**  
- Save Analysis to Google Sheet

**Node Details:**

- **Save Analysis to Google Sheet**  
  - *Type:* Google Sheets Node  
  - *Role:* Appends the structured AI analysis results as a new row in a predefined Google Sheet.  
  - *Configuration:*  
    - Document ID and sheet name preset (Sheet1, gid=0).  
    - Columns mapped: Summary, Post Intent, Engagement Level, Engagement Reason, Audience Insight, Marketing Takeaway.  
    - Uses service account authentication for Google API.  
  - *Inputs:* Receives structured output JSON from "Post Analyzer agent".  
  - *Outputs:* None (end node).  
  - *Failure Modes:*  
    - Authentication failures  
    - API quota exceeded  
    - Incorrect spreadsheet permissions  
  - *Version:* 4.6.

---

### 3. Summary Table

| Node Name                    | Node Type                            | Functional Role                       | Input Node(s)              | Output Node(s)               | Sticky Note                                                                                                               |
|------------------------------|------------------------------------|------------------------------------|----------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Start Analysis (Manual Trigger) | Manual Trigger                     | Workflow start trigger              | None                       | Set LinkedIn Post URL         | ## 🟩 **Section 1: 🔗 URL Input & Trigger** This section is your starting point. The workflow begins with manual trigger.   |
| Set LinkedIn Post URL         | Set                                | Holds LinkedIn post URL             | Start Analysis (Manual Trigger) | Scrape LinkedIn Post Details  | ## 🟩 **Section 1: 🔗 URL Input & Trigger** The only required input is the LinkedIn post URL.                                |
| Scrape LinkedIn Post Details  | Bright Data (webScrapper)           | Scrapes LinkedIn post content       | Set LinkedIn Post URL       | Post Analyzer agent           | ## 🟨 **Section 2: 🧠 Data Extraction + AI Analysis** Scrapes all key metadata from the post.                               |
| Google Gemini Chat Model1     | LangChain Google Gemini Chat Model  | Provides AI model for analysis      | None                       | Post Analyzer agent           | ## 🟨 **Section 2: 🧠 Data Extraction + AI Analysis** Part of AI agent analyzing the post.                                  |
| Auto-fixing Output Parser     | LangChain Output Parser Autofixing  | Validates and fixes AI JSON output  | Post Analyzer agent         | Post Analyzer agent           | ## 🟨 **Section 2: 🧠 Data Extraction + AI Analysis** Cleans AI output JSON.                                                |
| Structured Output Parser      | LangChain Output Parser Structured  | Parses AI output into JSON schema   | Google Gemini Chat Model    | Auto-fixing Output Parser     | ## 🟨 **Section 2: 🧠 Data Extraction + AI Analysis** Structures AI output for easier use.                                  |
| Post Analyzer agent           | LangChain Agent                    | Runs AI prompt, processes analysis  | Scrape LinkedIn Post Details, Google Gemini Chat Model1 | Save Analysis to Google Sheet | ## 🟨 **Section 2: 🧠 Data Extraction + AI Analysis** Core agent that applies AI analysis to scraped data.                 |
| Save Analysis to Google Sheet | Google Sheets                      | Saves analyzed data to spreadsheet  | Post Analyzer agent         | None                        | ## 🟦 **Section 3: 📊 Save to Sheet** Stores AI-generated results in Google Sheets, creating a live intelligence database.  |
| Sticky Note                  | Sticky Note                       | Documentation note                  | None                       | None                        | ## 🟩 **Section 1: 🔗 URL Input & Trigger** Explanation of block 1.                                                          |
| Sticky Note1                 | Sticky Note                       | Documentation note                  | None                       | None                        | ## 🟨 **Section 2: 🧠 Data Extraction + AI Analysis** Explanation of block 2.                                               |
| Sticky Note2                 | Sticky Note                       | Documentation note                  | None                       | None                        | ## 🟦 **Section 3: 📊 Save to Sheet** Explanation of block 3 and example sheet link.                                         |
| Sticky Note4                 | Sticky Note                       | Documentation note                  | None                       | None                        | Full workflow overview and detailed section explanations.                                                                  |
| Sticky Note5                 | Sticky Note                       | Affiliate note                     | None                       | None                        | Affiliate link for Bright Data.                                                                                            |
| Sticky Note9                 | Sticky Note                       | Support and contact info           | None                       | None                        | Workflow assistance contact and tutorial links.                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To start the workflow on demand.

2. **Create a Set Node (Set LinkedIn Post URL)**  
   - Connect Manual Trigger → Set Node  
   - Add a string field named `post URL`  
   - Enter default LinkedIn post URL or leave empty for manual input.

3. **Create a Bright Data Node (Scrape LinkedIn Post Details)**  
   - Connect Set Node → Bright Data Node  
   - Configure to use `webScrapper` resource.  
   - Set URLs parameter to: `=[{"url":"{{ $json["post URL"] }}"}]`  
   - Use Bright Data dataset ID for LinkedIn posts (`gd_lyy3tktm25m4avu764`).  
   - Add Bright Data API credentials with access to the dataset.

4. **Create Google Gemini Chat Model Node (AI Model Provider)**  
   - No input connection required here (used by Agent).  
   - Provide Google Palm API credentials for Gemini (account 2).

5. **Create Structured Output Parser Node**  
   - Connect Google Gemini Chat Model → Structured Output Parser  
   - Paste JSON schema example defining expected output fields: summary, post_intent, engagement_level, engagement_reason, audience_insight, marketing_takeaway.

6. **Create Auto-fixing Output Parser Node**  
   - Connect Structured Output Parser → Auto-fixing Output Parser  
   - Use default auto-fix options.

7. **Create Post Analyzer Agent Node**  
   - Connect Bright Data Node → Post Analyzer Agent  
   - Connect Google Gemini Chat Model1 → Post Analyzer Agent  
   - Connect Auto-fixing Output Parser → Post Analyzer Agent (as output parser)  
   - Configure Agent prompt:  
     - Include placeholders for scraped data fields (company name, profile URL, followers, post title/text, likes, comments, top comment, etc.)  
     - Request analysis in 5 parts: summary, post intent, engagement analysis, audience insight, marketing takeaway.  
   - Enable output parser.

8. **Create Google Sheets Node (Save Analysis to Google Sheet)**  
   - Connect Post Analyzer Agent → Google Sheets Node  
   - Configure to append rows to a Google Sheet document (provide document ID and sheet name).  
   - Map columns from AI output fields to spreadsheet columns: Summary, Post Intent, Engagement Level, Engagement Reason, Audience Insight, Marketing Takeaway.  
   - Use Google API service account credentials with write access.

9. **Test the workflow**  
   - Trigger manually, verify scraping, AI analysis, and sheet update.

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                         |
|-----------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Workflow allows non-technical users to analyze LinkedIn posts for competitive intelligence with few clicks.      | Workflow overview and sticky notes explain ease of use for marketing teams and beginners.             |
| Affiliate link for Bright Data supporting further free content: https://get.brightdata.com/1tndi4600b25          | Sticky Note5                                                                                           |
| Contact for workflow support: Yaron@nofluff.online                                                              | Sticky Note9                                                                                           |
| Additional tips and instructions available on YouTube and LinkedIn profiles:                                    | YouTube: https://www.youtube.com/@YaronBeen/videos LinkedIn: https://www.linkedin.com/in/yaronbeen/     |
| Example Google Sheet template for storing analysis: https://docs.google.com/spreadsheets/d/1EKF6MLQN9suxGDzqlkARkDnSA-x75IpJbB0PXIx_E1Q/edit?usp=sharing | Referenced in Sticky Note2 for structuring output data storage.                                        |

---

This documentation fully captures the workflow's logical structure, node configurations, data flow, and practical usage, enabling reproduction, modification, and troubleshooting by users and AI agents alike.