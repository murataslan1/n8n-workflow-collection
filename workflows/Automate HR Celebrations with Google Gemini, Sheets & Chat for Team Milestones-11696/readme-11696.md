Automate HR Celebrations with Google Gemini, Sheets & Chat for Team Milestones

https://n8nworkflows.xyz/workflows/automate-hr-celebrations-with-google-gemini--sheets---chat-for-team-milestones-11696


# Automate HR Celebrations with Google Gemini, Sheets & Chat for Team Milestones

---

### 1. Workflow Overview

This workflow automates HR celebrations by identifying employee birthdays and work anniversaries daily, generating personalized messages using Google Gemini AI, and posting them to a Google Chat space. It targets companies aiming to streamline recognition of team milestones with consistent, warm, and professional messaging.

The workflow is organized into two main logical blocks:

- **1.1 Birthday Celebration Automation:**  
  Checks a Google Sheet daily for employees with birthdays on the current day, generates unique birthday wishes via AI, posts messages to Google Chat, and logs the event.

- **1.2 Work Anniversary Celebration Automation:**  
  Retrieves employee joining dates, calculates anniversaries, generates milestone-specific congratulatory messages via AI, posts messages to Google Chat, and logs the event.

Each block manages configuration, data retrieval, AI message creation, message posting, and logging independently but follows a parallel structure for maintainability and extensibility.

---

### 2. Block-by-Block Analysis

#### 1.1 Birthday Celebration Automation

**Overview:**  
This block triggers daily to scan the employee birthday list, selects employees whose birthday matches today's date, uses Google Gemini AI to create personalized birthday messages, posts them to Google Chat, and logs the activity in a Google Sheet.

**Nodes Involved:**  
- Schedule Trigger  
- SET-BIRTHDAY  
- Get dates-BDAY  
- Parse birthday  
- If Birthday not found  
- Loop Over Items  
- Google Gemini Chat Model  
- Birthday Message  
- GCHAT_BDAY  
- Log msg -Bday

**Node Details:**

- **Schedule Trigger**  
  - *Type:* Timer trigger node  
  - *Role:* Initiates the birthday block daily at 9:00 AM  
  - *Config:* Trigger at hour 9 (9 AM) daily  
  - *Connections:* Output → SET-BIRTHDAY  
  - *Edge Cases:* If workflow is paused or n8n instance down at trigger time, run delayed or missed  
  - *Notes:* Essential for daily automation

- **SET-BIRTHDAY**  
  - *Type:* Set node  
  - *Role:* Holds configuration variables like Agency Name, Google Chat API key, space ID, and token for birthday messages  
  - *Config:* Replace placeholder values with actual agency name and Google Chat credentials  
  - *Connections:* Input ← Schedule Trigger; Output → Get dates-BDAY  
  - *Edge Cases:* Missing or incorrect credentials will cause downstream failures posting messages  
  - *Notes:* Central config node for birthday automation

- **Get dates-BDAY**  
  - *Type:* Google Sheets node  
  - *Role:* Reads employee birthday data from a defined Google Sheet and tab (Birthday List)  
  - *Config:* Document ID and Sheet GID set to a specific Google Sheet with employee DOB data  
  - *Connections:* Input ← SET-BIRTHDAY; Output → Parse birthday  
  - *Edge Cases:* Authentication issues, sheet access revoked, or incorrect sheet ID cause failures  
  - *Version:* Requires Google Sheets OAuth2 credentials

- **Parse birthday**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Filters the employee records to find who has a birthday today  
  - *Config:* Custom JS that compares today's date with employee DOB month/day  
  - *Key Expressions:* Uses JS Date object, matches month and day ignoring year  
  - *Connections:* Input ← Get dates-BDAY; Output → If Birthday not found  
  - *Edge Cases:* Incorrect date formats in sheet rows, missing DOB fields, or empty data handled by returning status NO_BIRTHDAY_TODAY  
  - *Failure:* Invalid date parsing can cause empty results

- **If Birthday not found**  
  - *Type:* If node  
  - *Role:* Branches workflow based on whether any birthday found  
  - *Config:* Checks if status equals "NO_BIRTHDAY_TODAY"  
  - *Connections:* True branch → no further action; False branch → Loop Over Items  
  - *Edge Cases:* Expression evaluation errors if status missing

