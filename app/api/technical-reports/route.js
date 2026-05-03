import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { uploadFileToDrive } from '@/lib/gdrive';
import { logAudit } from '@/lib/auditLog';

export async function GET(request) {
  const user = verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    let reports;
    if (user.department_name === 'Televigilancia' || user.department_name === 'Tecnologia') {
      reports = await sql`
        SELECT tr.*, u.name as user_name
        FROM technical_reports tr
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE tr.user_id = ${user.id}
        ORDER BY tr.created_at DESC
      `;
    } else if (user.role === 'Gestión Humana' || user.role === 'Administrador') {
      reports = await sql`
        SELECT tr.*, u.name as user_name
        FROM technical_reports tr
        LEFT JOIN users u ON tr.user_id = u.id
        ORDER BY tr.created_at DESC
      `;
    } else {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo informes técnicos' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const isTechMember = user.department_name === 'Televigilancia' || user.department_name === 'Tecnologia';
  if (!isTechMember) {
    return NextResponse.json({ error: 'Solo miembros del departamento de Tecnología o Televigilancia pueden subir informes' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const description = formData.get('description');

    if (!file || !title) {
      return NextResponse.json({ error: 'Faltan datos (archivo o título)' }, { status: 400 });
    }

    // Convert FormatData File to Buffer for Google API
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a la carpeta de formatos/informes en Drive
    const reportsFolderId = process.env.GOOGLE_DRIVE_TECHNICAL_REPORTS_FOLDER_ID || process.env.GOOGLE_DRIVE_REPORTS_FOLDER_ID;
    const driveFileId = await uploadFileToDrive(buffer, file.name, file.type, reportsFolderId);

    // Crear registro en BD
    const result = await sql`
      INSERT INTO technical_reports (user_id, title, description, file_name, file_drive_id, file_mime_type, file_size)
      VALUES (${user.id}, ${title}, ${description || ''}, ${file.name}, ${driveFileId}, ${file.type}, ${file.size})
      RETURNING *
    `;

    // Send notification
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      SELECT id, 'Nuevo Informe Técnico', 'El usuario ' || ${user.name} || ' ha subido un informe técnico: ' || ${title}, 'info'
      FROM users
      WHERE role IN ('Administrador', 'Gestión Humana')
    `;

    logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPLOAD_TECHNICAL_REPORT',
      module: 'Informes Técnicos',
      description: `Subió el informe técnico '${title}' (${file.name})`,
      request,
    });

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al subir informe técnico' }, { status: 500 });
  }
}
