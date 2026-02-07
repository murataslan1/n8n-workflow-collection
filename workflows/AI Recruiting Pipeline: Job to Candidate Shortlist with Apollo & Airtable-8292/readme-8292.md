AI Recruiting Pipeline: Job to Candidate Shortlist with Apollo & Airtable

https://n8nworkflows.xyz/workflows/ai-recruiting-pipeline--job-to-candidate-shortlist-with-apollo---airtable-8292


# AI Recruiting Pipeline: Job to Candidate Shortlist with Apollo & Airtable

### 1. Workflow Overview

This workflow, titled **"AI Recruiting Pipeline: Job to Candidate Shortlist with Apollo & Airtable"**, automates the process of generating a shortlist of candidates tailored to a given job description. It targets recruiting teams and talent acquisition specialists who want to streamline candidate sourcing, assessment, and outreach by combining AI-powered candidate evaluation with external data enrichment and ATS integration.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Job Data Recording**: Captures job details via form submission and stores the job in Airtable.
- **1.2 Job Title Normalization & Candidate Search with Apollo**: Generates related job titles and queries Apollo API for matching candidate profiles.
- **1.3 Candidate Data Cleaning & Deduplication**: Processes and cleans candidate data, removing duplicates.
- **1.4 Candidate Scoring and Fit Assessment**: Uses OpenAI models to analyze candidate fit against job requirements, scoring and structuring the assessment.
- **1.5 LinkedIn Profile Enrichment**: Retrieves enriched LinkedIn profile data via a third-party API.
- **1.6 Detailed Candidate Assessment**: Creates an in-depth evaluation of candidate fit including skills, experience, and culture.
- **1.7 Personalized Outreach Message Generation**: Drafts customized email and LinkedIn messages to candidates based on the assessments.
- **1.8 Storing Candidates in Airtable**: Saves candidate records with all enriched and assessed information in Airtable for client access.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception and Job Data Recording

- **Overview:**  
  This block collects job-related inputs from a user form and saves the job data into Airtable for reference throughout the pipeline.

- **Nodes Involved:**  
  - On form submission  
  - Set Fields  
  - Add Job to AirTable

- **Node Details:**

1. **On form submission**  
   - *Type:* Form Trigger  
   - *Role:* Entry point that triggers the workflow when a job input form is submitted.  
   - *Configuration:*  
     - Form titled "Job Input" with required fields: Job Title, Job Description, Location, and Target Companies (textarea).  
   - *Input/Output:* No input, outputs form data JSON.  
   - *Potential Failures:* Missing required fields; webhook connectivity issues.

2. **Set Fields**  
   - *Type:* Set  
   - *Role:* Normalizes and assigns job fields explicitly for downstream use.  
   - *Configuration:* Copies "Job Title", "Job Description", and "Location" from form JSON to named keys.  
   - *Input:* From form submission node.  
   - *Output:* Structured job data JSON.

3. **Add Job to AirTable**  
   - *Type:* Airtable (Create operation)  
   - *Role:* Stores the submitted job data into the "Job Searches" table in Airtable.  
   - *Configuration:* Maps Job Title, Job Location, and Job Description to Airtable columns.  
   - *Credentials:* Airtable API token configured.  
   - *Input:* From Set Fields node.  
   - *Output:* Airtable record ID for the stored job.  
   - *Edge Cases:* API rate limits, invalid API key, network errors.

---

#### 1.2 Job Title Normalization & Candidate Search with Apollo

- **Overview:**  
  Takes the job title and description to generate up to 5 normalized and variant job titles, then queries Apollo's API for potential candidates matching these titles and location.

- **Nodes Involved:**  
  - Generate Job Title Mutations  
  - Split Out1  
  - Apollo People Search1  
  - Split Out2  
  - Remove Duplicates

- **Node Details:**

