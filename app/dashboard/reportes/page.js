"use client";

import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";

// Calcula automáticamente el período (start/end) de cada quincena dado el mes/año
function calcularPeriodo(year, month, quincena) {
  const mes = String(month).padStart(2, "0");
  if (quincena === 1) {
    return {
      period_start: `${year}-${mes}-01`,
      period_end: `${year}-${mes}-15`,
    };
  } else {
    const lastDay = new Date(year, month, 0).getDate(); // Último día del mes
    return {
      period_start: `${year}-${mes}-16`,
      period_end: `${year}-${mes}-${lastDay}`,
    };
  }
}

export default function ReportesPage() {
  const { user, addReporte } = useApp();

  const now = new Date();
  const [quincena, setQuincena] = useState(1);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }

  if (user?.role !== "Coordinador" && user?.role !== "Administrador") {
    return <div className="p-4 text-red-600 font-medium">No tienes permisos para ver esta página.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus({ type: "error", msg: "Debes seleccionar un archivo antes de enviar." });
      return;
    }

    const { period_start, period_end } = calcularPeriodo(year, month, quincena);

    // Construir el FormData real que espera la API
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quincena", String(quincena));
    formData.append("period_start", period_start);
    formData.append("period_end", period_end);

    setUploading(true);
    setStatus(null);

    const ok = await addReporte(formData);
    setUploading(false);

    if (ok) {
      setStatus({ type: "success", msg: `Reporte subido correctamente (${period_start} → ${period_end}).` });
      setFile(null);
      // Limpiar el input de archivo
      const input = document.getElementById("file-input");
      if (input) input.value = "";
    } else {
      setStatus({ type: "error", msg: "Error al subir el reporte. Verifica tu conexión y vuelve a intentarlo." });
    }
  };

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Años disponibles: año actual y el anterior
  const years = [now.getFullYear(), now.getFullYear() - 1];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Subir Reporte Quincenal</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {status && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            status.type === "success"
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
          {/* Año y Mes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {meses.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Quincena */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quincena</label>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuincena(q)}
                  className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                    quincena === q
                      ? "border-red-600 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {q === 1 ? "1ra Quincena (1–15)" : "2da Quincena (16–fin)"}
                </button>
              ))}
            </div>
            {/* Resumen del período */}
            {(() => {
              const { period_start, period_end } = calcularPeriodo(year, month, quincena);
              return (
                <p className="mt-2 text-xs text-gray-500">
                  Período: <span className="font-semibold text-gray-700">{period_start}</span> hasta <span className="font-semibold text-gray-700">{period_end}</span>
                </p>
              );
            })()}
          </div>

          {/* Archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo del Reporte (PDF / Excel)
            </label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${
              file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-red-300"
            }`}>
              <div className="space-y-2 text-center">
                <UploadCloud className={`mx-auto h-12 w-12 ${file ? "text-green-500" : "text-gray-400"}`} />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                    <span>{file ? "Cambiar archivo" : "Seleccionar archivo"}</span>
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
                  {!file && <p className="pl-1">o arrastra aquí</p>}
                </div>
                <p className="text-xs text-gray-500">
                  {file ? (
                    <span className="text-green-700 font-medium">✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  ) : (
                    "PDF, XLSX, DOCX — máx. 10 MB"
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !file}
              className="inline-flex items-center px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
            >
              <UploadCloud className="h-5 w-5 mr-2" />
              {uploading ? "Subiendo..." : "Enviar Reporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
