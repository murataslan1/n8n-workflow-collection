AI fashion virtual try-on with image & video generation for Telegram, Discord & YouTube

https://n8nworkflows.xyz/workflows/ai-fashion-virtual-try-on-with-image---video-generation-for-telegram--discord---youtube-12115


# AI fashion virtual try-on with image & video generation for Telegram, Discord & YouTube

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

## 1. Workflow Overview

**Purpose:**  
This workflow performs an **AI “virtual try-on”**: it takes a **fashion model image** plus a **dress image**, generates (1) a realistic **try-on image** (model wearing the dress) and then (2) a **fashion video** from the generated try-on image. Finally, it distributes results via **Telegram**, **Discord**, and **YouTube**.

**Target use cases:**
- Fashion product visualization for e-commerce/social media
- Content generation pipelines for communities (Telegram/Discord)
- Auto-publishing generated videos to YouTube

### 1.1 Input Reception & Assets Preparation
- User provides a dress image via an n8n form.
- Model image is pulled from a fixed public URL.
- Both images are uploaded to VLM Run to obtain hosted/public links.

### 1.2 Prompt & Payload Assembly
- The workflow builds a prompt and maps image URLs into a merged aggregated payload.
- A Wait step adds buffering for async timing/safety before invoking generation.

### 1.3 VLM Run Generation (Image then Video)
- Uses VLM Run Chat Completion (input type: image).
- Generates try-on image from two image URLs.
- Extracts a pre-signed URL from the generation output.
- Uses the generated image URL to generate a video, then extracts the video URL.

### 1.4 Download & Multi-Channel Publishing
- Downloads the image/video via the extracted pre-signed URLs.
- Sends image/video to Telegram, posts an image embed to Discord, uploads video to YouTube.

---

## 2. Block-by-Block Analysis

### Block 2.1 — Input & Image Upload
**Overview:** Receives the user’s dress image and fetches a predefined model image, then uploads both to VLM Run to obtain accessible URLs for downstream generation.  
**Nodes involved:** `Upload Image`, `Upload Dress Image`, `Download Model Image`, `Upload Model Image`

#### Node: Upload Image
- **Type / Role:** Form Trigger (`n8n-nodes-base.formTrigger`) — entry point to collect a file from a user.
- **Configuration choices:**
  - Form title: “Upload your data to test RAG” (title does not match the fashion use case; purely cosmetic).
  - One required file field labeled `data`, accepts `.pdf, .csv` (this is inconsistent with “dress image”; likely should be `.jpg,.jpeg,.png,.webp`).
  - `alwaysOutputData: true` ensures an item is produced even in some edge cases.
- **Outputs / Connections:**
  - Main output → `Upload Dress Image` and → `Download Model Image` (fan-out).
- **Potential failures / edge cases:**
  - User uploads non-image (currently encouraged by accept types). VLM Run upload may fail or produce unusable results.
  - Large files can exceed instance limits.
  - Binary property naming may differ from what VLM Run node expects (see reproduction notes).

#### Node: Upload Dress Image
- **Type / Role:** VLM Run node (`@vlm-run/n8n-nodes-vlmrun.vlmRun`) — file upload.
- **Configuration choices:** `operation: file`, `fileOperation: upload`.
- **Inputs / Outputs:**
  - Input: binary file from `Upload Image`.
  - Output: includes a `public_url` field (used later as `Dress_Image_Link`).
  - Connected to `Give Prompt`.
- **Potential failures / edge cases:**
  - Credential/auth failure with VLM Run API.
  - If the incoming file is not an image, VLM Run may reject or store but generation may fail later.
  - If `public_url` is missing/renamed by the integration, downstream expressions break.

#### Node: Download Model Image
- **Type / Role:** HTTP Request (`n8n-nodes-base.httpRequest`) — downloads a fixed model image.
- **Configuration choices:**
  - URL is hardcoded to a stock image (`https://t4.ftcdn.net/...jpg`).
