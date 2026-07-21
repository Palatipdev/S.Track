"use client";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useSubmitGuard } from "@/lib/useSubmitGuard";
import { fetchJson } from "@/lib/fetchJson";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";

type Item = {
  id: number;
  item_name: string;
  code: string | null;
  category: string;
  spec: string | null;
  base_unit: string;
  is_active: boolean;
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const { isSubmitting, guard } = useSubmitGuard();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [spec, setSpec] = useState("");
  const [unit, setUnit] = useState("");

  async function fetchItems() {
    const token = await getToken();
    if (!token) return;
    setItems(await fetchJson<Item[]>(`${API_BASE}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    }));
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    guard(async () => {
      const token = await getToken();
      if (!token) return;

      await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          code: code || null,
          category,
          spec: spec || null,
          unit,
          is_active: true,
        }),
      });

      setShowAddModal(false);
      setName("");
      setCode("");
      setCategory("");
      setSpec("");
      setUnit("");
      fetchItems();
    });
  }

  return (
    <div>
      <PageHeader title="Items" formCode="รายการวัสดุ">
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          Add Item
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-2 font-semibold">Name</th>
              <th className="px-4 py-2 font-semibold">Code</th>
              <th className="px-4 py-2 font-semibold">Category</th>
              <th className="px-4 py-2 font-semibold">Spec</th>
              <th className="px-4 py-2 font-semibold">Unit</th>
              <th className="px-4 py-2 font-semibold">Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-rule">
                <td className="px-4 py-3">{item.item_name}</td>
                <td className="px-4 py-3 font-mono text-mute">{item.code ?? "—"}</td>
                <td className="px-4 py-3 text-mute">{item.category}</td>
                <td className="px-4 py-3 text-mute">{item.spec ?? "—"}</td>
                <td className="px-4 py-3 text-mute">{item.base_unit}</td>
                <td className="px-4 py-3">{item.is_active ? "Yes" : "No"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-mute">
                  No items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleAddItem}
            className="card w-full max-w-md p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Add Item</h2>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-mute">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="field"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-mute">Code (optional)</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="field"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-mute">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                placeholder="ก่อสร้าง / ไฟฟ้า / ประปา / เครื่องมือ"
                className="field"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-mute">Spec (optional)</label>
              <input
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                className="field"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-mute">Unit</label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                placeholder="ตัว / ถุง / เมตร"
                className="field"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
