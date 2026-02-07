Automate LinkedIn Job Postings from Recrutei ATS with GPT-4o Content Generation

https://n8nworkflows.xyz/workflows/automate-linkedin-job-postings-from-recrutei-ats-with-gpt-4o-content-generation-9332


# Automate LinkedIn Job Postings from Recrutei ATS with GPT-4o Content Generation

### 1. Workflow Overview

This workflow automates the process of publishing new job postings from the Recrutei Applicant Tracking System (ATS) directly to LinkedIn, using AI-generated content to create engaging job descriptions. It is designed for recruitment teams seeking to streamline job advertisement publication, improve the quality of job posts with AI-driven marketing copy, and maintain internal logs for auditing.

The workflow is logically divided into these key blocks:

- **1.1 Input Reception:** Listens for new job creation events from Recrutei ATS via a webhook.
- **1.2 Data Pre-processing:** Cleans and standardizes the incoming raw job data, converting booleans and structuring data.
- **1.3 AI Prompt Transformation:** Converts the structured job data into a detailed, formatted prompt suitable for AI content generation.
- **1.4 AI Content Generation:** Uses OpenAI’s GPT-4o-mini model as a professional HR copywriter to produce an engaging LinkedIn post.
- **1.5 Publish and Log:** Publishes the generated content on LinkedIn and logs the job title and publishing status to Google Sheets for record-keeping.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block serves as the workflow’s entry point, waiting for HTTP POST requests from the Recrutei ATS system when a new job is created or published.

**Nodes Involved:**  
- Recrutei Webhook Trigger  
- Sticky Note - Trigger

**Node Details:**

- **Recrutei Webhook Trigger**  
  - *Type & Role:* HTTP Webhook node that listens for POST requests.  
  - *Configuration:* Path set to `new-job-created`, HTTP method is POST. Webhook ID is a placeholder (`YOUR_WEBHOOK_ID_HERE`) that must be replaced.  
  - *Expressions/Variables:* None.  
  - *Connections:* Output connects to "Clean and Standardize Job Data" node.  
  - *Version:* 2.1.  
  - *Potential Failures:* Misconfigured webhook URL, network issues, invalid payload format, or unauthorized requests if security is not configured.  
  - *Sub-workflow:* None.

- **Sticky Note - Trigger**  
  - *Role:* Provides guidance that this node is the workflow entry point and instructions to configure the webhook URL in Recrutei.  
  - *Sticky Note Content:* "This is the **entry point** of the workflow. It listens for a POST request from the Recrutei ATS whenever a new job is created/published. You must copy the Webhook URL and configure it in Recrutei."

---

#### 2.2 Data Pre-processing

**Overview:**  
This block cleans and standardizes the incoming job data to prepare it for downstream processing. It converts boolean-like numeric fields (0/1) to human-readable "yes"/"no" strings.

**Nodes Involved:**  
- Clean and Standardize Job Data  
- Transform Data to AI Prompt  
- Sticky Note - Data Pre-processing

**Node Details:**

- **Clean and Standardize Job Data**  
  - *Type & Role:* Code node that runs JavaScript to transform the raw job data.  
  - *Configuration:*  
    - Converts fields `fixed_remuneration`, `remote`, `pcd`, and `is_inclusive` from numeric (0/1) to strings ("no"/"yes").  
    - Receives the job data body from the webhook JSON payload.  
  - *Key Expressions:* Custom JavaScript function `convertBoolean(value)` used to map 1 → "yes" and 0 → "no".  
  - *Connections:* Outputs cleaned job data to "Transform Data to AI Prompt".  
  - *Version:* 2.  
  - *Potential Failures:* Unexpected data formats, missing fields, or null values could cause errors or improper conversions.  
  - *Sub-workflow:* None.

