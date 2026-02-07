Automate LinkedIn Content Creation with OpenAI, Notion, and Google Slides

https://n8nworkflows.xyz/workflows/automate-linkedin-content-creation-with-openai--notion--and-google-slides-11252


# Automate LinkedIn Content Creation with OpenAI, Notion, and Google Slides

### 1. Workflow Overview

This workflow automates the generation, management, and publication of LinkedIn content using a combination of OpenAI, Notion, Google Slides, Google Drive, and LinkedIn integrations. It is designed for founders or marketing teams aiming to streamline LinkedIn post creation from idea submission to scheduled publishing.

The workflow is logically divided into these blocks:

- **1.1 Input Reception**: Captures user input via a form, including a textual idea and optional file upload.
- **1.2 Content Generation**: Uses OpenAI to generate LinkedIn posts either generically or based on user ideas.
- **1.3 Post Storage & Metadata Management**: Saves generated posts and metadata into Notion, updates pages with file links if applicable.
- **1.4 Carousel Creation**: Detects posts marked for carousel creation, generates slide content with OpenAI, copies a Google Slides template, replaces text placeholders, and updates Notion with carousel links.
- **1.5 Scheduled Publishing**: Periodically checks Notion for posts scheduled to publish, determines media type, posts to LinkedIn accordingly, and updates statuses.
- **1.6 File Handling**: Manages uploaded files by saving them to Google Drive and associating links with the post entries.
- **1.7 Notifications**: Sends Gmail alerts when a LinkedIn carousel document is ready for manual action.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Captures user input through a form, which includes an idea text and an optional file upload, triggering the workflow.

**Nodes Involved:**  
- On form submission  
- file uploaded? (If node)  
- Upload file (Google Drive)  
- Set File Url (Set node)  
- Idea available? (Switch node)

**Node Details:**  

- **On form submission**  
  - *Type*: Form Trigger  
  - *Role*: Entry point capturing form data with fields: "What is your idea?" (text) and "Upload file" (file)  
  - *Config*: Webhook ID registered for form submissions  
  - *Input*: HTTP form submission  
  - *Output*: JSON with idea text and optionally binary file data  
  - *Failure modes*: Missing fields, malformed submissions

- **file uploaded?**  
  - *Type*: If node  
  - *Role*: Checks if a file was uploaded in the form submission  
  - *Config*: Condition tests existence of file binary data under 'Upload_file'  
  - *Input*: Output of "On form submission"  
  - *Output*: Two branches - file exists or not  
  - *Edge cases*: File missing or binary data corrupted

- **Upload file**  
  - *Type*: Google Drive node  
  - *Role*: Uploads the submitted file to a specified Google Drive folder  
  - *Config*: Folder and Drive IDs predefined; filename derived from form upload  
  - *Input*: Binary file data from "file uploaded?" true branch  
  - *Output*: Metadata including shareable webViewLink  
  - *Failure modes*: Drive permission errors, upload timeouts

- **Set File Url**  
  - *Type*: Set node  
  - *Role*: Extracts and stores the Google Drive file share URL for later use  
  - *Config*: Sets a JSON field "File url" to the webViewLink from upload  
  - *Input*: Output from "Upload file"  
  - *Output*: JSON with file URL

- **Idea available?**  
  - *Type*: Switch node  
  - *Role*: Determines if the user provided an idea or left it empty  
  - *Config*: Checks if 'What is your idea?' is empty string or not  
  - *Output*: Branches "No idea" and "Idea"  
  - *Input*: Output from "Set File Url" or "file uploaded?" false branch  
  - *Failure modes*: Expression evaluation errors if input missing

---

#### 1.2 Content Generation

**Overview:**  
Generates LinkedIn posts using OpenAI models based on whether an idea was provided or not.

**Nodes Involved:**  
- Create 10 LinkedIn Posts (OpenAI)  
- Create 3 LinkedIn Posts from idea (OpenAI)  
- Split Out (SplitOut)  
- Loop Over Items (SplitInBatches)  
- Set fields (Set)

**Node Details:**  

