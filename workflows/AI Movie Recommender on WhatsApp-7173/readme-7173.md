AI Movie Recommender on WhatsApp

https://n8nworkflows.xyz/workflows/ai-movie-recommender-on-whatsapp-7173


# AI Movie Recommender on WhatsApp

### 1. Workflow Overview

The **AI Movie Recommender on WhatsApp** workflow enables users to interact via WhatsApp to receive movie recommendations or streaming availability information powered by AI and third-party APIs. It processes incoming WhatsApp messages to understand user intent, fetches movie data from TMDb, retrieves streaming availability from Watchmode, formats responses richly, and sends replies back through WhatsApp Business API.

The workflow is logically divided into the following functional blocks:

- **1.1 Input Reception**: Receives incoming WhatsApp messages via webhook.
- **1.2 AI Intent Analysis**: Uses an AI language model (Ollama) to parse and classify the user’s message into specific request types.
- **1.3 Request Routing**: Routes messages based on detected intent: specific movie query, genre-based recommendation, or streaming availability request.
- **1.4 Data Extraction & API Queries**: Extracts parameters (movie title or genre) and queries TMDb API for movie data and Watchmode API for streaming availability.
- **1.5 Response Formatting**: Formats the retrieved data into user-friendly WhatsApp messages using custom JavaScript.
- **1.6 Message Sending**: Prepares and sends the WhatsApp message response through the WhatsApp Business API.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Listens for incoming WhatsApp messages, triggering the workflow.
- **Nodes Involved:**  
  - WhatsApp Webhook Trigger
- **Node Details:**

| Node Name                | Details                                                                                                                                                                                                                           |
|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| WhatsApp Webhook Trigger  | - Type: Webhook (HTTP POST) <br> - Role: Entry point, receives WhatsApp messages posted to a defined webhook path. <br> - Config: Path `daa6c91b-b1f7-430d-8ff1-c6afc19cdd40`, HTTP Method POST <br> - Inputs: External WhatsApp webhook calls <br> - Outputs: Passes message JSON to AI Intent Analysis <br> - Errors: Network issues, webhook misconfiguration, unauthorized requests <br> - Notes: Requires correct WhatsApp Business API webhook setup |

#### 2.2 AI Intent Analysis

- **Overview:** Uses AI to analyze the incoming message text and classify the request type into one of three categories: specific movie, genre recommendation, or streaming info query.
- **Nodes Involved:**  
  - Ollama Model  
  - Analyze WhatsApp Message
- **Node Details:**

| Node Name          | Details                                                                                                                                                                                                                                                                                      |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Ollama Model       | - Type: AI Language Model (Langchain Ollama Chat) <br> - Role: Provides large language model inference using Ollama endpoint <br> - Config: Model `llama3.2-16000:latest` <br> - Credentials: Ollama API key <br> - Inputs: Receives text prompt from Analyze WhatsApp Message <br> - Outputs: Model response JSON for analysis <br> - Errors: API quota, endpoint downtime, invalid credentials |
| Analyze WhatsApp Message | - Type: Langchain Agent <br> - Role: Applies prompt engineering to parse message text and extract intent in a fixed format (`specific:MovieName`, `genre:GenreName`, `where:MovieName`) <br> - Config: Custom system message describing format and examples <br> - Input: `$json.body.message` from webhook <br> - Output: Parsed intent string to Check Request Type node <br> - Errors: Parsing failures, unexpected message formats |

#### 2.3 Request Routing

- **Overview:** Determines the user’s request type by inspecting the AI output string and routes accordingly.
- **Nodes Involved:**  
  - Check Request Type (If node)  
  - Check Where Request (If node)
- **Node Details:**

