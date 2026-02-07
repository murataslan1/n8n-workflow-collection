3D Figurine Orthographic Views with Midjourney and GPT-4o-image API

https://n8nworkflows.xyz/workflows/3d-figurine-orthographic-views-with-midjourney-and-gpt-4o-image-api-3628


# 3D Figurine Orthographic Views with Midjourney and GPT-4o-image API

### 1. Workflow Overview

This workflow automates the generation of orthographic views (front, side, back) of 3D figurines by leveraging AI image generation and processing APIs. It targets 3D designers, e-commerce operators, and beginners in 3D modeling who need quick, standardized multi-angle images for design review or product display.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Trigger:** Manual trigger to start the workflow.
- **1.2 Initial Image Generation:** Uses PiAPI’s Midjourney model to generate an initial 3D figurine image based on a detailed prompt.
- **1.3 Polling and Verification:** Polls the Midjourney API until the image generation task is completed and retrieves the generated image URLs.
- **1.4 Random Image Selection:** Selects a random temporary image URL from the generated images.
- **1.5 Orthographic View Generation:** Sends the selected image to GPT-4o-Image API to generate a composite orthographic view sheet (front, side, back).
- **1.6 Image URL Extraction and Output:** Extracts the final image URL from the GPT-4o-Image API streamed response and outputs it.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Trigger

- **Overview:** Initiates the workflow manually by user interaction.
- **Nodes Involved:**  
  - When clicking ‘Test workflow’
- **Node Details:**

| Node Name                 | Details                                                                                  |
|---------------------------|------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | - Type: Manual Trigger<br>- Role: Starts the workflow on user command<br>- No parameters<br>- Outputs to Midjourney Generator<br>- Edge cases: None (manual trigger) |

---

#### 2.2 Initial Image Generation

- **Overview:** Sends a POST request to PiAPI’s Midjourney model to generate an initial 3D figurine image based on a detailed prompt describing the character and style.
- **Nodes Involved:**  
  - Midjourney Generator
- **Node Details:**

| Node Name           | Details                                                                                      |
|---------------------|----------------------------------------------------------------------------------------------|
| Midjourney Generator | - Type: HTTP Request<br>- Role: Sends image generation request to PiAPI Midjourney API<br>- Method: POST<br>- URL: https://api.piapi.ai/api/v1/task<br>- Body: JSON with model "midjourney", task_type "imagine", detailed prompt describing a cartoon-style girl figurine, aspect ratio 3:2, turbo mode<br>- Headers: Requires `x-api-key` header (user must provide)<br>- Output: Task ID for polling<br>- Input: From manual trigger<br>- Output to: Get Midjourney URL<br>- Edge cases: API key missing/invalid, network timeout, prompt format errors |

---

#### 2.3 Polling and Verification

- **Overview:** Polls the PiAPI Midjourney task endpoint repeatedly until the image generation status is "completed". If not completed, waits and retries.
- **Nodes Involved:**  
  - Get Midjourney URL  
  - Verify URL Acquisition  
  - Wait for Generation
- **Node Details:**

| Node Name           | Details                                                                                      |
|---------------------|----------------------------------------------------------------------------------------------|
| Get Midjourney URL   | - Type: HTTP Request<br>- Role: Polls task status using task_id from Midjourney Generator<br>- Method: GET<br>- URL: https://api.piapi.ai/api/v1/task/{{task_id}}<br>- Headers: `x-api-key` required (hardcoded in node)<br>- Output: Task status and data including temporary image URLs<br>- Input: From Midjourney Generator or Wait for Generation<br>- Output to: Verify URL Acquisition<br>- Edge cases: API key invalid, task_id missing, network issues |
| Verify URL Acquisition | - Type: IF Node<br>- Role: Checks if task status equals "completed"<br>- Input: From Get Midjourney URL<br>- Output: If true, proceed to Get Random Image URL; if false, proceed to Wait for Generation<br>- Edge cases: Unexpected status values, missing status field |
| Wait for Generation  | - Type: Wait Node<br>- Role: Waits a certain time before retrying polling<br>- Input: From Verify URL Acquisition (if not completed)<br>- Output: Back to Get Midjourney URL<br>- Edge cases: None, but long wait times may delay workflow |

