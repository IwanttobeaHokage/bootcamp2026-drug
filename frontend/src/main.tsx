import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnalysisPage } from "@/pages/AnalysisPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalysisPage />
  </StrictMode>,
);
