"use client";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPO(){
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  async function fetchPO() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const token = session.access_token;

    const res = await fetch("http://localhost:8000/purchase-orders", {
      headers: { Authorization: `Bearer ${token}` },
      method: "GET"
    });
    const data = await res.json();
    setPurchaseOrders(data);
  }
  useEffect(() => { fetchPO(); }, [])

  const open = purchaseOrders.filter((x) => x.status == "open")
  const partial = purchaseOrders.filter((x) => x.status == "partially_received")
  const received = purchaseOrders.filter((x) => x.status == "received")

  function renderGroup(title: string, orders: any[]) {
    return (
      <div>
        <h2>{title}</h2>
        {orders.map((po) => (
          <div key={po.id}>
            {po.po_number ?? po.id} — {po.expected_delivery} — {po.status}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {renderGroup("Open", open)}
      {renderGroup("Partially Received", partial)}
      {renderGroup("Received", received)}
    </div>
  );
}