Automate Pet Grooming Posts & Bookings with AI, Facebook & Telegram Bot

https://n8nworkflows.xyz/workflows/automate-pet-grooming-posts---bookings-with-ai--facebook---telegram-bot-7554


# Automate Pet Grooming Posts & Bookings with AI, Facebook & Telegram Bot

### 1. Workflow Overview

This n8n workflow automates pet grooming social media posting and appointment booking by integrating AI language models, Google Sheets, Google Calendar, Telegram Bot, and Facebook Graph API. It targets pet grooming businesses that want to streamline generating engaging social media posts and managing booking requests via Telegram messages.

The workflow is logically separated into three main blocks:

- **1.1 Telegram Input Reception and Command Routing:** Captures messages from Telegram, distinguishes between booking commands, posting requests, or image queues, and routes accordingly.

- **1.2 Booking Appointment Handling:** Parses, validates, and schedules grooming appointments on Google Calendar with AI assistance, providing feedback messages.

- **1.3 Social Media Post Scheduling and Publishing:** Manages queued posts by extracting data from Google Sheets, analyzing images with AI, generating captions, posting to Facebook, and updating status.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Telegram Input Reception and Command Routing

**Overview:**  
This block listens to Telegram messages sent to the bot and routes the message to different branches depending on whether the user wants to book an appointment (`/book` command), request a post (`/post` command), or upload images for queuing.

**Nodes Involved:**  
- On Message Receive  
- Check Message  
- Typing Effect  

**Node Details:**

- **On Message Receive**  
  - *Type:* Telegram Trigger  
  - *Role:* Entry point for Telegram updates, triggers workflow on message reception.  
  - *Config:* Listens for "message" updates from all chats (no chat ID filter).  
  - *Inputs:* Telegram messages  
  - *Outputs:* Raw Telegram message JSON  
  - *Edge Cases:* Telegram API downtime, invalid webhook setup.

- **Check Message**  
  - *Type:* Switch  
  - *Role:* Routes messages based on command or content presence.  
  - *Config:*  
    - Output keys:  
      - `Booking` if message text starts with `/book`  
      - `Post Command` if message text equals `/post`  
      - `Queue` if message contains one or more photos  
  - *Inputs:* Telegram message JSON  
  - *Outputs:* Branches to appropriate flows for booking, posting, or image queue  
  - *Edge Cases:* Command typos, unexpected message formats.

- **Typing Effect**  
  - *Type:* Telegram node (sendChatAction)  
  - *Role:* Sends "typing" action to Telegram to indicate bot is processing.  
  - *Config:* Sends chat action to indicate typing in the chat from which message was received.  
  - *Inputs:* Chat ID from incoming message  
  - *Outputs:* None (side effect)  
  - *Purpose:* UX enhancement; no impact on logic.

---

#### 2.2 Booking Appointment Handling

**Overview:**  
This block processes `/book` commands from Telegram, validates format, checks appointment availability using Google Calendar, and creates bookings if available. It provides success or error messages accordingly.

**Nodes Involved:**  
- Format Fixing  
- AI Agent1  
- Get availability in a calendar in Google Calendar  
- Structured Output Parser1  
- If1  
- Create an event  
- Success Message1  
- Error Message  
- Think  
- OpenAI Chat Model2  
- Google Gemini Chat Model2  
- Sticky Note (Booking Agent description)

**Node Details:**

- **Format Fixing**  
  - *Type:* Google Gemini Chat Model  
  - *Role:* Corrects or validates `/book` command format using AI.  
  - *Config:* System message enforces strict format rules for number of pets, datetime in RFC3339 with +08:00 offset, optional details.  
  - *Input:* Raw user message text  
  - *Output:* Corrected `/book` command or error message  
  - *Edge Cases:* Malformed inputs, ambiguous dates, missing timezone offset.

- **AI Agent1**  
  - *Type:* LangChain Agent with AI Assist  
  - *Role:* Checks appointment availability against Google Calendar with strict business logic for opening hours, overlaps, and format compliance.  
  - *Config:* System message defines operating hours (Mon, Wed-Sun 9AM-6AM next day), closed Tuesdays, 2 hours per pet, timezone handling, and error reporting.  
  - *Inputs:* Corrected booking format from Format Fixing  
  - *Outputs:* JSON with availability status, appointment times, error messages  
  - *Retries:* 2 times on failure  
  - *Edge Cases:* API failures, invalid formats, overlapping events, timezone issues.

