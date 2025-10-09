import TrackingPortal from "./components/PageTrackingPortal";
import LogisticsManager from "./components/PageLogisticsManager";
import Carrier from "./components/PageCarrier";
import CarrierProofOfDelivery from "./components/PageCarrierProofOfDelivery";
import CarrierCargoManifest from "./components/PageCarrierCargoManifest";
import Login from "./components/PageLogin";
import Profile from "./components/PageProfile";
import Warehouse from "./components/PageWarehouse";
import CustomerServiceRep from "./components/PageCustomerServiceRep";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Roles from "./components/UtilsRoles";
import Paths from "./components/UtilsPaths";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path={Paths.PATH_LOGIN} element={<Login />} />
          <Route path={Paths.PATH_CARRIER} element={<Carrier />} />
          <Route
            path={Paths.PATH_CARRIER_PROOF_OF_DELIVERY}
            element={<CarrierProofOfDelivery />}
          />
          <Route
            path={Paths.PATH_CARRIER_CARGO_MANIFEST}
            element={<CarrierCargoManifest />}
          />
          <Route
            path={Paths.PATH_LOGISTICS_MANAGER}
            element={<LogisticsManager />}
          />
          <Route
            path={Paths.PATH_TRACKING_PORTAL}
            element={<TrackingPortal />}
          />
          <Route path={Paths.PATH_PROFILE} element={<Profile />} />
          <Route path={Paths.PATH_WAREHOUSE} element={<Warehouse />} />
          <Route
            path={Paths.PATH_CUSTOMER_SERVICE_REP}
            element={<CustomerServiceRep />}
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
