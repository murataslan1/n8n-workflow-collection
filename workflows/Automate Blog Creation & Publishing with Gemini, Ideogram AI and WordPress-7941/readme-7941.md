Automate Blog Creation & Publishing with Gemini, Ideogram AI and WordPress

https://n8nworkflows.xyz/workflows/automate-blog-creation---publishing-with-gemini--ideogram-ai-and-wordpress-7941


# Automate Blog Creation & Publishing with Gemini, Ideogram AI and WordPress

### 1. Workflow Overview

This automation workflow titled **"Blog Publisher – Complete AI-Powered Content Research, Creation, Optimization, and Publishing Automation"** orchestrates the end-to-end process of blog post creation and publishing using AI technologies and integration with Google Sheets, WordPress, and Discord. It targets content teams and digital marketers who want to automate blog production from topic approval to publishing, including research, writing, image generation, SEO optimization, and team notifications.

The workflow logically breaks down into the following functional blocks:

- **1.1 Input Reception & Scheduling**: Triggering the workflow and fetching client details and pending blog topics from Google Sheets.
- **1.2 Topic Filtering & Selection**: Filtering approved blog topics ready for publishing and processing one topic at a time.
- **1.3 AI Content Research & Writing**: Using Google Gemini AI to generate detailed research reports and draft blog content based on keywords and topics.
- **1.4 Quality Assurance & Optimization**: Checking the AI-generated content quality and applying fixes for readability, style, and grammar.
- **1.5 Content Preparation & Image Generation**: Extracting the blog title, preparing data for publishing, creating an AI image prompt, and generating blog cover images via Ideogram AI.
- **1.6 Publishing to WordPress**: Uploading the image, publishing the blog post, setting the image as the featured media.
- **1.7 Post-Publishing Updates & Notifications**: Updating Google Sheets with the live blog link and notifying the team on Discord.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Scheduling

**Overview:**  
This block triggers the workflow on a schedule (default disabled) and fetches client configurations from Google Sheets to know which clients/projects are active and configured for automated blog publishing.

**Nodes Involved:**  
- Schedule Trigger  
- Fetch Client Details  
- Check Blog Publishing Status

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow based on set time rules (e.g., daily at 7 AM).  
  - Config: Disabled by default; configured to run at 7 AM hourly trigger.  
  - Inputs: None (start node)  
  - Outputs: Client details fetch node  
  - Potential Failures: Scheduling misconfiguration, no trigger if disabled.

- **Fetch Client Details**  
  - Type: Google Sheets  
  - Role: Reads client/project data filtered for active automation projects related to blog publishing.  
  - Config: Filters rows where `"Project Status" = "Automation"` and `"Blog Publishing" = "Automation"`. Reads from Google Sheet with credentials.  
  - Inputs: From Schedule Trigger  
  - Outputs: Blog publishing status check  
  - Potential Failures: Google Sheets API errors, authentication failure, sheet URL misconfiguration.

- **Check Blog Publishing Status**  
  - Type: If node  
  - Role: Determines if the workflow should proceed based on the client's publishing frequency (daily or current weekday match).  
  - Config: Checks if `Weekly Frequency` field contains current weekday abbreviation or equals "Daily".  
  - Inputs: Client details  
  - Outputs: Proceeds to batch loop if true; otherwise stops workflow.  
  - Edge Cases: Empty or malformed frequency fields, timezone issues affecting current day calculation.

---

#### 2.2 Topic Filtering & Selection

**Overview:**  
This block reads the pending blog topics from Google Sheets, filtering only approved topics without a live link yet, ensuring only valid topics with keywords proceed. It processes one topic at a time.

**Nodes Involved:**  
- Loop Over Items  
- Fetch Pending Topics from Content Req & Posting  
- If (Check Focus Keyword)  
- Pass 1 Blog Topic

**Node Details:**