- **Get availability in a calendar in Google Calendar**  
  - *Type:* Google Calendar Tool  
  - *Role:* Queries Google Calendar for events overlapping requested timeframe to detect conflicts.  
  - *Config:* Uses parameters `timeMin` and `timeMax` provided by AI Agent1 outputs, targets "Grooming Schedule" calendar.  
  - *Inputs:* Appointment start and end times  
  - *Outputs:* Existing events during requested time  
  - *Edge Cases:* Google API rate limits, auth errors.

- **Structured Output Parser1**  
  - *Type:* LangChain Structured Output Parser  
  - *Role:* Parses AI Agent1 JSON output into usable workflow data fields.  
  - *Config:* Parses fields: available (boolean), Appointment Name, start, end, error.  
  - *Edge Cases:* Parsing failures due to malformed JSON.

- **If1**  
  - *Type:* If condition  
  - *Role:* Branches workflow based on availability status from AI Agent1 output.  
  - *Config:* Checks if `available` field equals true (string).  
  - *Outputs:*  
    - True: proceed to create event  
    - False: send error message  
  - *Edge Cases:* Case sensitivity, unexpected output format.

- **Create an event**  
  - *Type:* Google Calendar  
  - *Role:* Creates a new appointment event in Google Calendar.  
  - *Config:* Sets start, end, summary fields from AI Agent1 output JSON, uses Grooming Schedule calendar.  
  - *Edge Cases:* API errors, permission issues.

- **Success Message1**  
  - *Type:* Telegram  
  - *Role:* Sends confirmation message "Appointment Added!" to Telegram group/chat.  
  - *Config:* Uses specific chat ID for group.

- **Error Message**  
  - *Type:* Telegram  
  - *Role:* Sends error reason message from AI Agent1 to Telegram group/chat.  
  - *Config:* Uses same chat ID as Success Message1.

- **Think**  
  - *Type:* LangChain ToolThink  
  - *Role:* Intermediate AI thinking step, used internally by AI Agent1 chain.

- **OpenAI Chat Model2 & Google Gemini Chat Model2**  
  - *Type:* LangChain AI language models  
  - *Role:* AI models used by AI Agent1 for language understanding and reasoning.

- **Sticky Note (Booking Agent description)**  
  - Describes the booking flow logic and rules.

---

#### 2.3 Social Media Post Scheduling and Publishing

**Overview:**  
This block automates social media post creation and publishing by fetching unposted rows from Google Sheets, analyzing pet images with AI, generating captions, posting to Facebook, updating Google Sheets, and notifying Telegram.

**Nodes Involved:**  
- Schedule Trigger  
- Get row(s) in sheet  
- If  
- Set Upload to True  
- Analyze image  
- Caption Generation  
- Post on Facebook  
- Success Message  
- No post on queue  
- Add Row1  
- AI Post Scheduler1  
- Format Response1  
- Get FileID1  
- OpenAI Chat Model & OpenAI Chat Model1  
- Google Gemini Chat Model1  
- Structured Output Parser  
- Send a text message in Telegram1  
- Sticky Note1 (Social Media Manager Agent)  
- Sticky Note2 (Facebook Post Scheduler)  
- Sticky Note3 (Typing Effect)

**Node Details:**

- **Schedule Trigger**  
  - *Type:* Schedule Trigger  
  - *Role:* Periodically activates workflow to process queued posts.  
  - *Config:* Runs daily at 1 AM.

- **Get row(s) in sheet**  
  - *Type:* Google Sheets  
  - *Role:* Retrieves first row in Google Sheet with `Uploaded` = False (indicating post not yet published).  
  - *Config:* Filters on column `Uploaded` = "False" in "Posting Details" spreadsheet.  
  - *Outputs:* Row data including Pet_Name, Owners_Name, Image_Url.

- **If**  
  - *Type:* If condition  
  - *Role:* Checks if a row was found to process.  
  - *Config:* Checks existence of `row_number` field (meaning row found).  
  - *Outputs:* True: proceed with post generation; False: send no post message.

- **Set Upload to True**  
  - *Type:* Google Sheets (update)  
  - *Role:* Marks the row as uploaded in Google Sheets after processing to avoid reposting.  
  - *Config:* Updates `Uploaded` column to "True" by matching on `row_number`.

- **Analyze image**  
  - *Type:* OpenAI Image Analysis  
  - *Role:* Uses AI to analyze the pet image content for caption context.  
  - *Config:* Uses GPT-4O-MINI for image analysis, input is Image_Url from sheet.

- **Caption Generation**  
  - *Type:* LangChain Agent with AI  
  - *Role:* Generates engaging social media captions combining pet name, owner name, image content, and current date.  
  - *Config:* Uses system prompt with sample caption and outputs structured JSON with `caption` and `image_url`.  
  - *Input:* Pet details and AI image description.

