Auto-Send Zillow Real Estate Listings to Telegram using ScrapeGraphAI

https://n8nworkflows.xyz/workflows/auto-send-zillow-real-estate-listings-to-telegram-using-scrapegraphai-6310


# Auto-Send Zillow Real Estate Listings to Telegram using ScrapeGraphAI

### 1. Workflow Overview

This workflow automates the extraction and distribution of real estate listings from Zillow to a Telegram channel. Its primary use case is to keep a Telegram audience updated with fresh property listings in a specific region (Ohio) by scraping Zillow at scheduled intervals, formatting the scraped data, and sending it as nicely formatted messages.

The workflow is logically structured into four main blocks:

- **1.1 Scheduled Trigger**: Periodically initiates the workflow execution.
- **1.2 Web Scraping via AI (ScrapeGraphAI)**: Scrapes Zillow’s real estate listings using a natural language prompt and a defined JSON schema.
- **1.3 Data Formatting**: Processes and formats the scraped listings into Telegram-friendly message text.
- **1.4 Telegram Messaging**: Sends the formatted listing messages to a specific Telegram channel.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:**  
This block triggers the workflow automatically at defined time intervals, ensuring the listings are scraped and sent regularly without manual intervention.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**

  - **Schedule Trigger**  
    - *Type:* Trigger node (Schedule Trigger)  
    - *Technical Role:* Starts workflow execution on a recurring schedule.  
    - *Configuration:* Default interval trigger (interval set to run periodically; exact interval not specified, default is every minute if empty).  
    - *Expressions/Variables:* None used.  
    - *Input:* None (trigger node).  
    - *Output:* Initiates execution to ScrapeGraphAI node.  
    - *Version-specific:* Version 1.2 - no special requirements.  
    - *Edge Cases:* Misconfiguration of interval could lead to too frequent or infrequent runs. Network or server downtime could prevent trigger execution.  
    - *Sub-workflow:* None.

#### 2.2 Web Scraping via AI (ScrapeGraphAI)

- **Overview:**  
This block uses the ScrapeGraphAI node to scrape Zillow for real estate listings. It sends a natural language prompt describing the data schema and target website URL, then receives structured listing data in JSON format.

- **Nodes Involved:**  
  - ScrapeGraphAI  
  - Sticky Note1 (documentation)

- **Node Details:**

  - **ScrapeGraphAI**  
    - *Type:* Integration node (ScrapeGraphAI)  
    - *Technical Role:* Extracts structured real estate listing data from Zillow using AI-powered scraping.  
    - *Configuration:*  
      - Website URL: Zillow search URL filtered for Ohio listings with various sale statuses enabled.  
      - User Prompt: Requests extraction of real estate listings with a detailed JSON schema for each listing (address, price, beds, baths, sqft, lot size, year built, property type, listing URL).  
      - Credentials: Requires valid ScrapeGraphAI API credentials.  
    - *Expressions/Variables:* Static URL and prompt text; no dynamic expressions.  
    - *Input:* Triggered by Schedule Trigger node.  
    - *Output:* JSON data containing listings under `result.real_estate_listings`.  
    - *Version-specific:* Version 1.  
    - *Edge Cases:*  
      - API authentication failure or quota exceeded.  
      - Web page structure changes causing incorrect data extraction.  
      - No listings found or empty results.  
      - Network timeouts.  
    - *Sub-workflow:* None.

  - **Sticky Note1**  
    - *Role:* Documentation explaining the ScrapeGraphAI node’s function and usage.  
    - *Content Highlights:* Describes how to input website URL and user prompt for scraping. Provides example usage.

#### 2.3 Data Formatting

- **Overview:**  
Processes the raw scraped data to format each listing into a Telegram-compatible markdown text message, including safety checks for missing fields and handling known data typos.

- **Nodes Involved:**  
  - Code  
  - Sticky Note2 (documentation)

