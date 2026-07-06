"use client";
import { getToken } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type PurchaseOrder = {
  id: number;
  po_number: string;
};

type POItem = {
  id: number;
  item_id: number;
  item_qty: string;
  location: number;
};

type Item = { id: number; item_name: string; spec: string | null };
type StorageLocation = { id: number; name: string };

type LineDraft = {
  po_item_id: number;
  received_qty: string;
  accepted_qty: string;
  rejected_qty: string;
  condition: string;
  condition_note: string;
  return_to_supplier: boolean;
};

const CONDITIONS = ["good", "damaged_package_unopened", "damaged", "wrong_item"];

export default function ReceivePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const poId = searchParams.get("po_id");

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [locationId, setLocationId] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);

  async function fetchData() {
    const token = await getToken();
    if (!token || !poId) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [poRes, poItemsRes, itemsRes, locRes] = await Promise.all([
      fetch("http://localhost:8000/purchase-orders", { headers }),
      fetch(`http://localhost:8000/purchase-orders/${poId}/po-items`, { headers }),
      fetch("http://localhost:8000/items", { headers }),
      fetch("http://localhost:8000/storage_location", { headers }),
    ]);

    const allPOs: PurchaseOrder[] = await poRes.json();
    setPO(allPOs.find((p) => p.id === Number(poId)) ?? null);

    const fetchedPOItems: POItem[] = await poItemsRes.json();
    setPOItems(fetchedPOItems);
    setLines(
      fetchedPOItems.map((line) => ({
        po_item_id: line.id,
        received_qty: "",
        accepted_qty: "",
        rejected_qty: "",
        condition: "good",
        condition_note: "",
        return_to_supplier: false,
      }))
    );

    setItems(await itemsRes.json());
    setLocations(await locRes.json());
  }

  useEffect(() => {
    fetchData();
  }, [poId]);

  function findItem(itemId: number) {
    return items.find((i) => i.id === itemId);
  }

  function updateLine(index: number, field: keyof LineDraft, value: string | boolean) {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = await getToken();
    if (!token || !po) return;

    await fetch("http://localhost:8000/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        po_id: po.id,
        location_id: Number(locationId),
        note: note || null,
        po_lines: lines.map((l) => ({
          po_item_id: l.po_item_id,
          received_qty: Number(l.received_qty),
          accepted_qty: Number(l.accepted_qty),
          rejected_qty: Number(l.rejected_qty),
          condition: l.condition,
          condition_note: l.condition_note || null,
          return_to_supplier: l.return_to_supplier,
        })),
      }),
    });

    router.push(`/dashboard/po/${po.id}`);
  }

  if (!poId) {
    return <p className="text-neutral-500">No PO selected. Go to a purchase order and click &quot;Receive against this PO&quot;.</p>;
  }

  if (!po) {
    return <p className="text-neutral-500">Loading…</p>;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Receive — {po.po_number}</h1>
      <p className="mb-6 text-sm text-neutral-500">FM-003 ใบรับวัสดุ</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="mb-1 block text-sm text-neutral-400">Receiving Location</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
            className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white md:w-64"
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        {poItems.map((poItem, i) => {
          const item = findItem(poItem.item_id);
          const line = lines[i];
          if (!line) return null;
          return (
            <div key={poItem.id} className="mb-4 rounded-xl border border-neutral-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{item?.item_name ?? `Item #${poItem.item_id}`}</div>
                  <div className="text-xs text-neutral-500">{item?.spec} · Ordered {Number(poItem.item_qty).toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <label className="mb-1 block text-xs text-neutral-400">Received Qty</label>
                  <input
                    value={line.received_qty}
                    onChange={(e) => updateLine(i, "received_qty", e.target.value)}
                    required
                    className="w-full rounded-lg bg-neutral-800 px-2 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-neutral-400">Accepted Qty</label>
                  <input
                    value={line.accepted_qty}
                    onChange={(e) => updateLine(i, "accepted_qty", e.target.value)}
                    required
                    className="w-full rounded-lg bg-neutral-800 px-2 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-neutral-400">Rejected Qty</label>
                  <input
                    value={line.rejected_qty}
                    onChange={(e) => updateLine(i, "rejected_qty", e.target.value)}
                    required
                    className="w-full rounded-lg bg-neutral-800 px-2 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="mb-1 block text-xs text-neutral-400">Condition</label>
                  <select
                    value={line.condition}
                    onChange={(e) => updateLine(i, "condition", e.target.value)}
                    className="w-full rounded-lg bg-neutral-800 px-2 py-2 text-sm text-white"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-neutral-400">Note</label>
                  <input
                    value={line.condition_note}
                    onChange={(e) => updateLine(i, "condition_note", e.target.value)}
                    className="w-full rounded-lg bg-neutral-800 px-2 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-400">
                <input
                  type="checkbox"
                  checked={line.return_to_supplier}
                  onChange={(e) => updateLine(i, "return_to_supplier", e.target.checked)}
                />
                Return to supplier
              </label>
            </div>
          );
        })}

        <div className="mb-6">
          <label className="mb-1 block text-sm text-neutral-400">Receipt Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Submit Receipt
        </button>
      </form>
    </div>
  );
}
