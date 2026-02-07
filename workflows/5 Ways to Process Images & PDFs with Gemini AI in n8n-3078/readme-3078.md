5 Ways to Process Images & PDFs with Gemini AI in n8n

https://n8nworkflows.xyz/workflows/5-ways-to-process-images---pdfs-with-gemini-ai-in-n8n-3078


# 5 Ways to Process Images & PDFs with Gemini AI in n8n

### 1. Workflow Overview

This workflow demonstrates **five distinct methods** to process and analyze images and PDF documents using Google Gemini AI within n8n. It targets users who want to explore different integration patterns for media analysis, ranging from simple single-image processing to advanced direct API calls with custom prompts.

The workflow is logically divided into these blocks:

- **1.1 Trigger and Initialization**  
  Entry point and setup of URLs and prompts for images and PDFs.

- **1.2 Method 1: Single Image with Automatic Binary Passthrough**  
  Simplest approach: fetch one image and send it directly to AI Agent with automatic binary handling.

- **1.3 Method 2: Multiple Images with Custom Prompts**  
  Handles multiple images, each with its own prompt, using n8n’s item splitting and filtering, then sequential AI processing.

- **1.4 Method 3: Standard n8n Item Processing with Direct API Calls**  
  Uses n8n’s item-by-item processing paradigm with explicit base64 conversion and direct HTTP requests to Gemini API.

- **1.5 Method 4: PDF Analysis via Direct API**  
  Fetches a PDF, converts it to base64, and sends it to Gemini API for document analysis.

- **1.6 Method 5: Image Analysis via Direct API**  
  Fetches an image, converts to base64, and calls Gemini API directly with custom parameters.

Each method suits different use cases depending on volume, customization needs, and control over API parameters.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Initialization

- **Overview:**  
  This block starts the workflow manually and sets up the initial data structures for image URLs and prompts, as well as the PDF and single image URLs.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Define URLs And Prompts (Set)  
  - Define Multiple Image URLs (Set)  
  - Get PDF file (HTTP Request)  
  - Get image from unsplash (HTTP Request)  
  - Get image from unsplash4 (HTTP Request)  
  - Sticky Note (overview note)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to start workflow manually  
    - Configuration: Default, no parameters  
    - Inputs: None  
    - Outputs: Triggers downstream nodes  
    - Edge cases: None

  - **Define URLs And Prompts**  
    - Type: Set  
    - Role: Defines an array of objects, each containing an image URL, a custom prompt, and a boolean flag to process or skip  
    - Configuration: Hardcoded array with 3 entries (2 processed, 1 skipped)  
    - Key expressions: Uses JavaScript expression to define array  
    - Inputs: Trigger node  
    - Outputs: Passes array downstream for splitting  
    - Edge cases: If malformed URLs or prompts, downstream nodes may fail

  - **Define Multiple Image URLs**  
    - Type: Set  
    - Role: Defines a simple array of image URLs for batch processing  
    - Configuration: Hardcoded array of 2 image URLs  
    - Inputs: Trigger node  
    - Outputs: Passes array downstream for splitting  
    - Edge cases: Same as above

  - **Get PDF file**  
    - Type: HTTP Request  
    - Role: Fetches a sample PDF document from a public URL  
    - Configuration: GET request to a fixed W3C dummy PDF URL  
    - Inputs: Trigger node  
    - Outputs: Binary PDF data  
    - Edge cases: Network errors, 404, or invalid PDF data

  - **Get image from unsplash**  
    - Type: HTTP Request  
    - Role: Fetches a single image from Unsplash URL  
    - Configuration: GET request with URL from node parameter  
    - Inputs: Trigger node  
    - Outputs: Binary image data  
    - Edge cases: Network errors, 404, rate limiting

  - **Get image from unsplash4**  
    - Type: HTTP Request  
    - Role: Fetches another single image from Unsplash for Method 2  
    - Configuration: Fixed URL with query parameters for image quality and size  
    - Inputs: Trigger node  
    - Outputs: Binary image data  
    - Edge cases: Same as above

  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Provides a high-level explanation of the workflow’s five methods  
    - Content: Summary of the five approaches and their use cases

---

#### 1.2 Method 1: Single Image with Automatic Binary Passthrough

- **Overview:**  
  Demonstrates the simplest way to analyze a single image by fetching it and sending it directly to the AI Agent node with automatic binary passthrough enabled.