- **Node Details:**

  - **Code**  
    - *Type:* Function node (Code)  
    - *Technical Role:* Formats each listing object into a rich, human-readable Telegram message string with markdown formatting.  
    - *Configuration:*  
      - JavaScript code parses input JSON, extracts listings array from multiple possible keys for robustness.  
      - Defines a helper function `formatForTelegram()` to build each message string.  
      - Handles null or missing fields gracefully (e.g., missing address, price).  
      - Corrects for a known typo in the input data property `year_bult` vs `year_built`.  
      - Returns an array of outputs, each containing one formatted listing message and original data for reference.  
    - *Expressions/Variables:* Accesses `$input.all()[0].json` for data, uses `new Date().toLocaleString()` for timestamp.  
    - *Input:* JSON listing data from ScrapeGraphAI node.  
    - *Output:* Multiple JSON objects, each with `text` field for Telegram message and other listing metadata.  
    - *Version-specific:* Version 2.  
    - *Edge Cases:*  
      - Listings array missing or empty (returns empty output).  
      - Unexpected data structure changes in scraped JSON.  
      - JavaScript runtime errors if input is malformed.  
    - *Sub-workflow:* None.

  - **Sticky Note2**  
    - *Role:* Documentation describing the formatting node’s purpose and output structure.  
    - *Content Highlights:* Explains preparation of data for Telegram, message formatting, and metadata preservation.

#### 2.4 Telegram Messaging

- **Overview:**  
Sends each formatted real estate listing message to a specified Telegram channel using a bot, retrying on failure to ensure delivery.

- **Nodes Involved:**  
  - Telegram  
  - Sticky Note (last one) (documentation)

- **Node Details:**

  - **Telegram**  
    - *Type:* Messaging node (Telegram)  
    - *Technical Role:* Sends messages to Telegram chat/channel using bot API.  
    - *Configuration:*  
      - Text: Uses expression `{{$json.text}}` to send formatted message from Code node.  
      - Chat ID: `@housingprices` (Telegram channel username).  
      - Credentials: Telegram API credentials (bot token) required.  
      - Retry: Up to 5 attempts with 5 seconds wait between tries on failure.  
      - Execute once: false (runs for each message).  
    - *Expressions/Variables:* Message text from previous node output.  
    - *Input:* Receives individual formatted listing messages from Code node.  
    - *Output:* None further in this workflow.  
    - *Version-specific:* Version 1.2.  
    - *Edge Cases:*  
      - Authentication errors due to invalid bot token.  
      - Chat ID invalid or bot not added to channel.  
      - Telegram API rate limits or downtime.  
      - Message formatting errors causing API rejection.  
    - *Sub-workflow:* None.

  - **Sticky Note**  
    - *Role:* Documentation for Telegram node usage.  
    - *Content Highlights:* Explains bot creation using @botfather, setting API key, and chat/channel username configuration.

---

### 3. Summary Table

| Node Name       | Node Type                   | Functional Role                | Input Node(s)         | Output Node(s)    | Sticky Note                                                                                         |
|-----------------|-----------------------------|-------------------------------|-----------------------|-------------------|---------------------------------------------------------------------------------------------------|
| Schedule Trigger| Schedule Trigger             | Initiates workflow on schedule| None                  | ScrapegraphAI      | # Step 1: Trigger ⏱️ This trigger will invoke the workflow on the mentioned time.                 |
| ScrapegraphAI   | ScrapeGraphAI               | Scrapes Zillow listings via AI| Schedule Trigger      | Code              | # Step 2: ScrapeGraphAI Node 🤖 This is the core node which will scrape the website that you want. |
| Code            | Function (Code)             | Formats scraped data for Telegram messages | ScrapegraphAI        | Telegram          | # Step 3: Format the response 🧱 This node will format the results for sheets.                     |
| Telegram        | Telegram                    | Sends formatted messages to Telegram channel | Code                 | None              | # Step 4:Telegram Node 📧 This node will send the listings to your given channel or chat           |
| Sticky Note1    | Sticky Note                 | Documentation for ScrapeGraphAI node | None                  | None              | See ScrapeGraphAI note above                                                                    |
| Sticky Note2    | Sticky Note                 | Documentation for Code node    | None                  | None              | See Code note above                                                                              |
| Sticky Note3    | Sticky Note                 | Documentation for Schedule Trigger | None                  | None              | See Schedule Trigger note above                                                                  |
| Sticky Note     | Sticky Note                 | Documentation for Telegram node| None                  | None              | See Telegram note above                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger node:**  
   - Node Type: Schedule Trigger  
   - Configuration: Set interval to desired frequency (default or custom). For example, run every hour or every day as needed.  
   - No credentials required.  
   - Connect output to ScrapeGraphAI node.

