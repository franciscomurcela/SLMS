import Header from "./Header";
import BiaxialLineChart from "./BiaaxialChart";
import SimpleCharts from "./SimpleCharts";
import { Sidebar } from "react-pro-sidebar";
import { useEffect } from "react";
import { API_ENDPOINTS } from "../config/api.config";
import { useKeycloak } from "../context/keycloakHooks";
import CarrierOptimization from "./CarrierOptimization";

const role: string = "Logistics Manager";

function LogisticsManager() {
  const { keycloak } = useKeycloak();

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
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        console.log('Carriers fetched successfully');
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
      <div className="container-fluid">
        <CarrierOptimization />
      </div>
    </>
  );
}

export default LogisticsManager;
