AI-Powered Multi-Platform Social Media Content Factory with Dynamic System Prompts & GPT-4o

https://n8nworkflows.xyz/workflows/ai-powered-multi-platform-social-media-content-factory-with-dynamic-system-prompts---gpt-4o-8850


# AI-Powered Multi-Platform Social Media Content Factory with Dynamic System Prompts & GPT-4o

### 1. Workflow Overview

This workflow, titled **"AI-Powered Multi-Platform Social Media Content Factory with Dynamic System Prompts & GPT-4o"**, automates the generation, approval, image creation, archiving, and publishing of social media content tailored for multiple platforms (X/Twitter, Instagram, Facebook, LinkedIn, Threads, YouTube Shorts). It integrates AI models to dynamically build platform-specific content based on user prompts and external system prompts and schemas stored in Google Docs.

**Target Use Cases:**  
- Automating social media content creation across diverse platforms with tailored style and format.  
- Centralized management of system prompts and JSON schemas for flexible updates without workflow code changes.  
- Content approval workflow with email notifications and user interaction.  
- Automated image generation and archiving alongside content.  
- Publishing approved content to respective social media channels via API integrations.  

**Logical Blocks:**  
1.1 Input Reception & Chat Trigger  
1.2 Dynamic System Prompt & Schema Retrieval and Parsing  
1.3 Social Media Content Creation Agent (GPT-4o based)  
1.4 Image Generation and Archiving  
1.5 Content Approval & Email Notification  
1.6 Social Media Publishing Router & Platform-Specific Publishing  
1.7 Post-Publishing Notifications and Archiving  

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception & Chat Trigger

**Overview:**  
This block captures user input messages (prompts) to initiate social media content generation workflows.

**Nodes Involved:**  
- When chat message received  
- 🤖Social Media Router Agent  

**Node Details:**  

- **When chat message received**  
  - Type: LangChain Chat Trigger  
  - Role: Entry point for user chat inputs. Listens for incoming chat messages to start processing.  
  - Config: Default webhook trigger with no advanced options.  
  - Inputs: External chat messages  
  - Outputs: Connected to "🤖Social Media Router Agent"  
  - Failures: Network/webhook issues, message formatting errors.  

- **🤖Social Media Router Agent**  
  - Type: LangChain Agent  
  - Role: Routes user prompts by calling the appropriate tool workflow for each social platform.  
  - Config: System message instructs it to only call specific tool workflows (X-Twitter, Instagram, Facebook, LinkedIn, Threads, YouTube Shorts). Does not answer user directly.  
  - Inputs: User chat message JSON from trigger node.  
  - Outputs: "File Id" node for retrieving generated content.  
  - Failures: Tool invocation errors, invalid user prompt format.  
  - Notes: Uses tools named like "create_x_twitter_posts_tool", etc., all invoking the same workflow with parameters.  

---

#### 1.2 Dynamic System Prompt & Schema Retrieval and Parsing

**Overview:**  
Fetches external system prompts and JSON schemas from Google Docs, then parses them for use in content generation.

**Nodes Involved:**  
- When Executed by Another Workflow  
- Social Media System Prompt (Google Docs)  
- Social Media Schema (Google Docs)  
- System Prompt (Set)  
- Schema (Set)  
- Parse System Prompt (Code)  
- Parse Schema (Code)  
- Merge Prompts and Schema (Merge)  
- Compose Prompt & Schema (Set)  

**Node Details:**  

- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Allows this workflow to be invoked as a tool from itself or other workflows with inputs "user_prompt" and "route".  
  - Config: Accepts inputs for the user prompt and target social media platform.  
  - Outputs: Social Media System Prompt, Social Media Schema nodes.  

- **Social Media System Prompt & Social Media Schema**  
  - Type: Google Docs (OAuth2)  
  - Role: Retrieves documents containing the system prompt XML and JSON schema XML respectively.  
  - Config: Requires Google Docs document URLs/IDs configured externally.  
  - Outputs: Parsed content JSON used downstream.  
  - Failures: OAuth errors, document ID errors, network issues.  

