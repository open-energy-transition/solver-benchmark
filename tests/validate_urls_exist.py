#!/usr/bin/env python3
from __future__ import annotations

import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any, Iterable

import requests
import yaml

DEFAULT_WORKERS = 32  # good CI default; adjust if you hit throttling


@dataclass
class CheckResult:
    url: str
    ok: bool
    status: int | None
    reason: str
    content_length: int | None = None
    content_type: str | None = None


def iter_strings(obj: Any) -> Iterable[str]:
    """Yield all string leaves from nested dict/list structures."""
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from iter_strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from iter_strings(v)


def check_url(url: str, timeout_s: float = 10.0) -> CheckResult:
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


def main() -> int:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <file.yaml> [max_workers]", file=sys.stderr)
        return 2

    path = sys.argv[1]
    max_workers = int(sys.argv[2]) if len(sys.argv) >= 3 else DEFAULT_WORKERS

    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    urls = sorted({s["URL"] for _, b in data["benchmarks"].items() for s in b["Sizes"]})
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
