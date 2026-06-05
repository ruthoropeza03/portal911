import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { uploadFileToDrive } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'Coordinador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'El contenido debe ser form-data' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo se aceptan PDFs e imágenes (JPG, PNG)' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo excede el tamaño máximo de 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Guardar en la carpeta de reposos (o en su defecto en la de guardias)
    const folderId = process.env.GOOGLE_DRIVE_LEAVES_FOLDER_ID || process.env.GOOGLE_DRIVE_GUARD_CHANGE_FOLDER_ID;

    const driveFileId = await uploadFileToDrive(buffer, file.name, file.type, folderId);

    return NextResponse.json({
      fileUrl: `/api/drive/download?fileId=${driveFileId}&public=1`,
      fileDriveId: driveFileId,
      fileName: file.name,
      fileSize: file.size
    }, { status: 201 });

  } catch (error) {
    console.error('Error subiendo archivo de reposo/permiso:', error);
    return NextResponse.json({ error: 'Error subiendo archivo' }, { status: 500 });
  }
}
