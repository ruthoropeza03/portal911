"use client";

import { useState, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import {
  CalendarClock, User, Calendar, Download, Search, ChevronDown, X, Shield, Upload, FileText, CheckCircle, XCircle
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

  // Estados para Formulario (Coordinador Normal)
  const [requestType, setRequestType] = useState('normal');
  const [guardDate, setGuardDate] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Estados para Revisor (Coordinador Operaciones)
  const [rawSearch, debouncedSearch, setSearch] = useDebounce(350);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, id: null, comment: '' });

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

  // Lógica para Solicitante (Formulario)
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
        // Toast lo maneja AppContext si quisiéramos, por ahora reset states
      } else {
        setFormError(res.error || 'Error al enviar la solicitud.');
      }
    } catch (err) {
      setFormError(err.message || 'Error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lógica para Revisor (Tabla)
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

  const handleApprove = async (id) => {
    await revisarSolicitudCambioGuardia(id, 'aprobada', null);
  };

  const submitRejection = async () => {
    if (!rejectionModal.comment.trim()) return;
    await revisarSolicitudCambioGuardia(rejectionModal.id, 'rechazada', rejectionModal.comment);
    setRejectionModal({ isOpen: false, id: null, comment: '' });
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>{status.toUpperCase()}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cambio de Guardia</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRevisor ? "Revisión y aprobación de solicitudes de cambio de guardia." : "Solicita y gestiona tus cambios de guardia."}
          </p>
        </div>
      </div>

      {isRevisor ? (
        // ================= VISTA REVISOR (OPERACIONES) =================
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por coordinador, departamento o archivo…"
                  value={rawSearch}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="relative sm:w-52">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                  className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
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

          {/* Vista Móvil (Tarjetas) */}
          <div className="md:hidden space-y-4">
            {paginated.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center">
                <FileText className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium">No hay solicitudes.</p>
              </div>
            ) : (
              paginated.map((r) => (
                <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{r.requester_name}</h3>
                        <p className="text-xs text-gray-500">{r.requester_dept}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-gray-500 uppercase font-medium">{r.request_type}</span>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex flex-col gap-1 text-xs text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span><span className="font-medium">Original:</span> {new Date(r.guard_date).toLocaleDateString('es-VE')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5 text-red-400" />
                        <span><span className="font-medium text-red-600">Deseada:</span> {new Date(r.desired_date).toLocaleDateString('es-VE')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-red-600 hover:text-red-700 font-medium text-xs"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Formato PDF
                      </a>
                      
                      {r.status === 'pendiente' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApprove(r.id)} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors" title="Aprobar"><CheckCircle className="w-5 h-5"/></button>
                          <button onClick={() => setRejectionModal({ isOpen: true, id: r.id, comment: '' })} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Rechazar"><XCircle className="w-5 h-5"/></button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Procesada</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vista Escritorio (Tabla) */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Solicitante</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Fechas</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tipo / Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Archivo</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-400">No hay solicitudes.</td>
                    </tr>
                  ) : paginated.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
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
                        {r.status === 'pendiente' ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleApprove(r.id)} className="text-green-600 hover:text-green-900" title="Aprobar"><CheckCircle className="w-5 h-5"/></button>
                            <button onClick={() => setRejectionModal({ isOpen: true, id: r.id, comment: '' })} className="text-red-600 hover:text-red-900" title="Rechazar"><XCircle className="w-5 h-5"/></button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Procesada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm gap-2">
              <p className="text-sm text-gray-500">
                Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredRequests.length)} de {filteredRequests.length}
              </p>
              <div className="flex gap-1 flex-wrap justify-center">
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
          
          {/* Modal Rechazo Simple */}
          {rejectionModal.isOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Motivo de Rechazo</h3>
                <p className="text-sm text-gray-500 mb-4">El comentario es obligatorio para rechazar la solicitud.</p>
                <textarea
                  value={rejectionModal.comment}
                  onChange={(e) => setRejectionModal(prev => ({...prev, comment: e.target.value}))}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] mb-4"
                  placeholder="Escribe el motivo..."
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setRejectionModal({ isOpen: false, id: null, comment: '' })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                  <button onClick={submitRejection} disabled={!rejectionModal.comment.trim()} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Confirmar Rechazo</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // ================= VISTA SOLICITANTE (NORMAL) =================
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel Izquierdo: Formulario */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                  <input type="date" value={guardDate} onChange={(e) => setGuardDate(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-red-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Deseada *</label>
                  <input type="date" value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-red-500 outline-none" />
                </div>
              </div>

              {requestType === 'especial' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Motivo / Novedad *</label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} required={requestType === 'especial'} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-red-500 outline-none" placeholder="Explica la razón de la urgencia..." />
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                <input type="file" id="fileUpload" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-red-600">Sube el Formato de Cambio</span>
                  <span className="text-xs text-gray-500 mt-1">PDF, máximo 5MB</span>
                </label>
                {file && <div className="mt-3 text-sm text-gray-800 bg-gray-100 py-1 px-3 rounded-full inline-block truncate max-w-full">{file.name}</div>}
              </div>

              {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}

              <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </form>
          </div>

          {/* Panel Derecho: Historial */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis Solicitudes</h2>
            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No has realizado ninguna solicitud.</div>
              ) : (
                filteredRequests.map(r => (
                  <div key={r.id} className="bg-white border rounded-lg p-4 shadow-sm relative">
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
