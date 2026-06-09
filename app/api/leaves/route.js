import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let leaves = [];

    if (user.role === 'Coordinador') {
      // Los coordinadores ven las solicitudes registradas por ellos
      leaves = await sql`
        SELECT 
          l.id, l.applicant_name, l.applicant_cedula, l.leave_type, l.reason, l.start_date, l.days_needed,
          l.file_name, l.file_drive_id, l.file_mime_type, l.file_size, l.status,
          l.review_comment, l.reviewed_at, l.created_at,
          c.name as coordinator_name,
          d.name as department_name,
          r.name as reviewer_name
        FROM leaves_and_permits l
        LEFT JOIN users c ON l.coordinator_id = c.id
        LEFT JOIN departments d ON l.department_id = d.id
        LEFT JOIN users r ON l.reviewed_by = r.id
        WHERE l.coordinator_id = ${user.id}
        ORDER BY l.created_at DESC
      `;
    } else if (user.role === 'Gestión Humana' || user.role === 'Administrador') {
      // Gestión Humana y Administradores ven todas las solicitudes del sistema
      leaves = await sql`
        SELECT 
          l.id, l.applicant_name, l.applicant_cedula, l.leave_type, l.reason, l.start_date, l.days_needed,
          l.file_name, l.file_drive_id, l.file_mime_type, l.file_size, l.status,
          l.review_comment, l.reviewed_at, l.created_at,
          c.name as coordinator_name,
          d.name as department_name,
          r.name as reviewer_name
        FROM leaves_and_permits l
        LEFT JOIN users c ON l.coordinator_id = c.id
        LEFT JOIN departments d ON l.department_id = d.id
        LEFT JOIN users r ON l.reviewed_by = r.id
        ORDER BY l.created_at DESC
      `;
    } else {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json(leaves);
  } catch (error) {
    console.error('Error al obtener reposos/permisos:', error);
    return NextResponse.json({ error: 'Error al obtener reposos/permisos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'Coordinador') {
      return NextResponse.json({ error: 'Solo los coordinadores pueden registrar reposos o permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      applicant_name,
      applicant_cedula,
      leave_type, 
      reason, 
      start_date, 
      days_needed,
      file_name,
      file_drive_id,
      file_mime_type,
      file_size
    } = body;

    // Validar campos obligatorios
    if (!applicant_name || !applicant_cedula || !leave_type || !reason || !start_date || !days_needed) {
      return NextResponse.json({ error: 'Faltan datos obligatorios (nombre, cédula, tipo, motivo, fecha y días son requeridos)' }, { status: 400 });
    }

    // Validar formato básico de cédula (solo dígitos, entre 6 y 8 caracteres)
    const cedulaLimpia = applicant_cedula.trim().replace(/[^0-9]/g, '');
    if (cedulaLimpia.length < 6 || cedulaLimpia.length > 8) {
      return NextResponse.json({ error: 'La cédula debe contener entre 6 y 8 dígitos numéricos' }, { status: 400 });
    }

    if (!['Reposo', 'Permiso'].includes(leave_type)) {
      return NextResponse.json({ error: 'Tipo de solicitud inválido (debe ser Reposo o Permiso)' }, { status: 400 });
    }

    const days = parseInt(days_needed);
    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ error: 'La cantidad de días debe ser un número entero mayor a 0' }, { status: 400 });
    }

    // Obtener department_id del coordinador
    const uInfo = await sql`SELECT department_id FROM users WHERE id = ${user.id}`;
    const departmentId = uInfo[0]?.department_id || null;

    // Insertar solicitud en base de datos
    const result = await sql`
      INSERT INTO leaves_and_permits (
        coordinator_id, department_id, applicant_name, applicant_cedula, leave_type, reason, start_date, days_needed,
        file_name, file_drive_id, file_mime_type, file_size, status
      ) VALUES (
        ${user.id}, ${departmentId}, ${applicant_name.trim()}, ${cedulaLimpia}, ${leave_type}, ${reason.trim()}, ${start_date}, ${days},
        ${file_name || null}, ${file_drive_id || null}, ${file_mime_type || null}, ${file_size || null}, 'pendiente'
      ) RETURNING *
    `;

    const leafData = result[0];

    // Enviar notificación a Gestión Humana y Administradores
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      SELECT id, 'Nueva solicitud de Reposo/Permiso', 'El coordinador ' || ${user.name} || ' ha registrado un(a) ' || ${leave_type} || ' para ' || ${applicant_name} || ' por ' || ${days} || ' días.', 'info'
      FROM users
      WHERE role IN ('Administrador', 'Gestión Humana')
    `;

    // Registrar en auditoría
    logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_LEAVE_REQUEST',
      module: 'Reposos y Permisos',
      description: `Registró solicitud de ${leave_type} para ${applicant_name} por ${days} días`,
      request,
    });

    return NextResponse.json(leafData, { status: 201 });

  } catch (error) {
    console.error('Error al registrar reposo/permiso:', error);
    return NextResponse.json({ error: 'Error al registrar reposo/permiso' }, { status: 500 });
  }
}
