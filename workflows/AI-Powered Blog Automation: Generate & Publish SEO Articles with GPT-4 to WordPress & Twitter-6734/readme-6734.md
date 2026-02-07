AI-Powered Blog Automation: Generate & Publish SEO Articles with GPT-4 to WordPress & Twitter

https://n8nworkflows.xyz/workflows/ai-powered-blog-automation--generate---publish-seo-articles-with-gpt-4-to-wordpress---twitter-6734


# AI-Powered Blog Automation: Generate & Publish SEO Articles with GPT-4 to WordPress & Twitter

### 1. Workflow Overview

This workflow automates the generation, enhancement, and publishing of SEO-optimized blog articles using AI (GPT-4) integrated with WordPress and Twitter. It targets content marketers, bloggers, and digital agencies seeking an end-to-end automated pipeline for sourcing news content, generating blog posts, optimizing metadata, checking quality, and publishing across platforms.

The workflow is organized into the following logical blocks:

- **1.1 Content Acquisition & Normalization**: Periodically fetches tech news via RSS feeds, filters and normalizes them for processing.
- **1.2 Document Preparation & Vector Storage**: Splits content text for embedding and manages vector storage for semantic search.
- **1.3 AI Task Definition & Content Generation**: Applies AI agents to define writing tasks, generate blog titles, full articles, metadata, and perform quality checks.
- **1.4 Post Processing & Ranking**: Aggregates generated outputs, ranks them via code nodes, and selects best versions.
- **1.5 Publishing Workflow**: Creates or updates WordPress posts and publishes promotional tweets.
- **1.6 Workflow Orchestration & Scheduling**: Triggers and batches the overall process and handles retries and error paths.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Content Acquisition & Normalization

**Overview:**  
This block triggers regularly to fetch tech news from RSS feeds, filters relevant items, and normalizes data fields for downstream processing.

**Nodes Involved:**  
- Get Articles Daily (Schedule Trigger)  
- Set Tech News RSS Feeds (Set)  
- Split Out (Split Out)  
- Read RSS News Feeds (RSS Feed Read)  
- Filter (Filter)  
- Set and Normalize Fields (Set)  
- Limit (Limit - Disabled for testing)  

**Node Details:**  
- **Get Articles Daily**  
  - Type: Schedule Trigger  
  - Configured to run periodically (default configuration)  
  - Output triggers Set Tech News RSS Feeds node  

- **Set Tech News RSS Feeds**  
  - Type: Set  
  - Defines the list of RSS feed URLs to be processed (likely tech news sources)  
  - Connected from schedule trigger  

- **Split Out**  
  - Type: Split Out  
  - Splits the feed URLs for parallel processing  
  - Input: Set Tech News RSS Feeds  
  - Output: Read RSS News Feeds  

- **Read RSS News Feeds**  
  - Type: RSS Feed Read  
  - Reads each RSS feed URL from input  
  - Output: Filter node  

- **Filter**  
  - Type: Filter  
  - Filters out unwanted or duplicate articles (criteria not explicitly shown)  
  - Output: Set and Normalize Fields  

- **Set and Normalize Fields**  
  - Type: Set  
  - Normalizes article fields (e.g., title, link, content) for consistent structure  
  - Output: Limit node  

- **Limit**  
  - Type: Limit  
  - Disabled by default, used for testing to restrict number of items processed  
  - Output: Further downstream processing  

**Failure Modes:**  
- RSS feed read failures (network issues, invalid URLs)  
- Filter expression errors  
- Missing or malformed feed data causing normalization issues  

---

#### 1.2 Document Preparation & Vector Storage

**Overview:**  
Prepares text documents by splitting them into manageable chunks, loads default data, and stores embeddings in MongoDB Atlas vector store for semantic search and retrieval.

**Nodes Involved:**  
- Recursive Character Text Splitter (Text Splitter)  
- Default Data Loader (Document Loader)  
- openai-text-embedding-3-small (OpenAI Embeddings)  
- MongoDB Atlas Vector Store (Vector Store)  
- MongoDB Atlas Vector Store1 (Vector Store)  

