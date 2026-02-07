AI-Powered Automated Job Search & Application 

https://n8nworkflows.xyz/workflows/ai-powered-automated-job-search---application--6391


# AI-Powered Automated Job Search & Application 

### 1. Workflow Overview

This workflow automates the process of job searching and application preparation using AI, integrating job data retrieval from the Adzuna API, resume analysis, tailored resume rewriting, cover letter generation, and final email delivery. The core objective is to receive a job search keyword, find relevant jobs, analyze job descriptions and a user’s resume, optimize the resume for the job, generate a personalized cover letter, update a Google Sheet database, and send the final documents via email.

The workflow’s logical blocks are:

- **1.1 Input Reception:** Receiving user input and resume file upload via a webhook.
- **1.2 Job Data Retrieval:** Querying the Adzuna job API for relevant job listings using the user-provided keyword.
- **1.3 Job Data Processing & Filtering:** Splitting multiple job results, removing duplicates, and extracting key job information.
- **1.4 AI-driven Job Analysis & Resume Matching:** Using AI to extract required skills from job descriptions and score the fit between the user’s resume and job requirements.
- **1.5 Conditional Resume Personalization:** If the resume-job fit score is sufficient, rewriting the resume to tailor it to the job.
- **1.6 AI-generated Cover Letter:** Creating a personalized, ATS-optimized cover letter based on the tailored resume and job description.
- **1.7 Data Update & Communication:** Updating job application data in Google Sheets, sending the cover letter and tailored resume by email, and responding to the webhook with a summary.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Receives the user’s job search keyword and resume file via a webhook HTTP POST request.

**Nodes Involved:**  
- Webhook  
- Extract from File

**Node Details:**  

- **Webhook**  
  - *Type:* Webhook (HTTP POST listener)  
  - *Configuration:* Path `jobmonkeyadzuna`, expects POST with JSON body containing `jobSearchKeyword` and `email`; also accepts a binary property `data` for resume file.  
  - *Input:* External HTTP POST  
  - *Output:* JSON with user input and binary resume file  
  - *Failures:* Missing or malformed request body, large file upload issues, webhook ID configuration errors.

- **Extract from File**  
  - *Type:* File extraction (PDF text extraction)  
  - *Configuration:* Extract text from PDF binary data under property `data0` (mapped from webhook).  
  - *Input:* Binary file from webhook  
  - *Output:* Extracted text of resume in JSON format `text` field.  
  - *Failures:* Unsupported file type, corrupted PDF, large file exceeding memory limits.

---

#### 1.2 Job Data Retrieval

**Overview:**  
Sets the job title extracted from user input and queries Adzuna API to fetch job listings matching that title.

**Nodes Involved:**  
- 3️⃣Set Job Title  
- 4️⃣Get Jobs from Adzuna

**Node Details:**  

- **3️⃣Set Job Title**  
  - *Type:* Set node to define variables  
  - *Config:* Sets `job_title` string from webhook JSON `jobSearchKeyword`.  
  - *Input:* JSON from Extract from File  
  - *Output:* JSON with `job_title` assigned.  
  - *Failures:* Missing keyword in input; expression evaluation errors.

- **4️⃣Get Jobs from Adzuna**  
  - *Type:* HTTP Request  
  - *Config:* GET request to Adzuna API endpoint with app ID/key placeholders, results per page 20, and query parameter `what` set to the `job_title`.  
  - *Input:* JSON containing `job_title`  
  - *Output:* JSON array of job listings under `results`.  
  - *Failures:* API authentication errors (invalid or missing keys), network timeout, rate limiting, malformed responses.

---

#### 1.3 Job Data Processing & Filtering

**Overview:**  
Splits the fetched job listings array into individual jobs, filters duplicates, and extracts relevant job info for further processing.

**Nodes Involved:**  
- 📤 Split Jobs  
- Filter Duplicates  
- 🧪 Extract Job Info

**Node Details:**  

- **📤 Split Jobs**  
  - *Type:* Split Out node  
  - *Config:* Splits the `results` array field into multiple items, each representing one job.  
  - *Input:* Job listings JSON from Adzuna API  
  - *Output:* Individual job JSON objects.  
  - *Failures:* Missing or empty `results` field.

- **Filter Duplicates**  
  - *Type:* Code node (JavaScript)  
  - *Config:* Filters out duplicate jobs by creating a unique key combining job title, company name, and the first 100 characters of the job description.  
  - *Input:* Individual job items  
  - *Output:* Filtered unique job items  
  - *Failures:* Unexpected JSON structure; null or missing fields causing key construction errors.