- **Loop Over Items**  
  - *Type:* SplitInBatches node  
  - *Role:* Processes each birthday employee individually to send messages  
  - *Config:* Default batch size (processes items one by one)  
  - *Connections:* Input ← If Birthday not found (false branch); Output → Birthday Message  
  - *Edge Cases:* Large batch sizes may cause rate limits on AI or API calls

- **Google Gemini Chat Model**  
  - *Type:* Google Gemini AI Chat Model node (Langchain integration)  
  - *Role:* Provides AI-generated text capability for message crafting  
  - *Config:* Uses Google PaLM API credentials configured in node settings  
  - *Connections:* Input from Loop Over Items (implied, linked via Birthday Message); Output → Birthday Message  
  - *Edge Cases:* API key invalid, quota exceeded, or network issues cause errors  
  - *Credentials:* GooglePalmApi credentials required

- **Birthday Message**  
  - *Type:* Chain LLM node (Langchain)  
  - *Role:* Defines the prompt template for birthday message generation using employee name from input  
  - *Config:* Multi-line prompt instructing AI to create a warm, concise, professional birthday message with strict style rules and signature  
  - *Key Variables:* `{{ $json["EMPLOYEE NAME "] }}` used to personalize message  
  - *Connections:* Input ← Google Gemini Chat Model; Output → GCHAT_BDAY  
  - *Edge Cases:* Missing employee name causes incomplete prompts; AI response failures possible

- **GCHAT_BDAY**  
  - *Type:* HTTP Request node  
  - *Role:* Posts the generated birthday message to Google Chat via API  
  - *Config:* POST request to Google Chat API endpoint with space ID, API key, and token from SET-BIRTHDAY node variables; JSON body contains message text  
  - *Connections:* Input ← Birthday Message; Output → Log msg -Bday  
  - *Error Handling:* Retries up to 2 times with 5-second interval; continues on failure (prevents full workflow stop)  
  - *Edge Cases:* Invalid tokens, expired keys, or network issues cause message posting failure

- **Log msg -Bday**  
  - *Type:* Google Sheets node  
  - *Role:* Logs the birthday message event with timestamp, event type, and employee name into a "Logs" sheet  
  - *Config:* Appends row with current timestamp, event type "Birthday", and employee name from Loop Over Items data  
  - *Connections:* Input ← GCHAT_BDAY; Output → Loop Over Items (creates a loop for next employee)  
  - *Edge Cases:* Sheet write failures, quota limits, or auth issues will cause logging failure

---

#### 1.2 Work Anniversary Celebration Automation

**Overview:**  
Runs daily to detect employees celebrating work anniversaries based on joining date, calculates years of service, generates personalized anniversary messages via AI, posts to Google Chat, and logs the event.

**Nodes Involved:**  
- Schedule Trigger1  
- SET - ANNIVERSARY  
- Get dates-ANNI  
- Today  
- parse ANNIVESARY  
- If Anniversary not found  
- Loop Over Items1  
- Google Gemini Chat Model1  
- Anniversary message  
- GCHAT_ANNI  
- Log msg - ANNI

**Node Details:**

- **Schedule Trigger1**  
  - *Type:* Timer trigger node  
  - *Role:* Initiates this block daily at 9:00 AM for anniversaries  
  - *Config:* Trigger at hour 9 (9 AM) daily  
  - *Connections:* Output → SET - ANNIVERSARY  
  - *Edge Cases:* Same as Schedule Trigger

- **SET - ANNIVERSARY**  
  - *Type:* Set node  
  - *Role:* Stores configuration such as Agency Name, Google Chat API key, space ID, and token specific for anniversary messages  
  - *Config:* Replace placeholders with actual values  
  - *Connections:* Input ← Schedule Trigger1; Output → Get dates-ANNI  
  - *Edge Cases:* Missing/invalid credentials cause failures downstream

- **Get dates-ANNI**  
  - *Type:* Google Sheets node  
  - *Role:* Retrieves employee work anniversary data from a specific Google Sheet tab ("Work Anni")  
  - *Config:* Points to a document and sheet with joining dates  
  - *Connections:* Input ← SET - ANNIVERSARY; Output → Today  
  - *Edge Cases:* Sheet access or auth failures may block data retrieval

