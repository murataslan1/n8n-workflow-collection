Automate Job Search and Matching with Adzuna API, GPT-3.5, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-job-search-and-matching-with-adzuna-api--gpt-3-5--and-google-sheets-4230


# Automate Job Search and Matching with Adzuna API, GPT-3.5, and Google Sheets

### 1. Workflow Overview

This workflow automates the process of searching for job listings using the Adzuna API, analyzing and summarizing these jobs with OpenAI’s GPT-3.5 (via Langchain integration), scoring and writing tailored cover letters, storing results in Google Sheets, and finally sending emails through Gmail. It is designed for job seekers or recruitment automation scenarios where continuous, AI-enhanced job matching and communication is required.

The workflow is logically divided into these blocks:

- **1.1 Scheduled Job Search Initiation:** Periodic trigger to start the job search process.
- **1.2 Job Search Setup and Retrieval:** Defining search parameters and fetching job listings from Adzuna API.
- **1.3 Job Data Processing:** Splitting job listings, summarizing each job description using GPT-3.5, and scoring jobs for relevance.
- **1.4 Cover Letter Generation and Communication:** Writing personalized cover letters with GPT-3.5, storing job and cover letter data in Google Sheets, and sending emails via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Job Search Initiation

- **Overview:**  
  This block triggers the entire workflow at regular intervals, initiating the job search automation cycle.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Set Job Title1

- **Node Details:**

  - **Schedule Trigger**  
    - *Type:* Trigger node.  
    - *Role:* Starts workflow on a defined schedule (e.g., daily, hourly).  
    - *Configuration:* Default schedule settings (not detailed explicitly; likely configured to desired frequency).  
    - *Inputs:* None (trigger node).  
    - *Outputs:* Connects to "Set Job Title1".  
    - *Edge Cases:* Missed trigger if n8n instance is down; no error expected if schedule not met.  

  - **Set Job Title1**  
    - *Type:* Set node.  
    - *Role:* Sets or initializes parameters for the job search, such as job title or keywords for the Adzuna API query.  
    - *Configuration:* Presumably sets variables like `job_title`, `location`, or other search criteria (not explicitly detailed).  
    - *Inputs:* From Schedule Trigger.  
    - *Outputs:* To "Get Jobs from Adzuna1".  
    - *Edge Cases:* Missing or invalid parameters could cause downstream API request failures.

#### 1.2 Job Search Setup and Retrieval

- **Overview:**  
  This block sends a request to the Adzuna job search API using parameters defined earlier and retrieves job listings.

- **Nodes Involved:**  
  - Get Jobs from Adzuna1

- **Node Details:**

  - **Get Jobs from Adzuna1**  
    - *Type:* HTTP Request node.  
    - *Role:* Queries Adzuna API to fetch job listings based on the set parameters.  
    - *Configuration:*  
      - HTTP method: GET  
      - URL: Adzuna job search endpoint (e.g., `https://api.adzuna.com/v1/api/jobs/...`)  
      - Query parameters include job title, location, app_id, app_key (credentials).  
      - Authentication: API key in query or header.  
    - *Inputs:* From "Set Job Title1".  
    - *Outputs:* To "Split Jobs1".  
    - *Edge Cases:*  
      - API rate limits or quota exceeded errors.  
      - Network timeouts or errors.  
      - Invalid or expired API keys.  
      - Empty or malformed responses.

#### 1.3 Job Data Processing

- **Overview:**  
  This block processes the retrieved job listings by splitting them into individual job items, summarizing each with GPT-3.5, and scoring their relevance.

- **Nodes Involved:**  
  - Split Jobs1  
  - Summarize Job1  
  - Score Job

