Analyze Any Video and Generate Text Summaries with Google Gemini 2.5 Pro

https://n8nworkflows.xyz/workflows/analyze-any-video-and-generate-text-summaries-with-google-gemini-2-5-pro-6555


# Analyze Any Video and Generate Text Summaries with Google Gemini 2.5 Pro

### 1. Workflow Overview

This workflow enables users to upload any video file via a web form and automatically generate detailed text summaries analyzing the video content using Google Gemini 2.5 Pro AI. It targets content creators, marketers, video editors, developers, and AI enthusiasts who want to obtain fast and rich descriptions of video scenes, objects, and actions without manual review. The workflow consists of two main functional blocks:

- **1.1 Input Reception:** Receives video files through a user-facing web form trigger.
- **1.2 AI Video Analysis:** Sends the uploaded video to the Google Gemini 2.5 Pro model for multimodal AI analysis and generates a textual summary of the video content.

Supporting the workflow, a sticky note is included that provides detailed documentation, usage instructions, target audience, and customization ideas.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block handles user input by presenting a web form where users can upload video files. It acts as the entry point of the workflow.

- **Nodes Involved:**  
  - Start: Upload Your Video

- **Node Details:**

  - **Start: Upload Your Video**  
    - *Type and Technical Role:* Form Trigger node — triggers the workflow when a form is submitted with a video file.  
    - *Configuration Choices:*  
      - Form titled "Video Analyzer"  
      - Single form field of type "file" labeled "Video to Analyze"  
      - Defaults: No additional options configured  
    - *Key Expressions/Variables:*  
      - Incoming binary data under the form field "Video_to_Analyze"  
    - *Input and Output Connections:*  
      - No input (trigger node)  
      - Output connected to "1. Analyze Video with Gemini" node  
    - *Version-Specific Requirements:*  
      - Uses Form Trigger version 2.2, which supports file inputs and form field configuration  
    - *Potential Failure Modes:*  
      - User fails to upload a file or uploads an unsupported format  
      - Network or server errors causing trigger failure  
      - Large file uploads causing timeouts or memory issues  
    - *Sub-workflow Reference:* None

#### 1.2 AI Video Analysis

- **Overview:**  
  This block processes the uploaded video by sending it to Google Gemini 2.5 Pro AI for detailed multimodal video analysis and returns a textual summary describing scenes, objects, and actions.

- **Nodes Involved:**  
  - 1. Analyze Video with Gemini

- **Node Details:**

  - **1. Analyze Video with Gemini**  
    - *Type and Technical Role:* Google Gemini node (from Langchain integration) — performs AI analysis on multimodal inputs, here specifically video binary data.  
    - *Configuration Choices:*  
      - Model selected: "models/gemini-2.5-pro" (the Google Gemini 2.5 Pro)  
      - Resource type: "video"  
      - Operation: "analyze" (processes video to generate description)  
      - Input type: "binary" linked to the form's uploaded video file in "Video_to_Analyze" property  
    - *Credentials:*  
      - Google Palm API credentials named "Fahmi Gemini" are configured and linked  
    - *Key Expressions/Variables:*  
      - Reads binary data from "Video_to_Analyze"  
      - Outputs a detailed text summary as standard node output  
    - *Input and Output Connections:*  
      - Input from "Start: Upload Your Video" node  
      - No further downstream nodes in this workflow  
    - *Version-Specific Requirements:*  
      - Requires n8n version supporting "@n8n/n8n-nodes-langchain.googleGemini" node with the "video" resource and "analyze" operation (version 1 here)  
    - *Potential Failure Modes:*  
      - Authentication errors with Google Palm API credentials  
      - API quota exceeded or rate limits  
      - Video format unsupported or corrupted causing analysis failure  
      - Timeout due to large video size or slow processing  
      - Network disruptions between n8n and Google API  
    - *Sub-workflow Reference:* None

#### Documentation & Usage Instructions

- **Nodes Involved:**  
  - Sticky Note

- **Node Details:**

  - **Sticky Note**  
    - *Type and Technical Role:* Informational node providing detailed documentation inside the workflow canvas.  
    - *Configuration Choices:*  
      - Large note containing workflow purpose, target users, step-by-step usage, setup instructions, requirements, and customization ideas.  
      - Positioned separately for clear visibility.  
    - *Key Content Highlights:*  
      - Explains workflow usage for content creators, video editors, developers, and AI enthusiasts  
      - Describes the upload, analyze, and describe steps  
      - Setup instructions including credential addition and activation  
      - Suggestions for extending workflow capabilities (translation, social media content generation, storage automation)  
      - Links to use Google Drive or Dropbox triggers for automation  
    - *Input and Output Connections:*  
      - None (informational only)  
    - *Potential Failure Modes:*  
      - None (static document)  
    - *Sub-workflow Reference:* None

