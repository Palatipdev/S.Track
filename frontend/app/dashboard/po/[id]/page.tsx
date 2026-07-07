"use client";
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
      fetchJson<PurchaseOrder[]>("http://localhost:8000/purchase-orders", { headers }),
      fetchJson<POItem[]>(`http://localhost:8000/purchase-orders/${poId}/po-items`, { headers }),
      fetchJson<Item[]>("http://localhost:8000/items", { headers }),
      fetchJson<StorageLocation[]>("http://localhost:8000/storage_location", { headers }),
      fetchJson<Supplier[]>("http://localhost:8000/suppliers", { headers }),
      fetchJson<Project[]>("http://localhost:8000/projects", { headers }),
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
    return <p className="text-neutral-500">Loading…</p>;
  }

  return (
    <div>
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 text-sm text-neutral-400 hover:text-white"
      >
        ← Back to Purchase Orders
      </button>

      <div className="mb-6 rounded-xl border border-neutral-800 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{po.po_number}</h1>
          <StatusChip status={po.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-neutral-400 md:grid-cols-4">
          <div>
            <div className="text-xs">Expected Delivery</div>
            <div className="text-white">{po.expected_delivery}</div>
          </div>
          <div>
            <div className="text-xs">Total</div>
            <div className="text-white">${Number(po.total_cost).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs">Supplier</div>
            <div className="text-white">{findSupplier(po.supplier_id)}</div>
          </div>
          <div>
            <div className="text-xs">Project</div>
            <div className="text-white">{findProject(po.project_id)}</div>
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-medium text-neutral-400">Line Items</h2>
      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2 font-normal">Item</th>
              <th className="px-4 py-2 font-normal">Spec</th>
              <th className="px-4 py-2 font-normal">Item ID</th>
              <th className="px-4 py-2 font-normal">Ordered Qty</th>
              <th className="px-4 py-2 font-normal">Unit Price</th>
              <th className="px-4 py-2 font-normal">Destination Location</th>
            </tr>
          </thead>
          <tbody>
            {poItems.map((line) => {
              const item = findItem(line.item_id);
              const location = findLocation(line.location);
              return (
                <tr key={line.id} className="border-t border-neutral-800">
                  <td className="px-4 py-3">{item?.item_name ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-400">{item?.spec ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">{line.item_id}</td>
                  <td className="px-4 py-3">{Number(line.item_qty).toFixed(2)}</td>
                  <td className="px-4 py-3">${Number(line.price).toFixed(2)}</td>
                  <td className="px-4 py-3">{location?.name ?? line.location}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => router.push(`/dashboard/receive?po_id=${po.id}`)}
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
      >
        Receive against this PO
      </button>
    </div>
  );
}