- **Outputs / Connections:**
  - Output → `Upload Model Image`.
- **Potential failures / edge cases:**
  - Remote host blocks hotlinking, returns 403/404.
  - Image download returns HTML instead of image (still “successful” HTTP-wise), causing upload/generation issues.
  - Timeouts / size issues.

#### Node: Upload Model Image
- **Type / Role:** VLM Run file upload.
- **Configuration choices:** `operation: file`, `fileOperation: upload`.
- **Outputs / Connections:**
  - Output → `Set Mapping` which extracts `public_url`.
- **Potential failures / edge cases:** same as `Upload Dress Image` plus failure if the HTTP node didn’t produce binary as expected.

**Sticky notes covering this block:**
- “# 🟨 Input & Image Upload  
  - User uploads a dress image via **Form Trigger**.  
  - Model image is downloaded from predefined URL.”

---

### Block 2.2 — Prompt Preparation, Merge & Aggregate
**Overview:** Builds the generation prompt, maps the model image URL, merges the model+dress data streams, aggregates them into one payload, and waits briefly before generation.  
**Nodes involved:** `Give Prompt`, `Set Mapping`, `Merge`, `Aggregate`, `Wait`

#### Node: Give Prompt
- **Type / Role:** Set (`n8n-nodes-base.set`) — constructs prompt + maps dress URL.
- **Configuration choices:**
  - Creates `Prompt` with explicit instruction to generate try-on image and return a pre-signed link.
  - Creates `Dress_Image_Link` = `{{ $json.public_url }}` (expects input from `Upload Dress Image`).
  - `onError: continueRegularOutput` allows flow to continue even if a field fails (but downstream may break logically).
- **Inputs / Outputs:**
  - Receives from `Upload Dress Image` (and also from `Download Image` / `Download Video` error branches; see later).
  - Output → `Merge` (input index 1).
- **Key expressions/variables:** `$json.public_url`
- **Potential failures / edge cases:**
  - If `public_url` isn’t present, `Dress_Image_Link` becomes empty.
  - Prompt is rigid; may yield poor results if model/dress order is swapped.

#### Node: Set Mapping
- **Type / Role:** Set — maps model URL.
- **Configuration choices:** sets `Model_Image_Link` = `{{ $json.public_url }}`
- **Inputs / Outputs:**
  - Receives from `Upload Model Image`.
  - Output → `Merge` (input index 0).
- **Potential failures / edge cases:** missing `public_url` from upload output.

#### Node: Merge
- **Type / Role:** Merge (`n8n-nodes-base.merge`) — joins the two parallel streams (model mapping + prompt/dress mapping).
- **Configuration choices:** default merge behavior (in n8n this often means pairing items; with two independent items it may pass through as two items depending on timing).
- **Inputs / Outputs:**
  - Input 0: from `Set Mapping`
  - Input 1: from `Give Prompt`
  - Output → `Aggregate`
- **Potential failures / edge cases:**
  - Item pairing ambiguity: if counts mismatch or order changes, you can end up with incorrect pairing.
  - If either branch produces multiple items, results can be unexpected.

#### Node: Aggregate
- **Type / Role:** Aggregate (`n8n-nodes-base.aggregate`) — collects both items into one structure for consistent downstream referencing.
- **Configuration choices:** `aggregate: aggregateAllItemData` (creates an array like `data: [...]` containing both items).
- **Inputs / Outputs:** Output → `Wait`
- **Potential failures / edge cases:**
  - If upstream doesn’t produce both items, `data[0]` / `data[1]` assumptions can fail later.

#### Node: Wait
- **Type / Role:** Wait (`n8n-nodes-base.wait`) — delays continuation.
- **Configuration choices:** `amount: 1` (by default this is usually “1 second” depending on node configuration; the unit isn’t explicit in the JSON snippet).
- **Inputs / Outputs:** Output → `Generate Image`
- **Potential failures / edge cases:**
  - Not a real “async job complete” check; it’s only a buffer. If VLM Run upload links are not ready instantly (rare), longer waits or polling may be needed.

