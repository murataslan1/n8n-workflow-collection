AI-Powered Lead Enrichment with Bright Data MCP and Google Sheets

https://n8nworkflows.xyz/workflows/ai-powered-lead-enrichment-with-bright-data-mcp-and-google-sheets-4589


# AI-Powered Lead Enrichment with Bright Data MCP and Google Sheets

### 1. Workflow Overview

This workflow automates lead enrichment by integrating data from Google Sheets, AI-powered scraping and validation via Bright Data MCP and OpenAI models, and updates both Google Sheets and HubSpot CRM accordingly. It targets marketing and sales teams needing enriched, accurate contact and company data to improve outreach quality and data integrity.

The workflow comprises these logical blocks:

- **1.1 Input Reception and Filtering**: Detects lead records needing enrichment in Google Sheets or HubSpot.
- **1.2 Lead Data Preparation**: Splits leads for individual processing and removes unnecessary fields for AI prompting.
- **1.3 AI-Powered Enrichment**: Uses Bright Data MCP client combined with OpenAI chat models to scrape and enrich lead data.
- **1.4 Output Parsing and Auto-Fixing**: Parses AI output with JSON schema validation and auto-corrects if needed.
- **1.5 Accuracy Assessment**: Evaluates AI-enriched data accuracy with OpenAI and assigns confidence scores.
- **1.6 Conditional Record Updating**: Depending on confidence, updates or appends records in Google Sheets and HubSpot; handles error or review cases.
- **1.7 Workflow Triggering and Manual Execution**: Supports automated triggers from Google Sheets and HubSpot events, plus manual workflow execution.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Filtering

**Overview:**  
This block triggers the workflow when new or updated lead records appear in Google Sheets or HubSpot, filtering for those requiring enrichment.

**Nodes Involved:**  
- Google Sheets Trigger  
- Filter the leads that needs enrichment  
- New Contact in Hubpost (OAuth2)  
- New Contact in Hubpost (Private App)  
- Split Out  
- HubSpot  
- Google Sheets1  
- When clicking ‘Execute workflow’  

**Node Details:**  

- **Google Sheets Trigger**  
  - Type: Google Sheets Trigger  
  - Role: Watches a specific Google Sheet tab for updates in the 'status' column every minute.  
  - Configuration: Polls sheet "sampleATcsv" by document ID; monitors 'status' column changes.  
  - Outputs: Only passes leads whose status is empty or "needs more enrichment" through filter node.  
  - Potential Failures: OAuth token expiry, rate limits on Google Sheets API, network issues.

- **Filter the leads that needs enrichment**  
  - Type: Filter  
  - Role: Filters Google Sheet rows where 'status' is empty or equals "needs more enrichment".  
  - Input: Google Sheets Trigger  
  - Output: Leads needing enrichment for further processing.  
  - Edge Cases: Empty or malformed status fields; failsafe on strict string comparison.

- **New Contact in Hubpost (OAuth2)**  
  - Type: HubSpot Trigger  
  - Role: Listens for new contact creation events from HubSpot via OAuth2 authentication.  
  - Input: External event webhook.  
  - Output: Passes new contact data to HubSpot node for detail retrieval.  
  - Failure Modes: Webhook connectivity issues, HubSpot API rate limits or auth failures.

- **New Contact in Hubpost (Private App)**  
  - Type: Webhook  
  - Role: Alternative webhook listener for HubSpot new contacts using a private app token.  
  - Output: Splits webhook body for processing.  
  - Failure Modes: Webhook misconfiguration, security token mismatch.

- **Split Out**  
  - Type: Split Out  
  - Role: Splits incoming array of contacts from webhook into individual items for processing.  
  - Input: New Contact in Hubpost (Private App)  
  - Output: Sends individual contacts to HubSpot node.  
  - Edge Cases: Empty input array or malformed data.

