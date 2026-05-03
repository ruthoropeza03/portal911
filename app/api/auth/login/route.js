import { NextResponse } from 'next/server';
import sql from '@/lib/neon';
import { signToken } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';

const ALLOWED_ROLES = ['Coordinador', 'Prensa', 'Gestión Humana', 'Administrador'];

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 });
    }

    // Trim para evitar espacios
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const users = await sql`
      SELECT u.*, d.name as department_name 
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.email = ${cleanEmail} AND u.active = true
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const user = users[0];

    // Verificar que el rol tenga acceso al sistema
    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Este usuario no tiene acceso al sistema' }, { status: 403 });
    }

    // Comparación directa de texto plano (SIN HASH)
    if (cleanPassword !== user.password_hash) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_name: user.department_name
    };

    const token = signToken(payload);

    logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      module: 'Autenticación',
      description: `Inicio de sesión exitoso (${user.email})`,
      request,
    });

    return NextResponse.json({
      user: payload,
      token
    }, { status: 200 });

  } catch (error) {
    console.error('Error de Inicio de Sesión:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}