---

#### 2.4 Random Image Selection

- **Overview:** From the completed task’s output, selects one random temporary image URL to use for the next step.
- **Nodes Involved:**  
  - Get Random Image URL
- **Node Details:**

| Node Name           | Details                                                                                      |
|---------------------|----------------------------------------------------------------------------------------------|
| Get Random Image URL | - Type: Code Node (JavaScript)<br>- Role: Picks a random URL from the array of temporary_image_urls<br>- Input: From Verify URL Acquisition (completed task data)<br>- Output: Single random_temp_url string<br>- Edge cases: Empty or missing temporary_image_urls array, invalid data format |

---

#### 2.5 Orthographic View Generation

- **Overview:** Sends the selected image URL to GPT-4o-Image API to generate a composite orthographic view sheet with front, side, and back views.
- **Nodes Involved:**  
  - Generation 3-view Image with GPT-4o-Image
- **Node Details:**

| Node Name                      | Details                                                                                      |
|--------------------------------|----------------------------------------------------------------------------------------------|
| Generation 3-view Image with GPT-4o-Image | - Type: HTTP Request<br>- Role: Sends chat completion request to PiAPI GPT-4o-Image API<br>- Method: POST<br>- URL: https://api.piapi.ai/v1/chat/completions<br>- Body: JSON with model "gpt-4o-image-preview", messages array containing the image URL and instructions to generate a turnaround sheet with front, side, back views, aspect ratio 10:3<br>- Authentication: HTTP Header Auth with Bearer token (configured via credentials)<br>- Input: From Get Random Image URL<br>- Output: Streamed response with image data<br>- Output to: Get Image<br>- Edge cases: Auth failure, streaming errors, malformed response |

---

#### 2.6 Image URL Extraction and Output

- **Overview:** Parses the streamed response from GPT-4o-Image API to extract the final image URL embedded in Markdown image syntax. Checks if extraction succeeded and outputs the final image URL.
- **Nodes Involved:**  
  - Get Image  
  - Check if the URL is obtained  
  - Get Final Output
- **Node Details:**

| Node Name             | Details                                                                                      |
|-----------------------|----------------------------------------------------------------------------------------------|
| Get Image             | - Type: Code Node (JavaScript)<br>- Role: Parses streamed chunks to find Markdown image URL<br>- Logic: Splits response by double newlines, reverse iterates, parses JSON, matches Markdown image syntax to extract URL<br>- Output: image_url and finish_reason ("success" or "not_found")<br>- Input: From Generation 3-view Image with GPT-4o-Image<br>- Output to: Check if the URL is obtained<br>- Edge cases: Malformed chunk data, no image found, JSON parse errors |
| Check if the URL is obtained | - Type: IF Node<br>- Role: Checks if finish_reason equals "not_found"<br>- Input: From Get Image<br>- Output: If not found, loops back to Generation 3-view Image with GPT-4o-Image to retry; if found, proceeds to Get Final Output<br>- Edge cases: Unexpected finish_reason values |
| Get Final Output       | - Type: Code Node (JavaScript)<br>- Role: Formats final output with extracted image_url<br>- Input: From Check if the URL is obtained (success path)<br>- Output: Final image URL for user consumption<br>- Edge cases: None |

---

### 3. Summary Table

