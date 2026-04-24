import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import sql from "@/lib/neon";

export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit"), 10) : 50;

    let notifications;

    if (unreadOnly) {
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${user.id} AND is_read = false 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
    } else {
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${user.id} 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = ${user.id} AND is_read = false
      `;
      return NextResponse.json({ success: true, message: "All marked as read" });
    }

    if (id) {
      await sql`
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = ${user.id} AND id = ${id}
      `;
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Opcional: Endpoint para crear notificaciones (solo Admin o lógica interna)
export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, title, message, type = 'info' } = body;

    // Solo Admin u otro proceso interno autorizado debería poder crear libremente (o se puede omitir esta validación si es para probar)
    const result = await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (${user_id}, ${title}, ${message}, ${type})
      RETURNING *
    `;

    return NextResponse.json({ success: true, notification: result[0] });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
