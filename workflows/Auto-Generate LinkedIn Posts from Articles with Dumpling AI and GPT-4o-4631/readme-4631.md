Auto-Generate LinkedIn Posts from Articles with Dumpling AI and GPT-4o

https://n8nworkflows.xyz/workflows/auto-generate-linkedin-posts-from-articles-with-dumpling-ai-and-gpt-4o-4631


# Auto-Generate LinkedIn Posts from Articles with Dumpling AI and GPT-4o

### 1. Workflow Overview

This workflow automates the creation of LinkedIn posts from selected article topics using AI-driven content scraping, summarization, and image generation. It targets content marketers, social media managers, and AI enthusiasts who want to streamline the process of transforming raw article topics into polished LinkedIn posts complete with related visuals.

The workflow is logically divided into two main blocks:

- **1.1 Input Acquisition and AI Processing:**  
  Retrieves topics marked "To do" from a Google Sheet, scrapes relevant articles via Dumpling AI based on those topics, then uses GPT-4o via LangChain to summarize and generate a LinkedIn post and a correlated image prompt.

- **1.2 Output Refinement and Storage:**  
  Extracts AI-generated text and image prompts, generates a visual image with Dumpling AI, and updates the original Google Sheet entry with the new LinkedIn post content, image URL, and updated status.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Acquisition and AI Processing

**Overview:**  
This block initiates the workflow manually, fetches the first "To do" topic from a Google Sheet, scrapes the top 3 relevant articles using Dumpling AI, and leverages GPT-4o via LangChain to generate a LinkedIn post and an image prompt based on the scraped content.

**Nodes Involved:**  
- Start Workflow  
- Get "To do" Topics from Sheet  
- Scrape Articles via Dumpling AI Search  
- Enable GPT-4o for LangChain Agent  
- Summarize 3 Articles + Generate LinkedIn Post + Image Prompt  
- Sticky Note (documentation)

**Node Details:**

- **Start Workflow**  
  - Type: Manual Trigger  
  - Role: Entry point to start the workflow interactively  
  - Parameters: None  
  - Connections: Outputs to "Get 'To do' Topics from Sheet"  
  - Edge Cases: Manual trigger required; no automated scheduling  
  - Version: 1

- **Get "To do" Topics from Sheet**  
  - Type: Google Sheets  
  - Role: Fetches the first row where "Status" column equals "To do" from a specified Google Sheet (content library)  
  - Configuration:  
    - Filters on `Status = "To do"`  
    - Returns first match only  
    - Sheet name and document ID linked to the content library Google Sheet  
  - Credentials: Google Sheets OAuth2  
  - Connections: Outputs to "Scrape Articles via Dumpling AI Search"  
  - Edge Cases:  
    - No "To do" rows will cause no output and halt downstream nodes  
    - Google Sheets API quota or auth errors possible  
  - Version: 4.6

- **Scrape Articles via Dumpling AI Search**  
  - Type: HTTP Request  
  - Role: Sends a POST request to Dumpling AI API to search and scrape the top 3 articles related to the topic  
  - Configuration:  
    - URL: `https://app.dumplingai.com/api/v1/search`  
    - Method: POST  
    - Body: JSON including query from the topic field and request to scrape 3 results  
    - Auth: HTTP header authentication using Dumpling AI credentials  
  - Key Expression: `{{ $json.Topic }}` for query  
  - Connections: Outputs to "Summarize 3 Articles + Generate LinkedIn Post + Image Prompt"  
  - Edge Cases:  
    - API rate limits or downtime  
    - Empty or malformed query  
    - Network timeouts  
  - Version: 4.2

- **Enable GPT-4o for LangChain Agent**  
  - Type: LangChain OpenAI Chat Node  
  - Role: Provides GPT-4o model capabilities for downstream LangChain agent node  
  - Configuration:  
    - Model: gpt-4o-mini  
    - Response format: JSON object  
  - Credentials: OpenAI API Key  
  - Connections: Connects to "Summarize 3 Articles + Generate LinkedIn Post + Image Prompt" as language model input  
  - Edge Cases:  
    - API key limits or invalid credentials  
    - Model unavailable or throttled  
  - Version: 1.2

