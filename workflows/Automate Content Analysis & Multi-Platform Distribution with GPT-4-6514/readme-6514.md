Automate Content Analysis & Multi-Platform Distribution with GPT-4

https://n8nworkflows.xyz/workflows/automate-content-analysis---multi-platform-distribution-with-gpt-4-6514


# Automate Content Analysis & Multi-Platform Distribution with GPT-4

### 1. Workflow Overview

This workflow, titled **"Intelligent Content & Marketing Hub with GPT-4"**, automates the process of content ingestion, intelligent analysis, and multi-platform distribution. It is designed for marketing teams, content creators, or digital agencies aiming to streamline content analysis and publishing workflows by leveraging GPT-4 AI capabilities and automating posts across social media channels.

**Use Cases:**  
- Automatically analyze new content from WordPress or RSS feeds  
- Generate social media posts tailored for Twitter, LinkedIn, and Facebook  
- Archive analyzed content into Google Sheets for tracking and reporting  

**Logical Blocks:**

- **1.1 Input Reception**: Captures new content via WordPress webhook or RSS feed trigger.  
- **1.2 Content Analysis with AI**: Uses OpenAI GPT-4 integration to analyze and extract insights from the incoming content.  
- **1.3 AI Output Parsing**: Processes AI-generated text to extract structured data for social media posts.  
- **1.4 Social Media Posting**: Publishes posts simultaneously to Twitter, LinkedIn, and Facebook.  
- **1.5 Content Logging**: Archives content metadata and analysis results into Google Sheets.  
- **1.6 Merge Logic**: Combines multiple input streams and social media outputs to synchronize downstream processes.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception

**Overview:**  
Receives new content either from a WordPress website through a webhook or from an RSS feed reader trigger. It merges these two input sources into a unified stream for further processing.

**Nodes Involved:**  
- Wordpress Trigger  
- RSS Feed Trigger  
- Merge1  

**Node Details:**  

- **Wordpress Trigger**  
  - *Type:* Webhook  
  - *Role:* Listens for new content published on a WordPress site.  
  - *Configuration:* Default webhook node with a unique webhook ID. No additional parameters.  
  - *Input:* External HTTP requests from WordPress.  
  - *Output:* Emits content payload for use downstream.  
  - *Edge Cases:* Webhook misconfiguration, unauthorized requests, downtime of WordPress site.

- **RSS Feed Trigger**  
  - *Type:* RSS Feed Reader Trigger  
  - *Role:* Polls RSS feeds periodically to detect new content items.  
  - *Configuration:* Default; likely set to monitor one or more RSS URLs (not visible in JSON).  
  - *Input:* N/A (trigger node).  
  - *Output:* New RSS feed entries as items.  
  - *Edge Cases:* Feed downtime, invalid RSS format, network errors.

- **Merge1**  
  - *Type:* Merge  
  - *Role:* Combines the data streams from WordPress Trigger and RSS Feed Trigger into a single stream for analysis.  
  - *Configuration:* Default merge mode (likely "Merge By Index" or "Append").  
  - *Input:* Two inputs from Wordpress Trigger and RSS Feed Trigger.  
  - *Output:* Single output stream for AI content analysis.  
  - *Edge Cases:* Mismatched data shapes, empty inputs.

---

#### 1.2 Content Analysis with AI

**Overview:**  
Utilizes an OpenAI GPT-4 LangChain node to analyze the incoming content, extracting meaningful insights, summaries, or metadata tailored for marketing use.

**Nodes Involved:**  
- Content Analysis  

**Node Details:**  

- **Content Analysis**  
  - *Type:* OpenAI (LangChain) Node  
  - *Role:* Sends content data to GPT-4 model for intelligent analysis.  
  - *Configuration:* Uses GPT-4 model via LangChain integration with OpenAI credentials configured externally. No explicit parameters visible but typically includes prompt templating and temperature settings.  
  - *Input:* Merged content from Merge1 node (WordPress or RSS).  
  - *Output:* AI-generated textual analysis.  
  - *Edge Cases:* API rate limits, authentication errors, malformed input causing prompt failures, network timeouts.  
  - *Version Specifics:* Uses version 1.8 of LangChain node; ensure compatibility with n8n version.

---

#### 1.3 AI Output Parsing

**Overview:**  
Processes the raw AI output text to extract structured data elements required for social media posts and logging. This is done via a Code node which likely parses JSON or formats text.

**Nodes Involved:**  
- Parse AI Output  

**Node Details:**  

