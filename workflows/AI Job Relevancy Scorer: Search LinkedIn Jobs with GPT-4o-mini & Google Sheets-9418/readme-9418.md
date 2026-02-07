AI Job Relevancy Scorer: Search LinkedIn Jobs with GPT-4o-mini & Google Sheets

https://n8nworkflows.xyz/workflows/ai-job-relevancy-scorer--search-linkedin-jobs-with-gpt-4o-mini---google-sheets-9418


# AI Job Relevancy Scorer: Search LinkedIn Jobs with GPT-4o-mini & Google Sheets

---

### 1. Workflow Overview

This workflow, titled **AI Job Relevancy Scorer: Search LinkedIn Jobs with GPT-4o-mini & Google Sheets**, automates the search, scoring, filtering, and tracking of relevant job listings from LinkedIn, tailored to a candidate’s resume and preferences.

**Target Use Case:**  
Job seekers who want to find highly relevant LinkedIn jobs based on their resume and custom preferences, automatically scored by AI and logged into a Google Sheet for easy tracking.

**Logical Blocks:**

- **1.1 Input Reception**  
  Captures user inputs including job search criteria, preferences, resume, target relevancy score, and Google Sheet URL via a public form trigger.

- **1.2 Parameter Compilation**  
  Converts user-selected form parameters into API-compatible codes for querying the LinkedIn Jobs API.

- **1.3 Job Data Fetching**  
  Calls Apify’s LinkedIn Jobs Scraper API to retrieve job listings based on compiled parameters.

- **1.4 Job Filtering & Deduplication**  
  Cleans fetched job data by removing duplicates, blacklisted companies, and invalid entries.

- **1.5 AI-Based Job Scoring**  
  Uses OpenAI GPT-4o-mini model to assign a relevancy score (0–100) for each job relative to the user’s resume and preferences.

- **1.6 Score Filtering**  
  Filters out jobs that do not meet the user-defined target relevancy score.

- **1.7 Existing Job Check & Enrichment**  
  Retrieves existing job IDs from the user’s Google Sheet and enriches new job listings, ensuring no duplicates are added.

- **1.8 Add New Jobs to Google Sheets**  
  Appends newly scored, filtered, and unique job listings to the user’s Google Sheet.

- **1.9 Workflow Support & Notes**  
  Sticky notes provide documentation, instructions, and setup guidance throughout the workflow.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception

**Overview:**  
Captures job search input from the user via a customizable public form that triggers the workflow upon submission.

**Nodes Involved:**  
- On form submission  
- Sticky Note (contextual)

**Node Details:**  

- **On form submission**  
  - Type: Form Trigger  
  - Role: Captures user inputs including job title, location, contract type, experience level, working mode, date posted, target relevancy score, Google Sheet link, resume, and preferences.  
  - Configuration: The form fields are configured with dropdowns and text areas for detailed input; includes validation like required fields.  
  - Input: Triggered by HTTP POST form submission.  
  - Output: JSON object with all form fields.  
  - Notes: Webhook ID set for external access.  
  - Edge Cases: Missing required fields, malformed URLs, or large resume text could cause failures.  

- **Sticky Note**  
  - Content: Explains the form’s purpose and trigger mechanism.  
  - Position: Above the form node for clarity.

---

#### 1.2 Parameter Compilation

**Overview:**  
Transforms user-selected form inputs into API parameter codes understood by the LinkedIn Jobs API on Apify.

**Nodes Involved:**  
- Compile_parm_sets  
- Sticky Note1

**Node Details:**  

- **Compile_parm_sets**  
  - Type: Code (JavaScript)  
  - Role: Maps contract type, experience level, working mode, and date posted selections into compact API codes (e.g., “Full-time” → “F”, “Past Week” → “r604800”).  
  - Key Expressions: Mapping functions for each parameter; outputs structured object with title, location, and API-ready filters.  
  - Input: JSON from form submission.  
  - Output: JSON with compiled parameters ready for API call.  
  - Edge Cases: Unrecognized or missing input values default to null and are omitted from output.  

- **Sticky Note1**  
  - Content: Describes this node’s role in converting form selections to Apify API parameters.