| Node Name           | Details                                                                                                                                                                                                                              |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Check Request Type   | - Type: Conditional (If) <br> - Role: Checks if AI output contains `"specific:"` <br> - Input: AI output string <br> - True Output: Extract Movie Title node <br> - False Output: Check Where Request node <br> - Errors: Expression evaluation errors if AI output missing or malformed |
| Check Where Request  | - Type: Conditional (If) <br> - Role: Checks if AI output contains `"where:"` to detect streaming info request <br> - True Output: Extract Movie Title node (for streaming info) <br> - False Output: Extract Genre node (genre recommendations) <br> - Errors: Expression evaluation errors |

#### 2.4 Data Extraction & API Queries

- **Overview:** Extracts parameters from the AI output and queries external APIs (TMDb and Watchmode) to get movie or streaming data.
- **Nodes Involved:**  
  - Extract Movie Title (Set node)  
  - Extract Genre (Set node)  
  - Search Specific Movie (HTTP Request)  
  - Search Movies by Genre (HTTP Request)  
  - Get Streaming Availability (HTTP Request)
- **Node Details:**

| Node Name             | Details                                                                                                                                                                                                                                                              |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Extract Movie Title    | - Type: Set <br> - Role: Parses movie title from AI output (string after `"specific:"` or `"where:"`) <br> - Extracts phone number from webhook JSON for response <br> - Output: JSON with `movie_title` and `phone_number` <br> - Errors: Missing or malformed AI output string |
| Extract Genre          | - Type: Set <br> - Role: Parses genre name from AI output (string after `"genre:"`) <br> - Extracts phone number from webhook JSON <br> - Output: JSON with `genre` and `phone_number` <br> - Errors: Unknown or unsupported genre values |
| Search Specific Movie  | - Type: HTTP Request <br> - Role: Calls TMDb `/search/movie` with extracted movie title <br> - Config: API key parameter, query based on `movie_title` <br> - Output: Movie search results JSON <br> - Errors: API key invalid, rate limits, no results found |
| Search Movies by Genre | - Type: HTTP Request <br> - Role: Calls TMDb `/discover/movie` endpoint with genre filter <br> - Config: API key, genre ID mapped from genre string (e.g. horror → 27) <br> - Output: List of movies matching genre <br> - Errors: Invalid genre mapping, API failures |
| Get Streaming Availability | - Type: HTTP Request <br> - Role: Calls Watchmode API `/title/{id}/details/` endpoint with movie ID to fetch streaming sources <br> - Config: API key, movie ID from TMDb search result <br> - Output: Streaming availability data <br> - Errors: Invalid API key, movie ID missing, Watchmode API errors |

#### 2.5 Response Formatting

- **Overview:** Formats movie and streaming data into user-friendly text messages with emojis and structured layout for WhatsApp.
- **Nodes Involved:**  
  - Format Genre Recommendations (Code)  
  - Format Streaming Response (Code)  
  - Prepare WhatsApp Message (Code)
- **Node Details:**

| Node Name                  | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Format Genre Recommendations | - Type: Code (JavaScript) <br> - Role: Formats top 5 movies from genre query into a WhatsApp message string with title, year, rating, and short overview <br> - Inputs: Movie list JSON, genre string, phone number <br> - Outputs: JSON with `phone_number`, formatted `message`, and type `'genre_recommendations'` <br> - Edge Cases: Handles missing rating or overview gracefully, limited to 5 movies <br> - Errors: JS runtime errors, missing data |
| Format Streaming Response     | - Type: Code (JavaScript) <br> - Role: Formats a specific movie’s details plus streaming availability sources into WhatsApp-friendly message <br> - Inputs: TMDb movie info, Watchmode streaming sources, phone number <br> - Outputs: JSON with `phone_number`, formatted `message`, type `'streaming_info'` or `'error'` if movie not found <br> - Edge Cases: No streaming sources available, missing movie data <br> - Errors: JS runtime errors, no results from TMDb |
| Prepare WhatsApp Message      | - Type: Code (JavaScript) <br> - Role: Constructs WhatsApp API message payload JSON, setting recipient, message type, and text body <br> - Inputs: JSON with phone number and message text <br> - Outputs: Payload formatted for WhatsApp Business API <br> - Errors: Malformed phone number or message content |

