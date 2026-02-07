Automate Job Search & Applications with 5 Job Boards & AI Resume Generator

https://n8nworkflows.xyz/workflows/automate-job-search---applications-with-5-job-boards---ai-resume-generator-6927


# Automate Job Search & Applications with 5 Job Boards & AI Resume Generator

### 1. Workflow Overview

This workflow automates the entire job search and application process by aggregating job listings from five major job boards (Adzuna, Indeed, LinkedIn, Upwork, Glassdoor), processing them with AI to extract relevant skills and match the user’s resume, and then generating personalized cover letters and managing applications. It integrates external scraping services (Apify), AI language models (OpenRouter-based agents), Google Sheets, and Gmail for communication.

Logical blocks:

- **1.1 Input Reception & Initialization:** Receive user inputs and resume file; extract job title and kick off job board scrapers.
- **1.2 Job Data Aggregation & Standardization:** Collect job listings from multiple scrapers and Adzuna API, merge, filter duplicates, and standardize the job data.
- **1.3 AI Skill Extraction & Resume Matching:** Loop through jobs to extract required skills and score the match with the user’s resume using AI agents.
- **1.4 Decision & Resume/Letter Generation:** Filter jobs by match score, rewrite resume tailored to job, generate cover letter.
- **1.5 Application Logging & Email Sending:** Update Google Sheets with application data, send application emails via Gmail, and handle success/error workflows.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Initialization

- **Overview:** This block receives the webhook request containing the user’s resume file and job title, extracts relevant data, and triggers the job board scrapers.

- **Nodes Involved:**  
  - Webhook  
  - Respond to Webhook  
  - Extract from File  
  - Set Job Title  
  - 4️⃣Get Jobs from Adzuna  
  - Apify: Run Indeed Scraper  
  - Apify: Run LinkedIn Scraper  
  - Apify: Run Upwork Scraper  
  - Apify: Run Glassdoor Scraper

- **Node Details:**

  - **Webhook**  
    - Type: Webhook (HTTP trigger)  
    - Role: Receives external POST requests with user input including resume file and job title.  
    - Config: Default webhook with unique ID; expects file upload or data in payload.  
    - Inputs: External HTTP request.  
    - Outputs: To Respond to Webhook and Extract from File.  
    - Edge Cases: Missing or improperly formatted input; large file upload issues; webhook authentication not specified (could be a security risk).  

  - **Respond to Webhook**  
    - Type: Respond to Webhook  
    - Role: Sends an immediate HTTP response back to the requester confirming receipt.  
    - Inputs: From Webhook node.  
    - Outputs: To Extract from File.  

  - **Extract from File**  
    - Type: Extract From File  
    - Role: Parses the uploaded resume file to extract textual content for downstream AI processing.  
    - Config: Likely configured to extract text from PDF or DOCX.  
    - Inputs: From Respond to Webhook.  
    - Outputs: To Set Job Title.  
    - Edge Cases: Unsupported file formats; extraction failures due to encryption or corrupted files.  

  - **Set Job Title**  
    - Type: Set  
    - Role: Extracts and sets the job title variable from the webhook payload or file metadata for use in job board queries.  
    - Inputs: From Extract from File.  
    - Outputs: Fan-out to all job board scraper triggers (Adzuna HTTP request and Apify scrapers).  
    - Edge Cases: Missing or ambiguous job title input.  

  - **4️⃣Get Jobs from Adzuna**  
    - Type: HTTP Request  
    - Role: Fetches job listings from Adzuna API using the job title.  
    - Config: API endpoint, query parameters including job title, pagination, and authentication (not detailed).  
    - Inputs: From Set Job Title.  
    - Outputs: To Itemize List node.  
    - Edge Cases: API rate limits, network errors, invalid API keys, empty responses.  

  - **Apify: Run Indeed Scraper / LinkedIn Scraper / Upwork Scraper / Glassdoor Scraper**  
    - Type: Apify (Third-party scraper integration)  
    - Role: Triggers scraping jobs on Apify platform for respective job boards.  
    - Config: Scraper IDs, input parameters including job title, location, possibly filters.  
    - Inputs: From Set Job Title.  
    - Outputs: Each followed by corresponding “Get Results” nodes.  
    - Edge Cases: Apify service downtime, authentication errors, scraper failures, empty/no results.  

#### 2.2 Job Data Aggregation & Standardization

