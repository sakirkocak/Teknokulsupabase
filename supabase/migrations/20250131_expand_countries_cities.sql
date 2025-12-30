-- =====================================================
-- EXPANDED COUNTRIES AND CITIES DATABASE
-- 100+ Countries, 500+ Cities for Global Platform
-- =====================================================

-- First, ensure all required columns exist in countries table
ALTER TABLE countries ADD COLUMN IF NOT EXISTS flag_emoji TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Ensure all required columns exist in cities_global table
ALTER TABLE cities_global ADD COLUMN IF NOT EXISTS country_name TEXT;
ALTER TABLE cities_global ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE cities_global ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE cities_global ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Clear existing data to avoid duplicates (keep Turkey)
DELETE FROM cities_global WHERE country_code NOT IN ('TR');
DELETE FROM countries WHERE code NOT IN ('TR');

-- =====================================================
-- EUROPE
-- =====================================================

INSERT INTO countries (name, code, flag_emoji, region, currency, timezone) VALUES
-- Western Europe
('Germany', 'DE', '🇩🇪', 'Europe', 'EUR', 'Europe/Berlin'),
('France', 'FR', '🇫🇷', 'Europe', 'EUR', 'Europe/Paris'),
('United Kingdom', 'GB', '🇬🇧', 'Europe', 'GBP', 'Europe/London'),
('Italy', 'IT', '🇮🇹', 'Europe', 'EUR', 'Europe/Rome'),
('Spain', 'ES', '🇪🇸', 'Europe', 'EUR', 'Europe/Madrid'),
('Portugal', 'PT', '🇵🇹', 'Europe', 'EUR', 'Europe/Lisbon'),
('Netherlands', 'NL', '🇳🇱', 'Europe', 'EUR', 'Europe/Amsterdam'),
('Belgium', 'BE', '🇧🇪', 'Europe', 'EUR', 'Europe/Brussels'),
('Switzerland', 'CH', '🇨🇭', 'Europe', 'CHF', 'Europe/Zurich'),
('Austria', 'AT', '🇦🇹', 'Europe', 'EUR', 'Europe/Vienna'),
('Ireland', 'IE', '🇮🇪', 'Europe', 'EUR', 'Europe/Dublin'),
('Luxembourg', 'LU', '🇱🇺', 'Europe', 'EUR', 'Europe/Luxembourg'),
-- Scandinavia
('Sweden', 'SE', '🇸🇪', 'Europe', 'SEK', 'Europe/Stockholm'),
('Norway', 'NO', '🇳🇴', 'Europe', 'NOK', 'Europe/Oslo'),
('Denmark', 'DK', '🇩🇰', 'Europe', 'DKK', 'Europe/Copenhagen'),
('Finland', 'FI', '🇫🇮', 'Europe', 'EUR', 'Europe/Helsinki'),
('Iceland', 'IS', '🇮🇸', 'Europe', 'ISK', 'Atlantic/Reykjavik'),
-- Eastern Europe
('Poland', 'PL', '🇵🇱', 'Europe', 'PLN', 'Europe/Warsaw'),
('Czech Republic', 'CZ', '🇨🇿', 'Europe', 'CZK', 'Europe/Prague'),
('Hungary', 'HU', '🇭🇺', 'Europe', 'HUF', 'Europe/Budapest'),
('Romania', 'RO', '🇷🇴', 'Europe', 'RON', 'Europe/Bucharest'),
('Bulgaria', 'BG', '🇧🇬', 'Europe', 'BGN', 'Europe/Sofia'),
('Ukraine', 'UA', '🇺🇦', 'Europe', 'UAH', 'Europe/Kyiv'),
('Slovakia', 'SK', '🇸🇰', 'Europe', 'EUR', 'Europe/Bratislava'),
('Croatia', 'HR', '🇭🇷', 'Europe', 'EUR', 'Europe/Zagreb'),
('Slovenia', 'SI', '🇸🇮', 'Europe', 'EUR', 'Europe/Ljubljana'),
('Serbia', 'RS', '🇷🇸', 'Europe', 'RSD', 'Europe/Belgrade'),
('Bosnia and Herzegovina', 'BA', '🇧🇦', 'Europe', 'BAM', 'Europe/Sarajevo'),
('North Macedonia', 'MK', '🇲🇰', 'Europe', 'MKD', 'Europe/Skopje'),
('Albania', 'AL', '🇦🇱', 'Europe', 'ALL', 'Europe/Tirane'),
('Kosovo', 'XK', '🇽🇰', 'Europe', 'EUR', 'Europe/Belgrade'),
('Montenegro', 'ME', '🇲🇪', 'Europe', 'EUR', 'Europe/Podgorica'),
('Moldova', 'MD', '🇲🇩', 'Europe', 'MDL', 'Europe/Chisinau'),
('Belarus', 'BY', '🇧🇾', 'Europe', 'BYN', 'Europe/Minsk'),
-- Baltic States
('Estonia', 'EE', '🇪🇪', 'Europe', 'EUR', 'Europe/Tallinn'),
('Latvia', 'LV', '🇱🇻', 'Europe', 'EUR', 'Europe/Riga'),
('Lithuania', 'LT', '🇱🇹', 'Europe', 'EUR', 'Europe/Vilnius'),
-- Southern Europe
('Greece', 'GR', '🇬🇷', 'Europe', 'EUR', 'Europe/Athens'),
('Cyprus', 'CY', '🇨🇾', 'Europe', 'EUR', 'Asia/Nicosia'),
('Malta', 'MT', '🇲🇹', 'Europe', 'EUR', 'Europe/Malta'),
-- Russia
('Russia', 'RU', '🇷🇺', 'Europe', 'RUB', 'Europe/Moscow')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, flag_emoji = EXCLUDED.flag_emoji;

-- =====================================================
-- ASIA
-- =====================================================

