Auto-Generate Prospect Research Reports with LinkedIn & Perplexity AI

https://n8nworkflows.xyz/workflows/auto-generate-prospect-research-reports-with-linkedin---perplexity-ai-6535


# Auto-Generate Prospect Research Reports with LinkedIn & Perplexity AI

### 1. Workflow Overview

This workflow is designed to **auto-generate detailed, personalized prospect research reports** when a new consultation call is booked with a lead. The target use case is high-touch B2B sales, business development, and consulting teams who want to prepare thoroughly before discovery or qualification calls.

The workflow automates the following logical blocks:

- **1.1 New Call Trigger & Lead Lookup:** Detects when a new call booking happens via Cal.com and looks up the lead’s LinkedIn profile URL from multiple Google Sheets databases.
- **1.2 LinkedIn Data Scraping:** Uses Relevance AI’s API to scrape detailed LinkedIn profile data, including about section, posts, experiences, education, company info, and images.
- **1.3 Web Research via Perplexity AI:** Performs a deep web research query on the lead’s company to gather contextual insights and recent news.
- **1.4 Data Formatting & Extraction:** Processes raw scraped data into HTML snippets for posts, experiences, education, and citations.
- **1.5 AI Summarization & Analysis:** Utilizes OpenAI’s language model to generate:
  - A comprehensive personal and company profile summary from LinkedIn and web data.
  - An analysis of pain points and tailored solution opportunities for the lead’s company.
- **1.6 Report Generation & Delivery:** Combines all data into a polished HTML report and emails it to the sales consultant for call preparation.

---

### 2. Block-by-Block Analysis

#### 2.1 New Call Trigger & Lead Lookup

- **Overview:**  
  This block triggers the workflow when a new call booking is created and finds the lead's LinkedIn URL from Google Sheets databases.
  
- **Nodes Involved:**  
  - Cal.com Trigger  
  - Google Sheets (4 instances)  
  - Filter

- **Node Details:**

  - **Cal.com Trigger**  
    - Type: Cal.com webhook trigger  
    - Role: Listens for new booking events (event type: BOOKING_CREATED) with a specific event type ID linked to the booking form.  
    - Configuration: Uses Cal.com API credentials; triggers on new calls booked.  
    - Inputs: None (trigger node)  
    - Outputs: Booking data including attendee email and LinkedIn URL.  
    - Edge cases: Missed webhook calls, API auth failures, event type mismatch.  

  - **Google Sheets (4 nodes)**  
    - Type: Google Sheets (read)  
    - Role: Search Google Sheets documents for the lead’s email to find their LinkedIn URL. Four sheets/databases checked in parallel.  
    - Configuration: Each points to a different Google Sheet and sheet tab. Uses Google Sheets OAuth2 credentials.  
    - Inputs: Booking trigger outputs lead email.  
    - Outputs: Rows matching the email with LinkedIn profile URLs.  
    - Edge cases: No matching rows; API limits; credential expiry.  

  - **Filter**  
    - Type: Filter  
    - Role: Filters incoming data to only process matching email "amirlanbekuulu@gmail.com" (likely a test or demo filter in this instance).  
    - Inputs: Data from Google Sheets.  
    - Outputs: Data forwarded only if email matches filter condition.  
    - Edge cases: No match leads to workflow no further processing.  

---

#### 2.2 LinkedIn Data Scraping

- **Overview:**  
  This block scrapes LinkedIn profile details and posts using Relevance AI, transforming the data for further use.

- **Nodes Involved:**  
  - Scrape Profiles + Posts - Relevance AI (HTTP Request)  
  - Posts (Code)  
  - Experiences (Code)  
  - Education (Code)  

- **Node Details:**

  - **Scrape Profiles + Posts - Relevance AI**  
    - Type: HTTP Request  
    - Role: Calls Relevance AI API to scrape LinkedIn profile data including posts from last 30 days, profile details, experiences, education, and company info.  
    - Configuration: POST request with JSON body containing LinkedIn URL and days to scrape; uses header authentication.  
    - Inputs: Lead LinkedIn URL from Filter output.  
    - Outputs: JSON with profile details, posts, experiences, education, images, company details.  
    - Edge cases: API rate limits, invalid LinkedIn URL, network timeouts, data incomplete or missing.  

  - **Posts (Code Node)**  
    - Type: Code  
    - Role: Converts scraped LinkedIn posts into styled HTML blocks for report inclusion.  
    - Key Expressions: Iterates over posts array, creates HTML divs with post content and date.  
    - Inputs: Output from Relevance AI scrape node.  
    - Outputs: Single JSON with `postsHTML` string.  
    - Edge cases: Empty or missing posts array; posts with unexpected content structure.  

  - **Experiences (Code Node)**  
    - Type: Code  
    - Role: Converts experience data into HTML table rows for report.  
    - Inputs: Scraped experiences array from Relevance AI data.  
    - Outputs: JSON with `experiencesTable` HTML string.  
    - Edge cases: Missing experiences array; incomplete data fields.  

  - **Education (Code Node)**  
    - Type: Code  
    - Role: Converts education data into HTML table rows for report.  
    - Inputs: Scraped education array from Relevance AI data.  
    - Outputs: JSON with `educationTable` HTML string.  
    - Edge cases: Missing education data; incomplete records.  

