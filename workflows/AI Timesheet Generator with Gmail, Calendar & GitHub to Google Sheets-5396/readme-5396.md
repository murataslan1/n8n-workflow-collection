AI Timesheet Generator with Gmail, Calendar & GitHub to Google Sheets

https://n8nworkflows.xyz/workflows/ai-timesheet-generator-with-gmail--calendar---github-to-google-sheets-5396


# AI Timesheet Generator with Gmail, Calendar & GitHub to Google Sheets

---
### 1. Workflow Overview

This workflow, named **"Workday Journaling"**, automates the collection and summarization of a day's work activities by integrating data from Gmail, Google Calendar, GitHub, and then compiling the results into a structured timesheet in Google Sheets. Its primary use case is to help professionals track and journal their daily work activities automatically, enabling efficient timesheet generation without manual input.

The workflow is logically divided into these main blocks:

- **1.1 Data Collection**  
  Fetches raw data from Gmail (emails), Google Calendar (events), and GitHub (commits and pull requests).

- **1.2 Data Aggregation and Filtering**  
  Aggregates multiple fetched items into consolidated datasets and filters GitHub commits and PRs relevant to the configured user and date.

- **1.3 Data Formatting and AI Processing**  
  Formats collected data into a unified JSON object and invokes OpenAI's GPT model to generate concise, structured activity summaries.

- **1.4 Sheet Management**  
  Creates or verifies monthly Google Sheets tabs and initializes header columns if they do not exist.

- **1.5 Final Output to Google Sheets**  
  Splits AI-generated activity summaries into individual entries and appends them to the current month's sheet.

---

### 2. Block-by-Block Analysis

#### 1.1 Data Collection

- **Overview:**  
  This block retrieves all raw activity data from external sources for the previous day (yesterday), ensuring that calendar events, emails, commits, and pull requests are collected for processing.

- **Nodes Involved:**  
  - Set Variables  
  - Get Today's Emails (Gmail)  
  - Get Today's Calendar Events (Google Calendar)  
  - Split Out1 (splits repositories array for commits)  
  - Get Commits From Github (HTTP Request)  
  - Split Out2 (splits repositories array for PRs)  
  - Get GitHub PRs

