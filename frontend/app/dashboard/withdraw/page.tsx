"use client";
import { getToken } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type StorageLocation = { id: number; name: string };
type Project = { id: number; name: string };
type Item = { id: number; item_name: string; spec: string | null };
type StockLevel = { item_id: number; location_id: number; qty: string };

type LineDraft = { item_id: string; quantity: string };

export default function WithdrawPage() {
  const router = useRouter();

  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);

  const [locationId, setLocationId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([{ item_id: "", quantity: "" }]);

  async function fetchLocationsAndProjects() {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [locRes, projRes, itemsRes] = await Promise.all([
      fetch("http://localhost:8000/storage_location", { headers }),
      fetch("http://localhost:8000/projects", { headers }),
      fetch("http://localhost:8000/items", { headers }),
    ]);

    setLocations(await locRes.json());
    setProjects(await projRes.json());
    setItems(await itemsRes.json());
  }

  async function fetchStockLevels() {
    if (!locationId) {
      setStockLevels([]);
      return;
    }
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const res = await fetch(`http://localhost:8000/stock_level/${locationId}`, { headers });
    setStockLevels(await res.json());
  }

  useEffect(() => {
    fetchLocationsAndProjects();
  }, []);

  useEffect(() => {
    fetchStockLevels();
  }, [locationId]);

  function findItem(itemId: number) {
    return items.find((i) => i.id === itemId);
  }

  function stockFor(itemId: string) {
    const level = stockLevels.find((s) => s.item_id === Number(itemId));
    return level ? Number(level.qty) : 0;
  }

  function addLine() {
    setLines([...lines, { item_id: "", quantity: "" }]);
  }

  function updateLine(index: number, field: keyof LineDraft, value: string) {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = await getToken();
    if (!token) return;

    await fetch("http://localhost:8000/withdrawal", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        project_id: Number(projectId),
        location_id: Number(locationId),
        withdrawalLines: lines.map((l) => ({
          item_id: Number(l.item_id),
          quantity: Number(l.quantity),
        })),
      }),
    });

    router.push("/dashboard/stock");
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Withdraw</h1>
      <p className="mb-6 text-sm text-neutral-500">FM-004 ใบเบิกวัสดุ</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Location</label>
            <select
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setLines([{ item_id: "", quantity: "" }]);
              }}
              required
              className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
            >
              <option value="">Select location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-400">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!locationId && <p className="mb-4 text-sm text-neutral-500">Select a location to see available stock.</p>}

        {locationId && (
          <>
            <div className="mb-2 text-sm text-neutral-400">Items</div>
            {lines.map((line, i) => {
              const available = line.item_id ? stockFor(line.item_id) : null;
              const over = available !== null && Number(line.quantity) > available;
              return (
                <div key={i} className="mb-2 grid grid-cols-2 gap-2">
                  <select
                    value={line.item_id}
                    onChange={(e) => updateLine(i, "item_id", e.target.value)}
                    required
                    className="rounded-lg bg-neutral-800 px-2 py-2 text-sm text-white"
                  >
                    <option value="">Item</option>
                    {stockLevels.map((level) => {
                      const item = findItem(level.item_id);
                      return (
                        <option key={level.item_id} value={level.item_id}>
                          {item?.item_name ?? `Item #${level.item_id}`} ({Number(level.qty).toFixed(2)} available)
                        </option>
                      );
                    })}
                  </select>
                  <div>
                    <input
                      placeholder="Quantity"
                      value={line.quantity}
                      onChange={(e) => updateLine(i, "quantity", e.target.value)}
                      required
                      className="w-full rounded-lg bg-neutral-800 px-2 py-2 text-sm text-white"
                    />
                    {over && (
                      <p className="mt-1 text-xs text-amber-400">
                        Exceeds available stock ({available?.toFixed(2)})
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addLine}
              className="mb-4 text-sm text-blue-400 hover:underline"
            >
              + Add item
            </button>
          </>
        )}

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Submit Withdrawal
        </button>
      </form>
    </div>
  );
}
