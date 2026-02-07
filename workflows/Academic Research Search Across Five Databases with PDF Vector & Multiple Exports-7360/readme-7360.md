Academic Research Search Across Five Databases with PDF Vector & Multiple Exports

https://n8nworkflows.xyz/workflows/academic-research-search-across-five-databases-with-pdf-vector---multiple-exports-7360


# Academic Research Search Across Five Databases with PDF Vector & Multiple Exports

### 1. Workflow Overview

This workflow automates an academic research search process across five major databases: PubMed, ArXiv, Google Scholar, Semantic Scholar, and ERIC. It performs a unified search query, retrieves results, deduplicates entries by DOI and title similarity, ranks them by relevance using a custom scoring algorithm, and exports the curated search results in multiple formats (BibTeX, JSON, CSV).

Logical blocks:

- **1.1 Search Configuration & Parameter Setup**: Defines search parameters including query, year range, and results per source.
- **1.2 Multi-Database Query Execution**: Executes the search across the five academic databases via the PDF Vector node.
- **1.3 Deduplication**: Removes duplicate papers based on DOI and title similarity.
- **1.4 Relevance Ranking**: Scores and sorts papers by relevance using title match, citation count, recency, and PDF availability.
- **1.5 Exporting Results**: Generates BibTeX entries and exports the results as BibTeX, JSON, and CSV files.

---

### 2. Block-by-Block Analysis

#### 2.1 Search Configuration & Parameter Setup

**Overview:**  
This initial block sets up search parameters and provides a sticky note overview of the workflow’s scope and targeted databases.

**Nodes Involved:**  
- Search Configuration (Sticky Note)  
- Set Search Parameters (Set Node)

**Node Details:**  

- **Search Configuration**  
  - Type: Sticky Note  
  - Role: Documentation and overview of the workflow’s search scope.  
  - Configuration: Lists the five databases searched and mentions deduplication and ranking logic.  
  - Inputs: None  
  - Outputs: None  
  - Edge Cases: None  
  - Notes: Helps users understand workflow intent at a glance.

- **Set Search Parameters**  
  - Type: Set  
  - Role: Defines key parameters for the search.  
  - Configuration:  
    - `yearFrom`: 2020 (only papers from 2020 onward)  
    - `resultsPerSource`: 25 (max results per database)  
    - `searchQuery`: "machine learning healthcare applications" (search terms)  
  - Inputs: None  
  - Outputs: JSON object with these parameters for downstream nodes.  
  - Edge Cases: Parameters can be changed dynamically; invalid or empty queries may cause no results.  
  - Version Requirements: Standard n8n Set node.

#### 2.2 Multi-Database Query Execution

**Overview:**  
Performs the actual academic search via the PDF Vector node, querying all five databases simultaneously with the set parameters.

**Nodes Involved:**  
- PDF Vector - Multi-DB Search

**Node Details:**  

- **PDF Vector - Multi-DB Search**  
  - Type: PDF Vector (custom/third-party node)  
  - Role: Queries academic databases with vector-based search capabilities.  
  - Configuration:  
    - `limit`: Number of results from each source (from `$json.resultsPerSource`)  
    - `query`: Search string (from `$json.searchQuery`)  
    - `fields`: Retrieves title, authors, year, doi, abstract, total citations, pdfUrl, provider  
    - `resource`: 'academic' (search domain)  
    - `yearFrom`: Filter papers from 2020 onward  
    - `operation`: 'search'  
    - `providers`: Array specifying the five databases to search  
  - Inputs: Receives JSON parameters from "Set Search Parameters"  
  - Outputs: Array of paper objects from all providers combined  
  - Edge Cases:  
    - Network or API errors from providers  
    - Rate limiting or access restrictions  
    - Missing or incomplete metadata in results  
  - Version-Specific: Requires the PDF Vector node installed and configured with correct API credentials for each provider.

#### 2.3 Deduplication

**Overview:**  
Filters out duplicate papers by matching DOIs or normalizing and comparing titles, merging provider info for duplicates.

**Nodes Involved:**  
- Deduplicate Results (Code Node)

**Node Details:**  

- **Deduplicate Results**  
  - Type: Code  
  - Role: Removes duplicates based on DOI or title similarity  
  - Configuration:  
    - Uses JavaScript logic to:  
      - Store unique papers in a Map keyed by DOI or normalized title  
      - Merge provider lists for duplicates found by title match without DOI  
  - Inputs: Results array from PDF Vector node  
  - Outputs: Array of unique papers  
  - Edge Cases:  
    - Papers without DOI rely on title normalization which may cause false positives/negatives  
    - Titles with minor differences (punctuation, typos) may be considered unique  
  - Potential Failures: Code exceptions if paper fields missing or unexpected format.

