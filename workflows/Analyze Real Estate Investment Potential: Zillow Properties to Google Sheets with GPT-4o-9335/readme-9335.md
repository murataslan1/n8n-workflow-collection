Analyze Real Estate Investment Potential: Zillow Properties to Google Sheets with GPT-4o

https://n8nworkflows.xyz/workflows/analyze-real-estate-investment-potential--zillow-properties-to-google-sheets-with-gpt-4o-9335


# Analyze Real Estate Investment Potential: Zillow Properties to Google Sheets with GPT-4o

### 1. Workflow Overview

This workflow automates the end-to-end process of analyzing real estate investment potential by integrating live property data scraping, AI-driven investment scoring, and organized data storage. It targets real estate investors, analysts, or automation professionals seeking to efficiently gather, evaluate, and track Zillow property listings with minimal manual effort.

The workflow is structured into three main logical blocks:

- **1.1 Data Extraction from Zillow**: Starts the Apify Actor to scrape comprehensive Zillow property listings, collecting detailed property information including price, location, and amenities.

- **1.2 Data Cleaning and AI Scoring**: Cleans and formats the raw scraped data into a structured schema, then processes each property individually using OpenAI’s GPT-4o-mini model to compute an investment potential score based on financial metrics and critical filters.

- **1.3 Google Sheets Data Storage**: Appends or updates the scored property data into a Google Sheets database, keeping the property investment records current and accessible for further analysis.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Extraction from Zillow

- **Overview:**  
  This block initiates the scraping of real estate listings from Zillow via an Apify Actor trigger. It retrieves raw property data in bulk, including pricing, location, school ratings, and other relevant real estate attributes.

- **Nodes Involved:**  
  - Start Zillow Scraper (@apify/n8n-nodes-apify.apifyTrigger)  
  - Extract Individual Property Data (@apify/n8n-nodes-apify.apify)

- **Node Details:**

  - **Start Zillow Scraper**  
    - Type: Apify Trigger  
    - Role: Initiates the workflow upon completion of the Apify Zillow Scraper Actor run.  
    - Configuration: Uses Apify OAuth2 credentials; Actor ID set to a Zillow scraper actor (ID: l7auNT3I30CssRrvO).  
    - Inputs: Triggered by Apify webhook on scraper completion.  
    - Outputs: Provides dataset ID and raw scrape metadata to next node.  
    - Edge Cases: Possible trigger failure if Apify webhook misconfigured or authentication expired.

  - **Extract Individual Property Data**  
    - Type: Apify Actor Node  
    - Role: Runs a secondary Apify actor to extract detailed property-level data using the dataset ID obtained from the trigger node.  
    - Configuration: 8GB memory allocated; Actor ID set to a detailed property extractor (ID: ENK9p4RZHg0iVso52); passes the dataset ID from the previous node dynamically. Authentication via Apify OAuth2.  
    - Inputs: Dataset ID from Start Zillow Scraper.  
    - Outputs: Raw property records with extensive attributes per property.  
    - Edge Cases: Actor execution may fail due to API rate limits, network errors, or invalid dataset ID.

#### 2.2 Data Cleaning and AI Scoring

- **Overview:**  
  This block transforms raw scraped data into a structured and clean format, extracting and renaming key attributes. It then splits the dataset into individual properties for separate AI analysis. Each property is evaluated by an OpenAI GPT-4o-mini model that assigns a numeric investment potential score based on financial calculations and critical investment criteria.

- **Nodes Involved:**  
  - Clean & Format Data (Set Node)  
  - Process Each Property (SplitInBatches Node)  
  - AI Scoring: Investment Potential (OpenAI LangChain Node)

- **Node Details:**

  - **Clean & Format Data**  
    - Type: Set Node  
    - Role: Maps and formats raw JSON property data fields into a clean, flat schema with friendly field names for easier processing downstream.  
    - Configuration: Defines ~60 assignments extracting fields like Price, Picture URL, Address components, Tax info, HOA fees, School names and ratings, Mortgage rates, GRM, NDI 50 rule, descriptions, and agent contact info. Includes calculations (e.g., GRM, NDI 50 rule) and formatting (e.g., date to locale string).  
    - Inputs: Raw property data array from Extract Individual Property Data.  
    - Outputs: Cleaned property data ready for batch processing.  
    - Edge Cases: Missing data fields may lead to empty strings or undefined values; expressions assume certain fields exist—failure if JSON paths invalid.

  - **Process Each Property**  
    - Type: SplitInBatches  
    - Role: Splits the cleaned data array into individual property records for sequential processing through AI scoring and storage.  
    - Configuration: Default batch size (1 item per batch) to ensure per-property analysis.  
    - Inputs: Cleaned data array.  
    - Outputs: Single property JSON object per iteration.  
    - Edge Cases: Empty datasets halt processing; large datasets may slow throughput.

  - **AI Scoring: Investment Potential**  
    - Type: OpenAI LangChain (GPT-4o-mini)  
    - Role: Applies an AI model to analyze each property’s attributes against defined investment criteria and returns a numeric score (1–100).  
    - Configuration:  
      - Model: GPT-4o-mini  
      - System Message: Defines role as intelligent real estate investment analyzer.  
      - User Prompt: Contains detailed scoring rules, critical filters for auto-fail conditions, financial calculations (cash flow, cap rate, GRM, DSCR), and scoring schema.  
      - Dynamic Inputs: Property data fields injected via template expressions for AI context.  
    - Inputs: Single property JSON from Process Each Property.  
    - Outputs: Integer investment score as string.  
    - Edge Cases: Missing crucial data results in zero score; API rate limits or timeouts; expression evaluation errors if input data incomplete; AI model output format must strictly follow numeric-only output.

