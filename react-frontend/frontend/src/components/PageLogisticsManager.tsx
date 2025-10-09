import Header from "./Header";
import BiaxialLineChart from "./BiaaxialChart";
import SimpleCharts from "./SimpleCharts";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";

const role: string = Roles.ROLE_LOGISTICS_MANAGER;
const href: string = Paths.PATH_LOGISTICS_MANAGER;

function LogisticsManager() {
  return (
    <>
      <Header role={role} href={href} />
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
