Automate weekly Hollywood film briefing via Tavily and Gemini

https://n8nworkflows.xyz/workflows/automate-weekly-hollywood-film-briefing-via-tavily-and-gemini-6841


# Automate weekly Hollywood film briefing via Tavily and Gemini

### 1. Workflow Overview

This workflow automates the process of generating a weekly Hollywood film industry briefing email. It targets film journalists, entertainment bloggers, and movie enthusiasts who want an automated concise update on recent and upcoming Hollywood movies. The workflow combines real-time search data with AI summarization to produce an engaging email briefing.

Logical blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow every Thursday morning.
- **1.2 Data Retrieval from Tavily:** Four parallel HTTP requests fetch weekly data on Hollywood movie releases, box office results, industry news, and must-watch movies.
- **1.3 AI Summarization and Formatting:** A Google Gemini language model agent processes the collected data, summarizes it into a structured JSON with HTML formatting and emojis.
- **1.4 Email Delivery via Gmail:** The formatted briefing is sent as an email to a predefined recipient.
- **1.5 Documentation & Examples:** Sticky notes provide user guidance and example output for clarity.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:**  
  Starts the workflow automatically every Thursday at 7 AM to ensure timely weekly briefing delivery.

- **Nodes Involved:**  
  - Weekly Thursday Trigger

- **Node Details:**  
  - **Weekly Thursday Trigger**  
    - Type: Schedule Trigger  
    - Configuration: Fires weekly on Thursdays at 7:00 AM.  
    - Input/Output: No input; output triggers downstream nodes.  
    - Failure Cases: Trigger misconfiguration or scheduler errors (rare).  
    - Version: 1.2  
    - Notes: This node is the workflow entry point.

#### 1.2 Data Retrieval from Tavily

- **Overview:**  
  This block fetches four distinct categories of Hollywood-related data from the Tavily API using POST requests. Each request targets a specific search query and returns up to 5 results from the past week.

- **Nodes Involved:**  
  - Fetch Weekly Releases (Tavily)  
  - Fetch Weekly Box Office (Tavily)  
  - Fetch Hollywood News (Tavily)  
  - Fetch Must-Watch Movies (Tavily)

- **Node Details:**  

  - **Fetch Weekly Releases (Tavily)**  
    - Type: HTTP Request Tool  
    - Role: Fetches movies releasing this week.  
    - Config: POST to `https://api.tavily.com/search` with query `"hollywood movies releasing this week"`, returns 5 results, weekly time range, basic search depth.  
    - Headers: Content-Type JSON, Authorization from Tavily API Credential.  
    - Input: Trigger from AI tool node (agent).  
    - Output: JSON response with results.  
    - Failures: API key invalid, network errors, rate limits.

  - **Fetch Weekly Box Office (Tavily)**  
    - Similar to above but queries `"hollywood box office results last week"`.  

  - **Fetch Hollywood News (Tavily)**  
    - Queries `"hollywood news latest casting director production"`.  

  - **Fetch Must-Watch Movies (Tavily)**  
    - Queries `"best hollywood movies playing in theatres"`.  

  - Common considerations:  
    - All depend on valid Tavily API credentials.  
    - Potential API throttling or downtime.  
    - Returned data structures assumed to contain `title` and `content` fields.

#### 1.3 AI Summarization and Formatting

- **Overview:**  
  Uses a Langchain AI Agent powered by Google Gemini to digest the four sets of Tavily search results, summarize each into Gmail-friendly HTML with emojis and bullet points, and output a structured JSON with email subject and body.

- **Nodes Involved:**  
  - Hollywood News Research Agent  
  - Google Gemini 2.5 Flash  
  - Format Output for Email

