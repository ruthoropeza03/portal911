"use client";

import { useState, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Plus, Search, Shield, Users, ChevronDown, X } from "lucide-react";

const ROLES = ["Coordinador", "Prensa", "Gestión Humana", "Administrador"];
const PAGE_SIZE = 10;
const emptyForm = { name: "", email: "", password: "", role: "Coordinador", department_id: "" };

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef(null);
  const set = (v) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(v), delay);
  };
  return [debounced, set];
}

export default function UsuariosPage() {
  const { user, usuarios, addUser, editUser, deleteUser } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Búsqueda y filtros
  const [rawSearch, setRawSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useDebounce("", 350);
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(0);

  if (user?.role !== "Administrador") {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Shield className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    );
  }

  const handleSearchChange = (v) => {
    setRawSearch(v);
    setDebouncedSearch(v);
    setPage(0);
  };

  const handleRoleFilter = (v) => {
    setRoleFilter(v);
    setPage(0);
  };

  // Filtrado y paginación (client-side porque la lista de usuarios es pequeña)
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return usuarios.filter((u) => {
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department_name ?? "").toLowerCase().includes(q);
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [usuarios, debouncedSearch, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFeedback(null);
    setShowModal(true);
  };

  const openEdit = (usr) => {
    setEditing(usr);
    setForm({ name: usr.name, email: usr.email, password: "", role: usr.role, department_id: usr.department_id || "" });
    setFeedback(null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      department_id: form.department_id || null,
      ...(form.password ? { password: form.password } : {}),
    };

    let result;
    if (editing) {
      result = await editUser(editing.id, payload);
    } else {
      if (!form.password) {
        setFeedback({ type: "error", msg: "La contraseña es obligatoria para nuevos usuarios." });
        setSaving(false);
        return;
      }
      result = await addUser(payload);
    }

    setSaving(false);
    if (result.success) {
      setShowModal(false);
    } else {
      setFeedback({ type: "error", msg: result.error || "No se pudo guardar." });
    }
  };

  const handleDelete = async (usr) => {
    if (!window.confirm(`¿Eliminar a ${usr.name}? Esta acción no se puede deshacer.`)) return;
    const result = await deleteUser(usr.id);
    if (!result.success) alert(result.error || "No se pudo eliminar el usuario.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-400">
              {filtered.length} de {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o departamento…"
              value={rawSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {rawSearch && (
              <button onClick={() => handleSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          {/* Filtro rol */}
          <div className="relative sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
            >
              <option value="">Todos los roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {(rawSearch || roleFilter) && (
          <div className="mt-2 flex gap-2">
            {rawSearch && (
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                "{rawSearch}" <button onClick={() => handleSearchChange("")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {roleFilter && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {roleFilter} <button onClick={() => handleRoleFilter("")}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Vista Móvil (Tarjetas) */}
      <div className="md:hidden space-y-4">
        {paginated.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center italic text-gray-400">
            No se encontraron usuarios.
          </div>
        ) : (
          paginated.map((usr) => (
            <div key={usr.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm flex-shrink-0">
                    {usr.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-bold text-gray-900">{usr.name}</h3>
                    <p className="text-xs text-gray-500">{usr.email}</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800">
                  {usr.role}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Departamento</p>
                  <p className="text-sm text-gray-600">{usr.department_name || "Sin asignar"}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(usr)} className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg">
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(usr)}
                    disabled={usr.id === user?.id}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vista Escritorio (Tabla) */}
      <div className="hidden md:block bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Departamento</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No se encontraron usuarios.</td>
                </tr>
              ) : (
                paginated.map((usr) => (
                  <tr key={usr.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm flex-shrink-0">
                          {usr.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">{usr.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usr.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {usr.department_name || <span className="italic text-gray-300">Sin asignar</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => openEdit(usr)} className="text-indigo-600 hover:text-indigo-900 transition-colors">
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(usr)}
                        className="text-red-500 hover:text-red-800 transition-colors"
                        disabled={usr.id === user?.id}
                        title={usr.id === user?.id ? "No puedes eliminarte a ti mismo" : ""}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-500">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Ant.
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  i === page ? "bg-red-600 text-white border-red-600" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Sig. →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editing ? `Editar: ${editing.name}` : "Nuevo Usuario"}
            </h2>

            {feedback && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
                {feedback.msg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ej. María López"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="usuario@ven911.gob.ve"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {editing && <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
                >
                  {saving ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
