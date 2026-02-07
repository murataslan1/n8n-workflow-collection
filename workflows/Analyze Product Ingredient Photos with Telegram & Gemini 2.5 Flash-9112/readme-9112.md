Analyze Product Ingredient Photos with Telegram & Gemini 2.5 Flash

https://n8nworkflows.xyz/workflows/analyze-product-ingredient-photos-with-telegram---gemini-2-5-flash-9112


# Analyze Product Ingredient Photos with Telegram & Gemini 2.5 Flash

### 1. Workflow Overview

This workflow implements a Telegram bot designed to analyze product ingredient photos and texts using Google Gemini 2.5 Flash AI. It targets users who want health and safety advice regarding product ingredients, especially for skincare, hair care, food, and cleaning products. The workflow handles both images and text inputs, extracting ingredient lists from photos or analyzing directly provided texts. It provides recommendations on whether to use a product based on ingredient safety and user context.

The logical structure of the workflow is divided into these blocks:

- **1.1 Input Reception:** Listening for Telegram messages containing photos or text.
- **1.2 Photo Processing & Ingredient Extraction:** If a photo is detected, retrieve the photo file, analyze it with Google Gemini AI to extract a clean ingredient list.
- **1.3 Routing Based on Caption Presence:** After extraction, route the flow depending on whether the user included a caption with the photo.
- **1.4 Ingredient Analysis:** Perform either a simple Use/Do Not Use decision with reason (if caption present) or a detailed structured analysis including advantages, disadvantages, and recommendations (if no caption).
- **1.5 Text Message Handling:** Handle text-only messages, including greetings, ingredient lists provided directly, or unrelated topics, responding appropriately.
- **1.6 Sending Responses:** Send the analysis results or conversational replies back to the user on Telegram.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception

- **Overview:** Listens for incoming Telegram messages that may contain photos or text from users.
- **Nodes Involved:**  
  - `Get a Message photo/text`
  - `Checks if message contains photo`

- **Node Details:**

  - **Get a Message photo/text**  
    - Type: Telegram Trigger (webhook-based)  
    - Role: Receives all Telegram messages sent to the bot (photos or text).  
    - Configuration: Listens for "message" updates only.  
    - Input: Telegram webhook event.  
    - Output: JSON containing the message object, including possible photo array or text.  
    - Edge Cases: No photo or text, malformed message object, Telegram API downtime.

  - **Checks if message contains photo**  
    - Type: If Node (conditional branching)  
    - Role: Checks whether the incoming message contains a photo (specifically checks for the 4th photo size in the array).  
    - Configuration: Condition tests if `message.photo[3].file_id` exists.  
    - Input: Output from the Telegram trigger node.  
    - Output: Two branches: photo present (true) or no photo (false).  
    - Edge Cases: Photo array shorter than 4 (index 3) causing undefined, message without photos.

---

#### 2.2 Photo Processing & Ingredient Extraction

- **Overview:** For messages containing photos, retrieves the photo file from Telegram and uses Google Gemini AI to analyze the image, extracting a clean ordered list of product ingredients and the product type.
- **Nodes Involved:**  
  - `Retrieves photo file from Telegram`  
  - `Analyzes product images using Google Gemini`

- **Node Details:**

  - **Retrieves photo file from Telegram**  
    - Type: Telegram node (file resource)  
    - Role: Downloads the highest resolution version of the photo from Telegram servers using the photo’s `file_id`.  
    - Configuration: Uses the 4th photo size’s `file_id` from the message photo array.  
    - Input: Message JSON with photo info.  
    - Output: Binary data of the photo file.  
    - Credentials: Telegram API OAuth2 token required.  
    - Edge Cases: Photo file not found, API rate limits, invalid file_id.

  - **Analyzes product images using Google Gemini**  
    - Type: Google Gemini (PaLM) Image Analysis node  
    - Role: Sends the binary image to Google Gemini 2.5 Flash model to extract and return only the list of ingredients in order and the product type, ignoring brand names or nutritional info.  
    - Configuration: Model set to `models/gemini-2.5-flash` with input type as binary image.  
    - Input: Binary image from previous node.  
    - Output: Structured text with ingredients extracted.  
    - Credentials: Google Gemini API credentials required.  
    - Edge Cases: Image recognition failure, API timeout, partial or noisy text extraction.