- **HubSpot**  
  - Type: HubSpot node  
  - Role: Retrieves full contact details from HubSpot by contactId/objectId.  
  - Input: Split Out or OAuth2 trigger  
  - Output: Detailed contact info for Google Sheets insertion.  
  - Failure Modes: API errors, missing contactId, auth errors.

- **Google Sheets1**  
  - Type: Google Sheets  
  - Role: Reads rows from Google Sheets filtered by 'status' = "needs more enrichment" (used in manual execution).  
  - Input: Manual Trigger or initial execution  
  - Output: Leads for processing.  
  - Failures: API limits, incorrect filter configuration.

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual start of the workflow to process leads on demand.  
  - Output: Leads from Google Sheets1 node.  

---

#### 1.2 Lead Data Preparation

**Overview:**  
Prepares individual leads for enrichment by splitting into batches and removing extraneous fields to streamline AI input.

**Nodes Involved:**  
- Process each leads one by one  
- Remove unneccessary fields for the prompt  

**Node Details:**  

- **Process each leads one by one**  
  - Type: Split In Batches  
  - Role: Processes leads individually to handle one lead per workflow iteration.  
  - Input: Filter or Google Sheets nodes  
  - Output: Single lead JSON to downstream enrichment nodes.  
  - Edge Cases: Large batch sizes might cause delays; empty inputs.

- **Remove unneccessary fields for the prompt**  
  - Type: Set  
  - Role: Excludes fields like 'row_number', 'status', 'row_id' to keep prompt concise.  
  - Input: Process each leads one by one  
  - Output: Clean lead data for AI prompt.  
  - Edge Cases: Missing fields or unexpected data types.

---

#### 1.3 AI-Powered Enrichment

**Overview:**  
Leverages Bright Data MCP tools and OpenAI chat models to scrape enriched lead and company data based on lead info.

**Nodes Involved:**  
- Scraper AI Agent  
- Bright Data MCP Client  
- OpenAI Chat Model  
- Auto-fixing Output Parser  
- Structured Output Parser  

**Node Details:**  

- **Scraper AI Agent**  
  - Type: LangChain Agent node  
  - Role: Main orchestrator using instructions to scrape and enrich lead and company data via attached tools.  
  - Configuration: Uses person and company enrichment instructions with iterative scraping steps, limited to 30 iterations.  
  - Inputs: Clean lead data JSON  
  - Outputs: Enriched data in structured JSON format with intermediate steps logged.  
  - Edge Cases: Rate limiting with Bright Data MCP, AI model timeouts, malformed scraping results.

- **Bright Data MCP Client**  
  - Type: MCP Client Tool  
  - Role: Provides access to multiple data scraping tools including LinkedIn, Crunchbase, Instagram, TikTok, and search engines.  
  - Configuration: Includes selected tools for social profile and company data scraping.  
  - Input: Requests from Scraper AI Agent  
  - Output: Scraped data to AI agent  
  - Failures: SSE endpoint failures, tool-specific scraping errors, connectivity issues.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Provides natural language processing and reasoning for scraping logic, data enrichment, and output formatting.  
  - Configuration: Uses GPT-4.1-mini or GPT-4o-mini models for completion.  
  - Input: Prompts from agent and previous nodes  
  - Output: AI-generated responses  
  - Failures: API limits, auth errors, model unavailability.

- **Auto-fixing Output Parser**  
  - Type: LangChain Auto-fixing Output Parser  
  - Role: Attempts to fix AI output JSON formatting errors and ensures output complies with expected schema.  
  - Configuration: Returns only first_name, last_name, email, and scrape_error fields if error occurs.  
  - Input: AI model output  
  - Output: Validated or corrected JSON data  
  - Edge Cases: Unfixable syntax errors, incomplete data.

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Validates AI output against a strict JSON schema defining all lead and company enrichment fields with required fields (first_name, last_name, email).  
  - Input: Auto-fixing Output Parser results  
  - Output: Fully structured lead enrichment data for further processing  
  - Edge Cases: Schema validation failures, missing required fields.

---

#### 1.4 Accuracy Assessment

