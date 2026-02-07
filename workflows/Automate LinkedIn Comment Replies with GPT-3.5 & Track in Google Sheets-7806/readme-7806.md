Automate LinkedIn Comment Replies with GPT-3.5 & Track in Google Sheets

https://n8nworkflows.xyz/workflows/automate-linkedin-comment-replies-with-gpt-3-5---track-in-google-sheets-7806


# Automate LinkedIn Comment Replies with GPT-3.5 & Track in Google Sheets

### 1. Workflow Overview

This workflow automates the process of monitoring comments on a specific LinkedIn post, generating AI-crafted replies using OpenAI's GPT-3.5 Turbo model, posting those replies back to LinkedIn, and tracking all interactions in a Google Sheet. It is designed to run every 10 minutes, fetching new comments, filtering out those already processed, replying promptly with a professional and engaging tone, and archiving data for review or analytics.

**Logical Blocks:**

- **1.1 Scheduled Trigger & Input Fetching:** Periodically initiates the workflow and collects recent LinkedIn comments and last processed comment timestamps.
- **1.2 Data Filtering:** Compares fetched comments against the last processed timestamp to isolate new comments requiring replies.
- **1.3 AI Processing:** Uses OpenAI GPT-3.5 Turbo to generate concise, professional, and friendly replies tailored to each new comment.
- **1.4 LinkedIn Reply Posting:** Posts the AI-generated replies back to LinkedIn under the original comments, maintaining correct authorization and formatting.
- **1.5 Data Archiving:** Logs all processed comments and replies into a Google Sheet for tracking and future analysis.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Scheduled Trigger & Input Fetching

**Overview:**  
This block initiates the workflow every 10 minutes, fetching all comments from a specified LinkedIn post and retrieving the timestamp of the last processed comment from Google Sheets to enable filtering.

**Nodes Involved:**  
- ⏰ Runs Every 10 Mins  
- 📥 Fetch LinkedIn Comments  
- 📊 Get Last Comment Timestamp  
- 📊 Set Last Timestamp

**Node Details:**

- **⏰ Runs Every 10 Mins**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow every 10 minutes automatically.  
  - Configuration: Interval set to 10 minutes.  
  - Inputs: None  
  - Outputs: Connects to both “📥 Fetch LinkedIn Comments” and “📊 Get Last Comment Timestamp.”  
  - Edge Cases: Workflow may not trigger if n8n server is down or scheduled trigger is disabled.

- **📥 Fetch LinkedIn Comments**  
  - Type: HTTP Request  
  - Role: Retrieves comments from the LinkedIn API for a specific post.  
  - Configuration:  
    - URL: `https://api.linkedin.com/v2/socialActions/urn:li:share:YOUR_POST_ID/comments` (replace YOUR_POST_ID)  
    - Authentication: HTTP Header Auth with Bearer token (OAuth2 token expected)  
    - Headers: Authorization and Content-Type set to application/json  
  - Inputs: Triggered by schedule  
  - Outputs: Comment data JSON array  
  - Edge Cases:  
    - API rate limits or token expiration may cause auth failures.  
    - Network timeouts or API structure changes may cause errors.

- **📊 Get Last Comment Timestamp**  
  - Type: Google Sheets (Read)  
  - Role: Reads last processed comment timestamp from a designated Google Sheet cell or range.  
  - Configuration:  
    - Document ID and Sheet Name specified  
    - OAuth2 Google Sheets credentials required  
  - Inputs: Triggered alongside comment fetch  
  - Outputs: Last comment timestamp JSON  
  - Edge Cases:  
    - Credential expiration or permission issues.  
    - Sheet or range misconfiguration.

- **📊 Set Last Timestamp**  
  - Type: Set  
  - Role: Prepares the last comment timestamp in a variable accessible to the filtering node.  
  - Configuration: No direct parameters; sets data for downstream nodes.  
  - Inputs: Receives outputs from both comment fetch and timestamp read nodes.  
  - Outputs: Passes data to filtering node.  
  - Edge Cases: Must correctly parse timestamp format.

