"use client";

import { useState } from "react";

interface Item {
  _id: string;
  name: string;
  isActive?: boolean;
}

export default function TaxonomyManager({
  title,
  apiBase,
  initialItems,
}: {
  title: string;
  apiBase: "/api/categories";
  initialItems: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const refresh = async () => {
    const res = await fetch(apiBase);
    const data = await res.json();
    setItems(data.categories || []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), isActive: true }),
    });
    setName("");
    await refresh();
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setLoading(true);
    await fetch(`${apiBase}/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editing.name.trim(), isActive: true }),
    });
    setEditing(null);
    await refresh();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    setLoading(true);
    await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    await refresh();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">{title}</h1>
        <p className="text-slate-400 text-sm mt-1">Create, edit, and delete {title.toLowerCase()}.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col sm:flex-row gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Add new ${title.slice(0, -1)}...`}
          className="flex-1 bg-slate-900 border border-slate-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm"
          required
        />
        <button disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
          Add
        </button>
      </form>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700/60 text-slate-400 text-xs uppercase tracking-widest">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-slate-700/20">
                <td className="px-4 py-3">
                  {editing?.id === item._id ? (
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className="bg-slate-900 border border-slate-600 text-slate-100 rounded px-2 py-1"
                    />
                  ) : (
                    <span className="text-slate-100">{item.name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {editing?.id === item._id ? (
                      <>
                        <button onClick={handleSaveEdit} className="text-indigo-400 text-xs font-medium">Save</button>
                        <button onClick={() => setEditing(null)} className="text-slate-400 text-xs font-medium">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditing({ id: item._id, name: item.name })} className="text-indigo-400 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(item._id)} className="text-red-400 text-xs font-medium">Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={2}>No items yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