**Overview:**  
Assesses the quality of AI-enriched data by comparing it to original lead data and assigns a confidence score.

**Nodes Involved:**  
- Merge  
- Merge1  
- Judge the accuracy of scraped data  
- Extract the AI results only  

**Node Details:**  

- **Merge**  
  - Type: Merge  
  - Role: Combines original lead data and AI output for comparison.  
  - Input: AI agent output and original lead data.  
  - Output: Combined data to accuracy judge node.  

- **Merge1**  
  - Type: Merge  
  - Role: Combines judge results with previous data for further processing.  
  - Input: Judge the accuracy node and Extract the AI results only node.  

- **Judge the accuracy of scraped data**  
  - Type: OpenAI node (LangChain)  
  - Role: Uses GPT-4o-mini model to evaluate how closely AI output matches original data.  
  - Output: JSON with confidence (0–1) and remarks explaining evaluation.  
  - Failures: Model or API errors, ambiguous comparison results.

- **Extract the AI results only**  
  - Type: Set  
  - Role: Extracts confidence score and remarks from judge output for conditional logic.  

---

#### 1.5 Conditional Record Updating

**Overview:**  
Updates Google Sheets and HubSpot records based on confidence score, with different paths for high confidence, low confidence, or no match.

**Nodes Involved:**  
- Check the confidence score  
- Override the record if the confidence score is equal or greater than 85%  
- Add record if the confidence score is below 85%  
- Update row_id and status  
- Update the status of the record  
- Update the status of the original record  
- Set Desired Confidence Score  
- Update the Hubspot Contact  
- No Operation, do nothing  
- Not matched route  
- Space requests by 5 seconds  
- Just to make the connection neat  

**Node Details:**  

- **Check the confidence score**  
  - Type: If  
  - Role: Branches workflow based on confidence ≥ 0.85 or below.  
  - Input: Add confidence score node  

- **Override the record if the confidence score is equal or greater than 85%**  
  - Type: Google Sheets (Update)  
  - Role: Updates existing Google Sheets record with enriched data for high confidence results.  
  - Input: Check the confidence score (true branch)  
  - Outputs: Connects to wait node for spacing requests.  
  - Failures: API errors, concurrency update conflicts.

- **Add record if the confidence score is below 85%**  
  - Type: Google Sheets (Append)  
  - Role: Appends enriched record as new row flagged for human review.  
  - Input: Check the confidence score (false branch) via Update row_id and status node.  
  - Failures: API errors, data duplication risk.

- **Update row_id and status**  
  - Type: Set  
  - Role: Modifies row_id to unique value and sets status to "human review needed" for low confidence entries.  

- **Update the status of the record**  
  - Type: Google Sheets (Update)  
  - Role: Marks original record status as "no information found" if enrichment fails to match lead.  

- **Update the status of the original record**  
  - Type: Google Sheets (Update)  
  - Role: Sets status to "human review needed" for records appended for manual review.  

- **Set Desired Confidence Score**  
  - Type: If  
  - Role: Further filters confidence score threshold for updating HubSpot contacts (threshold > 0.89).  

- **Update the Hubspot Contact**  
  - Type: HubSpot  
  - Role: Updates HubSpot contact properties with enriched data for high-confidence leads.  
  - Inputs: Set Desired Confidence Score node.  
  - Failures: HubSpot API limits, field mapping errors.

- **No Operation, do nothing**  
  - Type: NoOp  
  - Role: Pass-through node used for clean connections or when no action is needed.  

- **Not matched route**  
  - Type: NoOp  
  - Role: Handles cases where AI output does not match original lead data, triggering record status update.  

- **Space requests by 5 seconds**  
  - Type: Wait  
  - Role: Inserts 5-second delay between Google Sheets API write operations to avoid rate limiting.  

- **Just to make the connection neat**  
  - Type: NoOp  
  - Role: Organizes node connections visually and logically.

---

#### 1.6 Workflow Triggering and Manual Execution

