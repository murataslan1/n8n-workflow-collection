AI-Generated Weather Analysis with NWS Alerts, Radar Imagery, and Home Assistant

https://n8nworkflows.xyz/workflows/ai-generated-weather-analysis-with-nws-alerts--radar-imagery--and-home-assistant-6188


# AI-Generated Weather Analysis with NWS Alerts, Radar Imagery, and Home Assistant

### 1. Workflow Overview

This workflow, titled **National Weather Service AI Analysis**, is designed to generate an AI-driven weather analysis combining National Weather Service (NWS) alerts, radar imagery, and local Home Assistant precipitation sensor data. It is targeted at users who want an automated, clear, and concise weather alert summary integrated with real-time radar and local sensor insights. The workflow is triggered via webhook with location coordinates and outputs a summarized weather alert and radar analysis.

The workflow logically divides into these blocks:

- **1.1 Input Reception:** Receives location data via webhook to start the analysis.
- **1.2 NWS Alerts Retrieval & Filtering:** Fetches active weather alerts from NWS for the location, filters by status, severity, effective time, and expiry, and aggregates alert details.
- **1.3 Local Weather & Radar Imagery Acquisition:** Retrieves local precipitation type from Home Assistant and downloads the latest radar animation GIF.
- **1.4 Radar Image AI Analysis:** Uses OpenAI to analyze the radar animation in combination with local sensor data to estimate current weather conditions.
- **1.5 Data Merging and Final AI Summary:** Combines radar analysis with NWS alerts and uses OpenAI chat model to generate a concise summary alert.
- **1.6 Output Preparation:** Formats the final summary for response.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** This block triggers the workflow via a webhook and accepts a JSON payload containing latitude and longitude.
- **Nodes Involved:**  
  - Webhook
- **Node Details:**  
  - **Webhook**  
    - Type: HTTP Webhook (Trigger)  
    - Configuration: POST method, response mode set to return data from the last executed node, path preset uniquely.  
    - Key Expressions: Reads `$json.body.latitude` and `$json.body.longitude` from incoming payload.  
    - Input: External HTTP POST request with JSON body containing coordinates.  
    - Output: Passes received coordinates to subsequent HTTP request node.  
    - Edge Cases: Missing or malformed latitude/longitude in payload will cause downstream query failures. Also, webhook path must be unique and externally accessible.

#### 1.2 NWS Alerts Retrieval & Filtering

- **Overview:** Retrieves active alerts for the given coordinate from the NWS API, splits the batch of alerts into individual items, removes irrelevant fields, and filters alerts by status, severity, effective time, and expiration.
- **Nodes Involved:**  
  - Get NWS Alerts  
  - Split Out  
  - Remove Irrelevant Fields  
  - Filter by Status  
  - Filter by Severity  
  - Filter by Effective  
  - Filter by Expired  
  - Aggregate  
  - Code
- **Node Details:**  
  - **Get NWS Alerts**  
    - Type: HTTP Request  
    - Configuration: GET request to `https://api.weather.gov/alerts` with query parameters `status=actual` and `point=latitude,longitude` from webhook.  
    - Output: Full JSON response with alerts array in `body.features`.  
    - Edge Cases: API rate limits, invalid coordinates, network errors, or no alerts returned.  
  - **Split Out**  
    - Type: Split Out  
    - Configuration: Splits array in `body.features` to individual alert items.  
    - Input: JSON with array of features.  
  - **Remove Irrelevant Fields**  
    - Type: Set  
    - Configuration: Projects only essential alert fields (id, areaDesc, effective, expires, severity, certainty, status, headline, description, instruction, NWSheadline).  
    - Purpose: Simplifies data for filtering and summarization.  
  - **Filter by Status**  
    - Type: Filter  
    - Configuration: Keeps alerts where `properties.status` equals `Actual`.  
  - **Filter by Severity**  
    - Type: Filter  
    - Configuration: Keeps alerts with severity `Moderate`, `Severe`, or `Extreme`.  
  - **Filter by Effective**  
    - Type: Filter  
    - Configuration: Keeps alerts whose effective time is earlier or equal to current time (active alerts).  
  - **Filter by Expired**  
    - Type: Filter  
    - Configuration: Keeps alerts whose expires time is later or equal to current time (not expired).  
  - **Aggregate**  
    - Type: Aggregate  
    - Configuration: Aggregates all filtered alerts into one collection for further processing.  
  - **Code**  
    - Type: JavaScript Code  
    - Configuration: Loops through aggregated alerts and formats them into a textual template describing headline, severity, description, and instructions. Outputs combined alert text and count.  
    - Potential Failures: If alert properties are missing or malformed, template may break or produce incomplete text.