**Sticky notes covering this block:**
- “# 🟦 Prompt Preparation … Map model image URL and dress image URL”
- “# 🟪 Merge & Aggregate … Wait node ensures async safety”

---

### Block 2.3 — VLM Run Image Generation & URL Extraction
**Overview:** Calls VLM Run to generate the try-on image, then extracts the pre-signed URL from the response so it can be downloaded and shared.  
**Nodes involved:** `Generate Image`, `Return Image URL`

#### Node: Generate Image
- **Type / Role:** VLM Run Chat Completion — generates the try-on image using two image URLs.
- **Configuration choices:**
  - `operation: chatCompletion`
  - `inputType: image`
  - Prompt content expression: `{{ $json.data[0].Prompt || $json.data[1].Prompt }}`
  - Image URLs:
    - Model: `{{ $json.data[1].Model_Image_Link || $json.data[0].Model_Image_Link }}`
    - Dress: `{{ $json.data[0].Dress_Image_Link || $json.data[1].Dress_Image_Link }}`
  - `onError: continueErrorOutput` so the workflow can continue on failures (but may propagate empty URLs).
- **Inputs / Outputs:**
  - Input from `Wait`.
  - Main output 0 → `Return Image URL`
  - Main output 1 → `Aggregate` (this creates a feedback loop; see edge cases)
- **Potential failures / edge cases:**
  - If `data` array ordering differs, the `||` logic helps, but can still fail if both are missing.
  - VLM Run may return text without a URL, or multiple URLs.
  - The extra connection to `Aggregate` risks re-aggregating outputs and causing unintended repeated runs or state mixing (depending on execution path and item counts).

#### Node: Return Image URL
- **Type / Role:** Code (`n8n-nodes-base.code`) — extracts a URL from the VLM Run output.
- **Configuration choices:**
  - Converts `item.json` to a string and regex-matches: `(https?:\/\/[^\s\"]+)`
  - Returns `{ json: { url: fullSignedUrl } }`
- **Inputs / Outputs:**
  - Input from `Generate Image`.
  - Output → `Download Image`, → `Send to Discord`, → `Generate Video`
- **Potential failures / edge cases:**
  - Regex grabs the *first* URL; if the response includes other URLs, it may pick the wrong one.
  - If VLM Run returns a URL with escaped characters or surrounding punctuation, the regex may truncate or include trailing chars.
  - If no URL is present, `url` becomes `null` and downstream HTTP requests fail.

**Sticky note covering generation block:**
- “# 🟥 VLM Run – Image & Video Generation … Output: Pre-signed, valid download URL”

---

### Block 2.4 — Video Generation & URL Extraction
**Overview:** Uses the generated image URL to request a “walking” fashion video, then extracts the returned pre-signed video link.  
**Nodes involved:** `Generate Video`, `Return Video URL`

#### Node: Generate Video
- **Type / Role:** VLM Run Chat Completion — generates a fashion video based on the generated image.
- **Configuration choices:**
  - Prompt is hardcoded: “Generate a fashion video… Give pre-signed valid link…”
  - Image URL array contains the single input `{{ $json.url }}`
  - `onError: continueErrorOutput`
- **Inputs / Outputs:**
  - Input from `Return Image URL`
  - Main output 0 → `Return Video URL`
  - Main output 1 → `Aggregate` (another feedback connection)
- **Potential failures / edge cases:**
  - If `Return Image URL` produced `null` URL, generation will fail.
  - Some providers require specific endpoints for video generation; if VLM Run’s chatCompletion doesn’t support video generation for your account/model, it will error.
  - Feedback to `Aggregate` can again mix state if execution continues.

