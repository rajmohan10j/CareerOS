from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
from json import JSONDecodeError


DATA_DIR = Path(__file__).resolve().parents[2] / "data"
STORE_PATH = DATA_DIR / "application_sessions.json"
CANONICAL_RESUME_PATH = (
    Path(__file__).resolve().parents[3]
    / "reference-data"
    / "canonical"
    / "Raj-CV.canonical.json"
)


def load_canonical_resume() -> dict:
    if not CANONICAL_RESUME_PATH.exists():
        return {
            "profile": {},
            "experience": [],
            "education": [],
            "languages": [],
            "static_answers": {},
            "knowledge_bank": {"field_observations": []},
        }
    try:
        return json.loads(CANONICAL_RESUME_PATH.read_text(encoding="utf-8"))
    except JSONDecodeError:
        return {
            "profile": {},
            "experience": [],
            "education": [],
            "languages": [],
            "static_answers": {},
            "knowledge_bank": {"field_observations": []},
        }


def save_canonical_resume(data: dict) -> dict:
    CANONICAL_RESUME_PATH.parent.mkdir(parents=True, exist_ok=True)
    CANONICAL_RESUME_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return data


def record_field_observations(payload: dict) -> dict:
    canonical = load_canonical_resume()
    bank = canonical.setdefault("knowledge_bank", {})
    observations = bank.setdefault("field_observations", [])
    observed_at = _now()
    page_url = payload.get("url")
    page_title = payload.get("title")

    existing_keys = {
        (
            item.get("url"),
            item.get("field_key"),
            item.get("label"),
            item.get("intent"),
        )
        for item in observations
    }

    for field in payload.get("fields", []):
        record = {
            "url": page_url,
            "page_title": page_title,
            "field_key": field.get("fieldKey"),
            "label": field.get("label"),
            "intent": field.get("intent"),
            "field_type": field.get("fieldType"),
            "input_type": field.get("inputType"),
            "section_heading": field.get("sectionHeading"),
            "required": field.get("required"),
            "confidence": field.get("confidence"),
            "first_seen": observed_at,
            "last_seen": observed_at,
            "seen_count": 1,
        }
        key = (record["url"], record["field_key"], record["label"], record["intent"])
        if key in existing_keys:
            for item in observations:
                item_key = (item.get("url"), item.get("field_key"), item.get("label"), item.get("intent"))
                if item_key == key:
                    item["last_seen"] = observed_at
                    item["seen_count"] = int(item.get("seen_count", 1)) + 1
                    item["confidence"] = record["confidence"]
                    break
        else:
            observations.append(record)
            existing_keys.add(key)

    bank["updated_at"] = observed_at
    save_canonical_resume(canonical)
    return {"saved": len(payload.get("fields", [])), "knowledge_bank": bank}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _session_id(url: str) -> str:
    return hashlib.sha1(url.strip().lower().encode("utf-8")).hexdigest()[:16]


def _empty_progress() -> dict:
    canonical = load_canonical_resume()
    return {
        "experience": {"filled": [], "skipped": [], "total": len(canonical.get("experience", []))},
        "education": {"filled": [], "skipped": [], "total": len(canonical.get("education", []))},
    }


def _load() -> dict:
    if not STORE_PATH.exists():
        return {"sessions": []}
    try:
        return json.loads(STORE_PATH.read_text(encoding="utf-8"))
    except JSONDecodeError:
        return {"sessions": []}


def _save(data: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    STORE_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def list_sessions() -> list[dict]:
    data = _load()
    return sorted(data.get("sessions", []), key=lambda s: s.get("updated_at", ""), reverse=True)


def ensure_session(payload) -> dict:
    data = _load()
    sessions = data.setdefault("sessions", [])
    sid = _session_id(payload.url)
    session = next((s for s in sessions if s["id"] == sid), None)
    if session is None:
        session = {
            "id": sid,
            "url": payload.url,
            "page_title": payload.page_title,
            "job_title": payload.job_title,
            "company": payload.company,
            "status": "in_progress",
            "progress": _empty_progress(),
            "created_at": _now(),
            "updated_at": _now(),
        }
        sessions.append(session)
    else:
        session["page_title"] = payload.page_title or session.get("page_title")
        session["job_title"] = payload.job_title or session.get("job_title")
        session["company"] = payload.company or session.get("company")
        canonical_progress = _empty_progress()
        progress = session.setdefault("progress", canonical_progress)
        for section, section_progress in canonical_progress.items():
            existing = progress.setdefault(section, section_progress)
            existing["total"] = section_progress["total"]
        session["updated_at"] = _now()
    _save(data)
    return session


def get_next_entry(url: str, section: str) -> dict | None:
    data = _load()
    sid = _session_id(url)
    session = next((s for s in data.get("sessions", []) if s["id"] == sid), None)
    if session is None:
        return None
    records = load_canonical_resume().get(section, [])
    progress = session.get("progress", {}).get(section, {})
    used = set(progress.get("filled", [])) | set(progress.get("skipped", []))
    next_index = next((i for i in range(len(records)) if i not in used), None)
    if next_index is None:
        return {"session": session, "section": section, "complete": True, "index": None, "entry": None}
    return {"session": session, "section": section, "complete": False, "index": next_index, "entry": records[next_index]}


def mark_entry(url: str, section: str, index: int, status: str = "filled", notes: str | None = None) -> dict | None:
    data = _load()
    sid = _session_id(url)
    session = next((s for s in data.get("sessions", []) if s["id"] == sid), None)
    if session is None:
        return None
    section_progress = session.setdefault("progress", _empty_progress()).setdefault(section, {"filled": [], "skipped": [], "total": 0})
    target = "skipped" if status == "skipped" else "filled"
    other = "filled" if target == "skipped" else "skipped"
    if index not in section_progress[target]:
        section_progress[target].append(index)
    if index in section_progress.get(other, []):
        section_progress[other] = [i for i in section_progress[other] if i != index]
    if notes:
        session.setdefault("notes", []).append({"section": section, "index": index, "status": status, "notes": notes, "at": _now()})
    session["updated_at"] = _now()
    _save(data)
    return session