- **Create 10 LinkedIn Posts**  
  - *Type*: OpenAI LangChain node  
  - *Role*: Produces 10 generic LinkedIn posts across funnel stages (TOFU, MOFU, BOFU) when no idea is given  
  - *Config*: Uses ChatGPT-4o model with a detailed system prompt specifying output format, funnel stage breakdown, style guidelines  
  - *Output*: JSON array of posts with metadata (title, funnel stage, full text)  
  - *Failure modes*: API rate limits, prompt formatting errors

- **Create 3 LinkedIn Posts from idea**  
  - *Type*: OpenAI LangChain node  
  - *Role*: Generates 3 targeted LinkedIn posts based on the user’s provided idea  
  - *Config*: Similar model and prompt tailored for 3 posts; passes the idea as an assistant message  
  - *Output*: JSON array of 3 posts  
  - *Failure modes*: Same as above plus possible empty or irrelevant idea input

- **Split Out**  
  - *Type*: SplitOut node  
  - *Role*: Extracts the array of posts from the OpenAI response to separate items  
  - *Config*: Splits on field `message.content.posts`  
  - *Input*: Output from either OpenAI node  
  - *Output*: Individual post items

- **Loop Over Items**  
  - *Type*: SplitInBatches node  
  - *Role*: Processes posts one by one for sequential downstream processing  
  - *Config*: Default batch size (1)  
  - *Input*: Items from "Split Out"  
  - *Output*: Passes items sequentially

- **Set fields**  
  - *Type*: Set node  
  - *Role*: Maps OpenAI post fields to internal JSON structure, adds metadata fields like creation date, status (“1. Review”), type (“Post”), and user idea  
  - *Input*: Single post from "Loop Over Items"  
  - *Output*: Structured JSON for Notion insertion

---

#### 1.3 Post Storage & Metadata Management

**Overview:**  
Creates or updates Notion database pages for each generated post, adding metadata and file links if applicable.

**Nodes Involved:**  
- Create a database page (Notion)  
- File uploaded (If node)  
- Update database page (with file) (Notion)  
- Update a database page (Notion)

**Node Details:**  

- **Create a database page**  
  - *Type*: Notion node  
  - *Role*: Inserts a new page into a specified Notion database for each LinkedIn post  
  - *Config*: Database ID fixed; properties mapped from JSON fields: title, funnel stage, rich text content, status, type, idea  
  - *Input*: Output from "Set fields"  
  - *Output*: Notion page metadata including page ID  
  - *Failure modes*: API rate limits, invalid property mapping

- **File uploaded**  
  - *Type*: If node  
  - *Role*: Checks if a file was uploaded for the current post item  
  - *Config*: Tests existence of attached file binary data in current item  
  - *Input*: Output from "Create a database page"  
  - *Output*: Branches whether to update page with file or proceed

- **Update database page (with file)**  
  - *Type*: Notion node  
  - *Role*: Adds the Google Drive file URL to the Notion page’s file property  
  - *Config*: Uses page ID from created page; updates "File uploaded" property with file URL  
  - *Input*: True branch from "File uploaded"  
  - *Output*: Updated page metadata

- **Update a database page**  
  - *Type*: Notion node  
  - *Role*: Updates existing Notion pages with additional metadata or status changes  
  - *Config*: Used in various places for status updates (e.g., after post creation or carousel generation)  
  - *Input*: Variable depending on branch  
  - *Output*: Updated page

---

#### 1.4 Carousel Creation

**Overview:**  
Monitors Notion for posts flagged to create carousels. Generates slide content with OpenAI, copies a Google Slides template, replaces text placeholders, and updates Notion with the carousel link.

**Nodes Involved:**  
- Notion Trigger  
- Get many database pages (Notion)  
- Message a model (OpenAI)  
- Copy file (Google Drive)  
- Replace text (Google Slides)  
- Update a database page (Notion)

**Node Details:**  

- **Notion Trigger**  
  - *Type*: Notion Trigger  
  - *Role*: Watches the Notion database for page updates where posts are marked for carousel creation (status = "2. Create Carousel")  
  - *Config*: Polls every minute on the specified database  
  - *Output*: Updated Notion pages

- **Get many database pages**  
  - *Type*: Notion node  
  - *Role*: Retrieves all pages with status "2. Create Carousel" for batch processing  
  - *Config*: Filters on Status property equal to "2. Create Carousel"  
  - *Input*: Trigger output  
  - *Output*: Array of pages

