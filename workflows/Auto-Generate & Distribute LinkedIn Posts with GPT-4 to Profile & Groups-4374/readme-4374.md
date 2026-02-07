Auto-Generate & Distribute LinkedIn Posts with GPT-4 to Profile & Groups

https://n8nworkflows.xyz/workflows/auto-generate---distribute-linkedin-posts-with-gpt-4-to-profile---groups-4374


# Auto-Generate & Distribute LinkedIn Posts with GPT-4 to Profile & Groups

### 1. Workflow Overview

This n8n workflow automates the generation and distribution of LinkedIn posts using GPT-4 AI, targeting personal LinkedIn profiles and multiple LinkedIn groups. It is designed for content creators, marketers, and thought leaders who want to scale and maintain consistent LinkedIn engagement.

**Use Cases:**  
- Automatically generate engaging LinkedIn posts from titles stored in Google Sheets  
- Post generated content to a LinkedIn user’s profile and distribute it across multiple LinkedIn groups  
- Track post status and update it in the Google Sheets to avoid duplication or re-posting

**Logical Blocks:**

- **1.1 Input Reception:** Google Sheets Trigger monitors a spreadsheet for new post titles marked as "Pending."
- **1.2 Post Status Validation:** Checks if the post status is "Pending" before processing.
- **1.3 Content Generation:** Uses OpenAI GPT-4 via a Langchain agent to generate structured LinkedIn post content based on the title.
- **1.4 Content Formatting:** Processes and formats AI-generated content into JSON-safe strings.
- **1.5 LinkedIn Profile Posting:** Retrieves LinkedIn user details and posts the generated content to the user’s profile.
- **1.6 LinkedIn Group Posting:** Fetches LinkedIn group IDs from Google Sheets and posts the content sequentially to each group.
- **1.7 Post Status Update:** Marks the post as "Posted" in the Google Sheets to prevent reprocessing.
- **1.8 Workflow Control:** Limits processed posts per trigger and manages batch processing for group posts.
- **1.9 Documentation & Instructions:** A sticky note summarizing the workflow purpose, setup, and usage.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** Monitors a Google Sheets document for new LinkedIn post titles with status "Pending," triggering the workflow every minute.
- **Nodes Involved:** `Linkedin-Post-Topic`
- **Node Details:**  
  - **Type:** Google Sheets Trigger  
  - **Config:** Polls Sheet1 (`gid=0`) of a specific Google Sheets document every minute to detect new or updated rows.  
  - **Key expressions:** Triggers on any change but filtered downstream for "Pending" status.  
  - **Connections:** Output connects to `Validate-Status` node.  
  - **Failure modes:** Possible API rate limits or authentication errors on Google Sheets OAuth2.  
  - **Credentials:** Google Sheets OAuth2.

#### 1.2 Post Status Validation

- **Overview:** Filters incoming rows to process only those with Status exactly equal to "Pending."
- **Nodes Involved:** `Validate-Status`
- **Node Details:**  
  - **Type:** If node  
  - **Config:** Condition checks if `$json.Status == "Pending"` with strict case sensitivity and type validation.  
  - **Connections:** True branch connects to `Limit`; False branch discards the item.  
  - **Failure modes:** Expression evaluation errors if `Status` field missing.  
  - **Version:** 2.2.

#### 1.3 Content Generation

- **Overview:** Generates a high-quality LinkedIn post text using GPT-4 based on the post title.
- **Nodes Involved:** `Limit`, `Linedin-Post-Creator`, `OpenAI Chat Model`, `Structured Output Parser`
- **Node Details:**  
  - **Limit:**  
    - **Type:** Limit node to control batch size (default unspecified, likely 1)  
    - **Role:** Ensures only a limited number of posts are processed per trigger for rate control.  
    - **Connections:** Output feeds into `Linedin-Post-Creator`.  
  - **Linedin-Post-Creator:**  
    - **Type:** Langchain AI Agent  
    - **Config:** Custom prompt instructing the AI to create an engaging LinkedIn post with hooks, paragraphs, questions, hashtags (4-6), emojis, no double quotes, and JSON-safe formatting, based on the title from Google Sheets.  
    - **Key expression:** Uses `{{ $('Linkedin-Post-Topic').item.json['Linkedin Post Title'] }}` to pass the title.  
    - **Connections:** Uses the `OpenAI Chat Model` as language model and `Structured Output Parser` as output parser.  
    - **Failure modes:** Potential API call failures or malformed AI output.  
  - **OpenAI Chat Model:**  
    - **Type:** Langchain OpenAI Chat Model  
    - **Config:** Uses GPT-4 (model id `gpt-4o`) via OpenAI API credentials.  
    - **Failure modes:** OpenAI API limits, authentication errors, or timeouts.  
  - **Structured Output Parser:**  
    - **Type:** Langchain Structured Output Parser  
    - **Config:** Parses AI output according to a JSON schema expecting an object with a `post` string property.  
    - **Failure modes:** Parsing errors if AI output does not conform to schema.