#### Node: Return Video URL
- **Type / Role:** Code — same URL extraction logic as `Return Image URL`.
- **Inputs / Outputs:**
  - Output → `Download Video`
- **Potential failures / edge cases:** same regex limitations as above.

**Sticky note relevant here (shared with download block):**
- “Code node extracts the full signed URL … preserve query parameters.”

---

### Block 2.5 — Download & Distribution (Telegram, Discord, YouTube)
**Overview:** Downloads the generated image/video using the extracted URLs and distributes them to Telegram and Discord, plus uploads the video to YouTube.  
**Nodes involved:** `Download Image`, `Send Image`, `Send to Discord`, `Download Video`, `Upload a video`

#### Node: Download Image
- **Type / Role:** HTTP Request — downloads image file from the pre-signed URL.
- **Configuration choices:**
  - URL: `{{ $json.url }}`
  - `onError: continueErrorOutput` (so downstream can still proceed on error branch)
- **Inputs / Outputs:**
  - Main output 0 → `Send Image`
  - Error output (index 1) → `Give Prompt` (this is unusual; it effectively “re-enters” prompt creation on download failure)
- **Potential failures / edge cases:**
  - Signed URL expiration (common).
  - URL null/empty.
  - Missing “download as binary” settings: if not configured to store response as binary, Telegram “sendDocument” won’t have a file to send.

#### Node: Send Image (Telegram)
- **Type / Role:** Telegram (`n8n-nodes-base.telegram`) — sends a document.
- **Configuration choices:**
  - `operation: sendDocument`
  - `chatId: "123456789"` (placeholder)
  - `binaryData: true` (expects a binary property in incoming data)
- **Inputs / Outputs:** Input from `Download Image`, and also from `Download Video` main output (see below).
- **Potential failures / edge cases:**
  - Telegram credential invalid.
  - `chatId` wrong.
  - No binary property present (common if HTTP Request not configured to output binary).
  - Sending video as “document” may work, but size limits apply.

#### Node: Send to Discord
- **Type / Role:** Discord (`n8n-nodes-base.discord`) — posts an embedded image.
- **Configuration choices:**
  - Authentication: OAuth2
  - Posts a message to a specific guild/channel
  - Embed image set to `{{ $json.url }}`
- **Inputs / Outputs:** input from `Return Image URL`
- **Potential failures / edge cases:**
  - Discord OAuth token revoked/expired.
  - Channel permissions missing.
  - If the signed URL is not publicly accessible by Discord (some signed URLs may be blocked), the embed won’t render.

#### Node: Download Video
- **Type / Role:** HTTP Request — downloads video file from extracted signed URL.
- **Configuration choices:**
  - URL: `{{ $json.url }}`
  - `onError: continueErrorOutput`
  - `executeOnce: false`, `retryOnFail: false`
- **Inputs / Outputs:**
  - Main output 0 → `Upload a video` and → `Send Image` (Telegram)
  - Error output (index 1) → `Give Prompt` (same unusual “re-entry” pattern)
- **Potential failures / edge cases:**
  - Very large video can exceed n8n memory/time limits.
  - Needs HTTP Request configured to output binary for YouTube upload.
  - Signed URL expiry.

#### Node: Upload a video (YouTube)
- **Type / Role:** YouTube (`n8n-nodes-base.youTube`) — uploads the downloaded video.
- **Configuration choices:**
  - `operation: upload`, `resource: video`
  - Title: “Virtual Try On using VLM Run”
  - Region code: `BD`
- **Inputs / Outputs:** input from `Download Video`
- **Potential failures / edge cases:**
  - OAuth scopes missing (must include YouTube upload scope).
  - Upload size limits / quota issues.
  - Missing binary property or wrong binary field name.

**Sticky notes covering this block:**
- “# 🟪 Code Node & Image/ Video Download … regex to preserve signed URL including query parameters … Download Image/Video uses signed URL”
- “# 🟩 Upload to Discord, YouTube & Send via Telegram … instant sharing across platforms”

