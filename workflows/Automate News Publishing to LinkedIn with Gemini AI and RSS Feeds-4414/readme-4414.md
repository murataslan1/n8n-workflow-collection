Automate News Publishing to LinkedIn with Gemini AI and RSS Feeds

https://n8nworkflows.xyz/workflows/automate-news-publishing-to-linkedin-with-gemini-ai-and-rss-feeds-4414


# Automate News Publishing to LinkedIn with Gemini AI and RSS Feeds

### 1. Workflow Overview

This workflow automates the process of publishing curated news content from multiple RSS feeds to LinkedIn, enhanced by AI-powered content analysis, summary, hashtag generation, and image creation using Google Gemini AI. It is designed for content marketers, social media managers, and AI enthusiasts who want to streamline sharing relevant news articles with professional, engaging LinkedIn posts.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Scheduled trigger activates periodic fetching of news from multiple RSS feeds.
- **1.2 Data Preparation and Filtering:** Transforms and filters news items by recency and limits quantity.
- **1.3 AI Content Analysis:** Uses Google Gemini-powered LangChain agents to analyze and summarize news articles.
- **1.4 Hashtag Generation:** Generates relevant and trending AI-related hashtags based on article content and categories.
- **1.5 Post Content Assembly:** Combines analyzed data and hashtags to create a structured LinkedIn post prompt.
- **1.6 Post Generation:** Uses AI to generate the final LinkedIn post text.
- **1.7 Image Creation:** Generates a professional image for the LinkedIn post via Gemini AI and converts it for upload.
- **1.8 Publication and Record-Keeping:** Publishes the post on LinkedIn, generates a QR code for the post URL, saves the QR code image file, and logs the post details in Google Sheets.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block triggers the workflow on a schedule and reads news from three RSS feeds.
- **Nodes Involved:** Schedule Trigger, RSS Read Testing Catalog, RSS Read marktechpost, RSS LatinxinAI, Merge
- **Node Details:**
  - **Schedule Trigger**
    - Type: scheduleTrigger
    - Configured to trigger weekly on Tuesday, Wednesday, Thursday, and Sunday at 15:00 (3 PM) in the America/Guayaquil timezone.
    - Inputs: None (trigger node)
    - Outputs: Connects to each RSS Feed Read node.
    - Edge cases: Missed triggers if n8n instance is down; time zone mismatch if changed.
  - **RSS Read Testing Catalog**
    - Type: rssFeedRead
    - Reads RSS feed from https://www.testingcatalog.com/rss/
    - Ignores SSL errors.
    - Inputs: Trigger output
    - Outputs: To Merge node
    - Edge cases: Network issues, invalid feed format.
  - **RSS Read marktechpost**
    - Type: rssFeedRead
    - Reads RSS feed from https://www.marktechpost.com/feed/
    - Inputs: Trigger output
    - Outputs: To Merge node
    - Edge cases: Feed unavailable or malformed.
  - **RSS LatinxinAI**
    - Type: rssFeedRead
    - Reads RSS feed from https://medium.com/feed/latinxinai
    - Inputs: Trigger output
    - Outputs: To Merge node
    - Edge cases: Feed rate limits, format changes.
  - **Merge**
    - Type: merge
    - Combines outputs from the three RSS feeds into one unified dataset.
    - Configured for 3 inputs.
    - Inputs: Three RSS read nodes.
    - Outputs: To Transform date node.
    - Edge cases: Mismatched data structures from feeds.

#### 2.2 Data Preparation and Filtering

- **Overview:** Transforms raw RSS data, filters news older than 7 days, sorts by date, and limits the number of news items.
- **Nodes Involved:** Transform date, Filter by date (more than 7 days), Sort by date, Limit news to x
- **Node Details:**
  - **Transform date**
    - Type: set
    - Extracts and assigns fields: title, contentSnippet as content, link, timestampDate (epoch ms), categories.
    - Inputs: Merge node
    - Outputs: Filter by date node
    - Edge cases: Missing or malformed date fields.
  - **Filter by date (more than 7 days)**
    - Type: filter
    - Filters to keep only news items where timestampDate is greater than (current time - 7 days).
    - Inputs: Transform date
    - Outputs: Sort by date
    - Edge cases: Timezone mismatches causing unexpected filtering.
  - **Sort by date**
    - Type: sort
    - Sorts news items descending by timestampDate (newest first).
    - Inputs: Filter by date
    - Outputs: Limit news to x
  - **Limit news to x**
    - Type: limit
    - Caps the number of news items passed downstream (default limit unspecified but configurable).
    - Inputs: Sort by date
    - Outputs: Three parallel outputs to Information2, Information3, and AI Agent1 nodes.

