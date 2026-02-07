Automate Professional LinkedIn Posts with OpenAI GPT, DALL-E and Trending Topics

https://n8nworkflows.xyz/workflows/automate-professional-linkedin-posts-with-openai-gpt--dall-e-and-trending-topics-11856


# Automate Professional LinkedIn Posts with OpenAI GPT, DALL-E and Trending Topics

### 1. Workflow Overview

This n8n workflow automates the creation and publication of professional LinkedIn posts focused on AI automation, workflow engineering, and related trending topics. It targets AI specialists, developers, founders, and product teams who want to share real-world insights and industry updates through LinkedIn posts enriched with custom-generated images.

The workflow is logically divided into the following functional blocks:

- **1.1 Trigger & Context Setup:** Manual workflow start and definition of professional posting context.
- **1.2 Fetch and Filter Industry Insights:** Retrieve latest trending topics from Medium RSS feed and filter relevant AI/automation insights.
- **1.3 Generate LinkedIn Post Content:** Use OpenAI GPT (GPT-4.1-mini) to create a professional LinkedIn post based on filtered insights and defined context.
- **1.4 Generate Post Image:** Generate a high-quality, professional image related to the post using OpenAI’s image generation (DALL·E).
- **1.5 Validate and Merge Results:** Check the presence and quality of generated text and image, merge them into a LinkedIn-compatible payload.
- **1.6 Publish Post & Notification:** Publish the combined post on LinkedIn and send email notifications on success or failure.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Trigger & Context Setup

**Overview:**  
Starts the workflow manually and sets the professional identity and posting scope with predefined variables.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Set context

**Node Details:**  

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point to start the workflow on-demand.  
  - Config: No parameters.  
  - Inputs: None  
  - Outputs: Passes execution to "Set context".  
  - Failures: None expected.

- **Set context**  
  - Type: Set  
  - Role: Define static variables describing the author’s role, core focus, experience level, target audience, and content rules.  
  - Config: Sets the following fields:
    - role: "Full Stack Developer & AI Automation Specialist"
    - core_focus: "AI automation, n8n workflows, backend APIs, frontend systems, analytics"
    - experience_level: "Hands-on implementation for real businesses"
    - audience: "Founders, business owners, developers, product teams"
    - content_rules: "No motivation, no unrelated tech, only real-world experience"
  - Inputs: From manual trigger  
  - Outputs: Passes data to "Get Latest Topics"  
  - Failures: None expected.

---

#### 2.2 Fetch and Filter Industry Insights

**Overview:**  
Fetches latest trending articles tagged with "automation" from Medium via an RSS-to-JSON service, then filters to keep only insights relevant to specified keywords.

**Nodes Involved:**  
- Get Latest Topics  
- Relevant Insights

**Node Details:**  

- **Get Latest Topics**  
  - Type: HTTP Request  
  - Role: Fetch Medium RSS feed converted to JSON format for "automation" tag.  
  - Config:  
    - URL: `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/tag/automation`  
    - Method: GET  
  - Inputs: From "Set context"  
  - Outputs: JSON items containing articles  
  - Failures: Network errors, API rate limits, malformed responses.

- **Relevant Insights**  
  - Type: Code (JavaScript)  
  - Role: Filter fetched articles for relevance based on keywords: automation, AI, workflow, backend, API, RAG, LLM, n8n.  
  - Config:  
    - Filters items by checking if title or description contains any of the keywords (case-insensitive).  
    - Returns the first relevant insight's title and truncated description or a default fallback message if none found.  
  - Inputs: JSON data from "Get Latest Topics"  
  - Outputs: Field `latestInsight` with filtered insight or default value  
  - Failures: Expression or runtime errors if JSON structure is unexpected.

---

#### 2.3 Generate LinkedIn Post Content

**Overview:**  
Generates a human-friendly, professional LinkedIn post text using OpenAI GPT, combining the latest filtered insight with the predefined context.

**Nodes Involved:**  
- Generate LinkedIn Post  
- Get Linked Post

**Node Details:**  

- **Generate LinkedIn Post**  
  - Type: OpenAI GPT (LangChain node)  
  - Role: Create a LinkedIn post text based on specified instructions and latest industry update.  
  - Config:  
    - Model: GPT-4.1-mini  
    - Prompt: Includes instructions to write about AI automation, n8n workflows, backend/frontend systems, and real business experience.  
    - System role: Senior Full Stack Developer and AI Automation expert writing from real experience.  
    - Input variable: `{{ $json.latestInsight }}` from "Relevant Insights".  
  - Credentials: OpenAI API key required.  
  - Inputs: Latest insight JSON  
  - Outputs: Generated LinkedIn post text in JSON field.  
  - Failures: API errors, rate limits, prompt errors.

