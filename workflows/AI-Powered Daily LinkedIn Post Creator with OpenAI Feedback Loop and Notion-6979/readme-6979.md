AI-Powered Daily LinkedIn Post Creator with OpenAI Feedback Loop and Notion

https://n8nworkflows.xyz/workflows/ai-powered-daily-linkedin-post-creator-with-openai-feedback-loop-and-notion-6979


# AI-Powered Daily LinkedIn Post Creator with OpenAI Feedback Loop and Notion

### 1. Workflow Overview

This workflow automates the creation and publication of daily LinkedIn posts tailored to a personal brand using AI-driven content generation and feedback loops. It targets social media managers or personal branding professionals who want to maintain a consistent, high-quality LinkedIn presence aligned with a defined brand brief. The workflow integrates OpenAI for content generation and evaluation, Notion for storing brand guidelines, and LinkedIn for publishing posts.

The workflow is organized into these logical blocks:

- **1.1 Scheduled Trigger and Content Idea Generation:** Automatically triggers daily; generates a set of content topic ideas aligned with the brand brief.
- **1.2 Brand Brief Retrieval and Formatting:** Fetches brand guidelines from Notion and formats them for AI consumption.
- **1.3 AI Content Creation with Feedback Loop:** Uses AI to create LinkedIn posts based on content ideas and brand brief, with iterative feedback and refinement to ensure quality and brand alignment.
- **1.4 Post Publishing:** Publishes the final approved post to LinkedIn.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger and Content Idea Generation

**Overview:**  
This block initiates the workflow daily at a set time, obtains the brand brief, generates multiple content ideas via AI, and prepares them for further processing.

**Nodes Involved:**  
- Daily Scheduler  
- Get Brand Brief3 (sub-workflow)  
- Get _Content _Ideas (OpenAI)  
- Format Content Ideas  
- Sticky Note2  
- Split Ideas  
- Loop through content Ideas

**Node Details:**

- **Daily Scheduler**  
  - Type: Schedule Trigger  
  - Role: Triggers workflow daily at 9 PM (configurable)  
  - Inputs: None (time-based)  
  - Outputs: Triggers 'Get Content Ideas'  
  - Edge Cases: Missed triggers if n8n instance offline; time zone considerations  

- **Get Brand Brief3**  
  - Type: Execute Workflow (Sub-workflow)  
  - Role: Retrieves brand brief from Notion (delegates to workflow "UbKh62LfKoMDeyUo")  
  - Inputs: None  
  - Outputs: Brand brief JSON content  
  - Requirements: Sub-workflow must be accessible and functional  
  - Failure: Sub-workflow unavailable or errors in Notion API  

- **Get _Content _Ideas**  
  - Type: OpenAI Chat Model  
  - Role: Produces 10 content topic suggestions aligned with brand brief  
  - Configuration: Uses GPT-4o-mini; prompt includes brand brief for context; expects JSON array of suggestions  
  - Inputs: Brand brief JSON content  
  - Outputs: JSON-formatted suggestions array  
  - Edge Cases: API rate limits, malformed brand brief input, unexpected AI output format  

- **Format Content Ideas**  
  - Type: Set node  
  - Role: Extracts and formats the 'suggestions' array from AI output for downstream use  
  - Inputs: AI JSON response with suggestions  
  - Outputs: Array of text suggestions under key 'suggestions'  

- **Split Ideas**  
  - Type: Split Out  
  - Role: Splits the array of suggestions into individual items for processing  
  - Inputs: Array of suggestions  
  - Outputs: Individual suggestion items  

- **Loop through content Ideas**  
  - Type: Split In Batches  
  - Role: Processes each content idea separately in batches (batch size defaults)  
  - Inputs: Individual suggestion items  
  - Outputs: Batches of content ideas for sequential processing  

- **Sticky Note2**  
  - Contextual note: "Get Content Ideas" - clarifies the purpose of this block  

---

