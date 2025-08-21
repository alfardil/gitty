#!/usr/bin/env python3
"""
Test script to debug GitHub service issues with the raycastScripts repository.
"""

import sys
import os

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.services.github import GitHubService


def test_github_service():
    """Test the GitHub service with the raycastScripts repository."""

    github_service = GitHubService()

    # Test with the raycastScripts repository
    username = "alfardil"
    repo = "raycastScripts"
    github_access_token = ""  # Empty for public repo

    print(f"Testing GitHub service with {username}/{repo}")
    print("=" * 50)

    try:
        # Test 1: Check if repository exists
        print("1. Checking if repository exists...")
        github_service._check_repository_exists(username, repo, github_access_token)
        print("✅ Repository exists")

        # Test 2: Get default branch
        print("\n2. Getting default branch...")
        branch = github_service.get_default_branch(username, repo, github_access_token)
        print(f"✅ Default branch: {branch}")

        # Test 3: Get file tree
        print("\n3. Getting file tree...")
        api_url = f"https://api.github.com/repos/{username}/{repo}/git/trees/{branch}?recursive=1"
        import requests

        response = requests.get(
            api_url, headers={"Accept": "application/vnd.github+json"}
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✅ File tree fetched successfully")
            print(f"   Total items in tree: {len(data.get('tree', []))}")

            # Show some files
            files = [item for item in data.get("tree", []) if item["type"] == "blob"]
            print(f"   Total files: {len(files)}")
            for file in files[:10]:  # Show first 10 files
                print(f"   - {file['path']} ({file.get('size', 0)} bytes)")
        else:
            print(f"❌ Failed to get file tree: {response.status_code}")
            print(f"   Response: {response.text}")

        # Test 4: Get repository files with contents
        print("\n4. Getting repository files with contents...")
        files = github_service.get_repository_files_with_contents(
            username, repo, github_access_token, max_files=10
        )

        if files:
            print(f"✅ Successfully fetched {len(files)} files")
            for file in files:
                print(f"   - {file['path']} ({len(file['content'])} chars)")
        else:
            print("❌ No files found")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_github_service()
