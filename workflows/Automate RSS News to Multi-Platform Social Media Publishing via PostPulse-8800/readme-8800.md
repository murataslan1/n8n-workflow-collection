Automate RSS News to Multi-Platform Social Media Publishing via PostPulse

https://n8nworkflows.xyz/workflows/automate-rss-news-to-multi-platform-social-media-publishing-via-postpulse-8800


# Automate RSS News to Multi-Platform Social Media Publishing via PostPulse

### 1. Workflow Overview

This workflow automates the process of fetching news articles from an RSS feed, processing their content and media, and publishing or scheduling posts across multiple social media platforms via PostPulse. It is designed to run once daily at a specified time (9:00 AM) and targets use cases such as automated content repurposing, multi-platform social media management, and streamlined digital marketing.

The workflow is logically divided into the following blocks:

- **1.1 Schedule and Input Reception**  
  Triggering the workflow on a schedule and fetching RSS feed data.

- **1.2 Filtering and Content Selection**  
  Limiting the number of posts processed and filtering articles published on the previous day.

- **1.3 Media Detection and Handling**  
  Checking for the presence of media (images/videos) in articles and uploading media to PostPulse if present.

- **1.4 Account Retrieval and Data Merging**  
  Fetching connected social media accounts from PostPulse and merging account data with article and media information.

- **1.5 Post Preparation and Publishing**  
  Preparing post content based on platform constraints and publishing or scheduling posts via PostPulse, supporting both media and text-only posts.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Schedule and Input Reception

**Overview:**  
This block initiates the workflow execution daily at 9:00 AM and fetches the latest news articles from a specified RSS feed URL.

**Nodes Involved:**  
- Schedule Trigger  
- Get connected accounts  
- RSS Feed Read

**Node Details:**

- **Schedule Trigger**  
  - Type: Trigger (Schedule)  
  - Configuration: Set to trigger daily at 9:00 AM.  
  - Input: None (trigger node)  
  - Output: Triggers downstream nodes "Get connected accounts" and "RSS Feed Read"  
  - Edge cases: Timezone misalignment could cause unexpected trigger time.

- **Get connected accounts**  
  - Type: PostPulse API node  
  - Configuration: Retrieves linked social media accounts using PostPulse OAuth2 credentials.  
  - Input: Trigger from Schedule Trigger  
  - Output: Provides account data to merge nodes for post publishing.  
  - Failure modes: OAuth2 token expiry or network issues.

- **RSS Feed Read**  
  - Type: RSS Feed Reader  
  - Configuration: Fetches news from "https://rss.unian.ua/site/gplay_56_ukr.rss".  
  - Input: Trigger from Schedule Trigger  
  - Output: Emits RSS feed items downstream to Limit to N Post node.  
  - Edge cases: RSS feed unavailability, malformed XML, rate limiting.

---

#### 1.2 Filtering and Content Selection

**Overview:**  
Limits the number of RSS feed items processed and filters posts published exactly on the previous day.

**Nodes Involved:**  
- Limit to N Post  
- If

**Node Details:**

- **Limit to N Post**  
  - Type: Function  
  - Configuration: Limits processing to 1 post (configurable by changing the `limit` variable in code).  
  - Input: RSS feed items  
  - Output: Passes limited items to "If" node  
  - Edge cases: If fewer items are available than the limit, all available items are passed.

- **If**  
  - Type: Conditional (If)  
  - Configuration: Checks that each post’s publication date (`pubDate`) falls within the previous calendar day (from start to end).  
  - Input: Limited RSS items  
  - Output: Posts matching date condition forwarded to "Media Check IF"; others discarded.  
  - Edge cases: Date parsing errors, timezone mismatches.

---

#### 1.3 Media Detection and Handling

**Overview:**  
Determines whether each post contains media (images or videos) and branches processing accordingly. Posts with media trigger media upload; posts without media merge directly with account data.

**Nodes Involved:**  
- Media Check IF  
- Upload media  
- Get upload status  
- If1  
- Wait