1. **Generate Job Title Mutations**  
   - *Type:* OpenAI Chat Model (GPT-4.1-mini)  
   - *Role:* Creates a cleaned standard job title plus up to 5 variations to improve search recall.  
   - *Configuration:* Uses a detailed prompt to parse and normalize job titles based on job description. Outputs JSON with jobtitle1..5.  
   - *Input:* From Add Job to AirTable (job data).  
   - *Output:* JSON string of job title variations.  
   - *Failures:* API errors, incomplete or ambiguous job description.

2. **Split Out1**  
   - *Type:* Split Out  
   - *Role:* Splits the JSON job titles from OpenAI output into individual outputs for looping.  
   - *Input:* From Generate Job Title Mutations.  
   - *Output:* Individual job title strings for search.

3. **Apollo People Search1**  
   - *Type:* HTTP Request  
   - *Role:* Calls Apollo API to search for candidates matching each job title and location.  
   - *Configuration:*  
     - POST request to Apollo endpoint with parameters: person_titles (from Split Out1), location, pagination settings (max 5 pages, 10 per page).  
     - API key and headers set.  
   - *Input:* Each job title from Split Out1.  
   - *Output:* Candidate search results JSON.  
   - *Failures:* API key invalid/missing, rate limits, network errors.

4. **Split Out2**  
   - *Type:* Split Out  
   - *Role:* Splits candidate search results array ("people") into individual candidate records for processing.  
   - *Input:* From Apollo People Search1.  
   - *Output:* Individual candidate JSON objects.

5. **Remove Duplicates**  
   - *Type:* Remove Duplicates  
   - *Role:* Eliminates duplicate candidate records based on unique "id" field to avoid repeated processing.  
   - *Input:* From Split Out2.  
   - *Output:* Deduplicated candidate list.  
   - *Edge Cases:* Missing or inconsistent candidate IDs may cause improper deduplication.

---

#### 1.3 Candidate Data Cleaning & Deduplication

- **Overview:**  
  Prepares candidate data by formatting fields for downstream scoring and filtering.

- **Nodes Involved:**  
  - Edit Fields

- **Node Details:**

- **Edit Fields**  
  - *Type:* Set  
  - *Role:* Creates structured candidate fields such as a concatenated LinkedIn profile string and detailed employment history string to feed into AI scoring.  
  - *Configuration:* Uses JavaScript expressions to map and join candidate profile fields and employment history into text strings.  
  - *Input:* From Remove Duplicates.  
  - *Output:* Candidate profile enriched text fields.  
  - *Potential Errors:* Expression failures if expected fields are missing or malformed.

---

#### 1.4 Candidate Scoring and Fit Assessment

- **Overview:**  
  Runs AI-powered analysis on candidate profiles against the job description to generate an initial fit score and reasoning.

- **Nodes Involved:**  
  - Limit1  
  - Scoring and Prequalification  
  - Data Structuring  
  - Switch  
  - Edit Fields1  
  - Limit

- **Node Details:**

1. **Limit1**  
   - *Type:* Limit  
   - *Role:* Limits the number of candidates processed concurrently to 50 to control API usage.  
   - *Input:* From Edit Fields.  
   - *Output:* Limited candidate set.

2. **Scoring and Prequalification**  
   - *Type:* Chain LLM (OpenAI GPT-4.1-mini)  
   - *Role:* Generates a JSON with reasons for fit and a general fit score (0-5) based on candidate profile text and job description.  
   - *Input:* Candidate profile and job description fields.  
   - *Output:* Minified JSON string with fit reasoning and score.  
   - *Edge Cases:* Missing or ambiguous data may affect scoring accuracy.

3. **Data Structuring**  
   - *Type:* Chain LLM (GPT 4.1-mini) with structured output parser  
   - *Role:* Parses and formats the scoring output into a defined JSON schema with strict field validation.  
   - *Input:* Raw scoring JSON text.  
   - *Output:* Structured JSON object.  
   - *Failure Modes:* Parsing errors if input format is invalid.

4. **Switch**  
   - *Type:* Switch  
   - *Role:* Routes candidates with general_fit_score ≥ 4 to one path ("Score 4-5") and others to an alternative path.  
   - *Input:* From Data Structuring.  
   - *Output:* Conditional outputs based on score.