- **Node Details:**

  - **Set Variables**  
    - *Type:* Set  
    - *Role:* Defines key static or dynamic variables such as today's date, GitHub handle, repositories to track, and user email.  
    - *Key Parameters:*  
      - `today_date` = current date in "yyyy-MM-dd" format  
      - `github_handle` = GitHub username (e.g., "luka-zivkovic")  
      - `repositoriesToTrack` = array of GitHub repos to monitor (e.g., ["techPoweredGrowth", "tech-learn"])  
      - `myEmail` = user's email address (used for email filtering)  
    - *Input:* Triggered daily at 7 PM  
    - *Output:* Feeds downstream data fetch nodes

  - **Get Today's Emails**  
    - *Type:* Gmail  
    - *Role:* Fetches all emails received after the start of today, filtering by sender (user's own email).  
    - *Configuration:* Filters by sender as `myEmail`, uses "receivedAfter" with yesterday's start of day timestamp.  
    - *Edge Cases:* Emails from "noreply" or newsletters are later filtered out; Gmail API quota or auth errors possible.

  - **Get Today's Calendar Events**  
    - *Type:* Google Calendar  
    - *Role:* Retrieves all calendar events for the previous day (yesterday).  
    - *Configuration:* `timeMin` and `timeMax` set to start and end of yesterday. Returns all events.  
    - *Edge Cases:* Timezone differences may affect included events; requires valid Google OAuth2 credentials.

  - **Split Out1 & Split Out2**  
    - *Type:* Split Out  
    - *Role:* Splits the array of repository names (from `repositoriesToTrack`) into individual items to enable per-repository API calls.  
    - *Configuration:* Splits on `repositoriesToTrack` field.  
    - *Output:* Each repository name is sent individually to downstream nodes.

  - **Get Commits From Github**  
    - *Type:* HTTP Request  
    - *Role:* Calls GitHub REST API to fetch commits for each repository filtered by the time range of yesterday.  
    - *Configuration:* Dynamic URL constructed using variables; includes `since` and `until` parameters for date range.  
    - *Credentials:* Uses GitHub API credentials.  
    - *Edge Cases:* API rate limits, authentication failures, empty commit arrays.

  - **Get GitHub PRs**  
    - *Type:* GitHub node  
    - *Role:* Retrieves all pull requests for each repository.  
    - *Configuration:* Owner and repo names dynamically set; returns all PRs.  
    - *Edge Cases:* Large repo with many PRs may cause delays; proper pagination handled internally.

- **Sticky Notes:**  
  - "Data Collection Hub": Describes the various data sources and notes the use of yesterday's date for calendar events to accommodate timezone adjustments.

---

#### 1.2 Data Aggregation and Filtering

- **Overview:**  
  This block aggregates multiple items of the same type into arrays, merges all aggregated data, and filters GitHub commits and PRs to only include those authored or relevant to the configured user and date.

- **Nodes Involved:**  
  - Aggregate (emails)  
  - Aggregate1 (calendar events)  
  - Aggregate3 (commits)  
  - Aggregate2 (pull requests)  
  - If Authors Commit (filter commits by author)  
  - If it's created today (filter PRs created today)  
  - If it's closed today (filter PRs closed today)  
  - Merge

- **Node Details:**

  - **Aggregate Nodes (Aggregate, Aggregate1, Aggregate2, Aggregate3)**  
    - *Type:* Aggregate  
    - *Role:* Combines all incoming items of a specific type (emails, calendar events, commits, PRs) into a single array under a designated field (`emails`, `calendarEvents`, `commits`, `prs` respectively).  
    - *Output:* Aggregated arrays sent downstream.

  - **If Authors Commit**  
    - *Type:* If  
    - *Role:* Filters commits to include only those authored by the configured GitHub user (`github_handle`).  
    - *Condition:* Commit `author.login` equals the configured username.  
    - *Edge Cases:* Commits without author info may be excluded.

  - **If it's created today**  
    - *Type:* If  
    - *Role:* Filters pull requests that were created on the current date and by the configured user.  
    - *Condition:* PR `created_at` date equals today's date AND PR user login matches `github_handle`.

  - **If it's closed today**  
    - *Type:* If  
    - *Role:* Filters pull requests that were closed on the current date.  
    - *Condition:* PR `closed_at` date equals today's date.  
    - *Note:* Date extraction uses ISO date formatting.

  - **Merge**  
    - *Type:* Merge  
    - *Role:* Combines the aggregated arrays from all sources into one unified JSON object for comprehensive AI processing.

- **Sticky Notes:**  
  - "Data Aggregation": Explains the purpose of aggregation and merging into a single payload.  
  - "GitHub Filtering": Details filtering logic for commits and pull requests to ensure relevance.

---

#### 1.3 Data Formatting and AI Processing

- **Overview:**  
  This block formats the merged raw data into structured summaries and uses OpenAI's GPT-4o-mini model to generate concise descriptions for each activity item.

- **Nodes Involved:**  
  - Format All Data (Code)  
  - Generate Journal Summary (OpenAI GPT)  
  - Split Out (split AI-generated array into individual entries)

- **Node Details:**

  - **Format All Data**  
    - *Type:* Code (JavaScript)  
    - *Role:* Extracts and formats data from each source: calendar events (confirmed only), emails (filtered for importance), commits, and pull requests.  
    - *Key Logic:*  
      - Filters calendar events by status 'confirmed'.  
      - Filters emails excluding 'noreply' and newsletters, limiting to 20 items.  
      - Maps commits and PRs into simplified objects.  
      - Creates a summary JSON object with date and all formatted data.  
    - *Input:* Aggregated and merged data  
    - *Output:* Structured JSON summary for AI processing  
    - *Edge Cases:* Missing fields handled by default strings; uses Luxon DateTime for durations.

  - **Generate Journal Summary**  
    - *Type:* OpenAI (LangChain)  
    - *Role:* Sends formatted summary JSON to GPT-4o-mini, requesting it to generate a JSON array of activity objects with fields `type` and `description` (max 120 chars, no commas/newlines).  
    - *Configuration:* System message defines the task strictly; input contains the entire JSON summary stringified.  
    - *Output:* JSON array of individual activity descriptions.  
    - *Edge Cases:* API errors, rate limits, or unexpected AI responses.

  - **Split Out**  
    - *Type:* Split Out  
    - *Role:* Splits the AI-generated array of activity objects into single items for insertion into Google Sheets.

- **Sticky Notes:**  
  - "AI Processing & Summary": Explains the consolidation, AI generation, and splitting process for clean data ready for output.

---

#### 1.4 Sheet Management

- **Overview:**  
  This block ensures that a monthly Google Sheet tab exists for the current month and initializes its header row if the sheet is newly created.

- **Nodes Involved:**  
  - Create Sheet If It Doesn't Exist (Google Sheets)  
  - If it didn't exist (If)  
  - Init Sheet Headers (Set)  
  - init Sheet Columns (Google Sheets)

- **Node Details:**

  - **Create Sheet If It Doesn't Exist**  
    - *Type:* Google Sheets  
    - *Role:* Attempts to create a new sheet tab named after the current month (e.g., "January").  
    - *Behavior:* If the sheet already exists, creation fails silently but outputs data.  
    - *Input:* Triggered after variable setup.

  - **If it didn't exist**  
    - *Type:* If  
    - *Role:* Checks if the sheet creation was successful by verifying if the `title` field exists in the response.  
    - *Output:* Branches execution; if sheet was new, proceed to header initialization.

  - **Init Sheet Headers**  
    - *Type:* Set  
    - *Role:* Prepares an empty row with column headers (`Date`, `Type`, `Description`) for the new sheet.

  - **init Sheet Columns**  
    - *Type:* Google Sheets  
    - *Role:* Appends the header row defined above to the newly created sheet's first row.

- **Sticky Notes:**  
  - "Sheet Management": Details the monthly sheet creation logic and header setup that runs only on the first execution of each month.

---

#### 1.5 Final Output to Google Sheets

- **Overview:**  
  The final block inserts all AI-generated activity entries into the current month's Google Sheet as individual rows.

- **Nodes Involved:**  
  - Insert Sheets Entry (Google Sheets)

- **Node Details:**

  - **Insert Sheets Entry**  
    - *Type:* Google Sheets  
    - *Role:* Appends each activity entry to the sheet named after the current month.  
    - *Columns Mapped:*  
      - `Date` → Current date (`yyyy-MM-dd`)  
      - `Type` → Activity type (CALENDAR_EVENT, EMAIL, COMMIT, PR)  
      - `Description` → AI-generated concise description  
    - *Input:* Single activity entries from the Split Out node.  
    - *Edge Cases:* Google Sheets API quota, sheet availability, mapping errors.

- **Sticky Notes:**  
  - "Final Output": Describes the clean, organized appending of timesheet entries for review.

---

### 3. Summary Table

| Node Name                      | Node Type                      | Functional Role                                  | Input Node(s)                         | Output Node(s)                  | Sticky Note                                                                                                               |
|--------------------------------|--------------------------------|-------------------------------------------------|-------------------------------------|--------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| Daily at 7PM                   | Cron                           | Triggers the workflow daily at 7 PM              | -                                   | Set Variables                  |                                                                                                                           |
| Set Variables                  | Set                            | Defines key variables for date, GitHub user, email, repos | Daily at 7PM                       | Get Today's Emails, Get Today's Calendar Events, Create Sheet If It Doesn't Exist, Split Out1, Split Out2 | "Update with your GitHub username, email, repositories"                                                                    |
| Get Today's Emails             | Gmail                          | Fetches emails from today filtered by sender     | Set Variables                      | Aggregate                       | "Fetches emails from today filtered by sender"                                                                             |
| Aggregate                     | Aggregate                      | Aggregates emails into an array                   | Get Today's Emails                 | Merge                          | "Aggregates emails into emails[]"                                                                                          |
| Get Today's Calendar Events   | Google Calendar                | Fetches yesterday's calendar events               | Set Variables                      | Aggregate1                      | "Fetches confirmed calendar events from yesterday"                                                                         |
| Aggregate1                    | Aggregate                      | Aggregates calendar events into an array          | Get Today's Calendar Events        | Merge                          | "Aggregates calendar events into calendarEvents[]"                                                                         |
| Split Out1                    | Split Out                     | Splits repository array for commits                | Set Variables                      | Get Commits From Github         |                                                                                                                           |
| Get Commits From Github       | HTTP Request                  | Fetches commits from GitHub for each repository   | Split Out1                       | If Authors Commit              | "Fetches commits using GitHub API filtered by date"                                                                         |
| If Authors Commit             | If                            | Filters commits to those authored by user          | Get Commits From Github            | Aggregate3                     | "Only includes commits by the configured user"                                                                             |
| Aggregate3                   | Aggregate                      | Aggregates filtered commits into an array          | If Authors Commit                 | Merge                          | "Aggregates commits into commits[]"                                                                                        |
| Split Out2                   | Split Out                     | Splits repository array for PRs                     | Set Variables                      | Get GitHub PRs                 |                                                                                                                           |
| Get GitHub PRs               | GitHub                        | Retrieves pull requests for each repository         | Split Out2                       | If it's created today, If it's closed today | "Pulls all PRs from specified repositories"                                                                                 |
| If it's created today        | If                            | Filters PRs created today by user                    | Get GitHub PRs                   | Aggregate2                      | "Filters PRs created today by the user"                                                                                     |
| If it's closed today         | If                            | Filters PRs closed today                             | Get GitHub PRs                   | Aggregate2                      | "Filters PRs closed today"                                                                                                  |
| Aggregate2                   | Aggregate                      | Aggregates filtered PRs into an array                | If it's created today, If it's closed today | Merge                   | "Aggregates PRs into prs[]"                                                                                                |
| Merge                       | Merge                         | Merges aggregated emails, calendar, commits, PRs into one object | Aggregate, Aggregate1, Aggregate3, Aggregate2 | Format All Data             | "Combines all aggregated data into one payload for AI processing"                                                          |
| Format All Data             | Code                          | Formats and consolidates all collected data         | Merge                            | Generate Journal Summary        | "Formats raw data into structured summary JSON"                                                                             |
| Generate Journal Summary    | OpenAI                        | Uses GPT-4o-mini to generate concise activity descriptions | Format All Data                 | Split Out                      | "Transforms raw activity data into structured timesheet entries using AI"                                                  |
| Split Out                  | Split Out                    | Splits the AI-generated array into individual entries | Generate Journal Summary         | Insert Sheets Entry             | "Splits AI-generated entries for Google Sheets insertion"                                                                  |
| Create Sheet If It Doesn't Exist | Google Sheets               | Creates monthly sheet tab if missing                  | Set Variables                   | If it didn't exist             | "Automatically creates a new sheet for each month"                                                                          |
| If it didn't exist          | If                            | Checks if sheet creation was successful              | Create Sheet If It Doesn't Exist | Init Sheet Headers (Yes branch) | "Checks if monthly sheet was newly created"                                                                                 |
| Init Sheet Headers          | Set                           | Prepares header row data                              | If it didn't exist               | init Sheet Columns             | "Initializes the header row with Date, Type, Description columns"                                                          |
| init Sheet Columns          | Google Sheets                 | Inserts header row into the new sheet                 | Init Sheet Headers              | -                              | "Sets header row in the new monthly sheet"                                                                                  |
| Insert Sheets Entry         | Google Sheets                 | Appends each activity entry to the current month's sheet | Split Out                      | -                              | "Appends timesheet entries: Date, Type, Description"                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Cron Trigger Node:**  
   - Type: Cron  
   - Schedule: Daily at 7 PM (local time)  
   - Purpose: Starts the workflow once per day.

2. **Add a Set Node ("Set Variables"):**  
   - Define:  
     - `today_date` as `{{$now.format('yyyy-MM-dd')}}`  
     - `github_handle` as your GitHub username (e.g., “luka-zivkovic”)  
     - `repositoriesToTrack` as an array of repository names to monitor (e.g., ["techPoweredGrowth", "tech-learn"])  
     - `myEmail` as your email address used in Gmail filtering  
   - Connect Cron node output to this node.

3. **Fetch Emails Node ("Get Today's Emails"):**  
   - Type: Gmail  
   - Operation: Get All  
   - Filters: Sender equals `{{ $json.myEmail }}`, Received after yesterday start of day (`{{$now.minus(1).startOf('day').toISO()}}`)  
   - Use Gmail OAuth2 credentials.  
   - Connect from Set Variables node.

4. **Aggregate Emails:**  
   - Type: Aggregate  
   - Aggregate all input items into array under field name `emails`.  
   - Connect from Get Today's Emails.

5. **Fetch Calendar Events Node ("Get Today's Calendar Events"):**  
   - Type: Google Calendar  
   - Operation: Get All  
   - TimeMin: Yesterday start of day (`{{$today.minus(1).startOf('day').toISO()}}`)  
   - TimeMax: Yesterday end of day (`{{$today.minus(1).endOf('day').toISO()}}`)  
   - Use Google Calendar OAuth2 credentials.  
   - Connect from Set Variables node.

6. **Aggregate Calendar Events:**  
   - Type: Aggregate  
   - Aggregate all input items into array under field name `calendarEvents`.  
   - Connect from Get Today's Calendar Events.

7. **Split Repositories for Commits ("Split Out1"):**  
   - Type: Split Out  
   - Field to split: `repositoriesToTrack`  
   - Connect from Set Variables node.

8. **Get Commits From GitHub:**  
   - Type: HTTP Request  
   - URL Template:  
     `https://api.github.com/repos/{{ $('Set Variables').item.json.github_handle }}/{{ $json.repositoriesToTrack }}/commits?since={{ $now.minus(1).startOf('day').toUTC().toISO() }}&until={{ $now.minus(1).endOf('day').toUTC().toISO() }}`  
   - Authentication: Use GitHub API credentials  
   - Connect from Split Out1 node.

9. **Filter Commits by Author ("If Authors Commit"):**  
   - Type: If  
   - Condition: `$json.author.login` equals `{{ $('Set Variables').item.json.github_handle }}`  
   - Connect from Get Commits From GitHub node.

10. **Aggregate Filtered Commits:**  
    - Type: Aggregate  
    - Aggregate into array under field name `commits`.  
    - Connect from If Authors Commit node (true branch).

11. **Split Repositories for PRs ("Split Out2"):**  
    - Type: Split Out  
    - Field to split: `repositoriesToTrack`  
    - Connect from Set Variables node.

12. **Get Pull Requests From GitHub:**  
    - Type: GitHub  
    - Operation: Get Pull Requests  
    - Owner: `{{ $('Set Variables').item.json.github_handle }}`  
    - Repository: `{{ $json.repositoriesToTrack }}`  
    - Connect from Split Out2 node.

13. **Filter PRs Created Today ("If it's created today"):**  
    - Type: If  
    - Condition:  
      - PR `created_at` date equals `today_date`  
      - PR user login equals `github_handle`  
    - Connect from Get GitHub PRs node.

14. **Filter PRs Closed Today ("If it's closed today"):**  
    - Type: If  
    - Condition: PR `closed_at` date equals `today_date`  
    - Connect from Get GitHub PRs node.

15. **Aggregate Filtered PRs:**  
    - Type: Aggregate  
    - Aggregate into array under field name `prs`.  
    - Connect both "created today" and "closed today" nodes (true branches) into this aggregate.

16. **Merge Aggregated Data:**  
    - Type: Merge  
    - Number of Inputs: 4 (emails, calendarEvents, commits, prs)  
    - Mode: Merge by index or aggregate all item data  
    - Connect from Aggregate, Aggregate1, Aggregate3, Aggregate2 respectively.

17. **Format All Data Node:**  
    - Type: Code (JavaScript)  
    - Logic: Extracts, filters, and formats incoming data into a single summary JSON object including:  
      - Confirmed calendar events with duration and attendees count  
      - Important emails (excludes newsletter/noreply) limited to 20  
      - Commits and PRs mapped to simple objects  
      - Uses date from Set Variables node  
    - Connect from Merge node.

18. **Generate Journal Summary (OpenAI GPT):**  
    - Type: OpenAI (LangChain)  
    - Model: GPT-4o-mini  
    - Input: JSON summary from previous node stringified  
    - Prompt: System message instructs GPT to generate a JSON array of objects with fields `type` and `description` (max 120 chars, no commas or newlines)  
    - Credentials: OpenAI API key configured  
    - Connect from Format All Data node.

19. **Split Out AI Results:**  
    - Type: Split Out  
    - Field to split: `message.content.events` or direct AI response array  
    - Connect from Generate Journal Summary.

20. **Create Monthly Sheet If Needed:**  
    - Type: Google Sheets  
    - Operation: Create sheet with title as current month name (`{{$now.format('MMMM')}}`)  
    - Credentials: Google Sheets OAuth2  
    - Connect from Set Variables node.

21. **If Sheet Created:**  
    - Type: If  
    - Condition: Check if response contains `title` field (sheet creation success)  
    - Connect from Create Sheet node.

22. **Initialize Sheet Headers:**  
    - Type: Set  
    - Assign empty values for columns: Date, Type, Description  
    - Connect from If node (true branch).

23. **Append Header Row:**  
    - Type: Google Sheets  
    - Operation: Append row with headers to sheet named after current month  
    - Connect from Init Sheet Headers node.

24. **Insert Entries Into Sheet:**  
    - Type: Google Sheets  
    - Operation: Append  
    - Sheet Name: Current month name  
    - Columns:  
      - Date: Current date in `yyyy-MM-dd` format  
      - Type: Activity type from AI output  
      - Description: AI-generated description  
    - Connect from Split Out node (final AI entries).

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                 | Context or Link                                                     |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| Workflow collects daily activities from email, calendar, and GitHub to create a timesheet automatically. Update variables for your GitHub username, email, and repositories to track.                                                                                          | Sticky Note: "Workflow Overview" node                             |
| Uses yesterday's date for calendar events and GitHub commits to accommodate timezone differences and ensure complete data for the previous day.                                                                                                                                  | Sticky Note: "Data Collection" node                               |
| Filters GitHub commits and PRs to include only those authored or acted upon by the configured user on the current day, avoiding irrelevant data.                                                                                                                              | Sticky Note: "GitHub Filtering" node                              |
| Automatically creates monthly sheets in Google Sheets and initializes headers on first run of the month to organize timesheet data neatly.                                                                                                                                     | Sticky Note: "Sheet Management" node                              |
| Uses OpenAI GPT-4o-mini model to convert raw data into concise, structured activity descriptions for easy timesheet entry.                                                                                                                                                      | Sticky Note: "AI Processing & Summary" node                       |
| Final output is appended to the current month's sheet with columns Date, Type, and Description, providing a clean, reviewable timesheet format.                                                                                                                                 | Sticky Note: "Final Output" node                                  |

---

*Disclaimer:* The workflow is created strictly with n8n automation respecting all content policies. It does not include any illegal or offensive content. All data handled is public and legal.