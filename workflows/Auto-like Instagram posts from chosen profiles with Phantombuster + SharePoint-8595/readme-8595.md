Auto-like Instagram posts from chosen profiles with Phantombuster + SharePoint

https://n8nworkflows.xyz/workflows/auto-like-instagram-posts-from-chosen-profiles-with-phantombuster---sharepoint-8595


# Auto-like Instagram posts from chosen profiles with Phantombuster + SharePoint

### 1. Workflow Overview

This workflow automates the process of liking Instagram posts from selected profiles using Phantombuster agents, integrating data storage and management via Microsoft SharePoint. It is designed to periodically scrape posts from given Instagram profiles, filter out posts already liked, and then trigger an auto-like agent to like new posts. The workflow includes mechanisms for session cookie management, duplicate checking, CSV file handling, and rate limiting to control the volume of likes per day.

Logical blocks in the workflow:

- **1.1 Start & Scheduling**: Initiates execution every two hours to control the rate of operations.
- **1.2 Session Cookie Management**: Downloads and selects a session cookie based on the current time slice to maintain authentication.
- **1.3 Profile Scraping**: Uses Phantombuster’s Profile Extractor agent to scrape recent posts from Instagram profiles listed in a SharePoint CSV.
- **1.4 Post Processing & Duplicate Filtering**: Processes scraped posts, selects a random post, checks against previously liked posts stored in SharePoint, and filters duplicates.
- **1.5 CSV Creation and Upload**: Creates a one-row CSV for the selected post URL and uploads it to SharePoint for consumption by the auto-liking agent.
- **1.6 Auto-liking Execution**: Launches a Phantombuster auto-liking agent to like the selected post using the uploaded CSV.
- **1.7 Rate Limiting & Pauses**: Uses Wait nodes to stagger execution and keep likes within desired limits.

---

### 2. Block-by-Block Analysis

#### 1.1 Start & Scheduling

- **Overview:**  
  This block triggers the workflow on a schedule every two hours at 15 minutes past the hour to control the frequency of liking activities.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Configuration: Runs every 2 hours at minute 15 (e.g., 00:15, 02:15, 04:15, etc.)  
    - Input: None (trigger node)  
    - Output: Triggers downstream nodes  
    - Edge Cases: None significant, but if the server is down or paused, scheduled runs will be missed.

---

#### 1.2 Session Cookie Management

- **Overview:**  
  Downloads a list of Instagram session cookies from SharePoint, extracts them, and selects one based on the current Berlin time to be used for authenticated scraping and liking.

- **Nodes Involved:**  
  - Get Available Session Cookies  
  - Extract Cookies  
  - OpenAI Chat Model1  
  - Select Cookie  
  - Set ENV Variables

- **Node Details:**

  - **Get Available Session Cookies**  
    - Type: Microsoft SharePoint (Download)  
    - Role: Downloads the file `instagram_session_cookies.txt` containing session cookies  
    - Configuration: Uses OAuth2 credentials for SharePoint; targets specific file and folder  
    - Potential Failures: Auth errors, file not found, network issues

  - **Extract Cookies**  
    - Type: Extract From File (Text)  
    - Role: Parses the downloaded text file to extract cookies as text data  
    - Input: File binary from previous node  
    - Output: Parsed text data as JSON  
    - Edge Cases: Empty or malformed file content

  - **OpenAI Chat Model1**  
    - Type: Langchain OpenAI Chat Model  
    - Role: Receives the cookie list and current time, processes selection logic via prompt-based AI to pick the correct cookie  
    - Configuration: Uses model chatgpt-4o-latest and an elaborate system prompt to select the cookie by time slices  
    - Credentials: OpenAI API  
    - Edge Cases: API quota, prompt failures, network errors

  - **Select Cookie**  
    - Type: Langchain Agent (Custom Agent)  
    - Role: Executes selection logic as defined by OpenAI Chat Model node output, returning only the selected cookie string  
    - Input: Text data from Extract Cookies combined with AI logic  
    - Output: JSON with `session_cookie` field only

  - **Set ENV Variables**  
    - Type: Set  
    - Role: Stores the selected session cookie in a workflow variable `ENV_SESSION_COOKIE` for use in downstream nodes  
    - Input: Output from Select Cookie  
    - Output: JSON containing the environment variable  
    - Edge Cases: If selection fails, variable might be empty or invalid

---

#### 1.3 Profile Scraping