#### 1.2 Brand Brief Retrieval and Formatting

**Overview:**  
Fetches the brand brief content from Notion and formats it into a single string for AI consumption.

**Nodes Involved:**  
- When Executed by Another Workflow (trigger)  
- Get Brand Brief (Notion)  
- Aggregate  
- Format Brand Brief  
- Sticky Note (Get Brand Brief)

**Node Details:**

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Allows this workflow to be triggered by external workflows, passing through input data  
  - Inputs: External trigger with potential input query parameters  
  - Outputs: Triggers 'Get Brand Brief'  
  - Edge Cases: Missing or malformed input data  

- **Get Brand Brief**  
  - Type: Notion API (Block GetAll)  
  - Role: Retrieves all blocks from a specific Notion page containing brand brief and guidelines  
  - Configuration: Uses a URL to the Notion block  
  - Inputs: Trigger from external workflow or internal node  
  - Outputs: Array of content blocks from Notion  
  - Edge Cases: Notion API auth errors, page access revoked, rate limits  

- **Aggregate**  
  - Type: Aggregate  
  - Role: Aggregates all 'content' fields from Notion blocks into a single collection  
  - Inputs: Array of content blocks  
  - Outputs: Aggregated array of content strings  

- **Format Brand Brief**  
  - Type: Set node  
  - Role: Joins aggregated content into one string under 'content' key for AI use  
  - Inputs: Aggregated content array  
  - Outputs: Single JSON object with concatenated content string  

- **Sticky Note**  
  - Contextual note: "Get Brand Brief" - describes this block's purpose  

---

#### 1.3 AI Content Creation with Feedback Loop

**Overview:**  
This complex block uses an AI Agent that iteratively creates LinkedIn posts from content ideas and brand brief, obtains AI feedback on the post quality and brand alignment, and refines the post until it meets a minimum quality threshold.

**Nodes Involved:**  
- Format For AI Input  
- OpenAI Chat Model  
- Get_ Brand _Brief (Tool Workflow)  
- Get_Content_Feedback (Tool Workflow)  
- Simple Memory  
- Generate LinkedIn Post with AI (Agent)  
- Get Content Feedback (OpenAI)  
- Format Feedback  
- Get Brand Brief1 (Execute Workflow)  
- Sticky Note3  
- Sticky Note4

**Node Details:**

- **Format For AI Input**  
  - Type: Set node  
  - Role: Formats each content idea into a JSON chat input payload for the AI Agent  
  - Inputs: Individual content idea item from loop  
  - Outputs: Object containing sessionId, action, and chatInput with the content idea text  

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI LLM (gpt-4.1-mini)  
  - Role: Provides underlying language model for AI Agent node  
  - Credentials: OpenAI API with configured key  
  - Inputs/Outputs: Connected internally to Agent  

- **Get_ Brand _Brief**  
  - Type: LangChain Tool Workflow  
  - Role: AI Agent tool to fetch the brand brief (calls sub-workflow "UbKh62LfKoMDeyUo")  
  - Inputs: No explicit input, invoked by Agent  
  - Outputs: Brand brief content for AI context  

- **Get_Content_Feedback**  
  - Type: LangChain Tool Workflow  
  - Role: AI Agent tool to get qualitative feedback and numeric brand alignment score on generated content (calls sub-workflow "3Bnlfdq60OZoXcba")  
  - Outputs: Feedback JSON with description and score  

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Maintains conversation state and history during Agent execution for context continuity  

- **Generate LinkedIn Post with AI**  
  - Type: LangChain Agent  
  - Role: Core AI Agent implementing the content creation and feedback loop logic using the above tools and memory  
  - Configuration: System message instructs sequential steps: retrieve brand brief, create post, get feedback, refine if score <0.8, loop until approved  
  - Inputs: Formatted content idea as chat input  
  - Outputs: Final approved post text  

