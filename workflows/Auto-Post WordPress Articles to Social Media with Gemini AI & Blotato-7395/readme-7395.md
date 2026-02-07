Auto-Post WordPress Articles to Social Media with Gemini AI & Blotato

https://n8nworkflows.xyz/workflows/auto-post-wordpress-articles-to-social-media-with-gemini-ai---blotato-7395


# Auto-Post WordPress Articles to Social Media with Gemini AI & Blotato

### 1. Workflow Overview

This workflow automates the process of posting new WordPress blog articles to social media platforms using AI-generated, platform-optimized content. It is designed for content creators, marketers, or businesses who want to streamline and customize their social media presence based on their WordPress posts.

**Logical Blocks:**

- **1.1 Scheduled Trigger & WordPress Monitoring:**  
  Regularly checks for new posts on a WordPress site.

- **1.2 New Post Filtering & Splitting:**  
  Filters out when no new posts exist and prepares individual posts for processing.

- **1.3 AI Content Generation:**  
  Invokes Google Gemini AI to generate tailored social media posts for Twitter, LinkedIn, and Facebook.

- **1.4 Parsing AI Output:**  
  Parses the AI-generated JSON content safely, with fallbacks for parsing errors.

- **1.5 Social Media Posting via Blotato:**  
  Publishes the generated posts to respective social media platforms using Blotato API nodes.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & WordPress Monitoring

- **Overview:**  
  Initiates workflow every 30 minutes, fetching all posts from WordPress.

- **Nodes Involved:**  
  - Every 30 Minutes  
  - Check New Posts

- **Node Details:**

  - **Every 30 Minutes**  
    - Type: Schedule Trigger  
    - Role: Periodically triggers the workflow every 30 minutes.  
    - Configuration: Interval set to 30 minutes (field: minutes).  
    - Inputs: None (trigger node).  
    - Outputs: Connects to "Check New Posts".  
    - Edge Cases: If n8n instance is offline, schedule misses triggers; no retry logic here.

  - **Check New Posts**  
    - Type: WordPress node  
    - Role: Retrieves all WordPress posts using WordPress API.  
    - Configuration: Operation "getAll" with default options (no filters).  
    - Inputs: Triggered by "Every 30 Minutes".  
    - Outputs: JSON array of posts to "Filter New Posts".  
    - Edge Cases:  
      - WordPress API authentication failure.  
      - Network/timeouts.  
      - Large post volumes may cause delays or rate limits.

#### 2.2 New Post Filtering & Splitting

- **Overview:**  
  Checks if there are new posts (length > 0), then splits posts individually for separate handling.

- **Nodes Involved:**  
  - Filter New Posts  
  - Split Out

- **Node Details:**

  - **Filter New Posts**  
    - Type: If node  
    - Role: Conditions check if returned posts list length is greater than zero.  
    - Configuration: Expression `{{$json.length}} > 0` in condition.  
    - Inputs: From "Check New Posts".  
    - Outputs: Passes if true to "Split Out", else stops workflow.  
    - Edge Cases: Empty result sets stop workflow gracefully.

  - **Split Out**  
    - Type: Split Out node  
    - Role: Splits array of posts into individual items for parallel processing.  
    - Configuration: Default array split.  
    - Inputs: From "Filter New Posts".  
    - Outputs: Each post item to "AI Social Content Creator".  
    - Edge Cases: If input is not an array or empty, downstream nodes receive no data.

#### 2.3 AI Content Generation

- **Overview:**  
  Uses Google Gemini AI via LangChain Agent node to generate social media posts customized for each platform.

- **Nodes Involved:**  
  - Google Gemini Chat Model  
  - AI Social Content Creator

- **Node Details:**

  - **Google Gemini Chat Model**  
    - Type: LangChain Google Gemini LM Chat node  
    - Role: Provides AI language model backend credentials for the agent.  
    - Configuration: Credentials set to Google Palm API with provided API key.  
    - Inputs: None directly; connected to "AI Social Content Creator" as language model.  
    - Outputs: Provides AI responses to "AI Social Content Creator".  
    - Edge Cases: API key invalid, quota exceeded, network issues.

  - **AI Social Content Creator**  
    - Type: LangChain Agent node  
    - Role: Sends blog post data to AI with prompt to generate JSON-formatted social media content.  
    - Configuration:  
      - System message instructs to act as social media manager.  
      - Requests only valid JSON with keys: twitter, linkedin, facebook.  
      - Enforces platform-specific tone, content length, hashtags.  
    - Inputs: Individual post data from "Split Out".  
    - Outputs: AI-generated JSON to "Parse Social Content".  
    - Edge Cases: AI may return invalid JSON, incomplete output, or errors.