- **Node Details:**  

  - **Hollywood News Research Agent**  
    - Type: Langchain Agent  
    - Role: Core AI logic node that receives the four Tavily results as tools input, runs a prompt to summarize them into categorized HTML sections with emojis for Releases, Box Office, News, Must-Watch Movies.  
    - Prompt: Detailed instructions on summarization, output format JSON with subject and HTML body.  
    - Uses Google Gemini 2.5 Flash as the language model.  
    - Input: Trigger from schedule, plus outputs of four Tavily HTTP requests as AI tools.  
    - Output: JSON object with `subject` and `body` keys.  
    - Failure Modes: AI API limits, prompt errors, output parsing failures.  
    - Version: 2.1

  - **Google Gemini 2.5 Flash**  
    - Type: Langchain Language Model node (Google PaLM API)  
    - Role: Provides the language model backend for the agent.  
    - Credentials: Google Gemini API key required.  
    - Input/Output: Receives prompt from agent, returns AI-generated text.  
    - Failures: Authentication errors, rate limits, network issues.

  - **Format Output for Email**  
    - Type: Langchain Structured Output Parser  
    - Role: Parses the AI raw text response into JSON per the defined schema.  
    - Configuration: JSON schema example provided for subject and body.  
    - Input: Output from the agent node.  
    - Output: Parsed JSON with structured email content.  
    - Failures: Parsing errors if AI output is malformed.

#### 1.4 Email Delivery via Gmail

- **Overview:**  
  Sends the finalized Hollywood briefing email to the configured Gmail recipient using OAuth2 for authentication.

- **Nodes Involved:**  
  - Send a message

- **Node Details:**  

  - **Send a message**  
    - Type: Gmail node  
    - Role: Sends an email with the subject and HTML body generated by the AI summary.  
    - Configuration:  
      - Recipient: titanfactz@gmail.com (hardcoded)  
      - Subject: Expression referencing parsed AI output subject.  
      - Message body: Expression referencing parsed AI output body HTML.  
    - Credentials: Gmail OAuth2 account required.  
    - Input: Structured JSON from the AI output parser.  
    - Output: Email sent confirmation or error.  
    - Failures: OAuth token expiration, quota limits, Gmail API errors.

#### 1.5 Documentation & Examples (Sticky Notes)

- **Overview:**  
  Two sticky notes provide user instructions, use cases, and an example of the email output to aid understanding and usage.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1

- **Node Details:**  

  - **Sticky Note**  
    - Contains detailed description of the workflow purpose, usage instructions, requirements, and support contact info.  
    - Positioned to the left as an introductory guide.  

  - **Sticky Note1**  
    - Shows an example of the expected HTML email output with emoji sections and bullet points.  
    - Positioned to the right for reference.

---

### 3. Summary Table

| Node Name                   | Node Type                             | Functional Role                                | Input Node(s)                   | Output Node(s)             | Sticky Note                                                                                          |
|-----------------------------|-------------------------------------|------------------------------------------------|--------------------------------|----------------------------|----------------------------------------------------------------------------------------------------|
| Weekly Thursday Trigger      | Schedule Trigger                    | Starts workflow weekly on Thursday at 7 AM     |                                | Hollywood News Research Agent |                                                                                                    |
| Fetch Weekly Releases (Tavily)  | HTTP Request Tool                  | Fetch weekly movie releases from Tavily API    | Hollywood News Research Agent  | Hollywood News Research Agent |                                                                                                    |
| Fetch Weekly Box Office (Tavily) | HTTP Request Tool                  | Fetch weekly box office results from Tavily API| Hollywood News Research Agent  | Hollywood News Research Agent |                                                                                                    |
| Fetch Hollywood News (Tavily)    | HTTP Request Tool                  | Fetch latest Hollywood news from Tavily API    | Hollywood News Research Agent  | Hollywood News Research Agent |                                                                                                    |
| Fetch Must-Watch Movies (Tavily) | HTTP Request Tool                  | Fetch must-watch movies in theatres from Tavily| Hollywood News Research Agent  | Hollywood News Research Agent |                                                                                                    |
| Google Gemini 2.5 Flash       | Langchain LM Chat Google Gemini    | Provides AI language model backend (Google Gemini) | Hollywood News Research Agent  | Hollywood News Research Agent |                                                                                                    |
| Hollywood News Research Agent | Langchain Agent                    | AI summarization of all fetched data into HTML | Weekly Thursday Trigger, Four Tavily nodes | Format Output for Email, Send a message |                                                                                                    |
| Format Output for Email       | Langchain Output Parser Structured | Parses AI output text into structured JSON     | Hollywood News Research Agent  | Send a message              |                                                                                                    |
| Send a message               | Gmail                              | Sends the formatted briefing email             | Format Output for Email         |                            |                                                                                                    |
| Sticky Note                  | Sticky Note                        | Workflow description, instructions, use cases |                                |                            | ## Try It Out! 🎬 ... See detailed workflow introduction and usage instructions.                    |
| Sticky Note1                 | Sticky Note                        | Example email output for reference              |                                |                            | ## Example Email Output ... Detailed sample of final email content with emoji sections and bullets.|

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Schedule Trigger node (Weekly Thursday Trigger):**  
   - Set to trigger weekly on Thursday at 07:00 AM.  
   - No inputs.

