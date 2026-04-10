import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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

    if (query.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

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
    await sql`DELETE FROM users WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