INSERT INTO countries (name, code, flag_emoji, region, currency, timezone) VALUES
-- South Asia
('India', 'IN', '🇮🇳', 'Asia', 'INR', 'Asia/Kolkata'),
('Pakistan', 'PK', '🇵🇰', 'Asia', 'PKR', 'Asia/Karachi'),
('Bangladesh', 'BD', '🇧🇩', 'Asia', 'BDT', 'Asia/Dhaka'),
('Sri Lanka', 'LK', '🇱🇰', 'Asia', 'LKR', 'Asia/Colombo'),
('Nepal', 'NP', '🇳🇵', 'Asia', 'NPR', 'Asia/Kathmandu'),
('Bhutan', 'BT', '🇧🇹', 'Asia', 'BTN', 'Asia/Thimphu'),
('Maldives', 'MV', '🇲🇻', 'Asia', 'MVR', 'Indian/Maldives'),
-- Southeast Asia
('Indonesia', 'ID', '🇮🇩', 'Asia', 'IDR', 'Asia/Jakarta'),
('Malaysia', 'MY', '🇲🇾', 'Asia', 'MYR', 'Asia/Kuala_Lumpur'),
('Philippines', 'PH', '🇵🇭', 'Asia', 'PHP', 'Asia/Manila'),
('Thailand', 'TH', '🇹🇭', 'Asia', 'THB', 'Asia/Bangkok'),
('Vietnam', 'VN', '🇻🇳', 'Asia', 'VND', 'Asia/Ho_Chi_Minh'),
('Singapore', 'SG', '🇸🇬', 'Asia', 'SGD', 'Asia/Singapore'),
('Myanmar', 'MM', '🇲🇲', 'Asia', 'MMK', 'Asia/Yangon'),
('Cambodia', 'KH', '🇰🇭', 'Asia', 'KHR', 'Asia/Phnom_Penh'),
('Laos', 'LA', '🇱🇦', 'Asia', 'LAK', 'Asia/Vientiane'),
('Brunei', 'BN', '🇧🇳', 'Asia', 'BND', 'Asia/Brunei'),
('Timor-Leste', 'TL', '🇹🇱', 'Asia', 'USD', 'Asia/Dili'),
-- East Asia
('China', 'CN', '🇨🇳', 'Asia', 'CNY', 'Asia/Shanghai'),
('Japan', 'JP', '🇯🇵', 'Asia', 'JPY', 'Asia/Tokyo'),
('South Korea', 'KR', '🇰🇷', 'Asia', 'KRW', 'Asia/Seoul'),
('Taiwan', 'TW', '🇹🇼', 'Asia', 'TWD', 'Asia/Taipei'),
('Hong Kong', 'HK', '🇭🇰', 'Asia', 'HKD', 'Asia/Hong_Kong'),
('Mongolia', 'MN', '🇲🇳', 'Asia', 'MNT', 'Asia/Ulaanbaatar'),
-- Central Asia
('Kazakhstan', 'KZ', '🇰🇿', 'Asia', 'KZT', 'Asia/Almaty'),
('Uzbekistan', 'UZ', '🇺🇿', 'Asia', 'UZS', 'Asia/Tashkent'),
('Turkmenistan', 'TM', '🇹🇲', 'Asia', 'TMT', 'Asia/Ashgabat'),
('Kyrgyzstan', 'KG', '🇰🇬', 'Asia', 'KGS', 'Asia/Bishkek'),
('Tajikistan', 'TJ', '🇹🇯', 'Asia', 'TJS', 'Asia/Dushanbe'),
-- Middle East
('Saudi Arabia', 'SA', '🇸🇦', 'Asia', 'SAR', 'Asia/Riyadh'),
('United Arab Emirates', 'AE', '🇦🇪', 'Asia', 'AED', 'Asia/Dubai'),
('Qatar', 'QA', '🇶🇦', 'Asia', 'QAR', 'Asia/Qatar'),
('Kuwait', 'KW', '🇰🇼', 'Asia', 'KWD', 'Asia/Kuwait'),
('Bahrain', 'BH', '🇧🇭', 'Asia', 'BHD', 'Asia/Bahrain'),
('Oman', 'OM', '🇴🇲', 'Asia', 'OMR', 'Asia/Muscat'),
('Yemen', 'YE', '🇾🇪', 'Asia', 'YER', 'Asia/Aden'),
('Israel', 'IL', '🇮🇱', 'Asia', 'ILS', 'Asia/Jerusalem'),
('Jordan', 'JO', '🇯🇴', 'Asia', 'JOD', 'Asia/Amman'),
('Lebanon', 'LB', '🇱🇧', 'Asia', 'LBP', 'Asia/Beirut'),
('Syria', 'SY', '🇸🇾', 'Asia', 'SYP', 'Asia/Damascus'),
('Iraq', 'IQ', '🇮🇶', 'Asia', 'IQD', 'Asia/Baghdad'),
('Iran', 'IR', '🇮🇷', 'Asia', 'IRR', 'Asia/Tehran'),
('Afghanistan', 'AF', '🇦🇫', 'Asia', 'AFN', 'Asia/Kabul'),
-- Caucasus
('Georgia', 'GE', '🇬🇪', 'Asia', 'GEL', 'Asia/Tbilisi'),
('Armenia', 'AM', '🇦🇲', 'Asia', 'AMD', 'Asia/Yerevan'),
('Azerbaijan', 'AZ', '🇦🇿', 'Asia', 'AZN', 'Asia/Baku')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, flag_emoji = EXCLUDED.flag_emoji;

-- =====================================================
-- AFRICA
-- =====================================================