#### 2.3 Google Sheets Data Storage

- **Overview:**  
  This block updates or appends the scored property data into a Google Sheets document, creating a live, organized database of properties with investment scores and detailed attributes for review.

- **Nodes Involved:**  
  - Update Google Sheets Database (Google Sheets Node)

- **Node Details:**

  - **Update Google Sheets Database**  
    - Type: Google Sheets  
    - Role: Inserts or updates rows in a Google Sheets spreadsheet with property details and AI scores.  
    - Configuration:  
      - Operation: Append or update based on "URL" as matching column to avoid duplicates.  
      - Document ID and Sheet Name predefined (Google Sheet link referenced).  
      - Columns mapped explicitly from property JSON fields and AI score output message content.  
      - Includes data transformations such as converting lot size to sqft if below 20 units (assumed acres).  
    - Inputs: Property data with appended AI score from AI Scoring node.  
    - Outputs: Confirmation of Google Sheets update.  
    - Credentials: Google Sheets OAuth2 API credentials provided.  
    - Edge Cases: API quota limits, permission issues, schema mismatch, network failures.

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                   | Input Node(s)                | Output Node(s)             | Sticky Note                                                                                                   |
|-------------------------------|----------------------------------|---------------------------------|-----------------------------|----------------------------|--------------------------------------------------------------------------------------------------------------|
| Start Zillow Scraper           | @apify/n8n-nodes-apify.apifyTrigger | Initiates Zillow data scraping   | (Trigger)                   | Extract Individual Property Data | # 🟩 STEP 1: Zillow Data Extraction<br>Starts Apify Actor to scrape property listings, ideal for investors. |
| Extract Individual Property Data | @apify/n8n-nodes-apify.apify     | Extracts detailed property data  | Start Zillow Scraper         | Clean & Format Data         | # 🟩 STEP 1: Zillow Data Extraction<br>Retrieves essential details such as price, location, and features.     |
| Clean & Format Data            | Set Node                         | Cleans and formats raw data      | Extract Individual Property Data | Process Each Property       | # Clean & Format Data                                                                                                |
| Process Each Property          | SplitInBatches                   | Splits dataset into single properties | Clean & Format Data           | AI Scoring: Investment Potential, Update Google Sheets Database | # Process Each Property                                                                                             |
| AI Scoring: Investment Potential | OpenAI LangChain (gpt-4o-mini)  | Scores investment potential using AI | Process Each Property (batch 2) | Update Google Sheets Database | # 🟦 STEP 2: AI Investment Scoring<br>Uses OpenAI to assign an investment potential score (1–10).             |
| Update Google Sheets Database  | Google Sheets                    | Stores/updates property data in Google Sheets | AI Scoring: Investment Potential | Process Each Property       | # 🟨 STEP 3: Google Sheets Data Storage<br>Appends scored results to Google Sheets keeping database updated.  |
| Sticky Note                   | Sticky Note                     | Documentation and notes          | —                           | —                          | # Zillow Property Scraper with AI Scoring to Google Sheets<br>Workflow overview and tool credits.             |
| Sticky Note2                  | Sticky Note                     | Documentation and notes          | —                           | —                          | # 🟦 STEP 2: AI Investment Scoring<br>Helps prioritize listings worth deeper research.                         |
| Sticky Note3                  | Sticky Note                     | Documentation and notes          | —                           | —                          | # Clean & Format Data                                                                                             |
| Sticky Note4                  | Sticky Note                     | Documentation and notes          | —                           | —                          | # 🟨 STEP 3: Google Sheets Data Storage<br>Keeps property database current and organized.                      |
| Sticky Note5                  | Sticky Note                     | Documentation and notes          | —                           | —                          | # Zillow Property Scraper with AI Scoring to Google Sheets<br>Full workflow description and disclaimers.      |
| Sticky Note6                  | Sticky Note                     | Documentation and notes          | —                           | —                          | # Process Each Property                                                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Start Zillow Scraper" node**  
   - Type: Apify Trigger  
   - Set Actor ID to the Zillow scraping actor (e.g., "l7auNT3I30CssRrvO")  
   - Authenticate using Apify OAuth2 credentials  
   - This node triggers the workflow upon completion of Zillow scraping.

