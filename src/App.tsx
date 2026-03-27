import { useState } from "react";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import SupportPage from "./components/SupportPage";
import UploadComponent from "./components/UploadComponent";

function App() {
  const [activePage, setActivePage] = useState<"home" | "support">("home");

  return (
    <>
      <div className="min-h-screen flex flex-col justify-between bg-slate-950">
        <Navbar activePage={activePage} onNavigate={setActivePage} />
        {activePage === "home" ? <UploadComponent /> : <SupportPage />}
        <Footer />
      </div>
    </>
  );
}

export default App;
