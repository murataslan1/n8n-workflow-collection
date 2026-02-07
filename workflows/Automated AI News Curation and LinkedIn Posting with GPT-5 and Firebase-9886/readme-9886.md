Automated AI News Curation and LinkedIn Posting with GPT-5 and Firebase

https://n8nworkflows.xyz/workflows/automated-ai-news-curation-and-linkedin-posting-with-gpt-5-and-firebase-9886


# Automated AI News Curation and LinkedIn Posting with GPT-5 and Firebase

### 1. Workflow Overview

This workflow automates the curation of AI startup news articles from an external news API, generates personalized LinkedIn posts using GPT-5 AI, and publishes these posts on LinkedIn while ensuring no duplicate posts are made. It uses Firebase Firestore to track previously posted news and prevent reposting. The workflow is scheduled to run multiple times daily at preset hours.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Time Filtering:** Initiates the workflow on a schedule and routes execution based on the current hour.
- **1.2 Previous News Retrieval:** Fetches previously posted news titles from Firebase Firestore.
- **1.3 News API Data Collection:** Calls the NewsAPI to retrieve recent AI startup news articles.
- **1.4 News Filtering & Deduplication:** Filters articles to exclude duplicates, aggregators, or invalid URLs.
- **1.5 LinkedIn Post Generation:** Uses GPT-5 AI agents to create human-like LinkedIn post text for each filtered article.
- **1.6 Post Preparation & Image Download:** Prepares post content and downloads associated article images.
- **1.7 LinkedIn Publishing:** Posts the generated content on LinkedIn, with or without images based on availability.
- **1.8 Firebase Storage Update:** Saves posted news titles back to Firebase to maintain the history and prevent reposting.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Time Filtering

- **Overview:**  
  This block triggers the workflow execution at specific hours (10:00, 12:00, 19:00, 21:00) daily and routes processing based on the current hour to handle multiple posting schedules.

- **Nodes Involved:**  
  - Hourly trigger  
  - time checker (1 to 8)

- **Node Details:**

  - **Hourly trigger**  
    - Type: Schedule Trigger  
    - Configuration: Cron expression triggers at 10:00, 12:00, 19:00, 21:00 daily (Europe/Berlin timezone).  
    - Inputs: None (initial trigger)  
    - Outputs: Triggers next node for fetching previous news.  
    - Failure Modes: Cron misconfiguration or timezone issues.

  - **time checker, time checker 2 ... time checker 8**  
    - Type: If nodes (conditional branching)  
    - Configuration: Each checks if the current hour (from trigger data) matches a specific hour (10, 12, 19, 21).  
    - Inputs: From previous node (e.g., LinkedIn Publisher or Hourly trigger)  
    - Outputs: Routes to corresponding setup nodes to handle news and posting for that specific hour.  
    - Edge cases: Incorrect or missing hour data may cause no branch to execute.

---

#### 2.2 Previous News Retrieval

- **Overview:**  
  Retrieves the list of previously posted news titles from Firebase Firestore to avoid reposting the same news.

- **Nodes Involved:**  
  - Get Previous News Titles

- **Node Details:**

  - **Get Previous News Titles**  
    - Type: Google Firebase Cloud Firestore node  
    - Configuration: Reads document with id `x20` from collection `asma` in a Firebase project (service account auth).  
    - Inputs: Trigger node output  
    - Outputs: JSON containing previously posted titles keyed as title10, title12, title19, title21, etc.  
    - Failure Modes: Firebase auth errors, missing document, network issues.

---

#### 2.3 News API Data Collection

- **Overview:**  
  Fetches news articles related to AI startups from NewsAPI.org for a specific 24-hour window.

- **Nodes Involved:**  
  - API NEWS  
  - Collect Articles

