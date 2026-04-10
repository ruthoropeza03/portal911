import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const user = verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formats = await sql`
      SELECT id, name, description, file_name, version, updated_at
      FROM formats
      ORDER BY name ASC
    `;
    return NextResponse.json(formats);
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo formatos' }, { status: 500 });
  }
}
