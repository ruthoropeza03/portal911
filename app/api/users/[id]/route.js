import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/auditLog';

export async function PUT(request, { params }) {
  const userAuth = verifyAuth(request);
  if (!userAuth || userAuth.role !== 'Administrador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { name, email, role, department_id, password } = await request.json();

    let query;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query = await sql`
        UPDATE users 
        SET name = COALESCE(${name}, name),
            email = COALESCE(${email}, email),
            role = COALESCE(${role}, role),
            department_id = COALESCE(${department_id}, department_id),
            password_hash = ${hash}
        WHERE id = ${id}
        RETURNING id, name, email, role
      `;
    } else {
      query = await sql`
        UPDATE users 
        SET name = COALESCE(${name}, name),
            email = COALESCE(${email}, email),
            role = COALESCE(${role}, role),
            department_id = COALESCE(${department_id}, department_id)
        WHERE id = ${id}
        RETURNING id, name, email, role
      `;
    }

    logAudit({
      userId: userAuth.id,
      userName: userAuth.name,
      userRole: userAuth.role,
      action: 'UPDATE_USER',
      module: 'Usuarios',
      description: `Actualizó el usuario ID ${id} ('${query[0]?.name}')`,
      request,
    });

    return NextResponse.json(query[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const userAuth = verifyAuth(request);
  if (!userAuth || userAuth.role !== 'Administrador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    // Fetch name before deletion for the log
    const target = await sql`SELECT name FROM users WHERE id = ${id} LIMIT 1`;
    await sql`DELETE FROM users WHERE id = ${id}`;
    logAudit({
      userId: userAuth.id,
      userName: userAuth.name,
      userRole: userAuth.role,
      action: 'DELETE_USER',
      module: 'Usuarios',
      description: `Eliminó el usuario ID ${id} ('${target[0]?.name ?? 'desconocido'}')`,
      request,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