- **Node Details:**

  - **Split Jobs1**  
    - *Type:* Split Out node.  
    - *Role:* Splits the array of job listings into separate data items for individual processing.  
    - *Configuration:* Default splitting by items in array.  
    - *Inputs:* From "Get Jobs from Adzuna1".  
    - *Outputs:* To "Summarize Job1".  
    - *Edge Cases:* Empty job list results in no outputs; downstream nodes may fail if expecting data.

  - **Summarize Job1**  
    - *Type:* OpenAI node (Langchain integration).  
    - *Role:* Sends individual job descriptions to GPT-3.5 to generate a concise summary.  
    - *Configuration:*  
      - Model: GPT-3.5 (OpenAI)  
      - Prompt: A template that takes job description and creates a summary (e.g., “Summarize this job posting...”).  
      - Temperature, max tokens set as per default or configured values.  
      - API credentials: OpenAI API key.  
    - *Inputs:* From "Split Jobs1".  
    - *Outputs:* To "Score Job".  
    - *Edge Cases:*  
      - API quota exceeded or authentication errors.  
      - Prompt failures or unexpected outputs.  
      - Network timeouts.

  - **Score Job**  
    - *Type:* OpenAI node (Langchain integration).  
    - *Role:* Analyzes summarized job data to score or rank the job’s relevance to the user.  
    - *Configuration:*  
      - Model: GPT-3.5  
      - Prompt: Likely includes criteria for scoring job fit or interest.  
      - API credentials: OpenAI key.  
    - *Inputs:* From "Summarize Job1".  
    - *Outputs:* To "Write Cover Letter1".  
    - *Edge Cases:* Same as Summarize Job1. Incorrect scoring due to poor prompt design.

#### 1.4 Cover Letter Generation and Communication

- **Overview:**  
  Generates personalized cover letters for scored jobs, stores job and letter data in Google Sheets, and sends emails via Gmail.

- **Nodes Involved:**  
  - Write Cover Letter1  
  - Google Sheets  
  - Gmail1

- **Node Details:**

  - **Write Cover Letter1**  
    - *Type:* OpenAI node (Langchain integration).  
    - *Role:* Generates a customized cover letter using GPT-3.5 based on job details and score.  
    - *Configuration:*  
      - Model: GPT-3.5  
      - Prompt: Template to generate cover letter text tailored to job specifics.  
      - API credentials: OpenAI key.  
    - *Inputs:* From "Score Job".  
    - *Outputs:* To "Google Sheets".  
    - *Edge Cases:* API and network errors; failure to generate relevant letter if prompt lacks context.

  - **Google Sheets**  
    - *Type:* Google Sheets node.  
    - *Role:* Records job information and generated cover letters into a designated Google Sheet for tracking.  
    - *Configuration:*  
      - Spreadsheet ID and sheet name specified.  
      - Append or update mode for rows.  
      - Google OAuth2 credentials configured.  
    - *Inputs:* From "Write Cover Letter1".  
    - *Outputs:* To "Gmail1".  
    - *Edge Cases:* Authentication failures, quota exceeded, sheet not found errors.

  - **Gmail1**  
    - *Type:* Gmail node.  
    - *Role:* Sends email with job application details and cover letter to target recipients.  
    - *Configuration:*  
      - OAuth2 credentials for Gmail.  
      - Email recipient, subject, and body constructed dynamically (likely from previous node data).  
    - *Inputs:* From "Google Sheets".  
    - *Outputs:* None (end of workflow).  
    - *Edge Cases:* Authentication errors, sending limits, invalid recipient addresses.

---

### 3. Summary Table

| Node Name          | Node Type                         | Functional Role                        | Input Node(s)          | Output Node(s)       | Sticky Note |
|--------------------|----------------------------------|-------------------------------------|-----------------------|----------------------|-------------|
| Schedule Trigger    | Schedule Trigger                 | Starts workflow on schedule         | —                     | Set Job Title1       |             |
| Set Job Title1      | Set                             | Sets job search parameters           | Schedule Trigger       | Get Jobs from Adzuna1|             |
| Get Jobs from Adzuna1| HTTP Request                   | Fetches jobs from Adzuna API         | Set Job Title1         | Split Jobs1          |             |
| Split Jobs1         | Split Out                       | Splits job list into individual jobs | Get Jobs from Adzuna1  | Summarize Job1       |             |
| Summarize Job1      | OpenAI (Langchain)              | Summarizes individual job descriptions | Split Jobs1            | Score Job            |             |
| Score Job           | OpenAI (Langchain)              | Scores relevance of summarized jobs  | Summarize Job1         | Write Cover Letter1  |             |
| Write Cover Letter1 | OpenAI (Langchain)              | Generates personalized cover letter  | Score Job              | Google Sheets        |             |
| Google Sheets       | Google Sheets                   | Stores job and cover letter data     | Write Cover Letter1    | Gmail1               |             |
| Gmail1              | Gmail                          | Sends email with job application     | Google Sheets          | —                    |             |
| Sticky Note         | Sticky Note                    | (Unused content)                     | —                     | —                    |             |
| Sticky Note1        | Sticky Note                    | (Unused content)                     | —                     | —                    |             |
| Sticky Note2        | Sticky Note                    | (Unused content)                     | —                     | —                    |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow named "Job_Search_Automation".**