**Overview:**  
Supports manual workflow execution and initial data loading to enable on-demand lead processing.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Google Sheets1  
- Process each leads one by one  

**Node Details:**  

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Allows manual initiation of the workflow to process existing leads in Google Sheets.  

- **Google Sheets1**  
  - Reads filtered leads with status "needs more enrichment" for manual processing.  

- **Process each leads one by one**  
  - Splits the retrieved leads for processing as described earlier.

---

### 3. Summary Table

| Node Name                             | Node Type                         | Functional Role                                          | Input Node(s)                            | Output Node(s)                             | Sticky Note                                                                                                  |
|-------------------------------------|----------------------------------|----------------------------------------------------------|----------------------------------------|--------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Google Sheets Trigger                | Google Sheets Trigger             | Trigger on Google Sheets updates                          | -                                      | Filter the leads that needs enrichment    | ## Watch for the updated record in Google Sheets based on the column 'status' Write 'needs more enrichment' in the status column if you want to retry the enrichment |
| Filter the leads that needs enrichment | Filter                          | Filter leads needing enrichment                           | Google Sheets Trigger                   | Process each leads one by one               |                                                                                                              |
| Process each leads one by one        | Split In Batches                 | Process leads individually                                 | Filter the leads that needs enrichment | Remove unneccessary fields for the prompt  |                                                                                                              |
| Remove unneccessary fields for the prompt | Set                           | Clean lead data for AI prompt                              | Process each leads one by one           | Scraper AI Agent                           |                                                                                                              |
| Scraper AI Agent                    | LangChain Agent                 | AI-powered lead enrichment using scraping tools           | Remove unneccessary fields              | Switch, Merge                              | # AI Agent with Bright Data MCP attached Please play around which model suited best                            |
| Bright Data MCP Client               | MCP Client Tool                 | Provides data scraping tools                               | Scraper AI Agent                       | Scraper AI Agent                           |                                                                                                              |
| OpenAI Chat Model                   | LangChain Chat Model            | AI language model for enrichment                           | Scraper AI Agent                       | Auto-fixing Output Parser                  |                                                                                                              |
| Auto-fixing Output Parser           | LangChain Auto-fix Parser       | Validates and fixes AI output                              | OpenAI Chat Model                      | Structured Output Parser                   |                                                                                                              |
| Structured Output Parser            | LangChain Structured Parser     | Validates AI output against schema                         | Auto-fixing Output Parser              | Scraper AI Agent                           |                                                                                                              |
| Switch                            | Switch                         | Branch logic based on lead data completeness              | Scraper AI Agent                       | If2, If1, If                               |                                                                                                              |
| If2                              | If                             | Condition on email matching                                | Switch                               | Merge                                      |                                                                                                              |
| If1                              | If                             | Condition on name matching                                 | Switch                               | Merge                                      |                                                                                                              |
| If                               | If                             | Condition on both email and name                           | Switch                               | Merge                                      |                                                                                                              |
| Merge                            | Merge                          | Combine AI and original lead data                          | If, If1, If2                        | Merge1, Judge the accuracy of scraped data |                                                                                                              |
| Judge the accuracy of scraped data | OpenAI                         | Evaluates accuracy of enriched data                        | Merge                                | Extract the AI results only                | # Identify the accuracy of the scraped data This may serve as another layer of accuracy filtering             |
| Extract the AI results only        | Set                            | Extract confidence and remarks                             | Judge the accuracy of scraped data    | Merge1                                     |                                                                                                              |
| Merge1                           | Merge                          | Combine judge results with extracted data                  | Extract the AI results only, Merge    | Prepare the scraped output for Google Sheets | ## Format the output                                                                                           |
| Prepare the scraped output for Google Sheets | Set                      | Prepare enriched data for Google Sheets                    | Merge1                              | Add confidence score to Google Sheet       |                                                                                                              |
| Add confidence score to Google Sheet | Set                          | Add confidence and remarks to data                         | Prepare the scraped output             | Check the confidence score                 |                                                                                                              |
| Check the confidence score         | If                             | Branch based on confidence threshold (≥0.85)               | Add confidence score to Google Sheet   | Override the record / Add record / Update status |                                                                                                              |
| Override the record if the confidence score is equal or greater than 85% | Google Sheets (Update) | Update Google Sheet record for high confidence             | Check the confidence score (true)     | Space requests by 5 seconds                 | ## Override the record if the confidence score is equal or greater than 85%                                   |
| Add record if the confidence score is below 85% | Google Sheets (Append)      | Append record flagged for human review                     | Update row_id and status              | Space requests by 5 seconds                 | ## Append row if the confidence score is below 85%                                                           |
| Update row_id and status           | Set                            | Modify row_id and status for manual review                 | Check the confidence score (false)    | Add record if the confidence score is below 85% |                                                                                                              |
| Update the status of the record    | Google Sheets (Update)          | Update status to "no information found" for unmatched leads | Not matched route                    | Space requests by 5 seconds                 | ## Scraped data doesn't match the source. This will only update the status of the record.                     |
| Not matched route                 | NoOp                           | Handles unmatched output cases                             | If, If1, If2                      | Update the status of the record             |                                                                                                              |
| Space requests by 5 seconds        | Wait                           | Rate limit spacing of API requests                         | Override/Add record/Update status      | Just to make the connection neat            |                                                                                                              |
| Just to make the connection neat   | NoOp                           | Organizes node connections visually                        | Space requests by 5 seconds            | Process each leads one by one                |                                                                                                              |
| Update the status of the original record | Google Sheets (Update)      | Marks original record as "human review needed"             | Check the confidence score (false) via Update row_id and status | -                                      |                                                                                                              |
| Set Desired Confidence Score       | If                             | Filters confidence threshold (>0.89) for HubSpot update    | No Operation, do nothing              | Update the Hubspot Contact                   |                                                                                                              |
| No Operation, do nothing           | NoOp                           | Pass-through when no update needed                         | Check the confidence score (true) (false branch) | Set Desired Confidence Score / Update row_id and status |                                                                                                              |
| Update the Hubspot Contact         | HubSpot                        | Updates HubSpot contact with enriched data                 | Set Desired Confidence Score          | -                                           | # Update the Hubspot contact for the high confidence score                                                   |
| Google Sheets                     | Google Sheets                  | Inserts new lead records from HubSpot                       | HubSpot                            | Process each leads one by one                |                                                                                                              |
| HubSpot                          | HubSpot                       | Retrieves full contact details from HubSpot                | Split Out                          | Google Sheets                               |                                                                                                              |
| Split Out                        | Split Out                     | Splits array of contacts from webhook into individual items | New Contact in Hubpost (Private App) | HubSpot                                   |                                                                                                              |
| New Contact in Hubpost (Private App) | Webhook                    | Receives HubSpot contact creation webhook                  | -                                  | Split Out                                   |                                                                                                              |
| New Contact in Hubpost (OAuth2)   | HubSpot Trigger               | Receives HubSpot contact creation event                    | -                                  | HubSpot                                     | ## Manually run the records that is needed enrichment                                                        |
| Google Sheets1                   | Google Sheets                  | Reads leads needing enrichment on manual execution         | When clicking ‘Execute workflow’      | Process each leads one by one                |                                                                                                              |
| When clicking ‘Execute workflow’  | Manual Trigger                | Manual trigger to run workflow                              | -                                  | Google Sheets1                              |                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node**  
   - Type: Google Sheets Trigger  
   - Configure with OAuth2 credentials for your Google account.  
   - Set to monitor specific spreadsheet by Document ID and Sheet Name (e.g., "sampleATcsv").  
   - Watch the 'status' column, polling every minute.  

