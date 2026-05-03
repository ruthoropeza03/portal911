import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/audit-log — Solo Administrador
// Query params: ?module=Noticias&action=CREATE_NEWS&search=maria&limit=50&offset=0
export async function GET(request) {
  const user = verifyAuth(request);
  if (!user || user.role !== 'Administrador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const module   = searchParams.get('module')  || null;
    const action   = searchParams.get('action')  || null;
    const search   = searchParams.get('search')  || null;
    const limit    = Math.min(parseInt(searchParams.get('limit')  || '100'), 500);
    const offset   = parseInt(searchParams.get('offset') || '0');

    // Construir la query dinámicamente usando condiciones encadenadas
    let logs;

    if (module && action && search) {
      logs = await sql`
        SELECT * FROM audit_log
        WHERE module = ${module}
          AND action = ${action}
          AND (user_name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (module && action) {
      logs = await sql`
        SELECT * FROM audit_log
        WHERE module = ${module} AND action = ${action}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (module && search) {
      logs = await sql`
        SELECT * FROM audit_log
        WHERE module = ${module}
          AND (user_name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (action && search) {
      logs = await sql`
        SELECT * FROM audit_log
        WHERE action = ${action}
          AND (user_name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (module) {
      logs = await sql`
        SELECT * FROM audit_log
        WHERE module = ${module}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (action) {
      logs = await sql`
        SELECT * FROM audit_log
        WHERE action = ${action}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (search) {
      logs = await sql`
        SELECT * FROM audit_log
        WHERE user_name ILIKE ${'%' + search + '%'}
           OR description ILIKE ${'%' + search + '%'}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      logs = await sql`
        SELECT * FROM audit_log
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Total count (para paginación en el frontend)
    let countResult;
    if (module && action && search) {
      countResult = await sql`
        SELECT COUNT(*) as total FROM audit_log
        WHERE module = ${module}
          AND action = ${action}
          AND (user_name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})
      `;
    } else if (module && action) {
      countResult = await sql`SELECT COUNT(*) as total FROM audit_log WHERE module = ${module} AND action = ${action}`;
    } else if (module && search) {
      countResult = await sql`SELECT COUNT(*) as total FROM audit_log WHERE module = ${module} AND (user_name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})`;
    } else if (action && search) {
      countResult = await sql`SELECT COUNT(*) as total FROM audit_log WHERE action = ${action} AND (user_name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})`;
    } else if (module) {
      countResult = await sql`SELECT COUNT(*) as total FROM audit_log WHERE module = ${module}`;
    } else if (action) {
      countResult = await sql`SELECT COUNT(*) as total FROM audit_log WHERE action = ${action}`;
    } else if (search) {
      countResult = await sql`SELECT COUNT(*) as total FROM audit_log WHERE user_name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'}`;
    } else {
      countResult = await sql`SELECT COUNT(*) as total FROM audit_log`;
    }

    return NextResponse.json({
      logs,
      total: parseInt(countResult[0]?.total || '0'),
      limit,
      offset,
    });
  } catch (error) {
    console.error('[audit-log GET]', error);
    return NextResponse.json({ error: 'Error al obtener bitácora' }, { status: 500 });
  }
}
