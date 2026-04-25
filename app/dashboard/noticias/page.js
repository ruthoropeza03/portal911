"use client";

import { useApp } from "@/context/AppContext";
import { useState } from "react";
import Link from "next/link";
import { Newspaper, Plus, Search, Edit2, Trash2, X, ExternalLink, Upload, Loader2, Eye, EyeOff, ChevronDown, Clock, Calendar } from "lucide-react";
import { parseContenidoNoticia, textoRawParaEdicion, textoResumenNoticia } from "@/lib/formateadorNoticia";
import NoticiaContenido from "@/components/NoticiaContenido";

const emptyForm = () => ({
  title: "",
  content: "",
  imageFile: null,
  clearImage: false,
  publicationMode: "now",    // 'now' | 'scheduled'
  scheduledDate: "",          // valor del input datetime-local
});

// ─── Helpers de estado ───────────────────────────────────────────────────────

const BADGE_CONFIG = {
  publicada: { label: "Publicada", className: "text-green-800  bg-green-100  border-green-200" },
  programada: { label: "Programada", className: "text-blue-800   bg-blue-100   border-blue-200" },
  borrador: { label: "Borrador", className: "text-gray-700   bg-gray-100   border-gray-200" },
  archivada: { label: "Archivada", className: "text-amber-800  bg-amber-100  border-amber-200" },
};