- **Summarize 3 Articles + Generate LinkedIn Post + Image Prompt**  
  - Type: LangChain Agent Node  
  - Role: Combines three scraped articles into a structured LinkedIn post and an image prompt using GPT-4o  
  - Configuration:  
    - Input Text: Content of top 3 scraped articles interpolated into prompt  
    - System Message: Detailed agent instructions specifying tone, length, no hashtags/emojis, punctuation rules, and JSON output format with `postText` and `imagePrompt` keys  
  - Connections: Outputs to "Extract Post Text and Image Prompt"  
  - Edge Cases:  
    - Malformed or incomplete article content  
    - Parsing errors if AI output deviates from expected JSON format  
    - Timeout or API errors  
  - Version: 1.9

- **Sticky Note**  
  - Type: Sticky Note (Documentation)  
  - Content: Explains block purpose: fetching topics, scraping articles, summarizing with GPT-4o, and generating LinkedIn post + image prompt  
  - Position: Visually groups above nodes  

---

#### 2.2 Output Refinement and Storage

**Overview:**  
This block extracts the LinkedIn post text and image prompt from the AI output, generates a relevant image using Dumpling AI’s image generation endpoint, and updates the Google Sheet with the new content and status.

**Nodes Involved:**  
- Extract Post Text and Image Prompt  
- Generate Image with Dumpling AI  
- Update Google Sheet with Post & Image  
- Sticky Note (documentation)

**Node Details:**

- **Extract Post Text and Image Prompt**  
  - Type: Set Node  
  - Role: Parses AI agent JSON output and extracts `postText` and `imagePrompt` into separate fields for downstream use  
  - Configuration:  
    - Assignments using expressions:  
      - `postText = JSON.parse($json["output"]).postText`  
      - `imagePrompt = JSON.parse($json["output"]).imagePrompt`  
  - Connections: Outputs to "Generate Image with Dumpling AI"  
  - Edge Cases:  
    - Parsing errors if AI output is not valid JSON  
    - Missing keys in output  
  - Version: 3.4

- **Generate Image with Dumpling AI**  
  - Type: HTTP Request  
  - Role: Sends image prompt to Dumpling AI image generation API to create a LinkedIn post visual  
  - Configuration:  
    - URL: `https://app.dumplingai.com/api/v1/generate-ai-image`  
    - Method: POST  
    - Body JSON includes model `FLUX.1-pro` and prompt from extracted `imagePrompt` field  
    - Auth: HTTP header authentication with Dumpling AI credentials  
  - Connections: Outputs to "Update Google Sheet with Post & Image"  
  - Edge Cases:  
    - API limits, downtime, or invalid prompt causing errors  
    - Image generation delays or failures  
  - Version: 4.2

- **Update Google Sheet with Post & Image**  
  - Type: Google Sheets  
  - Role: Updates the original topic row in the content library sheet with generated LinkedIn post, image URL, and sets status to "created"  
  - Configuration:  
    - Match by `Topic` column  
    - Updates columns: `Content` (postText), `Image` (first image URL from generated images array), `Status` = "created"  
    - Uses same sheet and document IDs as input node  
  - Credentials: Google Sheets OAuth2  
  - Edge Cases:  
    - Row not found or multiple matches causing update errors  
    - API quota or authentication failure  
  - Version: 4.6

- **Sticky Note1**  
  - Type: Sticky Note (Documentation)  
  - Content: Describes the extraction of AI output, image generation, and Google Sheet update to complete the posting workflow  
  - Position: Groups nodes described above  

---

### 3. Summary Table

