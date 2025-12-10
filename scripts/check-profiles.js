const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.cnawnprwdcfmyswqolsu',
  password: 'tofQTPUIRL9cw0Q6',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    await client.connect();
    console.log('✅ Veritabanına bağlandı\n');

    // Tüm profilleri listele
    const profiles = await client.query(`
      SELECT * FROM profiles ORDER BY created_at DESC LIMIT 10
    `);
    console.log('👤 Son Profiller:');
    if (profiles.rows.length > 0) {
      console.log('  Kolonlar:', Object.keys(profiles.rows[0]).join(', '));
      profiles.rows.forEach(p => {
        console.log(`  - ${p.full_name || p.name || 'İsimsiz'} (${p.role}) - ID: ${p.id}`);
      });
    }

    // Öğrenci profilleri
    const students = await client.query(`
      SELECT * FROM student_profiles ORDER BY created_at DESC LIMIT 10
    `);
    console.log('\n🎓 Öğrenci Profilleri:');
    if (students.rows.length === 0) {
      console.log('  ❌ Hiç öğrenci profili yok!');
    } else {
      console.log('  Kolonlar:', Object.keys(students.rows[0]).join(', '));
      students.rows.forEach(s => {
        console.log(`  - user_id: ${s.user_id} - ID: ${s.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await client.end();
  }
}

check();
