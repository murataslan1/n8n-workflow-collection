Auto-Publish Web Articles as Social Posts for X, LinkedIn, Reddit & Threads with Gemini AI

https://n8nworkflows.xyz/workflows/auto-publish-web-articles-as-social-posts-for-x--linkedin--reddit---threads-with-gemini-ai-5128


# Auto-Publish Web Articles as Social Posts for X, LinkedIn, Reddit & Threads with Gemini AI

### 1. Workflow Overview

This workflow automates the process of converting any web article into tailored social media posts for multiple platforms: X (formerly Twitter), LinkedIn, Reddit, and Threads. Leveraging Google Gemini AI and n8n's social media agent capabilities, it creates platform-specific content from a provided article URL, presents it for user approval, and upon approval, publishes the posts automatically using Upload Post and Reddit API integrations.

**Logical Blocks:**

- **1.1 Input Initialization:** Manual trigger and data setting for workflow parameters and credentials.  
- **1.2 AI Content Creation:** Uses a Langchain agent powered by Google Gemini AI to analyze the article URL and generate platform-specific social posts with structured output parsing.  
- **1.3 User Validation:** Presents generated posts for human review and approval with a wait node and a conditional check.  
- **1.4 Automated Publishing:** Upon approval, publishes the posts to X, Threads, LinkedIn via Upload Post API, and Reddit via Reddit API.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Initialization

- **Overview:**  
  This block initializes the workflow with manual triggering and sets key input data such as the article URL, user credentials for post uploading, and API keys needed for screenshot generation.

- **Nodes Involved:**  
  - Manual Trigger  
  - Set Input Data

- **Node Details:**

  - **Manual Trigger**  
    - Type: `manualTrigger`  
    - Role: Entry point allowing manual start of the workflow.  
    - Configuration: No parameters; simply triggers the workflow manually.  
    - Connections: Outputs to Set Input Data node.  
    - Edge Cases: None significant; user must manually trigger.

  - **Set Input Data**  
    - Type: `set`  
    - Role: Sets static input variables needed downstream.  
    - Configuration:  
      - `workflow_url`: URL of the article to process.  
      - `upload-post_user`: Username for Upload Post API.  
      - `ScreenshotOne_API_KEY`: API key for screenshot generation service.  
    - Key Expressions: Static string assignment.  
    - Input: From Manual Trigger.  
    - Output: To Social Media Agent node.  
    - Edge Cases: Incorrect or missing keys/URL would cause downstream failures.

---

#### 2.2 AI Content Creation

- **Overview:**  
  This block analyzes the provided article URL using Google Gemini AI via a Langchain agent. It generates engaging, platform-specific social media posts following a detailed persona and style guide, then parses the structured AI output for further steps.

- **Nodes Involved:**  
  - Social Media Agent (Langchain Agent)  
  - Google Gemini Chat Model (AI Language Model)  
  - Structured Output Parser  
  - HTTP Request1 (used internally by Social Media Agent for URL extraction)

