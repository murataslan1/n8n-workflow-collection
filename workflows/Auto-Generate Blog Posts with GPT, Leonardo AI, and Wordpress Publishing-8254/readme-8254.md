Auto-Generate Blog Posts with GPT, Leonardo AI, and Wordpress Publishing

https://n8nworkflows.xyz/workflows/auto-generate-blog-posts-with-gpt--leonardo-ai--and-wordpress-publishing-8254


# Auto-Generate Blog Posts with GPT, Leonardo AI, and Wordpress Publishing

### 1. Workflow Overview

This workflow automates the generation and publishing of long-form blog posts based on a user-supplied topic. It uses AI models (OpenAI GPT and Leonardo AI) to research, write, revise, and enhance content, create editorial-style images, and then publish the post on a WordPress site.

The workflow is logically divided into these functional blocks:

- **1.1 Input Reception and Topic Extraction:** Listens for manual trigger or message input and extracts a clean blog topic.
- **1.2 Style and Research Prompt Construction:** Defines style guidelines and builds the prompt for the AI research writer.
- **1.3 AI Research and Draft Generation:** Sends prompt to GPT to create a draft blog post with structured sections and citations.
- **1.4 Draft Improvement and Word Count Validation:** Revises the draft for tone and clarity, and checks if the word count meets the minimum threshold. If not, expands the draft.
- **1.5 Content Parsing and Image Prompt Generation:** Parses the AI output, extracts title and content, and generates a descriptive prompt for image creation.
- **1.6 Image Generation and Retrieval:** Uses Leonardo AI to generate an editorial image based on the prompt, waits for completion, and downloads the image.
- **1.7 WordPress Media Upload and Post Publication:** Uploads the image to WordPress with alt text, then creates and publishes the blog post associating the image as featured media.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Topic Extraction

- **Overview:** Begins the workflow on manual trigger, extracts a reliable topic string from various possible input formats.
- **Nodes Involved:** When clicking ‘Execute workflow’, Extract Topic, Style
- **Node Details:**

  - **When clicking ‘Execute workflow’**
    - Type: Manual Trigger
    - Role: Entry point for manual execution.
    - Config: No parameters.
    - Inputs: None
    - Outputs: To Extract Topic
    - Edge cases: None

  - **Extract Topic**
    - Type: Code
    - Role: Robustly extracts a text topic from diverse message payloads, supporting commands like `/topic …` or `topic: …`.
    - Configuration: Uses JavaScript to check multiple JSON paths and fallback values, cleans prefixes, returns a default topic if none found.
    - Expressions: Uses `$json` context extensively.
    - Inputs: From manual trigger
    - Outputs: To Style node
    - Edge cases: Missing or empty input triggers a default topic and help message.

  - **Style**
    - Type: Code
    - Role: Defines the editorial style guide, dos and don’ts for blog writing.
    - Configuration: Returns a combined style guide string, array of dos and donts.
    - Inputs: From Extract Topic
    - Outputs: To Build Chat Research Body
    - Edge cases: None
    - Sticky note: "Builds the style of Blog and research body."

#### 2.2 Style and Research Prompt Construction

- **Overview:** Builds the research prompt body for GPT using the extracted topic and style guide.
- **Nodes Involved:** Build Chat Research Body, Research Topic – GPT
- **Node Details:**

  - **Build Chat Research Body**
    - Type: Code
    - Role: Constructs a detailed JSON prompt for GPT to generate a long-form blog post research draft.
    - Configuration: Picks topic from Extract Topic or fallback fields; embeds style guide, dos, and donts; specifies sections required and HTML tags allowed.
    - Expressions: Accesses `$node` for Style and Extract Topic.
    - Inputs: From Style
    - Outputs: To Research Topic – GPT
    - Edge cases: Throws error if no topic found.

  - **Research Topic – GPT**
    - Type: HTTP Request (OpenAI Chat Completion)
    - Role: Sends the research prompt to OpenAI GPT API to generate draft post content.
    - Configuration: Uses `gpt-4o-mini` model, temperature 0.6, expects JSON object response.
    - Credentials: Uses OpenAI API credentials.
    - Inputs: From Build Chat Research Body
    - Outputs: To Build Tone Request
    - Edge cases: API errors, auth failures, response JSON parse errors.
    - Sticky note: "Reasearch's and revises the tone and format"

#### 2.3 AI Research and Draft Generation