- **Message a model**  
  - *Type*: OpenAI LangChain node  
  - *Role*: Generates detailed slide content for carousels based on post content  
  - *Config*: Uses system prompt specifying slide titles, subtitles, points, and CTA in JSON format  
  - *Input*: Post content from Notion pages  
  - *Output*: JSON with slide fields

- **Copy file**  
  - *Type*: Google Drive node  
  - *Role*: Copies a Google Slides carousel template to a new file named with the date and post title  
  - *Config*: Uses fixed template ID and destination Drive/folder IDs  
  - *Input*: Output from "Message a model" (for naming)  
  - *Output*: New Google Slides file metadata

- **Replace text**  
  - *Type*: Google Slides node  
  - *Role*: Replaces placeholders in the copied Google Slides file with generated slide content from OpenAI  
  - *Config*: Maps slide fields (PostTitle, PostSubtitle, Points, CTA) to placeholders  
  - *Input*: Presentation ID from "Copy file" and content from "Message a model"  
  - *Output*: Updated presentation

- **Update a database page (Notion)**  
  - *Type*: Notion node  
  - *Role*: Updates the Notion page with a link to the Google Slides carousel and moves status to "3. Ready for Post"  
  - *Config*: Updates "Google Carousel Link" URL property and status property  
  - *Input*: Presentation ID from Google Slides and Notion page ID  
  - *Output*: Updated Notion page

---

#### 1.5 Scheduled Publishing

**Overview:**  
Runs every minute to identify posts scheduled for publishing. Determines if posts include media and publishes them to LinkedIn accordingly, updating statuses after posting.

**Nodes Involved:**  
- Schedule Trigger  
- Get Ready Posts (Notion)  
- LinkedIn Media? (If node)  
- Get file (HTTP Request)  
- Extension (Switch)  
- Create a post (LinkedIn)  
- Create a post with image (LinkedIn)  
- Create a post with document (LinkedIn)  
- Update Notion Posted Status (Notion)  
- Send a message (Gmail)

**Node Details:**  

- **Schedule Trigger**  
  - *Type*: Schedule Trigger  
  - *Role*: Fires every minute to check for posts ready to publish  
  - *Config*: Interval set to 1 minute

- **Get Ready Posts**  
  - *Type*: Notion node  
  - *Role*: Fetches posts with status "3. Ready for Post" and scheduled date within the next 60 minutes  
  - *Config*: Filters on Status, Scheduled Date (on_or_after now, before now + 60 minutes)  
  - *Input*: Trigger output  
  - *Output*: List of posts due for publishing

- **LinkedIn Media?**  
  - *Type*: If node  
  - *Role*: Checks if a post has attached media (images or documents) to determine posting method  
  - *Config*: Tests existence of media URL in the post data  
  - *Output*: Branches for media present or absent

- **Get file**  
  - *Type*: HTTP Request  
  - *Role*: Downloads the media file from the URL for LinkedIn upload  
  - *Input*: LinkedIn media URL  
  - *Output*: Binary file data with metadata

- **Extension**  
  - *Type*: Switch node  
  - *Role*: Determines the file type (e.g., jpg or pdf) to select appropriate LinkedIn node  
  - *Input*: File extension extracted from binary metadata  
  - *Output*: Separate outputs for "jpg" or "pdf"

- **Create a post**  
  - *Type*: LinkedIn node  
  - *Role*: Posts plain text LinkedIn posts without media  
  - *Input*: Post content JSON  
  - *Output*: LinkedIn API response

- **Create a post with image**  
  - *Type*: LinkedIn node  
  - *Role*: Posts LinkedIn updates with image media attached  
  - *Input*: Text content and image binary data  
  - *Output*: LinkedIn API response

- **Create a post with document**  
  - *Type*: LinkedIn node  
  - *Role*: Posts LinkedIn updates with document media (e.g., PDF) attached  
  - *Input*: Text content and document binary data  
  - *Output*: LinkedIn API response

- **Update Notion Posted Status**  
  - *Type*: Notion node  
  - *Role*: Updates the post’s status to "4. Posted" after successful publishing  
  - *Input*: Notion page ID of published post  
  - *Output*: Updated page