---

#### 2.2 Data Filtering

**Overview:**  
Filters the fetched LinkedIn comments to isolate only those that are newer than the last processed timestamp, avoiding duplicate replies.

**Nodes Involved:**  
- 🔍 Filter New Comments

**Node Details:**

- **🔍 Filter New Comments**  
  - Type: If (Conditional)  
  - Role: Keeps only comments with creation timestamps after the last stored timestamp.  
  - Configuration:  
    - Condition compares comment `created.time` field with the last comment timestamp from Google Sheets using a datetime "after" operator.  
  - Inputs: Data from Set Last Timestamp node (comments and last timestamp)  
  - Outputs: Passes filtered new comments to AI reply node.  
  - Edge Cases:  
    - Timestamp format inconsistencies may cause filtering errors.  
    - If no new comments exist, downstream nodes do not execute.

---

#### 2.3 AI Processing

**Overview:**  
Generates professional, concise, and engaging replies to new LinkedIn comments using OpenAI GPT-3.5 Turbo.

**Nodes Involved:**  
- 🤖 Generate AI Reply

**Node Details:**

- **🤖 Generate AI Reply**  
  - Type: OpenAI (LangChain node)  
  - Role: Sends comment text to OpenAI API to generate tailored replies.  
  - Configuration:  
    - Model: GPT-3.5 Turbo  
    - Prompt includes instructions to produce professional, friendly, concise responses (2-3 sentences), thanking or acknowledging the commenter, and adding value or continuing the conversation naturally.  
  - Inputs: Filtered new comments  
  - Outputs: AI-generated reply text  
  - Credentials: OpenAI API key  
  - Edge Cases:  
    - API rate limits or connection failures.  
    - Improper prompt formatting or missing comment text can degrade output quality.

---

#### 2.4 LinkedIn Reply Posting

**Overview:**  
Posts the AI-generated replies as comments under the original LinkedIn comments, maintaining correct authorization and actor identity.

**Nodes Involved:**  
- 💬 Post LinkedIn Reply

**Node Details:**

- **💬 Post LinkedIn Reply**  
  - Type: HTTP Request  
  - Role: Posts generated reply to LinkedIn API under the original comment.  
  - Configuration:  
    - URL dynamically constructed using original comment ID (`https://api.linkedin.com/v2/socialActions/{{ $json.id }}/comments`)  
    - JSON body includes actor URN and AI-generated message text.  
    - Headers include Authorization Bearer token and Content-Type application/json.  
  - Inputs: AI-generated reply node output  
  - Outputs: Passes confirmation to data storage node  
  - Edge Cases:  
    - Token expiration or insufficient permissions.  
    - API rate limits or malformed request body.

---

#### 2.5 Data Archiving

**Overview:**  
Appends processed comment and reply data into a Google Sheet for tracking, analysis, or auditing.

**Nodes Involved:**  
- 💾 Store Comment Data

**Node Details:**

- **💾 Store Comment Data**  
  - Type: Google Sheets (Append)  
  - Role: Appends a new row to the configured Google Sheet with comment metadata and AI reply.  
  - Configuration:  
    - Document ID and Sheet Name specified  
    - Columns mapping to capture relevant fields (comment text, reply, timestamps, IDs, etc.)  
    - OAuth2 Google Sheets credentials required  
  - Inputs: Output from LinkedIn reply posting node  
  - Outputs: None (terminal node)  
  - Edge Cases:  
    - Credential or permission issues.  
    - Google Sheet service limits or API errors.

---

### 3. Summary Table

