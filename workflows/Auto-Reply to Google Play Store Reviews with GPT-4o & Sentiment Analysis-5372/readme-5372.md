Auto-Reply to Google Play Store Reviews with GPT-4o & Sentiment Analysis

https://n8nworkflows.xyz/workflows/auto-reply-to-google-play-store-reviews-with-gpt-4o---sentiment-analysis-5372


# Auto-Reply to Google Play Store Reviews with GPT-4o & Sentiment Analysis

### 1. Workflow Overview

This workflow automates personalized reply generation to new Google Play Store app reviews by leveraging GPT-4o language models combined with sentiment analysis. It targets app developers and customer success teams seeking to improve user engagement and experience through timely, context-aware, and emotionally intelligent responses to user feedback.

The workflow is logically divided into these main functional blocks:

- **1.1 Review Retrieval:** Scheduled fetching of new reviews from Google Play Store using Google Service Account credentials.
- **1.2 Review Filtering:** Identification of unreplied reviews to avoid duplicate responses.
- **1.3 Sentiment Analysis:** Use of OpenAI GPT-4o to analyze the sentiment, key points, and alignment of star ratings with review content.
- **1.4 Sentiment Verification:** Additional OpenAI step to verify and refine the sentiment analysis accuracy.
- **1.5 Reply Generation:** AI Agent generates a concise, friendly, and personalized reply based on the review, sentiment summary, app features, and tone guidelines.
- **1.6 Reply Posting & Logging:** Posting the AI-generated reply back to the Play Store and sending a notification with the reply details to a Slack channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Review Retrieval

- **Overview:** This block triggers periodically and fetches the latest app reviews from the Google Play Store using the Google Publisher API.
- **Nodes Involved:** Schedule Trigger, HTTPS
- **Node Details:**

  - **Schedule Trigger**
    - Type: Trigger node that executes the workflow every 15 minutes.
    - Configuration: Interval of 15 minutes.
    - Input/Output: No input; output triggers HTTPS node.
    - Edge Cases: Disabled by default; if enabled, network failures or API quota issues may occur.
  
  - **HTTPS**
    - Type: HTTP Request to Google Play Developer API.
    - Configuration: URL set to fetch reviews for specified app package; uses Google Service Account credentials for authentication.
    - Expressions: Dynamic URL referencing app package and review IDs.
    - Input: Triggered by Schedule Trigger.
    - Output: JSON containing reviews array.
    - Edge Cases: API permission errors, rate limits, or invalid credentials.

#### 2.2 Review Filtering

- **Overview:** Filters out reviews that already have developer replies to avoid redundant responses.
- **Nodes Involved:** Filter
- **Node Details:**

  - **Filter**
    - Type: IF node with string existence check.
    - Configuration: Checks if `developerComment.text` exists for the first comment of the review.
    - Input: Output from HTTPS node.
    - Output: Passes reviews without developer replies; rejects those with replies.
    - Edge Cases: If review structure changes or missing fields, expression evaluation may fail.

#### 2.3 Sentiment Analysis

- **Overview:** Analyzes the filtered review text and star rating with OpenAI GPT-4o to generate a sentiment summary including key points, user experience, notable quotes, rating alignment, and actionable steps.
- **Nodes Involved:** OpenAI
- **Node Details:**

  - **OpenAI**
    - Type: OpenAI Language Model node.
    - Configuration: Uses "chatgpt-4o-latest" model.
    - Prompt: Custom prompt instructing analysis of review content and rating.
    - Input: Review text and rating from Filter node.
    - Output: Sentiment summary text.
    - Credentials: OpenAI API key.
    - Edge Cases: API rate limits, timeouts, or malformed input.

#### 2.4 Sentiment Verification

- **Overview:** Refines the sentiment analysis by having a senior customer success assistant AI review the initial summary for completeness and accuracy.
- **Nodes Involved:** Merge1, Verify Analysis, Merge
- **Node Details:**

  - **Merge1**
    - Type: Merge node combining filtered review data and initial sentiment analysis.
    - Configuration: Mode "combine" by position.
    - Input: Reviews from HTTPS and sentiment summary from OpenAI.
  
  - **Verify Analysis**
    - Type: OpenAI Language Model node.
    - Configuration: Same "chatgpt-4o-latest" model.
    - Prompt: Checks if sentiment summary covers all user messages and rating context.
    - Input: Combined data from Merge1.
    - Output: Verified sentiment summary.
    - Credentials: OpenAI API key.
  
  - **Merge**
    - Type: Merge node combining verified sentiment summary and raw review data.
    - Configuration: Mode "combine" by position.
    - Input: Verified summary and original review.
    - Output: Data for AI reply generation.

#### 2.5 Reply Generation

