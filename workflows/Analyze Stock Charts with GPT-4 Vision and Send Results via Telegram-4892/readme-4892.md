Analyze Stock Charts with GPT-4 Vision and Send Results via Telegram

https://n8nworkflows.xyz/workflows/analyze-stock-charts-with-gpt-4-vision-and-send-results-via-telegram-4892


# Analyze Stock Charts with GPT-4 Vision and Send Results via Telegram

### 1. Workflow Overview

This workflow automates the analysis of stock chart images sent by users on Telegram. Upon receiving a stock chart image via a Telegram message, it resizes the image, sends it to an AI model (GPT-4 Vision) for detailed analysis of the stock’s trend and technical indicators, and finally returns a structured analysis summary back to the user on Telegram.

Logical blocks included:

- **1.1 Input Reception:** Receives stock chart images from Telegram users via a Telegram Trigger node.
- **1.2 Image Preprocessing:** Resizes the received image to a fixed size suitable for AI processing.
- **1.3 AI Analysis Chain:** Sends the image to GPT-4 Vision using a LangChain-based LLM chain with a custom prompt to analyze the stock chart and parse the AI output into structured JSON.
- **1.4 Output Delivery:** Sends the structured analysis result back to the user on Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block listens for incoming Telegram messages and triggers the workflow when a message with an image is received. It automatically downloads the image from Telegram.

- **Nodes Involved:**  
  - Telegram Trigger

- **Node Details:**

  - **Telegram Trigger**  
    - Type & Role: Telegram webhook trigger listening for incoming messages.  
    - Configuration:  
      - Listens to "message" updates only.  
      - Automatically downloads media attached to messages.  
      - Uses Telegram API credentials named "image_anlsis".  
    - Expressions/Variables: None (event-driven).  
    - Input: External Telegram messages.  
    - Output: JSON containing message details including image binary data.  
    - Edge cases:  
      - Authentication errors if Telegram API credentials are invalid or revoked.  
      - Message without an image will still trigger but subsequent nodes may fail.  
      - Network issues causing webhook failure or download failure.  

#### 2.2 Image Preprocessing

- **Overview:**  
  Resizes the received stock chart image to 512x512 pixels to meet the input requirements or optimize AI processing.

- **Nodes Involved:**  
  - Edit Image

- **Node Details:**

  - **Edit Image**  
    - Type & Role: Image manipulation node to resize images.  
    - Configuration:  
      - Operation set to "resize".  
      - Width and height set to 512 pixels each.  
      - Data property name set dynamically to the binary image data from Telegram Trigger (`=data`).  
    - Input: Binary image data from Telegram Trigger.  
    - Output: Resized binary image suitable for AI input.  
    - Edge cases:  
      - Input image missing or corrupted will cause failure.  
      - Unsupported image formats might fail.  

#### 2.3 AI Analysis Chain

- **Overview:**  
  Uses LangChain integration to send the resized image to GPT-4 Vision for detailed stock chart analysis. A custom prompt defines the role and expected JSON output. The output is parsed into a structured JSON schema.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - Basic LLM Chain  
  - Structured Output Parser

- **Node Details:**

  - **OpenAI Chat Model**  
    - Type & Role: AI language model node invoking GPT-4 Vision.  
    - Configuration:  
      - Model set to "gpt-4-vision-preview" for multimodal image understanding.  
      - Uses OpenAI API credentials named "geminiapi".  
    - Input: Image data passed as part of LangChain LLM chain input.  
    - Output: Raw AI completion with analysis text.  
    - Edge cases:  
      - API key quota limits or invalid key.  
      - Timeout or rate limit issues.  
      - Unexpected AI output format.  

  - **Basic LLM Chain**  
    - Type & Role: LangChain LLM Chain node orchestrating prompt and model call.  
    - Configuration:  
      - Custom prompt defines the AI role as stock chart analyst.  
      - Prompt requests JSON output with fields: `search_word` and `content` (detailed stock analysis).  
      - Accepts image binary input via special message type `imageBinary`.  
      - Uses chaining with OpenAI Chat Model as the language model.  
      - Uses Structured Output Parser to parse AI output.  
    - Input: Receives resized image from Edit Image node and AI model & parser connections.  
    - Output: Parsed structured JSON with stock analysis.  
    - Edge cases:  
      - Malformed AI response causing parse errors.  
      - Prompt tuning issues affecting output quality.  

  - **Structured Output Parser**  
    - Type & Role: Parses AI output into a predefined JSON schema.  
    - Configuration:  
      - JSON schema example provided to guide parsing:  
        ```json
        {
          "search_word": "与股票所属行业或公司业务相关的核心检索词",
          "content": "股票名称 + 趋势分析 + 关键价格信息 + 技术面解读"
        }
        ```  
    - Input: AI raw output from OpenAI Chat Model.  
    - Output: Structured JSON object with `search_word` and `content`.  
    - Edge cases:  
      - AI output deviates from schema causing parse failures.  

#### 2.4 Output Delivery

- **Overview:**  
  Sends the structured analysis content back to the Telegram user who sent the original image.

- **Nodes Involved:**  
  - Telegram

