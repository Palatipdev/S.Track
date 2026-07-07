"use client";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";
import { useSubmitGuard } from "@/lib/useSubmitGuard";
import { fetchJson } from "@/lib/fetchJson";

import Link from "next/link";

type PurchaseOrder = {
  id: number;
  po_number: string;
  supplier_id: number;
  project_id: number | null;
  expected_delivery: string;
  status: string;
  total_cost: string;
};

type Supplier = { id: number; name: string };
type Project = { id: number; name: string };
type Item = { id: number; item_name: string };
type StorageLocation = { id: number; name: string };

const STATUS_STYLES: Record<string, string> = {
  open: "bg-neutral-700 text-neutral-100",
  partially_received: "bg-amber-900 text-amber-200",
  received: "bg-emerald-900 text-emerald-200",
  closed: "bg-neutral-800 text-neutral-400",
  cancelled: "bg-red-900 text-red-200",
};

function StatusChip({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-neutral-800"}`}>
      {status.replace("_", " ")}
    </span>
  );
}



export default function DashboardPO() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const { isSubmitting, guard } = useSubmitGuard();

  const [poNumber, setPoNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [lines, setLines] = useState([{ item_id: "", item_qty: "", item_price: "", location_id: "" }]);

  async function fetchAll() {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [fetchedPOs, fetchedSuppliers, fetchedProjects, fetchedItems, fetchedLocations] = await Promise.all([
      fetchJson<PurchaseOrder[]>("http://localhost:8000/purchase-orders", { headers }),
      fetchJson<Supplier[]>("http://localhost:8000/suppliers", { headers }),
      fetchJson<Project[]>("http://localhost:8000/projects", { headers }),
      fetchJson<Item[]>("http://localhost:8000/items", { headers }),
      fetchJson<StorageLocation[]>("http://localhost:8000/storage_location", { headers }),
    ]);

    setPurchaseOrders(fetchedPOs);
    setSuppliers(fetchedSuppliers);
    setProjects(fetchedProjects);
    setItems(fetchedItems);
    setLocations(fetchedLocations);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const open = purchaseOrders.filter((x) => x.status === "open");
  const partial = purchaseOrders.filter((x) => x.status === "partially_received");
  const received = purchaseOrders.filter((x) => x.status === "received");
  const totalValue = purchaseOrders.reduce((sum, po) => sum + Number(po.total_cost), 0);

  function addLine() {
    setLines([...lines, { item_id: "", item_qty: "", item_price: "", location_id: "" }]);
  }

  function updateLine(index: number, field: string, value: string) {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  }

  async function handleAddPO(e: React.FormEvent) {
    e.preventDefault();
    guard(async () => {
      const token = await getToken();
      if (!token) return;

      await fetch("http://localhost:8000/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          po_number: poNumber,
          supplier_id: Number(supplierId),
          project_id: projectId ? Number(projectId) : null,
          expected_delivery: expectedDelivery,
          po_items: lines.map((l) => ({
            item_id: Number(l.item_id),
            item_qty: Number(l.item_qty),
            item_price: Number(l.item_price),
            location_id: Number(l.location_id),
          })),
        }),
      });

      setShowAddModal(false);
      setPoNumber("");
      setSupplierId("");
      setProjectId("");
      setExpectedDelivery("");
      setLines([{ item_id: "", item_qty: "", item_price: "", location_id: "" }]);
      fetchAll();
    });
  }

  function findSupplier(id: number) {
    return suppliers.find((s) => s.id === id)?.name ?? "—";
  }

  function findProject(id: number | null) {
    if (id === null) return "—";
    return projects.find((p) => p.id === id)?.name ?? "—";
  }

  function renderGroup(title: string, orders: PurchaseOrder[]) {
    if (orders.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-neutral-400">{title}</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-left text-neutral-400">
              <tr>
                <th className="px-4 py-2 font-normal">PO Number</th>
                <th className="px-4 py-2 font-normal">Supplier</th>
                <th className="px-4 py-2 font-normal">Project</th>
                <th className="px-4 py-2 font-normal">Expected Delivery</th>
                <th className="px-4 py-2 font-normal">Total</th>
                <th className="px-4 py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id} className="border-t border-neutral-800 hover:bg-neutral-900">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/po/${po.id}`} className="text-blue-400 hover:underline">
                      {po.po_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{findSupplier(po.supplier_id)}</td>
                  <td className="px-4 py-3 text-neutral-400">{findProject(po.project_id)}</td>
                  <td className="px-4 py-3 text-neutral-400">{po.expected_delivery}</td>
                  <td className="px-4 py-3 text-neutral-400">${Number(po.total_cost).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <StatusChip status={po.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Purchase Orders</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Add Purchase Order
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 p-4">
          <div className="text-xs text-neutral-400">Open</div>
          <div className="text-2xl font-semibold">{open.length}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 p-4">
          <div className="text-xs text-neutral-400">Partially Received</div>
          <div className="text-2xl font-semibold">{partial.length}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 p-4">
          <div className="text-xs text-neutral-400">Received</div>
          <div className="text-2xl font-semibold">{received.length}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 p-4">
          <div className="text-xs text-neutral-400">Total Value</div>
          <div className="text-2xl font-semibold">${totalValue.toFixed(2)}</div>
        </div>
      </div>

      {renderGroup("Open", open)}
      {renderGroup("Partially Received", partial)}
      {renderGroup("Received", received)}
      {purchaseOrders.length === 0 && <p className="text-neutral-500">No purchase orders yet.</p>}

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleAddPO}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-neutral-900 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Add Purchase Order</h2>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-neutral-400">PO Number</label>
              <input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                required
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-neutral-400">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-neutral-400">Project (optional)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-neutral-400">Expected Delivery</label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                required
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="mb-2 text-sm text-neutral-400">Line Items</div>
            {lines.map((line, i) => (
              <div key={i} className="mb-2 grid grid-cols-4 gap-2">
                <select
                  value={line.item_id}
                  onChange={(e) => updateLine(i, "item_id", e.target.value)}
                  required
                  className="rounded-lg bg-neutral-800 px-2 py-2 text-xs text-white"
                >
                  <option value="">Item</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.item_name}</option>
                  ))}
                </select>
                <input
                  placeholder="Qty"
                  value={line.item_qty}
                  onChange={(e) => updateLine(i, "item_qty", e.target.value)}
                  required
                  className="rounded-lg bg-neutral-800 px-2 py-2 text-xs text-white"
                />
                <input
                  placeholder="Price"
                  value={line.item_price}
                  onChange={(e) => updateLine(i, "item_price", e.target.value)}
                  required
                  className="rounded-lg bg-neutral-800 px-2 py-2 text-xs text-white"
                />
                <select
                  value={line.location_id}
                  onChange={(e) => updateLine(i, "location_id", e.target.value)}
                  required
                  className="rounded-lg bg-neutral-800 px-2 py-2 text-xs text-white"
                >
                  <option value="">Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={addLine}
              className="mb-4 text-sm text-blue-400 hover:underline"
            >
              + Add line
            </button>

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