- **Get Linked Post**  
  - Type: Set  
  - Role: Extract the generated LinkedIn post text from OpenAI response.  
  - Config:  
    - Assigns `linkedinData` to `{{$json.output[0].content[0].text}}` which is the raw GPT response.  
  - Inputs: From "Generate LinkedIn Post"  
  - Outputs: Passes `linkedinData` for validation  
  - Failures: Expression errors if GPT response structure changes.

---

#### 2.4 Generate Post Image

**Overview:**  
Creates a professional LinkedIn-quality image with OpenAI’s image generation API, using the latest topic title as part of the prompt to ensure relevance.

**Nodes Involved:**  
- Generate an image  
- Binary format  
- Check Image condition

**Node Details:**  

- **Generate an image**  
  - Type: OpenAI Image Generation (LangChain node)  
  - Role: Generate a photorealistic image representing AI automation and workflow themes.  
  - Config:  
    - Prompt: Static descriptive prompt about AI automation and workflow systems, concatenated with the latest topic title from "Get Latest Topics".  
    - Resource: Image generation (DALL·E)  
  - Credentials: OpenAI API key required.  
  - Inputs: Latest topic title JSON  
  - Outputs: Binary image data  
  - Failures: API errors, image generation failures, rate limits.

- **Binary format**  
  - Type: Code (JavaScript)  
  - Role: Extract and convert the generated image data into binary format required for LinkedIn.  
  - Config: Returns binary data from "Generate an image" node.  
  - Inputs: Image binary from "Generate an image"  
  - Outputs: Binary data for validation  
  - Failures: Data extraction errors.

- **Check Image condition**  
  - Type: If node  
  - Role: Validates presence of image binary data before proceeding.  
  - Config: Checks if `binary.data` exists and is non-empty.  
  - Inputs: From "Binary format"  
  - Outputs:  
    - True: Proceed to merge results.  
    - False: Retry image generation.  
  - Failures: Data absence or empty image data.

---

#### 2.5 Validate and Merge Results

**Overview:**  
Verifies the presence of generated LinkedIn post text and image, then merges them into a single payload suitable for LinkedIn posting.

**Nodes Involved:**  
- Check Generated post  
- Merge both Results  
- Convert to LinkedIn format

**Node Details:**  

- **Check Generated post**  
  - Type: If node  
  - Role: Checks if the extracted LinkedIn post text (`linkedinData`) exists and is non-empty.  
  - Inputs: From "Get Linked Post"  
  - Outputs:  
    - True: Proceed to merge results.  
    - False: Fail workflow or retry.  
  - Failures: Missing or empty post content.

- **Merge both Results**  
  - Type: Merge  
  - Role: Combines validated LinkedIn post text and image binary into a single item.  
  - Inputs:  
    - True branch from "Check Generated post" (post text)  
    - True branch from "Check Image condition" (image binary)  
  - Outputs: Single JSON + binary item for posting.  
  - Failures: Merge conflicts or empty inputs.

- **Convert to LinkedIn format**  
  - Type: Code (JavaScript)  
  - Role: Structures the merged data into the expected format for LinkedIn API.  
  - Config:  
    - Constructs JSON object with `post` content and binary image data with MIME type "image/png".  
  - Inputs: From "Merge both Results"  
  - Outputs: Final payload for LinkedIn node  
  - Failures: Data format issues, missing image or text.

---

#### 2.6 Publish Post & Notification

**Overview:**  
Publishes the combined LinkedIn post with image, checks the post result, and sends email alerts based on success or failure.

**Nodes Involved:**  
- Post to LinkedIn  
- Check Post Result  
- Send Alert Email (Success)  
- Send alert email (Failure)

**Node Details:**  

- **Post to LinkedIn**  
  - Type: LinkedIn node (OAuth2)  
  - Role: Publishes the post on LinkedIn as an organization with image attachment.  
  - Config:  
    - Text: `{{$json.json.post}}` (post content)  
    - Post as: Organization  
    - Binary property name: `{{$json.binary.image}}` (image data)  
    - Share media category: IMAGE  
  - Credentials: LinkedIn OAuth2 account required.  
  - Inputs: Final formatted JSON + binary from "Convert to LinkedIn format"  
  - Outputs: Post response JSON including `urn` identifier for the post.  
  - Failures: Auth errors, API rate limits, invalid content.

