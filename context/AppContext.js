"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

// Mock Data Inicial
const MOCK_USUARIOS = [
  { id: 1, nombre: "Juan Pérez", email: "juan@ven911.gob.ve", role: "Usuario General" },
  { id: 2, nombre: "María López", email: "maria@ven911.gob.ve", role: "Coordinador" },
  { id: 3, nombre: "Carlos Ruiz", email: "carlos@ven911.gob.ve", role: "Prensa" },
  { id: 4, nombre: "Ana Gómez", email: "ana@ven911.gob.ve", role: "Gestión Humana" },
  { id: 5, nombre: "Admin Principal", email: "admin@ven911.gob.ve", role: "Administrador" },
];

const MOCK_NOTICIAS = [
  {
    id: 1,
    titulo: "Jornada Especial de Salud en Sede Principal",
    fecha: "2024-05-10",
    contenido: "Se realizará una jornada de salud para todos los trabajadores...",
  },
  {
    id: 2,
    titulo: "Nuevas directrices de monitoreo ciudadano",
    fecha: "2024-05-08",
    contenido: "A partir de la próxima semana se implementarán nuevos protocolos...",
  },
  {
    id: 3,
    titulo: "Actualización tecnológica en centro de llamadas",
    fecha: "2024-05-05",
    contenido: "El equipo de telecomunicaciones ha instalado nuevas centrales...",
  },
];

const MOCK_REPORTES = [];

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [usuarios, setUsuarios] = useState(MOCK_USUARIOS);
  const [noticias, setNoticias] = useState(MOCK_NOTICIAS);
  const [reportes, setReportes] = useState(MOCK_REPORTES);
  const [mounted, setMounted] = useState(false);

  // Cargar datos de localStorage al montar
  useEffect(() => {
    const savedUser = localStorage.getItem("ven911_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedNoticias = localStorage.getItem("ven911_noticias");
    if (savedNoticias) setNoticias(JSON.parse(savedNoticias));

    const savedReportes = localStorage.getItem("ven911_reportes");
    if (savedReportes) setReportes(JSON.parse(savedReportes));

    setMounted(true);
  }, []);

  // Guardar datos temporalmente cuando cambian (si ya está montado)
  useEffect(() => {
    if (mounted) {
      if (user) {
        localStorage.setItem("ven911_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("ven911_user");
      }
    }
  }, [user, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("ven911_noticias", JSON.stringify(noticias));
    }
  }, [noticias, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("ven911_reportes", JSON.stringify(reportes));
    }
  }, [reportes, mounted]);

  const login = (role) => {
    const mockUser = MOCK_USUARIOS.find((u) => u.role === role);
    if (mockUser) {
      setUser(mockUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  // Acciones Noticias
  const addNoticia = (noticia) => setNoticias([{ ...noticia, id: Date.now() }, ...noticias]);
  const updateNoticia = (id, updated) =>
    setNoticias(noticias.map((n) => (n.id === id ? { ...n, ...updated } : n)));
  const deleteNoticia = (id) => setNoticias(noticias.filter((n) => n.id !== id));

  // Acciones Reportes
  const addReporte = (reporte) =>
    setReportes([{ ...reporte, id: Date.now(), revisado: false }, ...reportes]);
  const marcarReporteRevisado = (id) =>
    setReportes(reportes.map((r) => (r.id === id ? { ...r, revisado: true } : r)));

  return (
    <AppContext.Provider
      value={{
        user,
        usuarios,
        noticias,
        reportes,
        login,
        logout,
        addNoticia,
        updateNoticia,
        deleteNoticia,
        addReporte,
        marcarReporteRevisado,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
