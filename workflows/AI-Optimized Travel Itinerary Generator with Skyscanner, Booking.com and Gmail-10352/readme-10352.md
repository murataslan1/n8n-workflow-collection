AI-Optimized Travel Itinerary Generator with Skyscanner, Booking.com and Gmail

https://n8nworkflows.xyz/workflows/ai-optimized-travel-itinerary-generator-with-skyscanner--booking-com-and-gmail-10352


# AI-Optimized Travel Itinerary Generator with Skyscanner, Booking.com and Gmail

### 1. Workflow Overview

This workflow automates the generation of AI-optimized travel itineraries by aggregating flight, hotel, activity, and weather data from multiple external APIs, then scoring and ranking options using AI, and finally delivering personalized travel plans via Gmail and Slack. It targets use cases such as corporate travel planning, vacation itinerary generation, and group trip coordination.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Extraction:** Receives travel search requests via a webhook and extracts input parameters.
- **1.2 Data Gathering from Multiple APIs:** In parallel, queries flight data (Skyscanner and Kiwi), hotel availability (Booking.com), local activities (Viator), and weather forecast (OpenWeatherMap).
- **1.3 Data Merging and Itinerary Construction:** Consolidates API responses, builds enriched itineraries combining flights, hotels, activities, and weather.
- **1.4 AI-Based Itinerary Scoring and Recommendation:** Uses an AI agent to analyze itineraries and assign recommendation scores with reasoning.
- **1.5 HTML Email Generation and Delivery:** Creates a premium-styled HTML email containing ranked itineraries and sends it via Gmail.
- **1.6 Notification and Webhook Response:** Sends a Slack notification about the new itinerary and responds to the original webhook request confirming success.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Extraction

**Overview:**  
Receives incoming travel search requests via HTTP POST webhook, extracting key parameters such as destination, departure city, travel dates, number of travelers, and email address.

**Nodes Involved:**  
- Webhook - Travel Request  
- Extract Request Data

**Node Details:**  

- **Webhook - Travel Request**  
  - Type: Webhook  
  - Role: Entry point for receiving POST requests on `/travel-search` path.  
  - Configuration: HTTP POST method, response mode set to output node response.  
  - Inputs: External HTTP request  
  - Outputs: JSON body of the request  
  - Failures: Missing or malformed request body may cause extraction errors.

- **Extract Request Data**  
  - Type: Set node  
  - Role: Extracts and normalizes request body parameters with fallbacks (e.g., default destination as "Shanghai", default travelers as 1).  
  - Key expressions: Uses expressions to read `$json.body` fields with default values.  
  - Inputs: Webhook output  
  - Outputs: Structured JSON with keys: destination, departureCity, checkInDate, checkOutDate, travelers, email  
  - Failures: Missing required fields like email or dates could cause downstream API request failures.

---

#### 2.2 Data Gathering from Multiple APIs

**Overview:**  
Parallel execution of API calls to gather travel-related data: flight options from Skyscanner and Kiwi, hotel options from Booking.com, local activities from Viator, and weather forecast from OpenWeatherMap.

**Nodes Involved:**  
- Search Flights - Skyscanner  
- Search Alternative Flights - Kiwi  
- Search Hotels - Booking.com  
- Search Local Activities - Viator  
- Get Weather Forecast

**Node Details:**  

- **Search Flights - Skyscanner**  
  - Type: HTTP Request  
  - Role: Searches live flights via Skyscanner API.  
  - Configuration: POST with nested JSON body specifying market, locale, currency, origin/destination IATA codes, travel dates, adults, economy cabin.  
  - Headers: Uses RapidAPI key and host from credentials.  
  - Inputs: Extracted request data  
  - Outputs: Flight search JSON result  
  - Failures: Auth errors from invalid API key, JSON parse errors if API response malformed, missing IATA codes.

- **Search Alternative Flights - Kiwi**  
  - Type: HTTP Request  
  - Role: Alternative flight search via Kiwi API (Tequila).  
  - Configuration: GET request with parameters (not fully detailed in JSON, assumed credential-based auth).  
  - Inputs: Extracted request data  
  - Outputs: Kiwi flights JSON data  
  - Failures: API rate limits, auth errors, missing parameters.

