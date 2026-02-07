Auto-Post LinkedIn Updates from Spreadsheet Topics using GPT-4o

https://n8nworkflows.xyz/workflows/auto-post-linkedin-updates-from-spreadsheet-topics-using-gpt-4o-4344


# Auto-Post LinkedIn Updates from Spreadsheet Topics using GPT-4o

### 1. Workflow Overview

This workflow automates the creation and posting of LinkedIn updates based on topics listed in a Google Spreadsheet. It leverages GPT-4o to generate engaging LinkedIn posts, publishes them on the user's LinkedIn profile, and optionally posts them to LinkedIn groups. It also updates the spreadsheet status to track progress.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Triggered by new or updated rows in a Google Sheet containing post topics.
- **1.2 Status Validation and Limiting:** Filters posts marked as "Pending" and limits processing to handle one post at a time.
- **1.3 AI Post Generation:** Uses GPT-4o to generate a structured LinkedIn post from the given title.
- **1.4 Content Formatting:** Prepares the AI-generated post content for posting by escaping and formatting text.
- **1.5 LinkedIn User Data Retrieval:** Fetches LinkedIn user information (user ID) to set as the author of the post.
- **1.6 Posting to LinkedIn Profile:** Publishes the generated post to the LinkedIn user’s feed.
- **1.7 Getting LinkedIn Group IDs:** Reads LinkedIn group IDs from another sheet in the spreadsheet for group posting.
- **1.8 Posting to LinkedIn Groups:** Posts the same content to each LinkedIn group in batches, handling errors gracefully.
- **1.9 Status Update:** Updates the spreadsheet row’s status to "Posted" after successful posting.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block triggers the workflow whenever there is a new or updated row in the Google Spreadsheet under the "Linkedin Post Topic" sheet.

- **Nodes Involved:**  
  - `Linkedin-Post-Topic`

- **Node Details:**  
  - **Linkedin-Post-Topic**  
    - Type: Google Sheets Trigger  
    - Role: Watches the specified Google Sheet for changes every minute.  
    - Config: Monitors sheet with gid=0 in the spreadsheet identified by documentId `147NIoP4NAZtmXdjciHyKdOWqpPvJ9ifoS8P6HJxikY8`.  
    - Credentials: Google Sheets OAuth2 account.  
    - Edge Cases: Potential OAuth token expiration or sheet access permission issues may block triggering.

#### 1.2 Status Validation and Limiting

- **Overview:**  
  Filters incoming spreadsheet rows to process only those with a "Status" field set to "Pending" and limits processing to one item at a time to avoid flooding LinkedIn.

- **Nodes Involved:**  
  - `Validate-Status`  
  - `Limit`

- **Node Details:**  
  - **Validate-Status**  
    - Type: If Node  
    - Role: Checks if `Status` equals "Pending". Only passes through rows requiring posting.  
    - Key Expression: `{{$json.Status}} === "Pending"`  
    - Edge Cases: Rows with missing or malformed status may be skipped unintentionally.  
  - **Limit**  
    - Type: Limit Node  
    - Role: Restricts execution to the first item (one post at a time).  
    - Edge Cases: If multiple rows are pending, others wait until the first is processed.

#### 1.3 AI Post Generation

- **Overview:**  
  Generates a LinkedIn post based on the topic title using OpenAI’s GPT-4o model with a defined prompt and structured output schema.

- **Nodes Involved:**  
  - `OpenAI Chat Model`  
  - `Structured Output Parser`  
  - `Linedin-Post-Creator`

- **Node Details:**  
  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat  
    - Role: Sends prompt to GPT-4o to generate content.  
    - Model: GPT-4o  
    - Credentials: OpenAI API key  
    - Edge Cases: API quota limits, network timeouts, or malformed prompts can cause failure.  
  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses AI response as JSON with schema: `{ post: string }` to extract the post content cleanly.  
    - Edge Cases: If AI output doesn’t conform to schema, parsing fails.  
  - **Linedin-Post-Creator**  
    - Type: LangChain Agent  
    - Role: Contains prompt instructions for writing the LinkedIn post with formatting and engagement rules.  
    - Input: Title from spreadsheet row `Linkedin Post Title`.  
    - Output: Structured JSON with generated post content.  
    - Edge Cases: Prompt failures or inappropriate output formatting.

#### 1.4 Content Formatting

- **Overview:**  
  Cleans and formats the AI-generated post content to ensure it is JSON-safe and properly escaped for LinkedIn API consumption.

