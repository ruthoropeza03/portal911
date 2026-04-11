import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { uploadFileToDrive, deleteFileFromDrive } from '@/lib/gdrive';

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

/**
 * POST /api/formats
 * Acepta multipart/form-data con:
 *   - file      (File)   obligatorio
 *   - name      (string) obligatorio
 *   - description (string) opcional
 *
 * Sube el archivo a la carpeta de FORMATOS en Drive y registra en BD.
 */
export async function POST(request) {
  const user = verifyAuth(request);
  if (!user || user.role !== 'Administrador') {
    return NextResponse.json({ error: 'Solo el administrador puede subir formatos' }, { status: 403 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    let name, description, driveFileId, fileName;

    if (contentType.includes('multipart/form-data')) {
      // Upload real de archivo
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
      // Compatibilidad con registro manual por ID (legacy)
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

// DELETE /api/formats  { id }
// Elimina el registro de BD y el archivo de Drive
export async function DELETE(request) {
  const user = verifyAuth(request);
  if (!user || user.role !== 'Administrador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  try {
    const { id } = await request.json();

    // Obtener el drive ID antes de borrar el registro
    const rows = await sql`SELECT file_drive_id FROM formats WHERE id = ${id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Formato no encontrado' }, { status: 404 });
    }

    const driveId = rows[0].file_drive_id;

    // Borrar de BD
    await sql`DELETE FROM formats WHERE id = ${id}`;

    // Intentar borrar de Drive (no fatal si falla)
    if (driveId && !driveId.startsWith('fake-')) {
      await deleteFileFromDrive(driveId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando formato:', error);
    return NextResponse.json({ error: 'Error eliminando formato' }, { status: 500 });
  }
}