- **Node Details:**

  - **API NEWS**  
    - Type: HTTP Request node  
    - Configuration: Queries NewsAPI endpoint `/v2/everything` with parameters:  
      - q = "AI startup"  
      - language = "en"  
      - sortBy = "publishedAt"  
      - from = 48 hours ago ISO date  
      - to = 24 hours ago ISO date  
      - searchIn = "title"  
      - apiKey = (user's NewsAPI key)  
    - Inputs: Output from Firebase retrieval  
    - Outputs: JSON response including articles array  
    - Failure Modes: API key invalid, rate limits, network errors.

  - **Collect Articles**  
    - Type: Set node  
    - Configuration: Extracts the `articles` array from API NEWS response into a single variable for downstream processing.  
    - Inputs: API NEWS node  
    - Outputs: Array of article objects.  
    - Failure Modes: If API response is malformed, empty or missing articles.

---

#### 2.4 News Filtering & Deduplication

- **Overview:**  
  Filters articles to exclude duplicates, aggregators, Biztoc sources, empty URLs, or previously posted titles.

- **Nodes Involved:**  
  - Select Articles (Code node)  
  - URL checker (If node)  
  - Description Checker (If node)

- **Node Details:**

  - **Select Articles**  
    - Type: Code node (JavaScript)  
    - Configuration:  
      - Filters out articles without URL/image.  
      - Removes known aggregator domains and Biztoc sources.  
      - Groups articles by canonical topic key (cleaned title + domain) to deduplicate.  
      - Picks the highest quality article per topic based on image presence, description length, and recency.  
      - Returns top 10 most recent unique articles.  
    - Inputs: Collect Articles node  
    - Outputs: Filtered article items array  
    - Edge cases: Unexpected article data, malformed URLs, empty fields.

  - **URL checker**  
    - Type: If node  
    - Configuration: Checks multiple conditions:  
      - URL is not empty  
      - Article title is not equal to any previously posted titles from Firebase  
    - Inputs: Select Articles node  
    - Outputs: True branch to Description Checker if passes, False branch to loop back (no repost).  
    - Edge cases: Expression failures if Firebase data missing or malformed.

  - **Description Checker**  
    - Type: If node  
    - Configuration: Checks if article description is not empty.  
    - Inputs: URL checker (true branch)  
    - Outputs: True branch to LinkedIn post redaction with description, False branch to LinkedIn post redaction without description.  
    - Edge cases: Empty or null descriptions handled; branching logic critical.

---

#### 2.5 LinkedIn Post Generation

- **Overview:**  
  Generates human-like LinkedIn post texts for each approved article using GPT-5 AI agents with a natural, informal style prompt.

- **Nodes Involved:**  
  - LinkedIn post redaction (AI Agent)  
  - LinkedIn post redaction 2 (AI Agent)  
  - OpenAI Chat Model2 (AI language model)  
  - OpenAI Chat Model4 (AI language model)  
  - Simple Memory2 (Memory buffer)  
  - Simple Memory4 (Memory buffer)  
  - Structured Output Parser2 (Output parser)  
  - Structured Output Parser4 (Output parser)

- **Node Details:**

  - **LinkedIn post redaction / LinkedIn post redaction 2**  
    - Type: Langchain AI Agent nodes  
    - Configuration:  
      - Prompt instructs GPT-5 to write a casual, honest, slightly imperfect LinkedIn post explaining the startup news.  
      - Context includes article title, description (if available), and URL.  
      - Output parser expects JSON with a text field containing the post content.  
    - Inputs: Description Checker (true branch to LinkedIn post redaction, false branch to LinkedIn post redaction 2)  
    - Outputs: Generated post text  
    - Edge cases: AI service errors, prompt failures, output parsing errors.

  - **OpenAI Chat Model2 & OpenAI Chat Model4**  
    - Type: Langchain OpenAI Chat model nodes  
    - Configuration: Model set to "gpt-5".  
    - Inputs: Connected internally to respective LinkedIn post redaction nodes.  
    - Outputs: Language model responses.  
    - Failure Modes: API auth errors, rate limits, network timeouts.

  - **Simple Memory2 & Simple Memory4**  
    - Type: Langchain Memory Buffer Window nodes  
    - Configuration: Session key "52", context window length 20 messages, using custom session key.  
    - Role: Maintains conversational context for AI agents.  
    - Inputs/Outputs: Connected to corresponding AI Agent nodes.  
    - Edge cases: Memory overflow or misconfiguration may cause context loss.

  - **Structured Output Parser2 & Structured Output Parser4**  
    - Type: Langchain Structured Output Parser nodes  
    - Configuration: Expects JSON with a "text" field to parse AI output.  
    - Inputs: Connected to AI Agent nodes.  
    - Outputs: Parsed clean text for downstream usage.  
    - Failure Modes: JSON parse errors if AI output malformed.

---

#### 2.6 Post Preparation & Image Download

- **Overview:**  
  Sets up final post content and downloads article images for LinkedIn posts that include media.

- **Nodes Involved:**  
  - Post setup  
  - Post setup 2  
  - Image Downloader  
  - Image Downloader 2

- **Node Details:**

  - **Post setup / Post setup 2**  
    - Type: Set nodes  
    - Configuration:  
      - Assigns "input image url" from URL checker node's `urlToImage` field.  
      - Prepares "post" text by replacing em dashes with commas in AI-generated post text.  
    - Inputs: LinkedIn post redaction nodes  
    - Outputs: Prepared JSON for image download and publishing.  
    - Edge cases: Missing or invalid image URLs can cause downstream issues.

  - **Image Downloader / Image Downloader 2**  
    - Type: HTTP Request nodes  
    - Configuration:  
      - Downloads image file from the assigned image URL.  
      - Configured to follow redirects and return the file binary.  
      - On error, continue execution to downstream node (graceful error handling).  
    - Inputs: Post setup nodes  
    - Outputs: Binary image data for LinkedIn publishing.  
    - Failure Modes: Broken image URLs, timeouts, redirects loops.

---

#### 2.7 LinkedIn Publishing

- **Overview:**  
  Publishes the generated posts on LinkedIn, with conditional branches for posts with or without images.

- **Nodes Involved:**  
  - LinkedIn Publisher  
  - LinkedIn Publisher 2  
  - LinkedIn Publisher 3  
  - LinkedIn Publisher 4

- **Node Details:**

  - **LinkedIn Publisher / LinkedIn Publisher 3**  
    - Type: LinkedIn node  
    - Configuration: Posts with the "IMAGE" shareMediaCategory, using post text and image binary.  
    - Inputs: Image Downloader nodes  
    - Outputs: Success or failure response, then routed to time checkers.  
    - Failure Modes: LinkedIn API auth errors, rate limits, image upload failures.

  - **LinkedIn Publisher 2 / LinkedIn Publisher 4**  
    - Type: LinkedIn node  
    - Configuration: Posts without media (no image), only text content.  
    - Inputs: Image Downloader nodes or direct from post setup when no image exists  
    - Outputs: Success or failure response, then routed to time checkers.  
    - Failure Modes: LinkedIn API errors or network issues.

---

#### 2.8 Firebase Storage Update

- **Overview:**  
  Saves the titles of the news articles just posted back into Firebase Firestore to keep track and prevent reposting.

- **Nodes Involved:**  
  - set up (1 to 8)  
  - Firebase Article Saver (1 to 8)

- **Node Details:**

  - **set up (1 to 8)**  
    - Type: Set nodes  
    - Configuration: Prepares JSON with the article title keyed by the hour (e.g., title10 for 10 AM) and fixed document id "x20".  
    - Inputs: Time checker nodes (hour branching)  
    - Outputs: JSON for upsert operation to Firestore  
    - Failure Modes: Expression errors if input data missing.

  - **Firebase Article Saver (1 to 8)**  
    - Type: Google Firebase Cloud Firestore node  
    - Configuration: Upserts the prepared document into collection "asma" in Firebase with service account credentials.  
    - Inputs: set up nodes  
    - Outputs: Confirmation of write operation  
    - Failure Modes: Firebase auth failure, network issues, permission errors.

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                            | Input Node(s)                 | Output Node(s)                 | Sticky Note                                                                                  |
|---------------------------|----------------------------------|--------------------------------------------|------------------------------|-------------------------------|----------------------------------------------------------------------------------------------|
| Hourly trigger            | Schedule Trigger                 | Initiate workflow on schedule               | None                         | Get Previous News Titles       | SET UP TRIGGER                                                                              |
| Get Previous News Titles  | Firebase Firestore               | Retrieve previously posted news titles      | Hourly trigger               | API NEWS                      | GET PREVIOUS POSTED NEWS TO PREVENT FROM POSTING IT TWICE                                  |
| API NEWS                  | HTTP Request                    | Fetch AI startup news from NewsAPI          | Get Previous News Titles     | Collect Articles              | COLLECT NEWS FROM API; set API key and query parameters                                     |
| Collect Articles          | Set                            | Extract articles array from API response    | API NEWS                    | Select Articles               | FILTERING: ensure valid URLs, no duplicates, no aggregators                                |
| Select Articles           | Code                           | Filter and deduplicate articles              | Collect Articles            | URL checker                  | FILTERING: custom JS for quality and uniqueness                                            |
| URL checker               | If                             | Validate URL and check duplication           | Select Articles             | Description Checker, Collect Articles | FILTERING: skip duplicates and empty URLs                                                 |
| Description Checker       | If                             | Check if description is present               | URL checker                 | LinkedIn post redaction, LinkedIn post redaction 2 | DESCRIPTION CHECKER: verify description presence                                         |
| LinkedIn post redaction   | Langchain AI Agent             | Generate LinkedIn post with description      | Description Checker         | Post setup                   | LinkedIn post redaction: AI writes natural post text                                       |
| LinkedIn post redaction 2 | Langchain AI Agent             | Generate LinkedIn post without description   | Description Checker         | Post setup 2                 | LinkedIn post redaction: AI writes natural post text                                       |
| OpenAI Chat Model2        | Langchain OpenAI Model         | GPT-5 language model for post generation     | LinkedIn post redaction     | LinkedIn post redaction      |                                                                                              |
| OpenAI Chat Model4        | Langchain OpenAI Model         | GPT-5 language model for post generation     | LinkedIn post redaction 2   | LinkedIn post redaction 2    |                                                                                              |
| Simple Memory2            | Langchain Memory Buffer        | Maintain AI conversation context             | LinkedIn post redaction     | LinkedIn post redaction      |                                                                                              |
| Simple Memory4            | Langchain Memory Buffer        | Maintain AI conversation context             | LinkedIn post redaction 2   | LinkedIn post redaction 2    |                                                                                              |
| Structured Output Parser2 | Langchain Output Parser        | Parse AI output JSON                          | OpenAI Chat Model2          | LinkedIn post redaction      |                                                                                              |
| Structured Output Parser4 | Langchain Output Parser        | Parse AI output JSON                          | OpenAI Chat Model4          | LinkedIn post redaction 2    |                                                                                              |
| Post setup                | Set                            | Prepare post text and image URL for posting  | LinkedIn post redaction     | Image Downloader             | Post setup: set image url and clean post text                                              |
| Post setup 2              | Set                            | Prepare post text and image URL for posting  | LinkedIn post redaction 2   | Image Downloader 2           | Post setup: set image url and clean post text                                              |
| Image Downloader          | HTTP Request                   | Download image file for LinkedIn post         | Post setup                  | LinkedIn Publisher, LinkedIn Publisher 2 | Image Downloader: download media for post                                               |
| Image Downloader 2        | HTTP Request                   | Download image file for LinkedIn post         | Post setup 2                | LinkedIn Publisher 3, LinkedIn Publisher 4 | Image Downloader: download media for post                                               |
| LinkedIn Publisher        | LinkedIn                      | Publish post with image                       | Image Downloader            | time checker                 | Case 1: We post on LinkedIn with a media                                                  |
| LinkedIn Publisher 2      | LinkedIn                      | Publish post without image                    | Image Downloader            | time checker                 | Case 2: We post on LinkedIn without a media                                               |
| LinkedIn Publisher 3      | LinkedIn                      | Publish post with image                       | Image Downloader 2          | time checker 5               | Case 1: We post on LinkedIn with a media                                                  |
| LinkedIn Publisher 4      | LinkedIn                      | Publish post without image                    | Image Downloader 2          | time checker 5               | Case 2: We post on LinkedIn without a media                                               |
| set up                    | Set                            | Prepare document for Firebase save (10AM)    | time checker                | Firebase Article Saver       | SAVING IN FIRESTORE: avoid duplicate posting                                              |
| set up 2                  | Set                            | Prepare document for Firebase save (12PM)    | time checker 2              | Firebase Article Saver 2     | SAVING IN FIRESTORE: avoid duplicate posting                                              |
| set up 3                  | Set                            | Prepare document for Firebase save (7PM)     | time checker 3              | Firebase Article Saver 3     | SAVING IN FIRESTORE: avoid duplicate posting                                              |
| set up 4                  | Set                            | Prepare document for Firebase save (9PM)     | time checker 4              | Firebase Article Saver 4     | SAVING IN FIRESTORE: avoid duplicate posting                                              |
| set up 5                  | Set                            | Prepare document for Firebase save (10AM)    | time checker 5              | Firebase Article Saver 5     | SAVING IN FIRESTORE: avoid duplicate posting                                              |
| set up 6                  | Set                            | Prepare document for Firebase save (12PM)    | time checker 6              | Firebase Article Saver 6     | SAVING IN FIRESTORE: avoid duplicate posting                                              |
| set up 7                  | Set                            | Prepare document for Firebase save (7PM)     | time checker 7              | Firebase Article Saver 7     | SAVING IN FIRESTORE: avoid duplicate posting                                              |
| set up 8                  | Set                            | Prepare document for Firebase save (9PM)     | time checker 8              | Firebase Article Saver 8     | SAVING IN FIRESTORE: avoid duplicate posting                                              |
| Firebase Article Saver    | Firebase Firestore             | Save posted news titles (10AM)                 | set up                      |                              | SAVING IN FIRESTORE                                                                        |
| Firebase Article Saver 2  | Firebase Firestore             | Save posted news titles (12PM)                 | set up 2                    |                              | SAVING IN FIRESTORE                                                                        |
| Firebase Article Saver 3  | Firebase Firestore             | Save posted news titles (7PM)                  | set up 3                    |                              | SAVING IN FIRESTORE                                                                        |
| Firebase Article Saver 4  | Firebase Firestore             | Save posted news titles (9PM)                  | set up 4                    |                              | SAVING IN FIRESTORE                                                                        |
| Firebase Article Saver 5  | Firebase Firestore             | Save posted news titles (10AM)                 | set up 5                    |                              | SAVING IN FIRESTORE                                                                        |
| Firebase Article Saver 6  | Firebase Firestore             | Save posted news titles (12PM)                 | set up 6                    |                              | SAVING IN FIRESTORE                                                                        |
| Firebase Article Saver 7  | Firebase Firestore             | Save posted news titles (7PM)                  | set up 7                    |                              | SAVING IN FIRESTORE                                                                        |
| Firebase Article Saver 8  | Firebase Firestore             | Save posted news titles (9PM)                  | set up 8                    |                              | SAVING IN FIRESTORE                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node** named "Hourly trigger"  
   - Set Cron expression to trigger at 10:00, 12:00, 19:00, 21:00 daily (Europe/Berlin timezone).

2. **Create a Firebase Firestore Node** named "Get Previous News Titles"  
   - Operation: Get Document  
   - Collection: `asma`  
   - Document ID: `x20`  
   - Project ID and credentials: provide your Firebase project ID and service account credentials.

3. **Create an HTTP Request Node** named "API NEWS"  
   - Method: GET  
   - URL: `https://newsapi.org/v2/everything`  
   - Query parameters:  
     - q: "AI startup"  
     - language: "en"  
     - sortBy: "publishedAt"  
     - from: Expression `{{ new Date(Date.now() - 48*60*60*1000).toISOString() }}`  
     - to: Expression `{{ new Date(Date.now() - 24*60*60*1000).toISOString() }}`  
     - searchIn: "title"  
     - apiKey: Your NewsAPI key  
   - Connect output of "Get Previous News Titles" to this node.

4. **Create a Set Node** named "Collect Articles"  
   - Assign a new field `articles` with value `{{ $('API NEWS').item.json.articles }}`.

5. **Create a Code Node** named "Select Articles"  
   - Paste the provided JavaScript filtering and deduplication code (as described in 2.4).  
   - Connect "Collect Articles" to this node.

6. **Create an If Node** named "URL checker"  
   - Condition:  
     - URL is not empty  
     - Title does not match any previously posted titles from Firebase (check fields title10, title12, title19, title21)  
   - True branch proceeds; False branch discards article.

7. **Create an If Node** named "Description Checker"  
   - Condition: description is not empty  
   - True branch connects to "LinkedIn post redaction"  
   - False branch connects to "LinkedIn post redaction 2"

8. **Create Langchain OpenAI Chat Model Nodes** named "OpenAI Chat Model2" and "OpenAI Chat Model4"  
   - Model: GPT-5  
   - Connect to respective LinkedIn post redaction AI Agent nodes.

9. **Create Langchain Memory Buffer Nodes** named "Simple Memory2" and "Simple Memory4"  
   - Session Key: "52"  
   - Context Window Length: 20

10. **Create Langchain Structured Output Parser Nodes** named "Structured Output Parser2" and "Structured Output Parser4"  
    - JSON Schema Example: `{ "text": "" }`

11. **Create Langchain AI Agent Nodes** named "LinkedIn post redaction" and "LinkedIn post redaction 2"  
    - Insert the detailed prompt text for writing a natural LinkedIn post (see 2.5).  
    - Connect to respective OpenAI Chat Model, Memory, and Output Parser nodes.

12. **Create Set Nodes** named "Post setup" and "Post setup 2"  
    - Assign `input image url` from `urlToImage` field of URL checker.  
    - Assign `post` text from AI output text, replacing all em dashes with commas.

13. **Create HTTP Request Nodes** named "Image Downloader" and "Image Downloader 2"  
    - Method: GET  
    - URL: Expression `{{$json["input image url"]}}`  
    - Response Format: File  
    - Enable redirects  
    - On error, continue execution.

14. **Create LinkedIn Nodes** named "LinkedIn Publisher", "LinkedIn Publisher 2", "LinkedIn Publisher 3", and "LinkedIn Publisher 4"  
    - Configure with your LinkedIn person ID.  
    - "Publisher" and "Publisher 3": set `shareMediaCategory` to "IMAGE" to include media.  
    - "Publisher 2" and "Publisher 4": no media category for text-only posts.

15. **Create If Nodes** named "time checker" through "time checker 8"  
    - For routing after publishing, check the current hour from the trigger and pass to corresponding setup nodes.

16. **Create Set Nodes** named "set up" through "set up 8"  
    - Assign the posted article's title to fields like `title10`, `title12`, `title19`, or `title21` depending on hour.  
    - Include fixed document ID `x20`.

17. **Create Firebase Firestore Nodes** named "Firebase Article Saver" through "Firebase Article Saver 8"  
    - Operation: Upsert  
    - Collection: `asma`  
    - Update Key: `id`  
    - Project ID and credentials: same as previous Firebase nodes.

18. **Connect Nodes**  
    - Link all nodes as per dependencies described in section 2 and confirmed in the workflow connections.  
    - Ensure branches and error handling paths are correctly configured.

19. **Credentials Setup**  
    - Setup Firebase service account credentials in n8n credentials manager.  
    - Setup NewsAPI API key as HTTP Request credentials or environment variable.  
    - Setup LinkedIn OAuth2 credentials with appropriate permissions for posting.  
    - Setup OpenAI credentials for GPT-5 access.

20. **Test Execution**  
    - Run the workflow manually and monitor logs for errors or unexpected behaviors.  
    - Review LinkedIn posts for quality and compliance with prompt instructions.  
    - Adjust prompt or filtering logic as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                           | Context or Link                                        |
|------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| Please set up your Firebase Credentials on https://firebase.google.com/                                                | Firebase setup instruction                             |
| Please set up NewsAPI API key on https://newsapi.org/ and edit your target topic in the "q" query parameter            | NewsAPI documentation                                  |
| The AI Agent is writing the article for LinkedIn; you can adjust the prompt if needed                                  | Prompt customization advice                            |
| Saving posted news in Firestore to ensure no duplicate posting                                                        | Firebase usage explanation                             |
| LinkedIn post style: natural, spontaneous, slightly imperfect, no emojis or marketing tone, 700–1200 char length       | Content style guide in prompt                           |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow implemented with n8n, a no-code integration and automation platform. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.