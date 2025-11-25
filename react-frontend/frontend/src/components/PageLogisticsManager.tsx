import Header from "./Header";
import BiaxialLineChart from "./BiaaxialChart";
import SimpleCharts from "./SimpleCharts";
import CarriersPanel from "./CarriersPanel";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import ChatAssistant from "./ChatAssistant";
import { useKeycloak } from "../context/keycloakHooks";

const role: string = Roles.ROLE_LOGISTICS_MANAGER;
const href: string = Paths.PATH_LOGISTICS_MANAGER;

function LogisticsManager() {
  const { keycloak } = useKeycloak();

  return (
    <>
      <Header role={role} href={href} />
      <div className="d-grid gap-2 col-6 mx-auto">
        <CarriersPanel />
        <SimpleCharts />
        <BiaxialLineChart />
      </div>

      {/* Chat Assistant */}
      <ChatAssistant
        authToken={keycloak?.token}
        customerId={keycloak?.tokenParsed?.sub}
      />
    </>
  );
}

export default LogisticsManager;
