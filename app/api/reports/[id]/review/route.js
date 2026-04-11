import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  const user = verifyAuth(request);
  if (!user || (user.role !== 'Gestión Humana' && user.role !== 'Administrador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params; // Next 14/15 params act as a promise
    const { status, comment } = await request.json(); // status: 'reviewed', 'rejected'

    if (!status) {
      return NextResponse.json({ error: 'Faltan datos de revisión' }, { status: 400 });
    }

    const result = await sql`
      UPDATE reports 
      SET status = ${status}, review_comment = ${comment || null}, reviewed_by = ${user.id}, reviewed_at = NOW()
      WHERE id = ${id}
      RETURNING id, status
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }


    return NextResponse.json({ success: true, report: result[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Error al revisar reporte' }, { status: 500 });
  }
}
