# scraper.py
import requests
import json
import time
from bs4 import BeautifulSoup # type: ignore
from urllib.parse import urljoin

SEED_URLS = [
    "https://handbook.gitlab.com/handbook/values/",
    "https://handbook.gitlab.com/handbook/company/culture/",
    "https://handbook.gitlab.com/handbook/people-group/",
    "https://handbook.gitlab.com/handbook/engineering/",
    "https://handbook.gitlab.com/handbook/hiring/",
    "https://handbook.gitlab.com/handbook/communication/",
    "https://handbook.gitlab.com/handbook/leadership/",
    "https://about.gitlab.com/direction/",
]

MAX_PAGES = 80
visited = set()
chunks = []

def scrape_page(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, timeout=10, headers=headers)
        soup = BeautifulSoup(response.text, "html.parser")
        title = soup.title.string.strip() if soup.title else url
        main = (
            soup.find("main")
            or soup.find("article")
            or soup.find(class_="content")
            or soup.body
        )
        text = main.get_text(separator="\n", strip=True) if main else ""
        links = []
        for a in soup.find_all("a", href=True):
            full_url = urljoin(url, a["href"])
            if (
                "handbook.gitlab.com" in full_url
                or "about.gitlab.com/direction" in full_url
            ) and full_url not in visited:
                links.append(full_url)
        return text, title, links
    except Exception as e:
        print(f"  Error scraping {url}: {e}")
        return "", "", []

def chunk_text(text, source, title, chunk_size=600, overlap=80):
    words = text.split()
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        if len(chunk) > 150:
            chunks.append({
                "text": chunk,
                "source": source,
                "title": title
            })

queue = list(SEED_URLS)

while queue and len(visited) < MAX_PAGES:
    url = queue.pop(0)
    if url in visited:
        continue
    visited.add(url)
    print(f"[{len(visited)}/{MAX_PAGES}] Scraping: {url}")
    text, title, links = scrape_page(url)
    chunk_text(text, url, title)
    queue.extend(links)
    time.sleep(0.5)

with open("chunks.json", "w", encoding="utf-8") as f:
    json.dump(chunks, f, ensure_ascii=False, indent=2)

print(f"\nDone! Scraped {len(visited)} pages → {len(chunks)} chunks saved to chunks.json")