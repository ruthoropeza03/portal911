import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';

export async function PUT(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user || (user.role !== 'Gestión Humana' && user.role !== 'Administrador')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const paramsResolved = await params;
    const { id } = paramsResolved;
    const body = await request.json();
    const { status, review_comment } = body;

    // Validación
    if (!status || !['pendiente', 'revisado'].includes(status)) {
      return NextResponse.json({ error: 'Estado de revisión inválido (debe ser pendiente o revisado)' }, { status: 400 });
    }

    // Actualizar registro en la base de datos
    const result = await sql`
      UPDATE leaves_and_permits
      SET
        status = ${status},
        review_comment = ${review_comment || null},
        reviewed_by = ${user.id},
        reviewed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const requestData = result[0];

    // Notificar al coordinador que registró el reposo/permiso
    const message = `Tu solicitud de reposo/permiso para ${requestData.applicant_name} ha sido marcada como revisada por Gestión Humana.`;
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        ${requestData.coordinator_id},
        'Reposo/Permiso Revisado',
        ${message},
        'success'
      )
    `;

    // Registrar en auditoría
    logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'REVIEW_LEAVE_REQUEST',
      module: 'Reposos y Permisos',
      description: `Revisó solicitud ID ${id} de ${requestData.applicant_name} (${requestData.leave_type})`,
      request,
    });

    return NextResponse.json(requestData);

  } catch (error) {
    console.error('Error al actualizar revisión de reposo/permiso:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
