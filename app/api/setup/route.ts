import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function checkTable() {
  const supabase = await createClient()
  
  // Create user_reports table using raw SQL via rpc or direct query
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS user_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_identifier TEXT NOT NULL UNIQUE,
        report TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  })

  if (error) {
    // Try alternative: just test if we can insert/select
    const { error: testError } = await supabase
      .from('user_reports')
      .select('id')
      .limit(1)
    
    if (testError && testError.code === 'PGRST205') {
      return NextResponse.json({ 
        success: false, 
        message: 'La tabla user_reports no existe. Necesitas ejecutar el SQL manualmente en Supabase Dashboard.',
        sql: `CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL UNIQUE,
  report TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`
      })
    }
    
    return NextResponse.json({ success: true, message: 'Tabla ya existe' })
  }

  return NextResponse.json({ success: true, message: 'Tabla creada exitosamente' })
}

export async function GET() {
  return checkTable()
}

export async function POST() {
  return checkTable()
}
