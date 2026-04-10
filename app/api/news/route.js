import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const news = await sql`
      SELECT n.*, u.name as author_name 
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.visible = true
      ORDER BY n.published_at DESC
    `;
    return NextResponse.json(news);
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo noticias' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = verifyAuth(request);
  if (!user || (user.role !== 'Prensa' && user.role !== 'Administrador')) {
    return NextResponse.json({ error: 'No autorizado para publicar' }, { status: 403 });
  }

  try {
    const { title, content, image_url } = await request.json();

    const result = await sql`
      INSERT INTO news (title, content, image_url, author_id)
      VALUES (${title}, ${content}, ${image_url || null}, ${user.id})
      RETURNING *
    `;


    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al publicar noticia' }, { status: 500 });
  }
}