**Node Details:**

- **Media Check IF**  
  - Type: Conditional (If)  
  - Configuration: Checks multiple fields for media URLs:
    - `$json.enclosure.url`  
    - `$json['media:content'].url`  
    - `$json['media:thumbnail'].url`  
    - `<img>` tags in `description` or `content:encoded` (via regex)  
  - Input: Filtered RSS items  
  - Output:  
    - True branch: To "Upload media" (media present)  
    - False branch: To "Merge (no media + accounts)" (no media)  
  - Edge cases: Missing or malformed media fields, regex failures.

- **Upload media**  
  - Type: PostPulse API node  
  - Configuration: Uploads media to PostPulse using media URL, with filename inferred from URL path.  
  - Input: Posts with media  
  - Output: Upload job ID sent to "Get upload status".  
  - Failure modes: Upload failure, invalid URL, network errors.

- **Get upload status**  
  - Type: PostPulse API node  
  - Configuration: Polls upload status for the given media import ID.  
  - Input: Upload media response  
  - Output:  
    - If media not ready (state != "READY"), triggers "Wait" node.  
    - If ready, sends data to "Merge" node.  
  - Edge cases: Long upload time, API timeout.

- **If1**  
  - Type: Conditional (If)  
  - Configuration: Checks if media upload state is "READY".  
  - Input: Media upload status  
  - Output:  
    - False: Loop back through "Wait" (5 seconds delay) to retry status.  
    - True: Continue processing to "Merge".  
  - Failure modes: Infinite wait if upload never completes.

- **Wait**  
  - Type: Wait  
  - Configuration: Waits fixed time (default 5 seconds) between upload status checks.  
  - Input: If1 false branch  
  - Output: Triggers "Get upload status" again.  
  - Edge cases: Long-running workflow if media upload is slow.

---

#### 1.4 Account Retrieval and Data Merging

**Overview:**  
Combines media-uploaded posts or text-only posts with the user's connected social media accounts to prepare for publishing.

**Nodes Involved:**  
- Merge (no media + accounts)  
- Merge  
- Merge1  
- Get connected accounts (already described)

**Node Details:**

- **Merge (no media + accounts)**  
  - Type: Merge  
  - Configuration: Combines posts without media with connected accounts data.  
  - Inputs:  
    - False branch output from "Media Check IF" (posts without media)  
    - Output from "Get connected accounts"  
  - Output: Feeds "Publish Post (text only)"  
  - Edge cases: Mismatched or missing data.

- **Merge**  
  - Type: Merge  
  - Configuration: Combines posts with media upload info with posts without media, merging by matching "sourceUrl" and "enclosure.url" fields.  
  - Inputs:  
    - Output from "If1" true branch (posts with media uploaded)  
    - Output from "Media Check IF" false branch (posts without media)  
  - Output: To "Merge1"  
  - Edge cases: Key mismatches causing incomplete merges.

- **Merge1**  
  - Type: Merge  
  - Configuration: Combines merged post data with connected accounts for final post data preparation.  
  - Inputs:  
    - Output from "Merge"  
    - Output from "Get connected accounts" (second connection)  
  - Output: Feeds "Publish Post"  
  - Edge cases: Data duplication or missing fields.

---

#### 1.5 Post Preparation and Publishing

**Overview:**  
Prepares post content tailored to each social media platform’s constraints and publishes or schedules posts on PostPulse, supporting media attachments for posts with media and text-only posts otherwise.

**Nodes Involved:**  
- Publish Post  
- Publish Post (text only)

**Node Details:**

- **Publish Post**  
  - Type: PostPulse API node  
  - Configuration:  
    - Posts are saved as drafts (`isDraft: true`).  
    - Content is truncated intelligently based on platform-specific character limits (e.g., 280 chars for Twitter).  
    - Truncation logic prefers ending at sentence punctuation marks; otherwise truncates with ellipsis.  
    - Supports media attachments via `attachmentPaths` referencing uploaded media keys.  
    - Platform mappings convert internal platform codes to PostPulse platform IDs.  
    - Scheduled time set to current UTC time.  
  - Input: Merged posts with media and account info  
  - Output: Final publishing step  
  - Failure modes: API errors, invalid media references, scheduling conflicts.

