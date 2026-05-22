"use client";

import { useState, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import {
  FileText, User, Calendar, Download, Search, ChevronDown, X, Shield, Eye
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (v) => { setSearch(v); setPage(0); };
  const handleDept = (v) => { setDeptFilter(v); setPage(0); };
  const clearFilters = () => { handleSearch(""); handleDept(""); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reportes Recibidos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} de {reportes.length} reporte{reportes.length !== 1 ? "s" : ""} — Supervisión y control de informes quincenales.
          </p>
        </div>
      </div>

      {/* Barra de búsqueda + filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por coordinador, departamento o archivo…"
              value={rawSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
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

      {/* Vista Móvil (Tarjetas) */}
      <div className="md:hidden space-y-4">
        {paginated.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center">
            <FileText className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium">No se encontraron reportes.</p>
          </div>
        ) : (
          paginated.map((reporte) => (
            <div key={reporte.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
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

      {/* Vista Escritorio (Tabla) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm gap-2">
          <p className="text-sm text-gray-500">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-1 flex-wrap justify-center">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Ant.
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${i === page ? "bg-red-600 text-white border-red-600" : "border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Sig. →
            </button>
          </div>
        </div>
      )}
      {/* Preview Modal */}
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
