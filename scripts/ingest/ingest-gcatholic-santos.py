#!/usr/bin/env python3
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import hashlib
import html
import json
import os
import re
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urldefrag, urljoin, urlparse
from urllib.request import Request, urlopen


GCATHOLIC_BASE = "https://gcatholic.org"
USER_AGENT = "Mozilla/5.0 (compatible; VeritasDei GCatholic importer/1.0)"
NAME_INDEXES = [chr(code) for code in range(ord("A"), ord("Z") + 1)] + ["others"]

ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_WORKDIR = ROOT_DIR / "tmp" / "gcatholic_santos"

PUNCTUATION_NORMALIZATION = str.maketrans(
    {
        "’": "'",
        "‘": "'",
        "ʼ": "'",
        "‛": "'",
        "“": '"',
        "”": '"',
        "–": "-",
        "—": "-",
    }
)

COUNTRY_PT_MAP = {
    "Albania": "Albânia",
    "Algeria": "Argélia",
    "Argentina": "Argentina",
    "Armenia": "Armênia",
    "Australia": "Austrália",
    "Austria": "Áustria",
    "Belarus": "Bielorrússia",
    "Belgium": "Bélgica",
    "Bosnia and Herzegovina": "Bósnia e Herzegovina",
    "Brazil": "Brasil",
    "Bulgaria": "Bulgária",
    "Canada": "Canadá",
    "Chile": "Chile",
    "China": "China",
    "Colombia": "Colômbia",
    "Congo-Kinshasa": "República Democrática do Congo",
    "Croatia": "Croácia",
    "Cuba": "Cuba",
    "Cyprus": "Chipre",
    "Czechia": "Tchéquia",
    "Denmark": "Dinamarca",
    "Dominican Republic": "República Dominicana",
    "Ecuador": "Equador",
    "Egypt": "Egito",
    "El Salvador": "El Salvador",
    "England": "Inglaterra",
    "Eritrea": "Eritreia",
    "Estonia": "Estônia",
    "Ethiopia": "Etiópia",
    "Finland": "Finlândia",
    "France": "França",
    "Georgia": "Geórgia",
    "Germany": "Alemanha",
    "Greece": "Grécia",
    "Guam": "Guam",
    "Guatemala": "Guatemala",
    "Guernsey": "Guernsey",
    "Haiti": "Haiti",
    "Hong Kong": "Hong Kong",
    "Hungary": "Hungria",
    "Iceland": "Islândia",
    "India": "Índia",
    "Indonesia": "Indonésia",
    "Iran": "Irã",
    "Iraq": "Iraque",
    "Ireland": "Irlanda",
    "Isle of Man": "Ilha de Man",
    "Israel": "Israel",
    "Italy": "Itália",
    "Japan": "Japão",
    "Jersey": "Jersey",
    "Jordan": "Jordânia",
    "Kazakhstan": "Cazaquistão",
    "Kenya": "Quênia",
    "Kosovo": "Kosovo",
    "Laos": "Laos",
    "Latvia": "Letônia",
    "Lebanon": "Líbano",
    "Lesotho": "Lesoto",
    "Libya": "Líbia",
    "Lithuania": "Lituânia",
    "Luxembourg": "Luxemburgo",
    "Madagascar": "Madagascar",
    "Malta": "Malta",
    "Mauritius": "Maurício",
    "Mexico": "México",
    "Montenegro": "Montenegro",
    "Morocco": "Marrocos",
    "Myanmar": "Mianmar",
    "Netherlands": "Países Baixos",
    "Nicaragua": "Nicarágua",
    "Nigeria": "Nigéria",
    "North Korea": "Coreia do Norte",
    "North Macedonia": "Macedônia do Norte",
    "Northern Ireland": "Irlanda do Norte",
    "Norway": "Noruega",
    "Palestine": "Palestina",
    "Papua New Guinea": "Papua-Nova Guiné",
    "Paraguay": "Paraguai",
    "Peru": "Peru",
    "Philippines": "Filipinas",
    "Poland": "Polônia",
    "Portugal": "Portugal",
    "Puerto Rico": "Porto Rico",
    "Qatar": "Catar",
    "Romania": "Romênia",
    "Russia": "Rússia",
    "Réunion": "Reunião",
    "San Marino": "San Marino",
    "Saudi Arabia": "Arábia Saudita",
    "Scotland": "Escócia",
    "Serbia": "Sérvia",
    "Slovakia": "Eslováquia",
    "Slovenia": "Eslovênia",
    "Somalia": "Somália",
    "South Africa": "África do Sul",
    "South Korea": "Coreia do Sul",
    "Spain": "Espanha",
    "Sri Lanka": "Sri Lanka",
    "Sudan": "Sudão",
    "Suriname": "Suriname",
    "Sweden": "Suécia",
    "Switzerland": "Suíça",
    "Syria": "Síria",
    "Thailand": "Tailândia",
    "Tunisia": "Tunísia",
    "Turkiye": "Turquia",
    "USA": "Estados Unidos",
    "Uganda": "Uganda",
    "Ukraine": "Ucrânia",
    "Uruguay": "Uruguai",
    "Vatican City State": "Estado da Cidade do Vaticano",
    "Venezuela": "Venezuela",
    "Vietnam": "Vietnã",
    "Wales": "País de Gales",
    "Wallis and Futuna": "Wallis e Futuna",
}

