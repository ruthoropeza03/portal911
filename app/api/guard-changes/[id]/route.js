import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';

export async function PUT(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'Coordinador' || user.department_name !== 'Operaciones') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const paramsResolved = await params;
    const { id } = paramsResolved;
    const { status, rejection_comment } = await request.json();

    if (!['aprobada', 'rechazada'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    if (status === 'rechazada' && (!rejection_comment || rejection_comment.trim() === '')) {
      return NextResponse.json({ error: 'El comentario de rechazo es obligatorio' }, { status: 400 });
    }

    // Actualizar estado en la base de datos
    const result = await sql`
      UPDATE guard_change_requests
      SET 
        status = ${status}, 
        rejection_comment = ${rejection_comment || null}, 
        reviewed_by = ${user.id}, 
        reviewed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const requestData = result[0];

    const message = `Tu solicitud de cambio de guardia ha sido ${status}.`;
    
    // Notificar al solicitante
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        ${requestData.requester_id}, 
        'Actualización: Solicitud de Cambio de Guardia', 
        ${message}, 
        ${status === 'aprobada' ? 'success' : 'error'}
      )
    `;

    logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'REVIEW_GUARD_CHANGE',
      module: 'Cambio Guardia',
      description: `Marcó la solicitud ID ${id} como ${status}`,
      request,
    });

    return NextResponse.json(requestData);
  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