2. **Add a Schedule Trigger node:**
   - Configure to run at desired intervals (e.g., daily at 8 AM).
   - No credentials needed.

3. **Add a Set node named "Set Job Title1":**
   - Connect Schedule Trigger output to this node’s input.
   - Configure to set parameters such as:
     - `job_title` (e.g., "Software Engineer")
     - `location` (e.g., "New York")
     - Any other Adzuna API parameters needed.
   - Use fixed values or expressions as needed.

4. **Add an HTTP Request node named "Get Jobs from Adzuna1":**
   - Connect "Set Job Title1" output to this node.
   - Configure:
     - HTTP Method: GET
     - URL: e.g., `https://api.adzuna.com/v1/api/jobs/[country]/search/1`
     - Query Parameters:
       - `app_id`: Your Adzuna App ID (credential)
       - `app_key`: Your Adzuna App Key (credential)
       - `what`: Expression referencing `job_title`
       - `where`: Expression referencing `location`
       - Other filters as needed
     - Authentication: None or as per Adzuna API docs.
   - Add credentials for Adzuna API keys if applicable.

5. **Add a Split Out node named "Split Jobs1":**
   - Connect "Get Jobs from Adzuna1" output to this node.
   - Configure to split by the array containing job listings (e.g., `response.results`).

6. **Add an OpenAI node named "Summarize Job1":**
   - Connect "Split Jobs1" output to this node.
   - Configure:
     - Resource: OpenAI
     - Operation: Chat Completion or Text Completion
     - Model: GPT-3.5
     - Prompt: Template to summarize the job description (e.g., "Summarize the following job posting: {{$json["description"]}}")
     - Set temperature and max tokens appropriately.
     - Add OpenAI API credentials.

7. **Add another OpenAI node named "Score Job":**
   - Connect "Summarize Job1" output to this node.
   - Configure:
     - Model: GPT-3.5
     - Prompt: Template to score or rank the job summary based on relevance or fit.
     - Use variables from summarized job.
     - Use the same OpenAI credentials.

8. **Add an OpenAI node named "Write Cover Letter1":**
   - Connect "Score Job" output to this node.
   - Configure:
     - Model: GPT-3.5
     - Prompt: Template to generate a tailored cover letter using job info and score.
     - Use OpenAI credentials.

9. **Add a Google Sheets node:**
   - Connect "Write Cover Letter1" output to this node.
   - Configure:
     - Operation: Append (or Update) Row
     - Spreadsheet ID: Your Google Sheet ID
     - Sheet Name: Target sheet for job tracking
     - Map fields: job title, summary, score, cover letter, date, etc.
     - Set up Google OAuth2 credentials.

10. **Add a Gmail node:**
    - Connect "Google Sheets" output to this node.
    - Configure:
      - Operation: Send Email
      - Set recipient address dynamically or fixed
      - Subject and body: use fields from previous data (e.g., job title, cover letter)
      - Use Gmail OAuth2 credentials.

11. **Connect all nodes in the order:**
    - Schedule Trigger → Set Job Title1 → Get Jobs from Adzuna1 → Split Jobs1 → Summarize Job1 → Score Job → Write Cover Letter1 → Google Sheets → Gmail1

12. **Test the workflow with sample data and validate credentials.**

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                  |
|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| The workflow leverages Langchain’s OpenAI integration for advanced AI processing within n8n.                      | Langchain OpenAI node documentation              |
| Adzuna API requires registration to obtain `app_id` and `app_key` for authentication.                            | https://developer.adzuna.com/                     |
| Google Sheets and Gmail nodes require OAuth2 credentials with appropriate scopes (Sheets API, Gmail API).        | n8n Google credentials setup guides               |
| Ensure API rate limits for OpenAI and Adzuna are monitored to prevent workflow disruption.                       | OpenAI and Adzuna API documentation               |
| For robust error handling, consider adding error workflows or catch nodes around API calls and AI nodes.          | n8n error workflow best practices                  |

---

**Disclaimer:** The text provided exclusively originates from an automated workflow created with n8n, an integration and automation tool. This process strictly respects current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.