- **Overview:**  
  Retrieves the Instagram profiles to scrape from a CSV file on SharePoint, fetches the profile extractor agent info, launches it with parameters including session cookie and profile list, then waits for completion.

- **Nodes Involved:**  
  - Get Profile Extractor Agent  
  - Get List of Accounts  
  - Launch Agent  
  - Wait

- **Node Details:**

  - **Get Profile Extractor Agent**  
    - Type: Phantombuster (Get Agent)  
    - Role: Retrieves metadata for the Instagram Profile Extractor agent (ID: 7569425938663423)  
    - Input: None  
    - Output: Agent info JSON  
    - Potential Failures: API auth errors, agent not found

  - **Get List of Accounts**  
    - Type: Microsoft SharePoint (Download CSV)  
    - Role: Downloads `instagram_profiles_to_scrape.csv` listing Instagram profiles to scrape  
    - Configuration: SharePoint OAuth2 credentials, target file and folder  
    - Edge Cases: Missing file, permission errors

  - **Launch Agent**  
    - Type: Phantombuster (Launch Agent)  
    - Role: Starts the Profile Extractor agent with arguments: number of posts per profile (20), filters (postUrl), spreadsheet URL from CSV, and session cookie  
    - Inputs: Agent ID from previous node, CSV URL from SharePoint, session cookie from ENV variables  
    - Edge Cases: Session cookie invalid, API errors, agent failure

  - **Wait**  
    - Type: Wait  
    - Role: Pauses workflow for 30 seconds to allow the agent to work  
    - Edge Cases: If agent takes longer, may need adjustment

---

#### 1.4 Post Processing & Duplicate Filtering

- **Overview:**  
  After scraping, this block downloads the CSV output from the agent, extracts posts, selects a random post, checks if this post was already liked by comparing with the SharePoint-stored list, and branches accordingly.

- **Nodes Involved:**  
  - Get Response  
  - Wait1  
  - Get Random Post  
  - Download file  
  - Extract from File  
  - Check if in List  
  - If  
  - Prepare Updated Data  
  - Convert to File  
  - Update file

- **Node Details:**

  - **Get Response**  
    - Type: Phantombuster (Get Output)  
    - Role: Retrieves the output data of the Profile Extractor agent run  
    - Input: Agent ID  
    - Edge Cases: Output not ready, API errors

  - **Wait1**  
    - Type: Wait  
    - Role: Waits 30 seconds after getting response before proceeding  
    - Edge Cases: Timing issues with data availability

  - **Get Random Post**  
    - Type: Code  
    - Role: Selects a random post URL from all scraped posts  
    - Logic: Throws error if no data, returns JSON with `postUrl` only  
    - Input: All scraped post data  
    - Output: One post object with `postUrl`  
    - Edge Cases: Empty data input

  - **Download file**  
    - Type: Microsoft SharePoint (Download)  
    - Role: Downloads `instagram_posts_already_liked.csv` which keeps track of posts liked so far  
    - Edge Cases: Missing file, auth errors

  - **Extract from File**  
    - Type: Extract From File (CSV)  
    - Role: Parses the downloaded CSV into JSON for checking  
    - Configuration: Header row expected true  
    - Edge Cases: Malformed CSV

  - **Check if in List**  
    - Type: Code  
    - Role: Checks if the randomly selected post URL is already in the liked posts list  
    - Logic: Normalizes URLs (trim, lowercase, remove trailing slash), compares all entries, sets `isDuplicate` flag  
    - Output: JSON with `isDuplicate` boolean  
    - Edge Cases: Non-string URLs, missing fields

  - **If**  
    - Type: If (Boolean Condition)  
    - Role: Branches workflow: if duplicate, waits and ends; if not, continues to update list and like post  
    - Condition: `isDuplicate` is true

  - **Prepare Updated Data**  
    - Type: Code  
    - Role: Appends new post URL to existing liked posts list, prepares data for saving  
    - Edge Cases: Empty existing lists

  - **Convert to File**  
    - Type: Convert To File  
    - Role: Converts updated JSON list back to CSV file format  
    - Edge Cases: Conversion failures

  - **Update file**  
    - Type: Microsoft SharePoint (Update)  
    - Role: Overwrites `instagram_posts_already_liked.csv` with updated CSV including the newly liked post  
    - Edge Cases: SharePoint errors, permission issues

---

#### 1.5 CSV Creation and Upload

- **Overview:**  
  Creates a CSV containing only the selected post URL and uploads it to SharePoint to be used as input for the auto-liking agent.

