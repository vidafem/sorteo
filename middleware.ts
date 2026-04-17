import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // For now, skip middleware as authentication is handled in components
  // TODO: Implement proper middleware with Supabase auth
  return NextResponse.next();
}

export const config = {
  matcher: [],
};