- **Nodes Involved:**  
  - Get image from unsplash2 (HTTP Request)  
  - Loop Over Items (Split In Batches)  
  - AI Agent (LangChain Agent)  
  - Google Gemini Chat Model (LangChain LM Chat Google Gemini)  
  - Sticky Note1

- **Node Details:**

  - **Get image from unsplash2**  
    - Type: HTTP Request  
    - Role: Fetches image from URL passed from Filter node  
    - Configuration: URL expression from input JSON field `url`  
    - Inputs: Filter (optional) node  
    - Outputs: Binary image data  
    - Edge cases: Network failures, invalid URL

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Role: Processes items in batches (default batch size) to handle multiple images sequentially  
    - Configuration: Default options, no batch size override  
    - Inputs: Get image from unsplash2  
    - Outputs: Batches to AI Agent  
    - Edge cases: Large batch sizes may cause timeouts

  - **AI Agent**  
    - Type: LangChain Agent  
    - Role: Sends image data to Google Gemini AI for analysis with automatic binary passthrough enabled  
    - Configuration:  
      - Text input: all items from Loop Over Items node  
      - PassthroughBinaryImages: true (enables automatic handling of binary images)  
      - Prompt type: define (custom prompt defined in node)  
    - Inputs: Loop Over Items (batch)  
    - Outputs: AI analysis results  
    - Credentials: Google Gemini API via LangChain node  
    - Edge cases: API auth errors, binary data handling issues, timeout

  - **Google Gemini Chat Model**  
    - Type: LangChain LM Chat Google Gemini  
    - Role: Language model used by AI Agent for generating responses  
    - Configuration: Model set to "models/gemini-2.0-flash"  
    - Credentials: Google Palm API key  
    - Inputs: Connected internally to AI Agent  
    - Edge cases: API quota limits, network errors

  - **Sticky Note1**  
    - Content: Explains this method as the easiest approach for single image analysis with automatic binary passthrough.

---

#### 1.3 Method 2: Multiple Images with Custom Prompts

- **Overview:**  
  Processes multiple images, each with its own prompt and a flag to control processing. It splits the array into items, filters out those marked not to process, fetches images, and sends each to the AI Agent with the specific prompt.

- **Nodes Involved:**  
  - Define URLs And Prompts (Set) [also in 1.1]  
  - Split Out (Split Out)  
  - Filter (optional)  
  - Get image from unsplash2 (HTTP Request) [shared with Method 1]  
  - Loop Over Items (Split In Batches) [shared with Method 1]  
  - AI Agent (LangChain Agent) [shared with Method 1]  
  - Google Gemini Chat Model (LangChain LM Chat Google Gemini) [shared]  
  - Sticky Note2

- **Node Details:**

  - **Split Out**  
    - Type: Split Out  
    - Role: Splits the array of objects (URLs + prompts) into individual items for processing  
    - Configuration: Field to split out is `urls` (array of objects)  
    - Inputs: Define URLs And Prompts  
    - Outputs: Individual items downstream  
    - Edge cases: Empty arrays cause no output

  - **Filter (optional)**  
    - Type: Filter  
    - Role: Filters items where the `process` field is true, skipping those marked false  
    - Configuration: Boolean condition on `process` field equals true  
    - Inputs: Split Out  
    - Outputs: Filtered items only  
    - Edge cases: If no items pass filter, downstream nodes receive no input

  - **Get image from unsplash2**  
    - See above in Method 1

  - **Loop Over Items**  
    - See above in Method 1

  - **AI Agent**  
    - See above in Method 1  
    - Note: The prompt text is dynamically set to the current item's prompt (via expression `={{ $('Loop Over Items').all() }}` in the original node)

  - **Google Gemini Chat Model**  
    - See above in Method 1

  - **Sticky Note2**  
    - Content: Explains this method as suitable for multiple images with custom prompts and selective processing.

---

#### 1.4 Method 3: Standard n8n Item Processing with Direct API Calls

- **Overview:**  
  Demonstrates n8n’s standard approach to processing multiple images by defining URLs, splitting into items, fetching images, converting them to base64, and making direct HTTP POST calls to Gemini API.

- **Nodes Involved:**  
  - Define Multiple Image URLs (Set) [also in 1.1]  
  - Split Out to multiple items (Split Out)  
  - Get image from unsplash3 (HTTP Request)  
  - Transform to base (Extract From File)  
  - Call Gemini API1 (HTTP Request)  
  - Sticky Note3