- **Today**  
  - *Type:* Set node  
  - *Role:* Sets today's date in ISO format (`todayIso`) for use in anniversary date calculations  
  - *Config:* Uses n8n built-in variable `$today`  
  - *Connections:* Input ← Get dates-ANNI; Output → parse ANNIVESARY

- **parse ANNIVESARY**  
  - *Type:* Code node (JavaScript)  
  - *Role:* Parses join dates, compares to today, calculates years of service, and identifies anniversaries occurring today  
  - *Config:* Robust parsing support for multiple date formats (e.g., dd-MMM-yyyy, dd/mm/yyyy), normalizes years, filters future dates, and returns matches with years of service  
  - *Key Variables:* Input array of employee objects, output status and matches array with employee name and years of service  
  - *Connections:* Input ← Today; Output → If Anniversary not found  
  - *Edge Cases:* Missing or malformed join dates, future dates ignored, returns NO_ANNIVERSARY_TODAY if no matches

- **If Anniversary not found**  
  - *Type:* If node  
  - *Role:* Checks if anniversary was found based on status field  
  - *Config:* Condition checks if status == "NO_ANNIVERSARY_TODAY"  
  - *Connections:* True branch → no further action; False branch → Loop Over Items1  
  - *Edge Cases:* Missing status causes expression evaluation problems

- **Loop Over Items1**  
  - *Type:* SplitInBatches node  
  - *Role:* Processes each anniversary employee individually for messaging  
  - *Config:* Default batch size  
  - *Connections:* Input ← If Anniversary not found (false); Output → Anniversary message  
  - *Edge Cases:* Large batches can cause API throttling

- **Google Gemini Chat Model1**  
  - *Type:* Google Gemini AI Chat Model node (Langchain)  
  - *Role:* Provides AI conversational model for anniversary message generation  
  - *Config:* Uses the same Google PaLM API credentials as birthday model  
  - *Connections:* Input from Loop Over Items1; Output → Anniversary message  
  - *Edge Cases:* Same AI API failure modes as birthday model

- **Anniversary message**  
  - *Type:* Chain LLM node (Langchain)  
  - *Role:* Defines AI prompt for crafting warm, professional anniversary congratulations including years of service and employee name  
  - *Config:* Multi-line prompt with strict formatting and tone rules; uses `{{ $json.matches[0].name }}` and `{{ $json.matches[0].yearsOfService }}` for personalization  
  - *Connections:* Input ← Google Gemini Chat Model1; Output → GCHAT_ANNI  
  - *Edge Cases:* Missing employee data leads to incomplete prompts

- **GCHAT_ANNI**  
  - *Type:* HTTP Request node  
  - *Role:* Posts the anniversary message to Google Chat using configured API credentials  
  - *Config:* POST request with API key, token, and space ID from SET - ANNIVERSARY node variables; JSON body contains the message text  
  - *Connections:* Input ← Anniversary message; Output → Log msg - ANNI  
  - *Error Handling:* Retries twice with 5 seconds wait; continues on failure  
  - *Edge Cases:* Invalid tokens or expired keys cause posting failures

- **Log msg - ANNI**  
  - *Type:* Google Sheets node  
  - *Role:* Logs anniversary message events with timestamp, event type "Anniversary", and employee name  
  - *Config:* Appends to a "Logs" Google Sheet with defined columns  
  - *Connections:* Input ← GCHAT_ANNI; Output → Loop Over Items1 (enables processing multiple employees)  
  - *Edge Cases:* Sheet write or permission errors cause logging failure

---

### 3. Summary Table

