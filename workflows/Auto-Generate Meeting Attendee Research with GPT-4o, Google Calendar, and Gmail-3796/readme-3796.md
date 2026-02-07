Auto-Generate Meeting Attendee Research with GPT-4o, Google Calendar, and Gmail

https://n8nworkflows.xyz/workflows/auto-generate-meeting-attendee-research-with-gpt-4o--google-calendar--and-gmail-3796


# Auto-Generate Meeting Attendee Research with GPT-4o, Google Calendar, and Gmail

### 1. Workflow Overview

This workflow automates the generation and emailing of a Meeting Briefing whenever a new event is created in a Google Calendar. It targets professionals who want to quickly gather contextual information about meeting attendees and their companies before a call. The workflow is structured into three main logical blocks:

- **1.1 New Event Detection and Attendee Extraction:** Detects new calendar events, extracts attendees, and filters out the user themselves.
- **1.2 Attendee and Company Research:** For each attendee, performs web-based research using OpenAI’s GPT-4o model with web search tools to generate summaries about the person and their company (if applicable).
- **1.3 Report Generation and Email Sending:** Aggregates all research data, formats it into an HTML briefing, and sends it via Gmail.

---

### 2. Block-by-Block Analysis

#### 2.1 New Event Detection and Attendee Extraction

**Overview:**  
This block triggers the workflow on new Google Calendar events, extracts the list of attendees, and removes the user’s own email from the list to avoid redundant research.

**Nodes Involved:**  
- Google Calendar Trigger  
- Edit Fields  
- Split Out Attendees  
- Filter Out Myself  
- For Each Attendee

**Node Details:**

- **Google Calendar Trigger**  
  - *Type:* Google Calendar Trigger  
  - *Role:* Watches for new events created in a specified Google Calendar.  
  - *Configuration:* Polls every minute; triggers on event creation; calendar ID set to user’s email.  
  - *Input/Output:* No input; outputs event JSON including attendees list.  
  - *Edge Cases:* Calendar permission errors, API rate limits, no attendees in event.  
  - *Credentials:* Google Calendar OAuth2.

- **Edit Fields**  
  - *Type:* Set  
  - *Role:* Sets workflow variables: user context, recipient email for briefing, and copies attendees array from trigger.  
  - *Key Variables:*  
    - `context`: User’s professional background and location.  
    - `email`: Recipient email for briefing.  
    - `attendees`: Array of attendees from event JSON.  
  - *Input/Output:* Input from trigger; outputs enriched JSON.  
  - *Edge Cases:* Missing attendees field, incorrect email format.

- **Split Out Attendees**  
  - *Type:* Split Out  
  - *Role:* Splits the attendees array into individual items for processing.  
  - *Configuration:* Splits on `attendees` field.  
  - *Input/Output:* Input JSON with attendees array; outputs one item per attendee.  
  - *Edge Cases:* Empty attendees array.

- **Filter Out Myself**  
  - *Type:* Filter  
  - *Role:* Removes the user themselves from the list of attendees based on a boolean field `self`.  
  - *Configuration:* Filters out items where `self` is true.  
  - *Input/Output:* Input individual attendees; outputs only those not matching user.  
  - *Edge Cases:* Missing or incorrectly set `self` flag.

- **For Each Attendee**  
  - *Type:* Split In Batches  
  - *Role:* Processes attendees one by one in batches (default batch size).  
  - *Input/Output:* Input filtered attendees; outputs one attendee per batch.  
  - *Edge Cases:* Large attendee lists may cause delays.

---

#### 2.2 Attendee and Company Research

**Overview:**  
For each attendee, this block determines if the email is a company email or generic provider email. It then generates two prompts for OpenAI’s GPT-4o model with web search: one about the person, and one about their company (if applicable). The research results are collected for later aggregation.

**Nodes Involved:**  
- Is Company Email?  
- Company Prompt  
- Research Company  
- Person Prompt  
- Research Person  
- Collect Fields

**Node Details:**

- **Is Company Email?**  
  - *Type:* If  
  - *Role:* Checks if attendee’s email domain is a generic provider (gmail.com, yahoo.com, etc.) or a company domain.  
  - *Configuration:* Uses regex to exclude common free email domains.  
  - *Input/Output:* Input attendee email; routes to Company Prompt if company email, else Person Prompt.  
  - *Edge Cases:* Uncommon or new email domains not in regex; false positives/negatives.

- **Company Prompt**  
  - *Type:* Set  
  - *Role:* Constructs a prompt for company research using the attendee’s email domain.  
  - *Key Expression:*  
    - Extracts domain from email to form URL (e.g., `http://domain.com`).  
    - Includes user context from Edit Fields.  
    - Requests company description, problem solved, business model, max 100 words.  
  - *Input/Output:* Input attendee; outputs JSON with `prompt` field.  
  - *Edge Cases:* Invalid email domains, malformed URLs.

