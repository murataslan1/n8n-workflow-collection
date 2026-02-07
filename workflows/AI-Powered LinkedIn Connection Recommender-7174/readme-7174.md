AI-Powered LinkedIn Connection Recommender

https://n8nworkflows.xyz/workflows/ai-powered-linkedin-connection-recommender-7174


# AI-Powered LinkedIn Connection Recommender

### 1. Workflow Overview

This workflow, titled **AI-Powered LinkedIn Connection Recommender**, automates the process of identifying and recommending high-value LinkedIn connections for a user based on their professional profile. It leverages external search APIs to find relevant LinkedIn profiles, applies AI analysis to score and prioritize potential connections, and delivers a personalized networking report via email.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Acquiring the user profile data, primarily from email input.
- **1.2 LinkedIn Profile Search:** Querying LinkedIn profiles relevant to the user's position, location, and skills via a Google search API.
- **1.3 Search Results Processing:** Filtering and structuring the raw search results into candidate LinkedIn profiles.
- **1.4 AI Profile Analysis:** Using a large language model to analyze the user profile and potential connections, scoring and recommending connections.
- **1.5 Recommendations Refinement:** Parsing and enhancing AI output to generate prioritized connection insights with personalized messaging strategies.
- **1.6 Email Preparation and Delivery:** Creating a detailed networking report email and sending it to the user.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block initiates the workflow by retrieving user data, typically from an email source, and structuring the user profile information for downstream processing.

- **Nodes Involved:**  
  - Get User Data From Email  
  - Your Profile Information

- **Node Details:**

  - **Get User Data From Email**  
    - Type: Email Read (IMAP)  
    - Role: Reads incoming emails to extract user-provided profile data.  
    - Configuration: Uses IMAP credentials to access mailbox; no filters specified, so presumably pulls latest or specific emails.  
    - Inputs: None (trigger/start)  
    - Outputs: Email content JSON  
    - Edge Cases:  
      - Connection/authentication failure with IMAP server  
      - No new emails or unexpected email format  
      - Large email bodies causing timeout or data truncation  

  - **Your Profile Information**  
    - Type: Set node  
    - Role: Defines and structures key user profile fields (Name, Position, Industry, Location, Skills, Interests, Target Roles, Company Types).  
    - Configuration: Manually sets these fields, likely from parsed email data or manual input.  
    - Inputs: Output from "Get User Data From Email"  
    - Outputs: Structured user profile JSON  
    - Edge Cases: Missing or incomplete profile data  

#### 2.2 LinkedIn Profile Search

- **Overview:** Performs a Google search via the SerpAPI to find LinkedIn profiles matching the user's position, location, and primary skill keyword.

- **Nodes Involved:**  
  - Search LinkedIn Profiles

- **Node Details:**

  - **Search LinkedIn Profiles**  
    - Type: HTTP Request  
    - Role: Queries SerpAPI (Google Search API wrapper) to retrieve LinkedIn profile URLs.  
    - Configuration:  
      - URL: `https://serpapi.com/search.json`  
      - Query parameters:  
        - engine=google  
        - q=`site:linkedin.com/in "{{ $json.Position }}" "{{ $json.Location }}" {{ $json.Skills.split(',')[0] }}` — dynamic query built from user profile data  
        - api_key (credential-protected)  
        - num=200 results requested  
        - start=0  
      - Authentication: HTTP Basic Auth via stored credentials  
    - Inputs: User profile JSON (provides query parameters)  
    - Outputs: Raw JSON response from SerpAPI including search results  
    - Edge Cases:  
      - API key limits or invalid credentials  
      - No results found or rate limiting by SerpAPI  
      - Network timeout or HTTP errors  

#### 2.3 Search Results Processing

- **Overview:** Filters and extracts relevant LinkedIn profiles from the raw search results, limiting to the top 15 profiles and structuring data for AI analysis.