- **Transform Data to AI Prompt**  
  - *Type & Role:* Code node that formats the cleaned job data into a Markdown-style prompt for AI input.  
  - *Configuration:*  
    - Defines a comprehensive mapping of job data fields to user-friendly labels.  
    - Skips irrelevant fields (IDs, internal codes).  
    - Cleans HTML tags from long text fields like job description, preserving formatting such as lists and bold/italic text.  
    - Formats remuneration as USD currency if numeric.  
    - Constructs a multi-line Markdown detailed job prompt string containing all relevant job details.  
  - *Key Expressions:* Complex JavaScript with regex to sanitize HTML and format text.  
  - *Connections:* Feeds the generated prompt (`detailedJobPrompt`) into the AI Content Generator node.  
  - *Version:* 2.  
  - *Potential Failures:* Parsing errors if input contains unexpected HTML or null values; formatting may fail if input types differ from assumptions.  
  - *Sub-workflow:* None.

- **Sticky Note - Data Pre-processing**  
  - *Role:* Explains the purpose of these two code nodes as cleaning raw data and structuring it for AI.  
  - *Sticky Note Content:* "Uses two Code nodes to clean the raw data (Code 1: Boolean conversion) and structure it (Code 2: Markdown prompt generation) for optimal AI interpretation."

---

#### 2.3 AI Content Generation

**Overview:**  
This block uses the OpenAI GPT-4o-mini model to generate an attractive, marketing-focused LinkedIn post from the detailed prompt.

**Nodes Involved:**  
- AI Content Generator  
- Sticky Note - AI Generation

**Node Details:**

- **AI Content Generator**  
  - *Type & Role:* OpenAI node configured with LangChain integration, responsible for content generation.  
  - *Configuration:*  
    - Model ID: `gpt-4o-mini` (latest GPT-4o variant).  
    - Messages include:  
      - User message containing the detailed job prompt from the previous node.  
      - System message instructing the model to act as a professional HR marketing copywriter, focusing on benefits, culture, responsibilities, and relevant hashtags.  
  - *Key Expressions:* Uses expression `={{ $json.detailedJobPrompt }}` to pass the prompt.  
  - *Connections:* Output connects to "Publish LinkedIn Post".  
  - *Version:* 1.8.  
  - *Potential Failures:* API authentication errors, rate limits, timeout, malformed prompt leading to poor generation, or model unavailability.  
  - *Credentials:* Requires valid OpenAI API credentials.  
  - *Sub-workflow:* None.

- **Sticky Note - AI Generation**  
  - *Role:* Describes the AI model’s role as a professional copywriter generating content suitable for LinkedIn.  
  - *Sticky Note Content:* "The **OpenAI model** acts as a professional copywriter. It takes the structured prompt and generates an engaging, marketing-focused text ready for LinkedIn."

---

#### 2.4 Publish and Log

**Overview:**  
This final block publishes the AI-generated job post to LinkedIn under a specified profile and logs the publication details to a Google Sheet for auditing purposes.

**Nodes Involved:**  
- Publish LinkedIn Post  
- Google Sheets Logging  
- Sticky Note - Publish & Log

**Node Details:**

- **Publish LinkedIn Post**  
  - *Type & Role:* LinkedIn node that posts content to a personal LinkedIn profile.  
  - *Configuration:*  
    - Text content is set dynamically from AI Content Generator output (`={{ $json.message.content }}`).  
    - Person/profile ID must be specified (`YOUR_LINKEDIN_PROFILE_ID`).  
    - No additional fields specified.  
  - *Connections:* Output connects to "Google Sheets Logging".  
  - *Version:* 1.  
  - *Potential Failures:* Authentication errors, invalid profile ID, LinkedIn API rate limits, content restrictions or rejections by LinkedIn.  
  - *Credentials:* Requires valid LinkedIn OAuth2 credentials.  
  - *Sub-workflow:* None.

- **Google Sheets Logging**  
  - *Type & Role:* Google Sheets node appending a row to a spreadsheet for tracking published jobs.  
  - *Configuration:*  
    - Appends with columns "Job Title" and "Published".  
    - Job Title is taken from cleaned job data (`={{ $('Clean and Standardize Job Data').item.json.title }}`).  
    - Published status is hardcoded as "Yes".  
    - Target sheet is specified by `YOUR_SHEET_ID_HERE` and sheet gid=0.  
  - *Connections:* Terminal node.  
  - *Version:* 4.7.  
  - *Potential Failures:* Authentication failures with Google API, incorrect spreadsheet ID or permissions, network issues.  
  - *Credentials:* Requires Google Sheets OAuth2 credentials.  
  - *Sub-workflow:* None.

