AI-Powered X (Twitter) Content Generator and Scheduler with LangChain and Blotato

https://n8nworkflows.xyz/workflows/ai-powered-x--twitter--content-generator-and-scheduler-with-langchain-and-blotato-9562


# AI-Powered X (Twitter) Content Generator and Scheduler with LangChain and Blotato

### 1. Workflow Overview

This workflow automates the generation, management, and publishing of content posts for X (formerly Twitter) using AI-powered text generation, Google Sheets for post management, and the Blotato platform for posting. It targets users who want to regularly create engaging social media content using an AI persona reflecting a busy woman in her late 20s involved in side hustles and automation. The workflow is structured into the following logical blocks:

- **1.1 Trigger and AI Content Generation:** Periodically triggers every 4 hours, invokes an AI model via LangChain to generate a tweet post following strict persona and formatting rules.
- **1.2 AI Output Processing and Storage:** Cleans up the AI-generated text, parses it into structured JSON, and saves it as a draft ("Not Posted") in a Google Sheet.
- **1.3 Post Retrieval and Decision Making:** Retrieves the next draft post from the Google Sheet and determines whether it requires an image based on its category.
- **1.4 Image Handling and Posting:** If an image is required, finds a corresponding image in Google Drive, downloads, uploads it to Blotato, and posts the tweet with the image.
- **1.5 Text-Only Posting and Completion:** If no image is needed, posts the text-only tweet via Blotato.
- **1.6 Notification and Status Update:** Sends an email notification upon successful posting and updates the post status to "Completed" in Google Sheets to avoid reposting.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and AI Content Generation

**Overview:**  
This block initiates the workflow every 4 hours and uses an OpenRouter-powered LangChain AI agent to generate a tweet post. The AI is instructed with a detailed persona, purpose, rules, and JSON output format to produce concise, relatable social posts containing specific generative AI service names.

**Nodes Involved:**  
- Trigger: Every 4 Hours  
- LLM: OpenRouter  
- AI: Generate X Post Content

**Node Details:**

- **Trigger: Every 4 Hours**  
  - Type: Schedule Trigger  
  - Role: Starts the workflow every 4 hours automatically.  
  - Configuration: Interval set to 4 hours.  
  - Outputs: Triggers AI post generation.  
  - Edge Cases: Missed trigger due to server downtime; time zone considerations for `trigger_time`.

- **LLM: OpenRouter**  
  - Type: LangChain OpenRouter Language Model node  
  - Role: Provides AI language model backend for the agent.  
  - Configuration: Uses OpenRouter API credential named "簡易デモ".  
  - Input/Output: Feeds AI agent with model responses.  
  - Edge Cases: API rate limits, authentication failure, network timeout.

- **AI: Generate X Post Content**  
  - Type: LangChain Agent node  
  - Role: Generates a post text using a detailed system prompt defining persona, purpose, categories, rules, and output format in JSON.  
  - Configuration:  
    - System message defines the persona (female side-hustler in late 20s), purpose (drive traffic to n8n training), content categories (Empathy-based, Evidence-based with subtypes), strict rules on output format and length (120-140 chars), and tone (relatable, no preachy/expert tone).  
    - Output format is JSON with fields: target audience, theme, post details (index, category, trigger_time, text).  
  - Input: Trigger and LLM node response.  
  - Output: AI-generated JSON post object.  
  - Edge Cases: AI generating malformed JSON, exceeding character limits, or failing to comply with persona/rules.

---

#### 2.2 AI Output Processing and Storage

**Overview:**  
This block cleans the AI-generated post text to ensure natural sentence endings, then saves the structured post data into a Google Sheet with status "Not Posted" to prepare for publishing.

**Nodes Involved:**  
- Parser: Format AI Output to JSON  
- Code: Clean Up Post Text  
- Google Sheets: Save Generated Post as 'Not Posted'

**Node Details:**

