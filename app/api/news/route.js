import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { construirBloquesNoticia, serializarNoticia } from '@/lib/formateadorNoticia';
import { uploadFileToDrive } from '@/lib/gdrive';


export async function GET(request) {
  const user = verifyAuth(request);
  const canManageNews = user?.role === 'Administrador' || user?.role === 'Prensa';

  // ?publicadas=true → solo noticias con estado='publicada' (para uso público/filtrado)
  const { searchParams } = new URL(request.url);
  const soloPublicadas = searchParams.get('publicadas') === 'true';

  try {
    let news;
    if (soloPublicadas || !canManageNews) {
      // Vista pública: solo publicadas y visibles
      news = await sql`
        SELECT n.*, u.name as author_name 
        FROM news n
        LEFT JOIN users u ON n.author_id = u.id
        WHERE n.visible = true AND (n.estado = 'publicada' OR n.estado IS NULL)
        ORDER BY n.published_at DESC
      `;
    } else {
      // Vista admin/prensa: todas las noticias
      news = await sql`
        SELECT n.*, u.name as author_name 
        FROM news n
        LEFT JOIN users u ON n.author_id = u.id
        ORDER BY n.published_at DESC
      `;
    }
    return NextResponse.json(news);
  } catch (error) {
    console.error(error);
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
    let fecha_programada = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const imageFile = formData.get('image');
      title = String(formData.get('title') || '');
      content = String(formData.get('content') || '');
      visible = String(formData.get('visible') || 'true') === 'true';
      const rawFechaProgramada = formData.get('fecha_programada');
      fecha_programada = rawFechaProgramada ? String(rawFechaProgramada) : null;
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
      fecha_programada = body.fecha_programada || null;
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'Faltan campos: title y content son obligatorios' }, { status: 400 });
    }

    // Determinar estado según fecha_programada
    const ahora = new Date();
    let estado = 'publicada';
    let fecha_publicacion_real = ahora;

    if (fecha_programada) {
      const fechaProg = new Date(fecha_programada);
      if (!isNaN(fechaProg.getTime()) && fechaProg > ahora) {
        estado = 'programada';
        fecha_publicacion_real = null; // Se asignará cuando el cron la publique
      }
      // Si la fecha ya pasó o es inválida, se publica ahora (estado='publicada')
    }

    const blocks = construirBloquesNoticia(content);
    const contentStored = serializarNoticia(content, blocks);

    const result = await sql`
      INSERT INTO news (title, content, image_url, author_id, visible, estado, fecha_programada, fecha_publicacion_real)
      VALUES (
        ${title},
        ${contentStored},
        ${image_url || null},
        ${user.id},
        ${visible},
        ${estado},
        ${fecha_programada ? new Date(fecha_programada).toISOString() : null},
        ${fecha_publicacion_real ? fecha_publicacion_real.toISOString() : null}
      )
      RETURNING *
    `;

    // Send notification to Admin users about the new news item
    if (estado === 'publicada' || estado === 'programada') {
      const actionText = estado === 'publicada' ? 'publicado' : 'programado';
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        SELECT id, 'Nueva Noticia', 'El usuario ' || ${user.name} || ' ha ' || ${actionText} || ' una noticia: ' || ${title}, 'info'
        FROM users
        WHERE role = 'Administrador'
      `;
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al publicar noticia' }, { status: 500 });
  }
}