- **Research Company**  
  - *Type:* HTTP Request  
  - *Role:* Calls OpenAI Responses API with GPT-4o model and web search tool to research company info.  
  - *Configuration:* POST to `https://api.openai.com/v1/responses` with JSON body containing model, tools, and prompt.  
  - *Credentials:* Header Auth with OpenAI API key.  
  - *Input/Output:* Input prompt JSON; outputs API response with company info.  
  - *Edge Cases:* API errors, rate limits, invalid API key, network timeouts.

- **Person Prompt**  
  - *Type:* Set  
  - *Role:* Constructs a prompt for person research based on attendee email.  
  - *Key Expression:*  
    - Requests info on person’s role, interests, unknown facts.  
    - Advises to crawl company website if email is company domain.  
    - Includes user context for disambiguation.  
    - Limits answer to 100 words.  
  - *Input/Output:* Input attendee; outputs JSON with `prompt` field.  
  - *Edge Cases:* Ambiguous names, missing email.

- **Research Person**  
  - *Type:* HTTP Request  
  - *Role:* Calls OpenAI Responses API with GPT-4o model and web search tool to research person info.  
  - *Configuration:* Same as Research Company node.  
  - *Credentials:* Header Auth with OpenAI API key.  
  - *Input/Output:* Input prompt JSON; outputs API response with person info.  
  - *Edge Cases:* Same as Research Company.

- **Collect Fields**  
  - *Type:* Set  
  - *Role:* Extracts and formats relevant data from research responses and attendee info into a unified structure.  
  - *Key Expressions:*  
    - `person`: Extracted from Research Person response text.  
    - `company`: Extracted from Research Company response text or set to “No company information found.” if generic email.  
    - `email`: Attendee email.  
  - *Input/Output:* Input combined research responses; outputs structured JSON for aggregation.  
  - *Edge Cases:* Missing or malformed API responses.

---

#### 2.3 Report Generation and Email Sending

**Overview:**  
This block aggregates all individual attendee research results, formats them into a Markdown meeting briefing, converts it to HTML, and sends it via Gmail to the specified recipient.

**Nodes Involved:**  
- Combine All Research  
- Write HTML  
- Send Report

**Node Details:**

- **Combine All Research**  
  - *Type:* Aggregate  
  - *Role:* Aggregates all collected attendee research data into a single array for report generation.  
  - *Configuration:* Aggregates all item data.  
  - *Input/Output:* Input multiple JSON items; outputs one aggregated JSON item.  
  - *Edge Cases:* Empty input array.

- **Write HTML**  
  - *Type:* Markdown  
  - *Role:* Converts a Markdown-formatted meeting briefing into HTML.  
  - *Configuration:* Uses markdownToHtml mode with tables enabled.  
  - *Key Expression:*  
    - Iterates over aggregated data array to generate sections per person with email, person info, and company info.  
  - *Input/Output:* Input aggregated data; outputs HTML string.  
  - *Edge Cases:* Markdown syntax errors.

- **Send Report**  
  - *Type:* Gmail  
  - *Role:* Sends the generated HTML briefing as an email.  
  - *Configuration:*  
    - Recipient email from Edit Fields node.  
    - Subject includes meeting summary and date.  
    - Message body is the HTML from Write HTML node.  
    - Attribution disabled.  
  - *Credentials:* Gmail OAuth2.  
  - *Input/Output:* Input HTML message; outputs email send status.  
  - *Edge Cases:* Gmail API errors, authentication failures, invalid recipient email.

---

### 3. Summary Table

