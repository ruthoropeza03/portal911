"use client";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email && password) {
      setLoading(true);
      setErrorMsg("");
      const res = await login(email, password);
      setLoading(false);
      
      if (res.success) {
        router.push("/dashboard");
      } else {
        setErrorMsg(res.error || "Error de inicio de sesión");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full border border-gray-200">
        <div className="text-center mb-8">
          <Image src={"/logo.svg"} alt="logo" width={50} height={50} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Portal VEN 911</h1>
          <p className="text-gray-500 mt-2">Acceso al Sistema</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@ven911.gob.ve"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
            />
            <p className="text-xs text-gray-500 mt-2">Prueba local: juan@ven911.gob.ve / 123456</p>
          </div>

          <button
            type="submit"
            disabled={!email || !password || loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Autenticando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}