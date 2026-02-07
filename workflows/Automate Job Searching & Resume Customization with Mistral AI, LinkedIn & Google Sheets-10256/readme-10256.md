Automate Job Searching & Resume Customization with Mistral AI, LinkedIn & Google Sheets

https://n8nworkflows.xyz/workflows/automate-job-searching---resume-customization-with-mistral-ai--linkedin---google-sheets-10256


# Automate Job Searching & Resume Customization with Mistral AI, LinkedIn & Google Sheets

### 1. Workflow Overview

This workflow automates the job search and resume customization process by integrating LinkedIn job scraping, AI-powered resume analysis, job matching, cover letter generation, and Google Sheets tracking. It aims to streamline and personalize job application efforts, making it suitable for proactive job seekers who want AI-driven insights and continuous monitoring of new job opportunities.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Resume Preparation**: Trigger and fetch the user’s resume from Google Drive, extract text, and analyze it to define job target keywords and preferences.
- **1.2 LinkedIn Job Search URL Construction**: Generate LinkedIn job search URLs dynamically for multiple job title keywords based on the resume analysis.
- **1.3 Job Scraping & Filtering**: Retrieve job postings from LinkedIn via HTTP requests, parse job details, and filter out previously seen jobs using Google Sheets.
- **1.4 Job & Resume Matching with AI**: For each filtered job, analyze the job description and compare it with the resume using Mistral AI agents to compute match scores, generate tailored cover letters, and suggest resume improvements.
- **1.5 Data Storage & Aggregation**: Append or update job match results and analytics in a Google Sheet for tracking and future reference.
- **1.6 Daily Digest Email Notification**: Compile top 5 job matches and send a personalized email summary to the user with actionable insights and links.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Resume Preparation

- **Overview:**  
  This block starts the workflow with a scheduled trigger, downloads the user’s resume PDF from Google Drive, extracts its text content, and runs an AI agent to analyze the resume to identify primary and alternate job titles, location, experience level, and remote work preferences.

- **Nodes Involved:**  
  - Schedule Trigger1  
  - Download Resume1  
  - Extract from Resume1  
  - Resume Breakdown1  

- **Node Details:**

  - **Schedule Trigger1**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow daily at 12:45 PM.  
    - Config: Fires once per day at a fixed time.  
    - Input/Output: No input; triggers Download Resume1.  
    - Edge Cases: Missed trigger if n8n instance offline.  

  - **Download Resume1**  
    - Type: Google Drive  
    - Role: Downloads resume PDF from specified Google Drive file ID/URL.  
    - Config: Requires valid Google Drive OAuth2 credentials and file ID.  
    - Input: Trigger from Schedule Trigger1.  
    - Output: Binary PDF file passed to Extract from Resume1.  
    - Edge Cases: Invalid file ID, permission issues, file missing.  

  - **Extract from Resume1**  
    - Type: Extract from File  
    - Role: Extracts text content from the PDF resume.  
    - Config: Operation set to PDF extraction.  
    - Input: Binary PDF from Download Resume1.  
    - Output: JSON with extracted text under field `text`.  
    - Edge Cases: Poorly scanned PDFs may yield incomplete or inaccurate text.  

  - **Resume Breakdown1**  
    - Type: LangChain Agent (Mistral AI)  
    - Role: Parses extracted resume text to identify key job search parameters: main job title, alternate titles, desired location, experience level, and remote work preference.  
    - Config: Uses a defined prompt focused on extracting these attributes from resume text.  
    - Input: Extracted text from Extract from Resume1.  
    - Output: Structured JSON with fields like keyword, alternatekeyword, location, experiencelevel, remote, etc.  
    - Edge Cases: Ambiguous or incomplete resumes may lead to inaccurate keyword extraction.  
    - Version Specifics: Uses Mistral Cloud Chat Model (small) as language model backend.

---

#### 1.2 LinkedIn Job Search URL Construction

- **Overview:**  
  Constructs LinkedIn job search URLs dynamically for the main and alternate job titles identified by Resume Breakdown1, encoding search filters like location, experience level, and remote options.

- **Nodes Involved:**  
  - LinkedIn Search URL  
  - LinkedIn Search URL5  
  - LinkedIn Search URL6  
  - LinkedIn Search URL7  