---

#### 1.3 Job Data Fetching

**Overview:**  
Sends a POST request to Apify’s LinkedIn Jobs Scraper API with compiled parameters to fetch job listings.

**Nodes Involved:**  
- Fetch LinkedIn Jobs  
- Sticky Note2

**Node Details:**  

- **Fetch LinkedIn Jobs**  
  - Type: HTTP Request  
  - Role: Calls Apify API endpoint to retrieve job listings synchronously.  
  - Configuration: POST method, sends JSON body with compiled parameters, includes authorization header with Apify API key (placeholder `<your_apify_api>` to be replaced).  
  - Input: Output of parameter compilation node.  
  - Output: JSON array of job listings.  
  - Edge Cases: API authorization failure, rate limits, network timeouts, or malformed responses.  
  - Credentials: Requires Apify API key.  

- **Sticky Note2**  
  - Content: Explains API call and requirement for Apify API key and rented LinkedIn Jobs actor.

---

#### 1.4 Job Filtering & Deduplication

**Overview:**  
Cleans fetched jobs by removing duplicates, blacklisted companies, and entries without valid company URLs.

**Nodes Involved:**  
- Filter & Dedup Jobs  
- If Jobs  
- Sticky Note3

**Node Details:**  

- **Filter & Dedup Jobs**  
  - Type: Code (JavaScript)  
  - Role:  
    - Deduplicates jobs by unique ID.  
    - Filters out blacklisted companies “Jobot”, “TieTalent”, and “Pryor Associates Executive Search”.  
    - Ensures jobs have a company URL.  
    - Further deduplicates by (job title + company name).  
  - Input: Raw job listings from API.  
  - Output: Cleaned and unique job listings.  
  - Edge Cases: Missing fields in job data could affect filtering; blacklisting is case-sensitive.  

- **If Jobs**  
  - Type: If  
  - Role: Checks if the filtered job list is not empty (i.e., jobs found).  
  - Input: Output of Filter & Dedup Jobs.  
  - Output: Routes workflow to scoring or enrichment accordingly.  

- **Sticky Note3**  
  - Content: Describes job filtering and deduplication logic.

---

#### 1.5 AI-Based Job Scoring

**Overview:**  
Scores each job’s relevance to the candidate using an OpenAI GPT-4o-mini model, based on the candidate’s resume and job preferences.

**Nodes Involved:**  
- Scoring Jobs  
- Sticky Note4

**Node Details:**  

- **Scoring Jobs**  
  - Type: OpenAI (Langchain)  
  - Role:  
    - Sends each job listing with candidate resume and preferences as system and user messages.  
    - Receives a JSON array with a single object containing job ID and relevancy score (0–100).  
  - Configuration:  
    - Model: GPT-4o-mini.  
    - Temperature: 0.4 (balanced creativity).  
    - System prompt sets expert recruiter role and strict scoring instructions.  
    - Ensures output is strict JSON format for automation.  
  - Input: Filtered job listings.  
  - Output: Jobs with assigned relevancy scores.  
  - Edge Cases: API rate limits, response format errors, or timeouts.  
  - Credentials: Requires OpenAI API key.  

- **Sticky Note4**  
  - Content: Explains scoring and filtering by relevancy score.

---

#### 1.6 Score Filtering

**Overview:**  
Filters out jobs scored below the user-defined target relevancy score.

**Nodes Involved:**  
- filtering jobs

**Node Details:**  

- **filtering jobs**  
  - Type: Code (JavaScript)  
  - Role:  
    - Extracts relevancy scores from AI output.  
    - Keeps only jobs with scores ≥ target score from form input.  
  - Input: Output from Scoring Jobs node (array of scored jobs).  
  - Output: Filtered jobs matching target score.  
  - Edge Cases: Missing or malformed relevancy scores.  

---

#### 1.7 Existing Job Check & Enrichment

**Overview:**  
Fetches existing job IDs from the user’s Google Sheet to avoid duplicates and enriches new job data with existing information.

