import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        valid: false, 
        reason: 'No token provided' 
      });
    }

    console.log('[check-token] Validating token');
    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        valid: false, 
        reason: 'Invalid token' 
      });
    }

    return res.status(200).json({ 
      valid: true,
      user: decoded 
    });
  } catch (error) {
    console.error('[check-token] Error:', error);
    return res.status(401).json({ 
      valid: false, 
      reason: error instanceof Error ? error.message : 'Token validation failed' 
    });
  }
} 