- **Overview:** Generates a personalized, friendly, and concise reply text using a Langchain AI Agent with custom memory and prompt instructions.
- **Nodes Involved:** User Review Memory4, OpenAI GPT 4o mini4, AI Agent
- **Node Details:**

  - **User Review Memory4**
    - Type: Langchain memory buffer node.
    - Configuration: Maintains context window length 1 per custom session key.
    - Additional info: Contains app branding, feature list, tone guidelines, escalation contacts, and reply rules as embedded notes.
    - Input: None explicitly; connected to AI Agent.
  
  - **OpenAI GPT 4o mini4**
    - Type: Langchain OpenAI LM node.
    - Configuration: Model "gpt-4o-mini".
    - Input: Connected to AI Agent language model input.
  
  - **AI Agent**
    - Type: Langchain Agent node.
    - Configuration: Extensive prompt to craft replies respecting tone, length, personalization, and business logic like escalation contacts and feature mentions.
    - Input: Combined review data and verified sentiment summary.
    - Output: Reply text limited to 350 characters, informal and empathetic tone, includes emojis.
    - Edge Cases: Incorrect or incomplete context memory may affect reply quality.

#### 2.6 Reply Posting & Logging

- **Overview:** Posts the AI-generated reply back to the Google Play Store and sends a notification with details to a Slack channel.
- **Nodes Involved:** Post Reply to Play Store4, Slack4
- **Node Details:**

  - **Post Reply to Play Store4**
    - Type: HTTP Request node.
    - Configuration: POST method to Google Play Developer API reply endpoint with reply text in JSON body.
    - Authentication: Google Service Account credentials.
    - Input: Reply generated by AI Agent.
    - Output: API response.
    - Edge Cases: API permission errors, rate limits, malformed reply text.
  
  - **Slack4**
    - Type: Slack node.
    - Configuration: Sends formatted message to "#general" channel including review author, rating, review text, and AI reply.
    - Credentials: Slack Bot OAuth token.
    - Input: From Post Reply node output.
    - Edge Cases: Slack API rate limits or invalid channel configuration.

---

### 3. Summary Table

| Node Name               | Node Type                               | Functional Role                 | Input Node(s)        | Output Node(s)          | Sticky Note                                                                                                  |
|-------------------------|---------------------------------------|--------------------------------|----------------------|-------------------------|--------------------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger                      | Triggers periodic review fetch | None                 | HTTPS                   |                                                                                                              |
| HTTPS                   | HTTP Request                         | Fetch reviews from Play Store  | Schedule Trigger      | Filter, Merge1, Merge    | ## Fetch Reviews from Play Store                                                                             |
| Filter                  | IF Node                             | Filter unreplied reviews       | HTTPS                | OpenAI (pass), discard  | ## Filter Unreplied Reviews                                                                                   |
| OpenAI                  | OpenAI Language Model                | Sentiment analysis of reviews  | Filter                | Merge1                  | ## Detect Review Sentiment                                                                                    |
| Merge1                  | Merge                              | Combine review and sentiment   | HTTPS, OpenAI         | Verify Analysis         | ## Merge Review + Sentiment                                                                                   |
| Verify Analysis         | OpenAI Language Model                | Verify/refine sentiment analysis| Merge1                | Merge                   | ## Verify Sentiment Analysis & Review                                                                         |
| Merge                   | Merge                              | Combine verified summary & review| Verify Analysis, HTTPS| AI Agent                | ## Merge Inputs for Reply                                                                                      |
| User Review Memory4     | Langchain Memory Buffer             | Maintain context & guidelines  | None                 | AI Agent                | Brand, features, tone guidelines, escalation contacts, reply rules embedded                                   |
| OpenAI GPT 4o mini4     | Langchain OpenAI LM                 | Provide LM for AI Agent        | AI Agent (ai_languageModel)| AI Agent            |                                                                                                              |
| AI Agent                | Langchain Agent                    | Generate personalized reply    | Merge, User Review Memory4, OpenAI GPT 4o mini4 | Post Reply to Play Store4 | ## AI Customer Success Assistant                                                                              |
| Post Reply to Play Store4| HTTP Request                       | Post reply to Google Play      | AI Agent              | Slack4                  | ## Post Reply to Play Store                                                                                   |
| Slack4                  | Slack Node                         | Log reply to Slack channel     | Post Reply to Play Store4 | None                  | ## Send Reply Log to Slack                                                                                     |
| Sticky Note5-14         | Sticky Note                        | Documentation and annotations  | Various               | Various                 | Multiple notes describing block functions, setup instructions, and usage tips                                 |
| Sticky Note (Setup)     | Sticky Note                        | Setup instructions overview    | None                  | None                    | Detailed setup instructions for credentials and node customization; contact info for support                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**
   - Type: Schedule Trigger
   - Configure to run every 15 minutes.
   - Leave disabled initially if testing manually.

2. **Create HTTPS Node**
   - Type: HTTP Request
   - Set URL: `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/your.app.package.name/reviews`
   - Authentication: Use Google Service Account credentials with access to Play Console (View app reviews permission).
   - Method: GET
   - Connect Schedule Trigger → HTTPS.

