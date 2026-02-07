Automated Academic Paper Monitoring with PDF Vector, GPT-3.5, & Slack Alerts

https://n8nworkflows.xyz/workflows/automated-academic-paper-monitoring-with-pdf-vector--gpt-3-5----slack-alerts-7358


# Automated Academic Paper Monitoring with PDF Vector, GPT-3.5, & Slack Alerts

### 1. Workflow Overview

This workflow automates the monitoring of newly published academic papers in specified research areas, including Machine Learning, Neural Networks, and Computer Vision. It runs once daily at 9 AM, searches recent papers from multiple academic data providers, filters for recency, generates concise summaries using GPT-3.5, formats the results into a digest, and delivers notifications via Slack and email.

The workflow is logically divided into these functional blocks:

- **1.1 Scheduled Trigger & Parameter Setup:** Initiates the workflow daily and sets search parameters including keywords and time window.  
- **1.2 Query Splitting & Paper Search:** Splits the search query string into individual topics and searches academic databases via PDF Vector node.  
- **1.3 Filter Recent Papers:** Filters out papers older than the configured number of days (default 1 day).  
- **1.4 Summarization:** Uses OpenAI GPT-3.5 to generate concise 2-3 sentence summaries focusing on key contributions of each paper.  
- **1.5 Digest Formatting:** Aggregates and formats paper data grouped by query for notification.  
- **1.6 Notification Delivery:** Sends the formatted digest via Slack and email to designated recipients.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Parameter Setup

- **Overview:** This block triggers the workflow daily at 9 AM and sets the initial search parameters such as the time window (daysBack) and the comma-separated search queries.

- **Nodes Involved:**  
  - Bot Configuration (Sticky Note)  
  - Daily Schedule (Schedule Trigger)  
  - Set Search Parameters (Set)

- **Node Details:**

  - **Bot Configuration**  
    - Type: Sticky Note  
    - Role: Provides metadata and context about the bot including monitored topics and runtime schedule.  
    - Configuration: Static markdown content summarizing topics and schedule.  
    - Input/Output: None (informational).  
    - Edge Cases: None.

  - **Daily Schedule**  
    - Type: Schedule Trigger  
    - Role: Triggers workflow execution every 24 hours at 9:00 AM local time.  
    - Configuration: Interval set to 24 hours, trigger at 9 AM.  
    - Input: None (trigger).  
    - Output: Initiates downstream nodes.  
    - Edge Cases: Timezone differences could affect trigger time if n8n instance timezone not configured correctly.

  - **Set Search Parameters**  
    - Type: Set  
    - Role: Defines key parameters for the paper search: "daysBack" (number of days to look back) and "searchQueries" (comma-separated topics).  
    - Configuration:  
      - daysBack = 1 (int)  
      - searchQueries = "machine learning,neural networks,computer vision,deep learning"  
    - Input: Trigger from schedule.  
    - Output: JSON with parameters passed downstream.  
    - Edge Cases: Malformed or empty searchQueries string could affect later splitting.

#### 2.2 Query Splitting & Paper Search

- **Overview:** Splits the combined search query string into individual topics, then performs a search on multiple academic providers for recent papers related to each query.

- **Nodes Involved:**  
  - Split Queries (Code)  
  - PDF Vector - Search New Papers (PDF Vector)

- **Node Details:**

  - **Split Queries**  
    - Type: Code  
    - Role: Parses the comma-separated searchQueries string into an array of individual query objects for parallel processing.  
    - Configuration: JavaScript code splits the string, trims whitespace, and returns an array of objects each with a single "query" string property.  
    - Input: JSON with "searchQueries" string from prior node.  
    - Output: Array of items, each containing `{ query: "topic" }`.  
    - Edge Cases: Empty or whitespace-only queries could produce empty items; no explicit filtering for empty strings.  
    - Expressions used: `$json.searchQueries.split(',').map(q => q.trim())`

  - **PDF Vector - Search New Papers**  
    - Type: PDF Vector  
    - Role: Queries external academic databases for papers matching each individual query.  
    - Configuration:  
      - Operation: search  
      - Resource: academic  
      - Providers: arxiv, pubmed, semantic_scholar  
      - Limit: 10 results per query  
      - Fields requested: title, authors, abstract, date, doi, pdfUrl, totalCitations  
      - Year from: current year (dynamic)  
      - Query: expression `={{ $json.query }}`  
    - Input: Individual query objects from Split Queries node.  
    - Output: Array of paper objects per query.  
    - Edge Cases:  
      - API rate limits or downtime of providers.  
      - Empty results if no papers found.  
      - Date field missing or malformed could affect filtering later.  
    - Version-specific: Requires PDF Vector node version supporting academic resource and multiple providers.