#### 2.4 Parsing AI Output

- **Overview:**  
  Parses AI JSON output safely, removing markdown formatting and providing fallback content if parsing fails.

- **Nodes Involved:**  
  - Parse Social Content

- **Node Details:**

  - **Parse Social Content**  
    - Type: Code (JavaScript) node  
    - Role:  
      - Cleans AI output to remove markdown code blocks.  
      - Parses JSON string to extract social media text content.  
      - On JSON parse failure, falls back to default post title and link concatenations.  
    - Configuration: Custom JS code using `$input.all()` to process all incoming items.  
    - Inputs: AI JSON output from "AI Social Content Creator".  
    - Outputs: Parsed social media text fields and metadata to three Blotato posting nodes.  
    - Edge Cases:  
      - AI output malformed or missing JSON.  
      - Unexpected data structures.

#### 2.5 Social Media Posting via Blotato

- **Overview:**  
  Posts the generated social media content to Twitter, LinkedIn, and Facebook using Blotato API nodes.

- **Nodes Involved:**  
  - Create post Facebook  
  - Create post LinkedIn  
  - Create post twitter

- **Node Details:**

  - **Create post Facebook**  
    - Type: Blotato node (Facebook)  
    - Role: Posts text content to Facebook page via Blotato API.  
    - Configuration:  
      - Platform set to "facebook".  
      - Uses accountId and facebookPageId from credentials or list mode.  
      - Sends postContentText from parsed AI output (`{{$json.facebook}}`).  
    - Inputs: From "Parse Social Content".  
    - Outputs: None downstream.  
    - Edge Cases:  
      - API authentication failures.  
      - Invalid page ID.  
      - Rate limits or network errors.

  - **Create post LinkedIn**  
    - Type: Blotato node (LinkedIn)  
    - Role: Posts LinkedIn content similarly.  
    - Configuration:  
      - Platform set to "linkedin".  
      - Uses accountId credential.  
      - Posts content from `{{$json.linkedin}}`.  
    - Inputs: From "Parse Social Content".  
    - Outputs: None downstream.  
    - Edge Cases: Same as Facebook node.

  - **Create post twitter**  
    - Type: Blotato node (Twitter)  
    - Role: Posts Twitter tweet content.  
    - Configuration:  
      - Note: Platform is incorrectly set to "linkedin" in the JSON, which is likely an error; should be "twitter".  
      - Uses accountId credential.  
      - Posts content from `{{$json.twitter}}`.  
    - Inputs: From "Parse Social Content".  
    - Outputs: None downstream.  
    - Edge Cases:  
      - Same authentication and posting issues.  
      - Platform misconfiguration may cause posting failures.

---

### 3. Summary Table

| Node Name             | Node Type                          | Functional Role                              | Input Node(s)        | Output Node(s)                     | Sticky Note                                                                                          |
|-----------------------|----------------------------------|----------------------------------------------|----------------------|----------------------------------|----------------------------------------------------------------------------------------------------|
| Sticky Note           | Sticky Note                      | Documentation and overview                    | None                 | None                             | ## WordPress to Blotato Social Publisher; Author: David Olusola; Setup instructions and features... |
| Every 30 Minutes      | Schedule Trigger                 | Triggers workflow every 30 minutes            | None                 | Check New Posts                  |                                                                                                    |
| Check New Posts       | WordPress                       | Fetches all WordPress posts                    | Every 30 Minutes      | Filter New Posts                 |                                                                                                    |
| Filter New Posts      | If                              | Checks if any new posts exist                   | Check New Posts       | Split Out                       |                                                                                                    |
| Split Out             | Split Out                       | Splits posts array into individual items       | Filter New Posts      | AI Social Content Creator       |                                                                                                    |
| Google Gemini Chat Model | LangChain Google Gemini LM Chat | Provides AI language model backend              | None (connected as LM)| AI Social Content Creator (AI LM) |                                                                                                    |
| AI Social Content Creator | LangChain Agent                | Generates social media posts via AI             | Split Out             | Parse Social Content            |                                                                                                    |
| Parse Social Content  | Code                            | Parses AI JSON output and fallback generation  | AI Social Content Creator | Create post Facebook, LinkedIn, twitter |                                                                                                    |
| Create post Facebook  | Blotato (Facebook)              | Posts content to Facebook                        | Parse Social Content  | None                           |                                                                                                    |
| Create post LinkedIn  | Blotato (LinkedIn)              | Posts content to LinkedIn                        | Parse Social Content  | None                           |                                                                                                    |
| Create post twitter   | Blotato (Twitter)               | Posts content to Twitter (platform misconfigured as LinkedIn) | Parse Social Content  | None                           |                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Name: "Every 30 Minutes"  
   - Type: Schedule Trigger  
   - Set interval to every 30 minutes (Minutes field).  
   - No credentials needed.

