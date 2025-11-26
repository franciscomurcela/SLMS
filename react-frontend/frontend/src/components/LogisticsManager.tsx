import Header from "./Header";
import BiaxialLineChart from "./BiaaxialChart";
import SimpleCharts from "./SimpleCharts";
import { Sidebar } from "react-pro-sidebar";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api.config";
import { useKeycloak } from "../context/keycloakHooks";

const role: string = "Logistics Manager";

interface Row {
  [key: string]: unknown;
}

function LogisticsManager() {
  const { keycloak } = useKeycloak();
  const [rows, setRows] = useState<Row[]>([]);
  const [columnsOrdered, setColumnsOrdered] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      // Wait for Keycloak to be ready
      if (!keycloak || !keycloak.token || !keycloak.authenticated) {
        console.log("[LogisticsManager] Waiting for Keycloak...");
        return;
      }

      console.log("[LogisticsManager] Keycloak ready, fetching carriers with token");
      try {
        console.log('Fetching carriers via API...');
        const r = await fetch(API_ENDPOINTS.CARRIERS, {
          headers: {
            'Authorization': `Bearer ${keycloak.token}`,
            'Content-Type': 'application/json'
          }
        });
        const text = await r.text();
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
          setRows(data);
        } else {
          setRows([]);
        }
      } catch (err) {
        console.error('Failed to fetch carriers:', err);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
