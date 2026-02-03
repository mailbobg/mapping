import csv
import json
import re
from pathlib import Path
from typing import List, Dict, Any

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "Data"
STATE_DIR = BASE_DIR / "state"
OUTPUT_PATH = Path(__file__).resolve().parent / "seed.sql"


def norm_id(value: str) -> str:
    if value is None:
        return ""
    return str(value).replace(" ", "").strip()


def sql_escape(value: str) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def chunked(items: List[Any], size: int) -> List[List[Any]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def read_use_cases(path: Path) -> List[Dict[str, Any]]:
    rows = []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def extract_tf_ids(text: str) -> List[str]:
    if not text:
        return []
    # Using a more robust regex that handles multiline inputs correctly if needed
    # but the original regex was mostly fine for IDs. 
    # Let's ensure we capture all occurrences.
    matches = re.findall(r"\[([A-Za-z]+)\s*-\s*([0-9]+)\]", text)
    ids = [f"{prefix}-{num}" for prefix, num in matches]
    seen = set()
    ordered = []
    for tid in ids:
        if tid not in seen:
            seen.add(tid)
            ordered.append(tid)
    return ordered


def build_seed_sql():
    domains = load_json(DATA_DIR / "domains.json")
    features = load_json(DATA_DIR / "features.json")
    # Add fallback feature
    features.append({"id": "F000", "name": "Unknown Feature", "domainId": "D01"})
    pf_pool = load_json(STATE_DIR / "pf_pool.json")
    tech_functions = load_json(DATA_DIR / "tech_functions.json")
    use_cases = read_use_cases(DATA_DIR / "Use Case.csv")

    tf_map = {}
    for tf in tech_functions:
        tf_id = norm_id(tf.get("tech_function_req_id", ""))
        if tf_id:
            tf_map[tf_id] = tf

    tf_to_pf = {}
    for pf_id, pf in pf_pool.items():
        for tf_id in pf.get("tf_ids", []):
            tid = norm_id(tf_id)
            if tid:
                tf_to_pf[tid] = pf_id

    sql_lines = []
    SEPARATOR = "\n-- STATEMENT_END --\n"

    domain_rows = [(d.get("id"), d.get("name")) for d in domains]
    for batch in chunked(domain_rows, 200):
        values = ",\n".join(
            f"({sql_escape(i)}, {sql_escape(n)})" for i, n in batch
        )
        sql_lines.append(
            "INSERT INTO \"Domain\" (\"id\", \"name\") VALUES\n"
            + values
            + "\nON CONFLICT (\"id\") DO UPDATE SET \"name\" = EXCLUDED.\"name\";" + SEPARATOR
        )

    feature_rows = [(f.get("id"), f.get("name"), f.get("domainId")) for f in features]
    for batch in chunked(feature_rows, 200):
        values = ",\n".join(
            f"({sql_escape(i)}, {sql_escape(n)}, {sql_escape(d)})" for i, n, d in batch
        )
        sql_lines.append(
            "INSERT INTO \"Feature\" (\"id\", \"name\", \"domainId\") VALUES\n"
            + values
            + "\nON CONFLICT (\"id\") DO UPDATE SET \"name\" = EXCLUDED.\"name\", \"domainId\" = EXCLUDED.\"domainId\";" + SEPARATOR
        )

    pf_rows = []
    for pf_id, pf in pf_pool.items():
        tags = pf.get("tags", []) or []
        tags_sql = "ARRAY[" + ",".join(sql_escape(t) for t in tags) + "]::text[]"
        pf_rows.append(
            (
                pf_id,
                pf.get("name"),
                pf.get("name_cn"),
                pf.get("description_en") or pf.get("description"),
                pf.get("description_cn"),
                pf.get("feature_id") or "F000",
                tags_sql,
            )
        )

    for batch in chunked(pf_rows, 200):
        values = ",\n".join(
            "(" + ", ".join(
                [
                    sql_escape(i),
                    sql_escape(n),
                    sql_escape(nc),
                    sql_escape(de),
                    sql_escape(dc),
                    sql_escape(fid),
                    tags,
                ]
            ) + ")"
            for i, n, nc, de, dc, fid, tags in batch
        )
        sql_lines.append(
            "INSERT INTO \"ProductFunction\" (\"id\", \"name\", \"nameCn\", \"descriptionEn\", \"descriptionCn\", \"featureId\", \"tags\") VALUES\n"
            + values
            + "\nON CONFLICT (\"id\") DO UPDATE SET \"name\" = EXCLUDED.\"name\", \"nameCn\" = EXCLUDED.\"nameCn\", \"descriptionEn\" = EXCLUDED.\"descriptionEn\", \"descriptionCn\" = EXCLUDED.\"descriptionCn\", \"featureId\" = EXCLUDED.\"featureId\", \"tags\" = EXCLUDED.\"tags\";" + SEPARATOR
        )

    # Define valid_tf_ids early
    valid_tf_ids = set()
    for tf in tech_functions:
        tf_id = norm_id(tf.get("tech_function_req_id", ""))
        if tf_id:
            valid_tf_ids.add(tf_id)

    tf_rows = []
    for tf_id, tf in tf_map.items():
        tf_rows.append(
            (
                tf_id,
                tf.get("tech_function"),
                tf.get("description"),
                tf.get("state"),
                0,
                tf_to_pf.get(tf_id),
            )
        )

    # Create missing TFs as placeholders
    missing_tf_ids = set()
    # Need to re-scan because we are iterating before uc_rows loop
    # Ideally we should do this after collecting all IDs but before writing TF rows.
    # Let's move the TF writing block AFTER we collect all potential TFs from UCs.
    
    # COLLECT ALL TF REFS FROM UCs
    all_referenced_tfs = set()
    for uc in use_cases:
        tf_ids = extract_tf_ids(uc.get("Technical Function", ""))
        for tid in tf_ids:
            all_referenced_tfs.add(tid)

    # IDENTIFY MISSING
    for tid in all_referenced_tfs:
        if tid not in valid_tf_ids:
            missing_tf_ids.add(tid)
            # Add to rows immediately
            tf_rows.append(
                (
                    tid,
                    f"Placeholder {tid}",
                    "Auto-generated placeholder",
                    "Unknown",
                    0,
                    None
                )
            )
            # Mark as valid now so links work later
            valid_tf_ids.add(tid)
            
    if missing_tf_ids:
        print(f"Created {len(missing_tf_ids)} placeholder Technical Functions.")

    for batch in chunked(tf_rows, 200):
        values = ",\n".join(
            f"({sql_escape(i)}, {sql_escape(n)}, {sql_escape(d)}, {sql_escape(s)}, {p}, {sql_escape(pf)})"
            for i, n, d, s, p, pf in batch
        )
        sql_lines.append(
            "INSERT INTO \"TechnicalFunction\" (\"id\", \"name\", \"description\", \"state\", \"progressPercent\", \"productFunctionId\") VALUES\n"
            + values
            + "\nON CONFLICT (\"id\") DO UPDATE SET \"name\" = EXCLUDED.\"name\", \"description\" = EXCLUDED.\"description\", \"state\" = EXCLUDED.\"state\", \"progressPercent\" = EXCLUDED.\"progressPercent\", \"productFunctionId\" = EXCLUDED.\"productFunctionId\";" + SEPARATOR
        )

    # valid_tf_ids is already defined above
    
    # Create missing TFs as placeholders
    # Define uc_rows here
    uc_rows = []
    uc_links = []
    missing_tf_log = []

    for uc in use_cases:
        uc_id = uc.get("UID")
        uc_rows.append(
            (
                uc_id,
                uc.get("Use Case Name"),
                uc.get("Use Case Description"),
                uc.get("HMX Input"),
                uc.get("HMX Output"),
                uc.get("Customer PD Feature"),
                uc.get("Technical Function"),
            )
        )
        tf_ids = extract_tf_ids(uc.get("Technical Function", ""))
        for tid in tf_ids:
            if tid in valid_tf_ids:
                uc_links.append((uc_id, tid))
            else:
                missing_tf_log.append(f"UC: {uc_id} references missing TF: {tid}")

    # Optionally print missing TFs summary
    if missing_tf_log:
        print(f"Warning: Found {len(missing_tf_log)} references to non-existent Technical Functions.")
        # Uncomment to see details:
        # for log in missing_tf_log[:10]: print(log)


    for batch in chunked(uc_rows, 200):
        values = ",\n".join(
            f"({sql_escape(i)}, {sql_escape(n)}, {sql_escape(d)}, {sql_escape(hi)}, {sql_escape(ho)}, {sql_escape(cpf)}, {sql_escape(tfraw)})"
            for i, n, d, hi, ho, cpf, tfraw in batch
        )
        sql_lines.append(
            "INSERT INTO \"UseCase\" (\"id\", \"name\", \"description\", \"hmxInput\", \"hmxOutput\", \"customerPdFeature\", \"technicalFunctionRaw\") VALUES\n"
            + values
            + "\nON CONFLICT (\"id\") DO UPDATE SET \"name\" = EXCLUDED.\"name\", \"description\" = EXCLUDED.\"description\", \"hmxInput\" = EXCLUDED.\"hmxInput\", \"hmxOutput\" = EXCLUDED.\"hmxOutput\", \"customerPdFeature\" = EXCLUDED.\"customerPdFeature\", \"technicalFunctionRaw\" = EXCLUDED.\"technicalFunctionRaw\";" + SEPARATOR
        )

    for batch in chunked(uc_links, 500):
        values = ",\n".join(
            f"({sql_escape(uc_id)}, {sql_escape(tf_id)})" for uc_id, tf_id in batch
        )
        sql_lines.append(
            "INSERT INTO \"UseCaseTechnicalFunction\" (\"useCaseId\", \"technicalFunctionId\") VALUES\n"
            + values
            + "\nON CONFLICT (\"useCaseId\", \"technicalFunctionId\") DO NOTHING;" + SEPARATOR
        )

    OUTPUT_PATH.write_text("".join(sql_lines), encoding="utf-8")
    print(f"Seed SQL written to: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_seed_sql()