- **Search Hotels - Booking.com**  
  - Type: HTTP Request  
  - Role: Searches hotels for specified city and dates.  
  - Configuration: GET with query parameters for city type, destination ID (uses destination string), check-in/out dates, number of adults, ordering by price, metric units, one room.  
  - Headers: Uses RapidAPI key and host credentials.  
  - Inputs: Extracted request data  
  - Outputs: Hotel search results JSON  
  - Failures: City name as dest_id may cause mismatch if not valid Booking.com ID, auth errors, missing dates.

- **Search Local Activities - Viator**  
  - Type: HTTP Request  
  - Role: Searches for local activities and tours via Viator API.  
  - Configuration: GET request authenticated via RapidAPI.  
  - Inputs: Extracted request data  
  - Outputs: Activities JSON data  
  - Failures: API limits, invalid location, auth errors.

- **Get Weather Forecast**  
  - Type: HTTP Request  
  - Role: Retrieves weather forecast for travel location via OpenWeatherMap.  
  - Configuration: GET request with API key and location parameters expected (not fully detailed).  
  - Inputs: Extracted request data  
  - Outputs: Weather forecast JSON  
  - Failures: Missing or invalid API key, invalid location, network timeout.

---

#### 2.3 Data Merging and Itinerary Construction

**Overview:**  
Combines all API responses into a unified data structure and processes the raw data into enhanced travel itineraries, pairing flights, hotels, activities, and weather summaries.

**Nodes Involved:**  
- Merge All Data Sources  
- Enhanced Itinerary Builder

**Node Details:**  

- **Merge All Data Sources**  
  - Type: Code (JavaScript)  
  - Role: Aggregates JSON results from flights (Skyscanner + Kiwi), hotels, weather, and activities into a single object keyed by data source.  
  - Inputs: Outputs of all API nodes grouped by Extract Request Data.  
  - Outputs: Single JSON payload consolidating all data sets and original request info.  
  - Failures: Missing data from any upstream node could cause undefined errors.

- **Enhanced Itinerary Builder**  
  - Type: Code (JavaScript)  
  - Role: Parses merged data to extract relevant fields and formats for flights, hotels, and activities; calculates total prices; associates weather summary; builds up to 8 combined itineraries.  
  - Key logic:  
    - Parses Skyscanner and Kiwi flight data into uniform objects with airline, timings, stops, price, booking links.  
    - Parses Booking.com hotels with name, rating, price, location, booking links.  
    - Summarizes weather temperature and conditions.  
    - Selects top activities.  
    - Constructs itinerary objects combining flight, hotel, activities, weather, total price, and traveler info.  
    - Sorts and limits itineraries by price ascending.  
  - Inputs: Merged data JSON  
  - Outputs: Array of enriched itinerary JSON objects  
  - Failures: Missing or malformed data fields, empty API results, logic errors in parsing.

---

#### 2.4 AI-Based Itinerary Scoring and Recommendation

**Overview:**  
Uses an AI agent to analyze each itinerary's flight, hotel, and activities combination, scoring and providing qualitative recommendations with reasoning, highlights, and warnings.

**Nodes Involved:**  
- OpenRouter Chat Model  
- AI Agent - Itinerary Optimizer  
- AI Score & Recommendations

**Node Details:**  

- **OpenRouter Chat Model**  
  - Type: AI Language Model (OpenRouter)  
  - Role: Provides large language model capability using the "qwen/qwen3-vl-8b-thinking" model.  
  - Configuration: No additional prompt customization; used as base LM for AI Agent.  
  - Inputs: Not directly connected to raw data; serves AI Agent.  
  - Credentials: OpenRouter API key configured.  
  - Failures: API key invalid, rate limits, model errors.

- **AI Agent - Itinerary Optimizer**  
  - Type: n8n LangChain Agent  
  - Role: Receives flight and hotel combinations, instructs AI to score each itinerary on price, flight convenience, hotel quality, and overall experience; requests JSON formatted output with score, reasoning, highlights, warnings.  
  - Configuration: System message defines criteria and expected output format.  
  - Inputs: Enriched itineraries from Enhanced Itinerary Builder  
  - Outputs: AI analysis JSON string or object  
  - Failures: AI response parsing errors, timeouts, incomplete responses.

- **AI Score & Recommendations**  
  - Type: Code (JavaScript)  
  - Role: Parses AI output JSON string into usable objects, merges AI scores and reasoning into itineraries, applies fallback scores if AI output missing or invalid, sorts itineraries by AI score descending.  
  - Inputs: Itineraries + AI Agent output  
  - Outputs: AI-enriched itinerary JSONs  
  - Failures: JSON parse exceptions, missing AI data fallback logic included.

