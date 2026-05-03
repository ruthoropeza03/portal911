import sql from '@/lib/neon';

/**
 * Registra una acción en la bitácora (audit_log).
 * Es fire-and-forget: nunca bloquea ni lanza excepciones a las rutas que la llaman.
 *
 * @param {object} opts
 * @param {number|null}  opts.userId      - ID del usuario que realizó la acción
 * @param {string}       opts.userName    - Nombre del usuario (desnormalizado)
 * @param {string}       opts.userRole    - Rol del usuario (desnormalizado)
 * @param {string}       opts.action      - Código de la acción (ej. 'CREATE_NEWS')
 * @param {string}       opts.module      - Módulo del portal (ej. 'Noticias')
 * @param {string}       opts.description - Descripción legible de la acción
 * @param {Request|null} opts.request     - Request de Next.js para extraer la IP (opcional)
 */
export function logAudit({ userId = null, userName = 'Desconocido', userRole = '', action, module, description = '', request = null }) {
  // Extraer IP del request de forma segura
  let ipAddress = null;
  if (request) {
    try {
      ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null;
    } catch {
      ipAddress = null;
    }
  }

  // Fire-and-forget: no await, no throw
  sql`
    INSERT INTO audit_log (user_id, user_name, user_role, action, module, description, ip_address)
    VALUES (
      ${userId},
      ${userName},
      ${userRole},
      ${action},
      ${module},
      ${description},
      ${ipAddress}
    )
  `.catch((err) => {
    console.error('[auditLog] Error al registrar en bitácora:', err?.message ?? err);
  });
}