- **Nodes Involved:**  
  - `Format-Content`

- **Node Details:**  
  - **Format-Content**  
    - Type: Code Node (JavaScript)  
    - Role: Converts the `post` string into a JSON string to escape characters and prepares it for HTTP body.  
    - Key Code: `item.json.output.post = JSON.stringify(item.json.output.post);`  
    - Edge Cases: If input is undefined or malformed, code may throw errors.

#### 1.5 LinkedIn User Data Retrieval

- **Overview:**  
  Retrieves the LinkedIn user’s unique identifier (`sub`) required for authoring posts.

- **Nodes Involved:**  
  - `Linkedin-User-Detail`

- **Node Details:**  
  - **Linkedin-User-Detail**  
    - Type: HTTP Request  
    - Role: Calls LinkedIn API endpoint `/v2/userinfo` to get current user details.  
    - Auth: HTTP header authentication with stored credentials (likely OAuth2 token).  
    - Edge Cases: Token expiration, permission errors, or API downtime.

#### 1.6 Posting to LinkedIn Profile

- **Overview:**  
  Posts the generated content as a new update on the LinkedIn user's personal feed.

- **Nodes Involved:**  
  - `Linkedin-post`

- **Node Details:**  
  - **Linkedin-post**  
    - Type: HTTP Request  
    - Role: POST request to LinkedIn API `/v2/ugcPosts` to create a new post.  
    - Body: Contains author URN extracted from user info, post content, lifecycle state, and visibility settings.  
    - Auth: HTTP header authentication (same as user detail node).  
    - Edge Cases: API rate limits, malformed JSON, or authorization failures.

#### 1.7 Getting LinkedIn Group IDs

- **Overview:**  
  Fetches LinkedIn group IDs from a separate sheet in the same spreadsheet to enable posting to groups.

- **Nodes Involved:**  
  - `Get-Group-id`

- **Node Details:**  
  - **Get-Group-id**  
    - Type: Google Sheets  
    - Role: Reads rows from sheet with gid=1240468053 containing group IDs.  
    - Credentials: Google Sheets OAuth2 account.  
    - Edge Cases: Sheet access errors or empty group list.

#### 1.8 Posting to LinkedIn Groups

- **Overview:**  
  Iterates over the list of LinkedIn groups and posts the same content to each group using batch splitting for controlled execution. Errors during posting are caught and do not stop the workflow.

- **Nodes Involved:**  
  - `Pick 1 by 1`  
  - `Post-Linkedin-Groups`

- **Node Details:**  
  - **Pick 1 by 1**  
    - Type: SplitInBatches  
    - Role: Processes group IDs one by one to avoid API overload.  
  - **Post-Linkedin-Groups**  
    - Type: HTTP Request  
    - Role: Posts to LinkedIn’s `/v2/ugcPosts` API with `containerEntity` set to group URN.  
    - Auth: Different HTTP header auth credentials than user post node (likely group posting token).  
    - On Error: Continues on errors, so individual group failures do not halt the flow.  
    - Edge Cases: Group permission errors, invalid group IDs, or rate limiting.

#### 1.9 Status Update

- **Overview:**  
  Updates the original spreadsheet row’s "Status" column from "Pending" to "Posted" to avoid reprocessing.

- **Nodes Involved:**  
  - `Update-Status`

- **Node Details:**  
  - **Update-Status**  
    - Type: Google Sheets  
    - Role: Updates the row with matching ID to set `Status` = "Posted".  
    - Matching Column: `ID` ensures correct row update.  
    - Credentials: Google Sheets OAuth2 account.  
    - Edge Cases: Concurrency issues if multiple workflows update simultaneously, API errors.

---

### 3. Summary Table