- **Post on Facebook**  
  - *Type:* Facebook Graph API  
  - *Role:* Posts photo and caption to Facebook page via API.  
  - *Config:* Uses Graph API v22.0, posts photo edge with caption and image URL from sheet and AI output.

- **Success Message**  
  - *Type:* Telegram  
  - *Role:* Sends Telegram message confirming posting process start.  
  - *Config:* Sent to a specified chat ID.

- **No post on queue**  
  - *Type:* Telegram  
  - *Role:* Sends Telegram message if no posts found in queue.  
  - *Config:* Sent to same chat or group.

- **Add Row1**  
  - *Type:* Google Sheets Tool (appendOrUpdate)  
  - *Role:* Adds or updates a new row in Google Sheet with pet name, owner, image URL, and `Uploaded`=False when images are received from Telegram.  
  - *Config:* Matching on Pet_Name to update existing or append new.

- **AI Post Scheduler1**  
  - *Type:* LangChain Agent  
  - *Role:* Processes image album messages from Telegram, extracts metadata, manages grouping, and updates Google Sheets.  
  - *Config:* System message instructs steps to extract pet and owner info, handle multiple images, append/update Google Sheets, and send Telegram feedback.

- **Format Response1**  
  - *Type:* Set  
  - *Role:* Constructs public image URL from Telegram file path for Google Sheets and caption extraction.

- **Get FileID1**  
  - *Type:* Telegram (get file)  
  - *Role:* Retrieves file ID for photo from Telegram message to fetch file path.

- **OpenAI Chat Models & Google Gemini Chat Model1**  
  - *Type:* LangChain AI models  
  - *Role:* Used for caption generation and metadata extraction.

- **Structured Output Parser**  
  - *Type:* LangChain parser  
  - *Role:* Parses AI-generated JSON output into fields for caption and image URL.

- **Send a text message in Telegram1**  
  - *Type:* Telegram  
  - *Role:* Sends feedback messages to user or group during post scheduling.

- **Sticky Notes**  
  - *Sticky Note1:* Describes social media manager agent flow for posting.  
  - *Sticky Note2:* Details Facebook post scheduler logic.  
  - *Sticky Note3:* Explains typing effect purpose.

- **Edge Cases:**  
  - Google Sheets API failures, malformed image URLs, AI caption generation errors, Facebook API posting errors, Telegram API rate limits.

---

### 3. Summary Table