TITLE_PREFIX_PT_MAP = {
    "Archbishop": "Arcebispo",
    "Bishop": "Bispo",
    "Pope": "Papa",
    "Abbot": "Abade",
    "Brother": "Irmão",
    "Sister": "Irmã",
    "Father": "Padre",
    "Mother": "Madre",
    "King": "Rei",
    "Queen": "Rainha",
    "Emperor": "Imperador",
    "Empress": "Imperatriz",
    "Prince": "Príncipe",
    "Princess": "Princesa",
    "Count": "Conde",
    "Duke": "Duque",
}

RITE_LABEL_PT_MAP = {
    "Maronite Rite": "Rito Maronita",
    "Armenian Rite": "Rito Armênio",
    "Ukrainian Rite": "Rito Ucraniano",
    "Romanian Rite": "Rito Romeno",
    "Syro-Malabar Rite": "Rito Siro-Malabar",
    "Greek Rite": "Rito Grego",
    "Chaldean Rite": "Rito Caldeu",
    "Syriac Rite": "Rito Siríaco",
    "Ethiopic Rite": "Rito Etíope",
    "Italo-Albanese Rite": "Rito Ítalo-Albanês",
    "Slovak Rite": "Rito Eslovaco",
    "Ruthenian Rite": "Rito Ruteno",
    "later Archbishop": "depois Arcebispo",
    "later Patriarch": "depois Patriarca",
}

COMMON_NAME_PREFIX_PT_MAP = {
    "John Paul": "João Paulo",
    "John Baptist": "João Batista",
    "Aaron": "Arão",
    "Alexander": "Alexandre",
    "Alexius": "Aleixo",
    "Andrew": "André",
    "Anthony": "Antônio",
    "Augustine": "Agostinho",
    "Basil": "Basílio",
    "Benedict": "Bento",
    "Bernard": "Bernardo",
    "Catherine": "Catarina",
    "Charles": "Carlos",
    "Clare": "Clara",
    "Clement": "Clemente",
    "Dominic": "Domingos",
    "Felix": "Félix",
    "Francis": "Francisco",
    "George": "Jorge",
    "Gregory": "Gregório",
    "Helen": "Helena",
    "Ignatius": "Inácio",
    "Innocent": "Inocêncio",
    "James": "Tiago",
    "Jerome": "Jerônimo",
    "John": "João",
    "Joseph": "José",
    "Lawrence": "Lourenço",
    "Leo": "Leão",
    "Louis": "Luís",
    "Luke": "Lucas",
    "Margaret": "Margarida",
    "Mark": "Marcos",
    "Martin": "Martinho",
    "Mary": "Maria",
    "Matthew": "Mateus",
    "Michael": "Miguel",
    "Monica": "Mônica",
    "Nicholas": "Nicolau",
    "Paul": "Paulo",
    "Peter": "Pedro",
    "Philip": "Filipe",
    "Pius": "Pio",
    "Raphael": "Rafael",
    "Rose": "Rosa",
    "Stephen": "Estêvão",
    "Thomas": "Tomás",
    "Urban": "Urbano",
    "Vincent": "Vicente",
}

ROW_START_RE = re.compile(r'<tr id="([^"]+)"><td>', re.IGNORECASE)
TAG_RE = re.compile(r"<(/?)(table|tr)\b[^>]*>", re.IGNORECASE)
FIELD_RE = re.compile(
    r'<tr><td class="pd1">([^<]+):</td><td class="pd2">([\s\S]*?)</td></tr>',
    re.IGNORECASE,
)
HREF_RE = re.compile(r'href="([^"]+)"', re.IGNORECASE)
NAME_LINK_RE = re.compile(r'<a href="([^"]+)" class="[^"]*"[^>]*>(.*?)</a>', re.IGNORECASE | re.DOTALL)


def log(message: str) -> None:
    print(message, flush=True)


def utc_now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_json(path: Path, payload: Any) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_ndjson(path: Path, records: list[dict[str, Any]]) -> None:
    ensure_dir(path.parent)
    with path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False, sort_keys=False))
            handle.write("\n")


def read_ndjson(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def dedupe_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        value = value.strip()
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def dedupe_dicts(values: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for value in values:
        key = json.dumps(value, ensure_ascii=False, sort_keys=True)
        if key in seen:
            continue
        seen.add(key)
        result.append(value)
    return result


def cache_path_for_url(cache_dir: Path, url: str) -> Path:
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()
    filename = Path(urlparse(url).path).name or "index"
    return cache_dir / f"{filename}_{digest}.html"


def fetch_text(url: str, cache_dir: Path, *, force: bool = False, sleep_ms: int = 0) -> str:
    ensure_dir(cache_dir)
    cache_path = cache_path_for_url(cache_dir, url)
    if cache_path.exists() and not force:
        return cache_path.read_text(encoding="utf-8")

    if sleep_ms > 0:
        time.sleep(sleep_ms / 1000.0)

    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
        },
    )

    last_error: Exception | None = None
    for attempt in range(1, 4):
        try:
            with urlopen(request, timeout=60) as response:
                text = response.read().decode("utf-8", "ignore")
            cache_path.write_text(text, encoding="utf-8")
            return text
        except (HTTPError, URLError, TimeoutError, OSError) as exc:
            last_error = exc
            if attempt == 3:
                break
            time.sleep(attempt * 1.5)

    raise RuntimeError(f"Falha ao buscar {url}: {last_error}") from last_error


