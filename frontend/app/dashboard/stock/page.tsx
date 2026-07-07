"use client";
import { getToken } from "@/lib/auth";
import { useState, useEffect } from "react";

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

    const [locRes, itemsRes] = await Promise.all([
      fetch("http://localhost:8000/storage_location", { headers }),
      fetch("http://localhost:8000/items", { headers }),
    ]);

    setLocations(await locRes.json());
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
      <h1 className="mb-6 text-xl font-semibold">Stock</h1>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Location</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white md:w-64"
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-400">Search by name</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. ไม้สัก"
            className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white md:w-64"
          />
        </div>
      </div>

      {!locationId && <p className="text-neutral-500">Select a location to view stock.</p>}

      {locationId && (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-left text-neutral-400">
              <tr>
                <th className="px-4 py-2 font-normal">Item</th>
                <th className="px-4 py-2 font-normal">Spec</th>
                <th className="px-4 py-2 font-normal">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((level) => {
                const item = findItem(level.item_id);
                const negative = Number(level.qty) < 0;
                return (
                  <tr key={level.item_id} className="border-t border-neutral-800">
                    <td className="px-4 py-3">{item?.item_name ?? `Item #${level.item_id}`}</td>
                    <td className="px-4 py-3 text-neutral-400">{item?.spec ?? "—"}</td>
                    <td className={`px-4 py-3 ${negative ? "text-red-400 font-medium" : ""}`}>
                      {Number(level.qty).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
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
