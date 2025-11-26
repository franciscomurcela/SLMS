import './instrumentation';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import App from "./App.tsx";
import { KeycloakProvider } from "./context/KeycloakContext";
import { FeatureFlagsProvider } from "./context/FeatureFlagsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <KeycloakProvider>
      <FeatureFlagsProvider>
        <App />
      </FeatureFlagsProvider>
    </KeycloakProvider>
  </StrictMode>
);