| Node Name              | Node Type             | Functional Role                              | Input Node(s)               | Output Node(s)            | Sticky Note                                                                                                  |
|------------------------|-----------------------|----------------------------------------------|-----------------------------|---------------------------|--------------------------------------------------------------------------------------------------------------|
| Google Calendar Trigger | Google Calendar Trigger | Detect new calendar events                    |                             | Edit Fields               | ## 1. New Google Calendar Event Detected: Workflow triggers on new event, extracts attendees, filters self.  |
| Edit Fields            | Set                   | Set user context, recipient email, attendees | Google Calendar Trigger     | Split Out Attendees        | ## Edit Here: Edit context and recipient email to customize briefing.                                        |
| Split Out Attendees     | Split Out             | Split attendees array into individual items  | Edit Fields                 | Filter Out Myself          | ## 1. New Google Calendar Event Detected (see above)                                                        |
| Filter Out Myself       | Filter                | Remove user from attendees list               | Split Out Attendees         | For Each Attendee          | ## 1. New Google Calendar Event Detected (see above)                                                        |
| For Each Attendee       | Split In Batches      | Process attendees one by one                   | Filter Out Myself           | Combine All Research, Is Company Email? | ## 1. New Google Calendar Event Detected (see above)                                                        |
| Is Company Email?       | If                    | Check if email is company or generic          | For Each Attendee           | Company Prompt, Person Prompt | ## 2. Research Attendee + Company: Uses OpenAI web search to research person and company info.               |
| Company Prompt          | Set                   | Create prompt for company research             | Is Company Email? (true)    | Research Company           | ## 2. Research Attendee + Company (see above)                                                               |
| Research Company        | HTTP Request          | Call OpenAI API for company info               | Company Prompt              | Person Prompt             | ## 2. Research Attendee + Company (see above)                                                               |
| Person Prompt           | Set                   | Create prompt for person research              | Is Company Email? (false), Research Company | Research Person           | ## 2. Research Attendee + Company (see above)                                                               |
| Research Person         | HTTP Request          | Call OpenAI API for person info                 | Person Prompt               | Collect Fields             | ## 2. Research Attendee + Company (see above)                                                               |
| Collect Fields          | Set                   | Extract and format person and company info     | Research Person             | For Each Attendee          | ## 2. Research Attendee + Company (see above)                                                               |
| Combine All Research    | Aggregate             | Aggregate all attendee research results        | For Each Attendee           | Write HTML                 | ## 3. Generate + Send Report: Combine data, format Markdown to HTML, send via Gmail.                         |
| Write HTML             | Markdown              | Convert Markdown briefing to HTML               | Combine All Research        | Send Report                | ## 3. Generate + Send Report (see above)                                                                     |
| Send Report            | Gmail                 | Send the briefing email                          | Write HTML                  |                           | ## 3. Generate + Send Report (see above)                                                                     |
| Sticky Note4           | Sticky Note           | Explains new event detection block              |                             |                           | ## 1. New Google Calendar Event Detected (see above)                                                        |
| Sticky Note            | Sticky Note           | Explains research block                          |                             |                           | ## 2. Research Attendee + Company (see above)                                                               |
| Sticky Note1           | Sticky Note           | Explains report generation and sending          |                             |                           | ## 3. Generate + Send Report (see above)                                                                     |
| Sticky Note2           | Sticky Note           | Instructions for editing context and email      |                             |                           | ## Edit Here (see above)                                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Calendar Trigger node:**  
   - Type: Google Calendar Trigger  
   - Trigger on event creation (`eventCreated`)  
   - Poll every minute  
   - Set calendar ID to your email address  
   - Authenticate with Google Calendar OAuth2 credentials.

2. **Create Set node named "Edit Fields":**  
   - Add string field `context` with your professional background (e.g., "I am working in web development, based in Singapore/Australia, and I work with startups").  
   - Add string field `email` with the recipient email address for the briefing.  
   - Add array field `attendees` set to `={{ $json.attendees }}` from the trigger.  
   - Connect output of Google Calendar Trigger to this node.

3. **Create Split Out node named "Split Out Attendees":**  
   - Set field to split out: `attendees`  
   - Connect output of Edit Fields to this node.

4. **Create Filter node named "Filter Out Myself":**  
   - Condition: Filter out items where `self` is true (`{{$json.self}}` is false to pass).  
   - Connect output of Split Out Attendees to this node.

5. **Create Split In Batches node named "For Each Attendee":**  
   - Default batch size (1)  
   - Connect output of Filter Out Myself to this node.

6. **Create If node named "Is Company Email?":**  
   - Condition: Check if attendee email does NOT match regex for generic email domains (gmail.com, yahoo.com, etc.).  
   - Use expression on `{{$node["For Each Attendee"].item.json.email}}`.  
   - Connect output of For Each Attendee to this node.

7. **Create Set node named "Company Prompt":**  
   - Create string field `prompt` with template:  
     ```
     Check out the website http://{{ $node["For Each Attendee"].item.json.email.split("@")[1] }}). 
     - What does this company do? 
     - What problem do they solve? 
     - What is their business model? 
     For context about me: {{ $node["Edit Fields"].item.json.context }}.
     Don't mention anything about this context in your answer - stay objective about the company. Make your answer less than 100 words. 
     If you are unable to find a company at this URL, just write 'Company Not Found'.
     ```
   - Connect "true" output of Is Company Email? to this node.