def clean_text_fragment(fragment: str, *, join_lines: bool = False) -> str:
    text = fragment
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</li\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<li[^>]*>", "\n- ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).replace("\xa0", " ")
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
    return (" ".join(lines) if join_lines else "\n".join(lines)).strip()


def normalize_alias(text: str) -> str:
    value = clean_text_fragment(text, join_lines=True)
    value = re.sub(r"\s+\(([^)]*)\)\s*$", "", value).strip()
    return value


def normalize_display_text(text: str | None) -> str | None:
    if text is None:
        return None
    normalized = text.translate(PUNCTUATION_NORMALIZATION)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized or None


def translate_country_to_pt(country: str | None) -> str | None:
    normalized = normalize_display_text(country)
    if not normalized:
        return None
    return COUNTRY_PT_MAP.get(normalized, normalized)


def localize_parenthetical_segments(value: str) -> str:
    def replace(match: re.Match[str]) -> str:
        inner = normalize_display_text(match.group(1)) or match.group(1).strip()
        localized = RITE_LABEL_PT_MAP.get(inner, inner)
        return f"({localized})"

    return re.sub(r"\(([^)]+)\)", replace, value)


def localize_name_prefix(value: str) -> str:
    for source, target in sorted(COMMON_NAME_PREFIX_PT_MAP.items(), key=lambda item: len(item[0]), reverse=True):
        if value == source:
            return target
        for separator in (" ", ",", "-", "(", "/"):
            prefix = f"{source}{separator}"
            if value.startswith(prefix):
                return f"{target}{value[len(source):]}"
    return value


def localize_person_name(value: str | None, *, translate_titles: bool = True) -> str | None:
    normalized = normalize_display_text(value)
    if not normalized:
        return None

    localized = localize_parenthetical_segments(normalized)
    if translate_titles:
        for source_title, target_title in sorted(TITLE_PREFIX_PT_MAP.items(), key=lambda item: len(item[0]), reverse=True):
            prefix = f"{source_title} "
            if localized.startswith(prefix):
                remainder = localize_name_prefix(localized[len(prefix) :])
                return f"{target_title} {remainder}"

    return localize_name_prefix(localized)


def localize_pope_name(value: str | None) -> str | None:
    normalized = normalize_display_text(value)
    if not normalized:
        return None
    if normalized.startswith("Pope "):
        return f"Papa {localize_name_prefix(normalized[len('Pope '):])}"
    return localize_person_name(normalized)


def localize_record(record: dict[str, Any]) -> dict[str, Any]:
    localized = dict(record)

    nome_origem = normalize_display_text(record.get("nome_origem") or record.get("nome"))
    nomes_alternativos_origem = dedupe_strings(
        [
            normalized
            for value in (record.get("nomes_alternativos_origem") or record.get("nomes_alternativos") or [])
            if (normalized := normalize_display_text(value))
        ]
    )
    nome_secular_origem = normalize_display_text(record.get("nome_secular_origem") or record.get("nome_secular"))
    pais_referencia_origem = normalize_display_text(record.get("pais_referencia_origem") or record.get("pais_referencia"))
    nascimento_pais_origem = normalize_display_text(record.get("nascimento_pais_origem") or record.get("nascimento_pais"))
    morte_pais_origem = normalize_display_text(record.get("morte_pais_origem") or record.get("morte_pais"))
    beatificacao_pais_origem = normalize_display_text(record.get("beatificacao_pais_origem") or record.get("beatificacao_pais"))
    canonizacao_pais_origem = normalize_display_text(record.get("canonizacao_pais_origem") or record.get("canonizacao_pais"))
    beatificado_por_origem = normalize_display_text(record.get("beatificado_por_origem") or record.get("beatificado_por"))
    canonizado_por_origem = normalize_display_text(record.get("canonizado_por_origem") or record.get("canonizado_por"))

    localized["nome_origem"] = nome_origem
    localized["nomes_alternativos_origem"] = nomes_alternativos_origem
    localized["nome_secular_origem"] = nome_secular_origem
    localized["pais_referencia_origem"] = pais_referencia_origem
    localized["nascimento_pais_origem"] = nascimento_pais_origem
    localized["morte_pais_origem"] = morte_pais_origem
    localized["beatificacao_pais_origem"] = beatificacao_pais_origem
    localized["canonizacao_pais_origem"] = canonizacao_pais_origem
    localized["beatificado_por_origem"] = beatificado_por_origem
    localized["canonizado_por_origem"] = canonizado_por_origem

    localized["nome"] = localize_person_name(nome_origem)
    localized["nomes_alternativos"] = dedupe_strings(
        [
            localized_value
            for value in nomes_alternativos_origem
            if (localized_value := localize_person_name(value))
        ]
    )
    localized["nome_secular"] = localize_person_name(nome_secular_origem, translate_titles=False)
    localized["pais_referencia"] = translate_country_to_pt(pais_referencia_origem)
    localized["nascimento_pais"] = translate_country_to_pt(nascimento_pais_origem)
    localized["morte_pais"] = translate_country_to_pt(morte_pais_origem)
    localized["beatificacao_pais"] = translate_country_to_pt(beatificacao_pais_origem)
    localized["canonizacao_pais"] = translate_country_to_pt(canonizacao_pais_origem)
    localized["beatificado_por"] = localize_pope_name(beatificado_por_origem)
    localized["canonizado_por"] = localize_pope_name(canonizado_por_origem)
    return localized


