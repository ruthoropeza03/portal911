import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { construirBloquesNoticia, serializarNoticia } from '@/lib/formateadorNoticia';
import { deleteFileFromDrive, uploadFileToDrive } from '@/lib/gdrive';
import { logAudit } from '@/lib/auditLog';

const CAN_MANAGE_NEWS = ['Prensa', 'Administrador'];

function extractDriveId(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  try {
    const u = new URL(imageUrl, 'http://localhost');
    const id = u.searchParams.get('fileId');
    return id || null;
  } catch {
    return null;
  }
}

// PUT /api/news/[id] — editar o cambiar visibilidad
export async function PUT(request, { params }) {
  const user = verifyAuth(request);
  if (!user || !CAN_MANAGE_NEWS.includes(user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const contentType = request.headers.get('content-type') || '';
    let patch = {};
    let newImageFile = null;
    let clearImage = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const titleValue = formData.get('title');
      const contentValue = formData.get('content');
      const visibleValue = formData.get('visible');
      patch.title = titleValue == null ? undefined : String(titleValue);
      patch.content = contentValue == null ? undefined : String(contentValue);
      patch.visible = visibleValue == null ? undefined : String(visibleValue);
      clearImage = String(formData.get('clear_image') || 'false') === 'true';
      newImageFile = formData.get('image');
    } else {
      patch = await request.json();
    }

    const existing = await sql`SELECT * FROM news WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    const e = existing[0];
    const title = patch.title !== undefined ? patch.title : e.title;
    const content =
      typeof patch.content === 'string'
        ? serializarNoticia(patch.content, construirBloquesNoticia(patch.content))
        : e.content;
    let image_url = e.image_url;

    if (newImageFile && typeof newImageFile === 'object' && newImageFile.size > 0) {
      const oldDriveId = extractDriveId(e.image_url);
      const bytes = await newImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const folderId = process.env.GOOGLE_DRIVE_NOTICIAS_FOLDER_ID;
      const newDriveId = await uploadFileToDrive(
        buffer,
        newImageFile.name,
        newImageFile.type || 'application/octet-stream',
        folderId
      );
      image_url = `/api/drive/download?fileId=${encodeURIComponent(newDriveId)}&public=1`;
      if (oldDriveId && !oldDriveId.startsWith('fake-')) {
        await deleteFileFromDrive(oldDriveId);
      }
    } else if (clearImage || patch.image_url === '' || patch.image_url === null) {
      const oldDriveId = extractDriveId(e.image_url);
      image_url = null;
      if (oldDriveId && !oldDriveId.startsWith('fake-')) {
        await deleteFileFromDrive(oldDriveId);
      }
    } else if (patch.image_url !== undefined) {
      image_url = patch.image_url;
    }

    const visible =
      patch.visible !== undefined
        ? patch.visible === true || patch.visible === 'true'
        : e.visible;

    // Preservar estado existente; solo actualizarlo si se envía explícitamente
    const estado = patch.estado !== undefined ? patch.estado : (e.estado ?? 'publicada');

    const result = await sql`
      UPDATE news
      SET
        title = ${title},
        content = ${content},
        image_url = ${image_url},
        visible = ${visible},
        estado = ${estado}
      WHERE id = ${id}
      RETURNING *
    `;

    logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE_NEWS',
      module: 'Noticias',
      description: `Actualizó la noticia ID ${id} ('${title}')`,
      request,
    });

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
    const rows = await sql`SELECT image_url, title FROM news WHERE id = ${id} LIMIT 1`;
    await sql`DELETE FROM news WHERE id = ${id}`;
    if (rows.length > 0) {
      const driveId = extractDriveId(rows[0].image_url);
      if (driveId && !driveId.startsWith('fake-')) {
        await deleteFileFromDrive(driveId);
      }
    }
    logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'DELETE_NEWS',
      module: 'Noticias',
      description: `Eliminó la noticia ID ${id} ('${rows[0]?.title ?? ''}')`,
      request,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar noticia' }, { status: 500 });
  }
}
