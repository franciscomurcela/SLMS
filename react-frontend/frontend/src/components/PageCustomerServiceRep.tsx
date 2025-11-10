import Header from "./Header";
import TrackingPortalCSR from "./TrackingPortalCSR";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";

const role: string = Roles.ROLE_CUSTOMER_SERVICE_REP;
const href: string = Paths.PATH_CUSTOMER_SERVICE_REP;

function CustomerServiceRep() {
  return (
    <>
      <Header role={role} href={href} />
      <TrackingPortalCSR />
    </>
  );
}

export default CustomerServiceRep;