- **Sticky Note - Publish & Log**  
  - *Role:* Explains that the workflow concludes by publishing to LinkedIn and logging the event for internal audit.  
  - *Sticky Note Content:* "The final content is published on LinkedIn. Finally, the job title and publishing status are logged in the **Google Sheets Logging** node for internal audit."

---

### 3. Summary Table

| Node Name                   | Node Type                  | Functional Role                              | Input Node(s)                  | Output Node(s)               | Sticky Note                                                                                                           |
|-----------------------------|----------------------------|----------------------------------------------|-------------------------------|------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Recrutei Webhook Trigger     | Webhook                    | Entry point, listens for new job event      | —                             | Clean and Standardize Job Data | This is the **entry point** of the workflow. It listens for a POST request from the Recrutei ATS whenever a new job is created/published. You must copy the Webhook URL and configure it in Recrutei. |
| Clean and Standardize Job Data | Code                       | Cleans and converts boolean fields           | Recrutei Webhook Trigger      | Transform Data to AI Prompt   | Uses two Code nodes to clean the raw data (Code 1: Boolean conversion) and structure it (Code 2: Markdown prompt generation) for optimal AI interpretation. |
| Transform Data to AI Prompt   | Code                       | Formats job data into detailed Markdown prompt | Clean and Standardize Job Data | AI Content Generator          | Uses two Code nodes to clean the raw data (Code 1: Boolean conversion) and structure it (Code 2: Markdown prompt generation) for optimal AI interpretation. |
| AI Content Generator          | OpenAI (LangChain)         | Generates AI marketing copy for LinkedIn job posting | Transform Data to AI Prompt    | Publish LinkedIn Post         | The **OpenAI model** acts as a professional copywriter. It takes the structured prompt and generates an engaging, marketing-focused text ready for LinkedIn. |
| Publish LinkedIn Post         | LinkedIn                   | Publishes the AI-generated content on LinkedIn | AI Content Generator          | Google Sheets Logging         | The final content is published on LinkedIn. Finally, the job title and publishing status are logged in the **Google Sheets Logging** node for internal audit. |
| Google Sheets Logging         | Google Sheets              | Logs job title and publishing status          | Publish LinkedIn Post          | —                            | The final content is published on LinkedIn. Finally, the job title and publishing status are logged in the **Google Sheets Logging** node for internal audit. |
| Sticky Note - Trigger         | Sticky Note                | Instructional note at entry point              | —                             | —                            | This is the **entry point** of the workflow. It listens for a POST request from the Recrutei ATS whenever a new job is created/published. You must copy the Webhook URL and configure it in Recrutei. |
| Sticky Note - Data Pre-processing | Sticky Note             | Explains data cleaning and prompt generation | —                             | —                            | Uses two Code nodes to clean the raw data (Code 1: Boolean conversion) and structure it (Code 2: Markdown prompt generation) for optimal AI interpretation. |
| Sticky Note - AI Generation   | Sticky Note                | Describes AI content generation role          | —                             | —                            | The **OpenAI model** acts as a professional copywriter. It takes the structured prompt and generates an engaging, marketing-focused text ready for LinkedIn. |
| Sticky Note - Publish & Log   | Sticky Note                | Explains publishing and logging process       | —                             | —                            | The final content is published on LinkedIn. Finally, the job title and publishing status are logged in the **Google Sheets Logging** node for internal audit. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node ("Recrutei Webhook Trigger")**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `new-job-created`  
   - Save the generated Webhook URL and configure it in Recrutei ATS to send new job creation events.  
   - No credentials needed.

