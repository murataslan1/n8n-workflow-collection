Automate Academic Literature Reviews with GPT-4 and Multi-Database Search

https://n8nworkflows.xyz/workflows/automate-academic-literature-reviews-with-gpt-4-and-multi-database-search-8503


# Automate Academic Literature Reviews with GPT-4 and Multi-Database Search

### 1. Workflow Overview

This workflow automates academic literature reviews using GPT-4 and multi-database search capabilities. It targets researchers and systematic reviewers wishing to streamline the process of collecting, screening, analyzing, and synthesizing academic papers on a specific topic. The workflow logically divides into the following blocks:

- **1.1 Review Setup:** Defines search parameters for the literature review, such as topic and publication year range.
- **1.2 Multi-Database Search:** Searches multiple academic databases (PubMed, Semantic Scholar, arXiv) for relevant papers based on the defined parameters and retrieves metadata including PDFs when available.
- **1.3 Paper Ranking & Selection:** Ranks retrieved papers by relevance and citation metrics, selecting the top N papers for further processing.
- **1.4 Paper Processing Loop:** Processes each selected paper individually, checking for PDFs, parsing content if available, or falling back to abstracts.
- **1.5 AI Analysis:** Uses GPT-4 to generate detailed review entries for each paper including summaries, methodologies, findings, and citations.
- **1.6 Review Compilation:** Aggregates all review entries, categorizes them into thematic groups, and compiles a final literature review document with summaries and a bibliography.

Sticky notes provide contextual guidance and explain key parts of the workflow: overview, search strategy, quality assessment criteria, and final outputs.

---

### 2. Block-by-Block Analysis

#### 2.1 Review Setup

- **Overview:** Defines the literature review’s scope by setting parameters like topic keywords, year range, and maximum number of papers to process.
- **Nodes Involved:**  
  - Set Search Parameters
  - Review Overview (Sticky Note)

- **Node Details:**

  - **Set Search Parameters**  
    - Type: Set Node  
    - Role: Configures input variables for the workflow: topic ("machine learning in healthcare"), year range (2020–2024), and max papers (20).  
    - Expressions: Directly sets static values, no dynamic expressions.  
    - Inputs: None (start node)  
    - Outputs: Connects to PDF Vector - Search Papers  
    - Edge Cases: Incorrect parameter values may limit or skew search results; no validation logic included.  
    - Notes: Sticky note “Review Overview” contextualizes this block’s role.

  - **Review Overview (Sticky Note)**  
    - Type: Sticky Note  
    - Provides high-level description of the review automation goals: search, screen, quality assess, synthesize, generate.

#### 2.2 Multi-Database Search

- **Overview:** Executes a multi-provider search on academic databases using the query parameters; retrieves paper metadata including abstracts and PDFs.
- **Nodes Involved:**  
  - PDF Vector - Search Papers  
  - Database Search (Sticky Note)

- **Node Details:**

  - **PDF Vector - Search Papers**  
    - Type: PDF Vector Node (custom academic search node)  
    - Role: Queries PubMed, Semantic Scholar, and arXiv with the topic and year filter; retrieves up to 50 papers with fields like title, abstract, authors, year, DOI, PDF URL, citations.  
    - Expressions: Parameters dynamically use values from ‘Set Search Parameters’ node for topic, yearFrom, yearTo.  
    - Inputs: From Set Search Parameters  
    - Outputs: To Rank & Select Papers  
    - Edge Cases: API limits, missing metadata, or empty results; failure to retrieve PDFs could limit later steps.  
    - Notes: Sticky note “Database Search” highlights covered databases and de-duplication.

#### 2.3 Paper Ranking & Selection

- **Overview:** Scores and ranks retrieved papers by combining citation counts, recency, and text relevance to the topic; limits to a maximum number.
- **Nodes Involved:**  
  - Rank & Select Papers  
  - Process One by One (split batch)

