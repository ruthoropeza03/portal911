"use client";

import { useApp } from "@/context/AppContext";
import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Server, FileText, Download } from "lucide-react";

export default function InformesTecnicosPage() {
  const { user, informesTecnicos, cargarInformesTecnicos, addInformeTecnico } = useApp();
  const [loading, setLoading] = useState(!informesTecnicos.length);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }

  useEffect(() => {
    const init = async () => {
      await cargarInformesTecnicos();
      setLoading(false);
    };
    init();
  }, []);

  if (user?.department_name !== "Televigilancia" && user?.department_name !== "Tecnologia" && user?.role !== "Administrador") {
    return <div className="p-4 text-red-600 font-medium">No tienes permisos para ver esta página.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus({ type: "error", msg: "Debes seleccionar un archivo antes de enviar." });
      return;
    }
    if (!title) {
      setStatus({ type: "error", msg: "El título es obligatorio." });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);

    setUploading(true);
    setStatus(null);

    try {
      const result = await addInformeTecnico(formData);
 
      if (result.success) {
        setStatus({ type: "success", msg: "Informe técnico subido correctamente." });
        setTitle("");
        setDescription("");
        setFile(null);
        const input = document.getElementById("file-input");
        if (input) input.value = "";
      } else {
        setStatus({ type: "error", msg: result.error || "Error al subir el informe." });
      }
    } catch (error) {
      setStatus({ type: "error", msg: "Error al subir el informe. Verifica tu conexión." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Server className="h-8 w-8 text-red-600" />
        <h1 className="text-2xl font-bold text-gray-900">Informes Técnicos</h1>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                placeholder="Ej. Informe de Mantenimiento de Servidores"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm h-24 resize-none"
                placeholder="Breve descripción de los trabajos realizados o el contenido del informe..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Archivo Adjunto</label>
              <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-red-300"
                }`}>
                <div className="space-y-2 text-center">
                  <FileText className={`mx-auto h-10 w-10 ${file ? "text-green-500" : "text-gray-400"}`} />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                      <span>{file ? "Cambiar archivo" : "Seleccionar archivo"}</span>
                      <input
                        id="file-input"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => {
                          setFile(e.target.files[0] || null);
                          setStatus(null);
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {file ? (
                      <span className="text-green-700 font-medium">{file.name}</span>
                    ) : (
                      "PDF, Word o Excel"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={uploading || !file || !title}
                className="w-full flex justify-center items-center px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? "Subiendo..." : "Subir Informe"}
              </button>
            </div>
          </form>
        </div>

        {/* Historial de Informes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informes Recientes</h2>

          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : informesTecnicos.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No hay informes técnicos registrados.
              </div>
            ) : (
              <ul className="space-y-4">
                {informesTecnicos.map((inf) => (
                  <li key={inf.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-white transition-colors group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">{inf.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{inf.description || "Sin descripción"}</p>
                        <div className="mt-2 flex items-center text-xs text-gray-400 space-x-3">
                          <span>{new Date(inf.created_at).toLocaleDateString('es-VE')}</span>
                          <span>•</span>
                          <span>{inf.user_name}</span>
                        </div>
                      </div>
                      <a
                        href={`/api/drive/download?fileId=${inf.file_drive_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                        title="Descargar Informe"
                      >
                        <Download className="h-5 w-5" />
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
