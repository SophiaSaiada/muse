import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/main.css";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router";
import { PlayerContextProvider } from "@/contexts/player/provider";
import { IndexRoute } from "@/routes";
import { SongRoute } from "@/routes/song";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PlayerContextProvider>
        <Routes>
          <Route path="/" Component={IndexRoute} />
          <Route path="/s/:id" Component={SongRoute} />
        </Routes>
      </PlayerContextProvider>
    </BrowserRouter>
    <Toaster />
  </StrictMode>
);