- **Node Details:**

  - **LinkedIn Search URL** (and variants 5,6,7)  
    - Type: Code (JavaScript)  
    - Role: Build LinkedIn job search URLs for up to four job titles (primary + 3 alternates).  
    - Config: Uses inputs from Resume Breakdown1 outputs (`keyword`, `alternatekeyword`, `alternatekeyword1`, `alternatekeyword2`) plus location, experience level, and remote work flags.  
    - Logic:  
      - Base URL includes filter for jobs posted in last 24 hours (`f_TPR=r86400`).  
      - Experience levels mapped to LinkedIn codes (Internship=1, Entry=2, Associate=3, Mid-Senior=4, Director=5, Executive=6).  
      - Remote options mapped similarly (On-Site=1, Remote=2, Hybrid=3).  
      - Keywords and location URL-encoded and appended as query parameters.  
    - Output: JSON object with constructed `url` field.  
    - Input: JSON from Resume Breakdown1.  
    - Output: URL passed to respective HTTP Request nodes.  
    - Edge Cases: Empty or missing fields result in simpler URLs; incorrect mapping may result in empty or invalid links.

---

#### 1.3 Job Scraping & Filtering

- **Overview:**  
  This block fetches job postings from LinkedIn using the generated URLs, extracts job links and details via HTML parsing, filters out jobs already present in the tracking Google Sheet to avoid duplicates, and prepares the new job postings for AI matching.

- **Nodes Involved:**  
  - Fetch jobs from LinkedIn (4 variants)  
  - Merge  
  - HTML3  
  - Split Out  
  - Loop Over Items3  
  - Compare Datasets1  

- **Node Details:**

  - **Fetch jobs from LinkedIn / LinkedIn3 / Linkedin / LinkedIn5**  
    - Type: HTTP Request  
    - Role: Retrieve HTML content from LinkedIn job search URLs.  
    - Config: Uses URLs calculated by LinkedIn Search URL nodes. Retry enabled with 3-second wait.  
    - Input: URLs from LinkedIn Search URL nodes.  
    - Output: HTML page content.  
    - Edge Cases: Rate limiting, request failures, LinkedIn UI changes affecting scraping.  

  - **Merge**  
    - Type: Merge  
    - Role: Combine results from the four LinkedIn HTTP requests into one dataset.  
    - Input: Multiple HTTP request outputs.  
    - Output: Unified dataset sent to HTML3.  

  - **HTML3**  
    - Type: HTML Extract  
    - Role: Extract job posting links from the merged LinkedIn HTML pages using CSS selectors targeting job cards.  
    - Config: Extracts `href` attributes of anchor tags within job result lists.  
    - Output: Array of job URLs under the key `jobs`.  

  - **Split Out**  
    - Type: Split Out  
    - Role: Splits the array of job URLs into individual items for batch processing.  
    - Output: Each job URL as a separate item.  

  - **Loop Over Items3**  
    - Type: Split In Batches  
    - Role: Processes job URLs in batches for controlled execution, preventing overload.  
    - Output: Each job URL batch proceeds through filtering and detail fetching.  

  - **Compare Datasets1**  
    - Type: Compare Datasets  
    - Role: Compares newly scraped job URLs against URLs already in the Google Sheet to exclude duplicates.  
    - Config: Fuzzy matching enabled on "Link" and "Apply Link" fields.  
    - Output: Filtered jobs that are new or updated, forwarded to Loop Over Items for AI matching.  
    - Edge Cases: False positives/negatives in fuzzy matching may cause missed or duplicate jobs.

---

#### 1.4 Job & Resume Matching with AI

- **Overview:**  
  For each filtered new job posting, this block fetches detailed job description HTML, extracts structured job info, and uses AI agents to analyze the job against the resume. It calculates match scores, generates a tailored cover letter, and suggests concrete resume improvements.

- **Nodes Involved:**  
  - Loop Over Items  
  - Get row(s) in sheet1  
  - Job Matching AI Agent1  
  - Edit Fields3  
  - Resume Analysis AI Agent1  
  - Mistral Cloud Chat Model4  