#### 2.6 Message Sending

- **Overview:** Sends the formatted message to the user via WhatsApp Business API.
- **Nodes Involved:**  
  - Send WhatsApp Response (HTTP Request)
- **Node Details:**

| Node Name             | Details                                                                                                                                                                                                                                 |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Send WhatsApp Response | - Type: HTTP Request <br> - Role: Sends message payload to WhatsApp Cloud API endpoint for message delivery <br> - Config: URL with phone number ID, OAuth2 or other credential <br> - Input: Prepared WhatsApp message JSON <br> - Errors: Authentication failure, rate limits, invalid phone number |

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                          | Input Node(s)                    | Output Node(s)                     | Sticky Note                                                                                                                                                           |
|---------------------------|----------------------------------|----------------------------------------|---------------------------------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| WhatsApp Webhook Trigger   | Webhook                          | Entry point, receive WhatsApp messages | None                            | Analyze WhatsApp Message          | ## Message Processing: WhatsApp webhook receives messages → AI analyzes intent → Routes to appropriate handler                                                   |
| Ollama Model              | AI Language Model (Langchain)    | Provide AI inference for message parse | Analyze WhatsApp Message (ai LM) | Analyze WhatsApp Message          |                                                                                                                                                                     |
| Analyze WhatsApp Message  | Langchain Agent                  | Parse and classify user message intent | WhatsApp Webhook Trigger        | Check Request Type                |                                                                                                                                                                     |
| Check Request Type        | If                              | Route by request type (specific movie) | Analyze WhatsApp Message         | Extract Movie Title, Check Where Request | ## Request Routing: Determines if user wants specific movie info, genre recommendations, or streaming availability                                                  |
| Check Where Request       | If                              | Further route for streaming ("where:") | Check Request Type              | Extract Movie Title, Extract Genre |                                                                                                                                                                     |
| Extract Movie Title       | Set                             | Extract movie title and phone number   | Check Request Type, Check Where Request | Search Specific Movie           | ## API Integration: TMDb for movie search → Watchmode for streaming → Format response → Send via WhatsApp                                                          |
| Extract Genre             | Set                             | Extract genre and phone number          | Check Where Request             | Search Movies by Genre            |                                                                                                                                                                     |
| Search Specific Movie     | HTTP Request                    | Query TMDb API for specific movie       | Extract Movie Title             | Get Streaming Availability       |                                                                                                                                                                     |
| Search Movies by Genre    | HTTP Request                    | Query TMDb API for genre-based movies   | Extract Genre                  | Format Genre Recommendations     |                                                                                                                                                                     |
| Get Streaming Availability| HTTP Request                    | Query Watchmode API for streaming info | Search Specific Movie           | Format Streaming Response        |                                                                                                                                                                     |
| Format Genre Recommendations | Code (JavaScript)             | Format genre movie list for WhatsApp    | Search Movies by Genre          | Prepare WhatsApp Message          | ## Response Formatting: Custom JS formats movie data with emojis, ratings, and streaming platforms for WhatsApp                                                    |
| Format Streaming Response | Code (JavaScript)               | Format streaming info message            | Get Streaming Availability      | Send WhatsApp Response            |                                                                                                                                                                     |
| Prepare WhatsApp Message  | Code (JavaScript)               | Prepare WhatsApp API message payload     | Format Genre Recommendations   | Send WhatsApp Response            |                                                                                                                                                                     |
| Send WhatsApp Response    | HTTP Request                    | Send message via WhatsApp Business API  | Prepare WhatsApp Message, Format Streaming Response | None                           |                                                                                                                                                                     |
| Overview                  | Sticky Note                    | Project overview and feature summary    | None                          | None                            | ## Movie Recommendation WhatsApp Bot: Features genre recommendations, streaming info, WhatsApp integration, TMDb & Watchmode APIs                                  |
| Setup Guide               | Sticky Note                    | Setup instructions and API keys required | None                          | None                            | ## Setup Instructions: APIs required (TMDb, Watchmode, WhatsApp Business), configure keys, webhook, Ollama model                                                     |
| Message Processing        | Sticky Note                    | Explains message reception and AI analysis | None                          | None                            | ## Message Processing: WhatsApp webhook receives messages → AI analyzes intent → Routes to appropriate handler                                                   |
| Request Routing           | Sticky Note                    | Explains routing logic based on intent  | None                          | None                            | ## Request Routing: Determines if user wants specific movie info, genre recommendations, or streaming availability                                                |
| API Integration           | Sticky Note                    | Explains API usage flow                  | None                          | None                            | ## API Integration: TMDb for movie search → Watchmode for streaming → Format response → Send via WhatsApp                                                          |
| Response Formatting       | Sticky Note                    | Explains custom formatting with JS       | None                          | None                            | ## Response Formatting: Custom JS formats movie data with emojis, ratings, and streaming platforms for WhatsApp                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Name: `WhatsApp Webhook Trigger`  
   - HTTP Method: POST  
   - Path: Unique string (e.g. `daa6c91b-b1f7-430d-8ff1-c6afc19cdd40`)  
   - Purpose: Receive incoming WhatsApp messages  