| Node Name                  | Node Type                         | Functional Role                              | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                 |
|----------------------------|----------------------------------|----------------------------------------------|------------------------------|-----------------------------|---------------------------------------------------------------------------------------------|
| ⏰ Runs Every 10 Mins       | Schedule Trigger                 | Periodically triggers workflow every 10 min | None                         | 📥 Fetch LinkedIn Comments, 📊 Get Last Comment Timestamp | AUTOMATED LINKEDIN COMMENT MONITORING: Fetches comments every 10 minutes.                   |
| 📥 Fetch LinkedIn Comments  | HTTP Request                    | Fetch LinkedIn post comments via API         | ⏰ Runs Every 10 Mins          | 📊 Set Last Timestamp         | AUTOMATED LINKEDIN COMMENT MONITORING: Uses LinkedIn API with header-based token auth.      |
| 📊 Get Last Comment Timestamp | Google Sheets (Read)             | Retrieve last processed comment timestamp    | ⏰ Runs Every 10 Mins          | 📊 Set Last Timestamp         | AUTOMATED LINKEDIN COMMENT MONITORING: Reads timestamp from Google Sheet.                   |
| 📊 Set Last Timestamp       | Set                             | Prepares last comment timestamp for filtering| 📥 Fetch LinkedIn Comments, 📊 Get Last Comment Timestamp | 🔍 Filter New Comments        | DYNAMIC COMMENT FILTERING: Preps timestamp to filter new comments.                          |
| 🔍 Filter New Comments      | If (Conditional)                | Filters comments newer than last processed   | 📊 Set Last Timestamp          | 🤖 Generate AI Reply          | DYNAMIC COMMENT FILTERING: Filters only new comments to process.                            |
| 🤖 Generate AI Reply        | OpenAI (LangChain)              | Generates AI replies to comments              | 🔍 Filter New Comments         | 💬 Post LinkedIn Reply        | AI-GENERATED LINKEDIN ENGAGEMENT: Generates concise, professional, friendly replies.        |
| 💬 Post LinkedIn Reply      | HTTP Request                    | Posts replies back to LinkedIn comment thread| 🤖 Generate AI Reply           | 💾 Store Comment Data         | AUTOMATED COMMENT REPLY POSTING: Posts AI replies maintaining actor identity and format.    |
| 💾 Store Comment Data       | Google Sheets (Append)          | Archives comment and reply data to Google Sheet| 💬 Post LinkedIn Reply        | None                        | COMMENT DATA ARCHIVAL: Appends processed data for tracking and analytics.                   |
| 📋 Workflow Notes2          | Sticky Note                    | Workflow overview notes                       | None                         | None                        | See note in summary rows above.                                                             |
| Sticky Note                | Sticky Note                    | Data filtering notes                          | None                         | None                        | See note in summary rows above.                                                             |
| Sticky Note1               | Sticky Note                    | OpenAI prompt and reply generation notes     | None                         | None                        | See note in summary rows above.                                                             |
| Sticky Note2               | Sticky Note                    | LinkedIn reply posting notes                  | None                         | None                        | See note in summary rows above.                                                             |
| Sticky Note3               | Sticky Note                    | Google Sheets archival notes                   | None                         | None                        | See note in summary rows above.                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node:**  
   - Type: Schedule Trigger  
   - Set interval to every 10 minutes.  
   - Name it “⏰ Runs Every 10 Mins.”

2. **Create HTTP Request Node to Fetch LinkedIn Comments:**  
   - Type: HTTP Request  
   - Name: “📥 Fetch LinkedIn Comments”  
   - URL: `https://api.linkedin.com/v2/socialActions/urn:li:share:YOUR_POST_ID/comments` (replace YOUR_POST_ID)  
   - Authentication: HTTP Header Auth with Bearer token  
   - Headers:  
     - Authorization: `Bearer YOUR_ACCESS_TOKEN`  
     - Content-Type: `application/json`  
   - Connect “⏰ Runs Every 10 Mins” main output to this node’s input.

3. **Create Google Sheets Read Node to Get Last Timestamp:**  
   - Type: Google Sheets  
   - Operation: Read  
   - Name: “📊 Get Last Comment Timestamp”  
   - Configure Document ID and Sheet Name where last timestamp is stored.  
   - Connect “⏰ Runs Every 10 Mins” main output to this node’s input.  
   - Use OAuth2 credentials for Google Sheets.