- **Loop Over Items**  
  - Type: Split In Batches  
  - Role: Processes each client/topic batch one by one, controlling the flow.  
  - Config: Default batch size, no special options.  
  - Inputs: From Check Blog Publishing Status  
  - Outputs: Fetch Pending Topics node or loops  
  - Edge Cases: Large batch size causing slow processing.

- **Fetch Pending Topics from Content Req & Posting**  
  - Type: Google Sheets  
  - Role: Reads topics with `"Status for Approval" = "Approved"` and `"Live Link" = "Pending"` from client sheets.  
  - Config: Uses filters to select only ready-to-publish topics.  
  - Inputs: From Loop Over Items  
  - Outputs: If node for keyword check  
  - Failures: Sheet access issues, data inconsistencies.

- **If (Check Focus Keyword)**  
  - Type: If  
  - Role: Checks if the selected topic has a non-empty `Focus Keyword`.  
  - Config: Stops workflow if empty, continues if present.  
  - Inputs: From Fetch Pending Topics  
  - Outputs: Pass 1 Blog Topic if keyword exists.  
  - Edge Cases: Missing or whitespace keywords.

- **Pass 1 Blog Topic**  
  - Type: Code  
  - Role: Selects only the first topic to process per run, preventing parallel processing errors.  
  - Config: JavaScript returns only the first item.  
  - Inputs: From If node  
  - Outputs: AI research node  
  - Edge Cases: Empty topic list.

---

#### 2.3 AI Content Research & Writing

**Overview:**  
This block uses Google Gemini AI to conduct detailed research on the blog topic and then writes an 800-1000 word SEO-optimized article in HTML format.

**Nodes Involved:**  
- Do the Research on the Topic  
- Write the Content

**Node Details:**

- **Do the Research on the Topic**  
  - Type: LangChain Agent (Google Gemini AI)  
  - Role: Generates a comprehensive, actionable research report including search intent, competitor analysis, content gaps, audience profile, keywords, and SEO outline.  
  - Config: System prompt instructs deep research with specific output requirements. Uses `Focus Keyword` and `Content Topic` from input.  
  - Inputs: From Pass 1 Blog Topic  
  - Outputs: Write the Content node  
  - Edge Cases: AI API limits, incomplete output, latency.

- **Write the Content**  
  - Type: LangChain Agent (Google Gemini AI)  
  - Role: Creates the blog content as HTML, targeting Indian investors, integrating keywords naturally, with internal links and easy readability.  
  - Config: System prompt enforces writing style, HTML tags allowed, internal linking style, and length constraints. Input includes research output and topic metadata.  
  - Inputs: From Do the Research on the Topic  
  - Outputs: Check Content Quality node  
  - Edge Cases: AI hallucination, incomplete content, token limit exceedance.

---

#### 2.4 Quality Assurance & Optimization

**Overview:**  
This block evaluates the blog content for human-like style and engagement, then applies corrections to fix grammar, punctuation, and readability issues without altering the structure.

**Nodes Involved:**  
- Check Content Quality  
- Fix the Quality Issues

**Node Details:**

- **Check Content Quality**  
  - Type: LangChain Agent (Google Gemini AI)  
  - Role: Analyzes content for conversational tone, clarity, empathy, active voice, and engagement, providing targeted feedback for improvements.  
  - Config: System prompt lists multiple quality parameters to check. Input is the blog content from previous step.  
  - Inputs: From Write the Content  
  - Outputs: Fix the Quality Issues node  
  - Edge Cases: AI misunderstanding feedback scope.

- **Fix the Quality Issues**  
  - Type: LangChain Agent (Google Gemini AI)  
  - Role: Applies corrections to content based on feedback while preserving HTML structure and meaning.  
  - Config: System prompt instructs to fix punctuation, grammar, spacing errors, and avoid additional comments or explanations.  
  - Inputs: Feedback from Check Content Quality and original content.  
  - Outputs: Extract Blog Title node or Loop Over Items (to process next topic)  
  - Edge Cases: Overcorrection, token limits.