- **Send a message**  
  - *Type*: Gmail node  
  - *Role*: Sends notification email prompting manual action, e.g., to add a document to LinkedIn carousel  
  - *Config*: Fixed recipient and subject line  
  - *Input*: Triggered after posting a document-type post

---

#### 1.6 File Handling

**Overview:**  
Facilitates uploading user-submitted files to Google Drive and associates those with Notion post pages.

**Nodes Involved:**  
- Covered in Input Reception and Post Storage blocks (Upload file, Set File Url, Update database page with file)

**Details:**  
This block is integrated with form submission and Notion update logic, ensuring uploaded files are stored securely and linked properly.

---

#### 1.7 Notifications

**Overview:**  
Sends Gmail alerts when LinkedIn carousel documents require manual attention after posting.

**Nodes Involved:**  
- Send a message (Gmail node)

---

### 3. Summary Table

| Node Name                      | Node Type                  | Functional Role                                    | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                   |
|-------------------------------|----------------------------|---------------------------------------------------|-------------------------------|--------------------------------|---------------------------------------------------------------|
| On form submission             | Form Trigger               | Captures user input (idea + file)                  | —                             | file uploaded?                  |                                                               |
| file uploaded?                 | If                         | Checks if a file was uploaded                       | On form submission             | Upload file, Idea available?    | Sticky Note1: Upload file to Drive                            |
| Upload file                   | Google Drive               | Uploads user file to Drive                          | file uploaded?                 | Set File Url                   | Sticky Note1: Upload file to Drive                            |
| Set File Url                  | Set                        | Stores Drive file URL for later use                 | Upload file                   | Idea available?                 | Sticky Note1: Upload file to Drive                            |
| Idea available?               | Switch                     | Branches workflow depending on idea presence       | Set File Url, file uploaded?   | Create 10 LinkedIn Posts, Create 3 LinkedIn Posts from idea | Sticky Note: Generate LinkedIn posts                          |
| Create 10 LinkedIn Posts      | OpenAI LangChain           | Generates 10 generic LinkedIn posts                 | Idea available? (No idea)      | Split Out                     | Sticky Note: Generate LinkedIn posts                          |
| Create 3 LinkedIn Posts from idea | OpenAI LangChain       | Generates 3 targeted LinkedIn posts                  | Idea available? (Idea)         | Split Out                     | Sticky Note: Generate LinkedIn posts                          |
| Split Out                    | SplitOut                   | Splits posts array into individual items            | Create 10/3 LinkedIn Posts     | Loop Over Items               | Sticky Note: Generate LinkedIn posts                          |
| Loop Over Items              | SplitInBatches             | Processes posts sequentially                         | Split Out                     | Set fields                   | Sticky Note: Save posts to Notion                             |
| Set fields                  | Set                        | Maps post fields and adds metadata                   | Loop Over Items               | Create a database page        | Sticky Note: Save posts to Notion                             |
| Create a database page       | Notion                     | Creates Notion page for each post                    | Set fields                   | File uploaded                 | Sticky Note4: Save posts to Notion                            |
| File uploaded                | If                         | Checks if file was uploaded for current post        | Create a database page        | Update database page (with file), Loop Over Items | Sticky Note4: Save posts to Notion                            |
| Update database page (with file) | Notion                 | Adds file link to Notion page                         | File uploaded                 | Loop Over Items               | Sticky Note4: Save posts to Notion                            |
| Update a database page       | Notion                     | Updates Notion pages with metadata/status            | Various                      | —                            | Sticky Note4: Save posts to Notion                            |
| Notion Trigger              | Notion Trigger             | Watches for posts flagged for carousel creation      | —                             | Get many database pages       | Sticky Note2: Create carousel                                |
| Get many database pages     | Notion                     | Retrieves posts with "Create Carousel" status        | Notion Trigger               | Message a model               | Sticky Note2: Create carousel                                |
| Message a model             | OpenAI LangChain           | Generates Google Slides carousel content             | Get many database pages       | Copy file                    | Sticky Note2: Create carousel                                |
| Copy file                   | Google Drive               | Copies Google Slides template                         | Message a model              | Replace text                 | Sticky Note2: Create carousel                                |
| Replace text                | Google Slides              | Replaces placeholders with generated content         | Copy file                   | Update a database page       | Sticky Note2: Create carousel                                |
| Update a database page      | Notion                     | Updates Notion page with Google Slides link/status   | Replace text                | —                           | Sticky Note2: Create carousel                                |
| Schedule Trigger            | Schedule Trigger           | Triggers scheduled publishing every minute           | —                             | Get Ready Posts              | Sticky Note3: Publish to LinkedIn                            |
| Get Ready Posts             | Notion                     | Retrieves posts ready to publish                       | Schedule Trigger             | LinkedIn Media?              | Sticky Note3: Publish to LinkedIn                            |
| LinkedIn Media?             | If                         | Checks if post has media attached                      | Get Ready Posts              | Get file, Create a post       | Sticky Note3: Publish to LinkedIn                            |
| Get file                   | HTTP Request               | Downloads media file for LinkedIn post                | LinkedIn Media?              | Extension                   | Sticky Note3: Publish to LinkedIn                            |
| Extension                  | Switch                     | Routes based on file extension (jpg/pdf)              | Get file                    | Create a post with image, Create a post with document | Sticky Note3: Publish to LinkedIn                            |
| Create a post              | LinkedIn                   | Posts plain text LinkedIn post                         | LinkedIn Media? (No media)   | Update Notion Posted Status  | Sticky Note3: Publish to LinkedIn                            |
| Create a post with image   | LinkedIn                   | Posts LinkedIn post with attached image                | Extension (jpg)              | Update Notion Posted Status  | Sticky Note3: Publish to LinkedIn                            |
| Create a post with document | LinkedIn                   | Posts LinkedIn post with attached document             | Extension (pdf)              | Send a message              | Sticky Note3: Publish to LinkedIn                            |
| Update Notion Posted Status | Notion                     | Marks posts as “4. Posted” after publishing            | Create a post(s)             | —                           | Sticky Note3: Publish to LinkedIn                            |
| Send a message             | Gmail                      | Sends notification email for manual carousel action   | Create a post with document  | Update Notion Posted Status  | Sticky Note3: Publish to LinkedIn                            |
| Sticky Note                | Sticky Note                | Descriptive notes for workflow sections                | —                             | —                           | Various detailed notes as summarized in main sections       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node**  
   - Name: "On form submission"  
   - Configure Webhook with fields:  
     - "What is your idea?" (text)  
     - "Upload file" (file)  
   - Set form description and title accordingly.

