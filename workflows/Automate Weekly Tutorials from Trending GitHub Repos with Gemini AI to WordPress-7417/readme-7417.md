Automate Weekly Tutorials from Trending GitHub Repos with Gemini AI to WordPress

https://n8nworkflows.xyz/workflows/automate-weekly-tutorials-from-trending-github-repos-with-gemini-ai-to-wordpress-7417


# Automate Weekly Tutorials from Trending GitHub Repos with Gemini AI to WordPress

### 1. Workflow Overview

This workflow automates the generation of weekly programming tutorials by scanning trending GitHub repositories every Monday at 10 AM. It leverages AI (Google Gemini chat model via LangChain) to create detailed, beginner-friendly tutorials based on hot projects, publishes these tutorials as draft WordPress posts, and sends notification emails to an administrator.

The workflow is organized into the following logical blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow automatically every Monday at 10 AM.
- **1.2 GitHub Trending Repositories Retrieval:** Fetches trending repositories from GitHub using their search API.
- **1.3 Repository Items Processing:** Splits the fetched list into individual repositories for AI processing.
- **1.4 AI Tutorial Generation:** Uses the Google Gemini AI model (via LangChain) to generate tutorial content based on repository details.
- **1.5 AI Output Parsing:** Parses the AI-generated tutorial output, handling markdown or JSON formats, and prepares structured content.
- **1.6 WordPress Post Creation:** Creates a draft tutorial post on WordPress using the parsed content.
- **1.7 Admin Notification:** Sends an email notification to the admin about the new tutorial draft.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:**  
  Triggers the workflow automatically every Monday at 10 AM to ensure weekly updates.

- **Nodes Involved:**  
  - Weekly Monday 10AM

- **Node Details:**

  - **Node Name:** Weekly Monday 10AM  
    - **Type:** Schedule Trigger  
    - **Role:** Initiates workflow on a fixed schedule.  
    - **Configuration:**  
      - Cron expression: `0 10 * * 1` (10:00 AM every Monday)  
    - **Input/Output:** No input; outputs trigger event to "Get Trending Repos" node.  
    - **Edge Cases:**  
      - Workflow won't trigger if n8n instance is down at scheduled time.  
      - Timezone assumptions depend on n8n server config.  
    - **Version-specific:** Uses typeVersion 1.2 for schedule trigger.

---

#### 2.2 GitHub Trending Repositories Retrieval

- **Overview:**  
  Queries GitHub's Search API to retrieve trending repositories for tutorial generation.

- **Nodes Involved:**  
  - Get Trending Repos

- **Node Details:**

  - **Node Name:** Get Trending Repos  
    - **Type:** HTTP Request  
    - **Role:** Fetches trending GitHub repositories via API.  
    - **Configuration:**  
      - URL: `https://api.github.com/search/repositories`  
      - No explicit query parameters shown (may rely on defaults or external config).  
      - Optional: GitHub token can be added for higher rate limits (as per sticky note).  
    - **Input/Output:** Input from schedule trigger; output JSON containing repository search results passed to "Split Repository Items".  
    - **Edge Cases:**  
      - API rate limiting (low limits without token may cause failures).  
      - Network errors or API downtime.  
      - Empty or malformed responses causing downstream errors.  
    - **Version-specific:** typeVersion 4.1.

---

#### 2.3 Repository Items Processing

- **Overview:**  
  Splits the array of repositories into individual items for separate tutorial generation.

- **Nodes Involved:**  
  - Split Repository Items

- **Node Details:**

  - **Node Name:** Split Repository Items  
    - **Type:** Split Out  
    - **Role:** Breaks down bulk repository data into single items for iterative processing.  
    - **Configuration:** Default options to split input array into individual items.  
    - **Input/Output:** Input from "Get Trending Repos"; outputs single repository objects to "AI Tutorial Generator".  
    - **Edge Cases:**  
      - Empty repository list results in no further processing.  
      - Unexpected data structures may cause failures.  
    - **Version-specific:** typeVersion 1.

