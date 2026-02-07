AI-Powered Lead Generation with Apollo, GPT-4, and Telegram to Database

https://n8nworkflows.xyz/workflows/ai-powered-lead-generation-with-apollo--gpt-4--and-telegram-to-database-5611


# AI-Powered Lead Generation with Apollo, GPT-4, and Telegram to Database

### 1. Workflow Overview

This workflow automates lead generation by integrating Telegram message reception, AI-powered natural language understanding, Apollo lead scraping, data deduplication, and database insertion. It targets growth hackers, SDR teams, and founders who gather lead requests through Telegram (voice or text) and want to automatically scrape, verify, deduplicate, and store leads into a single Supabase table.

**Logical blocks:**

- **1.1 Input Reception:** Capture user messages (voice or text) from Telegram.
- **1.2 Audio Transcription & Text Processing:** Convert received voice notes to text using OpenAI Whisper; handle text messages directly.
- **1.3 AI Query Formation:** Use GPT-4 to parse free text into a structured JSON query describing lead search parameters.
- **1.4 URL Construction:** Generate a customized Apollo people-search URL based on the structured query.
- **1.5 Lead Scraping:** Run an Apify actor to scrape leads from Apollo based on the URL.
- **1.6 Data Extraction & Verification:** Extract relevant lead info, filter for verified emails, and deduplicate against existing database entries.
- **1.7 Database Insertion & Notification:** Insert new leads into Supabase and send a Telegram confirmation message with the count of new leads added.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Receives user input from Telegram as either voice notes or text messages.

**Nodes Involved:**  
- User message (Telegram Trigger)  
- Voice or Text1 (Switch node)  
- Download File1 (Telegram node, for voice files)  
- Transcribe1 (OpenAI Whisper transcription)  
- Text1 (Set node for text messages)  
- Sticky Note (for documentation)

**Node Details:**

- **User message**  
  - Type: Telegram Trigger  
  - Role: Entry point that triggers workflow on incoming Telegram messages.  
  - Configuration: Listens for "message" updates only; uses Telegram Bot credentials.  
  - Inputs: Telegram webhook.  
  - Outputs: Routes message JSON downstream.  
  - Failure modes: Network connectivity, Telegram API downtime, invalid credentials.

- **Voice or Text1**  
  - Type: Switch  
  - Role: Branches data flow based on presence of voice or text content in Telegram message.  
  - Configuration: Checks if `message.voice.file_id` exists → route to voice branch; else if `message.text` exists → route to text branch.  
  - Inputs: Telegram message JSON.  
  - Outputs: Two outputs labeled "Voice" and "Text".  
  - Potential issues: Messages without voice or text content not handled.

- **Download File1**  
  - Type: Telegram (file download)  
  - Role: Downloads voice note file from Telegram servers.  
  - Configuration: Uses `message.voice.file_id` to fetch file.  
  - Inputs: Voice branch output from Switch.  
  - Outputs: Audio file binary data for transcription.  
  - Failure points: File not found, Telegram API errors, network issues.

- **Transcribe1**  
  - Type: OpenAI Whisper (audio transcription)  
  - Role: Transcribes audio message into text.  
  - Configuration: Uses OpenAI API configured for audio transcription.  
  - Inputs: Downloaded audio file binary.  
  - Outputs: Transcribed text JSON.  
  - Edge cases: Audio too noisy, unsupported format, API errors.

- **Text1**  
  - Type: Set  
  - Role: Wraps received text message into a JSON property `text` for uniform downstream processing.  
  - Configuration: Extracts `message.text`.  
  - Inputs: Text branch output from Switch.  
  - Outputs: JSON object with property `text`.  
  - Edge cases: Empty or malformed text.

- **Sticky Note**  
  - Role: Descriptive label for the block: "First step: receive the message via audio or text".

---

#### 1.2 AI Query Formation

