"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [bitacora, setBitacora] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [informesTecnicos, setInformesTecnicos] = useState([]);
  const [toastConfig, setToastConfig] = useState({ isVisible: false, title: '', message: '', type: 'info' });
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("ven911_token");
    localStorage.removeItem("ven911_user");
    setUser(null);
    router.push("/login");
  }, [router]);

  // Función genérica para fetch autenticado
  const fetchAPI = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem("ven911_token");
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    };
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    if (response.status === 401) {
      logout();
      return null;
    }

    return response.json();
  }, [logout]);

  // Cargar user del token al montar
  useEffect(() => {
    const savedToken = localStorage.getItem("ven911_token");
    const savedUser = localStorage.getItem("ven911_user");
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setMounted(true);
  }, []);

  // Cargar datos principales si el usuario está autenticado
  useEffect(() => {
    if (mounted && user) {
      cargarNoticias();
      cargarFormatos();

      if (user.role === "Administrador") {
        cargarUsuarios();
        cargarBitacora();
      }

      if (['Coordinador', 'Gestión Humana', 'Administrador'].includes(user.role) || ['Televigilancia', 'Tecnologia'].includes(user.department_name)) {
        cargarReportes();
        cargarInformesTecnicos();
      }

      cargarNotificaciones(true);
    }
  }, [user, mounted]);

  // Polling para notificaciones cada 30 segundos
  useEffect(() => {
    if (mounted && user) {
      const interval = setInterval(() => {
        verificarNuevasNotificaciones();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [user, mounted, notificaciones]);

  const cargarNoticias = useCallback(async () => {
    const data = await fetchAPI('/api/news');
    if (data && !data.error) setNoticias(data);
  }, [fetchAPI]);

  const cargarFormatos = useCallback(async () => {
    const data = await fetchAPI('/api/formats');
    if (data && !data.error) setFormatos(data);
  }, [fetchAPI]);

  const cargarUsuarios = useCallback(async () => {
    const data = await fetchAPI('/api/users');
    if (data && !data.error) setUsuarios(data);
  }, [fetchAPI]);

  const cargarReportes = useCallback(async () => {
    const data = await fetchAPI('/api/reports');
    if (data && !data.error) setReportes(data);
  }, [fetchAPI]);

  const cargarBitacora = useCallback(async () => {
    const data = await fetchAPI('/api/audit-log?limit=200');
    if (data && !data.error) setBitacora(data.logs ?? []);
  }, [fetchAPI]);

  const cargarNotificaciones = useCallback(async (unreadOnly = true) => {
    const data = await fetchAPI(`/api/notificaciones?unread=${unreadOnly}`);
    if (data && !data.error) setNotificaciones(data);
  }, [fetchAPI]);
  
  const cargarInformesTecnicos = useCallback(async () => {
    const data = await fetchAPI('/api/technical-reports');
    if (data && !data.error) setInformesTecnicos(data);
  }, [fetchAPI]);

  const verificarNuevasNotificaciones = useCallback(async () => {
    const data = await fetchAPI(`/api/notificaciones?unread=true`);
    if (data && !data.error && Array.isArray(data)) {
      // Si hay notificaciones nuevas que no teníamos antes
      const nuevas = data.filter(n => !notificaciones.find(hn => hn.id === n.id));
      if (nuevas.length > 0) {
        setNotificaciones(data);
        mostrarToast(
          nuevas[0].title, 
          nuevas[0].message || 'Tienes nuevas notificaciones',
          nuevas[0].type || 'info'
        );
      }
    }
  }, [notificaciones, fetchAPI]);

  const marcarNotificacionLeida = async (id = null, markAllRead = false) => {
    const data = await fetchAPI('/api/notificaciones', {
      method: 'PUT',
      body: JSON.stringify({ id, markAllRead })
    });
    if (data?.success) {
      // Opcionalmente podemos recargar en vez de setear
      // cargarNotificaciones(true); // O la página llamará esto
    }
  };

  const mostrarToast = (title, message, type = 'info') => {
    setToastConfig({ isVisible: true, title, message, type });
  };

  const cerrarToast = () => {
    setToastConfig(prev => ({ ...prev, isVisible: false }));
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("ven911_token", data.token);
        localStorage.setItem("ven911_user", JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e) {
      return { success: false, error: 'Error de red' };
    }
  };


  // Acciones Noticias
  const addNoticia = useCallback(async (noticia) => {
    const body = noticia instanceof FormData ? noticia : JSON.stringify(noticia);
    const data = await fetchAPI('/api/news', {
      method: 'POST',
      body
    });
    if (data && !data.error) {
      await cargarNoticias();
      return true;
    }
    return false;
  }, [cargarNoticias, fetchAPI]);

  const updateNoticia = useCallback(async (id, noticia) => {
    const body = noticia instanceof FormData ? noticia : JSON.stringify(noticia);
    const data = await fetchAPI(`/api/news/${id}`, {
      method: 'PUT',
      body
    });
    if (data && !data.error) {
      await cargarNoticias();
      return true;
    }
    return false;
  }, [cargarNoticias, fetchAPI]);

  const deleteNoticia = useCallback(async (id) => {
    await fetchAPI(`/api/news/${id}`, { method: 'DELETE' });
    cargarNoticias();
  }, [cargarNoticias, fetchAPI]);

  // Acciones Reportes
  const addReporte = useCallback(async (formData) => {
    const data = await fetchAPI('/api/reports', {
      method: 'POST',
      body: formData
    });
    if (data && !data.error) {
      await cargarReportes();
      return true;
    }
    return false;
  }, [cargarReportes, fetchAPI]);

  const marcarReporteRevisado = useCallback(async (id, status = 'reviewed', comment = '') => {
    const data = await fetchAPI(`/api/reports/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, comment })
    });
    if (data && !data.error) {
      await cargarReportes();
    }
  }, [cargarReportes, fetchAPI]);

  const addInformeTecnico = useCallback(async (formData) => {
    const data = await fetchAPI('/api/technical-reports', {
      method: 'POST',
      body: formData
    });
    if (data && !data.error) {
      await cargarInformesTecnicos();
      return { success: true };
    }
    return { success: false, error: data?.error || 'Error al subir informe técnico' };
  }, [cargarInformesTecnicos, fetchAPI]);

  // Acciones Usuarios
  const addUser = useCallback(async (userData) => {
    const data = await fetchAPI('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (data && !data.error) {
      await cargarUsuarios();
      return { success: true };
    }
    return { success: false, error: data?.error || 'Error al crear' };
  }, [cargarUsuarios, fetchAPI]);

  const editUser = useCallback(async (id, userData) => {
    const data = await fetchAPI(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    if (data && !data.error) {
      await cargarUsuarios();
      return { success: true };
    }
    return { success: false, error: data?.error || 'Error al editar' };
  }, [cargarUsuarios, fetchAPI]);

  const deleteUser = useCallback(async (id) => {
    const data = await fetchAPI(`/api/users/${id}`, { method: 'DELETE' });
    if (data && !data.error) {
      await cargarUsuarios();
      return { success: true };
    }
    return { success: false, error: data?.error || 'Error al eliminar' };
  }, [cargarUsuarios, fetchAPI]);

  const updateMyProfile = useCallback(async (profileData) => {
    const payload = {
      name: profileData?.name?.trim(),
      email: profileData?.email?.trim()?.toLowerCase(),
      ...(profileData?.password ? { password: profileData.password } : {})
    };

    const data = await fetchAPI('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (data && !data.error) {
      const updatedUser = {
        ...user,
        name: data.name,
        email: data.email,
        role: data.role,
        department_name: data.department_name ?? user?.department_name ?? null
      };

      setUser(updatedUser);
      localStorage.setItem("ven911_user", JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    }

    return { success: false, error: data?.error || 'Error al actualizar perfil' };
  }, [fetchAPI, user]);

  // Acciones Formatos
  const addFormato = useCallback(async (formData) => {
    const data = await fetchAPI('/api/formats', {
      method: 'POST',
      body: formData
    });
    if (data && !data.error) {
      await cargarFormatos();
      return { success: true };
    }
    return { success: false, error: data?.error || 'Error al subir formato' };
  }, [cargarFormatos, fetchAPI]);

  const deleteFormato = useCallback(async (id) => {
    const data = await fetchAPI('/api/formats', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
    if (data && !data.error) {
      await cargarFormatos();
      return { success: true };
    }
    return { success: false, error: data?.error || 'Error al eliminar formato' };
  }, [cargarFormatos, fetchAPI]);

  return (
    <AppContext.Provider
      value={{
        user,
        usuarios,
        noticias,
        reportes,
        formatos,
        bitacora,
        login,
        logout,
        addNoticia,
        updateNoticia,
        deleteNoticia,
        addReporte,
        marcarReporteRevisado,
        addUser,
        editUser,
        deleteUser,
        updateMyProfile,
        addFormato,
        deleteFormato,
        notificaciones,
        cargarNotificaciones,
        marcarNotificacionLeida,
        informesTecnicos,
        cargarInformesTecnicos,
        addInformeTecnico,
        cargarReportes,
        cargarBitacora,
        fetchAPI,
      }}
    >
      <Toast 
        isVisible={toastConfig.isVisible} 
        title={toastConfig.title}
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={cerrarToast}
      />
      {children}
    </AppContext.Provider>
  );

}

export const useApp = () => useContext(AppContext);