#### 2.3 Filter Recent Papers

- **Overview:** Filters the returned papers to retain only those published within the last N days (default 1 day).

- **Nodes Involved:**  
  - Filter Recent Papers (Code)

- **Node Details:**

  - **Filter Recent Papers**  
    - Type: Code  
    - Role: Compares each paper's publication date to a cutoff date (today minus daysBack) and filters accordingly.  
    - Configuration: JavaScript code reads daysBack parameter, calculates cutoff date, filters paper array.  
    - Input: Array of paper objects from PDF Vector node, plus daysBack from Set Search Parameters via expression.  
    - Output: Filtered array of recent papers; returns empty array if none match.  
    - Edge Cases:  
      - Papers without a valid date are excluded (implicitly).  
      - Timezone differences in paper dates might affect filtering accuracy.  
      - If no papers pass filter, downstream nodes receive empty input which may cause no notifications.  
    - Expressions:  
      - Access daysBack with `$node['Set Search Parameters'].json.daysBack`

#### 2.4 Summarization

- **Overview:** Generates a concise summary for each filtered paper using OpenAI GPT-3.5, focusing on main contributions and findings.

- **Nodes Involved:**  
  - Generate Summary (OpenAI)

- **Node Details:**

  - **Generate Summary**  
    - Type: OpenAI  
    - Role: Uses GPT-3.5 Turbo chat completion to summarize paper metadata (title, authors, abstract).  
    - Configuration:  
      - Model: gpt-3.5-turbo  
      - Messages: System prompt instructs to summarize paper in 2-3 sentences focusing on main contribution.  
      - Dynamic content: Inserts title, authors (joined), abstract into prompt.  
    - Input: Single paper JSON from Filter Recent Papers.  
    - Output: JSON with summary text added.  
    - Edge Cases:  
      - API rate limits or auth errors.  
      - If paper fields are missing, prompt might be incomplete.  
      - Summarization may occasionally produce inaccurate or repetitive summaries.  
    - Version-specific: Requires OpenAI node with API key credential configured.

#### 2.5 Digest Formatting

- **Overview:** Aggregates summarized papers into a structured digest grouped by query, formats authorship and link fields for notification.

- **Nodes Involved:**  
  - Format Digest (Code)

- **Node Details:**

  - **Format Digest**  
    - Type: Code  
    - Role:  
      - Maps over all summarized papers, formats author lists (first 3 authors + "et al." if more), constructs clickable links (DOI or fallback URL), includes citation counts, and retains original query.  
      - Groups papers by their original search query for organized digest.  
      - Returns an object containing grouped papers, total count, and current ISO date.  
    - Input: Array of summarized paper objects from Generate Summary.  
    - Output: Single JSON object with structured digest.  
    - Edge Cases:  
      - Papers missing DOI or URL handled with fallback.  
      - Citation count missing defaults to 0.  
      - Empty input results in empty groupings and zero count.  
    - Expressions: Uses `$items()` to gather all input items.

#### 2.6 Notification Delivery

- **Overview:** Sends the digest as formatted messages to both Slack channel and email recipients.

- **Nodes Involved:**  
  - Send Slack Alert (Slack)  
  - Email Digest (Email Send)

- **Node Details:**

  - **Send Slack Alert**  
    - Type: Slack  
    - Role: Posts a daily research summary message to a Slack channel.  
    - Configuration:  
      - Channel: #research-alerts  
      - Message: Uses template with date, total paper count, grouped paper lists with titles, authors, summaries, and links.  
      - Attachments: None  
    - Input: Digest object from Format Digest.  
    - Output: Slack confirmation response.  
    - Edge Cases:  
      - Slack API auth failures or network issues.  
      - Formatting errors if digest structure is invalid.  
    - Credential: Requires Slack OAuth2 credential with appropriate channel posting permissions.

  - **Email Digest**  
    - Type: Email Send  
    - Role: Sends a formatted HTML email with the daily research digest to a specified email address.  
    - Configuration:  
      - To: research-team@company.com  
      - Subject: Includes current date dynamically.  
      - HTML Body: Template iterates grouped papers, showing title, authors, summary, link, and citations with basic styling.  
    - Input: Digest object from Format Digest.  
    - Output: Email sent confirmation.  
    - Edge Cases:  
      - SMTP server/authentication failures.  
      - Email formatting issues if data incomplete.  
    - Credential: Requires configured SMTP or email sending credentials.

