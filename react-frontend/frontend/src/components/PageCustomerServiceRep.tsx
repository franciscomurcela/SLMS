import Header from "./Header";
import TrackingPortalCSR from "./TrackingPortalCSR";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import ChatAssistant from "./ChatAssistant";
import { useKeycloak } from "../context/keycloakHooks";

const role: string = Roles.ROLE_CUSTOMER_SERVICE_REP;
const href: string = Paths.PATH_CUSTOMER_SERVICE_REP;

function CustomerServiceRep() {
  const { keycloak } = useKeycloak();

  return (
    <>
      <Header role={role} href={href} />
      <TrackingPortalCSR />

      {/* Chat Assistant */}
      <ChatAssistant
        authToken={keycloak?.token}
        customerId={keycloak?.tokenParsed?.sub}
      />
    </>
  );
}

export default CustomerServiceRep;
