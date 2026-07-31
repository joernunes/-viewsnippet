import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress top-level cross-origin iframe script errors
window.addEventListener("error", (event) => {
  if (event.message === "Script error." || event.message === "Script error") {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
