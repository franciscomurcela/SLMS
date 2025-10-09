import TrackingPortal from "./components/TrackingPortal";
import LogisticsManager from "./components/LogisticsManager";
import Carrier from "./components/Carrier";
import CarrierProofOfDelivery from "./components/CarrierProofOfDelivery";
import CarrierCargoManifest from "./components/CarrierCargoManifest";
import Login from "./components/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/carrier" element={<Carrier />} />
          <Route path="/carrier/pod" element={<CarrierProofOfDelivery />} />
          <Route path="/carrier/manifest" element={<CarrierCargoManifest />} />
          <Route path="/manager" element={<LogisticsManager />} />
          <Route path="/tracking" element={<TrackingPortal />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
