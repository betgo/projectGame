#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import pathlib
import re
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[2]
LOG_DIR = ROOT / "docs" / "ai" / "commit-log"
OUT_FILE = ROOT / "docs" / "ai" / "weekly-summary.md"

ENTRY_RE = re.compile(r"^## (\d{4}-\d{2}-\d{2}) - (.+) \(`([0-9a-f]+)`\)$")


def normalize_inline_value(value: str) -> str:
    cleaned = value.strip()
    if cleaned.startswith("-"):
        cleaned = cleaned[1:].strip()
    return cleaned


def parse_entries() -> list[dict]:
    entries: list[dict] = []
    for path in sorted(LOG_DIR.glob("*.md")):
        lines = path.read_text(encoding="utf-8").splitlines()
        current: dict | None = None
        for line in lines:
            match = ENTRY_RE.match(line.strip())
            if match:
                if current:
                    entries.append(current)
                date_str, subject, sha = match.groups()
                current = {
                    "date": dt.date.fromisoformat(date_str),
                    "subject": subject,
                    "sha": sha,
                    "prompt_refs": [],
                    "risk": [],
                }
                continue
            if not current:
                continue
            stripped = line.strip()
            if stripped.startswith("- Prompt-Refs:"):
                refs = stripped.split(":", 1)[1].strip()
                current["prompt_refs"] = [r.strip() for r in refs.split(",") if r.strip()]
            elif stripped.startswith("- Risk:"):
                risk_text = normalize_inline_value(stripped.split(":", 1)[1])
                if risk_text and risk_text != "N/A":
                    current["risk"].append(risk_text)
        if current:
            entries.append(current)
    return entries


def build_summary(entries: list[dict]) -> str:
    weeks: dict[str, list[dict]] = defaultdict(list)
    for entry in entries:
        iso_year, iso_week, _ = entry["date"].isocalendar()
        week_key = f"{iso_year}-W{iso_week:02d}"
        weeks[week_key].append(entry)

    lines = [
        "# Weekly Summary",
        "",
        "Generated from `docs/ai/commit-log/*.md`.",
        "",
    ]

    if not weeks:
        lines.append("No commit summaries available.")
        lines.append("")
        return "\n".join(lines)

    for week_key in sorted(weeks.keys(), reverse=True):
        week_entries = sorted(weeks[week_key], key=lambda x: x["date"], reverse=True)
        prompt_refs = sorted(
            {ref for entry in week_entries for ref in entry.get("prompt_refs", [])}
        )
        risks = [risk for entry in week_entries for risk in entry.get("risk", [])]

        lines.extend(
            [
                f"## {week_key}",
                "",
                f"- Total commits tracked: {len(week_entries)}",
                "- Key changes:",
            ]
        )
        for entry in week_entries:
            lines.append(f"  - {entry['subject']}")
        lines.append("- Prompt refs:")
        if prompt_refs:
            for ref in prompt_refs:
                lines.append(f"  - {ref}")
        else:
            lines.append("  - N/A")
        lines.append("- Carry-over risks:")
        if risks:
            for risk in sorted(set(risks)):
                lines.append(f"  - {risk}")
        else:
            lines.append("  - None")
        lines.append("")

    return "\n".join(lines)


def main() -> None:
    entries = parse_entries()
    output = build_summary(entries)
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(output, encoding="utf-8")
    print(f"Rendered weekly summary: {OUT_FILE}")


if __name__ == "__main__":
    main()