---

#### 2.3 Web Research via Perplexity AI

- **Overview:**  
  This block performs a detailed web research query on the lead’s company to gather current news, insights, and context.

- **Nodes Involved:**  
  - Perplexity

- **Node Details:**

  - **Perplexity**  
    - Type: Perplexity API node  
    - Role: Queries Perplexity AI with a prompt to research the lead’s company using company name and website URL from scraped LinkedIn data.  
    - Configuration: Uses "sonar-pro" model; system prompt defines role as researcher for business development; detailed prompt includes company info placeholders.  
    - Inputs: LinkedIn company name and website URL from Relevance AI output.  
    - Outputs: Research text and citations in JSON.  
    - Edge cases: API call failures, inaccurate or outdated info, rate limits.  

---

#### 2.4 Data Formatting & Extraction

- **Overview:**  
  This block formats citations extracted from Perplexity AI into clickable HTML links.

- **Nodes Involved:**  
  - Citations (Code)

- **Node Details:**

  - **Citations (Code Node)**  
    - Type: Code  
    - Role: Extracts citations array from Perplexity output and generates an unordered HTML list of clickable links.  
    - Inputs: JSON with citations array from Perplexity.  
    - Outputs: JSON with `citationsHTML` string.  
    - Edge cases: No citations found; malformed URLs.  

---

#### 2.5 AI Summarization & Analysis

- **Overview:**  
  This block uses OpenAI to generate a neat, structured profile and company overview, followed by an analysis of pain points and tailored solutions based on the research data.

- **Nodes Involved:**  
  - Person + Company Profile (OpenAI)  
  - Pain Points + Solutions (OpenAI)

- **Node Details:**

  - **Person + Company Profile**  
    - Type: OpenAI (Langchain)  
    - Role: Takes LinkedIn about section, recent posts, and Perplexity web research to generate:
      - Personal profile summary
      - Company profile summary
      - List of interests
      - Unique facts about the lead  
    - Configuration: Uses "o1-mini" model, prompt instructs output strictly in HTML format with headings and lists; no fenced code blocks.  
    - Inputs: LinkedIn about, last 30 days posts, Perplexity content.  
    - Outputs: HTML snippet with structured profile info.  
    - Edge cases: API rate limits, incomplete input data, prompt misinterpretation.  

  - **Pain Points + Solutions**  
    - Type: OpenAI (Langchain)  
    - Role: Analyzes LinkedIn profile summary, Perplexity web research, and negative reviews to extract:
      - Pain points faced by the lead’s company
      - Evidence supporting each pain point
      - Solutions Built by Abdul can offer
      - Top 5 highest ROI automation opportunities  
    - Configuration: Same model as above; output in HTML with tables and lists, no fenced code blocks.  
    - Inputs: Profile summary from previous OpenAI node, Perplexity content.  
    - Outputs: HTML snippet with pain points table and opportunities list.  
    - Edge cases: Similar to above; potential for misaligned or incomplete insights if input data is sparse.  

---

#### 2.6 Report Generation & Delivery

- **Overview:**  
  This final block compiles all data into a fully styled HTML report and emails the report to the consultant.

- **Nodes Involved:**  
  - Create HTML Report (HTML node)  
  - Email Report (Gmail node)

- **Node Details:**

  - **Create HTML Report**  
    - Type: HTML  
    - Role: Combines all previous outputs into a complete HTML document with inline CSS styling, including:
      - Profile and company images
      - Analysis & key facts (OpenAI summaries)
      - LinkedIn profile details, education, experience tables
      - Recent LinkedIn posts (HTML formatted)
      - Perplexity research analysis text
      - Citations (clickable links)  
    - Inputs: Outputs from OpenAI nodes, Relevance AI scraping, code nodes for posts, experiences, education, citations, Perplexity research.  
    - Outputs: Full HTML string in JSON field `html`.  
    - Edge cases: Missing data placeholders, broken image URLs, malformed HTML if inputs are invalid.  

  - **Email Report**  
    - Type: Gmail  
    - Role: Sends the generated HTML report via email to a fixed recipient (builtbyabdul@gmail.com) with the lead’s full name in the subject line.  
    - Configuration: Uses Gmail OAuth2 credentials; email body set from `html` field of previous node; disables attribution footer.  
    - Inputs: HTML report output.  
    - Outputs: Email sent confirmation.  
    - Edge cases: Gmail API quota exceeded, invalid recipient email, network failure.  

