"use client";


import { useApp } from "@/context/AppContext";

export default function Bitacora() {

    const { user, bitacora } = useApp();

    if (!user) return null; // O un spinner de carga

    if (user.role !== "Administrador") {
        return (
            <div className="p-4 text-red-600 font-medium">
                No tienes permisos para ver esta página.
            </div>
        )
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Bitacora</h1>
        </div>
    );
}