#### 2.3 AI Content Analysis

- **Overview:** Analyzes news content and generates structured summaries using Google Gemini AI via LangChain agents.
- **Nodes Involved:** AI Agent1, Google Gemini Chat Model1
- **Node Details:**
  - **AI Agent1**
    - Type: langchain.agent
    - Role: Sends a prompt to analyze news articles, extracting core innovation, goals, problems, benefits, context, significance, and key entities.
    - Prompt dynamically includes title and content fields from news.
    - Inputs: Limit news to x output
    - Outputs: Information1 and Edit Fields nodes
    - Edge cases: API failures or prompt interpretation errors.
  - **Google Gemini Chat Model1**
    - Type: langchain.lmChatGoogleGemini
    - Model: gemini-2.0-flash
    - Credentials: Google Palm API (Google Gemini)
    - Inputs: AI Agent1 (via ai_languageModel connection)
    - Outputs: AI Agent1 node (awaits analysis result)

#### 2.4 Hashtag Generation

- **Overview:** Generates relevant hashtags from the AI analysis and article categories.
- **Nodes Involved:** Information1, Code1, AI Agent, Google Gemini Chat Model
- **Node Details:**
  - **Information1**
    - Type: merge
    - Combines AI analysis output with other information.
    - Inputs: AI Agent1 output and Information3
    - Outputs: Code1
  - **Code1**
    - Type: code
    - JavaScript code constructs a prompt to request 5+ relevant hashtags based on analysis and categories.
    - Inputs: Information1
    - Outputs: AI Agent
  - **AI Agent**
    - Type: langchain.agent
    - Uses prompt from Code1 to ask Gemini for hashtags list.
    - Inputs: Code1 prompt
    - Outputs: Information (merge node)
  - **Google Gemini Chat Model**
    - Type: langchain.lmChatGoogleGemini
    - Model: gemini-2.0-flash
    - Inputs: AI Agent (ai_languageModel)
    - Outputs: AI Agent node (awaits hashtags)

#### 2.5 Post Content Assembly

- **Overview:** Gathers all processed data, including news content, analysis, and hashtags, to compose a detailed prompt for the final LinkedIn post.
- **Nodes Involved:** Information, Information2, Information3, Edit Fields, Code, If exists, Google Sheets1, AI Agent2, Google Gemini Chat Model2
- **Node Details:**
  - **Information2**
    - Type: set
    - Assigns fields for link, timestampDate, original title, and content.
    - Inputs: Limit news to x
    - Outputs: Information
  - **Information3**
    - Type: set
    - Converts categories array to string for merging.
    - Inputs: Limit news to x
    - Outputs: Information1
  - **Information**
    - Type: merge
    - Combines original news info, AI analysis, and hashtags.
    - Inputs: AI Agent output, Information2, and Code output
    - Outputs: Google Sheets1
  - **Edit Fields**
    - Type: set
    - Adds "Analisis" field with AI Agent1’s output.
    - Inputs: AI Agent1
    - Outputs: Information
  - **Code**
    - Type: code
    - Constructs a complex prompt for the final LinkedIn post, including title, summary, bullet points, CTA, article link, and hashtags.
    - Reads merged info from Information node.
    - Inputs: If exists condition node (which filters duplicates)
    - Outputs: AI Agent2
  - **If exists**
    - Type: if
    - Checks if the article link already exists in Google Sheets (duplicate prevention).
    - Inputs: Google Sheets1
    - Outputs: Code if new (false branch), stops if exists.
  - **Google Sheets1**
    - Type: googleSheets
    - Reads the Google Sheet to check if the news article’s raw link already exists.
    - Inputs: Information
    - Outputs: If exists
  - **AI Agent2**
    - Type: langchain.agent
    - Generates the final LinkedIn post text in Spanish with professional tone and formatting.
    - System message specifies style and length (~1200 chars).
    - Inputs: Code prompt
    - Outputs: Limpieza de contenido de Noticia1

#### 2.6 Post Generation and Image Creation