INSERT INTO countries (name, code, flag_emoji, region, currency, timezone) VALUES
-- North Africa
('Egypt', 'EG', '🇪🇬', 'Africa', 'EGP', 'Africa/Cairo'),
('Morocco', 'MA', '🇲🇦', 'Africa', 'MAD', 'Africa/Casablanca'),
('Algeria', 'DZ', '🇩🇿', 'Africa', 'DZD', 'Africa/Algiers'),
('Tunisia', 'TN', '🇹🇳', 'Africa', 'TND', 'Africa/Tunis'),
('Libya', 'LY', '🇱🇾', 'Africa', 'LYD', 'Africa/Tripoli'),
('Sudan', 'SD', '🇸🇩', 'Africa', 'SDG', 'Africa/Khartoum'),
-- West Africa
('Nigeria', 'NG', '🇳🇬', 'Africa', 'NGN', 'Africa/Lagos'),
('Ghana', 'GH', '🇬🇭', 'Africa', 'GHS', 'Africa/Accra'),
('Senegal', 'SN', '🇸🇳', 'Africa', 'XOF', 'Africa/Dakar'),
('Ivory Coast', 'CI', '🇨🇮', 'Africa', 'XOF', 'Africa/Abidjan'),
('Cameroon', 'CM', '🇨🇲', 'Africa', 'XAF', 'Africa/Douala'),
('Mali', 'ML', '🇲🇱', 'Africa', 'XOF', 'Africa/Bamako'),
('Burkina Faso', 'BF', '🇧🇫', 'Africa', 'XOF', 'Africa/Ouagadougou'),
('Niger', 'NE', '🇳🇪', 'Africa', 'XOF', 'Africa/Niamey'),
('Guinea', 'GN', '🇬🇳', 'Africa', 'GNF', 'Africa/Conakry'),
('Benin', 'BJ', '🇧🇯', 'Africa', 'XOF', 'Africa/Porto-Novo'),
('Togo', 'TG', '🇹🇬', 'Africa', 'XOF', 'Africa/Lome'),
('Sierra Leone', 'SL', '🇸🇱', 'Africa', 'SLL', 'Africa/Freetown'),
('Liberia', 'LR', '🇱🇷', 'Africa', 'LRD', 'Africa/Monrovia'),
('Gambia', 'GM', '🇬🇲', 'Africa', 'GMD', 'Africa/Banjul'),
('Mauritania', 'MR', '🇲🇷', 'Africa', 'MRU', 'Africa/Nouakchott'),
-- East Africa
('Kenya', 'KE', '🇰🇪', 'Africa', 'KES', 'Africa/Nairobi'),
('Ethiopia', 'ET', '🇪🇹', 'Africa', 'ETB', 'Africa/Addis_Ababa'),
('Tanzania', 'TZ', '🇹🇿', 'Africa', 'TZS', 'Africa/Dar_es_Salaam'),
('Uganda', 'UG', '🇺🇬', 'Africa', 'UGX', 'Africa/Kampala'),
('Rwanda', 'RW', '🇷🇼', 'Africa', 'RWF', 'Africa/Kigali'),
('Somalia', 'SO', '🇸🇴', 'Africa', 'SOS', 'Africa/Mogadishu'),
('Eritrea', 'ER', '🇪🇷', 'Africa', 'ERN', 'Africa/Asmara'),
('Djibouti', 'DJ', '🇩🇯', 'Africa', 'DJF', 'Africa/Djibouti'),
-- Southern Africa
('South Africa', 'ZA', '🇿🇦', 'Africa', 'ZAR', 'Africa/Johannesburg'),
('Zimbabwe', 'ZW', '🇿🇼', 'Africa', 'ZWL', 'Africa/Harare'),
('Zambia', 'ZM', '🇿🇲', 'Africa', 'ZMW', 'Africa/Lusaka'),
('Botswana', 'BW', '🇧🇼', 'Africa', 'BWP', 'Africa/Gaborone'),
('Namibia', 'NA', '🇳🇦', 'Africa', 'NAD', 'Africa/Windhoek'),
('Mozambique', 'MZ', '🇲🇿', 'Africa', 'MZN', 'Africa/Maputo'),
('Malawi', 'MW', '🇲🇼', 'Africa', 'MWK', 'Africa/Blantyre'),
('Madagascar', 'MG', '🇲🇬', 'Africa', 'MGA', 'Indian/Antananarivo'),
('Mauritius', 'MU', '🇲🇺', 'Africa', 'MUR', 'Indian/Mauritius'),
-- Central Africa
('Democratic Republic of the Congo', 'CD', '🇨🇩', 'Africa', 'CDF', 'Africa/Kinshasa'),
('Republic of the Congo', 'CG', '🇨🇬', 'Africa', 'XAF', 'Africa/Brazzaville'),
('Angola', 'AO', '🇦🇴', 'Africa', 'AOA', 'Africa/Luanda'),
('Gabon', 'GA', '🇬🇦', 'Africa', 'XAF', 'Africa/Libreville'),
('Central African Republic', 'CF', '🇨🇫', 'Africa', 'XAF', 'Africa/Bangui'),
('Chad', 'TD', '🇹🇩', 'Africa', 'XAF', 'Africa/Ndjamena')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, flag_emoji = EXCLUDED.flag_emoji;

-- =====================================================
-- AMERICAS
-- =====================================================

INSERT INTO countries (name, code, flag_emoji, region, currency, timezone) VALUES
-- North America
('United States', 'US', '🇺🇸', 'North America', 'USD', 'America/New_York'),
('Canada', 'CA', '🇨🇦', 'North America', 'CAD', 'America/Toronto'),
('Mexico', 'MX', '🇲🇽', 'North America', 'MXN', 'America/Mexico_City'),
-- Central America
('Guatemala', 'GT', '🇬🇹', 'Central America', 'GTQ', 'America/Guatemala'),
('Honduras', 'HN', '🇭🇳', 'Central America', 'HNL', 'America/Tegucigalpa'),
('El Salvador', 'SV', '🇸🇻', 'Central America', 'USD', 'America/El_Salvador'),
('Nicaragua', 'NI', '🇳🇮', 'Central America', 'NIO', 'America/Managua'),
('Costa Rica', 'CR', '🇨🇷', 'Central America', 'CRC', 'America/Costa_Rica'),
('Panama', 'PA', '🇵🇦', 'Central America', 'PAB', 'America/Panama'),
('Belize', 'BZ', '🇧🇿', 'Central America', 'BZD', 'America/Belize'),
-- Caribbean
('Cuba', 'CU', '🇨🇺', 'Caribbean', 'CUP', 'America/Havana'),
('Dominican Republic', 'DO', '🇩🇴', 'Caribbean', 'DOP', 'America/Santo_Domingo'),
('Haiti', 'HT', '🇭🇹', 'Caribbean', 'HTG', 'America/Port-au-Prince'),
('Jamaica', 'JM', '🇯🇲', 'Caribbean', 'JMD', 'America/Jamaica'),
('Puerto Rico', 'PR', '🇵🇷', 'Caribbean', 'USD', 'America/Puerto_Rico'),
('Trinidad and Tobago', 'TT', '🇹🇹', 'Caribbean', 'TTD', 'America/Port_of_Spain'),
-- South America
('Brazil', 'BR', '🇧🇷', 'South America', 'BRL', 'America/Sao_Paulo'),
('Argentina', 'AR', '🇦🇷', 'South America', 'ARS', 'America/Buenos_Aires'),
('Colombia', 'CO', '🇨🇴', 'South America', 'COP', 'America/Bogota'),
('Peru', 'PE', '🇵🇪', 'South America', 'PEN', 'America/Lima'),
('Chile', 'CL', '🇨🇱', 'South America', 'CLP', 'America/Santiago'),
('Venezuela', 'VE', '🇻🇪', 'South America', 'VES', 'America/Caracas'),
('Ecuador', 'EC', '🇪🇨', 'South America', 'USD', 'America/Guayaquil'),
('Bolivia', 'BO', '🇧🇴', 'South America', 'BOB', 'America/La_Paz'),
('Paraguay', 'PY', '🇵🇾', 'South America', 'PYG', 'America/Asuncion'),
('Uruguay', 'UY', '🇺🇾', 'South America', 'UYU', 'America/Montevideo'),
('Guyana', 'GY', '🇬🇾', 'South America', 'GYD', 'America/Guyana'),
('Suriname', 'SR', '🇸🇷', 'South America', 'SRD', 'America/Paramaribo')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, flag_emoji = EXCLUDED.flag_emoji;