- **Node Details:**

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Role: Processes each new job posting individually in a controlled batch mode.  
    - Input: Filtered job URLs from Compare Datasets1.  
    - Output: Each job item processed through AI agents.  

  - **Get row(s) in sheet1**  
    - Type: Google Sheets  
    - Role: Reads existing job tracking data from Google Sheet for comparison and sorting.  
    - Input: Triggered per job batch.  
    - Output: Current job tracking data for merging and sorting.  

  - **Job Matching AI Agent1**  
    - Type: LangChain Agent / Mistral AI (large model)  
    - Role: Core AI agent that:  
      - Analyzes job description text and resume text.  
      - Computes a match score (0–100) based on skills, experience, responsibilities, education, domain fit, logistics.  
      - Explains scores with evidence bullets.  
      - Identifies red flags and resume gaps.  
      - Generates a tailored cover letter (JSON escaped).  
    - Config: Uses strict JSON output formatting with prompts embedding job description and resume text.  
    - Input: Job descriptions extracted from LinkedIn, resume text from Extract from Resume1.  
    - Output: Detailed JSON with job analysis, resume analysis, score, explanations, red flags, gaps, and cover letter.  
    - Edge Cases: Incomplete job descriptions or resume data may reduce accuracy. JSON parsing errors are mitigated by Edit Fields3.  

  - **Edit Fields3**  
    - Type: Set / Code  
    - Role: Cleans and parses raw AI JSON output from Job Matching AI Agent1 to ensure valid JSON for further nodes.  
    - Logic: Removes code fences, normalizes quotes, extracts JSON content up to `END_OF_JSON`.  
    - Output: Parsed JSON object for storage and analysis.  

  - **Resume Analysis AI Agent1**  
    - Type: LangChain Agent / Mistral AI (large)  
    - Role: Focuses on actionable, succinct resume improvement suggestions based on job description and resume. Outputs a numbered list with tags (ADD, REMOVE, REWRITE, etc.).  
    - Input: Job description and resume text.  
    - Output: Text list of improvement actions.  
    - Edge Cases: Ensures no fabricated experience, strictly based on job gaps.  

  - **Mistral Cloud Chat Model4**  
    - Type: Language Model backend for AI Agents  
    - Role: Provides large model inference services to Resume Analysis AI Agent1 and Job Matching AI Agent1.  
    - Version: Uses "mistral-large-latest" model.

---

#### 1.5 Data Storage & Aggregation

- **Overview:**  
  Stores the enriched job match data and improvements to Google Sheet for persistent tracking, followed by aggregation and sorting for daily reporting.

- **Nodes Involved:**  
  - Append or update row in Job Search1  
  - Get row(s) in sheet1  
  - Sort1  
  - Limit1  
  - Aggregate1  

- **Node Details:**

  - **Append or update row in Job Search1**  
    - Type: Google Sheets  
    - Role: Inserts or updates rows in the Google Sheet tracking job search results using job link as key.  
    - Config: Maps multiple fields including job link, title, company, location, score, skills, cover letter, improvements, red flags, salary, relocation requirement.  
    - Input: Parsed AI outputs and cleaned job data.  
    - Output: Updated Google Sheet data.  
    - Edge Cases: Credential or quota limits on Google Sheets API.  

  - **Get row(s) in sheet1**  
    - Type: Google Sheets  
    - Role: Reads all rows for sorting and limiting.  
    - Input: Triggered after appending.  

  - **Sort1**  
    - Type: Sort  
    - Role: Sorts job entries descending by match score to prioritize best matches.  

  - **Limit1**  
    - Type: Limit  
    - Role: Restricts output to top 5 jobs for the daily digest email.  

  - **Aggregate1**  
    - Type: Aggregate  
    - Role: Combines the top 5 job entries into a single data structure for email formatting.

---

#### 1.6 Daily Digest Email Notification

- **Overview:**  
  Sends a personalized email summarizing the top 5 job matches, including match scores, key job details, and top resume improvement actions, with links to the full Google Sheet for deeper exploration.

- **Nodes Involved:**  
  - Send a message  

- **Node Details:**

  - **Send a message**  
    - Type: Gmail (or configured mail service)  
    - Role: Dispatches an HTML email to the user’s email address with a stylized summary of top job matches.  
    - Config:  
      - Email body includes dynamic HTML built from aggregated job data, alternating background colors for clarity, color-coded match scores, action points, and clickable job application links.  
      - Subject line is "Job Match Results".  
      - References Google Sheet link for full details.  
    - Input: Aggregated top 5 job data from Aggregate1.  
    - Edge Cases: Email delivery failures, malformed HTML if data is incomplete.