#### 1.4 Content Formatting

- **Overview:** Converts the AI-generated post text into a JSON-safe string for LinkedIn API consumption.
- **Nodes Involved:** `Format-Content`
- **Node Details:**  
  - **Type:** Code node (JavaScript)  
  - **Config:** Iterates over all input items, stringifies the `post` field inside the `output` object to ensure proper JSON encoding.  
  - **Connections:** Output connects to `Linkedin-User-Detail`.  
  - **Failure modes:** Runtime JavaScript errors if expected JSON structure missing.

#### 1.5 LinkedIn Profile Posting

- **Overview:** Retrieves LinkedIn user info needed for author identification and posts the AI-generated content to the user's LinkedIn profile.
- **Nodes Involved:** `Linkedin-User-Detail`, `Linkedin-post`
- **Node Details:**  
  - **Linkedin-User-Detail:**  
    - **Type:** HTTP Request  
    - **Config:** GET request to `https://api.linkedin.com/v2/userinfo` with OAuth2 HTTP header authentication. Used to obtain user's LinkedIn URN (`sub`).  
    - **Failure modes:** Authentication errors, API rate limits.  
  - **Linkedin-post:**  
    - **Type:** HTTP Request  
    - **Config:** POST request to `https://api.linkedin.com/v2/ugcPosts` to create a user post. Uses user URN from `Linkedin-User-Detail` and formatted post content from `Format-Content`. Posts are public with no media attached.  
    - **Failure modes:** API errors, rate limits, invalid data formatting.

#### 1.6 LinkedIn Group Posting

- **Overview:** Retrieves LinkedIn group IDs from Google Sheets and posts the content sequentially to each specified group.
- **Nodes Involved:** `Get-Group-id`, `Pick 1 by 1`, `Post-Linkedin-Groups`
- **Node Details:**  
  - **Get-Group-id:**  
    - **Type:** Google Sheets node (read)  
    - **Config:** Reads the "Groups" sheet (`gid=1240468053`) from the same Google Sheets document. Contains LinkedIn Group IDs where posts should be distributed.  
    - **Failure modes:** API errors, credential issues.  
  - **Pick 1 by 1:**  
    - **Type:** SplitInBatches  
    - **Config:** Processes group IDs one by one to avoid API flooding and manage posting sequentially.  
  - **Post-Linkedin-Groups:**  
    - **Type:** HTTP Request  
    - **Config:** POST to `https://api.linkedin.com/v2/ugcPosts` with author URN and `containerEntity` set to the group URN (`urn:li:group:<GroupId>`). Uses same formatted post content.  
    - **On Error:** Continues workflow even if one group post fails, preventing total failure.  
    - **Failure modes:** Posting permission issues, group posting restrictions, API limits.

#### 1.7 Post Status Update

- **Overview:** Updates the status of the processed post in Google Sheets from "Pending" to "Posted" to prevent reprocessing.
- **Nodes Involved:** `Update-Status`
- **Node Details:**  
  - **Type:** Google Sheets node (update)  
  - **Config:** Updates the row in the main posts sheet (`gid=0`) matching the post ID with `"Status":"Posted"`.  
  - **Failure modes:** Mismatched IDs, update conflicts, credential errors.

#### 1.8 Workflow Control

- **Overview:** Controls processing limits and batch handling.
- **Nodes Involved:** `Limit`, `Pick 1 by 1`
- **Node Details:**  
  - **Limit:** Controls the number of posts processed per trigger cycle.  
  - **Pick 1 by 1:** Ensures group posts are handled sequentially.

#### 1.9 Documentation & Instructions