2. **Create "Extract Individual Property Data" node**  
   - Type: Apify Actor  
   - Configure Actor ID to detailed property data extractor (e.g., "ENK9p4RZHg0iVso52")  
   - Set memory to 8192 MB  
   - Pass dataset ID from "Start Zillow Scraper" dynamically into custom body JSON under "searchResultsDatasetId"  
   - Authenticate with Apify OAuth2 credentials  
   - Connect "Start Zillow Scraper" output to this node input.

3. **Create "Clean & Format Data" node**  
   - Type: Set node  
   - Map all required fields from raw JSON to structured properties exactly as per the workflow, including:  
     - Picture, Price, Virtual Tour URL, propertyURL (constructed), MLS ID#, Google Maps URL (constructed), Address, city, County, zipcode, yearBuilt, homeType, Home Status, Bedrooms, Bathrooms, Lot Size, Living area, Date on Market (formatted), Rent Zestimate, Zestimate, Last Price sold (formatted), Tax Assessed Value, Tax Annual Amount, Price per Sqrf, GRM (calculated), NDI 50 rule (calculated), mortgage rates, agent and broker contact info, HOA fees, pets allowed, schools and ratings, description, etc.  
   - Connect "Extract Individual Property Data" output to this node input.

4. **Create "Process Each Property" node**  
   - Type: SplitInBatches  
   - Set batch size to 1 (default) to process properties individually  
   - Connect "Clean & Format Data" output to this node input.

5. **Create "AI Scoring: Investment Potential" node**  
   - Type: OpenAI LangChain node  
   - Select GPT-4o-mini model  
   - Use system message defining the AI role as a real estate investment analyzer  
   - Configure user prompt with detailed scoring criteria, critical filters, and dynamic input expressions referencing current property fields (use mustache or n8n expression syntax)  
   - Authenticate with OpenAI API credentials  
   - Connect batch output of "Process Each Property" (second output) to this node input.

6. **Create "Update Google Sheets Database" node**  
   - Type: Google Sheets  
   - Configure operation "Append or Update" with matching column "URL"  
   - Set Document ID to your Google Sheet containing the property database  
   - Set Sheet Name (gid=0 or as appropriate)  
   - Map all property fields and AI score output fields to corresponding sheet columns, including transformations like lot size conversion from acres to sqft if below threshold  
   - Authenticate with Google Sheets OAuth2 credentials  
   - Connect output of "AI Scoring: Investment Potential" node to this node input.

7. **Connect "Process Each Property" first output to "Update Google Sheets Database" node**  
   - This connection allows processed property data without AI scoring to flow for any fallback or additional handling.

8. **Add Sticky Note nodes**  
   - Add descriptive sticky notes at logical points for documentation purposes:  
     - Workflow overview and tools used  
     - Step 1: Zillow Data Extraction  
     - Step 2: AI Investment Scoring  
     - Step 3: Google Sheets Data Storage  
     - Data cleaning node annotation  
     - Process batching annotation  

9. **Validate credentials and run**  
   - Ensure Apify OAuth2, OpenAI API, and Google Sheets OAuth2 credentials are correctly configured and authorized.  
   - Test workflow execution with sample data to check data flow, scoring output, and sheet updates.

---

### 5. General Notes & Resources

| Note Content                                                                                                                | Context or Link                                                                                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates real estate data collection and AI analysis using Apify, OpenAI, and Google Sheets. Requires valid API keys. | General project overview and prerequisites.                                                                                                                       |
| Scoring logic and critical investment filters are embedded in the OpenAI prompt for explainable and customizable investment analysis. | Enables users to adjust scoring criteria easily by modifying the AI prompt.                                                                                        |
| Google Sheets integration supports append or update operations keyed on property URL to prevent duplicates.                   | Use this feature to maintain a clean and up-to-date property database.                                                                                            |
| The workflow uses community nodes and may require updates to nodes or credentials for continued compatibility.                | Monitor n8n community releases for node updates and API changes.                                                                                                 |
| Apify actor IDs and Google Sheet IDs are placeholders and must be replaced with user-specific resources.                      | Replace actor and document IDs to match your Apify actors and Google Sheets documents.                                                                            |
| [Apify Documentation](https://docs.apify.com/), [OpenAI API](https://platform.openai.com/docs/api-reference), [n8n Docs](https://docs.n8n.io/) | Official documentation resources for technical reference and troubleshooting.                                                                                     |

---

**Disclaimer:** The provided text derives exclusively from an n8n automated workflow. It respects all current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly available.