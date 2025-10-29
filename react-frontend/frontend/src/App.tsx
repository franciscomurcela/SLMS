import TrackingPortal from "./components/PageTrackingPortal";
import LogisticsManager from "./components/PageLogisticsManager";
import Driver from "./components/Driver";
import DriverProofOfDelivery from "./components/DriverProofOfDelivery";
import DriverCargoManifest from "./components/DriverCargoManifest";
import ConfirmDelivery from "./components/ConfirmDelivery";
import Customer from "./components/PageCustomer";
import Login from "./components/PageLogin";
import Profile from "./components/PageProfile";
import Warehouse from "./components/PageWarehouse";
import ProcessOrder from "./components/PageProcessOrder";
import CustomerServiceRep from "./components/PageCustomerServiceRep";
import AuthTest from "./components/AuthTest";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Paths from "./components/UtilsPaths";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { APP_ROLES } from "./config/roles.config";

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path={Paths.PATH_LOGIN} element={<Login />} />
          <Route path="/auth-test" element={<AuthTest />} />

          {/* Protected routes - require authentication */}
          <Route
            path={Paths.PATH_DRIVER}
            element={
              <ProtectedRoute requiredRole={APP_ROLES.DRIVER}>
                <Driver />
              </ProtectedRoute>
            }
          />
          <Route
            path={Paths.PATH_DRIVER_PROOF_OF_DELIVERY}
            element={
              <ProtectedRoute requiredRole={APP_ROLES.DRIVER}>
                <DriverProofOfDelivery />
              </ProtectedRoute>
            }
          />
          <Route
            path={Paths.PATH_DRIVER_CARGO_MANIFEST}
            element={
              <ProtectedRoute requiredRole={APP_ROLES.DRIVER}>
                <DriverCargoManifest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/confirm-delivery"
            element={
              <ProtectedRoute requiredRole={APP_ROLES.DRIVER}>
                <ConfirmDelivery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-route/:orderId"
            element={
              <ProtectedRoute requiredRole={APP_ROLES.DRIVER}>
                <DeliveryRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path={Paths.PATH_LOGISTICS_MANAGER}
            element={
              <ProtectedRoute requiredRole={APP_ROLES.LOGISTICS_MANAGER}>
                <LogisticsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path={Paths.PATH_TRACKING_PORTAL}
            element={
              <ProtectedRoute>
                <TrackingPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path={Paths.PATH_PROFILE}
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path={Paths.PATH_WAREHOUSE}
            element={
              <ProtectedRoute requiredRole={APP_ROLES.WAREHOUSE_STAFF}>
                <Warehouse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse/process/:orderId"
            element={
              <ProtectedRoute requiredRole={APP_ROLES.WAREHOUSE_STAFF}>
                <ProcessOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path={Paths.PATH_CUSTOMER_SERVICE_REP}
            element={
              <ProtectedRoute requiredRole={APP_ROLES.CSR}>
                <CustomerServiceRep />
              </ProtectedRoute>
            }
          />
          <Route
            path={Paths.PATH_CUSTOMER}
            element={
              <ProtectedRoute requiredRole={APP_ROLES.CUSTOMER}>
                <Customer />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route - redirect to login */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