- **System Prompt (Set) & Schema (Set)**  
  - Role: Assign the retrieved document content and document IDs to workflow variables for parsing.  
  - Inputs: Google Docs nodes output.  
  - Outputs: Parsing nodes.  

- **Parse System Prompt (Code)**  
  - Role: Extracts all XML tags and their content from the system prompt document into a JSON object keyed by tag name.  
  - Inputs: System prompt XML string.  
  - Outputs: JSON object with system_config containing prompts for system, rules, and each platform.  
  - Failures: XML parsing errors, malformed XML.  

- **Parse Schema (Code)**  
  - Role: Extracts platform-specific JSON schemas from the schema XML document, including common and root schemas.  
  - Inputs: Schema XML string and platform name.  
  - Outputs: Parsed JSON schema objects for root_schema, common_schema, and platform-specific schema.  
  - Failures: Parsing errors, missing platform schema.  

- **Merge Prompts and Schema (Merge)**  
  - Role: Combines outputs from system prompt parsing, schema parsing, and "When Executed by Another Workflow" inputs into a single dataset.  
  - Inputs: From System Prompt, Schema, and When Executed nodes.  
  - Outputs: Compose Prompt & Schema node.  

- **Compose Prompt & Schema (Set)**  
  - Role: Assigns all parsed data (system messages, rules, platform schema, root and common schema) plus user prompt and route into variables for the content creation agent.  
  - Inputs: Merged data.  
  - Outputs: Social Media Content Creator node.  

---

#### 1.3 Social Media Content Creation Agent (GPT-4o based)

**Overview:**  
Generates platform-tailored social media content in JSON format using LangChain agent with GPT-4o-mini model, guided by dynamic system prompts and schemas.

**Nodes Involved:**  
- Social Media Content Creator (LangChain Agent)  
- Social Content (Set)  
- pollinations.ai1 (HTTP Request - Image Generation)  
- Save Image to imgbb.com (HTTP Request)  
- Save Image to Google Drive (Google Drive Node)  
- Merge (Merge)  
- Telegram Success Message (Optional)  
- Telegram Error Message (Optional)  

**Node Details:**  

- **Social Media Content Creator**  
  - Type: LangChain Agent  
  - Role: Uses system prompt, rules, and schema to generate valid JSON social media content based on user prompt and platform.  
  - Model: GPT-4o-mini  
  - Inputs: Composed prompt, system config, schemas, route, and user prompt.  
  - Outputs: Social Content node.  
  - Failures: API timeouts, schema validation errors, unexpected model output.  

- **Social Content (Set)**  
  - Role: Stores generated social media content JSON for downstream processing.  
  - Inputs: Output from Content Creator node.  
  - Outputs: Image generation node.  

- **pollinations.ai1**  
  - Type: HTTP Request  
  - Role: Generates an image based on the image suggestion from the generated content using pollinations.ai image generation API.  
  - Config: URL dynamically built from image suggestion text, with sanitization (replacing spaces, commas, etc.).  
  - Outputs: Image binary or URL for further processing.  
  - Failures: API failures, malformed prompt, rate limits.  

- **Save Image to imgbb.com**  
  - Type: HTTP Request  
  - Role: Uploads generated image binary to imgbb.com for hosting and returns hosted image URLs.  
  - Credentials: Environment variable for IMGBB API key required.  
  - Outputs: Image URLs used for social media posting.  
  - Failures: API key missing/invalid, upload errors.  

- **Save Image to Google Drive**  
  - Type: Google Drive Upload  
  - Role: Saves image to configured Google Drive folder for archiving.  
  - Credentials: Google Drive OAuth2 required.  
  - Outputs: Metadata about saved image.  
  - Failures: OAuth errors, quota exceeded, file permission issues.  

- **Merge**  
  - Role: Combines image data and social content JSON for further processing and routing.  

- **Telegram Success Message (Optional)**  
  - Role: Sends a Telegram notification on successful image creation.  
  - Credentials: Telegram Bot API credentials required.  

- **Telegram Error Message (Optional)**  
  - Role: Sends a Telegram notification upon image creation error for debugging.  