| Node Name                      | Node Type                              | Functional Role                              | Input Node(s)                   | Output Node(s)                      | Sticky Note                                                                                          |
|--------------------------------|--------------------------------------|----------------------------------------------|---------------------------------|-----------------------------------|----------------------------------------------------------------------------------------------------|
| On Message Receive              | Telegram Trigger                     | Entry point for Telegram messages            | -                               | Check Message                     |                                                                                                    |
| Check Message                  | Switch                              | Routes messages based on commands             | On Message Receive              | Typing Effect, Format Fixing, Get row(s) in sheet, Get FileID1 |                                                                                                    |
| Typing Effect                  | Telegram (sendChatAction)            | Shows typing indicator in Telegram chat      | Check Message                   | Format Fixing, Get row(s) in sheet, Get FileID1 | Sticky Note3: Typing effect indicator purpose                                                      |
| Format Fixing                  | Google Gemini Chat Model             | Fixes booking command format                  | Check Message (Booking branch) | AI Agent1                       |                                                                                                    |
| AI Agent1                     | LangChain Agent                     | Validates appointment availability            | Format Fixing                   | If1                            | Sticky Note: Booking Agent flow description                                                        |
| Get availability in a calendar in Google Calendar | Google Calendar Tool                | Checks calendar for booking conflicts          | AI Agent1                      | AI Agent1                      |                                                                                                    |
| Structured Output Parser1       | LangChain Output Parser             | Parses AI booking availability response       | AI Agent1                      | If1                            |                                                                                                    |
| If1                           | If Condition                       | Branches based on availability                 | Structured Output Parser1       | Create an event, Error Message   |                                                                                                    |
| Create an event                | Google Calendar                    | Creates booking event on calendar              | If1 (true)                     | Success Message1                |                                                                                                    |
| Success Message1               | Telegram                          | Sends success confirmation message             | Create an event                | -                             |                                                                                                    |
| Error Message                 | Telegram                          | Sends error message if booking fails           | If1 (false)                    | -                             |                                                                                                    |
| Think                         | LangChain ToolThink                | AI intermediate reasoning step                  | AI Agent1                      | AI Agent1                      |                                                                                                    |
| OpenAI Chat Model2             | LangChain AI Model                | AI model used in booking agent                  | AI Agent1                      | AI Agent1                      |                                                                                                    |
| Google Gemini Chat Model2      | LangChain AI Model                | AI model used in booking agent                  | AI Agent1                      | AI Agent1                      |                                                                                                    |
| Schedule Trigger              | Schedule Trigger                  | Triggers scheduled post processing              | -                               | Get row(s) in sheet             |                                                                                                    |
| Get row(s) in sheet           | Google Sheets                    | Retrieves unposted rows from sheet               | Schedule Trigger, Check Message | If                            |                                                                                                    |
| If                           | If Condition                     | Checks if rows exist for posting                 | Get row(s) in sheet            | Set Upload to True, No post on queue |                                                                                                    |
| Set Upload to True            | Google Sheets                    | Marks row as uploaded                             | If (true)                     | Analyze image                  |                                                                                                    |
| Analyze image                | OpenAI Image Analysis           | Analyzes pet images to assist caption creation   | Set Upload to True             | Caption Generation             |                                                                                                    |
| Caption Generation           | LangChain Agent                 | Generates social media captions                   | Analyze image, OpenAI Chat Model | Post on Facebook             | Sticky Note1: Social Media Manager Agent flow                                                     |
| Post on Facebook            | Facebook Graph API              | Posts photo and caption to Facebook page          | Caption Generation             | -                             | Sticky Note2: Facebook Post Scheduler flow                                                        |
| Success Message              | Telegram                      | Sends posting start confirmation                   | Set Upload to True             | -                             |                                                                                                    |
| No post on queue            | Telegram                      | Sends message if no posts queued                   | If (false)                    | -                             |                                                                                                    |
| Get FileID1                 | Telegram                      | Retrieves Telegram file ID for images              | Check Message (Queue branch)  | Format Response1              |                                                                                                    |
| Format Response1            | Set                         | Constructs full image URL from Telegram file path  | Get FileID1                   | AI Post Scheduler1            |                                                                                                    |
| AI Post Scheduler1          | LangChain Agent             | Processes Telegram album messages and updates sheet | Format Response1, Add Row1     | Send a text message in Telegram1 |                                                                                                    |
| Add Row1                    | Google Sheets Tool           | Adds or updates image metadata in Google Sheets     | AI Post Scheduler1            | AI Post Scheduler1            |                                                                                                    |
| OpenAI Chat Model           | LangChain AI Model         | Used for caption generation and metadata extraction | AI Post Scheduler1            | Caption Generation            |                                                                                                    |
| OpenAI Chat Model1          | LangChain AI Model         | Used for caption generation                          | AI Post Scheduler1            | Caption Generation            |                                                                                                    |
| Google Gemini Chat Model1   | LangChain AI Model         | Used for structured output parsing                    | OpenAI Chat Model1            | Structured Output Parser      |                                                                                                    |
| Structured Output Parser    | LangChain Output Parser   | Parses AI-generated JSON for captions                 | Google Gemini Chat Model1     | Caption Generation            |                                                                                                    |
| Send a text message in Telegram1 | Telegram                  | Sends Telegram feedback messages                       | AI Post Scheduler1            | -                             |                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node ("On Message Receive")**  
   - Type: Telegram Trigger  
   - Parameters: Listen to "message" updates, no chat filter.  
   - Credentials: Telegram API for your bot.

2. **Add Switch Node ("Check Message")**  
   - Route messages into:  
     - `Booking` if text starts with `/book`  
     - `Post Command` if text equals `/post`  
     - `Queue` if message contains photos  
   - Connect "On Message Receive" output to this node.

3. **Add Telegram Node ("Typing Effect")**  
   - Operation: sendChatAction (typing)  
   - Chat ID: from incoming message  
   - Connect from all branches of "Check Message" that need UX indication.

---

**Booking Appointment Branch:**

4. **Add Google Gemini Chat Model Node ("Format Fixing")**  
   - Purpose: Correct `/book` command format.  
   - System Prompt: Enforce `/book <number_of_pets>, <RFC3339 datetime +08:00>, <optional notes>`.  
   - Input: message text from "Check Message" booking branch.

5. **Add LangChain Agent Node ("AI Agent1")**  
   - Purpose: Validate booking time, check conflicts, apply business logic.  
   - System Prompt: Detailed booking rules, operating hours, timezone +08:00, overlap constraints.  
   - Input: output from "Format Fixing".