- **Nodes Involved:**  
  - Process LinkedIn Search Results

- **Node Details:**

  - **Process LinkedIn Search Results**  
    - Type: Code (JavaScript) node  
    - Role: Parses the SerpAPI response to extract LinkedIn profile information such as name, headline, link, and description.  
    - Configuration:  
      - Filters URLs to include only `linkedin.com/in/` profiles, excluding posts and activities.  
      - Cleans profile names from title strings.  
      - Limits output to top 15 profiles.  
      - Safely extracts first skill from comma-separated skills string.  
      - Returns structured JSON containing user profile info and found profiles array.  
    - Inputs: Raw search results JSON; user profile JSON from "Your Profile Information"  
    - Outputs: Structured JSON with userProfile and foundProfiles arrays  
    - Edge Cases:  
      - Empty or malformed search results  
      - Missing fields in search results  
      - Unexpected data formats causing parsing errors  

#### 2.4 AI Profile Analysis

- **Overview:** Applies a large language model (LLM) to analyze the user profile and found LinkedIn profiles, scoring each potential connection and generating networking insights.

- **Nodes Involved:**  
  - AI Profile Analysis  
  - Ollama Model1 (AI backend)

- **Node Details:**

  - **AI Profile Analysis**  
    - Type: Langchain Chain LLM node  
    - Role: Sends a prompt to the LLM to analyze user profile and potential connections, requesting a structured JSON output with scores and recommendations.  
    - Configuration:  
      - Prompt includes detailed user profile fields and list of found profiles with their headlines.  
      - Request instructs scoring from 1 to 10 based on role alignment, industry relevance, skill complementarity, networking value, and career growth potential.  
    - Inputs: Processed profiles JSON  
    - Outputs: AI-generated text response expected to contain JSON structure  
    - Edge Cases:  
      - API errors or timeouts from LLM provider  
      - Prompt formatting issues causing unexpected responses  
      - Response missing or malformed JSON content  

  - **Ollama Model1**  
    - Type: Langchain LM Ollama node (AI model backend)  
    - Role: Executes the AI model call with parameters (llama3.2-16000 latest model) and options (topP=0.9, temperature=0.7).  
    - Credentials: Ollama API credentials required  
    - Inputs: Prompt from "AI Profile Analysis" node  
    - Outputs: AI response text  
    - Edge Cases:  
      - Model call failure or throttling  
      - Credential expiry or misconfiguration  

#### 2.5 Recommendations Refinement

- **Overview:** Parses the AI's JSON response, enriches connection data with priority scoring, personalized messages, tags, and prepares next steps and networking strategies.

- **Nodes Involved:**  
  - Create Final Recommendations

- **Node Details:**

  - **Create Final Recommendations**  
    - Type: Code (JavaScript) node  
    - Role:  
      - Extracts and parses JSON from AI text response.  
      - Handles failure to parse by providing fallback generic recommendations.  
      - Enhances each connection with priority labels (High, Medium, Low), AI scores, suggested personalized messages based on description keywords, tags for technologies and roles, and estimated response rates.  
      - Generates connection strategies as concise messages.  
      - Summarizes profile statistics (counts by priority, average score).  
      - Defines networking strategy parameters (weekly goals, best days/times, follow-up schedules).  
      - Compiles next actionable steps for the user.  
      - Prepares top recommendations for quick action.  
    - Inputs: AI analysis response text  
    - Outputs: Structured JSON with enriched recommendations, summaries, strategies, and next steps  
    - Edge Cases:  
      - Parsing errors due to malformed AI output  
      - Missing fields in AI response  
      - Unexpected data types causing runtime errors  

#### 2.6 Email Preparation and Delivery

- **Overview:** Formats the final recommendations into a human-readable email report and sends it to the user’s email address.

- **Nodes Involved:**  
  - Create Email  
  - Send email

