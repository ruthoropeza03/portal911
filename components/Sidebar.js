"use client";

import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Newspaper,
  FileText,
  UploadCloud,
  CheckSquare,
  Users,
  Table2,
  ChevronLeft,
  ChevronRight,
  X,
  Bell
} from "lucide-react";

export default function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) {
  const { user } = useApp();
  const pathname = usePathname();

  if (!user) return null;

  const getLinks = () => {
    let links = [
      { name: "Inicio", path: "/dashboard", icon: Home },
      { name: "Notificaciones", path: "/dashboard/notificaciones", icon: Bell },
      { name: "Noticias", path: "/dashboard/noticias", icon: Newspaper },
      { name: "Formatos", path: "/dashboard/formatos", icon: FileText },
    ];

    if (user.role === "Coordinador") {
      links.push({ name: "Subir Reportes", path: "/dashboard/reportes", icon: UploadCloud });
    }

    if (user.role === "Gestión Humana") {
      links.push({ name: "Revisión Reportes", path: "/dashboard/revision", icon: CheckSquare });
    }

    if (user.role === "Administrador") {
      links.push({ name: "Usuarios", path: "/dashboard/usuarios", icon: Users });
      links.push({ name: "Bitacora", path: "/dashboard/bitacora", icon: Table2 });
    }

    return links;
  };

  const links = getLinks();

  // Sidebar para desktop (colapsable)
  const DesktopSidebar = () => (
    <aside
      className={`hidden md:block bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Botón para colapsar/expandir - más visible */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 bg-red-600 hover:bg-red-700 border-2 border-white rounded-full p-1.5 transition-all duration-200 z-10 shadow-md hover:shadow-lg group"
        title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-white" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-white" />
        )}
      </button>

      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path;
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group ${isActive
                  ? "bg-red-50 text-red-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? link.name : ""}
            >
              <Icon
                className={`flex-shrink-0 h-5 w-5 transition-all ${isActive ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"
                  } ${isCollapsed ? 'mr-0' : 'mr-3'}`}
              />
              {!isCollapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Indicador visual del estado de la sidebar */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className={`text-xs text-gray-400 transition-opacity duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}>
          ←
        </div>
        <div className={`text-xs text-gray-400 transition-opacity duration-300 ${!isCollapsed ? 'opacity-100' : 'opacity-0'}`}>
          →
        </div>
      </div>
    </aside>
  );

  // Sidebar para móvil (overlay)
  const MobileSidebar = () => (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 md:hidden transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'
          }`}
      >
        {/* Header del menú móvil */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <span className="font-bold text-xl text-gray-900">VEN 911</span>
          </div>
          <button
            onClick={onMobileClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cerrar menú"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Información del usuario en móvil */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500 mt-1">{user.role}</p>
        </div>

        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={onMobileClose}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                    ? "bg-red-50 text-red-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <Icon
                  className={`flex-shrink-0 mr-3 h-5 w-5 ${isActive ? "text-red-600" : "text-gray-400"
                    }`}
                />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}