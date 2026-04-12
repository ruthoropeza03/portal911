import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { uploadFileToDrive, deleteFileFromDrive } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

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

// POST /api/formats
export async function POST(request) {
  const user = verifyAuth(request);
  if (!user || (user.role !== 'Administrador' && user.role !== 'Gestión Humana')) {
    return NextResponse.json({ error: 'No autorizado para subir formatos' }, { status: 403 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let name, description, driveFileId, fileName;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      name = formData.get('name');
      description = formData.get('description') || null;

      if (!file || !name) {
        return NextResponse.json({ error: 'Faltan campos: file y name son obligatorios' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const formatsFolderId = process.env.GOOGLE_DRIVE_FORMATS_FOLDER_ID;

      driveFileId = await uploadFileToDrive(buffer, file.name, file.type, formatsFolderId);
      fileName = file.name;
    } else {
      const body = await request.json();
      name = body.name;
      description = body.description || null;
      driveFileId = body.file_drive_id;
      fileName = body.file_name || null;

      if (!name || !driveFileId) {
        return NextResponse.json({ error: 'Faltan campos requeridos: name y file_drive_id' }, { status: 400 });
      }
    }

    const result = await sql`
      INSERT INTO formats (name, description, file_drive_id, file_name, updated_at)
      VALUES (${name}, ${description}, ${driveFileId}, ${fileName}, NOW())
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error subiendo formato:', error);
    return NextResponse.json({ error: 'Error subiendo formato' }, { status: 500 });
  }
}

// PUT /api/formats/:id  (Opcional, manejamos por body id si no hay route params dinámicos configurados)
export async function PUT(request) {
  const user = verifyAuth(request);
  if (!user || (user.role !== 'Administrador' && user.role !== 'Gestión Humana')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  try {
    const { id, name, description } = await request.json();
    const result = await sql`
      UPDATE formats
      SET name = ${name}, description = ${description}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Error actualizando formato' }, { status: 500 });
  }
}

// DELETE /api/formats
export async function DELETE(request) {
  const user = verifyAuth(request);
  if (!user || (user.role !== 'Administrador' && user.role !== 'Gestión Humana')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  try {
    const { id } = await request.json();

    const rows = await sql`SELECT file_drive_id FROM formats WHERE id = ${id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Formato no encontrado' }, { status: 404 });
    }

    const driveId = rows[0].file_drive_id;
    await sql`DELETE FROM formats WHERE id = ${id}`;

    if (driveId && !driveId.startsWith('fake-')) {
      await deleteFileFromDrive(driveId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando formato:', error);
    return NextResponse.json({ error: 'Error eliminando formato' }, { status: 500 });
  }
}