---

#### 2.5 Content Preparation & Image Generation

**Overview:**  
This block processes the blog HTML content to separate the title, prepares final data, generates an image prompt using OpenAI, and uses Ideogram AI to create a professional blog cover image.

**Nodes Involved:**  
- Extract Blog Title  
- Prepare Final Data  
- Genererate Image Prompt  
- Image Generate  
- Download Image in Binary File

**Node Details:**

- **Extract Blog Title**  
  - Type: Code  
  - Role: Parses the HTML content to extract the first `<h1>` tag content as the blog title and removes it from the body text.  
  - Config: JavaScript regex-based extraction and string cleaning.  
  - Inputs: Fixed content from Fix the Quality Issues  
  - Outputs: Prepare Final Data node  
  - Edge Cases: Missing or malformed `<h1>` tag.

- **Prepare Final Data**  
  - Type: Set  
  - Role: Assembles required fields for publishing including blog title, content without title, auth code, website URL, and SEO sheet reference.  
  - Config: Uses data from extracted title, client details, and content.  
  - Inputs: From Extract Blog Title  
  - Outputs: Genererate Image Prompt and OpenAI Chat Model1 (image prompt generation)  
  - Edge Cases: Missing fields or incorrect references.

- **Genererate Image Prompt**  
  - Type: LangChain Agent (OpenAI Chat Model)  
  - Role: Creates a concise, vivid image prompt based on blog title and content, optimized for realistic, professional blog visuals.  
  - Config: System prompt instructs minimal, clean, realistic image prompt with specific style and color guidance.  
  - Inputs: From Prepare Final Data  
  - Outputs: Image Generate node  
  - Edge Cases: Poor prompt quality, incomplete details.

- **Image Generate**  
  - Type: HTTP Request  
  - Role: Calls Ideogram AI API to generate an image from the prompt with specified resolution and quality.  
  - Config: POST request with multipart form data, includes API key for authentication.  
  - Inputs: From Genererate Image Prompt  
  - Outputs: Download Image in Binary File node  
  - Edge Cases: API errors, rate limits, invalid API key.

- **Download Image in Binary File**  
  - Type: HTTP Request  
  - Role: Downloads the generated image from the returned URL and converts it into binary format suitable for uploading.  
  - Config: GET request to image URL, no special headers.  
  - Inputs: From Image Generate  
  - Outputs: Upload Image in Wordpress node  
  - Edge Cases: Image URL invalid or expired, network errors.

---

#### 2.6 Publishing to WordPress

**Overview:**  
This block uploads the blog cover image to WordPress, creates a new blog post with the content and embedded image, then sets the uploaded image as the post’s featured media.

**Nodes Involved:**  
- Upload Image in Wordpress  
- Publish Blog on Wordpress  
- Set Image as Featured Image

**Node Details:**

- **Upload Image in Wordpress**  
  - Type: HTTP Request  
  - Role: Uploads the blog image to WordPress Media Library using REST API with authentication.  
  - Config: POST with binary data, sets headers for content disposition, content type (image/png), and Basic Auth using stored auth code.  
  - Inputs: Binary image from Download Image in Binary File  
  - Outputs: Publish Blog on Wordpress node  
  - Edge Cases: Auth failure, file size limit, unsupported file type.

- **Publish Blog on Wordpress**  
  - Type: HTTP Request  
  - Role: Creates and publishes a new WordPress post with title, content (including embedded image), status "publish", and category "7".  
  - Config: POST with JSON body parameters, Basic Auth header.  
  - Inputs: From Upload Image in Wordpress (provides image GUID URL), and prepared content.  
  - Outputs: Set Image as Featured Image node  
  - Edge Cases: API errors, invalid category, auth issues.

