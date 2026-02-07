Automate & Publish Video Ad Campaigns with AI (NanoBanana, Seedream, GPT-4o, Veo 3)

https://n8nworkflows.xyz/workflows/automate---publish-video-ad-campaigns-with-ai--nanobanana--seedream--gpt-4o--veo-3--9200



# General introduction to the Seedance x Nanobanana workflow

The workflow's power lies in its integration of several cutting-edge AI services, orchestrating them in a logical sequence to handle different stages of content generation:

*   **n8n**: Serves as the central orchestrator for the entire process. Its popularity is growing rapidly compared to alternatives like Zapier or Make, largely due to its open-source nature and flexibility, especially for self-hosting. [00:30](https://www.youtube.com/watch?v=E17rYpMRvgA&t=30s)
*   **Image Generation & Transformation**:
    *   **Seedream 4.0**: A powerful model for generating initial high-quality images. [01:21](https://www.youtube.com/watch?v=E17rYpMRvgA&t=81s)
    *   **NanoBanana**: Used for transforming and editing images with simple text prompts. [01:19](https://www.youtube.com/watch?v=E17rYpMRvgA&t=79s)
    *   **ChatGPT Image Generation (GPT-4o)**: Leveraged for its advanced image creation capabilities. [01:24](https://www.youtube.com/watch?v=E17rYpMRvgA&t=84s)
*   **Video Generation**:
    *   **Google Veo 3**: A state-of-the-art model used to generate video clips from the previously created images and scenarios. [01:27](https://www.youtube.com/watch?v=E17rYpMRvgA&t=87s)
*   **Social Media Publishing**:
    *   **Blotato**: A service integrated into the workflow to distribute the final video ad across multiple social media platforms simultaneously. [02:20](https://www.youtube.com/watch?v=E17rYpMRvgA&t=140s)

The end-to-end process is designed to be initiated with minimal input and run autonomously, producing a professional-grade video ad in a matter of minutes. [01:32](https://www.youtube.com/watch?v=E17rYpMRvgA&t=92s)

## How to easily download the JSON workflow

To use this automation, you first need to acquire the workflow file itself. It is provided as a `.json` file, which is the standard format for exporting and importing n8n workflows.

You can download the template from the following address:
[https://n8n.dr-firas.vip/](https://n8n.dr-firas.vip/)

After providing your details on the page, you will receive access to the file. It's important to note that the downloaded file may be in a compressed format (e.g., `.zip`). If so, you must decompress it to extract the `.json` file before you can proceed. [03:35](https://www.youtube.com/watch?v=E17rYpMRvgA&t=215s)

Once you have the `.json` file, you can import it into your n8n instance. In a new or existing workflow canvas, navigate to the options menu and select **"Import from File..."** to upload and instantiate the entire workflow. [09:04](https://www.youtube.com/watch?v=E17rYpMRvgA&t=544s)

## Accessing an unlimited n8n server

To run n8n workflows, you need an active n8n instance. While the official n8n cloud service is an option, its pricing plans can be restrictive, particularly concerning the number of concurrent workflow executions. For example, the "Starter" plan limits you to 5 concurrent executions, which can be insufficient for complex or high-volume automations. [04:46](https://www.youtube.com/watch?v=E17rYpMRvgA&t=286s)

A more scalable and cost-effective approach is to use a self-hosted Virtual Private Server (VPS). **Hostinger** offers pre-configured VPS plans specifically for n8n, which provide unlimited workflow executions. This is the recommended path for serious development or production use.

**Recommended VPS Plans:**
*   **KVM 2**: A suitable starting point for freelancers or for testing purposes.
*   **KVM 4**: Recommended for agencies or businesses running more resource-intensive workflows, thanks to its additional CPU cores and RAM. [05:52](https://www.youtube.com/watch?v=E17rYpMRvgA&t=352s)

When setting up your server, look for the **"n8n (+100 workflows)"** application option during the OS selection. This version comes pre-loaded with over 100 popular workflow templates, providing a significant head start and valuable examples for learning. This is a complimentary feature and highly recommended for new users. [07:53](https://www.youtube.com/watch?v=E17rYpMRvgA&t=473s)

For a discount on Hostinger's n8n plans, you can use the following promotional code during checkout:
`GON8N`
[07:11](https://www.youtube.com/watch?v=E17rYpMRvgA&t=431s)

## The 5 key steps to create and publish videos

The workflow is logically structured into five distinct stages, each handling a specific part of the ad creation process. Understanding this structure is key to customizing or debugging the automation.

1.  **Step 1: Generate Prompts from Input**
    This initial stage acts as the trigger. It's designed to receive the raw input for the ad, typically a product image or logo sent via a platform like Telegram. It then processes this input to generate foundational prompts for the subsequent AI models. [11:33](https://www.youtube.com/watch?v=E17rYpMRvgA&t=693s)

2.  **Step 2: Create Product Images**
    Using the prompts from Step 1, this stage orchestrates multiple AI image generators (Seedream 4.0, NanoBanana, ChatGPT) to create a set of diverse and visually appealing product images. This multi-model approach ensures a variety of styles for the final video. [11:53](https://www.youtube.com/watch?v=E17rYpMRvgA&t=713s)

3.  **Step 3: Produce Video Ads with Veo 3**
    Here, the workflow generates distinct scenarios or scripts for each image created in Step 2. These image-scenario pairs are then passed to the Google Veo 3 API to generate short video clips. [12:25](https://www.youtube.com/watch?v=E17rYpMRvgA&t=745s)

4.  **Step 4: Merge Videos into a Final Ad**
    This stage collects all the individual video clips generated by Veo 3. It then uses a tool, likely FFmpeg, to merge these clips into a single, cohesive final video ad. The URLs of the generated assets are also systematically stored, for example in a Google Sheet, for tracking and access. [13:05](https://www.youtube.com/watch?v=E17rYpMRvgA&t=785s)

5.  **Step 5: Publish to Social Platforms**
    The final step takes the completed video ad and its associated metadata (captions, descriptions) and distributes it across various social media networks using the Blotato integration. This automates the final, crucial step of publication. [13:20](https://www.youtube.com/watch?v=E17rYpMRvgA&t=800s)

## Preparing your product as workflow input

The entire automation is triggered by providing the initial asset that defines the product. This input is typically a product logo or a high-quality product image. This asset is sent to the workflow's trigger node—in this case, a Telegram bot—which kicks off the sequence of automated generation steps. The quality and nature of this initial input will directly influence the prompts generated in Step 1 and, consequently, the final output of the entire workflow. [13:34](https://www.youtube.com/watch?v=E17rYpMRvgA&t=814s) 
## Prepare the product as workflow input

The workflow's starting point is designed for simplicity and accessibility, using a Telegram message as the trigger. This approach allows you to initiate the entire video generation pipeline from your mobile device or desktop by simply sending a message to a configured Telegram bot.

The input must be a single message containing two key elements:
1.  **An image**: This is the core visual of your product or concept.
2.  **A text caption**: This text provides the context and must follow a specific format, separated by a semicolon.

The format for the text caption is:
`VISUAL DESCRIPTION; VIDEO SCENARIO;`

-   **`VISUAL DESCRIPTION`**: A detailed description of the image you are sending. This helps the AI understand the visual elements, characters, and setting.
-   **`VIDEO SCENARIO`**: A brief outline or idea for the video ad you want to create. This guides the AI in generating relevant scripts.

For example, using an image of a woman looking confused about her hair next to a shampoo bottle, the caption could be:

```
A young woman in a black turtleneck looks confused, scratching her head while raising her other hand. Next to her is a bottle of ILLUMI Nourishing Shampoo; The video opens with the woman looking frustrated about her dry or frizzy hair. She then presents the ILLUMI shampoo as the solution. The final scene shows her smiling with smooth, nourished hair.
```

Once you send this message with the image and formatted caption to your Telegram bot, it triggers the first step of the n8n workflow. [16:42](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1002s)

## Step 1: Execute and prepare the image prompt

After being triggered by the Telegram message, the first stage of the n8n workflow processes the raw input to prepare it for AI image generation.

The sequence of nodes is as follows:
1.  **Trigger: Receive Idea via Telegram**: This node listens for the incoming message.
2.  **Telegram: Get Image File**: It extracts the image file from the message.
3.  **Google Drive: Upload Image**: The image is uploaded to a designated Google Drive folder. This is a good practice for persistence and having a centralized location for your source assets.
4.  **Parse Idea into Prompts**: A `Code` node splits the text caption at the semicolon (`;`) to separate the visual description from the video scenario.
5.  **Generate Image Prompt**: This is a crucial AI-powered step. It takes the user's initial description and uses an LLM (like OpenAI's models) to generate a much more detailed and structured "system prompt." This enriched prompt is optimized for AI image generation models to produce high-quality, consistent results.

Once you've sent the initial message via Telegram, you can execute this part of the workflow in n8n to see the data flow through each node. The output of the `Generate Image Prompt` node will be a detailed text prompt ready to be passed to the next step. [17:27](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1047s)

A useful technique during development and testing is to "pin" the data from a successful execution. By selecting the nodes in this section and pinning their data (Shortcut: `P`), you can re-run subsequent parts of the workflow without needing to trigger the entire process from Telegram again, which saves considerable time. [19:08](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1148s)

## Step 2: Automatically generate 3 images with AI

This step takes the system prompt generated previously and uses it to create three distinct image variations in parallel, leveraging different AI models. This A/B/C testing approach allows you to compare the output of various services and choose the best visual for your video ad.

The workflow splits into three parallel branches: [18:45](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1125s)
1.  **NanoBanana**: Generates an image using the NanoBanana model, often accessed via platforms like [Fal.ai](https://fal.ai/).
2.  **Seedream**: Generates an image using the Seedream model. In the video, this is accessed through the [K.ai](https://k.ai/) platform API.
3.  **ChatGPT Image**: Generates an image using OpenAI's DALL-E model, also accessed via the K.ai API in this example.

Each branch follows a similar asynchronous pattern, which is standard for AI generation tasks that can take time:
-   **Create/Generate Image**: An `HTTP Request` node sends the prompt to the respective service's API endpoint. This initiates the generation job.
-   **Wait**: A `Wait` node pauses the workflow for a set duration (e.g., 4 minutes). This is a simple but effective way to handle the rendering time, though for production, a webhook or polling approach would be more robust.
-   **Fetch/Download Image**: Another `HTTP Request` node retrieves the final generated image from the URL provided by the service once the job is complete.

## Save the URLs of the AI-generated images

After all three parallel branches have successfully generated and fetched their images, the results need to be consolidated.

1.  **Merge Node**: A `Merge` node is configured to wait for all three branches to complete. It collects the output from each, which primarily consists of the public URLs for the newly created images.
2.  **Google Sheets Node**: The merged data, containing the three image URLs, is then passed to a `Google Sheets - Append Sheet` node. This node logs the URLs into a new row in a pre-configured spreadsheet, creating a record of all generated assets.

The Google Sheet is structured to track the entire process, with columns for the source image, and then separate columns for the URLs from NanoBanana, Seedream, and ChatGPT. [22:58](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1378s)

## Create 3 scenarios for the final video

With the visual assets ready, the workflow now focuses on generating the narrative for the videos.

An **AI Agent (`Generate Video Prompts`)** node is used for this task. It takes the original `VIDEO SCENARIO` provided in the Telegram message and expands it into three distinct, detailed video prompts or scripts. This provides variety for the final video ads. The output is a structured JSON containing three separate prompts (e.g., `final_prompt_1`, `final_prompt_2`, `final_prompt_3`). [26:25](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1585s)

A subsequent `Code` node then maps each of these three video prompts to one of the three AI-generated images, creating three pairs of `(video_prompt, image_url)`. This ensures that each generated video will be based on a unique combination of a script and a visual.

## Start the automatic generation of the 3 videos

This is the final execution step in this segment, where the video generation jobs are initiated.

The three `(prompt, image_url)` pairs are fed into a **`Loop Over Items`** node. This node iterates through each pair one by one to generate three separate videos. [27:39](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1659s)

Inside the loop, for each iteration:
1.  **Format Prompt**: The data is prepared for the API call.
2.  **Generate Video with VEO3**: An `HTTP Request` node sends the video prompt and the corresponding image URL to the VEO 3 API (demonstrated via the K.ai platform). This kicks off the video rendering process.
3.  **Wait for VEO3 Rendering**: A `Wait` node pauses the loop to allow time for the video to be generated.
4.  **Download Video from VEO3**: A final `HTTP Request` retrieves the generated video file.

After launching this part of the workflow, the process becomes asynchronous. You can monitor the status of the video generation jobs directly on the provider's platform (e.g., in the K.ai logs), where you will see their status change from "running" to "success". [28:55](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1735s) 
### Upload the 3 videos directly to Google Sheets

After the successful generation of three distinct video clips by VEO3, the immediate next step is to persist their public URLs. This is a critical data-gathering phase that prepares the inputs for the video merging process. [29:21](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1761s)

The workflow achieves this by first using an `Aggregate` node to collect the three video URLs generated in the previous loop. Subsequently, an `Update row in sheet` node writes these URLs to our central Google Sheet. This action populates the columns `URL VIDEO 1`, `URL VIDEO 2`, and `URL VIDEO 3` for the corresponding project row, ensuring all assets are tracked and accessible for the next stages. [31:30](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1890s)

Here is a representation of how the Google Sheet appears after this update:

| ... | URL VIDEO 1 | URL VIDEO 2 | URL VIDEO 3 | URL FINAL VIDEO | ADS TEXT | STATUS |
| :-- | :--- | :--- | :--- | :--- | :--- | :--- |
| ... | `https://.../video1.mp4` | `https://.../video2.mp4` | `https://.../video3.mp4` | | | VIDEO CREATED |

This method of storing URLs in a spreadsheet provides a simple yet effective way to pass data between different, independent stages of the workflow. [31:51](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1911s)

### Download the final merged video with FFmpeg

The objective of this stage is to combine the three individual video clips into a single, cohesive final advertisement. Instead of running FFmpeg locally, which would require managing server resources and dependencies, the workflow leverages a serverless API for this task. [32:23](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1943s)

The specific service used is the **fal-ai/ffmpeg-api**, which allows for remote video manipulation. The process within n8n is structured as follows:
1.  **Merge Videos**: An `HTTP Request` node sends a `POST` request to the `fal-ai/ffmpeg-api/merge-videos` endpoint. The body of this request contains the list of video URLs previously saved to the Google Sheet.
2.  **Asynchronous Job Handling**: Since video processing is time-consuming, the API call is asynchronous. The workflow includes `Wait` and `Check Merge Status` nodes to periodically poll the API until the merging process is complete.
3.  **Store Final Video**: Once the merged video is ready, its URL is retrieved. The workflow then uploads this final video to a persistent storage location, in this case, Google Drive, using the `Upload Final Video to Google Drive` node.
4.  **Update Sheet**: The public URL of the final video now stored in Google Drive is written back to the Google Sheet in the `URL FINAL VIDEO` column.

This approach effectively outsources the heavy lifting of video processing to a specialized, scalable cloud service, keeping the n8n workflow lightweight and focused on orchestration. [32:38](https://www.youtube.com/watch?v=E17rYpMRvgA&t=1958s)

**Resource:** [fal.ai FFmpeg API](https://fal.ai/models/ffmpeg-api) (This appears to be the service used for merging videos programmatically).

### Publish the video on social media

This final stage, labeled "Step 5" in the workflow, automates the creation of social media content and its distribution across multiple platforms. [33:41](https://www.youtube.com/watch?v=E17rYpMRvgA&t=2021s)

First, the workflow generates a relevant caption for the video.
1.  **Read Brand Info**: It begins by reading brand-specific details (product name, offer, key features, website) from a dedicated `Brand` tab in the Google Sheet. [33:45](https://www.youtube.com/watch?v=E17rYpMRvgA&t=2025s)
2.  **Generate Ad Text**: This information is passed to a `Message a model` node, which interfaces with an AI like ChatGPT. The model is prompted to create a compelling social media post or "ad text" based on the provided brand context.
3.  **Save Ad Text**: The AI-generated text is then saved back into the main `Videos` sheet in the `ADS TEXT` column. [34:51](https://www.youtube.com/watch?v=E17rYpMRvgA&t=2091s)

For monitoring purposes, the workflow sends notifications via Telegram, including the final video URL and the video file itself. [35:12](https://www.youtube.com/watch?v=E17rYpMRvgA&t=2112s)

The core of the publishing process relies on **Blotato**, a social media management platform that integrates with n8n.
1.  **Upload to Blotato**: The final merged video is first uploaded to the Blotato media library via its dedicated n8n node (`Upload Video to BLOTATO`). [35:56](https://www.youtube.com/watch?v=E17rYpMRvgA&t=2156s)
2.  **Cross-Platform Posting**: The workflow then fans out to multiple Blotato `post: create` nodes. Each node is configured for a specific social media platform (e.g., YouTube, TikTok, Instagram, LinkedIn). It uses the media ID from the Blotato upload and the AI-generated ad text to create and publish a unique post on each platform. [36:47](https://www.youtube.com/watch?v=E17rYpMRvgA&t=2207s)

The narrator demonstrates that the video was successfully published as a YouTube Short, with the correct title and description, confirming the end-to-end automation. [38:12](https://www.youtube.com/watch?v=E17rYpMRvgA&t=2292s)

**Resource:** [Blotato Social Media Tool](https://blotato.com/)

### Update Google Sheets with the new data

To conclude the entire process, a final housekeeping step is performed. After all the social media posts have been successfully published—a step managed by a `Merge` node that waits for all publishing branches to complete—the workflow executes one last `Update row in sheet` node. [38:36](https://www.youtube.com/watch?v=E17rYpMRvgA&t=2316s)

This node changes the value in the `STATUS` column of the Google Sheet to "DONE". This provides a clear and final confirmation that the video has been created, merged, and distributed, completing its lifecycle within the automation. [38:50](https://www.youtube.com/watch?v=E17rYpMRvgA&t=2330s)