---

### 3. Summary Table

| Node Name                          | Node Type               | Functional Role                        | Input Node(s)                              | Output Node(s)                           | Sticky Note                                                                                                    |
|-----------------------------------|-------------------------|-------------------------------------|-------------------------------------------|-----------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Cal.com Trigger                   | Cal.com Trigger          | Trigger on new call booking          | None                                      | Google Sheets (4 nodes)                  | # New Call Booked                                                                                             |
| Google Sheets                    | Google Sheets            | Lookup lead email to find LinkedIn  | Cal.com Trigger                           | Filter                                  | # Find LinkedIn URL from Database                                                                             |
| Google Sheets1                   | Google Sheets            | Lookup lead email to find LinkedIn  | Cal.com Trigger                           | Filter                                  | # Find LinkedIn URL from Database                                                                             |
| Google Sheets2                   | Google Sheets            | Lookup lead email to find LinkedIn  | Cal.com Trigger                           | Filter                                  | # Find LinkedIn URL from Database                                                                             |
| Google Sheets3                   | Google Sheets            | Lookup lead email to find LinkedIn  | Cal.com Trigger                           | Filter                                  | # Find LinkedIn URL from Database                                                                             |
| Filter                          | Filter                   | Filter for specific email test case | Google Sheets (all 4)                      | Scrape Profiles + Posts - Relevance AI | # Find LinkedIn URL from Database                                                                             |
| Scrape Profiles + Posts - Relevance AI | HTTP Request           | Scrape LinkedIn profile & posts     | Filter                                    | Posts                                   | # Research Prospect - LinkedIn - Perplexity Web Research                                                     |
| Posts                           | Code                     | Format LinkedIn posts to HTML       | Scrape Profiles + Posts                    | Experiences                             | # Research Prospect - LinkedIn - Perplexity Web Research                                                     |
| Experiences                     | Code                     | Format experiences to HTML table    | Posts                                     | Education                              | # Research Prospect - LinkedIn - Perplexity Web Research                                                     |
| Education                      | Code                     | Format education to HTML table      | Experiences                               | Perplexity                             | # Research Prospect - LinkedIn - Perplexity Web Research                                                     |
| Perplexity                    | Perplexity AI             | Conduct web research on company     | Education                                 | Citations                             | # Research Prospect - LinkedIn - Perplexity Web Research                                                     |
| Citations                     | Code                     | Format citations to HTML list       | Perplexity                                | Person + Company Profile               | # Research Prospect - LinkedIn - Perplexity Web Research                                                     |
| Person + Company Profile       | OpenAI (Langchain)        | Generate person & company profile   | Citations                                 | Pain Points + Solutions                | # Analysis - Summary - Pain Points + Solutions                                                               |
| Pain Points + Solutions        | OpenAI (Langchain)        | Analyze pain points and solutions   | Person + Company Profile                   | Create HTML Report                    | # Analysis - Summary - Pain Points + Solutions                                                               |
| Create HTML Report             | HTML                     | Compile complete HTML report        | Pain Points + Solutions                    | Email Report                         | # Create Report                                                                                                |
| Email Report                  | Gmail                    | Send report email to consultant     | Create HTML Report                         | None                                 | # Email Report                                                                                                |
| Sticky Note                   | Sticky Note              | Informational visual note            | None                                      | None                                 | # Research Prospect - LinkedIn - Perplexity Web Research                                                     |
| Sticky Note1                  | Sticky Note              | Informational visual note            | None                                      | None                                 | # Analysis - Summary - Pain Points + Solutions                                                               |
| Sticky Note2                  | Sticky Note              | Informational visual note            | None                                      | None                                 | # Create Report                                                                                                |
| Sticky Note3                  | Sticky Note              | Informational visual note            | None                                      | None                                 | # Email Report                                                                                                |
| Sticky Note4                  | Sticky Note              | Informational visual note            | None                                      | None                                 | # New Call Booked                                                                                             |
| Sticky Note5                  | Sticky Note              | Informational visual note            | None                                      | None                                 | # Find LinkedIn URL from Database                                                                             |
| Sticky Note6                  | Sticky Note              | Workflow overview and instructions   | None                                      | None                                 | # Auto-generate prospect research reports after a call is booked using LinkedIn + Perplexity (Detailed overview) |
| Sticky Note7                  | Sticky Note              | Branding & contact info               | None                                      | None                                 | ## Hey, I'm Abdul 👋 - business & contact info                                                                |
| Sticky Note8                  | Sticky Note              | Example output screenshot             | None                                      | None                                 | ## Example Output (image)                                                                                      |
| Sticky Note9                  | Sticky Note              | Continued example output screenshot   | None                                      | None                                 | ## Continued... (image)                                                                                        |
| Sticky Note10                 | Sticky Note              | Continued example output screenshot   | None                                      | None                                 | ## Continued (image)                                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cal.com Trigger Node**  
   - Type: Cal.com Trigger  
   - Configure with Cal.com API credentials  
   - Set event filter to listen for `BOOKING_CREATED` with the specific event type ID for your consultation calls.

