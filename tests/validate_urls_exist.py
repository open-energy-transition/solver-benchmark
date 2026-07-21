#!/usr/bin/env python3
"""
Check that every instance URL in a metadata YAML file is reachable.

Collects the "URL" field from every entry in the "instances" map and issues
a concurrent HEAD (falling back to a ranged GET) request against each,
reporting any that don't resolve to a non-empty, successful response.
"""

from __future__ import annotations

import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Optional

import requests
import yaml

DEFAULT_WORKERS = 32  # good CI default; adjust if you hit throttling


@dataclass
class CheckResult:
    """Outcome of checking a single instance URL."""

    url: str
    ok: bool
    status: Optional[int]
    reason: str
    content_length: Optional[int] = None
    content_type: Optional[str] = None


def check_url(url: str, timeout_s: float = 60.0) -> CheckResult:
    """
    Check that a URL resolves to a non-empty, successful response.

    Parameters
    ----------
    url : str
        URL to check.
    timeout_s : float, optional
        Request timeout in seconds. Default is 60.

    Returns
    -------
    CheckResult
        Outcome of the check, including status code and content metadata
        when available.
    """
    # Create a short-lived session per thread for connection pooling within that thread.
    # (requests.Session is not guaranteed thread-safe when shared.)
    session = requests.Session()
    session.headers.update({"User-Agent": "gcs-url-check/1.0"})

    try:
        r = session.head(url, allow_redirects=True, timeout=timeout_s)
    except requests.RequestException as e:
        return CheckResult(url=url, ok=False, status=None, reason=f"request error: {e}")

    # Fallback if HEAD is not supported / flaky
    if r.status_code in (405, 501) or (r.status_code >= 500):
        try:
            r = session.get(
                url,
                headers={"Range": "bytes=0-0"},
                stream=True,
                allow_redirects=True,
                timeout=timeout_s,
            )
        except requests.RequestException as e:
            return CheckResult(
                url=url, ok=False, status=None, reason=f"range-get error: {e}"
            )

    status = r.status_code
    if status not in (200, 206):
        return CheckResult(url=url, ok=False, status=status, reason=f"HTTP {status}")

    cl = r.headers.get("Content-Length")
    ct = r.headers.get("Content-Type")
    content_length = int(cl) if cl and cl.isdigit() else None

    # Optional sanity check (can remove if you have zero-byte markers you want to allow)
    if content_length == 0:
        return CheckResult(
            url=url,
            ok=False,
            status=status,
            reason="Content-Length is 0",
            content_length=0,
            content_type=ct,
        )

    return CheckResult(
        url=url,
        ok=True,
        status=status,
        reason="OK",
        content_length=content_length,
        content_type=ct,
    )


def collect_urls(data: dict) -> list[str]:
    """
    Collect the unique instance URLs from parsed metadata YAML content.

    Parameters
    ----------
    data : dict
        Parsed content of a metadata YAML file (must contain an
        "instances" map).

    Returns
    -------
    list[str]
        Sorted, de-duplicated list of URLs.
    """
    return sorted({b["URL"] for b in data["instances"].values() if b.get("URL")})


def main(argv: Optional[list[str]] = None) -> int:
    """
    CLI entry point: check every instance URL in a metadata YAML file.

    Parameters
    ----------
    argv : list[str], optional
        Command-line arguments. Defaults to sys.argv[1:].

    Returns
    -------
    int
        Exit code: 0 if all URLs validated, 1 if any failed, 2 on usage error.
    """
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) < 1:
        print(f"Usage: {sys.argv[0]} <file.yaml> [max_workers]", file=sys.stderr)
        return 2

    path = argv[0]
    max_workers = int(argv[1]) if len(argv) >= 2 else DEFAULT_WORKERS

    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    urls = collect_urls(data)
    if not urls:
        print("No URLs found in yaml file.")
        return 0

    print(f"Found {len(urls)} URL(s). Checking with {max_workers} worker(s)...")

    results: list[CheckResult] = []
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {ex.submit(check_url, url): url for url in urls}
        for fut in as_completed(futures):
            results.append(fut.result())

    # Stable output order for CI readability
    results.sort(key=lambda r: r.url)

    failures = [r for r in results if not r.ok]
    for r in results:
        if r.ok:
            print(
                f"✅ {r.url}  (status={r.status}, len={r.content_length}, type={r.content_type})"
            )
        else:
            print(f"❌ {r.url}  ({r.reason})")

    if failures:
        print(
            f"\nFAILED: {len(failures)}/{len(urls)} URL(s) did not validate.",
            file=sys.stderr,
        )
        # Helpful non-zero exit for CI
        return 1

    print(f"\nOK: {len(urls)} URL(s) validated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