- **Overview:** Provides detailed sticky note documentation embedded inside the workflow describing purpose, setup, and usage.
- **Nodes Involved:** `Sticky Note`
- **Node Details:**  
  - **Type:** Sticky Note  
  - **Content:** Comprehensive explanation of workflow purpose, node roles, setup instructions, credential requirements, Google Sheets structure, and pro tips.

---

### 3. Summary Table

| Node Name             | Node Type                           | Functional Role                             | Input Node(s)             | Output Node(s)              | Sticky Note                                                                                                 |
|-----------------------|-----------------------------------|---------------------------------------------|---------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------|
| Linkedin-Post-Topic    | Google Sheets Trigger              | Triggers on new LinkedIn post titles        | —                         | Validate-Status             | See sticky note for overall project description                                                             |
| Validate-Status       | If                                | Filters posts with Status = "Pending"       | Linkedin-Post-Topic        | Limit                      |                                                                                                             |
| Limit                 | Limit                             | Limits number of posts processed per trigger| Validate-Status            | Linedin-Post-Creator        |                                                                                                             |
| OpenAI Chat Model     | Langchain OpenAI Chat Model        | Provides GPT-4 AI model for content gen     | Linedin-Post-Creator (AI LM)| Linedin-Post-Creator (AI LM)|                                                                                                             |
| Structured Output Parser | Langchain Structured Output Parser | Parses AI output to structured JSON         | Linedin-Post-Creator (AI Output Parser) | Linedin-Post-Creator |                                                                                                             |
| Linedin-Post-Creator  | Langchain AI Agent                 | Generates LinkedIn post content from title  | Limit                      | Format-Content              |                                                                                                             |
| Format-Content        | Code (JavaScript)                  | Formats AI-generated content for LinkedIn   | Linedin-Post-Creator       | Linkedin-User-Detail        |                                                                                                             |
| Linkedin-User-Detail  | HTTP Request                      | Retrieves LinkedIn user URN                   | Format-Content             | Linkedin-post               |                                                                                                             |
| Linkedin-post         | HTTP Request                      | Posts content to LinkedIn profile             | Linkedin-User-Detail       | Get-Group-id                |                                                                                                             |
| Get-Group-id          | Google Sheets                     | Retrieves LinkedIn group IDs                   | Linkedin-post              | Pick 1 by 1                |                                                                                                             |
| Pick 1 by 1           | SplitInBatches                   | Processes group IDs sequentially               | Get-Group-id               | Update-Status, Post-Linkedin-Groups |                                                                                                             |
| Post-Linkedin-Groups  | HTTP Request                      | Posts content to LinkedIn groups               | Pick 1 by 1                | Pick 1 by 1                |                                                                                                             |
| Update-Status         | Google Sheets                    | Updates post status to "Posted"                 | Pick 1 by 1                | —                          |                                                                                                             |
| Sticky Note           | Sticky Note                      | Documentation and workflow instructions        | —                         | —                          | LinkedIn AI Agent: Auto-Post Creator & Distributor with detailed setup and usage instructions (see below)  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Document:**  
   - Sheet 1: Columns `ID`, `Linkedin Post Title`, `Status` (set "Pending" for new posts).  
   - Sheet 2: Column `GroupIds` with LinkedIn group IDs for posting.

2. **Create Google Sheets Trigger Node (`Linkedin-Post-Topic`):**  
   - Document ID: Your Google Sheets ID.  
   - Sheet Name: `gid=0` (Sheet1).  
   - Poll every minute.

3. **Add If Node (`Validate-Status`):**  
   - Set condition: `$json.Status` equals `"Pending"` (case sensitive).  
   - Connect trigger output to this node.

4. **Add Limit Node (`Limit`):**  
   - Set limit to desired number of posts to process per run (e.g., 1).  
   - Connect `Validate-Status` true output to `Limit`.

5. **Set up Langchain OpenAI Chat Model Node (`OpenAI Chat Model`):**  
   - Model: GPT-4 (`gpt-4o`).  
   - Credentials: OpenAI API key.

6. **Add Langchain Structured Output Parser Node (`Structured Output Parser`):**  
   - Schema Type: Manual JSON.  
   - Input Schema: An object with a `post` string property.

7. **Add Langchain AI Agent Node (`Linedin-Post-Creator`):**  
   - Prompt: Instruct AI to write engaging LinkedIn post with hooks, paragraphs, questions, hashtags (4-6), emojis, and JSON-safe formatting.  
   - Use input expression to pass title: `{{ $('Linkedin-Post-Topic').item.json['Linkedin Post Title'] }}`  
   - Set `OpenAI Chat Model` as language model node.  
   - Set `Structured Output Parser` as output parser node.  
   - Connect `Limit` output to `Linedin-Post-Creator`.

