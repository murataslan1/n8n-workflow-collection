Automate B2B Lead Generation & Personalized Cold Emails with Apollo, Apify & GPT

https://n8nworkflows.xyz/workflows/automate-b2b-lead-generation---personalized-cold-emails-with-apollo--apify---gpt-9393


# Automate B2B Lead Generation & Personalized Cold Emails with Apollo, Apify & GPT

### 1. Workflow Overview

This workflow automates B2B lead generation and personalized cold email outreach by integrating Apollo (lead search platform), Apify (data scraping actor), and GPT-based AI models. It is designed for sales and marketing teams aiming to find targeted leads based on user-defined criteria, enrich lead data with AI-generated summaries, and send personalized cold emails in a controlled manner.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Collect lead search criteria via a form.
- **1.2 Apollo URL Generation:** Convert form input into an Apollo search URL.
- **1.3 Lead Data Extraction:** Use Apify actor to scrape lead data from Apollo based on generated URL.
- **1.4 Data Parsing & Enrichment:** Parse raw lead data and generate AI summaries for personalized messaging.
- **1.5 Lead Sorting:** Separate leads with and without email addresses.
- **1.6 Data Storage:** Append leads into Google Sheets, separated by email availability.
- **1.7 Email Generation:** Create personalized email content for each lead using GPT.
- **1.8 Email Sending:** Send emails individually with controlled pacing and notify when complete.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Captures user input defining the characteristics of leads to generate (e.g., job title, company size, keywords, location).
- **Nodes Involved:**  
  - On form submission  
- **Node Details:**  
  - **On form submission**:  
    - *Type:* Form Trigger  
    - *Configuration:* Displays a form titled "Apollo + Apify Lead Generation" with fields: Job Title (text), Company Size (dropdown with predefined ranges), Keywords (text), and Location (text).  
    - *Inputs:* None (triggered by form submit webhook).  
    - *Outputs:* JSON containing form field values.  
    - *Edge Cases:* Missing or malformed inputs could affect downstream URL generation. Validate inputs if needed.

#### 1.2 Apollo URL Generation

- **Overview:** Transforms form input into a valid Apollo search URL with parameters mapped precisely to Apollo's search filters.
- **Nodes Involved:**  
  - Apollo URL Generator  
  - LINK PASER (AI node chained to this)  
- **Node Details:**  
  - **Apollo URL Generator:**  
    - *Type:* LangChain Chain LLM  
    - *Configuration:* Uses a prompt instructing GPT to generate an Apollo search URL from the four specific fields: personLocation, jobTitle, companySize, keywords.  
    - *Key expressions:* Uses expressions to embed form field values in the prompt.  
    - *Input:* JSON from form submission.  
    - *Output:* Apollo search URL string.  
    - *Edge Cases:* Incorrect or incomplete form data could yield invalid URLs.  
  - **LINK PASER:**  
    - *Type:* LangChain Chat GPT (GPT-5)  
    - *Role:* Post-processing or validation of generated URL (chained AI node).  
    - *Input:* Output from Apollo URL Generator.  
    - *Output:* Processed URL for Apify call.

#### 1.3 Lead Data Extraction

- **Overview:** Calls Apify actor to scrape lead data from Apollo using predefined search criteria.
- **Nodes Involved:**  
  - Run Apify  
  - Limit  
- **Node Details:**  
  - **Run Apify:**  
    - *Type:* HTTP Request  
    - *Configuration:* POST request to Apify actor "lead-scraper-apollo-zoominfo-lusha" with JSON body configuring filters such as companyCountry, employee size, industry, etc.  
    - *Authentication:* HTTP Bearer token (user must enter their Apify API token).  
    - *Input:* URL from previous block (although in the JSON, the body seems hardcoded; could be improved to use dynamic URL).  
    - *Output:* Raw dataset of leads from Apify.  
    - *Edge Cases:* API rate limits, invalid token, no data returned.  
  - **Limit:**  
    - *Type:* Limit node  
    - *Configuration:* Limits the number of leads processed downstream to 5 (configurable).  
    - *Input:* Output from Run Apify.  
    - *Output:* Limited lead items.

#### 1.4 Data Parsing & Enrichment

- **Overview:** Parses raw lead data into structured fields, extracts key information, and synthesizes a professional summary for each lead.
- **Nodes Involved:**  
  - Parse Lead Data  
  - Structured Output Parser  
  - Parse Data module (AI node)  
