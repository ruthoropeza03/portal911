"use client";

import { useApp } from "@/context/AppContext";
import { LogOut, Bell, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useApp();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Botón de menú para móvil */}
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Menú"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo - sin funcionalidad de colapsar */}
            <div className="flex items-center">
              <Image src={'/logo.svg'} alt="logo" width={30} height={30} className="mr-2" />
              <span className="font-bold text-xl text-gray-900">
                VEN 911
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              <Bell className="h-6 w-6" />
            </button>

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