- **Nodes Involved:**  
  - Create CSV Binary  
  - Upload CSV  
  - Get Autoliking Agent  
  - Launch AL Agent  
  - Wait1

- **Node Details:**

  - **Create CSV Binary**  
    - Type: Code  
    - Role: Creates a one-row CSV file with the selected `postUrl`  
    - Logic: Cleans the URL string, escapes quotes, creates CSV buffer without header or BOM  
    - Output: Binary CSV data with filename `phantombuster_clean.csv`  
    - Edge Cases: Empty URL, encoding issues

  - **Upload CSV**  
    - Type: Microsoft SharePoint (Upload)  
    - Role: Uploads the one-row CSV as `instagram_posts_to_like.csv` to a dedicated SharePoint folder  
    - Edge Cases: Upload failures, auth errors

  - **Get Autoliking Agent**  
    - Type: Phantombuster (Get Agent)  
    - Role: Retrieves metadata for the Instagram Auto-liking agent (ID: 1308386990292658)  
    - Edge Cases: API errors

  - **Launch AL Agent**  
    - Type: Phantombuster (Launch Agent)  
    - Role: Starts the auto-liking agent with parameters: numberOfPostsPerLaunch=1, session cookie, spreadsheet URL from uploaded CSV  
    - Edge Cases: Invalid session cookie, API failures

  - **Wait1**  
    - Type: Wait (30 seconds)  
    - Role: Pauses to allow the auto-liking agent to process the post  
    - Edge Cases: Timing mismatches

---

#### 1.6 Rate Limiting & Pauses

- **Overview:**  
  Uses multiple Wait nodes to stagger executions, limiting the total likes per day to roughly 12.

- **Nodes Involved:**  
  - Wait (30 seconds)  
  - Wait1 (30 seconds)  
  - Wait2 (no duration specified, default immediate continuation)