---

#### 2.3 Routing Based on Caption Presence

- **Overview:** Determines if the photo message included a user caption, routing to either a simple use decision or a detailed ingredient analysis.
- **Nodes Involved:**  
  - `Routes based on caption presence`

- **Node Details:**

  - **Routes based on caption presence**  
    - Type: Switch node (conditional routing)  
    - Role: Checks if the Telegram message contains a caption string.  
    - Configuration: Routes to two outputs:  
      - Output 0: Caption exists (non-empty string)  
      - Output 1: Caption missing or empty  
    - Input: Message JSON from Telegram node.  
    - Output: Routes to different analysis branches.  
    - Edge Cases: Caption is whitespace or null, caption with special characters.

---

#### 2.4 Ingredient Analysis

- **Overview:** Analyzes the ingredient list extracted from the image or provided with a caption. Provides a simple Use/Do Not Use recommendation with reason when caption is present, or a detailed structured analysis with advantages, disadvantages, and user suitability when no caption.
- **Nodes Involved:**  
  - Caption present branch:  
    - `Google Gemini Chat Model`  
    - `Structured Output Parser`  
    - `Analyzes ingredients with user caption (Use/Do Not Use decision)`  
    - `Sends Use/Do Not Use recommendation`  

  - No caption branch:  
    - `Google Gemini Chat Model1`  
    - `Structured Output Parser1`  
    - `Analyzes ingredients without caption (detailed analysis)`  
    - `Sends detailed ingredient analysis`

- **Node Details:**

  - **Google Gemini Chat Model (caption present)**  
    - Type: LangChain Chat Model node using Google Gemini  
    - Role: Processes text input combining product ingredients and the user’s caption, framing a health and safety advisory task.  
    - Configuration: Uses Google Gemini API credentials; options left default.  
    - Input: Combined text of ingredients + caption.  
    - Output: AI-generated JSON recommendation with "Use" or "Do Not Use" plus reason.  
    - Edge Cases: API errors, ambiguous captions, incomplete ingredients.

  - **Structured Output Parser (caption present)**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses AI output into JSON with `recommendation` and `reason` fields.  
    - Configuration: Example JSON schema provided to enforce structure.  
    - Input: AI raw text output.  
    - Output: Structured JSON.  
    - Edge Cases: Parsing failures due to malformed AI output.

  - **Analyzes ingredients with user caption (Use/Do Not Use decision)**  
    - Type: LangChain Agent node  
    - Role: Combines the language model and output parser to produce the final decision analysis based on ingredients and caption.  
    - Configuration: System message instructs to analyze ingredients for safety and output a minimal, focused reason.  
    - Input: Ingredients text and user's caption.  
    - Output: Structured JSON recommendation.  
    - Edge Cases: Model hallucination, contradictory reasoning.

  - **Sends Use/Do Not Use recommendation**  
    - Type: Telegram node (send message)  
    - Role: Sends the final recommendation and reason back to the user on Telegram chat.  
    - Configuration: Uses Telegram chat ID from original message; formats response with bold recommendation header.  
    - Input: JSON output from previous node.  
    - Credentials: Telegram API credentials.  
    - Edge Cases: Telegram API send failure, invalid chat ID.

  - **Google Gemini Chat Model1 (no caption)**  
    - Type: LangChain Chat Model node  
    - Role: Processes the ingredient list alone to generate a detailed analysis including advantages, disadvantages, and user suitability.  
    - Configuration: Uses Google Gemini API credentials; default options.  
    - Input: Ingredient list text.  
    - Output: AI-generated text for structured analysis.  
    - Edge Cases: Partial data, model interpretation errors.

  - **Structured Output Parser1 (no caption)**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses AI output into JSON with arrays for advantages, disadvantages, recommended for, and not recommended for.  
    - Configuration: Example JSON schema with arrays of strings.  
    - Input: Raw AI output text.  
    - Output: Structured JSON with four arrays.  
    - Edge Cases: Parsing errors, incomplete lists.

  - **Analyzes ingredients without caption (detailed analysis)**  
    - Type: LangChain Agent node  
    - Role: Combines model and parser to produce a comprehensive structured analysis.  
    - Configuration: System message instructs to give three main points for each category, be factual and clear.  
    - Input: Ingredient list text.  
    - Output: Structured detailed JSON.  
    - Edge Cases: Overly verbose or incomplete analysis.

  - **Sends detailed ingredient analysis**  
    - Type: Telegram node (send message)  
    - Role: Sends formatted multi-category analysis back to Telegram chat.  
    - Configuration: Uses Telegram chat ID; formats output with bullet lists and bold headers for each category.  
    - Credentials: Telegram API credentials.  
    - Edge Cases: Message length limits, Telegram API failures.