**Nodes Involved:**  
- On form submission (for Google Sheet URL)  
- existing_jobs  
- Enrich input 1  
- rm_existing_jobs  
- If Jobs1  
- If Jobs2  
- Sticky Note5

**Node Details:**  

- **existing_jobs**  
  - Type: Google Sheets  
  - Role: Reads column C (job IDs) from the user’s specified Google Sheet "Jobs Tracker" tab.  
  - Input: Google Sheet URL from form submission.  
  - Output: Existing job records.  
  - Credentials: Google Sheets OAuth2 required.  

- **Enrich input 1**  
  - Type: Merge  
  - Role: Enriches new jobs with existing job data by matching on job ID (fuzzy compare enabled).  
  - Input: New filtered jobs and existing jobs.  
  - Output: Merged/enriched jobs.  

- **rm_existing_jobs**  
  - Type: Merge  
  - Role: Removes jobs already present in the Google Sheet by keeping only non-matching entries.  
  - Input: Enriched jobs and existing jobs.  
  - Output: New jobs not yet in the sheet.  

- **If Jobs1**  
  - Type: If  
  - Role: Checks if there are jobs after filtering and enrichment before proceeding.  

- **If Jobs2**  
  - Type: If  
  - Role: Final check before adding jobs to Google Sheet.  

- **Sticky Note5**  
  - Content: Describes the process of comparing new jobs with existing sheet entries to prevent duplicates.

---

#### 1.8 Add New Jobs to Google Sheets

**Overview:**  
Appends new, scored, and filtered job listings to the user’s Google Sheet “Jobs Tracker” tab.

**Nodes Involved:**  
- Add Jobs

**Node Details:**  

- **Add Jobs**  
  - Type: Google Sheets  
  - Role: Appends job data rows to the designated Google Sheet.  
  - Configuration:  
    - Uses defined mapping columns including job ID, relevancy score, salary, HR contact info, URLs, dates, company info, and other metadata.  
    - Matches on job ID to avoid duplicates.  
    - Operates in “append” mode.  
  - Input: New jobs after filtering and enrichment.  
  - Credentials: Google Sheets OAuth2.  
  - Edge Cases: Google Sheets API quota limits, write conflicts, or incorrect sheet URL.  

---

#### 1.9 Workflow Support & Notes

**Overview:**  
Sticky notes provide context, instructions, setup guidance, and project overview throughout the workflow.

**Nodes Involved:**  
- Sticky Note (multiple instances)

**Node Details:**  

- **Sticky Note (at workflow start)**  
  - Content: Overview of workflow purpose, setup instructions including credentials and Google Sheet template link, and user instructions for running the form.  

- Other sticky notes provide inline documentation above key nodes for clarity.

---

### 3. Summary Table

