"use client";
import { API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { fetchJson } from "@/lib/fetchJson";

type PurchaseOrder = {
  id: number;
  po_number: string;
  supplier_id: number;
  project_id: number | null;
  expected_delivery: string;
  status: string;
  total_cost: string;
};

type POItem = {
  id: number;
  item_id: number;
  item_qty: string;
  price: string;
  location: number;
};

type Item = {
  id: number;
  item_name: string;
  spec: string | null;
};

type StorageLocation = {
  id: number;
  name: string;
};

type Supplier = { id: number; name: string };
type Project = { id: number; name: string };

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


export default function POdetail() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id;

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  async function fetchPO() {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [allPOs, fetchedPOItems, catalog, fetchedLocations, fetchedSuppliers, fetchedProjects] = await Promise.all([
      fetchJson<PurchaseOrder[]>(`${API_BASE}/purchase-orders`, { headers }),
      fetchJson<POItem[]>(`${API_BASE}/purchase-orders/${poId}/po-items`, { headers }),
      fetchJson<Item[]>(`${API_BASE}/items`, { headers }),
      fetchJson<StorageLocation[]>(`${API_BASE}/storage_location`, { headers }),
      fetchJson<Supplier[]>(`${API_BASE}/suppliers`, { headers }),
      fetchJson<Project[]>(`${API_BASE}/projects`, { headers }),
    ]);

    setPO(allPOs.find((p) => p.id === Number(poId)) ?? null);
    setPOItems(fetchedPOItems);
    setItems(catalog);
    setLocations(fetchedLocations);
    setSuppliers(fetchedSuppliers);
    setProjects(fetchedProjects);
  }

  function findItem(itemId: number) {
    return items.find((i) => i.id === itemId);
  }

  function findLocation(locationId: number) {
    return locations.find((l) => l.id === locationId);
  }

  function findSupplier(supplierId: number) {
    return suppliers.find((s) => s.id === supplierId)?.name ?? "—";
  }

  function findProject(projectId: number | null) {
    if (projectId === null) return "—";
    return projects.find((p) => p.id === projectId)?.name ?? "—";
  }

  useEffect(() => {
    fetchPO();
  }, [poId]);

  if (!po) {
    return <p className="text-mute">Loading…</p>;
  }

  return (
    <div>
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 cursor-pointer text-sm text-mute hover:text-ink-deep"
      >
        ← Back to Purchase Orders
      </button>

      <div className="card mb-6 border-t-2 border-t-ink p-5">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="font-mono text-xl font-semibold">{po.po_number}</h1>
          <StatusChip status={po.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-mute md:grid-cols-4">
          <div>
            <div className="text-xs">Expected Delivery</div>
            <div className="text-body">{po.expected_delivery}</div>
          </div>
          <div>
            <div className="text-xs">Total</div>
            <div className="font-mono tabular-nums text-body">฿{Number(po.total_cost).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-xs">Supplier</div>
            <div className="text-body">{findSupplier(po.supplier_id)}</div>
          </div>
          <div>
            <div className="text-xs">Project</div>
            <div className="text-body">{findProject(po.project_id)}</div>
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-medium text-mute">Line Items</h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-2 font-semibold">Item</th>
              <th className="px-4 py-2 font-semibold">Spec</th>
              <th className="px-4 py-2 font-semibold">Item ID</th>
              <th className="px-4 py-2 font-semibold">Ordered Qty</th>
              <th className="px-4 py-2 font-semibold">Unit Price</th>
              <th className="px-4 py-2 font-semibold">Destination Location</th>
            </tr>
          </thead>
          <tbody>
            {poItems.map((line) => {
              const item = findItem(line.item_id);
              const location = findLocation(line.location);
              return (
                <tr key={line.id} className="border-t border-rule">
                  <td className="px-4 py-3">{item?.item_name ?? "—"}</td>
                  <td className="px-4 py-3 text-mute">{item?.spec ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-mute">{line.item_id}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{Number(line.item_qty).toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">฿{Number(line.price).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3">{location?.name ?? line.location}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => router.push(`/dashboard/receive?po_id=${po.id}`)}
        className="btn-primary mt-6"
      >
        Receive against this PO
      </button>
    </div>
  );
}
