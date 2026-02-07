AI-Personalized Multi-Product Email Outreach with SMTP Rotation (GPT-4o/o3-mini)

https://n8nworkflows.xyz/workflows/ai-personalized-multi-product-email-outreach-with-smtp-rotation--gpt-4o-o3-mini--3758


# AI-Personalized Multi-Product Email Outreach with SMTP Rotation (GPT-4o/o3-mini)

### 1. Workflow Overview

This workflow automates personalized multi-product email outreach campaigns using AI-driven content generation and SMTP rotation for sending. It is designed for marketers, agencies, or businesses running multi-offer campaigns targeting prospects discovered via Google Maps searches. The workflow integrates advanced AI (OpenAI GPT-4o or o3-mini) to generate search queries and craft SEO-optimized, personalized HTML emails based on each prospect’s website content.

The workflow is logically divided into the following blocks:

- **1.1 Input & Offer Definition**: Manual trigger and configuration of multiple product/service offers.
- **1.2 AI-Powered Query Generation**: Using OpenAI to create targeted Google Maps search queries per offer.
- **1.3 Lead Discovery & URL Extraction**: Executing Google Maps searches, extracting URLs, and filtering duplicates.
- **1.4 Website Content Scraping & Email Extraction**: Fetching website content, scraping emails, deduplicating, and verifying.
- **1.5 Personalized Email Generation**: AI analyzes scraped content and generates tailored HTML emails embedding the correct offer.
- **1.6 SMTP Rotation & Email Sending**: Randomly assigning one of five Gmail/SMTP accounts with randomized delays to send emails, balancing load and avoiding rate limits.

---

### 2. Block-by-Block Analysis

#### 2.1 Input & Offer Definition

- **Overview:**  
  This block initializes the workflow via manual trigger and defines the multi-product offers in a structured data format (`pinData`). It sets the foundation for AI query generation and email personalization.

- **Nodes Involved:**  
  - MANUAL TRIGGER: Start Workflow  
  - pinData (embedded in workflow metadata, not a node)  

- **Node Details:**  
  - **MANUAL TRIGGER: Start Workflow**  
    - Type: Manual trigger node  
    - Role: Entry point to start the workflow manually  
    - Configuration: Default manual trigger, no parameters  
    - Input: None  
    - Output: Initiates the batch processing of offers  
    - Edge Cases: None significant; manual start requires user action  

---

#### 2.2 AI-Powered Query Generation

- **Overview:**  
  Generates 100 targeted Google Maps search queries per product/service offer using OpenAI GPT models. This block dynamically creates search terms to discover ideal leads.

- **Nodes Involved:**  
  - Loop Over Items  
  - Generate Google Maps Queries (OpenAI)  
  - Process AI-Generated Queries  
  - Loop Through Search Queries  
  - Wait Before Google Search  

- **Node Details:**  
  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Iterates over each product/service offer from `pinData`  
    - Configuration: Default batch size (usually 1)  
    - Input: Output from manual trigger (offers)  
    - Output: Feeds each offer to AI query generation  
    - Edge Cases: Large number of offers may slow processing  

  - **Generate Google Maps Queries (OpenAI)**  
    - Type: OpenAI Chat Model (LangChain)  
    - Role: Generates Google Maps search queries tailored to each offer  
    - Configuration: Uses GPT-4o or o3-mini model credentials  
    - Input: Current offer details  
    - Output: List of search queries  
    - Edge Cases: API rate limits, invalid prompts, model errors  

  - **Process AI-Generated Queries**  
    - Type: Code node  
    - Role: Parses and formats AI output into usable search queries  
    - Configuration: Custom JavaScript to clean and structure queries  
    - Input: Raw AI response  
    - Output: Structured queries for Google Maps search  
    - Edge Cases: Parsing errors if AI output format changes  

  - **Loop Through Search Queries**  
    - Type: SplitInBatches  
    - Role: Iterates over each generated search query  
    - Configuration: Default batch size  
    - Input: Structured queries  
    - Output: Feeds queries to Google Maps search HTTP request  
    - Edge Cases: Large query sets may cause throttling  

  - **Wait Before Google Search**  
    - Type: Wait node  
    - Role: Introduces delay between Google Maps searches to avoid rate limits  
    - Configuration: Fixed or randomized delay (seconds)  
    - Input: Triggered per query batch  
    - Output: Passes to Google Maps search node  
    - Edge Cases: Too short delay risks blocking; too long delays slow workflow  

---

#### 2.3 Lead Discovery & URL Extraction