---

#### 2.4 AI Tutorial Generation

- **Overview:**  
  Uses Google Gemini AI via LangChain to create a detailed tutorial in markdown format for each repository.

- **Nodes Involved:**  
  - AI Tutorial Generator  
  - Google Gemini Chat Model (underlying AI credential node)

- **Node Details:**

  - **Node Name:** AI Tutorial Generator  
    - **Type:** LangChain Agent (ai_languageModel)  
    - **Role:** Sends repository data with a system prompt to AI for tutorial creation.  
    - **Configuration:**  
      - System message instructs AI to generate beginner-friendly tutorials including: introduction, prerequisites, step-by-step guide with code samples, best practices, pitfalls, and next steps.  
      - Output formatting requested in markdown with code blocks.  
    - **Input/Output:** Receives single repo data from "Split Repository Items"; outputs AI’s tutorial text to "Parse the AI tutorial output".  
    - **Expressions/Variables:** Uses repository information fields (e.g., name, language) implicitly.  
    - **Edge Cases:**  
      - AI response may not be JSON formatted or may contain unexpected content.  
      - API rate limits, timeouts, or errors.  
    - **Version-specific:** typeVersion 2.2.

  - **Node Name:** Google Gemini Chat Model  
    - **Type:** LangChain Google Gemini LM Chat  
    - **Role:** Provides AI language model backend for tutorial generation.  
    - **Configuration:**  
      - Uses Google Palm API credentials (OAuth or API key).  
    - **Input/Output:** Connected internally to "AI Tutorial Generator" as AI model.  
    - **Edge Cases:**  
      - Credential expiration or invalid credentials cause failures.  
      - API quota exceeded.  
    - **Version-specific:** typeVersion 1.

---

#### 2.5 AI Output Parsing

- **Overview:**  
  Parses AI-generated tutorial output, handling potential JSON or raw markdown formats, preparing structured fields for WordPress.

- **Nodes Involved:**  
  - Parse the AI tutorial output

- **Node Details:**

  - **Node Name:** Parse the AI tutorial output  
    - **Type:** Code (JavaScript)  
    - **Role:** Cleans AI output by removing markdown code fences, attempts to parse JSON; falls back to markdown content if parsing fails.  
    - **Configuration:**  
      - Custom JS code processes each item:  
        - Removes ```json or ``` code block syntax  
        - Tries JSON.parse on trimmed text  
        - On failure, treats output as plain markdown content with default title generation  
        - Constructs an object with title, content, repo metadata (name, language, description, URL, stars)  
    - **Input/Output:** Input from "AI Tutorial Generator"; outputs structured content to "Create Tutorial Post".  
    - **Edge Cases:**  
      - Malformed JSON or unexpected AI output formats.  
      - Empty content.  
      - JS exceptions if input data is missing fields.  
    - **Version-specific:** typeVersion 2.

---

#### 2.6 WordPress Post Creation

- **Overview:**  
  Creates a draft WordPress post for each tutorial with metadata tags and categories.

- **Nodes Involved:**  
  - Create Tutorial Post

- **Node Details:**

  - **Node Name:** Create Tutorial Post  
    - **Type:** WordPress node  
    - **Role:** Publishes tutorial drafts on WordPress site.  
    - **Configuration:**  
      - Post title: `"Tutorial: Building with {{$json.name}} - {{$json.language}} Guide"`  
      - Tags: `tutorial`, language, development, guide, repository name  
      - Status: draft  
      - Categories: Tutorials, Programming, language  
      - Content: populated from parsed AI output  
    - **Input/Output:** Input from "Parse the AI tutorial output"; output triggers "Notify Admin".  
    - **Edge Cases:**  
      - WordPress credential errors (authentication, permission issues).  
      - API rate limits or timeouts.  
      - Missing required fields causing post creation failure.  
    - **Version-specific:** typeVersion 1.

---

#### 2.7 Admin Notification