| Node Name             | Node Type                       | Functional Role                            | Input Node(s)            | Output Node(s)             | Sticky Note                                                                                                                                                                                                                                                                                   |
|-----------------------|--------------------------------|--------------------------------------------|--------------------------|----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger      | Schedule Trigger                | Triggers birthday automation daily at 9AM | —                        | SET-BIRTHDAY               |                                                                                                                                                                                                                                                                                               |
| SET-BIRTHDAY          | Set                            | Stores config & credentials for birthday   | Schedule Trigger         | Get dates-BDAY             |                                                                                                                                                                                                                                                                                               |
| Get dates-BDAY        | Google Sheets                  | Reads employee birthday data from sheet    | SET-BIRTHDAY             | Parse birthday             |                                                                                                                                                                                                                                                                                               |
| Parse birthday        | Code                           | Finds employees with birthdays today       | Get dates-BDAY           | If Birthday not found      |                                                                                                                                                                                                                                                                                               |
| If Birthday not found | If                             | Branches if no birthdays found              | Parse birthday           | Loop Over Items (false)    |                                                                                                                                                                                                                                                                                               |
| Loop Over Items       | SplitInBatches                 | Processes each birthday employee            | If Birthday not found    | Google Gemini Chat Model   |                                                                                                                                                                                                                                                                                               |
| Google Gemini Chat Model | Google Gemini AI Chat Model   | AI text generation for birthday messages   | Loop Over Items          | Birthday Message           |                                                                                                                                                                                                                                                                                               |
| Birthday Message      | Chain LLM                      | Defines birthday message prompt             | Google Gemini Chat Model | GCHAT_BDAY                 |                                                                                                                                                                                                                                                                                               |
| GCHAT_BDAY            | HTTP Request                   | Posts birthday message to Google Chat      | Birthday Message         | Log msg -Bday              |                                                                                                                                                                                                                                                                                               |
| Log msg -Bday         | Google Sheets                  | Logs birthday message event                 | GCHAT_BDAY               | Loop Over Items            |                                                                                                                                                                                                                                                                                               |
| Schedule Trigger1     | Schedule Trigger                | Triggers anniversary automation daily at 9AM | —                      | SET - ANNIVERSARY          |                                                                                                                                                                                                                                                                                               |
| SET - ANNIVERSARY     | Set                            | Stores config & credentials for anniversary | Schedule Trigger1        | Get dates-ANNI             |                                                                                                                                                                                                                                                                                               |
| Get dates-ANNI        | Google Sheets                  | Reads employee anniversary data from sheet | SET - ANNIVERSARY        | Today                      |                                                                                                                                                                                                                                                                                               |
| Today                 | Set                            | Sets today's ISO date for anniversary calc | Get dates-ANNI           | parse ANNIVESARY           |                                                                                                                                                                                                                                                                                               |
| parse ANNIVESARY      | Code                           | Identifies employees with anniversaries today | Today                  | If Anniversary not found   |                                                                                                                                                                                                                                                                                               |
| If Anniversary not found | If                           | Branches if no anniversaries found          | parse ANNIVESARY         | Loop Over Items1 (false)   |                                                                                                                                                                                                                                                                                               |
| Loop Over Items1      | SplitInBatches                 | Processes each anniversary employee         | If Anniversary not found | Google Gemini Chat Model1  |                                                                                                                                                                                                                                                                                               |
| Google Gemini Chat Model1 | Google Gemini AI Chat Model   | AI text generation for anniversary messages | Loop Over Items1         | Anniversary message        |                                                                                                                                                                                                                                                                                               |
| Anniversary message   | Chain LLM                      | Defines anniversary message prompt           | Google Gemini Chat Model1 | GCHAT_ANNI                 |                                                                                                                                                                                                                                                                                               |
| GCHAT_ANNI            | HTTP Request                   | Posts anniversary message to Google Chat    | Anniversary message      | Log msg - ANNI             |                                                                                                                                                                                                                                                                                               |
| Log msg - ANNI        | Google Sheets                  | Logs anniversary message event               | GCHAT_ANNI               | Loop Over Items1           |                                                                                                                                                                                                                                                                                               |
| Sticky Note           | Sticky Note                    | Workflow overview and setup instructions     | —                        | —                          | 🎂 Automate Employee Celebrations: Checks birthdays & anniversaries daily, drafts AI messages, posts to Google Chat. Setup includes credentials, agency name, and Google Sheet with DOB/Join Date columns.                                                                                         |
| Sticky Note1          | Sticky Note                    | Birthday Automation overview                  | —                        | —                          | ## 1. Birthday Automation: Checks birthdays, sends AI-generated wishes using credentials from `SET-BIRTHDAY`.                                                                                                                                                                               |
| Sticky Note2          | Sticky Note                    | Anniversary Automation overview               | —                        | —                          | ## 2. Work Anniversary Automation: Calculates years of service, sends milestone messages using config from `SET - ANNIVERSARY`.                                                                                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node** named `Schedule Trigger`:
   - Set to trigger daily at 9:00 AM.
   - Connect output to `SET-BIRTHDAY`.

