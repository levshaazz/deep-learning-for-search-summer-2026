#!/usr/bin/env python3
"""check_links.py — external-link liveness for the course bibliography.

data/papers.json is the single source of truth for every cited work; each carries a
canonical `url`. External links rot silently (arXiv is stable, but publisher/DOI targets
move). This checks every URL is reachable and reports:

  DEAD  — 404 / 410 (page gone) or DNS NXDOMAIN (host gone).  HARD-fails (exit 1).
  WARN  — 403 / 401 / timeout / 5xx / TLS wobble. Transient or bot-blocked (many
          publishers reject automated HEADs even for a live page). Reported, never fatal.
  OK    — 2xx (after redirects).

Stdlib only (urllib), concurrent, browser-like UA, HEAD→GET fallback. Best run on a
schedule (links rot slowly), not on every push — see .github/workflows/link-check.yml.

Run:  python3 _research/check_links.py                 (exit 1 iff any DEAD link)
      python3 _research/check_links.py --limit 20       (first N, for a quick smoke)
      python3 _research/check_links.py --selftest        (offline: extraction + verdicts)
"""
import argparse
import json
import os
import socket
import ssl
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PAPERS = os.path.join(ROOT, "data", "papers.json")

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
TIMEOUT = 25
WORKERS = 12

# Hosts that habitually reject automated requests (403/anti-bot) even for a live page —
# a non-2xx from these is NOT evidence the link is dead.
BOT_BLOCK_HOSTS = {
    "link.springer.com", "dl.acm.org", "www.sciencedirect.com", "sciencedirect.com",
    "ieeexplore.ieee.org", "www.manning.com", "onlinelibrary.wiley.com",
    "www.nature.com", "dickmanning.com", "direct.mit.edu",
}


def works():
    d = json.load(open(PAPERS, encoding="utf-8"))
    return {k: v for k, v in d.items() if k != "_meta"}


def url_for(w):
    """Canonical link: explicit url, else derive from arxiv / doi."""
    if w.get("url"):
        return w["url"]
    if w.get("arxiv"):
        return f"https://arxiv.org/abs/{w['arxiv']}"
    if w.get("doi"):
        return f"https://doi.org/{w['doi']}"
    return None


def probe(url):
    """Return (status, detail, final_url). status in OK|HTTP|DNS|ERR."""
    ctx = ssl.create_default_context()
    headers = {"User-Agent": UA, "Accept": "*/*", "Accept-Language": "en"}
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(url, method=method, headers=headers)
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as r:
                return ("OK", getattr(r, "status", 200), r.geturl())
        except urllib.error.HTTPError as e:
            if e.code in (403, 405, 406, 429) and method == "HEAD":
                continue  # some hosts refuse HEAD — retry with GET
            return ("HTTP", e.code, url)
        except urllib.error.URLError as e:
            reason = e.reason
            if isinstance(reason, socket.gaierror):
                return ("DNS", str(reason), url)
            if method == "HEAD":
                continue
            return ("ERR", str(reason)[:70], url)
        except (socket.timeout, TimeoutError):
            if method == "HEAD":
                continue
            return ("ERR", "timeout", url)
        except (ssl.SSLError, ConnectionError, OSError) as e:
            if method == "HEAD":
                continue
            return ("ERR", str(e)[:70], url)
    return ("ERR", "HEAD and GET both failed", url)


def verdict(status, detail, host):
    if status == "OK":
        return "OK"
    if status == "DNS":
        return "DEAD"
    if status == "HTTP":
        code = detail
        if code in (404, 410):
            return "DEAD"
        return "WARN"          # 401/403/429/5xx — paywall / bot-block / flake
    return "WARN"              # timeout / TLS / connection — transient


def _selftest():
    cases = [
        (("OK", 200, "u"), "example.com", "OK"),
        (("HTTP", 404, "u"), "example.com", "DEAD"),
        (("HTTP", 410, "u"), "example.com", "DEAD"),
        (("DNS", "no host", "u"), "gone.invalid", "DEAD"),
        (("HTTP", 403, "u"), "dl.acm.org", "WARN"),
        (("HTTP", 500, "u"), "example.com", "WARN"),
        (("ERR", "timeout", "u"), "slow.example", "WARN"),
    ]
    fails = []
    for (probe_res, host, exp) in cases:
        got = verdict(probe_res[0], probe_res[1], host)
        if got != exp:
            fails.append((probe_res, exp, got))
    # url extraction
    assert url_for({"url": "http://x"}) == "http://x"
    assert url_for({"arxiv": "2401.00001"}) == "https://arxiv.org/abs/2401.00001"
    assert url_for({"doi": "10.1/abc"}) == "https://doi.org/10.1/abc"
    assert url_for({}) is None
    if fails:
        for f in fails:
            print(f"  ✗ {f}")
        print("check_links selftest FAILED")
        return 1
    print(f"check_links selftest OK — {len(cases)} verdict cases + url extraction")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return _selftest()

    items = []
    for wid, w in works().items():
        u = url_for(w)
        if u:
            items.append((wid, u))
    if args.limit:
        items = items[: args.limit]
    print(f"checking {len(items)} external links ({WORKERS} workers, {TIMEOUT}s timeout) …\n")

    dead, warn = [], []
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(probe, u): (wid, u) for wid, u in items}
        for fut in as_completed(futs):
            wid, u = futs[fut]
            status, detail, final = fut.result()
            host = urlparse(u).netloc
            v = verdict(status, detail, host)
            if v == "DEAD":
                dead.append((wid, u, f"{status} {detail}"))
            elif v == "WARN":
                warn.append((wid, u, f"{status} {detail}"))

    print("=" * 72)
    print(f"LINK CHECK — {len(items)} links · OK={len(items)-len(dead)-len(warn)} "
          f"· WARN={len(warn)} · DEAD={len(dead)}")
    print("=" * 72)
    if dead:
        print("\nDEAD (page/host gone — fix the url in data/papers.json):")
        for wid, u, why in sorted(dead):
            print(f"  ✗ {wid:<32} {why}\n      {u}")
    if warn:
        print("\nWARN (bot-blocked / transient — re-run to confirm, likely fine):")
        for wid, u, why in sorted(warn):
            print(f"  · {wid:<32} {why}")
    print("-" * 72)
    print(f"DEAD={len(dead)}")
    return 1 if dead else 0


if __name__ == "__main__":
    sys.exit(main())