- **Overview:** Refines draft tone and format using a second GPT call.
- **Nodes Involved:** Build Tone Request, Tone & Format Revision – GPT
- **Node Details:**

  - **Build Tone Request**
    - Type: Code
    - Role: Prepares prompt for GPT editor to improve clarity and flow without changing facts or structure.
    - Configuration: Embeds style guide, dos/donts, and article JSON from previous node.
    - Inputs: From Research Topic – GPT
    - Outputs: To Tone & Format Revision – GPT
    - Edge cases: Possibly missing or malformed article JSON.

  - **Tone & Format Revision – GPT**
    - Type: HTTP Request (OpenAI Chat Completion)
    - Role: Sends editing prompt to GPT to polish the draft.
    - Configuration: Model `gpt-4o-mini`, temperature 0.4, expects JSON object.
    - Credentials: OpenAI API
    - Inputs: From Build Tone Request
    - Outputs: To Word Count Guard
    - Edge cases: API failures, timeouts, invalid JSON response.
    - Sticky note: "Reasearch's and revises the tone and format"

#### 2.4 Draft Improvement and Word Count Validation

- **Overview:** Checks if draft meets a 1600-word minimum; if not, requests expansion before continuing.
- **Nodes Involved:** Word Count Guard, If, Expand Draft, Get Title, Content, and Image FileName
- **Node Details:**

  - **Word Count Guard**
    - Type: Code
    - Role: Strips HTML tags, counts words, flags drafts shorter than 1600 words for expansion.
    - Configuration: Returns either the draft with word count or a flag `need_expand=true`.
    - Inputs: From Tone & Format Revision – GPT
    - Outputs: To If
    - Edge cases: HTML with unexpected tags; very short content.

  - **If**
    - Type: Conditional (If)
    - Role: Routes workflow based on `need_expand` boolean.
    - Configuration: Checks if `$json.need_expand == true`.
    - Inputs: From Word Count Guard
    - Outputs:
      - True: To Expand Draft (draft expansion)
      - False: To Get Title, Content, and Image FileName (next step)
    - Edge cases: Missing `need_expand` field.

  - **Expand Draft**
    - Type: Langchain OpenAI Node
    - Role: Requests GPT-4.1 to expand the article to exceed 1800 words focusing on key sections.
    - Configuration: Uses GPT-4.1, message includes current draft JSON.
    - Credentials: OpenAI API
    - Inputs: From If (true branch)
    - Outputs: To Get Title, Content, and Image FileName
    - Edge cases: API errors, parsing JSON failures.
    - Sticky note: "Ensures post is above 1600 words."

  - **Get Title, Content, and Image FileName**
    - Type: Code
    - Role: Parses GPT response to extract and clean title, content, and generate slug-based image filename; appends sources section.
    - Configuration: Includes helper functions for slugifying and extracting sources URLs.
    - Inputs: From Expand Draft or directly from If (false branch)
    - Outputs: To Message a model (image prompt generation)
    - Edge cases: Parsing invalid JSON, missing fields.

#### 2.5 Content Parsing and Image Prompt Generation

- **Overview:** Generates an image prompt describing a cinematic editorial image representing the article.
- **Nodes Involved:** Message a model, Leonardo: Create Post Image
- **Node Details:**

  - **Message a model**
    - Type: Langchain OpenAI Node
    - Role: Generates a concise English prompt for Leonardo AI to create an editorial blog image.
    - Configuration: Uses GPT-4.1-mini, includes system instructions and article title/content context.
    - Credentials: OpenAI API
    - Inputs: From Get Title, Content, and Image FileName
    - Outputs: To Leonardo: Create Post Image
    - Edge cases: API failures.

  - **Leonardo: Create Post Image**
    - Type: HTTP Request
    - Role: Calls Leonardo AI API to generate an image based on the prompt.
    - Configuration: Posts JSON with prompt, modelId, resolution, scheduling, and other parameters.
    - Credentials: Bearer token for Leonardo API
    - Inputs: From Message a model
    - Outputs: To Code (extract generation ID)
    - Edge cases: API errors, rate limits.
    - Sticky note: "Creates prompt for image and creates image."

  - **Code** (after Leonardo create)
    - Type: Code
    - Role: Extracts generationId from Leonardo API response for tracking.
    - Inputs: From Leonardo create image node
    - Outputs: To Wait
    - Edge cases: Missing or malformed generationId.

#### 2.6 Image Generation and Retrieval

