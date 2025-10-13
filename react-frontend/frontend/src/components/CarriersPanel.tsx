import { useEffect, useState } from "react";

type Row = Record<string, any>;

export default function CarriersPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnsOrdered, setColumnsOrdered] = useState<string[]>([]);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    setLoading(true);
    async function load() {
      try {
        const r = await fetch("/carriers");
        const text = await r.text();
        setRawResponse(text);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
          setRows(data);
          setError(null);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("proxy fetch failed:", err);
      }

      try {
        const r2 = await fetch("http://localhost:8082/carriers");
        const text2 = await r2.text();
        setRawResponse(text2);
        if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
        const data2 = JSON.parse(text2);
        setRows(Array.isArray(data2) ? data2 : []);
        setError(null);
      } catch (err) {
        console.error("direct fetch failed:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const friendlyNames: Record<string, string> = {
    id: "ID",
    carrier_id: "ID",
    name: "Name",
    carrier_name: "Name",
    display_name: "Name",
    carrier: "Name",
    rating: "Rating",
    score: "Rating",
    rating_score: "Rating",
    avg_cost: "Avg cost",
    cost: "Avg cost",
    on_time_rate: "On-time rate",
    ontime_rate: "On-time rate",
    success_rate: "Success rate",
    email: "Email",
    contact: "Contact",
    phone: "Phone",
    address: "Address",
  };

  function getFriendlyName(key: string) {
    if (!key) return key;
    const lower = key.toLowerCase();
    if (friendlyNames[lower]) return friendlyNames[lower];
    const found = Object.keys(friendlyNames).find((k) => lower.includes(k));
    if (found) return friendlyNames[found];
    return key.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  useEffect(() => {
    if (!rows || rows.length === 0) {
      setColumnsOrdered([]);
      return;
    }
    const cols = Object.keys(rows[0]);
    const nameKey = cols.find((c) => /name|carrier/i.test(c));
    const ratingKey = cols.find((c) => /rating|score/i.test(c));
    const ordered: string[] = [];
    if (nameKey) ordered.push(nameKey);
    const idKey = cols.find((c) => /(^id$|_id$)/i.test(c));
    if (idKey && idKey !== nameKey) ordered.push(idKey);
    if (ratingKey && ratingKey !== nameKey && ratingKey !== idKey) ordered.push(ratingKey);
    cols.forEach((c) => {
      if (!ordered.includes(c)) ordered.push(c);
    });
    setColumnsOrdered(ordered);
  }, [rows]);

  const columns = columnsOrdered.length ? columnsOrdered : rows.length ? Object.keys(rows[0]) : [];

  function renderCell(key: string, value: any) {
    if (value == null) return "";
    if (/rating|score/i.test(key)) {
      const n = Number(value);
      if (Number.isFinite(n)) {
        const stars = n > 5 ? Math.round((Math.max(0, Math.min(100, n)) / 100) * 5) : Math.round(Math.max(0, Math.min(5, n)));
        const filled = "★".repeat(stars);
        const empty = "☆".repeat(5 - stars);
        return `${filled}${empty} ${n}`;
      }
    }
    if (/cost|avg_cost/i.test(key)) {
      const n = Number(value);
      if (Number.isFinite(n)) {
        return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n);
      }
    }
    if (/rate|success/i.test(key)) {
      const n = Number(value);
      if (Number.isFinite(n)) {
        const pct = n <= 1 ? n * 100 : n;
        if (/success/i.test(key)) {
          const stars = Math.round(Math.max(0, Math.min(100, pct)) / 20);
          const filled = "★".repeat(stars);
          const empty = "☆".repeat(5 - stars);
          return `${filled}${empty} ${pct.toFixed(1)}%`;
        }
        return `${pct.toFixed(1)}%`;
      }
    }
    if (/carrier_id|id/i.test(key) && typeof value === "string" && value.length > 12) {
      return `${value.slice(0, 8)}...`;
    }
    return String(value);
  }

  return (
    <div id="carriers-section" className="mt-4">
      <h3>Carriers</h3>
      {loading && <div>Loading...</div>}
      {error && <div className="text-danger">Error: {error}</div>}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{getFriendlyName(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c}>{renderCell(c, r[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowRaw((s) => !s)}>
          {showRaw ? "Hide raw response" : "Show raw response"}
        </button>
        {showRaw && rawResponse && (
          <pre style={{ maxHeight: 300, overflow: "auto", background: "#f8f9fa" }}>{rawResponse}</pre>
        )}
      </div>
    </div>
  );
}
