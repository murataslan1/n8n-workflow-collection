AI DJ: Text-to-Spotify Playlist Generator with Linkup and GPT4

https://n8nworkflows.xyz/workflows/ai-dj--text-to-spotify-playlist-generator-with-linkup-and-gpt4-8801


# AI DJ: Text-to-Spotify Playlist Generator with Linkup and GPT4

### 1. Workflow Overview

This workflow, titled **"AI DJ: Text-to-Spotify Playlist Generator with Linkup and GPT4"**, automates the creation of a Spotify playlist based on a natural language text prompt submitted via a web form. It is designed for users who want to generate personalized playlists by describing desired moods, styles, artists, or themes.

The workflow groups into these logical blocks:

- **1.1 Input Reception:** Captures user playlist requests and parameters from a custom web form.
- **1.2 AI Processing and Track Ideation:** Uses GPT-4 (via LangChain) alongside the Linkup web search API to generate a structured playlist recommendation including playlist name and track details.
- **1.3 Spotify Playlist Creation:** Creates a new Spotify playlist, searches for individual tracks on Spotify to retrieve their IDs, and adds these tracks to the playlist.
- **1.4 Finalization and Redirection:** Retrieves the completed playlist and redirects the user to it on Spotify.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block handles the initial user input through a web form. Users specify their playlist request text and the number of tracks desired.

**Nodes Involved:**  
- On form submission

**Node Details:**

- **On form submission**  
  - *Type:* Form Trigger  
  - *Role:* Entry point that exposes a webhook and renders a styled input form for playlist parameters.  
  - *Configuration:*  
    - Form fields:  
      - Playlist request (textarea, required)  
      - Number of tracks (number input, required)  
    - Custom CSS applied for a dark Spotify-themed UI.  
    - Button labeled "Generate the playlist".  
    - Returns the last node's output as response.  
  - *Connections:* Outputs to "Ideate playlist".  
  - *Edge cases:* Webhook must be publicly accessible; malformed or missing input fields will cause workflow failure or empty results.

#### 2.2 AI Processing and Track Ideation

**Overview:**  
This block uses an AI agent (GPT-4) with LangChain to interpret the playlist request and number of tracks, generating a playlist name and a list of track artist/title pairs. It invokes the Linkup API for web-based track discovery.

**Nodes Involved:**  
- OpenAI Chat Model  
- Ideate playlist  
- Web query to find tracks  
- Structured Output Parser

**Node Details:**

- **OpenAI Chat Model**  
  - *Type:* LangChain OpenAI Chat Model  
  - *Role:* Provides GPT-4.1-mini model backend for the agent.  
  - *Configuration:* Model: "gpt-4.1-mini".  
  - *Connections:* Outputs to "Ideate playlist".  
  - *Edge cases:* API key invalid/expired, rate limits, or network issues.

- **Ideate playlist**  
  - *Type:* LangChain Agent  
  - *Role:* Core AI agent that creates the playlist plan. It:  
    - Receives user input from the form trigger.  
    - Crafts a search query for the Linkup web search tool.  
    - Calls the "Web query to find tracks" node once with that query.  
    - Constructs the playlist name and selects exactly the requested number of tracks.  
    - Outputs a structured JSON with playlistName and tracks (artist/title).  
  - *Configuration:*  
    - System message instructs the agent's role as a DJ and how to use the Linkup tool.  
    - Enforces output format for downstream processing.  
  - *Connections:*  
    - Uses AI tool "Web query to find tracks".  
    - Uses AI language model "OpenAI Chat Model".  
    - Output parsed by "Structured Output Parser".  
    - Main output flows to "Create playlist".  
  - *Edge cases:* AI output format errors, tool call failures, or unexpected AI responses.

- **Web query to find tracks**  
  - *Type:* HTTP Request Tool  
  - *Role:* Calls Linkup API to find relevant tracks based on AI-generated query.  
  - *Configuration:*  
    - POST to https://api.linkup.so/v1/search with JSON body containing:  
      - `q`: AI-generated search query string.  
      - `depth`: "deep" (to get comprehensive results).  
      - `outputType`: "structured" with a JSON schema defining an array of tracks with title, artist, and explanation.  
      - `includeImages`: false.  
    - Authenticated with Bearer token credential for Linkup.  
  - *Connections:* Outputs to "Ideate playlist" as AI tool response.  
  - *Edge cases:* API authentication failure, network timeout, invalid query or schema mismatch.