#### 1.3 Local Weather & Radar Imagery Acquisition

- **Overview:** Fetches current local precipitation type from Home Assistant sensor and downloads the latest radar animation GIF from weather.gov.
- **Nodes Involved:**  
  - Get Local Weather Precipication  
  - Fetch Weather.gov Radar Loop  
  - Merge JSON with Image
- **Node Details:**  
  - **Get Local Weather Precipication**  
    - Type: Home Assistant node (state)  
    - Configuration: Reads state of entity `sensor.local_weather_precipitation_type`.  
    - Credentials: Home Assistant API OAuth2 credentials required.  
    - Edge Cases: Sensor offline, unavailable, or entity ID misconfigured will cause missing data.  
  - **Fetch Weather.gov Radar Loop**  
    - Type: HTTP Request  
    - Configuration: Downloads radar loop GIF from `https://radar.weather.gov/ridge/standard/KAMX_loop.gif` (regional radar).  
    - Edge Cases: URL may be unavailable, or network errors. Assumes GIF format compatible for AI analysis.  
  - **Merge JSON with Image**  
    - Type: Merge  
    - Configuration: Combines local precipitation JSON and radar GIF binary data by position.  
    - Purpose: Prepares combined data for AI image analysis.

#### 1.4 Radar Image AI Analysis

- **Overview:** Sends the radar GIF (base64) and local sensor precipitation type as text input to OpenAI's image analysis model to produce a weather condition summary based on radar imagery and sensor data.
- **Nodes Involved:**  
  - Analyze Radar Image  
  - Map JSON Response
- **Node Details:**  
  - **Analyze Radar Image**  
    - Type: OpenAI Image Analysis (Langchain node)  
    - Configuration:  
      - Model: GPT-4o-mini specialized for image analysis.  
      - Input: Radar GIF encoded as base64.  
      - Prompt: Detailed instructions to interpret precipitation, storm intensity, movement, and sensor precedence.  
    - Credentials: OpenAI API key required.  
    - Edge Cases: Large GIF size causing timeout, OpenAI API rate limits, improper base64 encoding, or unclear radar features causing ambiguous analysis.  
  - **Map JSON Response**  
    - Type: Set  
    - Configuration: Extracts `content` field from AI response and assigns it to `radar_summary` string for downstream use.

#### 1.5 Data Merging and Final AI Summary

- **Overview:** Combines the radar analysis summary with the filtered and formatted NWS alert data, then uses OpenAI chat model to generate a concise, 255-character summary alert.
- **Nodes Involved:**  
  - Merge Radar Analysis with NWS Data  
  - Generate a Summary  
  - OpenAI Chat Model  
  - Map JSON to Response
- **Node Details:**  
  - **Merge Radar Analysis with NWS Data**  
    - Type: Merge  
    - Configuration: Combines radar summary data and NWS alert text by position.  
  - **Generate a Summary**  
    - Type: Langchain Chain Summarization (OpenAI)  
    - Configuration:  
      - Model: GPT-4.1-mini chat model.  
      - Prompt: Restricts output to 255 characters, summarizes alert details and radar analysis, emphasizing severe conditions, timing, and affected areas.  
    - Input: Combined radar and alert information.  
    - Credentials: OpenAI API key required.  
    - Edge Cases: Output truncation, prompt misinterpretation, or API failures.  
  - **OpenAI Chat Model**  
    - Type: Langchain Chat Model node (intermediate)  
    - Configuration: Executes the chat model call used by Generate a Summary node.  
  - **Map JSON to Response**  
    - Type: Set  
    - Configuration: Maps AI-generated summary text into `summary` field for final output formatting.

#### 1.6 Output Preparation

- **Overview:** The final node prepares the summarized weather alert and radar analysis for the webhook response, completing the workflow.
- **Nodes Involved:**  
  - Final output is the last Set node `Map JSON to Response`.
- **Node Details:**  
  - Prepares JSON with concise summary string under `summary` key for return to webhook caller.

---

### 3. Summary Table

