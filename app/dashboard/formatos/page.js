"use client";

import { FileText, Download } from "lucide-react";

export default function FormatosPage() {
  const formatos = [
    {
      id: 1,
      nombre: "Formato de Bitácora Diaria",
      descripcion: "Planilla para registro de novedades por guardia.",
      size: "1.2 MB"
    },
    {
      id: 2,
      nombre: "Formato de Reporte Quincenal",
      descripcion: "Plantilla oficial Excel para subir los reportes de quincena.",
      size: "845 KB"
    },
    {
      id: 3,
      nombre: "Solicitud de Permiso",
      descripcion: "Formulario RRHH para solicitud de ausencias.",
      size: "420 KB"
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Formatos Oficiales</h1>
      <p className="text-gray-600">Descargue aquí las plantillas y formatos aprobados por la institución.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {formatos.map((formato) => (
          <div key={formato.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex items-start mb-4">
              <div className="bg-red-50 p-3 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 leading-tight">{formato.nombre}</h3>
                <p className="text-xs text-gray-500 mt-1">{formato.size}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 flex-grow">{formato.descripcion}</p>
            
            <button 
              className="w-full mt-auto flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
              onClick={() => alert("Simulando descarga de: " + formato.nombre)}
            >
              <Download className="h-4 w-4 mr-2 text-gray-500" />
              Descargar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
