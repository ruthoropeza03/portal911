import { NextResponse } from 'next/server';
import sql from '@/lib/neon';

export async function GET() {
  try {
    // Verificar conexión a NeonDB
    const startTime = Date.now();
    
    // Consulta simple para probar la conexión
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    
    // Obtener información adicional
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa a NeonDB',
      responseTime: `${responseTime}ms`,
      details: {
        current_time: result[0]?.current_time,
        version: result[0]?.postgres_version,
        table_count: tables.length,
        tables: tables.map(t => t.table_name),
        user_count: parseInt(userCount[0]?.count || 0)
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error verificando conexión a NeonDB:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error al conectar con NeonDB',
      error: error.message,
      details: {
        code: error.code,
        hint: error.hint,
        position: error.position
      }
    }, { status: 500 });
  }
}