- **Node Details:**

  - **Split Out to multiple items**  
    - Type: Split Out  
    - Role: Splits array of image URLs into individual items  
    - Configuration: Field to split out is `urls`  
    - Inputs: Define Multiple Image URLs  
    - Outputs: Individual URLs downstream  
    - Edge cases: Empty array results in no output

  - **Get image from unsplash3**  
    - Type: HTTP Request  
    - Role: Fetches each image URL individually  
    - Configuration: URL expression from input JSON field `urls`  
    - Inputs: Split Out to multiple items  
    - Outputs: Binary image data  
    - Edge cases: Network errors, invalid URLs

  - **Transform to base**  
    - Type: Extract From File  
    - Role: Converts binary image data to base64 string stored in JSON property  
    - Configuration: Operation set to "binaryToPropery" (likely a typo, should be "binaryToProperty")  
    - Inputs: Get image from unsplash3  
    - Outputs: JSON with base64 encoded image data  
    - Edge cases: Binary data missing or corrupted

  - **Call Gemini API1**  
    - Type: HTTP Request  
    - Role: Makes direct POST request to Gemini API for image content analysis  
    - Configuration:  
      - URL: Gemini API endpoint for model "gemini-2.0-flash" generateContent method  
      - Method: POST  
      - Body: JSON with "contents" array including text prompt and inline base64 image data  
      - Authentication: Query Authentication with API key parameter named "key"  
    - Inputs: Transform to base  
    - Outputs: Gemini API response with analysis  
    - Edge cases: API key missing or invalid, network errors, malformed JSON body

  - **Sticky Note3**  
    - Content: Describes this method as standard n8n item-by-item processing with direct API calls.

---

#### 1.5 Method 4: PDF Analysis via Direct API

- **Overview:**  
  Fetches a PDF file, converts it to base64, and sends it directly to Gemini API for document content analysis.

- **Nodes Involved:**  
  - Get PDF file (HTTP Request) [also in 1.1]  
  - Transform to base64 (pdf) (Extract From File)  
  - Call Gemini API with PDF (HTTP Request)  
  - Sticky Note4

- **Node Details:**

  - **Transform to base64 (pdf)**  
    - Type: Extract From File  
    - Role: Converts binary PDF data to base64 string in JSON property  
    - Configuration: Operation "binaryToPropery"  
    - Inputs: Get PDF file  
    - Outputs: JSON with base64 encoded PDF data  
    - Edge cases: Binary data missing or corrupted

  - **Call Gemini API with PDF**  
    - Type: HTTP Request  
    - Role: Sends base64 encoded PDF to Gemini API for analysis  
    - Configuration:  
      - URL: Gemini API endpoint for "gemini-2.0-flash" generateContent  
      - Method: POST  
      - Body: JSON with "contents" array including prompt text and inline base64 PDF data  
      - Authentication: Query Authentication with API key  
    - Inputs: Transform to base64 (pdf)  
    - Outputs: API response with PDF analysis  
    - Edge cases: API errors, invalid PDF data, network issues

  - **Sticky Note4**  
    - Content: Explains this method is best for document analysis and text extraction from PDFs.

---

#### 1.6 Method 5: Image Analysis via Direct API

- **Overview:**  
  Fetches an image, converts it to base64, and makes a direct HTTP POST call to Gemini API with custom parameters for advanced control.

- **Nodes Involved:**  
  - Get image from unsplash (HTTP Request) [also in 1.1]  
  - Transform to base64 (image) (Extract From File)  
  - Call Gemini API with Image (HTTP Request)  
  - Sticky Note5

- **Node Details:**

  - **Transform to base64 (image)**  
    - Type: Extract From File  
    - Role: Converts binary image data to base64 string in JSON property  
    - Configuration: Operation "binaryToPropery"  
    - Inputs: Get image from unsplash  
    - Outputs: JSON with base64 encoded image data  
    - Edge cases: Binary data missing or corrupted

  - **Call Gemini API with Image**  
    - Type: HTTP Request  
    - Role: Sends base64 encoded image to Gemini API for analysis with custom prompt  
    - Configuration:  
      - URL: Gemini API endpoint for "gemini-2.0-flash" generateContent  
      - Method: POST  
      - Body: JSON with "contents" array including prompt text and inline base64 image data  
      - Authentication: Query Authentication with API key  
    - Inputs: Transform to base64 (image)  
    - Outputs: API response with image analysis  
    - Edge cases: API errors, invalid image data, network issues

  - **Sticky Note5**  
    - Content: Describes this method as suitable for advanced users needing precise API control.