- **Node Details:**  
  - **Parse Lead Data:**  
    - *Type:* LangChain Chain LLM  
    - *Configuration:* Custom prompt instructing AI to extract fields (full name, email, LinkedIn, title, company info) from raw JSON, substituting "BRAK" if missing. Also instructs AI to generate a concise 2-3 sentence summary for sales purposes.  
    - *Input:* Individual lead items from Apify.  
    - *Output:* JSON with fields: fullName, email, title, LinkedIn, companyName, companyWebsite, companyLinkedIn, summary.  
    - *Edge Cases:* Missing fields, malformed input JSON, AI failing to produce valid JSON.  
  - **Structured Output Parser:**  
    - *Type:* LangChain Output Parser  
    - *Role:* Ensures AI output conforms to correct JSON schema.  
    - *Input:* AI-generated data.  
  - **Parse Data module:**  
    - *Type:* LangChain Chat GPT (gpt-4.1-mini)  
    - *Role:* Additional AI parsing or enrichment chained to "Parse Lead Data" for accuracy or improved summary.  
    - *Input/Output:* Feeds into Parse Lead Data node.

#### 1.5 Lead Sorting

- **Overview:** Sorts parsed leads into two groups based on presence or absence of email addresses for targeted follow-up.
- **Nodes Involved:**  
  - If  
  - Leads without email  
  - Add to Google Sheet  
- **Node Details:**  
  - **If:**  
    - *Type:* If node with condition checking if extracted email equals "BRAK" (missing email).  
    - *Input:* Parsed lead data.  
    - *Output:* Leads without email (true branch), leads with email (false branch).  
  - **Leads without email:**  
    - *Type:* Google Sheets node  
    - *Configuration:* Appends/updates leads without email into a dedicated sheet.  
    - *Input:* True branch of If node.  
    - *Output:* Stored data for leads lacking emails.  
  - **Add to Google Sheet:**  
    - *Type:* Google Sheets node  
    - *Configuration:* Appends leads with email into a separate sheet with enriched fields including AI summary.  
    - *Input:* False branch of If node.  
    - *Output:* Stored data for leads with emails.

#### 1.6 Data Storage

- **Overview:** Persists lead data into Google Sheets, enabling record keeping and further manual or automated use.
- **Nodes Involved:**  
  - Add to Google Sheet  
  - Leads without email  
- **Node Details:**  
  - Both nodes use Google Sheets OAuth2 credentials to append or update rows in a specific sheet and tab.  
  - Fields stored include full name, email, title, LinkedIn profiles, company info, AI summary, and additional metadata columns to track status.  
  - Edge cases: Google API quota limits, schema mismatches, network errors.

#### 1.7 Email Generation

- **Overview:** Generates personalized cold emails for each lead using AI, leveraging extracted data and custom email template.
- **Nodes Involved:**  
  - Creating a email  
- **Node Details:**  
  - **Creating a email:**  
    - *Type:* LangChain OpenAI (GPT-5)  
    - *Configuration:* Uses AI to rewrite a cold email template incorporating lead-specific data extracted previously, preserving message structure and tone.  
    - *Input:* JSON output from "Add to Google Sheet" (lead data).  
    - *Output:* Personalized email content for each lead.  
    - *Edge Cases:* API limits, generation errors, improper personalization.

#### 1.8 Email Sending

- **Overview:** Sends out personalized cold emails individually with pacing to avoid spam filters and notifies user upon completion.
- **Nodes Involved:**  
  - Loop Over Items1  
  - Sending cold email Gmail  
  - Sending cold email  
  - Wait  
  - message confirming end of work  
  - No Operation, do nothing  
- **Node Details:**  
  - **Loop Over Items1:**  
    - *Type:* SplitInBatches  
    - *Role:* Iterates over each personalized email for sending.  
  - **Sending cold email Gmail:**  
    - *Type:* Gmail node  
    - *Configuration:* Sends emails via Gmail OAuth2 credentials, recipient is lead’s email, content is AI-generated email text.  
    - *Edge Cases:* Gmail API limits, authentication errors, rejected emails.  
  - **Sending cold email:**  
    - *Type:* SMTP Email Send node  
    - *Configuration:* Alternative email sending option via SMTP credentials if Gmail is not used.  
  - **Wait:**  
    - *Type:* Wait node  
    - *Configuration:* Pauses workflow for 10 minutes between sending emails, configurable to avoid spam detection by throttling sends.  
  - **message confirming end of work:**  
    - *Type:* Gmail node  
    - *Configuration:* Sends a notification email to user confirming all emails were sent successfully.  
  - **No Operation, do nothing:**  
    - *Type:* NoOp node  
    - *Role:* Terminator node after notification, ends workflow gracefully.  

---

### 3. Summary Table