| Node Name                                   | Node Type                          | Functional Role                                             | Input Node(s)                      | Output Node(s)                             | Sticky Note                                                                                               |
|---------------------------------------------|----------------------------------|-------------------------------------------------------------|-----------------------------------|--------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| Start Workflow                              | Manual Trigger                   | Initiates workflow manually                                 | None                              | Get "To do" Topics from Sheet              | 📚 Get Topic and Summarize Articles with AI - This part starts the workflow manually, pulls the first "To do" topic, etc. |
| Get "To do" Topics from Sheet               | Google Sheets                   | Retrieves first "To do" topic from Google Sheet             | Start Workflow                   | Scrape Articles via Dumpling AI Search     | 📚 Get Topic and Summarize Articles with AI                                                               |
| Scrape Articles via Dumpling AI Search      | HTTP Request                   | Scrapes top 3 articles for topic via Dumpling AI            | Get "To do" Topics from Sheet      | Summarize 3 Articles + Generate LinkedIn Post + Image Prompt | 📚 Get Topic and Summarize Articles with AI                                                               |
| Enable GPT-4o for LangChain Agent           | LangChain OpenAI Chat           | Provides GPT-4o model for LangChain agent                   | None (model input for agent)      | Summarize 3 Articles + Generate LinkedIn Post + Image Prompt | 📚 Get Topic and Summarize Articles with AI                                                               |
| Summarize 3 Articles + Generate LinkedIn Post + Image Prompt | LangChain Agent                 | Generates LinkedIn post and image prompt from articles      | Scrape Articles via Dumpling AI Search, Enable GPT-4o for LangChain Agent | Extract Post Text and Image Prompt              | 📚 Get Topic and Summarize Articles with AI                                                               |
| Extract Post Text and Image Prompt          | Set                            | Parses AI JSON output to extract post text and image prompt | Summarize 3 Articles + Generate LinkedIn Post + Image Prompt | Generate Image with Dumpling AI                 | 🧠 Refine Output and Store Content - Once AI returns output, extract fields, generate image, update sheet. |
| Generate Image with Dumpling AI              | HTTP Request                   | Generates image from prompt using Dumpling AI                | Extract Post Text and Image Prompt | Update Google Sheet with Post & Image        | 🧠 Refine Output and Store Content                                                                         |
| Update Google Sheet with Post & Image        | Google Sheets                  | Updates sheet row with post content, image URL, and status  | Generate Image with Dumpling AI     | None                                       | 🧠 Refine Output and Store Content                                                                         |
| Sticky Note                                  | Sticky Note                    | Documentation of first logical block                        | None                              | None                                       | 📚 Get Topic and Summarize Articles with AI                                                               |
| Sticky Note1                                 | Sticky Note                    | Documentation of second logical block                       | None                              | None                                       | 🧠 Refine Output and Store Content                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node**  
   - Name: "Start Workflow"  
   - Purpose: Entry trigger to start workflow interactively  
   - No parameters needed

2. **Add Google Sheets Node to Fetch Topic**  
   - Name: "Get 'To do' Topics from Sheet"  
   - Operation: Read Rows  
   - Sheet name: Select the sheet (e.g., "Sheet1") in your content library Google Sheet document  
   - Document ID: Set to your Google Sheet containing topics  
   - Filters: Filter rows where `Status` column equals `"To do"`  
   - Options: Return only the first match  
   - Credentials: Use Google Sheets OAuth2 authentication  
   - Connect "Start Workflow" output to this node