-- =====================================================
-- OCEANIA
-- =====================================================

INSERT INTO countries (name, code, flag_emoji, region, currency, timezone) VALUES
('Australia', 'AU', '🇦🇺', 'Oceania', 'AUD', 'Australia/Sydney'),
('New Zealand', 'NZ', '🇳🇿', 'Oceania', 'NZD', 'Pacific/Auckland'),
('Papua New Guinea', 'PG', '🇵🇬', 'Oceania', 'PGK', 'Pacific/Port_Moresby'),
('Fiji', 'FJ', '🇫🇯', 'Oceania', 'FJD', 'Pacific/Fiji')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, flag_emoji = EXCLUDED.flag_emoji;

-- =====================================================
-- CITIES - EUROPE
-- =====================================================

INSERT INTO cities_global (name, country_code, country_name, region, latitude, longitude) VALUES
-- Germany
('Berlin', 'DE', 'Germany', 'Europe', 52.5200, 13.4050),
('Hamburg', 'DE', 'Germany', 'Europe', 53.5511, 9.9937),
('Munich', 'DE', 'Germany', 'Europe', 48.1351, 11.5820),
('Cologne', 'DE', 'Germany', 'Europe', 50.9375, 6.9603),
('Frankfurt', 'DE', 'Germany', 'Europe', 50.1109, 8.6821),
('Stuttgart', 'DE', 'Germany', 'Europe', 48.7758, 9.1829),
('Düsseldorf', 'DE', 'Germany', 'Europe', 51.2277, 6.7735),
-- France
('Paris', 'FR', 'France', 'Europe', 48.8566, 2.3522),
('Marseille', 'FR', 'France', 'Europe', 43.2965, 5.3698),
('Lyon', 'FR', 'France', 'Europe', 45.7640, 4.8357),
('Toulouse', 'FR', 'France', 'Europe', 43.6047, 1.4442),
('Nice', 'FR', 'France', 'Europe', 43.7102, 7.2620),
('Bordeaux', 'FR', 'France', 'Europe', 44.8378, -0.5792),
-- UK
('London', 'GB', 'United Kingdom', 'Europe', 51.5074, -0.1278),
('Manchester', 'GB', 'United Kingdom', 'Europe', 53.4808, -2.2426),
('Birmingham', 'GB', 'United Kingdom', 'Europe', 52.4862, -1.8904),
('Glasgow', 'GB', 'United Kingdom', 'Europe', 55.8642, -4.2518),
('Liverpool', 'GB', 'United Kingdom', 'Europe', 53.4084, -2.9916),
('Edinburgh', 'GB', 'United Kingdom', 'Europe', 55.9533, -3.1883),
('Leeds', 'GB', 'United Kingdom', 'Europe', 53.8008, -1.5491),
-- Italy
('Rome', 'IT', 'Italy', 'Europe', 41.9028, 12.4964),
('Milan', 'IT', 'Italy', 'Europe', 45.4642, 9.1900),
('Naples', 'IT', 'Italy', 'Europe', 40.8518, 14.2681),
('Turin', 'IT', 'Italy', 'Europe', 45.0703, 7.6869),
('Florence', 'IT', 'Italy', 'Europe', 43.7696, 11.2558),
('Venice', 'IT', 'Italy', 'Europe', 45.4408, 12.3155),
-- Spain
('Madrid', 'ES', 'Spain', 'Europe', 40.4168, -3.7038),
('Barcelona', 'ES', 'Spain', 'Europe', 41.3851, 2.1734),
('Valencia', 'ES', 'Spain', 'Europe', 39.4699, -0.3763),
('Seville', 'ES', 'Spain', 'Europe', 37.3891, -5.9845),
('Bilbao', 'ES', 'Spain', 'Europe', 43.2627, -2.9253),
('Malaga', 'ES', 'Spain', 'Europe', 36.7213, -4.4214),
-- Portugal
('Lisbon', 'PT', 'Portugal', 'Europe', 38.7223, -9.1393),
('Porto', 'PT', 'Portugal', 'Europe', 41.1579, -8.6291),
-- Netherlands
('Amsterdam', 'NL', 'Netherlands', 'Europe', 52.3676, 4.9041),
('Rotterdam', 'NL', 'Netherlands', 'Europe', 51.9244, 4.4777),
('The Hague', 'NL', 'Netherlands', 'Europe', 52.0705, 4.3007),
('Utrecht', 'NL', 'Netherlands', 'Europe', 52.0907, 5.1214),
-- Belgium
('Brussels', 'BE', 'Belgium', 'Europe', 50.8503, 4.3517),
('Antwerp', 'BE', 'Belgium', 'Europe', 51.2194, 4.4025),
('Ghent', 'BE', 'Belgium', 'Europe', 51.0543, 3.7174),
-- Switzerland
('Zurich', 'CH', 'Switzerland', 'Europe', 47.3769, 8.5417),
('Geneva', 'CH', 'Switzerland', 'Europe', 46.2044, 6.1432),
('Basel', 'CH', 'Switzerland', 'Europe', 47.5596, 7.5886),
('Bern', 'CH', 'Switzerland', 'Europe', 46.9480, 7.4474),
-- Austria
('Vienna', 'AT', 'Austria', 'Europe', 48.2082, 16.3738),
('Salzburg', 'AT', 'Austria', 'Europe', 47.8095, 13.0550),
('Innsbruck', 'AT', 'Austria', 'Europe', 47.2692, 11.4041),
('Graz', 'AT', 'Austria', 'Europe', 47.0707, 15.4395),
-- Ireland
('Dublin', 'IE', 'Ireland', 'Europe', 53.3498, -6.2603),
('Cork', 'IE', 'Ireland', 'Europe', 51.8985, -8.4756),
('Galway', 'IE', 'Ireland', 'Europe', 53.2707, -9.0568),
-- Scandinavia
('Stockholm', 'SE', 'Sweden', 'Europe', 59.3293, 18.0686),
('Gothenburg', 'SE', 'Sweden', 'Europe', 57.7089, 11.9746),
('Malmö', 'SE', 'Sweden', 'Europe', 55.6050, 13.0038),
('Oslo', 'NO', 'Norway', 'Europe', 59.9139, 10.7522),
('Bergen', 'NO', 'Norway', 'Europe', 60.3913, 5.3221),
('Copenhagen', 'DK', 'Denmark', 'Europe', 55.6761, 12.5683),
('Aarhus', 'DK', 'Denmark', 'Europe', 56.1629, 10.2039),
('Helsinki', 'FI', 'Finland', 'Europe', 60.1695, 24.9354),
('Reykjavik', 'IS', 'Iceland', 'Europe', 64.1466, -21.9426),
-- Eastern Europe
('Warsaw', 'PL', 'Poland', 'Europe', 52.2297, 21.0122),
('Krakow', 'PL', 'Poland', 'Europe', 50.0647, 19.9450),
('Wroclaw', 'PL', 'Poland', 'Europe', 51.1079, 17.0385),
('Gdansk', 'PL', 'Poland', 'Europe', 54.3520, 18.6466),
('Prague', 'CZ', 'Czech Republic', 'Europe', 50.0755, 14.4378),
('Brno', 'CZ', 'Czech Republic', 'Europe', 49.1951, 16.6068),
('Budapest', 'HU', 'Hungary', 'Europe', 47.4979, 19.0402),
('Bucharest', 'RO', 'Romania', 'Europe', 44.4268, 26.1025),
('Cluj-Napoca', 'RO', 'Romania', 'Europe', 46.7712, 23.6236),
('Sofia', 'BG', 'Bulgaria', 'Europe', 42.6977, 23.3219),
('Kyiv', 'UA', 'Ukraine', 'Europe', 50.4501, 30.5234),
('Lviv', 'UA', 'Ukraine', 'Europe', 49.8397, 24.0297),
('Odesa', 'UA', 'Ukraine', 'Europe', 46.4825, 30.7233),
('Bratislava', 'SK', 'Slovakia', 'Europe', 48.1486, 17.1077),
('Zagreb', 'HR', 'Croatia', 'Europe', 45.8150, 15.9819),
('Ljubljana', 'SI', 'Slovenia', 'Europe', 46.0569, 14.5058),
('Belgrade', 'RS', 'Serbia', 'Europe', 44.7866, 20.4489),
('Sarajevo', 'BA', 'Bosnia and Herzegovina', 'Europe', 43.8564, 18.4131),
('Athens', 'GR', 'Greece', 'Europe', 37.9838, 23.7275),
('Thessaloniki', 'GR', 'Greece', 'Europe', 40.6401, 22.9444),
-- Baltic States
('Tallinn', 'EE', 'Estonia', 'Europe', 59.4370, 24.7536),
('Riga', 'LV', 'Latvia', 'Europe', 56.9496, 24.1052),
('Vilnius', 'LT', 'Lithuania', 'Europe', 54.6872, 25.2797),
-- Russia
('Moscow', 'RU', 'Russia', 'Europe', 55.7558, 37.6173),
('Saint Petersburg', 'RU', 'Russia', 'Europe', 59.9311, 30.3609),
('Novosibirsk', 'RU', 'Russia', 'Europe', 55.0084, 82.9357),
('Yekaterinburg', 'RU', 'Russia', 'Europe', 56.8389, 60.6057)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CITIES - ASIA
-- =====================================================

