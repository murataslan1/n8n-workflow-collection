 Automate Sales for Digital Products & SaaS with AI (GPT-4o)

https://n8nworkflows.xyz/workflows/-automate-sales-for-digital-products---saas-with-ai--gpt-4o--3342


#  Automate Sales for Digital Products & SaaS with AI (GPT-4o)

### 1. Workflow Overview

This workflow automates sales outreach for digital products and SaaS using AI-powered prospecting, email discovery, and personalized email generation. It targets businesses by searching Google Maps for relevant companies, extracting their website URLs, scraping professional emails, and sending SEO-optimized, personalized outreach emails via Gmail or SMTP.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Query Generation:** Accepts product details and uses OpenAI GPT-4o to generate targeted Google Maps search queries.
- **1.2 Prospecting & URL Extraction:** Searches Google Maps, extracts business URLs, filters duplicates and irrelevant URLs.
- **1.3 Website Content Scraping & Email Extraction:** Fetches website content, scrapes emails, filters duplicates, and aggregates email lists.
- **1.4 Email Personalization & Generation:** Uses GPT-4o to analyze website content and generate concise, SEO-optimized personalized emails.
- **1.5 Email Sending & Throttling:** Sends emails via Gmail with randomized delays to improve deliverability and avoid spam filters.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Query Generation

- **Overview:**  
  This block receives the initial product details and uses GPT-4o to generate relevant Google Maps search queries for prospecting.

- **Nodes Involved:**  
  - MANUAL TRIGGER: Start Workflow  
  - Generate Google Maps Queries (OpenAI)  
  - Process AI-Generated Queries  
  - Loop Through Search Queries  
  - Wait Before Google Search

- **Node Details:**

  - **MANUAL TRIGGER: Start Workflow**  
    - Type: Manual Trigger  
    - Role: Entry point; accepts product_name, product_description, product_link as input parameters.  
    - Inputs: None (manual start)  
    - Outputs: Triggers the OpenAI query generation node.  
    - Edge Cases: Missing or malformed input parameters may cause downstream failures.

  - **Generate Google Maps Queries (OpenAI)**  
    - Type: OpenAI GPT-4o (LangChain)  
    - Role: Generates a list of Google Maps search queries based on product details.  
    - Configuration: Uses GPT-4o-mini model; prompt tailored to create niche-specific search queries.  
    - Inputs: Product details from the manual trigger.  
    - Outputs: AI-generated search queries.  
    - Edge Cases: API rate limits, malformed prompts, or unexpected AI output format.

  - **Process AI-Generated Queries**  
    - Type: Code  
    - Role: Processes and formats AI-generated queries into a usable list.  
    - Inputs: Raw AI output.  
    - Outputs: Structured search queries for batch processing.  
    - Edge Cases: Parsing errors if AI output deviates from expected format.

  - **Loop Through Search Queries**  
    - Type: SplitInBatches  
    - Role: Iterates over each search query to control request flow.  
    - Inputs: List of queries.  
    - Outputs: Single query per batch.  
    - Edge Cases: Large query lists may cause long processing times.

  - **Wait Before Google Search**  
    - Type: Wait  
    - Role: Adds delay before each Google Maps search to avoid rate limiting or blocking.  
    - Inputs: Single query batch.  
    - Outputs: Delayed trigger for next node.  
    - Edge Cases: Excessive delays may slow workflow; insufficient delay risks IP blocking.

---

#### 2.2 Prospecting & URL Extraction

- **Overview:**  
  This block performs Google Maps searches using the queries, extracts business URLs, filters out duplicates and irrelevant URLs (e.g., Google or schema URLs), and prepares unique URLs for further processing.

- **Nodes Involved:**  
  - Search Google Maps  
  - Extract URLs from Google Search  
  - Filter Out Google/Schema URLs  
  - Check if URL Exists  
  - Remove Duplicate URLs  
  - Loop Through Unique URLs  
  - NoOp (If URL Invalid)