3. **Add HTTP Request Node to Scrape Articles**  
   - Name: "Scrape Articles via Dumpling AI Search"  
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/search`  
   - Authentication: HTTP Header Auth with Dumpling AI API Key  
   - Body Type: JSON  
   - Body:  
     ```json
     {
       "query": "{{ $json.Topic }}",
       "numResultsToScrape": 3,
       "scrapeResults": true
     }
     ```  
   - Connect "Get 'To do' Topics from Sheet" output to this node

4. **Add LangChain OpenAI Chat Node for GPT-4o Model**  
   - Name: "Enable GPT-4o for LangChain Agent"  
   - Model: Select "gpt-4o-mini"  
   - Response Format: JSON object  
   - Credentials: OpenAI API key  
   - No direct input connection; this node acts as a language model resource for the agent node

5. **Add LangChain Agent Node to Summarize and Generate Post**  
   - Name: "Summarize 3 Articles + Generate LinkedIn Post + Image Prompt"  
   - Text input: Inject scraped article contents as:  
     ```
     Article 1: {{ $json.organic[0].scrapeOutput.content }}

     Article 2: {{ $json.organic[1].scrapeOutput.content }}

     Article 3: {{ $json.organic[2].scrapeOutput.content }}
     ```  
   - System message prompt:  
     ```
     You are a professional AI content assistant. Based on the 3 articles I will provide, generate a LinkedIn post and also create an image prompt that visually represents the message of the post.

     Instructions:

     Read all 3 articles.

     Combine key insights from them into a single LinkedIn post.

     Write the post in a conversational, professional tone — no robotic language.

     The first line must grab attention and spark curiosity.

     Avoid hashtags, emojis, and clickbait phrases.

     Keep the post under 1,300 characters.

     Use correct punctuation only. Do not use hyphens.

     After writing the post, generate a short and clear image prompt that can be used to create a LinkedIn graphic. It should be based on the main message or visual idea from the post.

     Return your response in the following JSON format:

     {
       "postText": "Write the full LinkedIn post here...",
       "imagePrompt": "A short visual prompt that summarizes the theme of the post, such as 'A modern workspace with AI-powered tools automating business processes'"
     }
     ```  
   - Prompt Type: Define (custom prompt)  
   - Connect "Scrape Articles via Dumpling AI Search" and "Enable GPT-4o for LangChain Agent" (as language model) to this node

6. **Add Set Node to Extract AI Output Fields**  
   - Name: "Extract Post Text and Image Prompt"  
   - Assign two string variables:  
     - `postText` = `={{ JSON.parse($json["output"]).postText }}`  
     - `imagePrompt` = `={{ JSON.parse($json["output"]).imagePrompt }}`  
   - Connect output of LangChain Agent node to this node

7. **Add HTTP Request Node to Generate Image**  
   - Name: "Generate Image with Dumpling AI"  
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/generate-ai-image`  
   - Authentication: HTTP Header Auth with Dumpling AI API Key  
   - Body type: JSON  
   - Body:  
     ```json
     {
       "model": "FLUX.1-pro",
       "input": {
         "prompt": "{{ $json.imagePrompt }}"
       }
     }
     ```  
   - Connect "Extract Post Text and Image Prompt" output to this node

8. **Add Google Sheets Node to Update Row**  
   - Name: "Update Google Sheet with Post & Image"  
   - Operation: Update Row  
   - Sheet name and Document ID: Same as initial Google Sheets node  
   - Matching Columns: `Topic`  
   - Fields to update:  
     - `Content` = `{{ $('Extract Post Text and Image Prompt').item.json.postText }}`  
     - `Image` = `{{ $json.images[0].url }}` (first image URL from Dumpling AI response)  
     - `Status` = `"created"`  
   - Credentials: Google Sheets OAuth2  
   - Connect "Generate Image with Dumpling AI" output to this node

---

### 5. General Notes & Resources

| Note Content                                                                                                                                | Context or Link                                                                                           |
|---------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| This workflow combines real-time web scraping with advanced AI summarization and image generation to automate LinkedIn content creation.    | Branding and usage notes embedded in sticky notes within the workflow                                    |
| Dumpling AI API documentation: https://app.dumplingai.com/docs                                                                              | Reference for API endpoints and authentication                                                          |
| LangChain n8n integration details: https://docs.n8n.io/integrations/nodes/n8n-nodes-langchain/                                              | For configuring LangChain nodes with OpenAI models                                                      |
| Google Sheets API quota and error handling best practices apply due to read/write operations                                                | Important for reliable integration with Google Sheets                                                    |

---

**Disclaimer:**  
The provided text is derived exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled are legal and publicly available.