import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import PredictionHistory from "./pages/PredictionHistory";
import PredictionDetail from "./pages/PredictionDetail";
import Analytics from "./pages/Analytics";
import ExportReport from "./pages/ExportReport";
import About from "./pages/About";
import Faq from "./pages/Faq";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/predictions" element={<PredictionHistory />} />
        <Route path="/predictions/:id" element={<PredictionDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/export" element={<ExportReport />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<Faq />} />
      </Routes>
    </BrowserRouter>
  );
}