- **Node Details:**

  - **Wait**  
    - Type: Wait  
    - Role: Delays 30 seconds after launching the profile extractor agent  
  - **Wait1**  
    - Type: Wait  
    - Role: Delays 30 seconds after launching the auto-liking agent  
  - **Wait2**  
    - Type: Wait  
    - Role: Used after duplicate check to either wait or proceed  
    - Edge Cases: If wait durations are too short, could cause rate limits or API throttling

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                                  | Input Node(s)                      | Output Node(s)                  | Sticky Note                                                                                                         |
|----------------------------|----------------------------------|-------------------------------------------------|----------------------------------|--------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger            | Schedule Trigger                  | Start workflow on 2-hour interval                | None                             | Get Available Session Cookies   | ### 5) Rate Limiting & Scheduling  \n• 2-hour cron + Wait nodes keep likes to ~12 per day.                         |
| Get Available Session Cookies | Microsoft SharePoint (Download) | Download session cookies file                     | Schedule Trigger                 | Extract Cookies                 |  |
| Extract Cookies             | Extract From File (Text)          | Extract raw cookie strings from file              | Get Available Session Cookies    | Select Cookie                  |  |
| OpenAI Chat Model1          | Langchain OpenAI Chat Model       | AI-based cookie selection logic                   | Select Cookie (via ai_languageModel) | Select Cookie               |  |
| Select Cookie              | Langchain Agent                   | Select session cookie based on time slice        | Extract Cookies                  | Set ENV Variables              | ### 1) Cookie & Hashtag Selection  \n• Downloads cookie list, picks one by time slice.                             |
| Set ENV Variables           | Set                              | Store selected session cookie for later use      | Select Cookie                   | Get Profile Extractor Agent     |  |
| Get Profile Extractor Agent | Phantombuster (Get Agent)         | Get Instagram profile extractor agent info       | Set ENV Variables               | Get List of Accounts            | ### 2) Scrape Instagram Posts  \n• Fetches 20 posts per profile listed in CSV.                                     |
| Get List of Accounts        | Microsoft SharePoint (Download)   | Download CSV of Instagram profiles to scrape     | Get Profile Extractor Agent      | Launch Agent                   |  |
| Launch Agent                | Phantombuster (Launch Agent)      | Launch profile extractor agent with parameters   | Get List of Accounts             | Wait                           |  |
| Wait                       | Wait                             | Wait 30 sec for agent processing                   | Launch Agent                    | HTTP Request                   | ### 8) Rate Limiting & Scheduling  \n• Wait nodes keep likes spaced out.                                           |
| HTTP Request               | HTTP Request                      | Get agent metadata                                 | Wait                           | HTTP Request1                  |  |
| HTTP Request1              | HTTP Request                      | Get filtered CSV URL                               | HTTP Request                   | Prepare Posts                  |  |
| Prepare Posts              | Code                             | Parse CSV lines into post objects                  | HTTP Request1                  | If Empty                      | ### 3) Duplicate Check  \n• Downloads liked posts CSV, filters duplicates.                                         |
| If Empty                   | If                               | Check if the scraped posts list is empty           | Prepare Posts                  | Wait2 (if empty), else Get Random Post |  |
| Wait2                      | Wait                             | Wait node for pacing                              | If Empty (true branch), If (false branch) | Get Random Post, Prepare Updated Data |  |
| Get Random Post            | Code                             | Select random post from scraped posts              | Wait2                         | Download file                 |  |
| Download file              | Microsoft SharePoint (Download)   | Download CSV of already liked posts                | Get Random Post               | Extract from File             |  |
| Extract from File          | Extract From File (CSV)            | Extract liked posts list from CSV                   | Download file                 | Check if in List              |  |
| Check if in List           | Code                             | Check if random post already liked                  | Extract from File             | If                           |  |
| If                        | If                               | Branch if duplicate post found                      | Check if in List              | Wait2 (if duplicate), Prepare Updated Data (if new) |  |
| Prepare Updated Data       | Code                             | Append new post URL to liked posts list             | If (false branch)             | Convert to File              |  |
| Convert to File            | Convert To File                   | Convert updated liked posts list to CSV             | Prepare Updated Data          | Update file                  |  |
| Update file                | Microsoft SharePoint (Update)      | Upload updated liked posts CSV                       | Convert to File               | Create CSV Binary            |  |
| Create CSV Binary          | Code                             | Create CSV with one post URL for auto-like          | Update file                  | Upload CSV                   | ### 4) CSV Upload & Auto-like  \n• Creates CSV with post URL, uploads, triggers auto-like.                      |
| Upload CSV                 | Microsoft SharePoint (Upload)      | Upload one-row CSV for autoliking agent             | Create CSV Binary             | Get Autoliking Agent          |  |
| Get Autoliking Agent       | Phantombuster (Get Agent)          | Get Instagram autoliking agent metadata             | Upload CSV                   | Launch AL Agent              |  |
| Launch AL Agent            | Phantombuster (Launch Agent)       | Launch autoliking agent with CSV and session cookie | Get Autoliking Agent          | Wait1                        |  |
| Wait1                      | Wait                             | Wait 30 seconds for auto-like agent to process     | Launch AL Agent              | Get Response                 |  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure: Interval every 2 hours, trigger at minute 15

2. **Download Session Cookies File**  
   - Add Microsoft SharePoint node (Download operation)  
   - Configure with SharePoint OAuth2 credentials  
   - Select site, folder, and file: `instagram_session_cookies.txt`

3. **Extract Cookies Text**  
   - Add Extract From File node (Text operation)  
   - Input: Output from session cookies download node

4. **Add OpenAI Chat Model Node**  
   - Use Langchain OpenAI Chat Model node  
   - Model: chatgpt-4o-latest  
   - Configure prompt to select cookie based on current Berlin hour and cookie list as per original logic  
   - Connect input from Extract Cookies node

5. **Add Langchain Agent Node (Select Cookie)**  
   - Receives output from OpenAI Chat Model node  
   - Outputs JSON with a single field `session_cookie`

6. **Set ENV Variables Node**  
   - Store selected session cookie in variable `ENV_SESSION_COOKIE`  
   - Input: Output of Select Cookie node

7. **Get Instagram Profile Extractor Agent Info**  
   - Add Phantombuster node (Get Agent)  
   - Agent ID: `7569425938663423`  
   - Use Phantombuster API credentials

8. **Download Instagram Profiles CSV**  
   - Microsoft SharePoint node (Download)  
   - File: `instagram_profiles_to_scrape.csv`  
   - Use same SharePoint OAuth2 credentials

9. **Launch Profile Extractor Agent**  
   - Phantombuster node (Launch Agent)  
   - Agent ID from previous node  
   - Arguments (as JSON):  
     ```json
     {
       "numberOfPostsPerProfile": 20,
       "filters": "postUrl",
       "spreadsheetUrl": "<downloadUrl from previous SharePoint node>",
       "sessionCookie": "{{ENV_SESSION_COOKIE}}"
     }
     ```
   - Use Phantombuster API credentials

