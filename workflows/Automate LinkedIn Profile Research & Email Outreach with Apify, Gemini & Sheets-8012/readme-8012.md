Automate LinkedIn Profile Research & Email Outreach with Apify, Gemini & Sheets

https://n8nworkflows.xyz/workflows/automate-linkedin-profile-research---email-outreach-with-apify--gemini---sheets-8012


# Automate LinkedIn Profile Research & Email Outreach with Apify, Gemini & Sheets

### 1. Workflow Overview

This n8n workflow automates the process of researching LinkedIn profiles and generating personalized email outreach drafts using Apify, Google Gemini (via LangChain), and Google Sheets. It targets sales or marketing professionals who want to streamline lead enrichment and email personalization for B2B cold outreach campaigns. The workflow runs periodically, fetching new leads from a Google Sheet, enriching the lead data with detailed LinkedIn profile information, and then generating tailored email subject lines and body content using AI.

Logical blocks:

- **1.1 Input Reception & Filtering**: Scheduled trigger fetches new leads from Google Sheets, filtering only those missing profile data or email drafts.
- **1.2 Profile Data Enrichment (Apify Actor)**: Runs LinkedIn profile scraper on filtered leads and retrieves structured profile details.
- **1.3 Profile Data Storage**: Appends or updates the enriched profile data back into the Google Sheet.
- **1.4 Email Draft Generation (Google Gemini + LangChain)**: For profiles with enriched data but missing email drafts, generates personalized subject lines and email bodies using an LLM.
- **1.5 Final Output Storage**: Writes the generated email drafts back into the Google Sheet for further outreach.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Filtering

**Overview:**  
This block triggers the workflow every 2 minutes, retrieves new rows from the input Google Sheet (CRM leads), and filters only those leads which lack profile data and email drafts, controlling batch size for safe operation.

**Nodes Involved:**  
- Schedule Trigger  
- Get row(s) in sheet  
- Check Profiles with no Data (If node)  
- Limit  
- Sticky Notes (for documentation)

**Node Details:**

- **Schedule Trigger**  
  - Type: ScheduleTrigger  
  - Role: Periodically initiates the workflow every 2 minutes.  
  - Config: Interval set to 2 minutes.  
  - Input/Output: No input; outputs trigger signal.  
  - Edge Cases: If the workflow execution is delayed, multiple triggers could queue up.  
  - Sticky Note: Describes schedule and input sheet fetching.

- **Get row(s) in sheet**  
  - Type: GoogleSheets (Read)  
  - Role: Reads rows from specified Google Sheet (Sheet10) containing lead data.  
  - Config: Document ID and Sheet Name hardcoded to specific Google Sheet.  
  - Input/Output: Trigger input; outputs rows as JSON.  
  - Edge Cases: API rate limits or invalid sheet access permissions.  
  - Sticky Note: Describes fetching LinkedIn URLs and lead data.

- **Check Profiles with no Data**  
  - Type: If  
  - Role: Filters rows where both "Profile Data" and "Subject" fields are empty (indicating unprocessed leads).  
  - Config: Two string emptiness conditions combined with AND.  
  - Input: Rows from Google Sheets.  
  - Output: Only passes leads missing profile data and email subject.  
  - Edge Cases: If field names change or contain unexpected nulls, filter may fail.

- **Limit**  
  - Type: Limit  
  - Role: Limits the number of leads processed per run to avoid overloading Apify or triggering LinkedIn blocks.  
  - Config: Default limit (not explicitly set, so uses default of 1).  
  - Input: Filtered leads from If node.  
  - Output: Limited batch forwarded for processing.  
  - Edge Cases: Setting limit too low slows throughput; too high risks blocking.

- **Sticky Notes**  
  - Provide explanations for scheduling, input fetching, filtering, and limiting behavior.

---

#### 2.2 Profile Data Enrichment (Apify Actor)

**Overview:**  
This block runs an Apify actor that scrapes LinkedIn profile details for each lead URL and fetches the structured dataset output containing detailed career information.

**Nodes Involved:**  
- Runs Profile Extraction Actor (Apify)  
- Get dataset items (Apify)  
- Sticky Note

**Node Details:**

- **Runs Profile Extraction Actor**  
  - Type: Apify  
  - Role: Executes the "Linkedin Profile Details Scraper + EMAIL" actor on Apify platform using the LinkedIn username from lead data.  
  - Config: Actor ID specified; input body contains "includeEmail": false and dynamic "username" from LinkedIn URL.  
  - Input: LinkedIn URLs from Limit node.  
  - Output: Actor run metadata including defaultDatasetId.  
  - Edge Cases: Actor timeout, invalid usernames, or Apify API limits.  
  - Requires Apify API credentials.

