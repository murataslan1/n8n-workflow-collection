Analyze and Optimize Top Website Content using Google Analytics, Firecrawl and InfraNodus

https://n8nworkflows.xyz/workflows/analyze-and-optimize-top-website-content-using-google-analytics--firecrawl-and-infranodus-6245


# Analyze and Optimize Top Website Content using Google Analytics, Firecrawl and InfraNodus

### 1. Workflow Overview

This workflow is designed to analyze and optimize the top-performing content on a website by leveraging Google Analytics, Firecrawl, and InfraNodus. It targets marketing and SEO professionals who want to understand what key topics engage their visitors and identify content gaps to create new, valuable materials.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives a trigger via a form submission to start the analysis.
- **1.2 Google Analytics Data Extraction:** Fetches top visited pages from a specified Google Analytics property.
- **1.3 URL Augmentation:** Constructs full URLs for each page by appending the website domain.
- **1.4 Batch Processing:** Loops over each URL to handle them individually.
- **1.5 Content Extraction via Firecrawl:** Scrapes and extracts textual content from each page URL.
- **1.6 Data Aggregation in InfraNodus:** Sends extracted content to InfraNodus to build or update a knowledge graph.
- **1.7 Graph Analysis & Summary:** Requests InfraNodus to analyze the graph and produce a summary of main topical clusters.
- **1.8 Result Presentation:** Displays the summarized insights back to the user via a form response, optionally enabling further sharing or content creation workflows.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block initiates the workflow when a user submits the associated form. It gathers parameters and triggers the subsequent steps.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**  
  - **On form submission**  
    - *Type:* Form Trigger  
    - *Role:* Receive user input trigger to start the workflow  
    - *Configuration:* Webhook ID assigned; form titled "Launch Analysis" with description explaining the workflow purpose.  
    - *Expressions:* None  
    - *Input:* External user submission  
    - *Output:* Triggers Google Analytics node  
    - *Version:* 2.2  
    - *Edge Cases:* Webhook failure or misconfiguration; no user input received.

#### 2.2 Google Analytics Data Extraction

- **Overview:**  
  Retrieves the top 30 pages visited over the last 30 days from a specified Google Analytics 4 property.

- **Nodes Involved:**  
  - Google Analytics

- **Node Details:**  
  - **Google Analytics**  
    - *Type:* Google Analytics node  
    - *Role:* Query GA4 API for page view metrics  
    - *Configuration:*  
      - Limit: 30 entries  
      - Date range: Last 30 days  
      - Metric: screenPageViews  
      - Dimension: pagePath  
      - Property ID: 367609797 (NodusLabs Support - GA4)  
    - *Expressions:* None  
    - *Input:* Trigger from form submission  
    - *Output:* Data passed to Code node  
    - *Credentials:* OAuth2 Google Analytics account linked  
    - *Version:* 2  
    - *Edge Cases:* Authentication errors, API limits, no data returned for property.

#### 2.3 URL Augmentation

- **Overview:**  
  Prepares full URLs for each page by prefixing the extracted page path with the website domain.

- **Nodes Involved:**  
  - Code

- **Node Details:**  
  - **Code**  
    - *Type:* JavaScript code node  
    - *Role:* Concatenate base URL with pagePath from GA data  
    - *Configuration:*  
      - For each input item, adds field `fullUrl = "https://support.noduslabs.com" + pagePath`  
    - *Expressions:* JavaScript loop over all input items  
    - *Input:* Google Analytics data  
    - *Output:* Items enriched with fullUrl field to Loop Over Items  
    - *Version:* 2  
    - *Edge Cases:* Missing pagePath field, malformed URLs.

#### 2.4 Batch Processing

- **Overview:**  
  Processes each URL individually in batches to manage API calls and rate limits.

- **Nodes Involved:**  
  - Loop Over Items

