"use client";

import { useApp } from "@/context/AppContext";
import { LogOut, Bell, Menu, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Navbar({ onMenuClick }) {
  const { user, logout, notificaciones, marcarNotificacionLeida, cargarNotificaciones } = useApp();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const unreadCount = notificaciones?.filter(n => !n.is_read).length || 0;

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    await marcarNotificacionLeida(id);
    await cargarNotificaciones(true);
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <ShimmerBar />
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Menú"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center">
              <Image src={'/logo.svg'} alt="logo" width={32} height={32} className="mr-3" />
              <div className="flex flex-col">
                <span className="font-bold text-xl text-gray-900 leading-none">
                  VEN 911
                </span>
                <span className="text-[10px] text-gray-500 font-medium tracking-wide mt-0.5">
                  Juntos por la Vida y la Paz
                </span>
              </div>
            </div>
          </div>

          {/* Carrusel de lema central */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
            <FadeTextCarousel
              items={[
                "VEN 9-1-1 Somos todos.",
                "Voluntad, Servicio, Respuesta Inmediata",
                "Juntos por la Vida y la Paz"
              ]}
              interval={4000}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-500 relative"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
                <Bell className="h-6 w-6" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                    <button
                      onClick={() => router.push('/dashboard/notificaciones')}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Ver todas
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notificaciones?.length > 0 ? (
                      notificaciones.slice(0, 5).map((noti) => (
                        <div
                          key={noti.id}
                          className={`px-4 py-3 border-b border-gray-50 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${!noti.is_read ? 'bg-red-50/20' : ''}`}
                          onClick={() => !noti.is_read && handleMarkRead(noti.id, { stopPropagation: () => { } })}
                        >
                          <div className={`mt-1 p-1.5 rounded-full ${!noti.is_read ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Bell className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${!noti.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {noti.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                              {noti.message}
                            </p>
                          </div>
                          {!noti.is_read && (
                            <button
                              onClick={(e) => handleMarkRead(noti.id, e)}
                              className="text-gray-400 hover:text-red-600 ml-1"
                              title="Marcar como leída"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        No tienes notificaciones
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-none">{user.name}</p>
                <p className="text-xs text-gray-500 mt-1">{user.role}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
                {user.name.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Carrusel de texto con fade ─────────────────────────────────── */
function FadeTextCarousel({ items, interval = 4000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // Primero ocultar con fade out
      setIsVisible(false);

      // Cambiar el texto después de que termine el fade out
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsVisible(true);
      }, 300); // Debe coincidir con la duración del fade en CSS
    }, interval);

    return () => clearInterval(timer);
  }, [items.length, interval]);

  return (
    <div className="relative flex items-center justify-center min-w-[320px]">
      <span
        className={`
          italic font-bold text-[24px] text-gray-800 
          transition-all duration-300 ease-in-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        `}
        style={{ whiteSpace: 'nowrap' }}
      >
        {items[currentIndex]}
      </span>
    </div>
  );
}

/* ─── Shimmer Bar ─────────────────────────────────────────────────── */
function ShimmerBar() {
  const VEN_RED = "#D32F2F";
  const VEN_GREEN = "#388E3C";
  return (
    <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden">
      <div
        className="h-full w-full"
        style={{
          background: `linear-gradient(90deg, ${VEN_RED} 0%, ${VEN_GREEN} 50%, ${VEN_RED} 100%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
          animation: "shimmer 2.5s linear infinite",
        }}
      />
    </div>
  );
}