- **Set Image as Featured Image**  
  - Type: HTTP Request  
  - Role: Updates the published post to assign the uploaded image as the featured media using post ID and media ID.  
  - Config: POST with query parameter `featured_media`, Basic Auth header.  
  - Inputs: Post ID from Publish Blog, media ID from Upload Image  
  - Outputs: Update Blog Status in Sheet node  
  - Edge Cases: Post or media ID mismatch, auth failure.

---

#### 2.7 Post-Publishing Updates & Notifications

**Overview:**  
After publishing, this block updates the Google Sheet with the live blog URL and sends a notification message to the team’s Discord channel to announce the new blog.

**Nodes Involved:**  
- Update Blog Status in Sheet  
- Announce New Blog

**Node Details:**

- **Update Blog Status in Sheet**  
  - Type: Google Sheets  
  - Role: Updates the blog’s row in the sheet with the live link (published URL) to keep the tracker accurate.  
  - Config: Matches rows by `S.No.`, updates "Live Link" column.  
  - Inputs: From Set Image as Featured Image  
  - Outputs: Announce New Blog node  
  - Edge Cases: Row not found, API errors.

- **Announce New Blog**  
  - Type: Discord  
  - Role: Sends a message tagging the responsible user on Discord channel with the new blog link for team awareness.  
  - Config: Uses Discord Bot API credentials, message content includes live blog link, mentions user by ID.  
  - Inputs: From Update Blog Status in Sheet  
  - Outputs: End node  
  - Edge Cases: Discord API rate limits, missing permissions.

---

### 3. Summary Table