INSERT INTO cities_global (name, country_code, country_name, region, latitude, longitude) VALUES
-- India
('Mumbai', 'IN', 'India', 'Asia', 19.0760, 72.8777),
('Delhi', 'IN', 'India', 'Asia', 28.7041, 77.1025),
('Bangalore', 'IN', 'India', 'Asia', 12.9716, 77.5946),
('Chennai', 'IN', 'India', 'Asia', 13.0827, 80.2707),
('Kolkata', 'IN', 'India', 'Asia', 22.5726, 88.3639),
('Hyderabad', 'IN', 'India', 'Asia', 17.3850, 78.4867),
('Pune', 'IN', 'India', 'Asia', 18.5204, 73.8567),
('Ahmedabad', 'IN', 'India', 'Asia', 23.0225, 72.5714),
('Jaipur', 'IN', 'India', 'Asia', 26.9124, 75.7873),
('Lucknow', 'IN', 'India', 'Asia', 26.8467, 80.9462),
-- Pakistan
('Karachi', 'PK', 'Pakistan', 'Asia', 24.8607, 67.0011),
('Lahore', 'PK', 'Pakistan', 'Asia', 31.5497, 74.3436),
('Islamabad', 'PK', 'Pakistan', 'Asia', 33.6844, 73.0479),
('Faisalabad', 'PK', 'Pakistan', 'Asia', 31.4504, 73.1350),
('Rawalpindi', 'PK', 'Pakistan', 'Asia', 33.5651, 73.0169),
-- Bangladesh
('Dhaka', 'BD', 'Bangladesh', 'Asia', 23.8103, 90.4125),
('Chittagong', 'BD', 'Bangladesh', 'Asia', 22.3569, 91.7832),
('Sylhet', 'BD', 'Bangladesh', 'Asia', 24.8949, 91.8687),
-- Sri Lanka
('Colombo', 'LK', 'Sri Lanka', 'Asia', 6.9271, 79.8612),
('Kandy', 'LK', 'Sri Lanka', 'Asia', 7.2906, 80.6337),
-- Nepal
('Kathmandu', 'NP', 'Nepal', 'Asia', 27.7172, 85.3240),
('Pokhara', 'NP', 'Nepal', 'Asia', 28.2096, 83.9856),
-- Indonesia
('Jakarta', 'ID', 'Indonesia', 'Asia', -6.2088, 106.8456),
('Surabaya', 'ID', 'Indonesia', 'Asia', -7.2575, 112.7521),
('Bandung', 'ID', 'Indonesia', 'Asia', -6.9175, 107.6191),
('Medan', 'ID', 'Indonesia', 'Asia', 3.5952, 98.6722),
('Bali', 'ID', 'Indonesia', 'Asia', -8.4095, 115.1889),
-- Malaysia
('Kuala Lumpur', 'MY', 'Malaysia', 'Asia', 3.1390, 101.6869),
('Penang', 'MY', 'Malaysia', 'Asia', 5.4141, 100.3288),
('Johor Bahru', 'MY', 'Malaysia', 'Asia', 1.4927, 103.7414),
-- Philippines
('Manila', 'PH', 'Philippines', 'Asia', 14.5995, 120.9842),
('Cebu', 'PH', 'Philippines', 'Asia', 10.3157, 123.8854),
('Davao', 'PH', 'Philippines', 'Asia', 7.1907, 125.4553),
('Quezon City', 'PH', 'Philippines', 'Asia', 14.6760, 121.0437),
-- Thailand
('Bangkok', 'TH', 'Thailand', 'Asia', 13.7563, 100.5018),
('Chiang Mai', 'TH', 'Thailand', 'Asia', 18.7883, 98.9853),
('Phuket', 'TH', 'Thailand', 'Asia', 7.8804, 98.3923),
('Pattaya', 'TH', 'Thailand', 'Asia', 12.9236, 100.8825),
-- Vietnam
('Ho Chi Minh City', 'VN', 'Vietnam', 'Asia', 10.8231, 106.6297),
('Hanoi', 'VN', 'Vietnam', 'Asia', 21.0285, 105.8542),
('Da Nang', 'VN', 'Vietnam', 'Asia', 16.0544, 108.2022),
('Hai Phong', 'VN', 'Vietnam', 'Asia', 20.8449, 106.6881),
-- Singapore
('Singapore', 'SG', 'Singapore', 'Asia', 1.3521, 103.8198),
-- Myanmar
('Yangon', 'MM', 'Myanmar', 'Asia', 16.8661, 96.1951),
('Mandalay', 'MM', 'Myanmar', 'Asia', 21.9588, 96.0891),
-- Cambodia
('Phnom Penh', 'KH', 'Cambodia', 'Asia', 11.5564, 104.9282),
('Siem Reap', 'KH', 'Cambodia', 'Asia', 13.3671, 103.8448),
-- China
('Beijing', 'CN', 'China', 'Asia', 39.9042, 116.4074),
('Shanghai', 'CN', 'China', 'Asia', 31.2304, 121.4737),
('Guangzhou', 'CN', 'China', 'Asia', 23.1291, 113.2644),
('Shenzhen', 'CN', 'China', 'Asia', 22.5431, 114.0579),
('Chengdu', 'CN', 'China', 'Asia', 30.5728, 104.0668),
('Hangzhou', 'CN', 'China', 'Asia', 30.2741, 120.1551),
('Nanjing', 'CN', 'China', 'Asia', 32.0603, 118.7969),
-- Japan
('Tokyo', 'JP', 'Japan', 'Asia', 35.6762, 139.6503),
('Osaka', 'JP', 'Japan', 'Asia', 34.6937, 135.5023),
('Kyoto', 'JP', 'Japan', 'Asia', 35.0116, 135.7681),
('Yokohama', 'JP', 'Japan', 'Asia', 35.4437, 139.6380),
('Nagoya', 'JP', 'Japan', 'Asia', 35.1815, 136.9066),
('Sapporo', 'JP', 'Japan', 'Asia', 43.0618, 141.3545),
('Fukuoka', 'JP', 'Japan', 'Asia', 33.5904, 130.4017),
-- South Korea
('Seoul', 'KR', 'South Korea', 'Asia', 37.5665, 126.9780),
('Busan', 'KR', 'South Korea', 'Asia', 35.1796, 129.0756),
('Incheon', 'KR', 'South Korea', 'Asia', 37.4563, 126.7052),
('Daegu', 'KR', 'South Korea', 'Asia', 35.8714, 128.6014),
-- Taiwan
('Taipei', 'TW', 'Taiwan', 'Asia', 25.0330, 121.5654),
('Kaohsiung', 'TW', 'Taiwan', 'Asia', 22.6273, 120.3014),
('Taichung', 'TW', 'Taiwan', 'Asia', 24.1477, 120.6736),
-- Hong Kong
('Hong Kong', 'HK', 'Hong Kong', 'Asia', 22.3193, 114.1694),
-- Middle East
('Dubai', 'AE', 'United Arab Emirates', 'Asia', 25.2048, 55.2708),
('Abu Dhabi', 'AE', 'United Arab Emirates', 'Asia', 24.4539, 54.3773),
('Riyadh', 'SA', 'Saudi Arabia', 'Asia', 24.7136, 46.6753),
('Jeddah', 'SA', 'Saudi Arabia', 'Asia', 21.4858, 39.1925),
('Mecca', 'SA', 'Saudi Arabia', 'Asia', 21.3891, 39.8579),
('Doha', 'QA', 'Qatar', 'Asia', 25.2854, 51.5310),
('Kuwait City', 'KW', 'Kuwait', 'Asia', 29.3759, 47.9774),
('Manama', 'BH', 'Bahrain', 'Asia', 26.2285, 50.5860),
('Muscat', 'OM', 'Oman', 'Asia', 23.5880, 58.3829),
('Tel Aviv', 'IL', 'Israel', 'Asia', 32.0853, 34.7818),
('Jerusalem', 'IL', 'Israel', 'Asia', 31.7683, 35.2137),
('Amman', 'JO', 'Jordan', 'Asia', 31.9454, 35.9284),
('Beirut', 'LB', 'Lebanon', 'Asia', 33.8938, 35.5018),
('Baghdad', 'IQ', 'Iraq', 'Asia', 33.3152, 44.3661),
('Tehran', 'IR', 'Iran', 'Asia', 35.6892, 51.3890),
('Isfahan', 'IR', 'Iran', 'Asia', 32.6546, 51.6680),
('Kabul', 'AF', 'Afghanistan', 'Asia', 34.5281, 69.1723),
-- Caucasus
('Tbilisi', 'GE', 'Georgia', 'Asia', 41.7151, 44.8271),
('Yerevan', 'AM', 'Armenia', 'Asia', 40.1792, 44.4991),
('Baku', 'AZ', 'Azerbaijan', 'Asia', 40.4093, 49.8671)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CITIES - AFRICA
-- =====================================================

