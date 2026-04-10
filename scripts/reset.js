// scripts/reset-all-to-123456.js
import sql from '../lib/neon.js';
import bcrypt from 'bcrypt';

async function resetAllPasswords() {
  const defaultPassword = '123456';
  const hash = await bcrypt.hash(defaultPassword, 10);
  
  await sql`UPDATE users SET password_hash = ${hash} WHERE active = true`;
  
  console.log(`✅ Todas las contraseñas han sido reseteadas a: ${defaultPassword}`);
  console.log('Ahora puedes iniciar sesión con cualquier usuario y la contraseña 123456');
}

resetAllPasswords();