const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.cnawnprwdcfmyswqolsu',
  password: 'tofQTPUIRL9cw0Q6',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function fixAuthTrigger() {
  try {
    await client.connect();
    console.log('✅ Veritabanına bağlandı');

    // Mevcut trigger'ı kontrol et
    const { rows: triggers } = await client.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'users' 
      AND event_object_schema = 'auth';
    `);

    console.log('\n📋 Mevcut auth trigger\'ları:');
    triggers.forEach(t => {
      console.log(`  - ${t.trigger_name}: ${t.event_manipulation}`);
    });

    // Mevcut handle_new_user fonksiyonunu kontrol et
    const { rows: functions } = await client.query(`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_name = 'handle_new_user'
      AND routine_schema = 'public';
    `);

    if (functions.length > 0) {
      console.log('\n📋 Mevcut handle_new_user fonksiyonu bulundu');
    }

    // Trigger'ı ve fonksiyonu güncelle - daha güvenli hale getir
    console.log('\n🔧 Trigger fonksiyonu güncelleniyor...');

    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        -- Profil zaten var mı kontrol et
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
          INSERT INTO public.profiles (id, email, full_name, role)
          VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'role', 'ogrenci')
          );
        END IF;
        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          -- Hata olsa bile kullanıcı oluşturulsun
          RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
          RETURN NEW;
      END;
      $$;
    `);

    console.log('✅ Fonksiyon güncellendi');

    // Eski trigger'ı kaldır ve yenisini oluştur
    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `);

    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    `);

    console.log('✅ Trigger güncellendi');

    // profiles tablosundaki constraints'i kontrol et
    console.log('\n🔍 profiles tablosu kontrol ediliyor...');
    
    const { rows: columns } = await client.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'profiles' AND table_schema = 'public';
    `);

    console.log('profiles kolonları:');
    columns.forEach(c => {
      console.log(`  - ${c.column_name}: nullable=${c.is_nullable}, default=${c.column_default || 'none'}`);
    });

    // Eğer role kolonu NOT NULL ve default yoksa düzelt
    await client.query(`
      ALTER TABLE public.profiles 
      ALTER COLUMN role SET DEFAULT 'ogrenci';
    `).catch(() => {});

    await client.query(`
      ALTER TABLE public.profiles 
      ALTER COLUMN full_name DROP NOT NULL;
    `).catch(() => {});

    console.log('\n🎉 Trigger düzeltmeleri tamamlandı!');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await client.end();
  }
}

fixAuthTrigger();