- **Node Details:**

  - **Rank & Select Papers**  
    - Type: Code Node (JavaScript)  
    - Role: Implements custom logic to compute relevance scores: citation score (40%), recency score (up to 20 points), title and abstract keyword matches (30 points total). Sorts papers by score and selects top N (maxPapers).  
    - Expressions: Reads parameters from ‘Set Search Parameters’ and paper metadata from input.  
    - Inputs: From PDF Vector - Search Papers  
    - Outputs: To Process One by One  
    - Edge Cases: Zero citations handling, incomplete metadata, or no keyword matches could affect ranking fairness. Code assumes numeric year parsing.  
    - Notes: Processes all retrieved papers collectively before batching.

  - **Process One by One**  
    - Type: SplitInBatches Node  
    - Role: Converts the ranked list into individual paper items for sequential processing downstream.  
    - Inputs: From Rank & Select Papers  
    - Outputs: To Has PDF?  
    - Edge Cases: Batch size fixed to 1; large lists could slow workflow.

#### 2.4 Paper Processing Loop

- **Overview:** For each paper, checks availability of PDF; if available, parses it to extract content; otherwise, proceeds with abstract.
- **Nodes Involved:**  
  - Has PDF?  
  - PDF Vector - Parse Paper  
  - Analyze Paper Content  
  - Store Review Entry

- **Node Details:**

  - **Has PDF?**  
    - Type: If Node  
    - Role: Conditional branch based on whether paper metadata contains a non-empty PDF URL.  
    - Expressions: Checks if `pdfURL` field is not empty.  
    - Inputs: From Process One by One  
    - Outputs:  
      - True: PDF Vector - Parse Paper  
      - False: Analyze Paper Content (directly uses abstract content)  
    - Edge Cases: Missing or broken URLs may cause false negatives; no fallback for inaccessible PDFs.

  - **PDF Vector - Parse Paper**  
    - Type: PDF Vector Node  
    - Role: Parses PDF content from URL; supports auto LLM usage for content extraction.  
    - Inputs: From Has PDF? (true branch)  
    - Outputs: To Analyze Paper Content  
    - Edge Cases: PDF parsing failures, timeouts, or unreadable PDFs may cause errors or incomplete content.

  - **Analyze Paper Content**  
    - Type: OpenAI Node (GPT-4)  
    - Role: Sends paper metadata and content (PDF-extracted or abstract) to GPT-4 to generate a structured literature review entry with summary, methodology, findings, topic relevance, limitations, and APA citation.  
    - Configuration: Uses a detailed prompt template referencing ‘Set Search Parameters.topic’ and paper fields.  
    - Inputs: From PDF Vector - Parse Paper or Has PDF? (false branch)  
    - Outputs: To Store Review Entry  
    - Edge Cases: API quota limits, rate limiting, or prompt errors may cause failures or incomplete responses.

  - **Store Review Entry**  
    - Type: Set Node  
    - Role: Extracts AI-generated review text and stores it along with paper title and DOI in variables for later compilation.  
    - Expressions: Reads GPT-4 output JSON to extract review content and paper metadata from condition node.  
    - Inputs: From Analyze Paper Content  
    - Outputs: To Process One by One (to continue batch processing)  
    - Edge Cases: Missing fields in GPT response could lead to empty entries.

#### 2.5 Review Compilation

- **Overview:** After processing all papers, aggregates and categorizes review entries into thematic groups; generates a comprehensive literature review document with summaries and bibliographic references.
- **Nodes Involved:**  
  - Compile Literature Review  
  - Final Review (Sticky Note)

- **Node Details:**

  - **Compile Literature Review**  
    - Type: Code Node (JavaScript)  
    - Role: Collects all stored review entries, groups them into predefined themes (e.g., Machine Learning Models, Clinical Applications) based on keyword matching in review text, and constructs a Markdown-formatted literature review document. Also compiles a bibliography from suggested citations.  
    - Inputs: Aggregates all stored review entries after batch completion.  
    - Outputs: Final literature review document with metadata (total papers, theme counts, generation timestamp).  
    - Edge Cases: Thematic grouping is heuristic and simplistic; complex NLP categorization is recommended for production. Missing citations handled gracefully with placeholder text.  
    - Notes: Sticky note “Final Review” describes output contents and formatting.

