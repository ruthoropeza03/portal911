import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 });
    }

    // Trim para evitar espacios
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const users = await sql`SELECT * FROM users WHERE email = ${cleanEmail} AND active = true`;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const user = users[0];

    // Comparación directa de texto plano (SIN HASH)
    if (cleanPassword !== user.password_hash) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = signToken(payload);

    // No enviar la contraseña al cliente
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: payload,
      token
    }, { status: 200 });

  } catch (error) {
    console.error('Error de Inicio de Sesión:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}