"use client";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function dashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [addRequest, setAddRequest] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [reason, setReason] = useState("");

  const [items, setItems] = useState<
    { item_name: string; quantity: number; unit: string }[]
  >([]);
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnit, setItemUnit] = useState("");

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

  useEffect(() => {
    async function fetchData() {
      const token = await getSupabaseToken();
      if (!token) {
        console.error("No token found");
        return null;
      }

      const response = await fetch(`http://localhost:8000/material-requests`, {
        headers: { Authorization: `Bearer ${token}` },
        method: "GET",
      });

      const data = await response.json();
      setRequests(data);
    }
    fetchData();
  }, []);

  async function handleAddRequest() {
    const token = await getSupabaseToken();
    if (!token) {
      console.error("No token found");
      return null;
    }

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

  return (
    <main>
      <div>
        <h2>Material Requests:</h2>
        <ul>
          {requests.map((req, idx) => (
            <li key={req.id}>
              {req.project_id} — {req.status} — {req.urgency}
            </li>
          ))}
        </ul>
      </div>

      <div className="signout">
        <button onClick={signOut}>Sign out</button>
      </div>
      <div className="add-request">
        <button onClick={() => setAddRequest(true)}>Add Request</button>
      </div>

      {addRequest && (
        <div>
          {/* {modal content} */}
          <form className="add-request-form" onSubmit={handleAddRequest}>
            <input
              type="number"
              placeholder="project-id"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            ></input>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
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
            ></input>
            <ul>
              {items.map((item, idx) => (
                <li key={idx}>
                  {item.item_name} - {item.quantity} - {item.unit}
                </li>
              ))}
            </ul>
            <div>
              <input
                type="text"
                placeholder="item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              ></input>
              <input
                type="number"
                placeholder="item quantity"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
              ></input>
              <input
                type="text"
                placeholder="unit"
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value)}
              ></input>
              <button type="button" onClick={addItem}>
                +
              </button>
            </div>
            <button type="submit">Submit Request</button>
          </form>
          <button onClick={() => setAddRequest(false)}>Close</button>
        </div>
      )}
    </main>
  );
}