---

#### 2.5 HTML Email Generation and Delivery

**Overview:**  
Generates a visually rich, branded HTML email summarizing top AI-ranked itineraries with detailed flight, hotel, activity, and weather info; sends email to user via Gmail; sends Slack notification.

**Nodes Involved:**  
- Generate Premium HTML Email  
- Send Email via Gmail  
- Send Slack Notification

**Node Details:**  

- **Generate Premium HTML Email**  
  - Type: Code (JavaScript)  
  - Role: Builds an HTML document string embedding itinerary details, AI scores, price comparisons, and travel tips with custom CSS styling for a professional look.  
  - Inputs: AI-scored itinerary array  
  - Outputs: JSON containing `html` string and itineraries data for email body  
  - Failures: Large payload size, encoding issues, empty itinerary list fallback.

- **Send Email via Gmail**  
  - Type: Gmail node  
  - Role: Sends the generated HTML email to the requester's email address with a subject referencing the destination.  
  - Configuration: Uses Gmail OAuth2 credentials, sets recipient from webhook input, HTML email body.  
  - Inputs: HTML output from previous node  
  - Outputs: Email send confirmation  
  - Failures: Gmail auth errors, invalid email address, quota exceedance.

- **Send Slack Notification**  
  - Type: Slack node  
  - Role: Posts a notification message to a configured Slack channel summarizing the itinerary sent, including route, email, best deal price, and AI score.  
  - Configuration: Uses OAuth2 Slack credentials.  
  - Inputs: Extract Request Data and AI Score & Recommendations nodes via expressions.  
  - Outputs: Slack message confirmation  
  - Failures: Slack token invalid, channel not found, rate limits.

---

#### 2.6 Notification and Webhook Response

**Overview:**  
Finalizes the workflow by responding to the initial webhook request confirming successful email dispatch and providing summary data including itineraries count, best deal price, and AI score.

**Nodes Involved:**  
- Respond to Webhook

**Node Details:**  

- **Respond to Webhook**  
  - Type: Respond to Webhook  
  - Role: Returns a JSON response to the original HTTP request with success status, message, number of itineraries generated, recipient email, best deal price, and AI score.  
  - Inputs: After Send Email via Gmail and Send Slack Notification nodes  
  - Outputs: HTTP JSON response  
  - Failures: Missing data due to earlier node failure, timeout if delayed.

---

### 3. Summary Table

