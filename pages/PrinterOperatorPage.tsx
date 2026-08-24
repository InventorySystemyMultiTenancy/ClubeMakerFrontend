import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import FleetPanel from "../components/admin/printFarm/FleetPanel";

const PrinterOperatorPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/operador/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-6 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">🖨️ Operar impressoras</h1>
            <p className="text-sm text-slate-500">Olá, {currentUser?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Sair
          </button>
        </div>

        <FleetPanel canManagePrinters={false} />
      </div>
    </div>
  );
};

export default PrinterOperatorPage;