- **Overview:**  
  Executes Google Maps searches, extracts URLs from results, filters out unwanted URLs (Google or schema URLs), and removes duplicates to create a clean list of lead websites.

- **Nodes Involved:**  
  - Search Google Maps  
  - Extract URLs from Google Search  
  - Filter Out Google/Schema URLs  
  - Check if URL Exists  
  - Remove Duplicate URLs  
  - Loop Through Unique URLs  

- **Node Details:**  
  - **Search Google Maps**  
    - Type: HTTP Request  
    - Role: Queries Google Maps API or scrapes results for leads  
    - Configuration: Uses search queries as parameters  
    - Input: Search query string  
    - Output: Raw search results including URLs  
    - Edge Cases: API quota exceeded, request failures  

  - **Extract URLs from Google Search**  
    - Type: Code node  
    - Role: Parses raw search results to extract lead URLs  
    - Configuration: Custom JavaScript extraction logic  
    - Input: Raw search results  
    - Output: List of URLs  
    - Edge Cases: Parsing errors if Google response format changes  

  - **Filter Out Google/Schema URLs**  
    - Type: Filter node  
    - Role: Removes URLs pointing to Google domains or schema.org to avoid irrelevant leads  
    - Configuration: Filter condition based on URL patterns  
    - Input: Extracted URLs  
    - Output: Filtered URLs  
    - Edge Cases: Over-filtering or under-filtering may occur  

  - **Check if URL Exists**  
    - Type: If node  
    - Role: Validates URL presence and format  
    - Configuration: Checks URL string non-empty and valid format  
    - Input: Filtered URLs  
    - Output: Routes valid URLs to deduplication, invalid to NoOp  
    - Edge Cases: False negatives if URL format is unusual  

  - **Remove Duplicate URLs**  
    - Type: RemoveDuplicates  
    - Role: Ensures unique URLs for processing  
    - Configuration: Deduplicate based on URL string  
    - Input: Valid URLs  
    - Output: Unique URLs  
    - Edge Cases: Case sensitivity or trailing slash differences  

  - **Loop Through Unique URLs**  
    - Type: SplitInBatches  
    - Role: Processes each unique URL individually for scraping  
    - Configuration: Batch size controls concurrency  
    - Input: Deduplicated URLs  
    - Output: Feeds URLs to website content fetching  
    - Edge Cases: Large URL sets may slow workflow  

---

#### 2.4 Website Content Scraping & Email Extraction

- **Overview:**  
  Fetches website content for each lead URL, scrapes emails from content, deduplicates emails, and prepares verified email lists for outreach.

- **Nodes Involved:**  
  - Fetch Website Content (via URL)  
  - Loop Through Website Content Batches  
  - Aggregate Email Lists  
  - Extract and Filter Emails  
  - Remove Duplicate Emails  
  - Split Emails into Items  
  - Loop Through Unique Emails  
  - Extract Domain from Email  
  - Scrape Website Content (Jina.ai)  
  - Check for Scraping Error  
  - Truncate Website Content  

- **Node Details:**  
  - **Fetch Website Content (via URL)**  
    - Type: HTTP Request  
    - Role: Retrieves HTML content of lead websites  
    - Configuration: Standard GET requests with error continuation  
    - Input: Lead URLs  
    - Output: Raw HTML content  
    - Edge Cases: 404, timeouts, robots.txt blocking  

  - **Loop Through Website Content Batches**  
    - Type: SplitInBatches  
    - Role: Processes website content in manageable batches  
    - Configuration: Batch size controls load  
    - Input: Website content items  
    - Output: Feeds content to email extraction and aggregation  

  - **Aggregate Email Lists**  
    - Type: Aggregate  
    - Role: Combines extracted emails into a single list per batch  
    - Configuration: Aggregation by email field  
    - Input: Extracted emails  
    - Output: Aggregated email list  

  - **Extract and Filter Emails**  
    - Type: Code node  
    - Role: Parses website content to extract emails and filter invalid ones  
    - Configuration: Regex-based extraction and validation  
    - Input: Website content  
    - Output: List of valid emails  
    - Edge Cases: False positives/negatives in email extraction  

  - **Remove Duplicate Emails**  
    - Type: RemoveDuplicates  
    - Role: Ensures unique email addresses  
    - Configuration: Deduplicate by email string  
    - Input: Extracted emails  
    - Output: Unique emails  

  - **Split Emails into Items**  
    - Type: SplitOut  
    - Role: Splits aggregated email list into individual items for processing  
    - Configuration: Default  
    - Input: Aggregated emails  
    - Output: Individual email items  

  - **Loop Through Unique Emails**  
    - Type: SplitInBatches  
    - Role: Processes each unique email individually  
    - Configuration: Batch size controls concurrency  
    - Input: Unique emails  
    - Output: Feeds email to domain extraction and scraping  

  - **Extract Domain from Email**  
    - Type: Code node  
    - Role: Extracts domain part from email address for further processing  
    - Configuration: String parsing  
    - Input: Email address  
    - Output: Email domain  

  - **Scrape Website Content (Jina.ai)**  
    - Type: HTTP Request  
    - Role: Uses Jina.ai API to scrape and analyze website content for personalization  
    - Configuration: API endpoint, error continuation enabled  
    - Input: Email domain or URL  
    - Output: Scraped content or error info  

  - **Check for Scraping Error**  
    - Type: If node  
    - Role: Determines if scraping succeeded or failed  
    - Configuration: Checks response status or error flags  
    - Input: Scrape response  
    - Output: Routes to retry or truncation  

  - **Truncate Website Content**  
    - Type: Code node  
    - Role: Shortens website content to fit AI input limits (<200 words)  
    - Configuration: Text truncation logic  
    - Input: Scraped content  
    - Output: Truncated content for email generation  