- **Overview:** Waits for Leonardo image generation to complete, fetches final image URL, and downloads the image binary.
- **Nodes Involved:** Wait, Get Leonardo Image Status, Get Leonardo Image
- **Node Details:**

  - **Wait**
    - Type: Wait
    - Role: Pauses workflow for 30 seconds to allow Leonardo image generation.
    - Inputs: From Code (generationId)
    - Outputs: To Get Leonardo Image Status
    - Edge cases: Fixed wait time may be insufficient for slow generation.

  - **Get Leonardo Image Status**
    - Type: HTTP Request
    - Role: Polls Leonardo API for image generation status using generationId.
    - Inputs: From Wait
    - Outputs: To Get Leonardo Image
    - Credentials: Bearer token for Leonardo API
    - Edge cases: API failures, generation not ready.

  - **Get Leonardo Image**
    - Type: HTTP Request
    - Role: Downloads the generated image binary from the URL provided by Leonardo.
    - Inputs: From Get Leonardo Image Status
    - Outputs: To Upload Image to Wordpress
    - Edge cases: Download failures, network issues.

#### 2.7 WordPress Media Upload and Post Publication

- **Overview:** Uploads image to WordPress media library, sets alt text, and publishes the blog post with image attached.
- **Nodes Involved:** Upload Image to Wordpress, Add ALT to Image, Create WordPress Post
- **Node Details:**

  - **Upload Image to Wordpress**
    - Type: HTTP Request
    - Role: Uploads the image binary to WordPress media endpoint.
    - Configuration: Uses OAuth2 authentication; sets headers for content disposition and type; filename from previous node.
    - Inputs: From Get Leonardo Image
    - Outputs: To Add ALT to Image
    - Edge cases: Auth failures, API errors, incorrect site URL placeholder.
    - Sticky note: "Posts to your worspress."

  - **Add ALT to Image**
    - Type: HTTP Request
    - Role: Updates uploaded image media item with alt text from AI-generated image prompt.
    - Configuration: PUT request to WordPress media endpoint with alt_text body.
    - Inputs: From Upload Image to Wordpress
    - Outputs: To Create WordPress Post
    - Edge cases: Media ID missing, API errors.

  - **Create WordPress Post**
    - Type: HTTP Request
    - Role: Creates and publishes a new blog post with title, content, category, and featured media image.
    - Configuration: Uses OAuth2; JSON body includes title, content, status=publish, category ID 916, and image media ID.
    - Inputs: From Add ALT to Image
    - Outputs: None (end node)
    - Edge cases: Invalid site URL placeholder, API errors.

---

### 3. Summary Table

| Node Name                        | Node Type                   | Functional Role                          | Input Node(s)                      | Output Node(s)                     | Sticky Note                                     |
|---------------------------------|-----------------------------|----------------------------------------|----------------------------------|----------------------------------|------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger              | Entry point for manual execution       | None                             | Extract Topic                    |                                                |
| Extract Topic                   | Code                        | Extracts/cleans topic from input       | When clicking ‘Execute workflow’ | Style                           |                                                |
| Style                          | Code                        | Defines blog writing style guide       | Extract Topic                   | Build Chat Research Body         | Builds the style of Blog and research body.    |
| Build Chat Research Body       | Code                        | Builds GPT research prompt body        | Style                          | Research Topic – GPT             |                                                |
| Research Topic – GPT           | HTTP Request (OpenAI)       | Generates draft blog post content      | Build Chat Research Body        | Build Tone Request              | Reasearch's and revises the tone and format    |
| Build Tone Request             | Code                        | Builds GPT prompt for editing draft    | Research Topic – GPT            | Tone & Format Revision – GPT    | Reasearch's and revises the tone and format    |
| Tone & Format Revision – GPT   | HTTP Request (OpenAI)       | Polishes draft clarity and flow        | Build Tone Request              | Word Count Guard                | Reasearch's and revises the tone and format    |
| Word Count Guard               | Code                        | Checks if draft meets minimum length   | Tone & Format Revision – GPT    | If                             | Ensures post is above 1600 words.               |
| If                            | If Condition                | Routes for draft expansion or next step| Word Count Guard               | Expand Draft (true), Get Title… (false) |                                                |
| Expand Draft                  | Langchain OpenAI            | Expands draft to meet word count       | If (true branch)               | Get Title, Content, and Image FileName | Ensures post is above 1600 words.               |
| Get Title, Content, and Image FileName | Code                  | Parses GPT output, extracts title/content and image filename | If (false branch), Expand Draft | Message a model                 |                                                |
| Message a model               | Langchain OpenAI            | Generates image prompt for Leonardo AI | Get Title, Content, and Image FileName | Leonardo: Create Post Image    | Creates prompt for image and creates image.     |
| Leonardo: Create Post Image   | HTTP Request                | Sends prompt to Leonardo AI for image  | Message a model                | Code                          | Creates prompt for image and creates image.     |
| Code                         | Code                        | Extracts generation ID from Leonardo   | Leonardo: Create Post Image    | Wait                          |                                                |
| Wait                         | Wait                        | Waits 30 seconds for image generation  | Code                          | Get Leonardo Image Status      |                                                |
| Get Leonardo Image Status     | HTTP Request                | Polls Leonardo for generation status   | Wait                          | Get Leonardo Image             |                                                |
| Get Leonardo Image            | HTTP Request                | Downloads generated image binary       | Get Leonardo Image Status      | Upload Image to Wordpress      |                                                |
| Upload Image to Wordpress     | HTTP Request                | Uploads image to WordPress media       | Get Leonardo Image             | Add ALT to Image               | Posts to your worspress.                         |
| Add ALT to Image              | HTTP Request                | Adds alt text to uploaded image        | Upload Image to Wordpress      | Create WordPress Post          | Posts to your worspress.                         |
| Create WordPress Post         | HTTP Request                | Creates and publishes WordPress post   | Add ALT to Image               | None                         | Posts to your worspress.                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node**  
   - Name: `When clicking ‘Execute workflow’`  
   - No special parameters.