3. **Create Filter Node**
   - Type: IF Node
   - Condition: Check if `reviews[0].comments[1].developerComment.text` exists (string exists).
   - Input: Connect HTTPS → Filter.
   - Output TRUE branch: Discard (no connection).
   - Output FALSE branch: Continue processing.

4. **Create OpenAI Node for Sentiment Analysis**
   - Type: OpenAI (Langchain)
   - Model: `chatgpt-4o-latest`
   - Prompt: Custom prompt analyzing review text and rating for sentiment, key points, quotes, alignment, and actionable steps.
   - Credentials: Configure OpenAI API key.
   - Connect Filter FALSE branch → OpenAI.

5. **Create Merge1 Node**
   - Type: Merge
   - Mode: Combine by position.
   - Inputs: Output of HTTPS and OpenAI.
   - Connect HTTPS output → Merge1 input 1; OpenAI output → Merge1 input 2.

6. **Create Verify Analysis Node**
   - Type: OpenAI (Langchain)
   - Model: `chatgpt-4o-latest`
   - Prompt: Senior customer success assistant reviewing sentiment summary accuracy.
   - Credentials: Use same OpenAI API key.
   - Connect Merge1 → Verify Analysis.

7. **Create Merge Node**
   - Type: Merge
   - Mode: Combine by position.
   - Inputs: Verify Analysis output and original HTTPS review data.
   - Connect Verify Analysis → Merge input 1; HTTPS → Merge input 2.

8. **Create User Review Memory Node**
   - Type: Langchain Memory Buffer
   - Session Key: `yourapp_memory`
   - Context Window Length: 1
   - Notes: Embed app branding, feature list, tone guidelines, escalation contacts, and reply rules.
   - No input; connects to AI Agent.

9. **Create OpenAI GPT 4o mini Node**
   - Type: Langchain OpenAI LM
   - Model: `gpt-4o-mini`
   - Credentials: OpenAI API key.
   - Connect to AI Agent's language model input.

10. **Create AI Agent Node**
    - Type: Langchain Agent
    - Prompt: Detailed prompt instructing how to generate personalized replies with length, tone, and escalation constraints.
    - Input: Connect Merge → AI Agent; User Review Memory and OpenAI GPT 4o mini → AI Agent ai_memory and ai_languageModel inputs respectively.
    - Output: Reply text.

11. **Create Post Reply to Play Store Node**
    - Type: HTTP Request
    - Method: POST
    - URL: `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/your.app.package.name/reviews/{{reviewId}}:reply`
    - Body: JSON with `replyText` set to AI Agent output.
    - Authentication: Google Service Account credentials.
    - Connect AI Agent → Post Reply node.

12. **Create Slack Node (optional)**
    - Type: Slack
    - Action: Send message to `#general` channel.
    - Message: Formatted text including review author, rating, review text, and AI reply.
    - Credentials: Slack Bot token.
    - Connect Post Reply → Slack.

13. **Configure Credentials**
    - Google Service Account with access to Play Console reviews.
    - OpenAI API key with access to GPT-4o and GPT-4o-mini.
    - Slack Bot token if Slack notifications are desired.

14. **Activate Schedule Trigger**
    - Enable to automatically run every 15 minutes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                           | Context or Link                                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| To configure the Google Play API access, create a Google Cloud Service Account with Play Console API permissions "View app reviews". Download the JSON key and add it as credentials in n8n.                                                                                                             | Google Play Developer API documentation                                |
| OpenAI API keys are required for GPT-4o and GPT-4o-mini models. You can adjust the temperature or model versions depending on response style preferences.                                                                                                                                             | OpenAI API documentation                                               |
| Slack notifications are optional but recommended for team awareness. Create a Slack App, generate a Bot token, invite it to the channel, and add the token as credentials in n8n.                                                                                                                      | Slack API documentation                                                |
| The embedded prompt and memory buffer contain business-specific rules including tone guidelines (friendly, helpful, warm), length limits (350 chars), greeting and signature style, escalation contacts, and reply rules to avoid overpromising or repeating user words verbatim.                           | Customization point for user-specific style                           |
| Contact the workflow author at 📩 imarunavadas@gmail.com for setup assistance or customization services.                                                                                                                                                                                               | Contact Info                                                           |
| This workflow respects content policies and operates on legal, public data only.                                                                                                                                                                                                                       | Disclaimer                                                            |
| For detailed setup instructions and troubleshooting, refer to the Sticky Note titled "🛠️ Setup Instructions for This Workflow" within the workflow.                                                                                                                                                 | Internal workflow documentation                                       |

---

This document fully captures the structure, logic, and necessary details to understand, reproduce, and maintain the "Auto-Reply to Google Play Store Reviews with GPT-4o & Sentiment Analysis" n8n workflow.