- **Parse AI Output**  
  - *Type:* Code (JavaScript) Node  
  - *Role:* Parses GPT-4 output text into structured format (e.g., JSON) suitable for social media nodes.  
  - *Configuration:* Custom JavaScript code (not visible), likely using JSON.parse or regex extraction.  
  - *Input:* AI output from Content Analysis node.  
  - *Output:* Structured data sent to social media posting nodes and Facebook Graph API node.  
  - *Edge Cases:* Malformed AI output causing parse errors, unexpected formats, empty responses.

---

#### 1.4 Social Media Posting

**Overview:**  
Publishes the parsed content as posts across three social media platforms: Twitter, LinkedIn, and Facebook. The outputs from these nodes are merged into a single stream for logging.

**Nodes Involved:**  
- Create Tweet (Twitter)  
- Create a post (LinkedIn)  
- Facebook Graph API  
- Merge  

**Node Details:**  

- **Create Tweet**  
  - *Type:* Twitter Node  
  - *Role:* Posts a tweet using Twitter API.  
  - *Configuration:* Uses OAuth2 credentials configured in n8n. Parameters include tweet text derived from parsed AI content.  
  - *Input:* Structured post data from Parse AI Output.  
  - *Output:* Twitter API response.  
  - *Edge Cases:* Auth failures, tweet length exceeds limit (280 chars), rate limiting.

- **Create a post**  
  - *Type:* LinkedIn Node  
  - *Role:* Creates a LinkedIn post on an authorized user or company page.  
  - *Configuration:* OAuth2 credentials set. Post content taken from parsed AI output.  
  - *Input:* Structured post data from Parse AI Output.  
  - *Output:* LinkedIn API response.  
  - *Edge Cases:* Authentication expiration, insufficient permissions, API errors.

- **Facebook Graph API**  
  - *Type:* Facebook Graph API Node  
  - *Role:* Posts content to Facebook via Graph API.  
  - *Configuration:* OAuth2 credentials for Facebook app/page. Uses parsed AI output for message content.  
  - *Input:* Structured post data from Parse AI Output.  
  - *Output:* Facebook API response.  
  - *Edge Cases:* Token expiration, permission errors, API limits.

- **Merge**  
  - *Type:* Merge Node  
  - *Role:* Combines outputs from Twitter, LinkedIn, and Facebook nodes into a single stream for logging.  
  - *Configuration:* Default merge mode (likely append or by index).  
  - *Input:* Three inputs from Create Tweet, Create a post, Facebook Graph API.  
  - *Output:* Combined data for archiving.  
  - *Edge Cases:* Node failures causing missing inputs.

---

#### 1.5 Content Logging

**Overview:**  
Archives the merged social media post data and analysis results into a Google Sheets spreadsheet for tracking and historical reference.

**Nodes Involved:**  
- Content Log & Archive  

**Node Details:**  

- **Content Log & Archive**  
  - *Type:* Google Sheets Node  
  - *Role:* Appends or updates rows in a Google Sheets document with post data and metadata.  
  - *Configuration:* Connected to Google Sheets credentials, configured to write to a specific spreadsheet and worksheet. Mapping includes fields like post text, platform, timestamps, and AI analysis results.  
  - *Input:* Combined social media post data merged by Merge node.  
  - *Output:* Confirmation of row addition/update.  
  - *Edge Cases:* Credential expiration, quota limits, sheet access errors.

---

### 3. Summary Table

| Node Name           | Node Type                     | Functional Role                       | Input Node(s)                   | Output Node(s)                       | Sticky Note                                                                                           |
|---------------------|-------------------------------|------------------------------------|--------------------------------|------------------------------------|-----------------------------------------------------------------------------------------------------|
| Wordpress Trigger   | Webhook                       | Input Reception from WordPress      | External HTTP requests          | Merge1                            |                                                                                                     |
| RSS Feed Trigger    | RSS Feed Read Trigger         | Input Reception from RSS feeds      | N/A                            | Merge1                            |                                                                                                     |
| Merge1              | Merge                        | Combines WordPress and RSS inputs   | Wordpress Trigger, RSS Feed Trigger | Content Analysis                 |                                                                                                     |
| Content Analysis    | OpenAI (LangChain)            | AI Content Analysis (GPT-4)          | Merge1                         | Parse AI Output                   |                                                                                                     |
| Parse AI Output     | Code                         | Parses AI Text Output                 | Content Analysis               | Create Tweet, Create a post, Facebook Graph API |                                                                                                     |
| Create Tweet        | Twitter Node                 | Posts content on Twitter             | Parse AI Output                | Merge                            |                                                                                                     |
| Create a post       | LinkedIn Node                | Posts content on LinkedIn            | Parse AI Output                | Merge                            |                                                                                                     |
| Facebook Graph API  | Facebook Graph API Node       | Posts content on Facebook            | Parse AI Output                | Merge                            |                                                                                                     |
| Merge               | Merge                        | Combines social media post outputs  | Create Tweet, Create a post, Facebook Graph API | Content Log & Archive          |                                                                                                     |
| Content Log & Archive | Google Sheets Node           | Logs posts and metadata              | Merge                         | N/A                             |                                                                                                     |
| Sticky Note         | Sticky Note                  | N/A                                | N/A                           | N/A                             |                                                                                                     |
| Sticky Note1        | Sticky Note                  | N/A                                | N/A                           | N/A                             |                                                                                                     |
| Sticky Note2        | Sticky Note                  | N/A                                | N/A                           | N/A                             |                                                                                                     |
| Sticky Note3        | Sticky Note                  | N/A                                | N/A                           | N/A                             |                                                                                                     |
| Sticky Note4        | Sticky Note                  | N/A                                | N/A                           | N/A                             |                                                                                                     |

