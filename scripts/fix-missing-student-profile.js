const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.cnawnprwdcfmyswqolsu',
  password: 'tofQTPUIRL9cw0Q6',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  try {
    await client.connect();
    console.log('✅ Veritabanına bağlandı\n');

    // Eksik öğrenci profillerini bul ve oluştur
    const missing = await client.query(`
      SELECT id, full_name FROM profiles 
      WHERE role = 'ogrenci' 
      AND id NOT IN (SELECT user_id FROM student_profiles)
    `);

    console.log(`📋 ${missing.rows.length} eksik öğrenci profili bulundu\n`);

    for (const profile of missing.rows) {
      console.log(`➕ Oluşturuluyor: ${profile.full_name} (${profile.id})`);
      
      await client.query(`
        INSERT INTO student_profiles (user_id, grade_level, target_exam)
        VALUES ($1, '11. Sınıf', 'TYT')
      `, [profile.id]);
      
      console.log(`   ✅ Oluşturuldu!`);
    }

    console.log('\n🎉 Tüm eksik profiller oluşturuldu!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await client.end();
  }
}

fix();