- **Publish Post (text only)**  
  - Type: PostPulse API node  
  - Configuration: Same as "Publish Post" but without media attachments.  
  - Input: Merged posts without media and account info  
  - Output: Final publishing step  
  - Edge cases: Text length handling similar to "Publish Post".

---

### 3. Summary Table

| Node Name                 | Node Type                   | Functional Role                                | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                           |
|---------------------------|-----------------------------|------------------------------------------------|------------------------------|-----------------------------|-----------------------------------------------------------------------------------------------------|
| Schedule Trigger          | Schedule Trigger             | Initiates workflow daily at 9:00 AM             | None                         | Get connected accounts, RSS Feed Read | ## Schedule Trigger Sets the workflow to run at a chosen time, e.g., daily at 9:00 AM.               |
| Get connected accounts    | PostPulse API Node           | Retrieves linked social media accounts          | Schedule Trigger             | Merge (no media + accounts), Merge1  | ## PostPulse Get Connected Accounts Retrieves your linked social media accounts for publishing posts. |
| RSS Feed Read             | RSS Feed Read                | Fetches latest news from RSS feed URL            | Schedule Trigger             | Limit to N Post             | ## RSS Feed Read Fetches the latest news from a specified RSS feed URL.                              |
| Limit to N Post           | Function                    | Limits number of posts processed                  | RSS Feed Read                | If                         | ## Limit to N Post Limits the number of items passed through. Set the desired number directly in the node code. |
| If                       | Conditional (If)             | Filters posts published on previous day          | Limit to N Post              | Media Check IF              | ## If & Media Check IF Filters posts based on publish date (e.g., only from yesterday) **AND** checks if they contain an image. |
| Media Check IF            | Conditional (If)             | Checks if post contains media (image/video)      | If                          | Upload media, Merge (no media + accounts) | ## If & Media Check IF Filters posts based on publish date (e.g., only from yesterday) **AND** checks if they contain an image. |
| Upload media              | PostPulse API Node           | Uploads media from feed to PostPulse              | Media Check IF (true branch) | Get upload status           | ## PostPulse Upload Media & Get Upload Status Uploads images/videos, waits for media to be ready, checks upload status every 5s. |
| Get upload status         | PostPulse API Node           | Polls upload status of media                       | Upload media, Wait          | If1                        | ## PostPulse Upload Media & Get Upload Status Uploads images/videos, waits for media to be ready, checks upload status every 5s. |
| If1                      | Conditional (If)             | Checks if media upload is ready                    | Get upload status            | Wait (if not ready), Merge (if ready) | ## PostPulse Upload Media & Get Upload Status Uploads images/videos, waits for media to be ready, checks upload status every 5s. |
| Wait                     | Wait                        | Waits 5 seconds between media upload status polls | If1                         | Get upload status           | ## PostPulse Upload Media & Get Upload Status Uploads images/videos, waits for media to be ready, checks upload status every 5s. |
| Merge (no media + accounts) | Merge                      | Combines posts without media with accounts data   | Media Check IF (false branch), Get connected accounts | Publish Post (text only)   |                                                                                                     |
| Merge                    | Merge                       | Merges posts with media upload info and posts without media by URL matching | If1 (true branch), Media Check IF (false branch) | Merge1                     | ## Merge Combines information from the RSS feed with the uploaded media, creating a single record with a shared URL. |
| Merge1                   | Merge                       | Combines merged post data with connected accounts | Merge, Get connected accounts | Publish Post               |                                                                                                     |
| Publish Post             | PostPulse API Node           | Publishes or schedules posts with media attachments | Merge1                      | None                       | ## Publish Post Schedules the news post. If "Is Draft" is checked, the post is saved as draft; otherwise scheduled immediately. |
| Publish Post (text only) | PostPulse API Node           | Publishes or schedules text-only posts             | Merge (no media + accounts)  | None                       | ## Publish Post Schedules the news post. If "Is Draft" is checked, the post is saved as draft; otherwise scheduled immediately. |
| Sticky Note              | Sticky Note                 | Documentation notes                                | None                        | None                       | ## Repurpose News from RSS Feed and Publish via PostPulse This workflow automatically fetches news from an RSS feed, processes the content, and publishes or schedules posts across multiple social media platforms using PostPulse. |
| Sticky Note1             | Sticky Note                 | Documentation for schedule trigger                 | None                        | None                       | ## Schedule Trigger Sets the workflow to run at a chosen time, e.g., daily at 9:00 AM.               |
| Sticky Note2             | Sticky Note                 | Documentation for RSS feed read                     | None                        | None                       | ## RSS Feed Read Fetches the latest news from a specified RSS feed URL.                              |
| Sticky Note3             | Sticky Note                 | Documentation for limiting post count               | None                        | None                       | ## Limit to N Post Limits the number of items passed through. Set the desired number directly in the node code. |
| Sticky Note4             | Sticky Note                 | Documentation for filtering by date & media check  | None                        | None                       | ## If & Media Check IF Filters posts based on publish date (e.g., only from yesterday) **AND** checks if they contain an image. |
| Sticky Note5             | Sticky Note                 | Documentation for media upload and upload status    | None                        | None                       | ## PostPulse Upload Media & Get Upload Status Uploads images/videos, waits for media to be ready, checks upload status every 5s. |
| Sticky Note6             | Sticky Note                 | Documentation for merging posts and media           | None                        | None                       | ## Merge Combines information from the RSS feed with the uploaded media, creating a single record with a shared URL. |
| Sticky Note7             | Sticky Note                 | Documentation for publishing posts                   | None                        | None                       | ## Publish Post Schedules the news post. If "Is Draft" is checked, the post is saved as a draft; if not, it is scheduled for immediate publishing. |
| Sticky Note8             | Sticky Note                 | Documentation for retrieving connected accounts     | None                        | None                       | ## PostPulse Get Connected Accounts Retrieves your linked social media accounts for publishing posts. |
| Sticky Note9             | Sticky Note                 | Documentation for merging posts without media and accounts | None                        | None                       | ## Merge (no media + accounts) Merges posts without media with accounts data.                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger once daily at 09:00 (local or UTC as needed).