2. **Add WordPress node**  
   - Name: "Check New Posts"  
   - Type: WordPress  
   - Operation: "getAll" to fetch all posts.  
   - Configure WordPress credentials (API URL, authentication).  
   - Connect input from "Every 30 Minutes" node.

3. **Add If node**  
   - Name: "Filter New Posts"  
   - Condition: Check if length of incoming items array is greater than 0.  
   - Expression: `{{$json.length}} > 0` using "Number" > 0 condition.  
   - Connect input from "Check New Posts".  
   - True output connects to next step; false ends workflow.

4. **Add Split Out node**  
   - Name: "Split Out"  
   - Default settings to split array into individual items.  
   - Connect input from "Filter New Posts" true output.

5. **Add LangChain Google Gemini Chat Model node**  
   - Name: "Google Gemini Chat Model"  
   - Configure credentials with Google Palm API key.  
   - No direct input; will connect as language model in next node.

6. **Add LangChain Agent node**  
   - Name: "AI Social Content Creator"  
   - Set system message prompt:  
     *You are a social media manager. Based on the provided blog post, create platform-specific social media posts. Return ONLY valid JSON in this format: {"twitter": "Tweet content with hashtags (280 chars max)", "linkedin": "Professional LinkedIn post with insights", "facebook": "Engaging Facebook post with call-to-action"}. Make each post engaging and platform-appropriate.*  
   - Connect input from "Split Out".  
   - Set AI language model to "Google Gemini Chat Model" node.

7. **Add Code node**  
   - Name: "Parse Social Content"  
   - Paste the JS code to:  
     - Remove markdown from AI output  
     - Parse JSON safely  
     - Fallback to default text if parsing fails  
   - Connect input from "AI Social Content Creator".

8. **Add Blotato node for Facebook**  
   - Name: "Create post Facebook"  
   - Platform: facebook  
   - Configure accountId and facebookPageId (list mode or credentials).  
   - Set postContentText to `{{$json.facebook}}` from parsed output.  
   - Connect input from "Parse Social Content".

9. **Add Blotato node for LinkedIn**  
   - Name: "Create post LinkedIn"  
   - Platform: linkedin  
   - Configure accountId.  
   - Set postContentText to `{{$json.linkedin}}`.  
   - Connect input from "Parse Social Content".

10. **Add Blotato node for Twitter**  
    - Name: "Create post twitter"  
    - Platform: twitter (correct the misconfiguration from linkedin to twitter).  
    - Configure accountId.  
    - Set postContentText to `{{$json.twitter}}`.  
    - Connect input from "Parse Social Content".

**Notes on Credentials Setup:**  
- WordPress: URL and authentication (Basic Auth or OAuth).  
- Google Gemini: Google Palm API key credential.  
- Blotato: API credentials for each social platform account.  
- Ensure API keys have necessary permissions and quota.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                      |
|----------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Workflow authored by David Olusola. For help, contact david@daexai.com                                   | Email contact for coaching and support              |
| Features include platform-specific content, automatic link shortening, duplicate prevention, image support | Workflow design capabilities                          |
| Customize AI prompts and posting schedule per platform via Blotato API                                   | Flexibility and customization instructions          |
| [n8n Official Docs](https://docs.n8n.io/) and [Blotato API](https://blotato.com) for reference           | Useful documentation for extending or debugging     |

---

**Disclaimer:** The text provided is generated exclusively from an automated workflow created with n8n integration and automation tool. It respects all content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.