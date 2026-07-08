"use client";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";
import { useSubmitGuard } from "@/lib/useSubmitGuard";
import { fetchJson } from "@/lib/fetchJson";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

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
  open: "border-ink/40 bg-ink-soft text-ink-deep",
  partially_received: "border-amber-300 bg-amber-50 text-amber-700",
  received: "border-emerald-300 bg-emerald-50 text-emerald-700",
  closed: "border-neutral-300 bg-neutral-100 text-neutral-500",
  cancelled: "border-red-300 bg-red-50 text-red-700",
};

function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${STATUS_STYLES[status] ?? "border-neutral-300 bg-neutral-100 text-neutral-500"}`}>
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
        <h2 className="mb-3 text-sm font-medium text-mute">{title}</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-2 font-semibold">PO Number</th>
                <th className="px-4 py-2 font-semibold">Supplier</th>
                <th className="px-4 py-2 font-semibold">Project</th>
                <th className="px-4 py-2 font-semibold">Expected Delivery</th>
                <th className="px-4 py-2 font-semibold">Total</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id} className="border-t border-rule hover:bg-ink-soft/50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/po/${po.id}`} className="font-mono font-medium text-ink hover:underline">
                      {po.po_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-mute">{findSupplier(po.supplier_id)}</td>
                  <td className="px-4 py-3 text-mute">{findProject(po.project_id)}</td>
                  <td className="px-4 py-3 text-mute">{po.expected_delivery}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">฿{Number(po.total_cost).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
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
      <PageHeader title="Purchase Orders" formCode="ใบสั่งซื้อ">
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          Add Purchase Order
        </button>
      </PageHeader>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-mute">Open</div>
          <div className="text-2xl font-semibold tabular-nums">{open.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-mute">Partially Received</div>
          <div className="text-2xl font-semibold tabular-nums">{partial.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-mute">Received</div>
          <div className="text-2xl font-semibold tabular-nums">{received.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-mute">Total Value</div>
          <div className="text-2xl font-semibold tabular-nums">฿{totalValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {renderGroup("Open", open)}
      {renderGroup("Partially Received", partial)}
      {renderGroup("Received", received)}
      {purchaseOrders.length === 0 && <p className="text-mute">No purchase orders yet.</p>}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleAddPO}
            className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Add Purchase Order</h2>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-mute">PO Number</label>
              <input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                required
                className="field"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-mute">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="field"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-mute">Project (optional)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="field"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-mute">Expected Delivery</label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                required
                className="field"
              />
            </div>

            <div className="mb-2 text-sm text-mute">Line Items</div>
            {lines.map((line, i) => (
              <div key={i} className="mb-2 grid grid-cols-4 gap-2">
                <select
                  value={line.item_id}
                  onChange={(e) => updateLine(i, "item_id", e.target.value)}
                  required
                  className="field px-2 text-xs"
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
                  className="field px-2 text-xs"
                />
                <input
                  placeholder="Price"
                  value={line.item_price}
                  onChange={(e) => updateLine(i, "item_price", e.target.value)}
                  required
                  className="field px-2 text-xs"
                />
                <select
                  value={line.location_id}
                  onChange={(e) => updateLine(i, "location_id", e.target.value)}
                  required
                  className="field px-2 text-xs"
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
              className="mb-4 cursor-pointer text-sm font-medium text-ink hover:underline"
            >
              + Add line
            </button>

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
