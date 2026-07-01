import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { StrictMode } from "react";

import App from "./App.tsx";
import "./index.css";
import { seedTestData } from "./db/seed.ts";
import ReactQueryProvider from "./lib/react-query.tsx";

seedTestData().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <ReactQueryProvider>
          <App />
        </ReactQueryProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});
