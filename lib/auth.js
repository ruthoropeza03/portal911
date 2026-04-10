import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'portal911_supersecret_default_key_keep_safe';

export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

// Middleware lógico para rutas que extrae el token del header (Bearer token)
export const verifyAuth = (request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
};


