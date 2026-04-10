"use client";

import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shield, User, Users, ClipboardList, Megaphone } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("");

  const roles = [
    { name: "Usuario General", icon: User, desc: "Ver noticias y formatos públicos." },
    { name: "Coordinador", icon: Users, desc: "Sube reportes quincenales." },
    { name: "Prensa", icon: Megaphone, desc: "Gestión de noticias y comunicados." },
    { name: "Gestión Humana", icon: ClipboardList, desc: "Revisión de reportes subidos." },
    { name: "Administrador", icon: Shield, desc: "Acceso total, gestión de usuarios." },
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    if (selectedRole) {
      login(selectedRole);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full border border-gray-200">
        <div className="text-center mb-8">
          <Image src={"/logo.svg"} alt="logo" width={30} height={30} className="mx-auto mb-3" />

          <h1 className="text-2xl font-bold text-gray-900">Portal VEN 911</h1>
          <p className="text-gray-500 mt-2">Centro de Comando y Control</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccione un Perfil de Simulación
            </label>
            <div className="grid gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.name;
                return (
                  <button
                    key={role.name}
                    type="button"
                    onClick={() => setSelectedRole(role.name)}
                    className={`flex items-start p-3 border rounded-lg text-left transition-all ${isSelected
                      ? "border-red-500 bg-red-50 ring-1 ring-red-500"
                      : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    <Icon
                      className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${isSelected ? "text-red-600" : "text-gray-400"
                        }`}
                    />
                    <div>
                      <p className={`font-medium ${isSelected ? "text-red-900" : "text-gray-900"}`}>
                        {role.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{role.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedRole}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
          >
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}