---

#### 2.5 Text Message Handling

- **Overview:** Handles non-photo messages including greetings, direct ingredient lists, or off-topic texts, responding conversationally or guiding users to upload photos.
- **Nodes Involved:**  
  - `Handles text messages and greetings`  
  - `Google Gemini Chat Model2`  
  - `Sends conversational responses`

- **Node Details:**

  - **Handles text messages and greetings**  
    - Type: LangChain Agent node  
    - Role: Uses Google Gemini AI to interpret plain text messages. Replies with structured ingredient analysis if ingredients are listed, friendly prompts if greetings, or polite redirection if off-topic.  
    - Configuration: System message defines behavior for greetings, ingredient analysis, and redirection; expects markdown output.  
    - Input: Text from Telegram message.  
    - Output: Text reply for Telegram.  
    - Edge Cases: Ambiguous text, unsupported queries, AI misinterpretation.

  - **Google Gemini Chat Model2**  
    - Type: LangChain Chat Model node  
    - Role: Provides the underlying AI language model for the text handler node.  
    - Configuration: Uses Google Gemini API credentials.  
    - Input: Text message content.  
    - Output: AI-generated replies.  
    - Edge Cases: API errors.

  - **Sends conversational responses**  
    - Type: Telegram node (send message)  
    - Role: Sends the AI-generated conversational reply back to the user.  
    - Configuration: Uses Telegram chat ID; disables attribution.  
    - Credentials: Telegram API credentials.  
    - Edge Cases: API failures, invalid chat ID.

---

#### 2.6 Documentation and Notes

- **Nodes Involved:**  
  - `Sticky Note`

- **Node Details:**

  - **Sticky Note**  
    - Type: Documentation node  
    - Role: Provides comprehensive workflow documentation, including purpose, how it works, sample messages, best use cases, and requirements.  
    - Configuration: Large formatted note with sections on workflow logic, example outputs, and usage context.  
    - Input/Output: None.  
    - Edge Cases: None.

---

### 3. Summary Table

