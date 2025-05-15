import re


def determine_collection_name(url):
    """
    Determines a semantic collection name based on a URL

    Args:
        url (str): The URL to analyze

    Returns:
        str: The appropriate semantic collection name
    """
    try:
        # Parse the URL to get its components
        domain, path, query = split_url(url)

        # Extract domain without www and top-level domain
        domain_parts = domain.split(".")
        base_domain = domain
        if len(domain_parts) >= 2:
            # Handle cases like www.example.com or sub.example.co.uk
            if domain_parts[0] == "www":
                base_domain = ".".join(domain_parts[1:])
            else:
                base_domain = ".".join(domain_parts[:-1])  # Remove TLD

        # Special case: IP addresses
        if re.match(r"^\d+\.\d+\.\d+\.\d+$", domain):
            return "ip_address_sites"

        # LinkedIn patterns
        if "linkedin.com" in domain:
            if "/in/" in path or re.match(r"/in/[\w-]+/?$", path):
                return "linkedin_profiles"
            elif "/company/" in path:
                return "linkedin_companies"
            elif "/jobs/" in path:
                return "linkedin_jobs"
            elif "/learning/" in path:
                return "linkedin_learning"
            return "linkedin_other"

        # Developer platforms and code hosting
        # GitHub patterns (more granular)
        if "github.com" in domain:
            if re.match(r"^/[^/]+/[^/]+/pull/", path):
                return "github_pull_requests"
            elif re.match(r"^/[^/]+/[^/]+/issues/", path):
                return "github_issues"
            elif re.match(r"^/[^/]+/[^/]+/?$", path):
                return "github_repositories"
            elif re.match(r"^/[^/]+/?$", path):
                return "github_profiles"
            return "github_other"

        # GitLab patterns
        if "gitlab.com" in domain:
            if "/issues/" in path:
                return "gitlab_issues"
            elif "/merge_requests/" in path:
                return "gitlab_merge_requests"
            elif re.match(r"^/[^/]+/[^/]+/?$", path):
                return "gitlab_repositories"
            elif re.match(r"^/[^/]+/?$", path):
                return "gitlab_profiles"
            return "gitlab_other"

        # Bitbucket patterns
        if "bitbucket.org" in domain:
            if "/pull-requests/" in path:
                return "bitbucket_pull_requests"
            elif "/issues/" in path:
                return "bitbucket_issues"
            elif re.match(r"^/[^/]+/[^/]+/?$", path):
                return "bitbucket_repositories"
            elif re.match(r"^/[^/]+/?$", path):
                return "bitbucket_profiles"
            return "bitbucket_other"

        # Stack Overflow and Stack Exchange
        if "stackoverflow.com" in domain:
            if "/questions/" in path:
                return "stackoverflow_questions"
            elif "/users/" in path:
                return "stackoverflow_users"
            return "stackoverflow_other"
        if "stackexchange.com" in domain:
            return "stackexchange_questions"

        # npm
        if "npmjs.com" in domain:
            if "/package/" in path:
                return "npm_packages"
            return "npm_other"

        # PyPI
        if "pypi.org" in domain:
            if "/project/" in path:
                return "pypi_packages"
            return "pypi_other"

        # Docker Hub
        if "hub.docker.com" in domain:
            if "/r/" in path:
                return "docker_images"
            return "docker_other"

        # Jupyter Notebooks (nbviewer)
        if "nbviewer.jupyter.org" in domain:
            return "jupyter_notebooks"

        # CodePen
        if "codepen.io" in domain:
            if "/pen/" in path:
                return "codepen_pens"
            elif re.match(r"^/[^/]+/?$", path):
                return "codepen_profiles"
            return "codepen_other"

        # Glitch
        if "glitch.com" in domain:
            if "/edit/" in path:
                return "glitch_projects"
            return "glitch_other"

        # Replit
        if "replit.com" in domain:
            if "/@" in path:
                return "replit_profiles"
            elif "/@" in path and "/" in path[1:]:
                return "replit_projects"
            return "replit_other"

        # JSFiddle
        if "jsfiddle.net" in domain:
            return "jsfiddle_fiddles"

        # Gist
        if "gist.github.com" in domain:
            return "github_gists"

        # YouTube patterns
        if "youtube.com" in domain or domain == "youtu.be":
            if "/watch" in path or domain == "youtu.be":
                return "youtube_videos"
            elif "/playlist" in path:
                return "youtube_playlists"
            elif "/channel/" in path or "/c/" in path or "/user/" in path:
                return "youtube_channels"
            return "youtube_other"

        # Documentation sites
        if any(
            pattern in path
            for pattern in ["/docs/", "/documentation/", "/manual/", "/guide/", "/api/"]
        ):
            # Try to identify the service/product the documentation is for
            service_name = identify_service_from_domain(domain)
            return f"{service_name}_documentation"

        # Social media
        if "twitter.com" in domain or "x.com" in domain:
            if re.match(r"^/[^/]+/status/", path):
                return "twitter_posts"
            elif re.match(r"^/[^/]+/?$", path):
                return "twitter_profiles"
            return "twitter_other"

        if "facebook.com" in domain:
            if "/events/" in path:
                return "facebook_events"
            elif "/groups/" in path:
                return "facebook_groups"
            elif re.match(r"^/[^/]+/?$", path):
                return "facebook_profiles"
            return "facebook_other"

        if "instagram.com" in domain:
            if re.match(r"^/p/", path):
                return "instagram_posts"
            elif re.match(r"^/[^/]+/?$", path):
                return "instagram_profiles"
            return "instagram_other"

        # E-commerce
        if any(shop in domain for shop in ["amazon.", "ebay.", "walmart.", "etsy."]):
            if any(
                pattern in path for pattern in ["/product/", "/dp/", "/itm/", "/ip/"]
            ):
                return "ecommerce_products"
            elif (
                "/s/" in path or "/sch/" in path or "search=" in query or "q=" in query
            ):
                return "ecommerce_search_results"
            return "ecommerce_other"

        # News and articles
        if "medium.com" in domain:
            return "medium_articles"

        if domain.endswith("news") or any(
            news in domain
            for news in ["nytimes", "washingtonpost", "bbc", "cnn", "reuters"]
        ):
            return "news_articles"

        # Academic and research
        if any(
            academic in domain
            for academic in [
                "scholar.google.",
                "arxiv.org",
                "researchgate",
                "academia.edu",
                "jstor.org",
            ]
        ):
            return "academic_papers"

        # Forums and Q&A
        if "reddit.com" in domain:
            if "/r/" in path:
                # Extract subreddit name for more specific categorization
                subreddit_match = re.search(r"/r/([^/]+)", path)
                if subreddit_match:
                    return f"reddit_{subreddit_match.group(1)}"
            return "reddit_posts"

        if "quora.com" in domain:
            return "quora_questions"

        # Video streaming
        if any(
            streaming in domain
            for streaming in ["netflix.com", "hulu.com", "disneyplus.com", "hbomax.com"]
        ):
            return "streaming_content"

        # Generic patterns based on path
        if re.search(r"\.(pdf|docx?|xlsx?|pptx?|txt)$", path, re.IGNORECASE):
            return "document_files"

        if re.search(r"\.(jpe?g|png|gif|bmp|webp|svg)$", path, re.IGNORECASE):
            return "image_files"

        if re.search(r"\.(mp4|webm|mov|avi|wmv)$", path, re.IGNORECASE):
            return "video_files"

        # Generic categorization based on domain
        if "blog." in domain or "/blog/" in path:
            return "blog_posts"

        # Google services
        if "drive.google.com" in domain:
            return "google_drive_files"
        if "docs.google.com" in domain:
            if "/document/" in path:
                return "google_docs"
            elif "/spreadsheets/" in path:
                return "google_sheets"
            elif "/presentation/" in path:
                return "google_slides"
            return "google_docs_other"
        if "calendar.google.com" in domain:
            return "google_calendar"
        if "maps.google.com" in domain:
            return "google_maps"

        # Microsoft services
        if "onedrive.live.com" in domain or "1drv.ms" in domain:
            return "onedrive_files"
        if "office.com" in domain:
            return "microsoft_office"
        if "teams.microsoft.com" in domain:
            return "microsoft_teams"

        # Cloud storage
        if "dropbox.com" in domain:
            return "dropbox_files"
        if "box.com" in domain:
            return "box_files"

        # Programming resources
        if "npmjs.com" in domain:
            return "npm_packages"
        if "pypi.org" in domain:
            return "pypi_packages"
        if "hub.docker.com" in domain:
            return "docker_images"

        # Learning platforms
        if "coursera.org" in domain:
            return "coursera_courses"
        if "udemy.com" in domain:
            return "udemy_courses"
        if "edx.org" in domain:
            return "edx_courses"
        if "khanacademy.org" in domain:
            return "khanacademy_courses"

        # Shopping
        if "aliexpress.com" in domain:
            return "aliexpress_products"
        if "shopify.com" in domain:
            return "shopify_stores"

        # Music streaming
        if "spotify.com" in domain:
            if "/track/" in path:
                return "spotify_tracks"
            elif "/album/" in path:
                return "spotify_albums"
            elif "/playlist/" in path:
                return "spotify_playlists"
            return "spotify_other"
        if "soundcloud.com" in domain:
            return "soundcloud_tracks"
        if "music.apple.com" in domain:
            return "apple_music"

        # Messaging/social
        if "slack.com" in domain:
            return "slack_workspaces"
        if "discord.com" in domain or "discord.gg" in domain:
            return "discord_servers"
        if "telegram.me" in domain or "t.me" in domain:
            return "telegram_channels"
        if "whatsapp.com" in domain:
            return "whatsapp_chats"

        # Finance
        if any(
            fin in domain
            for fin in [
                "chase.com",
                "bankofamerica.com",
                "wellsfargo.com",
                "coinbase.com",
                "binance.com",
            ]
        ):
            return "finance_sites"

        # Audio files
        if re.search(r"\\.(mp3|wav|aac|flac|ogg)$", path, re.IGNORECASE):
            return "audio_files"

        # Archive files
        if re.search(r"\\.(zip|rar|tar|gz|7z)$", path, re.IGNORECASE):
            return "archive_files"

        # Code files
        if re.search(r"\\.(py|js|ts|java|cpp|c|rb|go|rs|php|sh)$", path, re.IGNORECASE):
            return "code_files"

        # Default case: use the domain as a prefix
        # Extract the main domain name without TLD
        clean_domain = get_clean_domain(domain)
        return f"{clean_domain}_pages"

    except Exception as e:
        print(f"Error parsing URL: {e}")
        return "uncategorized"


