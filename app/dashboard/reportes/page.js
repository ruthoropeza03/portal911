"use client";

import { useApp } from "@/context/AppContext";
import { useState, useEffect, useMemo, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Download, Calendar, Clock, Search, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import PdfPreviewModal from "@/components/PdfPreviewModal";

const PAGE_SIZE = 8;

export default function ReportesPage() {
  const { user, addReporte, reportes, cargarReportes } = useApp();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(!reportes.length);
  const [status, setStatus] = useState(null);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, fileId: null, fileName: "" });

  // Búsqueda en el historial
  const [rawSearch, setRawSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [histPage, setHistPage] = useState(0);
  const searchTimer = useRef(null);

  const handleSearchChange = (v) => {
    setRawSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(v); setHistPage(0); }, 350);
  };

  useEffect(() => {
    const init = async () => {
      if (cargarReportes) {
        await cargarReportes();
      }
      setLoading(false);
    };
    init();
  }, [cargarReportes]);

  if (user?.role !== "Coordinador" && user?.role !== "Administrador") {
    return <div className="p-4 text-red-600 font-medium">No tienes permisos para ver esta página.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus({ type: "error", msg: "Debes seleccionar un archivo antes de enviar." });
      return;
    }

    if (!startDate || !endDate) {
      setStatus({ type: "error", msg: "Debes seleccionar el período (inicio y fin)." });
      return;
    }

    // Construir el FormData real que espera la API
    const formData = new FormData();
    formData.append("file", file);
    formData.append("period_start", startDate);
    formData.append("period_end", endDate);

    setUploading(true);
    setStatus(null);

    const ok = await addReporte(formData);
    setUploading(false);

    if (ok) {
      setStatus({ type: "success", msg: `Reporte subido correctamente (${startDate} → ${endDate}).` });
      setFile(null);
      setStartDate("");
      setEndDate("");
      // Limpiar el input de archivo
      const input = document.getElementById("file-input");
      if (input) input.value = "";
    } else {
      setStatus({ type: "error", msg: "Error al subir el reporte. Verifica tu conexión y vuelve a intentarlo." });
    }
  };

  // Filtrar reportes para mostrar solo los del usuario actual + búsqueda
  const misReportes = reportes.filter(r => r.user_id === user?.id);
  const filteredReportes = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return misReportes;
    return misReportes.filter(
      (r) =>
        (r.file_name ?? "").toLowerCase().includes(q) ||
        r.period_start?.includes(q) ||
        r.period_end?.includes(q)
    );
  }, [misReportes, debouncedSearch]);

  const totalHistPages = Math.max(1, Math.ceil(filteredReportes.length / PAGE_SIZE));
  const paginatedReportes = filteredReportes.slice(histPage * PAGE_SIZE, (histPage + 1) * PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <UploadCloud className="h-8 w-8 text-red-600" />
        <h1 className="text-2xl font-bold text-gray-900">Informes de Gestión</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulario de Subida */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <UploadCloud className="h-5 w-5 mr-2 text-gray-500" />
            Subir Nuevo Informe
          </h2>

          {status && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${status.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
              }`}>
              {status.type === "success"
                ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              }
              <span className="text-sm font-medium">{status.msg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Periodo Personalizado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                  required
                />
              </div>
            </div>

            {/* Archivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Archivo</label>
              <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-red-300"
                }`}>
                <div className="space-y-2 text-center">
                  <FileText className={`mx-auto h-10 w-10 ${file ? "text-green-500" : "text-gray-400"}`} />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                      <span>{file ? "Cambiar" : "Seleccionar"}</span>
                      <input
                        id="file-input"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.xlsx,.xls,.doc,.docx"
                        onChange={(e) => {
                          setFile(e.target.files[0] || null);
                          setStatus(null);
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {file ? file.name : "PDF, Excel o Word"}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full flex justify-center items-center px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? "Subiendo..." : "Enviar Reporte"}
            </button>
          </form>
        </div>

        {/* Historial de Reportes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Informes Enviados</h2>

          {/* Búsqueda */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o fecha…"
              value={rawSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {rawSearch && (
              <button onClick={() => handleSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 max-h-[500px]">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : paginatedReportes.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No se encontraron informes.
              </div>
            ) : (
              <ul className="space-y-4">
                {paginatedReportes.map((rep) => (
                  <li key={rep.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-white transition-colors group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            Reporte de Gestión
                          </h3>
                        </div>
                        <p className="text-[11px] text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(rep.period_start).toLocaleDateString('es-VE')} al {new Date(rep.period_end).toLocaleDateString('es-VE')}
                        </p>
                        <div className="mt-2 flex items-center text-[10px] text-gray-400 space-x-2">
                          <Clock className="h-3 w-3" />
                          <span>Subido el {new Date(rep.created_at).toLocaleDateString('es-VE')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4 shrink-0">
                        {rep.file_name?.toLowerCase().endsWith('.pdf') && (
                          <button
                            onClick={() => setPreviewModal({ isOpen: true, fileId: rep.file_drive_id, fileName: rep.file_name })}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Previsualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <a
                          href={`/api/drive/download?fileId=${rep.file_drive_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Descargar Reporte"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Paginación */}
          {totalHistPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
              <p className="text-xs text-gray-400">
                {histPage * PAGE_SIZE + 1}–{Math.min((histPage + 1) * PAGE_SIZE, filteredReportes.length)} de {filteredReportes.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setHistPage((p) => Math.max(0, p - 1))}
                  disabled={histPage === 0}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setHistPage((p) => Math.min(totalHistPages - 1, p + 1))}
                  disabled={histPage >= totalHistPages - 1}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Preview Modal */}
      <PdfPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, fileId: null, fileName: "" })}
        fileId={previewModal.fileId}
        fileName={previewModal.fileName}
      />
    </div>
  );
}