2. **Create the ScrapeGraphAI node:**  
   - Node Type: ScrapeGraphAI  
   - Credentials: Configure with valid ScrapeGraphAI API credentials.  
   - Parameters:  
     - Website URL: `https://www.zillow.com/homes/?category=SEMANTIC&searchQueryState=%7B%22filterState%22%3A%7B%22isRecentlySold%22%3A%7B%22value%22%3Afalse%7D%2C%22isPreMarketPreForeclosure%22%3A%7B%22value%22%3Afalse%7D%2C%22isPreMarketForeclosure%22%3A%7B%22value%22%3Afalse%7D%2C%22isForRent%22%3A%7B%22value%22%3Afalse%7D%2C%22isForSaleByAgent%22%3A%7B%22value%22%3Atrue%7D%2C%22isForSaleByOwner%22%3A%7B%22value%22%3Atrue%7D%2C%22isAuction%22%3A%7B%22value%22%3Atrue%7D%2C%22isComingSoon%22%3A%7B%22value%22%3Atrue%7D%2C%22isForSaleForeclosure%22%3A%7B%22value%22%3Atrue%7D%2C%22isNewConstruction%22%3A%7B%22value%22%3Atrue%7D%2C%22sortSelection%22%3A%7B%22value%22%3A%22globalrelevanceex%22%7D%7D%2C%22regionSelection%22%3A%5B%7B%22regionId%22%3A44%7D%5D%2C%22usersSearchTerm%22%3A%22Ohio%22%7D`  
     - User Prompt:  
       ```
       Extract real estate listings from this site. Use the following schema for response { 
         "address": "123 Main St, Columbus, OH 43215", 
         "price": "$450,000", 
         "beds": "3", 
         "baths": "2", 
         "sqft": "1,850", 
         "lot_size": "0.25 acres", 
         "year_built": "1995", 
         "property_type": "Single Family", 
         "listing_url": "https://www.zillow.com/homedetails/123-Main-St..."
       }
       ```  
   - Connect output to Code node.

3. **Create the Code node:**  
   - Node Type: Function (Code)  
   - Parameters: Paste the provided JavaScript code that processes the incoming JSON, formats each listing into a Telegram markdown message, and handles missing fields and typos.  
   - Connect output to Telegram node.

4. **Create the Telegram node:**  
   - Node Type: Telegram  
   - Credentials: Configure with your Telegram Bot API token (create bot via @botfather).  
   - Parameters:  
     - Chat ID: `@housingprices` (replace with your target Telegram channel or chat username).  
     - Text: Use expression `{{$json.text}}` to send the formatted message from Code node.  
     - Enable retry on failure with up to 5 attempts and 5 seconds delay between tries.  
   - Connect output to none (workflow ends here).

5. **(Optional) Add Sticky Notes:**  
   - Add documentation sticky notes near each block explaining their purpose and usage to improve maintainability.

6. **Activate the workflow:**  
   - Ensure all credentials are valid and tested.  
   - Activate the workflow to start scheduled execution.

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                                              |
|-------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| Create Telegram bot with @botfather to obtain API token. Add bot to your channel and assign permissions to send messages.      | Telegram Bot Setup                                           |
| ScrapeGraphAI requires API credentials and may have rate limits or usage quotas. Ensure your account is properly configured.   | ScrapeGraphAI API Documentation                              |
| Zillow website structure or URL parameters might change; update the scraping prompt and URL accordingly to maintain accuracy.  | Zillow Website & ScrapeGraphAI Prompt Maintenance            |
| The formatting code handles a known typo in scraped data: `year_bult` instead of `year_built`.                                 | Data Quality Note                                            |
| Retry logic on Telegram node helps mitigate transient network or API issues but monitor for persistent failures.               | Telegram API Reliability                                     |

---

**Disclaimer:**  
The provided text is derived exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.