- **Overview:**  
  Sends an email notification to the admin informing about the newly created tutorial draft.

- **Nodes Involved:**  
  - Notify Admin

- **Node Details:**

  - **Node Name:** Notify Admin  
    - **Type:** Email Send  
    - **Role:** Sends notification email using SMTP credentials.  
    - **Configuration:**  
      - Subject: `"New Tutorial Draft Created: {{$json.name}}"`  
      - Uses SMTP credentials configured in n8n.  
    - **Input/Output:** Input from "Create Tutorial Post"; no further outputs.  
    - **Edge Cases:**  
      - SMTP authentication failures.  
      - Email delivery issues (e.g., spam filters, network failures).  
    - **Version-specific:** typeVersion 2.

---

### 3. Summary Table

| Node Name              | Node Type                       | Functional Role                     | Input Node(s)             | Output Node(s)            | Sticky Note                                                                                                                     |
|------------------------|--------------------------------|-----------------------------------|---------------------------|---------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Sticky Note            | Sticky Note                    | Documentation / Workflow Context  | -                         | -                         | ## Weekly Tutorial Generator<br>**What it does:**<br>- Scans GitHub for trending repos every Monday<br>- Creates tutorials<br>- Saves drafts + emails notifications<br>**Setup Required:**<br>1. Configure WordPress credentials<br>2. Setup email credentials<br>3. Optionally add GitHub token<br>**Perfect for:** Developer blogs, education sites, staying current. |
| Weekly Monday 10AM     | Schedule Trigger               | Triggers workflow weekly          | -                         | Get Trending Repos        |                                                                                                                                |
| Get Trending Repos     | HTTP Request                  | Fetch trending GitHub repos       | Weekly Monday 10AM         | Split Repository Items    |                                                                                                                                |
| Split Repository Items | Split Out                     | Split repos array into items      | Get Trending Repos         | AI Tutorial Generator     |                                                                                                                                |
| AI Tutorial Generator  | LangChain Agent (AI model)    | Generate tutorial content with AI| Split Repository Items     | Parse the AI tutorial output |                                                                                                                                |
| Google Gemini Chat Model | LangChain Google Gemini LM Chat | AI backend for tutorial generation| AI Tutorial Generator (ai_languageModel) | AI Tutorial Generator |                                                                                                                                |
| Parse the AI tutorial output | Code (JavaScript)          | Parse AI output to structured content | AI Tutorial Generator      | Create Tutorial Post      |                                                                                                                                |
| Create Tutorial Post   | WordPress                     | Create draft tutorial post        | Parse the AI tutorial output| Notify Admin              |                                                                                                                                |
| Notify Admin           | Email Send                    | Send notification email           | Create Tutorial Post       | -                         |                                                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Name: `Weekly Monday 10AM`  
   - Type: Schedule Trigger  
   - Configure the cron expression to `0 10 * * 1` (10 AM every Monday).  
   - No credentials required.