---

#### 1.4 Content Approval & Email Notification

**Overview:**  
Sends generated social media content for user approval via Gmail with HTML-formatted email, then waits for approval decision.

**Nodes Involved:**  
- Gmail User for Approval  
- Is Approved? (If)  
- Get Social Post Image (HTTP Request)  
- Prepare Email Contents (LangChain Agent)  

**Node Details:**  

- **Gmail User for Approval**  
  - Type: Gmail Node with sendAndWait operation  
  - Role: Sends an email with generated content and waits for user approval (double approval type configured).  
  - Inputs: HTML email content from Prepare Email Contents node.  
  - Outputs: Approval status used in "Is Approved?" node.  
  - Failures: OAuth errors, email delivery delays/failures.  

- **Is Approved?**  
  - Type: If Node  
  - Role: Checks if the user approved the content to proceed with publishing.  
  - Outputs: Conditional path to next steps or halt.  

- **Get Social Post Image**  
  - Type: HTTP Request  
  - Role: Retrieves social post image for publishing after approval.  
  - Failures: Network or image retrieval errors.  

- **Prepare Email Contents**  
  - Type: LangChain Agent  
  - Role: Generates HTML email content using a provided template populated dynamically with post data.  
  - Model: GPT-4o-mini1  
  - Failures: Template parsing or generation errors.  

---

#### 1.5 Social Media Publishing Router & Platform-Specific Publishing

**Overview:**  
Routes approved content to platform-specific publishing nodes and executes posting via API calls.

**Nodes Involved:**  
- Social Media Publishing Router (Switch)  
- X Post (Twitter API)  
- Instagram Image (Facebook Graph API)  
- Instragram Post (Facebook Graph API)  
- Facebook Post (Facebook Graph API)  
- LinkedIn Post (LinkedIn API)  
- Implement Threads Here (NoOp placeholder)  
- Implement YouTube Shorts Here (NoOp placeholder)  
- X Response, Instagram Response, Facebook Response, LinkedIn Response (Set)  

**Node Details:**  

- **Social Media Publishing Router**  
  - Type: Switch Node  
  - Role: Routes data based on platform ("route" field) to respective posting nodes.  
  - Inputs: Merged post and image data.  
  - Outputs: Conditional outputs for each platform's publishing node.  
  - Failures: Mismatched route values, routing errors.  

- **X Post (Twitter OAuth2)**  
  - Type: Twitter Node  
  - Role: Posts text content to X (Twitter) using OAuth2.  
  - Inputs: Text from generated content JSON.  
  - Credentials: Twitter OAuth2 required.  
  - Failures: Auth errors, rate limits, API errors.  

- **Instagram Image & Instragram Post (Facebook Graph API)**  
  - Type: HTTP Request / Facebook Graph API  
  - Role: Uploads media and publishes Instagram post with caption via Facebook API.  
  - Inputs: Image URLs and captions from content JSON.  
  - Credentials: Facebook Graph API OAuth2.  
  - Failures: API permission errors, rate limits, media upload errors.  

- **Facebook Post (Facebook Graph API)**  
  - Type: Facebook Graph API  
  - Role: Posts photo and message to Facebook page.  
  - Inputs: Image binary and post message.  
  - Failures: Similar to Instagram posting failures.  

- **LinkedIn Post (LinkedIn OAuth2)**  
  - Type: LinkedIn Node  
  - Role: Posts text and media to LinkedIn organization page.  
  - Inputs: Text post, hashtags, call to action, image binary.  
  - Credentials: LinkedIn OAuth2.  
  - Failures: Permission errors, API limits.  

- **Implement Threads Here & Implement YouTube Shorts Here**  
  - Type: NoOp (Placeholder)  
  - Role: Placeholder nodes for future integrations of Threads and YouTube Shorts publishing.  

- **X Response, Instagram Response, Facebook Response, LinkedIn Response (Set)**  
  - Type: Set  
  - Role: Format and prepare human-readable responses or logs for success/failure notifications or record keeping.  

---

#### 1.6 Post-Publishing Notifications and Archiving