**Overview:**  
Uses an AI agent to parse user text (either transcribed or direct) into a structured JSON query specifying lead search parameters (location, business, job title).

**Nodes Involved:**  
- OpenAI Chat Model1 (GPT-4)  
- Simple Memory (LangChain memory buffer)  
- Structured Output Parser  
- Scraper agent (LangChain agent)  
- Sticky Note1

**Node Details:**

- **OpenAI Chat Model1**  
  - Type: LangChain GPT-4 Chat Model node  
  - Role: Generates AI output to parse input text into structured data.  
  - Configuration: Model set to "gpt-4.1-nano", linked with LangChain.  
  - Credentials: OpenAI API key.  
  - Inputs: Text JSON from previous block.  
  - Outputs: AI chat response.  
  - Failures: API limits, prompt errors, network issues.

- **Simple Memory**  
  - Type: LangChain memory buffer window  
  - Role: Maintains conversational context for AI agent.  
  - Configuration: Default buffer window (no parameters).  
  - Inputs/Outputs: Connects AI model output to agent input.  
  - Failures: Memory overflow or mismanagement (unlikely here).

- **Structured Output Parser**  
  - Type: LangChain structured output parser  
  - Role: Parses AI response into JSON with schema example for location, business, job_title arrays.  
  - Configuration: JSON schema example provided to guide parsing.  
  - Inputs: AI chat output.  
  - Outputs: Structured JSON query object.  
  - Edge cases: AI output not matching schema, parsing errors.

- **Scraper agent**  
  - Type: LangChain agent  
  - Role: Coordinates prompt, AI model, output parser, and memory to produce the final JSON query array.  
  - Configuration: System message specifies role and required JSON schema for output.  
  - Inputs: Text from either transcription or direct input.  
  - Outputs: JSON array of one object with search parameters.  
  - Failures: AI parsing errors, malformed input text.

- **Sticky Note1**  
  - Role: Labels the block: "Create the JSON for the URL".

---

#### 1.3 URL Construction

**Overview:**  
Constructs a customized Apollo people-search URL based on the structured JSON query to be used for scraping leads.

**Nodes Involved:**  
- Generate query payload (Set node)  
- Create URL (Code node)  
- Sticky Note3

**Node Details:**

- **Generate query payload**  
  - Type: Set  
  - Role: Wraps the JSON query from AI agent into an object with property `query`.  
  - Configuration: Raw JSON output `{ "query": {{ $json.output }} }`.  
  - Inputs: JSON query array from Scraper agent.  
  - Outputs: JSON object with `query` property for URL builder.

- **Create URL**  
  - Type: Code  
  - Role: Builds Apollo people-search URL with parameters derived from AI query data.  
  - Configuration:  
    - Base URL: `https://app.apollo.io/#/people` (for web interface).  
    - Handles both array and object query shapes.  
    - Params include sorting, paging, and dynamic arrays for job titles, locations, businesses.  
    - Encodes spaces as `+` and URL-encodes values appropriately.  
  - Inputs: JSON query payload with `query` property.  
  - Outputs: JSON object containing `finalURL`.  
  - Edge cases: Missing `query` property, malformed input, array vs object query shape differences.

- **Sticky Note3**  
  - Role: Labels this block as "Scrape the leads from apify actor".

---

#### 1.4 Lead Scraping

**Overview:**  
Executes an Apify actor that scrapes lead data from Apollo using the constructed URL.

**Nodes Involved:**  
- Run an Actor (Apify node)

**Node Details:**

- **Run an Actor**  
  - Type: Apify  
  - Role: Runs the Apify Apollo Scraper actor with input URL and options.  
  - Configuration:  
    - Actor ID: `jljBwyyQakqrL1wae` (Apollo Scraper)  
    - Input JSON includes `getPersonalEmails`, `getWorkEmails` (both true), `totalRecords` set to 500, and `url` from previous node.  
    - Waits up to 60 seconds for finish.  
  - Inputs: JSON with `finalURL`.  
  - Outputs: Scraped leads JSON array.  
  - Failures: Actor errors, API limits, network timeouts, invalid URL.