2. **Create a Set node** named `SET-BIRTHDAY`:
   - Add string fields:  
     - `Agency Name` with your agency name (e.g., "your agency name")  
     - `google chat api key` with your Google Chat API key  
     - `google chat space id` with your Google Chat space ID  
     - `google chat token` with your Google Chat token  
   - Connect output to `Get dates-BDAY`.

3. **Create a Google Sheets node** named `Get dates-BDAY`:
   - Configure with your Google Sheets OAuth2 credentials.  
   - Set Document ID to your Google Sheet containing employee birthdays.  
   - Set Sheet Name to the tab with birthday data (default is first tab or "Birthday List").  
   - Connect output to `Parse birthday`.

4. **Create a Code node** named `Parse birthday`:
   - Paste the provided JavaScript code that filters employees whose birthday is today (matching month and day).
   - Connect output to `If Birthday not found`.

5. **Create an If node** named `If Birthday not found`:
   - Condition: Check if `{{ $json.status }}` equals `NO_BIRTHDAY_TODAY`.  
   - True branch: no further action (end).  
   - False branch: connect to `Loop Over Items`.

6. **Create a SplitInBatches node** named `Loop Over Items`:
   - Use default batch size (1).  
   - Connect output to `Google Gemini Chat Model`.

7. **Create a Google Gemini Chat Model node** named `Google Gemini Chat Model`:
   - Configure with Google PaLM API credentials.  
   - Connect output to `Birthday Message`.

8. **Create a Chain LLM node** named `Birthday Message`:
   - Paste the birthday message prompt text with instructions and examples using `{{ $json["EMPLOYEE NAME "] }}` for personalization.  
   - Connect output to `GCHAT_BDAY`.

9. **Create an HTTP Request node** named `GCHAT_BDAY`:
   - Set method to POST.  
   - URL: `https://chat.googleapis.com/v1/spaces/{{ $('SET-BIRTHDAY').item.json['google chat space id'] }}/messages?key={{ $('SET-BIRTHDAY').item.json['google chat api key'] }}&token={{ $('SET-BIRTHDAY').item.json['google chat token'] }}`  
   - Body type: JSON.  
   - Body content: `{ "text": {{ JSON.stringify($json.text) }} }`  
   - Enable retries (max 2), wait 5 seconds between tries, continue on error.  
   - Connect output to `Log msg -Bday`.

10. **Create a Google Sheets node** named `Log msg -Bday`:
    - Use same Google Sheets OAuth2 credentials.  
    - Configure to append to a "Logs" sheet with columns: TimeStamp, Event Type, Employee Name.  
    - Map:  
      - TimeStamp = `{{$now}}`  
      - Event Type = `"Birthday"`  
      - Employee Name = `{{ $('Loop Over Items').first().json["EMPLOYEE NAME "] }}`  
    - Connect output back to `Loop Over Items` for batch processing.

---

11. **Create a Schedule Trigger node** named `Schedule Trigger1`:
    - Set to trigger daily at 9:00 AM.  
    - Connect output to `SET - ANNIVERSARY`.

12. **Create a Set node** named `SET - ANNIVERSARY`:
    - Add string fields similar to `SET-BIRTHDAY` but for anniversary config:  
      - `Agency Name`, `google chat api key`, `google chat space id`, `google chat token`  
    - Connect output to `Get dates-ANNI`.

13. **Create a Google Sheets node** named `Get dates-ANNI`:
    - Configure with Google Sheets OAuth2 credentials.  
    - Set Document ID to your Google Sheet containing anniversary data.  
    - Set Sheet Name to the tab for work anniversaries ("Work Anni").  
    - Connect output to `Today`.

14. **Create a Set node** named `Today`:
    - Assign field `todayIso` with expression `{{$today}}` to capture current date in ISO format.  
    - Pass through other fields as-is.  
    - Connect output to `parse ANNIVESARY`.