- **Get Content Feedback**  
  - Type: OpenAI Chat model (GPT-4.1-mini)  
  - Role: Performs a detailed assessment of the generated post against the brand brief, outputting a JSON score and description  
  - Inputs: Brand brief content and generated post text  
  - Outputs: JSON with feedback description and score  

- **Format Feedback**  
  - Type: Set node  
  - Role: Extracts 'description' and 'score' from AI feedback JSON into dedicated fields for logic decisions  

- **Get Brand Brief1**  
  - Type: Execute Workflow  
  - Role: Fetches brand brief again to supply to the feedback node, ensuring consistent input  

- **Sticky Note3**  
  - Contextual note: "Create Content" - explains the AI content creation and feedback loop process  

- **Sticky Note4**  
  - Contextual note: Explains this block uses OpenAI to craft posts with brand brief, content idea, and feedback; mentions customization potential  

**Edge Cases & Failures:**  
- API errors (OpenAI, sub-workflows)  
- Feedback loop infinite loops if threshold never met  
- Memory overflow or session loss  
- Incorrect formatting of AI inputs or outputs  
- Credentials misconfiguration  

---

#### 1.4 Post Publishing

**Overview:**  
Publishes the final AI-approved LinkedIn post to the configured LinkedIn account.

**Nodes Involved:**  
- Generate LinkedIn Post with AI (output)  
- Publish to Linkedin  
- Sticky Note5

**Node Details:**

- **Publish to Linkedin**  
  - Type: LinkedIn node (OAuth2)  
  - Role: Posts the final content string to LinkedIn under the user "Nabin Bhandari"  
  - Inputs: Final approved post text from AI Agent output  
  - Credentials: LinkedIn OAuth2 API credentials required and configured  
  - Outputs: LinkedIn API response  
  - Edge Cases: OAuth token expiry, API rate limits, posting errors, character limits  

- **Sticky Note5**  
  - Contextual note: Reminds user to configure LinkedIn credentials properly for posting  

---

### 3. Summary Table