3. **Add PostPulse 'Get connected accounts' node:**  
   - Type: PostPulse API node (resource: account)  
   - Connect input from Schedule Trigger output.  
   - Set up and select PostPulse OAuth2 credentials.

4. **Add RSS Feed Read node:**  
   - Type: RSS Feed Read  
   - URL: `https://rss.unian.ua/site/gplay_56_ukr.rss`  
   - Connect input from Schedule Trigger output.

5. **Add Function node to limit posts ("Limit to N Post"):**  
   - Code:
   ```javascript
   const limit = 1; // Adjust as needed
   const items = $input.all();
   return items.slice(0, limit);
   ```
   - Connect input from RSS Feed Read output.

6. **Add If node to filter posts by publish date:**  
   - Condition:  
     - Left: `{{ $json.pubDate }}`
     - Operator: afterOrEquals  
     - Right: `{{ $now.minus(1, 'days').startOf('day') }}`  
   - AND  
     - Left: `{{ $json.pubDate }}`
     - Operator: beforeOrEquals  
     - Right: `{{ $now.minus(1, 'days').endOf('day') }}`  
   - Connect input from Limit to N Post output.

7. **Add If node to check for media presence ("Media Check IF"):**  
   - Condition: Check that at least one media URL is not empty among:  
     - `$json.enclosure?.url`  
     - `$json['media:content']?.url`  
     - `$json['media:thumbnail']?.url`  
     - Regex extraction of `<img>` src from `$json.description` or `$json['content:encoded']`  
   - Connect input from If node's true branch output.

