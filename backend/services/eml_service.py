"""MIME and RFC 822 Email / .EML Parser."""
from __future__ import annotations

import email
from email import policy
from email.message import EmailMessage
import re
from typing import Any


_URL_REGEX = re.compile(
    r"(?:https?://|www\.)[a-zA-Z0-9\-\._~:/\?#\[\]@!$&'\(\)\*\+,;=%]+",
    re.IGNORECASE
)


class ParsedEmailData:
    def __init__(self):
        self.headers: dict[str, str] = {}
        self.received_headers: list[str] = []
        self.subject: str = ""
        self.sender: str = ""
        self.from_display_name: str = ""
        self.from_email: str = ""
        self.to: str = ""
        self.cc: str = ""
        self.reply_to: str = ""
        self.return_path: str = ""
        self.date: str = ""
        self.message_id: str = ""
        self.body_plain: str = ""
        self.body_html: str = ""
        self.extracted_urls: list[str] = []
        self.attachments: list[dict[str, Any]] = []


def parse_email_bytes_or_text(content: bytes | str) -> ParsedEmailData:
    """Parse raw email string or .eml bytes into structured representation."""
    parsed = ParsedEmailData()
    
    if isinstance(content, bytes):
        msg = email.message_from_bytes(content, policy=policy.default)
    else:
        msg = email.message_from_string(content, policy=policy.default)

    # Extract all standard headers
    for key, value in msg.items():
        if key.lower() == "received":
            parsed.received_headers.append(str(value).strip())
        else:
            if key not in parsed.headers:
                parsed.headers[key] = str(value).strip()

    parsed.subject = str(msg.get("Subject", "")).strip()
    parsed.sender = str(msg.get("From", "")).strip()
    parsed.to = str(msg.get("To", "")).strip()
    parsed.cc = str(msg.get("Cc", "")).strip()
    parsed.reply_to = str(msg.get("Reply-To", "")).strip()
    parsed.return_path = str(msg.get("Return-Path", "")).strip()
    parsed.date = str(msg.get("Date", "")).strip()
    parsed.message_id = str(msg.get("Message-ID", "")).strip()

    # Parse display name and email address from From
    from_match = re.search(r'(?:"?([^"<]+)"?\s*)?<?([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)>?', parsed.sender)
    if from_match:
        parsed.from_display_name = (from_match.group(1) or "").strip()
        parsed.from_email = (from_match.group(2) or "").strip().lower()
    else:
        parsed.from_email = parsed.sender.lower()

    # Extract bodies and attachments
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))
            
            if "attachment" in content_disposition.lower():
                filename = part.get_filename() or "unnamed_attachment"
                payload = part.get_payload(decode=True)
                size_bytes = len(payload) if payload else 0
                parsed.attachments.append({
                    "filename": filename,
                    "content_type": content_type,
                    "size_bytes": size_bytes,
                    "is_executable": filename.lower().endswith(('.exe', '.bat', '.vbs', '.js', '.scr', '.ps1', '.iso', '.zip', '.rar')),
                })
            else:
                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or "utf-8"
                        text = payload.decode(charset, errors="replace")
                        if content_type == "text/plain":
                            parsed.body_plain += "\n" + text
                        elif content_type == "text/html":
                            parsed.body_html += "\n" + text
                except Exception:
                    pass
    else:
        try:
            payload = msg.get_payload(decode=True)
            if payload:
                charset = msg.get_content_charset() or "utf-8"
                text = payload.decode(charset, errors="replace")
                if msg.get_content_type() == "text/html":
                    parsed.body_html = text
                else:
                    parsed.body_plain = text
            else:
                parsed.body_plain = str(msg.get_payload() or "")
        except Exception:
            parsed.body_plain = str(msg.get_payload() or "")

    # Extract unique URLs from plain text and html
    full_text = f"{parsed.subject}\n{parsed.body_plain}\n{parsed.body_html}"
    raw_urls = _URL_REGEX.findall(full_text)
    
    seen = set()
    for u in raw_urls:
        clean_u = u.rstrip(".,;:\"'>)]}")
        if not clean_u.startswith("http"):
            clean_u = "http://" + clean_u
        if clean_u not in seen:
            seen.add(clean_u)
            parsed.extracted_urls.append(clean_u)

    return parsed