| Node Name                      | Node Type                                   | Functional Role                                                        | Input Node(s)                      | Output Node(s)                       | Sticky Note                                                                                                                                                                                                                                                                                                                       |
|--------------------------------|---------------------------------------------|------------------------------------------------------------------------|----------------------------------|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger               | Schedule Trigger                           | Starts workflow based on schedule                                     | None                             | Fetch Client Details                |                                                                                                                                                                                                                                                                                                                                  |
| Fetch Client Details           | Google Sheets                             | Fetch active automation client data                                  | Schedule Trigger                 | Check Blog Publishing Status        | ### 🟡 Get the Client Data: "Fetches client data from Google Sheet (Auth Code, Website URL, SEO Sheet, Frequency, etc.). Only picks rows where Project Status = Active and Blog Publishing = Automation."                                                                                                                          |
| Check Blog Publishing Status   | If                                        | Checks if publishing should proceed based on frequency               | Fetch Client Details             | Loop Over Items                    | ### 🟡 Check Blog Publishing Status: "Checks the client’s publishing schedule. If Weekly Frequency matches the current day or is set to Daily, the workflow continues; otherwise, it stops."                                                                                                                                     |
| Loop Over Items               | Split In Batches                          | Processes client/topic batches sequentially                          | Check Blog Publishing Status     | Fetch Pending Topics               |                                                                                                                                                                                                                                                                                                                                  |
| Fetch Pending Topics from Content Req & Posting | Google Sheets                             | Fetches approved and pending blog topics                             | Loop Over Items                 | If (Check Focus Keyword)            | ### 🟡 Fetch Pending Topics from Content Req & Posting: "Reads the client’s sheet and selects only those topics where status is Approved and Live Link is still Pending, meaning they are ready for publishing."                                                                                                               |
| If (Check Focus Keyword)      | If                                        | Ensures Focus Keyword exists before proceeding                       | Fetch Pending Topics            | Pass 1 Blog Topic                  | ### 🟡 If condition: "Checks whether the selected topic has a Focus Keyword; if empty the process stops, if not empty the workflow continues to content creation."                                                                                                                                                                 |
| Pass 1 Blog Topic             | Code                                      | Selects first blog topic for processing                              | If (Check Focus Keyword)         | Do the Research on the Topic       | ### 🟡 Pass 1 Blog Topic: "Keeps only the first blog topic from the list so that the workflow processes one topic at a time."                                                                                                                                                                                                    |
| Do the Research on the Topic  | LangChain Agent (Google Gemini)            | Performs in-depth topic research                                    | Pass 1 Blog Topic               | Write the Content                 | ### 🟡 Do the Research on the Topic: "Generates an in-depth research report for the given keyword and topic, covering search intent, top competitors, content gaps, audience profile, trending subtopics, related keywords, and a suggested SEO-friendly blog outline."                                                            |
| Write the Content             | LangChain Agent (Google Gemini)            | Writes blog content in HTML based on research                       | Do the Research on the Topic    | Check Content Quality             | ### 🟡 Write the Content: "Creates a complete 800–1000 word blog article in clean HTML format, written in a simple and conversational style, naturally integrating keywords, adding internal links, and ensuring readability for the target audience."                                                                           |
| Check Content Quality         | LangChain Agent (Google Gemini)            | Evaluates humanized style and engagement of blog content           | Write the Content               | Fix the Quality Issues            | ### 🟡 Check Content Quality: "Analyzes the generated blog to ensure it reads like human-written content by checking tone, conversational flow, readability, sentence clarity, empathy, active voice usage, and overall engagement, then produces feedback on what to improve."                                                 |
| Fix the Quality Issues        | LangChain Agent (Google Gemini)            | Fixes content grammar and style issues                              | Check Content Quality           | Extract Blog Title, Loop Over Items | ### 🟡 Fix the Quality Issues: "Takes the feedback from the quality check and improves the content by correcting grammar, punctuation, sentence flow, and readability issues while keeping the same HTML format, structure, and overall meaning of the blog intact."                                                               |
| Extract Blog Title            | Code                                      | Extracts blog title from HTML and removes it from content body     | Fix the Quality Issues          | Prepare Final Data               | ### 🟡 Extract Blog Title: "Processes the AI-generated HTML content to extract the main <h1> title separately and remove it from the body text, ensuring the blog title and content are clean and distinct."                                                                                                                       |
| Prepare Final Data            | Set                                       | Collects all necessary data for publishing                         | Extract Blog Title              | Genererate Image Prompt           | ### 🟡 Prepare Final Data: "Collects all required fields (S. No, Blog Title, Content, Auth Code, Website URL, and OnPage SEO) into a structured format, preparing the data for final publishing to the correct WordPress site."                                                                                                       |
| Genererate Image Prompt       | LangChain Agent (OpenAI)                    | Creates AI prompt for blog cover image                             | Prepare Final Data              | Image Generate                   | ### 🟡 Sticky Note for Generate Image Prompt: "Generates a clean and professional AI image prompt from the blog title and content—keeping it realistic, minimal, and visually engaging for use in blog cover images."                                                                                                           |
| Image Generate               | HTTP Request                              | Calls Ideogram AI API to generate blog cover image                | Genererate Image Prompt         | Download Image in Binary File     | ### 🟡 Image Generate: "This node connects to the Ideogram AI API and submits the blog’s tailored image prompt with fixed quality, resolution, and count settings, generating a polished blog visual and returning its direct URL for the next steps."                                                                         |
| Download Image in Binary File | HTTP Request                              | Downloads generated image and converts it to binary               | Image Generate                 | Upload Image in Wordpress         | ### 🟡 Download Image in Binary File: "This node takes the image URL produced by Ideogram, downloads the file, and converts it into binary format, making the image immediately usable for storage, sharing, or publishing on WordPress."                                                                                           |
| Upload Image in Wordpress     | HTTP Request                              | Uploads image to WordPress media library                          | Download Image in Binary File   | Publish Blog on Wordpress         | ### 🟡 Upload Image in WordPress: "Uploads the generated blog image into the WordPress media library using REST API, assigns it a filename from the blog title, and returns a unique media ID for use in the post."                                                                                                              |
| Publish Blog on Wordpress     | HTTP Request                              | Creates and publishes WordPress post                             | Upload Image in Wordpress       | Set Image as Featured Image       | ### 🟡 Publish Blog on WordPress: "Creates and publishes a new WordPress post with the blog title, content, and embedded uploaded image, returning the post ID for further updates."                                                                                                                                           |
| Set Image as Featured Image   | HTTP Request                              | Sets uploaded image as featured image for the blog post         | Publish Blog on Wordpress       | Update Blog Status in Sheet       | ### 🟡 Set Image as Featured Image: "Updates the published blog post to assign the uploaded image as the featured thumbnail, ensuring the blog appears with a proper cover image on the website."                                                                                                                             |
| Update Blog Status in Sheet   | Google Sheets                             | Updates sheet row with live blog link                            | Set Image as Featured Image     | Announce New Blog                 | ### 🟡 Update row in sheet: "Finds the correct row in the Google Sheet using s. no. and updates it with the blog’s Live Link, keeping the publishing tracker accurate and up-to-date."                                                                                                                                         |
| Announce New Blog             | Discord                                   | Sends notification message to team Discord channel              | Update Blog Status in Sheet     | None                           | ### 🟡 Send a message (Discord): "Sends an automated notification to the project’s Discord channel, tagging the responsible person and sharing the live blog link so the team can review it immediately."                                                                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Configure to run daily at 7 AM (or as needed). Note: Initially can be disabled for manual testing.

