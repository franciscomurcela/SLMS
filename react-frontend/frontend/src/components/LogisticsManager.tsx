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