| Node Name                      | Node Type           | Functional Role                              | Input Node(s)                   | Output Node(s)                   | Sticky Note                                                                                  |
|--------------------------------|---------------------|----------------------------------------------|--------------------------------|---------------------------------|----------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’   | Manual Trigger      | Start workflow manually                       | -                              | Midjourney Generator             |                                                                                              |
| Midjourney Generator            | HTTP Request       | Request initial 3D figurine image generation | When clicking ‘Test workflow’  | Get Midjourney URL               | Requires user to fill in X-API-Key header for PiAPI account                                  |
| Get Midjourney URL              | HTTP Request       | Poll Midjourney task status and get results  | Midjourney Generator, Wait for Generation | Verify URL Acquisition           | API key is hardcoded here; ensure it matches user’s PiAPI key                                |
| Verify URL Acquisition          | IF Node            | Check if image generation is completed       | Get Midjourney URL             | Get Random Image URL, Wait for Generation |                                                                                              |
| Wait for Generation             | Wait Node          | Wait before retrying polling                   | Verify URL Acquisition (false) | Get Midjourney URL               |                                                                                              |
| Get Random Image URL            | Code Node          | Select a random temporary image URL           | Verify URL Acquisition (true)  | Generation 3-view Image with GPT-4o-Image |                                                                                              |
| Generation 3-view Image with GPT-4o-Image | HTTP Request       | Generate orthographic views composite image   | Get Random Image URL           | Get Image                      | Uses GPT-4o-Image API with Bearer token via HTTP Header Auth credential                      |
| Get Image                      | Code Node          | Extract final image URL from streamed response | Generation 3-view Image with GPT-4o-Image | Check if the URL is obtained     | Parses streamed chunks for Markdown image URL                                               |
| Check if the URL is obtained    | IF Node            | Verify if final image URL was found           | Get Image                     | Generation 3-view Image with GPT-4o-Image, Get Final Output | Retries if image URL not found                                                              |
| Get Final Output                | Code Node          | Format and output the final image URL         | Check if the URL is obtained  | -                               |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: `When clicking ‘Test workflow’`  
   - Type: Manual Trigger  
   - No parameters  
   - This node starts the workflow.

2. **Create HTTP Request Node for Midjourney Generation**  
   - Name: `Midjourney Generator`  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.piapi.ai/api/v1/task`  
   - Headers: Add header `x-api-key` (value to be provided by user)  
   - Body (JSON):  
     ```json
     {
       "model": "midjourney",
       "task_type": "imagine",
       "input": {
         "prompt": "IP design, pop mart style, cartoon-style characters, a little girl with a red satche on her back, a pair of big eyes, long eyelashes, with pigtails, wearing a red beret, red shoes, chubby body, wearing a red and white striped dress, clean white background, crystal-clear material::5, 3D rendering, 3D modeling --ar 3:4 --niji 6",
         "aspect_ratio": "3:2",
         "process_mode": "turbo",
         "skip_prompt_check": false
       }
     }
     ```  
   - Connect output from Manual Trigger to this node.

3. **Create HTTP Request Node to Poll Midjourney Task Status**  
   - Name: `Get Midjourney URL`  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.piapi.ai/api/v1/task/{{ $json.data.task_id }}` (use expression to inject task_id)  
   - Headers: Add header `x-api-key` with your PiAPI key (hardcoded or credential)  
   - Connect output from `Midjourney Generator` to this node.

4. **Create IF Node to Check Task Completion**  
   - Name: `Verify URL Acquisition`  
   - Type: IF Node  
   - Condition: Check if `{{$json.data.status}}` equals `"completed"`  
   - Connect output from `Get Midjourney URL` to this node.

5. **Create Wait Node for Retry Delay**  
   - Name: `Wait for Generation`  
   - Type: Wait Node  
   - No parameters (default wait time or configure as needed)  
   - Connect the false output of `Verify URL Acquisition` to this node.

6. **Connect Wait Node back to Polling Node**  
   - Connect output of `Wait for Generation` back to `Get Midjourney URL` to create a polling loop.

7. **Create Code Node to Select Random Image URL**  
   - Name: `Get Random Image URL`  
   - Type: Code Node (JavaScript)  
   - Code:  
     ```javascript
     return {
       random_temp_url: $input.all()[0].json.data.output.temporary_image_urls[
         Math.floor(Math.random() * $input.all()[0].json.data.output.temporary_image_urls.length)
       ]
     };
     ```  
   - Connect true output of `Verify URL Acquisition` to this node.