- **Node Details:**

  - **Social Media Agent**  
    - Type: `@n8n/n8n-nodes-langchain.agent`  
    - Role: Core AI node that uses a persona prompt to create posts for LinkedIn, X, Threads, and Reddit based on the article.  
    - Configuration:  
      - Prompt includes a detailed persona of a social media content creator, instructions for content style per platform, and a multi-step content creation approach.  
      - Uses dynamic input `workflow_url` to retrieve and analyze the article.  
    - Key Expressions: Uses expressions to inject `workflow_url` from Set Input Data.  
    - Inputs: From Set Input Data.  
    - Outputs: Structured JSON array containing posts for all platforms.  
    - Version: Requires Langchain support and Google Gemini integration.  
    - Edge Cases: API quota limits, malformed prompts, or unreachable URLs may cause failures.

  - **Google Gemini Chat Model**  
    - Type: `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`  
    - Role: Provides the underlying AI model (Google Gemini 2.5 pro preview) for the Langchain agent.  
    - Configuration: Uses Google Palm API credential for authentication.  
    - Inputs: Connected internally from Social Media Agent node.  
    - Outputs: AI-generated text to Social Media Agent.  
    - Edge Cases: Authentication errors, API downtime, or quota exceeded.

  - **Structured Output Parser**  
    - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
    - Role: Parses AI output into structured JSON format as defined by a JSON schema example.  
    - Configuration: Schema defines expected output structure for each platform including content, userId, imageUrl, and Reddit post title.  
    - Inputs: AI-generated unstructured text from Social Media Agent.  
    - Outputs: Parsed structured JSON to Social Media Agent node.  
    - Edge Cases: Parsing failures if AI output deviates from schema.

  - **HTTP Request1**  
    - Type: `httpRequestTool`  
    - Role: Used internally by the AI agent prompt to fetch and analyze the article URL content for image extraction and text analysis.  
    - Configuration: URL dynamically set by AI prompt.  
    - Inputs: From Social Media Agent.  
    - Outputs: Data used by AI prompt.  
    - Edge Cases: Network failures, timeouts, invalid URLs.

---

#### 2.3 User Validation

- **Overview:**  
  After AI generates the posts, this block waits for user review and approval before publishing. It presents the posts in a form with dropdown options to approve or reject.

- **Nodes Involved:**  
  - Wait to approve by user  
  - If approved publish (conditional)

- **Node Details:**

  - **Wait to approve by user**  
    - Type: `wait` (form-based resume)  
    - Role: Pauses workflow awaiting user input to approve or reject the generated posts.  
    - Configuration:  
      - Webhook ID for external form submission.  
      - Form fields: dropdown with options "approve" or "reject".  
      - Form description contains the generated posts preview for LinkedIn, X, Threads, and Reddit with clear formatting for review.  
    - Inputs: From Social Media Agent.  
    - Outputs: User decision to If approved publish node.  
    - Edge Cases: User does not respond, timeout not set (workflow waits indefinitely).  
    - Version: 1.1 (supports form-based wait).

  - **If approved publish**  
    - Type: `if` (conditional)  
    - Role: Checks user decision to determine if publishing proceeds.  
    - Configuration: Condition checks if decision equals "approve".  
    - Inputs: From Wait to approve by user.  
    - Outputs: On true, triggers publishing nodes; on false, workflow ends.  
    - Edge Cases: Case sensitivity in decision, no decision input.

---

#### 2.4 Automated Publishing

- **Overview:**  
  This block handles publishing the approved posts to the respective social media platforms using Upload Post API for LinkedIn, Threads, X and Reddit API for Reddit.

- **Nodes Involved:**  
  - Upload Post X  
  - Upload Post Threads  
  - Upload Post Linkedin  
  - Upload Post Reddit

- **Node Details:**

  - **Upload Post X**  
    - Type: `uploadPost` (custom n8n node for Upload Post API)  
    - Role: Publishes the post content to X platform.  
    - Configuration:  
      - Uses user from Set Input Data.  
      - Title set dynamically from AI-generated content for X.  
      - Photo is a screenshot of the article URL generated via ScreenshotOne API, with parameters for ads blocking, delay, quality.  
      - Platform explicitly set to ["x"].  
    - Credentials: Upload Post API credential required.  
    - Inputs: From If approved publish (true branch).  
    - Outputs: None specified.  
    - Edge Cases: API authentication failure, screenshot generation failure, rate limits.

  - **Upload Post Threads**  
    - Type: `uploadPost`  
    - Role: Publishes to Threads platform.  
    - Configuration similar to Upload Post X but platform set to ["threads"] and title taken from Threads content.  
    - Credentials: Same Upload Post API credential.  
    - Edge Cases: Same as above.

  - **Upload Post Linkedin**  
    - Type: `uploadPost`  
    - Role: Publishes to LinkedIn platform.  
    - Configuration similar, platform set to ["linkedin"], title from LinkedIn content.  
    - Credentials: Same Upload Post API credential.  
    - Edge Cases: LinkedIn API limits, content size restrictions.

  - **Upload Post Reddit**  
    - Type: `reddit`  
    - Role: Posts content to Reddit subreddit "n8n".  
    - Configuration:  
      - Title and text dynamically from AI output.  
      - Subreddit fixed to "n8n".  
    - Credentials: Reddit OAuth2 required.  
    - Inputs: From If approved publish (true branch).  
    - Edge Cases: Reddit API rate limits, subreddit posting restrictions, OAuth token expiry.