| Node Name                     | Node Type                         | Functional Role                         | Input Node(s)                 | Output Node(s)                 | Sticky Note                                                                                                                                |
|-------------------------------|----------------------------------|---------------------------------------|------------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Webhook                       | Webhook (Trigger)                 | Receives location input to start flow | —                            | Get NWS Alerts                | This n8n template demonstrates how you can generate an AI-produced weather analysis of your local radar loop & Home Assistant sensor(s).   |
| Get NWS Alerts                | HTTP Request                     | Fetches active alerts from NWS API    | Webhook                      | Split Out                    | This workflow is triggered by a webhook with a latitude and longitude JSON payload to identify the monitoring area.                       |
| Split Out                    | Split Out                       | Splits alerts array into individual items | Get NWS Alerts               | Remove Irrelevant Fields      |                                                                                                                                             |
| Remove Irrelevant Fields      | Set                             | Projects only essential alert data    | Split Out                    | Filter by Status             |                                                                                                                                             |
| Filter by Status             | Filter                          | Keeps alerts with status "Actual"     | Remove Irrelevant Fields      | Filter by Severity           |                                                                                                                                             |
| Filter by Severity           | Filter                          | Keeps alerts with severity Moderate+  | Filter by Status             | Filter by Effective          |                                                                                                                                             |
| Filter by Effective          | Filter                          | Keeps alerts currently effective      | Filter by Severity           | Filter by Expired            |                                                                                                                                             |
| Filter by Expired            | Filter                          | Keeps alerts not expired               | Filter by Effective          | Aggregate                   |                                                                                                                                             |
| Aggregate                   | Aggregate                       | Aggregates all filtered alerts         | Filter by Expired            | Code                         |                                                                                                                                             |
| Code                        | Code (JavaScript)               | Formats alerts into textual templates  | Aggregate                   | Get Local Weather Precipication, Fetch Weather.gov Radar Loop, Merge Radar Analysis with NWS Data |                                                                                                                                             |
| Get Local Weather Precipication | Home Assistant                 | Retrieves local precipitation sensor   | Code                         | Merge JSON with Image        |                                                                                                                                             |
| Fetch Weather.gov Radar Loop | HTTP Request                   | Downloads radar loop GIF                | Code                         | Merge JSON with Image        | Make sure you adjust the radar loop image that is being used.                                                                               |
| Merge JSON with Image        | Merge                          | Combines local sensor and radar data   | Get Local Weather Precipication, Fetch Weather.gov Radar Loop | Analyze Radar Image          |                                                                                                                                             |
| Analyze Radar Image          | OpenAI Image Analysis (Langchain) | AI analyzes radar animation and sensor data | Merge JSON with Image        | Map JSON Response            |                                                                                                                                             |
| Map JSON Response            | Set                            | Extracts radar analysis summary        | Analyze Radar Image          | Merge Radar Analysis with NWS Data |                                                                                                                                             |
| Merge Radar Analysis with NWS Data | Merge                    | Combines radar analysis and NWS alerts | Code, Map JSON Response      | Generate a Summary           |                                                                                                                                             |
| Generate a Summary           | Langchain Chain Summarization  | Creates concise AI summary of weather  | Merge Radar Analysis with NWS Data | Map JSON to Response         |                                                                                                                                             |
| OpenAI Chat Model            | Langchain Chat Model           | Executes OpenAI chat model call         | —                            | Generate a Summary            |                                                                                                                                             |
| Map JSON to Response         | Set                            | Prepares final summary output           | Generate a Summary           | —                            |                                                                                                                                             |
| Sticky Note                 | Sticky Note                    | Documentation note                      | —                            | —                            | This n8n template demonstrates how you can generate an AI-produced weather analysis... (full note content in overview)                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node:**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique string (e.g., b74e13cd-ad2f-4ef1-8350-ff6b915e5485)  
   - Response Mode: Last Node  
   - Accepts JSON with `latitude` and `longitude` in `body`.

2. **Add HTTP Request Node "Get NWS Alerts":**  
   - URL: `https://api.weather.gov/alerts`  
   - Method: GET  
   - Query Parameters:  
     - `status` = `actual`  
     - `point` = expression `{{$json.body.latitude}},{{$json.body.longitude}}` (from webhook input)  
   - Configure to parse JSON response fully.

3. **Add Split Out Node:**  
   - Field to split out: `body.features`  
   - Input: Output from "Get NWS Alerts".