- **Node Details:**  
  - **Loop Over Items**  
    - *Type:* SplitInBatches  
    - *Role:* Iterate over each item sequentially or in small batches without reset  
    - *Configuration:* Reset disabled to maintain batch continuity  
    - *Input:* Items with fullUrl field from Code node  
    - *Output:* For each batch, sends to Firecrawl and InfraNodus Graph Summary nodes  
    - *Version:* 3  
    - *Edge Cases:* Large data volume leading to long execution times, batch state loss on failure.

#### 2.5 Content Extraction via Firecrawl

- **Overview:**  
  Scrapes the textual content from each page URL using the Firecrawl API.

- **Nodes Involved:**  
  - URL to Markdown with Firecrawl

- **Node Details:**  
  - **URL to Markdown with Firecrawl**  
    - *Type:* HTTP Request  
    - *Role:* POST request to Firecrawl API to scrape page content  
    - *Configuration:*  
      - URL: `https://api.firecrawl.dev/v1/scrape`  
      - Method: POST  
      - Body param: url = current item's fullUrl  
      - Authentication: Bearer token (Firecrawl API key)  
    - *Expressions:* Uses `={{ $json.fullUrl }}` for dynamic URL insertion  
    - *Input:* Each URL from Loop Over Items  
    - *Output:* JSON containing scraped markdown text to InfraNodus Save to Graph  
    - *Version:* 4.2  
    - *Edge Cases:* API key invalid, HTTP errors, rate limits, empty scrape results.

#### 2.6 Data Aggregation in InfraNodus

- **Overview:**  
  Sends the scraped textual data to InfraNodus to create or update a knowledge graph representing the topics of the pages.

- **Nodes Involved:**  
  - InfraNodus Save to Graph

- **Node Details:**  
  - **InfraNodus Save to Graph**  
    - *Type:* HTTP Request  
    - *Role:* POST content to InfraNodus API for graph storage  
    - *Configuration:*  
      - URL: `https://infranodus.com/api/v1/graphAndStatements?doNotSave=false&includeGraph=false&includeGraphSummary=true`  
      - Method: POST  
      - Body parameters:  
        - name: "top_support_pages" (graph name)  
        - text: scraped markdown from Firecrawl (`={{ $json.data.markdown }}`)  
        - categories: derived from sliced pagePath of current batch item  
        - contextSettings: JSON string to ignore square brackets processing  
      - Authentication: Bearer token (InfraNodus API key)  
    - *Expressions:* Uses dynamic markdown content and pagePath slicing  
    - *Input:* Firecrawl scraped markdown with page metadata  
    - *Output:* Feeds back into Loop Over Items for next iteration  
    - *Version:* 4.2  
    - *Edge Cases:* API key issues, malformed body, network errors.

#### 2.7 Graph Analysis & Summary

- **Overview:**  
  After processing all pages, requests InfraNodus to analyze the knowledge graph and generate a summary of main topics and clusters.

- **Nodes Involved:**  
  - InfraNodus GraphRAG Summary

- **Node Details:**  
  - **InfraNodus GraphRAG Summary**  
    - *Type:* HTTP Request  
    - *Role:* POST request to InfraNodus API to get graph advice and summary  
    - *Configuration:*  
      - URL: `https://infranodus.com/api/v1/graphAndAdvice?doNotSave=true&includeGraph=false&includeGraphSummary=true`  
      - Method: POST  
      - Body parameters:  
        - name: "top_support_pages"  
        - requestMode: "summary"  
        - aiTopics: true (enable AI topic extraction)  
      - Authentication: Bearer token (InfraNodus API key)  
    - *Input:* Output from Loop Over Items (triggered in parallel with Firecrawl scrape)  
    - *Output:* JSON with AI advice and graph summary to Form node  
    - *Version:* 4.2  
    - *Edge Cases:* API errors, empty graph, unauthorized access.

#### 2.8 Result Presentation

- **Overview:**  
  Presents the final summarized analysis to the user who triggered the workflow, formatted in HTML for clarity.

- **Nodes Involved:**  
  - Form