- **Overview:** Cleans AI-generated post content and generates a supporting image for LinkedIn post via Gemini AI.
- **Nodes Involved:** Limpieza de contenido de Noticia1, AI Agent4, Google Gemini Chat Model4, Generación de Imagen1, Convert to File
- **Node Details:**
  - **Limpieza de contenido de Noticia1**
    - Type: code
    - Cleans the AI-generated post text by removing newlines, quotes, backslashes, extra spaces.
    - Inputs: AI Agent2
    - Outputs: AI Agent4
  - **AI Agent4**
    - Type: langchain.agent
    - Creates a prompt for a professional LinkedIn image reflecting the news core message, specifying design guidelines (color palette, composition, overlay text space).
    - Inputs: Limpieza de contenido de Noticia1
    - Outputs: Google Gemini Chat Model4
  - **Google Gemini Chat Model4**
    - Type: langchain.lmChatGoogleGemini
    - Calls Gemini 2.0 flash model to generate the image content.
    - Inputs: AI Agent4
    - Outputs: Generación de Imagen1
  - **Generación de Imagen1**
    - Type: httpRequest
    - Calls Google Gemini API endpoint for image generation with the prompt.
    - Inputs: Google Gemini Chat Model4
    - Outputs: Convert to File
    - Edge cases: API timeouts, quota limits, malformed request.
  - **Convert to File**
    - Type: convertToFile
    - Converts the inline base64 image data from Gemini response to binary file format.
    - Inputs: Generación de Imagen1
    - Outputs: LinkedIn node

#### 2.7 Publication and Record-Keeping

- **Overview:** Publishes the post on LinkedIn, generates a QR code for the post URL, writes the QR code to a file, and logs post info in Google Sheets.
- **Nodes Involved:** LinkedIn, Conversión a enlace de LinkedIn, Generar QR, Escribir archivo, Google Sheets
- **Node Details:**
  - **LinkedIn**
    - Type: linkedIn
    - Posts the AI-generated post text as an organization’s update.
    - Uses LinkedIn Community Management OAuth2 credentials.
    - Inputs: Convert to File (image binary)
    - Outputs: Conversión a enlace de LinkedIn
    - Edge cases: Auth token expiry, API rate limits.
  - **Conversión a enlace de LinkedIn**
    - Type: set
    - Constructs the public LinkedIn post URL from the post urn returned by LinkedIn.
    - Inputs: LinkedIn
    - Outputs: Generar QR and Google Sheets
  - **Generar QR**
    - Type: httpRequest
    - Calls a public QR code generation API with the LinkedIn post URL to generate a 300x300 QR code image.
    - Inputs: Conversión a enlace de LinkedIn
    - Outputs: Escribir archivo
    - Edge cases: API unavailability, throttling.
  - **Escribir archivo**
    - Type: writeBinaryFile
    - Saves the QR code image as "qr.png" to the local file system.
    - Inputs: Generar QR
    - Outputs: None
  - **Google Sheets**
    - Type: googleSheets
    - Appends a row with post title, published link, and original article link to a Google Sheet for record-keeping.
    - Inputs: Conversión a enlace de LinkedIn
    - Credentials: Google Sheets OAuth2 account
    - Edge cases: Network issues, quota limits.

---

### 3. Summary Table

