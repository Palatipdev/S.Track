"use client";
import { getToken } from "@/lib/auth";
import { useState, useEffect } from "react";

type StorageLocation = {
  id: number;
  parent_storage_id: number | null;
  project_id: number | null;
  name: string;
  type: string;
};

type Project = { id: number; name: string };

const TYPES = ["central", "unit", "project_site"];

export default function LocationsPage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [parentStorage, setParentStorage] = useState("");
  const [projectId, setProjectId] = useState("");

  async function fetchData() {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [locRes, projRes] = await Promise.all([
      fetch("http://localhost:8000/storage_location", { headers }),
      fetch("http://localhost:8000/projects", { headers }),
    ]);

    setLocations(await locRes.json());
    setProjects(await projRes.json());
  }

  useEffect(() => {
    fetchData();
  }, []);

  function parentOptions() {
    if (type === "unit") return locations.filter((l) => l.type === "central");
    if (type === "project_site") return locations.filter((l) => l.type === "unit");
    return [];
  }

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    const token = await getToken();
    if (!token) return;

    await fetch("http://localhost:8000/storage_location", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        parent_storage: parentStorage ? Number(parentStorage) : null,
        project_id: type === "project_site" && projectId ? Number(projectId) : null,
        name,
        type,
        location_member: [],
      }),
    });

    setShowAddModal(false);
    setName("");
    setType("");
    setParentStorage("");
    setProjectId("");
    fetchData();
  }

  function findLocation(id: number | null) {
    return locations.find((l) => l.id === id);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Storage Locations</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Add Location
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2 font-normal">Name</th>
              <th className="px-4 py-2 font-normal">Type</th>
              <th className="px-4 py-2 font-normal">Parent</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id} className="border-t border-neutral-800">
                <td className="px-4 py-3">{loc.name}</td>
                <td className="px-4 py-3 text-neutral-400">{loc.type.replace("_", " ")}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {findLocation(loc.parent_storage_id)?.name ?? "—"}
                </td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                  No locations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleAddLocation}
            className="w-full max-w-md rounded-xl bg-neutral-900 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Add Storage Location</h2>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-neutral-400">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-neutral-400">Type</label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setParentStorage("");
                }}
                required
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
              >
                <option value="">Select type</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>

            {type === "unit" || type === "project_site" ? (
              <div className="mb-4">
                <label className="mb-1 block text-sm text-neutral-400">
                  Parent {type === "unit" ? "(central store)" : "(unit)"}
                </label>
                <select
                  value={parentStorage}
                  onChange={(e) => setParentStorage(e.target.value)}
                  required
                  className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
                >
                  <option value="">Select parent</option>
                  {parentOptions().map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

            {type === "project_site" ? (
              <div className="mb-4">
                <label className="mb-1 block text-sm text-neutral-400">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white"
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

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
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