- **Check Post Result**  
  - Type: If node  
  - Role: Checks if LinkedIn post response contains a valid `urn` field, indicating success.  
  - Config: Checks existence of `$json.urn`.  
  - Inputs: From "Post to LinkedIn"  
  - Outputs:  
    - True: Proceed to send success alert email.  
    - False: Proceed to send failure alert email.  
  - Failures: Missing or malformed response.

- **Send Alert Email (Success)**  
  - Type: Email Send  
  - Role: Sends a success notification email including a link to the published LinkedIn post.  
  - Config:  
    - To/From: Your configured email address  
    - Subject: "Linked post successfully"  
    - Body includes post URL: `https://www.linkedin.com/feed/update/{{ $json.urn }}`  
  - Credentials: SMTP account configured.  
  - Inputs: From "Check Post Result" (true branch)  
  - Failures: SMTP errors, email delivery failures.

- **Send alert email (Failure)**  
  - Type: Email Send  
  - Role: Sends a failure notification email alerting that the LinkedIn post did not publish.  
  - Config:  
    - To/From: Your configured email address  
    - Subject: "LinkedIn Post Status"  
    - Body: Advises verifying workflow and retrying.  
  - Credentials: SMTP account configured.  
  - Inputs: From "Check Post Result" (false branch)  
  - Failures: SMTP errors.

---

### 3. Summary Table

| Node Name                   | Node Type                        | Functional Role                                       | Input Node(s)                     | Output Node(s)                     | Sticky Note                                                                                   |
|-----------------------------|---------------------------------|-----------------------------------------------------|----------------------------------|-----------------------------------|----------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                  | Starts workflow manually                              | None                             | Set context                       | See note on overall description and trigger setup                                           |
| Set context                 | Set                             | Define posting context variables                      | When clicking ‘Execute workflow’ | Get Latest Topics                 | See note on context and relevant insights                                                   |
| Get Latest Topics           | HTTP Request                    | Fetch latest automation-related topics from Medium   | Set context                     | Relevant Insights                 | See note on context and relevant insights                                                   |
| Relevant Insights           | Code                            | Filter relevant AI/automation insights                | Get Latest Topics               | Generate LinkedIn Post            | See note on context and relevant insights                                                   |
| Generate LinkedIn Post      | OpenAI GPT                      | Generate professional LinkedIn post text              | Relevant Insights               | Get Linked Post, Generate an image | See note on generating LinkedIn post                                                       |
| Get Linked Post             | Set                             | Extract generated post text                            | Generate LinkedIn Post          | Check Generated post              |                                                                                              |
| Generate an image           | OpenAI Image Generation         | Create professional AI-related image                  | Generate LinkedIn Post          | Binary format                    | See note on image generation                                                                |
| Binary format              | Code                            | Convert image to binary format                         | Generate an image               | Check Image condition             | See note on image generation                                                                |
| Check Image condition       | If                              | Validate image presence and readiness                  | Binary format                  | Merge both Results, Generate an image | See note on image generation                                                                |
| Check Generated post        | If                              | Validate LinkedIn post text presence                    | Get Linked Post                | Merge both Results               |                                                                                              |
| Merge both Results          | Merge                           | Combine validated post text and image                   | Check Image condition, Check Generated post | Convert to LinkedIn format        | See note on merging results                                                                 |
| Convert to LinkedIn format  | Code                            | Format combined data for LinkedIn API                   | Merge both Results             | Post to LinkedIn                 | See note on formatting and posting                                                         |
| Post to LinkedIn            | LinkedIn                        | Publish post with image on LinkedIn                     | Convert to LinkedIn format     | Check Post Result                | See note on posting and notification                                                       |
| Check Post Result           | If                              | Verify successful LinkedIn post                          | Post to LinkedIn               | Send Alert Email, Send alert email | See note on post result checking and notifications                                        |
| Send Alert Email            | Email Send                     | Send success notification email                         | Check Post Result (true)       | None                           |                                                                                              |
| Send alert email            | Email Send                     | Send failure notification email                         | Check Post Result (false)      | None                           |                                                                                              |
| Sticky Note                 | Sticky Note                    | Overall workflow description                            | None                         | None                           | Contains detailed workflow overview                                                        |
| Sticky Note1                | Sticky Note                    | Context and insight gathering explanation               | None                         | None                           | Explains trigger and context setup                                                        |
| Sticky Note2                | Sticky Note                    | LinkedIn post generation explanation                     | None                         | None                           | Explains post generation block                                                            |
| Sticky Note3                | Sticky Note                    | Image generation explanation                              | None                         | None                           | Explains image generation and validation                                                  |
| Sticky Note4                | Sticky Note                    | Merging results explanation                               | None                         | None                           | Explains merging step                                                                     |
| Sticky Note5                | Sticky Note                    | Formatting and posting explanation                        | None                         | None                           | Explains final formatting and posting                                                    |
| Sticky Note6                | Sticky Note                    | Post result checking and notification explanation          | None                         | None                           | Explains post result verification and alerts                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node**  
   - Name: "When clicking ‘Execute workflow’"  
   - Purpose: Manual start of the workflow.