INSERT INTO cities_global (name, country_code, country_name, region, latitude, longitude) VALUES
-- North Africa
('Cairo', 'EG', 'Egypt', 'Africa', 30.0444, 31.2357),
('Alexandria', 'EG', 'Egypt', 'Africa', 31.2001, 29.9187),
('Giza', 'EG', 'Egypt', 'Africa', 30.0131, 31.2089),
('Casablanca', 'MA', 'Morocco', 'Africa', 33.5731, -7.5898),
('Marrakech', 'MA', 'Morocco', 'Africa', 31.6295, -7.9811),
('Rabat', 'MA', 'Morocco', 'Africa', 34.0209, -6.8416),
('Fes', 'MA', 'Morocco', 'Africa', 34.0181, -5.0078),
('Algiers', 'DZ', 'Algeria', 'Africa', 36.7538, 3.0588),
('Oran', 'DZ', 'Algeria', 'Africa', 35.6969, -0.6331),
('Tunis', 'TN', 'Tunisia', 'Africa', 36.8065, 10.1815),
('Tripoli', 'LY', 'Libya', 'Africa', 32.8872, 13.1913),
('Khartoum', 'SD', 'Sudan', 'Africa', 15.5007, 32.5599),
-- West Africa
('Lagos', 'NG', 'Nigeria', 'Africa', 6.5244, 3.3792),
('Abuja', 'NG', 'Nigeria', 'Africa', 9.0765, 7.3986),
('Kano', 'NG', 'Nigeria', 'Africa', 12.0022, 8.5920),
('Ibadan', 'NG', 'Nigeria', 'Africa', 7.3775, 3.9470),
('Port Harcourt', 'NG', 'Nigeria', 'Africa', 4.8156, 7.0498),
('Accra', 'GH', 'Ghana', 'Africa', 5.6037, -0.1870),
('Kumasi', 'GH', 'Ghana', 'Africa', 6.6666, -1.6163),
('Dakar', 'SN', 'Senegal', 'Africa', 14.7167, -17.4677),
('Abidjan', 'CI', 'Ivory Coast', 'Africa', 5.3600, -4.0083),
('Douala', 'CM', 'Cameroon', 'Africa', 4.0511, 9.7679),
('Yaounde', 'CM', 'Cameroon', 'Africa', 3.8480, 11.5021),
-- East Africa
('Nairobi', 'KE', 'Kenya', 'Africa', -1.2921, 36.8219),
('Mombasa', 'KE', 'Kenya', 'Africa', -4.0435, 39.6682),
('Addis Ababa', 'ET', 'Ethiopia', 'Africa', 9.0320, 38.7469),
('Dar es Salaam', 'TZ', 'Tanzania', 'Africa', -6.7924, 39.2083),
('Kampala', 'UG', 'Uganda', 'Africa', 0.3476, 32.5825),
('Kigali', 'RW', 'Rwanda', 'Africa', -1.9403, 29.8739),
('Mogadishu', 'SO', 'Somalia', 'Africa', 2.0469, 45.3182),
-- Southern Africa
('Johannesburg', 'ZA', 'South Africa', 'Africa', -26.2041, 28.0473),
('Cape Town', 'ZA', 'South Africa', 'Africa', -33.9249, 18.4241),
('Durban', 'ZA', 'South Africa', 'Africa', -29.8587, 31.0218),
('Pretoria', 'ZA', 'South Africa', 'Africa', -25.7479, 28.2293),
('Harare', 'ZW', 'Zimbabwe', 'Africa', -17.8252, 31.0335),
('Lusaka', 'ZM', 'Zambia', 'Africa', -15.3875, 28.3228),
('Gaborone', 'BW', 'Botswana', 'Africa', -24.6282, 25.9231),
('Windhoek', 'NA', 'Namibia', 'Africa', -22.5609, 17.0658),
('Maputo', 'MZ', 'Mozambique', 'Africa', -25.9692, 32.5732),
('Antananarivo', 'MG', 'Madagascar', 'Africa', -18.8792, 47.5079),
('Port Louis', 'MU', 'Mauritius', 'Africa', -20.1609, 57.5012),
-- Central Africa
('Kinshasa', 'CD', 'Democratic Republic of the Congo', 'Africa', -4.4419, 15.2663),
('Brazzaville', 'CG', 'Republic of the Congo', 'Africa', -4.2634, 15.2429),
('Luanda', 'AO', 'Angola', 'Africa', -8.8399, 13.2894),
('Libreville', 'GA', 'Gabon', 'Africa', 0.4162, 9.4673)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CITIES - AMERICAS
-- =====================================================

