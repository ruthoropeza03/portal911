"use client";

import { useApp } from "@/context/AppContext";
import { CheckCircle, Clock, Download, FileText, User, Calendar } from "lucide-react";

export default function RevisionPage() {
  const { user, reportes } = useApp();

  if (user?.role !== "Gestión Humana" && user?.role !== "Administrador") {
    return <div className="p-4 text-red-600 font-medium">No tienes permisos para ver esta página.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reportes Recibidos</h1>
          <p className="text-gray-500 text-sm mt-1">Supervisión y control de informes quincenales por departamento.</p>
        </div>
      </div>
      
      {/* Vista Móvil (Tarjetas) */}
      <div className="md:hidden space-y-4">
        {reportes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center">
            <FileText className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium">No hay reportes para visualizar en este momento.</p>
          </div>
        ) : (
          reportes.map((reporte) => (
            <div key={reporte.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{reporte.user_name}</h3>
                    <p className="text-xs text-gray-500">{reporte.department_name || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {new Date(reporte.period_start).toLocaleDateString()} al {new Date(reporte.period_end).toLocaleDateString()}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{reporte.file_name}</span>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Coordinador / Depto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Fecha Subida
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {reportes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                      <FileText className="h-8 w-8 opacity-20" />
                      <p className="text-gray-500 font-medium">No hay reportes para visualizar en este momento.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{reporte.user_name}</div>
                          <div className="text-xs text-gray-500">{reporte.department_name || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {new Date(reporte.period_start).toLocaleDateString()} al {new Date(reporte.period_end).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium truncate max-w-[200px]">{reporte.file_name}</span>
                        <a 
                          href={`/api/drive/download?fileId=${reporte.file_drive_id}&public=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-red-600 hover:text-red-700 font-medium text-xs mt-1"
                        >
                          <Download className="w-3 h-3 mr-1" /> Descargar
                        </a>
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
  );
}