---

#### 2.5 Personalized Email Generation

- **Overview:**  
  Uses AI (OpenAI GPT-4o or o3-mini) to generate personalized HTML emails based on truncated website content and the selected product offer. Parses AI output and prepares for sending.

- **Nodes Involved:**  
  - Generate Personalized Email (LLM Chain)  
  - Configure OpenAI Chat Model (GPT-4o-mini)  
  - Parse AI Email Output (JSON)  
  - Set Random Index  

- **Node Details:**  
  - **Configure OpenAI Chat Model (GPT-4o-mini)**  
    - Type: LangChain OpenAI Chat Model node  
    - Role: Configures AI model settings and credentials for email generation  
    - Configuration: Model selection (GPT-4o or o3-mini), temperature, max tokens  
    - Input: Prompt with truncated content and offer details  
    - Output: AI-generated email content  

  - **Generate Personalized Email (LLM Chain)**  
    - Type: LangChain Chain LLM node  
    - Role: Runs the AI prompt chain to produce personalized email HTML  
    - Configuration: Uses configured chat model, prompt templates  
    - Input: Website content, offer details  
    - Output: Raw AI email output  

  - **Parse AI Email Output (JSON)**  
    - Type: LangChain Output Parser Structured  
    - Role: Parses AI output JSON to extract email body, subject, and call-to-action links  
    - Configuration: JSON parsing rules  
    - Input: Raw AI output  
    - Output: Structured email components  

  - **Set Random Index**  
    - Type: Function node  
    - Role: Randomly selects SMTP account index for sending  
    - Configuration: Generates random integer between 0 and 4 (for 5 SMTP accounts)  
    - Input: Structured email data  
    - Output: Index for SMTP switch  

---

#### 2.6 SMTP Rotation & Email Sending

- **Overview:**  
  Randomly assigns one of five Gmail/SMTP accounts to send each email, applying randomized delays to mimic human behavior and manage sending quotas, thus protecting sender reputation.

- **Nodes Involved:**  
  - Switch SMTP  
  - Gmail (5 nodes named Gmail, Gmail 1, Gmail 3, Gmail 4, Gmail 5)  
  - Generate Random Delay  
  - Wait Between Emails  

- **Node Details:**  
  - **Switch SMTP**  
    - Type: Switch node  
    - Role: Routes email sending to one of five Gmail nodes based on random index  
    - Configuration: 5 outputs corresponding to SMTP accounts  
    - Input: Random index from Set Random Index node  
    - Output: One Gmail node per email  

  - **Gmail (All 5 nodes)**  
    - Type: Gmail node (SMTP sending)  
    - Role: Sends personalized email via assigned Gmail account  
    - Configuration: OAuth2 credentials for each Gmail account, email fields mapped from AI output  
    - Input: Email content and recipient info  
    - Output: Confirmation or error  
    - Edge Cases: Authentication failures, quota exceeded, network errors  

  - **Generate Random Delay**  
    - Type: Code node  
    - Role: Produces a randomized delay duration to throttle sending  
    - Configuration: Random delay range (e.g., seconds or minutes)  
    - Input: After sending or before next send  
    - Output: Delay duration  

  - **Wait Between Emails**  
    - Type: Wait node  
    - Role: Pauses workflow for generated delay duration to mimic human sending patterns  
    - Configuration: Uses delay from previous node  
    - Input: Delay duration  
    - Output: Triggers next email send cycle  

