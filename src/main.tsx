import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { StrictMode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App.tsx";
import "./index.css";
import { seedTestData } from "./db/seed.ts";
import ReactQueryProvider from "./lib/react-query.tsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

seedTestData().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <ReactQueryProvider>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
          </GoogleOAuthProvider>
        </ReactQueryProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});