---

## 3. Summary Table

| Node Name | Node Type | Functional Role | Input Node(s) | Output Node(s) | Sticky Note |
|---|---|---|---|---|---|
| Upload Image | formTrigger | Entry point form file upload | — | Upload Dress Image; Download Model Image | # 🟨 Input & Image Upload<br>- User uploads a dress image via **Form Trigger**.<br>- Model image is downloaded from predefined URL. |
| Upload Dress Image | vlmRun | Upload dress file to VLM Run to get public URL | Upload Image | Give Prompt | # 🟨 Input & Image Upload<br>- User uploads a dress image via **Form Trigger**.<br>- Model image is downloaded from predefined URL. |
| Download Model Image | httpRequest | Fetch model image from fixed URL | Upload Image | Upload Model Image | # 🟨 Input & Image Upload<br>- User uploads a dress image via **Form Trigger**.<br>- Model image is downloaded from predefined URL. |
| Upload Model Image | vlmRun | Upload model image to VLM Run to get public URL | Download Model Image | Set Mapping | # 🟨 Input & Image Upload<br>- User uploads a dress image via **Form Trigger**.<br>- Model image is downloaded from predefined URL. |
| Set Mapping | set | Map `Model_Image_Link` from `public_url` | Upload Model Image | Merge | # 🟦 Prompt  Preparation<br>- Construct the final user prompt<br>- Map: - Model image URL - Dress image URL |
| Give Prompt | set | Create prompt + map `Dress_Image_Link` | Upload Dress Image; Download Image (error); Download Video (error) | Merge | # 🟦 Prompt  Preparation<br>- Construct the final user prompt<br>- Map: - Model image URL - Dress image URL |
| Merge | merge | Combine model and dress/prompt streams | Set Mapping; Give Prompt | Aggregate | # 🟪 Merge & Aggregate<br>- Merge model + dress image metadata<br>- Aggregate items into a single payload<br>- Wait node ensures async safety |
| Aggregate | aggregate | Aggregate items into one payload (`data` array) | Merge; Generate Image (secondary); Generate Video (secondary) | Wait | # 🟪 Merge & Aggregate<br>- Merge model + dress image metadata<br>- Aggregate items into a single payload<br>- Wait node ensures async safety |
| Wait | wait | Buffer before generation | Aggregate | Generate Image | # 🟪 Merge & Aggregate<br>- Merge model + dress image metadata<br>- Aggregate items into a single payload<br>- Wait node ensures async safety |
| Generate Image | vlmRun | Generate try-on image from model+dress URLs | Wait | Return Image URL; Aggregate (secondary) | # 🟥 VLM Run – Image & Video Generation<br>- Uses **VLM Run Chat Completion**<br>- Input type: `image`<br>- Generates try-on image & fashion video<br>- Requires model & dress URLs<br>- Output: pre-signed download URL |
| Return Image URL | code | Extract first URL from generation output | Generate Image | Download Image; Send to Discord; Generate Video | # 🟪 Code Node & Image/ Video Download<br>- Code extracts full signed URL incl. query parameters<br>- Download nodes use it securely |
| Download Image | httpRequest | Download generated image from signed URL | Return Image URL | Send Image; Give Prompt (error) | # 🟪 Code Node & Image/ Video Download<br>- Code extracts full signed URL incl. query parameters<br>- Download nodes use it securely |
| Send Image | telegram | Send downloaded media to Telegram as document | Download Image; Download Video | — | # 🟩 Upload to Discord, YouTube & Send via Telegram<br>- Send via Telegram<br>- Post to Discord<br>- Upload to YouTube |
| Send to Discord | discord | Post image preview (embed) | Return Image URL | — | # 🟩 Upload to Discord, YouTube & Send via Telegram<br>- Send via Telegram<br>- Post to Discord<br>- Upload to YouTube |
| Generate Video | vlmRun | Generate fashion video based on generated image URL | Return Image URL | Return Video URL; Aggregate (secondary) | # 🟥 VLM Run – Image & Video Generation<br>- Uses **VLM Run Chat Completion**<br>- Input type: `image`<br>- Generates try-on image & fashion video |
| Return Video URL | code | Extract first URL from video generation output | Generate Video | Download Video | # 🟪 Code Node & Image/ Video Download<br>- Code extracts full signed URL incl. query parameters<br>- Download nodes use it securely |
| Download Video | httpRequest | Download generated video from signed URL | Return Video URL | Upload a video; Send Image; Give Prompt (error) | # 🟪 Code Node & Image/ Video Download<br>- Code extracts full signed URL incl. query parameters<br>- Download nodes use it securely |
| Upload a video | youTube | Upload video to YouTube | Download Video | — | # 🟩 Upload to Discord, YouTube & Send via Telegram<br>- Send via Telegram<br>- Post to Discord<br>- Upload to YouTube |
| Sticky Note | stickyNote | Comment | — | — | # 📌 Virtual Try-On – Intro Use Case… |
| Sticky Note1 | stickyNote | Comment | — | — | # 🟪 Merge & Aggregate… |
| Sticky Note2 | stickyNote | Comment | — | — | # 🟪 Code Node & Image/ Video Download… |
| Sticky Note3 | stickyNote | Comment | — | — | # 🟩 Upload to Discord, YouTube & Send via Telegram… |
| Sticky Note4 | stickyNote | Comment (empty) | — | — |  |
| Sticky Note5 | stickyNote | Comment | — | — | # 🟨 Input & Image Upload… |
| Sticky Note6 | stickyNote | Comment | — | — | # 🟥 VLM Run – Image & Video Generation… |
| Sticky Note7 | stickyNote | Comment | — | — | # 🟦 Prompt  Preparation… |

