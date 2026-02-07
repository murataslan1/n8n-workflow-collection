API that extracts engaging moments from YouTube videos 

https://n8nworkflows.xyz/workflows/api-that-extracts-engaging-moments-from-youtube-videos--2152


# API that extracts engaging moments from YouTube videos 

### 1. Workflow Overview

This workflow provides an API endpoint that extracts potentially engaging moments from a YouTube video based on intensity scores derived from unofficial YouTube "most replayed" data. It accepts a YouTube video ID via a webhook request, queries an unofficial API for replay intensity markers, filters and processes the data, and responds with a structured list of engaging timestamps or an error message if no data is available.

Logical blocks:

- **1.1 Input Reception and Validation**: Accepts HTTP GET requests with a YouTube video ID.
- **1.2 Data Retrieval from Unofficial YouTube API**: Fetches most replayed markers for the video.
- **1.3 Intensity Data Validation**: Checks if intensity data exists.
- **1.4 Data Extraction and Filtering**: Extracts marker data, filters by intensity threshold, converts timestamps, and removes closely spaced moments.
- **1.5 Moment Formatting and Aggregation**: Creates human-readable moment descriptions and aggregates results.
- **1.6 Response Handling**: Sends back JSON response with engaging moments or error message.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Validation

- **Overview:**  
  Captures incoming HTTP requests with a YouTube video ID parameter and prepares it for downstream processing.

- **Nodes Involved:**  
  - Webhook  
  - Input variables

- **Node Details:**  
  - **Webhook**  
    - *Type:* HTTP Webhook trigger  
    - *Configuration:* Path `youtube-engaging-moments-extractor`, response mode set to use response node (deferred response). Accepts GET requests with query parameter `ytID`.  
    - *Input/Output:* Input from external HTTP clients; output to "Input variables" node.  
    - *Edge cases:* Missing or malformed `ytID` parameter will cause empty downstream data or potential errors.

  - **Input variables**  
    - *Type:* Set node  
    - *Configuration:* Sets variable `youtubeVideoID` from webhook query parameter `ytID`.  
    - *Key expression:* `={{ $json.query.ytID }}`  
    - *Input/Output:* Input from Webhook; output to HTTP Request node.  
    - *Edge cases:* If `ytID` is undefined, downstream HTTP request URL will be invalid.

---

#### 1.2 Data Retrieval from Unofficial YouTube API

- **Overview:**  
  Queries the unofficial YouTube API hosted by lemnoslife.com to retrieve "most replayed" intensity markers for the given video ID.

- **Nodes Involved:**  
  - HTTP Request

- **Node Details:**  
  - **HTTP Request**  
    - *Type:* HTTP Request  
    - *Configuration:* GET request to `https://yt.lemnoslife.com/videos?part=mostReplayed&id={{ $json.youtubeVideoID }}`. No additional authentication or headers.  
    - *Key expression:* URL built dynamically using `$json.youtubeVideoID` from previous node.  
    - *Input/Output:* Input from "Input variables"; output to "has intensity data?" node.  
    - *Edge cases:*  
      - API downtime or rate limiting can cause request failures or empty responses.  
      - Invalid video ID can result in no data.  
      - No auth used; public API may have usage restrictions.

---

#### 1.3 Intensity Data Validation

- **Overview:**  
  Determines whether the response contains intensity data (i.e., the "mostReplayed" field exists) and branches accordingly.

- **Nodes Involved:**  
  - has intensity data? (If node)  
  - No intensity data available for video (NoOp)  
  - Respond with "no results" (RespondToWebhook)

- **Node Details:**  
  - **has intensity data?**  
    - *Type:* If node  
    - *Configuration:* Checks if `$json.items[0].mostReplayed` exists (object existence check).  
    - *Input/Output:* Input from HTTP Request; outputs to either "Split Out" (true) or "No intensity data available for video" (false).  
    - *Edge cases:* If response structure changes or API returns unexpected data, this condition may fail incorrectly.

  - **No intensity data available for video**  
    - *Type:* NoOp (placeholder)  
    - *Configuration:* No operation; acts as a branch target.  
    - *Input/Output:* Input from false branch of "has intensity data?"; output to "Respond with 'no results'".

  - **Respond with "no results"**  
    - *Type:* RespondToWebhook  
    - *Configuration:* Sends JSON response: `{"engagingMoments": null, "youtubeID": "{{ $('Webhook').item.json.query.ytID }}"}`  
    - *Input/Output:* Input from NoOp node; outputs HTTP response to client.  
    - *Edge cases:* None specific; response consistent for missing data.