| Node Name                                    | Node Type                                      | Functional Role                                               | Input Node(s)                     | Output Node(s)                                | Sticky Note                                                                                                          |
|----------------------------------------------|------------------------------------------------|---------------------------------------------------------------|----------------------------------|----------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Get a Message photo/text                      | Telegram Trigger                                | Receives Telegram messages (photos or text)                   | (start)                          | Checks if message contains photo             |                                                                                                                      |
| Checks if message contains photo              | If Node                                         | Determines if message contains a photo                         | Get a Message photo/text          | Retrieves photo file from Telegram / Handles text messages and greetings |                                                                                                                      |
| Retrieves photo file from Telegram             | Telegram node (file resource)                    | Downloads photo file using file_id                              | Checks if message contains photo | Analyzes product images using Google Gemini  |                                                                                                                      |
| Analyzes product images using Google Gemini   | Google Gemini Image Analysis                     | Extracts ingredient list and product type from photo           | Retrieves photo file from Telegram | Routes based on caption presence              |                                                                                                                      |
| Routes based on caption presence               | Switch                                           | Routes flow depending on presence of caption                   | Analyzes product images using Google Gemini | Analyzes ingredients with user caption / Analyzes ingredients without caption |                                                                                                                      |
| Analyzes ingredients with user caption (Use/Do Not Use decision) | LangChain Agent + Google Gemini Chat + Parser  | Provides simple use/do not use recommendation with reason      | Routes based on caption presence  | Sends Use/Do Not Use recommendation           |                                                                                                                      |
| Sends Use/Do Not Use recommendation            | Telegram Send Message                            | Sends recommendation and reason to Telegram chat              | Analyzes ingredients with user caption | (end)                                         |                                                                                                                      |
| Analyzes ingredients without caption (detailed analysis) | LangChain Agent + Google Gemini Chat + Parser  | Provides detailed structured analysis of ingredients           | Routes based on caption presence  | Sends detailed ingredient analysis             |                                                                                                                      |
| Sends detailed ingredient analysis             | Telegram Send Message                            | Sends detailed analysis to Telegram chat                       | Analyzes ingredients without caption | (end)                                         |                                                                                                                      |
| Handles text messages and greetings            | LangChain Agent + Google Gemini Chat            | Responds to greetings, off-topic messages, or ingredient lists | Checks if message contains photo (false branch) | Sends conversational responses               |                                                                                                                      |
| Sends conversational responses                  | Telegram Send Message                            | Sends replies to user messages                                 | Handles text messages and greetings | (end)                                         |                                                                                                                      |
| Google Gemini Chat Model                        | LangChain Google Gemini Chat Model              | AI model for caption present ingredient analysis              | Structured Output Parser          | Analyzes ingredients with user caption        |                                                                                                                      |
| Structured Output Parser                        | LangChain Structured Output Parser              | Parses use/do not use AI output into structured JSON           | Google Gemini Chat Model          | Analyzes ingredients with user caption        |                                                                                                                      |
| Google Gemini Chat Model1                       | LangChain Google Gemini Chat Model              | AI model for detailed ingredient analysis without caption     | Structured Output Parser1         | Analyzes ingredients without caption           |                                                                                                                      |
| Structured Output Parser1                       | LangChain Structured Output Parser              | Parses detailed AI output into structured JSON arrays          | Google Gemini Chat Model1         | Analyzes ingredients without caption           |                                                                                                                      |
| Google Gemini Chat Model2                       | LangChain Google Gemini Chat Model              | AI model for handling general text messages                    | (internal to Handles text messages) | Handles text messages and greetings            |                                                                                                                      |
| Sticky Note                                     | Sticky Note                                      | Documentation and project notes                                | None                            | None                                          | # 📌 Product Ingredient Analyzer Bot ... See detailed content in node for full documentation and usage instructions. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node:**  
   - Type: Telegram Trigger  
   - Parameters: Listen for "message" updates only.  
   - Configure webhook and connect Telegram bot token credentials.

2. **Add If Node to Check for Photo:**  
   - Type: If  
   - Condition: Check if `message.photo[3].file_id` exists (index 3 for highest resolution).  
   - Connect Telegram Trigger output to this node.

3. **Photo Branch - Retrieve Photo File:**  
   - Type: Telegram Node (Resource: File)  
   - Parameters: Use `={{ $json.message.photo[3].file_id }}` as fileId.  
   - Connect If Node (true branch) to this node.  
   - Configure Telegram API credentials.

4. **Analyze Photo with Google Gemini:**  
   - Type: Google Gemini (PaLM) Image Analysis  
   - Parameters:  
     - Model: `models/gemini-2.5-flash`  
     - InputType: binary  
     - Operation: analyze  
     - Text prompt: "Analyze this product image and extract only the list of ingredients. Ignore other text like brand names, slogans, or nutritional info. Return the ingredients as clean text in order and What the product is."  
   - Connect Retrieve Photo File node output to this node.  
   - Configure Google Gemini API credentials.

5. **Add Switch Node to Check Caption Presence:**  
   - Type: Switch  
   - Condition: Check if `message.caption` exists and is not empty.  
   - Connect Google Gemini Image Analysis node output to this node.

