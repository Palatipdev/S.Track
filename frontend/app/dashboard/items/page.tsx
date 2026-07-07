"use client";
import { getToken } from "@/lib/auth";
import { useSubmitGuard } from "@/lib/useSubmitGuard";
import { useState, useEffect } from "react";

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
    const res = await fetch("http://localhost:8000/items", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(await res.json());
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    guard(async () => {
      const token = await getToken();
      if (!token) return;

      await fetch("http://localhost:8000/items", {
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Items</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Add Item
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2 font-normal">Name</th>
              <th className="px-4 py-2 font-normal">Code</th>
              <th className="px-4 py-2 font-normal">Category</th>
              <th className="px-4 py-2 font-normal">Spec</th>
              <th className="px-4 py-2 font-normal">Unit</th>
              <th className="px-4 py-2 font-normal">Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-neutral-800">
                <td className="px-4 py-3">{item.item_name}</td>
                <td className="px-4 py-3 text-neutral-400">{item.code ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-400">{item.category}</td>
                <td className="px-4 py-3 text-neutral-400">{item.spec ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-400">{item.base_unit}</td>
                <td className="px-4 py-3">{item.is_active ? "Yes" : "No"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  No items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleAddItem}
            className="w-full max-w-md rounded-xl bg-neutral-900 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Add Item</h2>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-neutral-400">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-neutral-400">Code (optional)</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-neutral-400">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                placeholder="ก่อสร้าง / ไฟฟ้า / ประปา / เครื่องมือ"
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-neutral-400">Spec (optional)</label>
              <input
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-neutral-400">Unit</label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                placeholder="ตัว / ถุง / เมตร"
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
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
