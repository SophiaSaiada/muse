import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/main.css";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router";
import { IndexRoute } from "@/routes";
import { SongRoute } from "@/routes/song";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" Component={IndexRoute} />
        <Route path="/s/:id" Component={SongRoute} />
      </Routes>
    </BrowserRouter>
    <Toaster />
  </StrictMode>
);