---

### 3. Summary Table

| Node Name                         | Node Type                      | Functional Role                              | Input Node(s)                    | Output Node(s)                       | Sticky Note                          |
|----------------------------------|--------------------------------|----------------------------------------------|---------------------------------|------------------------------------|------------------------------------|
| MANUAL TRIGGER: Start Workflow   | Manual Trigger                 | Entry point to start workflow                 | None                            | Loop Over Items                    |                                    |
| Loop Over Items                  | SplitInBatches                 | Iterates over product offers                  | MANUAL TRIGGER                  | Generate Google Maps Queries (OpenAI) |                                    |
| Generate Google Maps Queries (OpenAI) | OpenAI Chat Model (LangChain) | Generates targeted Google Maps search queries | Loop Over Items                 | Process AI-Generated Queries       |                                    |
| Process AI-Generated Queries     | Code                          | Parses AI output into search queries          | Generate Google Maps Queries    | Loop Through Search Queries        |                                    |
| Loop Through Search Queries      | SplitInBatches                 | Iterates over generated search queries        | Process AI-Generated Queries    | Wait Before Google Search          |                                    |
| Wait Before Google Search        | Wait                          | Delays between Google Maps searches           | Loop Through Search Queries     | Search Google Maps                 |                                    |
| Search Google Maps               | HTTP Request                  | Executes Google Maps search                    | Wait Before Google Search       | Extract URLs from Google Search    |                                    |
| Extract URLs from Google Search  | Code                          | Extracts URLs from search results              | Search Google Maps              | Filter Out Google/Schema URLs      |                                    |
| Filter Out Google/Schema URLs    | Filter                        | Removes Google and schema.org URLs             | Extract URLs from Google Search | Check if URL Exists                |                                    |
| Check if URL Exists              | If                            | Validates URL format                           | Filter Out Google/Schema URLs   | Remove Duplicate URLs / NoOp       |                                    |
| NoOp (If URL Invalid)            | NoOp                          | Handles invalid URLs                           | Check if URL Exists             | None                             |                                    |
| Remove Duplicate URLs            | RemoveDuplicates              | Deduplicates URLs                              | Check if URL Exists             | Loop Through Unique URLs           |                                    |
| Loop Through Unique URLs         | SplitInBatches                 | Processes each unique URL                       | Remove Duplicate URLs           | Fetch Website Content / Loop Through Website Content Batches |                                    |
| Fetch Website Content (via URL) | HTTP Request                  | Retrieves website HTML content                  | Loop Through Unique URLs        | Loop Through Unique URLs           |                                    |
| Loop Through Website Content Batches | SplitInBatches                 | Processes website content batches               | Loop Through Unique URLs        | Aggregate Email Lists / Extract and Filter Emails | Sticky Note: Email Extraction Section |
| Aggregate Email Lists            | Aggregate                     | Combines extracted emails                       | Loop Through Website Content Batches | Split Emails into Items          | Sticky Note: Email Extraction Section |
| Extract and Filter Emails        | Code                          | Extracts and validates emails                   | Loop Through Website Content Batches | Loop Through Website Content Batches | Sticky Note: Email Extraction Section |
| Split Emails into Items          | SplitOut                      | Splits email list into individual items         | Aggregate Email Lists           | Remove Duplicate Emails            | Sticky Note: Email Extraction Section |
| Remove Duplicate Emails          | RemoveDuplicates              | Deduplicates emails                             | Split Emails into Items         | Loop Through Unique Emails         | Sticky Note: Email Extraction Section |
| Loop Through Unique Emails       | SplitInBatches                 | Processes each unique email                      | Remove Duplicate Emails         | Extract Domain from Email / Loop Through Search Queries | Sticky Note: Personalization & Sending Section |
| Extract Domain from Email        | Code                          | Extracts domain from email address               | Loop Through Unique Emails      | Scrape Website Content (Jina.ai)  | Sticky Note: Personalization & Sending Section |
| Scrape Website Content (Jina.ai)| HTTP Request                  | Scrapes website content for personalization     | Extract Domain from Email       | Check for Scraping Error           | Sticky Note: Personalization & Sending Section |
| Check for Scraping Error         | If                            | Checks if scraping succeeded                      | Scrape Website Content          | Loop Through Unique Emails / Truncate Website Content | Sticky Note: Personalization & Sending Section |
| Truncate Website Content         | Code                          | Truncates content to fit AI input limits         | Check for Scraping Error        | Generate Personalized Email (LLM Chain) | Sticky Note: Personalization & Sending Section |
| Configure OpenAI Chat Model (GPT-4o-mini) | LangChain OpenAI Chat Model  | Configures AI model for email generation          | None (configured globally)      | Generate Personalized Email (LLM Chain) | Sticky Note: Personalization & Sending Section |
| Generate Personalized Email (LLM Chain) | LangChain Chain LLM           | Generates personalized HTML email                  | Truncate Website Content / Configure OpenAI Chat Model | Set Random Index                | Sticky Note: Personalization & Sending Section |
| Parse AI Email Output (JSON)    | LangChain Output Parser       | Parses AI-generated email JSON output             | Generate Personalized Email     | Generate Personalized Email (LLM Chain) | Sticky Note: Personalization & Sending Section |
| Set Random Index                | Function                      | Randomly selects SMTP account index               | Generate Personalized Email     | Switch SMTP                      | Sticky Note: Personalization & Sending Section |
| Switch SMTP                    | Switch                        | Routes email to one of five SMTP accounts          | Set Random Index                | Gmail 1 / Gmail / Gmail 3 / Gmail 4 / Gmail 5 | Sticky Note: Personalization & Sending Section |
| Gmail 1                        | Gmail                         | Sends email via Gmail account 1                     | Switch SMTP                    | Generate Random Delay             | Sticky Note: Personalization & Sending Section |
| Gmail                         | Gmail                         | Sends email via Gmail account 2                     | Switch SMTP                    | Generate Random Delay             | Sticky Note: Personalization & Sending Section |
| Gmail 3                       | Gmail                         | Sends email via Gmail account 3                     | Switch SMTP                    | Generate Random Delay             | Sticky Note: Personalization & Sending Section |
| Gmail 4                       | Gmail                         | Sends email via Gmail account 4                     | Switch SMTP                    | Generate Random Delay             | Sticky Note: Personalization & Sending Section |
| Gmail 5                       | Gmail                         | Sends email via Gmail account 5                     | Switch SMTP                    | Generate Random Delay             | Sticky Note: Personalization & Sending Section |
| Generate Random Delay          | Code                          | Generates randomized delay duration                  | Gmail nodes                    | Wait Between Emails              | Sticky Note: Personalization & Sending Section |
| Wait Between Emails            | Wait                          | Delays between email sends to mimic human behavior | Generate Random Delay           | Loop Through Unique Emails        | Sticky Note: Personalization & Sending Section |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow manually  

