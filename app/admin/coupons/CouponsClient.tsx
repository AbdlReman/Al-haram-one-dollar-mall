"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type CouponRow = {
  _id: string;
  code: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  maxUses: number | null;
  usedCount: number;
};

const input =
  "w-full bg-slate-900 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const label = "block text-slate-400 text-xs font-semibold uppercase mb-1";

function toDateInput(iso: string) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function CouponsClient() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [newCode, setNewCode] = useState("");
  const [newPercent, setNewPercent] = useState(10);
  const [newDesc, setNewDesc] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [newUntil, setNewUntil] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");

  const [editing, setEditing] = useState<CouponRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coupons", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setCoupons(data.coupons || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          discountPercent: newPercent,
          description: newDesc,
          isActive: true,
          validFrom: newFrom || null,
          validUntil: newUntil || null,
          maxUses: newMaxUses.trim() === "" ? null : Number(newMaxUses),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setNewCode("");
      setNewPercent(10);
      setNewDesc("");
      setNewFrom("");
      setNewUntil("");
      setNewMaxUses("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/coupons/${editing._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editing.code,
          discountPercent: editing.discountPercent,
          description: editing.description,
          isActive: editing.isActive,
          validFrom: editing.validFrom ? editing.validFrom.slice(0, 10) : null,
          validUntil: editing.validUntil ? editing.validUntil.slice(0, 10) : null,
          maxUses: editing.maxUses,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this coupon?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      if (editing?._id === id) setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest mb-3">
          <Link href="/admin" className="hover:text-slate-300">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-400">Coupons</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Coupons</h1>
        <p className="text-slate-400 text-sm mt-1">
          Codes customers enter at checkout. Discount is verified on the server when an order is placed.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <form onSubmit={createCoupon} className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Create coupon</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={label}>Code *</label>
            <input
              className={input}
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="SAVE20"
              maxLength={40}
              required
            />
          </div>
          <div>
            <label className={label}>Discount % *</label>
            <input
              className={input}
              type="number"
              min={1}
              max={100}
              value={newPercent}
              onChange={(e) => setNewPercent(Number(e.target.value || 1))}
              required
            />
          </div>
          <div>
            <label className={label}>Max uses (optional)</label>
            <input
              className={input}
              type="number"
              min={1}
              value={newMaxUses}
              onChange={(e) => setNewMaxUses(e.target.value)}
              placeholder="Unlimited if empty"
            />
          </div>
          <div>
            <label className={label}>Valid from (optional)</label>
            <input className={input} type="date" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} />
          </div>
          <div>
            <label className={label}>Valid until (optional)</label>
            <input className={input} type="date" value={newUntil} onChange={(e) => setNewUntil(e.target.value)} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className={label}>Internal note (optional)</label>
            <input
              className={input}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g. Instagram campaign March"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm"
        >
          {saving ? "Saving…" : "Create coupon"}
        </button>
      </form>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-5 py-4 border-b border-slate-700">
          All coupons
        </h2>
        {loading ? (
          <p className="p-6 text-slate-500 text-sm">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">No coupons yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="bg-slate-900/80 text-[10px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">%</th>
                  <th className="px-4 py-3">Uses</th>
                  <th className="px-4 py-3">Validity</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {coupons.map((c) =>
                  editing?._id === c._id ? (
                    <tr key={c._id} className="align-top bg-slate-900/40">
                      <td colSpan={6} className="px-4 py-4 space-y-3">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className={label}>Code</label>
                            <input
                              className={input}
                              value={editing.code}
                              onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                            />
                          </div>
                          <div>
                            <label className={label}>Discount %</label>
                            <input
                              className={input}
                              type="number"
                              min={1}
                              max={100}
                              value={editing.discountPercent}
                              onChange={(e) =>
                                setEditing({ ...editing, discountPercent: Number(e.target.value || 1) })
                              }
                            />
                          </div>
                          <div>
                            <label className={label}>Max uses</label>
                            <input
                              className={input}
                              type="number"
                              min={1}
                              value={editing.maxUses ?? ""}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  maxUses: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                              placeholder="Unlimited"
                            />
                          </div>
                          <div>
                            <label className={label}>Valid from</label>
                            <input
                              className={input}
                              type="date"
                              value={toDateInput(editing.validFrom)}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  validFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : "",
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className={label}>Valid until</label>
                            <input
                              className={input}
                              type="date"
                              value={toDateInput(editing.validUntil)}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  validUntil: e.target.value ? `${e.target.value}T00:00:00.000Z` : "",
                                })
                              }
                            />
                          </div>
                          <div className="flex items-end gap-3">
                            <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editing.isActive}
                                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                                className="rounded border-slate-500"
                              />
                              Active
                            </label>
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            <label className={label}>Note</label>
                            <input
                              className={input}
                              value={editing.description}
                              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={saving}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            className="border border-slate-600 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={c._id} className="hover:bg-slate-700/20">
                      <td className="px-4 py-3 font-mono font-semibold text-white">{c.code}</td>
                      <td className="px-4 py-3">{c.discountPercent}%</td>
                      <td className="px-4 py-3 text-slate-400">
                        {c.usedCount}
                        {c.maxUses != null ? ` / ${c.maxUses}` : " / ∞"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px]">
                        {c.validFrom || c.validUntil ? (
                          <>
                            {c.validFrom ? toDateInput(c.validFrom) : "…"} → {c.validUntil ? toDateInput(c.validUntil) : "…"}
                          </>
                        ) : (
                          "Any time"
                        )}
                      </td>
                      <td className="px-4 py-3">{c.isActive ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditing({ ...c })}
                          className="text-indigo-400 text-xs font-semibold uppercase"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(c._id)}
                          className="text-red-400 text-xs font-semibold uppercase"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
