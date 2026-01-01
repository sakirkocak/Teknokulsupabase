/**
 * Question Banks Migration Runner
 * Soru bankası tablolarını oluşturur
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY veya NEXT_PUBLIC_SUPABASE_URL tanımlı değil!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Question Banks migration başlıyor...\n')

  const queries = [
    // 1. Question Banks tablosu
    {
      name: 'question_banks tablosu',
      sql: `
        CREATE TABLE IF NOT EXISTS question_banks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
          user_name VARCHAR(100) DEFAULT 'Teknokul Kullanıcısı',
          ip_hash VARCHAR(64),
          grade INT,
          exam_type VARCHAR(20),
          subject_code VARCHAR(10),
          subject_name VARCHAR(50),
          topics TEXT[],
          difficulty VARCHAR(20),
          question_count INT NOT NULL CHECK (question_count >= 10 AND question_count <= 200),
          question_ids UUID[],
          pdf_url TEXT,
          pdf_size_kb INT,
          is_public BOOLEAN DEFAULT true,
          published_at TIMESTAMPTZ DEFAULT NOW(),
          view_count INT DEFAULT 0,
          download_count INT DEFAULT 0,
          meta_title VARCHAR(70),
          meta_description VARCHAR(160),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    // 2. Indexler
    {
      name: 'Indexler',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_question_banks_slug ON question_banks(slug);
        CREATE INDEX IF NOT EXISTS idx_question_banks_public ON question_banks(is_public, published_at DESC);
        CREATE INDEX IF NOT EXISTS idx_question_banks_user ON question_banks(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_question_banks_grade ON question_banks(grade);
        CREATE INDEX IF NOT EXISTS idx_question_banks_subject ON question_banks(subject_code);
        CREATE INDEX IF NOT EXISTS idx_question_banks_download ON question_banks(download_count DESC);
      `
    },
    // 3. Updated_at trigger
    {
      name: 'Updated_at trigger',
      sql: `
        CREATE OR REPLACE FUNCTION update_question_banks_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'Trigger oluştur',
      sql: `
        DROP TRIGGER IF EXISTS trigger_question_banks_updated_at ON question_banks;
        CREATE TRIGGER trigger_question_banks_updated_at
          BEFORE UPDATE ON question_banks
          FOR EACH ROW
          EXECUTE FUNCTION update_question_banks_updated_at();
      `
    },
    // 4. RLS
    {
      name: 'RLS aktif',
      sql: `ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;`
    },
    // 5. Policies
    {
      name: 'Public banks policy',
      sql: `
        DROP POLICY IF EXISTS "Public banks viewable" ON question_banks;
        CREATE POLICY "Public banks viewable"
          ON question_banks FOR SELECT
          USING (is_public = true);
      `
    },
    {
      name: 'Users view own banks policy',
      sql: `
        DROP POLICY IF EXISTS "Users view own banks" ON question_banks;
        CREATE POLICY "Users view own banks"
          ON question_banks FOR SELECT
          USING (auth.uid() = user_id);
      `
    },
    {
      name: 'Anyone can create policy',
      sql: `
        DROP POLICY IF EXISTS "Anyone can create banks" ON question_banks;
        CREATE POLICY "Anyone can create banks"
          ON question_banks FOR INSERT
          WITH CHECK (true);
      `
    },
    {
      name: 'Users update own banks policy',
      sql: `
        DROP POLICY IF EXISTS "Users update own banks" ON question_banks;
        CREATE POLICY "Users update own banks"
          ON question_banks FOR UPDATE
          USING (auth.uid() = user_id);
      `
    },
    {
      name: 'Users delete own banks policy',
      sql: `
        DROP POLICY IF EXISTS "Users delete own banks" ON question_banks;
        CREATE POLICY "Users delete own banks"
          ON question_banks FOR DELETE
          USING (auth.uid() = user_id);
      `
    },
    // 6. View count fonksiyonu
    {
      name: 'increment_bank_view_count fonksiyonu',
      sql: `
        CREATE OR REPLACE FUNCTION increment_bank_view_count(bank_id UUID)
        RETURNS void AS $$
        BEGIN
          UPDATE question_banks SET view_count = view_count + 1 WHERE id = bank_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    // 7. Download count fonksiyonu
    {
      name: 'increment_bank_download_count fonksiyonu',
      sql: `
        CREATE OR REPLACE FUNCTION increment_bank_download_count(bank_id UUID)
        RETURNS void AS $$
        BEGIN
          UPDATE question_banks SET download_count = download_count + 1 WHERE id = bank_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    // 8. Rate limits tablosu
    {
      name: 'question_bank_rate_limits tablosu',
      sql: `
        CREATE TABLE IF NOT EXISTS question_bank_rate_limits (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          ip_hash VARCHAR(64) NOT NULL,
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          date DATE DEFAULT CURRENT_DATE,
          count INT DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(ip_hash, date)
        );
      `
    },
    {
      name: 'Rate limits index',
      sql: `CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_date ON question_bank_rate_limits(ip_hash, date);`
    },
    // 9. Rate limit check fonksiyonu
    {
      name: 'check_question_bank_rate_limit fonksiyonu',
      sql: `
        CREATE OR REPLACE FUNCTION check_question_bank_rate_limit(
          p_ip_hash VARCHAR(64),
          p_user_id UUID DEFAULT NULL
        )
        RETURNS TABLE(allowed BOOLEAN, remaining INT, limit_count INT) AS $$
        DECLARE
          v_count INT;
          v_limit INT;
        BEGIN
          IF p_user_id IS NULL THEN v_limit := 5; ELSE v_limit := 20; END IF;
          
          SELECT COALESCE(rl.count, 0) INTO v_count
          FROM question_bank_rate_limits rl
          WHERE rl.ip_hash = p_ip_hash AND rl.date = CURRENT_DATE;
          
          IF v_count IS NULL THEN v_count := 0; END IF;
          
          RETURN QUERY SELECT v_count < v_limit, GREATEST(0, v_limit - v_count), v_limit;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    // 10. Rate limit increment fonksiyonu
    {
      name: 'increment_question_bank_rate_limit fonksiyonu',
      sql: `
        CREATE OR REPLACE FUNCTION increment_question_bank_rate_limit(
          p_ip_hash VARCHAR(64),
          p_user_id UUID DEFAULT NULL
        )
        RETURNS void AS $$
        BEGIN
          INSERT INTO question_bank_rate_limits (ip_hash, user_id, date, count)
          VALUES (p_ip_hash, p_user_id, CURRENT_DATE, 1)
          ON CONFLICT (ip_hash, date) 
          DO UPDATE SET count = question_bank_rate_limits.count + 1;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    }
  ]

  let successCount = 0
  let errorCount = 0

  for (const query of queries) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: query.sql })
      
      if (error) {
        // exec_sql yoksa raw SQL dene
        const { error: rawError } = await supabase.from('_exec').select().limit(0)
        throw new Error(error.message)
      }
      
      console.log(`✅ ${query.name}`)
      successCount++
    } catch (err) {
      // Direkt REST API ile dene
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: query.sql })
        })
        
        if (response.ok) {
          console.log(`✅ ${query.name}`)
          successCount++
        } else {
          throw new Error('RPC failed')
        }
      } catch (e) {
        console.log(`⚠️ ${query.name} - Manuel çalıştırılmalı`)
        errorCount++
      }
    }
  }

  console.log(`\n📊 Sonuç: ${successCount} başarılı, ${errorCount} manuel gerekli`)
  
  if (errorCount > 0) {
    console.log('\n📋 Manuel çalıştırmak için SQL Editor\'e şu komutu yapıştır:')
    console.log('─'.repeat(50))
    console.log(`
-- Question Banks tablosu
CREATE TABLE IF NOT EXISTS question_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name VARCHAR(100) DEFAULT 'Teknokul Kullanıcısı',
  ip_hash VARCHAR(64),
  grade INT,
  exam_type VARCHAR(20),
  subject_code VARCHAR(10),
  subject_name VARCHAR(50),
  topics TEXT[],
  difficulty VARCHAR(20),
  question_count INT NOT NULL CHECK (question_count >= 10 AND question_count <= 200),
  question_ids UUID[],
  pdf_url TEXT,
  pdf_size_kb INT,
  is_public BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
    `)
  }
}

runMigration().catch(console.error)