def identify_service_from_domain(domain):
    """
    Helper function to identify service name from domain
    """
    # Extract the main domain part
    parts = domain.split(".")
    if len(parts) >= 2:
        # Remove TLD, www, and docs subdomains
        service = parts[-2]
        if parts[0] in ["www", "docs"]:
            service = parts[-2] if len(parts) >= 3 else service
        return service
    return "general"


def get_clean_domain(domain):
    """
    Helper function to get clean domain name
    """
    # Remove common TLDs and subdomains
    clean_domain = re.sub(r"^www\.", "", domain)

    # Strip TLD
    clean_domain = re.sub(r"\.(com|org|net|io|co|gov|edu|info).*$", "", clean_domain)

    # Handle multi-part domains (e.g., co.uk)
    parts = clean_domain.split(".")
    if len(parts) > 1:
        return parts[-2]

    return clean_domain


def split_url(url: str):
    # Remove protocol
    if url.startswith("http://"):
        url = url[len("http://") :]
    elif url.startswith("https://"):
        url = url[len("https://") :]
    # Split off the query string
    if "?" in url:
        url, query = url.split("?", 1)
    else:
        query = ""
    # Split into domain and path
    parts = url.split("/", 1)
    domain = parts[0].lower()
    path = "/" + parts[1] if len(parts) > 1 else "/"
    return domain, path, query