- **Node Details:**

  - **Search Google Maps**  
    - Type: HTTP Request  
    - Role: Executes Google Maps API or scraping to retrieve business listings for each query.  
    - Inputs: Single search query from Wait node.  
    - Outputs: Raw search results including business details.  
    - Edge Cases: API quota limits, request failures, or changes in Google Maps response format.

  - **Extract URLs from Google Search**  
    - Type: Code  
    - Role: Parses search results to extract website URLs of businesses.  
    - Inputs: Raw search results.  
    - Outputs: List of URLs.  
    - Edge Cases: Parsing errors if Google changes response structure.

  - **Filter Out Google/Schema URLs**  
    - Type: Filter  
    - Role: Removes URLs that are Google-owned or schema.org URLs to avoid irrelevant links.  
    - Inputs: List of URLs.  
    - Outputs: Filtered URLs.  
    - Edge Cases: Over-filtering may exclude valid URLs; under-filtering may include irrelevant URLs.

  - **Check if URL Exists**  
    - Type: If  
    - Role: Validates URL presence and format before proceeding.  
    - Inputs: Filtered URLs.  
    - Outputs: Valid URLs proceed; invalid URLs routed to NoOp.  
    - Edge Cases: False negatives if URL validation logic is too strict.

  - **Remove Duplicate URLs**  
    - Type: RemoveDuplicates  
    - Role: Ensures each URL is unique to avoid redundant processing.  
    - Inputs: Valid URLs.  
    - Outputs: Unique URLs.  
    - Edge Cases: Case sensitivity or URL normalization issues.

  - **Loop Through Unique URLs**  
    - Type: SplitInBatches  
    - Role: Processes each unique URL in batches for controlled scraping.  
    - Inputs: Unique URLs.  
    - Outputs: Single URL per batch.  
    - Edge Cases: Large URL lists increase processing time.

  - **NoOp (If URL Invalid)**  
    - Type: No Operation  
    - Role: Placeholder for invalid URLs to maintain workflow integrity.  
    - Inputs: Invalid URLs from Check if URL Exists.  
    - Outputs: None (ends branch).  

---

#### 2.3 Website Content Scraping & Email Extraction

- **Overview:**  
  This block fetches website content for each URL, optionally scrapes content via Jina AI, extracts professional emails, filters duplicates, and aggregates email lists for outreach.

- **Nodes Involved:**  
  - Fetch Website Content (via URL)  
  - Loop Through Website Content Batches  
  - Aggregate Email Lists  
  - Extract and Filter Emails  
  - Split Emails into Items  
  - Remove Duplicate Emails  
  - Loop Through Unique Emails  
  - Extract Domain from Email  
  - Scrape Website Content (Jina.ai)  
  - Check for Scraping Error  
  - Truncate Website Content

