"use client";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { fetchJson } from "@/lib/fetchJson";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";

type StorageLocation = { id: number; name: string };
type Item = { id: number; item_name: string; spec: string | null };
type StockLevel = { item_id: number; location_id: number; qty: string };

export default function StockPage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [locationId, setLocationId] = useState("");
  const [search, setSearch] = useState("");

  async function fetchLocationsAndItems() {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [fetchedLocations, fetchedItems] = await Promise.all([
      fetchJson<StorageLocation[]>(`${API_BASE}/storage_location`, { headers }),
      fetchJson<Item[]>(`${API_BASE}/items`, { headers }),
    ]);

    setLocations(fetchedLocations);
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

    setStockLevels(await fetchJson<StockLevel[]>(`${API_BASE}/stock_level/${locationId}`, { headers }));
  }

  useEffect(() => {
    fetchLocationsAndItems();
  }, []);

  useEffect(() => {
    fetchStockLevels();
  }, [locationId]);

  function findItem(itemId: number) {
    return items.find((i) => i.id === itemId);
  }

  const filteredStock = stockLevels.filter((level) => {
    const item = findItem(level.item_id);
    if (!search) return true;
    return item?.item_name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <PageHeader title="Stock" formCode="ยอดวัสดุคงเหลือ" />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end">
        <div>
          <label className="mb-1 block text-sm text-mute">Location</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="field md:w-64"
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-mute">Search by name</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. ไม้สัก"
            className="field md:w-64"
          />
        </div>
      </div>

      {!locationId && <p className="text-mute">Select a location to view stock.</p>}

      {locationId && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-2 font-semibold">Item</th>
                <th className="px-4 py-2 font-semibold">Spec</th>
                <th className="px-4 py-2 font-semibold">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((level) => {
                const item = findItem(level.item_id);
                const negative = Number(level.qty) < 0;
                return (
                  <tr key={level.item_id} className="border-t border-rule">
                    <td className="px-4 py-3">{item?.item_name ?? `Item #${level.item_id}`}</td>
                    <td className="px-4 py-3 text-mute">{item?.spec ?? "—"}</td>
                    <td className={`px-4 py-3 font-mono tabular-nums ${negative ? "font-medium text-red-600" : ""}`}>
                      {Number(level.qty).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-mute">
                    No stock at this location.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
