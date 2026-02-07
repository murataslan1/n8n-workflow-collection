Automate Meeting Prep & Lead Enrichment with Bright Data, Cal.com & Airtable

https://n8nworkflows.xyz/workflows/automate-meeting-prep---lead-enrichment-with-bright-data--cal-com---airtable-4505


# Automate Meeting Prep & Lead Enrichment with Bright Data, Cal.com & Airtable

---

# Reference Document for Workflow:  
**Automate Meeting Prep & Lead Enrichment with Bright Data, Cal.com & Airtable**

---

### 1. Workflow Overview

This n8n workflow automates the process of handling new meeting bookings from Cal.com, enriching lead data via LinkedIn scraping with Bright Data, updating a CRM in Airtable, and generating detailed meeting preparation documents using an AI language model. It targets business professionals who want to streamline lead capture, enrichment, and meeting prep for introductory calls.

**Logical Blocks:**

- **1.1 Input Reception & Event Routing:**  
  Receives webhook notifications from Cal.com for new bookings, parses the event data, and routes based on event type.

- **1.2 Data Extraction & Mapping:**  
  Extracts essential fields from the webhook payload to prepare structured data for CRM insertion and further processing.

- **1.3 CRM Integration:**  
  Adds new meeting leads to Airtable CRM and updates enriched lead information after LinkedIn scraping.

- **1.4 LinkedIn Lead Enrichment:**  
  Filters leads with LinkedIn URLs, scrapes detailed LinkedIn profile data using Bright Data API, and processes the profile data for enrichment.

- **1.5 AI-based Meeting Preparation:**  
  Uses an AI language model to generate a comprehensive meeting preparation document based on enriched LinkedIn data and meeting agenda.

- **1.6 Meeting Prep Notification & Record Update:**  
  Converts the AI-generated prep document to HTML, sends notification emails, and updates the meeting record in Airtable with the prep details.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception & Event Routing

**Overview:**  
This block listens for Cal.com webhook POST requests signaling new meeting bookings and routes the flow based on the event type.

**Nodes Involved:**  
- Webhook  
- Route events  
- Sticky Note2 (annotation)

**Node Details:**

- **Webhook**  
  - Type: Webhook node  
  - Role: Entry point for Cal.com webhook POST requests on path `83231439-9c32-443c-86ea-8645f3d76640`  
  - Configuration: HTTP Method POST, no authentication by default  
  - Input: External webhook POST with booking payload  
  - Output: Raw webhook JSON  
  - Edge Cases: Missing payload, malformed webhook, unauthorized calls  
  - Sticky Note2: "Receive webhook on a new meeting booked"

- **Route events**  
  - Type: Switch  
  - Role: Routes workflow based on `triggerEvent` field in webhook payload  
  - Configuration: Checks if `triggerEvent === "BOOKING_CREATED"`; routes accordingly  
  - Input: Webhook JSON  
  - Output: Routes to `create json` node if condition met  
  - Edge Cases: Unknown or unsupported event types; fallback behavior not defined  
  - Sticky Note8: Notes about routing other Cal.com events (meeting started, ended) possible

---

#### 2.2 Data Extraction & Mapping

**Overview:**  
Extracts the key fields from the nested webhook payload to flatten and normalize data for CRM insertion and further processing.

**Nodes Involved:**  
- create json  
- Map needed fields  
- Sticky Note3 (annotation)

**Node Details:**

- **create json**  
  - Type: Set (raw mode)  
  - Role: Extracts `body.payload` object from webhook JSON for easier access  
  - Configuration: Sets node output to `={{ $json.body.payload }}`  
  - Input: Raw webhook JSON  
  - Output: Flattened payload JSON  
  - Edge Cases: Missing or empty payload fields

- **Map needed fields**  
  - Type: Set  
  - Role: Maps and renames specific fields from payload for structured use  
  - Configuration: Defines fields such as `title`, `description`, `videoCallUrl`, `status`, `length`, `name`, `email`, `responsesnotes`, `startTime`, `endTime`, `agenda`, `purpose`, `Linkedin`, `business-website`, `Guest`, `iCalUID` extracted from payload subfields  
  - Input: Flattened payload JSON  
  - Output: JSON with only needed fields for CRM and enrichment  
  - Edge Cases: Missing optional fields (e.g., Linkedin URL)  
  - Sticky Note3: "Split the object data into a json for easy mapping..."

---

#### 2.3 CRM Integration

**Overview:**  
Creates or updates records in Airtable to store leads and meeting information from booking data and enriched lead data.