- **🧪 Extract Job Info**  
  - *Type:* Set node  
  - *Config:* Extracts and assigns key properties: `job_description`, `job_url`, `job_title`, `company` from each job item.  
  - *Input:* Filtered unique jobs  
  - *Output:* Simplified job info JSON for AI processing  
  - *Failures:* Missing properties in job JSON.

---

#### 1.4 AI-driven Job Analysis & Resume Matching

**Overview:**  
Uses AI models to extract top skills from the job description and evaluate how well the user’s resume matches those skills, outputting a fit score.

**Nodes Involved:**  
- OpenRouter Chat Model (initial)  
- 7️⃣Extract Skills from Job Description  
- OpenRouter Chat Model1  
- 9️⃣Resume Match Score

**Node Details:**  

- **OpenRouter Chat Model**  
  - *Type:* Langchain OpenRouter AI Chat model  
  - *Config:* Model `deepseek/deepseek-r1`, used to assist skill extraction.  
  - *Input:* Job description text from 🧪 Extract Job Info  
  - *Output:* AI response with extracted skills as JSON array  
  - *Credentials:* OpenRouter API key required  
  - *Failures:* API auth errors, model timeout, malformed output.

- **7️⃣Extract Skills from Job Description**  
  - *Type:* Langchain Agent node  
  - *Config:* Prompt instructs AI to return top skills/qualifications as JSON array from job description text.  
  - *Input:* Job description text  
  - *Output:* JSON array of skills  
  - *Failures:* AI output parsing errors, empty input.

- **OpenRouter Chat Model1**  
  - *Type:* Langchain OpenRouter AI Chat model  
  - *Config:* Same model, used as input to resume scoring.  
  - *Input:* Skills extracted from previous step  
  - *Output:* AI prompt for scoring resume fit.  
  - *Failures:* As above.

- **9️⃣Resume Match Score**  
  - *Type:* Langchain Agent  
  - *Config:* AI evaluates how well the extracted resume text matches required skills, returning a strict score JSON between 1 and 5.  
  - *Input:* Resume text (from Extract from File) and job skills  
  - *Output:* JSON `{ "score": "1-5" }`  
  - *Failures:* AI misinterpretation, invalid JSON output.

---

#### 1.5 Conditional Resume Personalization

**Overview:**  
If the AI match score is 2 or above (greater than 1), the workflow rewrites the resume to better suit the job description’s skill requirements.

**Nodes Involved:**  
- 📈 IF Score ≥ 3  
- 8️⃣Rewrite Resume  
- OpenRouter Chat Model2

**Node Details:**  

- **📈 IF Score ≥ 3**  
  - *Type:* IF node  
  - *Config:* Checks if the parsed resume match score is greater than 1 (corresponds to score ≥2), directing flow accordingly.  
  - *Input:* JSON score from 9️⃣Resume Match Score  
  - *Output:* True branch leads to resume rewriting; false branch ends or skips rewriting.  
  - *Failures:* Parsing errors on score, expression evaluation issues.

- **8️⃣Rewrite Resume**  
  - *Type:* Langchain Agent  
  - *Config:* Instructs AI to rewrite the resume text emphasizing skills relevant to the job title and company. Output is structured JSON resume with standard fields (name, contact, education, experience, skills, certifications, summary). ATS-friendly and human-readable formatting is requested.  
  - *Input:* Original resume text and extracted job info  
  - *Output:* Optimized resume JSON and HTML for email output  
  - *Failures:* AI generation errors, incomplete fields, JSON parsing.

- **OpenRouter Chat Model2**  
  - *Type:* Langchain OpenRouter AI Chat model  
  - *Config:* Underlying AI model supporting the resume rewrite step.  
  - *Input:* From IF node true branch  
  - *Output:* Processed resume rewrite prompt/response  
  - *Failures:* API errors, timeouts.

---

#### 1.6 AI-generated Cover Letter

**Overview:**  
Generates a personalized, ATS-optimized cover letter based on the tailored resume and job description.

**Nodes Involved:**  
- 🔥Write Cover Letter  
- OpenRouter Chat Model3

**Node Details:**  

