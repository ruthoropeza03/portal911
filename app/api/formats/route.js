import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';

// GET público — sirve a la Landing Page sin autenticación
export async function GET() {
  try {
    const formats = await sql`
      SELECT id, name, description, file_name, file_drive_id, version, updated_at
      FROM formats
      ORDER BY name ASC
    `;
    return NextResponse.json(formats);
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo formatos' }, { status: 500 });
  }
}

// POST — solo administrador pueden subir formatos
export async function POST(request) {
  const user = verifyAuth(request);
  if (!user || user.role !== 'Administrador') {
    return NextResponse.json({ error: 'Solo el administrador puede subir formatos' }, { status: 403 });
  }

  try {
    const { name, description, file_drive_id, file_name } = await request.json();
    if (!name || !file_drive_id) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO formats (name, description, file_drive_id, file_name, updated_at)
      VALUES (${name}, ${description || null}, ${file_drive_id}, ${file_name || null}, NOW())
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error subiendo formato' }, { status: 500 });
  }
}

// DELETE — solo administrador puede eliminar formatos
export async function DELETE(request) {
  const user = verifyAuth(request);
  if (!user || user.role !== 'Administrador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  try {
    const { id } = await request.json();
    await sql`DELETE FROM formats WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error eliminando formato' }, { status: 500 });
  }
}
