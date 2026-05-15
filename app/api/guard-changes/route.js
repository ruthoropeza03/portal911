import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'Coordinador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    let requests = [];

    if (user.department_name === 'Operaciones') {
      // C.O. ve todas las solicitudes
      requests = await sql`
        SELECT g.*, u.name as requester_name, d.name as requester_dept 
        FROM guard_change_requests g
        JOIN users u ON g.requester_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        ORDER BY g.created_at DESC
      `;
    } else {
      // Otros Coordinadores solo ven las suyas
      requests = await sql`
        SELECT g.*, u.name as requester_name, d.name as requester_dept 
        FROM guard_change_requests g
        JOIN users u ON g.requester_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE g.requester_id = ${user.id}
        ORDER BY g.created_at DESC
      `;
    }

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching guard change requests:', error);
    return NextResponse.json({ error: 'Error obteniendo solicitudes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'Coordinador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { request_type, guard_date, desired_date, comment, file_url, file_drive_id, file_name, file_size } = body;

    // Validación de anticipación 48h para tipo 'normal'
    if (request_type === 'normal') {
      const gDate = new Date(guard_date);
      const now = new Date();
      const diffMs = gDate.getTime() - now.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      if (diffHrs < 48) {
        return NextResponse.json({ error: 'Las solicitudes normales deben hacerse con al menos 48h de anticipación' }, { status: 400 });
      }
    }

    // Validación de comentario para tipo 'especial'
    if (request_type === 'especial' && (!comment || comment.trim() === '')) {
      return NextResponse.json({ error: 'El comentario es obligatorio para solicitudes especiales' }, { status: 400 });
    }

    // Insertar en base de datos
    const result = await sql`
      INSERT INTO guard_change_requests (
        requester_id, request_type, guard_date, desired_date, comment, 
        file_url, file_drive_id, file_name, file_size, status
      ) VALUES (
        ${user.id}, ${request_type}, ${guard_date}, ${desired_date}, ${comment || null}, 
        ${file_url}, ${file_drive_id}, ${file_name}, ${file_size}, 'pendiente'
      ) RETURNING *
    `;

    // Buscar al Coordinador de Operaciones para notificarle
    const coOps = await sql`
      SELECT u.id 
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'Coordinador' AND d.name = 'Operaciones'
    `;

    for (const co of coOps) {
      const message = `El coordinador ${user.name} ha solicitado un cambio de guardia.`;
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (${co.id}, 'Nueva Solicitud de Cambio de Guardia', ${message}, 'info')
      `;
    }

    logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_GUARD_CHANGE',
      module: 'Cambio Guardia',
      description: `Creó solicitud de cambio de guardia para ${guard_date}`,
      request,
    });

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creando solicitud:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
