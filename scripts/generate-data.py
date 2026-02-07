#!/usr/bin/env python3
"""Generate workflows.json from all metadata files for the GitHub Pages UI."""

import json
import glob
import os
import re
from urllib.parse import quote

GITHUB_RAW_BASE = "https://raw.githubusercontent.com/murataslan1/n8n-workflow-collection/main/workflows"
GITHUB_BROWSE_BASE = "https://github.com/murataslan1/n8n-workflow-collection/tree/main/workflows"
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKFLOWS_DIR = os.path.join(REPO_ROOT, "workflows")
OUTPUT_FILE = os.path.join(REPO_ROOT, "docs", "data", "workflows.json")


def extract_id_from_filename(filename):
    match = re.search(r"-(\d+)\.json$", filename)
    return match.group(1) if match else None


def process_metadata(meta_path):
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None

    folder = os.path.basename(os.path.dirname(meta_path))
    wf_id = extract_id_from_filename(os.path.basename(meta_path))

    # Find workflow JSON file
    folder_path = os.path.dirname(meta_path)
    json_files = [
        f for f in os.listdir(folder_path)
        if f.endswith(".json") and not f.startswith("metada")
    ]
    workflow_json = json_files[0] if json_files else None

    # Find screenshot
    image_files = [
        f for f in os.listdir(folder_path)
        if f.endswith((".webp", ".png", ".jpg"))
    ]
    image = image_files[0] if image_files else None

    # Find readme
    readme_files = [
        f for f in os.listdir(folder_path)
        if f.startswith("readme") and f.endswith(".md")
    ]
    readme = readme_files[0] if readme_files else None

    # Extract node types
    node_types = data.get("nodeTypes", {})
    nodes = list(node_types.keys())

    # Extract categories
    categories = [c["name"] for c in data.get("categories", [])]

    encoded_folder = quote(folder)

    return {
        "id": wf_id or folder,
        "name": data.get("user_name", folder),
        "title": folder,
        "categories": categories,
        "nodes": nodes,
        "nodeCount": sum(
            v if isinstance(v, (int, float)) else v.get("count", 1) if isinstance(v, dict) else 1
            for v in node_types.values()
        ) if isinstance(node_types, dict) else 0,
        "author": data.get("user_username", ""),
        "authorBio": data.get("user_bio", ""),
        "url": data.get("url", ""),
        "urlN8n": data.get("url_n8n", ""),
        "image": f"{GITHUB_RAW_BASE}/{encoded_folder}/{quote(image)}" if image else None,
        "json": f"{GITHUB_RAW_BASE}/{encoded_folder}/{quote(workflow_json)}" if workflow_json else None,
        "readme": f"{GITHUB_BROWSE_BASE}/{encoded_folder}/{quote(readme)}" if readme else None,
        "folder": folder,
    }


def main():
    workflows = []
    category_counts = {}

    meta_files = glob.glob(os.path.join(WORKFLOWS_DIR, "*", "metada-*.json"))
    print(f"Found {len(meta_files)} metadata files")

    for meta_path in sorted(meta_files):
        result = process_metadata(meta_path)
        if result:
            workflows.append(result)
            for cat in result["categories"]:
                category_counts[cat] = category_counts.get(cat, 0) + 1

    # Add the manually added RAG workflow
    rag_folder = "RAG Workflow For Company Documents stored in Google Drive"
    rag_path = os.path.join(WORKFLOWS_DIR, rag_folder)
    if os.path.exists(rag_path):
        rag_json = [f for f in os.listdir(rag_path) if f.endswith(".json")]
        if rag_json:
            workflows.append({
                "id": "2753",
                "name": "RAG Chatbot for Company Documents",
                "title": rag_folder,
                "categories": ["AI", "AI RAG"],
                "nodes": [
                    "n8n-nodes-base.googleDriveTrigger",
                    "n8n-nodes-base.googleDrive",
                    "@n8n/n8n-nodes-langchain.vectorStorePinecone",
                    "@n8n/n8n-nodes-langchain.embeddingsGoogleGemini",
                    "@n8n/n8n-nodes-langchain.agent",
                    "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
                    "@n8n/n8n-nodes-langchain.chatTrigger",
                ],
                "nodeCount": 16,
                "author": "murataslan1",
                "authorBio": "",
                "url": "https://n8n.io/workflows/2753-rag-chatbot-for-company-documents-using-google-drive-and-gemini/",
                "urlN8n": "https://n8n.io/workflows/2753-rag-chatbot-for-company-documents-using-google-drive-and-gemini/",
                "image": None,
                "json": f"{GITHUB_RAW_BASE}/{quote(rag_folder)}/{quote(rag_json[0])}",
                "readme": None,
                "folder": rag_folder,
                "featured": True,
            })
            category_counts["AI"] = category_counts.get("AI", 0) + 1
            category_counts["AI RAG"] = category_counts.get("AI RAG", 0) + 1

    # Sort categories by count
    sorted_categories = sorted(category_counts.items(), key=lambda x: -x[1])

    # Collect all unique nodes
    all_nodes = set()
    for w in workflows:
        all_nodes.update(w["nodes"])

    output = {
        "totalWorkflows": len(workflows),
        "totalCategories": len(category_counts),
        "totalIntegrations": len(all_nodes),
        "categories": [{"name": c, "count": n} for c, n in sorted_categories],
        "workflows": workflows,
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False)

    print(f"Generated {OUTPUT_FILE}")
    print(f"  Workflows: {len(workflows)}")
    print(f"  Categories: {len(category_counts)}")
    print(f"  Integrations: {len(all_nodes)}")
    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"  File size: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