6. **Caption Present Branch - Simple Decision Analysis:**  
   - Add LangChain Google Gemini Chat Model Node:  
     - Parameters: Use Google Gemini API credentials.  
     - No special options set.  
   - Add LangChain Structured Output Parser Node:  
     - Parameters: JSON schema example with fields `recommendation` and `reason`.  
   - Add LangChain Agent Node to combine model + parser:  
     - System message instructs to analyze ingredients and caption, output JSON with "Use" or "Do Not Use" and reason.  
     - Input text combines extracted ingredients and user caption.  
   - Connect Switch node (caption present output) to LangChain Chat Model, then to parser, then to agent node.

7. **Send Use/Do Not Use Recommendation to Telegram:**  
   - Type: Telegram Send Message node  
   - Parameters:  
     - Text formatted with bold recommendation and reason from agent output.  
     - Chat ID taken from original Telegram message chat.id.  
   - Connect from agent node.  
   - Configure Telegram API credentials.

8. **No Caption Branch - Detailed Ingredient Analysis:**  
   - Add LangChain Google Gemini Chat Model Node1:  
     - Google Gemini API credentials.  
   - Add LangChain Structured Output Parser Node1:  
     - JSON schema example with arrays: advantages, disadvantages, recommended_for, not_recommended_for.  
   - Add LangChain Agent Node1:  
     - System message instructs to analyze ingredients in detail with three main points per category.  
   - Connect Switch node (no caption output) to Chat Model1 → Parser1 → Agent1.

9. **Send Detailed Analysis to Telegram:**  
   - Telegram Send Message node  
   - Format text with bullet lists under bold headers for each category from agent output.  
   - Use chat ID from original Telegram message.  
   - Configure Telegram API credentials.

10. **No Photo Branch - Handle Text Messages:**  
    - LangChain Google Gemini Chat Model2 Node for text AI replies.  
    - LangChain Agent Node to handle greetings, off-topic messages, or ingredient lists.  
    - System message guiding behavior: respond with structured analysis, friendly greetings, or polite redirection.  
    - Connect If Node (no photo branch) to Chat Model2 then to Agent Node.

11. **Send Conversational Responses to Telegram:**  
    - Telegram Send Message node  
    - Text from agent output, send to chat ID from message.  
    - Configure Telegram API credentials.

12. **Add Sticky Note Node:**  
    - Create a sticky note with detailed workflow documentation, including purpose, flow logic, example messages, and requirements.  
    - Position for easy reference.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Context or Link                                                                                          |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| 📌 Product Ingredient Analyzer Bot: Telegram bot analyzing product ingredient photos using Google Gemini AI, providing health & safety recommendations. Best for skincare, hair care, food labels, cleaning products. Requires Telegram bot token and Google Gemini API credentials. See the sticky note in the workflow for detailed explanation and sample messages.                                                                                                                                                                                                                                                                                                         | Sticky Note content inside the workflow node named "Sticky Note"                                       |
| The Google Gemini 2.5 Flash model is used for image analysis and language understanding, requiring proper API credentials and respects rate limits. Proper error handling for API failures, timeouts, and malformed inputs is critical.                                                                                                                                                                                                                                                                                                                                                                                                                                   | Google Gemini API documentation                                                                         |
| Telegram API tokens and correct webhook setup are required to receive and send messages. The Telegram photo array indexing assumes availability of the 4th highest resolution photo which may not always be present; fallback logic may be required for robustness.                                                                                                                                                                                                                                                                                                                                                                                                         | Telegram Bot API documentation                                                                          |
| For best user experience, ensure the bot politely handles off-topic queries and provides helpful prompts to upload photos. The AI system messages are carefully crafted to avoid hallucinations and keep responses concise and factual.                                                                                                                                                                                                                                                                                                                                                                                                                                      | n8n LangChain node documentation                                                                        |
| The workflow structure supports modular extension, such as adding more detailed ingredient sub-analyses or supporting multiple product categories with customized AI prompts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | n8n workflow best practices                                                                              |

---

This completes the detailed and structured reference documentation for the "Analyze Product Ingredient Photos with Telegram & Gemini 2.5 Flash" workflow. It enables advanced users and automation agents to fully understand, reproduce, and maintain the workflow.