- **Node Details:**

  - **Fetch Website Content (via URL)**  
    - Type: HTTP Request  
    - Role: Retrieves raw HTML or text content from each business website URL.  
    - Inputs: Single URL from Loop Through Unique URLs.  
    - Outputs: Website content.  
    - Edge Cases: HTTP errors, timeouts, redirects, or blocked requests.

  - **Loop Through Website Content Batches**  
    - Type: SplitInBatches  
    - Role: Processes website content in manageable batches for email extraction and aggregation.  
    - Inputs: Website content.  
    - Outputs: Batches of content.  
    - Edge Cases: Large content size may cause memory issues.

  - **Aggregate Email Lists**  
    - Type: Aggregate  
    - Role: Combines extracted emails into a consolidated list.  
    - Inputs: Extracted emails from batches.  
    - Outputs: Aggregated email list.  
    - Edge Cases: Incorrect aggregation may cause duplicates or data loss.

  - **Extract and Filter Emails**  
    - Type: Code  
    - Role: Parses website content to extract professional email addresses and filters out invalid or generic emails.  
    - Inputs: Website content batches.  
    - Outputs: List of filtered emails.  
    - Edge Cases: False positives/negatives in email extraction; malformed emails.

  - **Split Emails into Items**  
    - Type: SplitOut  
    - Role: Splits aggregated email list into individual email items for further processing.  
    - Inputs: Aggregated email list.  
    - Outputs: Individual emails.  
    - Edge Cases: Empty lists or malformed email entries.

  - **Remove Duplicate Emails**  
    - Type: RemoveDuplicates  
    - Role: Ensures unique email addresses to avoid redundant outreach.  
    - Inputs: Individual emails.  
    - Outputs: Unique emails.  
    - Edge Cases: Case sensitivity or formatting inconsistencies.

  - **Loop Through Unique Emails**  
    - Type: SplitInBatches  
    - Role: Processes each unique email individually for personalization and sending.  
    - Inputs: Unique emails.  
    - Outputs: Single email per batch.  
    - Edge Cases: Large email lists increase processing time.

  - **Extract Domain from Email**  
    - Type: Code  
    - Role: Extracts domain part from email address to assist with website scraping.  
    - Inputs: Single email.  
    - Outputs: Domain string.  
    - Edge Cases: Malformed emails may cause extraction errors.

  - **Scrape Website Content (Jina.ai)**  
    - Type: HTTP Request  
    - Role: Uses Jina AI service to scrape and extract structured content from the domain website.  
    - Inputs: Domain extracted from email.  
    - Outputs: Scraped website content.  
    - Edge Cases: API errors, rate limits, or content extraction failures.

  - **Check for Scraping Error**  
    - Type: If  
    - Role: Detects errors in scraping response and routes accordingly.  
    - Inputs: Scraped content response.  
    - Outputs: If error, loops back or truncates content.  
    - Edge Cases: False error detection or missed errors.

  - **Truncate Website Content**  
    - Type: Code  
    - Role: Limits website content length to fit within AI prompt constraints for email generation.  
    - Inputs: Scraped website content.  
    - Outputs: Truncated content.  
    - Edge Cases: Over-truncation may lose important context.

---

#### 2.4 Email Personalization & Generation

- **Overview:**  
  This block uses GPT-4o to analyze truncated website content and generate concise, SEO-optimized, personalized outreach emails embedding the product link naturally.

- **Nodes Involved:**  
  - Configure OpenAI Chat Model (GPT-4o-mini)  
  - Generate Personalized Email (LLM Chain)  
  - Parse AI Email Output (JSON)

- **Node Details:**

  - **Configure OpenAI Chat Model (GPT-4o-mini)**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Configures the GPT-4o-mini model for email generation.  
    - Inputs: Truncated website content and product details.  
    - Outputs: Model ready for chain execution.  
    - Edge Cases: API key issues, rate limits.

  - **Generate Personalized Email (LLM Chain)**  
    - Type: LangChain Chain LLM  
    - Role: Generates personalized, SEO-friendly outreach email text (<200 words) using AI.  
    - Inputs: Website content, product info, and configured model.  
    - Outputs: AI-generated email content in structured JSON.  
    - Edge Cases: AI hallucination, incomplete or irrelevant output.

  - **Parse AI Email Output (JSON)**  
    - Type: LangChain Output Parser Structured  
    - Role: Parses AI output JSON to extract email body and subject cleanly.  
    - Inputs: Raw AI output.  
    - Outputs: Parsed email text fields.  
    - Edge Cases: Parsing errors if AI output format changes.

---

#### 2.5 Email Sending & Throttling

- **Overview:**  
  This block sends personalized emails via Gmail with randomized delays between sends to improve deliverability and avoid spam filters.

- **Nodes Involved:**  
  - Send Email via Gmail  
  - Generate Random Delay  
  - Wait Between Emails

- **Node Details:**

  - **Send Email via Gmail**  
    - Type: Gmail Node  
    - Role: Sends personalized outreach email to each unique email address.  
    - Inputs: Parsed email content, recipient email address.  
    - Outputs: Email send status.  
    - Credential: Gmail OAuth2 credentials required.  
    - Edge Cases: Gmail API limits, authentication errors, email bounces.

  - **Generate Random Delay**  
    - Type: Code  
    - Role: Generates a randomized delay duration to space out email sends.  
    - Inputs: None (or previous node output).  
    - Outputs: Delay time in milliseconds.  
    - Edge Cases: Delay too short may trigger spam filters; too long slows campaign.

  - **Wait Between Emails**  
    - Type: Wait  
    - Role: Pauses workflow for the generated delay before sending the next email.  
    - Inputs: Delay time.  
    - Outputs: Triggers next email send cycle.  
    - Edge Cases: Workflow timeout if delays accumulate excessively.

