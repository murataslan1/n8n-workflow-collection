AI-Powered YouTube Meta Generator with GPT-4o, Gemini & Content Enrichment

https://n8nworkflows.xyz/workflows/ai-powered-youtube-meta-generator-with-gpt-4o--gemini---content-enrichment-3788


# AI-Powered YouTube Meta Generator with GPT-4o, Gemini & Content Enrichment

### 1. Workflow Overview

This workflow is an **AI-Powered YouTube Metadata Generator** designed to automate the creation and updating of SEO-optimized YouTube video metadata. It targets content creators, affiliate marketers, educators, and agencies who want to enhance their YouTube videos with compelling titles, descriptions, tags, hashtags, and contextual affiliate and internal links without manual effort.

The workflow logically divides into the following blocks:

- **1.1 Input Reception & Video Data Extraction:** Accepts user input via a form (YouTube video link and optional keywords), extracts the video ID, and fetches video details and transcript.
- **1.2 Blog Sitemap Processing & Related Content Extraction:** Retrieves and parses the blog sitemap to gather URLs for internal linking and content enrichment.
- **1.3 AI Metadata Generation:** Uses AI models (Google Gemini or OpenAI GPT-4o) to analyze the transcript and generate SEO-friendly titles, descriptions, tags, and hashtags.
- **1.4 Related Videos & Affiliate Links Retrieval:** Finds similar past videos and fetches affiliate/product recommendations from Airtable.
- **1.5 Metadata Update & Completion:** Updates the YouTube video metadata via YouTube API and confirms completion to the user.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Video Data Extraction

**Overview:**  
This block handles the initial user input via a form, extracts the YouTube video ID from the provided link, and fetches detailed video information and transcript for further processing.

**Nodes Involved:**  
- On form submission  
- EGet Video ID  
- Get Details of Video from Youtube  
- Get Youtube Transcript  

**Node Details:**

- **On form submission**  
  - Type: Form Trigger  
  - Role: Entry point; triggers workflow on form submission  
  - Configuration: Listens for form submissions with fields for YouTube video link and optional keywords  
  - Inputs: None (trigger)  
  - Outputs: Passes form data to "EGet Video ID"  
  - Edge Cases: Invalid or malformed URLs, missing input fields, webhook connectivity issues

- **EGet Video ID**  
  - Type: Set  
  - Role: Extracts YouTube video ID from the submitted URL  
  - Configuration: Uses expressions to parse the video ID from the URL string  
  - Inputs: Form submission data  
  - Outputs: Video ID to "Get Details of Video from Youtube"  
  - Edge Cases: Unsupported URL formats, empty or invalid video ID extraction

- **Get Details of Video from Youtube**  
  - Type: YouTube node  
  - Role: Fetches metadata/details of the video using YouTube Data API  
  - Configuration: Uses OAuth2 credentials for YouTube API  
  - Inputs: Video ID  
  - Outputs: Video details to "Get Youtube Transcript"  
  - Edge Cases: API quota limits, invalid video ID, authentication failures

- **Get Youtube Transcript**  
  - Type: HTTP Request  
  - Role: Retrieves the transcript of the video (likely via an external service or YouTube captions API)  
  - Configuration: HTTP GET request with video ID parameter  
  - Inputs: Video details  
  - Outputs: Transcript text to "Generate Title Description Tags and Hashtags"  
  - Edge Cases: No transcript available, HTTP errors, rate limits

---

#### 2.2 Blog Sitemap Processing & Related Content Extraction

**Overview:**  
This block fetches the blog sitemap XML, converts it to JSON, extracts URLs, and aggregates them for AI processing to find relevant blog posts for internal linking.

**Nodes Involved:**  
- Get Post SiteMap  
- Conver to JSON  
- Extract URLs  
- URL Lists  
- Get all Posts for AI  

**Node Details:**

- **Get Post SiteMap**  
  - Type: HTTP Request  
  - Role: Fetches the XML sitemap of the blog (WordPress or similar)  
  - Configuration: HTTP GET to sitemap URL  
  - Inputs: None (triggered downstream)  
  - Outputs: Sitemap XML to "Conver to JSON"  
  - Edge Cases: Network errors, invalid sitemap URL, sitemap format changes

- **Conver to JSON**  
  - Type: XML  
  - Role: Converts XML sitemap to JSON format for easier processing  
  - Configuration: Standard XML to JSON conversion  
  - Inputs: Sitemap XML  
  - Outputs: JSON to "Extract URLs"  
  - Edge Cases: Malformed XML, conversion errors