---

#### 1.5 Data Extraction & Verification

**Overview:**  
Extracts key lead fields, filters for only verified emails, and removes duplicates by comparing against existing emails in the Postgres database.

**Nodes Involved:**  
- Extract Info (Set node)  
- Only Keep Verified Emails (Filter node)  
- Select already scraped mails (Postgres node)  
- Keep only the new leads (Compare Datasets node)  
- Already scraped (NoOp node)  
- Sticky Note (documentation)

**Node Details:**

- **Extract Info**  
  - Type: Set  
  - Role: Maps raw scraped JSON data into specific fields (firstName, emailAddress, linkedInURL, seniority, jobTitle, companyName, location, country, phone number, websiteURL, businessIndustry, lastName, emailStatus).  
  - Configuration: Uses expressions to extract nested properties, handles possible missing values.  
  - Inputs: Scraped leads data.  
  - Outputs: Normalized lead info JSON objects.  
  - Edge cases: Missing or malformed fields, null nested properties.

- **Only Keep Verified Emails**  
  - Type: Filter  
  - Role: Filters leads where `emailStatus` equals `"verified"`.  
  - Configuration: Simple string equality filter on `emailStatus`.  
  - Inputs: Extracted lead info.  
  - Outputs: Only leads with verified emails.  
  - Failures: Missing `emailStatus` property.

- **Select already scraped mails**  
  - Type: Postgres  
  - Role: Retrieves existing email addresses from Postgres table `Leads_n-mail` for deduplication.  
  - Configuration: Select operation, returns all rows with `emailAddress` column.  
  - Inputs: Triggered in parallel with filter results.  
  - Outputs: List of already scraped emails.  
  - Failures: Database connection issues, credential errors.

- **Keep only the new leads**  
  - Type: Compare Datasets  
  - Role: Compares filtered new leads against existing emails, keeping only those not previously scraped.  
  - Configuration: Default merge by fields (likely emailAddress).  
  - Inputs: Filtered leads and existing emails.  
  - Outputs: New unique leads only.  
  - Failures: Empty inputs, field mismatch.

- **Already scraped**  
  - Type: NoOp  
  - Role: Marker node for leads filtered out as duplicates (no operation).  
  - Inputs: Output from compare node.  
  - Outputs: None further used.  
  - Failures: None.

---

#### 1.6 Database Insertion & Notification

**Overview:**  
Inserts new unique leads into Supabase database and sends a Telegram message to confirm the number of new leads added.

**Nodes Involved:**  
- Create rows with new leads (Supabase node)  
- Set Telegram message (Set node)  
- Limit (Limit node)  
- Confirmation message (Telegram node)  
- Sticky Note4

**Node Details:**

- **Create rows with new leads**  
  - Type: Supabase  
  - Role: Inserts new lead records into Supabase table `Leads_n-mail`.  
  - Configuration: Maps fields such as firstName, emailAddress, linkedInURL, jobTitle, companyName, location, country, websiteURL, businessIndustry, lastName.  
  - Inputs: New unique leads dataset.  
  - Outputs: Confirmation of inserted rows.  
  - Failures: Database connection issues, validation errors.

- **Set Telegram message**  
  - Type: Set  
  - Role: Creates a message string reporting how many new contacts were added.  
  - Configuration: Uses expression to count input items length and format message.  
  - Inputs: Confirmation from database insertion node.  
  - Outputs: Message JSON for Telegram.  
  - Failures: Empty input, expression errors.

- **Limit**  
  - Type: Limit  
  - Role: Limits number of output messages (default 1) to control downstream processing.  
  - Inputs: Message from Set node.  
  - Outputs: Limited message payload.  
  - Failures: None.

