import React, { useState } from "react";
import FleetPanel from "../components/admin/printFarm/FleetPanel";
import CatalogPanel from "../components/admin/printFarm/CatalogPanel";
import MaintenancePanel from "../components/admin/printFarm/MaintenancePanel";
import ReportsPanel from "../components/admin/printFarm/ReportsPanel";
import OperatorsPanel from "../components/admin/printFarm/OperatorsPanel";

type Tab = "frota" | "catalogo" | "manutencao" | "relatorios" | "operadores";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "frota", label: "Painel da frota", icon: "🖨️" },
  { id: "catalogo", label: "Catálogo de impressão", icon: "🧩" },
  { id: "manutencao", label: "Manutenção", icon: "🔧" },
  { id: "relatorios", label: "Relatórios", icon: "📊" },
  { id: "operadores", label: "Operadores", icon: "👷" },
];

const AdminPrintFarmPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>("frota");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary-lighter)] to-[var(--color-primary-light)] p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="text-3xl font-bold text-[var(--color-primary-active)]">
            🖨️ Impressoras 3D
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Ciclo de produção, perdas de filamento e manutenção preventiva da frota
          </p>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                  tab === t.id
                    ? "bg-[var(--color-primary)] text-white shadow"
                    : "bg-stone-100 text-stone-600 hover:bg-[var(--color-primary-lighter)]"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "frota" && <FleetPanel />}
        {tab === "catalogo" && <CatalogPanel />}
        {tab === "manutencao" && <MaintenancePanel />}
        {tab === "relatorios" && <ReportsPanel />}
        {tab === "operadores" && <OperatorsPanel />}
      </div>
    </div>
  );
};

export default AdminPrintFarmPage;
