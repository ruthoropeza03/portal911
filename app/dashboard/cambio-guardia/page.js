"use client";

import { useState, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import {
  CalendarClock,
  User,
  Calendar,
  Download,
  Search,
  ChevronDown,
  X,
  Shield,
  Upload,
  FileText,
  CheckCircle,
  CheckSquare2,
  XCircle,
  MessageCircle,
  BarChart3,
  Clock,
  AlertCircle
} from "lucide-react";

const PAGE_SIZE = 15;

function useDebounce(delay = 350) {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const timer = useRef(null);
  const onChange = (v) => {
    setValue(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(v), delay);
  };
  return [value, debounced, onChange];
}

export default function CambioGuardiaPage() {
  const { user, solicitudesCambioGuardia, subirArchivoCambioGuardia, addSolicitudCambioGuardia, revisarSolicitudCambioGuardia } = useApp();

  const [requestType, setRequestType] = useState('normal');
  const [guardDate, setGuardDate] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [activeTab, setActiveTab] = useState('pendientes');
  const [rawSearch, debouncedSearch, setSearch] = useDebounce(350);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, id: null, comment: '' });
  const [commentModal, setCommentModal] = useState({ isOpen: false, comment: '' });
  const [statusMessage, setStatusMessage] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  if (!user || user.role !== "Coordinador") {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Shield className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    );
  }

  const isRevisor = user.department_name === "Operaciones";

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setFormError('Solo se permiten archivos PDF.');
        setFile(null);
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setFormError('El archivo excede los 5MB.');
        setFile(null);
        return;
      }
      setFormError('');
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!guardDate || !desiredDate || !file) {
      setFormError('Por favor completa todos los campos obligatorios y adjunta el PDF.');
      return;
    }

    if (requestType === 'normal') {
      const gDate = new Date(guardDate);
      const now = new Date();
      const diffHrs = (gDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHrs < 48) {
        setFormError('Las solicitudes normales deben tener al menos 48h de anticipación.');
        return;
      }
    }

    if (requestType === 'especial' && !comment.trim()) {
      setFormError('El comentario/motivo es obligatorio para solicitudes especiales.');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadRes = await subirArchivoCambioGuardia(file);
      if (uploadRes.error) throw new Error(uploadRes.error);

      const res = await addSolicitudCambioGuardia({
        request_type: requestType,
        guard_date: guardDate,
        desired_date: desiredDate,
        comment,
        file_url: uploadRes.fileUrl,
        file_drive_id: uploadRes.fileDriveId,
        file_name: uploadRes.fileName,
        file_size: uploadRes.fileSize
      });

      if (res.success) {
        setGuardDate('');
        setDesiredDate('');
        setComment('');
        setFile(null);
      } else {
        setFormError(res.error || 'Error al enviar la solicitud.');
      }
    } catch (err) {
      setFormError(err.message || 'Error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingRequests = useMemo(
    () => (solicitudesCambioGuardia || []).filter((r) => r.status === 'pendiente'),
    [solicitudesCambioGuardia]
  );

  const filteredRequests = useMemo(() => {
    let requestsToFilter = solicitudesCambioGuardia || [];
    if (isRevisor) {
      const q = debouncedSearch.toLowerCase();
      requestsToFilter = requestsToFilter.filter((r) => {
        const matchSearch =
          !q ||
          (r.requester_name ?? "").toLowerCase().includes(q) ||
          (r.requester_dept ?? "").toLowerCase().includes(q) ||
          (r.file_name ?? "").toLowerCase().includes(q);
        const matchStatus = !statusFilter || r.status === statusFilter;
        return matchSearch && matchStatus;
      });
    }
    return requestsToFilter;
  }, [solicitudesCambioGuardia, debouncedSearch, statusFilter, isRevisor]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginated = filteredRequests.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = useMemo(() => {
    const byRequester = {};
    const byStatus = {};
    const byMonth = {};

    filteredRequests.forEach((r) => {
      const requester = r.requester_name || 'Desconocido';
      byRequester[requester] = (byRequester[requester] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      const date = new Date(r.guard_date);
      const monthKey = `${date.toLocaleString('es-VE', { month: 'long' })} ${date.getFullYear()}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    });

    return {
      total: filteredRequests.length,
      pending: byStatus['pendiente'] || 0,
      approved: byStatus['aprobada'] || 0,
      rejected: byStatus['rechazada'] || 0,
      byRequester: Object.entries(byRequester)
        .map(([label, val]) => ({ label, val }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 10),
      byMonth: Object.entries(byMonth).map(([label, val]) => ({ label, val })),
    };
  }, [filteredRequests]);

  const handleApprove = async (id) => {
    setSubmittingReview(true);
    const result = await revisarSolicitudCambioGuardia(id, 'aprobada', null);
    setSubmittingReview(false);
    if (result?.success) {
      setStatusMessage({ type: 'success', msg: 'Solicitud aprobada correctamente.' });
    } else {
      setStatusMessage({ type: 'error', msg: result?.error || 'Error al aprobar la solicitud.' });
    }
  };

  const submitRejection = async () => {
    if (!rejectionModal.comment.trim()) return;
    setSubmittingReview(true);
    const result = await revisarSolicitudCambioGuardia(rejectionModal.id, 'rechazada', rejectionModal.comment);
    setSubmittingReview(false);
    if (result?.success) {
      setStatusMessage({ type: 'success', msg: 'Solicitud rechazada correctamente.' });
      setRejectionModal({ isOpen: false, id: null, comment: '' });
    } else {
      setStatusMessage({ type: 'error', msg: result?.error || 'Error al rechazar la solicitud.' });
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>{status?.toUpperCase() || 'N/A'}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-2xl text-red-600">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cambio de Guardia</h1>
            <p className="text-gray-500 text-sm mt-1">
              {isRevisor ? "Revisión y aprobación de solicitudes de cambio de guardia." : "Solicita y gestiona tus cambios de guardia."}
            </p>
          </div>
        </div>
      </div>

      {isRevisor ? (
        <div className="space-y-6">
          {statusMessage && (
            <div className={`p-4 rounded-xl flex items-start gap-3 border shadow-sm transition-all duration-300 ${
              statusMessage.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckSquare2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600" />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold">{statusMessage.type === 'success' ? 'Operación exitosa' : 'Atención'}</p>
                <p className="text-xs mt-0.5">{statusMessage.msg}</p>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-white p-1 rounded-xl shadow-xs">
            {[
              ['pendientes', 'Pendientes', Clock],
              ['historial', 'Archivo General', FileText],
              ['metricas', 'Métricas Detalladas', BarChart3]
            ].map(([tab, label, Icon]) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setStatusMessage(null); }}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'pendientes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total solicitudes</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.total}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Registradas actualmente</p>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pendientes</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.pending}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Por revisar</p>
                  </div>
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Procesadas</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.approved + stats.rejected}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Aprobadas + rechazadas</p>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <CheckSquare2 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <CheckSquare2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">No hay solicitudes pendientes</p>
                  <p className="text-xs text-gray-500 mt-1">Todas las solicitudes han sido procesadas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingRequests.map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{r.requester_name}</p>
                          <p className="text-xs text-gray-500">{r.requester_dept}</p>
                          <p className="mt-2 text-xs text-gray-600">Original: {new Date(r.guard_date).toLocaleDateString('es-VE')}</p>
                          <p className="text-xs text-gray-600">Deseada: {new Date(r.desired_date).toLocaleDateString('es-VE')}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>

                      <div className="mt-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                          <span>{r.file_name}</span>
                          {r.request_type === 'especial' && (
                            <button onClick={() => setCommentModal({ isOpen: true, comment: r.comment })} className="text-blue-600 hover:underline flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" /> Ver motivo
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleApprove(r.id)} className="px-3 py-2 text-xs bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                            Aprobar
                          </button>
                          <button onClick={() => setRejectionModal({ isOpen: true, id: r.id, comment: '' })} className="px-3 py-2 text-xs bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
                            Rechazar
                          </button>
                          <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-xs border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                            Descargar PDF
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por coordinador, departamento o archivo..."
                      value={rawSearch}
                      onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                      className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                    >
                      <option value="">Todos los estados</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobada">Aprobada</option>
                      <option value="rechazada">Rechazada</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Solicitante</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fechas</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo / Estado</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Archivo</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-gray-400">No hay solicitudes.</td>
                        </tr>
                      ) : paginated.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{r.requester_name}</div>
                                <div className="text-xs text-gray-500">{r.requester_dept}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div><span className="font-medium">Original:</span> {new Date(r.guard_date).toLocaleDateString('es-VE')}</div>
                            <div><span className="font-medium text-red-600">Deseada:</span> {new Date(r.desired_date).toLocaleDateString('es-VE')}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-xs text-gray-500 uppercase font-medium">{r.request_type}</span>
                              <StatusBadge status={r.status} />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-red-600 hover:underline">
                              <Download className="w-4 h-4 mr-1" /> PDF
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center gap-2">
                              {r.request_type === 'especial' && (
                                <button onClick={() => setCommentModal({ isOpen: true, comment: r.comment })} className="text-blue-600 hover:text-blue-900" title="Ver Motivo">
                                  <MessageCircle className="w-5 h-5"/>
                                </button>
                              )}
                              {r.status === 'pendiente' ? (
                                <>
                                  <button onClick={() => handleApprove(r.id)} className="text-green-600 hover:text-green-900" title="Aprobar"><CheckCircle className="w-5 h-5"/></button>
                                  <button onClick={() => setRejectionModal({ isOpen: true, id: r.id, comment: '' })} className="text-red-600 hover:text-red-900" title="Rechazar"><XCircle className="w-5 h-5"/></button>
                                </>
                              ) : (
                                <span className="text-gray-400 ml-2">Procesada</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm gap-2">
                  <p className="text-sm text-gray-500">
                    Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredRequests.length)} de {filteredRequests.length}
                  </p>
                  <div className="flex gap-1 flex-wrap justify-center">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >
                      ← Ant.
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          i === page ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >
                      Sig. →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metricas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total solicitudes</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.total}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Filtradas actualmente</p>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pendientes</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.pending}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Por revisar</p>
                  </div>
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Aprobadas</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.approved}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Solicitudes exitosas</p>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Rechazadas</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.rejected}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Solicitudes denegadas</p>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-red-600" />
                    Solicitudes por Mes
                  </h3>
                  {stats.byMonth.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4 text-center">No hay datos mensuales.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {stats.byMonth.map(({ label, val }) => {
                        const maxVal = Math.max(...stats.byMonth.map((m) => m.val));
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                        return (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-gray-700">{label}</span>
                              <span className="font-bold text-gray-900">{val}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-red-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-4.5 h-4.5 text-red-600" />
                    Top solicitantes
                  </h3>
                  {stats.byRequester.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4 text-center">No hay datos de solicitantes.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {stats.byRequester.map(({ label, val }) => {
                        const maxVal = Math.max(...stats.byRequester.map((u) => u.val));
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                        return (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-gray-700 truncate max-w-[65%]">{label}</span>
                              <span className="font-bold text-gray-900">{val}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-green-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {rejectionModal.isOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Motivo de Rechazo</h3>
                <p className="text-sm text-gray-500 mb-4">El comentario es obligatorio para rechazar la solicitud.</p>
                <textarea
                  value={rejectionModal.comment}
                  onChange={(e) => setRejectionModal(prev => ({...prev, comment: e.target.value}))}
                  className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] mb-4"
                  placeholder="Escribe el motivo..."
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setRejectionModal({ isOpen: false, id: null, comment: '' })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
                  <button onClick={submitRejection} disabled={!rejectionModal.comment.trim() || submittingReview} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50">Confirmar Rechazo</button>
                </div>
              </div>
            </div>
          )}

          {commentModal.isOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Motivo de Solicitud Especial</h3>
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 mb-6 min-h-[100px] whitespace-pre-wrap border border-gray-200">
                  {commentModal.comment || 'No hay comentario proporcionado.'}
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setCommentModal({ isOpen: false, comment: '' })} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">Cerrar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nueva Solicitud</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value="normal" checked={requestType === 'normal'} onChange={() => setRequestType('normal')} className="text-red-600 focus:ring-red-500" />
                  <span className="text-sm text-gray-700">Normal (≥ 48h)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value="especial" checked={requestType === 'especial'} onChange={() => setRequestType('especial')} className="text-red-600 focus:ring-red-500" />
                  <span className="text-sm text-gray-700">Especial (&lt; 48h)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Original Guardia *</label>
                  <input type="date" value={guardDate} onChange={(e) => setGuardDate(e.target.value)} required className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Deseada *</label>
                  <input type="date" value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} required className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-red-500 outline-none" />
                </div>
              </div>

              {requestType === 'especial' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Motivo / Novedad *</label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} required={requestType === 'especial'} rows={3} className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-red-500 outline-none" placeholder="Explica la razón de la urgencia..." />
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors">
                <input type="file" id="fileUpload" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-red-600">Sube el Formato de Cambio</span>
                  <span className="text-xs text-gray-500 mt-1">PDF, máximo 5MB</span>
                </label>
                {file && <div className="mt-3 text-sm text-gray-800 bg-gray-100 py-1 px-3 rounded-full inline-block truncate max-w-full">{file.name}</div>}
              </div>

              {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}

              <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 text-white font-medium py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis Solicitudes</h2>
            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No has realizado ninguna solicitud.</div>
              ) : (
                filteredRequests.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 relative">
                    <div className="flex justify-between items-start mb-2">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('es-VE')}</span>
                    </div>
                    <div className="text-sm text-gray-800 space-y-1">
                      <p><span className="text-gray-500">Original:</span> {new Date(r.guard_date).toLocaleDateString('es-VE')}</p>
                      <p><span className="text-gray-500">Deseada:</span> {new Date(r.desired_date).toLocaleDateString('es-VE')}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                       <span className="text-xs text-gray-500 uppercase">{r.request_type}</span>
                       <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline flex items-center text-xs font-medium">
                         <FileText className="w-3 h-3 mr-1" /> Ver Formato
                       </a>
                    </div>
                    {r.status === 'rechazada' && r.rejection_comment && (
                      <div className="mt-2 bg-red-50 text-red-800 text-xs p-2 rounded-md border border-red-100">
                        <span className="font-semibold">Rechazo:</span> {r.rejection_comment}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