- **Node Details:**  
  - **Form**  
    - *Type:* Form node (completion response)  
    - *Role:* Return analyzed summary and main topics as a response to the triggering form submission  
    - *Configuration:*  
      - Respond with text (HTML)  
      - Response text uses template expressions to display:  
        - AI advice text from InfraNodus (`{{ $json.aiAdvice[0].text }}`)  
        - Graph summary (`{{ $json.graphSummary }}`)  
    - *Input:* InfraNodus GraphRAG Summary node output  
    - *Output:* Response back to user  
    - *Version:* 1  
    - *Edge Cases:* Missing data in response, rendering errors.

---

### 3. Summary Table

| Node Name                  | Node Type           | Functional Role                               | Input Node(s)             | Output Node(s)                 | Sticky Note                                                                                     |
|----------------------------|---------------------|-----------------------------------------------|---------------------------|-------------------------------|------------------------------------------------------------------------------------------------|
| On form submission         | Form Trigger        | Starts the workflow on user form submission   | (External)                | Google Analytics               | ## 1. Trigger the workflow                                                                    |
| Google Analytics           | Google Analytics    | Fetches top pages from GA4 property            | On form submission        | Code                          | ## 2. Get top pages from your Google Analytics account<br>🚨 Specify and connect your GA account here |
| Code                      | Code                | Adds full URL prefix to page paths             | Google Analytics          | Loop Over Items                | ## 3. Fix analytics links<br>🚨 Add the website name as a prefix to extracted links              |
| Loop Over Items            | SplitInBatches      | Iterates over each URL item                     | Code                      | URL to Markdown with Firecrawl, InfraNodus GraphRAG Summary | ## 4. Loop through each URL page                                                              |
| URL to Markdown with Firecrawl | HTTP Request       | Scrapes page content via Firecrawl API         | Loop Over Items           | InfraNodus Save to Graph       | ## 5. Scrape and extract text from each URL<br>🚨 Add your Firecrawl API key here               |
| InfraNodus Save to Graph   | HTTP Request       | Sends scraped content to InfraNodus graph      | URL to Markdown with Firecrawl | Loop Over Items            | ## 6. Save Text to InfraNodus Knowledge Graph<br>🚨 Add your InfraNodus key and specify graph  |
| InfraNodus GraphRAG Summary | HTTP Request       | Gets graph summary and main topics             | Loop Over Items           | Form                          | ## 7. Get the main topics from the graph<br>🚨 Add your InfraNodus key and specify same graph name |
| Form                      | Form                | Displays final summarized analysis              | InfraNodus GraphRAG Summary | (External response)           | ## 8. Display the final result<br>Optionally send to Slack or email or link to content creation workflows |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node**  
   - Type: Form Trigger  
   - Name: "On form submission"  
   - Configure webhook with unique ID or leave for automatic generation  
   - Set Form Title: "Launch Analysis"  
   - Set Description: "This workflow will analyze top visited pages in a Google Analytics property you select and reveal the main topics inside."  

2. **Add Google Analytics Node**  
   - Type: Google Analytics  
   - Name: "Google Analytics"  
   - Set property ID to your GA4 property (example: 367609797)  
   - Metrics: screenPageViews  
   - Dimensions: pagePath  
   - Limit: 30  
   - Date Range: Last 30 Days  
   - Connect credentials with OAuth2 Google Analytics account  
   - Connect the On form submission node output to this node's input  

3. **Add Code Node to Build Full URLs**  
   - Type: Code (JavaScript)  
   - Name: "Code"  
   - Set code to loop over all items and add `fullUrl` field by prefixing pagePath with website domain, e.g.:  
     ```javascript
     for (const item of $input.all()) {
       item.json.fullUrl = "https://support.noduslabs.com" + item.json.pagePath;
     }
     return $input.all();
     ```  
   - Connect Google Analytics output to Code node input  

4. **Add SplitInBatches Node**  
   - Type: SplitInBatches  
   - Name: "Loop Over Items"  
   - Disable "Reset" option to maintain batch state  
   - Connect Code node output into this node input  