---

## 4. Reproducing the Workflow from Scratch

1) **Create credentials**
   1. VLM Run API credential (for `@vlm-run/n8n-nodes-vlmrun.vlmRun`).
   2. Telegram Bot credential (Telegram API).
   3. Discord OAuth2 credential with permission to post in the target channel.
   4. YouTube OAuth2 credential with scopes allowing video upload (YouTube Data API v3 upload scope).

2) **Add the entry node: “Upload Image”**
   - Node: **Form Trigger**
   - Add a file field named/labelled `data` (recommended: change accepted types to image formats like `.png,.jpg,.jpeg,.webp`).
   - Ensure it outputs binary data.

3) **Dress upload to VLM Run**
   - Node: **VLM Run** → operation **File** → **Upload**
   - Connect: `Upload Image` → `Upload Dress Image`
   - Confirm output includes a `public_url`.

4) **Download model image**
   - Node: **HTTP Request**
   - Method: GET
   - URL: the hardcoded model image URL you want.
   - Configure response to be treated as **binary** (important for upload).
   - Connect: `Upload Image` → `Download Model Image`

5) **Upload model image to VLM Run**
   - Node: **VLM Run** → operation **File** → **Upload**
   - Connect: `Download Model Image` → `Upload Model Image`

6) **Map model URL**
   - Node: **Set** (“Set Mapping”)
   - Add field `Model_Image_Link` = `{{$json.public_url}}`
   - Connect: `Upload Model Image` → `Set Mapping`

7) **Build prompt + map dress URL**
   - Node: **Set** (“Give Prompt”)
   - Add field `Prompt` (string) with your instruction text.
   - Add field `Dress_Image_Link` = `{{$json.public_url}}`
   - Connect: `Upload Dress Image` → `Give Prompt`

8) **Merge the two branches**
   - Node: **Merge**
   - Connect: `Set Mapping` → `Merge` (Input 1)
   - Connect: `Give Prompt` → `Merge` (Input 2)