#### 2.4 Relevance Ranking

**Overview:**  
Assigns a relevance score to each paper considering title-query match, citation count, publication recency, and PDF availability, then sorts results descending by score.

**Nodes Involved:**  
- Rank by Relevance (Code Node)

**Node Details:**  

- **Rank by Relevance**  
  - Type: Code  
  - Role: Scores and sorts papers by relevance  
  - Configuration:  
    - Title relevance: +10 points per query word found in title  
    - Citation impact: +5 * log(citations + 1)  
    - Recency: + (10 - years since publication), minimum 0  
    - PDF availability: +15 points if full text PDF URL exists  
  - Inputs: Unique papers from Deduplicate Results node  
  - Outputs: Papers decorated with `relevanceScore` property and sorted  
  - Edge Cases:  
    - Papers with zero citations get minimum citation score  
    - Papers without PDF get no full-text bonus  
    - New papers may get higher recency bonus  
    - Query terms not present in title reduce relevance  
  - Potential Failures: None significant; assumes consistent data structure.

#### 2.5 Exporting Results

**Overview:**  
Generates a BibTeX formatted string for all papers, then exports the results in three formats: BibTeX file, JSON file, and CSV file.

**Nodes Involved:**  
- Generate BibTeX (Code Node)  
- Export BibTeX File (Write Binary File)  
- Export JSON (Write Binary File)  
- Export CSV (Write Binary File)

**Node Details:**  

- **Generate BibTeX**  
  - Type: Code  
  - Role: Creates BibTeX entries for each paper  
  - Configuration:  
    - Generates citation key from DOI or fallback key  
    - Joins authors with "and" separator  
    - Includes title, authors, year, DOI, abstract  
  - Inputs: Papers ranked by relevance  
  - Outputs: Object with keys: `bibtex` (string) and `papers` (array)  
  - Edge Cases:  
    - Papers missing DOI use fallback keys, may cause key collisions  
    - Papers missing authors or abstract handled gracefully (empty fields)  
  - Potential Failures: None critical if fields missing.

- **Export BibTeX File**  
  - Type: Write Binary File  
  - Role: Saves BibTeX string to a `.bib` file named with current date  
  - Configuration:  
    - Filename template: `search_results_YYYY-MM-DD.bib`  
    - Content: BibTeX string from previous node  
  - Inputs: BibTeX string from Generate BibTeX  
  - Outputs: File output (binary)  
  - Edge Cases: File write permission issues  
  - Version Requirements: n8n file write node availability

- **Export JSON**  
  - Type: Write Binary File  
  - Role: Saves search results as formatted JSON file  
  - Configuration:  
    - Filename template: `search_results_YYYY-MM-DD.json`  
    - Content: JSON.stringify serialized `papers` array  
  - Inputs: `papers` array from Generate BibTeX node  
  - Outputs: File output (binary)  
  - Edge Cases: Large JSON size may affect performance.

- **Export CSV**  
  - Type: Write Binary File  
  - Role: Saves search results in CSV format with tab-separated columns  
  - Configuration:  
    - Filename template: `search_results_YYYY-MM-DD.csv`  
    - Content: Joins paper fields (title, authors, year, DOI, citations, PDF URL) with tab separators and newline per paper  
  - Inputs: `papers` array from Generate BibTeX node  
  - Outputs: File output (binary)  
  - Edge Cases: Commas or tabs inside titles or authors may affect CSV parsing; no escaping implemented.

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                  | Input Node(s)            | Output Node(s)                       | Sticky Note                                                                                     |
|-------------------------|-------------------------|--------------------------------|--------------------------|------------------------------------|------------------------------------------------------------------------------------------------|
| Search Configuration     | Sticky Note             | Workflow overview & documentation | None                     | None                               | Multi-Database Search  Searches: - PubMed - ArXiv - Google Scholar - Semantic Scholar - ERIC Deduplicates and ranks results |
| Set Search Parameters    | Set                     | Defines search query parameters  | None                     | PDF Vector - Multi-DB Search       |                                                                                                |
| PDF Vector - Multi-DB Search | PDF Vector            | Executes multi-source academic search | Set Search Parameters    | Deduplicate Results                 |                                                                                                |
| Deduplicate Results      | Code                    | Removes duplicate papers         | PDF Vector - Multi-DB Search | Rank by Relevance                 |                                                                                                |
| Rank by Relevance        | Code                    | Scores and sorts papers by relevance | Deduplicate Results       | Generate BibTeX                    |                                                                                                |
| Generate BibTeX          | Code                    | Creates BibTeX entries           | Rank by Relevance         | Export BibTeX File, Export JSON, Export CSV |                                                                                                |
| Export BibTeX File       | Write Binary File       | Saves BibTeX file                | Generate BibTeX           | None                               |                                                                                                |
| Export JSON             | Write Binary File       | Saves JSON file                 | Generate BibTeX           | None                               |                                                                                                |
| Export CSV              | Write Binary File       | Saves CSV file                  | Generate BibTeX           | None                               |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Sticky Note Node "Search Configuration"**  
   - Content:  
     ```
     ## Multi-Database Search

     Searches:
     - PubMed
     - ArXiv
     - Google Scholar
     - Semantic Scholar
     - ERIC

     Deduplicates and ranks results
     ```
   - Position: (250,150)