def classify_page_type(url: str) -> str:
    path = urlparse(url).path.strip("/")
    parts = path.split("/")
    prefix = "/".join(parts[:2]) if len(parts) >= 2 else path
    if prefix in {"saints/data", "dioceses/diocese", "dioceses/former", "hierarchy/data", "hierarchy/pope"}:
        return prefix
    raise ValueError(f"Tipo de pagina nao suportado para {url}")


def extract_page_header_country(page_html: str) -> str | None:
    heading_match = re.search(r'<h3><a [^>]*class="zcountry"[^>]*>(.*?)</a>', page_html, re.IGNORECASE | re.DOTALL)
    if heading_match:
        return clean_text_fragment(heading_match.group(1), join_lines=True) or None
    return None


def extract_flag_country(fragment_html: str) -> str | None:
    match = re.search(r'<img [^>]*alt="([^"]+)"[^>]*class="flag1?"', fragment_html, re.IGNORECASE)
    if not match:
        return None
    return clean_text_fragment(match.group(1), join_lines=True) or None


def extract_country_names(fragment_html: str) -> list[str]:
    values = [
        clean_text_fragment(country_html, join_lines=True)
        for country_html in re.findall(r'class="zcountry"[^>]*>(.*?)</a>', fragment_html, re.IGNORECASE | re.DOTALL)
    ]
    return dedupe_strings([value for value in values if value])


def build_manifest(workdir: Path, *, force: bool, sleep_ms: int) -> dict[str, Any]:
    cache_dir = workdir / "cache" / "name_indexes"
    manifest_path = workdir / "gcatholic-santos-manifest.json"

    targets: dict[str, dict[str, Any]] = {}
    count_by_page_type: Counter[str] = Counter()

    for index_name in NAME_INDEXES:
        url = f"{GCATHOLIC_BASE}/saints/data/name-{index_name}"
        html_text = fetch_text(url, cache_dir, force=force, sleep_ms=sleep_ms)
        section_match = re.search(
            r'<div align="center"><table width="90%">([\s\S]*?)</table></div>',
            html_text,
            re.IGNORECASE,
        )
        if not section_match:
            raise RuntimeError(f"Nao foi possivel localizar o conteudo principal do indice {url}")

        section_html = section_match.group(1)
        for href, inner_html in NAME_LINK_RE.findall(section_html):
            full_url = urljoin(url, href)
            clean_url, anchor_id = urldefrag(full_url)
            page_type = classify_page_type(clean_url)
            alias = clean_text_fragment(inner_html, join_lines=True)
            if not alias:
                continue

            target_key = f"{clean_url}#{anchor_id}" if anchor_id else clean_url
            target = targets.setdefault(
                target_key,
                {
                    "target_key": target_key,
                    "url": clean_url,
                    "anchor_id": anchor_id or None,
                    "page_type": page_type,
                    "aliases": [],
                    "index_pages": [],
                },
            )
            target["aliases"].append(alias)
            target["index_pages"].append(index_name)
            count_by_page_type[page_type] += 1

    records = sorted(targets.values(), key=lambda item: (item["url"], item["anchor_id"] or ""))
    for record in records:
        record["aliases"] = dedupe_strings(record["aliases"])
        record["index_pages"] = dedupe_strings(record["index_pages"])

    manifest = {
        "generated_at": utc_now_iso(),
        "total_targets": len(records),
        "total_pages": len({record["url"] for record in records}),
        "count_by_page_type": dict(count_by_page_type),
        "records": records,
    }
    save_json(manifest_path, manifest)
    log(f"Manifest salvo em {manifest_path} com {manifest['total_targets']} alvos unicos.")
    return manifest


def build_pontificate_map(workdir: Path, *, force: bool, sleep_ms: int) -> dict[str, str]:
    cache_dir = workdir / "cache" / "pontificates"
    mapping_path = workdir / "gcatholic-pontificates.json"

    mapping: dict[str, str] = {}
    for url in [f"{GCATHOLIC_BASE}/saints/", f"{GCATHOLIC_BASE}/saints/beati"]:
        html_text = fetch_text(url, cache_dir, force=force, sleep_ms=sleep_ms)
        for relative_href, pope_name in re.findall(
            r'href="((?:sancti|beati)-[^"#?]+)" class="prelP">([^<]+)</a>',
            html_text,
            re.IGNORECASE,
        ):
            mapping[urljoin(url, relative_href)] = clean_text_fragment(pope_name, join_lines=True)

    save_json(mapping_path, mapping)
    return mapping


def extract_row_blocks(page_html: str) -> dict[str, str]:
    rows: dict[str, str] = {}
    for match in ROW_START_RE.finditer(page_html):
        anchor_id = match.group(1)
        row_end = None
        nested_table_depth = 0
        for tag in TAG_RE.finditer(page_html, match.end()):
            is_closing = tag.group(1) == "/"
            tag_name = tag.group(2).lower()
            if tag_name == "table":
                nested_table_depth += -1 if is_closing else 1
                if nested_table_depth < 0:
                    nested_table_depth = 0
            elif tag_name == "tr" and is_closing and nested_table_depth == 0:
                row_end = tag.end()
                break
        if row_end is not None:
            rows[anchor_id] = page_html[match.start():row_end]
    return rows


def parse_date_value(value: str | None) -> str | None:
    if not value:
        return None
    candidate = value.strip()
    if re.fullmatch(r"\d{4}\.\d{2}\.\d{2}", candidate):
        return candidate.replace(".", "-")
    return None