- **Confirmation message**  
  - Type: Telegram  
  - Role: Sends Telegram message with the new leads count to a fixed chat ID.  
  - Configuration: Uses Telegram Bot credentials. ChatId is hardcoded (`5656980243`).  
  - Inputs: Limited message.  
  - Outputs: Telegram API response.  
  - Failures: Invalid chat ID, Telegram API errors.

- **Sticky Note4**  
  - Role: Labels block: "Insert the new leads to your database (can be airtable/sheets/supabase)".

---

### 3. Summary Table

| Node Name                   | Node Type                            | Functional Role                               | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                                    |
|-----------------------------|------------------------------------|-----------------------------------------------|------------------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------|
| User message                | Telegram Trigger                   | Entry point: receive Telegram messages        | -                            | Voice or Text1              | # First step: receive the message via audio or text                                                           |
| Voice or Text1              | Switch                            | Routes voice vs text message                    | User message                 | Download File1, Text1        | # First step: receive the message via audio or text                                                           |
| Download File1              | Telegram (file download)           | Downloads voice note audio                      | Voice or Text1               | Transcribe1                 | # First step: receive the message via audio or text                                                           |
| Transcribe1                 | OpenAI Whisper transcription       | Transcribes audio to text                       | Download File1               | Scraper agent               | # First step: receive the message via audio or text                                                           |
| Text1                      | Set                              | Wraps text message for processing              | Voice or Text1               | Scraper agent               | # First step: receive the message via audio or text                                                           |
| OpenAI Chat Model1          | LangChain GPT-4 Chat Model         | Parses text message into structured query      | Scraper agent (memory input) | Scraper agent               | # Create the json for the URL                                                                                   |
| Simple Memory               | LangChain Memory Buffer            | Maintains AI conversational context            | OpenAI Chat Model1           | Scraper agent               | # Create the json for the URL                                                                                   |
| Structured Output Parser    | LangChain Output Parser            | Parses AI output into structured JSON           | OpenAI Chat Model1           | Scraper agent               | # Create the json for the URL                                                                                   |
| Scraper agent              | LangChain Agent                   | Generates structured search query JSON          | Text1 / Transcribe1          | Generate query payload, Select already scraped mails | # Create the json for the URL                                                                                   |
| Generate query payload      | Set                              | Wraps AI JSON query for URL builder             | Scraper agent                | Create URL                  | # Scrape the leads from apify actor                                                                             |
| Create URL                 | Code                             | Builds Apollo people-search URL                  | Generate query payload       | Run an Actor                | # Scrape the leads from apify actor                                                                             |
| Run an Actor               | Apify                            | Runs Apollo lead scraping actor                  | Create URL                  | Extract Info                | # Scrape the leads from apify actor                                                                             |
| Extract Info               | Set                              | Extracts and normalizes lead data                | Run an Actor                | Only Keep Verified Emails   |                                                                                                               |
| Only Keep Verified Emails  | Filter                           | Filters leads with verified emails only          | Extract Info                | Keep only the new leads     |                                                                                                               |
| Select already scraped mails| Postgres                        | Retrieves existing leads to avoid duplicates     | Scraper agent               | Keep only the new leads     |                                                                                                               |
| Keep only the new leads    | Compare Datasets                 | Removes duplicate leads already in DB            | Only Keep Verified Emails, Select already scraped mails | Already scraped, Create rows with new leads |                                                                                                               |
| Already scraped             | NoOp                            | Placeholder for filtered-out duplicates          | Keep only the new leads     | -                           |                                                                                                               |
| Create rows with new leads | Supabase                        | Inserts new unique leads into Supabase table     | Keep only the new leads     | Set Telegram message        | # Insert the new leads to your database                                                                        |
| Set Telegram message       | Set                              | Creates notification message about new leads    | Create rows with new leads  | Limit                      | # Insert the new leads to your database                                                                        |
| Limit                      | Limit                           | Limits output messages to one                     | Set Telegram message        | Confirmation message       | # Insert the new leads to your database                                                                        |
| Confirmation message       | Telegram                        | Sends confirmation message to Telegram chat      | Limit                      | -                          | # Insert the new leads to your database                                                                        |
| Sticky Note                | Sticky Note                    | Documentation block                               | -                           | -                          | # First step: receive the message via audio or text                                                           |
| Sticky Note1               | Sticky Note                    | Documentation block                               | -                           | -                          | # Create the json for the URL                                                                                   |
| Sticky Note2               | Sticky Note                    | Workflow overview and instructions               | -                           | -                          | ## Who’s it for... (full detailed project description and setup instructions)                                  |
| Sticky Note3               | Sticky Note                    | Documentation block                               | -                           | -                          | ## Scrape the leads from apify actor                                                                           |
| Sticky Note4               | Sticky Note                    | Documentation block                               | -                           | -                          | ## Insert the new leads to your database (can be airtable/sheets/supabase)                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Configure to listen to "message" updates.  
   - Set credentials with your Telegram Bot API token.