| Node Name                   | Node Type                                  | Functional Role                                   | Input Node(s)                       | Output Node(s)                          | Sticky Note                                        |
|-----------------------------|--------------------------------------------|--------------------------------------------------|-----------------------------------|----------------------------------------|----------------------------------------------------|
| Daily Scheduler             | Schedule Trigger                           | Triggers workflow daily at 9 PM                   | -                                 | Get Content Ideas                      | Triggers this workflow every day at 9 PM. You can change this time in the Cron node settings. |
| Get Brand Brief3            | Execute Workflow                           | Retrieves brand brief from Notion sub-workflow   | Daily Scheduler                   | Get _Content _Ideas                    |                                                    |
| Get _Content _Ideas         | OpenAI Chat Model                          | Generates content topic suggestions                | Get Brand Brief3                  | Format Content Ideas                   |                                                    |
| Format Content Ideas        | Set Node                                  | Formats AI output into array of suggestions       | Get _Content _Ideas               | Split Ideas                          | Get Content Ideas                                  |
| Split Ideas                | Split Out                                 | Splits array of content ideas into individual items | Format Content Ideas              | Loop through content Ideas            |                                                    |
| Loop through content Ideas  | Split In Batches                          | Processes content ideas in batches                 | Split Ideas                      | Format For AI Input                   |                                                    |
| Format For AI Input         | Set Node                                  | Prepares content idea for AI Agent input          | Loop through content Ideas        | Generate LinkedIn Post with AI        |                                                    |
| OpenAI Chat Model           | LangChain OpenAI LLM                      | Provides language model for AI Agent               | -                               | Generate LinkedIn Post with AI        |                                                    |
| Get_ Brand _Brief           | LangChain Tool Workflow                   | AI Agent tool to fetch brand brief                  | -                               | Generate LinkedIn Post with AI        |                                                    |
| Get_Content_Feedback        | LangChain Tool Workflow                   | AI Agent tool for content feedback and scoring     | -                               | Generate LinkedIn Post with AI        |                                                    |
| Simple Memory               | LangChain Memory Buffer                   | Maintains conversation memory                       | -                               | Generate LinkedIn Post with AI        |                                                    |
| Generate LinkedIn Post with AI | LangChain Agent                        | Core AI Agent creating and refining posts          | Format For AI Input, Simple Memory, Get_ Brand _Brief, Get_Content_Feedback, OpenAI Chat Model | Publish to Linkedin                  | This uses OpenAI to craft the post using your brand brief, content idea, and past feedback. Customize the prompt in the AI Agent for tone, length, or style. |
| Publish to Linkedin         | LinkedIn Node                             | Publishes final post on LinkedIn                    | Generate LinkedIn Post with AI    | -                                    | This node publishes the final post to LinkedIn. Make sure your LinkedIn credentials are configured properly in the LinkedIn node. |
| When Executed by Another Workflow | Execute Workflow Trigger             | Allows external workflow trigger                     | -                               | Get Brand Brief                      |                                                    |
| Get Brand Brief             | Notion API (Block GetAll)                 | Retrieves brand brief content from Notion          | When Executed by Another Workflow | Aggregate                          | Get Brand Brief                                    |
| Aggregate                  | Aggregate Node                            | Aggregates content strings from Notion blocks      | Get Brand Brief                  | Format Brand Brief                   |                                                    |
| Format Brand Brief          | Set Node                                  | Concatenates aggregated content into one string    | Aggregate                       | -                                    | Get Brand Brief                                    |
| Get Brand Brief1            | Execute Workflow                          | Fetches brand brief for feedback evaluation         | -                               | Get Content Feedback                 |                                                    |
| Get Content Feedback        | OpenAI Chat Model                         | Evaluates post against brand brief for feedback    | Get Brand Brief1                 | Format Feedback                     | Get Content FeedBack                               |
| Format Feedback             | Set Node                                  | Extracts feedback description and score             | Get Content Feedback             | Generate LinkedIn Post with AI        |                                                    |
| Get Content Ideas           | Execute Workflow                         | Generates content ideas (external workflow)         | Daily Scheduler                 | Split Ideas                          | Get Content Ideas                                  |
| Sticky Note                 | Sticky Note                              | Describes "Get Brand Brief" block                    | -                               | -                                    | Get Brand Brief                                    |
| Sticky Note1                | Sticky Note                              | Describes "Get Content Feedback" block               | -                               | -                                    | Get Content FeedBack                               |
| Sticky Note2                | Sticky Note                              | Describes "Get Content Ideas" block                   | -                               | -                                    | Get Content Ideas                                  |
| Sticky Note3                | Sticky Note                              | Describes "Create Content" block                       | -                               | -                                    |                                                    |
| Sticky Note4                | Sticky Note                              | Explains AI content creation and feedback process   | -                               | -                                    |                                                    |
| Sticky Note5                | Sticky Note                              | Describes LinkedIn publishing node                    | -                               | -                                    |                                                    |
| Sticky Note6                | Sticky Note                              | Describes Daily Scheduler node                         | -                               | -                                    |                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node ("Daily Scheduler")**  
   - Set to run daily at 21:00 (9 PM) local time (adjust as needed).

2. **Add an Execute Workflow node ("Get Brand Brief3")**  
   - Configure it to call the sub-workflow with ID `UbKh62LfKoMDeyUo` that fetches the brand brief from Notion.  
   - Pass no inputs.

3. **Add an OpenAI Chat Model node ("Get _Content _Ideas")**  
   - Connect from "Get Brand Brief3".  
   - Set model to `gpt-4o-mini`.  
   - Prompt: "You are a professional content writer. Create 10 topic suggestions that align with the provided brand brief. JSON output format: { \"suggestions\": [...] }. Brand brief: {{ $json.content }}"  
   - Enable JSON output.