*(No sticky note content provided in JSON)*

---

### 4. Reproducing the Workflow from Scratch

1. **Create Input Nodes:**  
   - Add a **Webhook** node named `Wordpress Trigger`. Configure it with the `POST` method and set a unique webhook URL. This will receive new content submissions from WordPress.  
   - Add an **RSS Feed Read Trigger** node named `RSS Feed Trigger`. Configure it with the RSS feed URL(s) you want to monitor and set polling frequency.

2. **Merge Incoming Content:**  
   - Add a **Merge** node named `Merge1`. Connect `Wordpress Trigger` output to input 1, and `RSS Feed Trigger` output to input 2. Use default merge mode to combine content streams.

3. **Add AI Content Analysis:**  
   - Add an **OpenAI (LangChain)** node named `Content Analysis`.  
   - Configure the node with your OpenAI API credentials.  
   - Set the model to GPT-4.  
   - Use a prompt template designed to analyze content and generate social media posts or summaries based on the input text from `Merge1`.

4. **Parse AI Output:**  
   - Add a **Code** node named `Parse AI Output`.  
   - Write JavaScript code to parse the AI output text into structured JSON containing fields like `tweetText`, `linkedInPost`, and `facebookMessage`.  
   - Connect `Content Analysis` output to this node.

5. **Post to Twitter:**  
   - Add a **Twitter** node named `Create Tweet`.  
   - Configure with OAuth2 credentials for Twitter.  
   - Map the tweet text field from `Parse AI Output` to the `Text` parameter.  
   - Connect `Parse AI Output` output to this node.

6. **Post to LinkedIn:**  
   - Add a **LinkedIn** node named `Create a post`.  
   - Configure with OAuth2 credentials for LinkedIn.  
   - Map the LinkedIn post text from parsed data to the content field.  
   - Connect `Parse AI Output` output to this node.

7. **Post to Facebook:**  
   - Add a **Facebook Graph API** node named `Facebook Graph API`.  
   - Configure with Facebook OAuth2 credentials for your page/app.  
   - Set HTTP method to `POST` and endpoint to `/me/feed` or equivalent.  
   - Map the Facebook message text from parsed data.  
   - Connect `Parse AI Output` output to this node.

8. **Merge Social Media Outputs:**  
   - Add a **Merge** node named `Merge`.  
   - Connect outputs of `Create Tweet`, `Create a post`, and `Facebook Graph API` nodes to inputs 1, 2, and 3 respectively.

9. **Log Content and Posts:**  
   - Add a **Google Sheets** node named `Content Log & Archive`.  
   - Authenticate with Google Sheets credentials.  
   - Select or create a spreadsheet and worksheet for logging.  
   - Map fields from `Merge` node output (e.g., platform, post ID, timestamps, content summaries).  
   - Connect `Merge` output to this node.

10. **Activate Workflow:**  
    - Ensure all credentials are properly configured and tested.  
    - Activate the workflow to start listening for WordPress posts and RSS feed updates automatically.

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                    |
|------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| This workflow uses GPT-4 via the LangChain integration in n8n, which requires appropriate OpenAI credentials and API quota management. | OpenAI Platform: https://platform.openai.com      |
| OAuth2 credentials must be configured for Twitter, LinkedIn, and Facebook Graph API nodes before activation to avoid auth errors. | n8n Credential Setup Docs: https://docs.n8n.io/credentials/oauth2/ |
| Google Sheets node requires access to the target spreadsheet with edit permissions for appending logs. | Google Sheets API Guide: https://developers.google.com/sheets/api |
| Consider rate limiting and error handling in production to handle API quota limits and transient failures. | n8n Error Handling Docs: https://docs.n8n.io/nodes/handling-errors/ |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.