2. **Add Four Google Sheets Nodes**  
   - Type: Google Sheets (Read)  
   - Connect all four nodes in parallel from Cal.com Trigger output.  
   - Configure each to a different Google Sheet document and sheet tab containing your leads database.  
   - Set to read rows and filter by the lead’s email (from Cal.com Trigger).  
   - Use OAuth2 credentials for Google Sheets.

3. **Add a Filter Node**  
   - Connect all Google Sheets nodes to this filter node.  
   - Configure filter to pass only items where the email matches the booking email (for testing, an example email is preset).  
   - This node ensures only valid leads proceed.

4. **Add HTTP Request Node for LinkedIn Scraping**  
   - Name: Scrape Profiles + Posts - Relevance AI  
   - Configure POST request to Relevance AI API endpoint for LinkedIn scraping.  
   - In JSON body, pass the LinkedIn URL from Filter output and last_x_days=30.  
   - Use header authentication with your Relevance AI API key.

5. **Add Code Nodes for Data Formatting**  
   - **Posts Node:** Transform LinkedIn posts into HTML blocks.  
   - **Experiences Node:** Generate HTML table rows for work experiences.  
   - **Education Node:** Generate HTML table rows for education history.  
   - Connect nodes sequentially: Scrape → Posts → Experiences → Education.

6. **Add Perplexity AI Node**  
   - Configure to use your Perplexity API key.  
   - Set model to "sonar-pro".  
   - Construct prompt to research the lead’s company using company name and website from scraped LinkedIn data.

7. **Add Code Node for Citations Formatting**  
   - Extract citations array from Perplexity output.  
   - Format as clickable HTML list.  
   - Connect Perplexity output to this node.

8. **Add OpenAI Node for Person + Company Profile**  
   - Use OpenAI API credentials with Langchain integration.  
   - Select model "o1-mini".  
   - Configure prompt to generate personal profile, company profile, interests, and unique facts in HTML format, incorporating LinkedIn about, recent posts, and Perplexity research content.  
   - Input comes from Citations node output.

9. **Add OpenAI Node for Pain Points + Solutions**  
   - Same model and credentials as above.  
   - Prompt to analyze the research and produce pain points with evidence, solutions, and top 5 automation opportunities, formatted as HTML with tables and lists.  
   - Input comes from Person + Company Profile node output.

10. **Add HTML Node to Create Report**  
    - Build a complete HTML document incorporating:  
      - Profile and company images from scraped data  
      - AI-generated profile and pain points HTML  
      - Formatted LinkedIn profile details, education, experience tables  
      - Recent LinkedIn posts HTML  
      - Perplexity research text  
      - Citations HTML list  
    - Connect input from Pain Points + Solutions node and all previous formatting nodes accordingly.

11. **Add Gmail Node to Email Report**  
    - Connect to Create HTML Report node output.  
    - Use Gmail OAuth2 credentials for authentication.  
    - Configure "To" email address for the sales consultant.  
    - Set email subject dynamically with lead full name from scraped data.  
    - Set email body as HTML content from the report node.  
    - Disable default attribution footer.

12. **Add Sticky Notes**  
    - Add informational sticky notes to document each stage and provide instructions, branding, and example outputs for internal clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                         | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Auto-generate prospect research reports after a call is booked using LinkedIn + Perplexity. Workflow is designed for founders, SDRs, consultants, and enterprise sales teams to prepare personalized discovery calls efficiently. | Sticky Note6 contains detailed workflow overview, use cases, setup instructions, and customization tips. |
| Built by Abdul is the creator of this workflow, specializing in AI automation for sales and consulting teams. Contact info and website included for support and consulting inquiries.                                                | Sticky Note7: https://www.builtbyabdul.com/ and email builtbyabdul@gmail.com                        |
| Example output visuals demonstrate the style and structure of the generated report, showcasing the rich, formatted HTML content with insights, posts, and research data.                                                              | Sticky Notes 8, 9, 10 with embedded images linked from Imgur.                                      |
| Integration Requirements: Cal.com or equivalent booking platform, Google Sheets for lead data, Relevance AI API for LinkedIn scraping, Perplexity API for web research, OpenAI API for summarization, Gmail for email sending.       | Sticky Note6 and node configuration details.                                                       |

---

This structured documentation enables developers and AI agents to understand, reproduce, and modify the entire workflow confidently, anticipating common failure points and integration requirements.