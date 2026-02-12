/**
 * TYT Migration Runner
 * exam_topics tablosu + questions.exam_types kolonu
 *
 * Calistirma: node scripts/run-tyt-migration.js
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
  console.log('🚀 TYT Migration başlıyor...\n')

  const queries = [
    // 1. exam_topics tablosu
    {
      name: 'exam_topics tablosu',
      sql: `
        CREATE TABLE IF NOT EXISTS exam_topics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          exam_type VARCHAR(20) NOT NULL,
          subject_code VARCHAR(30) NOT NULL,
          subject_name VARCHAR(100) NOT NULL,
          main_topic VARCHAR(255) NOT NULL,
          sub_topic VARCHAR(255),
          topic_order INT DEFAULT 0,
          question_weight INT DEFAULT 1,
          osym_frequency VARCHAR(20) DEFAULT 'orta',
          grades INT[] DEFAULT '{9,10,11}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(exam_type, subject_code, main_topic, COALESCE(sub_topic, ''))
        );
      `
    },
    // 2. exam_topics indexleri
    {
      name: 'exam_topics indexleri',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_exam_topics_exam_type ON exam_topics(exam_type);
        CREATE INDEX IF NOT EXISTS idx_exam_topics_subject ON exam_topics(subject_code);
        CREATE INDEX IF NOT EXISTS idx_exam_topics_composite ON exam_topics(exam_type, subject_code);
      `
    },
    // 3. exam_topics RLS
    {
      name: 'exam_topics RLS',
      sql: `
        ALTER TABLE exam_topics ENABLE ROW LEVEL SECURITY;

        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'exam_topics' AND policyname = 'exam_topics_select'
          ) THEN
            CREATE POLICY exam_topics_select ON exam_topics FOR SELECT USING (true);
          END IF;
        END $$;

        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'exam_topics' AND policyname = 'exam_topics_admin'
          ) THEN
            CREATE POLICY exam_topics_admin ON exam_topics FOR ALL
              USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
          END IF;
        END $$;
      `
    },
    // 4. questions tablosuna exam_types kolonu
    {
      name: 'questions.exam_types kolonu',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'questions' AND column_name = 'exam_types'
          ) THEN
            ALTER TABLE questions ADD COLUMN exam_types TEXT[] DEFAULT '{}';
          END IF;
        END $$;
      `
    },
    // 5. questions tablosuna exam_topic_id kolonu
    {
      name: 'questions.exam_topic_id kolonu',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'questions' AND column_name = 'exam_topic_id'
          ) THEN
            ALTER TABLE questions ADD COLUMN exam_topic_id UUID REFERENCES exam_topics(id);
          END IF;
        END $$;
      `
    },
    // 6. questions.exam_types GIN index
    {
      name: 'questions.exam_types GIN index',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_questions_exam_types ON questions USING GIN (exam_types);
        CREATE INDEX IF NOT EXISTS idx_questions_exam_topic_id ON questions(exam_topic_id);
      `
    },
    // 7. exam_topics updated_at trigger
    {
      name: 'exam_topics updated_at trigger',
      sql: `
        CREATE OR REPLACE FUNCTION update_exam_topics_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS exam_topics_updated_at ON exam_topics;
        CREATE TRIGGER exam_topics_updated_at
          BEFORE UPDATE ON exam_topics
          FOR EACH ROW
          EXECUTE FUNCTION update_exam_topics_updated_at();
      `
    }
  ]

  let successCount = 0
  let failCount = 0

  for (const query of queries) {
    try {
      console.log(`⏳ ${query.name}...`)
      const { error } = await supabase.rpc('exec_sql', { sql_text: query.sql }).catch(() => {
        // exec_sql yoksa direkt sorguyu dene
        return supabase.from('_migrations').select('*').limit(0)
      })

      // Alternatif: direkt SQL calistir
      const { error: sqlError } = await supabase.schema('public').rpc('', {}).catch(async () => {
        // REST API ile SQL calistirma
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          }
        })
        return { error: null }
      })

      // Supabase JS ile SQL calistir (pgmeta endpoint)
      const pgResponse = await fetch(`${supabaseUrl}/pg/query`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: query.sql })
      })

      if (!pgResponse.ok) {
        // SQL Editor API dene
        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ sql_text: query.sql })
        })

        if (sqlResponse.ok || sqlResponse.status === 204) {
          console.log(`  ✅ ${query.name} - başarılı`)
          successCount++
        } else {
          const errText = await sqlResponse.text()
          console.log(`  ⚠️ ${query.name} - REST API hatası: ${errText.substring(0, 100)}`)
          failCount++
        }
      } else {
        console.log(`  ✅ ${query.name} - başarılı`)
        successCount++
      }
    } catch (err) {
      console.error(`  ❌ ${query.name} - hata:`, err.message)
      failCount++
    }
  }

  console.log(`\n📊 Sonuç: ${successCount} başarılı, ${failCount} hatalı`)
  console.log('\n💡 Eğer hatalar varsa, Supabase Dashboard > SQL Editor\'den manuel çalıştırabilirsiniz.')
  console.log('\nSQL kodları:')
  queries.forEach(q => {
    console.log(`\n-- ${q.name}`)
    console.log(q.sql.trim())
  })
}

runMigration().catch(console.error)