8. **Add Code Node (`Format-Content`):**  
   - JavaScript code to stringify the AI-generated post text to ensure JSON compatibility:  
```javascript
const items = $input.all();
const updatedItems = items.map(item => {
  item.json.output.post = JSON.stringify(item.json.output.post);
  return item;
});
return updatedItems;
```  
   - Connect `Linedin-Post-Creator` output to `Format-Content`.

9. **Add HTTP Request Node (`Linkedin-User-Detail`):**  
   - Method: GET.  
   - URL: `https://api.linkedin.com/v2/userinfo`.  
   - Authentication: OAuth2 HTTP Header with LinkedIn OAuth credentials.  
   - Connect `Format-Content` output to this node.

10. **Add HTTP Request Node (`Linkedin-post`):**  
    - Method: POST.  
    - URL: `https://api.linkedin.com/v2/ugcPosts`.  
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
    - Authentication: Same LinkedIn OAuth2.  
    - Connect `Linkedin-User-Detail` output to this node.

11. **Add Google Sheets Node (`Get-Group-id`):**  
    - Operation: Read.  
    - Document ID: Same Google Sheets.  
    - Sheet Name: `gid=1240468053` (Groups sheet).  
    - Credentials: Google Sheets OAuth2.  
    - Connect `Linkedin-post` output to this node.

12. **Add SplitInBatches Node (`Pick 1 by 1`):**  
    - Batch size: 1.  
    - Connect `Get-Group-id` output to this node.

13. **Add HTTP Request Node (`Post-Linkedin-Groups`):**  
    - Method: POST.  
    - URL: `https://api.linkedin.com/v2/ugcPosts`.  
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
    - Authentication: LinkedIn OAuth2.  
    - On error: Continue workflow (do not stop).  
    - Connect `Pick 1 by 1` output to this node.

14. **Add Google Sheets Node (`Update-Status`):**  
    - Operation: Update.  
    - Document ID and Sheet Name: Same as `Linkedin-Post-Topic` trigger.  
    - Matching column: `ID`.  
    - Set `Status` to `"Posted"` for matching row.  
    - Connect `Pick 1 by 1` output to this node (parallel output from batch processing).

15. **Add Sticky Note Node (`Sticky Note`):**  
    - Add comprehensive documentation content as specified in the original workflow.  
    - No connections needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                | Context or Link                                                                                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| LinkedIn AI Agent: Auto-Post Creator & Distributor. Automatically generate engaging LinkedIn posts from Google Sheets topics and publish them to your profile and multiple LinkedIn groups. Setup requires Google Sheets OAuth2, OpenAI API key, and LinkedIn OAuth2 credentials. The Google Sheets must have two sheets: one for main posts (with ID, Title, Status) and one for Group IDs. Pro tips and detailed instructions included in sticky note. | Workflow embedded sticky note inside n8n workflow JSON.                                                                                                                 |
| For LinkedIn group IDs, you must collect the IDs manually from groups you belong to and have posting permissions for.                                                                                                                                                                                                                                                                                         | LinkedIn API documentation and group management best practices.                                                                                                         |
| AI-generated posts follow strict formatting: no double quotes, no asterisks, JSON-safe strings, newline paragraph breaks, under 3000 characters, emoji and hashtag rich, engagement-focused question at the end.                                                                                                                                                                                                 | Prompt text inside `Linedin-Post-Creator` node.                                                                                                                         |
| LinkedIn API endpoints used: `https://api.linkedin.com/v2/userinfo` for user details, and `https://api.linkedin.com/v2/ugcPosts` for posting content. OAuth2 authentication is mandatory.                                                                                                                                                                                                                     | LinkedIn Developer API docs: https://docs.microsoft.com/en-us/linkedin/                                                                                                  |
| To avoid spamming or API rate limits, the workflow processes posts in limited batches and posts to groups sequentially with error handling to continue on failures.                                                                                                                                                                                                                                          | Workflow node `Limit` and `Pick 1 by 1` plus HTTP Request error continuation configuration.                                                                              |

---

**Disclaimer:** The provided workflow is an automated n8n integration adhering strictly to content policies. It contains no illegal or offensive content. All data handled is legal and public.