2. **Add a Code node named `Extract Topic`**  
   - JavaScript extracts a clean topic string from various input fields, supports `/topic` or `topic:` prefixes, defaults to a sample topic if none provided.

3. **Add a Code node named `Style`**  
   - Define a multi-line style guide string, arrays of dos and don'ts as per the provided style rules for blog writing.

4. **Connect `Extract Topic` → `Style`**

5. **Add a Code node named `Build Chat Research Body`**  
   - Build the JSON body for the GPT research prompt: include model name (`gpt-4o-mini`), instructions, style guide, dos, don'ts, and topic.

6. **Connect `Style` → `Build Chat Research Body`**

7. **Add an HTTP Request node named `Research Topic – GPT`**  
   - POST to `https://api.openai.com/v1/chat/completions`  
   - Authentication: OpenAI API credential  
   - Body: JSON from previous node  
   - Model: `gpt-4o-mini`  
   - Temperature: 0.6

8. **Connect `Build Chat Research Body` → `Research Topic – GPT`**

9. **Add a Code node named `Build Tone Request`**  
   - Prepare GPT prompt for editing: clarity and flow improvements only  
   - Include style guide, dos/donts, and article JSON from previous node

10. **Connect `Research Topic – GPT` → `Build Tone Request`**

11. **Add an HTTP Request node named `Tone & Format Revision – GPT`**  
    - POST to OpenAI chat completions endpoint  
    - Authentication: OpenAI API  
    - Model: `gpt-4o-mini`  
    - Temperature: 0.4  
    - Body: JSON from previous node

12. **Connect `Build Tone Request` → `Tone & Format Revision – GPT`**

13. **Add a Code node named `Word Count Guard`**  
    - Strip HTML tags, count words, check if ≥1600  
    - If not, output `need_expand: true` with draft

14. **Connect `Tone & Format Revision – GPT` → `Word Count Guard`**

15. **Add an If node named `If`**  
    - Condition: `$json.need_expand == true`  
    - True branch → Expand Draft  
    - False branch → Get Title, Content, and Image FileName

16. **Connect `Word Count Guard` → `If`**

17. **Add a Langchain OpenAI node named `Expand Draft`**  
    - Model: `gpt-4.1`  
    - Message: System role requests draft expansion to exceed 1800 words focusing on key sections  
    - Credentials: OpenAI API

18. **Connect `If` true output → `Expand Draft`**

19. **Add a Code node named `Get Title, Content, and Image FileName`**  
    - Parse GPT JSON response safely  
    - Extract title, content, create slug for image filename  
    - Append sources section with extracted URLs

20. **Connect `If` false output → `Get Title, Content, and Image FileName`**  
    **Connect `Expand Draft` → `Get Title, Content, and Image FileName`**