- **Structured Output Parser**  
  - *Type:* LangChain Output Parser (Structured)  
  - *Role:* Parses the AI agent's JSON output into structured data for the workflow.  
  - *Configuration:* Uses example JSON schema matching expected playlistName and tracks array.  
  - *Connections:* Outputs to "Ideate playlist" for further processing.  
  - *Edge cases:* Parsing failure if AI output deviates from schema.

#### 2.3 Spotify Playlist Creation

**Overview:**  
This block creates the Spotify playlist and adds tracks to it by searching Spotify for track IDs.

**Nodes Involved:**  
- Create playlist  
- Get tracks array  
- Split out tracks  
- Search the track  
- Get track IDs  
- Add track to playlist

**Node Details:**

- **Create playlist**  
  - *Type:* Spotify  
  - *Role:* Creates a new blank playlist on Spotify with the AI-generated name.  
  - *Configuration:*  
    - Name set dynamically from AI output `playlistName`.  
    - Playlist is public.  
    - Uses Spotify OAuth2 credentials.  
  - *Connections:* Outputs to "Get tracks array".  
  - *Edge cases:* OAuth token expiry, Spotify API quota limits.

- **Get tracks array**  
  - *Type:* Set  
  - *Role:* Extracts the tracks array from AI output to simplify iteration.  
  - *Configuration:* Sets field "Tracks" from `$('Ideate playlist').item.json.output.tracks`.  
  - *Connections:* Outputs to "Split out tracks".

- **Split out tracks**  
  - *Type:* Split Out  
  - *Role:* Splits the tracks array so each track is processed individually.  
  - *Configuration:* Field to split out: "Tracks".  
  - *Connections:* Outputs each track to "Search the track".

- **Search the track**  
  - *Type:* Spotify  
  - *Role:* Searches Spotify for the track ID using artist and title.  
  - *Configuration:*  
    - Query set as `{{ $json.artist }} - {{ $json.title }}` to find best match.  
    - Limit results to 1.  
  - *Connections:* Outputs to "Get track IDs".  
  - *Edge cases:* Track not found, ambiguous search results.

- **Get track IDs**  
  - *Type:* Set  
  - *Role:* Extracts the Spotify track ID from search result for playlist addition.  
  - *Configuration:* Sets "Track ID" to `{{ $json.id }}` from search result.  
  - *Connections:* Outputs to "Add track to playlist".

- **Add track to playlist**  
  - *Type:* Spotify  
  - *Role:* Adds the identified track to the previously created playlist.  
  - *Configuration:*  
    - Playlist ID dynamically set from `Create playlist` node.  
    - Track ID set from "Get track IDs" node.  
  - *Connections:* Outputs to "Get the final playlist".  
  - *Edge cases:* API rate limits, invalid track or playlist IDs.

#### 2.4 Finalization and Redirection

**Overview:**  
This block retrieves the completed playlist and redirects the user to Spotify to view it.

**Nodes Involved:**  
- Get the final playlist  
- Opening the playlist

**Node Details:**

- **Get the final playlist**  
  - *Type:* Spotify  
  - *Role:* Retrieves full playlist details after all tracks have been added.  
  - *Configuration:*  
    - Playlist ID from "Create playlist".  
    - Operation: get playlist.  
    - Executes only once (executeOnce: true).  
  - *Connections:* Outputs to "Opening the playlist".  
  - *Edge cases:* Playlist retrieval failure, token expiry.

- **Opening the playlist**  
  - *Type:* Form  
  - *Role:* Sends an HTTP redirect response to the user, opening the Spotify playlist URL.  
  - *Configuration:*  
    - Redirect URL set dynamically from playlist Spotify external URL.  
    - Responds with redirect to client.  
  - *Connections:* Terminal node.  
  - *Edge cases:* Redirect URL missing or malformed.

---

### 3. Summary Table