8. **Create HTTP Request node named "Research Company":**  
   - Method: POST  
   - URL: `https://api.openai.com/v1/responses`  
   - Authentication: Header Auth with OpenAI API key (Authorization: Bearer YOUR_API_KEY)  
   - Body parameters (JSON):  
     ```json
     {
       "model": "gpt-4o",
       "tools": [{ "type": "web_search_preview" }],
       "input": {{$json.prompt}}
     }
     ```  
   - Connect output of Company Prompt to this node.

9. **Create Set node named "Person Prompt":**  
   - Create string field `prompt` with template:  
     ```
     I have a call scheduled with {{ $node["For Each Attendee"].item.json.email }} Please find out as much as you can about the owner of this email address. 
     - What do they do? 
     - What are their interests? 
     - What might I not know about them?
     {{ $node["For Each Attendee"].item.json.email.match(/@(gmail\.com|hotmail\.com|yahoo\.com|outlook\.com|icloud\.com|aol\.com|live\.com|msn\.com|protonmail\.com|me\.com|mail\.com|gmx\.com|yandex\.com)/) ? '' : `Make sure to crawl their company website (http:/${$node["For Each Attendee"].item.json.email.split("@")[1]}) to see if there's anything there.` }} 
     For context: {{ $node["Edit Fields"].item.json.email }}. If there is any ambiguity, use this information to find the most likely person to be meeting with me.
     Don't tailor your answer to this context - stay objective about the person only. Make your answer less than 100 words.
     ```
   - Connect "false" output of Is Company Email? and output of Research Company to this node (Research Company output connects to Person Prompt to chain company research before person research).

10. **Create HTTP Request node named "Research Person":**  
    - Same configuration as Research Company node (POST, OpenAI API, header auth).  
    - Connect output of Person Prompt to this node.

11. **Create Set node named "Collect Fields":**  
    - Create fields:  
      - `person`: `={{ $json.output[1].content[0].text }}` (person research result)  
      - `company`:  
        ```
        ={{ $node["For Each Attendee"].item.json.email.match(/@(gmail\.com|hotmail\.com|yahoo\.com|outlook\.com|icloud\.com|aol\.com|live\.com|msn\.com|protonmail\.com|me\.com|mail\.com|gmx\.com|yandex\.com)/) ? 'No company information found.' : $node["Research Company"].item.json.output[1].content[0].text }}
        ```  
      - `email`: `={{ $node["For Each Attendee"].item.json.email }}`  
    - Connect output of Research Person to this node.

12. **Connect output of Collect Fields back to For Each Attendee node:**  
    - This loops the collected data back for aggregation.

13. **Create Aggregate node named "Combine All Research":**  
    - Aggregate all item data into one array.  
    - Connect output of For Each Attendee to this node.

14. **Create Markdown node named "Write HTML":**  
    - Mode: markdownToHtml  
    - Enable tables option  
    - Markdown content:  
      ```
      ### Meeting Briefing

      {{ 

      $json.data.reduce((acc, entry, index) => acc + (`

      ### Person ${index + 1} (${entry.email}):

      ${entry.person}

      ### Person ${index + 1} Company:

      ${entry.company}

      ---`)

      , '').trim().replace(/---$/, '')

      }}
      ```  
    - Connect output of Combine All Research to this node.

15. **Create Gmail node named "Send Report":**  
    - Send To: `={{ $node["Edit Fields"].item.json.email }}`  
    - Subject: `=Meeting Briefing: {{ $node["Google Calendar Trigger"].item.json.summary }} ({{ new Date($node["Google Calendar Trigger"].item.json.start.dateTime).format("dd/MM/yyyy") }})`  
    - Message: `={{ $json.data }}` (HTML from Write HTML node)  
    - Disable attribution  
    - Authenticate with Gmail OAuth2 credentials.  
    - Connect output of Write HTML to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow uses the OpenAI Responses API with the new web search preview tool to enrich meeting context.   | https://platform.openai.com/docs/guides/tools-web-search?api-mode=responses                         |
| Remember to add your OpenAI API key as a Header Auth credential with name "Authorization" and value "Bearer YOUR_API_KEY". | Credential setup instructions in workflow description.                                              |
| Edit the "Edit Fields" node to customize the recipient email and your personal context for better results.    | Located near the start of the workflow for easy customization.                                     |
| The workflow filters out common free email domains to decide when to research company info. Adjust regex as needed. | Regex used in "Is Company Email?" node for domain filtering.                                        |
| For best results, ensure Google Calendar and Gmail OAuth2 credentials have appropriate scopes and permissions. | OAuth2 setup required for Google Calendar and Gmail nodes.                                         |
| Sticky notes in the workflow provide detailed explanations of each block for easier understanding and maintenance. | Visual aids within the workflow editor.                                                            |

---

This document fully describes the workflow’s structure, logic, and configuration, enabling advanced users or AI agents to understand, reproduce, or modify it effectively.