6. **Add Google Calendar Tool Node ("Get availability in a calendar in Google Calendar")**  
   - Purpose: Query existing events in requested timeframe.  
   - Parameters: Use AI Agent1 outputs for `timeMin` and `timeMax`.  
   - Calendar: Grooming Schedule calendar ID.

7. **Add LangChain Structured Output Parser Node ("Structured Output Parser1")**  
   - Purpose: Parse AI JSON response with availability, start/end, error.

8. **Add If Node ("If1")**  
   - Condition: output.available == true (string).  
   - True path: Proceed to create event.  
   - False path: Send error message.

9. **Add Google Calendar Node ("Create an event")**  
   - Parameters: Use AI output for start, end, summary.  
   - Calendar: Grooming Schedule calendar ID.

10. **Add Telegram Node ("Success Message1")**  
    - Text: "Appointment Added!"  
    - Chat ID: Booking group chat.

11. **Add Telegram Node ("Error Message")**  
    - Text: error message from AI output.  
    - Chat ID: Booking group chat.

---

**Social Media Post Scheduling Branch:**

12. **Add Schedule Trigger Node ("Schedule Trigger")**  
    - Frequency: Daily at 1 AM.

13. **Add Google Sheets Node ("Get row(s) in sheet")**  
    - Document: Posting Details spreadsheet.  
    - Sheet: Sheet1.  
    - Filter: Uploaded = False, return first match only.

14. **Add If Node ("If")**  
    - Condition: row_number exists (row found).  
    - True: Proceed to post generation.  
    - False: Send No post on queue message.

15. **Add Google Sheets Update Node ("Set Upload to True")**  
    - Operation: Update row to Uploaded = True by row_number.

16. **Add OpenAI Image Analysis Node ("Analyze image")**  
    - Input: Image_Url from Google Sheets row.

17. **Add LangChain Agent Node ("Caption Generation")**  
    - Input: Pet_Name, Owners_Name, date, image content.  
    - System prompt: Generate engaging pet grooming social media caption.

18. **Add Facebook Graph API Node ("Post on Facebook")**  
    - Operation: POST to "me/photos" edge.  
    - Parameters: caption and url from AI output and sheet.

19. **Add Telegram Node ("Success Message")**  
    - Text: "Will Start Posting now."  
    - Chat ID: Defined chat.

20. **Add Telegram Node ("No post on queue")**  
    - Text: "Sorry. There's no Post on queue."  
    - Chat ID: Defined chat.

---

**Telegram Photo Queue Branch:**

21. **Add Telegram Node ("Get FileID1")**  
    - Resource: file  
    - File ID: last photo's file_id in message.

22. **Add Set Node ("Format Response1")**  
    - Construct image_url from Telegram file path and bot token.

23. **Add Google Sheets Tool Node ("Add Row1")**  
    - Operation: Append or update with Pet_Name, Owners_Name, Image_Url, Uploaded = False.

24. **Add LangChain Agent Node ("AI Post Scheduler1")**  
    - Purpose: Process albums, extract metadata, manage Google Sheets entries.  
    - System prompt: Detailed instructions on metadata extraction and feedback.

25. **Add Telegram Node ("Send a text message in Telegram1")**  
    - Sends success or failure messages after adding rows.

---

**Additional Configuration:**

- **Credentials:**  
  - Google Sheets OAuth2 for reading/updating sheets.  
  - Google Calendar OAuth2 with calendar access.  
  - Telegram API for bot messaging and file retrieval.  
  - Facebook Graph API with page posting permissions.

- **Bot Token:** Replace in "Format Response1" node to generate correct Telegram file URLs.

- **Chat IDs:** Replace placeholders with actual Telegram chat or group IDs for sending messages.

---

### 5. General Notes & Resources

| Note Content                                                                                                                | Context or Link                                                                 |
|-----------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| Social Media Manager Agent and Facebook Post Scheduler flows are documented in sticky notes within the workflow for clarity.| Sticky Note1 and Sticky Note2                                                      |
| Typing effect node improves Telegram UX by signaling bot activity.                                                           | Sticky Note3                                                                     |
| Booking Agent adheres to strict rules: RFC3339 datetime format, timezone +08:00, operating days/hours, and 2 hours per pet. | Sticky Note (Booking Agent)                                                       |
| This workflow requires valid OAuth2 credentials for Google services and Telegram Bot API token with appropriate scopes.      | n8n credential management                                                        |
| Facebook API uses version v22.0 for photo posting; ensure page access token has publish permissions.                          | Facebook Graph API documentation: https://developers.facebook.com/docs/graph-api |

---

**Disclaimer:**  
The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.