---

#### 1.4 Data Extraction and Filtering

- **Overview:**  
  Extracts the array of intensity markers, filters those with normalized intensity scores > 0.6, converts timestamps from milliseconds to seconds, and filters out moments that are closer than 20 seconds to the next.

- **Nodes Involved:**  
  - Split Out  
  - intensity > 0.6 (Filter)  
  - millisecs to seconds (Set)  
  - Filter out moments close to each other (Filter)

- **Node Details:**  
  - **Split Out**  
    - *Type:* SplitOut  
    - *Configuration:* Splits the array at `$json.items[0].mostReplayed.markers`, emitting each marker as an individual item.  
    - *Input/Output:* Input from "has intensity data?" true branch; output to "intensity > 0.6".  
    - *Edge cases:* Empty or malformed markers array results in no output items.

  - **intensity > 0.6**  
    - *Type:* Filter  
    - *Configuration:* Filters items where `$json.intensityScoreNormalized > 0.6`.  
    - *Input/Output:* Input from Split Out; output to "millisecs to seconds".  
    - *Edge cases:* Markers without `intensityScoreNormalized` field will be excluded.

  - **millisecs to seconds**  
    - *Type:* Set  
    - *Configuration:* Converts `startMillis` to `startSec` by dividing by 1000; removes original `startMillis`.  
    - *Key expression:* `={{ $json.startMillis / 1000 }}`  
    - *Input/Output:* Input from filter; output to "Filter out moments close to each other".  
    - *Edge cases:* Missing or zero `startMillis` will affect downstream logic.

  - **Filter out moments close to each other**  
    - *Type:* Filter  
    - *Configuration:* Keeps only moments where the next moment's start time is more than 20 seconds after the current moment's start time. Uses expression comparing `$input.all()[itemIndex +1].json.startSec` and `$input.all()[itemIndex].json.startSec + 20`.  
    - *Input/Output:* Input from "millisecs to seconds"; output to "Create each moment (human readable)".  
    - *Edge cases:* Last element has no next item; careful indexing required to avoid errors. Also assumes sorted input by startSec.

---

#### 1.5 Moment Formatting and Aggregation

- **Overview:**  
  Formats filtered moments into human-readable messages with direct YouTube URLs and aggregates all formatted moments into a single JSON array.

- **Nodes Involved:**  
  - Create each moment (human readable)  
  - Aggregate

- **Node Details:**  
  - **Create each moment (human readable)**  
    - *Type:* Set  
    - *Configuration:*  
      - Creates fields:  
        - `humanReadableMessage`: formatted string with moment number and YouTube URL with timestamp (3 seconds before moment start).  
        - `startSec`: rounded start second.  
        - `directYTURL`: direct YouTube link to timestamp.  
      - Uses expressions referencing:  
        - YouTube video ID from "Input variables" node.  
        - Current item's `startSec`.  
    - *Input/Output:* Input from filtered moments; output to "Aggregate".  
    - *Edge cases:* Negative timestamps if startSec < 3 (timestamp could be negative); rounding might affect offsets.

  - **Aggregate**  
    - *Type:* Aggregate  
    - *Configuration:* Aggregates all incoming items into one JSON array under field `engagingMoments`.  
    - *Input/Output:* Input from "Create each moment"; output to "prepare response".  
    - *Edge cases:* None significant; empty input results in empty array.

---

#### 1.6 Response Handling

- **Overview:**  
  Prepares and sends the final JSON response containing the engaging moments along with the original YouTube video ID.

- **Nodes Involved:**  
  - prepare response  
  - Respond with moments