| Node Name                     | Node Type                     | Functional Role                             | Input Node(s)                         | Output Node(s)                             | Sticky Note                                                                                   |
|-------------------------------|-------------------------------|---------------------------------------------|-------------------------------------|--------------------------------------------|----------------------------------------------------------------------------------------------|
| Webhook - Travel Request       | Webhook                       | Receives travel search HTTP POST requests   | External HTTP                      | Extract Request Data                        | ## Introduction Automates travel planning by aggregating flights, hotels, activities, and weather via APIs, then uses AI to generate professional itineraries delivered through Gmail and Slack. |
| Extract Request Data           | Set                          | Extracts and normalizes request parameters  | Webhook - Travel Request           | Search Flights - Skyscanner; Search Hotels - Booking.com; Search Alternative Flights - Kiwi; Get Weather Forecast; Search Local Activities - Viator |                                                                                              |
| Search Flights - Skyscanner    | HTTP Request                 | Fetches live flight options from Skyscanner | Extract Request Data               | Combine & Rank Itineraries; Merge All Data Sources |                                                                                              |
| Search Hotels - Booking.com    | HTTP Request                 | Fetches hotel options from Booking.com       | Extract Request Data               | Combine & Rank Itineraries; Merge All Data Sources |                                                                                              |
| Search Alternative Flights - Kiwi | HTTP Request             | Fetches alternative flight options from Kiwi | Extract Request Data               | Merge All Data Sources                      |                                                                                              |
| Get Weather Forecast           | HTTP Request                 | Retrieves weather forecast data               | Extract Request Data               | Merge All Data Sources                      |                                                                                              |
| Search Local Activities - Viator | HTTP Request               | Retrieves local activities and tours          | Extract Request Data               | Merge All Data Sources                      |                                                                                              |
| Merge All Data Sources         | Code                         | Aggregates all API data into unified object | Search Alternative Flights - Kiwi; Get Weather Forecast; Search Local Activities - Viator; Search Flights - Skyscanner; Search Hotels - Booking.com | Enhanced Itinerary Builder                |                                                                                              |
| Enhanced Itinerary Builder     | Code                         | Builds enriched itineraries combining all data | Merge All Data Sources             | AI Agent - Itinerary Optimizer; AI Score & Recommendations |                                                                                              |
| OpenRouter Chat Model          | AI Language Model (OpenRouter) | Provides AI language model for itinerary analysis | AI Agent - Itinerary Optimizer (ai_languageModel) | AI Agent - Itinerary Optimizer            |                                                                                              |
| AI Agent - Itinerary Optimizer | LangChain Agent              | Scores itineraries with AI reasoning          | Enhanced Itinerary Builder         | AI Score & Recommendations                  |                                                                                              |
| AI Score & Recommendations     | Code                         | Parses AI output, merges scores, sorts itineraries | AI Agent - Itinerary Optimizer; Enhanced Itinerary Builder | Generate Premium HTML Email                | ## Prerequisites - API keys: Skyscanner, Booking.com, Kiwi, Viator, OpenWeatherMap, OpenRouter - Gmail account - Slack workspace - n8n instance |
| Generate Premium HTML Email    | Code                         | Generates styled HTML email with itinerary details | AI Score & Recommendations         | Send Email via Gmail                        |                                                                                              |
| Send Email via Gmail           | Gmail                        | Sends generated email to user                 | Generate Premium HTML Email        | Respond to Webhook                          |                                                                                              |
| Send Slack Notification        | Slack                        | Sends Slack message notification               | Send Email via Gmail; Extract Request Data; AI Score & Recommendations | Respond to Webhook                          |                                                                                              |
| Respond to Webhook             | Respond to Webhook           | Sends HTTP response confirming completion     | Send Email via Gmail; Send Slack Notification | None                                       |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node: "Webhook - Travel Request"**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `travel-search`  
   - Response Mode: Response Node

2. **Add Set Node: "Extract Request Data"**  
   - Extract from `$json.body` the fields:  
     - `destination` (default: "Shanghai")  
     - `departureCity` (required)  
     - `checkInDate` (required)  
     - `checkOutDate` (required)  
     - `travelers` (default: 1)  
     - `email` (required)  
   - Connect Webhook output to this node.

3. **Create Parallel HTTP Request Nodes for Data Gathering:**

   - **"Search Flights - Skyscanner"**  
     - Method: POST  
     - URL: `https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create`  
     - Body: JSON with market "US", locale "en-US", currency "USD", queryLegs including origin and destination IATA codes, date (split checkInDate), adults, cabinClass economy.  
     - Headers: `X-RapidAPI-Key`, `X-RapidAPI-Host` (from RapidAPI credentials).  
     - Auth: HTTP Header Auth  
     - Input: Extract Request Data output.

   - **"Search Alternative Flights - Kiwi"**  
     - Method: GET  
     - URL: `https://api.tequila.kiwi.com/v2/search`  
     - Auth: Kiwi API key (RapidAPI or direct)  
     - Input: Extract Request Data output.

   - **"Search Hotels - Booking.com"**  
     - Method: GET  
     - URL: `https://booking-com.p.rapidapi.com/v1/hotels/search`  
     - Query parameters: dest_type=city, dest_id=destination, checkin_date, checkout_date, adults_number, order_by=price, units=metric, room_number=1  
     - Headers: RapidAPI key and host  
     - Auth: HTTP Header Auth  
     - Input: Extract Request Data output.

   - **"Get Weather Forecast"**  
     - Method: GET  
     - URL: `https://api.openweathermap.org/data/2.5/forecast`  
     - Query: City (destination), API Key from OpenWeatherMap credentials  
     - Input: Extract Request Data output.

   - **"Search Local Activities - Viator"**  
     - Method: GET  
     - URL: `https://viator-api.p.rapidapi.com/search`  
     - Headers: RapidAPI key and host  
     - Auth: HTTP Header Auth  
     - Input: Extract Request Data output.

4. **Create Code Node: "Merge All Data Sources"**  
   - Combine JSON outputs from all above API nodes into one JSON with structure:  
     - `flights.skyscanner`  
     - `flights.kiwi`  
     - `hotels`  
     - `weather`  
     - `activities`  
     - `request` (original parameters)  
   - Inputs: All API nodes in parallel.

