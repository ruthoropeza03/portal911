"use client";

import { useApp } from "@/context/AppContext";
import { textoResumenNoticia } from "@/lib/formateadorNoticia";
import { Newspaper, Bell, Activity, Users, FileText } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardHome() {
  const { user, noticias, usuarios, reportes, formatos } = useApp();

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner Redesign ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl text-white shadow-lg p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, #0d1b2a 0%, #112d1c 55%, #2a0c10 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
            >
              ¡Bienvenido(a), {user?.name}!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="text-slate-300 mt-2 text-sm sm:text-base max-w-xl"
            >
              Portal de gestión y control del Centro de Comando, Control y Telecomunicaciones VEN 911 Lara. Juntos por la vida y la paz.
            </motion.p>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, type: "spring" }}
            className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 shrink-0 self-start md:self-auto"
          >
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-100">
              Sistema Activo
            </span>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Feed de Noticias Recientes ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Newspaper className="h-5 w-5 mr-2 text-red-600" />
              Noticias Recientes
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {noticias.filter(n => n.estado === 'publicada' && n.visible).length === 0 ? (
              <p className="text-gray-500 text-sm italic">No hay noticias publicadas.</p>
            ) : (
              noticias
                .filter(n => n.estado === 'publicada' && n.visible)
                .slice(0, 3)
                .map((noticia, index) => (
                  <motion.div
                    key={noticia.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.08 }}
                    className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
                  >
                    <Link
                      href={`/noticias/${noticia.id}?from=dashboard`}
                      className="group flex gap-4 items-start"
                    >
                      {/* Thumbnail (Miniatura) */}
                      {noticia.image_url ? (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={noticia.image_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex-shrink-0 bg-gradient-to-br from-red-500 to-green-600 flex items-center justify-center text-white shadow-sm">
                          <Newspaper className="w-8 h-8 opacity-80" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors text-sm sm:text-base truncate pr-2">
                            {noticia.title}
                          </h3>
                          <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                            {new Date(noticia.published_at).toLocaleDateString("es-VE")}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {textoResumenNoticia(noticia.content)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))
            )}
          </div>
        </motion.div>

        {/* ── Panel Secundario (Avisos + Métricas) ── */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-gradient-to-br from-red-50 to-white p-6 rounded-xl shadow-sm border border-red-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-red-600" />
              Avisos de Sistema
            </h2>
            <div className="space-y-3">
              <div className="bg-white/80 p-4 rounded-lg text-sm text-gray-700 border border-red-100 shadow-sm">
                Recuerde que el acceso a los módulos está restringido a sus permisos de <span className="font-semibold text-red-600">{user?.role}</span>.
              </div>
              {user?.role === "Gestión Humana" && (
                <div className="bg-white/80 p-4 rounded-lg text-sm text-gray-700 border border-red-100 shadow-sm">
                  🔔 Hay reportes pendientes por revisar en su bandeja.
                </div>
              )}
            </div>
          </motion.div>

          {/* Resumen Administrador (Métricas) */}
          {user?.role === "Administrador" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                Métricas del Sistema
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center shadow-sm cursor-pointer"
                >
                  <p className="text-3xl font-black text-red-600">{usuarios?.length || 0}</p>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Usuarios
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center shadow-sm cursor-pointer"
                >
                  <p className="text-3xl font-black text-red-600">{reportes?.length || 0}</p>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Reportes
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center shadow-sm cursor-pointer"
                >
                  <p className="text-3xl font-black text-blue-600">{noticias?.length || 0}</p>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                    <Newspaper className="w-3.5 h-3.5" /> Noticias
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center shadow-sm cursor-pointer"
                >
                  <p className="text-3xl font-black text-green-600">{formatos?.length || 0}</p>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> Formatos
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