2. **Create AI Language Model Node**  
   - Type: Langchain Ollama Chat Model  
   - Name: `Ollama Model`  
   - Model: `llama3.2-16000:latest`  
   - Credentials: Configure Ollama API access  
   - Connect output to `Analyze WhatsApp Message` node  

3. **Create Langchain Agent Node for Text Analysis**  
   - Type: Langchain Agent  
   - Name: `Analyze WhatsApp Message`  
   - Prompt: System message instructing to parse user message and return intent in format:  
     ```
     specific:MovieName
     genre:GenreName
     where:MovieName
     ```  
   - Input Expression: `{{$json.body.message}}` from webhook node  
   - Connect output to `Check Request Type` node  

4. **Create Conditional Node to Check for Specific Movie Request**  
   - Type: If  
   - Name: `Check Request Type`  
   - Condition: Check if AI output string contains `"specific:"`  
   - True branch: Connect to `Extract Movie Title` node  
   - False branch: Connect to `Check Where Request` node  

5. **Create Conditional Node to Check for Streaming Info Request**  
   - Type: If  
   - Name: `Check Where Request`  
   - Condition: Check if AI output contains `"where:"`  
   - True branch: Connect to `Extract Movie Title` node  
   - False branch: Connect to `Extract Genre` node  

6. **Create Set Node to Extract Movie Title**  
   - Type: Set  
   - Name: `Extract Movie Title`  
   - Set variables:  
     - `movie_title`: Expression to extract substring after colon from AI output  
     - `phone_number`: Extract from webhook JSON path `body.from`  
   - Connect output to `Search Specific Movie` node  

7. **Create Set Node to Extract Genre**  
   - Type: Set  
   - Name: `Extract Genre`  
   - Set variables:  
     - `genre`: Expression to extract substring after colon from AI output  
     - `phone_number`: Extract from webhook JSON path `body.from`  
   - Connect output to `Search Movies by Genre` node  

8. **Create HTTP Request Node to Search Specific Movie (TMDb)**  
   - Type: HTTP Request  
   - Name: `Search Specific Movie`  
   - Method: GET  
   - URL: `https://api.themoviedb.org/3/search/movie`  
   - Query parameters:  
     - `api_key`: Your TMDb API key  
     - `query`: Use `movie_title` from previous node  
   - Authentication: Predefined credential with TMDb API key  
   - Connect output to `Get Streaming Availability` node  