| Node Name          | Node Type               | Functional Role                                      | Input Node(s)             | Output Node(s)            | Sticky Note                                                                                                     |
|--------------------|-------------------------|-----------------------------------------------------|---------------------------|---------------------------|----------------------------------------------------------------------------------------------------------------|
| On form submission  | Form Trigger            | Collect user input and trigger workflow             | -                         | Compile_parm_sets          | * Collects user input such as resume, preferences, and Google Sheet link via a public form.                    |
| Compile_parm_sets   | Code                    | Map form inputs to Apify API parameter codes        | On form submission        | Fetch LinkedIn Jobs        | Converts the form selections (contract type, experience, etc.) into API-ready parameters for Apify’s LinkedIn. |
| Fetch LinkedIn Jobs | HTTP Request            | Fetch job listings from Apify LinkedIn Jobs API     | Compile_parm_sets          | Filter & Dedup Jobs        | * Calls the Apify API to fetch job listings based on your parameters. Requires Apify API key and actor.        |
| Filter & Dedup Jobs | Code                    | Remove duplicates, blacklist companies, invalid jobs| Fetch LinkedIn Jobs        | If Jobs, Enrich input 1    | Removes duplicates, filters out blacklisted companies, and excludes listings without a valid company profile.   |
| If Jobs             | If                      | Checks if jobs exist after filtering                 | Filter & Dedup Jobs        | Scoring Jobs, Enrich input 1|                                                                                                                |
| Scoring Jobs        | OpenAI (Langchain)      | Score jobs relevancy vs resume using GPT-4o-mini    | If Jobs                   | filtering jobs             | ## Score and Filter Jobs by Relevance — sends jobs and resume to GPT-4o-mini for scoring.                      |
| filtering jobs      | Code                    | Filter jobs below target relevancy score             | Scoring Jobs               | If Jobs1                  |                                                                                                                |
| If Jobs1            | If                      | Check if scored jobs exist before enrichment         | filtering jobs             | existing_jobs, Enrich input 1|                                                                                                                |
| existing_jobs       | Google Sheets           | Fetch existing job IDs from user’s Google Sheet      | If Jobs1                  | rm_existing_jobs           | ## Add New jobs to the Google Sheet — fetches existing jobs to prevent duplicates.                             |
| Enrich input 1      | Merge                   | Enrich new jobs with existing sheet data             | If Jobs1, existing_jobs    | rm_existing_jobs           |                                                                                                                |
| rm_existing_jobs    | Merge                   | Remove jobs already in Google Sheet                    | existing_jobs, Enrich input 1| If Jobs2                 |                                                                                                                |
| If Jobs2            | If                      | Check if jobs remain to add after deduplication       | rm_existing_jobs           | Add Jobs                  |                                                                                                                |
| Add Jobs            | Google Sheets           | Append new filtered and scored jobs to Google Sheet  | If Jobs2                  | -                         |                                                                                                                |
| Sticky Note         | Sticky Note             | Various notes explaining blocks and setup            | -                         | -                         | Multiple sticky notes provide detailed documentation and setup instructions throughout the workflow.          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Form Trigger Node: “On form submission”**  
   - Type: Form Trigger  
   - Configure webhook path (e.g., “jobs-scraper”)  
   - Add form fields:  
     - title (text, required)  
     - location (text, required)  
     - Contract Type (dropdown: All, Full-time, Part-time, Contract, Temporary, Internship, Volunteer)  
     - Experience Level (dropdown: All, Internship, Entry-level, Associate, Mid-senior level, Director)  
     - Working Mode (dropdown: all, On-site, Remote, Hybrid)  
     - Date Posted (dropdown: Past 24 hours, Past Week, Past Month)  
     - Target Relevancy Score (number, required)  
     - Link to your Google Sheet (text, required)  
     - Your Resume (textarea, required)  
     - Your Job Instructions/Preferences (textarea, required)  
   - Set response message for form submission success.

2. **Add a Code Node: “Compile_parm_sets”**  
   - Type: Code (JavaScript)  
   - Use mapping functions to convert form inputs into Apify API parameters:  
     - Contract Type → F, P, C, T, I, V  
     - Experience Level → 1–5 scale  
     - Working Mode → 1, 2, 3  
     - Date Posted → r86400, r604800, r2592000  
   - Output JSON with title, location, rows based on date posted, and mapped filters.  
   - Connect from “On form submission”.

3. **Add HTTP Request Node: “Fetch LinkedIn Jobs”**  
   - Set method to POST.  
   - URL: `https://api.apify.com/v2/acts/BHzefUZlZRKWxkTck/run-sync-get-dataset-items`  
   - Send JSON body from “Compile_parm_sets”.  
   - Add headers:  
     - Accept: application/json  
     - Authorization: Bearer `<your_apify_api>` (replace with your Apify API key)  
   - Connect from “Compile_parm_sets”.

4. **Add Code Node: “Filter & Dedup Jobs”**  
   - Deduplicate jobs by ID and by (title + companyName).  
   - Filter out blacklisted companies: “Jobot”, “TieTalent”, “Pryor Associates Executive Search”.  
   - Remove jobs without a companyUrl.  
   - Connect from “Fetch LinkedIn Jobs”.

5. **Add If Node: “If Jobs”**  
   - Condition: Check if input data is not empty (i.e., jobs exist).  
   - Connect from “Filter & Dedup Jobs”.