- **Overview:** This block collects results from all job board scrapers, merges the listings, removes duplicates, and standardizes the data structure for consistent downstream processing.

- **Nodes Involved:**  
  - Apify: Get Indeed Results  
  - Apify: Get LinkedIn Results  
  - Apify: Get Upwork Results  
  - Apify: Get Glassdoor Results  
  - Itemize List  
  - Merge  
  - Filter  
  - Standardize Job Data  
  - Filter Duplicates  
  - Loop Over Items

- **Node Details:**

  - **Apify: Get [Job Board] Results** (Indeed, LinkedIn, Upwork, Glassdoor)  
    - Type: Apify  
    - Role: Retrieves the scraped results from Apify for each job board after scraper run completes.  
    - Inputs: From corresponding scraper run nodes.  
    - Outputs: To Merge node.  
    - Edge Cases: No results returned, partial results, API failures.  

  - **Itemize List**  
    - Type: Split Out  
    - Role: Splits Adzuna API response into individual job items for merging.  
    - Inputs: From 4️⃣Get Jobs from Adzuna node.  
    - Outputs: To Merge node.  

  - **Merge**  
    - Type: Merge  
    - Role: Combines job listings from all sources into a single stream.  
    - Inputs: From all Apify Get Results nodes and Itemize List.  
    - Outputs: To Filter node.  

  - **Filter**  
    - Type: Filter  
    - Role: Applies initial filtering criteria on merged jobs (e.g., location, remote, job type).  
    - Inputs: From Merge.  
    - Outputs: To Standardize Job Data.  
    - Edge Cases: Overly restrictive filters may remove all jobs; misconfiguration.  

  - **Standardize Job Data**  
    - Type: Set  
    - Role: Normalizes job fields into a unified schema (e.g., title, company, location, description).  
    - Inputs: From Filter.  
    - Outputs: To Filter Duplicates.  

  - **Filter Duplicates**  
    - Type: Code  
    - Role: Custom JavaScript code to remove duplicate job listings based on unique identifiers or similarity.  
    - Inputs: From Standardize Job Data.  
    - Outputs: To Loop Over Items.  
    - Edge Cases: False positives/negatives in duplicate detection.  

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Role: Processes jobs in batches to avoid overloading AI calls and enables iterative processing.  
    - Inputs: From Filter Duplicates.  
    - Outputs: Two branches: primary batch output and possibly empty fallback.  

#### 2.3 AI Skill Extraction & Resume Matching

- **Overview:** This block uses AI agents to extract required skills from each job description and compute a relevance score by comparing with the user's resume.

- **Nodes Involved:**  
  - Extract Skills from Job Description  
  - Resume Match Score  
  - OpenRouter Chat Model

- **Node Details:**

  - **Extract Skills from Job Description**  
    - Type: n8n-nodes-langchain.agent (AI agent)  
    - Role: Uses an AI language model to parse job descriptions and extract key skills and qualifications.  
    - Inputs: Batch of jobs from Loop Over Items.  
    - Outputs: To Resume Match Score.  
    - Config: Connected to OpenRouter Chat Model as language model provider.  
    - Edge Cases: AI misinterpretation, rate limiting, API errors.  

  - **Resume Match Score**  
    - Type: n8n-nodes-langchain.agent  
    - Role: Compares extracted job skills to the user's resume content and outputs a match score.  
    - Inputs: From Extract Skills node.  
    - Outputs: To If node (score filter).  
    - Edge Cases: Low confidence scoring, AI API failures.  

  - **OpenRouter Chat Model**  
    - Type: Language Model node  
    - Role: Provides the OpenRouter-based chat model endpoint and credentials used by AI agents for inference.  
    - Inputs: N/A (serves AI agent nodes).  
    - Outputs: Connected as a resource to all AI agent nodes.  
    - Credentials: Requires API key and endpoint configuration.  

#### 2.4 Decision & Resume/Cover Letter Generation

- **Overview:** This block filters jobs by score threshold, rewrites the resume tailored to the job, and generates a personalized cover letter.

- **Nodes Involved:**  
  - 📈 IF Score ≥ 3  
  - Rewrite Resume  
  - 🔥Write Cover Letter