5. **Edit Fields1**  
   - *Type:* Set  
   - *Role:* Maps structured scoring fields to simplified field names for later enrichment and assessment.  
   - *Input:* From Switch node (for high score candidates).  
   - *Output:* Simplified candidate fit data.

6. **Limit**  
   - *Type:* Limit  
   - *Role:* Limits the number of candidates passed forward for LinkedIn enrichment to 50.  
   - *Input:* From Edit Fields1.  
   - *Output:* Limited candidate set.

---

#### 1.5 LinkedIn Profile Enrichment

- **Overview:**  
  Enriches candidate data by fetching detailed LinkedIn profile information via a third-party API.

- **Nodes Involved:**  
  - LinkedIn Profile Enrichment

- **Node Details:**

- **LinkedIn Profile Enrichment**  
  - *Type:* HTTP Request  
  - *Role:* Sends a request to an enrichment API to retrieve detailed LinkedIn profile data (name, location, position, profile picture, etc.) using the candidate's LinkedIn URL.  
  - *Configuration:*  
    - URL: `https://real-time-data-enrichment.p.rapidapi.com/get-profile-data-by-url`  
    - Headers: `x-rapidapi-host` and `x-rapidapi-key` required (user must supply API key).  
    - Query param: candidate's LinkedIn URL.  
    - Batching configured (1 request per 4 seconds) to comply with rate limits.  
  - *Input:* Candidate LinkedIn URL from Edit Fields1.  
  - *Output:* Detailed LinkedIn profile JSON.  
  - *Failures:* API key missing/invalid, rate limits, network errors.

---

#### 1.6 Detailed Candidate Assessment

- **Overview:**  
  Performs an in-depth AI evaluation of candidate fit across multiple dimensions based on enriched LinkedIn data and job details.

- **Nodes Involved:**  
  - Create Candidate Assessment  
  - OpenAI Chat Model2  
  - Auto-fixing Output Parser1  
  - OpenAI Chat Model3  
  - Auto-fixing Output Parser2  
  - Anthropic Chat Model  
  - Auto-fixing Output Parser2  
  - OpenAI Chat Model4  
  - Structured Output Parser1  
  - Structured Output Parser2

- **Node Details:**

1. **Create Candidate Assessment**  
   - *Type:* Chain LLM (OpenAI GPT-4.1-mini)  
   - *Role:* Generates a detailed JSON assessment of candidate fit including summary score, skills, experience, education, cultural fit, red flags, positives, and final recommendation.  
   - *Input:* Enriched LinkedIn data, job title and description, and initial scoring reasons.  
   - *Output:* JSON with structured reasoning.  
   - *Failures:* Model timeout, incomplete input data.

2. **OpenAI Chat Model2 / OpenAI Chat Model3 / OpenAI Chat Model4 / Anthropic Chat Model**  
   - *Type:* Various Chat LLM nodes (OpenAI GPT-4 variants and Anthropic Claude)  
   - *Role:* These nodes appear to provide alternative or complementary AI outputs for candidate assessment and outreach generation.  
   - *Input:* Candidate data and job details.  
   - *Output:* Candidate assessment or outreach message data.  
   - *Notes:* Anthropic model requires separate API credentials.

3. **Auto-fixing Output Parsers (Auto-fixing Output Parser1, Auto-fixing Output Parser2)**  
   - *Type:* Output Parser Autofixing  
   - *Role:* Automatically retries and corrects AI output that fails to meet schema constraints.  
   - *Input:* AI-generated JSON outputs.  
   - *Output:* Corrected JSON structured data.

4. **Structured Output Parsers (Structured Output Parser1, Structured Output Parser2)**  
   - *Type:* Structured Output Parser  
   - *Role:* Validates and enforces JSON schema compliance on AI outputs, such as candidate assessment and outreach message formatting.  
   - *Input:* AI outputs from Chat models.  
   - *Output:* Strictly typed JSON for downstream use.