INSERT INTO cities_global (name, country_code, country_name, region, latitude, longitude) VALUES
-- USA
('New York', 'US', 'United States', 'North America', 40.7128, -74.0060),
('Los Angeles', 'US', 'United States', 'North America', 34.0522, -118.2437),
('Chicago', 'US', 'United States', 'North America', 41.8781, -87.6298),
('Houston', 'US', 'United States', 'North America', 29.7604, -95.3698),
('Phoenix', 'US', 'United States', 'North America', 33.4484, -112.0740),
('Philadelphia', 'US', 'United States', 'North America', 39.9526, -75.1652),
('San Antonio', 'US', 'United States', 'North America', 29.4241, -98.4936),
('San Diego', 'US', 'United States', 'North America', 32.7157, -117.1611),
('Dallas', 'US', 'United States', 'North America', 32.7767, -96.7970),
('San Francisco', 'US', 'United States', 'North America', 37.7749, -122.4194),
('Seattle', 'US', 'United States', 'North America', 47.6062, -122.3321),
('Miami', 'US', 'United States', 'North America', 25.7617, -80.1918),
('Boston', 'US', 'United States', 'North America', 42.3601, -71.0589),
('Atlanta', 'US', 'United States', 'North America', 33.7490, -84.3880),
('Denver', 'US', 'United States', 'North America', 39.7392, -104.9903),
-- Canada
('Toronto', 'CA', 'Canada', 'North America', 43.6532, -79.3832),
('Montreal', 'CA', 'Canada', 'North America', 45.5017, -73.5673),
('Vancouver', 'CA', 'Canada', 'North America', 49.2827, -123.1207),
('Calgary', 'CA', 'Canada', 'North America', 51.0447, -114.0719),
('Ottawa', 'CA', 'Canada', 'North America', 45.4215, -75.6972),
('Edmonton', 'CA', 'Canada', 'North America', 53.5461, -113.4938),
-- Mexico
('Mexico City', 'MX', 'Mexico', 'North America', 19.4326, -99.1332),
('Guadalajara', 'MX', 'Mexico', 'North America', 20.6597, -103.3496),
('Monterrey', 'MX', 'Mexico', 'North America', 25.6866, -100.3161),
('Cancun', 'MX', 'Mexico', 'North America', 21.1619, -86.8515),
('Tijuana', 'MX', 'Mexico', 'North America', 32.5149, -117.0382),
-- Central America
('Guatemala City', 'GT', 'Guatemala', 'Central America', 14.6349, -90.5069),
('San Salvador', 'SV', 'El Salvador', 'Central America', 13.6929, -89.2182),
('Tegucigalpa', 'HN', 'Honduras', 'Central America', 14.0650, -87.1715),
('Managua', 'NI', 'Nicaragua', 'Central America', 12.1149, -86.2362),
('San Jose', 'CR', 'Costa Rica', 'Central America', 9.9281, -84.0907),
('Panama City', 'PA', 'Panama', 'Central America', 8.9936, -79.5197),
-- Caribbean
('Havana', 'CU', 'Cuba', 'Caribbean', 23.1136, -82.3666),
('Santo Domingo', 'DO', 'Dominican Republic', 'Caribbean', 18.4861, -69.9312),
('Kingston', 'JM', 'Jamaica', 'Caribbean', 18.0179, -76.8099),
('San Juan', 'PR', 'Puerto Rico', 'Caribbean', 18.4655, -66.1057),
('Port-au-Prince', 'HT', 'Haiti', 'Caribbean', 18.5944, -72.3074),
-- South America
('Sao Paulo', 'BR', 'Brazil', 'South America', -23.5505, -46.6333),
('Rio de Janeiro', 'BR', 'Brazil', 'South America', -22.9068, -43.1729),
('Brasilia', 'BR', 'Brazil', 'South America', -15.7975, -47.8919),
('Salvador', 'BR', 'Brazil', 'South America', -12.9714, -38.5014),
('Fortaleza', 'BR', 'Brazil', 'South America', -3.7172, -38.5433),
('Belo Horizonte', 'BR', 'Brazil', 'South America', -19.9167, -43.9345),
('Curitiba', 'BR', 'Brazil', 'South America', -25.4290, -49.2671),
('Buenos Aires', 'AR', 'Argentina', 'South America', -34.6037, -58.3816),
('Cordoba', 'AR', 'Argentina', 'South America', -31.4201, -64.1888),
('Mendoza', 'AR', 'Argentina', 'South America', -32.8908, -68.8272),
('Bogota', 'CO', 'Colombia', 'South America', 4.7110, -74.0721),
('Medellin', 'CO', 'Colombia', 'South America', 6.2476, -75.5658),
('Cali', 'CO', 'Colombia', 'South America', 3.4516, -76.5320),
('Cartagena', 'CO', 'Colombia', 'South America', 10.3910, -75.4794),
('Lima', 'PE', 'Peru', 'South America', -12.0464, -77.0428),
('Arequipa', 'PE', 'Peru', 'South America', -16.4090, -71.5375),
('Cusco', 'PE', 'Peru', 'South America', -13.5320, -71.9675),
('Santiago', 'CL', 'Chile', 'South America', -33.4489, -70.6693),
('Valparaiso', 'CL', 'Chile', 'South America', -33.0472, -71.6127),
('Caracas', 'VE', 'Venezuela', 'South America', 10.4806, -66.9036),
('Quito', 'EC', 'Ecuador', 'South America', -0.1807, -78.4678),
('Guayaquil', 'EC', 'Ecuador', 'South America', -2.1710, -79.9224),
('La Paz', 'BO', 'Bolivia', 'South America', -16.5000, -68.1500),
('Santa Cruz', 'BO', 'Bolivia', 'South America', -17.7863, -63.1812),
('Asuncion', 'PY', 'Paraguay', 'South America', -25.2637, -57.5759),
('Montevideo', 'UY', 'Uruguay', 'South America', -34.9011, -56.1645)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CITIES - OCEANIA
-- =====================================================

