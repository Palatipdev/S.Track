"use client";
import { getToken } from "@/lib/auth";
import { useSubmitGuard } from "@/lib/useSubmitGuard";
import { fetchJson } from "@/lib/fetchJson";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

type PurchaseOrder = {
  id: number;
  po_number: string;
  supplier_id: number;
  project_id: number | null;
};

type POItem = {
  id: number;
  item_id: number;
  item_qty: string;
  location: number;
};

type Item = { id: number; item_name: string; spec: string | null };
type StorageLocation = { id: number; name: string };
type Project = { id: number; name: string };
type Supplier = { id: number; name: string };

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
  return (
    <Suspense fallback={<p className="text-mute">Loading…</p>}>
      <ReceiveForm />
    </Suspense>
  );
}

function ReceiveForm() {
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
  const { isSubmitting, guard } = useSubmitGuard();
  const [projects, setProjects] = useState<Project[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  async function fetchData() {
    const token = await getToken();
    if (!token || !poId) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [allPOs, fetchedPOItems, fetchedItems, fetchedLocations, fetchedProjects, fetchedSuppliers] = await Promise.all([
      fetchJson<PurchaseOrder[]>("http://localhost:8000/purchase-orders", { headers }),
      fetchJson<POItem[]>(`http://localhost:8000/purchase-orders/${poId}/po-items`, { headers }),
      fetchJson<Item[]>("http://localhost:8000/items", { headers }),
      fetchJson<StorageLocation[]>("http://localhost:8000/storage_location", { headers }),
      fetchJson<Project[]>("http://localhost:8000/projects", { headers }),
      fetchJson<Supplier[]>("http://localhost:8000/suppliers", { headers }),
    ]);

    setPO(allPOs.find((p) => p.id === Number(poId)) ?? null);

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

    setItems(fetchedItems);
    setLocations(fetchedLocations);
    setProjects(fetchedProjects);
    setSuppliers(fetchedSuppliers);
  }

  useEffect(() => {
    fetchData();
  }, [poId]);

  function findItem(itemId: number) {
    return items.find((i) => i.id === itemId);
  }
  function findProject(projectId: number | null) {
    if (projectId === null) return "—";
    return projects.find((p) => p.id === projectId)?.name ?? "—";
  }
  function findSupplier(supplierId: number) {
    return suppliers.find((s) => s.id === supplierId)?.name ?? "—";
  }

  function updateLine(index: number, field: keyof LineDraft, value: string | boolean) {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    guard(async () => {
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
    });
  }

  if (!poId) {
    return <p className="text-mute">No PO selected. Go to a purchase order and click &quot;Receive against this PO&quot;.</p>;
  }

  if (!po) {
    return <p className="text-mute">Loading…</p>;
  }

  return (
    <div>
      <PageHeader
        title={`Receive — ${po.po_number}`}
        formCode="FM-003 ใบรับวัสดุ"
        subtitle={`${findSupplier(po.supplier_id)} · ${findProject(po.project_id)}`}
      />

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="mb-1 block text-sm text-mute">Receiving Location</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
            className="field md:w-64"
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
            <div key={poItem.id} className="card mb-4 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{item?.item_name ?? `Item #${poItem.item_id}`}</div>
                  <div className="text-xs text-mute">{item?.spec} · Ordered {Number(poItem.item_qty).toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <label className="mb-1 block text-xs text-mute">Received Qty</label>
                  <input
                    value={line.received_qty}
                    onChange={(e) => updateLine(i, "received_qty", e.target.value)}
                    required
                    className="field px-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-mute">Accepted Qty</label>
                  <input
                    value={line.accepted_qty}
                    onChange={(e) => updateLine(i, "accepted_qty", e.target.value)}
                    required
                    className="field px-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-mute">Rejected Qty</label>
                  <input
                    value={line.rejected_qty}
                    onChange={(e) => updateLine(i, "rejected_qty", e.target.value)}
                    required
                    className="field px-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="mb-1 block text-xs text-mute">Condition</label>
                  <select
                    value={line.condition}
                    onChange={(e) => updateLine(i, "condition", e.target.value)}
                    className="field px-2"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-mute">Note</label>
                  <input
                    value={line.condition_note}
                    onChange={(e) => updateLine(i, "condition_note", e.target.value)}
                    className="field px-2"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-mute">
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
          <label className="mb-1 block text-sm text-mute">Receipt Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? "Submitting..." : "Submit Receipt"}
        </button>
      </form>
    </div>
  );
}