**Overview:**  
Handles archiving of social posts to Google Drive and optional notifications via Telegram and Gmail.

**Nodes Involved:**  
- Save Social Post to Google Drive (Google Drive Node)  
- Respond with Google Drive Id (Set)  
- Google Drive Image Meta (Set)  
- Telegram Success Message (Optional)  
- Prepare Social Media Email Contents (LangChain Agent)  
- Gmail (Send Email)  

**Node Details:**  

- **Save Social Post to Google Drive**  
  - Type: Google Drive Node  
  - Role: Saves JSON of published social post and metadata for archive and audit purposes.  
  - Inputs: Serialized social post JSON.  
  - Failures: Permission errors, quota limits.  

- **Respond with Google Drive Id**  
  - Type: Set  
  - Role: Outputs the Google Drive file ID for referencing or feedback.  

- **Google Drive Image Meta**  
  - Type: Set  
  - Role: Extracts and stores image metadata (ID, links) from Google Drive upload response.  

- **Telegram Success Message (Optional)**  
  - Sends notification on successful image creation or publishing.  

- **Prepare Social Media Email Contents & Gmail**  
  - Sends structured HTML email reports optionally to stakeholders for record or approval.  

---

### 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                                      | Input Node(s)                             | Output Node(s)                              | Sticky Note                                                                                              |
|--------------------------------|----------------------------------|-----------------------------------------------------|------------------------------------------|---------------------------------------------|---------------------------------------------------------------------------------------------------------|
| When chat message received      | LangChain Chat Trigger            | Entry point, receives user chat prompt              | -                                        | 🤖Social Media Router Agent                  | ## 👍Start Here                                                                                          |
| 🤖Social Media Router Agent      | LangChain Agent                   | Routes prompt to platform-specific tools            | When chat message received                | File Id                                      | ## Social Media Router Agent                                                                             |
| When Executed by Another Workflow | Execute Workflow Trigger          | Invocation entry for sub-workflows                   | -                                        | Social Media System Prompt, Social Media Schema, Merge Prompts and Schema |                                                                                                         |
| Social Media System Prompt      | Google Docs                      | Fetch system prompt XML from Google Docs             | When Executed by Another Workflow         | System Prompt (Set)                          | ## Prompt & Schema Composition from External Sources                                                    |
| Social Media Schema             | Google Docs                      | Fetch JSON schema XML from Google Docs               | When Executed by Another Workflow         | Schema (Set)                                |                                                                                                         |
| System Prompt                  | Set                             | Assign system prompt content                          | Social Media System Prompt                 | Parse System Prompt                          |                                                                                                         |
| Schema                        | Set                             | Assign schema content                                | Social Media Schema                        | Parse Schema                                |                                                                                                         |
| Parse System Prompt            | Code                            | Extract XML tags and content into JSON object       | System Prompt                             | Merge Prompts and Schema                     |                                                                                                         |
| Parse Schema                  | Code                            | Extract platform-specific schemas from XML           | Schema                                   | Merge Prompts and Schema                     |                                                                                                         |
| Merge Prompts and Schema      | Merge                           | Combine system prompts, schema, and user inputs      | Parse System Prompt, Parse Schema, When Executed by Another Workflow | Compose Prompt & Schema                      |                                                                                                         |
| Compose Prompt & Schema       | Set                             | Prepare full context for content generation          | Merge Prompts and Schema                   | Social Media Content Creator                  |                                                                                                         |
| Social Media Content Creator  | LangChain Agent                 | Generate social media content JSON                    | Compose Prompt & Schema                    | Social Content                              | ## Social Media Content Creator                                                                         |
| Social Content                | Set                             | Store generated content                               | Social Media Content Creator               | pollinations.ai1                            |                                                                                                         |
| pollinations.ai1              | HTTP Request                    | Generate image from AI image service                  | Social Content                             | Save Image to imgbb.com, Save Image to Google Drive, Telegram Messages | ## Create Post Image https://pollinations.ai/                                                           |
| Save Image to imgbb.com       | HTTP Request                    | Upload generated image and provide hosting URL        | pollinations.ai1                          | Merge                                       |                                                                                                         |
| Save Image to Google Drive    | Google Drive                   | Archive image in Google Drive                          | pollinations.ai1                          | Merge                                       | ## Image Archiving to Multiple Cloud Services for Future Use                                            |
| Merge                        | Merge                           | Combine image data and social content                  | Save Image to imgbb.com, Save Image to Google Drive, pollinations.ai1 | Social Media Publishing Router               |                                                                                                         |
| Social Media Publishing Router | Switch                        | Route content and image to platform-specific posting | Merge                                    | X Post, Instagram Image, Facebook Post, LinkedIn Post, Implement Threads Here, Implement YouTube Shorts Here | ## Social Media Publishing Router                                                                       |
| X Post                      | Twitter                       | Post content to X (Twitter)                            | Social Media Publishing Router             | X Response                                  | ## 1️⃣ X - Twitter                                                                                       |
| Instagram Image             | Facebook Graph API            | Upload Instagram image                                 | Social Media Publishing Router             | Instragram Post                             | ## 2️⃣ Instagram                                                                                        |
| Instragram Post             | Facebook Graph API            | Publish Instagram post                                 | Instagram Image                           | Instagram Response                          |                                                                                                         |
| Facebook Post              | Facebook Graph API            | Publish Facebook photo post                            | Social Media Publishing Router             | Facebook Response                           | ## 3️⃣ Facebook                                                                                        |
| LinkedIn Post             | LinkedIn                     | Publish LinkedIn post                                  | Social Media Publishing Router             | LinkedIn Response                           | ## 4️⃣ LinkedIn                                                                                        |
| Implement Threads Here      | NoOp                         | Placeholder for Threads publishing                     | Social Media Publishing Router             | -                                           | ## 5️⃣Threads                                                                                          |
| Implement YouTube Shorts Here | NoOp                         | Placeholder for YouTube Shorts publishing              | Social Media Publishing Router             | -                                           | ## 6️⃣YouTube Shorts                                                                                   |
| X Response                 | Set                          | Format X post response for logs or notifications       | X Post                                   | -                                           |                                                                                                         |
| Instagram Response         | Set                          | Format Instagram post response                          | Instragram Post                           | -                                           |                                                                                                         |
| Facebook Response          | Set                          | Format Facebook post response                           | Facebook Post                            | -                                           |                                                                                                         |
| LinkedIn Response          | Set                          | Format LinkedIn post response                           | LinkedIn Post                            | -                                           |                                                                                                         |
| Gmail User for Approval    | Gmail (sendAndWait)           | Send content for user approval and wait for response   | Prepare Email Contents                    | Is Approved?                               | ## 👍 Approve Content Before Proceeding                                                                 |
| Is Approved?              | If                            | Conditional branch based on approval                   | Gmail User for Approval                    | Get Social Post Image (if true)             |                                                                                                         |
| Get Social Post Image      | HTTP Request                 | Retrieve social post image after approval               | Is Approved?                              | Merge Image and Post Contents               |                                                                                                         |
| Prepare Email Contents     | LangChain Agent              | Generate HTML email content for approval notification  | Extract as JSON, Merge Image and Post Contents | Gmail User for Approval                      | ## Prepare Email Approval Contents as HTML                                                             |
| Merge Image and Post Contents | Merge                      | Combine image and post content for publishing           | Get Social Post Image, Extract as JSON    | Social Media Publishing Router               |                                                                                                         |
| Extract as JSON           | Extract from File             | Extract JSON content from downloaded Google Drive file | Get Social Post from Google Drive          | Merge Image and Post Contents, Prepare Email Contents |                                                                                                         |
| Get Social Post from Google Drive | Google Drive            | Download social post JSON file                           | File Id                                   | Extract as JSON                             |                                                                                                         |
| File Id                   | Set                          | Pass file ID for retrieval                               | 🤖Social Media Router Agent               | Get Social Post from Google Drive           |                                                                                                         |
| Save Social Post to Google Drive | Google Drive             | Archive the published social post JSON                   | Social Post JSON                          | Respond with Google Drive Id                 | ## 9️⃣ Social Post Archiving to Google Drive for Future Use                                            |
| Respond with Google Drive Id | Set                         | Output Google Drive file ID                              | Save Social Post to Google Drive          | -                                           |                                                                                                         |
| Google Drive Image Meta   | Set                          | Extract and store image metadata                         | Save Image to Google Drive                 | Social Post JSON                            |                                                                                                         |
| Prepare Social Media Email Contents | LangChain Agent        | Generate structured HTML email content for reporting    | Merge                                      | Gmail                                      | ## 8️⃣ Optional Workflow Reporting to Gmail in with Structured HTML Content                             |
| Gmail                     | Gmail                        | Send email report                                        | Prepare Social Media Email Contents        | -                                           |                                                                                                         |
| Telegram Success Message (Optional) | Telegram              | Notify success in Telegram                               | pollinations.ai1                          | -                                           | ## 7️⃣ Telegram Messaging for Workflow Status                                                          |
| Telegram Error Message (Optional) | Telegram              | Notify errors in Telegram                                | pollinations.ai1                          | -                                           |                                                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node**  
   - Add **"When chat message received"** (LangChain Chat Trigger) node to capture user prompts. Configure webhook as needed.