- **Parser: Format AI Output to JSON**  
  - Type: LangChain Output Parser Structured node  
  - Role: Parses the raw AI output to structured JSON according to the example schema.  
  - Configuration: Uses example JSON to validate and parse output.  
  - Input: AI agent output.  
  - Output: Structured JSON with keys: target, theme, post.  
  - Edge Cases: Parsing failures if AI output deviates from JSON format.

- **Code: Clean Up Post Text**  
  - Type: Code (JavaScript) node  
  - Role: Trims AI-generated post text to end cleanly at the last sentence-ending punctuation or emoji.  
  - Configuration: JS code scans for punctuation marks (., !, ?, ", ✨, ☕️) and truncates text after last occurrence.  
  - Input: Parsed AI output JSON.  
  - Output: Cleaned post text JSON.  
  - Edge Cases: No punctuation found; text remains unchanged.

- **Google Sheets: Save Generated Post as 'Not Posted'**  
  - Type: Google Sheets node (append operation)  
  - Role: Appends new post data as a draft in the sheet named "X Post Management".  
  - Configuration: Maps post text, theme, status="Not Posted", target, category, and current timestamp to columns.  
  - Credentials: Google Sheets OAuth2 "pantheon\demo".  
  - Input: Cleaned JSON post data.  
  - Output: Confirmation of row append.  
  - Edge Cases: Google Sheets API limits, auth errors, data mapping issues.

---

#### 2.3 Post Retrieval and Decision Making

**Overview:**  
Retrieves the next post marked as "Not Posted" from the Google Sheet and branches the workflow depending on whether the post category requires an image or not.

**Nodes Involved:**  
- Google Sheets: Get 'Not Posted' Row for Posting  
- If: Does Post Need an Image?

**Node Details:**

- **Google Sheets: Get 'Not Posted' Row for Posting**  
  - Type: Google Sheets node (read operation)  
  - Role: Retrieves the first row where Status = "Not Posted" from the "X Post Management" sheet.  
  - Configuration: Filter applied on Status column, return first match only.  
  - Credentials: Google Sheets OAuth2 "pantheon\demo".  
  - Output: The post record to be published next.  
  - Edge Cases: No rows found (empty queue), API errors.

- **If: Does Post Need an Image?**  
  - Type: If node  
  - Role: Checks if the category string contains "Evidence-based" to decide posting route.  
  - Configuration: Condition checks if `Category` contains substring "Evidence-based".  
  - Output:  
    - True: Post requires image → proceeds to image handling nodes.  
    - False: Text-only post → proceeds to text-only posting node.  
  - Edge Cases: Category field missing or malformed causing branch errors.

---

#### 2.4 Image Handling and Posting

**Overview:**  
For posts requiring images, this block locates a suitable image in Google Drive by category name, downloads it, uploads it to Blotato, and posts the tweet with the image.

**Nodes Involved:**  
- Google Drive: Find Image by Category Name  
- Google Drive: Download Image File  
- Blotato: Upload Image Media  
- Blotato: Post Tweet with Image

**Node Details:**

- **Google Drive: Find Image by Category Name**  
  - Type: Google Drive node (file/folder lookup)  
  - Role: Searches inside specified Google Drive folder ("For X Posts") for an image file matching the category name.  
  - Configuration: Query set to post category; limits to 1 result.  
  - Credentials: Google Drive OAuth2 "Ultimate Media Agent".  
  - Output: File metadata of matched image.  
  - Edge Cases: No matching image found, permission errors.

- **Google Drive: Download Image File**  
  - Type: Google Drive node (download operation)  
  - Role: Downloads the image file found in previous step.  
  - Configuration: Uses file ID from previous node.  
  - Credentials: Same as above.  
  - Output: Binary image data.  
  - Edge Cases: File missing, download failure.

- **Blotato: Upload Image Media**  
  - Type: Blotato media upload node  
  - Role: Uploads the downloaded image binary to Blotato platform media library for Twitter.  
  - Configuration: Uses binary data input, no extra options.  
  - Credentials: Blotato API credential.  
  - Output: URL or media ID for image to be attached to tweet.  
  - Edge Cases: Upload failures, API limits.

- **Blotato: Post Tweet with Image**  
  - Type: Blotato post node for Twitter  
  - Role: Posts tweet with text and attached image media URL.  
  - Configuration: Uses text from Google Sheets node and media URL from upload node.  
  - Credentials: Blotato API.  
  - Output: Confirmation of post.  
  - Edge Cases: Posting errors, invalid media URL.

---

#### 2.5 Text-Only Posting and Completion

**Overview:**  
Posts tweets that do not require images directly as text-only tweets, then proceeds to notification and status update.

**Nodes Involved:**  
- Blotato: Post Text-Only Tweet

**Node Details:**

- **Blotato: Post Text-Only Tweet**  
  - Type: Blotato post node for Twitter  
  - Role: Posts tweet text only using the text from "Not Posted" Google Sheets row.  
  - Configuration: Text content taken directly from Google Sheet.  
  - Credentials: Blotato API.  
  - Output: Post confirmation.  
  - Edge Cases: Posting failure, text length issues.

---

#### 2.6 Notification and Status Update

**Overview:**  
After posting (image or text-only), sends an email notification to configured recipients and updates the post status in Google Sheets to "Completed" to prevent reposting.

**Nodes Involved:**  
- Gmail: Send 'Post Complete' Notification  
- Google Sheets: Update Post Status to 'Completed'

**Node Details:**

- **Gmail: Send 'Post Complete' Notification**  
  - Type: Gmail node (send email)  
  - Role: Sends notification email to specified recipients about successful post publishing.  
  - Configuration:  
    - Recipients: yoneda@yubipass.tokyo, yamamoto@yubipass.tokyo  
    - Subject: "Today's Post Has Been Published"  
    - Message: Confirmation text without attribution appended.  
  - Credentials: Gmail OAuth2 "Gmail account".  
  - Edge Cases: Email sending failure, auth errors.

- **Google Sheets: Update Post Status to 'Completed'**  
  - Type: Google Sheets node (append or update operation)  
  - Role: Updates the post row's `Status` to "Completed" using `PostDate` as matching key.  
  - Configuration: Uses "appendOrUpdate" with matching on PostDate, sets Status="Completed".  
  - Credentials: Google Sheets OAuth2 "pantheon\demo".  
  - Edge Cases: Update conflicts, API errors.

---

### 3. Summary Table

| Node Name                              | Node Type                                   | Functional Role                                          | Input Node(s)                              | Output Node(s)                             | Sticky Note                                                                                                   |
|--------------------------------------|---------------------------------------------|----------------------------------------------------------|-------------------------------------------|--------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Trigger: Every 4 Hours                | Schedule Trigger                            | Starts workflow every 4 hours                             | -                                         | AI: Generate X Post Content                 | **Trigger: Every 4 Hours**: The starting point for the entire workflow. Runs every 4 hours to generate posts. |
| LLM: OpenRouter                      | LangChain LLM OpenRouter                    | Provides AI model backend for content generation         | -                                         | AI: Generate X Post Content                 |                                                                                                              |
| AI: Generate X Post Content           | LangChain Agent                             | Generates AI post text per persona and rules             | Trigger: Every 4 Hours, LLM: OpenRouter   | Code: Clean Up Post Text                     | **AI: Generate X Post Content**: Command center instructing AI to generate post using persona and rules.     |
| Parser: Format AI Output to JSON      | LangChain Output Parser Structured          | Parses AI output into structured JSON                     | AI: Generate X Post Content                | AI: Generate X Post Content (ai_outputParser) |                                                                                                              |
| Code: Clean Up Post Text              | Code (JavaScript)                           | Cleans AI text to end naturally                           | AI: Generate X Post Content                | Google Sheets: Save Generated Post as 'Not Posted' | **Code: Clean Up Post Text**: Ensures AI text ends naturally, truncating after last punctuation or emoji.    |
| Google Sheets: Save Generated Post as 'Not Posted' | Google Sheets (append)                      | Saves generated post draft with status "Not Posted"      | Code: Clean Up Post Text                   | Google Sheets: Get 'Not Posted' Row for Posting     | **G-Sheets: Save Generated Post...**: Saves draft post to management sheet with status "Not Posted".         |
| Google Sheets: Get 'Not Posted' Row for Posting | Google Sheets (read)                        | Retrieves next draft post marked "Not Posted"             | Google Sheets: Save Generated Post as 'Not Posted' | If: Does Post Need an Image?                   | **G-Sheets: Get 'Not Posted' Row...**: Fetches first "Not Posted" row for publishing.                         |
| If: Does Post Need an Image?          | If Node                                    | Checks if post requires image based on category           | Google Sheets: Get 'Not Posted' Row for Posting | Google Drive: Find Image by Category Name (true), Blotato: Post Text-Only Tweet (false) | **If: Does Post Need an Image?**: Branches to image or text-only posting routes based on category content.    |
| Google Drive: Find Image by Category Name | Google Drive (file/folder lookup)           | Finds image file in Drive matching post category          | If: Does Post Need an Image? (true)        | Google Drive: Download Image File             | **G-Drive: Find Image...** -> ... -> **Blotato: Post Tweet with Image**: Finds, downloads, uploads, and posts image tweets. |
| Google Drive: Download Image File      | Google Drive (download)                      | Downloads image file found in Drive                        | Google Drive: Find Image by Category Name | Blotato: Upload Image Media                   |                                                                                                              |
| Blotato: Upload Image Media            | Blotato Upload Media                         | Uploads image binary to Blotato for Twitter media         | Google Drive: Download Image File          | Blotato: Post Tweet with Image                 |                                                                                                              |
| Blotato: Post Tweet with Image         | Blotato Post                                | Posts tweet with text and attached image                  | Blotato: Upload Image Media                 | Gmail: Send 'Post Complete' Notification        |                                                                                                              |
| Blotato: Post Text-Only Tweet          | Blotato Post                                | Posts text-only tweet                                     | If: Does Post Need an Image? (false)       | Gmail: Send 'Post Complete' Notification        | **Blotato: Post Text-Only Tweet**: Executes posting of text-only tweet without image.                         |
| Gmail: Send 'Post Complete' Notification | Gmail (send email)                           | Sends notification email upon successful posting          | Blotato: Post Tweet with Image, Blotato: Post Text-Only Tweet | Google Sheets: Update Post Status to 'Completed' | **Gmail: Send...** -> **G-Sheets: Update...**: Notifies completion and updates status to prevent duplicates. |
| Google Sheets: Update Post Status to 'Completed' | Google Sheets (appendOrUpdate)               | Updates post status to "Completed" in Google Sheet        | Gmail: Send 'Post Complete' Notification   | -                                            |                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval: Every 4 hours.

2. **Create an OpenRouter LLM Node**  
   - Type: LangChain LLM (OpenRouter)  
   - Configure credentials with your OpenRouter API key.

3. **Create an AI Agent Node**  
   - Type: LangChain Agent  
   - Connect Trigger and OpenRouter LLM node to this node.  
   - Configure prompt with:  
     - Persona: female side hustler, late 20s, interested in AI/automation.  
     - Purpose: generate posts driving traffic to training, relatable tone, no preachy/expert style.  
     - Categories: Empathy-based and Evidence-based with subtypes.  
     - Rules: JSON output only, 120-140 char post text, include life scene based on trigger time, incorporate audience problems, no direct n8n solutions or exaggerated claims.  
     - Output format: JSON with keys target, theme, post (with index, category, trigger_time, text).

4. **Create a LangChain Output Parser Node**  
   - Type: Output Parser Structured  
   - Connect AI Agent node as input.  
   - Provide example JSON schema matching expected output structure.

5. **Add a Code Node for Text Cleanup**  
   - Type: Code (JavaScript)  
   - Paste the provided JS code that trims post text after the last punctuation or emoji.  
   - Connect from AI Agent node output.

6. **Add Google Sheets Node to Save Draft Post**  
   - Operation: Append  
   - Connect from Code Node output.  
   - Configure to write to your Google Sheet (sheet named "X Post Management") with columns: Text, Theme, Status (set to "Not Posted"), Target, Category, PostDate (current timestamp).  
   - Set credentials for Google Sheets OAuth2.

7. **Add Google Sheets Node to Retrieve Next Post**  
   - Operation: Read with filter  
   - Filter: Status equals "Not Posted"  
   - Return first match only.  
   - Connect from previous Google Sheets append node output.  
   - Use same credentials and sheet.

8. **Add an If Node to Check for Image Requirement**  
   - Condition: Check if `Category` contains "Evidence-based".  
   - Connect from the "Get Not Posted" Google Sheets node.

9. **For True Branch (Image Required):**  
   - Add Google Drive Node to Find Image by Category Name  
     - Query: Use the post’s `Category` value.  
     - Limit: 1 result.  
     - Configure with Google Drive OAuth2 credentials.  
   - Add Google Drive Node to Download Image File  
     - Use the file ID from the previous node.  
   - Add Blotato Upload Media Node  
     - Use binary data from Google Drive download.  
     - Configure Blotato API credentials.  
   - Add Blotato Post Tweet with Image Node  
     - Text: Use post `Text` from Google Sheets "Get Not Posted" node.  
     - Media URL: Use uploaded media output.  
   - Connect nodes sequentially.

10. **For False Branch (Text-Only):**  
    - Add Blotato Post Text-Only Tweet Node  
      - Text: Use post `Text` from Google Sheets "Get Not Posted" node.  
      - Configure Blotato API credentials.

11. **Add Gmail Node to Send Notification Email**  
    - Recipients: yoneda@yubipass.tokyo, yamamoto@yubipass.tokyo  
    - Subject: "Today's Post Has Been Published"  
    - Message: "The scheduled post has been successfully published to X (Twitter)."  
    - Connect from both Blotato posting nodes.

12. **Add Google Sheets Node to Update Post Status**  
    - Operation: Append or Update  
    - Match on `PostDate` from saved post.  
    - Set `Status` to "Completed".  
    - Connect from Gmail node.  
    - Use same sheet and credentials as before.

13. **Connect all nodes as per the flow:**  
    - Trigger → AI Agent → Code Cleanup → Save Draft → Get Draft → If (Image?) →  
      - True branch: Find Image → Download Image → Upload Image → Post with Image → Notify → Update Status  
      - False branch: Post Text-only → Notify → Update Status

---

### 5. General Notes & Resources

| Note Content                                                                                                           | Context or Link                                                                                                     |
|------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| The AI persona and post generation rules are designed to create relatable, engaging content that avoids preachiness or unrealistic claims. | Embedded in AI: Generate X Post Content node’s system message configuration.                                        |
| Google Sheets named "X Post Management" is essential for managing post drafts and statuses.                            | Spreadsheet URL: https://docs.google.com/spreadsheets/d/1dUVZiZkxecoYKRH3vjzgHsNbbba29o6mht0XPOX5Cq0               |
| Image files are stored in a dedicated Google Drive folder named "For X Posts" for evidence-based posts.                 | Folder URL: https://drive.google.com/drive/folders/1OO04YMDUM5OPKppjGNIlfxE_jDXA-VWK                                |
| Blotato platform is used for posting tweets and uploading media; ensure API credentials are properly configured.        | Blotato official documentation: https://docs.blotato.com (if available)                                            |
| Email notifications are sent via Gmail OAuth2; verify OAuth2 access and recipient addresses.                            | Gmail API docs: https://developers.google.com/gmail/api                                                             |

---

This document fully describes the "Automated X (Twitter) Content Engine" workflow, enabling replication, modification, and troubleshooting by users and AI agents alike.

---

**Disclaimer:** The provided text comes exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected content. All data handled is legal and public.