| Node Name               | Node Type                     | Functional Role                          | Input Node(s)                | Output Node(s)               | Sticky Note                                                                                           |
|-------------------------|-------------------------------|----------------------------------------|-----------------------------|-----------------------------|-----------------------------------------------------------------------------------------------------|
| On form submission      | Form Trigger                  | Collect lead search input               | —                           | Apollo URL Generator         | ## START In this section, a form pops up where we enter our leads' preferences...                    |
| Apollo URL Generator    | LangChain Chain LLM           | Generate Apollo search URL from input   | On form submission           | Run Apify                   | —                                                                                                   |
| LINK PASER             | LangChain Chat GPT (GPT-5)     | Post-process Apollo URL                  | Apollo URL Generator         | Apollo URL Generator (chain) | —                                                                                                   |
| Run Apify              | HTTP Request                  | Run Apify actor to scrape lead data     | Apollo URL Generator         | Limit                       | BY MIRAI APIFY ACTOR https://console.apify.com/actors/jljBwyyQakqrL1wae/input                       |
| Limit                  | Limit                        | Limit number of leads processed          | Run Apify                   | Parse Lead Data             | ## Parse Lead Data In Nodae, you specify the number of leads you want to convert into emails...     |
| Parse Lead Data         | LangChain Chain LLM           | Extract and summarize lead data          | Limit                       | If                         | —                                                                                                   |
| Structured Output Parser | LangChain Output Parser       | Validate AI output JSON                   | Parse Lead Data             | Parse Lead Data (chain)     | —                                                                                                   |
| Parse Data module       | LangChain Chat GPT (gpt-4.1)  | Additional parsing/enrichment             | —                           | Parse Lead Data (chain)     | —                                                                                                   |
| If                     | If                           | Sort leads by presence of email          | Parse Lead Data             | Leads without email, Add to Google Sheet | ## SORTING In this section, leads are divided into two groups: those who have an email address and those who do not. |
| Leads without email    | Google Sheets                 | Save leads lacking emails                 | If (true branch)            | —                           | —                                                                                                   |
| Add to Google Sheet    | Google Sheets                 | Save leads with emails                    | If (false branch)           | Creating a email            | ## SORTING In this section, leads are divided into two groups: those who have an email address and those who do not. |
| Creating a email       | LangChain OpenAI (GPT-5)      | Generate personalized cold email         | Add to Google Sheet         | Loop Over Items1            | ## EMAIl MAGIC The data we receive from APIFY is used to create personalized emails. Individually for each lead. |
| Loop Over Items1       | SplitInBatches               | Iterate over each email for sending      | Creating a email            | Sending cold email, message confirming end of work | ## Sending emails The Loop node allows you to send each email individually...                    |
| Sending cold email     | SMTP Email Send              | Send email via SMTP                       | Loop Over Items1            | Wait                       | ## Sending emails ...If you use a mailbox with your own domain, enter your credentials here...       |
| Sending cold email Gmail | Gmail                       | Send email via Gmail OAuth2               | Loop Over Items1            | Wait                       | ## Sending emails If you use a @gmail.com email address, connect it here...                          |
| Wait                   | Wait                        | Pause between sending emails              | Sending cold email, Sending cold email Gmail | Loop Over Items1            | ## Sending emails NODE wait creates a pause between sending individual emails...                    |
| message confirming end of work | Gmail                 | Notify user that all emails have been sent | Loop Over Items1            | No Operation, do nothing    | ## Sending emails message confirming end of work NODE after the LOOP process is complete...         |
| No Operation, do nothing | NoOp                       | Workflow termination node                  | message confirming end of work | —                           | ## Sending emails message confirming end of work NODE after the LOOP process is complete...         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node (On form submission):**  
   - Type: Form Trigger  
   - Configure form title: "Apollo + Apify Lead Generation"  
   - Add fields:  
     - Job Title (text input)  
     - Company Size (dropdown with options: 1-10, 11-50, 51-200, 201-1000, 5001-10000, 10001-100000)  
     - Keywords (text input)  
     - Location (text input)  
   - Set webhook ID autogenerated.

2. **Add LangChain Chain LLM Node (Apollo URL Generator):**  
   - Model: GPT (default or GPT-5 if available)  
   - Prompt: Use a template that maps form fields to Apollo URL parameters.  
   - Input expressions: Embed form submission fields (Job Title, Company Size, Keywords, Location) into prompt.  
   - Connect input from Form Trigger node.

3. **Add LangChain Chat GPT Node (LINK PASER):**  
   - Model: GPT-5  
   - Purpose: Process or validate generated Apollo URL.  
   - Connect as chained AI node to Apollo URL Generator.