- **🔥Write Cover Letter**  
  - *Type:* Langchain Agent  
  - *Config:* Instructs AI to compose a cover letter matching the tailored resume to the specific job title and company. The output is requested as well-formatted HTML for human reading and ATS optimization.  
  - *Input:* Tailored resume JSON and job description text  
  - *Output:* HTML cover letter content  
  - *Failures:* AI output formatting errors, missing data.

- **OpenRouter Chat Model3**  
  - *Type:* Langchain OpenRouter AI Chat model  
  - *Config:* Model `deepseek/deepseek-r1:free` supporting cover letter generation.  
  - *Input:* Tailored resume and job info  
  - *Output:* Cover letter generation prompt/response  
  - *Failures:* API limits, auth issues.

---

#### 1.7 Data Update & Communication

**Overview:**  
Appends or updates job application data in a Google Sheet, sends the cover letter and tailored resume to the user via Gmail, and responds to the original webhook caller with a summary.

**Nodes Involved:**  
- Upate sheets  
- 📧Gmail  
- Respond to Webhook

**Node Details:**  

- **Upate sheets**  
  - *Type:* Google Sheets node  
  - *Config:* Appends or updates a row in a specified Google Sheet using defined columns such as `status`, `job_url`, `cover_letter`, `tailored_resume`, `job_title`, etc. Matching done on `status` column.  
  - *Input:* Cover letter HTML, tailored resume, job info  
  - *Output:* Confirmation JSON of update  
  - *Credentials:* Google Sheets OAuth2 required  
  - *Failures:* Permission denied, sheet not found, column mismatch.

- **📧Gmail**  
  - *Type:* Gmail node (sending email)  
  - *Config:* Sends an email to the user’s email from webhook body, with subject indicating the job title. The message body includes HTML-formatted cover letter and tailored resume, plus instructions and job posting link.  
  - *Input:* Data from Google Sheets update and job info  
  - *Credentials:* Gmail OAuth2 required  
  - *Failures:* SMTP auth errors, sending quota limits.

- **Respond to Webhook**  
  - *Type:* Respond to Webhook (HTTP Response)  
  - *Config:* Returns a formatted HTML/text response to the webhook POST caller summarizing the cover letter and tailored resume, plus next steps and job posting URL.  
  - *Input:* Data from Google Sheets update and job info  
  - *Output:* HTTP response to original caller  
  - *Failures:* Response timeout, expression evaluation errors.

---

### 3. Summary Table

| Node Name                | Node Type                            | Functional Role                                | Input Node(s)              | Output Node(s)           | Sticky Note                                                                                          |
|--------------------------|------------------------------------|-----------------------------------------------|----------------------------|--------------------------|----------------------------------------------------------------------------------------------------|
| Webhook                  | Webhook                            | Receive user job keyword and resume file      | -                          | Extract from File         |                                                                                                    |
| Extract from File         | Extract from File                  | Extract text from uploaded resume PDF         | Webhook                    | 3️⃣Set Job Title          |                                                                                                    |
| 3️⃣Set Job Title           | Set                               | Set job_title variable from webhook input     | Extract from File           | 4️⃣Get Jobs from Adzuna   |                                                                                                    |
| 4️⃣Get Jobs from Adzuna     | HTTP Request                      | Query Adzuna API for jobs matching job_title | 3️⃣Set Job Title            | 📤 Split Jobs             |                                                                                                    |
| 📤 Split Jobs              | Split Out                        | Split array of jobs into individual items     | 4️⃣Get Jobs from Adzuna     | Filter Duplicates         |                                                                                                    |
| Filter Duplicates         | Code                              | Remove duplicate job entries                   | 📤 Split Jobs               | 🧪 Extract Job Info       |                                                                                                    |
| 🧪 Extract Job Info         | Set                               | Extract key job info fields from job item     | Filter Duplicates           | 7️⃣Extract Skills from Job Description |                                                                                                    |
| OpenRouter Chat Model     | Langchain AI Chat Model            | Support skill extraction AI                     | 🧪 Extract Job Info         | 7️⃣Extract Skills from Job Description |                                                                                                    |
| 7️⃣Extract Skills from Job Description | Langchain Agent               | Extract top skills from job description         | 🧪 Extract Job Info + OpenRouter Chat Model | 9️⃣Resume Match Score     | Sticky Note3: "Step 1:Retrieve Job Data from adzuna.com Via API"                                  |
| OpenRouter Chat Model1    | Langchain AI Chat Model            | Support resume match scoring AI                 | 7️⃣Extract Skills from Job Description | 9️⃣Resume Match Score     |                                                                                                    |
| 9️⃣Resume Match Score       | Langchain Agent                   | Score how well resume fits job skills            | OpenRouter Chat Model1      | 📈 IF Score ≥ 3           | Sticky Note2: "Step 2: Analyze Job, Match Resume to Job and Write a Customized Resume for the New Job" |
| 📈 IF Score ≥ 3            | IF                                | Check if score ≥ 2 to proceed with rewriting    | 9️⃣Resume Match Score       | 8️⃣Rewrite Resume (true)  |                                                                                                    |
| 8️⃣Rewrite Resume           | Langchain Agent                   | Rewrite resume tailored to job                  | 📈 IF Score ≥ 3             | 🔥Write Cover Letter      |                                                                                                    |
| OpenRouter Chat Model2    | Langchain AI Chat Model            | Support resume rewriting AI                      | 📈 IF Score ≥ 3             | 8️⃣Rewrite Resume         |                                                                                                    |
| 🔥Write Cover Letter        | Langchain Agent                   | Generate personalized cover letter              | 8️⃣Rewrite Resume           | Upate sheets              |                                                                                                    |
| OpenRouter Chat Model3    | Langchain AI Chat Model            | Support cover letter generation AI               | 🔥Write Cover Letter        | Upate sheets              |                                                                                                    |
| Upate sheets              | Google Sheets                     | Append/update job application data              | 🔥Write Cover Letter        | 📧Gmail                   |                                                                                                    |
| 📧Gmail                    | Gmail                             | Send cover letter and tailored resume email    | Upate sheets                | Respond to Webhook        |                                                                                                    |
| Respond to Webhook        | Respond to Webhook                | Respond to webhook caller with summary          | 📧Gmail                    | -                        |                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `jobmonkeyadzuna`  
   - Accepts JSON body with keys `jobSearchKeyword`, `email` and binary file under property `data` (resume upload).  
   - Configure response mode to respond via a response node.

