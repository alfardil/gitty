import requests


def _get_headers(githubAccessToken):
    headers = {"Accept": "application/vnd.github+json"}
    if githubAccessToken:
        headers["Authorization"] = f"Bearer {githubAccessToken}"
    return headers


class GitHubService:
    def __init__(self):
        self.access_token = None
        self.token_expires_at = None

    def _check_repository_exists(self, username, repo, githubAccessToken):
        """
        Check if the repository exists using the GitHub API.
        """
        api_url = f"https://api.github.com/repos/{username}/{repo}"
        response = requests.get(api_url, headers=_get_headers(githubAccessToken))

        if response.status_code == 404:
            raise ValueError("Repository not found.")
        elif response.status_code != 200:
            raise Exception(
                f"Failed to check repository: {response.status_code}, {response.json()}"
            )

    def get_default_branch(self, username, repo, githubAccessToken):
        """Get the default branch of the repository."""
        api_url = f"https://api.github.com/repos/{username}/{repo}"
        response = requests.get(api_url, headers=_get_headers(githubAccessToken))

        if response.status_code == 200:
            return response.json().get("default_branch")
        return None

    def get_github_file_paths_as_list(self, username, repo, githubAccessToken):
        """
        Fetches the file tree of an open-source GitHub repository,
        excluding static files and generated code.

        Args:
            username (str): The GitHub username or organization name
            repo (str): The repository name

        Returns:
            str: A filtered and formatted string of file paths in the repository, one per line.
        """

        def should_include_file(path):
            # Patterns to exclude
            excluded_patterns = [
                # Dependencies
                "node_modules/",
                "vendor/",
                "venv/",
                # Compiled files
                ".min.",
                ".pyc",
                ".pyo",
                ".pyd",
                ".so",
                ".dll",
                ".class",
                # Asset files
                ".jpg",
                ".jpeg",
                ".png",
                ".gif",
                ".ico",
                ".svg",
                ".ttf",
                ".woff",
                ".webp",
                # Cache and temporary files
                "__pycache__/",
                ".cache/",
                ".tmp/",
                # Lock files and logs
                "yarn.lock",
                "poetry.lock",
                "*.log",
                # Configuration files
                ".vscode/",
                ".idea/",
            ]

            return not any(pattern in path.lower() for pattern in excluded_patterns)

        # Try to get the default branch first
        branch = self.get_default_branch(username, repo, githubAccessToken)
        if branch:
            api_url = f"https://api.github.com/repos/{username}/{repo}/git/trees/{branch}?recursive=1"
            response = requests.get(api_url, headers=_get_headers(githubAccessToken))

            if response.status_code == 200:
                data = response.json()
                if "tree" in data:
                    # Filter the paths and join them with newlines
                    paths = [
                        item["path"]
                        for item in data["tree"]
                        if should_include_file(item["path"])
                    ]
                    return "\n".join(paths)

        # If default branch didn't work or wasn't found, try common branch names
        for branch in ["main", "master"]:
            api_url = f"https://api.github.com/repos/{username}/{repo}/git/trees/{branch}?recursive=1"
            response = requests.get(api_url, headers=_get_headers(githubAccessToken))

            if response.status_code == 200:
                data = response.json()
                if "tree" in data:
                    # Filter the paths and join them with newlines
                    paths = [
                        item["path"]
                        for item in data["tree"]
                        if should_include_file(item["path"])
                    ]
                    return "\n".join(paths)

        raise ValueError(
            "Could not fetch repository file tree. Repository might not exist, be empty or private."
        )

    def get_github_readme(self, username, repo, githubAccessToken):
        """
        Fetches the README contents of an open-source GitHub repository.

        Args:
            username (str): The GitHub username or organization name
            repo (str): The repository name

        Returns:
            str: The contents of the README file.

        Raises:
            ValueError: If repository does not exist or has no README.
            Exception: For other unexpected API errors.
        """
        # First check if the repository exists
        self._check_repository_exists(username, repo, githubAccessToken)

        # Then attempt to fetch the README
        api_url = f"https://api.github.com/repos/{username}/{repo}/readme"
        response = requests.get(api_url, headers=_get_headers(githubAccessToken))

        if response.status_code == 404:
            raise ValueError("No README found for the specified repository. (Required)")
        elif response.status_code != 200:
            raise Exception(
                f"Failed to fetch README: {response.status_code}, {response.json()}"
            )

        data = response.json()
        readme_content = requests.get(data["download_url"]).text
        return readme_content

    def get_file_contents(self, username, repo, file_path, githubAccessToken):
        """
        Fetches the contents of a specific file from a GitHub repository.

        Args:
            username (str): The GitHub username or organization name
            repo (str): The repository name
            file_path (str): The path to the file in the repository
            githubAccessToken (str): GitHub access token for authentication

        Returns:
            str: The contents of the file

        Raises:
            ValueError: If file does not exist or is too large
            Exception: For other unexpected API errors
        """
        # First check if the repository exists
        self._check_repository_exists(username, repo, githubAccessToken)

        # Get the default branch
        branch = self.get_default_branch(username, repo, githubAccessToken)
        if not branch:
            branch = "main"  # fallback

        # Fetch file contents
        api_url = f"https://api.github.com/repos/{username}/{repo}/contents/{file_path}?ref={branch}"
        response = requests.get(api_url, headers=_get_headers(githubAccessToken))

        if response.status_code == 404:
            raise ValueError(f"File {file_path} not found in the repository")
        elif response.status_code != 200:
            raise Exception(
                f"Failed to fetch file {file_path}: {response.status_code}, {response.json()}"
            )

        data = response.json()

        # Check if file is too large (GitHub API limit is 1MB for contents endpoint)
        if data.get("size", 0) > 1024 * 1024:  # 1MB
            raise ValueError(f"File {file_path} is too large to fetch via API")

        # Decode content if it's base64 encoded
        import base64

        content = base64.b64decode(data["content"]).decode("utf-8")
        return content

    def get_repository_files_with_contents(
        self, username, repo, githubAccessToken, max_files=50
    ):
        """
        Fetches a list of important files from the repository with their contents.
        Prioritizes configuration files, source files, and documentation.

        Args:
            username (str): The GitHub username or organization name
            repo (str): The repository name
            githubAccessToken (str): GitHub access token for authentication
            max_files (int): Maximum number of files to fetch

        Returns:
            List[Dict]: List of dictionaries with 'path' and 'content' keys
        """
        # First check if the repository exists
        self._check_repository_exists(username, repo, githubAccessToken)

        # Get the default branch
        branch = self.get_default_branch(username, repo, githubAccessToken)
        if not branch:
            branch = "main"  # fallback

        # Get the file tree
        api_url = f"https://api.github.com/repos/{username}/{repo}/git/trees/{branch}?recursive=1"
        response = requests.get(api_url, headers=_get_headers(githubAccessToken))

        if response.status_code != 200:
            error_detail = "Unknown error"
            try:
                error_detail = response.json()
            except:
                error_detail = response.text
            raise Exception(
                f"Failed to fetch repository tree: {response.status_code}, {error_detail}"
            )

        data = response.json()
        if "tree" not in data:
            raise ValueError("Repository tree is empty")

        print(f"Repository tree contains {len(data['tree'])} items")
        print(
            f"Files found: {[item['path'] for item in data['tree'] if item['type'] == 'blob']}"
        )

        # Define priority patterns for file selection
        priority_patterns = [
            # Configuration files
            "package.json",
            "pyproject.toml",
            "requirements.txt",
            "Cargo.toml",
            "go.mod",
            "composer.json",
            "Gemfile",
            "pom.xml",
            "build.gradle",
            "Makefile",
            # Documentation
            "README",
            "CHANGELOG",
            "LICENSE",
            "CONTRIBUTING",
            "docs/",
            # Source code (limit to main directories)
            "src/",
            "app/",
            "lib/",
            "main.",
            "index.",
            "app.py",
            "main.py",
            # Shell scripts and executables
            ".sh",
            ".bash",
            ".zsh",
            ".fish",
            # Configuration
            ".env.example",
            "config/",
            "settings/",
            # Common source files
            ".js",
            ".ts",
            ".jsx",
            ".tsx",
            ".py",
            ".java",
            ".cpp",
            ".c",
            ".h",
            ".go",
            ".rs",
            ".php",
            ".rb",
            ".swift",
            ".kt",
            ".scala",
        ]

        def get_priority_score(path):
            """Calculate priority score for file selection"""
            path_lower = path.lower()
            for i, pattern in enumerate(priority_patterns):
                if pattern.lower() in path_lower:
                    return len(priority_patterns) - i  # Higher index = higher priority
            return 0

        # Filter and sort files by priority
        files = []
        for item in data["tree"]:
            if item["type"] == "blob":  # Only files, not directories
                path = item["path"]
                # Skip binary files and large files
                if any(
                    ext in path.lower()
                    for ext in [
                        ".jpg",
                        ".jpeg",
                        ".png",
                        ".gif",
                        ".ico",
                        ".svg",
                        ".ttf",
                        ".woff",
                        ".webp",
                        ".min.",
                        ".pyc",
                        ".so",
                        ".dll",
                        ".class",
                    ]
                ):
                    continue
                if item.get("size", 0) > 100 * 1024:  # Skip files larger than 100KB
                    continue

                priority = get_priority_score(path)
                # Include all files, but prioritize based on patterns
                files.append((path, priority))

        # Sort by priority and take top files
        files.sort(key=lambda x: x[1], reverse=True)
        selected_files = files[:max_files]

        print(f"Selected {len(selected_files)} files for fetching:")
        for path, priority in selected_files:
            print(f"  - {path} (priority: {priority})")

        # Fetch contents for selected files
        result = []
        print(f"Attempting to fetch {len(selected_files)} files from {username}/{repo}")
        for path, priority in selected_files:
            try:
                content = self.get_file_contents(
                    username, repo, path, githubAccessToken
                )
                result.append({"path": path, "content": content})
                print(f"Successfully fetched {path} (priority: {priority})")
            except Exception as e:
                # Skip files that can't be fetched
                print(f"Warning: Could not fetch {path}: {e}")
                continue

        print(
            f"Successfully fetched {len(result)} files out of {len(selected_files)} attempted"
        )
        return result