---

### 3. Summary Table

| Node Name                  | Node Type            | Functional Role                            | Input Node(s)             | Output Node(s)                    | Sticky Note                                                                                 |
|----------------------------|----------------------|-------------------------------------------|---------------------------|----------------------------------|---------------------------------------------------------------------------------------------|
| Bot Configuration          | Sticky Note          | Provides overview and config info          | None                      | None                             | ## Paper Monitoring Bot\n\nMonitors these topics:\n- Machine Learning\n- Neural Networks\n- Computer Vision\n\nRuns: Daily at 9 AM |
| Daily Schedule             | Schedule Trigger     | Triggers daily execution at 9 AM           | None                      | Set Search Parameters            |                                                                                             |
| Set Search Parameters      | Set                  | Sets search keywords and lookback days     | Daily Schedule            | Split Queries                   |                                                                                             |
| Split Queries             | Code                 | Splits search string into individual queries | Set Search Parameters     | PDF Vector - Search New Papers   |                                                                                             |
| PDF Vector - Search New Papers | PDF Vector           | Searches academic databases for papers     | Split Queries             | Filter Recent Papers             |                                                                                             |
| Filter Recent Papers       | Code                 | Filters papers published within daysBack   | PDF Vector - Search New Papers | Generate Summary               |                                                                                             |
| Generate Summary           | OpenAI               | Generates concise paper summaries           | Filter Recent Papers       | Format Digest                   |                                                                                             |
| Format Digest              | Code                 | Formats and groups paper data for digest   | Generate Summary          | Send Slack Alert, Email Digest  |                                                                                             |
| Send Slack Alert           | Slack                | Posts digest message to Slack channel       | Format Digest             | None                           |                                                                                             |
| Email Digest              | Email Send           | Sends digest email to team                   | Format Digest             | None                           |                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Sticky Note node:**  
   - Name: "Bot Configuration"  
   - Content: Markdown describing monitoring topics and schedule:  
     ```
     ## Paper Monitoring Bot

     Monitors these topics:
     - Machine Learning
     - Neural Networks
     - Computer Vision

     Runs: Daily at 9 AM
     ```  
   - Position for clarity (e.g., X=250, Y=150).

2. **Create a Schedule Trigger node:**  
   - Name: "Daily Schedule"  
   - Set trigger rule to run every 24 hours at 9:00 AM local time.  
   - Position: X=450, Y=300.

3. **Create a Set node:**  
   - Name: "Set Search Parameters"  
   - Add two parameters:  
     - `daysBack` (Number): 1  
     - `searchQueries` (String): "machine learning,neural networks,computer vision,deep learning"  
   - Position: X=650, Y=300.  
   - Connect "Daily Schedule" main output to this node.

4. **Create a Code node:**  
   - Name: "Split Queries"  
   - JavaScript code:  
     ```javascript
     const queries = $json.searchQueries.split(',').map(q => q.trim());
     return queries.map(query => ({ query }));
     ```  
   - Position: X=850, Y=300.  
   - Connect "Set Search Parameters" main output to this node.

5. **Create a PDF Vector node:**  
   - Name: "PDF Vector - Search New Papers"  
   - Credentials: Configure PDF Vector with valid API key.  
   - Parameters:  
     - Operation: search  
     - Resource: academic  
     - Providers: arxiv, pubmed, semantic_scholar  
     - Limit: 10  
     - Fields: title, authors, abstract, date, doi, pdfUrl, totalCitations  
     - Year From: Expression `={{ new Date().getFullYear() }}`  
     - Query: Expression `={{ $json.query }}`  
   - Position: X=1050, Y=300.  
   - Connect "Split Queries" main output to this node.

6. **Create a Code node:**  
   - Name: "Filter Recent Papers"  
   - JavaScript code:  
     ```javascript
     const daysBack = $node['Set Search Parameters'].json.daysBack;
     const cutoffDate = new Date();
     cutoffDate.setDate(cutoffDate.getDate() - daysBack);

     const recentPapers = $json.filter(paper => {
       const paperDate = new Date(paper.date);
       return paperDate >= cutoffDate;
     });

     return recentPapers.length > 0 ? recentPapers : [];
     ```  
   - Position: X=1250, Y=300.  
   - Connect "PDF Vector - Search New Papers" main output to this node.