---

### 3. Summary Table

| Node Name                  | Node Type                             | Functional Role                                  | Input Node(s)                   | Output Node(s)                   | Sticky Note                                                                                       |
|----------------------------|-------------------------------------|-------------------------------------------------|--------------------------------|---------------------------------|-------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                      | Entry point to start workflow                    | None                           | Define URLs And Prompts, Define Multiple Image URLs, Get PDF file, Get image from unsplash, Get image from unsplash4 | ## When clicking "Test workflow" - overview of 5 methods                                        |
| Define URLs And Prompts     | Set                                 | Defines array of image URLs with prompts and flags | When clicking ‘Test workflow’  | Split Out                       | ## METHOD 2: Multiple images with custom prompts                                                |
| Split Out                  | Split Out                           | Splits array into individual items               | Define URLs And Prompts         | Filter (optional)               | ## METHOD 2: Multiple images with custom prompts                                                |
| Filter (optional)           | Filter                              | Filters items to process only those flagged true | Split Out                      | Get image from unsplash2        | ## METHOD 2: Multiple images with custom prompts                                                |
| Get image from unsplash2    | HTTP Request                       | Fetches image from URL                            | Filter (optional)               | Loop Over Items                 | ## METHOD 1: Single image with automatic binary passthrough; ## METHOD 2: Multiple images with custom prompts |
| Loop Over Items             | Split In Batches                   | Processes items in batches                        | Get image from unsplash2        | AI Agent                       | ## METHOD 1: Single image with automatic binary passthrough; ## METHOD 2: Multiple images with custom prompts |
| AI Agent                   | LangChain Agent                    | Sends images to Gemini AI with automatic binary passthrough | Loop Over Items                | None                          | ## METHOD 1: Single image with automatic binary passthrough; ## METHOD 2: Multiple images with custom prompts |
| Google Gemini Chat Model    | LangChain LM Chat Google Gemini   | Language model used by AI Agent                   | AI Agent                      | AI Agent                      | ## METHOD 1: Single image with automatic binary passthrough; ## METHOD 2: Multiple images with custom prompts |
| Define Multiple Image URLs  | Set                                 | Defines array of image URLs for batch processing | When clicking ‘Test workflow’  | Split Out to multiple items     | ## METHOD 3: Standard n8n item processing with direct API                                       |
| Split Out to multiple items | Split Out                           | Splits array into individual items               | Define Multiple Image URLs      | Get image from unsplash3        | ## METHOD 3: Standard n8n item processing with direct API                                       |
| Get image from unsplash3    | HTTP Request                       | Fetches each image URL                            | Split Out to multiple items     | Transform to base               | ## METHOD 3: Standard n8n item processing with direct API                                       |
| Transform to base           | Extract From File                  | Converts binary image to base64 string            | Get image from unsplash3        | Call Gemini API1               | ## METHOD 3: Standard n8n item processing with direct API                                       |
| Call Gemini API1            | HTTP Request                      | Direct API call to Gemini for image analysis      | Transform to base               | None                          | ## METHOD 3: Standard n8n item processing with direct API                                       |
| Get PDF file                | HTTP Request                      | Fetches PDF document                              | When clicking ‘Test workflow’  | Transform to base64 (pdf)       | ## METHOD 4: PDF analysis via direct API                                                       |
| Transform to base64 (pdf)   | Extract From File                  | Converts binary PDF to base64 string              | Get PDF file                   | Call Gemini API with PDF        | ## METHOD 4: PDF analysis via direct API                                                       |
| Call Gemini API with PDF    | HTTP Request                      | Direct API call to Gemini for PDF analysis        | Transform to base64 (pdf)       | None                          | ## METHOD 4: PDF analysis via direct API                                                       |
| Get image from unsplash     | HTTP Request                      | Fetches single image                              | When clicking ‘Test workflow’  | Transform to base64 (image)     | ## METHOD 5: Image analysis via direct API                                                     |
| Transform to base64 (image) | Extract From File                  | Converts binary image to base64 string            | Get image from unsplash         | Call Gemini API with Image      | ## METHOD 5: Image analysis via direct API                                                     |
| Call Gemini API with Image  | HTTP Request                      | Direct API call to Gemini for image analysis      | Transform to base64 (image)     | None                          | ## METHOD 5: Image analysis via direct API                                                     |
| Get image from unsplash4    | HTTP Request                      | Fetches image for Method 2                        | When clicking ‘Test workflow’  | AI Agent2                     |                                                                                                 |
| AI Agent2                  | LangChain Agent                    | AI Agent for Method 2 with fixed prompt           | Get image from unsplash4        | None                          |                                                                                                 |
| Google Gemini Chat Model1   | LangChain LM Chat Google Gemini   | Language model for AI Agent2                       | AI Agent2                     | AI Agent2                     |                                                                                                 |
| Sticky Note                 | Sticky Note                       | Workflow overview note                             | None                          | None                          | ## When clicking "Test workflow" - overview of 5 methods                                        |
| Sticky Note1                | Sticky Note                       | Method 1 explanation                              | None                          | None                          | ## METHOD 1: Single image with automatic binary passthrough                                    |
| Sticky Note2                | Sticky Note                       | Method 2 explanation                              | None                          | None                          | ## METHOD 2: Multiple images with custom prompts                                               |
| Sticky Note3                | Sticky Note                       | Method 3 explanation                              | None                          | None                          | ## METHOD 3: Standard n8n item processing with direct API                                      |
| Sticky Note4                | Sticky Note                       | Method 4 explanation                              | None                          | None                          | ## METHOD 4: PDF analysis via direct API                                                      |
| Sticky Note5                | Sticky Note                       | Method 5 explanation                              | None                          | None                          | ## METHOD 5: Image analysis via direct API                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger node**  
   - Name: "When clicking ‘Test workflow’"  
   - Purpose: Entry point to manually start the workflow.