---

#### 1.7 Personalized Outreach Message Generation

- **Overview:**  
  Creates personalized, concise outreach messages (email subject, body, LinkedIn DM) using the detailed candidate assessment and job description.

- **Nodes Involved:**  
  - Message Generation

- **Node Details:**

- **Message Generation**  
  - *Type:* Chain LLM  
  - *Role:* Generates cold email and LinkedIn message drafts tailored to the candidate's profile and job match assessment.  
  - *Configuration:*  
    - Prompts instruct writing brief, conversational, consultative outreach messages based on job description and candidate assessment.  
    - Output is a JSON object with "Email_Subject", "Email_Body", and "LinkedIn_DM".  
  - *Input:* Candidate LinkedIn enrichment data, job details, and candidate assessment JSON.  
  - *Output:* Personalized outreach messages in JSON format.  
  - *Failures:* AI generation errors, incomplete input data.

---

#### 1.8 Storing Candidates in Airtable

- **Overview:**  
  Saves enriched and assessed candidate profiles, including outreach messages, into Airtable for client use and tracking.

- **Nodes Involved:**  
  - Create Candidates in AirTable

- **Node Details:**

- **Create Candidates in AirTable**  
  - *Type:* Airtable (Create operation)  
  - *Role:* Inserts new candidate records in the "Candidates" table with comprehensive data fields including name, LinkedIn URL, job title, location, scores, assessments, outreach messages, and image URLs.  
  - *Configuration:* Many fields mapped from LinkedIn enrichment, candidate assessment, and outreach message nodes.  
  - *Credentials:* Airtable API token configured.  
  - *Input:* From Message Generation with enriched and processed data.  
  - *Failures:* API limits, field mapping errors, network issues.

---

### 3. Summary Table

| Node Name                   | Node Type                             | Functional Role                                | Input Node(s)                   | Output Node(s)                 | Sticky Note                                                                                  |
|-----------------------------|-------------------------------------|------------------------------------------------|--------------------------------|-------------------------------|----------------------------------------------------------------------------------------------|
| On form submission          | Form Trigger                        | Job data input via form                         | —                              | Set Fields                    |                                                                                              |
| Set Fields                 | Set                                 | Normalizes job input fields                     | On form submission             | Add Job to AirTable           |                                                                                              |
| Add Job to AirTable        | Airtable (Create)                   | Stores job in Airtable                          | Set Fields                    | Generate Job Title Mutations  |                                                                                              |
| Generate Job Title Mutations| OpenAI Chat Model (GPT-4.1-mini)   | Creates normalized job titles and variations   | Add Job to AirTable            | Split Out1                   | "## Job Title Mutation \nGenerate 5 similar job titles based on the job description"         |
| Split Out1                 | Split Out                          | Splits job title variations for search         | Generate Job Title Mutations   | Apollo People Search1        |                                                                                              |
| Apollo People Search1      | HTTP Request                      | Queries Apollo API for candidates               | Split Out1                   | Split Out2                  | "## CRM Lookup\nAdditional lookup for candidates already in your CRM based on filter tags."   |
| Split Out2                 | Split Out                          | Splits candidate search results                 | Apollo People Search1         | Remove Duplicates            |                                                                                              |
| Remove Duplicates          | Remove Duplicates                  | Removes duplicate candidates                     | Split Out2                   | Edit Fields                 |                                                                                              |
| Edit Fields               | Set                                | Formats candidate profile and employment text  | Remove Duplicates             | Limit1                      |                                                                                              |
| Limit1                    | Limit                              | Limits candidates to 50 for scoring             | Edit Fields                  | Scoring and Prequalification |                                                                                              |
| Scoring and Prequalification| Chain LLM (GPT-4.1-mini)           | Scores candidate fit and reasons                 | Limit1                       | Data Structuring             | "## Scoring \nScore the candidate initially on a scale of 0-5 based on the job description and their Apollo profile." |
| Data Structuring          | Chain LLM (GPT-4.1-mini)            | Parses scoring output into structured JSON      | Scoring and Prequalification  | Switch                      | "## Data Structuring \nFormat the whole profile into a structured candidate profile."       |
| Switch                    | Switch                            | Routes candidates based on fit score             | Data Structuring             | Edit Fields1 (high score)    |                                                                                              |
| Edit Fields1              | Set                                | Maps structured fit data to simplified fields  | Switch (Score 4-5)           | Limit                       |                                                                                              |
| Limit                     | Limit                              | Limits candidates to 50 for enrichment           | Edit Fields1                | LinkedIn Profile Enrichment  |                                                                                              |
| LinkedIn Profile Enrichment| HTTP Request                      | Retrieves enriched LinkedIn profile data         | Limit                       | Create Candidate Assessment  | "## LI Enrichment\n\nUse your preferred API to get the fully enriched LinkedIn profile.\n\nCan check on Apify or RapidAPI for example." |
| Create Candidate Assessment| Chain LLM (GPT-4.1-mini)           | Detailed AI candidate evaluation                  | LinkedIn Profile Enrichment  | Message Generation          | "## Candidate Assessment \nCreate a detailed candidate to job matching assessment which looks at more data points and outputs a structured reasoning." |
| Message Generation        | Chain LLM                        | Generates personalized outreach messages          | Create Candidate Assessment   | Create Candidates in AirTable| "## Outreach Message Creation \nUses the final assessment and the job description to write a fully personalized email and LinkedIn message to the candidate." |
| Create Candidates in AirTable| Airtable (Create)               | Saves candidate data, assessments, and messages  | Message Generation           | —                           |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node ("On form submission"):**  
   - Type: Form Trigger  
   - Configure with form title "Job Input" and required fields: Job Title, Job Description, Location, Target Companies (textarea).  
   - This node will trigger the workflow on form submission.

