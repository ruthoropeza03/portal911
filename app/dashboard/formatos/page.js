"use client";

import { useState, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { FileText, Download, Plus, Trash2, X, Upload, Loader2, Search, Eye } from "lucide-react";
import PdfPreviewModal from "@/components/PdfPreviewModal";

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

export default function FormatosPage() {
  const { user, formatos, addFormato, deleteFormato } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rawSearch, debouncedSearch, setSearch] = useDebounce(350);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, fileId: null, fileName: "" });
  const [page, setPage] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null
  });

  const canManage = user?.role === "Administrador" || user?.role === "Gestión Humana";

  const filteredFormatos = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return formatos;
    return formatos.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description ?? "").toLowerCase().includes(q)
    );
  }, [formatos, debouncedSearch]);

  const PAGE_SIZE_FORMATOS = 9; // 3-column grid
  const totalPages = Math.max(1, Math.ceil(filteredFormatos.length / PAGE_SIZE_FORMATOS));
  const paginatedFormatos = filteredFormatos.slice(page * PAGE_SIZE_FORMATOS, (page + 1) * PAGE_SIZE_FORMATOS);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file || !formData.name) return;

    setLoading(true);
    const data = new FormData();
    data.append("file", formData.file);
    data.append("name", formData.name);
    data.append("description", formData.description);

    const success = await addFormato(data);
    setLoading(false);
    if (success) {
      setIsModalOpen(false);
      setFormData({ name: "", description: "", file: null });
      setPage(0); // volver a primera página al agregar nuevo
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Está seguro de eliminar este formato permanentemente?")) {
      await deleteFormato(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Formatos</h1>
            <p className="text-sm text-gray-400">{filteredFormatos.length} de {formatos.length} formato{formatos.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Formato
          </button>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar formato por nombre o descripción…"
            value={rawSearch}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {rawSearch && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFormatos.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-900 font-semibold">No hay formatos disponibles</h3>
            <p className="text-gray-500 text-sm">Los documentos institucionales aparecerán aquí una vez subidos.</p>
          </div>
        ) : (
          paginatedFormatos.map((formato) => (
            <div key={formato.id} className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-red-50 p-3 rounded-xl transform group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                {canManage && (
                  <button
                    onClick={() => handleDelete(formato.id)}
                    className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar formato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-gray-900 leading-tight group-hover:text-red-700 transition-colors line-clamp-2 min-h-[2.5rem]">
                  {formato.name}
                </h3>
                <p className="text-xs text-gray-400 mt-2 font-medium">Actualizado: {new Date(formato.updated_at).toLocaleDateString()}</p>
              </div>

              <p className="text-sm text-gray-600 mb-6 flex-grow line-clamp-3 italic">
                {formato.description || "Sin descripción proporcionada."}
              </p>

              <div className="flex gap-2 w-full mt-auto">
                {formato.file_name?.toLowerCase().endsWith('.pdf') && (
                  <button
                    onClick={() => setPreviewModal({ isOpen: true, fileId: formato.file_drive_id, fileName: formato.name })}
                    className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-200 text-xs font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all active:bg-gray-100"
                  >
                    <Eye className="h-4 w-4 mr-1 text-slate-500" />
                    Previsualizar
                  </button>
                )}
                <a
                  href={`/api/drive/download?fileId=${formato.file_drive_id}&public=1`}
                  className={`${formato.file_name?.toLowerCase().endsWith('.pdf') ? 'flex-1' : 'w-full'} flex items-center justify-center px-3 py-2 border border-gray-200 text-xs font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all active:bg-gray-100`}
                >
                  <Download className="h-4 w-4 mr-1 text-red-600" />
                  Descargar
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-500">
            Mostrando {page * PAGE_SIZE_FORMATOS + 1}–{Math.min((page + 1) * PAGE_SIZE_FORMATOS, filteredFormatos.length)} de {filteredFormatos.length}
          </p>
          <div className="flex gap-1">
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
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  i === page ? "bg-red-600 text-white border-red-600" : "border-gray-200 hover:bg-gray-50"
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

      {/* Modal de Carga */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-bold text-gray-900">Subir Nuevo Formato</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Formato</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Formato de Rol de Guardia"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                <textarea
                  rows="3"
                  placeholder="Explique para qué sirve este documento..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Archivo</label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-red-400 transition-colors group cursor-pointer">
                  <input
                    type="file"
                    required
                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-red-500 transition-colors" />
                  <p className="text-sm font-medium text-gray-600">
                    {formData.file ? formData.file.name : "Pulse para seleccionar archivo"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase">PDF, Excel, Word admitidos</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.file || !formData.name}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Subiendo a Drive...
                  </>
                ) : "Publicar Formato"}
              </button>
            </form>
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