2. **Create an HTTP Request node**  
   - Name: `Get Trending Repos`  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.github.com/search/repositories`  
   - Optionally add query parameters to filter trending repositories (e.g., sorting by stars, date).  
   - Optional: Set up OAuth2 or token authentication with GitHub if high API limits are needed.  
   - Connect the output of `Weekly Monday 10AM` to this node.

3. **Add a Split Out node**  
   - Name: `Split Repository Items`  
   - Type: Split Out  
   - Default configuration to split the array of repositories into individual items.  
   - Connect `Get Trending Repos` output to this node.

4. **Add a LangChain Agent node**  
   - Name: `AI Tutorial Generator`  
   - Type: @n8n/n8n-nodes-langchain.agent  
   - Configure the system prompt as:  
     ```
     You are a technical tutorial writer. Based on the provided GitHub repository information, create a comprehensive tutorial that teaches developers how to build something similar or use this technology. Include: 1) Introduction and overview, 2) Prerequisites, 3) Step-by-step implementation guide with code examples, 4) Best practices, 5) Common pitfalls to avoid, 6) Next steps and resources. Make it beginner-friendly but technically accurate. Format with proper markdown including code blocks.
     ```  
   - Connect `Split Repository Items` output to this node.

5. **Add Google Gemini Chat Model node**  
   - Name: `Google Gemini Chat Model`  
   - Type: @n8n/n8n-nodes-langchain.lmChatGoogleGemini  
   - Configure with Google Palm API credentials (OAuth2/API key).  
   - Connect this node as the AI language model for `AI Tutorial Generator`.

6. **Add a Code node**  
   - Name: `Parse the AI tutorial output`  
   - Type: Code (JavaScript)  
   - Paste the following code:  
     ```javascript
     const items = $input.all();

     return items.map(item => {
       let aiOutput = item.json.output;
       aiOutput = aiOutput.replace(/```json\s*/, '').replace(/```\s*$/, '');

       let parsedOutput;
       try {
         parsedOutput = JSON.parse(aiOutput.trim());
       } catch (e) {
         parsedOutput = {
           title: `Tutorial: Building with ${item.json.name} - ${item.json.language} Guide`,
           content: aiOutput
         };
       }

       return {
         json: {
           title: parsedOutput.title || `Tutorial: Building with ${item.json.name} - ${item.json.language} Guide`,
           content: parsedOutput.content || aiOutput,
           repoName: item.json.name,
           language: item.json.language,
           description: item.json.description,
           url: item.json.html_url,
           stars: item.json.stargazers_count
         }
       };
     });
     ```  
   - Connect output of `AI Tutorial Generator` to this node.

7. **Add WordPress node**  
   - Name: `Create Tutorial Post`  
   - Type: WordPress  
   - Configure WordPress credentials (username, password or OAuth2).  
   - Set post parameters:  
     - Title: `Tutorial: Building with {{$json.name}} - {{$json.language}} Guide`  
     - Content: from `Parse the AI tutorial output` node (`content` field)  
     - Tags: `tutorial`, `{{$json.language}}`, `development`, `guide`, `{{$json.name}}`  
     - Categories: `Tutorials`, `Programming`, `{{$json.language}}`  
     - Status: `draft`  
   - Connect output of `Parse the AI tutorial output` node to this node.

8. **Add Email Send node**  
   - Name: `Notify Admin`  
   - Type: Email Send  
   - Configure SMTP credentials (host, port, username, password).  
   - Set subject: `New Tutorial Draft Created: {{$json.name}}`  
   - Connect output of `Create Tutorial Post` node to this node.

9. **Add a Sticky Note node for documentation** (optional)  
   - Content includes workflow purpose, author, setup instructions, and use cases.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow automates weekly tutorial generation from trending GitHub repos using Google Gemini AI, ideal for developer blogs and programming education sites. Setup requires WordPress and SMTP credentials; optionally GitHub token for improved API limits.                                                                                                                       | Provided in Sticky Note node content.                                                              |
| Google Gemini AI integration requires valid Google Palm API credentials; ensure quota and billing are configured appropriately.                                                                                                                                                                                                                                                     | Google Cloud Console / Palm API documentation                                                       |
| GitHub API usage without authentication is limited; to avoid rate limiting, configure a GitHub personal access token in the HTTP Request node headers or authentication section.                                                                                                                                                                                                   | https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting                   |
| WordPress posts are created as drafts to allow manual review before publishing. Tags and categories help organize content.                                                                                                                                                                                                                                                           | WordPress REST API documentation                                                                   |
| Email notifications use SMTP credentials; ensure correct SMTP server and port. Failures here might cause missed notifications.                                                                                                                                                                                                                                                      | Common SMTP providers like Gmail, Outlook, or custom SMTP servers                                  |
| The AI output parsing node handles both JSON-formatted and plain markdown content gracefully to accommodate AI response variability.                                                                                                                                                                                                                                               | Custom JavaScript in Code node                                                                      |

---

**Disclaimer:** The content analyzed and described here originates exclusively from an automated n8n workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.