2. **Add Social Media Router Agent**  
   - Add **LangChain Agent** node ("🤖Social Media Router Agent") connected to the chat trigger.  
   - Use system instructions to only call platform-specific tool workflows (create_x_twitter_posts_tool, etc.) with the user prompt.  

3. **Enable Execution Trigger for Sub-Workflow Invocation**  
   - Add **Execute Workflow Trigger** node ("When Executed by Another Workflow") configured to accept inputs: user_prompt, route.

4. **Fetch System Prompt and Schema from Google Docs**  
   - Add two **Google Docs** nodes: "Social Media System Prompt" and "Social Media Schema".  
   - Configure OAuth2 credentials and set correct document URLs/IDs containing your XML system prompt and JSON schema documents.

5. **Set Nodes for System Prompt and Schema Content**  
   - Add two **Set** nodes ("System Prompt" and "Schema") to assign content and document IDs from Google Docs outputs.

6. **Parse System Prompt XML**  
   - Add a **Code** node ("Parse System Prompt") to extract all XML tags and content into JSON key-value pairs.

7. **Parse Schema XML**  
   - Add a **Code** node ("Parse Schema") to extract platform-specific schemas, common and root schemas from XML content based on the input platform.

8. **Merge Parsed Data**  
   - Add a **Merge** node ("Merge Prompts and Schema") to combine outputs from "Parse System Prompt", "Parse Schema", and "When Executed by Another Workflow".