| Node Name              | Node Type                         | Functional Role                         | Input Node(s)            | Output Node(s)            | Sticky Note                                                   |
|------------------------|----------------------------------|---------------------------------------|--------------------------|---------------------------|---------------------------------------------------------------|
| On form submission     | Form Trigger                     | Receives user playlist request input  |                          | Ideate playlist           |                                                               |
| OpenAI Chat Model       | LangChain OpenAI Chat Model      | Provides GPT-4 language model          |                          | Ideate playlist           |                                                               |
| Ideate playlist         | LangChain Agent                  | AI agent that plans playlist & tracks | On form submission, OpenAI Chat Model, Web query to find tracks, Structured Output Parser | Create playlist         | ## AI agent to plan the playlist: uses Linkup API for tracks |
| Web query to find tracks| HTTP Request Tool                | Calls Linkup API to find relevant tracks | Ideate playlist (as AI tool) | Ideate playlist           | ## AI web-search with Linkup: Connect your Linkup.so credentials |
| Structured Output Parser| LangChain Output Parser (Structured) | Parses AI output to structured JSON    | Ideate playlist           | Ideate playlist           |                                                               |
| Create playlist         | Spotify                         | Creates new Spotify playlist           | Ideate playlist           | Get tracks array          | Create a blank playlist with the chosen name.                 |
| Get tracks array        | Set                            | Extracts tracks array for iteration    | Create playlist           | Split out tracks          |                                                               |
| Split out tracks        | Split Out                      | Splits tracks array into individual items | Get tracks array          | Search the track          | ## For each track: search Spotify to get track IDs            |
| Search the track        | Spotify                         | Finds track ID on Spotify               | Split out tracks          | Get track IDs             |                                                               |
| Get track IDs           | Set                            | Extracts track ID from search result   | Search the track          | Add track to playlist     |                                                               |
| Add track to playlist   | Spotify                         | Adds track to Spotify playlist         | Get track IDs             | Get the final playlist    |                                                               |
| Get the final playlist  | Spotify                         | Retrieves finalized playlist details   | Add track to playlist     | Opening the playlist      |                                                               |
| Opening the playlist    | Form                           | Redirects user to Spotify playlist URL | Get the final playlist    |                           |                                                               |
| Sticky Note4            | Sticky Note                    | Notes AI agent function                 |                          |                           | ## AI agent to plan the playlist: uses Linkup API for tracks |
| Sticky Note6            | Sticky Note                    | Notes per-track Spotify search          |                          |                           | ## For each track: search Spotify to get track IDs            |
| Sticky Note             | Sticky Note                    | Notes on Linkup web search setup        |                          |                           | ## AI web-search with Linkup: Connect your Linkup.so credentials |
| Sticky Note1            | Sticky Note                    | Workflow description and usage          |                          |                           | Full workflow overview and usage instructions; YouTube link [EgvaD7j4c1A] |

---

### 4. Reproducing the Workflow from Scratch

**Step 1: Create the Input Form**

- Add a **Form Trigger** node named "On form submission".  
- Configure the webhook path (e.g., "spotify-playlist-generator").  
- Add two form fields:  
  - "Playlist request" (textarea, required)  
  - "Number of tracks" (number, required)  
- Apply the custom dark CSS styling provided in the parameters.  
- Set the form button label to "Generate the playlist".  
- Set response mode to return the last node’s output.

**Step 2: Configure the AI Language Model**

- Add a **LangChain OpenAI Chat Model** node named "OpenAI Chat Model".  
- Use GPT-4.1-mini as the model.  
- Attach OpenAI API credentials.

**Step 3: Set Up the AI Agent**

- Add a **LangChain Agent** node named "Ideate playlist".  
- Configure prompt with:  
  - The user’s playlist request and number of tracks as input text.  
  - System message describing the DJ role, instructing it to call the Linkup API once to find tracks, construct playlist name, and output structured JSON with playlistName and tracks.  
- Set the agent to use the "OpenAI Chat Model" as its language model.  
- Add a tool linking to the "Web query to find tracks" node (defined next).  
- Connect the agent’s output to be parsed by a structured output parser.

**Step 4: Add the Web Search Tool**

- Add an **HTTP Request Tool** node named "Web query to find tracks".  
- Configure it to POST to "https://api.linkup.so/v1/search".  
- Add authentication via Bearer token for Linkup credentials.  
- Set body parameters:  
  - `q`: passed dynamically from AI agent prompt (`$fromAI`).  
  - `depth`: "deep"  
  - `outputType`: "structured"  
  - `structuredOutputSchema`: Define JSON schema expecting an object with a "tracks" array, each with "title", "artist", and "explanation".  
  - `includeImages`: false  