2. **Add Extract from File Node**  
   - Type: Extract from File  
   - Operation: PDF text extraction  
   - Binary Property Name: `data0` (mapped from webhook’s binary `data`)  
   - Connect Webhook → Extract from File.

3. **Add Set Node: 3️⃣Set Job Title**  
   - Assign variable `job_title` as expression: `{{$json["body"]["jobSearchKeyword"]}}` from webhook input.  
   - Connect Extract from File → 3️⃣Set Job Title.

4. **Add HTTP Request Node: 4️⃣Get Jobs from Adzuna**  
   - Method: GET  
   - URL:  
     ```
     https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=YOUR_ADZUNA_APP_ID&app_key=YOUR_ADZUNA_APP_KEY&results_per_page=20&what={{$json.job_title}}
     ```  
   - Replace `YOUR_ADZUNA_APP_ID` and `YOUR_ADZUNA_APP_KEY` with valid credentials.  
   - Connect 3️⃣Set Job Title → 4️⃣Get Jobs from Adzuna.

5. **Add Split Out Node: 📤 Split Jobs**  
   - Field To Split Out: `results` (array of jobs)  
   - Connect 4️⃣Get Jobs from Adzuna → 📤 Split Jobs.

6. **Add Code Node: Filter Duplicates**  
   - JavaScript code filters duplicates by unique key of title, company, and job description snippet.  
   - Connect 📤 Split Jobs → Filter Duplicates.

7. **Add Set Node: 🧪 Extract Job Info**  
   - Assign fields:  
     - `job_description` = `{{$json.description}}`  
     - `job_url` = `{{$json.redirect_url}}`  
     - `job_title` = `{{$json.title}}`  
     - `company` = `{{$json.company.display_name}}`  
   - Connect Filter Duplicates → 🧪 Extract Job Info.

8. **Add Langchain OpenRouter Chat Model Node (OpenRouter Chat Model)**  
   - Model: `deepseek/deepseek-r1`  
   - Add OpenRouter API credentials.  
   - Connect 🧪 Extract Job Info → OpenRouter Chat Model (as AI model input).

9. **Add Langchain Agent Node: 7️⃣Extract Skills from Job Description**  
   - Prompt: "Extracts the top skills and qualifications from this job description: {{job_description}}"  
   - System message: "You're an AI expert that extracts the top skills and qualifications from a job description. Return as JSON array."  
   - Connect 🧪 Extract Job Info → 7️⃣Extract Skills from Job Description.  
   - Connect OpenRouter Chat Model → 7️⃣Extract Skills from Job Description (AI language model input).