7. **Create an OpenAI node:**  
   - Name: "Generate Summary"  
   - Credentials: Configure OpenAI with API key.  
   - Parameters:  
     - Model: gpt-3.5-turbo  
     - Messages:  
       - Role: User  
       - Content (expression):  
         ```
         Summarize this research paper in 2-3 sentences:

         Title: {{ $json.title }}
         Authors: {{ $json.authors.join(', ') }}
         Abstract: {{ $json.abstract }}

         Focus on the main contribution and findings.
         ```  
   - Position: X=1450, Y=300.  
   - Connect "Filter Recent Papers" main output to this node.

8. **Create a Code node:**  
   - Name: "Format Digest"  
   - JavaScript code:  
     ```javascript
     const papers = $items().map(item => {
       const paper = item.json;
       return {
         title: paper.title,
         authors: paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ' et al.' : ''),
         summary: paper.summary,
         link: paper.doi ? `https://doi.org/${paper.doi}` : paper.url,
         citations: paper.totalCitations || 0,
         query: paper.originalQuery
       };
     });

     const grouped = papers.reduce((acc, paper) => {
       if (!acc[paper.query]) acc[paper.query] = [];
       acc[paper.query].push(paper);
       return acc;
     }, {});

     return { papers: grouped, totalCount: papers.length, date: new Date().toISOString() };
     ```  
   - Position: X=1650, Y=300.  
   - Connect "Generate Summary" main output to this node.

9. **Create a Slack node:**  
   - Name: "Send Slack Alert"  
   - Credentials: Configure Slack OAuth2 with permission to post to channel.  
   - Parameters:  
     - Channel: #research-alerts  
     - Message (expression):  
       ```
       📚 *Daily Research Digest* - {{ $now.format('MMM DD, YYYY') }}

       Found {{ $json.totalCount }} new papers:

       {{ Object.entries($json.papers).map(([query, papers]) => `*${query}:*\\n${papers.map(p => `• ${p.title}\\n  _${p.authors}_\\n  ${p.summary}\\n  🔗 ${p.link}`).join('\\n\\n')}`).join('\\n\\n---\\n\\n') }}
       ```  
   - Position: X=1850, Y=300.  
   - Connect "Format Digest" main output to this node.

10. **Create an Email Send node:**  
    - Name: "Email Digest"  
    - Credentials: Configure SMTP/email sending credentials.  
    - Parameters:  
      - To Email: research-team@company.com  
      - Subject (expression): `Daily Research Digest - {{ $now.format('MMM DD, YYYY') }}`  
      - HTML Body (expression):  
        ```html
        <h2>Daily Research Digest</h2>
        <p>Found {{ $json.totalCount }} new papers</p>

        {{ Object.entries($json.papers).map(([query, papers]) => 
          `<h3>${query}</h3>
          ${papers.map(p => 
            `<div style="margin-bottom: 20px;">
              <h4>${p.title}</h4>
              <p><em>${p.authors}</em></p>
              <p>${p.summary}</p>
              <p><a href="${p.link}">Read Paper</a> | Citations: ${p.citations}</p>
            </div>`
          ).join('')}`
        ).join('\n') }}
        ```  
    - Position: X=1850, Y=450.  
    - Connect "Format Digest" main output to this node (parallel to Slack node).

---

### 5. General Notes & Resources

| Note Content                                                                                                 | Context or Link                                  |
|--------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Workflow runs daily at 9 AM to monitor recent academic publications in key AI research areas.                | Bot Configuration sticky note                    |
| Uses PDF Vector integration with multiple providers: arXiv, PubMed, Semantic Scholar for comprehensive search.| PDF Vector node configuration                     |
| Summarization powered by OpenAI GPT-3.5, focusing on concise 2-3 sentence summaries emphasizing contributions.| OpenAI node configuration                         |
| Notifications delivered via Slack to #research-alerts and email to research-team@company.com.                 | Slack and Email Send nodes configuration          |
| Potential enhancements: add error handling for API failures, empty results, or rate limiting scenarios.       | General recommendation                            |
| Slack OAuth2 and Email SMTP credentials must be pre-configured with correct permissions for posting/sending. | Credential setup requirements                      |