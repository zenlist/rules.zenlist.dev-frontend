import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { EvaluationContextProvider } from "./evaluation";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <EvaluationContextProvider>
      <App />
    </EvaluationContextProvider>
  </React.StrictMode>
);
