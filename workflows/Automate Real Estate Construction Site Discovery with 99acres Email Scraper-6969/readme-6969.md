Automate Real Estate Construction Site Discovery with 99acres Email Scraper

https://n8nworkflows.xyz/workflows/automate-real-estate-construction-site-discovery-with-99acres-email-scraper-6969


# Automate Real Estate Construction Site Discovery with 99acres Email Scraper

### 1. Workflow Overview

This workflow automates the discovery of real estate construction projects in Ahmedabad, India, by scraping listings from 99acres.com based on location information extracted from incoming emails. It is designed primarily for real estate professionals or clients interested in new construction developments in specific areas within Ahmedabad.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Triggered by receiving a new email, it reads and extracts the email content.
- **1.2 Location Extraction:** Parses the email body to identify the area and city, supporting only Ahmedabad currently.
- **1.3 Data Acquisition:** Constructs a 99acres property search URL and scrapes the HTML content of project listings.
- **1.4 Data Parsing and Structuring:** Extracts structured project details such as name, price, BHK configuration, possession date, and status from the raw HTML.
- **1.5 Formatting and Output:** Converts parsed project data into a readable text summary and emails the results back to the original sender.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block listens for new incoming emails via IMAP and passes the email content downstream for processing.

- **Nodes Involved:**  
  - Trigger: New Email

- **Node Details:**  
  - **Trigger: New Email**  
    - Type: Email Read (IMAP) node  
    - Role: Polls an IMAP inbox for new emails to trigger the workflow  
    - Configuration: Uses IMAP credentials (`IMAP-test`) with default options (no special filters)  
    - Inputs: None (trigger node)  
    - Outputs: Email JSON including plain text body (`textPlain`) and metadata such as return-path (sender email)  
    - Edge Cases: Possible authentication failures with IMAP server, empty or malformed email bodies, email format variations (HTML/plain text)  
    - Sticky Note Content: "Triggers the workflow when a new email is received. Extracts subject and body to find user intent and location."

#### 2.2 Location Extraction

- **Overview:**  
  Parses the plain text of the incoming email to detect the requested area and city for property search. Supports only Ahmedabad city; others result in an error message.

- **Nodes Involved:**  
  - Extract Area & City

- **Node Details:**  
  - **Extract Area & City**  
    - Type: Code (JavaScript) node  
    - Role: Extracts area and city from the email text using regex patterns  
    - Configuration:  
      - Uses regex to find patterns like "in [area], Ahmedabad" or "only Ahmedabad"  
      - Defaults city to "ahmedabad" if none found  
      - Maps city to a city ID (`1008530`) required by 99acres URLs  
      - Constructs a 99acres search URL with query parameters for area and city  
    - Inputs: Email JSON with `textPlain` field from previous node  
    - Outputs: JSON containing `area`, `city`, and constructed `url` for scraping  
    - Edge Cases: Unsupported city returns an error JSON, no area specified defaults to city only, regex mismatch  
    - Sticky Note Content: "Extracts area (e.g., gota, bopal) and city (e.g., Ahmedabad) from the email content. Falls back to city only if area is not mentioned."

#### 2.3 Data Acquisition

- **Overview:**  
  Sends an HTTP GET request to the constructed 99acres search URL to retrieve the webpage HTML containing construction project listings.

- **Nodes Involved:**  
  - Scrape Construction Projects

- **Node Details:**  
  - **Scrape Construction Projects**  
    - Type: HTTP Request node  
    - Role: Fetches raw HTML data from 99acres based on the URL from previous node  
    - Configuration:  
      - URL set dynamically via expression from the `url` property in input JSON  
      - Timeout set to 30 seconds  
      - Follows redirects automatically  
      - Custom HTTP headers set to mimic a modern web browser (User-Agent, Accept, Accept-Language) to reduce request blocking  
      - Response format set to raw text (HTML)  
    - Inputs: JSON with `url` property  
    - Outputs: Raw HTML text in `data` field  
    - Edge Cases: Request timeouts, network errors, HTTP errors (e.g., 403 Forbidden), site structure changes leading to empty or invalid HTML  
    - Sticky Note Content: "Scrapes construction project listings from 99acres or another property site based on extracted area and city."

#### 2.4 Data Parsing and Structuring