---

### 3. Summary Table

| Node Name               | Node Type                | Functional Role                   | Input Node(s)           | Output Node(s)            | Sticky Note                                                                                                  |
|-------------------------|--------------------------|---------------------------------|------------------------|---------------------------|--------------------------------------------------------------------------------------------------------------|
| Review Overview         | Sticky Note              | Workflow purpose and scope      | —                      | —                         | ## 📖 Literature Review Generator Systematic review automation: searches, screens, assesses, synthesizes, generates PRISMA-compliant review |
| Set Search Parameters   | Set                      | Define review search parameters | —                      | PDF Vector - Search Papers | Configure literature review parameters                                                                       |
| PDF Vector - Search Papers | PDF Vector Node          | Search academic databases       | Set Search Parameters   | Rank & Select Papers       | ## 🔍 Search Strategy Databases searched: PubMed/MEDLINE, Web of Science, Cochrane Library, Google Scholar De-duplicates results |
| Rank & Select Papers    | Code                     | Rank papers by relevance        | PDF Vector - Search Papers | Process One by One         | Rank papers by relevance                                                                                      |
| Process One by One      | SplitInBatches           | Batch processing of papers      | Rank & Select Papers    | Has PDF?                  | Process papers individually                                                                                   |
| Has PDF?                | If                       | Check for PDF availability      | Process One by One      | PDF Vector - Parse Paper (true), Analyze Paper Content (false) |                                                                                                              |
| PDF Vector - Parse Paper | PDF Vector Node          | Parse paper content from PDF    | Has PDF? (true)         | Analyze Paper Content      | Parse paper content from PDF or image                                                                         |
| Analyze Paper Content   | OpenAI (GPT-4)           | Generate review entry via AI    | PDF Vector - Parse Paper, Has PDF? (false) | Store Review Entry         | Generate review entry                                                                                          |
| Store Review Entry      | Set                      | Store AI-generated review entry | Analyze Paper Content   | Process One by One         | Save processed entry                                                                                           |
| Compile Literature Review | Code                     | Compile final literature review | Store Review Entry (aggregated) | —                         | Generate final document                                                                                        |
| Final Review            | Sticky Note              | Describes final review outputs  | —                      | —                         | ## 📝 Review Output Generates narrative synthesis, evidence tables, PRISMA diagram, forest plots, bibliography Publication ready! |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Sticky Notes for Context:**
   - Add a sticky note titled "Review Overview" at the start with content describing the workflow’s purpose: automated systematic review generation.
   - Add sticky notes "Database Search," "Study Quality," and "Final Review" near respective logical blocks for user guidance.

2. **Set Search Parameters Node:**
   - Add a **Set** node named "Set Search Parameters."
   - Configure variables:
     - `maxPapers` (number): 20
     - `topic` (string): "machine learning in healthcare"
     - `yearFrom` (string): "2020"
     - `yearTo` (string): "2024"
   - No inputs; connect output to next node.

3. **PDF Vector - Search Papers Node:**
   - Add **PDF Vector** node named "PDF Vector - Search Papers."
   - Configure:
     - Operation: `search`
     - Resource: `academic`
     - Query: `={{ $json.topic }}`
     - Year From: `={{ $json.yearFrom }}`
     - Year To: `={{ $json.yearTo }}`
     - Providers: select `pubmed`, `semantic-scholar`, `arxiv`
     - Limit: 50
     - Additional fields: title, abstract, authors, year, doi, pdfURL, totalCitations
   - Connect input from "Set Search Parameters."

4. **Rank & Select Papers Node:**
   - Add a **Code** node named "Rank & Select Papers."
   - Paste the JavaScript code that:
     - Collects papers from input
     - Calculates relevance scores based on citations, recency, title and abstract keyword matches
     - Sorts and selects top N (`maxPapers`) papers
   - Connect input from "PDF Vector - Search Papers."