2. **Create Set node for Method 2 URLs and Prompts**  
   - Name: "Define URLs And Prompts"  
   - Add an assignment:  
     - Field: `urls` (array)  
     - Value: Array of objects with keys: `url` (string), `prompt` (string), `process` (boolean)  
     - Example:  
       ```json
       [
         { "url": "https://plus.unsplash.com/premium_photo-1740023685108-a12c27170d51?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA==", "prompt": "what is special about this image?", "process": true },
         { "url": "https://images.unsplash.com/photo-1739609579483-00b49437cc45?q=80&w=2342&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA==", "prompt": "what is the main color?", "process": true },
         { "url": "https://plus.unsplash.com/premium_photo-1740023685108-a12c27170d51?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA==", "prompt": "test", "process": false }
       ]
       ```

3. **Create Split Out node**  
   - Name: "Split Out"  
   - Field to split out: `urls`  
   - Connect from "Define URLs And Prompts"

4. **Create Filter node**  
   - Name: "Filter (optional)"  
   - Condition: `process` equals true (boolean)  
   - Connect from "Split Out"

5. **Create HTTP Request node**  
   - Name: "Get image from unsplash2"  
   - Method: GET  
   - URL: Expression `{{$json["url"]}}`  
   - Connect from "Filter (optional)"

6. **Create Split In Batches node**  
   - Name: "Loop Over Items"  
   - Default batch size  
   - Connect from "Get image from unsplash2"

7. **Create LangChain AI Agent node**  
   - Name: "AI Agent"  
   - Text: Expression `={{ $('Loop Over Items').all() }}` (or dynamic prompt per item)  
   - Enable "Automatically Passthrough Binary Images"  
   - Prompt type: define  
   - Connect from "Loop Over Items"  
   - Credentials: Google Gemini API via LangChain model

8. **Create LangChain LM Chat Google Gemini node**  
   - Name: "Google Gemini Chat Model"  
   - Model Name: "models/gemini-2.0-flash"  
   - Connect as AI language model for "AI Agent"  
   - Credentials: Google Palm API key

9. **Create Set node for Method 3 URLs**  
   - Name: "Define Multiple Image URLs"  
   - Assign field `urls` as array of image URLs (strings)  
   - Connect from Manual Trigger

10. **Create Split Out node**  
    - Name: "Split Out to multiple items"  
    - Field to split out: `urls`  
    - Connect from "Define Multiple Image URLs"

11. **Create HTTP Request node**  
    - Name: "Get image from unsplash3"  
    - Method: GET  
    - URL: Expression `{{$json["urls"]}}`  
    - Connect from "Split Out to multiple items"