def split_text_note(text: str | None) -> tuple[str | None, str | None]:
    if not text:
        return None, None
    stripped = text.strip()
    match = re.match(r"^(.*?)(?:\s*\((.+)\))?$", stripped)
    if not match:
        return stripped or None, None
    main = (match.group(1) or "").strip() or None
    note = (match.group(2) or "").strip() or None
    return main, note


def extract_location_country(note: str | None, country_names: list[str]) -> tuple[str | None, str | None]:
    if not note:
        return None, None

    working_note = re.sub(r"\s*†\s*[^,]+$", "", note).strip(" ,")
    if not working_note:
        return None, None

    lowered = working_note.lower()
    if lowered in {"equipollently", "no papal mandate"}:
        return None, None

    country = country_names[-1] if country_names else None
    if not country:
        return working_note, None

    if working_note == country:
        return None, country

    suffix = f", {country}"
    if working_note.endswith(suffix):
        location = working_note[: -len(suffix)].strip(" ,")
        return location or None, country

    if working_note.endswith(country):
        location = working_note[: -len(country)].strip(" ,")
        return location or None, country

    return working_note, country


def extract_pontiff_name(page_url: str, raw_html: str, pontificate_map: dict[str, str]) -> str | None:
    for href in HREF_RE.findall(raw_html):
        clean_href, _ = urldefrag(urljoin(page_url, href))
        pope_name = pontificate_map.get(clean_href)
        if pope_name:
            return pope_name
    return None


def build_event(raw_html: str | None, page_url: str, pontificate_map: dict[str, str]) -> dict[str, Any]:
    if not raw_html:
        return {"texto": None, "data": None, "local": None, "pais": None, "pontifice": None}

    text = clean_text_fragment(raw_html, join_lines=True) or None
    main, note = split_text_note(text)
    country_names = extract_country_names(raw_html)
    local, pais = extract_location_country(note, country_names)
    return {
        "texto": text,
        "data": parse_date_value(main),
        "local": local,
        "pais": pais,
        "pontifice": extract_pontiff_name(page_url, raw_html, pontificate_map),
    }


def extract_primary_name_and_aliases(name_html: str, aliases_from_index: list[str]) -> tuple[str, str, str | None, list[str], list[str]]:
    name_lines = [line for line in clean_text_fragment(name_html).splitlines() if line.strip()]
    if not name_lines:
        raise RuntimeError("Registro sem bloco de nome.")

    primary_line = re.sub(r"^\d+\.\s*", "", name_lines[0]).strip()
    if primary_line.startswith("Saint "):
        title = "Saint"
        name = primary_line[len("Saint ") :].strip()
    elif primary_line.startswith("Blessed "):
        title = "Blessed"
        name = primary_line[len("Blessed ") :].strip()
    else:
        raise RuntimeError(f"registro fora do escopo santo/beato: {primary_line}")

    secular_name: str | None = None
    aliases: list[str] = []
    for raw_line in name_lines[1:]:
        raw_clean = clean_text_fragment(raw_line, join_lines=True)
        if re.fullmatch(r"\([^)]*\)", raw_clean) or re.fullmatch(r"[\[\]()?0-9.\-– ]+", raw_clean):
            continue
        normalized = normalize_alias(raw_line)
        if not normalized:
            continue
        if "secular name" in raw_line.lower() and not secular_name:
            secular_name = normalized
        aliases.append(normalized)

    for alias in aliases_from_index:
        normalized = normalize_alias(alias)
        if normalized:
            aliases.append(normalized)

    aliases = [alias for alias in dedupe_strings(aliases) if alias != name]
    return title, name, secular_name, aliases, name_lines


def extract_field_maps(body_html: str) -> tuple[dict[str, str], dict[str, str]]:
    raw_fields: dict[str, str] = {}
    text_fields: dict[str, str] = {}
    for label_html, value_html in FIELD_RE.findall(body_html):
        label = clean_text_fragment(label_html, join_lines=True).strip()
        raw_fields[label] = value_html
        text_fields[label] = clean_text_fragment(value_html, join_lines=True)
    return raw_fields, text_fields


def extract_paragraphs(body_html: str) -> list[str]:
    paragraphs: list[str] = []
    for attrs, inner_html in re.findall(r"<p([^>]*)>(.*?)</p>", body_html, re.IGNORECASE | re.DOTALL):
        if 'class="name"' in attrs.lower():
            continue
        text = clean_text_fragment(inner_html, join_lines=True)
        if text:
            paragraphs.append(text)
    return dedupe_strings(paragraphs)


def extract_permalink_id(body_html: str) -> int | None:
    match = re.search(r'href="/p/(\d+)"', body_html)
    return int(match.group(1)) if match else None


def build_uid(page_url: str, anchor_id: str | None, person_id: int | None) -> str:
    if person_id is not None:
        return f"gcatholic:p:{person_id}"
    path = urlparse(page_url).path.strip("/")
    return f"gcatholic:path:{path}#{anchor_id}" if anchor_id else f"gcatholic:path:{path}"


