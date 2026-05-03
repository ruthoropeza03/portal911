import { NextResponse } from "next/server";
import sql from "@/lib/neon";
import { verifyAuth } from "@/lib/auth";
import { logAudit } from "@/lib/auditLog";

export async function GET(request) {
  const userAuth = verifyAuth(request);
  if (!userAuth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await sql`
      SELECT u.id, u.name, u.email, u.role, u.active, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ${userAuth.id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
  }
}

export async function PUT(request) {
  const userAuth = verifyAuth(request);
  if (!userAuth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = body?.name?.trim();
    const email = body?.email?.trim()?.toLowerCase();
    const password = body?.password?.trim();

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y correo son obligatorios" }, { status: 400 });
    }

    let query;
    if (password) {
      query = await sql`
        UPDATE users
        SET name = ${name},
            email = ${email},
            password_hash = ${password}
        WHERE id = ${userAuth.id}
        RETURNING id, name, email, role, active
      `;
    } else {
      query = await sql`
        UPDATE users
        SET name = ${name},
            email = ${email}
        WHERE id = ${userAuth.id}
        RETURNING id, name, email, role, active
      `;
    }

    if (query.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const department = await sql`
      SELECT d.name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ${userAuth.id}
      LIMIT 1
    `;

    logAudit({
      userId: userAuth.id,
      userName: name,
      userRole: userAuth.role,
      action: 'UPDATE_PROFILE',
      module: 'Perfil',
      description: `Actualizó su perfil (nombre: '${name}', email: '${email}')`,
      request,
    });

    return NextResponse.json({
      ...query[0],
      department_name: department[0]?.name || null,
    });
  } catch (error) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }

    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}