**Node Details:**  
- **Recursive Character Text Splitter**  
  - Type: Recursive Character Text Splitter  
  - Splits long article content into smaller text chunks suitable for embedding  
  - Input: Default Data Loader  

- **Default Data Loader**  
  - Type: Document Default Data Loader  
  - Loads documents either from input or defaults; feeds into text splitter  
  - Output: MongoDB Atlas Vector Store  

- **openai-text-embedding-3-small**  
  - Type: OpenAI Embeddings  
  - Generates vector embeddings for the text chunks using OpenAI embedding model  
  - Output: MongoDB Atlas Vector Store and MongoDB Atlas Vector Store1  

- **MongoDB Atlas Vector Store & MongoDB Atlas Vector Store1**  
  - Type: MongoDB Atlas Vector Store  
  - Stores the embeddings and manages vector searches  
  - Outputs to subsequent nodes for semantic retrieval or AI agents  

**Failure Modes:**  
- API quota limits or timeouts on OpenAI embeddings  
- MongoDB connection/authentication issues  
- Text chunking errors on malformed content  

---

#### 1.3 AI Task Definition & Content Generation

**Overview:**  
Uses multiple LangChain AI agent nodes powered by GPT-4 to define blog post tasks, generate titles, write content, create metadata, and perform quality checks sequentially.

**Nodes Involved:**  
- Task Definition Agent (Agent)  
- Blog title generator (Agent)  
- Content Writer Agent (Agent)  
- Meta data generator (Agent)  
- Quality Check Agent (Agent)  
- Article Intelligence Agent (Agent)  
- AI Agent12 (Agent)  
- AI Agent (Agent)  
- Structured Output Parsers (multiple)  

**Node Details:**  
- **Task Definition Agent**  
  - Type: LangChain Agent  
  - Defines scope and objectives for content generation based on input articles  
  - Parses structured output for next steps  

- **Blog title generator**  
  - Type: LangChain Agent  
  - Generates SEO-friendly blog title ideas  
  - Output parsed for selection  

- **Content Writer Agent**  
  - Type: LangChain Agent  
  - Generates full blog articles with SEO and style considerations  
  - Retries enabled (max 5) for robustness  

- **Meta data generator**  
  - Type: LangChain Agent  
  - Creates meta titles, descriptions, and tags for SEO  
  - Executes per article  

- **Quality Check Agent**  
  - Type: LangChain Agent  
  - Evaluates generated content against quality thresholds  
  - Conditional routing based on threshold results  

- **Article Intelligence Agent**  
  - Type: LangChain Agent  
  - Performs content enrichment or intelligence extraction for articles  

- **AI Agent12 & AI Agent**  
  - General purpose LangChain agents used for additional AI-driven processing and aggregation  

- **Structured Output Parsers**  
  - Parse AI responses into structured JSON for programmatic use  
  - Used extensively after each agent node  

**Failure Modes:**  
- AI model timeouts or quota limits  
- Parsing failures if AI response format deviates  
- Quality check false negatives or positives  
- Retry exhaustion on Content Writer Agent  

---

#### 1.4 Post Processing & Ranking

**Overview:**  
Aggregates outputs from AI generation, ranks multiple candidate outputs using custom code nodes, and selects the best content versions for publishing.

**Nodes Involved:**  
- Aggregate, Aggregate1, Aggregate2 (Aggregate)  
- Multiple Code nodes (Code, Code1, Code2 ... Code27)  
- Split Out & Split Out1-4 (Split Out)  
- Loop Over Items & Loop Over Items1-2 (Split In Batches)  
- If, If1, If2 (Conditional)  

**Node Details:**  
- **Aggregate Nodes**  
  - Aggregate multiple partial results into arrays for batch processing  

- **Code Nodes**  
  - Custom JavaScript used to rank, filter, and choose best candidate content or titles  
  - Some contain comments indicating ranking logic  

- **Split Out & Loop Over Items**  
  - Manage parallelization and batching of item processing for scalability  