2. **Add a Set Node ("Set Fields"):**  
   - Copy the form fields into named variables: Job Title, Job Description, Location.  
   - Connect from "On form submission".

3. **Add an Airtable Node ("Add Job to AirTable"):**  
   - Operation: Create  
   - Set Base to your Airtable base for job searches.  
   - Set Table to "Job Searches".  
   - Map Job Title, Job Location, Job Description accordingly.  
   - Connect from "Set Fields".  
   - Configure Airtable credentials.

4. **Add an OpenAI Chat Model Node ("Generate Job Title Mutations"):**  
   - Model: GPT-4.1-mini  
   - Prompt: Provide job title and description, ask for cleaned standard title plus up to 5 variations in JSON format as per detailed instructions.  
   - Connect from "Add Job to AirTable".  
   - Configure OpenAI API credentials.

5. **Add a Split Out Node ("Split Out1"):**  
   - Field to split out: `choices[0].message.content` (the JSON with job titles).  
   - Connect from "Generate Job Title Mutations".

6. **Add HTTP Request Node ("Apollo People Search1"):**  
   - Method: POST  
   - URL: Apollo people search API endpoint.  
   - Query parameters: person_titles from Split Out1, location from job data, per_page=10, page=1, include_similar_titles=false.  
   - Add pagination with max 5 pages, 1 second interval.  
   - Headers: include x-api-key and other required headers.  
   - Connect from "Split Out1".

7. **Add Split Out Node ("Split Out2"):**  
   - Field to split out: `people` array from Apollo API response.  
   - Connect from "Apollo People Search1".

8. **Add Remove Duplicates Node ("Remove Duplicates"):**  
   - Compare on candidate unique "id".  
   - Connect from "Split Out2".

9. **Add Set Node ("Edit Fields"):**  
   - Create fields:  
     - "LinkedIn_profile": concatenated key:value pairs from candidate JSON.  
     - "employment_history": mapped and joined string of employment entries with title, organization, dates, current role info.  
   - Connect from "Remove Duplicates".

10. **Add Limit Node ("Limit1"):**  
    - Max items: 50  
    - Connect from "Edit Fields".

