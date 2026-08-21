import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress benign browser ResizeObserver notifications and cross-origin iframe errors
const isBenignError = (message?: string | null) => {
  if (!message) return false;
  return (
    message.includes("ResizeObserver loop") ||
    message.includes("ResizeObserver") ||
    message === "Script error." ||
    message === "Script error"
  );
};

window.addEventListener("error", (event) => {
  if (isBenignError(event.message)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (isBenignError(event.reason?.message)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

const originalOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  const msgStr = typeof message === "string" ? message : (error?.message || "");
  if (isBenignError(msgStr)) {
    return true; // Prevents the firing of the default event handler
  }
  if (originalOnError) {
    return originalOnError(message, source, lineno, colno, error);
  }
  return false;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

