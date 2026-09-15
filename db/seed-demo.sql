-- ============================================================
-- PORTAL 911 - SEED DE DATOS PARA LA RAMA DEMO (PORTFOLIO)
-- ============================================================
-- BD: NeonDB del proyecto demo
-- Contenido 100% inventado para fines de demostración.
-- Idempotente: se puede ejecutar varias veces sin duplicar.
-- Passwords en texto plano a propósito: la ruta /api/auth/login
-- compara directo (SIN HASH) contra la columna password_hash.
-- Usuario demo: demo@ven911.gob.ve / demo1234  (rol Administrador)
-- ============================================================

BEGIN;

-- ─── Departamentos ────────────────────────────────────────────
INSERT INTO departments (id, name) VALUES
  (1,  'Despacho'),
  (2,  'Operaciones'),
  (3,  'Telecomunicaciones'),
  (4,  'Televigilancia'),
  (5,  'Tecnologia'),
  (6,  'Logística'),
  (7,  'Rescate y Salvamento'),
  (8,  'Transporte'),
  (9,  'Salud'),
  (10, 'Prevención')
ON CONFLICT (id) DO NOTHING;

SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));

-- ─── Usuarios (contraseña común 'demo1234') ───────────────────
INSERT INTO users (id, name, email, password_hash, role, department_id, active) VALUES
  (1, 'Administrador Demo', 'demo@ven911.gob.ve', 'demo1234', 'Administrador', 1, true),
  (2, 'María Fernández',    'maria@ven911.gob.ve', 'demo1234', 'Coordinador', 2, true),
  (3, 'Carlos Ramírez',     'carlos@ven911.gob.ve', 'demo1234', 'Prensa', 3, true),
  (4, 'Ana Martínez',       'ana@ven911.gob.ve', 'demo1234', 'Gestión Humana', 1, true),
  (5, 'Luis Pérez',         'luis@ven911.gob.ve', 'demo1234', 'Coordinador', 4, true),
  (6, 'José Herrera',       'jose@ven911.gob.ve', 'demo1234', 'Coordinador', 5, true),
  (7, 'Carmen Rojas',       'carmen@ven911.gob.ve', 'demo1234', 'Prensa', 3, true),
  (8, 'Miguel Salazar',     'miguel@ven911.gob.ve', 'demo1234', 'Coordinador', 1, true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ─── Noticias (contenido en formato legado: texto plano) ──────
INSERT INTO news (id, title, content, image_url, author_id, visible, published_at, estado, fecha_publicacion_real) VALUES
  (1, 'Inaugurada nueva sala de Televigilancia en Lara',
   'El Centro de Comando inició operaciones de la ampliación de su sala de Televigilancia, fortaleciendo el monitoreo de las cámaras en puntos estratégicos del estado.
   La modernización incluye pantallas de alta resolución y nuevos puestos de trabajo para el personal de guardia.
   Con esta ampliación se espera reducir los tiempos de respuesta ante emergencias urbanas.',
   NULL, 3, true, NOW() - INTERVAL '6 days', 'publicada', NOW() - INTERVAL '6 days'),
  (2, 'Jornada de actualización tecnológica de la flota de radio',
   'El departamento de Telecomunicaciones concluyó la actualización de los equipos de radio de la flota operativa.
   Los equipos fueron calibrados y se realizaron pruebas de cobertura en los municipios del estado.
   Esta actualización garantiza una comunicación más estable entre los despachadores y las unidades.',
   NULL, 7, true, NOW() - INTERVAL '4 days', 'publicada', NOW() - INTERVAL '4 days'),
  (3, 'Operativo especial de seguridad para el feriado de Carnaval',
   'Se desplegó un operativo especial de seguridad y prevención con motivo de las fiestas de Carnaval.
   Participaron unidades de Rescate y Salvamento, Protección de vías y Comando del estado.
   El Centro de Comando permanecerá activo durante todo el asueto coordinando los despachos de emergencia.',
   NULL, 3, true, NOW() - INTERVAL '3 days', 'publicada', NOW() - INTERVAL '3 days'),
  (4, 'Capacitación interna: nuevo protocolo de despacho para casos de incendio',
   'Se realizó un taller de actualización para los despachadores sobre el nuevo protocolo de atención para incidentes con incendio.
   La capacitación incluyó simulacros de despacho y coordinación con las unidades de bomberos.
   El personal destacó la utilidad de los nuevos flujos de comunicación con los jefes de turno.',
   NULL, 7, true, NOW() - INTERVAL '2 days', 'publicada', NOW() - INTERVAL '2 days'),
  (5, 'Pruebas preventivas de los sistemas de alerta temprana',
   'El personal de Televigilancia ejecutó pruebas programadas de los sistemas de alerta por lluvias.
   Se validaron los sensores de nivel de quebradas y los mecanismos de difusión a las autoridades locales.
   Las pruebas arrojaron resultados positivos y se programó un nuevo ciclo de mantenimiento.',
   NULL, 3, true, NOW() - INTERVAL '1 day', 'publicada', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

SELECT setval('news_id_seq', (SELECT MAX(id) FROM news));

-- ─── Formatos institucionales (IDs de Drive simulados) ────────
INSERT INTO formats (id, name, description, file_drive_id, file_name, file_size, mime_type, version, uploaded_by, updated_at) VALUES
  (1, 'Formato de Reporte Quincenal', 'Plantilla oficial para los reportes de gestión quincenales por departamento.', 'fake-format-reporte-quincenal', 'reporte_quincenal.docx', 24576, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 2, 1, NOW() - INTERVAL '20 days'),
  (2, 'Formato Solicitud de Reposo', 'Planilla para el registro de solicitudes de reposo y permisos del personal.', 'fake-format-solicitud-reposo', 'solicitud_reposo.docx', 18432, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1, 1, NOW() - INTERVAL '20 days'),
  (3, 'Formato Informe Técnico', 'Plantilla para la entrega de informes técnicos del departamento de Tecnología.', 'fake-format-informe-tecnico', 'informe_tecnico.docx', 20480, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3, 1, NOW() - INTERVAL '15 days'),
  (4, 'Formato Cambio de Guardia', 'Solicitud de cambio de horario de guardia entre coordinadores.', 'fake-format-cambio-guardia', 'cambio_de_guardia.docx', 16384, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1, 1, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('formats_id_seq', (SELECT MAX(id) FROM formats));

-- ─── Reportes quincenales ─────────────────────────────────────
INSERT INTO reports (id, department_id, user_id, period_start, period_end, quincena, file_name, file_drive_id, file_mime_type, file_size, status, reviewed_by, review_comment, reviewed_at, created_at) VALUES
  (1, 2, 2, '2026-08-01', '2026-08-15', 1, 'reporte_quincena1_operaciones.pdf', 'fake-report-operaciones-1', 'application/pdf', 320000, 'reviewed', 4, 'Informe aprobado, se observa correcta ejecución de los despachos.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days'),
  (2, 4, 5, '2026-08-16', '2026-08-31', 2, 'reporte_quincena2_televigilancia.pdf', 'fake-report-televigilancia-1', 'application/pdf', 280000, 'pending', NULL, NULL, NULL, NOW() - INTERVAL '3 days'),
  (3, 5, 6, '2026-09-01', '2026-09-15', 1, 'reporte_quincena1_tecnologia.pdf', 'fake-report-tecnologia-1', 'application/pdf', 198000, 'pending', NULL, NULL, NULL, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

SELECT setval('reports_id_seq', (SELECT MAX(id) FROM reports));

-- ─── Reposos y Permisos ───────────────────────────────────────
INSERT INTO leaves_and_permits (id, coordinator_id, department_id, applicant_name, applicant_cedula, leave_type, reason, start_date, days_needed, file_name, file_drive_id, file_mime_type, file_size, status, review_comment, reviewed_by, reviewed_at, created_at) VALUES
  (1, 2, 2, 'Pedro Contreras', '12345678', 'Reposo', 'Reposo médico por artroscopía de rodilla derecha.', '2026-09-01', 5, 'reposo_pedro_contreras.pdf', 'fake-leaf-1', 'application/pdf', 150000, 'revisado', 'Se aprueba el reposo con fecha de reincorporación el 06/09/2026.', 4, NOW() - INTERVAL '4 days', NOW() - INTERVAL '9 days'),
  (2, 5, 4, 'Rosa Delgado', '87654321', 'Permiso', 'Trámite personal en el registro civil.', '2026-09-08', 1, NULL, NULL, NULL, NULL, 'pendiente', NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
  (3, 3, 3, 'Yuliana Castro', '11223344', 'Permiso', 'Representación del departamento en reunión institucional.', '2026-09-12', 2, 'permiso_yuliana_castr.pdf', 'fake-leaf-2', 'application/pdf', 98000, 'pendiente', NULL, NULL, NULL, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

SELECT setval('leaves_and_permits_id_seq', (SELECT MAX(id) FROM leaves_and_permits));

-- ─── Informes técnicos ────────────────────────────────────────
INSERT INTO technical_reports (id, user_id, title, description, file_name, file_drive_id, file_mime_type, file_size, status, created_at) VALUES
  (1, 6, 'Mantenimiento preventivo de videowall', 'Se realizó el mantenimiento preventivo del videowall de la sala de Televigilancia: limpieza, balanceo de color y verificación de tarjetas de video.', 'informe_mantenimiento_videowall.pdf', 'fake-tech-1', 'application/pdf', 412000, 'pending', NOW() - INTERVAL '8 days'),
  (2, 6, 'Migración de servidor de respaldo', 'Se migró el servidor de respaldo a un nodo redundante con mejor rendimiento de disco. Tiempo de recuperación reducido.' , 'informe_migracion_servidor.pdf', 'fake-tech-2', 'application/pdf', 356000, 'pending', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('technical_reports_id_seq', (SELECT MAX(id) FROM technical_reports));

-- ─── Solicitudes de cambio de guardia ─────────────────────────
INSERT INTO guard_change_requests (id, requester_id, request_type, guard_date, desired_date, comment, file_url, file_name, file_size, status, created_at) VALUES
  (1, 5, 'especial', '2026-09-10', '2026-09-11', 'Solicito cambio por capacitación programada del turno de Televigilancia.', 'fake-file-cambio-guardia-1', 'solicitud_cambio_televigilancia.pdf', 125000, 'pendiente', NOW() - INTERVAL '4 days'),
  (2, 8, 'normal', '2026-09-18', '2026-09-19', 'Cambio de turno por compromiso familiar del coordinador del turno.', 'fake-file-cambio-guardia-2', 'solicitud_cambio_despacho.pdf', 118000, 'pendiente', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('guard_change_requests_id_seq', (SELECT MAX(id) FROM guard_change_requests));

-- ─── Notificaciones (para el usuario demo) ────────────────────
INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
  (1, 'Bienvenido al portal de demostración', 'Este es un entorno 100% demostrativo con datos de prueba para mostrar las funcionalidades del sistema.', 'info', false, NOW() - INTERVAL '2 days'),
  (1, 'Nueva noticia publicada', 'La noticia "Operativo especial de seguridad para el feriado de Carnaval" fue publicada.', 'info', false, NOW() - INTERVAL '3 days'),
  (1, 'Reporte pendiente de revisión', 'El reporte quincenal del departamento Televigilancia está pendiente de revisión.', 'warning', false, NOW() - INTERVAL '3 days'),
  (1, 'Nueva solicitud de Reposo/Permiso', 'El coordinador José Herrera registró un permiso para Yuliana Castro por 2 días.', 'info', false, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));

-- ─── Bitácora de auditoría (muestras) ─────────────────────────
INSERT INTO audit_log (user_id, user_name, user_role, action, module, description, ip_address, created_at) VALUES
  (2, 'María Fernández', 'Coordinador', 'UPLOAD_REPORT', 'Reportes', 'Subió el reporte reporte_quincena1_operaciones.pdf para el periodo 2026-08-01 al 2026-08-15 (quincena 1)', '10.0.0.12', NOW() - INTERVAL '6 days'),
  (3, 'Carlos Ramírez', 'Prensa', 'CREATE_NEWS', 'Noticias', 'Creó la noticia Inaugurada nueva sala de Televigilancia en Lara', '10.0.0.14', NOW() - INTERVAL '6 days'),
  (2, 'María Fernández', 'Coordinador', 'CREATE_LEAVE_REQUEST', 'Reposos y Permisos', 'Registró solicitud de Reposo para Pedro Contreras por 5 días', '10.0.0.12', NOW() - INTERVAL '9 days'),
  (1, 'Administrador Demo', 'Administrador', 'LOGIN', 'Autenticación', 'Inicio de sesión exitoso (demo@ven911.gob.ve)', '10.0.0.1', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('audit_log_id_seq', (SELECT MAX(id) FROM audit_log));

COMMIT;