6. **Add OpenAI Node: “Scoring Jobs”**  
   - Use OpenAI Langchain node with model “gpt-4o-mini”.  
   - Temperature: 0.4  
   - System message: Embed candidate resume and preferences from form submission; instruct strict relevancy scoring and JSON output format.  
   - User message: Include job details (id, title, salary, description).  
   - Enable JSON output parsing.  
   - Connect from “If Jobs” true branch.

7. **Add Code Node: “filtering jobs”**  
   - Filter scored jobs to retain only those with relevancy_score ≥ target score from form input.  
   - Connect from “Scoring Jobs”.

8. **Add If Node: “If Jobs1”**  
   - Check if filtered jobs exist.  
   - Connect from “filtering jobs”.

9. **Add Google Sheets Node: “existing_jobs”**  
   - Operation: Read values from column C in “Jobs Tracker” sheet.  
   - Document ID: dynamic from form submission (Google Sheet URL).  
   - Connect from “If Jobs1”.

10. **Add Merge Node: “Enrich input 1”**  
    - Mode: Enrich input 1  
    - Join mode: enrichInput1  
    - Match on “id” with fuzzy compare enabled.  
    - Connect from “If Jobs1” and “existing_jobs”.

11. **Add Merge Node: “rm_existing_jobs”**  
    - Mode: Combine  
    - Join mode: keepNonMatches  
    - Match on “id” with fuzzy compare enabled.  
    - Connect from “existing_jobs” and “Enrich input 1”.

12. **Add If Node: “If Jobs2”**  
    - Check if jobs remain after exclusion.  
    - Connect from “rm_existing_jobs”.

13. **Add Google Sheets Node: “Add Jobs”**  
    - Operation: Append rows to “Jobs Tracker” sheet.  
    - Map columns with job fields including id, relevancy score, salary, HR name, job URLs, title, date posted, company info, and others as per the template.  
    - Document ID: dynamic from form submission.  
    - Connect from “If Jobs2”.

14. **Add appropriate Sticky Note nodes** to document each major block and provide setup instructions, including Google Sheets template link and credential requirements.

15. **Set credentials:**  
    - Google Sheets OAuth2 for reading/writing sheets.  
    - OpenAI API key for GPT-4o-mini.  
    - Apify API key for LinkedIn Jobs Scraper.

16. **Test the workflow:**  
    - Use the public form URL generated by “On form submission”.  
    - Fill in sample data including resume and preferences.  
    - Confirm new relevant jobs appear in the specified Google Sheet.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                  | Context or Link                                                                                                                           |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Workflow automates job search, scoring, and tracking using Apify LinkedIn Jobs API and OpenAI GPT-4o-mini.                                                                                                                                     | Workflow overview sticky note.                                                                                                            |
| Google Sheet template required for job tracking. Make sure to copy and enable edit access for your Google Sheet.                                                                                                                             | [Google Sheet Template](https://docs.google.com/spreadsheets/d/1Pabh4GDMc0CBK5S6gn8FxpRgLbyXZVN656JNkBH6f7Y/edit?gid=0#gid=0)              |
| Replace `<your_apify_api>` in the HTTP Request node header with your actual Apify API key.                                                                                                                                                     | Apify API integration note.                                                                                                               |
| Set up credentials in n8n: Google Sheets OAuth2, OpenAI API key, Apify API key.                                                                                                                                                               | Setup instructions sticky note.                                                                                                          |
| The OpenAI GPT-4o-mini model is configured with a strict prompt to output only JSON arrays with job id and relevancy_score to facilitate downstream filtering and automation.                                                                   | AI scoring node note.                                                                                                                     |
| Blacklisted companies are hardcoded; modify in the “Filter & Dedup Jobs” node as needed.                                                                                                                                                       | Filtering node note.                                                                                                                      |
| The workflow uses fuzzy matching during merges to improve robustness against minor data inconsistencies in job IDs.                                                                                                                          | Merge nodes note.                                                                                                                         |
| Network issues, API limits, or invalid inputs can cause workflow failures; implement retry policies and monitor logs for troubleshooting.                                                                                                     | General operational advice.                                                                                                               |
| The public form trigger node generates a webhook URL that can be used to embed the form or share externally for user inputs.                                                                                                                 | Form trigger node note.                                                                                                                   |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---