---

### 3. Summary Table

| Node Name                  | Node Type                            | Functional Role                         | Input Node(s)                    | Output Node(s)                      | Sticky Note                                                                                                                        |
|----------------------------|------------------------------------|---------------------------------------|---------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger1           | Schedule Trigger                   | Initiate workflow daily                | None                            | Download Resume1                  |                                                                                                                                   |
| Download Resume1            | Google Drive                      | Download resume PDF                    | Schedule Trigger1               | Extract from Resume1              | ## Update Provide your resume by updating the URL in the Download Resume node.                                                    |
| Extract from Resume1        | Extract from File                 | Extract text from resume PDF           | Download Resume1                | Resume Breakdown1                |                                                                                                                                   |
| Resume Breakdown1           | LangChain Agent (Mistral AI)      | Analyze resume to extract job search parameters | Extract from Resume1           | LinkedIn Search URL7, LinkedIn Search URL, LinkedIn Search URL5, LinkedIn Search URL6 |                                                                                                                                   |
| LinkedIn Search URL         | Code                             | Build LinkedIn URL for main keyword   | Resume Breakdown1              | Fetch jobs from LinkedIn          |                                                                                                                                   |
| LinkedIn Search URL5        | Code                             | Build LinkedIn URL for alternatekeyword | Resume Breakdown1             | Fetch jobs from LinkedIn3         |                                                                                                                                   |
| LinkedIn Search URL6        | Code                             | Build LinkedIn URL for alternatekeyword1 | Resume Breakdown1             | Fetch jobs from Linkedin          |                                                                                                                                   |
| LinkedIn Search URL7        | Code                             | Build LinkedIn URL for alternatekeyword2 | Resume Breakdown1             | Fetch jobs from LinkedIn5         |                                                                                                                                   |
| Fetch jobs from LinkedIn    | HTTP Request                    | Retrieve LinkedIn job postings HTML   | LinkedIn Search URL            | Merge                           | ## Job Scraping                                                                                                                                 |
| Fetch jobs from LinkedIn3   | HTTP Request                    | Retrieve LinkedIn job postings HTML   | LinkedIn Search URL5           | Merge                           | ## Job Scraping                                                                                                                                 |
| Fetch jobs from Linkedin    | HTTP Request                    | Retrieve LinkedIn job postings HTML   | LinkedIn Search URL6           | Merge                           | ## Job Scraping                                                                                                                                 |
| Fetch jobs from LinkedIn5   | HTTP Request                    | Retrieve LinkedIn job postings HTML   | LinkedIn Search URL7           | Merge                           | ## Job Scraping                                                                                                                                 |
| Merge                      | Merge                            | Combine job postings from all URLs    | Fetch jobs from LinkedIn*, etc. | HTML3                          | ## Job Scraping                                                                                                                                 |
| HTML3                      | HTML Extract                    | Extract job URLs from LinkedIn pages  | Merge                         | Split Out                      |                                                                                                                                   |
| Split Out                  | Split Out                       | Split jobs array into individual items | HTML3                        | Loop Over Items3                |                                                                                                                                   |
| Loop Over Items3            | Split In Batches                 | Batch processing of job URLs           | Split Out                    | Compare Datasets1, Wait1         |                                                                                                                                   |
| Compare Datasets1           | Compare Datasets                | Filter out jobs already in Google Sheet | Get row(s) in Job Search1, Loop Over Items3 | Loop Over Items                |                                                                                                                                   |
| Get row(s) in Job Search1   | Google Sheets                   | Read existing job URLs for filtering  | Schedule Trigger1             | Compare Datasets1               | ## Update Link Google Sheets to your Job Search data base.                                                                         |
| Loop Over Items             | Split In Batches                | Batch process filtered jobs for AI analysis | Compare Datasets1           | Get row(s) in sheet1, Job Matching AI Agent1 | Only focussing on the top 5 results. If you want to see more results per email, change the Limit node to your desired output.     |
| Get row(s) in sheet1        | Google Sheets                   | Fetch all job match data for sorting  | Loop Over Items              | Sort1                         |                                                                                                                                   |
| Job Matching AI Agent1      | LangChain Agent (Mistral AI)      | Analyze job vs resume, score match, generate cover letter | Loop Over Items             | Edit Fields3                  |                                                                                                                                   |
| Edit Fields3                | Set / Code                      | Parse and clean AI JSON output         | Job Matching AI Agent1        | Resume Analysis AI Agent1, Append or update row in Job Search1 |                                                                                                                                   |
| Resume Analysis AI Agent1   | LangChain Agent (Mistral AI)      | Generate actionable resume improvement list | Edit Fields3                | Append or update row in Job Search1 |                                                                                                                                   |
| Append or update row in Job Search1 | Google Sheets             | Store enriched job match data           | Resume Analysis AI Agent1     | Loop Over Items                | ## Create Create a Google Sheet with the columns listed in this node.                                                              |
| Sort1                      | Sort                           | Sort jobs descending by match score    | Get row(s) in sheet1          | Limit1                        |                                                                                                                                   |
| Limit1                     | Limit                          | Limit to top 5 jobs for digest email   | Sort1                        | Aggregate1                    |                                                                                                                                   |
| Aggregate1                 | Aggregate                      | Aggregate top jobs into a single list  | Limit1                       | Send a message                |                                                                                                                                   |
| Send a message             | Gmail                          | Send daily digest email with job matches | Aggregate1                   | None                          | ## Update Give your email a personal touch. Change colors, font, spacing, and more. Tip: If you are not good with HTML, give the HTML in this node to AI and let it format for you. |
| Mistral Cloud Chat Model    | LangChain LM                   | LLM for Resume Breakdown1               | None                         | Resume Breakdown1             |                                                                                                                                   |
| Mistral Cloud Chat Model4   | LangChain LM                   | LLM for Job Matching AI Agent1 and Resume Analysis AI Agent1 | None                         | Job Matching AI Agent1, Resume Analysis AI Agent1 |                                                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Scheduled Trigger node**  
   - Set to daily trigger at 12:45 PM to start the workflow.