4. **Add HTTP Request Node (Run Apify):**  
   - Method: POST  
   - URL: Apify actor endpoint for lead scraping (replace token with your Apify API token).  
   - Body: JSON with search filters (companyCountry, companyEmployeeSize, companyIndustry, hasEmail, etc.)  
   - Authentication: HTTP Bearer with Apify API token.  
   - Connect input from Apollo URL Generator (or LINK PASER if used).

5. **Add Limit Node (Limit):**  
   - Set maxItems to desired lead count (default 5).  
   - Connect input from Run Apify node.

6. **Add LangChain Chain LLM Node (Parse Lead Data):**  
   - Model: GPT (with output parser)  
   - Prompt: Extract key data fields from raw JSON, substitute "BRAK" if missing, generate brief sales summary.  
   - Connect input from Limit node.

7. **Add LangChain Output Parser Node (Structured Output Parser):**  
   - Define expected JSON schema for parsed lead data.  
   - Connect AI output parser to Parse Lead Data node.

8. **Add LangChain Chat GPT Node (Parse Data module):**  
   - Model: GPT-4.1-mini  
   - Purpose: Further parse or enrich lead data.  
   - Connect as AI language model to Parse Lead Data node.

9. **Add If Node (If):**  
   - Condition: Check if parsed lead email equals "BRAK".  
   - Connect input from Parse Lead Data node.

10. **Add Google Sheets Node (Leads without email):**  
    - Operation: Append or update rows.  
    - Set document ID and sheet name for leads without email.  
    - Map columns: Full Name, Email, Title, LinkedIn, Company Name, Company Website, Company LinkedIn, AI Summary.  
    - Connect to If node true output.

11. **Add Google Sheets Node (Add to Google Sheet):**  
    - Operation: Append rows for leads with email.  
    - Use same or different sheet tab as per requirement.  
    - Map extended columns including PRASER and MAIL fields.  
    - Connect to If node false output.

12. **Add LangChain OpenAI Node (Creating a email):**  
    - Model: GPT-5  
    - Prompt: Rewrite cold email template injecting lead-specific data (from "Add to Google Sheet" output).  
    - Credentials: OpenAI API.  
    - Connect input from Add to Google Sheet.

13. **Add SplitInBatches Node (Loop Over Items1):**  
    - Purpose: Iterate over each personalized email.  
    - Connect input from Creating a email.

14. **Add Email Sending Nodes:**  
    - **Sending cold email Gmail:**  
      - Type: Gmail node  
      - Configure OAuth2 credentials for Gmail.  
      - Set recipient as lead email, message content from AI output, subject customizable.  
      - Connect input from Loop Over Items1.  
    - **Sending cold email:**  
      - Alternative SMTP email node with SMTP credentials if Gmail not used.  
      - Connect input from Loop Over Items1.

15. **Add Wait Node:**  
    - Configure delay (default 10 minutes) to space out email sending.  
    - Connect outputs of Sending cold email Gmail and Sending cold email nodes to Wait.  
    - Connect Wait output back to Loop Over Items1 to process next batch.

16. **Add Gmail Node (message confirming end of work):**  
    - Sends notification email to user when all emails sent.  
    - Subject: "WORK DONE"  
    - Connect final output from Loop Over Items1.

17. **Add No Operation Node (No Operation, do nothing):**  
    - Terminal node after notification.  
    - Connect input from message confirming end of work.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                        | Context or Link                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| BY MIRAI APIFY ACTOR for lead scraping: https://console.apify.com/actors/jljBwyyQakqrL1wae/input                                                                                   | Apify actor used to scrape leads from Apollo                                                          |
| START block: Form collects lead preferences (position, company size, location, keywords) and requires OpenAI credentials for URL generation and Apify API token input               | Workflow initialization                                                                                |
| Parse Lead Data block: Limits number of leads to process and uses AI to extract and summarize lead info for better email targeting                                                 | Data enrichment                                                                                        |
| SORTING block: Separates leads with and without emails for differentiated handling and storage                                                                                      | Lead management                                                                                        |
| EMAIL MAGIC block: Uses AI to create personalized emails individually for each lead                                                                                                  | Personalization                                                                                         |
| Sending emails block: Loop node sends individual emails, supports Gmail/Outlook/SMTP configurations, uses wait node to pace sending, and sends completion notification email         | Email delivery control                                                                                  |
| Gmail OAuth2 and SMTP credentials must be configured appropriately for email sending nodes                                                                                           | Credential setup                                                                                       |

---

**Disclaimer:** This document is generated from a n8n workflow JSON export and respects all content policies. All data handled is legal and public.