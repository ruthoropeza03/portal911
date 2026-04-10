"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";

const ROLES = ["Coordinador", "Prensa", "Gestión Humana", "Administrador"];

const emptyForm = { name: "", email: "", password: "", role: "Coordinador", department_id: "" };

export default function UsuariosPage() {
  const { user, usuarios, addUser, editUser, deleteUser } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = new user, object = user being edited
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (user?.role !== "Administrador") {
    return <div className="p-4 text-red-600 font-medium">No tienes permisos para ver esta página.</div>;
  }

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <button
          onClick={openCreate}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No hay usuarios registrados.</td>
                </tr>
              ) : (
                usuarios.map((usr) => (
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
                      <button
                        onClick={() => openEdit(usr)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                      >
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
