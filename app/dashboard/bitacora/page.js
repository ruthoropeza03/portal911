"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/context/AppContext";
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  Download,
  ChevronDown,
  User,
  Clock,
  Shield,
  Activity,
  LogIn,
  FileText,
  Newspaper,
  Users,
  FolderOpen,
  Wrench,
  UserCog,
} from "lucide-react";

// ─── Configuración de módulos y acciones ────────────────────────────────────

const MODULE_CONFIG = {
  "Autenticación":      { color: "bg-violet-100 text-violet-700", icon: LogIn },
  "Noticias":           { color: "bg-sky-100 text-sky-700",       icon: Newspaper },
  "Usuarios":           { color: "bg-amber-100 text-amber-700",   icon: Users },
  "Reportes":           { color: "bg-emerald-100 text-emerald-700", icon: FileText },
  "Formatos":           { color: "bg-orange-100 text-orange-700", icon: FolderOpen },
  "Informes Técnicos":  { color: "bg-cyan-100 text-cyan-700",     icon: Wrench },
  "Perfil":             { color: "bg-pink-100 text-pink-700",     icon: UserCog },
};

const ACTION_LABELS = {
  LOGIN:                   { label: "Login",              color: "bg-violet-500" },
  CREATE_NEWS:             { label: "Crear Noticia",      color: "bg-sky-500" },
  UPDATE_NEWS:             { label: "Editar Noticia",     color: "bg-sky-400" },
  DELETE_NEWS:             { label: "Eliminar Noticia",   color: "bg-red-500" },
  CREATE_USER:             { label: "Crear Usuario",      color: "bg-amber-500" },
  UPDATE_USER:             { label: "Editar Usuario",     color: "bg-amber-400" },
  DELETE_USER:             { label: "Eliminar Usuario",   color: "bg-red-600" },
  UPLOAD_REPORT:           { label: "Subir Reporte",      color: "bg-emerald-500" },
  REVIEW_REPORT:           { label: "Revisar Reporte",    color: "bg-emerald-400" },
  UPLOAD_FORMAT:           { label: "Subir Formato",      color: "bg-orange-500" },
  DELETE_FORMAT:           { label: "Eliminar Formato",   color: "bg-red-400" },
  UPLOAD_TECHNICAL_REPORT: { label: "Subir Inf. Técnico", color: "bg-cyan-500" },
  UPDATE_PROFILE:          { label: "Editar Perfil",      color: "bg-pink-500" },
};

const ALL_MODULES = Object.keys(MODULE_CONFIG);
const ALL_ACTIONS = Object.keys(ACTION_LABELS);
const PAGE_SIZE = 50;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function ModuleBadge({ module }) {
  const cfg = MODULE_CONFIG[module] || { color: "bg-gray-100 text-gray-600", icon: Activity };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {module}
    </span>
  );
}