2. **Add Filter Node ("Filter the leads that needs enrichment")**  
   - Filter condition to pass only rows where 'status' is empty or equals "needs more enrichment".  
   - Input from Google Sheets Trigger node.  

3. **Add Split In Batches Node ("Process each leads one by one")**  
   - Process each lead individually for stepwise enrichment.  
   - Input from Filter node.  

4. **Add Set Node ("Remove unneccessary fields for the prompt")**  
   - Exclude fields: 'row_number', 'status', 'row_id' from lead data.  
   - Input from Split In Batches node.  

5. **Add LangChain Agent Node ("Scraper AI Agent")**  
   - Attach "Bright Data MCP Client" as tool node.  
   - Configure system message with detailed enrichment instructions for person and company data.  
   - Set max iterations to 30.  
   - Enable output parser.  
   - Input from Set node (clean lead data).  

6. **Add MCP Client Tool Node ("Bright Data MCP Client")**  
   - Connect to local SSE endpoint or configured MCP client endpoint.  
   - Include tools for LinkedIn profiles, Crunchbase, TikTok, Instagram, and search engine.  
   - Input from Scraper AI Agent node.  

7. **Add OpenAI Chat Model Node(s)**  
   - Use GPT-4o-mini or GPT-4.1-mini with valid OpenAI API credentials.  
   - Input: connected from Scraper AI Agent for language model calls.  