9) **Aggregate into one payload**
   - Node: **Aggregate**
   - Mode: **Aggregate All Item Data** (so you get an array such as `data`)
   - Connect: `Merge` → `Aggregate`

10) **Wait/buffer**
   - Node: **Wait**
   - Set to a small delay (e.g., 1 second).
   - Connect: `Aggregate` → `Wait`

11) **Generate image (try-on)**
   - Node: **VLM Run** → operation **Chat Completion**
   - Input type: `image`
   - Prompt message content: `{{$json.data[0].Prompt || $json.data[1].Prompt}}`
   - Image URLs:
     - Model: `{{$json.data[1].Model_Image_Link || $json.data[0].Model_Image_Link}}`
     - Dress: `{{$json.data[0].Dress_Image_Link || $json.data[1].Dress_Image_Link}}`
   - Connect: `Wait` → `Generate Image`

12) **Extract image URL**
   - Node: **Code**
   - Paste logic that regex-extracts the first `http(s)` URL from the prior output and returns `{url: ...}`.
   - Connect: `Generate Image` → `Return Image URL`

13) **Download generated image**
   - Node: **HTTP Request**
   - URL: `{{$json.url}}`
   - Configure response as **binary** (so Telegram can send it).
   - Connect: `Return Image URL` → `Download Image`

14) **Send image to Telegram**
   - Node: **Telegram** → `sendDocument`
   - Set `chatId` to your target.
   - Enable `binaryData: true` and ensure it points to the binary property produced by “Download Image”.
   - Connect: `Download Image` → `Send Image`

15) **Post image to Discord**
   - Node: **Discord** → Resource: `message`
   - Set guild/channel, message content, and embed image URL `{{$json.url}}`
   - Connect: `Return Image URL` → `Send to Discord`

16) **Generate video**
   - Node: **VLM Run** → Chat Completion, input type `image`
   - Prompt: your video instruction
   - Image URL: `{{$json.url}}`
   - Connect: `Return Image URL` → `Generate Video`

17) **Extract video URL**
   - Node: **Code** (same extraction approach)
   - Connect: `Generate Video` → `Return Video URL`

18) **Download video**
   - Node: **HTTP Request**
   - URL: `{{$json.url}}`
   - Configure response as **binary**
   - Connect: `Return Video URL` → `Download Video`

19) **Upload video to YouTube**
   - Node: **YouTube** → Resource: `video` → Operation: `upload`
   - Set title/region and map binary input
   - Connect: `Download Video` → `Upload a video`

20) **(Optional) Send video to Telegram**
   - Connect: `Download Video` → `Send Image` (as in the workflow), or better create a dedicated Telegram “sendVideo” node.

**Important implementation notes when rebuilding:**
- Ensure both HTTP Request download nodes are configured to output **binary data**, and that Telegram/YouTube nodes reference the correct binary property name.
- Consider removing the secondary connections from `Generate Image`/`Generate Video` back into `Aggregate` unless you intentionally want a feedback loop.

---

## 5. General Notes & Resources

| Note Content | Context or Link |
|---|---|
| # 📌 Virtual Try-On – Intro Use Case: Allow users to visualize how a dress looks on a person. Upload model & dress images, generate a realistic try-on image and fashion video using VLM Run with secure links. | Workflow intent / business context (sticky note) |
| # 🟪 Merge & Aggregate: Merge metadata, aggregate to single payload, Wait for async safety | Workflow design rationale (sticky note) |
| # 🟥 VLM Run – Image & Video Generation: Uses Chat Completion with `inputType=image`, outputs pre-signed download URL | Generation block notes (sticky note) |
| # 🟪 Code Node & Image/Video Download: Regex extracts full signed URL incl. query parameters; download securely | URL extraction/download rationale (sticky note) |
| # 🟩 Upload to Discord, YouTube & Send via Telegram: Multi-platform sharing | Publishing block notes (sticky note) |
| Sticky Note4 is empty | No additional context provided |