- **Get dataset items**  
  - Type: Apify (Datasets)  
  - Role: Retrieves the structured dataset results from the previous actor run using the defaultDatasetId.  
  - Config: Dataset ID dynamically pulled from previous node output.  
  - Input: Actor run output.  
  - Output: JSON containing About section, Experience arrays, Roles, Companies.  
  - Edge Cases: Dataset not ready or empty if actor failed.

- **Sticky Note**  
  - Explains the actor’s role in enriching profile data.

---

#### 2.3 Profile Data Storage

**Overview:**  
This block updates the Google Sheet with the enriched profile data for each lead, appending detailed About and Experience information under the "Profile Data" column.

**Nodes Involved:**  
- Append or update row in sheet  
- Sticky Note

**Node Details:**

- **Append or update row in sheet**  
  - Type: GoogleSheets (Append or Update)  
  - Role: Writes enriched profile data back to the Google Sheet, matching rows by LinkedIn URL and updating Profile Data column.  
  - Config: Defines columns to update with dynamic expressions combining About and Experience fields formatted as multi-line text.  
  - Input: Dataset items JSON from Apify.  
  - Output: Updated sheet rows.  
  - Edge Cases: API write failures, schema mismatches, or concurrency issues.  
  - Mapping uses LinkedIn as matching key.

- **Sticky Note**  
  - Describes appending enriched profile details for personalization.

---

#### 2.4 Email Draft Generation (Google Gemini + LangChain)

**Overview:**  
Takes enriched lead profiles missing email drafts and generates personalized subject lines and email bodies by leveraging Google Gemini Chat Model through LangChain LLM chain, parsing structured JSON outputs.

**Nodes Involved:**  
- Get row(s) in sheet1  
- Check Profiles with No Email Drafts (If)  
- Google Gemini Chat Model  
- Structured Output Parser  
- Hyper Personalised Email Generator (LLM Chain)  
- Sticky Notes

**Node Details:**

- **Get row(s) in sheet1**  
  - Type: GoogleSheets (Read)  
  - Role: Re-fetches updated rows to identify leads with Profile Data but missing Subject and Email Body.  
  - Config: Same sheet as before.  
  - Input: Triggered after profile data is updated.  
  - Output: Rows for email generation filtering.  
  - Edge Cases: Read failures or data sync delays.

- **Check Profiles with No Email Drafts**  
  - Type: If  
  - Role: Filters for leads having Profile Data but empty Subject and Email Body fields.  
  - Config: Checks Profile Data is non-empty AND Subject and Email Body are empty.  
  - Edge Cases: Field inconsistencies.

- **Google Gemini Chat Model**  
  - Type: LangChain Google Gemini Chat Model  
  - Role: Provides the AI language model backend for email generation.  
  - Config: Defaults used; integrated into LangChain chain.  
  - Input: Prompt from Hyper Personalised Email Generator.  
  - Output: Raw AI text output.

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses the AI output to JSON with keys "subject" and "email_body" as required.  
  - Config: JSON schema example provided for validation.  
  - Input: Raw AI response.  
  - Output: Validated JSON for email content.

- **Hyper Personalised Email Generator**  
  - Type: LangChain Chain LLM  
  - Role: Sends a detailed prompt instructing Gemini to generate personalized cold emails based on lead profile details, company offering, and CTA.  
  - Config: The prompt is extensive, specifying style, content requirements, and output format. The output parser ensures structured JSON response.  
  - Input: Lead data from filter node.  
  - Output: JSON with subject and email_body fields.  
  - Edge Cases: AI hallucination or invalid JSON output mitigated by parser.

- **Sticky Notes**  
  - Explain the filtering logic, AI prompt design, and output formatting.

---

#### 2.5 Final Output Storage

**Overview:**  
This block writes the personalized email subjects and bodies back into the Google Sheet alongside LinkedIn URLs and profile data, finalizing the lead row for outreach.

**Nodes Involved:**  
- Final Output (Google Sheets)  
- Sticky Note

**Node Details:**

- **Final Output**  
  - Type: GoogleSheets (Append or Update)  
  - Role: Updates the sheet with "Subject" and "Email Body" fields for each lead, matching by LinkedIn URL.  
  - Config: Uses mapping mode with LinkedIn as key; writes AI-generated subject and body.  
  - Input: Output from Hyper Personalised Email Generator.  
  - Output: Updated sheet rows ready for outreach.  
  - Edge Cases: Write conflicts or API quota errors.

- **Sticky Note**  
  - Describes storing final email drafts.

---

### 3. Summary Table