2. **Add Google Sheets node "Fetch Client Details"**  
   - Connect from Schedule Trigger  
   - Configure Google Sheets credentials  
   - Set document URL and sheet name ("Project")  
   - Apply filters: `"Project Status" = "Automation"` and `"Blog Publishing" = "Automation"`  
   - Output all matching rows.

3. **Add If node "Check Blog Publishing Status"**  
   - Connect from Fetch Client Details  
   - Condition: Check if `Weekly Frequency` contains current weekday or equals "Daily"  
   - Use expression: `{{$now.toFormat('ccc')}}` for current day  
   - True path proceeds; false ends workflow.

4. **Add SplitInBatches node "Loop Over Items"**  
   - Connect from If (true)  
   - Default batch size to process one client at a time.

5. **Add Google Sheets node "Fetch Pending Topics from Content Req & Posting"**  
   - Connect from Loop Over Items  
   - Configure Google Sheets credentials  
   - Set document and sheet name ("Content Req & Posting")  
   - Apply filters: `"Status for Approval" = "Approved"` and `"Live Link" = "Pending"`  
   - Output matching blog topics.

6. **Add If node "If" to check Focus Keyword**  
   - Connect from Fetch Pending Topics  
   - Condition: `Focus Keyword` is not empty  
   - True path proceeds.

7. **Add Code node "Pass 1 Blog Topic"**  
   - Connect from If (true)  
   - JavaScript: Return only the first item  
   - `return [items[0]];`

8. **Add LangChain Agent node "Do the Research on the Topic" (Google Gemini)**  
   - Connect from Pass 1 Blog Topic  
   - Use Google Palm API credentials  
   - System message prompt instructing detailed research on `Focus Keyword` and `Content Topic`.

9. **Add LangChain Agent node "Write the Content" (Google Gemini)**  
   - Connect from Do the Research on the Topic  
   - System message: Write 800-1000 word blog in HTML with readability and SEO instructions, targeting Indian investors.

10. **Add LangChain Agent node "Check Content Quality" (Google Gemini)**  
    - Connect from Write the Content  
    - System prompt to evaluate conversational tone, clarity, engagement, and provide feedback.

11. **Add LangChain Agent node "Fix the Quality Issues" (Google Gemini)**  
    - Connect from Check Content Quality  
    - Pass original content and feedback  
    - System prompt to fix grammar, punctuation, and style issues without changing HTML structure.

