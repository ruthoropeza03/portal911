import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { construirBloquesNoticia, serializarNoticia } from '@/lib/formateadorNoticia';
import { uploadFileToDrive } from '@/lib/gdrive';


export async function GET(request) {
  const user = verifyAuth(request);
  const canManageNews = user?.role === 'Administrador' || user?.role === 'Prensa';

  try {
    const news = canManageNews
      ? await sql`
          SELECT n.*, u.name as author_name 
          FROM news n
          LEFT JOIN users u ON n.author_id = u.id
          ORDER BY n.published_at DESC
        `
      : await sql`
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
    const contentType = request.headers.get('content-type') || '';
    let title;
    let content;
    let image_url;
    let visible = true;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const imageFile = formData.get('image');
      title = String(formData.get('title') || '');
      content = String(formData.get('content') || '');
      visible = String(formData.get('visible') || 'true') === 'true';
      image_url = null;

      if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const folderId = process.env.GOOGLE_DRIVE_NOTICIAS_FOLDER_ID;
        const driveId = await uploadFileToDrive(
          buffer,
          imageFile.name,
          imageFile.type || 'application/octet-stream',
          folderId
        );
        image_url = `/api/drive/download?fileId=${encodeURIComponent(driveId)}&public=1`;
      }
    } else {
      const body = await request.json();
      title = body.title;
      content = body.content;
      image_url = body.image_url || null;
      visible = body.visible !== false;
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'Faltan campos: title y content son obligatorios' }, { status: 400 });
    }

    const blocks = construirBloquesNoticia(content);
    const contentStored = serializarNoticia(content, blocks);

    const result = await sql`
      INSERT INTO news (title, content, image_url, author_id, visible)
      VALUES (${title}, ${contentStored}, ${image_url || null}, ${user.id}, ${visible})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al publicar noticia' }, { status: 500 });
  }
}