2. **Add an If node**  
   - Name: "file uploaded?"  
   - Condition: Check if binary data exists for "Upload_file" from form submission.

3. **Add Google Drive node**  
   - Name: "Upload file"  
   - Operation: Upload file  
   - Drive and folder IDs set to target upload location  
   - Input binary data from "file uploaded?" true branch.

4. **Add a Set node**  
   - Name: "Set File Url"  
   - Create a string field "File url" set to the webViewLink from "Upload file".

5. **Add a Switch node**  
   - Name: "Idea available?"  
   - Condition: Check if "What is your idea?" field is empty or not.  
   - Two outputs: "No idea" and "Idea".

6. **Add OpenAI LangChain nodes**  
   - "Create 10 LinkedIn Posts" connected to "Idea available?" No idea branch.  
     - Use ChatGPT-4o-latest model.  
     - System prompt instructs generation of 10 posts across funnel stages with detailed formatting.  
   - "Create 3 LinkedIn Posts from idea" connected to "Idea available?" Idea branch.  
     - Similar setup but generates 3 posts based on idea input.

7. **Add SplitOut node**  
   - Name: "Split Out"  
   - Splits posts array from OpenAI response field "message.content.posts".

8. **Add SplitInBatches node**  
   - Name: "Loop Over Items"  
   - Processes individual post items sequentially.

9. **Add Set node**  
   - Name: "Set fields"  
   - Map OpenAI post fields to JSON keys for Notion.  
   - Add metadata: creation date, status ("1. Review"), type ("Post"), and idea text.

10. **Add Notion node**  
    - Name: "Create a database page"  
    - Resource: databasePage  
    - Database ID: your LinkedIn posts database  
    - Map properties: Title, Funnel Stage, Post Content, Status, Type, Idea.

11. **Add If node**  
    - Name: "File uploaded"  
    - Checks if a file URL exists for the item.

