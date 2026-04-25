"use client";

import { useApp } from "@/context/AppContext";
import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Download, Calendar, Clock } from "lucide-react";

export default function ReportesPage() {
  const { user, addReporte, reportes, cargarReportes } = useApp();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(!reportes.length);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }

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

  // Filtrar reportes para mostrar solo los del usuario actual
  const misReportes = reportes.filter(r => r.user_id === user?.id);

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
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informes Enviados</h2>

          <div className="flex-1 overflow-y-auto pr-2 max-h-[600px]">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : misReportes.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No has subido informes todavía.
              </div>
            ) : (
              <ul className="space-y-4">
                {misReportes.map((rep) => (
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
                      <a
                        href={`/api/drive/download?fileId=${rep.file_drive_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                        title="Descargar Reporte"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