2. **Add a Google Drive node (Download Resume1)**  
   - Configure with OAuth2 credentials for Google Drive.  
   - Set operation to "Download".  
   - Set fileId to your resume’s Google Drive file ID or URL.

3. **Add an Extract from File node (Extract from Resume1)**  
   - Configure to extract text from PDF input.  
   - Connect output of Download Resume1 to input of this node.

4. **Add a LangChain Agent node (Resume Breakdown1)**  
   - Select Mistral Cloud Chat Model (small) as the language model.  
   - Configure prompt to extract the main job title, alternate job titles, location, experience level, and remote preference from the resume text (see prompt in original).  
   - Connect Extract from Resume1 output to this node.  

5. **Add four Code nodes to build LinkedIn Search URLs (LinkedIn Search URL, LinkedIn Search URL5, LinkedIn Search URL6, LinkedIn Search URL7)**  
   - Each node reads one of the job title keywords from Resume Breakdown1 output (`keyword`, `alternatekeyword`, `alternatekeyword1`, `alternatekeyword2`).  
   - Implement URL construction logic with filters for last 24h jobs, location, experience level, and remote status.  
   - Output JSON with the `url` field.  
   - Connect Resume Breakdown1 output to all four code nodes.

6. **Add four HTTP Request nodes (Fetch jobs from LinkedIn, LinkedIn3, Linkedin, LinkedIn5)**  
   - Configure each to GET request the URL from respective LinkedIn Search URL nodes.  
   - Enable retry on failure with 3 seconds wait.  
   - Connect LinkedIn Search URL nodes accordingly.

7. **Add a Merge node**  
   - Configure to merge all four HTTP Request outputs into one dataset.  
   - Connect all four Fetch jobs nodes to this Merge node.

8. **Add an HTML Extract node (HTML3)**  
   - Configure CSS selectors to extract job links from LinkedIn job search result pages.  
   - Connect Merge output here.

9. **Add a Split Out node**  
   - Split the array of job URLs into individual items for processing.  
   - Connect HTML3 output here.

10. **Add a Split In Batches node (Loop Over Items3)**  
    - Batch process the split job URLs to avoid flooding.  
    - Connect Split Out output here.