12. **Add Notion node**  
    - Name: "Update database page (with file)"  
    - Updates the created page to include the file URL in a file property.

13. **Add Notion Trigger node**  
    - Name: "Notion Trigger"  
    - Event: Page updated in database  
    - Filter: Status equals "2. Create Carousel"  
    - Poll every minute.

14. **Add Notion node**  
    - Name: "Get many database pages"  
    - Get all pages with status "2. Create Carousel".

15. **Add OpenAI LangChain node**  
    - Name: "Message a model"  
    - Generate Google Slides carousel content with detailed slide fields.

16. **Add Google Drive node**  
    - Name: "Copy file"  
    - Copies Google Slides template file to new file named with current date and post title.

17. **Add Google Slides node**  
    - Name: "Replace text"  
    - Replace placeholders in copied presentation using values from OpenAI output.

18. **Add Notion node**  
    - Name: "Update a database page"  
    - Update Notion page with Google Slides link and status "3. Ready for Post".

19. **Add Schedule Trigger node**  
    - Name: "Schedule Trigger"  
    - Fires every minute.

20. **Add Notion node**  
    - Name: "Get Ready Posts"  
    - Filters posts with status "3. Ready for Post" and scheduled date within next 60 minutes.

21. **Add If node**  
    - Name: "LinkedIn Media?"  
    - Checks if media URL exists.

22. **Add HTTP Request node**  
    - Name: "Get file"  
    - Downloads media file from URL.

23. **Add Switch node**  
    - Name: "Extension"  
    - Routes based on file extension (jpg or pdf).

24. **Add LinkedIn nodes**  
    - "Create a post" for text-only posts  
    - "Create a post with image" for jpg images  
    - "Create a post with document" for pdf documents  
    - All configured with LinkedIn OAuth2 credentials.

25. **Add Notion node**  
    - Name: "Update Notion Posted Status"  
    - Updates post status to "4. Posted".

26. **Add Gmail node**  
    - Name: "Send a message"  
    - Sends notification email for manual action on document posts.

27. **Connect nodes according to logical flow** as described in the workflow overview and connections.

28. **Set up credentials** for:  
    - OpenAI (API key)  
    - Notion (API token with database access)  
    - Google Drive (OAuth2)  
    - Google Slides (OAuth2)  
    - LinkedIn (OAuth2)  
    - Gmail (OAuth2)

29. **Create Notion database** with properties:  
    - Title (title)  
    - Funnel Stage (select)  
    - Post Content (rich_text)  
    - Status (status)  
    - Type (select)  
    - Idea (rich_text)  
    - File uploaded (files)  
    - Google Carousel Link (url)  
    - Scheduled Date (date)

30. **Build Google Slides template** with placeholders matching keys sent in "Replace text" node.

31. **Test end-to-end** by submitting the form with and without an idea and optional file upload.

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow automates LinkedIn content generation from idea submission to posting, including carousel creation and scheduling.    | Overview and design intent                                                                          |
| OpenAI prompts are crafted to generate posts with funnel stage logic and LinkedIn-optimized style.                                   | See "Create 10 LinkedIn Posts" and "Create 3 LinkedIn Posts from idea" nodes' system prompts        |
| Notion database schema must include specific properties for managing content lifecycle and metadata.                                | See section 4, step 29                                                                              |
| Google Slides template requires placeholders exactly matching keys: PostTitle, PostSubtitle, PointOneTitle, PointOneSubtitle, etc.   | See "Replace text" node configuration                                                              |
| LinkedIn OAuth2 requires person ID setup for posting on behalf of the user or organization.                                          | Person ID used: "X0o56YS955"                                                                        |
| Schedule Trigger frequency is one minute to ensure timely publishing and monitoring.                                                 | See "Schedule Trigger" node                                                                         |
| Gmail notifications alert manual steps for LinkedIn documents in carousels.                                                         | See "Send a message" node                                                                           |
| Workflow tested with n8n version supporting LangChain OpenAI nodes and recent Notion/Google integration nodes.                      | Version-specific requirements: OpenAI node uses LangChain integration, Notion nodes v2.2+           |

---

This comprehensive documentation covers all nodes and logic within the LinkedIn content automation workflow, enabling full understanding, modification, and reproduction without requiring the original JSON export.