- **Node Details:**

  - **Create Email**  
    - Type: Code (JavaScript) node  
    - Role: Constructs the email subject and plain text body summarizing:  
      - User profile info and interests  
      - Summary statistics of connection recommendations  
      - Detailed top connection recommendations with scores, mutual connections, reasons, and suggested messages  
      - Next steps for networking  
      - AI insights and networking strategy details (best days and times)  
    - Inputs: Final recommendations JSON  
    - Outputs: JSON containing `subject` and `body` fields for email  
    - Edge Cases:  
      - Missing data fields causing incomplete email text  
      - Very large recommendation lists leading to excessively long emails  

  - **Send email**  
    - Type: Email Send node  
    - Role: Sends the prepared email to the user’s email address.  
    - Configuration:  
      - To email: dynamically set from input JSON’s `from` field  
      - From email: fixed address (`abc@gmail.com`)  
      - Subject and body populated from "Create Email" output  
      - Format: Plain text  
      - SMTP credentials required  
    - Inputs: Email content JSON  
    - Outputs: Email send status  
    - Edge Cases:  
      - SMTP authentication failures  
      - Invalid recipient email addresses  
      - Email delivery issues or spam filtering  

---

### 3. Summary Table

| Node Name                     | Node Type                      | Functional Role                             | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                       |
|-------------------------------|--------------------------------|---------------------------------------------|------------------------------|--------------------------------|-------------------------------------------------------------------------------------------------|
| Get User Data From Email       | Email Read (IMAP)              | Fetch user profile data from incoming email | None                         | Your Profile Information        |                                                                                                 |
| Your Profile Information       | Set                           | Define user profile fields for processing   | Get User Data From Email      | Search LinkedIn Profiles        |                                                                                                 |
| Search LinkedIn Profiles       | HTTP Request                  | Query SerpAPI Google search for LinkedIn profiles | Your Profile Information      | Process LinkedIn Search Results |                                                                                                 |
| Process LinkedIn Search Results| Code                          | Parse and filter LinkedIn profiles from search results | Search LinkedIn Profiles      | AI Profile Analysis             |                                                                                                 |
| AI Profile Analysis            | Langchain Chain LLM           | Analyze user and found profiles with AI     | Process LinkedIn Search Results | Create Final Recommendations    |                                                                                                 |
| Ollama Model1                 | Langchain LM Ollama            | Execute AI model call for analysis           | AI Profile Analysis           | AI Profile Analysis (LLM output) |                                                                                                 |
| Create Final Recommendations  | Code                          | Parse AI output, enrich recommendations     | AI Profile Analysis           | Create Email                   |                                                                                                 |
| Create Email                  | Code                          | Format final networking report for email    | Create Final Recommendations  | Send email                    |                                                                                                 |
| Send email                   | Email Send                    | Deliver the networking report email          | Create Email                  | None                           |                                                                                                 |
| Sticky Note                  | Sticky Note                   | System Architecture overview note            | None                         | None                           | ## System Architecture<br>- Profile Analysis Pipeline ... (full content in section 5)          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create IMAP Email Read Node ("Get User Data From Email")**  
   - Type: Email Read (IMAP)  
   - Configure IMAP credentials with access to the user mailbox.  
   - No special filters, or configure to read specific emails containing user profiles.  
   - Set to output email content as JSON.

2. **Create Set Node ("Your Profile Information")**  
   - Type: Set  
   - Define fields: Name, Position, Industry, Location, Skills, Interests, Target Roles, Company Types.  
   - Map these fields from the email content JSON or manually set for test purposes.

3. **Create HTTP Request Node ("Search LinkedIn Profiles")**  
   - Type: HTTP Request  
   - URL: `https://serpapi.com/search.json`  
   - Method: GET  
   - Authentication: HTTP Basic Auth using SerpAPI credentials stored securely.  
   - Query Parameters:  
     - `engine=google`  
     - `q=site:linkedin.com/in "{{ $json.Position }}" "{{ $json.Location }}" {{ $json.Skills.split(',')[0] }}` (expression enabled)  
     - `api_key` from credentials  
     - `num=200`  
     - `start=0`  
   - Connect input from "Your Profile Information".

