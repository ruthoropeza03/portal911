import { NextResponse } from 'next/server';
import sql from '@/lib/neon';

// GET /api/cron/publicar-programadas
// Vercel lo llama automáticamente cada 10 min con Authorization: Bearer <CRON_SECRET>
// También puede llamarse manualmente con el mismo header para pruebas.
export async function GET(request) {
  // Verificar Bearer token
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // Buscar noticias cuya fecha programada ya llegó
    const result = await sql`
      UPDATE news
      SET
        estado = 'publicada',
        fecha_publicacion_real = NOW()
      WHERE estado = 'programada' AND fecha_programada <= NOW()
      RETURNING id, title, fecha_programada
    `;

    return NextResponse.json({
      publicadas: result.length,
      noticias: result.map(n => ({ id: n.id, title: n.title, fecha_programada: n.fecha_programada })),
    });
  } catch (error) {
    console.error('[CRON] Error publicando noticias programadas:', error);
    return NextResponse.json({ error: 'Error interno del cron' }, { status: 500 });
  }
}
