export const SITE_NAME = "SAAR";
export const REPO = "https://github.com/THE-SHRIKS/SAAR-LokiXPiyush";
export const REPO_BLOB = `${REPO}/blob/main/`;
export const REPO_TREE = `${REPO}/tree/main/`;
export const STATUS_DATE = "2026-10-22";

export const NAV = [
  { href: "/product", label: "Product" },
  { href: "/security", label: "Security" },
  { href: "/architecture", label: "Architecture" },
  { href: "/docs", label: "Docs" },
];

export const STEPS = [
  {
    n: "01",
    title: "Bring in the evidence",
    text: "Drop in invoices, receipts, statements and bank rows. SAAR keeps them in one workspace and de-duplicates by content hash.",
    alt: "Pixel illustration: documents dropping into a workspace tray",
  },
  {
    n: "02",
    title: "Inspect the source",
    text: "Every extracted value keeps its provenance. Read the field beside the original document, with its hash, size and storage state.",
    alt: "Pixel illustration: a lens reading one field of a source document",
  },
  {
    n: "03",
    title: "Review the match",
    text: "Deterministic rules propose links between invoices and payments and flag anomalies. You approve, reject or correct.",
    alt: "Pixel illustration: invoices linked to payments, one link flagged",
  },
  {
    n: "04",
    title: "Ask, and see the receipts",
    text: "Ask in plain language. Totals are calculated from your records and cited to transactions. Model prose is labelled as not verified.",
    alt: "Pixel illustration: a question, a typed answer and evidence chips",
  },
  {
    n: "05",
    title: "Report with a trail",
    text: "Monthly income, expenses and net cash flow, per currency. Export CSV or PDF reports that trace back to source records.",
    alt: "Pixel illustration: monthly income and expense bars with a net line",
  },
  {
    n: "06",
    title: "Back up and restore",
    text: "An encrypted, authenticated archive that restores into a fresh profile. A wrong passphrase or a tampered byte is rejected.",
    alt: "Pixel illustration: a vault with encrypted bytes circling it",
  },
] as const;

export const SECURITY = [
  { label: "Network", claim: "The desktop web view blocks every network connection. Its content security policy sets connect-src to none.", path: "src-tauri/tauri.conf.json", kind: "blob" },
  { label: "Passphrase", claim: "A workspace key is derived with Argon2id: 64 MiB of memory, 3 iterations, 1 lane, 32-byte key.", path: "src-tauri/src/security/kdf.rs", kind: "blob" },
  { label: "Database", claim: "Each workspace has its own SQLCipher database, with write-ahead logging and foreign-key checks.", path: "src-tauri/src/db", kind: "tree" },
  { label: "Documents", claim: "Files are stored as AES-256-GCM encrypted blobs, addressed by content hash, written atomically.", path: "src-tauri/src/security/blob_store.rs", kind: "blob" },
  { label: "Backups", claim: "Backup archives are authenticated and encrypted. A wrong passphrase or a flipped bit is rejected.", path: "src-tauri/src/security/backup.rs", kind: "blob" },
  { label: "Injection", claim: "Text hidden in a document cannot instruct the model. Hostile prompts are quarantined and not answered.", path: "src-tauri/src/ai/defense.rs", kind: "blob" },
  { label: "Logs", claim: "A scrubber removes credentials, card numbers and personal identifiers from logs.", path: "src-tauri/src/security/scrubber.rs", kind: "blob" },
  { label: "Egress audit", claim: "The full reliability suite was run inside a disconnected network namespace. Recorded result: zero packets, zero DNS lookups.", path: "Docs/AUDIT/0001-network-egress-denial-audit.md", kind: "blob" },
] as const;

export const GATES = [
  { id: "G0", name: "Feasibility and runtime baseline", detail: "Desktop shell, local OCR on a real scan, offline model inference, threat model and test fixtures." },
  { id: "G1", name: "Native shell and storage", detail: "Encrypted workspace keys, SQLCipher migrations, no network." },
  { id: "G2", name: "Document ingestion", detail: "Real files to extracted records with page and field provenance." },
  { id: "G3", name: "Financial core", detail: "Exact currency math, reconciliation, duplicate detection, review lifecycle." },
  { id: "G4", name: "Grounded local AI", detail: "Offline llama.cpp, fact packets, source citations, injection defence." },
  { id: "G5", name: "Editorial interface", detail: "Conversation, evidence inspector, import, review, reports, settings." },
  { id: "G6", name: "Reliability and backup", detail: "Traceable exports, encrypted backup and restore, offline egress denial." },
  { id: "G7", name: "Native Windows release", detail: "Windows sidecars, installer and an offline regression sign-off." },
] as const;

export function sourceHref(path: string, kind: "blob" | "tree" = "blob") {
  return (kind === "tree" ? REPO_TREE : REPO_BLOB) + path;
}