8. **Add Auto-fixing Output Parser Node**  
   - Configure to only return first_name, last_name, email, scrape_error in error cases.  
   - Input from OpenAI Chat Model node.  

9. **Add Structured Output Parser Node**  
   - Define manual JSON schema with all expected lead and company fields, requiring first_name, last_name, email.  
   - Input from Auto-fixing Output Parser node.  

10. **Add Switch Node**  
    - Define three output branches based on lead data completeness:  
      - "Email only" (email present, no name)  
      - "Name only" (name present, no email)  
      - "Both email and name exists"  
    - Input from Scraper AI Agent output.  

11. **Add If Nodes ("If", "If1", "If2")**  
    - Each checks matching of AI output fields (first_name, last_name, email) with original lead data to confirm match.  
    - Input from Switch node branches.  
    - Outputs connect to Merge node or Not matched route.  

12. **Add Merge Node**  
    - Mode: Choose Branch, use data of input 2 (AI enriched data).  
    - Input: If nodes and Not matched route (NoOp).  
    - Output to Merge1 and Judge the accuracy of scraped data node.  

13. **Add Judge the accuracy of scraped data Node**  
    - OpenAI node with GPT-4o-mini model.  
    - System message instructs evaluation of accuracy and confidence scoring.  
    - Input: merged data.  
    - Output JSON includes confidence and remarks.  

14. **Add Set Node ("Extract the AI results only")**  
    - Extract confidence score and remarks from judge output.  
    - Input from Judge node.  

15. **Add Merge1 Node**  
    - Combine the extracted confidence data with judge output.  
    - Input from Extract node and Judge node.  

16. **Add Set Node ("Prepare the scraped output for Google Sheets")**  
    - Format AI enriched data for Google Sheets update.  
    - Input from Merge1 node.  

17. **Add Set Node ("Add confidence score to Google Sheet")**  
    - Assign remarks, confidence, and row_id for Google Sheets update.  
    - Input from Prepare scraped output.  

18. **Add If Node ("Check the confidence score")**  
    - Condition: confidence ≥ 0.85 branches.  

19. **Add Google Sheets Node ("Override the record if the confidence score is equal or greater than 85%")**  
    - Update existing record with enriched data for high confidence.  
    - Input from Check confidence (true branch).  

20. **Add Google Sheets Node ("Add record if the confidence score is below 85%")**  
    - Append new record flagged for human review.  
    - Input from Update row_id and status node.  

21. **Add Set Node ("Update row_id and status")**  
    - Modify row_id with timestamp suffix, set status to "human review needed".  
    - Input from Check confidence (false branch).  

22. **Add Google Sheets Node ("Update the status of the record")**  
    - Update status to "no information found" if AI output does not match original lead data.  
    - Input from Not matched route (NoOp).  