8. **Add PostPulse node to upload media ("Upload media"):**  
   - Resource: media  
   - Upload source: url  
   - URL: `{{$json.enclosure.url}}`  
   - Filename hint: Extract file name from URL.  
   - Connect input from Media Check IF true branch.  
   - Use PostPulse OAuth2 credentials.

9. **Add PostPulse node to get upload status ("Get upload status"):**  
   - Resource: media  
   - Operation: getUploadStatus  
   - Import ID: `{{$json.id}}` (from upload media)  
   - Connect input from Upload media output and from Wait node (see below).  
   - Use PostPulse OAuth2 credentials.

10. **Add If node to check if upload is ready ("If1"):**  
    - Condition: `$json.state` **not equals** `"READY"`  
    - Connect input from Get upload status output.

11. **Add Wait node:**  
    - Add standard wait node (default 5 seconds).  
    - Connect If1 true branch (upload not ready) to Wait node output, and Wait output back to Get upload status input to poll repeatedly.

12. **Connect If1 false branch (upload ready) to a Merge node ("Merge"):**  
    - This node will combine uploaded media info with posts without media.

13. **Add Merge node ("Merge (no media + accounts)") to combine posts without media with connected accounts:**  
    - Mode: Combine (combineAll)  
    - Connect Media Check IF false branch (posts without media) and Get connected accounts output.

14. **Connect Merge (no media + accounts) output to "Publish Post (text only)" node (see step 17).**

15. **Connect Merge (upload ready) output and Merge (no media + accounts) output to another Merge node ("Merge1"):**  
    - Mode: Combine (combineAll)

16. **Connect Merge1 output to "Publish Post" node (see step 16).**

17. **Add PostPulse node "Publish Post":**  
    - Set `isDraft` to true  
    - Publications: For each publication, set:  
      - Content truncated per platform limits, using JavaScript function to slice text at sentence ends if possible, else truncating and appending "...".  
      - Attachment paths linking to uploaded media keys.  
      - Platform settings mapped to PostPulse platform IDs.  
      - Social media account ID from merged account data.  
      - Scheduled time: current UTC time.  
    - Connect input from Merge1 output.  
    - Use PostPulse OAuth2 credentials.

18. **Add PostPulse node "Publish Post (text only)":**  
    - Same as "Publish Post" but without media attachments in `attachmentPaths`.  
    - Connect input from Merge (no media + accounts) output.  
    - Use PostPulse OAuth2 credentials.

19. **Arrange nodes and connections as per described flow to ensure proper data flow and logical branching.**

20. **Test workflow by running once manually and then activating for scheduled runs.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                     | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow automates repurposing news from an RSS feed and publishing across social media using PostPulse.                                                                   | Sticky Note documentation included in workflow.                                                |
| The truncation function carefully respects platform-specific character limits and attempts to end posts cleanly at sentence boundaries or punctuation marks.                    | PostPulse post content preparation logic in Publish nodes.                                    |
| PostPulse OAuth2 credentials are required and must be properly configured for API interactions including account retrieval, media upload, and post publishing.                  | Credential setup in PostPulse nodes.                                                           |
| The workflow includes a polling mechanism with a Wait node to handle asynchronous media upload processing, avoiding premature publishing attempts.                              | Upload status checking loop with If1 and Wait nodes.                                           |
| The RSS feed URL used is `https://rss.unian.ua/site/gplay_56_ukr.rss` but can be replaced to target other news sources.                                                        | RSS Feed Read node parameter.                                                                  |
| See PostPulse API documentation for details on accepted platforms and media upload requirements: https://postpulse.io/api                                                          | External resource for platform-specific details and troubleshooting.                          |

---

This reference document provides a complete understanding of the workflow structure, logic, and configuration needed to recreate or modify it confidently in n8n.