15. **Create a Code node** named `parse ANNIVESARY`:
    - Paste the provided JS code that parses `Date Joined` fields, normalizes and compares dates to today, calculates years of service, and returns matches or status.  
    - Connect output to `If Anniversary not found`.

16. **Create an If node** named `If Anniversary not found`:
    - Condition: Check if `{{ $json.status }}` equals `NO_ANNIVERSARY_TODAY`.  
    - True branch: no further action (end).  
    - False branch: connect to `Loop Over Items1`.

17. **Create a SplitInBatches node** named `Loop Over Items1`:
    - Default batch size 1.  
    - Connect output to `Google Gemini Chat Model1`.

18. **Create a Google Gemini Chat Model node** named `Google Gemini Chat Model1`:
    - Use same Google PaLM API credentials.  
    - Connect output to `Anniversary message`.

19. **Create a Chain LLM node** named `Anniversary message`:
    - Paste anniversary message prompt, instructing AI to create warm, professional work anniversary messages using `{{ $json.matches[0].name }}` and `{{ $json.matches[0].yearsOfService }}`.  
    - Connect output to `GCHAT_ANNI`.

20. **Create an HTTP Request node** named `GCHAT_ANNI`:
    - Method POST.  
    - URL: `https://chat.googleapis.com/v1/spaces/{{ $('SET - ANNIVERSARY').item.json['google chat space id'] }}/messages?key={{ $('SET - ANNIVERSARY').item.json['google chat api key'] }}&token={{ $('SET - ANNIVERSARY').item.json['google chat token'] }}`  
    - JSON body: `{ "text": {{ JSON.stringify($json.text) }} }`  
    - Enable retries (max 2), wait 5 seconds, continue on error.  
    - Connect output to `Log msg - ANNI`.

21. **Create a Google Sheets node** named `Log msg - ANNI`:
    - Append to "Logs" sheet with columns: TimeStamp, Event Type, Employee Name.  
    - Map:  
      - TimeStamp = `{{$now}}`  
      - Event Type = `"Anniversary"`  
      - Employee Name = `{{ $('Loop Over Items1').first().json.matches[0].name }}`  
    - Connect output back to `Loop Over Items1`.

---

22. **Add Sticky Notes** for documentation:
    - One summarizing overall workflow and setup instructions near `Schedule Trigger` and `Schedule Trigger1`.  
    - One near birthday nodes explaining birthday automation.  
    - One near anniversary nodes explaining anniversary automation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                         | Context or Link                                                                                                                |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| 🎂 Automate Employee Celebrations: Never miss birthdays or anniversaries. AI crafts unique messages posted to Google Chat. Setup requires Google Sheets with DOB and Join Date columns.              | Sticky Note (initial workflow summary)                                                                                        |
| Use Google Gemini (PaLM API) for AI text generation. Ensure API credentials are valid and quota sufficient.                                                                                          | Google Gemini Chat Model nodes                                                                                                 |
| Messages strictly avoid jokes, clichés, and informal language to maintain professional tone suitable for company-wide communication.                                                                  | Prompt instructions in Birthday Message and Anniversary message nodes                                                          |
| Logs of sent messages are appended to a Google Sheets "Logs" tab with timestamp, event type, and employee name for audit and tracking purposes.                                                     | Log msg -Bday and Log msg - ANNI nodes                                                                                         |
| Google Chat API requires valid space ID, API key, and token for message posting. Setup these credentials securely in the `SET-BIRTHDAY` and `SET - ANNIVERSARY` nodes before running workflow.       | Configuration nodes SET-BIRTHDAY and SET - ANNIVERSARY                                                                          |
| This workflow assumes date formats in Google Sheets follow DD-MMM-YYYY or similar variants. Date parsing scripts accommodate common variations but ensure consistency for reliable operation.        | parse ANNIVESARY and Parse birthday code nodes                                                                                 |
| For setup guidance and configuration tips, refer to the sticky notes embedded in the workflow canvas.                                                                                                | Sticky notes content within workflow                                                                                           |

---

**Disclaimer:** The provided text is exclusively sourced from an n8n automated workflow. It complies strictly with content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.

---