| Node Name                         | Node Type                     | Functional Role                                  | Input Node(s)                   | Output Node(s)                      | Sticky Note                                                                                   |
|----------------------------------|-------------------------------|-------------------------------------------------|---------------------------------|------------------------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger                 | ScheduleTrigger               | Periodic workflow trigger every 2 minutes       | -                               | Get row(s) in sheet                | ## ⏰ Schedule Trigger & 📄 Google Sheets (Input)\nThis part of the workflow runs every 2 minutes.  \nIt fetches new rows (LinkedIn URLs and lead data) from the CRM sheet.  \nOnly leads without Profile Data or Email drafts move forward. |
| Get row(s) in sheet             | GoogleSheets (Read)           | Fetch leads from Google Sheet                     | Schedule Trigger                | Check Profiles with no Data        | Same as Schedule Trigger note                                                                |
| Check Profiles with no Data     | If                           | Filter leads missing Profile Data & Subject       | Get row(s) in sheet            | Limit                            | ## 🔍 If Check & ⚖️ Limit\n1. The **If node** ensures only leads missing Profile Data and Subject are processed.  \n\n2. The **Limit node** controls batch size to prevent Apify overload or LinkedIn blocks.  \n\nKeeps the workflow safe & efficient. |
| Limit                          | Limit                        | Batch size control to protect external services   | Check Profiles with no Data    | Runs Profile Extraction Actor      | Same as above                                                                               |
| Runs Profile Extraction Actor   | Apify                        | Run LinkedIn Profile Scraper Actor on Apify       | Limit                          | Get dataset items                 | ## 🤖 Apify Actor & 📂 Dataset\n1. Runs the **LinkedIn Profile Scraper** actor on Apify for each LinkedIn URL.  \n\n2. The Dataset node fetches structured results (About, Experience, Roles, Companies).  \n\nThis enriches leads with detailed career data. |
| Get dataset items               | Apify                        | Retrieve scraped profile dataset                   | Runs Profile Extraction Actor  | Append or update row in sheet      | Same as above                                                                               |
| Append or update row in sheet  | GoogleSheets (Append/Update) | Write enriched profile data back into Google Sheet| Get dataset items              | Get row(s) in sheet1               | ## 💾 Google Sheets (Profile Data)\nAppends enriched profile details into the "Profile Data" column in Google Sheets.  \nNow each lead row includes About + Experience insights, ready for email personalisation.\n\n |
| Get row(s) in sheet1           | GoogleSheets (Read)           | Re-fetch rows for leads with profile data but no email drafts | Append or update row in sheet | Check Profiles with No Email Drafts | ## 📄 Get Rows Again & 🔍 If Check (Email)\n1. Pulls updated rows after scraping.  \n\n2. Checks if Profile Data exists but \nSubject + Email Body are still empty.  \n\nEnsures only complete profiles go into email generation. |
| Check Profiles with No Email Drafts | If                     | Filter leads with Profile Data but missing emails | Get row(s) in sheet1           | Hyper Personalised Email Generator | Same as above                                                                               |
| Google Gemini Chat Model       | LangChain Google Gemini Chat | AI language model backend for email generation    | Hyper Personalised Email Generator (ai_languageModel input) | Structured Output Parser           | ## 🧠 LLM Chain (Gemini via LangChain)\n1. Gemini is instructed to act as an expert B2B cold email copywriter.  \n\n2. It generates personalised subject lines & email bodies using career insights, achievements, and context.  \n\n3. Parser ensures Gemini’s response is valid JSON with "subject" + "email_body".\n\nResult: high-relevance outreach emails.\n |
| Structured Output Parser       | LangChain Structured Output Parser | Parses AI output into structured JSON             | Google Gemini Chat Model       | Hyper Personalised Email Generator | Same as above                                                                               |
| Hyper Personalised Email Generator | LangChain Chain LLM       | Generates personalized email subject and body    | Check Profiles with No Email Drafts, Structured Output Parser | Final Output                     | Same as above                                                                               |
| Final Output                   | GoogleSheets (Append/Update) | Writes final email drafts back to Google Sheet    | Hyper Personalised Email Generator | -                              | ## 💾 Google Sheets (Final Email)\nFinal email drafts are stored in Google Sheets alongside LinkedIn URL & Profile Data.  \nEach lead row is now fully ready for outreach 🚀.\n |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Set to trigger every 2 minutes.  
   - Position near start of workflow.

2. **Add Google Sheets node ("Get row(s) in sheet")**  
   - Operation: Read rows.  
   - Configure with your Google Sheets credentials.  
   - Document ID: Your leads spreadsheet ID.  
   - Sheet Name: Sheet containing LinkedIn URLs and lead data (e.g., "Sheet10").  
   - Connect Schedule Trigger → Get row(s) in sheet.

3. **Add an If node ("Check Profiles with no Data")**  
   - Condition: Check that "Profile Data" is empty AND "Subject" is empty.  
   - Use expression: `{{$json["Profile Data"]}}` is empty AND `{{$json.Subject}}` is empty.  
   - Connect Get row(s) in sheet → If node.