2. **Define Offers in pinData**  
   - Add JSON data with product_name, product_description, product_link for each offer  

3. **Add SplitInBatches Node: Loop Over Items**  
   - Input: Manual Trigger output  
   - Purpose: Iterate over each offer  

4. **Add OpenAI Chat Model Node: Generate Google Maps Queries (OpenAI)**  
   - Connect from Loop Over Items (second output)  
   - Configure with GPT-4o or o3-mini credentials  
   - Set prompt to generate 100 targeted Google Maps queries per offer  

5. **Add Code Node: Process AI-Generated Queries**  
   - Connect from OpenAI node  
   - Write JS code to parse AI output into clean query list  

6. **Add SplitInBatches Node: Loop Through Search Queries**  
   - Connect from Code node  
   - Iterate over each query  

7. **Add Wait Node: Wait Before Google Search**  
   - Connect from Loop Through Search Queries  
   - Configure delay (e.g., 2-5 seconds) to avoid rate limits  

8. **Add HTTP Request Node: Search Google Maps**  
   - Connect from Wait node  
   - Configure to perform Google Maps search with query parameter  

9. **Add Code Node: Extract URLs from Google Search**  
   - Connect from Search Google Maps  
   - Extract URLs from response  

10. **Add Filter Node: Filter Out Google/Schema URLs**  
    - Connect from Extract URLs  
    - Filter URLs containing "google.com" or "schema.org"  

11. **Add If Node: Check if URL Exists**  
    - Connect from Filter node  
    - Condition: URL is non-empty and valid format  
    - True output: Remove Duplicate URLs  
    - False output: NoOp node  

12. **Add RemoveDuplicates Node: Remove Duplicate URLs**  
    - Connect from Check if URL Exists (true)  
    - Deduplicate URLs  