9. **Create HTTP Request Node to Search Movies by Genre (TMDb)**  
   - Type: HTTP Request  
   - Name: `Search Movies by Genre`  
   - Method: GET  
   - URL: `https://api.themoviedb.org/3/discover/movie`  
   - Query parameters:  
     - `api_key`: Your TMDb API key  
     - `with_genres`: Map genre name string to TMDb genre ID (e.g., horror → 27)  
     - `sort_by`: `popularity.desc`  
     - `page`: `1`  
   - Authentication: Predefined TMDb API credentials  
   - Connect output to `Format Genre Recommendations` node  

10. **Create HTTP Request Node to Get Streaming Availability (Watchmode)**  
    - Type: HTTP Request  
    - Name: `Get Streaming Availability`  
    - Method: GET  
    - URL: `https://api.watchmode.com/v1/title/{{ $json.results[0].id }}/details/`  
    - Query parameters:  
      - `apiKey`: Your Watchmode API key  
      - `append_to_response`: `sources`  
    - Connect output to `Format Streaming Response` node  

11. **Create Code Node to Format Genre Recommendations**  
    - Type: Code (JavaScript)  
    - Name: `Format Genre Recommendations`  
    - Code: Format top 5 movies with title, year, rating, and brief overview, emoji decorate, include phone number  
    - Output JSON: `{ phone_number, message, type: 'genre_recommendations' }`  
    - Connect output to `Prepare WhatsApp Message` node  

12. **Create Code Node to Format Streaming Information**  
    - Type: Code (JavaScript)  
    - Name: `Format Streaming Response`  
    - Code: Format selected movie info plus streaming sources into detailed WhatsApp message, handle no results gracefully  
    - Output JSON: `{ phone_number, message, type: 'streaming_info' or 'error' }`  
    - Connect output to `Send WhatsApp Response` node  

13. **Create Code Node to Prepare WhatsApp Message Payload**  
    - Type: Code (JavaScript)  
    - Name: `Prepare WhatsApp Message`  
    - Code: Construct WhatsApp Business API message payload with `messaging_product: "whatsapp"`, `to: phone_number`, `type: "text"`, and `text.body` = message text  
    - Connect output to `Send WhatsApp Response` node  

14. **Create HTTP Request Node to Send WhatsApp Response**  
    - Type: HTTP Request  
    - Name: `Send WhatsApp Response`  
    - Method: POST  
    - URL: `https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages`  
    - Authentication: OAuth2 or other WhatsApp Business API credential  
    - Body: JSON from previous node  
    - Final node in the flow  

15. **Connect all nodes accordingly as per the routing logic and test end-to-end**  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                         | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Movie Recommendation WhatsApp Bot features: genre recommendations, specific movie streaming info, WhatsApp integration, TMDb and Watchmode API usage.                                                                                                              | Overview sticky note in workflow                                                                    |
| Setup Instructions: Requires TMDb API (https://www.themoviedb.org), Watchmode API (https://www.watchmode.com), WhatsApp Business API (Meta Developer Account). Configure API keys in HTTP request nodes, set webhook URL, and configure Ollama API.                   | Setup Guide sticky note in workflow                                                                 |
| Example user messages supported: "I want horror movies", "Where can I watch Avengers?", "Recommend me comedy films".                                                                                                                                              | Setup Guide sticky note                                                                              |
| Message processing flow: WhatsApp webhook receives messages → AI analyzes intent → Routes to appropriate handler.                                                                                                                                                 | Message Processing sticky note                                                                      |
| Request routing logic: Determines if user wants specific movie info, genre recommendations, or streaming availability.                                                                                                                                             | Request Routing sticky note                                                                         |
| API flow: TMDb for search and discovery → Watchmode for streaming availability → Custom JS for formatting → Send WhatsApp message.                                                                                                                                 | API Integration sticky note                                                                         |
| Response formatting: Custom JavaScript uses emojis, ratings, and streaming platform details to enhance WhatsApp message readability.                                                                                                                               | Response Formatting sticky note                                                                     |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, respecting all applicable content policies. It contains no illegal, offensive, or protected content. All data handled are legal and public.