def build_record(
    *,
    page_url: str,
    page_type: str,
    anchor_id: str | None,
    body_html: str,
    aliases_from_index: list[str],
    pontificate_map: dict[str, str],
    page_header_country: str | None,
) -> dict[str, Any]:
    name_match = re.search(r'<p class="name">(.*?)</p>', body_html, re.IGNORECASE | re.DOTALL)
    if not name_match:
        raise RuntimeError(f"Registro sem <p class=\"name\"> em {page_url}#{anchor_id or ''}")

    title, name, secular_name, aliases, name_lines = extract_primary_name_and_aliases(
        name_match.group(1),
        aliases_from_index,
    )
    raw_fields, text_fields = extract_field_maps(body_html)
    paragraphs = extract_paragraphs(body_html)
    description = " ".join(paragraphs) if paragraphs else None
    person_id = extract_permalink_id(body_html)

    nascimento = build_event(raw_fields.get("Born"), page_url, pontificate_map)
    morte = build_event(raw_fields.get("Died"), page_url, pontificate_map)
    beatificacao = build_event(raw_fields.get("Beatified"), page_url, pontificate_map)
    canonizacao = build_event(raw_fields.get("Canonised"), page_url, pontificate_map)
    festa_texto = clean_text_fragment(raw_fields.get("Feast", ""), join_lines=True) or None

    country_from_flag = extract_flag_country(body_html)
    pais_referencia = country_from_flag or page_header_country or nascimento["pais"] or morte["pais"]
    martir = any("🩸" in value for value in text_fields.values()) or bool(description and "martyr" in description.lower())

    detalhes = {
        "aliases_indice": dedupe_strings([normalize_alias(alias) for alias in aliases_from_index if normalize_alias(alias)]),
        "linhas_nome": name_lines,
        "campos": {label: value for label, value in text_fields.items() if value},
        "paragrafos": paragraphs,
        "pais_flag": country_from_flag,
        "fonte": {"url": page_url, "anchor_id": anchor_id},
        "fontes": [{"url": page_url, "anchor_id": anchor_id}],
    }

    return {
        "gcatholic_uid": build_uid(page_url, anchor_id, person_id),
        "gcatholic_person_id": person_id,
        "gcatholic_path": urlparse(page_url).path,
        "gcatholic_anchor_id": anchor_id,
        "gcatholic_url": f"{page_url}#{anchor_id}" if anchor_id else page_url,
        "pagina_tipo": page_type,
        "titulo": title,
        "tipo_culto": "santo" if title == "Saint" else "beato",
        "nome": name,
        "nomes_alternativos": aliases,
        "nome_secular": secular_name,
        "pais_referencia": pais_referencia,
        "nascimento_texto": nascimento["texto"],
        "nascimento_data": nascimento["data"],
        "nascimento_local": nascimento["local"],
        "nascimento_pais": nascimento["pais"],
        "morte_texto": morte["texto"],
        "morte_data": morte["data"],
        "morte_local": morte["local"],
        "morte_pais": morte["pais"],
        "festa_texto": festa_texto,
        "beatificacao_texto": beatificacao["texto"],
        "beatificacao_data": beatificacao["data"],
        "beatificacao_local": beatificacao["local"],
        "beatificacao_pais": beatificacao["pais"],
        "beatificado_por": beatificacao["pontifice"],
        "canonizacao_texto": canonizacao["texto"],
        "canonizacao_data": canonizacao["data"],
        "canonizacao_local": canonizacao["local"],
        "canonizacao_pais": canonizacao["pais"],
        "canonizado_por": canonizacao["pontifice"],
        "martir": martir,
        "descricao": description,
        "detalhes": detalhes,
        "scraped_at": utc_now_iso(),
    }


def parse_row_page(
    *,
    page_url: str,
    page_type: str,
    html_text: str,
    targets: list[dict[str, Any]],
    pontificate_map: dict[str, str],
) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    rows = extract_row_blocks(html_text)
    page_header_country = extract_page_header_country(html_text)
    records: list[dict[str, Any]] = []
    missing: list[dict[str, str]] = []

    for target in targets:
        anchor_id = target["anchor_id"]
        if not anchor_id or anchor_id not in rows:
            missing.append(
                {
                    "url": page_url,
                    "anchor_id": anchor_id or "",
                    "reason": "anchor nao encontrado na pagina",
                }
            )
            continue
        try:
            record = build_record(
                page_url=page_url,
                page_type=page_type,
                anchor_id=anchor_id,
                body_html=rows[anchor_id],
                aliases_from_index=target["aliases"],
                pontificate_map=pontificate_map,
                page_header_country=page_header_country,
            )
            records.append(record)
        except Exception as exc:  # noqa: BLE001
            missing.append(
                {
                    "url": page_url,
                    "anchor_id": anchor_id,
                    "reason": f"falha ao parsear registro: {exc}",
                }
            )
    return records, missing


def parse_pope_page(
    *,
    page_url: str,
    html_text: str,
    target: dict[str, Any],
    pontificate_map: dict[str, str],
) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    heading_match = re.search(r"<h1>(.*?)</h1>", html_text, re.IGNORECASE | re.DOTALL)
    table_match = re.search(
        r'<table class="ntb" cellpadding="0" cellspacing="2">([\s\S]*?)</table>',
        html_text,
        re.IGNORECASE,
    )
    paragraphs_match = re.search(
        r'<table class="ntb" cellpadding="0" cellspacing="2">[\s\S]*?</table>([\s\S]*?)</div><div align="center"><hr></div>',
        html_text,
        re.IGNORECASE,
    )

    if not heading_match or not table_match:
        return (
            [],
            [
                {
                    "url": page_url,
                    "anchor_id": "",
                    "reason": "estrutura inesperada na pagina de papa santo",
                }
            ],
        )

    fragment = f'<p class="name">{heading_match.group(1)}</p>'
    fragment += f'<table class="ntb" cellpadding="0" cellspacing="2">{table_match.group(1)}</table>'
    fragment += paragraphs_match.group(1) if paragraphs_match else ""

    try:
        record = build_record(
            page_url=page_url,
            page_type="hierarchy/pope",
            anchor_id=None,
            body_html=fragment,
            aliases_from_index=target["aliases"],
            pontificate_map=pontificate_map,
            page_header_country=extract_page_header_country(html_text),
        )
        return [record], []
    except Exception as exc:  # noqa: BLE001
        return (
            [],
            [
                {
                    "url": page_url,
                    "anchor_id": "",
                    "reason": f"falha ao parsear pagina de papa santo: {exc}",
                }
            ],
        )