13. **Add SplitInBatches Node: Loop Through Unique URLs**  
    - Connect from Remove Duplicate URLs  
    - Process each URL individually  

14. **Add HTTP Request Node: Fetch Website Content (via URL)**  
    - Connect from Loop Through Unique URLs (main output)  
    - GET request to URL to fetch HTML content  

15. **Add SplitInBatches Node: Loop Through Website Content Batches**  
    - Connect from Loop Through Unique URLs (second output)  
    - Batch process website content  

16. **Add Aggregate Node: Aggregate Email Lists**  
    - Connect from Loop Through Website Content Batches (first output)  
    - Aggregate emails extracted  

17. **Add Code Node: Extract and Filter Emails**  
    - Connect from Loop Through Website Content Batches (second output)  
    - Use regex to extract emails from content and filter invalid ones  

18. **Add RemoveDuplicates Node: Remove Duplicate Emails**  
    - Connect from Split Emails into Items node (next step)  

19. **Add SplitOut Node: Split Emails into Items**  
    - Connect from Aggregate Email Lists  
    - Split aggregated emails into individual items  

20. **Add SplitInBatches Node: Loop Through Unique Emails**  
    - Connect from Remove Duplicate Emails  
    - Process each email individually  

21. **Add Code Node: Extract Domain from Email**  
    - Connect from Loop Through Unique Emails  
    - Extract domain part of email address  

22. **Add HTTP Request Node: Scrape Website Content (Jina.ai)**  
    - Connect from Extract Domain from Email  
    - Configure with Jina.ai API credentials to scrape content  

23. **Add If Node: Check for Scraping Error**  
    - Connect from Scrape Website Content  
    - Route success to Truncate Website Content, failure back to Loop Through Unique Emails  

24. **Add Code Node: Truncate Website Content**  
    - Connect from Check for Scraping Error (success)  
    - Truncate content to <200 words for AI input  

25. **Add LangChain OpenAI Chat Model Node: Configure OpenAI Chat Model (GPT-4o-mini)**  
    - Configure with OpenAI credentials and model parameters  

26. **Add LangChain Chain LLM Node: Generate Personalized Email (LLM Chain)**  
    - Connect from Truncate Website Content and Configure OpenAI Chat Model  
    - Use prompt templates to generate personalized HTML email  

27. **Add LangChain Output Parser Structured Node: Parse AI Email Output (JSON)**  
    - Connect from Generate Personalized Email  
    - Parse AI JSON output into structured email components  

28. **Add Function Node: Set Random Index**  
    - Connect from Generate Personalized Email  
    - Generate random integer 0-4 for SMTP selection  

29. **Add Switch Node: Switch SMTP**  
    - Connect from Set Random Index  
    - 5 outputs for 5 Gmail nodes  

30. **Add 5 Gmail Nodes (Gmail, Gmail 1, Gmail 3, Gmail 4, Gmail 5)**  
    - Connect each output of Switch SMTP to one Gmail node  
    - Configure each with separate Gmail OAuth2 credentials  
    - Map email fields from parsed AI output  

31. **Add Code Node: Generate Random Delay**  
    - Connect from each Gmail node  
    - Generate randomized delay duration (e.g., 10-60 seconds)  

32. **Add Wait Node: Wait Between Emails**  
    - Connect from Generate Random Delay  
    - Delay sending to mimic human behavior  

33. **Connect Wait Between Emails back to Loop Through Unique Emails**  
    - To continue processing next email after delay  

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow supports GPT-4o and OpenAI o3-mini models, allowing flexible AI model usage.         | Workflow Description                                                                                |
| SMTP rotation across five Gmail accounts helps avoid rate limits and improves deliverability.      | Workflow Description                                                                                |
| SEO-smart phrasing and direct call to action in emails improve conversion rates.                   | Workflow Description                                                                                |
| Use of Jina.ai for website content scraping enhances personalization quality.                      | Website Content Scraping Section                                                                    |
| Random delays between sends mimic human behavior to protect sender reputation.                      | SMTP Rotation & Email Sending Section                                                              |
| For detailed OpenAI API setup, refer to official docs: https://platform.openai.com/docs/api-reference | Credential configuration and AI nodes setup                                                        |
| Gmail OAuth2 credentials must be pre-configured in n8n for each Gmail node.                         | SMTP Rotation & Email Sending Section                                                              |

---

This structured documentation enables advanced users and AI agents to fully understand, reproduce, and modify the AI-Personalized Multi-Product Email Outreach workflow with SMTP rotation, ensuring robust operation and scalability.