4. **Add Limit node**  
   - No explicit limit means default 1; optionally set to a small number like 3–5.  
   - Connect If node (true branch) → Limit node.

5. **Add Apify node ("Runs Profile Extraction Actor")**  
   - Select Apify credentials.  
   - Set Actor ID to LinkedIn Profile Details Scraper actor ID (e.g., "VhxlqQXRwhW8H5hNV").  
   - Set custom body JSON: `{ "includeEmail": false, "username": "{{ $json.LinkedIn }}" }`.  
   - Connect Limit → Runs Profile Extraction Actor.

6. **Add Apify node ("Get dataset items")**  
   - Set Resource: Datasets.  
   - Dataset ID: `{{ $json.defaultDatasetId }}` from previous node.  
   - Connect Runs Profile Extraction Actor → Get dataset items.

7. **Add Google Sheets node ("Append or update row in sheet")**  
   - Operation: Append or Update.  
   - Use same spreadsheet and sheet as before.  
   - Matching column: "LinkedIn".  
   - Columns to update: "Profile Data" with value formatted as:  
     ```
     About : {{ $json.basic_info.about }}

     Experience 1
     Title: ...
     Company: ...
     ...
     ```  
   - Connect Get dataset items → Append or update row in sheet.

8. **Add Google Sheets node ("Get row(s) in sheet1")**  
   - Same configuration as first sheet read.  
   - Connect Append or update row in sheet → Get row(s) in sheet1.

9. **Add If node ("Check Profiles with No Email Drafts")**  
   - Condition: "Profile Data" is not empty AND "Subject" is empty AND "Email Body" is empty.  
   - Connect Get row(s) in sheet1 → If node.

10. **Add LangChain node ("Hyper Personalised Email Generator")**  
    - Type: Chain LLM.  
    - Input text: Provide detailed prompt instructing Gemini to craft personalized cold emails based on lead profile. Include core value proposition, CTA, and instructions for style and output format.  
    - Enable output parser.  
    - Connect If node (true) → Hyper Personalised Email Generator.

11. **Add LangChain Google Gemini Chat Model node ("Google Gemini Chat Model")**  
    - Connect Hyper Personalised Email Generator (ai_languageModel input) → Google Gemini Chat Model.

12. **Add LangChain Structured Output Parser node ("Structured Output Parser")**  
    - Provide JSON schema example with keys "subject" and "email_body".  
    - Connect Google Gemini Chat Model (ai_outputParser output) → Structured Output Parser.

13. **Connect Structured Output Parser → Hyper Personalised Email Generator (ai_outputParser input)**  
    - Ensures parsed output feeds back correctly.

14. **Add Google Sheets node ("Final Output")**  
    - Operation: Append or Update.  
    - Same spreadsheet and sheet.  
    - Matching column: "LinkedIn".  
    - Columns to update: "Subject" with `{{ $json.output.subject }}`, "Email Body" with `{{ $json.output.email_body }}`, and "LinkedIn" for matching.  
    - Connect Hyper Personalised Email Generator → Final Output.

15. **Credentials Setup**  
    - Google Sheets: OAuth2 credentials with read/write access to your spreadsheet.  
    - Apify: API token with access to run actors and retrieve datasets.  
    - Google Gemini (via LangChain): Configure LangChain with Google Gemini API credentials.

16. **Optional: Add Sticky Notes** for documentation and clarity throughout the workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                               | Context or Link                                                                                         |
|----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Workflow runs every 2 minutes to balance freshness and API rate limits.                                                     | Scheduling interval                                                                                     |
| Apify actor used: "Linkedin Profile Details Scraper + EMAIL (No Cookies Required)" by apimaestro.                           | https://console.apify.com/actors/VhxlqQXRwhW8H5hNV                                                     |
| Google Gemini is accessed via LangChain integration for advanced prompt engineering and output parsing.                    | https://js.langchain.com/docs/modules/models/llms/integrations/googlegemini/                           |
| Google Sheets schema includes columns: First Name, Last Name, Job Title, Location, LinkedIn, Company Name, Profile Data, Subject, Email Body | Essential for structured data matching and updating                                                   |
| Email generation prompt emphasizes personalized, peer-level tone avoiding generic sales language, with a clear CTA.        | Custom prompt embedded in the Hyper Personalised Email Generator node                                  |
| Edge cases include API rate limits, invalid LinkedIn URLs, actor failures, AI parsing errors, and concurrency issues on Sheets | Design includes If and Limit nodes to mitigate these                                                 |

---

**Disclaimer:** The provided text is exclusively generated from an automated n8n workflow. It fully complies with content policies and contains no illegal or protected data. All handled data is lawful and publicly available.