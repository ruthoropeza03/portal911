"use client";

import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { PlusCircle, Search, Edit2, Trash2, Image as ImageIcon, X } from "lucide-react";

export default function NoticiasPage() {
  const { user, noticias, addNoticia, deleteNoticia } = useApp();
  const isPrensa = user?.role === "Prensa" || user?.role === "Administrador";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", image_url: "" });
  const [imagePreview, setImagePreview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    setSubmitting(true);
    await addNoticia({
      title: formData.title,
      content: formData.content,
      image_url: formData.image_url || null,
      visible: true,
    });
    setSubmitting(false);
    setFormData({ title: "", content: "", image_url: "" });
    setImagePreview("");
    setIsFormOpen(false);
  };

  // Previsualizar imagen cuando se ingresa una URL
  const handleImageUrlChange = (url) => {
    setFormData({ ...formData, image_url: url });
    setImagePreview(url);
  };

  const filteredNoticias = noticias.filter(n =>
    (n.title ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Noticias y Comunicados</h1>
        {isPrensa && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Nueva Noticia
          </button>
        )}
      </div>

      {isFormOpen && isPrensa && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Publicar Noticia</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
              <textarea
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de Imagen (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.image_url}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => handleImageUrlChange("")}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    title="Limpiar imagen"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Puedes usar imágenes de: Imgur, Flickr, Cloudinary, Google Drive (compartidas públicamente), o cualquier URL directa de imagen.
              </p>
            </div>

            {/* Previsualización de imagen */}
            {imagePreview && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">Previsualización:</label>
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="max-h-48 rounded-lg object-contain mx-auto border border-gray-300"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/600x400/red/white?text=Error+de+imagen";
                      e.target.alt = "Error al cargar la imagen";
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {imagePreview.length > 50 ? imagePreview.substring(0, 50) + "..." : imagePreview}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setImagePreview("");
                  setFormData({ title: "", content: "", image_url: "" });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
              >
                {submitting ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar noticia..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 space-y-6">
          {filteredNoticias.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron noticias.</p>
          ) : (
            filteredNoticias.map((noticia) => (
              <article key={noticia.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{noticia.title}</h3>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {new Date(noticia.published_at).toLocaleDateString("es-VE")}
                    </span>
                    {!noticia.visible && (
                      <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Oculta</span>
                    )}
                    {isPrensa && (
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800" title="Editar (próximamente)">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteNoticia(noticia.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mostrar imagen de la noticia */}
                {noticia.image_url && (
                  <div className="mb-4">
                    <img
                      src={noticia.image_url}
                      alt={noticia.title}
                      className="w-full max-h-96 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.src = "https://placehold.co/600x400/red/white?text=Imagen+no+disponible";
                        e.target.alt = "Imagen no disponible";
                      }}
                    />
                  </div>
                )}

                <p className="text-gray-700 whitespace-pre-line">{noticia.content}</p>
                {noticia.author_name && (
                  <p className="text-xs text-gray-400 mt-3">Por: {noticia.author_name}</p>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}