---

### 3. Summary Table

| Node Name                         | Node Type                          | Functional Role                         | Input Node(s)                      | Output Node(s)                      | Sticky Note                          |
|----------------------------------|----------------------------------|---------------------------------------|----------------------------------|-----------------------------------|------------------------------------|
| MANUAL TRIGGER: Start Workflow   | Manual Trigger                   | Entry point, receives product details | None                             | Generate Google Maps Queries (OpenAI) |                                    |
| Generate Google Maps Queries (OpenAI) | OpenAI GPT-4o (LangChain)        | Generates Google Maps search queries  | MANUAL TRIGGER                   | Process AI-Generated Queries       |                                    |
| Process AI-Generated Queries      | Code                            | Processes AI output into queries      | Generate Google Maps Queries     | Loop Through Search Queries        |                                    |
| Loop Through Search Queries       | SplitInBatches                  | Iterates over search queries          | Process AI-Generated Queries     | Wait Before Google Search          |                                    |
| Wait Before Google Search         | Wait                            | Delays before Google Maps search      | Loop Through Search Queries      | Search Google Maps                 |                                    |
| Search Google Maps                | HTTP Request                    | Performs Google Maps search           | Wait Before Google Search        | Extract URLs from Google Search    |                                    |
| Extract URLs from Google Search   | Code                            | Extracts URLs from search results     | Search Google Maps               | Filter Out Google/Schema URLs      |                                    |
| Filter Out Google/Schema URLs     | Filter                          | Removes irrelevant URLs                | Extract URLs from Google Search  | Check if URL Exists                |                                    |
| Check if URL Exists               | If                              | Validates URLs                        | Filter Out Google/Schema URLs    | Remove Duplicate URLs / NoOp       |                                    |
| Remove Duplicate URLs             | RemoveDuplicates                | Removes duplicate URLs                 | Check if URL Exists              | Loop Through Unique URLs           |                                    |
| Loop Through Unique URLs          | SplitInBatches                  | Processes each unique URL              | Remove Duplicate URLs            | Loop Through Website Content Batches / Fetch Website Content (via URL) |                                    |
| Fetch Website Content (via URL)  | HTTP Request                    | Retrieves website content              | Loop Through Unique URLs         | Loop Through Unique URLs           |                                    |
| Loop Through Website Content Batches | SplitInBatches                  | Processes website content in batches  | Loop Through Unique URLs         | Aggregate Email Lists / Extract and Filter Emails |                                    |
| Aggregate Email Lists             | Aggregate                      | Aggregates extracted emails           | Loop Through Website Content Batches | Split Emails into Items           |                                    |
| Extract and Filter Emails         | Code                            | Extracts and filters emails            | Loop Through Website Content Batches | Loop Through Website Content Batches |                                    |
| Split Emails into Items           | SplitOut                       | Splits aggregated emails into items   | Aggregate Email Lists            | Remove Duplicate Emails            |                                    |
| Remove Duplicate Emails           | RemoveDuplicates                | Removes duplicate emails               | Split Emails into Items          | Loop Through Unique Emails         |                                    |
| Loop Through Unique Emails        | SplitInBatches                  | Processes each unique email            | Remove Duplicate Emails          | Loop Through Search Queries / Extract Domain from Email |                                    |
| Extract Domain from Email         | Code                            | Extracts domain from email             | Loop Through Unique Emails       | Scrape Website Content (Jina.ai)  |                                    |
| Scrape Website Content (Jina.ai) | HTTP Request                    | Scrapes website content via Jina AI   | Extract Domain from Email        | Check for Scraping Error           |                                    |
| Check for Scraping Error          | If                              | Checks for scraping errors             | Scrape Website Content (Jina.ai) | Loop Through Unique Emails / Truncate Website Content |                                    |
| Truncate Website Content          | Code                            | Truncates website content for AI input | Check for Scraping Error         | Generate Personalized Email (LLM Chain) |                                    |
| Configure OpenAI Chat Model (GPT-4o-mini) | LangChain OpenAI Chat Model     | Configures GPT-4o for email generation | None (used as AI model config)   | Generate Personalized Email (LLM Chain) |                                    |
| Generate Personalized Email (LLM Chain) | LangChain Chain LLM             | Generates personalized outreach email | Truncate Website Content / Configure OpenAI Chat Model | Send Email via Gmail              |                                    |
| Parse AI Email Output (JSON)      | LangChain Output Parser Structured | Parses AI-generated email JSON output | Generate Personalized Email (LLM Chain) | Generate Personalized Email (LLM Chain) (ai_outputParser) |                                    |
| Send Email via Gmail              | Gmail                          | Sends personalized email               | Generate Personalized Email (LLM Chain) | Generate Random Delay             |                                    |
| Generate Random Delay             | Code                            | Generates random delay between emails | Send Email via Gmail             | Wait Between Emails                |                                    |
| Wait Between Emails               | Wait                            | Waits before sending next email        | Generate Random Delay            | Loop Through Unique Emails         |                                    |
| NoOp (If URL Invalid)             | No Operation                   | Ends branch for invalid URLs           | Check if URL Exists (false path) | None                             |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: MANUAL TRIGGER: Start Workflow  
   - Parameters: Add input fields for `product_name`, `product_description`, `product_link`.