12. **Add Code node "Extract Blog Title"**  
    - Connect from Fix the Quality Issues  
    - JS code to extract first `<h1>` content as title and remove it from content.

13. **Add Set node "Prepare Final Data"**  
    - Connect from Extract Blog Title  
    - Assign fields: S.No, Blog Title, Content (without H1), Auth Code, Website URL, OnPage SEO from client data.

14. **Add LangChain Agent node "Genererate Image Prompt" (OpenAI)**  
    - Connect from Prepare Final Data  
    - System prompt to generate a vivid, realistic image prompt based on blog title and content.

15. **Add HTTP Request node "Image Generate"**  
    - Connect from Genererate Image Prompt  
    - POST to Ideogram AI API endpoint  
    - Headers include API key  
    - Body includes prompt, resolution (1248x832), quality, and image count.

16. **Add HTTP Request node "Download Image in Binary File"**  
    - Connect from Image Generate  
    - GET request to the returned image URL  
    - Set output as binary file.

17. **Add HTTP Request node "Upload Image in Wordpress"**  
    - Connect from Download Image in Binary File  
    - POST to WordPress REST API media endpoint  
    - Attach binary image data  
    - Headers include Basic Auth with WordPress auth code  
    - Filename set to blog title with `.jpg`

18. **Add HTTP Request node "Publish Blog on Wordpress"**  
    - Connect from Upload Image in Wordpress  
    - POST to WordPress posts endpoint  
    - Body includes title, content (with embedded image), status publish, category id 7  
    - Basic Auth header.

19. **Add HTTP Request node "Set Image as Featured Image"**  
    - Connect from Publish Blog on Wordpress  
    - POST to WordPress posts endpoint with query parameter `featured_media` set to uploaded image ID  
    - Auth header included.

20. **Add Google Sheets node "Update Blog Status in Sheet"**  
    - Connect from Set Image as Featured Image  
    - Update row matching S.No. with the live blog link URL.

21. **Add Discord node "Announce New Blog"**  
    - Connect from Update Blog Status in Sheet  
    - Use Discord Bot API credentials  
    - Send message tagging the user with live blog link.

22. **Configure all credentials:**  
    - Google Sheets OAuth2  
    - Google Palm API (Gemini)  
    - OpenAI API (for image prompt)  
    - Ideogram API key  
    - WordPress Basic Auth (encoded username:password)  
    - Discord Bot API token

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                      | Context or Link                                                |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Automation summary: Fully automates blog publishing from approved topic to live post, saving manual effort and ensuring SEO-optimized, timely publishing with team notifications.                                                   | Sticky Note9 (Workflow summary)                               |
| Client data is filtered for active automation projects before processing.                                                                                                                                                         | Sticky Note (Fetch Client Details and Publishing Status)       |
| Topics are fetched only if approved and pending live link, ensuring no duplicates or incomplete topics proceed.                                                                                                                  | Sticky Note1 (Topic filtering)                                 |
| AI research provides comprehensive SEO and content strategy insights, guiding content creation.                                                                                                                                 | Sticky Note3                                                   |
| Content quality checks enforce human-like style and readability, with automatic corrections.                                                                                                                                     | Sticky Note4                                                   |
| Image generation uses realistic style prompts and Ideogram AI for professional blog visuals.                                                                                                                                     | Sticky Notes5,6                                                |
| WordPress publishing integrates post creation, media upload, and featured image assignment through REST API calls.                                                                                                              | Sticky Note7                                                   |
| Google Sheet updates and Discord notifications keep the team informed and the progress tracked.                                                                                                                                  | Sticky Note8                                                   |
| For support or inquiries, contact: info@incrementors.com or https://www.incrementors.com/contact-us/                                                                                                                              | Workflow summary note                                         |

---

**Disclaimer:**  
The provided workflow is generated and managed through n8n automation platform. It respects all applicable content policies and uses only legal and public data sources. No protected or offensive content is involved.