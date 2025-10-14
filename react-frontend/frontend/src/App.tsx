import TrackingPortal from "./components/PageTrackingPortal";
import LogisticsManager from "./components/PageLogisticsManager";
import Driver from "./components/Driver";
import DriverProofOfDelivery from "./components/DriverProofOfDelivery";
import DriverCargoManifest from "./components/DriverCargoManifest";
import Login from "./components/PageLogin";
import Profile from "./components/PageProfile";
import Warehouse from "./components/PageWarehouse";
import ProcessOrder from "./components/PageProcessOrder";
import CustomerServiceRep from "./components/PageCustomerServiceRep";
import AuthTest from "./components/AuthTest";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Paths from "./components/UtilsPaths";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path={Paths.PATH_LOGIN} element={<Login />} />
          <Route path="/auth-test" element={<AuthTest />} />
          <Route path={Paths.PATH_DRIVER} element={<Driver />} />
          <Route
            path={Paths.PATH_DRIVER_PROOF_OF_DELIVERY}
            element={<DriverProofOfDelivery />}
          />
          <Route
            path={Paths.PATH_DRIVER_CARGO_MANIFEST}
            element={<DriverCargoManifest />}
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
          <Route path="/warehouse/process/:orderId" element={<ProcessOrder />} />
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