4. **Add Set Node "Remove Irrelevant Fields":**  
   - Keep only necessary fields from each alert:  
     `id`, `properties.areaDesc`, `properties.effective`, `properties.expires`, `properties.severity`, `properties.certainty`, `properties.status`, `properties.headline`, `properties.description`, `properties.instruction`, `properties.parameters.NWSheadline`.

5. **Add Filter Node "Filter by Status":**  
   - Condition: `properties.status == "Actual"`

6. **Add Filter Node "Filter by Severity":**  
   - Condition: `properties.severity` is one of `Moderate`, `Severe`, `Extreme`.

7. **Add Filter Node "Filter by Effective":**  
   - Condition: `new Date(properties.effective).getTime() <= new Date().getTime()` (alerts already effective)

8. **Add Filter Node "Filter by Expired":**  
   - Condition: `new Date(properties.expires).getTime() >= new Date().getTime()` (alerts not expired)

9. **Add Aggregate Node:**  
   - Aggregate all filtered alerts into a single array field named `alerts`.

10. **Add JavaScript Code Node:**  
    - Script to loop through aggregated alerts and generate formatted textual alert summaries with headline, severity, description, and instructions.  
    - Output object with `nws_alerts` (concatenated string) and `nws_alerts_count`.

11. **Add Home Assistant Node "Get Local Weather Precipication":**  
    - Resource: State  
    - Entity ID: `sensor.local_weather_precipitation_type`  
    - Connect credentials for Home Assistant API (OAuth2).

12. **Add HTTP Request Node "Fetch Weather.gov Radar Loop":**  
    - URL: `https://radar.weather.gov/ridge/standard/KAMX_loop.gif`  
    - Method: GET

13. **Add Merge Node "Merge JSON with Image":**  
    - Mode: Combine  
    - Combine By: Position  
    - Inputs: Local weather sensor data and radar GIF.

14. **Add OpenAI Image Analysis Node "Analyze Radar Image":**  
    - Model: GPT-4o-mini  
    - Operation: Analyze  
    - Input Type: base64 (converted radar GIF)  
    - Text prompt includes instructions to interpret radar and sensor data cautiously.  
    - Connect OpenAI credentials.

15. **Add Set Node "Map JSON Response":**  
    - Assign AI analysis content to `radar_summary`.

16. **Add Merge Node "Merge Radar Analysis with NWS Data":**  
    - Mode: Combine  
    - Combine By: Position  
    - Inputs: Output from Code Node (NWS alerts) and Map JSON Response (radar summary).

17. **Add Langchain Chain Summarization Node "Generate a Summary":**  
    - Model: GPT-4.1-mini  
    - Operation Mode: Node Input Binary  
    - Prompt limits output to 255 characters, summarizes alerts and radar analysis focusing on severe conditions, timing, and location.  
    - Connect OpenAI credentials.

18. **Add Langchain Chat Model Node "OpenAI Chat Model":**  
    - Model: GPT-4.1-mini (as intermediate node for chain summarization).  
    - Connect OpenAI credentials.

19. **Add Set Node "Map JSON to Response":**  
    - Assign output text from summary to `summary` field for final output.

20. **Connect final output of "Map JSON to Response" back to the Webhook response.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                 | Context or Link                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This n8n template demonstrates how you can generate an AI-produced weather analysis of your local radar loop and Home Assistant precipitation sensor(s) to keep your family informed of National Weather Service Alerts.                     | Workflow Sticky Note                                                                                 |
| With as crazy as things have been lately in the open world, how will you and your family know when a severe or extreme alert impacts your area?                                                                                             | Workflow Sticky Note                                                                                 |
| Make sure you adjust the radar loop image that is being used to match your region or preference.                                                                                                                                             | Sticky note on "Fetch Weather.gov Radar Loop" node                                                  |
| Requires a Home Assistant instance for local sensor data (can be removed if not needed).                                                                                                                                                     | Workflow Overview                                                                                   |
| Requires OpenAI account and API keys with access to GPT-4 or GPT-4o-mini for both language and image analysis features.                                                                                                                     | Workflow Overview                                                                                   |
| This workflow uses the National Weather Service API: https://api.weather.gov/alerts                                                                                                                                                         | External API reference                                                                              |

---

**Disclaimer:**  
The text provided originates exclusively from an automated n8n workflow. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.