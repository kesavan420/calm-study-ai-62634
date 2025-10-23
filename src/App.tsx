import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Subjects from "./pages/Subjects";
import Planner from "./pages/Planner";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import ProtectedLayout from "./components/ProtectedLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Home />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
