"use client";

import { useState, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import {
  FileText, User, Calendar, Download, Search, ChevronDown, X, Shield, Eye, BarChart3, Clock
} from "lucide-react";
import PdfPreviewModal from "@/components/PdfPreviewModal";

const PAGE_SIZE = 15;

function useDebounce(delay = 350) {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const timer = useRef(null);
  const onChange = (v) => {
    setValue(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(v), delay);
  };
  return [value, debounced, onChange];
}

export default function RevisionPage() {
  const { user, reportes } = useApp();

  const [rawSearch, debouncedSearch, setSearch] = useDebounce(350);
  const [deptFilter, setDeptFilter] = useState("");
  const [activeTab, setActiveTab] = useState("pendientes");
  const [page, setPage] = useState(0);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, fileId: null, fileName: "" });

  const canView =
    user?.role === "Gestión Humana" ||
    user?.role === "Administrador" ||
    (user?.role === "Coordinador" && user?.department_name === "Operaciones" );

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Shield className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    );
  }

  // Departamentos únicos para el filtro
  const departments = useMemo(() => {
    const set = new Set(reportes.map((r) => r.department_name).filter(Boolean));
    return Array.from(set).sort();
  }, [reportes]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return reportes.filter((r) => {
      const matchSearch =
        !q ||
        (r.user_name ?? "").toLowerCase().includes(q) ||
        (r.department_name ?? "").toLowerCase().includes(q) ||
        (r.file_name ?? "").toLowerCase().includes(q);
      const matchDept = !deptFilter || r.department_name === deptFilter;
      return matchSearch && matchDept;
    });
  }, [reportes, debouncedSearch, deptFilter]);

  const stats = useMemo(() => {
    const byDept = {};
    const byCoordinator = {};
    const byMonth = {};

    filtered.forEach((r) => {
      const dept = r.department_name || "Sin departamento";
      byDept[dept] = (byDept[dept] || 0) + 1;

      const coordinator = r.user_name || "Desconocido";
      byCoordinator[coordinator] = (byCoordinator[coordinator] || 0) + 1;

      const date = new Date(r.period_start || r.created_at || 0);
      const monthKey = `${date.toLocaleString("es-VE", { month: "long" })} ${date.getFullYear()}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    });

    return {
      total: filtered.length,
      departments: Object.keys(byDept).length,
      coordinators: Object.keys(byCoordinator).length,
      byDept: Object.entries(byDept)
        .map(([label, val]) => ({ label, val }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 10),
      byCoordinator: Object.entries(byCoordinator)
        .map(([label, val]) => ({ label, val }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 10),
      byMonth: Object.entries(byMonth)
        .map(([label, val]) => ({ label, val }))
        .sort((a, b) => b.val - a.val),
    };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (v) => { setSearch(v); setPage(0); };
  const handleDept = (v) => { setDeptFilter(v); setPage(0); };
  const clearFilters = () => { handleSearch(""); handleDept(""); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-xl text-red-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Revisión de Reportes</h1>
            <p className="text-sm text-gray-500 mt-1">Vista de Coordinador de Operaciones con estilo de Gestión Humana.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-white p-1 rounded-xl shadow-xs">
        {[
          ["pendientes", "Pendientes", Clock],
          ["historial", "Archivo General", FileText],
          ["metricas", "Métricas Detalladas", BarChart3]
        ].map(([tab, label, Icon]) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(0); }}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por coordinador, departamento o archivo…"
              value={rawSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {rawSearch && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <div className="relative sm:w-52">
            <select
              value={deptFilter}
              onChange={(e) => handleDept(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
            >
              <option value="">Todos los departamentos</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {(rawSearch || deptFilter) && (
          <button onClick={clearFilters} className="text-xs text-red-600 hover:underline font-medium">
            × Limpiar filtros
          </button>
        )}
      </div>

      {activeTab !== "metricas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total reportes</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.total}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Reportes disponibles para revisión</p>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Departamentos</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.departments}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Áreas con reportes</p>
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Coordinadores</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.coordinators}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Autores de reporte únicos</p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="md:hidden space-y-4">
            {paginated.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center flex flex-col items-center">
                <FileText className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium">No se encontraron reportes.</p>
              </div>
            ) : (
              paginated.map((reporte) => (
                <div key={reporte.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{reporte.user_name}</h3>
                        <p className="text-xs text-gray-500">{reporte.department_name || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {new Date(reporte.period_start).toLocaleDateString("es-VE")} al {new Date(reporte.period_end).toLocaleDateString("es-VE")}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{reporte.file_name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setPreviewModal({ isOpen: true, fileId: reporte.file_drive_id, fileName: reporte.file_name })}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Previsualizar"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <a
                          href={`/api/drive/download?fileId=${reporte.file_drive_id}&public=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                          title="Descargar Informe"
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-400 text-right">
                      Subido: {new Date(reporte.created_at).toLocaleString("es-VE")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Coordinador / Depto</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Archivo</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Subida</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                          <FileText className="h-8 w-8 opacity-20" />
                          <p className="text-gray-500 font-medium">No se encontraron reportes.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((reporte) => (
                      <tr key={reporte.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{reporte.user_name}</div>
                              <div className="text-xs text-gray-500">{reporte.department_name || "N/A"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {new Date(reporte.period_start).toLocaleDateString("es-VE")} al {new Date(reporte.period_end).toLocaleDateString("es-VE")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-medium truncate max-w-[200px]">{reporte.file_name}</span>
                            <div className="flex items-center gap-3 mt-1">
                              <button
                                onClick={() => setPreviewModal({ isOpen: true, fileId: reporte.file_drive_id, fileName: reporte.file_name })}
                                className="inline-flex items-center text-slate-600 hover:text-red-600 font-medium text-xs"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> Previsualizar
                              </button>
                              <a
                                href={`/api/drive/download?fileId=${reporte.file_drive_id}&public=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-red-600 hover:text-red-700 font-medium text-xs"
                              >
                                <Download className="w-3.5 h-3.5 mr-1" /> Descargar
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(reporte.created_at).toLocaleString("es-VE")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "metricas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total reportes</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.total}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Filtrados actualmente</p>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Departamentos</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.departments}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Áreas únicas</p>
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Coordinadores</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.coordinators}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Autores únicos</p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <User className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Meses activos</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.byMonth.length}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Meses con reportes</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-red-600" />
                Reportes por Mes
              </h3>
              {stats.byMonth.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4 text-center">No hay datos mensuales.</p>
              ) : (
                <div className="space-y-3.5">
                  {stats.byMonth.map(({ label, val }) => {
                    const maxVal = Math.max(...stats.byMonth.map((m) => m.val));
                    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-gray-700">{label}</span>
                          <span className="font-bold text-gray-900">{val}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-red-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-red-600" />
                Top Coordinadores
              </h3>
              {stats.byCoordinator.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4 text-center">No hay datos de coordinadores.</p>
              ) : (
                <div className="space-y-3.5">
                  {stats.byCoordinator.map(({ label, val }) => {
                    const maxVal = Math.max(...stats.byCoordinator.map((u) => u.val));
                    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-gray-700 truncate max-w-[65%]">{label}</span>
                          <span className="font-bold text-gray-900">{val}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-green-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm gap-2">
          <p className="text-sm text-gray-500">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-1 flex-wrap justify-center">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Ant.
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-1.5 text-sm rounded-xl border transition-colors ${
                  i === page ? "bg-red-600 text-white border-red-600" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Sig. →
            </button>
          </div>
        </div>
      )}

      <PdfPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, fileId: null, fileName: "" })}
        fileId={previewModal.fileId}
        fileName={previewModal.fileName}
        isPublic={true}
      />
    </div>
  );
}