12. **Create Extract From File node**  
    - Name: "Transform to base"  
    - Operation: binaryToProperty  
    - Connect from "Get image from unsplash3"

13. **Create HTTP Request node**  
    - Name: "Call Gemini API1"  
    - Method: POST  
    - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`  
    - Body (JSON):  
      ```json
      {
        "contents": [
          {
            "parts": [
              {"text": "Whats on this image?"},
              {
                "inline_data": {
                  "mime_type": "image/jpeg",
                  "data": "{{ $json.data }}"
                }
              }
            ]
          }
        ]
      }
      ```  
    - Authentication: Query Authentication with parameter `key` set to your Gemini API key  
    - Connect from "Transform to base"

14. **Create HTTP Request node**  
    - Name: "Get PDF file"  
    - Method: GET  
    - URL: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`  
    - Connect from Manual Trigger

15. **Create Extract From File node**  
    - Name: "Transform to base64 (pdf)"  
    - Operation: binaryToProperty  
    - Connect from "Get PDF file"

16. **Create HTTP Request node**  
    - Name: "Call Gemini API with PDF"  
    - Method: POST  
    - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`  
    - Body (JSON):  
      ```json
      {
        "contents": [
          {
            "parts": [
              {"text": "Whats on this pdf?"},
              {
                "inline_data": {
                  "mime_type": "application/pdf",
                  "data": "{{ $json.data }}"
                }
              }
            ]
          }
        ]
      }
      ```  
    - Authentication: Query Authentication with parameter `key` set to your Gemini API key  
    - Connect from "Transform to base64 (pdf)"

17. **Create HTTP Request node**  
    - Name: "Get image from unsplash"  
    - Method: GET  
    - URL: Fixed Unsplash image URL  
    - Connect from Manual Trigger

18. **Create Extract From File node**  
    - Name: "Transform to base64 (image)"  
    - Operation: binaryToProperty  
    - Connect from "Get image from unsplash"

19. **Create HTTP Request node**  
    - Name: "Call Gemini API with Image"  
    - Method: POST  
    - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`  
    - Body (JSON):  
      ```json
      {
        "contents": [
          {
            "parts": [
              {"text": "Whats on this image?"},
              {
                "inline_data": {
                  "mime_type": "image/jpeg",
                  "data": "{{ $json.data }}"
                }
              }
            ]
          }
        ]
      }
      ```  
    - Authentication: Query Authentication with parameter `key` set to your Gemini API key  
    - Connect from "Transform to base64 (image)"

20. **Create HTTP Request node**  
    - Name: "Get image from unsplash4"  
    - Method: GET  
    - URL: Fixed Unsplash image URL for Method 2  
    - Connect from Manual Trigger

21. **Create LangChain AI Agent node**  
    - Name: "AI Agent2"  
    - Text: Fixed prompt "whats on the image"  
    - Enable "Automatically Passthrough Binary Images"  
    - Prompt type: define  
    - Connect from "Get image from unsplash4"  
    - Credentials: Google Gemini API via LangChain model

22. **Create LangChain LM Chat Google Gemini node**  
    - Name: "Google Gemini Chat Model1"  
    - Model Name: "models/gemini-2.0-flash"  
    - Connect as AI language model for "AI Agent2"  
    - Credentials: Google Palm API key

23. **Add Sticky Notes**  
    - Add explanatory sticky notes near each method block with the provided content.

---

### 5. General Notes & Resources

| Note Content                                                                                   | Context or Link                                                                                   |
|------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Setup time: ~5-10 minutes. Requires Google Gemini API key and n8n with HTTP Request and AI Agent nodes. | Workflow description                                                                              |
| For HTTP Request nodes calling Gemini API directly, use Query Authentication with parameter "key" set to your API key. | Setup instructions                                                                               |
| Workflow demonstrates 5 methods to analyze images and PDFs with Google Gemini AI in n8n.        | Workflow purpose                                                                                 |
| Eager to learn about other methods; user feedback encouraged.                                  | Workflow description                                                                             |
| Google Gemini model used: "models/gemini-2.0-flash"                                            | Model specification                                                                              |
| Useful links: Gemini API documentation (not included here, but recommended to consult)          | Recommended external resource                                                                    |

---

This document provides a detailed, structured reference for understanding, reproducing, and modifying the "5 Ways to Process Images & PDFs with Gemini AI in n8n" workflow, including all nodes, configurations, and integration details.