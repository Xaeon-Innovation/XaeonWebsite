import { Outlet } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import Footer from "./Components/Footer";
import Navbar from "./Components/Navbar";

import "./App.css";

function App() {
  return (
    <HelmetProvider>
      <div className="app-container min-h-screen bg-gray-800 relative overflow-x-hidden">
        <Navbar />
        <main className="relative">
          <Outlet />
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}

export default App;