| Node Name             | Node Type                             | Functional Role                         | Input Node(s)           | Output Node(s)           | Sticky Note                         |
|-----------------------|-------------------------------------|---------------------------------------|------------------------|--------------------------|-----------------------------------|
| Linkedin-Post-Topic    | Google Sheets Trigger                | Trigger workflow on sheet row changes | —                      | Validate-Status           |                                   |
| Validate-Status       | If                                  | Filter rows where Status = "Pending"  | Linkedin-Post-Topic     | Limit                    |                                   |
| Limit                 | Limit                               | Limit processing to one post at a time| Validate-Status         | Linedin-Post-Creator      |                                   |
| OpenAI Chat Model      | LangChain OpenAI Chat               | Call GPT-4o model for post generation | —                      | Linedin-Post-Creator (AI) |                                   |
| Structured Output Parser| LangChain Structured Output Parser | Parse AI-generated post JSON          | OpenAI Chat Model       | Linedin-Post-Creator (Parser) |                                   |
| Linedin-Post-Creator   | LangChain Agent                    | Generate LinkedIn post content        | Limit, OpenAI Chat Model| Format-Content            |                                   |
| Format-Content         | Code                               | Escape and format post content        | Linedin-Post-Creator    | Linkedin-User-Detail      |                                   |
| Linkedin-User-Detail   | HTTP Request                       | Retrieve LinkedIn user ID             | Format-Content          | Linkedin-post             |                                   |
| Linkedin-post          | HTTP Request                       | Publish post to LinkedIn profile      | Linkedin-User-Detail    | Get-Group-id              |                                   |
| Get-Group-id           | Google Sheets                      | Retrieve LinkedIn group IDs           | Linkedin-post           | Pick 1 by 1               |                                   |
| Pick 1 by 1            | SplitInBatches                    | Process group IDs one by one           | Get-Group-id            | Update-Status, Post-Linkedin-Groups |                         |
| Post-Linkedin-Groups   | HTTP Request                      | Post content to LinkedIn groups       | Pick 1 by 1             | Pick 1 by 1 (loop)        | Continues workflow on error       |
| Update-Status          | Google Sheets                     | Update spreadsheet status to "Posted" | Pick 1 by 1             | —                         |                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node**  
   - Name: `Linkedin-Post-Topic`  
   - Type: Google Sheets Trigger  
   - Configure to watch Spreadsheet ID `147NIoP4NAZtmXdjciHyKdOWqpPvJ9ifoS8P6HJxikY8`, Sheet with gid=0.  
   - Poll interval: every minute.  
   - Use Google Sheets OAuth2 credentials.  

2. **Add If Node to Validate Status**  
   - Name: `Validate-Status`  
   - Condition: `{{$json.Status}} === "Pending"`  
   - Connect `Linkedin-Post-Topic` output to this node input.

3. **Add Limit Node**  
   - Name: `Limit`  
   - Limit count: 1 (default)  
   - Connect `Validate-Status` true output to `Limit`.

4. **Add OpenAI Chat Model Node**  
   - Name: `OpenAI Chat Model`  
   - Type: LangChain OpenAI Chat  
   - Model: GPT-4o  
   - Credentials: OpenAI API key  
   - Connect no input (standalone for now).

5. **Add Structured Output Parser Node**  
   - Name: `Structured Output Parser`  
   - Schema: JSON manual schema with one property: `post` (string).  
   - Connect OpenAI Chat Model’s AI output to this node’s AI input.

6. **Add LangChain Agent Node**  
   - Name: `Linedin-Post-Creator`  
   - Type: LangChain Agent  
   - Prompt:  
     ```
     You are a LinkedIn post writer. You will be given a title and your task is to create an engaging LinkedIn post based on that title.

     Your post should:

     Begin with a compelling hook related to the title

     Include 3-4 paragraphs of informative content

     End with a question to encourage engagement

     Include 4-6 relevant hashtags

     Use appropriate emojis in between

     Important formatting requirements:

     Format all paragraphs with proper newline characters (\n\n) between them

     Ensure the text is properly escaped for JSON

     Do not use double quote (") in response or any special character

     Do not put asterisk

     Keep the overall length appropriate for LinkedIn (under 3000 characters)

     Now, create a LinkedIn post based on the following title:

     {{ $('Linkedin-Post-Topic').item.json['Linkedin Post Title'] }}
     ```
   - Connect `Limit` output to this node.  
   - Set AI language model input from `OpenAI Chat Model`.  
   - Set AI output parser from `Structured Output Parser`.

7. **Add Code Node to Format Content**  
   - Name: `Format-Content`  
   - JavaScript code:  
     ```js
     const items = $input.all();
     const updatedItems = items.map((item) => {
       item.json.output.post = JSON.stringify(item.json.output.post);
       return item;
     });
     return updatedItems;
     ```  
   - Connect `Linedin-Post-Creator` output to this node.

8. **Add HTTP Request Node to Retrieve LinkedIn User Info**  
   - Name: `Linkedin-User-Detail`  
   - Method: GET  
   - URL: `https://api.linkedin.com/v2/userinfo`  
   - Authentication: HTTP Header Auth with LinkedIn OAuth2 token.  
   - Connect `Format-Content` output to this node.