10. **Wait Node**  
    - Wait 30 seconds after launching agent to allow processing

11. **HTTP Request Node to Get Agent Metadata**  
    - URL: `https://api.phantombuster.com/api/v2/agents/fetch?id=7569425938663423`  
    - Use Phantombuster API credentials

12. **HTTP Request Node to Get Filtered Posts CSV URL**  
    - URL constructed dynamically from previous HTTP response with S3 folder paths for filtered_result.csv  
    - Use Phantombuster API credentials

13. **Prepare Posts Node (Code)**  
    - Parse CSV lines into JSON objects containing `postUrl`

14. **If Empty Node**  
    - Check if scraped posts list is empty  
    - If true, proceed to Wait2 node (no posts to process)  
    - Else continue

15. **Wait2 Node**  
    - Used for pacing; no duration or configurable as needed

16. **Get Random Post Node (Code)**  
    - Select one random post URL from scraped posts

17. **Download Already Liked Posts CSV from SharePoint**  
    - Microsoft SharePoint node (Download)  
    - File: `instagram_posts_already_liked.csv`

18. **Extract from File Node**  
    - Extract CSV data into JSON

19. **Check if in List Node (Code)**  
    - Normalize URLs and check if selected post URL already exists in liked posts list  
    - Output: Boolean `isDuplicate`

20. **If Node**  
    - Condition: If `isDuplicate` is true  
    - True branch: Wait2 node (delay to avoid reprocessing)  
    - False branch: Continue to update liked posts list

21. **Prepare Updated Data Node (Code)**  
    - Append new post URL to existing liked posts list

22. **Convert to File Node**  
    - Convert JSON liked posts list back to CSV

23. **Update File Node (SharePoint Update)**  
    - Upload updated `instagram_posts_already_liked.csv` with new data

24. **Create CSV Binary Node (Code)**  
    - Create one-row CSV containing only the selected post URL for autolike input

25. **Upload CSV Node (SharePoint Upload)**  
    - Upload CSV as `instagram_posts_to_like.csv` to SharePoint folder

26. **Get Autoliking Agent Node (Phantombuster Get Agent)**  
    - Agent ID: `1308386990292658`

27. **Launch AL Agent Node (Phantombuster Launch Agent)**  
    - Launch auto-liking agent with parameters:  
      ```json
      {
        "numberOfPostsPerLaunch": 1,
        "sessionCookie": "{{ENV_SESSION_COOKIE}}",
        "spreadsheetUrl": "<sharepoint download url of uploaded CSV>"
      }
      ```

28. **Wait1 Node**  
    - Wait 30 seconds for auto-like agent to process

29. **Workflow Ends or Loops**

**Credentials required:**  
- Microsoft SharePoint OAuth2 (for file download/upload)  
- Phantombuster API (for agent control)  
- OpenAI API (for cookie selection AI)

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                   | Context or Link                                                                                                                                              |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| The workflow uses Phantombuster agents to extract Instagram posts and auto-like them, integrating SharePoint as file storage for session cookies and tracking. | Workflow name: "Instagram Auto Liking (Profile Post Extractor) - Creators Hub"                                                                               |
| Session cookies are rotated based on current Berlin time to distribute load and avoid bans.                                                                    | Cookie selection logic implemented using OpenAI prompt in Langchain nodes.                                                                                   |
| Rate limiting is implemented via 2-hour schedule and multiple Wait nodes to keep likes at about 12 per day.                                                    | Modify cron or wait durations to adjust like frequency.                                                                                                     |
| SharePoint files used: `instagram_session_cookies.txt`, `instagram_profiles_to_scrape.csv`, `instagram_posts_already_liked.csv`, and upload files for agents.   | SharePoint folder and site IDs are specific and must be configured per user environment.                                                                     |
| Phantombuster agent IDs: 7569425938663423 (Profile Extractor), 1308386990292658 (Auto-liking agent)                                                            | These can be replaced with custom or updated agents if needed.                                                                                              |
| Sticky notes in the workflow provide detailed explanations of each functional block and usage tips.                                                           | Visible in the original workflow canvas for user reference.                                                                                                 |

---

This document fully describes the workflow’s structure, logic, node configurations, operational flow, and instructions for manual recreation, ensuring clear understanding for modifications or automation agent integration.