import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';

const CAN_MANAGE_NEWS = ['Prensa', 'Administrador'];

// PUT /api/news/[id] — editar o cambiar visibilidad
export async function PUT(request, { params }) {
  const user = verifyAuth(request);
  if (!user || !CAN_MANAGE_NEWS.includes(user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { title, content, image_url, visible } = await request.json();

    const result = await sql`
      UPDATE news
      SET
        title = COALESCE(${title}, title),
        content = COALESCE(${content}, content),
        image_url = COALESCE(${image_url}, image_url),
        visible = COALESCE(${visible}, visible)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar noticia' }, { status: 500 });
  }
}

// DELETE /api/news/[id] — eliminar noticia
export async function DELETE(request, { params }) {
  const user = verifyAuth(request);
  if (!user || !CAN_MANAGE_NEWS.includes(user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await sql`DELETE FROM news WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar noticia' }, { status: 500 });
  }
}