2. **Create Set Node "Set Search Parameters"**  
   - Position: (450,300)  
   - Set parameters:  
     - `yearFrom`: 2020 (number)  
     - `resultsPerSource`: 25 (number)  
     - `searchQuery`: "machine learning healthcare applications" (string)  
   - No credentials needed

3. **Create PDF Vector Node "PDF Vector - Multi-DB Search"**  
   - Position: (650,300)  
   - Set parameters:  
     - Operation: search  
     - Resource: academic  
     - Query: `={{ $json.searchQuery }}` (expression)  
     - Limit: `={{ $json.resultsPerSource }}` (expression)  
     - Year From: `={{ $json.yearFrom }}` (expression)  
     - Fields to retrieve: title, authors, year, doi, abstract, totalCitations, pdfUrl, provider  
     - Providers: pubmed, semantic_scholar, arxiv, google_scholar, eric  
   - Ensure PDF Vector node is installed and API credentials configured for academic providers

4. **Create Code Node "Deduplicate Results"**  
   - Position: (850,300)  
   - Paste JavaScript code for deduplication based on DOI and normalized title (see code above)  
   - Input: connect from "PDF Vector - Multi-DB Search"

5. **Create Code Node "Rank by Relevance"**  
   - Position: (1050,300)  
   - Paste JavaScript code that calculates relevance scores and sorts papers (see code above)  
   - Access search query via `$node['Set Search Parameters'].json.searchQuery`  
   - Input: connect from "Deduplicate Results"

6. **Create Code Node "Generate BibTeX"**  
   - Position: (1250,250)  
   - Paste JavaScript code generating BibTeX entries and returning bibtex string and papers array  
   - Input: connect from "Rank by Relevance"

7. **Create Write Binary File Node "Export BibTeX File"**  
   - Position: (1450,250)  
   - File name: `search_results_{{ $now.format('yyyy-MM-dd') }}.bib`  
   - File content: `={{ $json.bibtex }}`  
   - Input: connect from "Generate BibTeX"

8. **Create Write Binary File Node "Export JSON"**  
   - Position: (1450,350)  
   - File name: `search_results_{{ $now.format('yyyy-MM-dd') }}.json`  
   - File content: `={{ JSON.stringify($json.papers, null, 2) }}`  
   - Input: connect from "Generate BibTeX"

9. **Create Write Binary File Node "Export CSV"**  
   - Position: (1450,450)  
   - File name: `search_results_{{ $now.format('yyyy-MM-dd') }}.csv`  
   - File content: `={{ $json.papers.map(p => [p.title, p.authors.join(';'), p.year, p.doi, p.totalCitations, p.pdfUrl].join(',\t')).join('\n') }}`  
   - Input: connect from "Generate BibTeX"

10. **Connect Nodes in Order:**  
    - "Set Search Parameters" -> "PDF Vector - Multi-DB Search"  
    - "PDF Vector - Multi-DB Search" -> "Deduplicate Results"  
    - "Deduplicate Results" -> "Rank by Relevance"  
    - "Rank by Relevance" -> "Generate BibTeX"  
    - "Generate BibTeX" -> "Export BibTeX File", "Export JSON", "Export CSV" (all three in parallel)

11. **Credentials Setup:**  
    - Configure credentials for PDF Vector node to access academic providers (PubMed, Semantic Scholar, ArXiv, Google Scholar, ERIC). API keys or OAuth tokens as required by provider.  
    - No special credentials needed for file writing nodes (local file system access).  

12. **Run and Test:**  
    - Execute workflow with default parameters and verify output files generated with expected content.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                            |
|--------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| Multi-Database Search integration covers PubMed, ArXiv, Google Scholar, Semantic Scholar, and ERIC | Workflow overview sticky note                              |
| Uses PDF Vector node for vector-based academic search across multiple providers                   | PDF Vector node documentation: https://docs.pdfvector.com |
| Deduplication strategy combines DOI and normalized title matching for robust duplicate removal    | Code node comments                                         |
| Ranking algorithm balances title relevance, citation impact, recency, and full-text availability  | Code node comments                                         |
| Output files named with current date for version control                                         | Filename templates in export nodes                         |

---

**Disclaimer:** The provided text is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All handled data is legal and public.