2. **Add OpenAI Node for Query Generation**  
   - Name: Generate Google Maps Queries (OpenAI)  
   - Type: LangChain OpenAI GPT-4o-mini  
   - Configure API credentials for OpenAI GPT-4o.  
   - Set prompt to generate Google Maps search queries based on product inputs.  
   - Connect output from Manual Trigger.

3. **Add Code Node to Process AI Queries**  
   - Name: Process AI-Generated Queries  
   - Write JavaScript to parse AI output into an array of search queries.  
   - Connect from OpenAI node.

4. **Add SplitInBatches Node**  
   - Name: Loop Through Search Queries  
   - Configure batch size (e.g., 1) to process queries one by one.  
   - Connect from Code node.

5. **Add Wait Node**  
   - Name: Wait Before Google Search  
   - Configure delay (e.g., 2-5 seconds) to avoid rate limits.  
   - Connect from SplitInBatches node.

6. **Add HTTP Request Node for Google Maps Search**  
   - Name: Search Google Maps  
   - Configure API or scraping method to search Google Maps with query.  
   - Connect from Wait node.

7. **Add Code Node to Extract URLs**  
   - Name: Extract URLs from Google Search  
   - Write code to parse Google Maps results and extract business website URLs.  
   - Connect from HTTP Request node.

8. **Add Filter Node**  
   - Name: Filter Out Google/Schema URLs  
   - Configure filter to exclude URLs containing "google.com", "schema.org", or similar.  
   - Connect from Code node.

9. **Add If Node**  
   - Name: Check if URL Exists  
   - Condition: Check if URL is valid and non-empty.  
   - Connect from Filter node.

10. **Add NoOp Node**  
    - Name: NoOp (If URL Invalid)  
    - Connect from If node (false branch).

11. **Add RemoveDuplicates Node**  
    - Name: Remove Duplicate URLs  
    - Configure to remove duplicate URLs.  
    - Connect from If node (true branch).

12. **Add SplitInBatches Node**  
    - Name: Loop Through Unique URLs  
    - Batch size 1.  
    - Connect from RemoveDuplicates node.

13. **Add HTTP Request Node**  
    - Name: Fetch Website Content (via URL)  
    - Configure to fetch website HTML content.  
    - Connect from SplitInBatches node.

14. **Add SplitInBatches Node**  
    - Name: Loop Through Website Content Batches  
    - Batch size as needed.  
    - Connect from SplitInBatches node (Loop Through Unique URLs).