---

### 3. Summary Table

| Node Name               | Node Type                         | Functional Role                 | Input Node(s)             | Output Node(s)             | Sticky Note                                                                                                  |
|-------------------------|----------------------------------|--------------------------------|---------------------------|----------------------------|--------------------------------------------------------------------------------------------------------------|
| Start: Upload Your Video | Form Trigger                     | Input Reception (video upload) | None                      | 1. Analyze Video with Gemini | See detailed workflow documentation and usage instructions in Sticky Note                                   |
| 1. Analyze Video with Gemini | Google Gemini (Langchain node) | AI Video Analysis (multimodal) | Start: Upload Your Video  | None                       | See detailed workflow documentation and usage instructions in Sticky Note                                   |
| Sticky Note             | Sticky Note                      | Documentation and instructions | None                      | None                       | ## Analyze Any Video and Get a Text Summary with Google Gemini. This workflow uses the NEW native Google Gemini node in n8n to analyze videos and generate detailed text summaries. Just upload a video, and Gemini will describe the scenes, objects, and actions frame by frame. <br> ### Who Is This For? <br> * **Content Creators & Marketers** Quickly generate summaries, shot lists, or descriptions for video content. <br> * **Video Editors** Get a fast overview of footage without manual review. <br> * **Developers & n8n Beginners** Learn how to use multimodal AI in n8n with a simple setup. <br> * **AI Enthusiasts** Explore the new capabilities of the Gemini Pro model. <br> ### How It Works <br> * Upload via form trigger <br> * Analyze with Gemini 2.5 Pro <br> * Describe video content textually <br> ### Setup Instructions <br> 1. Add Credentials (Google AI Gemini) <br> 2. Activate Workflow <br> 3. Upload Video <br> ### Requirements <br> * n8n instance <br> * Google AI (Gemini) account <br> ### Customization Ideas <br> * Translate summary <br> * Create social media posts <br> * Store output in Google Sheets or Airtable <br> * Automate with Cloud Storage (Google Drive, Dropbox) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Form Trigger Node**  
   - Add a new node of type **Form Trigger**.  
   - Set the form title to "Video Analyzer".  
   - Add one form field:  
     - Field type: File  
     - Field label: "Video to Analyze"  
   - Save the node as "Start: Upload Your Video".  
   - This node will listen for HTTP form submissions with video file uploads.

2. **Configure Google Gemini Node**  
   - Add a node of type **Google Gemini (Langchain integration)**.  
   - Set the node name to "1. Analyze Video with Gemini".  
   - Configure parameters:  
     - Model ID: Select "models/gemini-2.5-pro" from the dropdown list of available Gemini models.  
     - Resource: Set to "video" to indicate video input.  
     - Operation: Choose "analyze" to perform video content analysis.  
     - Input Type: Select "binary".  
     - Binary Property Name: Enter "Video_to_Analyze" to match the form field name from the previous node.  
   - Under Credentials, select or create Google Palm API credentials with access to Gemini AI services. Name it appropriately (e.g., "Fahmi Gemini").  
   - Connect the output of "Start: Upload Your Video" node to this node’s input.

3. **Add Sticky Note (optional but recommended)**  
   - Add a **Sticky Note** node for documentation.  
   - Paste the full descriptive content explaining workflow purpose, usage, setup, and customization as given in the original.  
   - Place it in the canvas near the other nodes for clarity.

4. **Save and Activate the Workflow**  
   - Save the workflow with the title "Analyze Any Video and Generate Text Summaries with Google Gemini 2.5 Pro".  
   - Activate the workflow to start accepting video uploads.

5. **Test the Workflow**  
   - Access the Form Trigger URL generated by n8n.  
   - Upload a test video file using the form.  
   - Submit and check that the "1. Analyze Video with Gemini" node returns a detailed text summary describing the video content.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                | Context or Link                                             |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| This workflow showcases the new native Google Gemini node integration in n8n, enabling multimodal AI analysis directly from video binary data.                                                                                                                                                            | Sticky Note content within the workflow                      |
| Users must add Google Palm API credentials with appropriate permissions to use Gemini AI models.                                                                                                                                                                                                            | Credential setup instructions in Sticky Note                |
| Recommended customizations include adding translation LLM nodes, social media content generation, or saving outputs to cloud databases like Google Sheets or Airtable.                                                                                                                                     | Sticky Note customization ideas section                      |
| Automation can be extended by replacing the Form Trigger with cloud storage triggers (Google Drive, Dropbox) for automated video processing.                                                                                                                                                               | Sticky Note customization ideas section                      |
| For more details on Google Gemini node usage, refer to official n8n documentation and Google AI platform resources.                                                                                                                                                                                       | External documentation (not included here)                   |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.