- **Extract URLs**  
  - Type: Split Out  
  - Role: Extracts individual URL entries from sitemap JSON  
  - Configuration: Splits JSON array of URLs for processing  
  - Inputs: JSON sitemap  
  - Outputs: Individual URL items to "URL Lists"  
  - Edge Cases: Empty URL list, unexpected JSON structure

- **URL Lists**  
  - Type: Aggregate  
  - Role: Aggregates extracted URLs into a list for AI processing  
  - Configuration: Aggregates URL data  
  - Inputs: Individual URLs  
  - Outputs: Aggregated list to "Get all Posts for AI"  
  - Edge Cases: Large URL lists causing memory issues

- **Get all Posts for AI**  
  - Type: Set  
  - Role: Prepares the aggregated URLs for AI input  
  - Configuration: Sets variables or data structure for AI consumption  
  - Inputs: Aggregated URL list  
  - Outputs: Data to "OpenAI" node for relevance analysis  
  - Edge Cases: Data formatting errors

---

#### 2.3 AI Metadata Generation

**Overview:**  
This block uses AI models to analyze the transcript and blog URLs, generating optimized YouTube metadata including title, description, tags, hashtags, and recommended links.

**Nodes Involved:**  
- Generate Title Description Tags and Hashtags  
- Extract Relevant Data  
- Formatted Tags  
- Formatted Hashtags  
- OpenAI  
- Releated Blog  
- Formatted Blog Links  
- Youtube Metadata Generator1  
- Structured Output Parser  
- Google Gemini Chat Model2  
- important_links  

**Node Details:**

- **Generate Title Description Tags and Hashtags**  
  - Type: OpenAI (Langchain)  
  - Role: Generates initial metadata text based on transcript and input keywords  
  - Configuration: Uses GPT-4o model with custom prompt for SEO-friendly content under constraints (e.g., title < 70 chars)  
  - Inputs: Transcript text  
  - Outputs: Raw metadata text to "Extract Relevant Data"  
  - Edge Cases: API rate limits, prompt failures, incomplete outputs

- **Extract Relevant Data**  
  - Type: Code  
  - Role: Parses AI output to extract structured metadata fields  
  - Configuration: JavaScript code extracting tags, title, description, hashtags  
  - Inputs: AI raw text  
  - Outputs: Parsed data to "Formatted Tags" and "Formatted Hashtags"  
  - Edge Cases: Parsing errors if AI output format changes

- **Formatted Tags**  
  - Type: Code  
  - Role: Formats tags into a single string or list suitable for YouTube API  
  - Configuration: Joins or sanitizes tags  
  - Inputs: Extracted tags  
  - Outputs: Formatted tags to next node  
  - Edge Cases: Empty tags, special characters

- **Formatted Hashtags**  
  - Type: Code  
  - Role: Formats hashtags similarly for YouTube description or tags  
  - Configuration: Joins hashtags with # prefix  
  - Inputs: Extracted hashtags  
  - Outputs: Formatted hashtags to "Get Post SiteMap" (for enrichment)  
  - Edge Cases: Empty hashtags, duplicates

- **OpenAI**  
  - Type: OpenAI (Langchain)  
  - Role: Analyzes blog URLs for relevance to video content  
  - Configuration: Uses GPT model to score or select relevant posts  
  - Inputs: Aggregated blog URLs from "Get all Posts for AI"  
  - Outputs: Relevant blog URLs to "Releated Blog"  
  - Edge Cases: API failures, irrelevant results

- **Releated Blog**  
  - Type: Code  
  - Role: Processes AI output to extract relevant blog links  
  - Configuration: JavaScript code to parse AI response  
  - Inputs: AI output from "OpenAI"  
  - Outputs: Blog links to "Formatted Blog Links"  
  - Edge Cases: Parsing errors

- **Formatted Blog Links**  
  - Type: Code  
  - Role: Formats blog links for embedding in YouTube description  
  - Configuration: Creates clickable links or markdown  
  - Inputs: Relevant blog URLs  
  - Outputs: Formatted links to "Get Videos" (for related videos)  
  - Edge Cases: Empty or malformed URLs

- **Youtube Metadata Generator1**  
  - Type: Langchain Agent  
  - Role: Combines all metadata elements and recommended links into final structured output  
  - Configuration: Uses AI agent with structured output parser and language models (Google Gemini and OpenAI)  
  - Inputs: Formatted tags, hashtags, blog links, affiliate links (from Airtable)  
  - Outputs: Final metadata object to "Get Related Link"  
  - Edge Cases: AI model errors, output parsing failures

