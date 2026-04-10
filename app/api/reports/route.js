import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import { uploadFileToDrive } from '@/lib/gdrive';

export async function GET(request) {
  const user = verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    let reports;
    if (user.role === 'Coordinador') {
      reports = await sql`
        SELECT r.*, u.name as user_name, d.name as department_name, us.name as reviewer_name
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN departments d ON r.department_id = d.id
        LEFT JOIN users us ON r.reviewed_by = us.id
        WHERE r.user_id = ${user.id}
        ORDER BY r.created_at DESC
      `;
    } else if (user.role === 'Gestión Humana' || user.role === 'Administrador') {
      reports = await sql`
        SELECT r.*, u.name as user_name, d.name as department_name, us.name as reviewer_name
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN departments d ON r.department_id = d.id
        LEFT JOIN users us ON r.reviewed_by = us.id
        ORDER BY r.created_at DESC
      `;
    } else {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo reportes' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = verifyAuth(request);
  if (!user || user.role !== 'Coordinador') {
    return NextResponse.json({ error: 'Solo coordinadores pueden subir reportes' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const quincena = formData.get('quincena');
    const periodStart = formData.get('period_start'); // Formato YYYY-MM-DD
    const periodEnd = formData.get('period_end');     // Formato YYYY-MM-DD

    if (!file || !quincena || !periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Faltan datos (archivo o fechas)' }, { status: 400 });
    }

    // Convert FormatData File to Buffer for Google API
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Drive
    const driveFileId = await uploadFileToDrive(buffer, file.name, file.type);

    // Get user's department_id directly from db
    const uInfo = await sql`SELECT department_id FROM users WHERE id = ${user.id}`;
    const descId = parseInt(uInfo[0].department_id) || null;

    // Crear registro en BD
    const result = await sql`
      INSERT INTO reports (department_id, user_id, period_start, period_end, quincena, file_name, file_drive_id)
      VALUES (${descId}, ${user.id}, ${periodStart}, ${periodEnd}, ${parseInt(quincena)}, ${file.name}, ${driveFileId})
      RETURNING *
    `;


    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al subir reporte' }, { status: 500 });
  }
}