2. **Add a Set node**  
   - Name: "Set context"  
   - Purpose: Define static context variables for the author and post scope.  
   - Parameters to set (all string type):  
     - role = "Full Stack Developer & AI Automation Specialist"  
     - core_focus = "AI automation, n8n workflows, backend APIs, frontend systems, analytics"  
     - experience_level = "Hands-on implementation for real businesses"  
     - audience = "Founders, business owners, developers, product teams"  
     - content_rules = "No motivation, no unrelated tech, only real-world experience"  
   - Connect output of Manual Trigger to this node.

3. **Add an HTTP Request node**  
   - Name: "Get Latest Topics"  
   - Purpose: Fetch latest automation topics from Medium RSS feed in JSON format.  
   - Parameters:  
     - URL: `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/tag/automation`  
     - Method: GET  
   - Connect output of "Set context" to this node.

4. **Add a Code node**  
   - Name: "Relevant Insights"  
   - Purpose: Filter for relevant AI/automation insights.  
   - Code:  
     ```javascript
     const data = $input.all() || [];
     const items = data[0].json.items;
     const keywords = [
       'automation',
       'AI',
       'workflow',
       'backend',
       'API',
       'RAG',
       'LLM',
       'n8n'
     ];
     const relevant = items.filter(i => {
       const title = (i.title || '').toLowerCase();
       const description = (i.description || '').toLowerCase();
       return keywords.some(k => title.includes(k) || description.includes(k));
     });
     return [{
       json: {
         latestInsight: relevant.length
           ? `${relevant[0].title}. ${relevant[0].description.substring(0, 2000)}`
           : "Recent trend in AI driven automation and workflow optimazition"
       }
     }];
     ```
   - Connect output of "Get Latest Topics" to this node.

5. **Add an OpenAI GPT node**  
   - Name: "Generate LinkedIn Post"  
   - Purpose: Generate LinkedIn post text using GPT-4.1-mini model.  
   - Parameters:  
     - Model: GPT-4.1-mini  
     - Prompt (User role):  
       ```
       Write a LinkedIn post ONLY about:
       - AI automation
       - n8n workflows
       - backend/frontend systems
       - real business automation experience

       Combine:
       1. Latest industry update
       2. Practical hands-on experience
       3. Clear value for founders and developers

       Rules:
       - No motivational content
       - No unrelated tech
       - Human, professional tone
       - 6–10 short lines
       - Max 3 hashtags
       - Sound like personal experience

       Latest update:

       {{ $json.latestInsight }}
       ```
     - Prompt (System role):  
       ```
       You are a senior Full Stack Developer and AI Automation expert.
       You write from real-world experience only.
       ```
   - Credentials: Configure with OpenAI API key.  
   - Connect output of "Relevant Insights" to this node.

6. **Add a Set node**  
   - Name: "Get Linked Post"  
   - Purpose: Extract the generated LinkedIn post text.  
   - Parameters:  
     - Assign `linkedinData` = `{{$json.output[0].content[0].text}}`  
   - Connect output of "Generate LinkedIn Post" to this node.

7. **Add another OpenAI node for image generation**  
   - Name: "Generate an image"  
   - Purpose: Generate a professional image for the post.  
   - Parameters:  
     - Resource: Image generation  
     - Prompt:  
       ```
       Professional realistic photograph of modern AI automation and workflow systems, backend and frontend communication, cloud servers, data flow visualization, realistic office environment, clean minimal tech style, high resolution, photorealistic, LinkedIn quality, no people, no animation, no illustration, no text overlay

       {{ $('Get Latest Topics').item.json.items[0].title }}
       ```  
   - Credentials: OpenAI API key.  
   - Connect output of "Generate LinkedIn Post" to this node.

8. **Add a Code node**  
   - Name: "Binary format"  
   - Purpose: Extract and convert generated image to binary required by LinkedIn.  
   - Code:  
     ```javascript
     return [{
       json: {
         binary: $items("Generate an image")[0].binary.data
       }
     }];
     ```  
   - Connect output of "Generate an image" to this node.

