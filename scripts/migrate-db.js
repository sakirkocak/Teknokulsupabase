const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.cnawnprwdcfmyswqolsu',
  password: 'tofQTPUIRL9cw0Q6',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log('✅ Veritabanına bağlandı');

    // 1. Tasks tablosuna yeni alanlar ekle
    console.log('📝 Tasks tablosu güncelleniyor...');
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS screenshots TEXT[];
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
    `);
    console.log('✅ Tasks tablosu güncellendi');

    // 2. Notifications body alanı
    console.log('📝 Notifications tablosu kontrol ediliyor...');
    const bodyCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'body'
    `);
    
    if (bodyCheck.rows.length === 0) {
      await client.query(`ALTER TABLE notifications ADD COLUMN body TEXT`);
      console.log('✅ Notifications body alanı eklendi');
    } else {
      console.log('✅ Notifications body alanı zaten mevcut');
    }

    // 3. Notifications INSERT policy
    console.log('📝 Notifications INSERT policy oluşturuluyor...');
    await client.query(`DROP POLICY IF EXISTS "Bildirimler oluşturulabilir" ON notifications`);
    await client.query(`
      CREATE POLICY "Bildirimler oluşturulabilir"
      ON notifications FOR INSERT
      WITH CHECK (true)
    `);
    console.log('✅ Notifications INSERT policy oluşturuldu');

    // 4. Activity logs task_id
    console.log('📝 Activity logs tablosu güncelleniyor...');
    const taskIdCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'activity_logs' AND column_name = 'task_id'
    `);
    
    if (taskIdCheck.rows.length === 0) {
      await client.query(`ALTER TABLE activity_logs ADD COLUMN task_id UUID REFERENCES tasks(id)`);
      console.log('✅ Activity logs task_id alanı eklendi');
    } else {
      console.log('✅ Activity logs task_id alanı zaten mevcut');
    }

    // 5. Storage bucket for task screenshots
    console.log('📝 Storage bucket oluşturuluyor...');
    try {
      await client.query(`
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('task-screenshots', 'task-screenshots', true)
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('✅ task-screenshots bucket oluşturuldu');
    } catch (e) {
      console.log('⚠️ Bucket oluşturma atlandı (zaten mevcut olabilir)');
    }

    // 6. Storage policies
    console.log('📝 Storage policies oluşturuluyor...');
    try {
      await client.query(`DROP POLICY IF EXISTS "Task screenshots public read" ON storage.objects`);
      await client.query(`
        CREATE POLICY "Task screenshots public read"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'task-screenshots')
      `);
      
      await client.query(`DROP POLICY IF EXISTS "Users can upload task screenshots" ON storage.objects`);
      await client.query(`
        CREATE POLICY "Users can upload task screenshots"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'task-screenshots' AND auth.uid() IS NOT NULL)
      `);
      
      await client.query(`DROP POLICY IF EXISTS "Users can update own task screenshots" ON storage.objects`);
      await client.query(`
        CREATE POLICY "Users can update own task screenshots"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'task-screenshots' AND auth.uid() IS NOT NULL)
      `);
      console.log('✅ Storage policies oluşturuldu');
    } catch (e) {
      console.log('⚠️ Storage policies atlandı:', e.message);
    }

    console.log('\n🎉 Tüm migration işlemleri tamamlandı!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await client.end();
  }
}

migrate();