- **Structured Output Parser**  
  - Type: Langchain Output Parser  
  - Role: Parses AI agent output into structured JSON for downstream use  
  - Configuration: Defines expected output schema  
  - Inputs: AI agent output  
  - Outputs: Parsed metadata to "Youtube Metadata Generator1" (feedback loop)  
  - Edge Cases: Parsing errors, schema mismatches

- **Google Gemini Chat Model2**  
  - Type: Langchain Language Model (Google Gemini)  
  - Role: Alternative AI model for metadata generation or enrichment  
  - Configuration: Configured with Gemini chat model credentials  
  - Inputs: Part of AI agent chain  
  - Outputs: AI-generated content to "Youtube Metadata Generator1"  
  - Edge Cases: API limits, auth errors

- **important_links**  
  - Type: Airtable Tool  
  - Role: Fetches affiliate links and product recommendations from Airtable database  
  - Configuration: Airtable API credentials, table with fields: Name, Type, Platform, URL, Keywords  
  - Inputs: Triggered by AI agent to enrich metadata  
  - Outputs: Affiliate links to "Youtube Metadata Generator1"  
  - Edge Cases: Airtable API errors, missing data, credential issues

---

#### 2.4 Related Videos & Affiliate Links Retrieval

**Overview:**  
This block identifies related YouTube videos using AI and prepares video lists for metadata enrichment.

**Nodes Involved:**  
- Get Videos  
- Get Youtube Video Details  
- Vidoe List  
- Aggregate  
- OpenAI1  
- Related Videos  
- Video Links  

**Node Details:**

- **Get Videos**  
  - Type: YouTube node  
  - Role: Fetches a list of videos (e.g., from channel or search) for related video analysis  
  - Configuration: Uses YouTube Data API with OAuth2  
  - Inputs: Triggered by "Formatted Blog Links"  
  - Outputs: Video list to "Get Youtube Video Details"  
  - Edge Cases: API quota, empty results

- **Get Youtube Video Details**  
  - Type: Code  
  - Role: Extracts relevant details from fetched videos for AI processing  
  - Configuration: JavaScript code to parse video metadata  
  - Inputs: Video list  
  - Outputs: Structured video details to "Vidoe List"  
  - Edge Cases: Parsing errors, missing fields

- **Vidoe List**  
  - Type: Set  
  - Role: Prepares video details for aggregation  
  - Configuration: Sets variables or formats data  
  - Inputs: Video details  
  - Outputs: Data to "Aggregate"  
  - Edge Cases: Empty data

- **Aggregate**  
  - Type: Aggregate  
  - Role: Aggregates video details for AI input  
  - Configuration: Aggregates data array  
  - Inputs: Video list  
  - Outputs: Aggregated data to "OpenAI1"  
  - Edge Cases: Large data sets

- **OpenAI1**  
  - Type: OpenAI (Langchain)  
  - Role: Uses GPT-4o to analyze videos and recommend related video IDs  
  - Configuration: Custom prompt for relatedness scoring  
  - Inputs: Aggregated video data  
  - Outputs: Related video IDs to "Related Videos"  
  - Edge Cases: API limits, irrelevant recommendations

- **Related Videos**  
  - Type: Code  
  - Role: Parses AI output to extract related video IDs  
  - Configuration: JavaScript code  
  - Inputs: AI response  
  - Outputs: Related video list to "Video Links"  
  - Edge Cases: Parsing errors

- **Video Links**  
  - Type: Code  
  - Role: Formats related video links for embedding or further processing  
  - Configuration: Creates clickable links or formatted text  
  - Inputs: Related video IDs  
  - Outputs: Data to "Youtube Metadata Generator1"  
  - Edge Cases: Empty or invalid video IDs

---

#### 2.5 Metadata Update & Completion

**Overview:**  
This block updates the YouTube video metadata with the generated content and confirms completion to the user via the form.

**Nodes Involved:**  
- Get Related Link  
- Update Youtube Meta Data  
- Form  

**Node Details:**

- **Get Related Link**  
  - Type: Code  
  - Role: Prepares the final metadata payload including title, description, tags, hashtags, and related links for YouTube API update  
  - Configuration: JavaScript code to assemble data  
  - Inputs: AI-generated metadata from "Youtube Metadata Generator1"  
  - Outputs: Payload to "Update Youtube Meta Data"  
  - Edge Cases: Data formatting errors