15. **Add Code Node**  
    - Name: Extract and Filter Emails  
    - Write code to extract emails from website content and filter professional addresses.  
    - Connect from Loop Through Website Content Batches.

16. **Add Aggregate Node**  
    - Name: Aggregate Email Lists  
    - Configure to aggregate emails extracted from batches.  
    - Connect from Loop Through Website Content Batches.

17. **Add SplitOut Node**  
    - Name: Split Emails into Items  
    - Connect from Aggregate Email Lists.

18. **Add RemoveDuplicates Node**  
    - Name: Remove Duplicate Emails  
    - Connect from Split Emails into Items.

19. **Add SplitInBatches Node**  
    - Name: Loop Through Unique Emails  
    - Batch size 1.  
    - Connect from Remove Duplicate Emails.

20. **Add Code Node**  
    - Name: Extract Domain from Email  
    - Extract domain from each email address.  
    - Connect from Loop Through Unique Emails.

21. **Add HTTP Request Node**  
    - Name: Scrape Website Content (Jina.ai)  
    - Configure Jina AI API credentials and request to scrape domain content.  
    - Connect from Extract Domain from Email.

22. **Add If Node**  
    - Name: Check for Scraping Error  
    - Check response for errors; if error, loop back or truncate content.  
    - Connect from Scrape Website Content.

23. **Add Code Node**  
    - Name: Truncate Website Content  
    - Truncate content to fit AI prompt limits.  
    - Connect from If node (no error branch).

24. **Add LangChain OpenAI Chat Model Node**  
    - Name: Configure OpenAI Chat Model (GPT-4o-mini)  
    - Configure OpenAI credentials and model parameters.  
    - No direct input; used as model config for next node.

25. **Add LangChain Chain LLM Node**  
    - Name: Generate Personalized Email (LLM Chain)  
    - Use truncated content and product info to generate personalized email text (<200 words).  
    - Connect from Truncate Website Content and Configure OpenAI Chat Model.

26. **Add LangChain Output Parser Node**  
    - Name: Parse AI Email Output (JSON)  
    - Parse AI output JSON to extract email subject and body.  
    - Connect from Generate Personalized Email.

27. **Add Gmail Node**  
    - Name: Send Email via Gmail  
    - Configure Gmail OAuth2 credentials.  
    - Use parsed email content and recipient email address.  
    - Connect from Generate Personalized Email.

28. **Add Code Node**  
    - Name: Generate Random Delay  
    - Generate random delay (e.g., 10-60 seconds) between emails.  
    - Connect from Send Email via Gmail.

29. **Add Wait Node**  
    - Name: Wait Between Emails  
    - Wait for generated delay duration.  
    - Connect from Generate Random Delay.

30. **Connect Wait Between Emails back to Loop Through Unique Emails**  
    - To continue sending emails with throttling.

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                  |
|------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Workflow automates lead generation and outreach for digital products and SaaS using AI and n8n automation. | Workflow description and purpose.                |
| Requires OpenAI GPT-4o API access; API costs apply.                                                        | OpenAI API usage.                                |
| Gmail or SMTP credentials needed for email sending; comply with anti-spam laws (CAN-SPAM, GDPR).           | Email sending compliance.                        |
| Website scraping may break if website structures change; monitor and update scraping logic accordingly.    | Scraping maintenance.                            |
| Randomized delays between emails improve deliverability and reduce spam risk.                              | Email sending best practices.                    |
| Optional use of Jina AI for advanced website content scraping and extraction.                              | Advanced scraping integration.                   |
| For setup, import workflow JSON into n8n, configure credentials, and input product details to start.       | Quick start instructions.                         |
| SEO-optimized, personalized emails generated by GPT-4o improve engagement and conversion rates.            | Email content strategy.                           |
| Workflow designed for scalability with batch processing and error handling at each stage.                  | Workflow robustness and scalability.             |

---

This document provides a detailed, structured reference to understand, reproduce, and modify the AI-powered sales outreach workflow in n8n. It covers all nodes, their roles, configurations, and potential failure points to ensure reliable operation and easy customization.