23. **Add Google Sheets Node ("Update the status of the original record")**  
    - Update status to "human review needed" for low confidence records.  
    - Input from Check confidence (false branch).  

24. **Add If Node ("Set Desired Confidence Score")**  
    - Threshold: confidence > 0.89 for HubSpot update decision.  
    - Input from No Operation, do nothing node.  

25. **Add HubSpot Node ("Update the Hubspot Contact")**  
    - Update HubSpot contact with enriched fields for high confidence leads.  
    - Input from Set Desired Confidence Score node.  
    - Requires HubSpot App Token credentials.  

26. **Add Wait Node ("Space requests by 5 seconds")**  
    - Adds delay between Google Sheets writes to avoid rate limits.  
    - Input from Google Sheets update/append nodes.  

27. **Add No Operation Nodes ("No Operation, do nothing", "Not matched route", "Just to make the connection neat")**  
    - Used for flow control and visual clarity.  

28. **Add Manual Trigger Node ("When clicking ‘Execute workflow’")**  
    - Allows manual start of processing.  
    - Connect to Google Sheets1 node that reads leads needing enrichment.  

29. **Add Google Sheets Node ("Google Sheets1")**  
    - Reads leads from Google Sheets with status "needs more enrichment" for manual run.  
    - Connect to "Process each leads one by one".  

30. **Add HubSpot Trigger Node ("New Contact in Hubpost (OAuth2)")**  
    - Listens for new contact creation events in HubSpot.  
    - Connect to HubSpot node to retrieve full contact data.  

31. **Add Webhook Node ("New Contact in Hubpost (Private App)")**  
    - Alternative webhook for HubSpot new contacts.  
    - Connect to Split Out node to process individual contacts.  

32. **Add HubSpot Node ("HubSpot")**  
    - Retrieves detailed contact information by ID.  
    - Output to Google Sheets node to insert new contact data.  

33. **Add Google Sheets Node ("Google Sheets")**  
    - Inserts new contacts from HubSpot into Google Sheets.  
    - Output to "Process each leads one by one" for enrichment loop.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                           | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Watch for the updated record in Google Sheets based on the column 'status'. Write 'needs more enrichment' in the status column to retry. | Sticky Note near "Google Sheets Trigger" node.                                                 |
| Manually run the records that need enrichment.                                                                                        | Sticky Note near "New Contact in Hubpost (OAuth2)" node.                                       |
| AI Agent with Bright Data MCP attached. Experiment with different AI models to find best fit.                                           | Sticky Note near "Scraper AI Agent" node.                                                     |
| Format the output and compare with original data.                                                                                      | Sticky Note near "Prepare the scraped output for Google Sheets" nodes.                         |
| Identify the accuracy of the scraped data; serves as an additional accuracy filter layer.                                               | Sticky Note near "Judge the accuracy of scraped data" node.                                   |
| Update the record in Google Sheet after enrichment.                                                                                    | Sticky Note near Google Sheets update nodes.                                                  |
| Append row if the confidence score is below 85%; update status accordingly.                                                            | Sticky Notes near nodes handling low confidence branches.                                     |
| Scraped data doesn't match the source; only update status of the record.                                                               | Sticky Note near "Update the status of the record" node.                                      |
| Override record if confidence score is equal or greater than 85%.                                                                       | Sticky Note near "Override the record if the confidence score is equal or greater than 85%" node. |
| Update the HubSpot contact for the high confidence score.                                                                               | Sticky Note near "Update the Hubspot Contact" node.                                           |
| New Contact trigger in HubSpot and save it to Google Drive.                                                                             | Sticky Note near HubSpot trigger and Google Sheets nodes.                                     |

---

This detailed analysis and instructions allow both human developers and AI agents to understand, reproduce, and modify the workflow confidently, with attention to potential failure points and integration nuances.

---

**Disclaimer:** The provided content is extracted exclusively from an automated n8n workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.