2. **Add Switch Node ("Voice or Text1")**  
   - Type: Switch  
   - Rule 1: If `message.voice.file_id` exists → output "Voice"  
   - Rule 2: If `message.text` exists → output "Text"

3. **For Voice Branch:**  
   - Add "Download File1" (Telegram node)  
     - Resource: file  
     - File ID: `{{$json.message.voice.file_id}}`  
     - Connect from Voice output of Switch.  
   - Add "Transcribe1" (OpenAI Whisper node)  
     - Operation: transcribe audio  
     - Connect from Download File1.  
     - Add OpenAI API credentials.

4. **For Text Branch:**  
   - Add "Text1" (Set node)  
     - Set field `text` to `{{$json.message.text}}`  
     - Connect from Text output of Switch.

5. **Merge voice transcription and text processing:**  
   - Connect outputs of Transcribe1 and Text1 into "Scraper agent" input.

6. **Create LangChain GPT-4 Chat Model Node ("OpenAI Chat Model1")**  
   - Model: gpt-4.1-nano  
   - Connect input to "Scraper agent" memory input.  
   - Add OpenAI credentials.

7. **Add Simple Memory Node**  
   - Connect OpenAI Chat Model output to Simple Memory.  
   - Connect Simple Memory output to Scraper agent AI model input.

8. **Add Structured Output Parser Node**  
   - Provide JSON schema example:  
     ```json
     {
       "location": ["barcelona+spain"],
       "business": ["ecommerce"],
       "job_title": ["ceo"]
     }
     ```  
   - Connect OpenAI Chat Model ai_outputParser output to Structured Output Parser input.  
   - Connect Structured Output Parser output to Scraper agent parser input.

9. **Add Scraper agent Node**  
   - System message prompt: specify role and required JSON schema as in the original.  
   - Connect input from Text1/Transcribe1 output.  
   - Connect ai_languageModel from OpenAI Chat Model1.  
   - Connect ai_outputParser from Structured Output Parser.  
   - Connect ai_memory from Simple Memory.

10. **Add "Generate query payload" Set Node**  
    - Raw JSON output:  
      ```json
      { "query": {{ $json.output }} }
      ```  
    - Connect from Scraper agent output.

11. **Add "Create URL" Code Node**  
    - Paste JavaScript code that builds Apollo URL from the `query` object.  
    - Connect from Generate query payload.

12. **Add "Run an Actor" Apify Node**  
    - Actor ID: Apollo Scraper (jljBwyyQakqrL1wae)  
    - Input JSON:  
      ```json
      {
        "getPersonalEmails": true,
        "getWorkEmails": true,
        "totalRecords": 500,
        "url": "{{ $json.finalURL }}"
      }
      ```  
    - Connect from Create URL node.  
    - Add Apify credentials.