- **Node Details:**  
  - **prepare response**  
    - *Type:* Set  
    - *Configuration:* Adds `youtubeID` to the aggregated results by reading from the Webhook node query parameter.  
    - *Input/Output:* Input from Aggregate; output to "Respond with moments".  
    - *Edge cases:* If Webhook query parameter is missing, youtubeID will be empty.

  - **Respond with moments**  
    - *Type:* RespondToWebhook  
    - *Configuration:* Sends the prepared JSON object as HTTP response.  
    - *Input/Output:* Input from "prepare response"; outputs HTTP response to client.  
    - *Edge cases:* None specific.

---

### 3. Summary Table

| Node Name                         | Node Type           | Functional Role                                | Input Node(s)                 | Output Node(s)                             | Sticky Note                                                                                                           |
|----------------------------------|---------------------|-----------------------------------------------|------------------------------|--------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Webhook                          | Webhook             | Receives HTTP requests with YouTube video ID | -                            | Input variables                            | See usage instructions in Sticky Note3                                                                                |
| Input variables                  | Set                 | Extracts YouTube video ID from query parameters | Webhook                      | HTTP Request                              |                                                                                                                       |
| HTTP Request                     | HTTP Request        | Retrieves most replayed intensity data        | Input variables               | has intensity data?                        | Relies on unofficial API from lemnoslife.com                                                                           |
| has intensity data?              | If                  | Checks if intensity data exists in response   | HTTP Request                 | Split Out (true), No intensity data available for video (false) |                                                                                                                       |
| No intensity data available for video | NoOp                | Placeholder for no data branch                  | has intensity data?          | Respond with "no results"                   |                                                                                                                       |
| Respond with "no results"        | RespondToWebhook    | Sends JSON response when no intensity data    | No intensity data available   | -                                          | Example error response shown in Sticky Note                                                                            |
| Split Out                       | SplitOut            | Splits markers array into individual items    | has intensity data?           | intensity > 0.6                            |                                                                                                                       |
| intensity > 0.6                 | Filter              | Filters moments with intensityScoreNormalized > 0.6 | Split Out                    | millisecs to seconds                       |                                                                                                                       |
| millisecs to seconds            | Set                 | Converts startMillis to startSec in seconds   | intensity > 0.6              | Filter out moments close to each other     |                                                                                                                       |
| Filter out moments close to each other | Filter              | Removes moments less than 20 seconds apart     | millisecs to seconds         | Create each moment (human readable)        |                                                                                                                       |
| Create each moment (human readable) | Set                 | Formats moments with human-readable message and direct YouTube URL | Filter out moments close to each other | Aggregate                                  |                                                                                                                       |
| Aggregate                      | Aggregate           | Aggregates all moments into one JSON array    | Create each moment           | prepare response                           |                                                                                                                       |
| prepare response               | Set                 | Adds YouTube ID to aggregated response        | Aggregate                    | Respond with moments                        |                                                                                                                       |
| Respond with moments           | RespondToWebhook    | Sends final JSON response with engaging moments | prepare response             | -                                          | Example success response shown in Sticky Note1                                                                         |
| Sticky Note                   | StickyNote          | Example error response image                    | -                            | -                                          | ![](https://i.ibb.co/7VZVFBh/error-response.png)                                                                       |
| Sticky Note1                  | StickyNote          | Example success response image                  | -                            | -                                          | ![](https://i.ibb.co/ssymRNt/success-response.png)                                                                     |
| Sticky Note2                  | StickyNote          | Workflow purpose overview                        | -                            | -                                          | ![](https://i.ibb.co/Xz2CDnW/Screenshot-2024-02-28-at-15-51-02.png)                                                    |
| Sticky Note3                  | StickyNote          | How to use instructions                         | -                            | -                                          | 1. Copy Production URL from Webhook node 2. Activate workflow 3. Invoke endpoint with ?ytID=VIDEOID                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook node**  
   - Type: Webhook  
   - Path: `youtube-engaging-moments-extractor`  
   - Response Mode: Use response node (deferred response)  
   - Accepts GET requests with query parameter `ytID`.

2. **Create Set node "Input variables"**  
   - Set variable `youtubeVideoID` as string: `={{ $json.query.ytID }}`  
   - Connect Webhook → Input variables.

3. **Create HTTP Request node**  
   - Name: HTTP Request  
   - Method: GET  
   - URL: `https://yt.lemnoslife.com/videos?part=mostReplayed&id={{ $json.youtubeVideoID }}`  
   - No authentication or headers needed.  
   - Connect Input variables → HTTP Request.

4. **Create If node "has intensity data?"**  
   - Condition: Check if `$json.items[0].mostReplayed` exists (object existence).  
   - True output → Split Out node.  
   - False output → NoOp node.

5. **Create NoOp node "No intensity data available for video"**  
   - Acts as a placeholder.  
   - Connect has intensity data? false → NoOp.

6. **Create RespondToWebhook node "Respond with 'no results'"**  
   - Respond with JSON:  
     ```json
     {
       "engagingMoments": null,
       "youtubeID": "{{ $('Webhook').item.json.query.ytID }}"
     }
     ```  
   - Connect NoOp → Respond with "no results".

7. **Create SplitOut node "Split Out"**  
   - Field to split out: `items[0].mostReplayed.markers`  
   - Connect has intensity data? true → Split Out.

8. **Create Filter node "intensity > 0.6"**  
   - Condition: `$json.intensityScoreNormalized > 0.6`  
   - Connect Split Out → intensity > 0.6.

9. **Create Set node "millisecs to seconds"**  
   - Remove field `startMillis`  
   - Add field `startSec` = `={{ $json.startMillis / 1000 }}`  
   - Connect intensity > 0.6 → millisecs to seconds.

10. **Create Filter node "Filter out moments close to each other"**  
    - Condition: Keep item if  
      `$input.all()[$itemIndex + 1].json.startSec > $input.all()[$itemIndex].json.startSec + 20`  
    - Connect millisecs to seconds → Filter out moments close to each other.

11. **Create Set node "Create each moment (human readable)"**  
    - Fields:  
      - `humanReadableMessage`:  
        `=Engaging moment #{{ $itemIndex +1 }}: https://youtu.be/{{ $('Input variables').first().json.youtubeVideoID }}?t={{ $json.startSec.round() - 3 }}`  
      - `startSec`: Rounded start second, `={{ $json.startSec.round() }}`  
      - `directYTURL`:  
        `=https://youtu.be/{{ $('Input variables').first().json.youtubeVideoID }}?t={{ $json.startSec.round() - 3 }}`  
    - Connect Filter out moments close to each other → Create each moment.

12. **Create Aggregate node "Aggregate"**  
    - Aggregate all items into field `engagingMoments`  
    - Connect Create each moment → Aggregate.

13. **Create Set node "prepare response"**  
    - Add field `youtubeID` = `={{ $('Webhook').item.json.query.ytID }}`  
    - Connect Aggregate → prepare response.

14. **Create RespondToWebhook node "Respond with moments"**  
    - Send all fields as JSON response.  
    - Connect prepare response → Respond with moments.

15. **Activate the workflow**.

No credentials needed as the API is public and no external authentication is used.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                 | Context or Link                                                                                           |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| This workflow relies on an unofficial YouTube API hosted for free by lemnoslife.com. Not recommended for high-volume production use cases.                   | https://yt.lemnoslife.com                                                                               |
| Example success and error responses are documented in sticky notes with images linked externally.                                                           | ![](https://i.ibb.co/ssymRNt/success-response.png), ![](https://i.ibb.co/7VZVFBh/error-response.png)     |
| Usage instructions: Import the template, activate it, copy the webhook production URL, and invoke it with the `ytID` parameter in HTTP GET requests.          | Sticky Note3 in workflow                                                                                  |
| Ideal for vloggers and content creators to identify engaging video moments automatically for content repurposing and alerts.                                 | Workflow description                                                                                      |
| The filtering threshold (intensity > 0.6) and minimum spacing between moments (20 seconds) can be adjusted for different sensitivity or granularity needs.   | Filter nodes configuration                                                                                |
| Timestamp offsets subtract 3 seconds to provide context before the intense moment but can yield negative values if moments occur very early in the video.     | Set node "Create each moment (human readable)" logic                                                     |

---

This document fully describes the workflow structure, logic, steps to recreate it, and operational notes, enabling advanced users and AI agents to understand, reproduce, and extend the workflow confidently.