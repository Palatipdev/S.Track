"use client";
import { getToken } from "@/lib/auth";
import { useSubmitGuard } from "@/lib/useSubmitGuard";
import { fetchJson } from "@/lib/fetchJson";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";

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
  const { isSubmitting, guard } = useSubmitGuard();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [parentStorage, setParentStorage] = useState("");
  const [projectId, setProjectId] = useState("");

  async function fetchData() {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [fetchedLocations, fetchedProjects] = await Promise.all([
      fetchJson<StorageLocation[]>("http://localhost:8000/storage_location", { headers }),
      fetchJson<Project[]>("http://localhost:8000/projects", { headers }),
    ]);

    setLocations(fetchedLocations);
    setProjects(fetchedProjects);
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
    guard(async () => {
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
    });
  }

  function findLocation(id: number | null) {
    return locations.find((l) => l.id === id);
  }

  return (
    <div>
      <PageHeader title="Storage Locations" formCode="คลังวัสดุ">
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          Add Location
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-2 font-semibold">Name</th>
              <th className="px-4 py-2 font-semibold">Type</th>
              <th className="px-4 py-2 font-semibold">Parent</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id} className="border-t border-rule">
                <td className="px-4 py-3">{loc.name}</td>
                <td className="px-4 py-3 text-mute">{loc.type.replace("_", " ")}</td>
                <td className="px-4 py-3 text-mute">
                  {findLocation(loc.parent_storage_id)?.name ?? "—"}
                </td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-mute">
                  No locations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleAddLocation}
            className="card w-full max-w-md p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Add Storage Location</h2>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-mute">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="field"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm text-mute">Type</label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setParentStorage("");
                }}
                required
                className="field"
              >
                <option value="">Select type</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>

            {type === "unit" || type === "project_site" ? (
              <div className="mb-4">
                <label className="mb-1 block text-sm text-mute">
                  Parent {type === "unit" ? "(central store)" : "(unit)"}
                </label>
                <select
                  value={parentStorage}
                  onChange={(e) => setParentStorage(e.target.value)}
                  required
                  className="field"
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
                <label className="mb-1 block text-sm text-mute">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  className="field"
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
