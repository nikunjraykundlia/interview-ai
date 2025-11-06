export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        // Get token from Cookie header
        const cookieHeader = req.headers.get('cookie') || '';
        const tokenMatch = cookieHeader
          .split(';')
          .map(p => p.trim())
          .find(p => p.startsWith('token='));
        const token = tokenMatch ? decodeURIComponent(tokenMatch.split('=')[1] || '') : '';
        
        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }
        
        // Verify token
        const decoded = await verifyToken(token);
        
        return NextResponse.json({ 
            authenticated: true,
            user: decoded
        });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
} 