13. **Add "Extract Info" Set Node**  
    - Map all required fields (firstName, emailAddress, linkedInURL, seniority, jobTitle, companyName, location, country, number, websiteURL, businessIndustry, lastName, emailStatus) using expressions based on the scraped JSON structure.  
    - Connect from Run an Actor.

14. **Add "Only Keep Verified Emails" Filter Node**  
    - Condition: `emailStatus` equals "verified".  
    - Connect from Extract Info.

15. **Add "Select already scraped mails" Postgres Node**  
    - Operation: Select  
    - Table: Leads_n-mail (public schema)  
    - Output columns: emailAddress  
    - Connect input to Scraper agent output (parallel branch).  
    - Add Postgres credentials.

16. **Add "Keep only the new leads" Compare Datasets Node**  
    - Configure to compare new leads filtered by verified emails against emails from Postgres to keep only new ones.  
    - Connect inputs from Only Keep Verified Emails and Select already scraped mails.

17. **Add "Already scraped" NoOp Node**  
    - Connect from Keep only the new leads (duplicates output).

18. **Add "Create rows with new leads" Supabase Node**  
    - Table: Leads_n-mail  
    - Map fields from JSON to table columns.  
    - Connect from Keep only the new leads (new unique leads output).  
    - Add Supabase credentials.

19. **Add "Set Telegram message" Set Node**  
    - Create field `output` with string: `{{$input.all().length}} new contacts have been added to the Google Sheet!`  
    - Connect from Create rows with new leads.

20. **Add "Limit" Node**  
    - Default limit 1.  
    - Connect from Set Telegram message.

21. **Add "Confirmation message" Telegram Node**  
    - Text: `{{$input.all().length}} new contacts have been added to the Google Sheet!`  
    - Chat ID: Your Telegram chat ID (e.g., 5656980243).  
    - Connect from Limit node.  
    - Add Telegram API credentials.

22. **Add Sticky Notes for documentation** (optional)  
    - Place notes at the start of each block with relevant descriptions.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| ## Who’s it for  Growth hackers, SDR teams, and founders who collect lead requests via Telegram (voice or text) and want those leads scraped, verified, de-duplicated, and stored in a single Supabase table—hands-free.  ## How it works  1. Telegram trigger captures a user’s text or voice note.  2. OpenAI Whisper + GPT agent parse the message and build a structured search query.  3. A Code node crafts a people-search URL, then an HTTP request calls the Apify Apollo-io Scraper to pull up to 500 contacts.  4. Filters keep only “verified” emails and compare them to a Postgres list of already-scraped addresses to avoid duplicates.  5. Fresh contacts are inserted into the Supabase table Leads_n-mail, and the bot replies with a count of new rows added.  ## How to set up  1. Replace the hard-coded Apify token in Apollo Scraper with an environment variable.  2. Add OpenAI credentials for Whisper & GPT nodes.  3. Point the Postgres “dedupe” node at your existing email table (or skip it).  4. Update the Supabase connection and table name, then test with a sample voice note.  ### Supabase column headers  firstName | lastName | emailAddress | linkedInURL | jobTitle | companyName | location | country | websiteURL | businessIndustry | seniority | number  ## Requirements  - Telegram Bot token  - OpenAI API key  - Apify account with Apollo-io Scraper actor  - Supabase project credentials (or swap for Airtable/Sheets)  - n8n v0.231+ self-hosted or Cloud  ## How to customize the workflow  - Change the prompt to capture extra fields (e.g., funding stage).  - Adjust totalRecords in the HTTP node to pull more or fewer leads.  - Swap storage—write to Airtable, HubSpot, or Sheets instead of Supabase.  - Add enrichment—insert Clearbit or Hunter steps before the insert. | See Sticky Note2 in the workflow for full detailed project description and setup instructions.                 |

---

**Disclaimer:** The text provided is exclusively extracted from an automated n8n workflow. It strictly complies with content policies and contains no illegal, offensive, or protected content. All data processed is legal and public.