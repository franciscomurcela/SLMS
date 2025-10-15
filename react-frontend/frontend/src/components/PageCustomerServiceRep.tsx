import Header from "./Header";
import BiaxialLineChart from "./BiaaxialChart";
import SimpleCharts from "./SimpleCharts";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";

const role: string = Roles.ROLE_CUSTOMER_SERVICE_REP;
const href: string = Paths.PATH_CUSTOMER_SERVICE_REP;

function CustomerServiceRep() {
  return (
    <>
      <Header role={role} href={href} />
      <div className="d-grid gap-2 col-6 mx-auto">
        <SimpleCharts />
        <BiaxialLineChart />
      </div>
    </>
  );
}

export default CustomerServiceRep;
