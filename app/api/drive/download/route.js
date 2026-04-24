import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { getFileFromDrive } from '@/lib/gdrive';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/drive/download?fileId=XXXX
 *
 * Descarga proxy: trae el archivo de Drive en el servidor y lo reenvía al cliente.
 * Esto evita exponer un enlace público y asegura que solo usuarios autenticados descarguen.
 *
 * Para formatos institucionales (públicos) no se exige sesión si se agrega ?public=1.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');
  const isPublic = searchParams.get('public') === '1';

  if (!fileId) {
    return NextResponse.json({ error: 'Falta el parámetro fileId' }, { status: 400 });
  }

  // Solo requerir autenticación para archivos no-públicos
  if (!isPublic) {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  try {
    const { stream, mimeType, filename } = await getFileFromDrive(fileId);

    // Convertir el stream de Node.js a ReadableStream de Web API de forma robusta
    const webStream = Readable.toWeb(stream);

    return new Response(webStream, {

      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('Error en descarga desde Drive:', error.message);
    return NextResponse.json({ error: 'No se pudo descargar el archivo' }, { status: 500 });
  }
}