10. **Add Langchain OpenRouter Chat Model Node (OpenRouter Chat Model1)**  
    - Same model/config as step 8.  
    - Connect 7️⃣Extract Skills from Job Description → OpenRouter Chat Model1.

11. **Add Langchain Agent Node: 9️⃣Resume Match Score**  
    - Prompt: Evaluate match between resume text (from Extract from File) and job skills (from 7️⃣Extract Skills). Output JSON score 1-5.  
    - System message: AI assistant expert for resume-job fit evaluation.  
    - Connect OpenRouter Chat Model1 → 9️⃣Resume Match Score.  
    - Connect Extract from File → 9️⃣Resume Match Score (resume text input).

12. **Add IF Node: 📈 IF Score ≥ 3**  
    - Expression condition: `JSON.parse($json.output).score.toNumber() > 1`  
    - Connect 9️⃣Resume Match Score → 📈 IF Score ≥ 3.

13. **Add Langchain OpenRouter Chat Model Node (OpenRouter Chat Model2)**  
    - Model same as prior AI nodes.  
    - Connect 📈 IF Score ≥ 3 (true branch) → OpenRouter Chat Model2.

14. **Add Langchain Agent Node: 8️⃣Rewrite Resume**  
    - Prompt: Rewrite resume emphasizing skills for job title and company, output as structured JSON with specified fields, ATS-optimized and human-readable.  
    - System message: Expert resume optimizer instructions provided.  
    - Connect OpenRouter Chat Model2 → 8️⃣Rewrite Resume.

15. **Add Langchain OpenRouter Chat Model Node (OpenRouter Chat Model3)**  
    - Model: `deepseek/deepseek-r1:free`  
    - Connect 8️⃣Rewrite Resume → OpenRouter Chat Model3.

16. **Add Langchain Agent Node: 🔥Write Cover Letter**  
    - Prompt: Write cover letter based on tailored resume and job description, formatted as HTML, ATS-optimized.  
    - System message: AI that writes personalized cover letters.  
    - Connect OpenRouter Chat Model3 → 🔥Write Cover Letter.

17. **Add Google Sheets Node: Upate sheets**  
    - Operation: Append or update  
    - Document ID and Sheet Name: fill with your Google Sheets details  
    - Map columns: status = "draft", job_url, cover_letter, tailored_resume, job_title, job_description, company, resume, email  
    - Matching Column: status  
    - Connect 🔥Write Cover Letter → Upate sheets.  
    - Configure Google Sheets OAuth2 credentials.

18. **Add Gmail Node: 📧Gmail**  
    - SendTo: `{{$json.email}}` from webhook input  
    - Subject: `Job Application for {{job_title}}`  
    - Message: HTML formatted with cover letter, tailored resume, job info, and instructions.  
    - Connect Upate sheets → 📧Gmail.  
    - Configure Gmail OAuth2 credentials.

19. **Add Respond to Webhook Node**  
    - Response body: summary text with cover letter, tailored resume, job title, company, and job posting URL.  
    - Response headers: Content-Type `text/html`  
    - Connect 📧Gmail → Respond to Webhook.

20. **Connect Webhook Node’s main output to Extract from File** and ensure all intermediate nodes are connected as above.

---

### 5. General Notes & Resources

| Note Content                                                                                                 | Context or Link                                                  |
|--------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Step 1: Retrieve Job Data from adzuna.com Via API                                                           | Sticky Note on nodes: 7️⃣Extract Skills from Job Description    |
| Step 2: Analyze Job, Match Resume to Job and Write a Customized Resume for the New Job                        | Sticky Note on nodes: 9️⃣Resume Match Score and after           |
| OpenRouter API credentials required for all Langchain OpenRouter AI nodes                                    | Obtain from https://openrouter.ai/                               |
| Google Sheets OAuth2 and Gmail OAuth2 credentials must be properly configured with required scopes           | Google Developer Console                                         |
| The workflow expects the resume upload as a PDF file via webhook, with the binary property named `data`      | Webhook node configuration                                      |
| Job search API credentials (Adzuna app ID and key) must be placed in the HTTP Request node URL               | https://developer.adzuna.com/                                    |
| AI prompt instructions in Langchain Agent nodes are critical for output quality and format, do not alter lightly | Customize carefully if modifying AI behavior                     |
| ATS (Applicant Tracking System) optimization principles are embedded in resume rewriting and cover letter generation | Important for practical job application success                  |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.