"use client";

import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { UploadCloud, File, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

export default function ReportesPage() {
  const { user, addReporte } = useApp();
  const [quincena, setQuincena] = useState("1ra");
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState(false);

  if (user?.role !== "Coordinador" && user?.role !== "Administrador") {
    return <div className="p-4 text-red-600">No tienes permisos para ver esta página.</div>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      alert("Debes seleccionar un archivo simulado.");
      return;
    }

    // Simular subida
    addReporte({
      coordinador: user.name,
      quincena,
      fechaSubida: new Date().toISOString(),
      nombreArchivo: file.name,
    });

    setSuccess(true);
    setFile(null);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Subir Reporte Quincenal</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Reporte subido exitosamente al sistema.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccione la Quincena a Reportar
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={quincena}
              onChange={(e) => setQuincena(e.target.value)}
            >
              <option value="1ra">1ra Quincena</option>
              <option value="2da">2da Quincena</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo (PDF/Excel)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                    <span>Subir un archivo</span>
                    <input 
                      type="file" 
                      className="sr-only" 
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  {file ? file.name : "PDF, XLSX hasta 10MB (Simulado)"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <UploadCloud className="h-5 w-5 mr-2" />
              Enviar Reporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