3. **Add four HTTP Request Tool nodes for Tavily searches:**

   - **Fetch Weekly Releases (Tavily):**  
     - Method: POST  
     - URL: `https://api.tavily.com/search`  
     - Headers:  
       - Content-Type: application/json  
       - Authorization: `{{$credentials.TavilyApiKey}}` (create Tavily API credential)  
     - Body (JSON):  
       ```json
       {
         "query": "hollywood movies releasing this week",
         "search_depth": "basic",
         "time_range": "week",
         "max_results": 5
       }
       ```
     - Send body as JSON.  

   - **Fetch Weekly Box Office (Tavily):**  
     - Same setup as above but query: `"hollywood box office results last week"`.  

   - **Fetch Hollywood News (Tavily):**  
     - Same setup, query: `"hollywood news latest casting director production"`.  

   - **Fetch Must-Watch Movies (Tavily):**  
     - Same setup, query: `"best hollywood movies playing in theatres"`.  

4. **Add Google Gemini 2.5 Flash node:**  
   - Type: Langchain LM Chat Google Gemini  
   - Credentials: configure Google Gemini (PaLM) API key.  
   - No special parameters required.

5. **Add Hollywood News Research Agent node:**  
   - Type: Langchain Agent  
   - Parameters:  
     - Prompt text as given in the workflow: instructing the AI to summarize the four Tavily results into a structured JSON with subject and HTML body containing emoji categories.  
     - Set prompt type to "define" with output parser enabled.  
   - Link the four Tavily HTTP nodes as AI tools input to this agent node.  
   - Link Google Gemini 2.5 Flash as the language model backend for this agent.

6. **Add Format Output for Email node:**  
   - Type: Langchain Output Parser Structured  
   - Provide a JSON schema example matching:  
     ```json
     {
       "subject": "Daily Hollywood Film Industry Briefing – July 25, 2025",
       "body": "<html> ... formatted content ... </html>"
     }
     ```
   - Connect the Hollywood News Research Agent node output here for parsing.

7. **Add Send a message (Gmail) node:**  
   - Configure Gmail OAuth2 credentials.  
   - Set recipient email (e.g., `titanfactz@gmail.com`).  
   - Subject: use expression referencing the parsed JSON output subject (`{{$json["subject"]}}`).  
   - Message: use expression referencing the parsed JSON output body (`{{$json["body"]}}`).  
   - Set options as needed (e.g., no attachments).  

8. **Connect nodes in sequence:**  
   - Weekly Thursday Trigger → Hollywood News Research Agent  
   - Four Tavily fetch nodes → Hollywood News Research Agent (as AI tool inputs)  
   - Hollywood News Research Agent → Format Output for Email  
   - Format Output for Email → Send a message  

9. **Create credentials:**  
   - Tavily API key credential with API key from your Tavily account.  
   - Google Gemini (PaLM) API key credential for the language model.  
   - Gmail OAuth2 credential for email sending.

10. **(Optional) Add sticky notes for documentation:**  
    - Add a sticky note on left with workflow description, usage, and help info.  
    - Add a sticky note on right with example email output.

11. **Activate the workflow** to run weekly and send briefing emails automatically.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                                   |
|----------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| This workflow is ideal for film journalists, entertainment bloggers, or movie fans seeking automated weekly Hollywood updates. | Workflow purpose and target users.                                                                               |
| Requires Tavily API account (free tier available) for real-time search data.                              | Tavily API: https://tavily.com                                                                                   |
| Requires Google Gemini (PaLM) API key for advanced AI summarization and formatting.                       | Google Gemini (PaLM) API: https://developers.generativeai.google/                                                |
| Requires Gmail account with OAuth2 credentials to send emails programmatically.                           | Gmail API OAuth2 setup: https://developers.google.com/gmail/api/quickstart/js                                      |
| For help and feedback, contact the author at titanfactz@gmail.com or on X (formerly Twitter): https://x.com/manav170303 | Support contact details.                                                                                          |
| Example output includes emoji-styled sections and bullet points for readability and engagement.          | See sticky note example email output.                                                                             |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.