**Step 5: Add Structured Output Parser**

- Add a **LangChain Output Parser (Structured)** node named "Structured Output Parser".  
- Configure the parser with an example JSON schema matching output expected from the AI Agent (playlistName and tracks array).

**Step 6: Create Spotify Playlist**

- Add a **Spotify** node named "Create playlist".  
- Use Spotify OAuth2 credentials linked to your account.  
- Set operation to "create playlist".  
- Set playlist name dynamically from `{{ $json.output.playlistName }}`.  
- Make playlist public.

**Step 7: Prepare Track List Processing**

- Add a **Set** node named "Get tracks array".  
- Set field "Tracks" to `{{ $('Ideate playlist').item.json.output.tracks }}`.

- Add a **Split Out** node named "Split out tracks".  
- Configure to split on field "Tracks".

**Step 8: Search Each Track on Spotify**

- Add a **Spotify** node named "Search the track".  
- Set operation to "search track".  
- Query: `{{ $json.artist }} - {{ $json.title }}`.  
- Limit results to 1.

- Add a **Set** node named "Get track IDs".  
- Set field "Track ID" to `{{ $json.id }}` from the search results.

**Step 9: Add Tracks to Playlist**

- Add a **Spotify** node named "Add track to playlist".  
- Use Spotify OAuth2 credentials.  
- Playlist ID: `spotify:playlist:{{ $('Create playlist').first().json.id }}`.  
- Track ID: `spotify:track:{{ $json["Track ID"] }}`.

**Step 10: Retrieve Final Playlist**

- Add a **Spotify** node named "Get the final playlist".  
- Operation: get playlist.  
- Playlist ID from "Create playlist".  
- Set "executeOnce" to true.

**Step 11: Redirect User to Playlist**

- Add a **Form** node named "Opening the playlist".  
- Configure to respond with HTTP redirect.  
- Redirect URL: `{{ $json.external_urls.spotify }}` from "Get the final playlist".

**Step 12: Connect Nodes**

- Connect nodes in logical order:  
  - "On form submission" → "Ideate playlist" (input)  
  - "OpenAI Chat Model" → "Ideate playlist" (language model)  
  - "Web query to find tracks" → "Ideate playlist" (AI tool)  
  - "Structured Output Parser" → "Ideate playlist" (output parser)  
  - "Ideate playlist" → "Create playlist"  
  - "Create playlist" → "Get tracks array" → "Split out tracks" → "Search the track" → "Get track IDs" → "Add track to playlist" → "Get the final playlist" → "Opening the playlist".

**Step 13: Credential Setup**

- Add credentials for:  
  - Spotify OAuth2 API with required scopes to create and modify playlists.  
  - OpenAI API key for GPT-4 access.  
  - Linkup API token for web search queries.

**Step 14: Testing**

- Activate the workflow.  
- Open the form URL exposed by "On form submission".  
- Enter a playlist description and number of tracks.  
- Submit and verify redirection to the generated Spotify playlist.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                     | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| The workflow uses a custom dark-themed CSS for the input form, styled to match Spotify’s branding.                                                                                                                                              | See the CSS code in the "On form submission" node parameters.                                   |
| The AI agent uses a single call to the Linkup API to perform a web search for relevant tracks, ensuring up-to-date and rich track discovery.                                                                                                  | Linkup API documentation: https://linkup.so/docs                                                     |
| The workflow includes embedded sticky notes explaining the high-level logic and usage instructions, including a YouTube video link for demonstration.                                                                                          | YouTube: https://youtu.be/EgvaD7j4c1A                                                            |
| This workflow was developed by Guillaume Duvernay and leverages n8n’s LangChain integration for advanced AI orchestration.                                                                                                                   |                                                                                                 |
| Spotify API quotas and rate limits may affect playlist creation speed if large numbers of tracks are requested. Consider implementing retry policies or batching for scale.                                                                     | Spotify API docs: https://developer.spotify.com/documentation/web-api/                             |

---

*Disclaimer: The provided content originates exclusively from an automated workflow created using n8n, an integration and automation tool. This process strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.*