11. **Add a Google Sheets node (Get row(s) in Job Search1)**  
    - Connect Schedule Trigger1 to this node to read existing job data for filtering.  
    - Configure with your Google Sheets document ID and sheet name.  

12. **Add a Compare Datasets node (Compare Datasets1)**  
    - Set to fuzzy compare on "Link" and "Apply Link" columns.  
    - Connect Get row(s) in Job Search1 output to first input, Loop Over Items3 to second input.  
    - Output filtered new jobs.

13. **Add a Split In Batches node (Loop Over Items)**  
    - Process filtered new jobs individually or in small batches.  
    - Connect Compare Datasets1 output here.

14. **Add a Google Sheets node (Get row(s) in sheet1)**  
    - To read current job match data for sorting and limiting.  
    - Connect Loop Over Items output here.

15. **Add a LangChain Agent node (Job Matching AI Agent1)**  
    - Use Mistral Cloud Chat Model (large).  
    - Configure prompt to analyze job description vs resume, compute match score, generate cover letter (strict JSON output).  
    - Input job description and resume text.  
    - Connect Loop Over Items output here.

16. **Add a Set node (Edit Fields3)**  
    - Parse raw AI JSON output from Job Matching AI Agent1 by stripping code fences and normalizing quotes.  
    - Connect Job Matching AI Agent1 output here.

17. **Add a LangChain Agent node (Resume Analysis AI Agent1)**  
    - Use Mistral Cloud Chat Model (large).  
    - Configure prompt to generate brief, actionable resume improvement points based on job description and resume.  
    - Connect Edit Fields3 output here.

18. **Add a Google Sheets node (Append or update row in Job Search1)**  
    - Map job and AI analysis fields (Link, Score, Title, Company, Location, Cover Letter, Skills, Improvements, Red Flags, Salary, Relocation Requirement) to sheet columns.  
    - Enable "append or update" by matching on the Link field.  
    - Connect Resume Analysis AI Agent1 output here.

19. **Add a Google Sheets node (Get row(s) in sheet1)**  
    - Re-fetch all job match data for sorting and limiting.  
    - Connect Append or update row in Job Search1 output here.

20. **Add a Sort node (Sort1)**  
    - Sort rows descending by Score.  
    - Connect Get row(s) in sheet1 output here.

21. **Add a Limit node (Limit1)**  
    - Limit to top 5 rows for digest.  
    - Connect Sort1 output here.

22. **Add an Aggregate node (Aggregate1)**  
    - Aggregate top 5 rows into a single data object for email rendering.  
    - Connect Limit1 output here.

23. **Add a Gmail node (Send a message)**  
    - Configure to send email to your address.  
    - Use HTML body with dynamic content showing top job matches, scores, resume improvement actions, and links to Google Sheet.  
    - Connect Aggregate1 output here.  
    - Configure SMTP or OAuth2 credentials for Gmail sending.

24. **Credential Setup:**  
    - Google Drive and Google Sheets OAuth2 credentials for file access and sheet editing.  
    - Gmail OAuth2 credentials for email sending.  
    - LangChain Mistral Cloud credentials for AI models.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                          |
|---------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Provide your resume by updating the URL in the Download Resume node.                                          | Sticky Note11                                                                                           |
| Link Google Sheets to your Job Search data base.                                                              | Sticky Note12                                                                                           |
| Create a Google Sheet with the columns listed in the Append or update row node for tracking job matches.      | Sticky Note13                                                                                           |
| Give your email a personal touch with colors, font, spacing; if unfamiliar with HTML, AI can format for you.  | Sticky Note14                                                                                           |
| Only focusing on the top 5 results in the daily email; change Limit node to increase results per email.       | Sticky Note15                                                                                           |
| This advanced workflow automates job search and preparation with AI-powered job matching, cover letter writing, and resume suggestions. Data is tracked in Google Sheets and summarized in a daily email. | Sticky Note19                                                                                           |
| Job scraping uses 4 key job titles from your resume; first run may search all jobs by removing the last 24h filter (`r86400`). | Sticky Note18                                                                                           |
| Review AI prompts to customize the personal touch and behavior of the AI agents.                              | Sticky Note21                                                                                           |

---

**Disclaimer:** The text provided here is exclusively derived from an automated workflow created with n8n, respecting all applicable content policies. No illegal, offensive, or protected elements are included. All processed data is legal and public.