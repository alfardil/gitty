#!/usr/bin/env python3
"""
Simple test to check GitHub API access.
"""

import requests


def test_github_api():
    """Test basic GitHub API access."""

    # Test with the raycastScripts repository
    username = "alfardil"
    repo = "raycastScripts"

    print(f"Testing GitHub API with {username}/{repo}")
    print("=" * 50)

    # Test 1: Check repository exists
    print("1. Checking repository...")
    api_url = f"https://api.github.com/repos/{username}/{repo}"
    response = requests.get(api_url, headers={"Accept": "application/vnd.github+json"})

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Repository exists")
        print(f"   Name: {data.get('name')}")
        print(f"   Description: {data.get('description')}")
        print(f"   Private: {data.get('private')}")
        print(f"   Default branch: {data.get('default_branch')}")
    else:
        print(f"❌ Repository not found: {response.status_code}")
        print(f"   Response: {response.text}")
        return

    # Test 2: Get file tree
    print("\n2. Getting file tree...")
    branch = data.get("default_branch", "main")
    tree_url = (
        f"https://api.github.com/repos/{username}/{repo}/git/trees/{branch}?recursive=1"
    )
    tree_response = requests.get(
        tree_url, headers={"Accept": "application/vnd.github+json"}
    )

    if tree_response.status_code == 200:
        tree_data = tree_response.json()
        files = [item for item in tree_data.get("tree", []) if item["type"] == "blob"]
        print(f"✅ File tree fetched successfully")
        print(f"   Total files: {len(files)}")
        for file in files:
            print(f"   - {file['path']} ({file.get('size', 0)} bytes)")
    else:
        print(f"❌ Failed to get file tree: {tree_response.status_code}")
        print(f"   Response: {tree_response.text}")


if __name__ == "__main__":
    test_github_api()
