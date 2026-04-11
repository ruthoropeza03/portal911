"use client";

import { useApp } from "@/context/AppContext";
import { CheckCircle, Clock, Download, FileText, User } from "lucide-react";

export default function RevisionPage() {
  const { user, reportes, marcarReporteRevisado } = useApp();

  if (user?.role !== "Gestión Humana" && user?.role !== "Administrador") {
    return <div className="p-4 text-red-600 font-medium">No tienes permisos para ver esta página.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Revisión de Reportes</h1>
          <p className="text-gray-500 text-sm mt-1">Supervisión y control de informes quincenales por departamento.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {reportes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                      <FileText className="h-8 w-8 opacity-20" />
                      <p className="text-gray-500 font-medium">No hay reportes para revisar en este momento.</p>
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
                      <div className="text-sm text-gray-900 font-medium">Q{reporte.quincena} - {new Date(reporte.period_start).getFullYear()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(reporte.period_start).toLocaleDateString()} al {new Date(reporte.period_end).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium truncate max-w-[150px]">{reporte.file_name}</span>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reporte.status === 'reviewed' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                          <CheckCircle className="w-3 h-3 mr-1" /> Revisado
                        </span>
                      ) : reporte.status === 'rejected' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                          <Clock className="w-3 h-3 mr-1" /> Rechazado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100">
                          <Clock className="w-3 h-3 mr-1" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {reporte.status === 'pending' && (
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              if(confirm('¿Confirmar que el reporte ha sido revisado satisfactoriamente?')) {
                                marcarReporteRevisado(reporte.id, 'reviewed')
                              }
                            }}
                            className="text-green-600 hover:text-green-800 transition-colors"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => {
                              const note = prompt('Motivo del rechazo:');
                              if(note !== null) marcarReporteRevisado(reporte.id, 'rejected', note)
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                      {reporte.status !== 'pending' && (
                        <span className="text-xs text-gray-400 italic">
                          Por: {reporte.reviewer_name || 'Sistema'}
                        </span>
                      )}
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

