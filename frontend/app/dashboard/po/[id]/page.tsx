"use client";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

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

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function POdetail() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id;

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [poItems, setPOItems] = useState<POItem[]>([]);

  async function fetchPO() {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [poRes, itemsRes] = await Promise.all([
      fetch("http://localhost:8000/purchase-orders", { headers }),
      fetch(`http://localhost:8000/purchase-orders/${poId}/po-items`, { headers }),
    ]);

    const allPOs: PurchaseOrder[] = await poRes.json();
    setPO(allPOs.find((p) => p.id === Number(poId)) ?? null);
    setPOItems(await itemsRes.json());
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
            <div className="text-xs">Supplier ID</div>
            <div className="text-white">{po.supplier_id}</div>
          </div>
          <div>
            <div className="text-xs">Project ID</div>
            <div className="text-white">{po.project_id ?? "—"}</div>
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-medium text-neutral-400">Line Items</h2>
      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2 font-normal">Item ID</th>
              <th className="px-4 py-2 font-normal">Ordered Qty</th>
              <th className="px-4 py-2 font-normal">Unit Price</th>
              <th className="px-4 py-2 font-normal">Destination Location</th>
            </tr>
          </thead>
          <tbody>
            {poItems.map((line) => (
              <tr key={line.id} className="border-t border-neutral-800">
                <td className="px-4 py-3">{line.item_id}</td>
                <td className="px-4 py-3">{Number(line.item_qty).toFixed(2)}</td>
                <td className="px-4 py-3">${Number(line.price).toFixed(2)}</td>
                <td className="px-4 py-3">{line.location}</td>
              </tr>
            ))}
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