4. **Add a Set node ("Format Content Ideas")**  
   - Extract `suggestions` array from AI response: set key `suggestions` to `={{ $json.message.content.suggestions }}`.

5. **Add a Split Out node ("Split Ideas")**  
   - Split the `suggestions` array into individual items.

6. **Add a Split In Batches node ("Loop through content Ideas")**  
   - Process each content idea individually (default batch size).

7. **Add a Set node ("Format For AI Input")**  
   - For each content idea, create JSON:  
     ```json
     {
       "sessionId": "{{ $itemIndex }}",
       "action": "sendMessage",
       "chatInput": "{{ $json.suggestions }}"
     }
     ```

8. **Set up LangChain OpenAI LLM node ("OpenAI Chat Model")**  
   - Use model `gpt-4.1-mini`.  
   - Connect internally to AI Agent.

9. **Set up LangChain Tool Workflow nodes:**  
   - "Get_ Brand _Brief" calls sub-workflow `UbKh62LfKoMDeyUo` to provide the brand brief for AI Agent.  
   - "Get_Content_Feedback" calls sub-workflow `3Bnlfdq60OZoXcba` to evaluate content against the brand brief.

10. **Add LangChain Memory Buffer Window node ("Simple Memory")**  
    - To maintain conversation context within AI Agent.

11. **Add LangChain Agent node ("Generate LinkedIn Post with AI")**  
    - Configure system message describing stepwise process: get brand brief, create post, get feedback, refine if score <0.8, repeat until approved.  
    - Connect inputs: formatted content idea, brand brief tool, feedback tool, memory, language model.

12. **Add OpenAI Chat Model node ("Get Content Feedback")**  
    - Model: `gpt-4.1-mini`.  
    - Prompt instructs evaluation of content alignment with brand brief, outputs JSON with description and score.

13. **Add Execute Workflow node ("Get Brand Brief1")**  
    - Calls same brand brief fetching sub-workflow for feedback evaluation consistency.

14. **Add Set node ("Format Feedback")**  
    - Extract fields:  
      - `feedback` = `={{ $json.message.content.description }}`  
      - `score` = `={{ $json.message.content.score }}`

15. **Add LinkedIn node ("Publish to Linkedin")**  
    - Use OAuth2 credentials for LinkedIn account.  
    - Text to post: `={{ $json.output }}` from AI Agent final output.  
    - Person: "Nabin Bhandari".

16. **Connect nodes in order:**  
    - Daily Scheduler → Get Brand Brief3 → Get _Content _Ideas → Format Content Ideas → Split Ideas → Loop through content Ideas → Format For AI Input → Generate LinkedIn Post with AI → Publish to Linkedin.

17. **Credential setup:**  
    - OpenAI API key configured for all OpenAI nodes.  
    - LinkedIn OAuth2 credentials configured with necessary permissions.  
    - Notion API credentials configured for Notion node to access brand brief.

18. **Create sub-workflows:**  
    - Brand Brief retrieval workflow (`UbKh62LfKoMDeyUo`): fetch Notion blocks, aggregate content, output concatenated brief.  
    - Content Feedback workflow (`3Bnlfdq60OZoXcba`): evaluates post content quality and alignment.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                               |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| The workflow integrates multiple AI steps with a feedback loop to ensure brand-aligned content. | Workflow Description                                          |
| Brand brief is stored in Notion and retrieved dynamically.                                      | Notion URL: https://www.notion.so/Brand-Brief-245bda7c79be804dbe6bf6d78e041bf7 |
| Customize AI agent prompt for tone, length, or style in the "Generate LinkedIn Post with AI" node. | Sticky Note4                                                  |
| LinkedIn node requires proper OAuth2 credentials with post permissions.                          | Sticky Note5                                                  |
| Scheduled trigger runs at 9 PM daily; adjust time zone as needed.                               | Sticky Note6                                                  |

---

**Disclaimer:**  
The text provided is exclusively extracted from an automated workflow created with n8n, an integration and automation tool. All processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.