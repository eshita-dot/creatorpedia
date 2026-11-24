import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const supabase = await createClient()
  const { data } = await supabase
    .from('brands')
    .select('id, name, category, is_d2c')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(10)

  return NextResponse.json(data ?? [])
}