- **If Nodes**  
  - Conditional logic branches based on quality checks, thresholds, or data presence  
  - Drive workflow routing decisions  

**Failure Modes:**  
- Logic errors in custom code leading to incorrect ranking or selection  
- Empty batches causing downstream errors  
- Conditional logic branching leading to dead ends or unhandled cases  

---

#### 1.5 Publishing Workflow

**Overview:**  
Publishes the final selected blog posts to WordPress and creates promotional tweets on Twitter, with handling for new posts and updates.

**Nodes Involved:**  
- Create a post1 (WordPress)  
- Update a post (WordPress)  
- Create Tweet (Twitter)  
- Set Image (HTTP Request)  
- Set metatag1 (HTTP Request)  
- Edit Fields1, Edit Fields (Set)  
- If2 (Conditional)  

**Node Details:**  
- **Create a post1**  
  - Creates a new WordPress post using blog content and metadata  
  - Triggers image setting and metadata HTTP requests  

- **Update a post**  
  - Updates existing WordPress posts if applicable  

- **Create Tweet**  
  - Posts a tweet linking or promoting the new blog post  

- **Set Image & Set metatag1**  
  - HTTP requests to set featured images and meta tags, possibly invoking external APIs  

- **Edit Fields1 & Edit Fields**  
  - Prepares and formats fields for publishing nodes  

- **If2**  
  - Checks whether to create or update a post based on content state  

**Failure Modes:**  
- WordPress API authentication or permission failures  
- Twitter API rate limits or posting errors  
- HTTP request failures for images or metadata  
- Conditional logic errors leading to missed publishing  

---

#### 1.6 Workflow Orchestration & Scheduling

**Overview:**  
Manages the overall execution flow with multiple schedule triggers, manual triggers, batch controls, and workflow execution nodes to orchestrate the entire process.

**Nodes Involved:**  
- Multiple Get Articles Daily (Schedule Trigger) nodes  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Execute Workflow  
- Sticky Notes (for documentation and grouping)  

**Node Details:**  
- **Schedule Triggers**  
  - Multiple triggers scheduled at different times to run parts or all of the workflow automatically  

- **Manual Trigger**  
  - Allows manual execution for testing or on-demand runs  

- **Execute Workflow**  
  - Runs sub-workflows or child workflows for modularization  

- **Sticky Notes**  
  - Used extensively to document and organize logic visually (content mostly empty or minimal)  

**Failure Modes:**  
- Scheduling conflicts or overlapping runs causing race conditions  
- Manual trigger execution without proper parameter setup  
- Sub-workflow failure propagation  

---

### 3. Summary Table

