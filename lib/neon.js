import { neon } from '@neondatabase/serverless';

// Singleton para crear y reusar la conexión del pool en entornos serverless
const sql = neon(process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/portal911');

export default sql;