- **Node Details:**

  - **Telegram**  
    - Type & Role: Sends messages via Telegram API.  
    - Configuration:  
      - Sends text message with the value of `content` field from AI output (`={{ $json.output.content }}`).  
      - Chat ID dynamically set to the original sender's chat ID (`={{ $('Telegram Trigger').item.json.message.chat.id }}`).  
      - Uses same Telegram API credentials "image_anlsis".  
    - Input: Structured AI analysis JSON from Basic LLM Chain.  
    - Output: Sends message on Telegram; no further outputs.  
    - Edge cases:  
      - Failures if chat ID is missing or invalid.  
      - API errors due to credential or network problems.  

---

### 3. Summary Table

| Node Name            | Node Type                       | Functional Role                  | Input Node(s)      | Output Node(s)    | Sticky Note                           |
|----------------------|--------------------------------|--------------------------------|--------------------|-------------------|-------------------------------------|
| Telegram Trigger      | n8n-nodes-base.telegramTrigger | Input reception of images       | -                  | Edit Image        |                                     |
| Edit Image           | n8n-nodes-base.editImage        | Resize image for AI processing  | Telegram Trigger   | Basic LLM Chain   |                                     |
| OpenAI Chat Model     | @n8n/n8n-nodes-langchain.lmChatOpenAi | GPT-4 Vision AI model call | Basic LLM Chain (ai_languageModel) | Basic LLM Chain (ai_languageModel) |                                     |
| Structured Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Parses AI output to structured JSON | OpenAI Chat Model (ai_outputParser) | Basic LLM Chain (ai_outputParser) |                                     |
| Basic LLM Chain       | @n8n/n8n-nodes-langchain.chainLlm | Orchestrates prompt, AI call, parsing | Edit Image, OpenAI Chat Model, Structured Output Parser | Telegram         |                                     |
| Telegram              | n8n-nodes-base.telegram         | Sends analysis back to user     | Basic LLM Chain    | -                 |                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Type: Telegram Trigger  
   - Parameters:  
     - Updates: Select "message" only  
     - Additional Fields: Enable "Download" to true (auto-download media)  
   - Credentials: Set Telegram API credentials (e.g., "image_anlsis")  
   - Position: Left side (e.g., X: -720, Y: -200)  

2. **Create Edit Image node**  
   - Type: Edit Image  
   - Parameters:  
     - Operation: Resize  
     - Width: 512  
     - Height: 512  
     - Data Property Name: `=data` (to use binary image from Telegram Trigger)  
   - Connect input from Telegram Trigger’s main output  
   - Position: Near Telegram Trigger (e.g., X: -220, Y: -360)  

3. **Create OpenAI Chat Model node**  
   - Type: LangChain Chat LLM (OpenAI)  
   - Parameters:  
     - Model: Select "gpt-4-vision-preview"  
     - Options: Default  
   - Credentials: Set OpenAI API credentials (e.g., "geminiapi")  
   - Position: Center top (e.g., X: 100, Y: -160)  

4. **Create Structured Output Parser node**  
   - Type: LangChain Output Parser (Structured)  
   - Parameters:  
     - JSON Schema Example:  
       ```json
       {
         "search_word": "与股票所属行业或公司业务相关的核心检索词",
         "content": "股票名称 + 趋势分析 + 关键价格信息 + 技术面解读"
       }
       ```  
   - Position: To the right of OpenAI Chat Model (e.g., X: 460, Y: -140)  

5. **Create Basic LLM Chain node**  
   - Type: LangChain Chain LLM  
   - Parameters:  
     - Prompt Type: Define  
     - Text:  
       ```
       这只股票怎么样
       ```
     - Messages:  
       - Add message with detailed prompt text defining the stock chart analysis role and output JSON format  
       - Add `HumanMessagePromptTemplate` with messageType `imageBinary` to accept image input  
     - Connect AI language model to OpenAI Chat Model node  
     - Connect AI output parser to Structured Output Parser node  
   - Connect input from Edit Image node main output  
   - Position: Center (e.g., X: 140, Y: -360)  

6. **Create Telegram node**  
   - Type: Telegram  
   - Parameters:  
     - Text: `={{ $json.output.content }}` (dynamic content from LLM chain output)  
     - Chat ID: `={{ $('Telegram Trigger').item.json.message.chat.id }}` (send back to original sender)  
     - Additional Fields: Default  
   - Credentials: Same Telegram API credentials as Telegram Trigger ("image_anlsis")  
   - Connect input from Basic LLM Chain node main output  
   - Position: Right side (e.g., X: 740, Y: -440)  

7. **Set Connections:**  
   - Telegram Trigger → Edit Image  
   - Edit Image → Basic LLM Chain  
   - OpenAI Chat Model (ai_languageModel) → Basic LLM Chain  
   - Structured Output Parser (ai_outputParser) → Basic LLM Chain  
   - Basic LLM Chain → Telegram  

8. **Activate the workflow** and test by sending a stock chart image on Telegram to the bot.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                          |
|--------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| The prompt is written in Chinese and instructs GPT-4 Vision to analyze stock charts and output JSON with core stock sector keywords and detailed analysis. | Internal prompt definition in Basic LLM Chain node.                     |
| Ensure the Telegram bot token has permissions to receive images and send messages.                 | Telegram Bot API documentation: https://core.telegram.org/bots/api     |
| GPT-4 Vision model "gpt-4-vision-preview" is a preview feature requiring appropriate OpenAI access. | OpenAI API documentation: https://platform.openai.com/docs/models     |
| Image resizing standardizes input size to optimize AI processing and reduce size constraints.     | Edit Image node configuration.                                          |

---

**Disclaimer:**  
The text provided is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.