function ActionBadge({ action }) {
  const cfg = ACTION_LABELS[action] || { label: action, color: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-white ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Exportar CSV ────────────────────────────────────────────────────────────

function exportCSV(logs) {
  const header = ["Fecha", "Usuario", "Rol", "Módulo", "Acción", "Descripción", "IP"];
  const rows = logs.map((l) => [
    formatDate(l.created_at),
    l.user_name,
    l.user_role,
    l.module,
    l.action,
    `"${(l.description ?? "").replace(/"/g, '""')}"`,
    l.ip_address ?? "",
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bitacora_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Componente Principal ────────────────────────────────────────────────────

export default function BitacoraPage() {
  const { user, fetchAPI } = useApp();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const searchTimeout = useRef(null);

  // Protección de rol
  if (!user) return null;
  if (user.role !== "Administrador") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-semibold">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    );
  }

  // ── Carga de datos ─────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(currentOffset),
    });
    if (moduleFilter) params.set("module", moduleFilter);
    if (actionFilter) params.set("action", actionFilter);
    if (search.trim()) params.set("search", search.trim());

    try {
      const data = await fetchAPI(`/api/audit-log?${params.toString()}`);
      if (data && !data.error) {
        if (reset) {
          setLogs(data.logs ?? []);
        } else {
          setLogs((prev) => [...prev, ...(data.logs ?? [])]);
        }
        setTotal(data.total ?? 0);
        setHasMore((reset ? 0 : currentOffset) + PAGE_SIZE < (data.total ?? 0));
        if (reset) setOffset(PAGE_SIZE);
        else setOffset(currentOffset + PAGE_SIZE);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fetchAPI, offset, moduleFilter, actionFilter, search]);

  // Carga inicial
  useEffect(() => {
    fetchLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleFilter, actionFilter]);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchLogs(true);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleRefresh = () => {
    setOffset(0);
    fetchLogs(true);
  };

  const handleLoadMore = () => {
    fetchLogs(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-red-600" />
            Bitácora del Sistema
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Cargando…" : `${total.toLocaleString("es-VE")} registro${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            onClick={() => exportCSV(logs)}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* ── Barra de búsqueda y filtros ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por usuario o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Toggle filtros */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtros avanzados
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          {(moduleFilter || actionFilter) && (
            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold">
              {[moduleFilter, actionFilter].filter(Boolean).length}
            </span>
          )}
        </button>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Módulo */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Módulo</label>
              <select
                value={moduleFilter}
                onChange={(e) => { setModuleFilter(e.target.value); setOffset(0); }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todos los módulos</option>
                {ALL_MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Acción */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Acción</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setOffset(0); }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todas las acciones</option>
                {ALL_ACTIONS.map((a) => (
                  <option key={a} value={a}>{ACTION_LABELS[a]?.label ?? a}</option>
                ))}
              </select>
            </div>

            {/* Limpiar filtros */}
            {(moduleFilter || actionFilter) && (
              <div className="sm:col-span-2">
                <button
                  onClick={() => { setModuleFilter(""); setActionFilter(""); setOffset(0); }}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  × Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Contenido ── */}
      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto" />
            <p className="text-sm text-gray-400">Cargando registros…</p>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No se encontraron registros.</p>
          <p className="text-gray-300 text-sm mt-1">Intenta con otros filtros o espera a que se realicen acciones en el portal.</p>
        </div>
      ) : (
        <>
          {/* ── Vista Escritorio (tabla) ── */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <Clock className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />Fecha
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <User className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />Usuario
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Módulo</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Acción</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">IP</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      {/* Fecha */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                        {formatDate(log.created_at)}
                      </td>
                      {/* Usuario */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs flex-shrink-0">
                            {getInitials(log.user_name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 leading-tight">{log.user_name}</p>
                            <p className="text-xs text-gray-400 leading-tight">{log.user_role}</p>
                          </div>
                        </div>
                      </td>
                      {/* Módulo */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <ModuleBadge module={log.module} />
                      </td>
                      {/* Acción */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <ActionBadge action={log.action} />
                      </td>
                      {/* Descripción */}
                      <td className="px-5 py-3.5 text-sm text-gray-600 max-w-xs">
                        <span className="line-clamp-2">{log.description || "—"}</span>
                      </td>
                      {/* IP */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-400 font-mono">
                        {log.ip_address || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Vista Móvil (tarjetas) ── */}
          <div className="md:hidden space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                {/* Encabezado tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm flex-shrink-0">
                      {getInitials(log.user_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{log.user_name}</p>
                      <p className="text-xs text-gray-400">{log.user_role}</p>
                    </div>
                  </div>
                  <ActionBadge action={log.action} />
                </div>

                {/* Descripción */}
                <p className="text-sm text-gray-600 leading-snug border-t border-gray-50 pt-3">
                  {log.description || "Sin descripción"}
                </p>

                {/* Footer tarjeta */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <ModuleBadge module={log.module} />
                  <div className="flex items-center gap-3">
                    {log.ip_address && (
                      <span className="text-[10px] text-gray-400 font-mono">{log.ip_address}</span>
                    )}
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Cargar más ── */}
          <div className="flex flex-col items-center gap-2 pb-4">
            <p className="text-xs text-gray-400">
              Mostrando {logs.length} de {total.toLocaleString("es-VE")} registros
            </p>
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Cargando…</>
                ) : (
                  <>Cargar más registros</>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}