5. **Process One by One Node:**
   - Add **SplitInBatches** node named "Process One by One."
   - Set batch size to 1.
   - Connect input from "Rank & Select Papers."

6. **Has PDF? Node:**
   - Add **If** node named "Has PDF?"
   - Condition: Check if `pdfURL` field is not empty (`isNotEmpty`).
   - Connect input from "Process One by One."
   - True output connects to "PDF Vector - Parse Paper."
   - False output connects to "Analyze Paper Content."

7. **PDF Vector - Parse Paper Node:**
   - Add **PDF Vector** node named "PDF Vector - Parse Paper."
   - Configure:
     - Operation: `parse`
     - Resource: `document`
     - Input Type: `url`
     - URL: `={{ $json.pdfURL }}`
     - Use LLM: `auto`
   - Connect input from "Has PDF?" true branch.
   - Output connects to "Analyze Paper Content."

8. **Analyze Paper Content Node:**
   - Add **OpenAI** node named "Analyze Paper Content."
   - Set model to `gpt-4`.
   - Configure prompt message to:
     ```
     Create a literature review entry for this paper in the context of '{{ $node['Set Search Parameters'].json.topic }}':

     Title: {{ $json.title }}
     Authors: {{ $json.authors }}
     Year: {{ $json.year }}
     Citations: {{ $json.totalCitations }}

     Content: {{ $json.content || $json.abstract }}

     Provide:
     1. A 3-4 sentence summary of the paper's contribution
     2. Key methodology used
     3. Main findings (2-3 bullet points)
     4. How it relates to the topic
     5. Limitations mentioned
     6. Suggested citation in APA format
     ```
   - Connect input from "PDF Vector - Parse Paper" and "Has PDF?" false branch.

9. **Store Review Entry Node:**
   - Add **Set** node named "Store Review Entry."
   - Configure to save:
     - `reviewEntry` from GPT-4 output: `={{ $json.choices[0].message.content }}`
     - `paperTitle` from condition node: `={{ $node['Has PDF?'].json.title }}`
     - `paperDoi` from condition node: `={{ $node['Has PDF?'].json.doi }}`
   - Connect input from "Analyze Paper Content."
   - Output connects back to "Process One by One" to continue batching.

10. **Compile Literature Review Node:**
    - Add **Code** node named "Compile Literature Review."
    - Paste JavaScript that:
      - Collects all review entries
      - Categorizes them into themes based on keywords in review text
      - Builds a Markdown document with sections per theme, summaries, and full bibliography
    - Connect input from "Store Review Entry" (all completed batches).

11. **Final Review Sticky Note:**
    - Add sticky note near compilation node describing final outputs: narrative synthesis, evidence tables, PRISMA diagram, forest plots, bibliography, publication-ready document.

12. **Credentials Setup:**
    - Configure OpenAI credentials with model access to GPT-4.
    - Ensure PDF Vector node credentials or API keys for academic database access are configured.
    - No explicit OAuth nodes shown; ensure access tokens or API keys are valid.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                        |
|----------------------------------------------------------------------------------------------|-------------------------------------------------------|
| Workflow automates systematic literature reviews with multi-database search and GPT-4 analysis. | Overall workflow purpose                               |
| Uses PDF Vector node for both academic search and PDF content parsing, leveraging LLM where needed. | PDF Vector node documentation: https://docs.pdfvector.com/ (hypothetical) |
| Ranking algorithm balances citations, recency, and keyword relevance for paper selection.    | Custom ranking logic embedded in code node            |
| Thematic grouping in final compilation is heuristic; consider integrating advanced NLP for production. | Potential enhancement area                              |
| Final output includes PRISMA-compliant elements, evidence tables, and bibliographic formatting. | Supports publication-ready systematic reviews         |

---

This documentation fully describes the workflow's architecture, node configurations, data flows, and logic, enabling accurate reproduction or modification by users or AI agents.