| Node Name                | Node Type                                  | Functional Role                          | Input Node(s)                   | Output Node(s)                 | Sticky Note                                           |
|--------------------------|--------------------------------------------|----------------------------------------|--------------------------------|-------------------------------|-------------------------------------------------------|
| Get Articles Daily        | Schedule Trigger                           | Periodic trigger to start content fetch | -                              | Set Tech News RSS Feeds        |                                                       |
| Set Tech News RSS Feeds   | Set                                        | Defines list of RSS feed URLs            | Get Articles Daily             | Split Out                     |                                                       |
| Split Out                | Split Out                                  | Splits feed URLs for parallel processing | Set Tech News RSS Feeds        | Read RSS News Feeds           |                                                       |
| Read RSS News Feeds       | RSS Feed Read                             | Reads articles from RSS feeds            | Split Out                     | Filter                       |                                                       |
| Filter                   | Filter                                     | Filters out irrelevant or duplicate articles | Read RSS News Feeds            | Set and Normalize Fields      |                                                       |
| Set and Normalize Fields  | Set                                        | Normalizes article data fields           | Filter                        | Limit                        |                                                       |
| Limit                    | Limit (Disabled)                           | Limits item count for testing            | Set and Normalize Fields       | Loop Over Items2              | For testing only                                      |
| Recursive Character Text Splitter | Text Splitter (LangChain)              | Splits long texts into chunks             | Default Data Loader            | Default Data Loader           |                                                       |
| Default Data Loader       | Document Loader (LangChain)                | Loads document data for embedding        | Recursive Character Text Splitter | MongoDB Atlas Vector Store   |                                                       |
| openai-text-embedding-3-small | OpenAI Embeddings (LangChain)             | Generates vector embeddings for chunks   | Default Data Loader            | MongoDB Atlas Vector Store    |                                                       |
| MongoDB Atlas Vector Store | MongoDB Vector Store (LangChain)          | Stores and manages vector embeddings     | openai-text-embedding-3-small | Loop Over Items2              |                                                       |
| Task Definition Agent     | LangChain Agent                            | Defines blog post generation tasks       | MongoDB9                      | Split Out3                   |                                                       |
| Blog title generator      | LangChain Agent                            | Generates blog title ideas                | MongoDB3                      | Code7                        | Generate blog title ideas                             |
| Content Writer Agent      | LangChain Agent                            | Writes full blog articles                 | MongoDB10                     | Code13                       |                                                       |
| Meta data generator       | LangChain Agent                            | Generates SEO metadata                     | MongoDB5                      | Code6                        | Generate meta data                                    |
| Quality Check Agent       | LangChain Agent                            | Evaluates content quality                  | MongoDB14                     | If content meets threshold    |                                                       |
| Article Intelligence Agent | LangChain Agent                           | Enriches and analyzes article content     | MongoDB12                     | Code1                        |                                                       |
| AI Agent12                | LangChain Agent                            | General AI processing                      | Edit Fields                  | Split Out2                   |                                                       |
| AI Agent                  | LangChain Agent                            | General AI processing                      | Split Out4                   | Aggregate2                   |                                                       |
| Aggregate                 | Aggregate                                  | Aggregates batch results                   | Loop Over Items2              | HTTP Request4 / Code2        |                                                       |
| Aggregate1                | Aggregate                                  | Aggregates batch results                   | Loop Over Items1              | MongoDB14                    |                                                       |
| Aggregate2                | Aggregate                                  | Aggregates batch results                   | AI Agent                     | Edit Fields1                 |                                                       |
| Loop Over Items           | Split In Batches                           | Processes items in batches                  | MongoDB                     | Split Out1                   |                                                       |
| Loop Over Items1          | Split In Batches                           | Processes items in batches                  | Split Out3                  | Aggregate1                   |                                                       |
| Loop Over Items2          | Split In Batches                           | Processes items in batches                  | MongoDB Atlas Vector Store   | Aggregate / HTTP Request4    |                                                       |
| Create a post1            | WordPress                                 | Creates new WordPress blog post             | If2                         | Set Image                   |                                                       |
| Update a post             | WordPress                                 | Updates existing WordPress blog post         | MongoDB23                   | Code14                      |                                                       |
| Create Tweet              | Twitter                                   | Posts promotional tweet                      | Basic LLM Chain             | Code26                      |                                                       |
| Set Image                 | HTTP Request                              | Sets featured image on WordPress post         | Create a post1              | Set metatag1                |                                                       |
| Set metatag1              | HTTP Request                              | Sets metadata tags on WordPress post          | Set Image                  | Code23                      |                                                       |
| Code (multiple, e.g. Code1, Code2, ...) | Code                         | Custom JavaScript for ranking, filtering, and logic | Various                     | Various                     | Some notes indicate ranking and selection logic      |
| If                       | Conditional                              | Branching logic based on conditions          | MongoDB13                   | Loop Over Items2 / Code2     |                                                       |
| If1                      | Conditional                              | Branching logic                              | Split Out2                  | Code                        |                                                       |
| If2                      | Conditional                              | Branching logic                              | Edit Fields1                | Create a post1 / (alternative) |                                                       |
| When clicking ‘Execute workflow’ | Manual Trigger                   | Manual start of workflow                       | -                          | -                           |                                                       |
| Execute Workflow          | Execute Workflow                         | Executes sub-workflows                         | Code9                       | Code12                      |                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node** (`Get Articles Daily`) to trigger content fetching periodically.

2. **Add a Set Node** (`Set Tech News RSS Feeds`) that defines the list of tech news RSS URLs.

