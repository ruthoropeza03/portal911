"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";

export default function ConfiguracionPage() {
  const { user, updateMyProfile } = useApp();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const roleLabel = useMemo(() => user?.role || "Sin rol", [user?.role]);
  const departmentLabel = useMemo(
    () => user?.department_name || "Sin departamento asignado",
    [user?.department_name]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (form.password && form.password !== form.confirmPassword) {
      setFeedback({ type: "error", msg: "Las contraseñas no coinciden." });
      return;
    }

    setSaving(true);
    const result = await updateMyProfile({
      name: form.name,
      email: form.email,
      password: form.password,
    });
    setSaving(false);

    if (!result.success) {
      setFeedback({ type: "error", msg: result.error || "No se pudo guardar." });
      return;
    }

    setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    setFeedback({ type: "success", msg: "Perfil actualizado correctamente." });
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Aquí puedes actualizar tus datos de acceso al sistema.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">Rol</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{roleLabel}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">Departamento</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{departmentLabel}</p>
          </div>
        </div>

        {feedback && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              feedback.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              required
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ej. María López"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="usuario@ven911.gob.ve"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
