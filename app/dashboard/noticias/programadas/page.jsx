"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import {
  ChevronLeft, Clock, Calendar, Trash2, RefreshCw, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";

// ── Utilidad de formato de fechas ──────────────────────────────────────────────

function formatFecha(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("es-VE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Formato YYYY-MM-DDTHH:mm para input datetime-local, en hora local
function toDatetimeLocalValue(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function minDatetime() {
  const d = new Date(Date.now() + 60_000);
  return d.toISOString().slice(0, 16);
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function NoticiasProgragradasPage() {
  const { user } = useApp();
  const isPrensa = user?.role === "Prensa" || user?.role === "Administrador";

  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado de acción por noticia: { [id]: 'canceling' | 'rescheduling' | null }
  const [actionState, setActionState] = useState({});

  // Reprogramación inline: { id, newDate (string datetime-local) }
  const [rescheduling, setRescheduling] = useState(null);

  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProgramadas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("ven911_token");
      const res = await fetch("/api/news/programadas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setNoticias(data);
    } catch (e) {
      setError("No se pudieron cargar las noticias programadas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchProgramadas();
  }, [user, fetchProgramadas]);

  // ── Cancelar programación ──────────────────────────────────────────────────

  const handleCancelar = async (id) => {
    if (!confirm("¿Cancelar la programación? La noticia volverá a estado Borrador.")) return;
    setActionState((s) => ({ ...s, [id]: "canceling" }));
    try {
      const token = localStorage.getItem("ven911_token");
      const res = await fetch("/api/news/programadas", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al cancelar");
      }
      showToast("success", "Programación cancelada. La noticia quedó como Borrador.");
      setNoticias((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setActionState((s) => ({ ...s, [id]: null }));
    }
  };

  // ── Reprogramar ────────────────────────────────────────────────────────────

  const openReschedule = (noticia) => {
    setRescheduling({ id: noticia.id, newDate: toDatetimeLocalValue(noticia.fecha_programada) });
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduling) return;
    const { id, newDate } = rescheduling;

    if (!newDate || new Date(newDate) <= new Date()) {
      showToast("error", "La nueva fecha debe ser en el futuro.");
      return;
    }

    setActionState((s) => ({ ...s, [id]: "rescheduling" }));
    try {
      const token = localStorage.getItem("ven911_token");
      const res = await fetch("/api/news/programadas", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, fecha_programada: new Date(newDate).toISOString() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al reprogramar");
      }
      showToast("success", "Noticia reprogramada exitosamente.");
      setRescheduling(null);
      await fetchProgramadas();
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setActionState((s) => ({ ...s, [id]: null }));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isPrensa) {
    return (
      <div className="p-6 text-center text-gray-500">
        No tienes permisos para ver esta sección.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/noticias"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 py-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Noticias
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Noticias Programadas
          </h1>
        </div>
        <button
          type="button"
          onClick={fetchProgramadas}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Contenido */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando noticias programadas...
          </div>
        ) : noticias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Clock className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-base font-medium">No hay noticias programadas</p>
            <p className="text-sm mt-1">Las noticias que programes aparecerán aquí.</p>
            <Link
              href="/dashboard/noticias"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              <Calendar className="h-4 w-4" />
              Crear noticia programada
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {noticias.map((noticia) => {
              const isCanceling   = actionState[noticia.id] === "canceling";
              const isReschedulingThis = actionState[noticia.id] === "rescheduling";
              const isEditing     = rescheduling?.id === noticia.id;

              return (
                <div key={noticia.id} className="p-4 sm:p-5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 leading-snug break-words mb-1">
                        {noticia.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="font-medium text-blue-700">
                            Publicación: {formatFecha(noticia.fecha_programada)}
                          </span>
                        </span>
                        {noticia.author_name && (
                          <span>Por: {noticia.author_name}</span>
                        )}
                        <span>
                          Creada: {new Date(noticia.published_at).toLocaleDateString("es-VE")}
                        </span>
                      </div>

                      {/* ── Form de reprogramación inline ── */}
                      {isEditing && (
                        <form onSubmit={handleReschedule} className="mt-3 flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Nueva fecha y hora
                            </label>
                            <input
                              type="datetime-local"
                              min={minDatetime()}
                              value={rescheduling.newDate}
                              onChange={(e) =>
                                setRescheduling((r) => ({ ...r, newDate: e.target.value }))
                              }
                              required
                              className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={isReschedulingThis}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isReschedulingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setRescheduling(null)}
                              className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-100"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Acciones */}
                    {!isEditing && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openReschedule(noticia)}
                          disabled={isCanceling}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 touch-manipulation min-h-[40px]"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Reprogramar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelar(noticia.id)}
                          disabled={isCanceling}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50 touch-manipulation min-h-[40px]"
                        >
                          {isCanceling
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info cron */}
      <p className="text-xs text-center text-gray-400">
        Las noticias se publican automáticamente cada 10 minutos aproximadamente.
      </p>
    </div>
  );
}