9. **Add HTTP Request Node to Post on LinkedIn Profile**  
   - Name: `Linkedin-post`  
   - Method: POST  
   - URL: `https://api.linkedin.com/v2/ugcPosts`  
   - Body Type: JSON  
   - JSON Body:  
     ```json
     {
       "author": "urn:li:person:{{ $('Linkedin-User-Detail').item.json.sub }}",
       "lifecycleState": "PUBLISHED",
       "specificContent": {
         "com.linkedin.ugc.ShareContent": {
           "shareCommentary": {
             "text": {{ $('Format-Content').item.json.output.post }}
           },
           "shareMediaCategory": "NONE"
         }
       },
       "visibility": {
         "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
       }
     }
     ```  
   - Authentication: same HTTP Header Auth as user detail.  
   - Connect `Linkedin-User-Detail` output to this node.

10. **Add Google Sheets Node to Get Group IDs**  
    - Name: `Get-Group-id`  
    - Operation: Read rows  
    - Spreadsheet ID: same as above  
    - Sheet gid: 1240468053 (Groups sheet)  
    - Authentication: Google Sheets OAuth2  
    - Connect `Linkedin-post` output to this node.

11. **Add SplitInBatches Node**  
    - Name: `Pick 1 by 1`  
    - Batch Size: 1  
    - Connect `Get-Group-id` output to this node.

12. **Add HTTP Request Node to Post to LinkedIn Groups**  
    - Name: `Post-Linkedin-Groups`  
    - Method: POST  
    - URL: `https://api.linkedin.com/v2/ugcPosts`  
    - Body Type: JSON  
    - JSON Body:  
      ```json
      {
        "author": "urn:li:person:{{ $('Linkedin-User-Detail').item.json.sub }}",
        "containerEntity": "urn:li:group:{{ $json.GroupIds }}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
          "com.linkedin.ugc.ShareContent": {
            "shareCommentary": {
              "text": {{ $('Format-Content').item.json.output.post }}
            },
            "shareMediaCategory": "NONE"
          }
        },
        "visibility": {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
      }
      ```  
    - Authentication: HTTP Header Auth with LinkedIn group posting token.  
    - On Error: Continue Workflow  
    - Connect `Pick 1 by 1` output to this node.

13. **Add Google Sheets Node to Update Status**  
    - Name: `Update-Status`  
    - Operation: Update row  
    - Spreadsheet ID & Sheet: same as step 1  
    - Matching Column: `ID` (from `Limit` node’s item)  
    - Set column `Status` to "Posted"  
    - Authentication: Google Sheets OAuth2  
    - Connect `Pick 1 by 1` output (second output) to this node.

14. **Connect Remaining Nodes**  
    - Connect `Limit` → `Linedin-Post-Creator`  
    - Connect `Linedin-Post-Creator` → `Format-Content`  
    - Connect `Format-Content` → `Linkedin-User-Detail`  
    - Connect `Linkedin-User-Detail` → `Linkedin-post`  
    - Connect `Linkedin-post` → `Get-Group-id`  
    - Connect `Get-Group-id` → `Pick 1 by 1`  
    - Connect `Pick 1 by 1` → `Update-Status` (main output 1)  
    - Connect `Pick 1 by 1` → `Post-Linkedin-Groups` (main output 2)  
    - Connect `Post-Linkedin-Groups` → `Pick 1 by 1` (loop for next batch)

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow uses GPT-4o via LangChain integration in n8n to create advanced AI-generated LinkedIn posts.            | n8n LangChain nodes documentation                                                                  |
| Google Sheets document URL: https://docs.google.com/spreadsheets/d/147NIoP4NAZtmXdjciHyKdOWqpPvJ9ifoS8P6HJxikY8 | Spreadsheet contains both post topics and group IDs sheets.                                        |
| LinkedIn API requires OAuth2 with appropriate scopes for posting and user info retrieval.                        | LinkedIn Developer documentation: https://docs.microsoft.com/en-us/linkedin/                       |
| Posts include hashtags and emojis as per prompt instructions to increase engagement.                             | Prompt embedded in Linedin-Post-Creator node                                                      |
| Error handling on group posting allows workflow to continue even if a post to one group fails.                   | Ensures robust batch processing without halting workflow                                          |

---

This structured reference document covers the complete logic, step-by-step node functions, and reproduction instructions needed to understand, modify, or recreate the LinkedIn auto-posting workflow using GPT-4o and Google Sheets integration.