---

### 3. Summary Table

| Node Name             | Node Type                               | Functional Role                         | Input Node(s)           | Output Node(s)                                              | Sticky Note                                                                                             |
|-----------------------|---------------------------------------|---------------------------------------|------------------------|-------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Manual Trigger        | manualTrigger                         | Workflow entry point                   | -                      | Set Input Data                                               |                                                                                                       |
| Set Input Data        | set                                   | Sets static workflow parameters       | Manual Trigger          | Social Media Agent                                          |                                                                                                       |
| Social Media Agent    | @n8n/n8n-nodes-langchain.agent        | Generates social media posts via AI   | Set Input Data          | Wait to approve by user                                     |                                                                                                       |
| Google Gemini Chat Model | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | Provides AI language model             | Social Media Agent (internal) | Social Media Agent (internal)                               |                                                                                                       |
| Structured Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Parses AI output into structured JSON | Social Media Agent      | Social Media Agent (internal)                               |                                                                                                       |
| HTTP Request1         | httpRequestTool                       | Fetches article content for AI analysis| Social Media Agent      | Social Media Agent (internal)                               |                                                                                                       |
| Wait to approve by user | wait                                 | Pauses workflow for user approval     | Social Media Agent      | If approved publish                                        | The form includes the generated posts preview for all platforms for review before publishing.          |
| If approved publish   | if                                   | Conditional to proceed with publishing| Wait to approve by user | Upload Post X, Upload Post Threads, Upload Post Linkedin, Upload Post Reddit |                                                                                                       |
| Upload Post X         | uploadPost                           | Publishes to X platform                | If approved publish     | -                                                           |                                                                                                       |
| Upload Post Threads   | uploadPost                           | Publishes to Threads platform          | If approved publish     | -                                                           |                                                                                                       |
| Upload Post Linkedin  | uploadPost                           | Publishes to LinkedIn platform         | If approved publish     | -                                                           |                                                                                                       |
| Upload Post Reddit    | reddit                               | Publishes to Reddit subreddit "n8n"   | If approved publish     | -                                                           |                                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node:**  
   - No parameters. This is the entry point to start the workflow manually.

2. **Add a Set node (Set Input Data):**  
   - Create static string fields:  
     - `workflow_url`: the URL of the web article to process (e.g., `"https://n8n.io/workflows/5110-create-and-upload-ai-generated-asmr-youtube-shorts-with-seedance-fal-ai-and-gpt-4/"`)  
     - `upload-post_user`: username string for Upload Post API  
     - `ScreenshotOne_API_KEY`: API key string for ScreenshotOne service  
   - Connect the Manual Trigger node output to this node input.

3. **Add a Langchain Agent node (Social Media Agent):**  
   - Paste the provided detailed prompt with persona, style, and platform-specific content instructions.  
   - Use expressions to insert `workflow_url` from the Set Input Data node.  
   - Connect Set Input Data node output to this node input.

4. **Configure AI Language Model node (Google Gemini Chat Model):**  
   - Set model to `"models/gemini-2.5-pro-preview-06-05"`.  
   - Configure with Google Palm API credentials.  
   - Connect this node as AI languageModel of the Social Media Agent node.

5. **Add Structured Output Parser node:**  
   - Define JSON schema example for expected AI output (array of posts per platform).  
   - Connect as AI outputParser of the Social Media Agent node.