4. **Create Set Node to Prepare Last Timestamp:**  
   - Type: Set  
   - Name: “📊 Set Last Timestamp”  
   - Combine outputs of “📥 Fetch LinkedIn Comments” and “📊 Get Last Comment Timestamp” so both data are accessible.  
   - Connect both previous nodes’ outputs to this Set node.

5. **Create If Node to Filter New Comments:**  
   - Type: If  
   - Name: “🔍 Filter New Comments”  
   - Condition: Compare each comment’s `created.time` to the last comment timestamp from Google Sheets; pass only if newer.  
   - Connect “📊 Set Last Timestamp” main output to this node.

6. **Create OpenAI Node to Generate Replies:**  
   - Type: OpenAI (LangChain or standard node)  
   - Name: “🤖 Generate AI Reply”  
   - Model: GPT-3.5 Turbo  
   - Prompt: Include instructions to generate a professional, friendly, concise reply (2-3 sentences) acknowledging the original comment.  
   - Use OpenAI API credentials.  
   - Connect “🔍 Filter New Comments” true output to this node.

7. **Create HTTP Request Node to Post LinkedIn Replies:**  
   - Type: HTTP Request  
   - Name: “💬 Post LinkedIn Reply”  
   - URL: `https://api.linkedin.com/v2/socialActions/{{ $json.id }}/comments` (dynamic comment ID)  
   - Method: POST  
   - Headers: Authorization Bearer token and Content-Type application/json  
   - Body (JSON): Include actor URN and AI-generated reply text  
   - Connect “🤖 Generate AI Reply” main output to this node.

8. **Create Google Sheets Append Node to Store Comment Data:**  
   - Type: Google Sheets  
   - Operation: Append  
   - Name: “💾 Store Comment Data”  
   - Configure Document ID and Sheet Name for data archival  
   - Map columns to store comment details, timestamps, reply text, etc.  
   - Connect “💬 Post LinkedIn Reply” main output to this node.

9. **Add Sticky Notes for Documentation:**  
   - Add notes near nodes describing their roles and key points as per the sticky note contents in the original workflow.

10. **Configure Credentials:**  
    - Setup “LinkedIn Header Auth” for LinkedIn API (Bearer token).  
    - Setup Google Sheets OAuth2 credentials.  
    - Setup OpenAI API credentials.

11. **Validate and Test:**  
    - Run the workflow manually to verify connections and functionality.  
    - Check Google Sheet for last timestamp reading and data appending.  
    - Confirm LinkedIn comment replies post correctly.

---

### 5. General Notes & Resources

| Note Content                                                                                                             | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| AUTOMATED LINKEDIN COMMENT MONITORING: Fetches comments every 10 minutes using LinkedIn API with header-based token auth.| Sticky Note covering “⏰ Runs Every 10 Mins”, “📥 Fetch LinkedIn Comments”, and “📊 Get Last Comment Timestamp” nodes.|
| DYNAMIC COMMENT FILTERING: Filters new comments based on timestamp from Google Sheets to avoid duplicates.                | Sticky Note covering “📊 Set Last Timestamp” and “🔍 Filter New Comments” nodes.                     |
| AI-GENERATED LINKEDIN ENGAGEMENT: Uses GPT-3.5 Turbo to generate friendly, professional replies with controlled length.| Sticky Note covering “🤖 Generate AI Reply” node.                                                   |
| AUTOMATED COMMENT REPLY POSTING: Posts AI replies to LinkedIn under original comments maintaining correct format.         | Sticky Note covering “💬 Post LinkedIn Reply” node.                                                |
| COMMENT DATA ARCHIVAL: Appends LinkedIn comment and reply data into Google Sheets for tracking and analytics.             | Sticky Note covering “💾 Store Comment Data” node.                                                  |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly accessible.