| Node Name                        | Node Type                          | Functional Role                         | Input Node(s)                            | Output Node(s)                          | Sticky Note                                                                                                                     |
|---------------------------------|----------------------------------|---------------------------------------|-----------------------------------------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger                | scheduleTrigger                   | Triggers workflow on schedule         | None                                    | RSS Read Testing Catalog, RSS Read marktechpost, RSS LatinxinAI |                                                                                                                               |
| RSS Read Testing Catalog        | rssFeedRead                      | Reads RSS feed from testingcatalog.com| Schedule Trigger                        | Merge                                 |                                                                                                                               |
| RSS Read marktechpost           | rssFeedRead                      | Reads RSS feed from marktechpost.com  | Schedule Trigger                        | Merge                                 |                                                                                                                               |
| RSS LatinxinAI                 | rssFeedRead                      | Reads RSS feed from LatinxinAI Medium | Schedule Trigger                        | Merge                                 |                                                                                                                               |
| Merge                          | merge                            | Combines RSS feeds into one dataset   | RSS Read Testing Catalog, RSS Read marktechpost, RSS LatinxinAI | Transform date                       | ## RSS sources Here you can add up to nine sources of RSS. To do so, modify the merge node for the number of RSS feeds you want, duplicate the RSS node and wire it accordingly. |
| Transform date                 | set                              | Extracts and assigns fields from RSS  | Merge                                  | Filter by date (more than 7 days)     |                                                                                                                               |
| Filter by date (more than 7 days) | filter                          | Filters news older than 7 days         | Transform date                         | Sort by date                         | ## Age and number of the news Here you can set the number of days behind by changing the 7 in the filter by date node. You can also modify the number of news in the \"limit news to x\" node. |
| Sort by date                  | sort                             | Sorts news descending by date          | Filter by date (more than 7 days)      | Limit news to x                      |                                                                                                                               |
| Limit news to x               | limit                            | Restricts number of news items         | Sort by date                          | Information2, Information3, AI Agent1 |                                                                                                                               |
| Information2                  | set                              | Sets link, timestamp, title, content  | Limit news to x                       | Information                         |                                                                                                                               |
| Information3                  | set                              | Converts categories array to string    | Limit news to x                       | Information1                       |                                                                                                                               |
| Information1                  | merge                            | Combines AI analysis with info         | AI Agent1, Information3               | Code1                              |                                                                                                                               |
| AI Agent1                    | langchain.agent                  | Analyzes news content with Gemini AI  | Limit news to x                      | Information1, Edit Fields            | # Etapa de IA: usando el API de Gemini ## Modulo de análisis de contenido                                                        |
| Google Gemini Chat Model1     | langchain.lmChatGoogleGemini      | Gemini AI model for content analysis  | AI Agent1 (ai_languageModel)           | AI Agent1                          |                                                                                                                               |
| Edit Fields                  | set                              | Adds analysis text field                | AI Agent1                           | Information                       |                                                                                                                               |
| Code1                       | code                             | Creates prompt for hashtag generation  | Information1                       | AI Agent                          | # Etapa de IA: usando el API de Gemini ## Modulo de obtención de hashtags                                                        |
| AI Agent                    | langchain.agent                  | Generates hashtags from prompt          | Code1                             | Information                       |                                                                                                                               |
| Google Gemini Chat Model     | langchain.lmChatGoogleGemini      | Gemini AI model for hashtags            | AI Agent (ai_languageModel)            | AI Agent                          |                                                                                                                               |
| Information                  | merge                            | Combines news info, analysis, hashtags| AI Agent output, Information2, Code  | Google Sheets1                    |                                                                                                                               |
| Google Sheets1               | googleSheets                     | Checks if article link already exists  | Information                       | If exists                        |                                                                                                                               |
| If exists                   | if                               | Filters duplicates                      | Google Sheets1                    | Code (false branch)               |                                                                                                                               |
| Code                       | code                             | Builds prompt for final LinkedIn post  | If exists (false branch)           | AI Agent2                       |                                                                                                                               |
| AI Agent2                  | langchain.agent                  | Generates final LinkedIn post text     | Code                             | Limpieza de contenido de Noticia1 | # Etapa de IA: usando el API de Gemini ## Modulo de obtención de la publicación                                                   |
| Google Gemini Chat Model2   | langchain.lmChatGoogleGemini      | Gemini AI model for final post text    | AI Agent2 (ai_languageModel)          | AI Agent2                       |                                                                                                                               |
| Limpieza de contenido de Noticia1 | code                         | Cleans AI-generated post text           | AI Agent2                       | AI Agent4                       | # Etapa de IA: Prompt para imagen ## Limpieza de contenido de noticia y generación de prompt para obtener imagen                |
| AI Agent4                  | langchain.agent                  | Creates prompt for LinkedIn post image  | Limpieza de contenido de Noticia1 | Google Gemini Chat Model4        |                                                                                                                               |
| Google Gemini Chat Model4   | langchain.lmChatGoogleGemini      | Gemini AI model for image generation    | AI Agent4 (ai_languageModel)          | Generación de Imagen1           |                                                                                                                               |
| Generación de Imagen1       | httpRequest                     | Requests image generation from Gemini   | Google Gemini Chat Model4          | Convert to File                 | # Etapa de IA: Generación de Imagen ## Generación de Imagen mediante Gemini 2.0 y conversión a PNG                               |
| Convert to File             | convertToFile                   | Converts Gemini image data to file      | Generación de Imagen1              | LinkedIn                       |                                                                                                                               |
| LinkedIn                   | linkedIn                       | Publishes post on LinkedIn organization | Convert to File                  | Conversión a enlace de LinkedIn | # Etapa: Publicación en LinkedIn ## Módulo de publicación de información obtenida en LinkedIn                                    |
| Conversión a enlace de LinkedIn | set                          | Creates public post URL                  | LinkedIn                        | Generar QR, Google Sheets       |                                                                                                                               |
| Generar QR                 | httpRequest                    | Generates QR code image for post URL    | Conversión a enlace de LinkedIn | Escribir archivo               | # Generación de Código QR ## Módulo de generación de código QR de la publicación realizada                                       |
| Escribir archivo           | writeBinaryFile                | Saves QR code image locally              | Generar QR                     | None                           |                                                                                                                               |
| Google Sheets              | googleSheets                   | Logs post details in Google Sheets       | Conversión a enlace de LinkedIn | None                           |                                                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: scheduleTrigger  
   - Configure to run weekly on Tuesday, Wednesday, Thursday, and Sunday at 15:00 (3 PM)  
   - Set timezone to America/Guayaquil  