9. **Compose Final Prompt & Schema**  
   - Add a **Set** node ("Compose Prompt & Schema") to prepare all inputs including user prompt, system messages, rules, and schemas for content generation.

10. **Add Content Creation Agent**  
    - Add a **LangChain Agent** node ("Social Media Content Creator") that uses GPT-4o-mini.  
    - Configure the system message with dynamic system prompts and rules.  
    - Input the composed prompt and schema variables.  
    - Output connects to "Social Content" node.

11. **Store Generated Content**  
    - Add a **Set** node ("Social Content") to hold the content JSON output.

12. **Generate Post Image**  
    - Add an **HTTP Request** node ("pollinations.ai1") to generate image from AI service using the image suggestion text from the generated content.

13. **Upload Image to Hosting Service**  
    - Add an **HTTP Request** node ("Save Image to imgbb.com") to upload the generated image.  
    - Configure API key in environment variables (IMGBB_API_KEY).

14. **Archive Image to Google Drive**  
    - Add a **Google Drive** node ("Save Image to Google Drive") to save the image file to a configured folder.  
    - Use OAuth2 credentials.

15. **Merge Image URLs and Content**  
    - Add a **Merge** node to combine image URLs and social content JSON.

16. **Add Social Media Publishing Router**  
    - Add a **Switch** node ("Social Media Publishing Router") on "route" field to route content to specific platform posting nodes.