9. **Add an If node**  
   - Name: "Check Image condition"  
   - Purpose: Verify if image binary data exists.  
   - Condition: Check if `{{$json.binary.data}}` exists and is not empty.  
   - Connect output of "Binary format" to this node.

10. **Add an If node**  
    - Name: "Check Generated post"  
    - Purpose: Verify if LinkedIn post text exists.  
    - Condition: Check if `{{$json.linkedinData}}` exists and is not empty.  
    - Connect output of "Get Linked Post" to this node.

11. **Add a Merge node**  
    - Name: "Merge both Results"  
    - Purpose: Combine validated LinkedIn post text and image binary.  
    - Connect true outputs of both "Check Image condition" and "Check Generated post" nodes to this merge node (use "Wait for Both").

12. **Add a Code node**  
    - Name: "Convert to LinkedIn format"  
    - Purpose: Format merged data for LinkedIn API.  
    - Code:  
      ```javascript
      const imageBinary = $input.all()[0].json;
      const linkedinPost = $input.all()[1].json;

      return {
        json:{
          json: {
            post: linkedinPost.linkedinData
          },
          binary: {
            image:{
              data: imageBinary.binary.data,
              mimeType: "image/png"
            }
          }
        }
      }
      ```  
    - Connect output of "Merge both Results" to this node.

13. **Add LinkedIn node**  
    - Name: "Post to LinkedIn"  
    - Purpose: Publish post as organization with image attached.  
    - Parameters:  
      - Text: `{{$json.json.post}}`  
      - Post as: Organization  
      - Binary property name: `{{$json.binary.image}}`  
      - Share media category: IMAGE  
    - Credentials: LinkedIn OAuth2 account configured.  
    - Connect output of "Convert to LinkedIn format" to this node.

14. **Add an If node**  
    - Name: "Check Post Result"  
    - Purpose: Check if post was successfully published.  
    - Condition: Check if `{{$json.urn}}` exists.  
    - Connect output of "Post to LinkedIn" to this node.

15. **Add Email Send node (success)**  
    - Name: "Send Alert Email"  
    - Purpose: Notify on successful post publishing.  
    - Parameters:  
      - To/From: your email address  
      - Subject: "Linked post successfully"  
      - Text: Includes link to published post: `https://www.linkedin.com/feed/update/{{ $json.urn }}`  
    - Credentials: SMTP account.  
    - Connect true output of "Check Post Result" to this node.

16. **Add Email Send node (failure)**  
    - Name: "Send alert email"  
    - Purpose: Notify on post publishing failure.  
    - Parameters:  
      - To/From: your email address  
      - Subject: "LinkedIn Post Status"  
      - Text: Advises verifying workflow and retrying.  
    - Credentials: SMTP account.  
    - Connect false output of "Check Post Result" to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                         | Context or Link                                                                                              |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| This workflow fully automates LinkedIn posting with AI-generated content and images, combining real-world experience and trending topics.                                                                                          | Workflow overview sticky note                                                                                 |
| Context variables define the professional identity and content scope, ensuring posts remain relevant and focused.                                                                                                                  | Sticky Note1                                                                                                 |
| The LinkedIn post generation uses GPT-4.1-mini with strict prompt rules to maintain professionalism and relevance.                                                                                                                | Sticky Note2                                                                                                 |
| Image generation uses a detailed prompt tailored for LinkedIn-quality, photorealistic images representing AI automation and workflows. Binary conversion and validation ensure compatibility with LinkedIn's image requirements.      | Sticky Note3                                                                                                 |
| The merge step ensures only validated posts and images are combined to avoid publishing incomplete content.                                                                                                                       | Sticky Note4                                                                                                 |
| Final formatting attaches text and image properly for LinkedIn's API and posts as an organization.                                                                                                                                 | Sticky Note5                                                                                                 |
| Post publishing success is verified, triggering email notifications for either confirmation or alert on failure.                                                                                                                  | Sticky Note6                                                                                                 |
| For OpenAI API usage, ensure your API key has access to both GPT-4.1-mini and DALL·E image generation models.                                                                                                                     | OpenAI API credentials                                                                                       |
| LinkedIn OAuth2 credentials must be configured with permissions to post as an organization including image uploads.                                                                                                               | LinkedIn API credentials                                                                                      |
| SMTP credentials must be valid and allow sending emails from the configured address.                                                                                                                                               | SMTP credentials                                                                                             |

---

**Disclaimer:** The text provided originates exclusively from an automated n8n workflow. It complies strictly with content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.