2. **Create RSS Feed Read Nodes (3 nodes)**  
   - RSS Read Testing Catalog: URL https://www.testingcatalog.com/rss/, ignore SSL errors enabled  
   - RSS Read marktechpost: URL https://www.marktechpost.com/feed/  
   - RSS LatinxinAI: URL https://medium.com/feed/latinxinai  
   - Connect each RSS read node to the Schedule Trigger node  

3. **Create Merge Node**  
   - Type: merge  
   - Set "numberInputs" to 3  
   - Connect outputs of all three RSS feed nodes to this Merge node  

4. **Create Transform Date Node (Set node)**  
   - Extract and assign:  
     - title = $json.title  
     - content = $json.contentSnippet  
     - link = $json.link  
     - timestampDate = epoch ms of $json.isoDate (use JavaScript new Date().getTime())  
     - categories = $json.categories (array)  
   - Connect Merge output to this node  

5. **Create Filter by Date Node**  
   - Type: filter  
   - Condition: timestampDate > (Date.now() - 7*24*60*60*1000) to keep news items from last 7 days  
   - Connect Transform Date to this node  

6. **Create Sort by Date Node**  
   - Sort descending by timestampDate field  
   - Connect Filter by Date to this node  

7. **Create Limit News Node**  
   - Limit number of items as desired (default empty means no limit)  
   - Connect Sort by Date to this node  

8. **Create Information2 (Set node)**  
   - Assign fields: Enlace (link), Fecha_sinFormato (timestampDate), Titulo_original (title), Contenido (content)  
   - Connect Limit News output to this node  

9. **Create Information3 (Set node)**  
   - Convert categories array to string for merging  
   - Connect Limit News output to this node  

10. **Create AI Agent1 (LangChain agent)**  
    - Prompt: Analyze news article with title and content, extract core innovation, main goal, problem addressed, benefits, context, significance, key entities in plain text list  
    - Connect Limit News output to AI Agent1  
    - Connect AI Agent1 to Google Gemini Chat Model1  

11. **Create Google Gemini Chat Model1**  
    - Model: models/gemini-2.0-flash  
    - Credentials: Google Palm API with OAuth2  
    - Connect AI Agent1 (ai_languageModel) to this node  

12. **Create Information1 (Merge node)**  
    - Merge AI Agent1 output and Information3  
    - Connect AI Agent1 and Information3 to Information1  

13. **Create Code1 (Code node)**  
    - JavaScript to create a prompt for hashtag generation based on AI analysis and categories  
    - Connect Information1 to Code1  

14. **Create AI Agent (LangChain agent)**  
    - Uses prompt from Code1 to generate 5+ relevant hashtags  
    - Connect Code1 to AI Agent  
    - Connect AI Agent to Google Gemini Chat Model  

15. **Create Google Gemini Chat Model**  
    - Model: models/gemini-2.0-flash  
    - Credentials: Google Palm API  
    - Connect AI Agent (ai_languageModel) to this node  

16. **Create Information (Merge node)**  
    - Combines AI Agent output (hashtags), Information2, and Code output  
    - Connect AI Agent output, Information2, and Code output to Information  

17. **Create Google Sheets1 (Google Sheets)**  
    - Operation: Read rows with filter lookupValue = Enlace, lookupColumn = Link_raw  
    - Credentials: Google Sheets OAuth2  
    - Connect Information to Google Sheets1  

18. **Create If exists (If node)**  
    - Condition: Check if Link_raw exists (string exists)  
    - Connect Google Sheets1 to If exists  
    - False branch connects to Code node  

19. **Create Code (Code node)**  
    - Constructs detailed prompt for LinkedIn post with title, summary, bullets, CTA, article link, and hashtags  
    - Connect If exists false output to Code  