4. **Create Code Node ("Process LinkedIn Search Results")**  
   - Type: Code (JavaScript)  
   - Paste provided JavaScript code to filter `linkedin.com/in/` profiles, clean names, and limit to 15 results.  
   - Extract user profile from previous node using `$node["Your Profile Information"].json`.  
   - Return JSON structure with `userProfile`, `foundProfiles`, and other metadata.  
   - Connect input from "Search LinkedIn Profiles".

5. **Create Langchain Chain LLM Node ("AI Profile Analysis")**  
   - Type: Langchain Chain LLM  
   - Set prompt with detailed user profile and found profiles, instruct AI to output JSON with scored profiles and connection recommendations.  
   - Connect input from "Process LinkedIn Search Results".

6. **Create Langchain LM Ollama Node ("Ollama Model1")**  
   - Type: Langchain LM Ollama  
   - Select model: `llama3.2-16000:latest`  
   - Set options: `topP=0.9`, `temperature=0.7`  
   - Configure Ollama API credentials.  
   - Connect input from "AI Profile Analysis" node’s AI languageModel input.

7. **Create Code Node ("Create Final Recommendations")**  
   - Type: Code (JavaScript)  
   - Paste provided code to parse AI JSON response, generate priority scores, suggested messages, tags, and next steps.  
   - Connect input from "AI Profile Analysis" output.

8. **Create Code Node ("Create Email")**  
   - Type: Code (JavaScript)  
   - Paste provided code that formats the networking report email with summary and detailed recommendations.  
   - Connect input from "Create Final Recommendations".

9. **Create Email Send Node ("Send email")**  
   - Type: Email Send  
   - Configure SMTP credentials for sending email.  
   - Set `To Email` to `{{ $json.from }}` (dynamic from input).  
   - Set `From Email` to a fixed email like `abc@gmail.com`.  
   - Set subject and body from "Create Email" output.  
   - Connect input from "Create Email".

10. **Create Sticky Note Node ("Sticky Note")**  
    - Add a sticky note describing the system architecture (copy content from section 5).  
    - Place visually near the relevant nodes for documentation.

11. **Connect Nodes in This Order:**  
    - Get User Data From Email → Your Profile Information → Search LinkedIn Profiles → Process LinkedIn Search Results → AI Profile Analysis → Ollama Model1 (AI model backend) → Create Final Recommendations → Create Email → Send email

12. **Credentials Setup:**  
    - IMAP server credentials for email reading.  
    - SerpAPI credentials for LinkedIn search via Google API.  
    - Ollama API credentials for AI model calls.  
    - SMTP credentials for sending emails.  

13. **Test and Validate:**  
    - Confirm all nodes execute without errors.  
    - Validate AI output parsing robustness.  
    - Ensure email delivery is successful.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                | Context or Link                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| ## System Architecture<br>- **Profile Analysis Pipeline**:<br>  - **Get User Data from Email**: Initiates with manual user input.<br>  - **Your Profile Information**: Provides initial data.<br>  - **Search LinkedIn Profiles**: Fetches profile data via API.<br>  - **Process LinkedIn Search Results**: Extracts relevant information.<br>- **AI Recommendation Flow**:<br>  - **AI Profile Analysis**: Analyzes data with AI.<br>  - **Create Recommendations**: Generates initial connection list.<br>  - **Create Final Recommendations**: Refines the list.<br>- **Delivery Flow**:<br>  - **Create Email**: Prepares the email content.<br>  - **Send Email**: Sends the curated list to the user. | Sticky Note node content covering major workflow blocks and architecture overview.                      |

---

**Disclaimer:** The provided text is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.