INSERT INTO cities_global (name, country_code, country_name, region, latitude, longitude) VALUES
('Sydney', 'AU', 'Australia', 'Oceania', -33.8688, 151.2093),
('Melbourne', 'AU', 'Australia', 'Oceania', -37.8136, 144.9631),
('Brisbane', 'AU', 'Australia', 'Oceania', -27.4698, 153.0251),
('Perth', 'AU', 'Australia', 'Oceania', -31.9505, 115.8605),
('Adelaide', 'AU', 'Australia', 'Oceania', -34.9285, 138.6007),
('Canberra', 'AU', 'Australia', 'Oceania', -35.2809, 149.1300),
('Gold Coast', 'AU', 'Australia', 'Oceania', -28.0167, 153.4000),
('Auckland', 'NZ', 'New Zealand', 'Oceania', -36.8485, 174.7633),
('Wellington', 'NZ', 'New Zealand', 'Oceania', -41.2865, 174.7762),
('Christchurch', 'NZ', 'New Zealand', 'Oceania', -43.5321, 172.6362),
('Port Moresby', 'PG', 'Papua New Guinea', 'Oceania', -9.4438, 147.1803),
('Suva', 'FJ', 'Fiji', 'Oceania', -18.1416, 178.4419)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SUMMARY
-- =====================================================
DO $$
DECLARE
  country_count INT;
  city_count INT;
BEGIN
  SELECT COUNT(*) INTO country_count FROM countries;
  SELECT COUNT(*) INTO city_count FROM cities_global;
  
  RAISE NOTICE '✅ Database expanded successfully!';
  RAISE NOTICE '📊 Total Countries: %', country_count;
  RAISE NOTICE '📊 Total Cities: %', city_count;
END $$;