- **Overview:**  
  Parses the scraped HTML to extract relevant construction project details into structured JSON objects. If no projects are detected, returns a predefined sample set.

- **Nodes Involved:**  
  - Parse Project Listings

- **Node Details:**  
  - **Parse Project Listings**  
    - Type: Code (JavaScript) node  
    - Role: Uses regex-based heuristics to extract project names, prices, BHK configurations, possession dates, status, and locations from HTML text  
    - Configuration:  
      - Defines multiple regex patterns for project names, prices, area, BHK, possession, and status  
      - Splits HTML into sections based on div classes likely holding project cards  
      - Iterates through sections to extract data fields and form project objects  
      - Includes fallback sample projects if parsing yields no results  
      - Adds metadata such as scrape date and source URL  
    - Inputs: JSON with `data` containing raw HTML from HTTP request  
    - Outputs: JSON containing total projects count and array of project objects with detailed fields  
    - Edge Cases: HTML structure changes that invalidate regex, missing fields in listings, incomplete or noisy data, fallback to sample data when no projects found  
    - Sticky Note Content: "Cleans and formats scraped HTML data into structured project entries (e.g., project name, price, builder, etc.)."

#### 2.5 Formatting and Output

- **Overview:**  
  Formats the extracted project details into a clean, email-friendly text summary and sends it back to the original requestor.

- **Nodes Involved:**  
  - Format Project Details  
  - Send Results to User

- **Node Details:**  
  - **Format Project Details**  
    - Type: Code (JavaScript) node  
    - Role: Converts the array of projects into a readable message string with bullet points and separators  
    - Configuration:  
      - Constructs a header with total projects count  
      - Iterates project list to format each with labels for name, BHK, price, area, possession date, status, location, and scrape date  
      - Joins all entries with line breaks  
    - Inputs: JSON with project array and metadata  
    - Outputs: JSON with `message` string  
    - Edge Cases: Empty project list, missing fields, encoding issues in text output  
    - Sticky Note Content: "Formats all parsed projects into an email-friendly list (bullet points or table)."

  - **Send Results to User**  
    - Type: Email Send node  
    - Role: Sends the formatted project summary email back to the original sender  
    - Configuration:  
      - Email body set to the formatted message from previous node  
      - Reply-To and To email set dynamically to the return-path (sender address) of the triggering email  
      - Subject fixed as "🏗️ Construction Projects List"  
      - From email set to a configured SMTP address (e.g., abci@gmail.com)  
      - Uses SMTP credentials (`SMTP -test`) for sending  
      - Email format set to plain text  
    - Inputs: JSON with `message` string and original email metadata  
    - Outputs: None (terminal node)  
    - Edge Cases: SMTP authentication failure, invalid recipient address, email sending throttling or rejection  
    - Sticky Note Content: "Sends back the matched construction projects to the email sender with a nicely formatted summary."

---

### 3. Summary Table

| Node Name              | Node Type                 | Functional Role                          | Input Node(s)           | Output Node(s)             | Sticky Note                                                                                     |
|------------------------|---------------------------|----------------------------------------|-------------------------|----------------------------|------------------------------------------------------------------------------------------------|
| Trigger: New Email      | Email Read (IMAP)          | Triggers workflow on new email         | None                    | Extract Area & City         | Triggers the workflow when a new email is received. Extracts subject and body to find user intent and location. |
| Extract Area & City     | Code                      | Extracts area and city from email text | Trigger: New Email      | Scrape Construction Projects | Extracts area (e.g., gota, bopal) and city (e.g., Ahmedabad) from the email content. Falls back to city only if area is not mentioned. |
| Scrape Construction Projects | HTTP Request           | Fetches HTML page of construction listings | Extract Area & City     | Parse Project Listings      | Scrapes construction project listings from 99acres or another property site based on extracted area and city.     |
| Parse Project Listings  | Code                      | Parses HTML and extracts project data  | Scrape Construction Projects | Format Project Details    | Cleans and formats scraped HTML data into structured project entries (e.g., project name, price, builder, etc.).  |
| Format Project Details  | Code                      | Formats project data into email text   | Parse Project Listings  | Send Results to User        | Formats all parsed projects into an email-friendly list (bullet points or table).                               |
| Send Results to User    | Email Send (SMTP)          | Sends formatted results back to sender | Format Project Details  | None                       | Sends back the matched construction projects to the email sender with a nicely formatted summary.               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node**  
   - Add **Email Read (IMAP)** node named "Trigger: New Email"  
   - Configure IMAP credentials (e.g., `IMAP-test`)  
   - Use default options to listen for new emails  
   - Position: Start of workflow  

