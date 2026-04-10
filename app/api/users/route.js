import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/neon';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const user = verifyAuth(request);
  if (!user || user.role !== 'Administrador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const users = await sql`
      SELECT u.id, u.name, u.email, u.role, u.active, u.created_at, d.name as department_name 
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.id ASC
    `;
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = verifyAuth(request);
  if (!user || user.role !== 'Administrador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role, department_id } = body;

    const hash = await bcrypt.hash(password, 10);

    // Si department_id no viene, será null en NeonDB
    const result = await sql`
      INSERT INTO users (name, email, password_hash, role, department_id) 
      VALUES (${name}, ${email}, ${hash}, ${role}, ${department_id || null})
      RETURNING id, name, email, role
    `;


    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Email ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
