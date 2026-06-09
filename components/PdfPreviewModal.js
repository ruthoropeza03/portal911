"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Download, ExternalLink } from "lucide-react";

export default function PdfPreviewModal({ isOpen, onClose, fileId, fileName, fileMimeType, isPublic = false }) {
  const [loading, setLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !fileId) {
      setLoading(false);
      setPreviewError(false);
      setBlobUrl(null);
      return;
    }

    let active = true;
    const token = typeof window !== "undefined" ? localStorage.getItem("ven911_token") : null;
    const previewUrl = `/api/drive/download?fileId=${fileId}&inline=1${isPublic ? "&public=1" : ""}`;

    const loadPreview = async () => {
      setLoading(true);
      setPreviewError(false);
      setBlobUrl(null);

      if (!token) {
        setPreviewError(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(previewUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!active) return;
        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }

        setBlobUrl(url);
      } catch (error) {
        console.error("Error al cargar vista previa:", error);
        if (active) setPreviewError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPreview();

    return () => {
      active = false;
    };
  }, [isOpen, fileId, isPublic]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (!isOpen || !fileId) return null;

  const normalizedMime = fileMimeType?.toLowerCase() || "";
  const isImage = normalizedMime.startsWith("image/") || /\.(jpeg|jpg|png|gif|bmp|webp|svg)$/i.test(fileName || "");
  const previewUrl = blobUrl;
  const downloadUrl = blobUrl;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        {/* Backdrop / Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.45 }}
          className="relative w-full max-w-5xl h-[80vh] sm:h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <h3 className="text-base font-bold truncate" title={fileName}>
                Previsualización: {fileName}
              </h3>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href={downloadUrl}
                download
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="Descargar archivo"
              >
                <Download className="w-5 h-5" />
              </a>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="Abrir en pestaña nueva"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 bg-slate-100 relative flex items-center justify-center">
            {/* Loading Spinner */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 z-20">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
                <span className="text-sm font-semibold text-slate-600">Cargando vista previa...</span>
              </div>
            )}

            {previewError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <p className="text-sm font-semibold text-slate-700 mb-2">No se pudo cargar la previsualización.</p>
                <p className="text-xs text-slate-500 mb-4">Usa el botón de descarga para abrir el archivo.</p>
                <button
                  onClick={() => {
                    if (downloadUrl) {
                      window.open(downloadUrl, "_blank");
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar archivo
                </button>
              </div>
            ) : isImage ? (
              <img
                src={previewUrl}
                alt={fileName}
                className="w-full h-full object-contain bg-slate-100"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setPreviewError(true); }}
              />
            ) : (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title={fileName}
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setPreviewError(true); }}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
