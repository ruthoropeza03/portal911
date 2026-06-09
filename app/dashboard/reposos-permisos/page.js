"use client";

import { useApp } from "@/context/AppContext";
import { useState, useEffect, useMemo } from "react";
import { 
  HeartPulse, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Search, 
  X, 
  User, 
  Briefcase, 
  MessageSquare, 
  CheckSquare, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Activity,
  Plus
} from "lucide-react";
import PdfPreviewModal from "@/components/PdfPreviewModal";

const PAGE_SIZE = 8;

export default function RepososPermisosPage() {
  const { user, fetchAPI } = useApp();
  
  // Estados generales
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(""); // Ajustado según rol al montar
  const [statusMessage, setStatusMessage] = useState(null);

  // Estados del Formulario (Coordinador)
  const [applicantName, setApplicantName] = useState("");
  const [applicantCedula, setApplicantCedula] = useState("");
  const [leaveType, setLeaveType] = useState("Reposo");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [daysNeeded, setDaysNeeded] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Estados de Búsqueda y Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("Todos");
  const [filterMonth, setFilterMonth] = useState("Todos");
  const [filterType, setFilterType] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(0);

  // Estados de Revisión (Gestión Humana)
  const [reviewComment, setReviewComment] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [updatingReview, setUpdatingReview] = useState(false);

  // Previsualizador de archivos
  const [previewModal, setPreviewModal] = useState({ isOpen: false, fileId: null, fileName: "", fileMimeType: null });

  // Cargar solicitudes desde el servidor
  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI("/api/leaves");
      if (data && !data.error) {
        setLeaves(data);
      }
    } catch (error) {
      console.error("Error al cargar reposos/permisos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      cargarSolicitudes();
      // Establecer pestaña predeterminada por rol
      if (user.role === "Coordinador") {
        setActiveTab("solicitar");
      } else {
        setActiveTab("pendientes");
      }
    }
  }, [user]);

  // Si no está cargado el usuario
  if (!user) return null;

  // Manejar el submit del registro (Coordinador)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!applicantName.trim()) {
      setStatusMessage({ type: "error", msg: "Debe ingresar el nombre del solicitante." });
      return;
    }
    const cedulaDigitos = applicantCedula.trim().replace(/[^0-9]/g, '');
    if (cedulaDigitos.length < 6 || cedulaDigitos.length > 8) {
      setStatusMessage({ type: "error", msg: "La cédula debe contener entre 6 y 8 dígitos numéricos." });
      return;
    }
    if (!startDate) {
      setStatusMessage({ type: "error", msg: "Debe ingresar la fecha de inicio." });
      return;
    }
    const days = parseInt(daysNeeded);
    if (isNaN(days) || days <= 0) {
      setStatusMessage({ type: "error", msg: "Los días solicitados deben ser mayores a 0." });
      return;
    }
    if (!reason.trim()) {
      setStatusMessage({ type: "error", msg: "Debe detallar el motivo." });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    let fileData = { fileUrl: null, fileDriveId: null, fileName: null, fileSize: null };

    try {
      // Subir archivo primero si existe
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetchAPI("/api/leaves/upload", {
          method: "POST",
          body: formData
        });

        if (uploadRes && !uploadRes.error) {
          fileData = {
            fileUrl: uploadRes.fileUrl,
            fileDriveId: uploadRes.fileDriveId,
            fileName: uploadRes.fileName,
            fileSize: uploadRes.fileSize
          };
        } else {
          throw new Error(uploadRes?.error || "Error al subir el archivo adjunto.");
        }
      }

      // Crear solicitud en BD
      const requestData = {
        applicant_name: applicantName,
        applicant_cedula: applicantCedula,
        leave_type: leaveType,
        reason,
        start_date: startDate,
        days_needed: days,
        file_name: fileData.fileName,
        file_drive_id: fileData.fileDriveId,
        file_mime_type: file ? file.type : null,
        file_size: fileData.fileSize
      };

      const res = await fetchAPI("/api/leaves", {
        method: "POST",
        body: JSON.stringify(requestData)
      });

      if (res && !res.error) {
        setStatusMessage({ type: "success", msg: "Solicitud registrada y enviada a Gestión Humana correctamente." });
        setApplicantName("");
        setApplicantCedula("");
        setReason("");
        setStartDate("");
        setDaysNeeded("");
        setFile(null);
        // Limpiar input file
        const input = document.getElementById("leave-file-input");
        if (input) input.value = "";
        
        cargarSolicitudes();
        setActiveTab("historial");
      } else {
        setStatusMessage({ type: "error", msg: res?.error || "Error al registrar la solicitud." });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", msg: err.message || "Error al procesar la solicitud." });
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar el submit de revisión (Gestión Humana)
  const handleReviewSubmit = async (e, id) => {
    e.preventDefault();
    setUpdatingReview(true);

    try {
      const res = await fetchAPI(`/api/leaves/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "revisado",
          review_comment: reviewComment
        })
      });

      if (res && !res.error) {
        setStatusMessage({ type: "success", msg: "Solicitud marcada como revisada." });
        setReviewComment("");
        setReviewingId(null);
        cargarSolicitudes();
      } else {
        setStatusMessage({ type: "error", msg: res?.error || "Error al actualizar la solicitud." });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", msg: "Error al enviar la revisión." });
    } finally {
      setUpdatingReview(false);
    }
  };

  // Listado de meses en español para los filtros
  const MESES_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const getNombreMesAnio = (dateStr) => {
    if (!dateStr) return "Desconocido";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Desconocido";

    const mes = MESES_ES[date.getMonth()];
    const anio = date.getFullYear();
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${anio}`;
  };

  // Opciones únicas para los selectores de filtro
  const departamentosDisponibles = useMemo(() => {
    const depts = new Set(leaves.map(l => l.department_name).filter(Boolean));
    return ["Todos", ...Array.from(depts)];
  }, [leaves]);

  const mesesDisponibles = useMemo(() => {
    const meses = new Set(leaves
      .map(l => getNombreMesAnio(l.start_date))
      .filter(m => m !== "Desconocido"));
    return ["Todos", ...Array.from(meses)];
  }, [leaves]);

  // Filtrado de solicitudes para la vista de historial y métricas
  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const cumpleBusqueda = l.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            l.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const cumpleDept = filterDept === "Todos" || l.department_name === filterDept;
      
      const cumpleMes = filterMonth === "Todos" || getNombreMesAnio(l.start_date) === filterMonth;

      const cumpleTipo = filterType === "Todos" || l.leave_type === filterType;

      return cumpleBusqueda && cumpleDept && cumpleMes && cumpleTipo;
    });
  }, [leaves, searchTerm, filterDept, filterMonth, filterType]);

  // Paginación del historial
  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / PAGE_SIZE));
  const paginatedLeaves = useMemo(() => {
    return filteredLeaves.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  }, [filteredLeaves, currentPage]);

  // Listas de pendientes y revisados para Gestión Humana
  const pendingLeaves = useMemo(() => {
    return leaves.filter(l => l.status === "pendiente");
  }, [leaves]);

  const reviewedLeaves = useMemo(() => {
    return leaves.filter(l => l.status === "revisado");
  }, [leaves]);

  // ── CÁLCULO DE MÉTRICAS (Para Gestión Humana / Administrador) ──
  const metricas = useMemo(() => {
    const totalSolicitudes = filteredLeaves.length;
    const totalDias = filteredLeaves.reduce((acc, l) => acc + l.days_needed, 0);

    // 1. Solicitudes por Mes
    const porMes = {};
    // 2. Solicitudes por Departamento
    const porDept = {};
    // 3. Solicitudes por Solicitante (Cantidad)
    const porSolicitanteCant = {};
    // 4. Días por Solicitante por Mes (Cruse)
    const porSolicitanteMesDias = {};

    filteredLeaves.forEach(l => {
      const mesAnio = getNombreMesAnio(l.start_date);
      const dept = l.department_name || "Sin Departamento";
      const solicitante = l.applicant_name;
      const dias = l.days_needed;

      // Por Mes
      porMes[mesAnio] = (porMes[mesAnio] || 0) + 1;
      
      // Por Dept
      porDept[dept] = (porDept[dept] || 0) + 1;

      // Por Solicitante Cantidad
      porSolicitanteCant[solicitante] = (porSolicitanteCant[solicitante] || 0) + 1;

      // Días por Solicitante por Mes
      const claveCruse = `${solicitante} (${mesAnio})`;
      porSolicitanteMesDias[claveCruse] = (porSolicitanteMesDias[claveCruse] || 0) + dias;
    });

    return {
      totalSolicitudes,
      totalDias,
      porMes: Object.entries(porMes).map(([label, val]) => ({ label, val })),
      porDept: Object.entries(porDept).map(([label, val]) => ({ label, val })),
      porSolicitanteCant: Object.entries(porSolicitanteCant)
        .map(([label, val]) => ({ label, val }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 10), // Primeros 10 registros
      porSolicitanteMesDias: Object.entries(porSolicitanteMesDias)
        .map(([key, val]) => {
          const match = key.match(/^(.*) \((.*)\)$/);
          return {
            solicitante: match ? match[1] : key,
            mes: match ? match[2] : "",
            dias: val
          };
        })
        .sort((a, b) => b.dias - a.dias)
    };
  }, [filteredLeaves]);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-100 rounded-xl text-red-600">
            <HeartPulse className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reposos y Permisos</h1>
            <p className="text-sm text-gray-500">Módulo de control de ausencias, justificaciones y estadísticas del personal.</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {statusMessage && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border shadow-sm transition-all duration-300 ${
          statusMessage.type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {statusMessage.type === "success"
            ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600" />
            : <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600" />
          }
          <div className="flex-1">
            <p className="text-sm font-semibold">{statusMessage.type === "success" ? "Operación exitosa" : "Atención"}</p>
            <p className="text-xs mt-0.5">{statusMessage.msg}</p>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selector de Pestañas */}
      <div className="flex border-b border-gray-200 bg-white p-1 rounded-xl shadow-xs gap-2">
        {user.role === "Coordinador" ? (
          <>
            <button
              onClick={() => { setActiveTab("solicitar"); setStatusMessage(null); }}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "solicitar"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </button>
            <button
              onClick={() => { setActiveTab("historial"); setStatusMessage(null); }}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "historial"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Historial de Solicitudes
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { setActiveTab("pendientes"); setStatusMessage(null); }}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "pendientes"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Pendientes
              {pendingLeaves.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                  {pendingLeaves.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("historial"); setStatusMessage(null); }}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "historial"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Archivo General
            </button>
            <button
              onClick={() => { setActiveTab("metricas"); setStatusMessage(null); }}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "metricas"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Métricas Detalladas
            </button>
          </>
        )}
      </div>

      {/* Contenido Principal */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
          <p className="text-sm text-gray-500 mt-4 font-medium animate-pulse">Cargando información...</p>
        </div>
      ) : (
        <>
          {/* VISTA 1: REGISTRAR NUEVA SOLICITUD (COORDINADOR) */}
          {activeTab === "solicitar" && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Plus className="h-5 w-5 text-red-600" />
                Registrar Reposo o Permiso de Personal
              </h2>
              
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Nombre del Solicitante</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Ej. Juan Pérez"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Cédula de Identidad</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 select-none">V-</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ej. 12345678"
                        value={applicantCedula}
                        onChange={(e) => setApplicantCedula(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                        required
                        maxLength={8}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Tipo de Solicitud</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                  >
                    <option value="Reposo">Reposo Médico</option>
                    <option value="Permiso">Permiso Especial / Personal</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Fecha de Inicio</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Días Necesarios</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        placeholder="Ej. 3"
                        value={daysNeeded}
                        onChange={(e) => setDaysNeeded(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Motivo detallado</label>
                  <textarea
                    rows={3}
                    placeholder="Describa brevemente la justificación o diagnóstico..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Foto / Documento de Soporte</label>
                  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${
                    file ? "border-green-400 bg-green-50/50" : "border-gray-300 hover:border-red-300"
                  }`}>
                    <div className="space-y-2 text-center">
                      <FileText className={`mx-auto h-10 w-10 ${file ? "text-green-500" : "text-gray-400"}`} />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-red-600 hover:text-red-500 focus-within:outline-none">
                          <span>{file ? "Cambiar archivo" : "Subir archivo o foto"}</span>
                          <input
                            id="leave-file-input"
                            type="file"
                            className="sr-only"
                            accept="image/*,application/pdf"
                            onChange={(e) => setFile(e.target.files[0] || null)}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : "Formatos aceptados: Imágenes (JPG, PNG) o PDF. Máx 5MB"}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registrando solicitud...
                    </>
                  ) : "Registrar Solicitud"}
                </button>
              </form>
            </div>
          )}

          {/* VISTA 2: BANDEJA DE ENTRADA / PENDIENTES (GESTIÓN HUMANA) */}
          {activeTab === "pendientes" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-sm font-semibold text-gray-700 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                  Solicitudes Pendientes de Revisión
                </span>
                <span className="bg-yellow-50 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-200">
                  {pendingLeaves.length} por revisar
                </span>
              </div>

              {pendingLeaves.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-800">¡Bandeja al día!</h3>
                  <p className="text-sm text-gray-500 mt-1">No hay nuevas solicitudes de reposos o permisos pendientes por revisar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingLeaves.map((leaf) => (
                    <div 
                      key={leaf.id} 
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {/* Borde sutil según tipo */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${leaf.leave_type === "Reposo" ? "bg-red-500" : "bg-blue-500"}`} />

                      <div className="flex justify-between items-start pt-1">
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            leaf.leave_type === "Reposo" 
                              ? "bg-red-50 text-red-700 border-red-100" 
                              : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}>
                            {leaf.leave_type}
                          </span>
                          <h3 className="text-base font-bold text-gray-900 mt-2">{leaf.applicant_name}</h3>
                          {leaf.applicant_cedula && (
                            <p className="text-[10px] font-mono font-semibold text-gray-500 mt-0.5">C.I. V-{leaf.applicant_cedula}</p>
                          )}
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Briefcase className="w-3.5 h-3.5 mr-1" />
                            {leaf.department_name || "Sin departamento asignado"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-gray-900">{leaf.days_needed}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Días</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3 space-y-2">
                        <p className="text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          Inicia el {new Date(leaf.start_date + "T00:00:00").toLocaleDateString("es-VE")}
                        </p>
                        <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          <span className="font-semibold text-gray-900">Motivo:</span> {leaf.reason}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Registrado por Coordinador: <span className="font-medium text-gray-600">{leaf.coordinator_name}</span> el {new Date(leaf.created_at).toLocaleDateString("es-VE")}
                        </p>
                      </div>

                      {/* Adjunto */}
                      {leaf.file_drive_id ? (
                        <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2 shrink-0 min-w-0">
                            <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700 font-medium truncate max-w-[180px]">{leaf.file_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setPreviewModal({ isOpen: true, fileId: leaf.file_drive_id, fileName: leaf.file_name, fileMimeType: leaf.file_mime_type })}
                              className="p-1.5 bg-white text-gray-600 hover:text-red-600 rounded-lg border border-gray-200 transition-colors shadow-2xs"
                              title="Previsualizar archivo"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`/api/drive/download?fileId=${leaf.file_drive_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-white text-gray-600 hover:text-red-600 rounded-lg border border-gray-200 transition-colors shadow-2xs flex items-center"
                              title="Descargar archivo"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No se adjuntaron soportes físicos.</p>
                      )}

                      {/* Botón de acción */}
                      {reviewingId !== leaf.id ? (
                        <button
                          onClick={() => { setReviewingId(leaf.id); setReviewComment(""); }}
                          className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <CheckSquare className="w-4 h-4 text-gray-500" />
                          Marcar como Revisado / Agregar Comentario
                        </button>
                      ) : (
                        <form onSubmit={(e) => handleReviewSubmit(e, leaf.id)} className="space-y-3 pt-2 border-t border-gray-100">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Comentario de Gestión Humana</label>
                            <input
                              type="text"
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Ej. Constancia válida. Se procede al registro."
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-xs bg-white text-gray-800"
                              required
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setReviewingId(null)}
                              className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-transparent"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={updatingReview}
                              className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-2xs flex items-center"
                            >
                              {updatingReview ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1"></div>
                              ) : null}
                              Confirmar Revisión
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISTA 3: HISTORIAL DE SOLICITUDES / ARCHIVO GENERAL (AMBOS ROLES) */}
          {activeTab === "historial" && (
            <div className="space-y-6">
              {/* Filtros e Historial */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center">
                  <Search className="w-5 h-5 mr-2 text-red-600" />
                  Buscador e Historial
                </h3>
                
                {/* Caja de filtros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Búsqueda por palabra clave */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Solicitante o Motivo</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-xs text-gray-800"
                      />
                    </div>
                  </div>

                  {/* Filtro por Departamento (Solo para GH / Admin) */}
                  {user.role !== "Coordinador" ? (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Departamento</label>
                      <select
                        value={filterDept}
                        onChange={(e) => { setFilterDept(e.target.value); setCurrentPage(0); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-xs text-gray-800"
                      >
                        {departamentosDisponibles.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Rol de Solicitante</label>
                      <input
                        type="text"
                        disabled
                        value={user.department_name || "Mi Departamento"}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs text-gray-500"
                      />
                    </div>
                  )}

                  {/* Filtro por Mes */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mes / Año de Ausencia</label>
                    <select
                      value={filterMonth}
                      onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(0); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-xs text-gray-800"
                    >
                      {mesesDisponibles.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por Tipo */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo</label>
                    <select
                      value={filterType}
                      onChange={(e) => { setFilterType(e.target.value); setCurrentPage(0); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-xs text-gray-800"
                    >
                      <option value="Todos">Todos</option>
                      <option value="Reposo">Reposo</option>
                      <option value="Permiso">Permiso</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Listado en Tabla */}
              <div className="md:hidden space-y-4">
                {paginatedLeaves.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500 italic">
                    No se encontraron registros que coincidan con la búsqueda.
                  </div>
                ) : (
                  paginatedLeaves.map((leaf) => (
                    <div key={leaf.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{leaf.applicant_name}</p>
                          {leaf.applicant_cedula && (
                            <p className="text-[10px] font-mono text-gray-500">C.I. V-{leaf.applicant_cedula}</p>
                          )}
                          <p className="text-[10px] text-gray-400">ID: #{leaf.id}</p>
                          {user.role !== "Coordinador" && (
                            <p className="text-[10px] text-gray-500 truncate">{leaf.department_name}</p>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold border text-[10px] ${
                          leaf.leave_type === "Reposo"
                            ? "bg-red-50 text-red-700 border-red-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}>
                          {leaf.leave_type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-500">
                        <div>
                          <p className="font-semibold text-gray-700">Inicio</p>
                          <p>{new Date(leaf.start_date + "T00:00:00").toLocaleDateString("es-VE")}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Días</p>
                          <p>{leaf.days_needed}</p>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 line-clamp-3" title={leaf.reason}>{leaf.reason}</div>

                      <div className="flex flex-wrap items-center gap-2">
                        {leaf.file_drive_id ? (
                          <>
                            <button
                              onClick={() => setPreviewModal({ isOpen: true, fileId: leaf.file_drive_id, fileName: leaf.file_name, fileMimeType: leaf.file_mime_type })}
                              className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-gray-200 rounded-xl text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors"
                              title="Previsualizar archivo"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </button>
                            <a
                              href={`/api/drive/download?fileId=${leaf.file_drive_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-gray-200 rounded-xl text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors"
                              title="Descargar archivo"
                            >
                              <Download className="w-4 h-4" />
                              Descargar
                            </a>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin archivo adjunto</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-[10px] text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>Estado</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold border ${
                            leaf.status === "pendiente"
                              ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                              : "bg-green-50 text-green-800 border-green-200"
                          }`}>{leaf.status}</span>
                        </div>
                        <div>
                          {leaf.status === "revisado" ? (
                            <p className="text-gray-600 italic">"{leaf.review_comment || 'Sin comentario'}"</p>
                          ) : (
                            <p className="text-gray-600 italic">Esperando revisión</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Solicitante</th>
                        {user.role !== "Coordinador" && (
                          <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Depto / Coord</th>
                        )}
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Inicio / Días</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Motivo</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Soportes</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Revisión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedLeaves.length === 0 ? (
                        <tr>
                          <td colSpan={user.role === "Coordinador" ? 7 : 8} className="p-8 text-center text-sm text-gray-500 italic">
                            No se encontraron registros que coincidan con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        paginatedLeaves.map((leaf) => (
                          <tr key={leaf.id} className="hover:bg-gray-50/50 transition-colors text-xs">
                            <td className="p-4">
                              <p className="font-bold text-gray-900">{leaf.applicant_name}</p>
                              {leaf.applicant_cedula && (
                                <p className="text-[10px] font-mono text-gray-500">C.I. V-{leaf.applicant_cedula}</p>
                              )}
                              <p className="text-[10px] text-gray-400">ID: #{leaf.id}</p>
                            </td>
                            {user.role !== "Coordinador" && (
                              <td className="p-4">
                                <p className="font-medium text-gray-700">{leaf.department_name}</p>
                                <p className="text-[10px] text-gray-400">Registró: {leaf.coordinator_name}</p>
                              </td>
                            )}
                            <td className="p-4">
                              <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold border ${
                                leaf.leave_type === "Reposo" 
                                  ? "bg-red-50 text-red-700 border-red-100" 
                                  : "bg-blue-50 text-blue-700 border-blue-100"
                              }`}>
                                {leaf.leave_type}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-gray-800">
                                {new Date(leaf.start_date + "T00:00:00").toLocaleDateString("es-VE")}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{leaf.days_needed} días</p>
                            </td>
                            <td className="p-4 max-w-xs">
                              <p className="text-gray-600 line-clamp-2" title={leaf.reason}>{leaf.reason}</p>
                            </td>
                            <td className="p-4">
                              {leaf.file_drive_id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setPreviewModal({ isOpen: true, fileId: leaf.file_drive_id, fileName: leaf.file_name, fileMimeType: leaf.file_mime_type })}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    title="Previsualizar archivo"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={`/api/drive/download?fileId=${leaf.file_drive_id}`}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded flex items-center"
                                    title="Descargar"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">Ninguno</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold border ${
                                leaf.status === "pendiente"
                                  ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                                  : "bg-green-50 text-green-800 border-green-200"
                              }`}>
                                <Clock className="w-3 h-3 mr-1" />
                                {leaf.status}
                              </span>
                            </td>
                            <td className="p-4 max-w-xs">
                              {leaf.status === "revisado" ? (
                                <div>
                                  <p className="text-gray-700 italic">"{leaf.review_comment}"</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">Revisado por {leaf.reviewer_name}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">Esperando revisión</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-gray-400 font-medium">
                      Mostrando {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredLeaves.length)} de {filteredLeaves.length} solicitudes
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="p-1.5 border border-gray-200 rounded-lg hover:bg-white bg-transparent disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="p-1.5 border border-gray-200 rounded-lg hover:bg-white bg-transparent disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA 4: PANEL DE MÉTRICAS DETALLADAS (GESTIÓN HUMANA / ADMIN) */}
          {activeTab === "metricas" && (
            <div className="space-y-6">
              {/* Tarjetas de Estadísticas Rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total de solicitudes registradas</p>
                    <h4 className="text-2xl font-black text-gray-900 mt-1">{metricas.totalSolicitudes}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Número de solicitudes que cumplen el filtro actual</p>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total de días solicitados</p>
                    <h4 className="text-2xl font-black text-gray-900 mt-1">{metricas.totalDias}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Suma de los días de reposo y permisos</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Días por solicitud</p>
                    <h4 className="text-2xl font-black text-gray-900 mt-1">
                      {metricas.totalSolicitudes > 0 ? (metricas.totalDias / metricas.totalSolicitudes).toFixed(1) : 0}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Promedio de días solicitados por cada registro</p>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Solicitudes pendientes</p>
                    <h4 className="text-2xl font-black text-red-600 mt-1">{pendingLeaves.length}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Registros que aún esperan revisión</p>
                  </div>
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Filtro Rápido Informativo */}
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center justify-between text-xs text-red-800">
                <span>
                  💡 <strong>Consejo:</strong> Modifica la búsqueda o filtros de la pestaña <strong>"Archivo General"</strong> para actualizar y desglosar estas métricas por meses, departamentos o tipos específicos.
                </span>
              </div>

              {/* Distribuciones visuales en gráficos de barra HSL */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Solicitudes por Mes */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <Calendar className="w-4.5 h-4.5 mr-2 text-red-600" />
                    Ausencias Registradas por Mes
                  </h3>
                  
                  {metricas.porMes.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4 text-center">No hay registros mensuales.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {metricas.porMes.map(({ label, val }) => {
                        const maxVal = Math.max(...metricas.porMes.map(m => m.val));
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                        return (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-gray-700">{label}</span>
                              <span className="font-bold text-gray-900">{val} solicitudes</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-red-600 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Solicitudes por Departamento */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <Briefcase className="w-4.5 h-4.5 mr-2 text-red-600" />
                    Distribución por Departamento
                  </h3>
                  
                  {metricas.porDept.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4 text-center">No hay registros de departamentos.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {metricas.porDept.map(({ label, val }) => {
                        const maxVal = Math.max(...metricas.porDept.map(d => d.val));
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                        return (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-gray-700">{label}</span>
                              <span className="font-bold text-gray-900">{val} solicitudes</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Cruse: Solicitantes y Días totales acumulados por Mes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking de Solicitantes Frecuentes */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <User className="w-4.5 h-4.5 mr-2 text-red-600" />
                    Ausencias frecuentes por empleado (más solicitudes)
                  </h3>
                  
                  {metricas.porSolicitanteCant.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4 text-center">No hay registros de solicitantes.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {metricas.porSolicitanteCant.map(({ label, val }) => {
                        const maxVal = Math.max(...metricas.porSolicitanteCant.map(s => s.val));
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                        return (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-gray-700">{label}</span>
                              <span className="font-bold text-gray-900">{val} {val === 1 ? 'solicitud' : 'solicitudes'}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-green-600 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Acumulador de Días Solicitados por Solicitante por Mes */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <Calendar className="w-4.5 h-4.5 mr-2 text-red-600" />
                    Días Totales Solicitados por Empleado al Mes
                  </h3>

                  <div className="overflow-hidden border border-gray-100 rounded-xl">
                    <div className="max-h-[300px] overflow-y-auto pr-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                            <th className="p-3">Colaborador</th>
                            <th className="p-3">Mes de Ausencia</th>
                            <th className="p-3 text-right">Días Pedidos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                          {metricas.porSolicitanteMesDias.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-gray-400 italic">No hay registros cruzados.</td>
                            </tr>
                          ) : (
                            metricas.porSolicitanteMesDias.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="p-3 font-semibold text-gray-900">{item.solicitante}</td>
                                <td className="p-3 text-gray-500">{item.mes}</td>
                                <td className="p-3 text-right font-black text-red-600">{item.dias} días</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Previsualizador PDF */}
      <PdfPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, fileId: null, fileName: "", fileMimeType: null })}
        fileId={previewModal.fileId}
        fileName={previewModal.fileName}
        fileMimeType={previewModal.fileMimeType}
      />
    </div>
  );
}
