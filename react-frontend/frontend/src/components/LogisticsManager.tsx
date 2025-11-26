import Header from "./Header";
import BiaxialLineChart from "./BiaaxialChart";
import SimpleCharts from "./SimpleCharts";
import { Sidebar } from "react-pro-sidebar";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api.config";
import { useKeycloak } from "../context/KeycloakContext";

const role: string = "Logistics Manager";

function LogisticsManager() {
  const { keycloak } = useKeycloak();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnsOrdered, setColumnsOrdered] = useState<string[]>([]);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    async function load() {
      // Wait for Keycloak to be ready
      if (!keycloak || !keycloak.token || !keycloak.authenticated) {
        console.log("[LogisticsManager] Waiting for Keycloak...");
        setLoading(true);
        return;
      }

      console.log("[LogisticsManager] Keycloak ready, fetching carriers with token");
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching carriers via API...');
        const r = await fetch(API_ENDPOINTS.CARRIERS, {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`,
            'Content-Type': 'application/json'
          }
        });
        const text = await r.text();
        setRawResponse(text);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
          setRows(data);
          setError(null);
        } else {
          setRows([]);
          setError('No carriers data available');
        }
      } catch (err) {
        console.error('Failed to fetch carriers:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [keycloak?.authenticated, keycloak?.token]);

  // friendly labels for common DB columns
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

  // case-insensitive friendly name lookup
  function getFriendlyName(key: string) {
    if (!key) return key;
    const lower = key.toLowerCase();
    // direct match
    if (friendlyNames[lower]) return friendlyNames[lower];
    // fuzzy search keys
    const found = Object.keys(friendlyNames).find((k) => lower.includes(k));
    if (found) return friendlyNames[found];
    // fallback: prettify key
    return key.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  // detect and order columns once rows arrive
  useEffect(() => {
    if (!rows || rows.length === 0) {
      setColumnsOrdered([]);
      return;
    }

  const cols = Object.keys(rows[0]);

  // prefer a name-like column first (case-insensitive)
  const nameKey = cols.find((c) => /name|carrier/i.test(c));
  const ratingKey = cols.find((c) => /rating|score/i.test(c));

    const ordered: string[] = [];
    if (nameKey) ordered.push(nameKey);
    // then id if exists and not already included
    const idKey = cols.find((c) => /(^id$|_id$)/i.test(c));
    if (idKey && idKey !== nameKey) ordered.push(idKey);

    // then rating
    if (ratingKey && ratingKey !== nameKey && ratingKey !== idKey)
      ordered.push(ratingKey);

    // then the rest (preserve original order)
    cols.forEach((c) => {
      if (!ordered.includes(c)) ordered.push(c);
    });

    setColumnsOrdered(ordered);
  }, [rows]);

  // (no auto-scroll) when rows arrive we just render the table at the top of the content

  const columns = columnsOrdered.length ? columnsOrdered : rows.length ? Object.keys(rows[0]) : [];

  // helper to render rating as stars when appropriate
  function renderCell(key: string, value: unknown) {
    if (value == null) return "";

    // helper to extract a numeric value safely from unknown
    const toNumber = (v: unknown): number => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
      return NaN;
    };

    if (/rating|score/i.test(key)) {
      const n = toNumber(value);
      if (Number.isFinite(n)) {
        // normalize to 0-5 scale: if value > 5 assume 0-100 percentage
        const stars =
          n > 5 ? Math.round((Math.max(0, Math.min(100, n)) / 100) * 5) : Math.round(Math.max(0, Math.min(5, n)));
        const filled = "★".repeat(stars);
        const empty = "☆".repeat(5 - stars);
        return `${filled}${empty} ${n}`;
      }
    }

    // currency formatting for cost columns
    if (/cost|avg_cost/i.test(key)) {
      const n = toNumber(value);
      if (Number.isFinite(n)) {
        return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);
      }
    }

    // percentage formatting for rates
    if (/rate|success/i.test(key)) {
      const n = toNumber(value);
      if (Number.isFinite(n)) {
        // if value looks like 0-1, convert to percent
        const pct = n <= 1 ? n * 100 : n;
        // show stars for success-like metrics
        if (/success/i.test(key)) {
          const stars = Math.round(Math.max(0, Math.min(100, pct)) / 20); // 0-5
          const filled = '★'.repeat(stars);
          const empty = '☆'.repeat(5 - stars);
          return `${filled}${empty} ${pct.toFixed(1)}%`;
        }
        return `${pct.toFixed(1)}%`;
      }
    }

    // shorten carrier id for readability
    if (/carrier_id|id/i.test(key) && typeof value === 'string' && value.length > 12) {
      return `${value.slice(0, 8)}...`;
    }

    // default stringify (handle objects/arrays safely)
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }


  return (
    <>
      <Header role={role} href="/" />
      <Sidebar>
        <div className="d-grid gap-2 col-6 mx-auto">
          <button className="btn btn-primary" type="button">
            Rating Transportadoras
          </button>
          <button className="btn btn-primary" type="button">
            Gerar Relatórios
          </button>
          <button className="btn btn-primary" type="button">
            KPI
          </button>
        </div>
      </Sidebar>
      <div className="d-grid gap-2 col-6 mx-auto">
        <SimpleCharts />
        <BiaxialLineChart />
      </div>
    </>
  );
}

export default LogisticsManager;