3. **Add a Split Out Node** (`Split Out`) to split feed URLs for concurrent processing.

4. **Add an RSS Feed Read Node** (`Read RSS News Feeds`) to fetch articles from each RSS URL.

5. **Add a Filter Node** to exclude irrelevant or duplicate articles based on criteria.

6. **Add a Set Node** (`Set and Normalize Fields`) to normalize article data fields for consistency.

7. **Add a Limit Node** for testing (optional, disable in production).

8. **Add a Recursive Character Text Splitter Node** to break article content into chunks for embedding.

9. **Add a Default Data Loader Node** to load the split text chunks for embeddings.

10. **Add an OpenAI Embeddings Node** (`openai-text-embedding-3-small`) configured with OpenAI credentials for generating embeddings.

11. **Add MongoDB Atlas Vector Store Nodes** to store embeddings and enable semantic search; configure MongoDB Atlas credentials.

12. **Set up LangChain Agent Nodes**:  
    - `Task Definition Agent`: configure prompts and model (GPT-4) to define writing tasks.  
    - `Blog title generator`: configured for generating SEO-friendly titles.  
    - `Content Writer Agent`: generates full articles, set retry to max 5.  
    - `Meta data generator`: creates SEO metadata.  
    - `Quality Check Agent`: assesses content quality for thresholds.  
    - `Article Intelligence Agent`: enriches content.  
    - `AI Agent12` and `AI Agent`: for general AI processing.

13. **Add Structured Output Parser Nodes** after each AI Agent to parse AI responses into JSON.

14. **Add Aggregate Nodes** to collect batch outputs for ranking and further processing.

15. **Add Code Nodes** with JavaScript to rank, filter, and select best outputs; replicate ranking logic as needed.

16. **Add Split Out and Loop Over Items Nodes** to batch process items efficiently.

17. **Add WordPress Nodes** (`Create a post1` and `Update a post`) configured with WordPress OAuth2 credentials to publish or update posts.

18. **Add HTTP Request Nodes** (`Set Image`, `Set metatag1`) to set featured images and meta tags; configure URLs and authentication as required.

19. **Add Twitter Node** (`Create Tweet`) configured with Twitter API credentials to post promotional tweets.

20. **Add Conditional Nodes (If, If1, If2)** to branch flow based on quality checks and content state.

21. **Add Manual Trigger Node** (`When clicking ‘Execute workflow’`) for manual workflow start.

22. **Add Execute Workflow Node** if sub-workflows are used; configure workflow IDs and input parameters.

23. **Connect nodes respecting the flow described in Section 2**, ensuring outputs feed into the correct inputs.

24. **Configure credentials** for OpenAI (GPT-4), MongoDB Atlas, WordPress, Twitter, and any HTTP endpoints.

25. **Set global execution settings**: error workflow, execution timeout (e.g., 1800 seconds), and policy as needed.

26. **Add Sticky Notes** to visually document sections and logic for easier maintenance.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                         |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| Workflow leverages LangChain for advanced AI agents integrated with GPT-4 models                 | https://docs.langchain.com/                                             |
| WordPress node requires OAuth2 credential setup for secure API access                            | https://developer.wordpress.org/rest-api/                              |
| Twitter node needs OAuth1.0a or OAuth2 with tweet-posting permissions                            | https://developer.twitter.com/en/docs/authentication/overview          |
| MongoDB Atlas Vector Store used for vector embedding storage and semantic search                 | https://www.mongodb.com/atlas                                           |
| Recursive Character Text Splitter is optimal for splitting large texts for embeddings           | https://python.langchain.com/en/latest/modules/indexes/text_splitter.html |
| Custom code nodes enable fine-grained ranking and selection logic based on content quality      | JavaScript knowledge required                                          |
| Extensive use of structured output parsers ensures AI outputs are machine-readable and reliable | Structured JSON output required by LangChain agents                    |
| Testing mode via disabled Limit node allows safe development without processing full data sets   | Enable Limit node to restrict item count during development            |

---

*Disclaimer: The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.*