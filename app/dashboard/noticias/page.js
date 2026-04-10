"use client";

import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { PlusCircle, Search, Edit2, Trash2 } from "lucide-react";

export default function NoticiasPage() {
  const { user, noticias, addNoticia, deleteNoticia } = useApp();
  const isPrensa = user?.role === "Prensa" || user?.role === "Administrador";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ titulo: "", contenido: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (formData.titulo && formData.contenido) {
      addNoticia({
        titulo: formData.titulo,
        contenido: formData.contenido,
        fecha: new Date().toISOString().split("T")[0],
      });
      setFormData({ titulo: "", contenido: "" });
      setIsFormOpen(false);
    }
  };

  const filteredNoticias = noticias.filter(n => n.titulo.toLowerCase().includes(searchTerm.toLowerCase()));

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
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
              <textarea
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Publicar
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
                  <h3 className="text-lg font-semibold text-gray-900">{noticia.titulo}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {new Date(noticia.fecha).toLocaleDateString("es-VE")}
                    </span>
                    {isPrensa && (
                      <div className="flex items-center gap-2 ml-2">
                        <button className="text-blue-600 hover:text-blue-800" title="Editar (Simulado)">
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
                <p className="text-gray-700 whitespace-pre-line">{noticia.contenido}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