6. **Add HTTP Request node (HTTP Request1):**  
   - No fixed URL; it will be dynamically set by the AI agent during execution for content extraction.  
   - Connect as ai_tool of Social Media Agent node.

7. **Add Wait node (Wait to approve by user):**  
   - Configure form with dropdown field labeled "decision" with options "approve" and "reject".  
   - Add form description that dynamically inserts the AI-generated posts preview for LinkedIn, X, Threads, and Reddit using expressions referencing Social Media Agent outputs.  
   - Set webhook ID for external form submissions.  
   - Connect Social Media Agent output to this node.

8. **Add If node (If approved publish):**  
   - Set condition: check if `decision` equals `"approve"` (case sensitive, strict).  
   - Connect Wait node output to If node input.

9. **Add Upload Post nodes for each platform:**  
   - For X, Threads, and LinkedIn:  
     - Use Upload Post node type.  
     - Configure user field with expression from Set Input Data (`upload-post_user`).  
     - Set title field dynamically from the corresponding AI-generated content array element.  
     - For photos field, use expression building a ScreenshotOne API URL with parameters:  
       - `access_key` from `ScreenshotOne_API_KEY` in Set Input Data  
       - `url` from `workflow_url`  
       - Additional parameters: `format=jpg`, `block_ads=false`, `block_cookie_banners=false`, `block_banners_by_heuristics=false`, `block_trackers=true`, `delay=20`, `timeout=60`, `response_type=by_format`, `image_quality=80`  
     - Set platform accordingly: `"x"`, `"threads"`, or `"linkedin"`.  
     - Use the Upload Post API credentials configured.  
     - Connect the If node "true" output to each of these nodes.

10. **Add Reddit node (Upload Post Reddit):**  
    - Set subreddit to `"n8n"`.  
    - Set title and text fields dynamically from AI output Reddit post fields.  
    - Use Reddit OAuth2 credentials.  
    - Connect the If node "true" output to this node.

11. **Finalize connections:**  
    - The If node "false" output leads to no further action (workflow ends).  
    - Ensure all nodes are properly connected as per the original workflow diagram.

12. **Credential Setup:**  
    - Upload Post API: Configure user credentials with Upload Post API account.  
    - Google Palm API: Configure credential for Google Gemini.  
    - Reddit OAuth2 API: Configure Reddit credentials for posting.  
    - ScreenshotOne API key stored as string in Set Input Data.

13. **Activation and Testing:**  
    - Test the workflow by manual triggering.  
    - Verify AI generates valid posts for each platform.  
    - Approve posts in the form to trigger publishing.  
    - Confirm posts appear correctly on each social platform.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                   |
|----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow uses a sophisticated prompt engineering technique to generate social posts tailored for each platform, simulating a persona of an engaged social media content creator and n8n evangelist. | Prompt text embedded in Social Media Agent node.                                                |
| ScreenshotOne API is used to generate snapshots of the article URL, which are attached as images to the posts for richer content. | ScreenshotOne API documentation: https://screenshotone.com/docs/api/                            |
| Upload Post API enables unified posting to multiple social networks with a single API, simplifying cross-platform publication. | Upload Post official site: https://upload-post.com                                               |
| Reddit posting requires OAuth2 credentials with appropriate scopes for subreddit posting.           | Reddit API docs: https://www.reddit.com/dev/api/                                                |
| The Wait node uses webhook-based forms for manual approval, ensuring human oversight before publishing. | n8n Wait node documentation: https://docs.n8n.io/nodes/n8n-nodes-base.wait/                      |
| Google Gemini AI (PaLM) integration requires Google Cloud account with Palm API access and proper credential setup in n8n. | Google PaLM API: https://developers.generativeai.google/                                        |
| The workflow supports multi-platform social media automation, a common use case for content creators and marketers. |                                                                                                 |

---

**Disclaimer:** The content provided comes exclusively from an automated workflow created with n8n, a no-code integration and automation tool. It respects all current content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.