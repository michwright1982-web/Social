import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Mock Database Registration: In a real app, hash password and save to Postgres/Supabase
    // Here we just accept it and log the user in immediately for prototyping purposes
    
    // Create a mock session token
    const token = Buffer.from(JSON.stringify({ email, name, timestamp: Date.now() })).toString('base64');

    const response = NextResponse.json({ success: true, message: 'Account created successfully' });

    // Set HTTP-only secure cookie
    response.cookies.set('ai_marketing_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