17. **Add Social Platform Posting Nodes**  
    - Add nodes for each platform:  
      - Twitter OAuth2 node ("X Post")  
      - Facebook Graph API nodes ("Instagram Image", "Instragram Post", "Facebook Post")  
      - LinkedIn OAuth2 node ("LinkedIn Post")  
      - NoOp nodes as placeholders for Threads and YouTube Shorts.  
    - Connect outputs from the router accordingly.

18. **Prepare and Send Approval Email**  
    - Add a **LangChain Agent** node ("Prepare Email Contents") to generate HTML email from a template using social content.  
    - Add a **Gmail** node ("Gmail User for Approval") with sendAndWait configured for double approval.  
    - Connect to an **If** node ("Is Approved?") to conditionally proceed only if approved.

19. **Retrieve Approved Content Image**  
    - Add **HTTP Request** node ("Get Social Post Image") to fetch image for approved content.

20. **Merge Image and Post Content for Publishing**  
    - Add **Merge** node ("Merge Image and Post Contents") combining image and JSON content.

21. **Publish Content via Router**  
    - Connect merged output to "Social Media Publishing Router" node to trigger publishing.

22. **Archive Social Post JSON**  
    - Add **Google Drive** node ("Save Social Post to Google Drive") to save JSON post archive.  
    - Add a **Set** node ("Respond with Google Drive Id") to output file ID.

23. **Add Optional Notifications**  
    - Add **Telegram** nodes for success and error messages.  
    - Add **LangChain Agent** node ("Prepare Social Media Email Contents") for optional HTML reporting emails.  
    - Add a **Gmail** node to send reports.

24. **Configure Credentials**  
    - Google Docs OAuth2 for system prompt and schema retrieval.  
    - OpenAI API key for GPT-4o and GPT-4o-mini models.  
    - Twitter OAuth2 for posting to X (Twitter).  
    - Facebook Graph API OAuth2 for Instagram and Facebook posting.  
    - LinkedIn OAuth2 for LinkedIn posting.  
    - Telegram Bot API credentials for notifications.  
    - IMGBB API key for image hosting.  
    - Google Drive OAuth2 for archiving.  

25. **Set Environment Variables**  
    - TELEGRAM_CHAT_ID, IMGBB_API_KEY, and other sensitive keys in n8n environment variables or credential settings.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                  | Context or Link                                          |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| Update all Social Media Platform Credentials as required. Adjust parameters and content for each platform to suit your needs.                                                                                                                                  | Sticky Note near publishing nodes                         |
| Create Google Doc for the Social Media Schema and copy the provided schema. Update the Google Doc ID in the Social Media Schema node. Create Google Doc for the Social Media System Prompt and copy the provided System Prompt. Update its ID accordingly.       | Sticky Note near System Prompt and Schema nodes           |
| Replace pollinations.ai with any online image generation service that produces an image file you can download.                                                                                                                                                  | Sticky Note near Image Generation node                     |
| Replace Chat model with other LLMs and test out the results. Add more tools or try other web search tools to suit your use case.                                                                                                                              | Sticky Note near GPT nodes                                 |
| System prompt defines platform-specific content generation rules including style, tone, hashtags, and call-to-actions for LinkedIn, Instagram, Facebook, X (Twitter), Threads, and YouTube Shorts. Never include URLs for videos or images in AI responses.          | Sticky Note with system prompt XML content                 |
| Official pollinations.ai image generation service: https://pollinations.ai/ and image prompt URL format: https://image.pollinations.ai/prompt/[your image description]                                                                                         | Sticky Note near pollinations.ai1 HTTP Request node       |
| The workflow is designed to be modular and extensible, enabling the addition of new social platforms by adding new prompt and schema documents and corresponding tool workflows.                                                                                | Several sticky notes describing features and benefits     |
| Use Gmail sendAndWait node for content approval with double approval configured to ensure content quality before publishing.                                                                                                                                    | Approval block sticky notes                                |
| Ensure that all API rate limits and permissions are correctly configured for social media APIs to prevent publishing failures.                                                                                                                                  | General best practice note                                 |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.