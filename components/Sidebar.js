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
  Users 
} from "lucide-react";

export default function Sidebar() {
  const { user } = useApp();
  const pathname = usePathname();

  if (!user) return null;

  const getLinks = () => {
    let links = [
      { name: "Inicio", path: "/dashboard", icon: Home },
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
    }

    return links;
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:block min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path;
          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-red-50 text-red-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`flex-shrink-0 mr-3 h-5 w-5 ${
                  isActive ? "text-red-600" : "text-gray-400"
                }`}
              />
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