21. **Add a Langchain OpenAI node named `Message a model`**  
    - Model: `gpt-4.1-mini`  
    - System prompt to generate cinematic editorial image prompt without text/logos  
    - User prompt includes article title and content  
    - Credentials: OpenAI API

22. **Connect `Get Title, Content, and Image FileName` → `Message a model`**

23. **Add an HTTP Request node named `Leonardo: Create Post Image`**  
    - POST to `https://cloud.leonardo.ai/api/rest/v1/generations`  
    - Authentication: Bearer token (Leonardo API)  
    - JSON body includes prompt from previous node, modelId, width/height, and other parameters

24. **Connect `Message a model` → `Leonardo: Create Post Image`**

25. **Add a Code node named `Code`**  
    - Extract `generationId` from Leonardo response JSON

26. **Connect `Leonardo: Create Post Image` → `Code`**

27. **Add a Wait node named `Wait`**  
    - Wait 30 seconds

28. **Connect `Code` → `Wait`**

29. **Add an HTTP Request node named `Get Leonardo Image Status`**  
    - GET `https://cloud.leonardo.ai/api/rest/v1/generations/{{ $json.generationId }}`  
    - Authentication: Bearer token (Leonardo API)

30. **Connect `Wait` → `Get Leonardo Image Status`**

31. **Add an HTTP Request node named `Get Leonardo Image`**  
    - GET the image URL from previous node response JSON

32. **Connect `Get Leonardo Image Status` → `Get Leonardo Image`**

33. **Add an HTTP Request node named `Upload Image to Wordpress`**  
    - POST to `https://public-api.wordpress.com/wp/v2/sites/YOUR_SITE/media`  
    - Authentication: OAuth2 (WordPress)  
    - Content-Type: image/jpeg  
    - Content-Disposition: attachment; filename from previous node’s image filename  
    - Body: binary data from `Get Leonardo Image`

34. **Connect `Get Leonardo Image` → `Upload Image to Wordpress`**

35. **Add an HTTP Request node named `Add ALT to Image`**  
    - PUT to `https://public-api.wordpress.com/wp/v2/sites/YOUR_SITE/media/{{ $json.id }}`  
    - Authentication: OAuth2  
    - Body parameter: alt_text from `Message a model` prompt content

36. **Connect `Upload Image to Wordpress` → `Add ALT to Image`**

37. **Add an HTTP Request node named `Create WordPress Post`**  
    - POST to `https://public-api.wordpress.com/wp/v2/sites/YOUR_SITE/posts`  
    - Authentication: OAuth2  
    - JSON body includes: title, content, status "publish", categories [916], featured_media ID from uploaded image

38. **Connect `Add ALT to Image` → `Create WordPress Post`**

39. **(Optional) Add Sticky Notes** at strategic points for clarity, e.g.:  
    - After `Extract Topic` and `Style`: "Builds the style of Blog and research body."  
    - Around draft editing nodes: "Research and revises the tone and format."  
    - Near `Word Count Guard` and `Expand Draft`: "Ensures post is above 1600 words."  
    - Around image generation nodes: "Creates prompt for image and creates image."  
    - Near WordPress upload and posting: "Posts to your WordPress."

---

### 5. General Notes & Resources

| Note Content                                                                                                 | Context or Link                                         |
|--------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Remember to replace all `YOUR_SITE` placeholders in WordPress API URLs with your actual WordPress site slug. | Critical for WordPress API requests to succeed.        |
| API Credentials for OpenAI and Leonardo AI must be configured in n8n credentials before running workflow.    | See n8n docs for setting up OAuth2/OpenAI/Bearer tokens.|
| Style guide emphasizes clean HTML: only `<p>, <h2>, <ul>, <ol>, <li>, <strong>, <em>, <a>` allowed.          | Ensures compatibility with WordPress editor and SEO.  |
| Word count threshold is set at 1600 words minimum to ensure substantive content.                             | May be adjusted as needed.                              |
| Leonardo AI image generation uses a cinematic editorial style prompt to produce featured images suitable for Google News. | Enhances blog visual appeal and SEO.                    |
| Workflow uses retries on nodes interacting with external APIs to handle transient failures gracefully.       | Improves robustness of automation.                      |

---

This document provides a comprehensive reference and reconstruction guide for the entire Auto-Generate Blog Posts with GPT, Leonardo AI, and WordPress Publishing workflow. It supports both modification and reimplementation in n8n environments.