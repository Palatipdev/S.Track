"use client";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function dashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [addRequest, setAddRequest] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [itemsMap, setItemsMap] = useState<Record<number, any[]>>({});

  const [gpsLat, setGPSLat] = useState<number | null>(null);
  const [gpsLng, setGPSLng] = useState<number | null>(null);
  const [receivedQty, setReceivedQty] = useState<Record<number, number>>({});

  const [expandedOrder, setExpandedOrder] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const [projectId, setProjectId] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [reason, setReason] = useState("");

  const [items, setItems] = useState<
    { item_name: string; quantity: number; unit: string }[]
  >([]);
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnit, setItemUnit] = useState("");

  // Delivery photo
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [confirmDeliveryId, setConfirmDeliveryId] = useState<number | null>(
    null,
  );

  // Add purchase order
  const [addOrder, setAddOrder] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedRequestItems, setSelectedRequestItems] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [unitCosts, setUnitCosts] = useState<Record<number, string>>({});
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const getSupabaseToken = async () => {
    // fetching the current session
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      console.error("No active session found", error);
      return null;
    }
    const token = data.session.access_token;
    return token;
  };

  async function fetchOrderItems(order_id: number) {
    const token = await getSupabaseToken();
    if (!token) return;
    const response = await fetch(
      `http://localhost:8000/purchase-orders/${order_id}/items`,
      {
        headers: { Authorization: `Bearer ${token}` },
        method: "GET",
      },
    );
    const data = await response.json();
    setSelectedOrderItems(data);
    setSelectedOrderId(order_id);
  }

  function addItem() {
    setItems([
      ...items,
      {
        item_name: itemName,
        quantity: parseInt(itemQuantity),
        unit: itemUnit,
      },
    ]);
    setItemName("");
    setItemQuantity("");
    setItemUnit("");
  }
  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        fetchItems(id);
      }
      return next;
    });
  }
  async function fetchItems(requestId: number) {
    const token = await getSupabaseToken();
    if (!token) return;
    const response = await fetch(
      `http://localhost:8000/material-requests/${requestId}/items`,
      {
        headers: { Authorization: `Bearer ${token}` },
        method: "GET",
      },
    );
    const data = await response.json();
    setItemsMap((prev) => ({ ...prev, [requestId]: data }));
  }

  async function fetchData() {
    const token = await getSupabaseToken();
    if (!token) return;
    const response = await fetch(`http://localhost:8000/material-requests`, {
      headers: { Authorization: `Bearer ${token}` },
      method: "GET",
    });
    const data = await response.json();
    setRequests(data);
  }

  async function fetchPurchaseOrders() {
    const token = await getSupabaseToken();
    if (!token) return;
    const response = await fetch(`http://localhost:8000/purchase-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setPurchaseOrders(data);
  }

  async function fetchSuppliers() {
    const token = await getSupabaseToken();
    if (!token) return;
    const response = await fetch(`http://localhost:8000/suppliers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setSuppliers(data);
  }

  async function fetchRequestItems(requestId: number) {
    const token = await getSupabaseToken();
    if (!token) return;
    const response = await fetch(
      `http://localhost:8000/material-requests/${requestId}/items`,
      {
        headers: { Authorization: `Bearer ${token}` },
        method: "GET",
      },
    );
    const data = await response.json();
    setSelectedRequestItems(data);
    setSelectedRequestId(requestId);
  }

  async function handleAddOrder() {
    const token = await getSupabaseToken();
    if (!token) return;

    const orderItems = selectedRequestItems.map((item) => ({
      request_item_id: item.id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_cost: Number(unitCosts[item.id] || 0),
    }));

    const response = await fetch(`http://localhost:8000/purchase-orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        material_request_id: selectedRequestId,
        supplier_id: Number(supplierId),
        expected_delivery: expectedDelivery,
        items: orderItems,
      }),
    });
    if (response.ok) {
      setAddOrder(false);
      setSelectedRequestItems([]);
      setUnitCosts({});
      await fetchPurchaseOrders();
    }
  }

  async function handleDelivery() {
    const token = await getSupabaseToken();
    if (!token) return;

    const items = selectedOrderItems.map((selected) => ({
      order_item_id: selected.id,
      received_qty: receivedQty[selected.id],
    }));
    const response = await fetch(`http://localhost:8000/deliveries`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",

      body: JSON.stringify({
        purchase_order_id: selectedOrderId,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        items: items,
      }),
    });

    if (response.ok) {
      setExpandedOrder(false);
      await fetchPurchaseOrders();
      const data = await response.json();
      setConfirmDeliveryId(data.id);
    }
  }

  useEffect(() => {
    fetchData();
    fetchPurchaseOrders();
    fetchSuppliers();
    navigator.geolocation.getCurrentPosition((position) => {
      setGPSLat(position.coords.latitude);
      setGPSLng(position.coords.longitude);
    });
  }, []);

  async function handleAddRequest() {
    const token = await getSupabaseToken();
    if (!token) return;
    const response = await fetch(`http://localhost:8000/material-requests`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_id: parseInt(projectId),
        urgency,
        reason,
        items,
      }),
    });
    if (response.ok) {
      setAddRequest(false);
      await fetchData();
    }
  }

  async function approve(requestId: number, status: string) {
    const token = await getSupabaseToken();
    if (!token) return;
    const response = await fetch(
      `http://localhost:8000/material-requests/${requestId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    );
    if (response.ok) {
      await fetchData();
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("cant log out");
    } else {
      router.push("/login");
    }
  }

  async function uploadPicture(delivery_id: number) {
    const token = await getSupabaseToken();
    if (!token || currentFile == null) return;
    const fd = new FormData();
    fd.append("file", currentFile);
    const response = await fetch(
      `http://localhost:8000/deliveries/${delivery_id}/photos`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      },
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  function renderRequests(list: any[]) {
    return (
      <ul className="space-y-2">
        {list.map((req) => (
          <li
            key={req.id}
            onClick={() => toggleExpand(req.id)}
            className="cursor-pointer rounded-md border border-white/10 bg-white/5 p-3 hover:bg-white/10"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Project {req.project_id} — {req.status} — {req.urgency}
              </span>
              <button
                type="button"
                className="rounded bg-emerald-600 px-2 py-1 text-xs hover:bg-emerald-500"
                onClick={(e) => {
                  e.stopPropagation();
                  approve(req.id, "approved");
                }}
              >
                Approve
              </button>
              <button
                type="button"
                className="rounded bg-rose-600 px-2 py-1 text-xs hover:bg-rose-500"
                onClick={(e) => {
                  e.stopPropagation();
                  approve(req.id, "rejected");
                }}
              >
                Reject
              </button>
            </div>
            {expandedIds.has(req.id) && (
              <ul className="mt-2 space-y-1 border-l border-white/10 pl-4 text-sm text-white/70">
                {(itemsMap[req.id] || []).map((item, idx) => (
                  <li key={idx}>
                    {item.item_name} — {item.quantity} {item.unit}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    );
  }
  function renderOrders(list: any[]) {
    return (
      <ul className="space-y-2">
        {list.map((purchase_order) => (
          <li
            key={purchase_order.order.id}
            className="rounded-md border border-white/10 bg-white/5 p-3"
          >
            Order #{purchase_order.order.id} — supplier{" "}
            {purchase_order.order.supplier_id} —{" "}
            {purchase_order.order.total_cost} — {purchase_order.order.status}
            <ul className="mt-2 space-y-1 border-l border-white/10 pl-4 text-sm">
              {purchase_order.item_variances.map((val: any, idx: number) => (
                <li
                  key={idx}
                  className={
                    Math.abs(val.variance_pct) > 10
                      ? "text-rose-400"
                      : "text-white/70"
                  }
                >
                  {val.request_item_id} — {val.item_name} — {val.quantity} —{" "}
                  {val.variance_pct?.toFixed(1)}%
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-neutral-950/95 px-6 py-4 backdrop-blur">
        <h1 className="text-lg font-semibold">S.Track Dashboard</h1>
        <button
          onClick={signOut}
          className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
        >
          Sign out
        </button>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-6 py-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAddRequest(true)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
          >
            + Add Request
          </button>
          <button
            onClick={() => setAddOrder(true)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
          >
            + Add Purchase Order
          </button>
          <button
            onClick={() => setExpandedOrder(true)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
          >
            + Confirm Delivery
          </button>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/50">
            Pending
          </h2>
          {renderRequests(pending)}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/50">
            Approved
          </h2>
          {renderRequests(approved)}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/50">
            Rejected
          </h2>
          {renderRequests(rejected)}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/50">
            Orders
          </h2>
          {renderOrders(purchaseOrders)}
        </section>

        {confirmDeliveryId && (
          <section className="rounded-md border border-white/10 bg-white/5 p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/50">
              Upload Delivery Photo
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setCurrentFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              ></input>
              <button
                onClick={() => uploadPicture(confirmDeliveryId)}
                className="rounded bg-emerald-600 px-3 py-1.5 text-sm hover:bg-emerald-500"
              >
                Confirm Photos
              </button>
            </div>
          </section>
        )}
      </div>

      {addRequest && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-neutral-900 p-5 shadow-xl">
            <form
              className="space-y-3"
              onSubmit={handleAddRequest}
            >
              <input
                type="number"
                placeholder="project-id"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded border border-white/10 bg-white/5 p-2 text-sm"
              ></input>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded border border-white/10 bg-neutral-800 p-2 text-sm text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <input
                type="text"
                placeholder="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded border border-white/10 bg-white/5 p-2 text-sm"
              ></input>
              <ul className="space-y-1 text-sm text-white/70">
                {items.map((item, idx) => (
                  <li key={idx}>
                    {item.item_name} - {item.quantity} - {item.unit}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="item name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="flex-1 rounded border border-white/10 bg-white/5 p-2 text-sm"
                ></input>
                <input
                  type="number"
                  placeholder="item quantity"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-24 rounded border border-white/10 bg-white/5 p-2 text-sm"
                ></input>
                <input
                  type="text"
                  placeholder="unit"
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="w-20 rounded border border-white/10 bg-white/5 p-2 text-sm"
                ></input>
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded bg-white/10 px-3 text-sm hover:bg-white/20"
                >
                  +
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddRequest(false)}
                  className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addOrder && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-neutral-900 p-5 shadow-xl">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddOrder();
              }}
            >
              <select
                onChange={(e) => fetchRequestItems(Number(e.target.value))}
                className="w-full rounded border border-white/10 bg-neutral-800 p-2 text-sm text-white"
              >
                <option value="">-- select approved request --</option>
                {approved.map((req) => (
                  <option key={req.id} value={req.id}>
                    Request #{req.id} — project {req.project_id}
                  </option>
                ))}
              </select>

              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded border border-white/10 bg-neutral-800 p-2 text-sm text-white"
              >
                <option value="">-- select supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full rounded border border-white/10 bg-white/5 p-2 text-sm"
              ></input>

              <ul className="space-y-2 text-sm">
                {selectedRequestItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="flex-1">
                      {item.item_name} — {item.quantity} {item.unit}
                    </span>
                    <input
                      type="number"
                      value={unitCosts[item.id] || ""}
                      placeholder="Unit cost"
                      onChange={(e) =>
                        setUnitCosts((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      className="w-28 rounded border border-white/10 bg-white/5 p-1.5 text-sm"
                    ></input>
                  </li>
                ))}
              </ul>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOrder(false)}
                  className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {expandedOrder && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-neutral-900 p-5 shadow-xl">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleDelivery();
              }}
            >
              <select
                onChange={(e) => fetchOrderItems(Number(e.target.value))}
                className="w-full rounded border border-white/10 bg-neutral-800 p-2 text-sm text-white"
              >
                <option value="">-- select order --</option>
                {purchaseOrders.map((o) => (
                  <option key={o.order.id} value={o.order.id}>
                    Order #{o.order.id}
                  </option>
                ))}
              </select>
              <ul className="space-y-2 text-sm">
                {selectedOrderItems.map((selected) => (
                  <li key={selected.id} className="flex items-center gap-2">
                    <span className="flex-1">
                      {selected.item_name}
                    </span>
                    <input
                      type="number"
                      value={receivedQty[selected.id] || ""}
                      placeholder="Quantity"
                      onChange={(e) =>
                        setReceivedQty((prev) => ({
                          ...prev,
                          [selected.id]: Number(e.target.value),
                        }))
                      }
                      className="w-28 rounded border border-white/10 bg-white/5 p-1.5 text-sm"
                    ></input>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExpandedOrder(false)}
                  className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
                >
                  Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
