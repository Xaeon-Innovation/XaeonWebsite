import { Outlet } from "react-router";
import Footer from "./Components/Footer";
import Navbar from "./Components/Navbar";

import "./App.css";

function App() {
  return (
    <div className="app-container flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
