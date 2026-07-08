"use client";
import { getToken } from "@/lib/auth";
import { useSubmitGuard } from "@/lib/useSubmitGuard";
import { fetchJson } from "@/lib/fetchJson";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

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
  const { isSubmitting, guard } = useSubmitGuard();

  async function fetchLocationsAndProjects() {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [fetchedLocations, fetchedProjects, fetchedItems] = await Promise.all([
      fetchJson<StorageLocation[]>("http://localhost:8000/storage_location", { headers }),
      fetchJson<Project[]>("http://localhost:8000/projects", { headers }),
      fetchJson<Item[]>("http://localhost:8000/items", { headers }),
    ]);

    setLocations(fetchedLocations);
    setProjects(fetchedProjects);
    setItems(fetchedItems);
  }

  async function fetchStockLevels() {
    if (!locationId) {
      setStockLevels([]);
      return;
    }
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    setStockLevels(await fetchJson<StockLevel[]>(`http://localhost:8000/stock_level/${locationId}`, { headers }));
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
    guard(async () => {
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
    });
  }

  return (
    <div>
      <PageHeader title="Withdraw" formCode="FM-004 ใบเบิกวัสดุ" />

      <form onSubmit={handleSubmit}>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-mute">Location</label>
            <select
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setLines([{ item_id: "", quantity: "" }]);
              }}
              required
              className="field"
            >
              <option value="">Select location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-mute">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="field"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!locationId && <p className="mb-4 text-sm text-mute">Select a location to see available stock.</p>}

        {locationId && (
          <>
            <div className="mb-2 text-sm text-mute">Items</div>
            {lines.map((line, i) => {
              const available = line.item_id ? stockFor(line.item_id) : null;
              const over = available !== null && Number(line.quantity) > available;
              return (
                <div key={i} className="mb-2 grid grid-cols-2 gap-2">
                  <select
                    value={line.item_id}
                    onChange={(e) => updateLine(i, "item_id", e.target.value)}
                    required
                    className="field px-2"
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
                      className="field px-2"
                    />
                    {over && (
                      <p className="mt-1 text-xs font-medium text-amber-700">
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
              className="mb-4 cursor-pointer text-sm font-medium text-ink hover:underline"
            >
              + Add item
            </button>
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? "Submitting..." : "Submit Withdrawal"}
        </button>
      </form>
    </div>
  );
}