20. **Create AI Agent2 (LangChain agent)**  
    - Generates final LinkedIn post text in Spanish (about 1200 characters) with professional tone  
    - System message defines style and constraints  
    - Connect Code to AI Agent2  
    - Connect AI Agent2 to Google Gemini Chat Model2  

21. **Create Google Gemini Chat Model2**  
    - Model: models/gemini-2.0-flash  
    - Credentials: Google Palm API  
    - Connect AI Agent2 (ai_languageModel) to this node  

22. **Create Limpieza de contenido de Noticia1 (Code node)**  
    - Cleans post text: removes newlines, quotes, backslashes, trims spaces  
    - Connect AI Agent2 output to this node  

23. **Create AI Agent4 (LangChain agent)**  
    - Creates prompt for LinkedIn post image generation with design instructions  
    - Connect Limpieza de contenido de Noticia1 to AI Agent4  
    - Connect AI Agent4 to Google Gemini Chat Model4  

24. **Create Google Gemini Chat Model4**  
    - Model: models/gemini-2.0-flash  
    - Credentials: Google Palm API  
    - Connect AI Agent4 (ai_languageModel) to this node  

25. **Create Generación de Imagen1 (HTTP request)**  
    - POST to Gemini image generation API endpoint with prompt from AI Agent4  
    - Connect Google Gemini Chat Model4 output to this node  

26. **Create Convert to File**  
    - Converts base64 inline image data to binary file  
    - Connect Generación de Imagen1 to this node  

27. **Create LinkedIn Node**  
    - Posts to LinkedIn organization (ID: 89339025) as communityManagement authentication  
    - Text: AI Agent2 generated post text  
    - Image: binary data from Convert to File node  
    - Connect Convert to File to LinkedIn  

28. **Create Conversión a enlace de LinkedIn (Set node)**  
    - Creates public post URL from LinkedIn post urn  
    - Connect LinkedIn output to this node  

29. **Create Generar QR (HTTP request)**  
    - Calls https://api.qrserver.com/v1/create-qr-code/ with query parameters: data=post URL, size=300x300  
    - Connect Conversión a enlace de LinkedIn to this node  

30. **Create Escribir archivo (Write Binary File)**  
    - Saves QR code image as "qr.png" locally  
    - Connect Generar QR to this node  

31. **Create Google Sheets Node**  
    - Appends new row with Title, Link_pub (post URL), Link_raw (original article link)  
    - Connect Conversión a enlace de LinkedIn to this node

---

### 5. General Notes & Resources

| Note Content                                                                                                                            | Context or Link                                                                                                         |
|-----------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| ## RSS sources Here you can add up to nine sources of RSS. To do so, modify the merge node for the number of RSS feeds you want, duplicate the RSS node and wire it accordingly. | Sticky Note near RSS feed nodes                                                                                         |
| ## Age and number of the news Here you can set the number of days behind by changing the 7 in the filter by date node. You can also modify the number of news in the "limit news to x" node. | Sticky Note near Filter by date and Limit news nodes                                                                    |
| # Etapa de IA: usando el API de Gemini; ## Modulo de análisis de contenido                                                              | Sticky Note near AI Agent1 node                                                                                         |
| # Etapa de IA: usando el API de Gemini; ## Modulo de obtención de hashtags                                                               | Sticky Note near Code1 and AI Agent nodes                                                                               |
| # Etapa de IA: usando el API de Gemini; ## Modulo de obtención de la publicación                                                         | Sticky Note near AI Agent2 node                                                                                         |
| # Etapa de IA: Prompt para imagen; ## Limpieza de contenido de noticia y generación de prompt para obtener una imagen adecuada al contexto de la noticia | Sticky Note near Limpieza de contenido de Noticia1 and AI Agent4                                                       |
| # Etapa de IA: Generación de Imagen; ## Generación de Imagen mediante Gemini 2.0 y conversión a PNG                                       | Sticky Note near Generación de Imagen1                                                                                  |
| # Etapa: Publicación en LinkedIn; ## Módulo de publicación de información obtenida en LinkedIn                                            | Sticky Note near LinkedIn node                                                                                           |
| # Generación de Código QR; ## Módulo de generación de código QR de la publicación realizada                                              | Sticky Note near Generar QR node                                                                                         |

---

**Disclaimer:** The provided text and workflow originate exclusively from an automated process using n8n integration software. All data manipulated is legal and public; no illegal, offensive, or protected content is involved. The workflow respects all applicable content policies.