**Nodes Involved:**  
- Add to CRM  
- Update lead data  
- Update meeting summary  
- Sticky Note4, Sticky Note6 (annotations)

**Node Details:**

- **Add to CRM**  
  - Type: Airtable (create operation)  
  - Role: Inserts new booking lead into Airtable "Appointments and calls" table  
  - Configuration: Maps extracted fields like Name, Email, Notes, Status, Meeting, iCalUID, Start-time, End-time, Linkedin, business-website, Reason For Schedule  
  - Input: Mapped fields from `Map needed fields`  
  - Output: Airtable record data including record ID  
  - Edge Cases: Airtable API errors, duplicate entries  
  - Sticky Note4: Provides link to Airtable CRM template (https://airtable.com/appiSZ70ow7uVxv7t/shrvmFKqRYGX6iUZY)

- **Update lead data**  
  - Type: Airtable (create operation)  
  - Role: Adds enriched lead profile data (from LinkedIn scraping) to "Lead Enrichment" table in Airtable  
  - Configuration: Maps fields like city, about, company, country, full_name, job_title, linkedin_url, experiences, follower_count, etc., from `Edit bio` and `Map needed fields` nodes  
  - Input: Enriched LinkedIn data  
  - Output: Airtable record data  
  - Edge Cases: API rate limits, data mismatches

- **Update meeting summary**  
  - Type: Airtable (update operation)  
  - Role: Updates the original meeting record with the generated meeting prep document (HTML)  
  - Configuration: Uses record ID from `Add to CRM` and sets `Meeting_prep` field with converted HTML from `create HTML` node  
  - Input: HTML content and record ID  
  - Output: Updated Airtable record  
  - Edge Cases: Failed updates if record ID invalid  
  - Sticky Note6: "Add the new enriched leads data to the leads table"

---

#### 2.4 LinkedIn Lead Enrichment

**Overview:**  
Filters leads who provided LinkedIn URLs, scrapes detailed profile data using Bright Data API, and processes the data for enrichment.

**Nodes Involved:**  
- If has linkedin  
- Scrap Linkedin  
- Edit bio  
- Sticky Note5 (annotation)

**Node Details:**

- **If has linkedin**  
  - Type: Filter  
  - Role: Checks if the `Linkedin` field is non-empty to continue enrichment  
  - Configuration: Evaluates `{{ $('Map needed fields').first().json.Linkedin }}` is not empty  
  - Input: Output of `Add to CRM`  
  - Output: Passes leads with LinkedIn URLs to next node  
  - Edge Cases: Missing or malformed URLs

- **Scrap Linkedin**  
  - Type: Bright Data node (web scraper)  
  - Role: Scrapes LinkedIn profile data for the lead using Bright Data’s LinkedIn people profile dataset  
  - Configuration: Requests URL from LinkedIn field, dataset ID preconfigured for LinkedIn profiles  
  - Credentials: Requires valid Bright Data API account  
  - Input: LinkedIn URL  
  - Output: Scraped profile JSON data  
  - Edge Cases: API quota exceeded, blocked by LinkedIn, invalid URLs  
  - Sticky Note5: "Filter only leads with linkedin URLs and send this to Bright Data API..."

- **Edit bio**  
  - Type: Set  
  - Role: Extracts and reshapes fields from scraped LinkedIn JSON for easier mapping to CRM  
  - Configuration: Extracts fields like name, city, country_code, position, about, current_company, experience array, educations_details, followers, connections, activity, url  
  - Input: Scraped LinkedIn JSON  
  - Output: Cleaned and mapped profile data  
  - Edge Cases: Missing fields in scraped data, data inconsistencies

---

#### 2.5 AI-based Meeting Preparation

**Overview:**  
Generates a detailed meeting preparation document by analyzing enriched LinkedIn profile data and meeting agenda using an AI language model.

**Nodes Involved:**  
- Meeting Prep Agent  
- OpenRouter Chat Model  
- create HTML  
- Sticky Note7 (annotation)

**Node Details:**

- **Meeting Prep Agent**  
  - Type: Langchain chainLlm node  
  - Role: Uses defined prompt and enriched data to generate meeting prep content  
  - Configuration: Input JSON stringified profile and agenda; prompt instructs AI to produce a formatted, actionable meeting prep document  
  - Input: Data from `Edit bio` (profile) and meeting agenda  
  - Output: Text document in markdown or plain text  
  - Edge Cases: API rate limits, prompt errors, incomplete data  
  - Sub-workflow: Uses OpenRouter Chat Model as underlying language model

- **OpenRouter Chat Model**  
  - Type: AI Language Model node (@n8n/n8n-nodes-langchain.lmChatOpenRouter)  
  - Role: Provides AI chat/completion services to Meeting Prep Agent  
  - Credential: Requires OpenRouter API key  
  - Input: Prompts and messages from Meeting Prep Agent  
  - Output: AI-generated text content  
  - Edge Cases: API errors, authentication failures

- **create HTML**  
  - Type: Markdown to HTML converter  
  - Role: Converts AI-generated markdown meeting prep text into HTML format for email and CRM display  
  - Input: Text from Meeting Prep Agent  
  - Output: HTML content  
  - Edge Cases: Invalid markdown input

---

#### 2.6 Meeting Prep Notification & Record Update

**Overview:**  
Sends the generated meeting prep document via email to an administrator and updates the CRM record with the prep content.

**Nodes Involved:**  
- Notify admin  
- Update meeting summary

**Node Details:**

- **Notify admin**  
  - Type: Gmail node (send email)  
  - Role: Sends email notification with meeting prep content to an admin email address  
  - Configuration: Sends to specified email, subject "New Meeting Prep Email", message contains AI-generated prep content  
  - Credentials: Requires Gmail OAuth2 credentials  
  - Input: HTML or text content from `create HTML`  
  - Edge Cases: Email sending failures, invalid recipient address

- **Update meeting summary**  
  - (Described above in CRM Integration)

---

### 3. Summary Table

| Node Name          | Node Type                         | Functional Role                           | Input Node(s)          | Output Node(s)             | Sticky Note                                                                                      |
|--------------------|----------------------------------|------------------------------------------|------------------------|----------------------------|------------------------------------------------------------------------------------------------|
| Webhook            | Webhook                          | Receive Cal.com webhook for new booking  | —                      | Route events               | Receive webhook on a new meeting booked                                                        |
| Route events       | Switch                          | Route based on Cal.com event type         | Webhook                | create json                | You can route the data based on other Cal events eg Meeting started, ended etc                 |
| create json        | Set (raw mode)                   | Extract payload from webhook JSON         | Route events            | Map needed fields          | Split the object data into a json for easy mapping                                            |
| Map needed fields  | Set                             | Map and flatten needed fields             | create json             | Add to CRM                 | Split the object data into a json for easy mapping                                            |
| Add to CRM         | Airtable (create)                | Insert new lead & meeting to CRM          | Map needed fields       | If has linkedin            | Add the leads to your CRM. Copy of Airtable CRM: https://airtable.com/appiSZ70ow7uVxv7t/shrvmFKqRYGX6iUZY |
| If has linkedin    | Filter                          | Filter leads with Linkedin URL            | Add to CRM              | Scrap Linkedin             | Filter only leads with linkedin urls and send this to Bright Data API.                         |
| Scrap Linkedin     | Bright Data Scraper             | Scrape LinkedIn profile data              | If has linkedin         | Edit bio                   | Filter only leads with linkedin urls and send this to Bright Data API.                         |
| Edit bio           | Set                             | Extract and reshape LinkedIn profile data | Scrap Linkedin          | Meeting Prep Agent, Update lead data |                                                                                            |
| Meeting Prep Agent | Langchain chainLlm              | Generate meeting prep document             | Edit bio                | create HTML                | Create a meeting Prep and Share via email                                                    |
| OpenRouter Chat Model | AI Language Model (OpenRouter) | AI model used by Meeting Prep Agent       | — (called by Meeting Prep Agent) | Meeting Prep Agent          |                                                                                            |
| create HTML        | Markdown to HTML converter       | Convert meeting prep markdown to HTML    | Meeting Prep Agent      | Notify admin               |                                                                                            |
| Notify admin       | Gmail send email                | Send meeting prep email to admin          | create HTML             | Update meeting summary     |                                                                                            |
| Update lead data   | Airtable (create)               | Store enriched lead profile data          | Edit bio                | —                          | Add the new enriched leads data to the leads table                                          |
| Update meeting summary | Airtable (update)              | Update meeting record with prep document  | Notify admin            | —                          | Add the new enriched leads data to the leads table                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `83231439-9c32-443c-86ea-8645f3d76640`  
   - Purpose: Receive Cal.com booking payloads  

2. **Add Switch Node (Route events)**  
   - Type: Switch  
   - Condition: `{{$json.body.triggerEvent}} === "BOOKING_CREATED"`  
   - Connect Webhook output to this node’s input  

3. **Add Set Node (create json)**  
   - Type: Set (raw mode)  
   - Set JSON Output to: `{{$json.body.payload}}`  
   - Connect Route events output (BOOKING_CREATED) to this node  

4. **Add Set Node (Map needed fields)**  
   - Map the following fields from input JSON:  
     - `title` ← `title`  
     - `description` ← `additionalNotes`  
     - `videoCallUrl` ← `metadata.videoCallUrl`  
     - `status` ← `status`  
     - `length` ← `length`  
     - `name` ← `responses.name.value`  
     - `email` ← `responses.email.value`  
     - `responsesnotes` ← `responses.notes.value`  
     - `startTime` ← `startTime`  
     - `endTime` ← `endTime`  
     - `agenda` ← `responses.title.value || responses.agenda.value`  
     - `purpose` ← `userFieldsResponses.purpose.label`  
     - `Linkedin` ← `responses.Linkedin.value`  
     - `business-website` ← `responses['business-website'].value`  
     - `Guest` ← `responses.guests.value[0]`  
     - `iCalUID` ← `iCalUID`  
   - Connect `create json` output to this node  

5. **Add Airtable Node (Add to CRM)**  
   - Operation: Create  
   - Base: Appointments & Calls Manager  
   - Table: Appointments and calls  
   - Map columns with fields from "Map needed fields" node accordingly  
   - Use Airtable Personal Access Token credentials  
   - Connect `Map needed fields` output to this node  

6. **Add Filter Node (If has linkedin)**  
   - Condition: `{{$node["Map needed fields"].json.Linkedin}}` is not empty  
   - Connect `Add to CRM` output to this node  

7. **Add Bright Data Node (Scrap Linkedin)**  
   - Resource: WebScrapper  
   - Dataset: LinkedIn people profiles dataset (ID: gd_l1viktl72bvl7bjuj0)  
   - URLs: `{{$node["Map needed fields"].json.Linkedin}}`  
   - Use Bright Data API credentials  
   - Connect `If has linkedin` output to this node  

8. **Add Set Node (Edit bio)**  
   - Extract fields from scraped LinkedIn JSON such as name, city, country_code, position, about, current_company, experience, followers, etc.  
   - Connect `Scrap Linkedin` output to this node  

9. **Add Airtable Node (Update lead data)**  
   - Operation: Create  
   - Base: Appointments & Calls Manager  
   - Table: Lead Enrichment  
   - Map fields from `Edit bio` and `Map needed fields` nodes as per schema  
   - Use Airtable Personal Access Token credentials  
   - Connect `Edit bio` output to this node  

10. **Add Langchain chainLlm Node (Meeting Prep Agent)**  
    - Input: JSON stringified data from `Edit bio` node  
    - Messages: Provide structured prompt instructing AI to generate meeting prep document using LinkedIn profile and agenda  
    - Connect `Edit bio` output to this node  
    - Requires OpenRouter Chat Model as an AI backend  

11. **Add OpenRouter Chat Model Node**  
    - Use OpenRouter API credentials  
    - No manual connection; invoked internally by Meeting Prep Agent  

12. **Add Markdown to HTML Node (create HTML)**  
    - Convert `Meeting Prep Agent` output (markdown) to HTML  
    - Connect `Meeting Prep Agent` output to this node  

13. **Add Gmail Node (Notify admin)**  
    - Send Email To: your admin email address  
    - Subject: "New Meeting Prep Email"  
    - Message: HTML content from `create HTML` node  
    - Use Gmail OAuth2 credentials  
    - Connect `create HTML` output to this node  

14. **Add Airtable Node (Update meeting summary)**  
    - Operation: Update  
    - Base: Appointments & Calls Manager  
    - Table: Appointments and calls  
    - Use record ID from `Add to CRM` node  
    - Update field `Meeting_prep` with HTML from `create HTML` node  
    - Use Airtable Personal Access Token credentials  
    - Connect `Notify admin` output to this node  

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                      |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Cal.com Meeting Prep Agent with Bright Data API                                                 | Workflow title and branding                                                                         |
| Summary: Capture webhook from Cal.com, enrich leads with LinkedIn data using Bright Data, store in Airtable CRM, generate meeting prep with AI | Sticky Note1                                                                                       |
| Airtable CRM template for Appointments and Calls Manager table                                 | https://airtable.com/appiSZ70ow7uVxv7t/shrvmFKqRYGX6iUZY                                           |
| You can route the data based on other Cal.com events such as meeting started or ended          | Sticky Note8                                                                                       |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---