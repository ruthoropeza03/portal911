import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';

const CAN_MANAGE = ['Prensa', 'Administrador'];

// GET /api/news/programadas — listar noticias con estado='programada'
export async function GET(request) {
  const user = verifyAuth(request);
  if (!user || !CAN_MANAGE.includes(user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const rows = await sql`
      SELECT n.*, u.name as author_name
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.estado = 'programada' AND n.fecha_programada > NOW()
      ORDER BY n.fecha_programada ASC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error obteniendo noticias programadas' }, { status: 500 });
  }
}

// PUT /api/news/programadas — reprogramar una noticia
export async function PUT(request) {
  const user = verifyAuth(request);
  if (!user || !CAN_MANAGE.includes(user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id, fecha_programada } = await request.json();
    if (!id || !fecha_programada) {
      return NextResponse.json({ error: 'Se requieren id y fecha_programada' }, { status: 400 });
    }

    const nuevaFecha = new Date(fecha_programada);
    if (isNaN(nuevaFecha.getTime())) {
      return NextResponse.json({ error: 'fecha_programada no es una fecha válida' }, { status: 400 });
    }

    if (nuevaFecha <= new Date()) {
      return NextResponse.json({ error: 'La nueva fecha debe ser en el futuro' }, { status: 400 });
    }

    const result = await sql`
      UPDATE news
      SET fecha_programada = ${nuevaFecha.toISOString()}, estado = 'programada'
      WHERE id = ${id} AND estado = 'programada'
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Noticia no encontrada o no está programada' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al reprogramar noticia' }, { status: 500 });
  }
}

// DELETE /api/news/programadas — cancelar programación (vuelve a borrador)
export async function DELETE(request) {
  const user = verifyAuth(request);
  if (!user || !CAN_MANAGE.includes(user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Se requiere id' }, { status: 400 });
    }

    const result = await sql`
      UPDATE news
      SET estado = 'borrador', fecha_programada = NULL
      WHERE id = ${id} AND estado = 'programada'
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Noticia no encontrada o no está programada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, noticia: result[0] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al cancelar programación' }, { status: 500 });
  }
}
