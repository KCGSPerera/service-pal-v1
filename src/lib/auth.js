import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'service-pal-super-secret-key-12345';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getAuthenticatedUser(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    return decoded; // Returns { userId, role } or null
  } catch (error) {
    return null;
  }
}