11. **Add Chain LLM Node ("Scoring and Prequalification"):**  
    - Model: GPT-4.1-mini  
    - Prompt: Provide candidate LinkedIn profile, employment history, and job description; output JSON with fit reasons and score (0-5) as per detailed instructions.  
    - Connect from "Limit1".

12. **Add Chain LLM Node with Output Parser ("Data Structuring"):**  
    - Model: GPT-4.1-mini  
    - Schema: JSON schema for candidate fit reasons and score.  
    - Connect from "Scoring and Prequalification".

13. **Add Switch Node ("Switch"):**  
    - Condition: `general_fit_score >= 4` → output "Score 4-5" else fallback.  
    - Connect from "Data Structuring".

14. **Add Set Node ("Edit Fields1"):**  
    - Map fields from structured output to simpler names: Name, LinkedIn, Title, Experience Fit, Industry Fit, Seniority Fit, General Fit, Score.  
    - Connect from Switch output "Score 4-5".

15. **Add Limit Node ("Limit"):**  
    - Max items: 50  
    - Connect from "Edit Fields1".

16. **Add HTTP Request Node ("LinkedIn Profile Enrichment"):**  
    - URL: Enrichment API endpoint (e.g., RapidAPI).  
    - Query: LinkedIn URL from candidate.  
    - Headers: API host and key (user must provide).  
    - Batching: 1 request every 4 seconds to avoid rate limits.  
    - Connect from "Limit".

17. **Add Chain LLM Node ("Create Candidate Assessment"):**  
    - Model: GPT-4.1-mini  
    - Prompt: Detailed candidate evaluation incorporating enriched profile and job data; output structured JSON with multiple fit dimensions and recommendations.  
    - Connect from "LinkedIn Profile Enrichment".

18. **Add Chain LLM Node ("Message Generation"):**  
    - Model: GPT-4.1-mini (or Anthropic Claude as optional alternative)  
    - Prompt: Compose personalized cold email and LinkedIn DM based on candidate assessment and job description; output JSON with subject, body, and LinkedIn message.  
    - Connect from "Create Candidate Assessment".

19. **Add Airtable Node ("Create Candidates in AirTable"):**  
    - Operation: Create  
    - Base: Candidate Search Airtable base  
    - Table: Candidates  
    - Map fields extensively from LinkedIn enrichment, candidate assessment, and message generation outputs.  
    - Connect from "Message Generation".  
    - Configure Airtable credentials.

**Additional steps:**  
- Add Output Parsers (Auto-fixing and Structured) after AI nodes to ensure JSON correctness and retry on errors.  
- Insert appropriate error handling or continue-on-error settings for robustness.  
- Add Sticky Notes at key points to document block purposes for users.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                              |
|-------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| YouTube video explaining the workflow is available: @[youtube](ppbXEab8334)                     | Video breakdown of the workflow for user understanding       |
| CRM Lookup sticky note: Additional lookup for candidates already in your CRM based on filter tags| Located near Apollo People Search nodes                       |
| Job Title Mutation: Generate 5 similar job titles based on the job description                   | Enhances candidate search breadth                             |
| Scoring: Score the candidate initially on a scale of 0-5 based on the job description and profile| Explains candidate prequalification logic                    |
| Data Structuring: Format the whole profile into a structured candidate profile                   | Enforces standardized data for downstream processing          |
| Candidate Assessment: Create a detailed candidate to job matching assessment                      | AI-based structured reasoning on candidate fit               |
| Outreach Message Creation: Personalized email and LinkedIn message generation                    | Uses AI to craft candidate outreach communication              |
| LI Enrichment: Use your preferred API (e.g., RapidAPI, Apify) for LinkedIn profile enrichment    | Requires user to supply API key and handle rate limits         |

---

This detailed documentation provides a full technical reference to understand, reproduce, and extend the AI Recruiting Pipeline workflow, anticipating key integration points, potential error sources, and configuration needs.