function EstadoBadge({ estado }) {
  const cfg = BADGE_CONFIG[estado] ?? BADGE_CONFIG.borrador;
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function NoticiasPage() {
  const { user, noticias, addNoticia, updateNoticia, deleteNoticia } = useApp();
  const isPrensa = user?.role === "Prensa" || user?.role === "Administrador";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cardExpanded, setCardExpanded] = useState({});

  const isCardExpanded = (id) => cardExpanded[id] === true;

  const toggleCard = (id) => {
    setCardExpanded((prev) => ({ ...prev, [id]: prev[id] === true ? false : true }));
  };

  const resetFormAndClose = () => {
    setEditingId(null);
    setFormData(emptyForm());
    setImagePreview("");
    setIsFormOpen(false);
  };

  const openNewNoticia = () => {
    setEditingId(null);
    setFormData(emptyForm());
    setImagePreview("");
    setIsFormOpen(true);
  };

  const startEdit = (noticia) => {
    setEditingId(noticia.id);
    setFormData({
      title: noticia.title ?? "",
      content: textoRawParaEdicion(noticia.content),
      imageFile: null,
      clearImage: false,
      publicationMode: "now",
      scheduledDate: "",
    });
    setImagePreview(noticia.image_url || "");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    // Validar fecha programada antes de enviar
    if (formData.publicationMode === "scheduled") {
      if (!formData.scheduledDate) {
        alert("Por favor selecciona una fecha y hora de publicación.");
        return;
      }
      if (new Date(formData.scheduledDate) <= new Date()) {
        alert("La fecha programada debe ser en el futuro.");
        return;
      }
    }

    setSubmitting(true);
    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("content", formData.content);
    if (formData.imageFile) {
      payload.append("image", formData.imageFile);
    }
    if (editingId != null) {
      payload.append("clear_image", formData.clearImage ? "true" : "false");
    }
    // Agregar fecha programada solo si es nueva noticia en modo programado
    if (editingId == null && formData.publicationMode === "scheduled" && formData.scheduledDate) {
      // datetime-local devuelve hora local sin offset. Construimos un ISO con el
      // offset real del navegador para que NeonDB almacene el instante correcto.
      const localDate = new Date(formData.scheduledDate);
      const offsetMs = localDate.getTimezoneOffset() * 60_000;
      const localISO = new Date(localDate.getTime() - offsetMs).toISOString().slice(0, 16) +
        (localDate.getTimezoneOffset() <= 0
          ? "+" + String(Math.floor(-localDate.getTimezoneOffset() / 60)).padStart(2, "0") + ":" + String((-localDate.getTimezoneOffset()) % 60).padStart(2, "0")
          : "-" + String(Math.floor(localDate.getTimezoneOffset() / 60)).padStart(2, "0") + ":" + String(localDate.getTimezoneOffset() % 60).padStart(2, "0"));
      payload.append("fecha_programada", localISO);
    }

    const ok =
      editingId != null
        ? await updateNoticia(editingId, payload)
        : await addNoticia(payload);
    setSubmitting(false);
    if (ok) resetFormAndClose();
  };

  const handleImageFileChange = (file) => {
    setFormData((prev) => ({ ...prev, imageFile: file || null, clearImage: false }));
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      return;
    }
    setImagePreview("");
  };

  const handleDelete = async (id) => {
    await deleteNoticia(id);
    if (editingId === id) resetFormAndClose();
  };

  const toggleVisible = async (noticia) => {
    await updateNoticia(noticia.id, { visible: !noticia.visible });
  };

  // Valor mínimo para el datetime-local: ahora + 1 minuto
  const minDatetime = () => {
    const d = new Date(Date.now() + 60_000);
    // Formato requerido por datetime-local: YYYY-MM-DDTHH:mm (hora local, no UTC)
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const filteredNoticias = noticias.filter((n) =>
    (n.title ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center space-x-3">
          < Newspaper className="h-8 w-8 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Noticias y Comunicados</h1>
        </div>
        {isPrensa && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/dashboard/noticias/programadas"
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition touch-manipulation min-h-[44px] sm:min-h-0 text-sm font-medium"
            >
              <Clock className="h-4 w-4 mr-2 shrink-0" />
              Programadas
            </Link>
            <button
              type="button"
              onClick={openNewNoticia}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition touch-manipulation min-h-[44px] sm:min-h-0"
            >
              <Plus className="h-4 w-4 mr-2 shrink-0" />
              Nueva Noticia
            </button>
          </div>
        )}
      </div>

      {isFormOpen && isPrensa && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 w-full min-w-0">
          <h2 className="text-lg font-semibold mb-4">
            {editingId != null ? "Editar noticia" : "Publicar noticia"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
              <p className="text-xs text-gray-500 mb-2">
                El texto se publicará con formato institucional (sangría, interlineado 1,5). Puedes pegar en una
                línea el enlace de un post de Instagram, X, Facebook, TikTok o YouTube y se mostrará incrustado.
              </p>
              <textarea
                required
                rows={10}
                className="w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder={"Escribe el cuerpo de la noticia. Una línea en blanco separa párrafos.\n\nhttps://www.instagram.com/p/ejemplo/"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de portada (opcional)</label>
              <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 sm:p-5 text-center hover:border-red-400 transition-colors group cursor-pointer min-h-[120px] flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2 group-hover:text-red-500 transition-colors" />
                <p className="text-sm font-medium text-gray-600">
                  {formData.imageFile ? formData.imageFile.name : "Pulse para seleccionar imagen"}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">JPG, PNG, WEBP</p>
              </div>
              {editingId != null && imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, imageFile: null, clearImage: true }));
                    setImagePreview("");
                  }}
                  className="mt-2 text-xs inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                >
                  <X className="h-3.5 w-3.5" />
                  Quitar imagen actual
                </button>
              )}
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

            {/* ── Selector de publicación (solo en noticia nueva) ── */}
            {editingId == null && (
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-500" />
                  Publicación
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="publicationMode"
                      value="now"
                      checked={formData.publicationMode === "now"}
                      onChange={() => setFormData((prev) => ({ ...prev, publicationMode: "now", scheduledDate: "" }))}
                      className="accent-red-600"
                    />
                    <span className="text-sm text-gray-700">Publicar ahora</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="publicationMode"
                      value="scheduled"
                      checked={formData.publicationMode === "scheduled"}
                      onChange={() => setFormData((prev) => ({ ...prev, publicationMode: "scheduled" }))}
                      className="accent-red-600"
                    />
                    <span className="text-sm text-gray-700">Programar para más tarde</span>
                  </label>
                </div>

                {formData.publicationMode === "scheduled" && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Fecha y hora de publicación
                    </label>
                    <input
                      type="datetime-local"
                      min={minDatetime()}
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                      required={formData.publicationMode === "scheduled"}
                      className="w-full sm:w-auto px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      La noticia se publicará automáticamente en la fecha seleccionada (±10 min por el cron).
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={resetFormAndClose}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editingId != null ? "Guardando..." : formData.publicationMode === "scheduled" ? "Programando..." : "Publicando..."}
                  </span>
                ) : (
                  editingId != null
                    ? "Guardar cambios"
                    : formData.publicationMode === "scheduled"
                      ? "Programar publicación"
                      : "Publicar"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full min-w-0">
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative w-full max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              enterKeyHint="search"
              placeholder="Buscar noticia..."
              className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-sm touch-manipulation"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {filteredNoticias.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron noticias.</p>
          ) : (
            filteredNoticias.map((noticia) => {
              const expanded = isCardExpanded(noticia.id);
              const estadoNoticia = noticia.estado ?? "publicada";
              return (
                <article
                  key={noticia.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow w-full min-w-0"
                >
                  <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50/80 border-b border-gray-100 items-start">
                    <button
                      type="button"
                      onClick={() => toggleCard(noticia.id)}
                      className="mt-0.5 p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-200/80 touch-manipulation shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-expanded={expanded}
                      title={expanded ? "Minimizar" : "Maximizar"}
                    >
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">
                          {new Date(noticia.published_at).toLocaleDateString("es-VE")}
                        </span>
                        <EstadoBadge estado={estadoNoticia} />
                        {!noticia.visible && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                            Oculta
                          </span>
                        )}
                        {estadoNoticia === "programada" && noticia.fecha_programada && (
                          <span className="text-[10px] text-blue-700 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(noticia.fecha_programada).toLocaleString("es-VE", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words">
                        {noticia.title}
                      </h3>
                      {!expanded && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2 sm:line-clamp-3">
                          {textoResumenNoticia(noticia.content)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 shrink-0">
                      {estadoNoticia === "publicada" && noticia.visible && (
                        <Link
                          href={`/noticias/${noticia.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver público"
                          className="text-xs font-medium text-red-600 hover:text-red-800 inline-flex items-center gap-1 py-2 px-1 rounded-lg touch-manipulation"
                        >
                          <span className="hidden sm:inline">Ver público</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        </Link>
                      )}
                      {isPrensa && (
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <button
                            type="button"
                            onClick={() => toggleVisible(noticia)}
                            className={`p-2.5 rounded-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center ${noticia.visible
                              ? "text-green-600 hover:bg-green-50"
                              : "text-gray-500 hover:bg-gray-100"
                              }`}
                            title={noticia.visible ? "Visible" : "Oculto"}
                          >
                            {noticia.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(noticia)}
                            className="p-2.5 rounded-lg text-blue-600 hover:bg-blue-50 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(noticia.id)}
                            className="p-2.5 rounded-lg text-red-600 hover:bg-red-50 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="p-3 sm:p-4 pt-2 sm:pt-3 min-w-0">
                      {noticia.image_url && (
                        <div className="mb-4 -mx-1 sm:mx-0">
                          <img
                            src={noticia.image_url}
                            alt={noticia.title}
                            className="w-full max-h-64 sm:max-h-96 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/600x400/red/white?text=Imagen+no+disponible";
                              e.target.alt = "Imagen no disponible";
                            }}
                          />
                        </div>
                      )}

                      <NoticiaContenido blocks={parseContenidoNoticia(noticia.content).blocks} />
                      {noticia.author_name && (
                        <p className="text-xs text-gray-400 mt-3">Por: {noticia.author_name}</p>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}