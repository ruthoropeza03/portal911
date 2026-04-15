"use client";

import { useApp } from "@/context/AppContext";
import { textoResumenNoticia } from "@/lib/formateadorNoticia";
import { Newspaper, Bell } from "lucide-react";

export default function DashboardHome() {
  const { user, noticias, usuarios, reportes, formatos } = useApp();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido(a), {user?.name}</h1>
        <p className="text-gray-500 mt-1">Estás accediendo bajo el rol de: <span className="font-semibold text-red-600">{user?.role}</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed de noticias recientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Newspaper className="h-5 w-5 mr-2 text-red-600" />
              Noticias Recientes
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {noticias.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No hay noticias publicadas.</p>
            ) : (
              noticias.slice(0, 3).map((noticia) => (
                <div key={noticia.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">{noticia.title}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {new Date(noticia.published_at).toLocaleDateString("es-VE")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {textoResumenNoticia(noticia.content)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel secundario según rol */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-xl shadow-sm border border-red-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-red-600" />
              Avisos de Sistema
            </h2>
            <div className="space-y-3">
              <div className="bg-white/80 p-4 rounded-lg text-sm text-gray-700 border border-red-100 shadow-sm">
                Recuerde que el acceso a los módulos está restringido a sus permisos de <span className="font-semibold text-red-600">{user?.role}</span>.
              </div>
              {user?.role === "Coordinador" && (
                <div className="bg-white/80 p-4 rounded-lg text-sm text-gray-700 border border-red-100 shadow-sm">
                  ⚠️ Tiene hasta el 15 y el 30 de cada mes para subir los reportes quincenales.
                </div>
              )}
              {user?.role === "Gestión Humana" && (
                <div className="bg-white/80 p-4 rounded-lg text-sm text-gray-700 border border-red-100 shadow-sm">
                  🔔 Hay reportes pendientes por revisar en su bandeja.
                </div>
              )}
            </div>
          </div>

          {/* Resumen Administrador */}
          {user?.role === "Administrador" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                Métricas del Sistema
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center hover:shadow-md transition-shadow">
                  <p className="text-3xl font-black text-red-600">{usuarios?.length || 0}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Usuarios</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center hover:shadow-md transition-shadow">
                  <p className="text-3xl font-black text-red-600">{reportes?.length || 0}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Reportes</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center hover:shadow-md transition-shadow">
                  <p className="text-3xl font-black text-blue-600">{noticias?.length || 0}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Noticias</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center hover:shadow-md transition-shadow">
                  <p className="text-3xl font-black text-green-600">{formatos?.length || 0}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Formatos</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