def merge_nested_details(left: dict[str, Any], right: dict[str, Any]) -> dict[str, Any]:
    merged = dict(left)
    for key, value in right.items():
        if key not in merged or merged[key] in (None, "", [], {}):
            merged[key] = value
            continue
        if isinstance(merged[key], list) and isinstance(value, list):
            if value and all(isinstance(item, dict) for item in value):
                merged[key] = dedupe_dicts(merged[key] + value)
            else:
                merged[key] = dedupe_strings(merged[key] + value)
        elif isinstance(merged[key], dict) and isinstance(value, dict):
            merged[key] = merge_nested_details(merged[key], value)
        elif isinstance(merged[key], str) and isinstance(value, str) and len(value) > len(merged[key]):
            merged[key] = value
    return merged


def merge_records(existing: dict[str, Any], incoming: dict[str, Any]) -> dict[str, Any]:
    merged = dict(existing)
    scalar_fields = [
        "gcatholic_person_id",
        "gcatholic_path",
        "gcatholic_anchor_id",
        "gcatholic_url",
        "pagina_tipo",
        "titulo",
        "tipo_culto",
        "nome",
        "nome_secular",
        "pais_referencia",
        "nascimento_texto",
        "nascimento_data",
        "nascimento_local",
        "nascimento_pais",
        "morte_texto",
        "morte_data",
        "morte_local",
        "morte_pais",
        "festa_texto",
        "beatificacao_texto",
        "beatificacao_data",
        "beatificacao_local",
        "beatificacao_pais",
        "beatificado_por",
        "canonizacao_texto",
        "canonizacao_data",
        "canonizacao_local",
        "canonizacao_pais",
        "canonizado_por",
    ]

    for field in scalar_fields:
        if merged.get(field) in (None, "") and incoming.get(field) not in (None, ""):
            merged[field] = incoming[field]

    if incoming.get("descricao") and len(incoming["descricao"]) > len(merged.get("descricao") or ""):
        merged["descricao"] = incoming["descricao"]

    merged["martir"] = bool(merged.get("martir")) or bool(incoming.get("martir"))
    merged["scraped_at"] = incoming.get("scraped_at") or merged.get("scraped_at")
    merged["nomes_alternativos"] = dedupe_strings(merged.get("nomes_alternativos", []) + incoming.get("nomes_alternativos", []))
    merged["detalhes"] = merge_nested_details(merged.get("detalhes", {}), incoming.get("detalhes", {}))
    return merged