- **Node Details:**

  - **📈 IF Score ≥ 3**  
    - Type: If  
    - Role: Conditional branch to continue only if the resume match score is 3 or higher.  
    - Inputs: From Resume Match Score.  
    - Outputs: True branch to Rewrite Resume, False branch to Loop Over Items (next batch).  
    - Edge Cases: Score missing or non-numeric; false negatives.  

  - **Rewrite Resume**  
    - Type: n8n-nodes-langchain.agent  
    - Role: Uses AI to rewrite or tailor the user's resume based on the job description and skills extracted.  
    - Inputs: From If node’s true branch.  
    - Outputs: To 🔥Write Cover Letter.  
    - Config: Uses OpenRouter Chat Model.  

  - **🔥Write Cover Letter**  
    - Type: n8n-nodes-langchain.agent  
    - Role: Generates a personalized cover letter tailored to the job and rewritten resume.  
    - Inputs: From Rewrite Resume.  
    - Outputs: To Upate sheets node.  
    - Edge Cases: Generation errors or incoherent output.  

#### 2.5 Application Logging & Email Sending

- **Overview:** This block logs applications to Google Sheets, sends emails via Gmail, and handles success/failure feedback loops including failure notification emails.

- **Nodes Involved:**  
  - Upate sheets  
  - 📧Gmail  
  - Check Send Email Success  
  - Send a message if process failed  
  - Loop Over Items (to continue processing remaining jobs)

- **Node Details:**

  - **Upate sheets**  
    - Type: Google Sheets  
    - Role: Appends or updates a row with application details such as job info, application status, timestamps.  
    - Inputs: From 🔥Write Cover Letter.  
    - Outputs: To 📧Gmail.  
    - Config: Requires Google Sheets credentials and target spreadsheet setup.  
    - Edge Cases: API limits, authorization errors, spreadsheet access issues.  

  - **📧Gmail**  
    - Type: Gmail  
    - Role: Sends the job application email with attached cover letter and possibly resume.  
    - Inputs: From Upate sheets.  
    - Outputs: To Check Send Email Success.  
    - Credentials: Requires Gmail OAuth2 credential setup.  
    - Edge Cases: Email send failures, quota exceeded, authentication errors.  

  - **Check Send Email Success**  
    - Type: If  
    - Role: Verifies if email was sent successfully.  
    - Inputs: From Gmail node.  
    - Outputs: True branch loops back to Loop Over Items (to process next job), false branch triggers failure notification.  

  - **Send a message if process failed**  
    - Type: Gmail  
    - Role: Sends an alert email if application email sending failed.  
    - Inputs: From If node false branch.  
    - Outputs: Loops back to Loop Over Items to continue processing.  

  - **Loop Over Items**  
    - Continues processing remaining job items in batches until done.  

---

### 3. Summary Table