5. **Create Code Node: "Enhanced Itinerary Builder"**  
   - Parse merged data to create uniform flight and hotel objects, summarize weather, select top activities.  
   - Build combined itineraries pairing flights (top 4) and hotels (top 2), including 3 activities each, total price calculation.  
   - Sort itineraries by total price ascending and limit to 8.  
   - Input: Merge All Data Sources.

6. **Add OpenRouter Chat Model Node: "OpenRouter Chat Model"**  
   - Model: "qwen/qwen3-vl-8b-thinking"  
   - Credentials: OpenRouter API Key

7. **Add LangChain AI Agent Node: "AI Agent - Itinerary Optimizer"**  
   - System message: Instruct AI to score itineraries on price, flight convenience, hotel quality, overall experience, returning JSON array with score, reasoning, highlights, warnings.  
   - Input: Enhanced Itinerary Builder output  
   - Connect AI languageModel input to OpenRouter Chat Model.

8. **Add Code Node: "AI Score & Recommendations"**  
   - Parse AI Agent output JSON string; merge scores and reasoning into itineraries.  
   - Sort by AI score descending.  
   - Input: AI Agent output and Enhanced Itinerary Builder output.

9. **Add Code Node: "Generate Premium HTML Email"**  
   - Generate styled HTML summarizing top itineraries with details, price matrix, AI tips.  
   - Input: AI Score & Recommendations output.

10. **Add Gmail Node: "Send Email via Gmail"**  
    - Recipient: Email from webhook request  
    - Subject: "🤖 AI-Optimized Travel Itinerary: [Destination] Trip"  
    - Body: HTML from previous node  
    - Credentials: Gmail OAuth2 configured  
    - Input: Generate Premium HTML Email output.

11. **Add Slack Node: "Send Slack Notification"**  
    - Message: Summary with route, email, best deal price, AI score  
    - Channel: e.g., #travel-bookings  
    - Credentials: Slack OAuth2  
    - Input: Send Email via Gmail output and Extract Request Data.

12. **Add Respond to Webhook Node: "Respond to Webhook"**  
    - Response: JSON confirming success, with message, itineraries count, email, best deal price, AI score  
    - Inputs: Send Email via Gmail and Send Slack Notification outputs.

13. **Connect Nodes According to the described flow:**  
    - Webhook → Extract Request Data → Parallel API calls → Merge All Data Sources → Enhanced Itinerary Builder → AI Agent → AI Score & Recommendations → Generate HTML → Send Email → Slack Notification → Respond to Webhook

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Automates travel planning by aggregating flights, hotels, activities, and weather via APIs, then uses AI to generate professional itineraries delivered through Gmail and Slack. | Sticky Note near Webhook node, introduction to workflow purpose |
| Workflow Template: Webhook → Extract → Parallel Searches (Flights/Hotels/Activities/Weather) → Merge → Build Itinerary → AI Processing → Score → Generate HTML → Gmail → Slack → Response | Sticky Note near Webhook node, high-level process description |
| Prerequisites: API keys for Skyscanner, Booking.com, Kiwi, Viator, OpenWeatherMap, OpenRouter; Gmail account; Slack workspace; n8n instance | Sticky Note near AI Score & Recommendations node, setup requirements |
| Use Cases: Corporate travel planning, vacation itinerary generation, group trip coordination | Sticky Note near AI Score & Recommendations node |
| Customization Options: Add sources (Airbnb, TripAdvisor), budget filters, PDF generation, Slack format customization | Sticky Note near AI Score & Recommendations node |
| Benefits: Saves 3-5 hours per trip, real-time pricing aggregation, AI-powered personalization, multi-channel automated delivery | Sticky Note near AI Score & Recommendations node |
| The AI Agent uses a custom prompt instructing it to score itineraries on price, convenience, hotel quality, and overall experience, returning structured JSON. | Derived from AI Agent - Itinerary Optimizer configuration |
| Emails use a professionally styled HTML template with embedded CSS for readability and branding, including AI scores and price comparison tables. | From Generate Premium HTML Email node code |

---

**Disclaimer:**  
The provided text is exclusively derived from an n8n automated workflow. It fully complies with content policies and contains no illegal, offensive, or protected content. All manipulated data is publicly available and legal.