def scrape_manifest(
    manifest: dict[str, Any],
    workdir: Path,
    *,
    force: bool,
    sleep_ms: int,
    max_workers: int,
    limit_targets: int | None,
    limit_pages: int | None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    selected_targets = manifest["records"][:limit_targets] if limit_targets else manifest["records"]
    targets_by_page: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for target in selected_targets:
        targets_by_page[target["url"]].append(target)

    page_items = sorted(targets_by_page.items(), key=lambda item: item[0])
    if limit_pages:
        page_items = page_items[:limit_pages]

    page_cache_dir = workdir / "cache" / "detail_pages"
    pontificate_map = build_pontificate_map(workdir, force=force, sleep_ms=sleep_ms)
    records_by_uid: dict[str, dict[str, Any]] = {}
    errors: list[dict[str, str]] = []

    def process_page(page_url: str, targets: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
        html_text = fetch_text(page_url, page_cache_dir, force=force, sleep_ms=sleep_ms)
        page_type = targets[0]["page_type"]
        if page_type == "hierarchy/pope":
            return parse_pope_page(page_url=page_url, html_text=html_text, target=targets[0], pontificate_map=pontificate_map)
        return parse_row_page(
            page_url=page_url,
            page_type=page_type,
            html_text=html_text,
            targets=targets,
            pontificate_map=pontificate_map,
        )

    total_pages = len(page_items)
    log(f"Iniciando scrape de {total_pages} paginas unicas...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_map = {
            executor.submit(process_page, page_url, targets): page_url
            for page_url, targets in page_items
        }

        for index, future in enumerate(concurrent.futures.as_completed(future_map), start=1):
            page_url = future_map[future]
            try:
                page_records, page_errors = future.result()
            except Exception as exc:  # noqa: BLE001
                page_records = []
                page_errors = [{"url": page_url, "anchor_id": "", "reason": f"falha na pagina: {exc}"}]

            for record in page_records:
                uid = record["gcatholic_uid"]
                if uid in records_by_uid:
                    records_by_uid[uid] = merge_records(records_by_uid[uid], record)
                else:
                    records_by_uid[uid] = record

            errors.extend(page_errors)
            if index % 25 == 0 or index == total_pages or page_errors:
                log(
                    f"[{index}/{total_pages}] paginas processadas, {len(records_by_uid)} registros unicos, "
                    f"{len(errors)} pendencias."
                )

    localized_records = [localize_record(record) for record in records_by_uid.values()]
    records = sorted(localized_records, key=lambda item: (item["nome"].casefold(), item["gcatholic_uid"]))

    records_path = workdir / "gcatholic-santos-records.ndjson"
    summary_path = workdir / "gcatholic-santos-summary.json"
    write_ndjson(records_path, records)

    summary = {
        "generated_at": utc_now_iso(),
        "source_targets": len(selected_targets),
        "source_pages": total_pages,
        "unique_records": len(records),
        "count_by_tipo_culto": dict(Counter(record["tipo_culto"] for record in records)),
        "count_by_pagina_tipo": dict(Counter(record["pagina_tipo"] for record in records)),
        "with_canonizacao": sum(1 for record in records if record.get("canonizacao_texto")),
        "with_beatificacao": sum(1 for record in records if record.get("beatificacao_texto")),
        "martires": sum(1 for record in records if record.get("martir")),
        "errors": errors,
        "records_path": str(records_path),
    }
    save_json(summary_path, summary)
    log(f"Scrape concluido. {len(records)} registros unicos salvos em {records_path}.")
    if errors:
        log(f"Foram registradas {len(errors)} pendencias em {summary_path}.")
    return records, summary


def batched(values: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [values[index : index + size] for index in range(0, len(values), size)]


def import_records(
    records: list[dict[str, Any]],
    workdir: Path,
    *,
    batch_size: int,
) -> dict[str, Any]:
    records = [localize_record(record) for record in records]
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        raise RuntimeError("Variaveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias para importar.")

    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/santos?on_conflict=gcatholic_uid"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json; charset=utf-8",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    imported = 0
    for batch_index, batch in enumerate(batched(records, batch_size), start=1):
        body = json.dumps(batch, ensure_ascii=False).encode("utf-8")
        request = Request(endpoint, data=body, headers=headers, method="POST")
        try:
            with urlopen(request, timeout=120) as response:
                _ = response.read()
        except HTTPError as exc:
            error_body = exc.read().decode("utf-8", "ignore")
            raise RuntimeError(f"Falha no batch {batch_index}: HTTP {exc.code} - {error_body}") from exc
        except URLError as exc:
            raise RuntimeError(f"Falha de rede no batch {batch_index}: {exc}") from exc
        imported += len(batch)
        log(f"Batch {batch_index}: {imported}/{len(records)} registros enviados.")

    result = {
        "imported_at": utc_now_iso(),
        "total_records": len(records),
        "batch_size": batch_size,
        "endpoint": endpoint,
    }
    save_json(workdir / "gcatholic-santos-import.json", result)
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extrai santos e beatos do GCatholic e opcionalmente importa no Supabase.")
    parser.add_argument("--phase", choices=["manifest", "scrape", "import", "all"], default="all")
    parser.add_argument("--workdir", default=str(DEFAULT_WORKDIR))
    parser.add_argument("--force", action="store_true", help="Ignora cache HTML local.")
    parser.add_argument("--sleep-ms", type=int, default=0, help="Pausa aplicada antes de cada download.")
    parser.add_argument("--max-workers", type=int, default=4, help="Concorrencia maxima para o scrape.")
    parser.add_argument("--limit-targets", type=int, default=None, help="Limita quantos alvos do manifest serao processados.")
    parser.add_argument("--limit-pages", type=int, default=None, help="Limita quantas paginas unicas serao raspadas.")
    parser.add_argument("--batch-size", type=int, default=200, help="Tamanho do batch para import no Supabase.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    workdir = ensure_dir(Path(args.workdir).resolve())

    manifest_path = workdir / "gcatholic-santos-manifest.json"
    records_path = workdir / "gcatholic-santos-records.ndjson"

    manifest: dict[str, Any] | None = None
    records: list[dict[str, Any]] | None = None

    if args.phase in {"manifest", "all"}:
        manifest = build_manifest(workdir, force=args.force, sleep_ms=args.sleep_ms)
    elif manifest_path.exists():
        manifest = load_json(manifest_path)
    elif args.phase in {"scrape", "import"}:
        raise RuntimeError(f"Manifest nao encontrado em {manifest_path}. Rode a fase manifest primeiro.")

    if args.phase in {"scrape", "all"}:
        if manifest is None:
            raise RuntimeError("Manifest nao carregado para a fase scrape.")
        records, _summary = scrape_manifest(
            manifest,
            workdir,
            force=args.force,
            sleep_ms=args.sleep_ms,
            max_workers=max(1, args.max_workers),
            limit_targets=args.limit_targets,
            limit_pages=args.limit_pages,
        )
    elif args.phase == "import":
        if not records_path.exists():
            raise RuntimeError(f"Arquivo de registros nao encontrado em {records_path}. Rode a fase scrape primeiro.")
        records = read_ndjson(records_path)

    if args.phase in {"import", "all"}:
        if records is None:
            if not records_path.exists():
                raise RuntimeError(f"Arquivo de registros nao encontrado em {records_path}.")
            records = read_ndjson(records_path)
        try:
            result = import_records(records, workdir, batch_size=max(1, args.batch_size))
            log(f"Import concluido: {result['total_records']} registros enviados ao Supabase.")
        except RuntimeError as exc:
            if args.phase == "all":
                log(f"Import pulado: {exc}")
            else:
                raise

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"Erro fatal: {exc}", file=sys.stderr)
        raise SystemExit(1)
