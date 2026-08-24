import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import type { Filament, Product, PrintProduct } from "../../../types";
import {
  createFilament,
  createPrintProduct,
  deleteFilament,
  deletePrintProduct,
  getFilaments,
  getPrintProducts,
  updateFilament,
  updatePrintProduct,
  type PrintProductFilamentInput,
} from "../../../services/printFarmService";
import { getProducts } from "../../../services/apiService";
import { formatBRL, formatGrams, formatMinutes } from "./printFarmUi";
import FilamentFormModal from "./FilamentFormModal";
import PrintProductFormModal from "./PrintProductFormModal";

const CatalogPanel: React.FC = () => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [printProducts, setPrintProducts] = useState<PrintProduct[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingFilament, setEditingFilament] = useState<Filament | null | undefined>(undefined);
  const [editingPrintProduct, setEditingPrintProduct] = useState<PrintProduct | null | undefined>(
    undefined,
  );

  const load = useCallback(async () => {
    try {
      const [filamentsData, productsData, catalog] = await Promise.all([
        getFilaments(),
        getPrintProducts(),
        getProducts(),
      ]);
      setFilaments(filamentsData);
      setPrintProducts(productsData);
      setCatalogProducts(catalog);
    } catch (error) {
      console.error("Erro ao carregar catálogo de impressão:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveFilament = async (data: {
    material: string;
    color?: string;
    brand?: string;
    cost_per_kg: number;
    stock_grams?: number;
  }) => {
    try {
      if (editingFilament) {
        await updateFilament(editingFilament.id, data);
      } else {
        await createFilament(data);
      }
      setEditingFilament(undefined);
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao salvar filamento", "error");
    }
  };

  const handleDeleteFilament = async (filament: Filament) => {
    const result = await Swal.fire({
      title: "Remover filamento?",
      text: `Deseja realmente remover "${filament.material}${filament.color ? ` — ${filament.color}` : ""}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteFilament(filament.id);
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao remover filamento", "error");
    }
  };

  const handleSavePrintProduct = async (data: {
    name: string;
    product_id?: string | null;
    size_variant?: string;
    units_per_plate: number;
    estimated_time_minutes: number;
    filaments: PrintProductFilamentInput[];
    manual_unit_price?: number | null;
  }) => {
    try {
      if (editingPrintProduct) {
        await updatePrintProduct(editingPrintProduct.id, data);
      } else {
        await createPrintProduct(data);
      }
      setEditingPrintProduct(undefined);
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao salvar perfil de produto", "error");
    }
  };

  const handleDeletePrintProduct = async (product: PrintProduct) => {
    const result = await Swal.fire({
      title: "Remover perfil?",
      text: `Deseja realmente remover "${product.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await deletePrintProduct(product.id);
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao remover perfil de produto", "error");
    }
  };

  if (loading) {
    return <p className="p-6 text-center text-stone-500">Carregando catálogo...</p>;
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">🧩 Perfis de impressão</h2>
          <button
            onClick={() => setEditingPrintProduct(null)}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)]"
          >
            ➕ Novo perfil
          </button>
        </div>
        {printProducts.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-stone-500 shadow">
            Nenhum perfil cadastrado. Cadastre o primeiro produto que vai rodar nas impressoras.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {printProducts.map((p) => (
              <div key={p.id} className="rounded-xl bg-white p-4 shadow-lg">
                <p className="font-bold text-stone-800">{p.name}</p>
                <p className="text-xs text-stone-400">{p.size_variant || "—"}</p>
                <p className="mt-2 text-sm text-stone-600">
                  {p.units_per_plate} peças/chapa · {formatMinutes(p.estimated_time_minutes)}
                </p>
                {p.filaments.length === 0 ? (
                  <p className="text-sm text-amber-600">sem filamento cadastrado</p>
                ) : (
                  <ul className="text-sm text-stone-600">
                    {p.filaments.map((f) => (
                      <li key={f.filament_id}>
                        {f.material}
                        {f.color ? ` (${f.color})` : ""} · {formatGrams(f.grams_per_plate)}/chapa
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setEditingPrintProduct(p)}
                    className="flex-1 rounded-lg bg-[var(--color-primary)] py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)]"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeletePrintProduct(p)}
                    className="flex-1 rounded-lg bg-[var(--color-accent)] py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-secondary)]"
                  >
                    🗑️ Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800">🧵 Filamentos</h2>
          <button
            onClick={() => setEditingFilament(null)}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)]"
          >
            ➕ Novo filamento
          </button>
        </div>
        {filaments.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-stone-500 shadow">
            Nenhum filamento cadastrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filaments.map((f) => (
              <div key={f.id} className="rounded-xl bg-white p-4 shadow-lg">
                <p className="font-bold text-stone-800">
                  {f.material} {f.color ? `— ${f.color}` : ""}
                </p>
                <p className="text-xs text-stone-400">{f.brand || "—"}</p>
                <p className="mt-2 text-sm text-stone-600">
                  {formatBRL(f.cost_per_kg)}/kg · estoque {formatGrams(f.stock_grams)}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setEditingFilament(f)}
                    className="flex-1 rounded-lg bg-[var(--color-primary)] py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)]"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteFilament(f)}
                    className="flex-1 rounded-lg bg-[var(--color-accent)] py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-secondary)]"
                  >
                    🗑️ Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editingFilament !== undefined && (
        <FilamentFormModal
          filament={editingFilament}
          onSave={handleSaveFilament}
          onCancel={() => setEditingFilament(undefined)}
        />
      )}

      {editingPrintProduct !== undefined && (
        <PrintProductFormModal
          printProduct={editingPrintProduct}
          filaments={filaments}
          catalogProducts={catalogProducts}
          onSave={handleSavePrintProduct}
          onCancel={() => setEditingPrintProduct(undefined)}
        />
      )}
    </div>
  );
};

export default CatalogPanel;