2. **Add Code Node ("Clean and Standardize Job Data")**  
   - Purpose: Convert numeric boolean fields to "yes"/"no" strings.  
   - Copy and paste JavaScript code:  
     ```javascript
     return items.map(item => {
       const body = item.json.body;
       const convertBoolean = (value) => value === 1 ? 'yes' : 'no';
       body.fixed_remuneration = convertBoolean(body.fixed_remuneration);
       body.remote = convertBoolean(body.remote);
       body.pcd = convertBoolean(body.pcd);
       body.is_inclusive = convertBoolean(body.is_inclusive);
       return body;
     });
     ```  
   - Connect output of Webhook node to this node.

3. **Add Code Node ("Transform Data to AI Prompt")**  
   - Purpose: Create formatted Markdown prompt for AI input.  
   - Paste the JavaScript code provided in the workflow that:  
     - Maps fields to labels  
     - Cleans HTML tags from descriptions  
     - Formats remuneration as USD currency  
     - Constructs the detailed Markdown string named `detailedJobPrompt`  
   - Connect output of "Clean and Standardize Job Data" to this node.

4. **Add OpenAI Node ("AI Content Generator")**  
   - Integration: Use LangChain OpenAI node (or standard OpenAI node with chat completion).  
   - Model: `gpt-4o-mini` or equivalent GPT-4o model.  
   - Messages:  
     - User message content: Use expression `={{ $json.detailedJobPrompt }}`  
     - System message: "You are a professional HR Marketing Copywriter. Your task is to receive detailed job information and transform it into an engaging, attractive LinkedIn post for candidate attraction. Focus on benefits, culture, and key responsibilities. Include relevant hashtags."  
   - Configure OpenAI API credentials.  
   - Connect output of "Transform Data to AI Prompt" to this node.

5. **Add LinkedIn Node ("Publish LinkedIn Post")**  
   - Type: LinkedIn  
   - Text: Use expression `={{ $json.message.content }}` to get AI-generated post.  
   - Person: Enter your LinkedIn Profile ID (fetch from LinkedIn API if needed).  
   - Configure LinkedIn OAuth2 credentials.  
   - Connect output of "AI Content Generator" to this node.

6. **Add Google Sheets Node ("Google Sheets Logging")**  
   - Operation: Append  
   - Document ID: Enter your Google Sheets document ID.  
   - Sheet name or GID: `gid=0` (or your target sheet).  
   - Columns to append:  
     - "Job Title" → expression: `={{ $('Clean and Standardize Job Data').item.json.title }}`  
     - "Published" → set as "Yes" (static string)  
   - Configure Google Sheets OAuth2 credentials.  
   - Connect output of "Publish LinkedIn Post" to this node.

7. **Add Sticky Notes (Optional but Recommended)**  
   - Place notes near the nodes describing purpose and instructions as per the sticky notes in the original workflow.

8. **Activate Workflow**  
   - Test the webhook URL by triggering a POST with sample job data from Recrutei ATS.  
   - Validate each step’s output using n8n’s execution preview.  
   - Monitor LinkedIn post publication and Google Sheets logging.

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                                                                                           |
|-------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| The OpenAI GPT-4o-mini model is recommended for best performance; ensure your OpenAI plan supports this model.                 | [OpenAI Model Documentation](https://platform.openai.com/docs/models/gpt-4o)                             |
| For LinkedIn Profile ID, you may use LinkedIn API or your personal profile URN to correctly target posts.                      | LinkedIn Developer Docs: https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ |
| Google Sheets node requires proper OAuth2 setup with Google API Console and enabled Sheets API.                                | Google API Console: https://console.cloud.google.com/apis/library/sheets.googleapis.com                   |
| When cleaning HTML in job descriptions, the code attempts to preserve list formatting and basic Markdown styling.              | Important for maintaining readability in AI prompt and final LinkedIn post.                              |
| The workflow assumes numeric booleans as 0/1; if Recrutei changes data format, adjust the conversion logic accordingly.       |                                                                                                          |

---

**Disclaimer:**  
The provided text is derived exclusively from an n8n automated workflow. It complies strictly with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.