8. **Create HTTP Request Node to Generate Orthographic Views**  
   - Name: `Generation 3-view Image with GPT-4o-Image`  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.piapi.ai/v1/chat/completions`  
   - Headers: Authorization Bearer token (configure HTTP Header Auth credential with your PiAPI token)  
   - Body (JSON) with expression to inject `random_temp_url`:  
     ```json
     {
       "model": "gpt-4o-image-preview",
       "messages": [
         {
           "role": "user",
           "content": [
             {
               "type": "image_url",
               "image_url": {
                 "url": "{{ $json.random_temp_url }}"
               }
             },
             {
               "type": "text",
               "text": "Convert this image into a 3D figurine image, with front view, side view, and back view in one page. Generate a turnaround sheet showing the figurine’s front with full details, profile, and back views in left-to-right sequence. ar=10:3"
             }
           ]
         }
       ],
       "stream": true
     }
     ```  
   - Connect output from `Get Random Image URL` to this node.

9. **Create Code Node to Extract Image URL from Streamed Response**  
   - Name: `Get Image`  
   - Type: Code Node (JavaScript)  
   - Code:  
     ```javascript
     const chunks = $input.first().json.data.split('\n\n');

     let imageUrl = null;

     for (let i = chunks.length - 1; i >= 0; i--) {
         const chunk = chunks[i];
         
         if (!chunk.startsWith('data: ')) continue;
         
         try {
             const jsonStr = chunk.substring(6);
             if (jsonStr.trim() === '[DONE]') continue;
             
             const data = JSON.parse(jsonStr);
             
             if (data.choices && data.choices[0].delta.content) {
                 const content = data.choices[0].delta.content;
                 const urlMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s]+)\)/);
                 
                 if (urlMatch && urlMatch[1]) {
                     imageUrl = urlMatch[1];
                     break;
                 }
             }
         } catch (e) {
             continue;
         }
     }

     return {
         image_url: imageUrl,
         finish_reason: imageUrl ? "success" : "not_found"
     };
     ```  
   - Connect output from `Generation 3-view Image with GPT-4o-Image` to this node.

10. **Create IF Node to Check if Final Image URL was Obtained**  
    - Name: `Check if the URL is obtained`  
    - Type: IF Node  
    - Condition: Check if `{{$json.finish_reason}}` equals `"not_found"`  
    - Connect output from `Get Image` to this node.

11. **Connect Retry or Success Paths**  
    - If "not_found": connect back to `Generation 3-view Image with GPT-4o-Image` to retry generation.  
    - If success: connect to next node.

12. **Create Code Node to Format Final Output**  
    - Name: `Get Final Output`  
    - Type: Code Node (JavaScript)  
    - Code:  
      ```javascript
      return $input.all().map(item => {
        return {
          image_url: item.json.image_url
        };
      });
      ```  
    - Connect success output of `Check if the URL is obtained` to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                                                                 |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow uses PiAPI’s GPT-4o and Midjourney models for AI image generation and processing.               | https://piapi.ai                                                                               |
| The workflow requires a valid PiAPI X-API-Key for Midjourney and Bearer token for GPT-4o-Image API.            | User must create and configure credentials in n8n accordingly.                                 |
| The orthographic view generation prompt is carefully crafted to produce front, side, and back views in one image sheet with aspect ratio 10:3. | Prompt embedded in `Generation 3-view Image with GPT-4o-Image` node.                            |
| The streamed response parsing logic in `Get Image` node is critical to extract the image URL from incremental data chunks. | The code handles partial JSON chunks and Markdown image syntax extraction robustly.            |
| The workflow includes retry logic to handle asynchronous image generation delays and missing image URLs.      | Polling implemented with `Wait for Generation` and conditional loops in IF nodes.              |
| Example output images demonstrating the orthographic views are available at:                                  | https://i.ibb.co/N2yFjbt6/4531745227220-pic.jpg and https://i.ibb.co/GQKb7Nbd/s-F0h-OV19vezttez0yf-DXd-PRro-Ko8-Fj.png |

---

This documentation provides a complete, stepwise understanding of the workflow, enabling reproduction, modification, and troubleshooting by advanced users or automation agents.