2. **Create Area & City Extraction Node**  
   - Add **Code** node named "Extract Area & City"  
   - Connect output of "Trigger: New Email" to input of this node  
   - JavaScript logic:  
     - Extract plain text from email (`textPlain`)  
     - Use regex to detect area and city, default city to "ahmedabad"  
     - Map city to 99acres city ID `1008530`  
     - Construct URL: `https://www.99acres.com/search/property/buy/{location}?city={cityId}&keyword={location}&preference=S&area_unit=1&budget_min=0&res_com=R&isPreLeased=N`  
   - Handle unsupported cities by returning JSON with error message  

3. **Create HTTP Request Node**  
   - Add **HTTP Request** node named "Scrape Construction Projects"  
   - Connect output from "Extract Area & City"  
   - Set URL to `={{ $json.url }}` to dynamically use constructed URL  
   - Set method to GET  
   - Set timeout to 30000 ms (30 seconds)  
   - Add headers:  
     - User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"  
     - Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"  
     - Accept-Language: "en-US,en;q=0.5"  
   - Response format: Text (raw HTML)  

4. **Create Parsing Code Node**  
   - Add **Code** node named "Parse Project Listings"  
   - Connect output from "Scrape Construction Projects"  
   - JavaScript logic:  
     - Parse the raw HTML text from `data` field  
     - Use regex to extract project names, BHK, price, possession, status, area, location  
     - Iterate over HTML sections to build project objects  
     - If no projects found, insert predefined sample projects  
     - Return JSON with `total_projects`, `projects` array, `scraped_at` timestamp, and `source_url`  

5. **Create Formatting Node**  
   - Add **Code** node named "Format Project Details"  
   - Connect output from "Parse Project Listings"  
   - JavaScript logic:  
     - Build a header with total projects count  
     - Format each project with bullet points and labels for fields (name, BHK, price, etc.)  
     - Join into a single string message  
     - Return JSON with `message` field  

6. **Create Email Send Node**  
   - Add **Email Send (SMTP)** node named "Send Results to User"  
   - Connect output from "Format Project Details"  
   - Configure SMTP credentials (e.g., `SMTP -test`)  
   - Set email subject to "🏗️ Construction Projects List"  
   - Set "To Email" and "Reply-To" dynamically from original email sender:  
     - Expression: `={{ $('Trigger: New Email').item.json.metadata['return-path'] }}`  
   - Set "From Email" to a valid sender address (e.g., abci@gmail.com)  
   - Email content: use `={{ $json.message }}` from previous node  
   - Email format: Plain text  

7. **Validate and Test**  
   - Ensure all nodes are connected in order:  
     Trigger → Extract Area & City → Scrape Construction Projects → Parse Project Listings → Format Project Details → Send Results to User  
   - Test with incoming emails containing area and city mentions (e.g., "gota, ahmedabad")  
   - Monitor for errors such as unsupported cities or HTTP errors  

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| Workflow currently supports only Ahmedabad city for property search.                                       | City ID mapping in code node restricts functionality.                                               |
| Uses regex-based HTML parsing which may require periodic updates if 99acres site structure changes.       | Regex patterns in "Parse Project Listings" node.                                                   |
| Email sender is automatically replied with formatted project listings.                                    | Uses original email's return-path for response addressing.                                         |
| User-Agent and headers in HTTP request mimic a standard browser to reduce scraping blocks.                 | Configured in "Scrape Construction Projects" node.                                                  |
| Sample project data included as fallback to ensure results even if scraping fails or finds no projects.   | Included in "Parse Project Listings" node.                                                         |
| Workflow designed for automation of real estate lead generation or client updates about new projects.      | Use case: real estate agents, developers, or clients monitoring new constructions.                  |

---

**Disclaimer:**  
The provided text arises exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All handled data is legal and publicly accessible.