5. **Add HTTP Request Node for Firecrawl API**  
   - Type: HTTP Request  
   - Name: "URL to Markdown with Firecrawl"  
   - Method: POST  
   - URL: `https://api.firecrawl.dev/v1/scrape`  
   - Authentication: Generic HTTP Bearer Token (use your Firecrawl API key)  
   - Body Parameters: JSON with parameter `url` set dynamically to `={{ $json.fullUrl }}`  
   - Connect "Loop Over Items" output to this node's input  

6. **Add HTTP Request Node to Save to InfraNodus Graph**  
   - Type: HTTP Request  
   - Name: "InfraNodus Save to Graph"  
   - Method: POST  
   - URL: `https://infranodus.com/api/v1/graphAndStatements?doNotSave=false&includeGraph=false&includeGraphSummary=true`  
   - Authentication: Generic HTTP Bearer Token (InfraNodus API key)  
   - Body Parameters:  
     - name: "top_support_pages"  
     - text: `={{ $json.data.markdown }}` (scraped text from Firecrawl)  
     - categories: `=[filename: {{ $('Loop Over Items').item.json.pagePath.slice(0,16) }}]`  
     - contextSettings: `={"squareBracketsProcessing":"IGNORE_BRACKETS"}` (as JSON string)  
   - Connect "URL to Markdown with Firecrawl" output to this node's input  

7. **Connect "InfraNodus Save to Graph" output back to "Loop Over Items" input**  
   - To continue batch processing for all URLs  

8. **Add HTTP Request Node for InfraNodus Graph Summary**  
   - Type: HTTP Request  
   - Name: "InfraNodus GraphRAG Summary"  
   - Method: POST  
   - URL: `https://infranodus.com/api/v1/graphAndAdvice?doNotSave=true&includeGraph=false&includeGraphSummary=true`  
   - Authentication: Generic HTTP Bearer Token (same InfraNodus API key)  
   - Body Parameters:  
     - name: "top_support_pages"  
     - requestMode: "summary"  
     - aiTopics: true  
   - Connect a separate output of "Loop Over Items" node to this node (runs in parallel with Firecrawl scrape)  

9. **Add Form Node to Present Results**  
   - Type: Form  
   - Name: "Form"  
   - Operation: completion  
   - Respond With: showText  
   - Response Text (HTML):  
     ```html
     <br>
     <h1>Top Content Summary</h1>
     <h3>{{ $json.aiAdvice[0].text }}</h3>
     <br>
     <h1>Main Topics</h1>
     <h3>{{ $json.graphSummary }}</h3>
     ```  
   - Connect output of "InfraNodus GraphRAG Summary" to this node  

10. **Credentials Setup**  
    - Set up Google Analytics OAuth2 credentials with access to chosen GA property  
    - Add Firecrawl API Bearer token credentials for scraping  
    - Add InfraNodus API Bearer token credentials for graph operations  

11. **Final Connections and Testing**  
    - Verify all node connections correspond as described  
    - Test workflow by submitting the form to trigger the entire process  
    - Monitor for errors such as API authentication failures or data missing  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                  | Context or Link                                                                                       |
|-----------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| This workflow helps identify main topics your customers care about and reveals content gaps for new creation opportunities.                   | Core purpose of the workflow                                                                         |
| InfraNodus is a tool for knowledge graph generation and analysis that supports content strategy via network visualization and AI insights.    | https://infranodus.com                                                                               |
| Firecrawl is an API service for scraping web page content and converting it to markdown or structured text.                                   | https://firecrawl.dev                                                                                |
| Google Analytics 4 is used to extract top page visit data, requiring OAuth2 credentials with appropriate permissions.                        | https://analytics.google.com                                                                         |
| The workflow supports exporting insights to Slack/email or integrating with content creation workflows (optional extension).                 | Mentioned in final sticky note; requires additional nodes for integration                             |
| Sticky notes within the workflow provide stepwise explanations and highlight where API keys or credentials must be entered and configured.    | Visible in n8n editor for user guidance                                                              |

---

**Disclaimer:** The provided text is extracted exclusively from an automated n8n workflow. All processing complies with content policies, contains no illegal or protected elements, and only handles legal and public data.