| Node Name                      | Node Type                       | Functional Role                                   | Input Node(s)                          | Output Node(s)                          | Sticky Note                                           |
|--------------------------------|--------------------------------|-------------------------------------------------|--------------------------------------|---------------------------------------|-------------------------------------------------------|
| Webhook                        | Webhook                        | Receives external trigger with resume and input | -                                    | Respond to Webhook, Extract from File  |                                                       |
| Respond to Webhook             | Respond to Webhook             | Sends HTTP response to webhook caller            | Webhook                              | Extract from File                     |                                                       |
| Extract from File              | Extract From File              | Extracts text from uploaded resume file          | Respond to Webhook                   | Set Job Title                        |                                                       |
| Set Job Title                  | Set                           | Extracts and sets job title variable              | Extract from File                   | 4️⃣Get Jobs from Adzuna, Apify Run Scrapers |                                                       |
| 4️⃣Get Jobs from Adzuna        | HTTP Request                  | Fetches jobs from Adzuna API                       | Set Job Title                      | Itemize List                        |                                                       |
| Itemize List                  | Split Out                      | Splits Adzuna response into job items             | 4️⃣Get Jobs from Adzuna             | Merge                              |                                                       |
| Apify: Run Indeed Scraper      | Apify                         | Triggers Indeed scraper on Apify                   | Set Job Title                      | Apify: Get Indeed Results            |                                                       |
| Apify: Get Indeed Results      | Apify                         | Retrieves Indeed scrape results                     | Apify: Run Indeed Scraper           | Merge                              |                                                       |
| Apify: Run LinkedIn Scraper    | Apify                         | Triggers LinkedIn scraper on Apify                 | Set Job Title                      | Apify: Get LinkedIn Results          |                                                       |
| Apify: Get LinkedIn Results    | Apify                         | Retrieves LinkedIn scrape results                   | Apify: Run LinkedIn Scraper         | Merge                              |                                                       |
| Apify: Run Upwork Scraper      | Apify                         | Triggers Upwork scraper on Apify                   | Set Job Title                      | Apify: Get Upwork Results            |                                                       |
| Apify: Get Upwork Results      | Apify                         | Retrieves Upwork scrape results                     | Apify: Run Upwork Scraper           | Merge                              |                                                       |
| Apify: Run Glassdoor Scraper   | Apify                         | Triggers Glassdoor scraper on Apify                | Set Job Title                      | Apify: Get Glassdoor Results         |                                                       |
| Apify: Get Glassdoor Results   | Apify                         | Retrieves Glassdoor scrape results                  | Apify: Run Glassdoor Scraper        | Merge                              |                                                       |
| Merge                         | Merge                         | Combines all job listings from different sources   | Itemize List, Apify Get Results nodes | Filter                            |                                                       |
| Filter                        | Filter                        | Applies initial filters on combined job listings   | Merge                              | Standardize Job Data                |                                                       |
| Standardize Job Data          | Set                           | Normalizes job fields to a unified format          | Filter                             | Filter Duplicates                  |                                                       |
| Filter Duplicates             | Code                          | Removes duplicate job listings                       | Standardize Job Data               | Loop Over Items                   |                                                       |
| Loop Over Items               | Split In Batches              | Processes jobs in batches for AI processing         | Filter Duplicates                 | Extract Skills from Job Description (branch) |                                                       |
| Extract Skills from Job Description | n8n-nodes-langchain.agent | Extracts key skills from job descriptions           | Loop Over Items                   | Resume Match Score                |                                                       |
| Resume Match Score            | n8n-nodes-langchain.agent     | Scores resume match against job skills              | Extract Skills from Job Description | 📈 IF Score ≥ 3                  |                                                       |
| 📈 IF Score ≥ 3               | If                            | Filters jobs with score ≥ 3                           | Resume Match Score                | Rewrite Resume (true), Loop Over Items (false) |                                                       |
| Rewrite Resume               | n8n-nodes-langchain.agent     | AI rewrites resume tailored to job                    | 📈 IF Score ≥ 3                  | 🔥Write Cover Letter             |                                                       |
| 🔥Write Cover Letter          | n8n-nodes-langchain.agent     | Generates personalized cover letter                    | Rewrite Resume                   | Upate sheets                    |                                                       |
| Upate sheets                  | Google Sheets                 | Logs application data in Google Sheets                | 🔥Write Cover Letter             | 📧Gmail                        |                                                       |
| 📧Gmail                       | Gmail                        | Sends job application email                             | Upate sheets                    | Check Send Email Success         |                                                       |
| Check Send Email Success      | If                            | Checks email send success, loops or triggers failure  | 📧Gmail                        | Loop Over Items (true), Send a message if process failed (false) |                                                       |
| Send a message if process failed | Gmail                    | Sends failure notification email                       | Check Send Email Success         | Loop Over Items                |                                                       |
| OpenRouter Chat Model         | Language Model               | Provides AI model endpoint and credentials             | N/A                            | Connected to all AI agent nodes   |                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Configure HTTP Method: POST  
   - Expect multipart/form-data including resume file and job title parameters.  
   - Save the webhook URL for external triggering.

2. **Add Respond to Webhook Node**  
   - Connect Webhook output to Respond to Webhook input.  
   - Configure a simple acknowledgment response (e.g., status 200 and message “Received”).

3. **Add Extract From File Node**  
   - Connect Respond to Webhook output to Extract from File input.  
   - Configure to extract text from common resume file types (PDF, DOCX).  
   - No credential required.

4. **Add Set Node (Set Job Title)**  
   - Connect Extract from File output to Set node input.  
   - Configure to extract and set a variable `jobTitle` from webhook data or file metadata.

5. **Add HTTP Request Node (4️⃣Get Jobs from Adzuna)**  
   - Connect Set Job Title output to this node.  
   - Configure HTTP Request:  
     - Method: GET  
     - URL: Adzuna API endpoint for job search  
     - Query parameters: Use expression to insert `jobTitle`  
     - Authentication: Set up API key credential for Adzuna.  

6. **Add Split Out (Itemize List) Node**  
   - Connect 4️⃣Get Jobs from Adzuna output to Itemize List input.  
   - Configure to split the job listings array from Adzuna response.