- **Update Youtube Meta Data**  
  - Type: YouTube node  
  - Role: Updates the YouTube video metadata via YouTube Data API  
  - Configuration: OAuth2 credentials with appropriate scopes (video update)  
  - Inputs: Metadata payload  
  - Outputs: Confirmation to "Form" node  
  - Edge Cases: API quota, permission errors, invalid data

- **Form**  
  - Type: Form  
  - Role: Displays completion confirmation and attribution to user (Amjid Ali)  
  - Configuration: Shows success message and optionally metadata summary  
  - Inputs: Confirmation from "Update Youtube Meta Data"  
  - Outputs: None (end of workflow)  
  - Edge Cases: UI rendering issues

---

### 3. Summary Table

| Node Name                        | Node Type                           | Functional Role                                | Input Node(s)                      | Output Node(s)                     | Sticky Note                                                                                      |
|---------------------------------|-----------------------------------|-----------------------------------------------|----------------------------------|----------------------------------|------------------------------------------------------------------------------------------------|
| On form submission              | Form Trigger                      | Entry point; receives video link and keywords | None                             | EGet Video ID                    | ⚡ Form: “Enter Video Link + Optional Keywords”                                                |
| EGet Video ID                  | Set                               | Extracts video ID from URL                      | On form submission               | Get Details of Video from Youtube |                                                                                                |
| Get Details of Video from Youtube | YouTube                          | Fetches video details                           | EGet Video ID                   | Get Youtube Transcript           |                                                                                                |
| Get Youtube Transcript          | HTTP Request                     | Retrieves video transcript                      | Get Details of Video from Youtube | Generate Title Description Tags and Hashtags |                                                                                                |
| Generate Title Description Tags and Hashtags | OpenAI (Langchain)              | AI generates metadata                           | Get Youtube Transcript           | Extract Relevant Data            | 🧠 AI Logic: “Generate Metadata”                                                               |
| Extract Relevant Data           | Code                             | Parses AI output for metadata fields            | Generate Title Description Tags and Hashtags | Formatted Tags, Formatted Hashtags |                                                                                                |
| Formatted Tags                 | Code                             | Formats tags for YouTube API                     | Extract Relevant Data            | Formatted Hashtags              |                                                                                                |
| Formatted Hashtags             | Code                             | Formats hashtags                                 | Formatted Tags                  | Get Post SiteMap                |                                                                                                |
| Get Post SiteMap               | HTTP Request                     | Fetches blog sitemap XML                         | Formatted Hashtags              | Conver to JSON                 | 🔍 Sitemap Extraction: “Get blog URLs for related links”                                      |
| Conver to JSON                | XML                              | Converts sitemap XML to JSON                      | Get Post SiteMap               | Extract URLs                   |                                                                                                |
| Extract URLs                  | Split Out                        | Extracts URLs from JSON                           | Conver to JSON                | URL Lists                     |                                                                                                |
| URL Lists                    | Aggregate                        | Aggregates URLs for AI processing                 | Extract URLs                  | Get all Posts for AI           |                                                                                                |
| Get all Posts for AI          | Set                              | Prepares blog URLs for AI input                   | URL Lists                    | OpenAI                       |                                                                                                |
| OpenAI                       | OpenAI (Langchain)               | AI selects relevant blog posts                    | Get all Posts for AI           | Releated Blog                 |                                                                                                |
| Releated Blog                | Code                             | Parses relevant blog links from AI output         | OpenAI                       | Formatted Blog Links          |                                                                                                |
| Formatted Blog Links          | Code                             | Formats blog links for embedding                   | Releated Blog                | Get Videos                   |                                                                                                |
| Get Videos                   | YouTube                          | Fetches videos for related video analysis          | Formatted Blog Links          | Get Youtube Video Details     |                                                                                                |
| Get Youtube Video Details      | Code                             | Extracts video details                             | Get Videos                   | Vidoe List                   |                                                                                                |
| Vidoe List                   | Set                              | Prepares video details for aggregation             | Get Youtube Video Details      | Aggregate                   |                                                                                                |
| Aggregate                   | Aggregate                        | Aggregates video details for AI input               | Vidoe List                   | OpenAI1                     |                                                                                                |
| OpenAI1                      | OpenAI (Langchain)               | AI generates related video IDs                      | Aggregate                   | Related Videos              |                                                                                                |
| Related Videos               | Code                             | Parses related video IDs from AI output              | OpenAI1                     | Video Links                |                                                                                                |
| Video Links                 | Code                             | Formats related video links                          | Related Videos              | Youtube Metadata Generator1 |                                                                                                |
| Youtube Metadata Generator1   | Langchain Agent                  | Combines metadata and recommended links             | Video Links, important_links   | Get Related Link             | 🧠 AI Logic: “Generate Metadata”                                                               |
| Structured Output Parser      | Langchain Output Parser          | Parses AI agent output into structured JSON          | Youtube Metadata Generator1   | Youtube Metadata Generator1 |                                                                                                |
| Google Gemini Chat Model2     | Langchain Language Model         | Alternative AI model for metadata generation          | Youtube Metadata Generator1   | Youtube Metadata Generator1 |                                                                                                |
| important_links              | Airtable Tool                   | Fetches affiliate/product links from Airtable          | Youtube Metadata Generator1   | Youtube Metadata Generator1 |                                                                                                |
| Get Related Link             | Code                             | Prepares final metadata payload for YouTube API       | Youtube Metadata Generator1   | Update Youtube Meta Data    |                                                                                                |
| Update Youtube Meta Data      | YouTube                          | Updates YouTube video metadata                        | Get Related Link             | Form                       | ✅ Update Metadata: “Publish updated title/description/tags”                                  |
| Form                        | Form                             | Displays completion confirmation                      | Update Youtube Meta Data      | None                       | 🧾 Completion Confirmation + Attribution to [Amjid Ali](https://amjidali.com)                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node ("On form submission")**  
   - Type: Form Trigger  
   - Configure webhook to accept inputs:  
     - "Youtube Video Link" (required)  
     - "Focus Keywords (Optional)" (optional)  
   - This node triggers the workflow on form submission.

2. **Add a Set Node ("EGet Video ID")**  
   - Extract the YouTube video ID from the submitted URL using an expression or JavaScript.  
   - Example: Use regex or URL parsing to extract the video ID parameter or path segment.  
   - Connect output of "On form submission" to this node.

3. **Add a YouTube Node ("Get Details of Video from Youtube")**  
   - Configure with YouTube Data API OAuth2 credentials.  
   - Use the extracted video ID to fetch video details (e.g., title, description, stats).  
   - Connect output of "EGet Video ID" to this node.

4. **Add an HTTP Request Node ("Get Youtube Transcript")**  
   - Configure to fetch the transcript for the video ID (via YouTube captions API or third-party service).  
   - Use GET method, pass video ID as parameter.  
   - Connect output of "Get Details of Video from Youtube" to this node.

5. **Add an OpenAI Node ("Generate Title Description Tags and Hashtags")**  
   - Configure with OpenAI GPT-4o credentials.  
   - Use the transcript and optional keywords as prompt input.  
   - Prompt should instruct AI to generate:  
     - SEO-friendly title (<70 chars)  
     - Benefit-focused description with timestamps  
     - Tags (450+ chars)  
     - 5-10 optimized hashtags  
   - Connect output of "Get Youtube Transcript" to this node.

6. **Add a Code Node ("Extract Relevant Data")**  
   - Write JavaScript code to parse AI output JSON or text and extract title, description, tags, hashtags.  
   - Connect output of "Generate Title Description Tags and Hashtags" to this node.

7. **Add Code Nodes ("Formatted Tags" and "Formatted Hashtags")**  
   - Format tags and hashtags into strings suitable for YouTube API.  
   - Connect "Extract Relevant Data" outputs accordingly.

8. **Add HTTP Request Node ("Get Post SiteMap")**  
   - Configure to GET your blog sitemap XML URL.  
   - Connect output of "Formatted Hashtags" to this node.

9. **Add XML Node ("Conver to JSON")**  
   - Convert sitemap XML to JSON format.  
   - Connect output of "Get Post SiteMap" to this node.

10. **Add Split Out Node ("Extract URLs")**  
    - Split JSON sitemap URLs into individual entries.  
    - Connect output of "Conver to JSON" to this node.

11. **Add Aggregate Node ("URL Lists")**  
    - Aggregate URLs into a list for AI processing.  
    - Connect output of "Extract URLs" to this node.

12. **Add Set Node ("Get all Posts for AI")**  
    - Prepare aggregated URLs for AI input.  
    - Connect output of "URL Lists" to this node.

13. **Add OpenAI Node ("OpenAI")**  
    - Use GPT model to analyze blog URLs and select relevant posts based on video content.  
    - Connect output of "Get all Posts for AI" to this node.

14. **Add Code Node ("Releated Blog")**  
    - Parse AI output to extract relevant blog URLs.  
    - Connect output of "OpenAI" to this node.

15. **Add Code Node ("Formatted Blog Links")**  
    - Format blog URLs into clickable links for embedding in description.  
    - Connect output of "Releated Blog" to this node.

16. **Add YouTube Node ("Get Videos")**  
    - Fetch videos from your channel or search for related videos.  
    - Connect output of "Formatted Blog Links" to this node.

17. **Add Code Node ("Get Youtube Video Details")**  
    - Extract video details for AI analysis.  
    - Connect output of "Get Videos" to this node.

18. **Add Set Node ("Vidoe List")**  
    - Prepare video details for aggregation.  
    - Connect output of "Get Youtube Video Details" to this node.

19. **Add Aggregate Node ("Aggregate")**  
    - Aggregate video details for AI input.  
    - Connect output of "Vidoe List" to this node.

20. **Add OpenAI Node ("OpenAI1")**  
    - Use GPT-4o to find related video IDs.  
    - Connect output of "Aggregate" to this node.

21. **Add Code Node ("Related Videos")**  
    - Parse AI output for related video IDs.  
    - Connect output of "OpenAI1" to this node.

22. **Add Code Node ("Video Links")**  
    - Format related video links.  
    - Connect output of "Related Videos" to this node.

23. **Add Airtable Node ("important_links")**  
    - Configure Airtable credentials and table for affiliate/product links.  
    - Connect output of "Video Links" to this node.

24. **Add Langchain Agent Node ("Youtube Metadata Generator1")**  
    - Use AI agent with Google Gemini and OpenAI models to combine all metadata elements and recommended links.  
    - Connect outputs of "Video Links" and "important_links" to this node.

25. **Add Langchain Output Parser Node ("Structured Output Parser")**  
    - Parse AI agent output into structured JSON.  
    - Connect output of "Youtube Metadata Generator1" to this node.

26. **Add Code Node ("Get Related Link")**  
    - Prepare final metadata payload for YouTube API update.  
    - Connect output of "Youtube Metadata Generator1" to this node.

27. **Add YouTube Node ("Update Youtube Meta Data")**  
    - Configure with OAuth2 credentials with video update scope.  
    - Update video metadata with title, description, tags, hashtags, and related links.  
    - Connect output of "Get Related Link" to this node.

28. **Add Form Node ("Form")**  
    - Display completion confirmation and attribution to Amjid Ali.  
    - Connect output of "Update Youtube Meta Data" to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Form input expects: YouTube Video Link + Optional Focus Keywords                                               | ⚡ Form: “Enter Video Link + Optional Keywords”                                                                 |
| Sitemap extraction fetches blog URLs for related internal linking                                             | 🔍 Sitemap Extraction: “Get blog URLs for related links”                                                        |
| AI logic nodes generate metadata using GPT-4o and Google Gemini with custom prompts                            | 🧠 AI Logic: “Generate Metadata”                                                                                 |
| Final node updates YouTube video metadata via YouTube Data API                                                | ✅ Update Metadata: “Publish updated title/description/tags”                                                    |
| Completion confirmation includes attribution to Amjid Ali                                                     | 🧾 Completion Confirmation + Attribution to [Amjid Ali](https://amjidali.com)                                    |
| Useful learning resources for n8n automation and AI integration                                              | - [Learn n8n Automation](https://www.udemy.com/course/mastering-n8n-ai-agents-api-automation-webhooks-no-code/?referralCode=0309FD70BE2D72630C09)  
- [n8n Learning Guidebook](https://lms.syncbricks.com/books/n8n)  
- [n8n Cloud Signup](https://n8n.syncbricks.com)  
- [SyncBricks Tools & Blog](https://syncbricks.com)  
- [Affiliate Product Hub](https://n8n.syncbricks.com) |
| Workflow supports replacing AI models (Gemini, OpenAI, Claude, DeepSeek) and customizing Airtable structure   | Customization instructions in description section                                                              |
| Designed for use with n8n Cloud or self-hosted n8n instances with OAuth2 API credentials                        | Supports Docker, MCP, GitHub integration, and advanced AI agent workflows                                       |

---

This document provides a detailed, structured reference for understanding, reproducing, and modifying the AI-Powered YouTube Meta Generator workflow in n8n. It covers all nodes, their roles, configurations, and interconnections, enabling advanced users and AI agents to work effectively with this automation.