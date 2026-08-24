import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import FleetPanel from "../components/admin/printFarm/FleetPanel";
import CatalogPanel from "../components/admin/printFarm/CatalogPanel";
import MaintenancePanel from "../components/admin/printFarm/MaintenancePanel";
import ReportsPanel from "../components/admin/printFarm/ReportsPanel";
import OperatorsPanel from "../components/admin/printFarm/OperatorsPanel";

type Tab = "frota" | "catalogo" | "manutencao" | "relatorios" | "operadores";

const ALL_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "frota", label: "Painel da frota", icon: "🖨️" },
  { id: "catalogo", label: "Catálogo de impressão", icon: "🧩" },
  { id: "manutencao", label: "Manutenção", icon: "🔧" },
  { id: "relatorios", label: "Relatórios", icon: "📊" },
  { id: "operadores", label: "Operadores", icon: "👷" },
];

const AdminPrintFarmPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isOperator = currentUser?.role === "print_operator";

  // Operador só inicia/finaliza produção — cadastros, manutenção, relatórios
  // e gestão de operadores ficam restritos ao admin.
  const tabs = isOperator ? ALL_TABS.filter((t) => t.id === "frota") : ALL_TABS;
  const [tab, setTab] = useState<Tab>("frota");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary-lighter)] to-[var(--color-primary-light)] p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="text-3xl font-bold text-[var(--color-primary-active)]">
            🖨️ Impressoras 3D
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            {isOperator
              ? "Escolha uma impressora para iniciar ou finalizar uma produção"
              : "Ciclo de produção, perdas de filamento e manutenção preventiva da frota"}
          </p>

          {tabs.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
              {tabs.map((t) => (
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
          )}
        </div>

        {tab === "frota" && <FleetPanel canManagePrinters={!isOperator} />}
        {!isOperator && tab === "catalogo" && <CatalogPanel />}
        {!isOperator && tab === "manutencao" && <MaintenancePanel />}
        {!isOperator && tab === "relatorios" && <ReportsPanel />}
        {!isOperator && tab === "operadores" && <OperatorsPanel />}
      </div>
    </div>
  );
};

export default AdminPrintFarmPage;
