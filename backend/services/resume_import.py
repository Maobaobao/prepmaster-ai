import re
from datetime import datetime
from typing import Dict, List, Tuple, Optional

def _to_date(v: Optional[str]) -> Optional[datetime.date]:
    if not v:
        return None
    v = v.strip()
    # Accept formats: YYYY, YYYY-MM, MMM YYYY
    for fmt in ["%Y-%m-%d", "%Y-%m", "%b %Y", "%B %Y", "%Y"]:
        try:
            dt = datetime.strptime(v, fmt)
            # Normalize to first day of month if month missing
            return dt.date().replace(day=1)
        except Exception:
            continue
    return None

def _parse_date_range(line: str) -> Tuple[Optional[datetime.date], Optional[datetime.date], bool]:
    # Match variations like: Jan 2020 - Present | 2021–2024 | 2020 — 2022
    m = re.search(r"([A-Za-z]{3,9}\s\d{4}|\d{4}(?:-\d{2})?)\s*[–—-]\s*(Present|[A-Za-z]{3,9}\s\d{4}|\d{4}(?:-\d{2})?)", line)
    if not m:
        return None, None, False
    start = _to_date(m.group(1))
    end_token = m.group(2)
    current = end_token.lower() == "present"
    end = None if current else _to_date(end_token)
    return start, end, current

def extract_sections(text: str) -> Dict[str, str]:
    sections: Dict[str, str] = {}
    # Find heading lines at line starts, case-insensitive
    pattern = re.compile(r"(?im)^(Experience|Work Experience|Employment|Education|Certifications|Certificates|Projects|Achievements|Awards)\s*$")
    matches = list(pattern.finditer(text))
    if not matches:
        return sections
    for i, m in enumerate(matches):
        key = m.group(1)
        start_idx = m.end()
        end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = text[start_idx:end_idx].strip()
        sections[key] = content
    return sections

def parse_experience(section_text: str) -> List[dict]:
    items = []
    blocks = [b.strip() for b in re.split(r"\n\s*\n", section_text) if b.strip()]
    for b in blocks:
        lines = [l.strip() for l in b.splitlines() if l.strip()]
        if not lines:
            continue
        title = lines[0]
        company = None
        if len(lines) > 1:
            company = lines[1]
        start, end, current = _parse_date_range(b)
        # Location: try last line if looks like a city
        location = None
        if lines:
            last = lines[-1]
            if re.search(r"[A-Za-z]+,\s*[A-Za-z]+", last):
                location = last
        description = "\n".join(lines[2:]) if len(lines) > 2 else None
        items.append({
            'title': title,
            'company': company,
            'startDate': start.isoformat() if start else None,
            'endDate': end.isoformat() if end else None,
            'current': current,
            'location': location,
            'description': description,
            'skills': None
        })
    return items

def parse_education(section_text: str) -> List[dict]:
    items = []
    blocks = [b.strip() for b in re.split(r"\n\s*\n", section_text) if b.strip()]
    for b in blocks:
        lines = [l.strip() for l in b.splitlines() if l.strip()]
        if not lines:
            continue
        school = lines[0]
        degree = lines[1] if len(lines) > 1 else None
        field = None
        if degree and (" in " in degree.lower()):
            parts = degree.split(" in ", 1)
            degree, field = parts[0], parts[1]
        start, end, _ = _parse_date_range(b)
        desc = "\n".join(lines[2:]) if len(lines) > 2 else None
        items.append({
            'school': school,
            'degree': degree,
            'fieldOfStudy': field,
            'startDate': start.isoformat() if start else None,
            'endDate': end.isoformat() if end else None,
            'grade': None,
            'activities': None,
            'description': desc
        })
    return items

def parse_text(text: str) -> Dict[str, List[dict]]:
    sections = extract_sections(text)
    out = {
        'career': [],
        'education': [],
        'achievements': [],
        'certificates': [],
        'projects': []
    }
    for key, content in sections.items():
        lk = key.lower()
        if 'experience' in lk or 'employment' in lk:
            out['career'].extend(parse_experience(content))
        elif 'education' in lk:
            out['education'].extend(parse_education(content))
        elif 'project' in lk:
            # Simple project parse: name line then description
            blocks = [b.strip() for b in re.split(r"\n\s*\n", content) if b.strip()]
            for b in blocks:
                lines = b.splitlines()
                name = lines[0].strip()
                desc = "\n".join([l.strip() for l in lines[1:]]) if len(lines) > 1 else None
                out['projects'].append({'name': name, 'description': desc, 'role': None, 'startDate': None, 'endDate': None, 'url': None, 'skills': None})
        elif 'cert' in lk:
            blocks = [b.strip() for b in re.split(r"\n\s*\n", content) if b.strip()]
            for b in blocks:
                lines = b.splitlines()
                name = lines[0].strip()
                out['certificates'].append({'name': name, 'authority': None, 'licenseNumber': None, 'issueDate': None, 'expirationDate': None, 'url': None, 'description': None})
        elif 'achiev' in lk or 'award' in lk:
            blocks = [b.strip() for b in re.split(r"\n\s*\n", content) if b.strip()]
            for b in blocks:
                lines = b.splitlines()
                title = lines[0].strip()
                out['achievements'].append({'title': title, 'issuer': None, 'issueDate': None, 'url': None, 'description': None})
    return out
    
    # Fallback heuristics if nothing parsed
    if not out['career']:
        m = re.search(r"(?im)^(Experience|Work Experience|Employment)\s*(.*?)^(Education|$)", text, re.DOTALL)
        if m:
            block = m.group(2).strip()
            lines = [l.strip() for l in block.splitlines() if l.strip()]
            start, end, current = _parse_date_range(block)
            if lines:
                out['career'].append({
                    'title': lines[0],
                    'company': lines[1] if len(lines) > 1 else None,
                    'startDate': start.isoformat() if start else None,
                    'endDate': end.isoformat() if end else None,
                    'current': current,
                    'location': None,
                    'description': "\n".join(lines[2:]) if len(lines) > 2 else None,
                    'skills': None,
                })
    if not out['education']:
        m = re.search(r"(?im)^(Education)\s*(.*)$", text, re.DOTALL)
        if m:
            block = m.group(2).strip()
            lines = [l.strip() for l in block.splitlines() if l.strip()]
            start, end, _ = _parse_date_range(block)
            if lines:
                out['education'].append({
                    'school': lines[0],
                    'degree': lines[1] if len(lines) > 1 else None,
                    'fieldOfStudy': None,
                    'startDate': start.isoformat() if start else None,
                    'endDate': end.isoformat() if end else None,
                    'grade': None,
                    'activities': None,
                    'description': "\n".join(lines[2:]) if len(lines) > 2 else None,
                })
    return out

def parse_pdf_bytes(pdf_bytes: bytes) -> Dict[str, List[dict]]:
    from pypdf import PdfReader
    import io
    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    return parse_text(text)

def parse_docx_bytes(docx_bytes: bytes) -> Dict[str, List[dict]]:
    from docx import Document
    import io
    doc = Document(io.BytesIO(docx_bytes))
    text = "\n".join(p.text for p in doc.paragraphs)
    return parse_text(text)

def parse_linkedin_url(url: str) -> Dict[str, List[dict]]:
    # Basic fetch and text extract; for ToS compliance, prefer user-exported resume PDF.
    import requests
    from bs4 import BeautifulSoup
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'html.parser')
    text = soup.get_text(separator='\n')
    return parse_text(text)

