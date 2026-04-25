"use client";

import { useApp } from "@/context/AppContext";
import { Bell, Check, Trash2, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function NotificacionesPage() {
  const { user, notificaciones, cargarNotificaciones, marcarNotificacionLeida } = useApp();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarNotificaciones(false); // Cargar todas las notificaciones
  }, []);

  const handleMarkAllRead = async () => {
    setLoading(true);
    await marcarNotificacionLeida(null, true);
    await cargarNotificaciones(false);
    setLoading(false);
  };

  const handleMarkRead = async (id) => {
    await marcarNotificacionLeida(id);
    await cargarNotificaciones(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-red-600 pl-3">
            Centro de Notificaciones
          </h1>
          <p className="text-gray-500 mt-1 pl-4">
            Historial de alertas y avisos del sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={handleMarkAllRead}
            disabled={loading || notificaciones.filter(n => !n.is_read).length === 0}
            className="flex items-center px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {notificaciones && notificaciones.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {notificaciones.map((notificacion) => (
              <li 
                key={notificacion.id} 
                className={`p-4 sm:px-6 transition-colors hover:bg-gray-50 ${!notificacion.is_read ? 'bg-red-50/30' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`p-2 rounded-full ${!notificacion.is_read ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Bell className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <p className={`text-sm font-medium ${!notificacion.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notificacion.title}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center flex-shrink-0">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(notificacion.created_at).toLocaleString('es-VE')}
                        </p>
                      </div>
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                        <p className={`text-sm ${!notificacion.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notificacion.message}
                        </p>
                        {!notificacion.is_read && (
                          <button
                            onClick={() => handleMarkRead(notificacion.id)}
                            className="flex-shrink-0 self-start sm:self-auto text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                          >
                            Marcar leída
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center bg-gray-50">
            <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay notificaciones disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}