7. **Add Apify Run Scraper Nodes for Indeed, LinkedIn, Upwork, Glassdoor**  
   - For each:  
     - Connect Set Job Title output.  
     - Configure with correct Apify scraper IDs.  
     - Set input parameters including `jobTitle`.  
     - Ensure Apify credentials are configured.

8. **Add Apify Get Results Nodes for each scraper**  
   - Connect each Run Scraper node output to corresponding Get Results node.  
   - Configure to retrieve scraping results.

9. **Add Merge Node**  
   - Connect outputs of all Get Results nodes + Itemize List node to Merge node inputs.  
   - Configure Merge mode to “Wait for All Inputs.”

10. **Add Filter Node**  
    - Connect Merge output to Filter node.  
    - Configure filter criteria to exclude unwanted jobs (e.g., location, job type).

11. **Add Set Node (Standardize Job Data)**  
    - Connect Filter output to this node.  
    - Configure to map job fields (title, company, description...) into a uniform schema.

12. **Add Code Node (Filter Duplicates)**  
    - Connect Standardize Job Data output to this node.  
    - Insert JavaScript logic to remove duplicate job listings based on unique job ID or title+company.

13. **Add Split In Batches Node (Loop Over Items)**  
    - Connect Filter Duplicates output.  
    - Configure batch size (e.g., 5) to process jobs in chunks.

14. **Set up OpenRouter Chat Model Node**  
    - Add OpenRouter Chat Model node with API key and endpoint credentials.  
    - This node will be referenced by AI agent nodes.

15. **Add AI Agent Node (Extract Skills from Job Description)**  
    - Connect Loop Over Items output to this node.  
    - Configure prompt to extract skills from job descriptions.  
    - Set OpenRouter Chat Model as the language model.  

16. **Add AI Agent Node (Resume Match Score)**  
    - Connect Extract Skills node output.  
    - Configure to compare extracted skills with resume text and output a numeric match score.  

17. **Add If Node (📈 IF Score ≥ 3)**  
    - Connect Resume Match Score output.  
    - Condition: match score ≥ 3.  
    - True branch connects to Rewrite Resume node; False branch feeds back to Loop Over Items.

18. **Add AI Agent Node (Rewrite Resume)**  
    - Connect If node true output.  
    - Configure prompt to rewrite resume tailored to job description and extracted skills.  

19. **Add AI Agent Node (🔥Write Cover Letter)**  
    - Connect Rewrite Resume output.  
    - Configure prompt to generate personalized cover letter using rewritten resume and job data.  

20. **Add Google Sheets Node (Upate sheets)**  
    - Connect Write Cover Letter output.  
    - Set action to append or update rows in target spreadsheet.  
    - Configure Google Sheets credentials and spreadsheet ID.

21. **Add Gmail Node (📧Gmail)**  
    - Connect Upate sheets output.  
    - Configure email content including cover letter, attachments if needed.  
    - Use Gmail OAuth2 credentials.

22. **Add If Node (Check Send Email Success)**  
    - Connect Gmail output.  
    - Check success of email sending.  
    - True branch loops back to Loop Over Items for next batch.  
    - False branch connects to failure notification node.

23. **Add Gmail Node (Send a message if process failed)**  
    - Connect from If node false branch.  
    - Configure to send alert email for failure.  
    - Output loops back to Loop Over Items.

24. **Add Sticky Notes**  
    - Place informational sticky notes as needed for user guidance.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow uses Apify scrapers; ensure your Apify account has access to the required scrapers. | Apify platform: https://apify.com/                                                              |
| AI language model is powered via OpenRouter Chat Model; requires OpenRouter API key setup.    | OpenRouter: https://openrouter.ai/                                                              |
| Google Sheets and Gmail nodes require OAuth2 credentials configured in n8n credentials manager. | n8n OAuth2 docs: https://docs.n8n.io/credentials/oauth2/                                        |
| The webhook input must be secured appropriately as no explicit authentication is configured. | Consider adding authentication or IP restrictions on the webhook for production use.            |
| The workflow is designed to handle batch processing to avoid API rate limits and improve stability. | Batch size in Loop Over Items can be tuned in node parameters.                                  |
| For resume extraction, supported file formats depend on the Extract From File node capabilities. | Supported formats include PDF and DOCX; encrypted or scanned PDFs may fail extraction.          |
| Sticky notes in the workflow serve as placeholders and may be used to add comments or instructions. | Sticky notes do not affect workflow logic but help documentation and maintenance.               |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.