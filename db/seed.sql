-- AnyamanRasa development seed data.
-- Safe to re-run on the dev database: truncates every app table first, then inserts.
-- Credentials live in Supabase Auth: run `npm run auth:demo-users` to create these accounts
-- there (password "rahasia123"). They link to these rows by email on first sign-in.
--
-- Literal UUID scheme (last group):
--   users        1000000000NN
--   ingredients  2000000000NN
--   recipes      3000000000NN

begin;

truncate table node_relations, saved_recipes, pantry_items, recipe_categories, recipe_ingredients, categories, recipes, ingredients, user_roles, roles, users restart identity cascade;

-- Roles ---------------------------------------------------------------------
insert into roles (id, name) values (1, 'member'), (2, 'admin');

-- Users ---------------------------------------------------------------------
insert into users (id, name, username, email, avatar_url, bio, location, created_at, updated_at) values
  ('00000000-0000-4000-8000-100000000001', 'Sari Wulandari', 'sariwulandari', 'sari.wulandari@email.com',
   'https://images.unsplash.com/photo-1758874960868-eebf9d36d5d5?w=1080&q=80&auto=format&fit=crop',
   'Guru SD yang suka memasak masakan rumahan Jawa. Menulis resep yang bisa dibuat dengan bahan dari pasar dekat rumah.',
   'Yogyakarta', '2025-03-14 09:20:00+07', '2025-03-14 09:20:00+07'),
  ('00000000-0000-4000-8000-100000000002', 'Bagus Santoso', 'bagussantoso', 'bagus.santoso@email.com',
   null,
   'Penggemar nasi goreng dari berbagai daerah. Setiap akhir pekan mencoba satu versi baru di dapur kontrakan.',
   'Semarang', '2025-02-03 19:45:00+07', '2025-02-03 19:45:00+07'),
  ('00000000-0000-4000-8000-100000000003', 'Rina Hapsari', 'rinahapsari', 'rina.hapsari@email.com',
   null,
   'Ibu dua anak yang hobi memasak masakan berkuah. Resep soto keluarga diwariskan dari nenek di Lamongan.',
   'Surabaya', '2025-01-21 08:10:00+07', '2025-01-21 08:10:00+07'),
  ('00000000-0000-4000-8000-100000000004', 'Dimas Pratama', 'dimaspratama', 'dimas.pratama@email.com',
   null,
   'Belajar memasak rendang dari ibu sejak kecil. Senang berbagi masakan Minang yang dimasak pelan-pelan.',
   'Padang', '2025-04-02 13:30:00+07', '2025-04-02 13:30:00+07'),
  ('00000000-0000-4000-8000-100000000005', 'Fajar Nugroho', 'fajarnugroho', 'fajar.nugroho@email.com',
   null,
   'Pekerja kantoran yang memasak untuk bekal. Suka resep cepat dengan bumbu kecap dan bakaran.',
   'Solo', '2025-05-11 20:05:00+07', '2025-05-11 20:05:00+07'),
  ('00000000-0000-4000-8000-100000000006', 'Wulan Pertiwi', 'wulanpertiwi', 'wulan.pertiwi@email.com',
   null,
   'Suka sayur dan sambal kacang. Menulis resep sayuran yang segar dan tidak ribet.',
   'Bandung', '2025-06-08 10:40:00+07', '2025-06-08 10:40:00+07'),
  ('00000000-0000-4000-8000-100000000007', 'Hendra Wijaya', 'hendrawijaya', 'hendra.wijaya@email.com',
   null,
   'Mantan juru masak warung tenda. Tumisan api besar adalah keahlian utama.',
   'Jakarta', '2025-03-29 16:15:00+07', '2025-03-29 16:15:00+07'),
  ('00000000-0000-4000-8000-100000000008', 'Dewi Anggraini', 'dewianggraini', 'dewi.anggraini@email.com',
   'https://images.unsplash.com/photo-1785631906167-514ab0e86fc4?w=1080&q=80&auto=format&fit=crop',
   'Mahasiswi rantau yang memasak dengan bahan seadanya di kos. Telur selalu ada di rak dapur.',
   'Malang', '2025-08-17 07:55:00+07', '2025-08-17 07:55:00+07'),
  ('00000000-0000-4000-8000-100000000009', 'Ayu Lestari', 'ayulestari', 'ayu.lestari@email.com',
   null,
   'Tinggal di Bali dan suka mengolah hasil laut. Senang memadukan masakan Jawa dengan rasa pesisir.',
   'Denpasar', '2025-07-02 18:25:00+07', '2025-07-02 18:25:00+07'),
  ('00000000-0000-4000-8000-100000000010', 'Andi Darmawan', 'admin', 'admin@anyamanrasa.id',
   null,
   'Moderator AnyamanRasa. Menjaga resep dan hubungan antarresep tetap rapi.',
   'Jakarta', '2025-01-05 09:00:00+07', '2025-01-05 09:00:00+07');

insert into user_roles (user_id, role_id) values
  ('00000000-0000-4000-8000-100000000001', 1),
  ('00000000-0000-4000-8000-100000000002', 1),
  ('00000000-0000-4000-8000-100000000003', 1),
  ('00000000-0000-4000-8000-100000000004', 1),
  ('00000000-0000-4000-8000-100000000005', 1),
  ('00000000-0000-4000-8000-100000000006', 1),
  ('00000000-0000-4000-8000-100000000007', 1),
  ('00000000-0000-4000-8000-100000000008', 1),
  ('00000000-0000-4000-8000-100000000009', 1),
  ('00000000-0000-4000-8000-100000000010', 1),
  ('00000000-0000-4000-8000-100000000010', 2);

-- Categories: main categories first, then dish types, so "order by id" yields "Nasi · Hidangan Utama".
insert into categories (id, name) values
  (1, 'Nasi'),
  (2, 'Sup'),
  (3, 'Daging'),
  (4, 'Ayam'),
  (5, 'Sayur'),
  (6, 'Mie'),
  (7, 'Telur'),
  (8, 'Kedelai'),
  (9, 'Sambal'),
  (10, 'Seafood'),
  (11, 'Hidangan Utama'),
  (12, 'Berkuah'),
  (13, 'Bakaran'),
  (14, 'Salad'),
  (15, 'Tumisan'),
  (16, 'Sarapan'),
  (17, 'Lauk'),
  (18, 'Pelengkap');
select setval(pg_get_serial_sequence('categories', 'id'), (select max(id) from categories));

-- Ingredients ---------------------------------------------------------------
insert into ingredients (id, name, description, image_url) values
  ('00000000-0000-4000-8000-200000000001', 'Telur',
   'Telur ayam adalah bahan paling serbaguna di dapur Indonesia, dari telur dadar sederhana hingga pengikat adonan dan pelengkap nasi goreng. Kaya protein dan mudah diolah dalam hitungan menit.',
   'https://images.unsplash.com/photo-1612544409798-799ab134af91?w=1080&q=80&auto=format&fit=crop'),
  ('00000000-0000-4000-8000-200000000002', 'Nasi Putih',
   'Makanan pokok sehari-hari dari beras yang ditanak. Untuk nasi goreng, pakai nasi dingin atau sisa semalam agar tidak lembek.',
   null),
  ('00000000-0000-4000-8000-200000000003', 'Bawang Merah',
   'Bumbu dasar hampir semua masakan Nusantara. Memberi aroma manis dan gurih saat ditumis, dihaluskan, atau digoreng.',
   null),
  ('00000000-0000-4000-8000-200000000004', 'Bawang Putih',
   'Bumbu beraroma tajam yang menjadi dasar tumisan dan bumbu halus. Mudah gosong, jadi tumis dengan api sedang.',
   null),
  ('00000000-0000-4000-8000-200000000005', 'Cabai Merah',
   'Cabai besar yang memberi warna merah dan pedas sedang. Buang bijinya jika ingin rasa lebih ringan.',
   'https://images.unsplash.com/photo-1634384994932-161d1919dd8a?w=1080&q=80&auto=format&fit=crop'),
  ('00000000-0000-4000-8000-200000000006', 'Cabai Rawit',
   'Cabai kecil dengan rasa sangat pedas. Beberapa buah saja sudah cukup untuk menaikkan tingkat pedas masakan.',
   null),
  ('00000000-0000-4000-8000-200000000007', 'Kecap Manis',
   'Kecap kental dari kedelai hitam dan gula aren. Memberi rasa manis, warna gelap, dan aroma karamel.',
   null),
  ('00000000-0000-4000-8000-200000000008', 'Kecap Asin',
   'Kecap encer bercita rasa asin dan gurih. Cocok untuk tumisan, marinasi, dan masakan bergaya Tionghoa-Indonesia.',
   null),
  ('00000000-0000-4000-8000-200000000009', 'Gula Merah',
   'Gula dari nira aren atau kelapa yang dijual dalam bentuk cetakan. Sisir halus sebelum dipakai agar cepat larut.',
   null),
  ('00000000-0000-4000-8000-200000000010', 'Garam',
   'Penyeimbang rasa utama di setiap masakan. Tambahkan sedikit demi sedikit sambil dicicipi.',
   null),
  ('00000000-0000-4000-8000-200000000011', 'Minyak Goreng',
   'Minyak sawit atau kelapa untuk menumis dan menggoreng. Panaskan hingga cukup panas sebelum bahan dimasukkan.',
   null),
  ('00000000-0000-4000-8000-200000000012', 'Daun Bawang',
   'Batang dan daun hijau beraroma segar. Diiris tipis untuk taburan atau ditumis sebentar di akhir memasak.',
   null),
  ('00000000-0000-4000-8000-200000000013', 'Kemiri',
   'Biji berminyak yang membuat bumbu halus lebih gurih dan kental. Sangrai dulu sebelum dihaluskan.',
   null),
  ('00000000-0000-4000-8000-200000000014', 'Kacang Mete',
   'Kacang bertekstur lembut dan gurih. Bisa menggantikan kemiri untuk mengentalkan bumbu.',
   null),
  ('00000000-0000-4000-8000-200000000015', 'Udang',
   'Hasil laut yang cepat matang dan manis. Kupas, buang kotoran di punggungnya, lalu masak sebentar saja agar tidak alot.',
   null),
  ('00000000-0000-4000-8000-200000000016', 'Cumi',
   'Cumi-cumi segar berdaging kenyal. Masak dengan api besar dalam waktu singkat supaya tetap empuk.',
   null),
  ('00000000-0000-4000-8000-200000000017', 'Ayam',
   'Daging ayam yang mudah didapat dan cocok untuk digoreng, dibakar, atau dimasak berkuah. Bagian paha lebih juicy dibanding dada.',
   null),
  ('00000000-0000-4000-8000-200000000018', 'Daging Sapi',
   'Daging sapi bagian has atau sandung lamur untuk masakan yang dimasak lama. Potong melawan serat agar empuk.',
   null),
  ('00000000-0000-4000-8000-200000000019', 'Mie Telur',
   'Mie basah atau setengah kering berbahan tepung dan telur. Rebus sebentar lalu tiriskan sebelum digoreng.',
   null),
  ('00000000-0000-4000-8000-200000000020', 'Mie Kering',
   'Mie kering kemasan yang tahan lama. Rebus sedikit lebih lama hingga lentur sebelum ditumis.',
   null),
  ('00000000-0000-4000-8000-200000000021', 'Bawang Bombay',
   'Bawang berukuran besar dengan rasa manis lembut. Enak untuk tumisan dan semur.',
   null),
  ('00000000-0000-4000-8000-200000000022', 'Saus Tiram',
   'Saus kental berbahan ekstrak tiram yang gurih dan sedikit manis. Andalan tumisan sayur dan seafood.',
   null),
  ('00000000-0000-4000-8000-200000000023', 'Kol',
   'Kubis berdaun renyah yang manis saat ditumis. Iris tipis untuk nasi goreng, soto, atau capcay.',
   null),
  ('00000000-0000-4000-8000-200000000024', 'Wortel',
   'Sayur umbi berwarna oranye yang manis dan renyah. Potong tipis agar cepat matang.',
   null),
  ('00000000-0000-4000-8000-200000000025', 'Tomat',
   'Buah berair yang memberi rasa asam segar dan warna pada sambal maupun kuah.',
   null),
  ('00000000-0000-4000-8000-200000000026', 'Timun',
   'Sayur segar berair yang biasa dimakan mentah sebagai lalapan atau acar.',
   null),
  ('00000000-0000-4000-8000-200000000027', 'Santan',
   'Perasan kelapa parut yang membuat kuah gurih dan creamy. Aduk terus saat dimasak agar tidak pecah.',
   null),
  ('00000000-0000-4000-8000-200000000028', 'Serai',
   'Batang beraroma lemon untuk kuah dan tumisan. Memarkan bagian putihnya sebelum dimasukkan.',
   null),
  ('00000000-0000-4000-8000-200000000029', 'Lengkuas',
   'Rimpang beraroma segar dan sedikit pedas. Biasanya dimemarkan dan dimasak bersama kuah atau bumbu ungkep.',
   null),
  ('00000000-0000-4000-8000-200000000030', 'Jahe',
   'Rimpang hangat dan pedas yang menghilangkan bau amis daging dan ikan.',
   null),
  ('00000000-0000-4000-8000-200000000031', 'Kunyit',
   'Rimpang berwarna kuning cerah yang memberi warna dan aroma tanah pada soto, opor, dan bumbu kuning.',
   'https://images.unsplash.com/photo-1781773338964-bc0e969d2973?w=1080&q=80&auto=format&fit=crop'),
  ('00000000-0000-4000-8000-200000000032', 'Daun Salam',
   'Daun aromatik khas Indonesia untuk kuah dan nasi. Masukkan utuh dan buang sebelum disajikan.',
   null),
  ('00000000-0000-4000-8000-200000000033', 'Daun Jeruk',
   'Daun jeruk purut beraroma segar. Buang tulang daunnya lalu iris halus untuk sambal atau tumisan.',
   null),
  ('00000000-0000-4000-8000-200000000034', 'Tahu',
   'Olahan kedelai bertekstur lembut dan rendah lemak. Bisa digoreng, dibacem, atau dihancurkan sebagai isian.',
   'https://images.unsplash.com/photo-1727403851978-46fd1fd82d9d?w=1080&q=80&auto=format&fit=crop'),
  ('00000000-0000-4000-8000-200000000035', 'Tempe',
   'Kedelai fermentasi yang padat dan kaya protein. Potong tipis agar renyah saat digoreng.',
   null),
  ('00000000-0000-4000-8000-200000000036', 'Kacang Tanah',
   'Kacang gurih yang digoreng atau disangrai lalu dihaluskan untuk bumbu kacang.',
   null),
  ('00000000-0000-4000-8000-200000000037', 'Tauge',
   'Kecambah kacang hijau yang renyah. Seduh air panas sebentar saja agar tetap segar.',
   null),
  ('00000000-0000-4000-8000-200000000038', 'Kangkung',
   'Sayur hijau berbatang berongga yang cepat layu. Tumis dengan api besar dalam waktu singkat.',
   null),
  ('00000000-0000-4000-8000-200000000039', 'Pisang',
   'Buah manis yang bisa dilumatkan sebagai pengganti telur dalam kue dan pancake.',
   null),
  ('00000000-0000-4000-8000-200000000040', 'Tepung Terigu',
   'Tepung serbaguna untuk adonan gorengan, kue, dan pengental kuah.',
   null),
  ('00000000-0000-4000-8000-200000000041', 'Biji Rami',
   'Biji flax yang bila dihaluskan dan dicampur air menjadi gel pengikat, pengganti telur untuk adonan.',
   null),
  ('00000000-0000-4000-8000-200000000042', 'Gula Pasir',
   'Gula putih untuk menyeimbangkan rasa asin dan asam masakan.',
   null),
  ('00000000-0000-4000-8000-200000000043', 'Merica',
   'Lada putih atau hitam yang memberi rasa hangat dan pedas ringan. Lebih harum bila digiling sesaat sebelum dipakai.',
   null),
  ('00000000-0000-4000-8000-200000000044', 'Ketumbar',
   'Biji rempah beraroma hangat dan sedikit citrus. Sangrai sebentar sebelum dihaluskan.',
   'https://images.unsplash.com/photo-1680359870544-b1d04cee6211?w=1080&q=80&auto=format&fit=crop'),
  ('00000000-0000-4000-8000-200000000045', 'Jeruk Nipis',
   'Jeruk kecil yang asam segar untuk soto, sambal, dan menghilangkan bau amis.',
   null),
  ('00000000-0000-4000-8000-200000000046', 'Kentang',
   'Umbi bertepung yang mengenyangkan. Cocok untuk perkedel, sup, dan pelengkap gado-gado.',
   null),
  ('00000000-0000-4000-8000-200000000047', 'Labu Siam',
   'Sayur berair yang renyah dan ringan rasanya. Kupas lalu potong dadu untuk sayur berkuah.',
   null),
  ('00000000-0000-4000-8000-200000000048', 'Buncis',
   'Polong hijau yang renyah. Potong serong dan masak sebentar agar warnanya tetap cerah.',
   'https://images.unsplash.com/photo-1788603913464-cc204d311c13?w=1080&q=80&auto=format&fit=crop'),
  ('00000000-0000-4000-8000-200000000049', 'Kacang Panjang',
   'Polong panjang yang renyah, biasa dipotong-potong untuk sayur asem, gado-gado, dan tumisan.',
   null),
  ('00000000-0000-4000-8000-200000000050', 'Petai',
   'Polong beraroma kuat yang disukai di banyak daerah. Enak ditumis bersama sambal atau nasi goreng.',
   null),
  ('00000000-0000-4000-8000-200000000051', 'Terasi',
   'Pasta udang fermentasi yang memberi rasa gurih mendalam. Bakar atau sangrai sebentar sebelum diulek.',
   null),
  ('00000000-0000-4000-8000-200000000052', 'Sawi Hijau',
   'Sayur berdaun hijau yang lembut. Masukkan di akhir agar tetap renyah.',
   null),
  ('00000000-0000-4000-8000-200000000053', 'Asam Jawa',
   'Daging buah asam yang memberi rasa asam segar pada sayur asem dan bumbu bacem.',
   null),
  ('00000000-0000-4000-8000-200000000054', 'Jagung',
   'Jagung manis yang dipotong-potong untuk sayur berkuah atau dipipil untuk bakwan.',
   null),
  ('00000000-0000-4000-8000-200000000055', 'Melinjo',
   'Biji dan daun melinjo, ciri khas sayur asem. Rasanya gurih sedikit pahit.',
   null),
  ('00000000-0000-4000-8000-200000000056', 'Kerupuk',
   'Pelengkap renyah untuk nasi goreng, gado-gado, dan soto.',
   null),
  ('00000000-0000-4000-8000-200000000057', 'Bawang Goreng',
   'Irisan bawang merah yang digoreng kering. Taburan wangi untuk soto, nasi uduk, dan gado-gado.',
   null),
  ('00000000-0000-4000-8000-200000000058', 'Lontong',
   'Nasi yang dimasak padat dalam daun pisang, dipotong-potong sebagai pengganti nasi.',
   null),
  ('00000000-0000-4000-8000-200000000059', 'Kayu Manis',
   'Kulit kayu beraroma manis hangat untuk semur dan masakan berempah.',
   null),
  ('00000000-0000-4000-8000-200000000060', 'Pala',
   'Rempah beraroma kuat; cukup sejumput bubuk pala untuk semur dan sup.',
   null),
  ('00000000-0000-4000-8000-200000000061', 'Cengkeh',
   'Kuncup bunga kering beraroma tajam. Gunakan sedikit untuk semur dan rendang.',
   null),
  ('00000000-0000-4000-8000-200000000062', 'Ikan Teri',
   'Ikan kecil kering yang gurih asin. Goreng hingga renyah sebelum dicampur ke masakan.',
   null),
  ('00000000-0000-4000-8000-200000000063', 'Seledri',
   'Daun beraroma segar untuk taburan soto dan sup.',
   null),
  ('00000000-0000-4000-8000-200000000064', 'Soun',
   'Bihun bening dari pati kacang hijau. Rendam air panas hingga lunak sebelum disajikan.',
   null),
  ('00000000-0000-4000-8000-200000000065', 'Koya',
   'Bubuk gurih dari kerupuk udang dan bawang putih goreng, taburan khas soto Lamongan.',
   null);

-- Recipes -------------------------------------------------------------------
-- Nasi Goreng Kampung (original) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-100000000001', 'Nasi Goreng Kampung',
   'Nasi goreng sederhana ala dapur desa: bumbu ulek bawang dan cabai, kecap manis secukupnya, dan telur orak-arik. Cepat, hemat, dan selalu jadi andalan sarapan maupun makan malam.',
   'https://images.unsplash.com/photo-1647093953000-9065ed6f85ef?w=1080&q=80&auto=format&fit=crop',
   10, 15, 'mudah', 2, 'published',
   null,
   '[
     {
       "title": "Siapkan bumbu",
       "text": "Haluskan bawang merah, bawang putih, dan cabai merah hingga menjadi pasta kasar. Iris tipis daun bawang, sisihkan untuk taburan.",
       "minutes": 5
     },
     {
       "title": "Tumis bumbu halus",
       "text": "Panaskan minyak goreng di wajan. Tumis bumbu halus dengan api sedang hingga harum dan berubah warna, sekitar 2 menit.",
       "minutes": 3
     },
     {
       "title": "Masak telur",
       "text": "Sisihkan bumbu ke tepi wajan. Pecahkan telur di tengah, orak-arik hingga setengah matang lalu aduk bersama bumbu.",
       "minutes": 2
     },
     {
       "title": "Masukkan nasi",
       "text": "Tambahkan nasi putih yang sudah dingin. Aduk rata sambil memecah gumpalan nasi agar bumbu meresap merata.",
       "minutes": 5
     },
     {
       "title": "Bumbui",
       "text": "Tuang kecap manis dan taburkan garam. Besarkan api dan aduk terus hingga nasi sedikit berasap dan harum.",
       "minutes": 5
     },
     {
       "title": "Sajikan",
       "text": "Taburi daun bawang, aduk sebentar, lalu angkat. Sajikan hangat dengan kerupuk dan acar timun.",
       "minutes": 1
     }
   ]'::jsonb,
   '2026-09-12 08:30:00+07', '2026-09-14 19:10:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-200000000002', 2, 'piring', 'sebaiknya nasi dingin', 0, 'Bahan utama'), -- Nasi Putih
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-200000000001', 2, 'butir', null, 1, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 2, 'Bahan utama'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-200000000007', 2, 'sdm', null, 3, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-200000000012', 1, 'batang', 'iris tipis', 4, 'Bahan utama'), -- Daun Bawang
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-200000000005', 3, 'buah', null, 5, 'Bahan utama'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-200000000003', 4, 'siung', null, 6, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 7, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000001', '00000000-0000-4000-8000-200000000011', 3, 'sdm', null, 8, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000001', 1), ('00000000-0000-4000-8000-300000000001', 11); -- Nasi · Hidangan Utama

-- Soto Ayam (original) by Rina Hapsari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-100000000003', 'Soto Ayam',
   'Soto ayam kuah kuning yang bening dan harum serai. Disajikan dengan soun, tauge, kol, telur rebus, dan perasan jeruk nipis.',
   'https://images.unsplash.com/photo-1677029969063-23ecbb98d0af?w=1080&q=80&auto=format&fit=crop',
   15, 45, 'sedang', 4, 'published',
   null,
   '[
     {
       "title": "Rebus ayam",
       "text": "Rebus ayam dalam 1,5 liter air bersama serai, daun salam, dan daun jeruk hingga matang, sekitar 25 menit. Angkat ayam, saring kaldunya.",
       "minutes": 25
     },
     {
       "title": "Tumis bumbu kuning",
       "text": "Haluskan bawang merah, bawang putih, kunyit, jahe, kemiri, dan merica. Tumis hingga harum dan matang.",
       "minutes": 5
     },
     {
       "title": "Masak kuah",
       "text": "Masukkan bumbu tumis ke dalam kaldu. Bumbui garam, didihkan kembali dengan api kecil selama 10 menit.",
       "minutes": 10
     },
     {
       "title": "Suwir ayam",
       "text": "Goreng sebentar ayam rebus hingga kecokelatan, lalu suwir-suwir.",
       "minutes": 5
     },
     {
       "title": "Siapkan pelengkap",
       "text": "Seduh soun dan tauge dengan air panas. Iris tipis kol, rebus telur hingga matang lalu belah dua.",
       "minutes": 10
     },
     {
       "title": "Sajikan",
       "text": "Tata soun, tauge, kol, ayam suwir, dan telur di mangkuk. Siram kuah panas, taburi seledri dan bawang goreng, beri perasan jeruk nipis.",
       "minutes": 2
     }
   ]'::jsonb,
   '2025-05-18 10:00:00+07', '2026-10-09 09:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000017', 500, 'gram', 'bagian paha dan dada', 0, 'Bahan utama'), -- Ayam
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000064', 50, 'gram', null, 1, 'Bahan utama'), -- Soun
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000037', 100, 'gram', null, 2, 'Bahan utama'), -- Tauge
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000023', 3, 'lembar', null, 3, 'Bahan utama'), -- Kol
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000001', 2, 'butir', null, 4, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000063', 2, 'batang', 'iris halus', 5, 'Bahan utama'), -- Seledri
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000045', 1, 'buah', null, 6, 'Bahan utama'), -- Jeruk Nipis
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000057', 2, 'sdm', null, 7, 'Bahan utama'), -- Bawang Goreng
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000003', 6, 'siung', null, 8, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000004', 4, 'siung', null, 9, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000031', 2, 'ruas', null, 10, 'Bumbu dasar'), -- Kunyit
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000030', 1, 'ruas', null, 11, 'Bumbu dasar'), -- Jahe
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000013', 3, 'butir', 'sangrai', 12, 'Bumbu dasar'), -- Kemiri
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000043', 0.5, 'sdt', null, 13, 'Bumbu dasar'), -- Merica
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000028', 2, 'batang', 'memarkan', 14, 'Bumbu dasar'), -- Serai
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000032', 2, 'lembar', null, 15, 'Bumbu dasar'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000033', 3, 'lembar', null, 16, 'Bumbu dasar'), -- Daun Jeruk
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000010', 1.5, 'sdt', null, 17, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000002', '00000000-0000-4000-8000-200000000011', 2, 'sdm', null, 18, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000002', 2), ('00000000-0000-4000-8000-300000000002', 12); -- Sup · Berkuah

-- Rendang Sapi (original) by Dimas Pratama
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-100000000004', 'Rendang Sapi',
   'Rendang Minang yang dimasak perlahan hingga santan mengering dan bumbu meresap ke serat daging. Hitam, empuk, dan tahan lama.',
   'https://images.unsplash.com/photo-1578704811974-8483c83a9772?w=1080&q=80&auto=format&fit=crop',
   30, 210, 'sulit', 6, 'published',
   null,
   '[
     {
       "title": "Haluskan bumbu",
       "text": "Haluskan bawang merah, bawang putih, cabai merah, jahe, kunyit, lengkuas, dan ketumbar hingga lembut.",
       "minutes": 15
     },
     {
       "title": "Siapkan daging",
       "text": "Potong daging sapi melawan serat seukuran 4 cm. Siapkan serai, daun salam, dan daun jeruk.",
       "minutes": 15
     },
     {
       "title": "Rebus dengan santan",
       "text": "Masukkan santan, bumbu halus, dan daun-daunan ke wajan besar. Didihkan sambil terus diaduk agar santan tidak pecah.",
       "minutes": 20
     },
     {
       "title": "Masak daging",
       "text": "Masukkan daging, kecilkan api. Masak sambil sesekali diaduk hingga kuah menyusut dan berminyak, sekitar 2 jam.",
       "minutes": 120
     },
     {
       "title": "Kalio menjadi rendang",
       "text": "Terus masak dengan api kecil sambil diaduk hingga bumbu mengering, kecokelatan pekat, dan menempel pada daging.",
       "minutes": 70
     },
     {
       "title": "Istirahatkan",
       "text": "Angkat dan diamkan 15 menit sebelum disajikan agar bumbu makin meresap.",
       "minutes": 0
     }
   ]'::jsonb,
   '2025-06-21 07:00:00+07', '2025-06-21 07:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000018', 1000, 'gram', 'bagian has dalam', 0, 'Bahan utama'), -- Daging Sapi
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000027', 1500, 'ml', 'dari 3 butir kelapa', 1, 'Bahan utama'), -- Santan
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000028', 2, 'batang', 'memarkan', 2, 'Bahan utama'), -- Serai
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000032', 4, 'lembar', null, 3, 'Bahan utama'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000033', 5, 'lembar', null, 4, 'Bahan utama'), -- Daun Jeruk
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000003', 12, 'siung', null, 5, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000004', 6, 'siung', null, 6, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000005', 15, 'buah', null, 7, 'Bumbu dasar'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000030', 2, 'ruas', null, 8, 'Bumbu dasar'), -- Jahe
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000031', 1, 'ruas', null, 9, 'Bumbu dasar'), -- Kunyit
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000029', 2, 'ruas', null, 10, 'Bumbu dasar'), -- Lengkuas
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000044', 1, 'sdt', 'sangrai', 11, 'Bumbu dasar'), -- Ketumbar
  ('00000000-0000-4000-8000-300000000003', '00000000-0000-4000-8000-200000000010', 2, 'sdt', null, 12, 'Bumbu dasar'); -- Garam
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000003', 3), ('00000000-0000-4000-8000-300000000003', 11); -- Daging · Hidangan Utama

-- Ayam Bakar Kecap (original) by Fajar Nugroho
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-100000000005', 'Ayam Bakar Kecap',
   'Ayam diungkep bumbu bawang dan kecap manis, lalu dibakar sambil diolesi sisa bumbu hingga legit dan sedikit gosong di pinggirnya.',
   'https://images.unsplash.com/photo-1588767768106-1b20e51d9d68?w=1080&q=80&auto=format&fit=crop',
   15, 35, 'sedang', 4, 'published',
   null,
   '[
     {
       "title": "Haluskan bumbu",
       "text": "Haluskan bawang merah, bawang putih, kemiri, ketumbar, dan jahe.",
       "minutes": 5
     },
     {
       "title": "Ungkep ayam",
       "text": "Tumis bumbu halus dengan serai dan daun salam hingga harum. Masukkan ayam, kecap manis, gula merah, garam, dan 300 ml air.",
       "minutes": 5
     },
     {
       "title": "Masak hingga meresap",
       "text": "Masak dengan api kecil hingga ayam empuk dan bumbu menyusut kental, sekitar 25 menit.",
       "minutes": 25
     },
     {
       "title": "Bakar ayam",
       "text": "Bakar ayam di atas arang atau teflon sambil dibolak-balik dan diolesi sisa bumbu hingga kecokelatan.",
       "minutes": 10
     },
     {
       "title": "Sajikan",
       "text": "Sajikan dengan nasi hangat, lalapan timun, dan sambal terasi.",
       "minutes": 2
     }
   ]'::jsonb,
   '2025-07-26 17:00:00+07', '2026-10-09 15:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000017', 1000, 'gram', 'potong 8', 0, 'Bahan utama'), -- Ayam
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000007', 5, 'sdm', null, 1, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000009', 20, 'gram', null, 2, 'Bahan utama'), -- Gula Merah
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000045', 1, 'buah', 'untuk melumuri ayam', 3, 'Bahan utama'), -- Jeruk Nipis
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000028', 1, 'batang', null, 4, 'Bahan utama'), -- Serai
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000032', 2, 'lembar', null, 5, 'Bahan utama'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000003', 8, 'siung', null, 6, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000004', 5, 'siung', null, 7, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000013', 3, 'butir', null, 8, 'Bumbu dasar'), -- Kemiri
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000044', 1, 'sdt', null, 9, 'Bumbu dasar'), -- Ketumbar
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000030', 1, 'ruas', null, 10, 'Bumbu dasar'), -- Jahe
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000010', 1, 'sdt', null, 11, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000004', '00000000-0000-4000-8000-200000000011', 3, 'sdm', null, 12, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000004', 4), ('00000000-0000-4000-8000-300000000004', 13); -- Ayam · Bakaran

-- Gado-Gado (original) by Wulan Pertiwi
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-100000000006', 'Gado-Gado',
   'Sayuran rebus, tahu, tempe, dan telur yang disiram bumbu kacang ulek. Segar, mengenyangkan, dan cocok untuk makan siang.',
   'https://images.unsplash.com/photo-1677837150412-4040c09bfcb0?w=1080&q=80&auto=format&fit=crop',
   15, 15, 'mudah', 3, 'published',
   null,
   '[
     {
       "title": "Rebus sayuran",
       "text": "Rebus kacang panjang, kol, dan kentang hingga matang. Seduh tauge sebentar dengan air panas, tiriskan.",
       "minutes": 10
     },
     {
       "title": "Goreng tahu dan tempe",
       "text": "Goreng tahu dan tempe hingga kuning kecokelatan, lalu potong-potong.",
       "minutes": 7
     },
     {
       "title": "Buat bumbu kacang",
       "text": "Ulek kacang tanah goreng, cabai rawit, bawang putih, gula merah, dan garam. Tambahkan air hangat sedikit demi sedikit hingga kental.",
       "minutes": 7
     },
     {
       "title": "Tata dan siram",
       "text": "Tata lontong, sayuran, tahu, tempe, timun, dan telur rebus di piring. Siram dengan bumbu kacang.",
       "minutes": 4
     },
     {
       "title": "Sajikan",
       "text": "Taburi bawang goreng dan sajikan dengan kerupuk.",
       "minutes": 1
     }
   ]'::jsonb,
   '2025-08-09 11:30:00+07', '2025-08-09 11:30:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000058', 2, 'buah', null, 0, 'Bahan utama'), -- Lontong
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000049', 5, 'batang', null, 1, 'Bahan utama'), -- Kacang Panjang
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000023', 3, 'lembar', null, 2, 'Bahan utama'), -- Kol
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000037', 100, 'gram', null, 3, 'Bahan utama'), -- Tauge
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000046', 2, 'buah', null, 4, 'Bahan utama'), -- Kentang
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000034', 2, 'buah', null, 5, 'Bahan utama'), -- Tahu
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000035', 100, 'gram', null, 6, 'Bahan utama'), -- Tempe
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000026', 1, 'buah', null, 7, 'Bahan utama'), -- Timun
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000001', 2, 'butir', 'rebus', 8, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000056', null, 'secukupnya', null, 9, 'Bahan utama'), -- Kerupuk
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000036', 150, 'gram', 'goreng', 10, 'Bumbu dasar'), -- Kacang Tanah
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000006', 4, 'buah', null, 11, 'Bumbu dasar'), -- Cabai Rawit
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000004', 2, 'siung', null, 12, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000009', 30, 'gram', null, 13, 'Bumbu dasar'), -- Gula Merah
  ('00000000-0000-4000-8000-300000000005', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 14, 'Bumbu dasar'); -- Garam
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000005', 5), ('00000000-0000-4000-8000-300000000005', 14); -- Sayur · Salad

-- Capcay (original) by Hendra Wijaya
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-100000000007', 'Capcay',
   'Tumis aneka sayur dengan saus tiram dan bawang putih, dimasak cepat dengan api besar agar tetap renyah.',
   'https://images.unsplash.com/photo-1789990653630-921eda98b866?w=1080&q=80&auto=format&fit=crop',
   8, 12, 'mudah', 3, 'published',
   null,
   '[
     {
       "title": "Potong sayuran",
       "text": "Iris wortel serong, potong kol dan sawi, iris bawang bombay. Cincang bawang putih.",
       "minutes": 6
     },
     {
       "title": "Tumis aromatik",
       "text": "Panaskan minyak, tumis bawang putih dan bawang bombay hingga harum.",
       "minutes": 2
     },
     {
       "title": "Masak ayam",
       "text": "Masukkan potongan ayam, aduk hingga berubah warna.",
       "minutes": 3
     },
     {
       "title": "Masukkan sayuran",
       "text": "Masukkan wortel dulu, lalu kol dan sawi. Tambahkan saus tiram, kecap asin, merica, dan sedikit air.",
       "minutes": 5
     },
     {
       "title": "Kentalkan dan sajikan",
       "text": "Masak hingga sayur layu namun tetap renyah. Koreksi rasa lalu sajikan hangat.",
       "minutes": 2
     }
   ]'::jsonb,
   '2025-09-14 18:45:00+07', '2026-10-05 10:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000024', 1, 'buah', null, 0, 'Bahan utama'), -- Wortel
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000023', 4, 'lembar', null, 1, 'Bahan utama'), -- Kol
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000052', 2, 'batang', null, 2, 'Bahan utama'), -- Sawi Hijau
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000017', 150, 'gram', 'potong kecil', 3, 'Bahan utama'), -- Ayam
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000021', 0.5, 'buah', null, 4, 'Bahan utama'), -- Bawang Bombay
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000022', 2, 'sdm', null, 5, 'Bahan utama'), -- Saus Tiram
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000008', 1, 'sdm', null, 6, 'Bahan utama'), -- Kecap Asin
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000004', 4, 'siung', 'cincang', 7, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000043', 0.5, 'sdt', null, 8, 'Bumbu dasar'), -- Merica
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 9, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000006', '00000000-0000-4000-8000-200000000011', 2, 'sdm', null, 10, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000006', 5), ('00000000-0000-4000-8000-300000000006', 15); -- Sayur · Tumisan

-- Nasi Goreng Jawa (original) by Bagus Santoso
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-100000000002', 'Nasi Goreng Jawa',
   'Nasi goreng khas Jawa Tengah dengan bumbu ulek kemiri dan cabai. Rasanya lebih manis dan warnanya lebih gelap karena kecap.',
   'https://images.unsplash.com/photo-1664334996168-e8a164b1a4d7?w=1080&q=80&auto=format&fit=crop',
   10, 15, 'mudah', 2, 'published',
   null,
   '[
     {
       "title": "Ulek bumbu",
       "text": "Ulek bawang merah, bawang putih, cabai merah, dan kemiri sangrai hingga halus.",
       "minutes": 5
     },
     {
       "title": "Tumis bumbu",
       "text": "Panaskan minyak, tumis bumbu halus dengan api sedang hingga matang dan harum.",
       "minutes": 3
     },
     {
       "title": "Masak telur dan kol",
       "text": "Masukkan telur, orak-arik. Tambahkan kol iris, aduk hingga sedikit layu.",
       "minutes": 3
     },
     {
       "title": "Masukkan nasi",
       "text": "Masukkan nasi dingin, aduk rata dengan api besar.",
       "minutes": 4
     },
     {
       "title": "Bumbui",
       "text": "Tuang kecap manis lebih banyak dan garam. Aduk hingga warna merata cokelat gelap dan nasi berasap.",
       "minutes": 4
     },
     {
       "title": "Sajikan",
       "text": "Sajikan dengan irisan timun dan kerupuk.",
       "minutes": 1
     }
   ]'::jsonb,
   '2026-02-07 19:00:00+07', '2026-02-07 19:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-200000000002', 2, 'piring', null, 0, 'Bahan utama'), -- Nasi Putih
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-200000000001', 2, 'butir', null, 1, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 2, 'Bahan utama'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-200000000007', 3, 'sdm', null, 3, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-200000000023', 2, 'lembar', 'iris tipis', 4, 'Bahan utama'), -- Kol
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-200000000005', 2, 'buah', null, 5, 'Bahan utama'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-200000000013', 2, 'butir', 'sangrai', 6, 'Bahan utama'), -- Kemiri
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-200000000003', 5, 'siung', null, 7, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 8, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000007', '00000000-0000-4000-8000-200000000011', 3, 'sdm', null, 9, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000007', 1), ('00000000-0000-4000-8000-300000000007', 11); -- Nasi · Hidangan Utama

-- Sayur Asem (original) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-100000000001', 'Sayur Asem',
   'Sayur berkuah asam segar dengan jagung, labu siam, kacang panjang, dan melinjo. Pasangan sempurna untuk ikan asin dan sambal terasi.',
   'https://images.unsplash.com/photo-1705088294904-c17a2205c1e3?w=1080&q=80&auto=format&fit=crop',
   10, 30, 'mudah', 4, 'published',
   null,
   '[
     {
       "title": "Haluskan bumbu",
       "text": "Haluskan bawang merah, bawang putih, cabai merah, dan terasi.",
       "minutes": 5
     },
     {
       "title": "Rebus bahan keras",
       "text": "Didihkan 1,5 liter air. Masukkan bumbu halus, jagung, melinjo, dan kacang tanah. Masak 10 menit.",
       "minutes": 10
     },
     {
       "title": "Masukkan sayuran",
       "text": "Tambahkan labu siam dan kacang panjang, masak hingga empuk.",
       "minutes": 10
     },
     {
       "title": "Bumbui",
       "text": "Masukkan asam jawa, gula merah, daun salam, lengkuas, dan garam. Masak 5 menit lagi lalu koreksi rasa.",
       "minutes": 5
     },
     {
       "title": "Sajikan",
       "text": "Angkat dan sajikan hangat selagi kuahnya segar.",
       "minutes": 1
     }
   ]'::jsonb,
   '2025-11-02 09:30:00+07', '2026-09-30 12:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000054', 1, 'buah', 'potong-potong', 0, 'Bahan utama'), -- Jagung
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000047', 1, 'buah', 'potong dadu', 1, 'Bahan utama'), -- Labu Siam
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000049', 5, 'batang', null, 2, 'Bahan utama'), -- Kacang Panjang
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000055', 50, 'gram', null, 3, 'Bahan utama'), -- Melinjo
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000036', 50, 'gram', null, 4, 'Bahan utama'), -- Kacang Tanah
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000053', 20, 'gram', null, 5, 'Bahan utama'), -- Asam Jawa
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000009', 20, 'gram', null, 6, 'Bahan utama'), -- Gula Merah
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000032', 2, 'lembar', null, 7, 'Bahan utama'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000029', 1, 'ruas', 'memarkan', 8, 'Bahan utama'), -- Lengkuas
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000003', 5, 'siung', null, 9, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 10, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000005', 2, 'buah', null, 11, 'Bumbu dasar'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000051', 1, 'sdt', null, 12, 'Bumbu dasar'), -- Terasi
  ('00000000-0000-4000-8000-300000000008', '00000000-0000-4000-8000-200000000010', 1, 'sdt', null, 13, 'Bumbu dasar'); -- Garam
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000008', 5), ('00000000-0000-4000-8000-300000000008', 12); -- Sayur · Berkuah

-- Semur Daging (original) by Dimas Pratama
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-100000000004', 'Semur Daging',
   'Daging sapi empuk dalam kuah kecap manis yang kental, harum pala, cengkeh, dan kayu manis. Hidangan wajib saat Lebaran.',
   'https://images.unsplash.com/photo-1617518165278-c722bce52478?w=1080&q=80&auto=format&fit=crop',
   20, 70, 'sedang', 4, 'published',
   null,
   '[
     {
       "title": "Haluskan bumbu",
       "text": "Haluskan bawang merah, bawang putih, kemiri, merica, dan pala.",
       "minutes": 10
     },
     {
       "title": "Tumis bumbu",
       "text": "Tumis bumbu halus bersama bawang bombay, kayu manis, dan cengkeh hingga harum.",
       "minutes": 5
     },
     {
       "title": "Masak daging",
       "text": "Masukkan potongan daging, aduk hingga berubah warna. Tuang 800 ml air.",
       "minutes": 5
     },
     {
       "title": "Rebus perlahan",
       "text": "Tambahkan kecap manis, garam, dan kentang. Masak dengan api kecil hingga daging empuk dan kuah mengental, sekitar 60 menit.",
       "minutes": 60
     },
     {
       "title": "Sajikan",
       "text": "Koreksi rasa, taburi bawang goreng, dan sajikan dengan nasi hangat.",
       "minutes": 2
     }
   ]'::jsonb,
   '2025-12-20 16:00:00+07', '2025-12-20 16:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000018', 500, 'gram', null, 0, 'Bahan utama'), -- Daging Sapi
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000046', 3, 'buah', 'potong besar', 1, 'Bahan utama'), -- Kentang
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000007', 6, 'sdm', null, 2, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000021', 1, 'buah', null, 3, 'Bahan utama'), -- Bawang Bombay
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000059', 1, 'batang', null, 4, 'Bahan utama'), -- Kayu Manis
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000061', 4, 'butir', null, 5, 'Bahan utama'), -- Cengkeh
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000057', 2, 'sdm', null, 6, 'Bahan utama'), -- Bawang Goreng
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000003', 8, 'siung', null, 7, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000004', 4, 'siung', null, 8, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000013', 3, 'butir', null, 9, 'Bumbu dasar'), -- Kemiri
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000043', 0.5, 'sdt', null, 10, 'Bumbu dasar'), -- Merica
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000060', 0.25, 'sdt', 'bubuk', 11, 'Bumbu dasar'), -- Pala
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000010', 1, 'sdt', null, 12, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000009', '00000000-0000-4000-8000-200000000011', 2, 'sdm', null, 13, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000009', 3), ('00000000-0000-4000-8000-300000000009', 12); -- Daging · Berkuah

-- Nasi Uduk (original) by Ayu Lestari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000010', '00000000-0000-4000-8000-100000000009', 'Nasi Uduk',
   'Nasi gurih yang ditanak dengan santan, serai, dan daun salam. Enak disantap pagi hari bersama tempe orek, telur, dan sambal.',
   'https://images.unsplash.com/photo-1660927428914-65c9e7f14b5f?w=1080&q=80&auto=format&fit=crop',
   10, 35, 'mudah', 4, 'published',
   null,
   '[
     {
       "title": "Cuci beras",
       "text": "Cuci beras hingga air bilasan jernih, tiriskan.",
       "minutes": 5
     },
     {
       "title": "Aron dengan santan",
       "text": "Rebus santan bersama serai, daun salam, lengkuas, dan garam. Masukkan beras, masak hingga santan terserap.",
       "minutes": 10
     },
     {
       "title": "Kukus",
       "text": "Pindahkan nasi aron ke kukusan yang sudah panas. Kukus hingga tanak, sekitar 25 menit.",
       "minutes": 25
     },
     {
       "title": "Sajikan",
       "text": "Aduk nasi agar pulen, taburi bawang goreng, dan sajikan dengan lauk pilihan.",
       "minutes": 2
     }
   ]'::jsonb,
   '2025-10-11 06:30:00+07', '2025-10-11 06:30:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000010', '00000000-0000-4000-8000-200000000002', 4, 'piring', 'dari 400 gram beras, belum ditanak', 0, 'Bahan utama'), -- Nasi Putih
  ('00000000-0000-4000-8000-300000000010', '00000000-0000-4000-8000-200000000027', 600, 'ml', null, 1, 'Bahan utama'), -- Santan
  ('00000000-0000-4000-8000-300000000010', '00000000-0000-4000-8000-200000000028', 2, 'batang', null, 2, 'Bahan utama'), -- Serai
  ('00000000-0000-4000-8000-300000000010', '00000000-0000-4000-8000-200000000032', 3, 'lembar', null, 3, 'Bahan utama'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000010', '00000000-0000-4000-8000-200000000029', 1, 'ruas', null, 4, 'Bahan utama'), -- Lengkuas
  ('00000000-0000-4000-8000-300000000010', '00000000-0000-4000-8000-200000000057', 3, 'sdm', 'untuk taburan', 5, 'Bahan utama'), -- Bawang Goreng
  ('00000000-0000-4000-8000-300000000010', '00000000-0000-4000-8000-200000000010', 1, 'sdt', null, 6, 'Bumbu dasar'); -- Garam
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000010', 1), ('00000000-0000-4000-8000-300000000010', 16); -- Nasi · Sarapan

-- Mie Goreng (original) by Fajar Nugroho
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000011', '00000000-0000-4000-8000-100000000005', 'Mie Goreng',
   'Mie telur goreng rumahan dengan kecap manis, sawi, dan telur. Siap dalam 20 menit untuk makan malam cepat.',
   'https://images.unsplash.com/photo-1701856625487-68394e167b68?w=1080&q=80&auto=format&fit=crop',
   8, 12, 'mudah', 2, 'published',
   null,
   '[
     {
       "title": "Rebus mie",
       "text": "Rebus mie telur hingga lentur, tiriskan dan beri sedikit minyak agar tidak lengket.",
       "minutes": 4
     },
     {
       "title": "Tumis bumbu",
       "text": "Tumis bawang merah dan bawang putih cincang hingga harum.",
       "minutes": 2
     },
     {
       "title": "Masak telur",
       "text": "Masukkan telur, orak-arik hingga setengah matang.",
       "minutes": 2
     },
     {
       "title": "Masukkan mie dan sawi",
       "text": "Masukkan mie dan sawi hijau, tuang kecap manis dan garam. Aduk rata dengan api besar.",
       "minutes": 4
     },
     {
       "title": "Sajikan",
       "text": "Taburi daun bawang, aduk sebentar, lalu sajikan hangat.",
       "minutes": 1
     }
   ]'::jsonb,
   '2026-01-17 20:00:00+07', '2026-10-07 08:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000011', '00000000-0000-4000-8000-200000000019', 200, 'gram', null, 0, 'Bahan utama'), -- Mie Telur
  ('00000000-0000-4000-8000-300000000011', '00000000-0000-4000-8000-200000000001', 2, 'butir', null, 1, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000011', '00000000-0000-4000-8000-200000000052', 2, 'batang', null, 2, 'Bahan utama'), -- Sawi Hijau
  ('00000000-0000-4000-8000-300000000011', '00000000-0000-4000-8000-200000000007', 3, 'sdm', null, 3, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000011', '00000000-0000-4000-8000-200000000012', 1, 'batang', null, 4, 'Bahan utama'), -- Daun Bawang
  ('00000000-0000-4000-8000-300000000011', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 5, 'Bahan utama'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000011', '00000000-0000-4000-8000-200000000003', 3, 'siung', null, 6, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000011', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 7, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000011', '00000000-0000-4000-8000-200000000011', 2, 'sdm', null, 8, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000011', 6), ('00000000-0000-4000-8000-300000000011', 11); -- Mie · Hidangan Utama

-- Telur Dadar (original) by Dewi Anggraini
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000012', '00000000-0000-4000-8000-100000000008', 'Telur Dadar',
   'Telur dadar tebal dengan irisan daun bawang dan bawang merah. Lauk paling cepat ketika dapur hampir kosong.',
   'https://images.unsplash.com/photo-1608472967268-48c30967fab8?w=1080&q=80&auto=format&fit=crop',
   4, 6, 'mudah', 2, 'published',
   null,
   '[
     {
       "title": "Iris bumbu",
       "text": "Iris tipis bawang merah, bawang putih, dan daun bawang.",
       "minutes": 2
     },
     {
       "title": "Kocok telur",
       "text": "Kocok telur bersama irisan bumbu dan garam hingga rata.",
       "minutes": 2
     },
     {
       "title": "Goreng",
       "text": "Panaskan minyak di wajan kecil, tuang telur. Masak dengan api sedang hingga bagian bawah kecokelatan.",
       "minutes": 4
     },
     {
       "title": "Balik dan sajikan",
       "text": "Balik telur, masak sebentar hingga matang, lalu potong dan sajikan.",
       "minutes": 2
     }
   ]'::jsonb,
   '2025-09-01 07:15:00+07', '2025-09-01 07:15:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000012', '00000000-0000-4000-8000-200000000001', 3, 'butir', null, 0, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000012', '00000000-0000-4000-8000-200000000012', 1, 'batang', null, 1, 'Bahan utama'), -- Daun Bawang
  ('00000000-0000-4000-8000-300000000012', '00000000-0000-4000-8000-200000000004', 1, 'siung', null, 2, 'Bahan utama'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000012', '00000000-0000-4000-8000-200000000003', 2, 'siung', null, 3, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000012', '00000000-0000-4000-8000-200000000010', 0.25, 'sdt', null, 4, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000012', '00000000-0000-4000-8000-200000000011', 2, 'sdm', null, 5, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000012', 7), ('00000000-0000-4000-8000-300000000012', 17); -- Telur · Lauk

-- Telur Balado (original) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000013', '00000000-0000-4000-8000-100000000001', 'Telur Balado',
   'Telur rebus goreng yang dibalut sambal balado cabai merah dan tomat. Pedas, manis, dan cocok untuk bekal.',
   'https://images.unsplash.com/photo-1655740242852-3a0cae4c0843?w=1080&q=80&auto=format&fit=crop',
   5, 15, 'mudah', 3, 'published',
   null,
   '[
     {
       "title": "Rebus telur",
       "text": "Rebus telur hingga matang, kupas, lalu goreng sebentar hingga kulitnya berkerut.",
       "minutes": 8
     },
     {
       "title": "Haluskan bumbu",
       "text": "Ulek kasar cabai merah, bawang merah, bawang putih, dan tomat.",
       "minutes": 3
     },
     {
       "title": "Tumis balado",
       "text": "Tumis bumbu dengan daun jeruk hingga matang dan minyak keluar. Bumbui gula pasir dan garam.",
       "minutes": 5
     },
     {
       "title": "Campur telur",
       "text": "Masukkan telur, aduk hingga terbalut sambal. Sajikan.",
       "minutes": 2
     }
   ]'::jsonb,
   '2026-03-08 11:00:00+07', '2026-03-08 11:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000013', '00000000-0000-4000-8000-200000000001', 6, 'butir', null, 0, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000013', '00000000-0000-4000-8000-200000000005', 8, 'buah', null, 1, 'Bahan utama'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000013', '00000000-0000-4000-8000-200000000025', 1, 'buah', null, 2, 'Bahan utama'), -- Tomat
  ('00000000-0000-4000-8000-300000000013', '00000000-0000-4000-8000-200000000033', 2, 'lembar', null, 3, 'Bahan utama'), -- Daun Jeruk
  ('00000000-0000-4000-8000-300000000013', '00000000-0000-4000-8000-200000000042', 1, 'sdt', null, 4, 'Bahan utama'), -- Gula Pasir
  ('00000000-0000-4000-8000-300000000013', '00000000-0000-4000-8000-200000000003', 6, 'siung', null, 5, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000013', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 6, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000013', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 7, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000013', '00000000-0000-4000-8000-200000000011', 4, 'sdm', null, 8, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000013', 7), ('00000000-0000-4000-8000-300000000013', 17); -- Telur · Lauk

-- Tempe Orek (original) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-100000000001', 'Tempe Orek',
   'Tempe goreng korek api yang ditumis dengan kecap manis, gula merah, dan cabai. Manis gurih, awet untuk lauk dua hari.',
   'https://images.unsplash.com/photo-1786114624401-7dccb1ab07a2?w=1080&q=80&auto=format&fit=crop',
   10, 15, 'mudah', 4, 'published',
   null,
   '[
     {
       "title": "Potong tempe",
       "text": "Potong tempe seperti batang korek api, iris bawang dan cabai.",
       "minutes": 5
     },
     {
       "title": "Goreng tempe",
       "text": "Goreng tempe hingga kering dan kecokelatan, tiriskan.",
       "minutes": 8
     },
     {
       "title": "Tumis bumbu",
       "text": "Tumis bawang merah, bawang putih, cabai merah, lengkuas, dan daun salam hingga harum.",
       "minutes": 3
     },
     {
       "title": "Campur",
       "text": "Masukkan kecap manis, gula merah, garam, dan sedikit air. Masukkan tempe, aduk hingga bumbu menyusut dan meresap.",
       "minutes": 5
     }
   ]'::jsonb,
   '2025-12-06 10:20:00+07', '2025-12-06 10:20:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-200000000035', 300, 'gram', null, 0, 'Bahan utama'), -- Tempe
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-200000000007', 4, 'sdm', null, 1, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-200000000009', 25, 'gram', null, 2, 'Bahan utama'), -- Gula Merah
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-200000000005', 3, 'buah', 'iris serong', 3, 'Bahan utama'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-200000000029', 1, 'ruas', null, 4, 'Bahan utama'), -- Lengkuas
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-200000000032', 2, 'lembar', null, 5, 'Bahan utama'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-200000000003', 5, 'siung', 'iris tipis', 6, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-200000000004', 3, 'siung', 'iris tipis', 7, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 8, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000014', '00000000-0000-4000-8000-200000000011', 200, 'ml', 'untuk menggoreng', 9, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000014', 8), ('00000000-0000-4000-8000-300000000014', 17); -- Kedelai · Lauk

-- Sambal Matah (original) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000015', '00000000-0000-4000-8000-100000000001', 'Sambal Matah',
   'Sambal mentah khas Bali dari irisan bawang merah, cabai rawit, serai, dan daun jeruk yang disiram minyak panas.',
   'https://images.unsplash.com/photo-1739595415308-ba632ebfbfe2?w=1080&q=80&auto=format&fit=crop',
   15, 0, 'mudah', 4, 'published',
   null,
   '[
     {
       "title": "Iris bahan",
       "text": "Iris tipis bawang merah, cabai rawit, serai bagian putih, dan daun jeruk.",
       "minutes": 8
     },
     {
       "title": "Bumbui",
       "text": "Campur irisan dengan terasi bakar, garam, dan perasan jeruk nipis. Remas perlahan.",
       "minutes": 3
     },
     {
       "title": "Siram minyak",
       "text": "Panaskan minyak hingga benar-benar panas, siramkan ke campuran sambal.",
       "minutes": 3
     },
     {
       "title": "Sajikan",
       "text": "Aduk rata dan sajikan segera bersama ayam atau ikan bakar.",
       "minutes": 1
     }
   ]'::jsonb,
   '2026-04-19 13:00:00+07', '2026-04-19 13:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000015', '00000000-0000-4000-8000-200000000003', 10, 'siung', null, 0, 'Bahan utama'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000015', '00000000-0000-4000-8000-200000000006', 10, 'buah', null, 1, 'Bahan utama'), -- Cabai Rawit
  ('00000000-0000-4000-8000-300000000015', '00000000-0000-4000-8000-200000000028', 3, 'batang', null, 2, 'Bahan utama'), -- Serai
  ('00000000-0000-4000-8000-300000000015', '00000000-0000-4000-8000-200000000033', 4, 'lembar', null, 3, 'Bahan utama'), -- Daun Jeruk
  ('00000000-0000-4000-8000-300000000015', '00000000-0000-4000-8000-200000000045', 1, 'buah', null, 4, 'Bahan utama'), -- Jeruk Nipis
  ('00000000-0000-4000-8000-300000000015', '00000000-0000-4000-8000-200000000051', 0.5, 'sdt', 'bakar', 5, 'Bahan utama'), -- Terasi
  ('00000000-0000-4000-8000-300000000015', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 6, 'Bahan utama'), -- Garam
  ('00000000-0000-4000-8000-300000000015', '00000000-0000-4000-8000-200000000011', 4, 'sdm', null, 7, 'Bahan utama'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000015', 9), ('00000000-0000-4000-8000-300000000015', 18); -- Sambal · Pelengkap

-- Acar Timun (original) by Wulan Pertiwi
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000016', '00000000-0000-4000-8000-100000000006', 'Acar Timun',
   'Acar timun, wortel, dan bawang merah dalam kuah cuka manis. Menyegarkan untuk teman nasi goreng dan sate.',
   'https://images.unsplash.com/photo-1780493219430-c3e45cd17df8?w=1080&q=80&auto=format&fit=crop',
   15, 0, 'mudah', 4, 'published',
   null,
   '[
     {
       "title": "Potong sayuran",
       "text": "Potong dadu timun dan wortel, kupas bawang merah utuh, iris cabai rawit.",
       "minutes": 8
     },
     {
       "title": "Buat larutan",
       "text": "Larutkan gula pasir dan garam dengan perasan jeruk nipis dan sedikit air matang.",
       "minutes": 3
     },
     {
       "title": "Campur",
       "text": "Campurkan sayuran ke larutan, aduk rata.",
       "minutes": 2
     },
     {
       "title": "Diamkan",
       "text": "Diamkan minimal 15 menit di kulkas sebelum disajikan.",
       "minutes": 2
     }
   ]'::jsonb,
   '2025-10-25 15:00:00+07', '2025-10-25 15:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000016', '00000000-0000-4000-8000-200000000026', 2, 'buah', null, 0, 'Bahan utama'), -- Timun
  ('00000000-0000-4000-8000-300000000016', '00000000-0000-4000-8000-200000000024', 1, 'buah', null, 1, 'Bahan utama'), -- Wortel
  ('00000000-0000-4000-8000-300000000016', '00000000-0000-4000-8000-200000000003', 6, 'siung', 'utuh', 2, 'Bahan utama'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000016', '00000000-0000-4000-8000-200000000006', 5, 'buah', null, 3, 'Bahan utama'), -- Cabai Rawit
  ('00000000-0000-4000-8000-300000000016', '00000000-0000-4000-8000-200000000045', 2, 'buah', null, 4, 'Bahan utama'), -- Jeruk Nipis
  ('00000000-0000-4000-8000-300000000016', '00000000-0000-4000-8000-200000000042', 2, 'sdm', null, 5, 'Bahan utama'), -- Gula Pasir
  ('00000000-0000-4000-8000-300000000016', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 6, 'Bahan utama'); -- Garam
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000016', 5), ('00000000-0000-4000-8000-300000000016', 18); -- Sayur · Pelengkap

-- Sambal Terasi (original) by Rina Hapsari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-100000000003', 'Sambal Terasi',
   'Sambal goreng cabai, tomat, dan terasi yang diulek kasar. Pedas gurih untuk teman soto, ayam bakar, atau lalapan.',
   'https://images.unsplash.com/photo-1694111133919-e365928cc252?w=1080&q=80&auto=format&fit=crop',
   5, 10, 'mudah', 4, 'published',
   null,
   '[
     {
       "title": "Goreng bahan",
       "text": "Goreng cabai merah, cabai rawit, bawang merah, bawang putih, dan tomat hingga layu.",
       "minutes": 5
     },
     {
       "title": "Bakar terasi",
       "text": "Bakar atau sangrai terasi sebentar hingga harum.",
       "minutes": 2
     },
     {
       "title": "Ulek",
       "text": "Ulek semua bahan bersama gula merah dan garam hingga halus atau kasar sesuai selera.",
       "minutes": 5
     },
     {
       "title": "Sajikan",
       "text": "Beri perasan jeruk nipis bila suka, lalu sajikan.",
       "minutes": 1
     }
   ]'::jsonb,
   '2025-07-13 12:00:00+07', '2025-07-13 12:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-200000000005', 5, 'buah', null, 0, 'Bahan utama'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-200000000006', 10, 'buah', null, 1, 'Bahan utama'), -- Cabai Rawit
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-200000000025', 1, 'buah', null, 2, 'Bahan utama'), -- Tomat
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-200000000051', 1, 'sdt', null, 3, 'Bahan utama'), -- Terasi
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-200000000009', 10, 'gram', null, 4, 'Bahan utama'), -- Gula Merah
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-200000000045', 0.5, 'buah', null, 5, 'Bahan utama'), -- Jeruk Nipis
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-200000000003', 4, 'siung', null, 6, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-200000000004', 2, 'siung', null, 7, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 8, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000017', '00000000-0000-4000-8000-200000000011', 3, 'sdm', null, 9, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000017', 9), ('00000000-0000-4000-8000-300000000017', 18); -- Sambal · Pelengkap

-- Opor Ayam (original) by Rina Hapsari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-100000000003', 'Opor Ayam',
   'Ayam dimasak dalam santan berbumbu kuning dengan serai dan daun salam. Gurih lembut, pasangan setia ketupat saat hari raya.',
   'https://images.unsplash.com/photo-1727404583890-0eaef7d5b800?w=1080&q=80&auto=format&fit=crop',
   15, 60, 'sedang', 5, 'published',
   null,
   '[
     {
       "title": "Haluskan bumbu",
       "text": "Haluskan bawang merah, bawang putih, kemiri, ketumbar, kunyit, dan jahe.",
       "minutes": 8
     },
     {
       "title": "Tumis bumbu",
       "text": "Tumis bumbu halus bersama serai, lengkuas, daun salam, dan daun jeruk hingga matang.",
       "minutes": 5
     },
     {
       "title": "Masak ayam",
       "text": "Masukkan ayam, aduk hingga berubah warna. Tuang santan encer, masak hingga ayam empuk.",
       "minutes": 35
     },
     {
       "title": "Tambahkan santan kental",
       "text": "Masukkan sisa santan kental, gula merah, dan garam. Masak sambil diaduk agar santan tidak pecah.",
       "minutes": 15
     },
     {
       "title": "Sajikan",
       "text": "Taburi bawang goreng, sajikan dengan lontong atau nasi.",
       "minutes": 2
     }
   ]'::jsonb,
   '2026-03-28 09:00:00+07', '2026-03-28 09:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000017', 1000, 'gram', 'potong 10', 0, 'Bahan utama'), -- Ayam
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000027', 1000, 'ml', null, 1, 'Bahan utama'), -- Santan
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000028', 2, 'batang', null, 2, 'Bahan utama'), -- Serai
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000029', 1, 'ruas', null, 3, 'Bahan utama'), -- Lengkuas
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000032', 3, 'lembar', null, 4, 'Bahan utama'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000033', 3, 'lembar', null, 5, 'Bahan utama'), -- Daun Jeruk
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000009', 10, 'gram', null, 6, 'Bahan utama'), -- Gula Merah
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000057', 2, 'sdm', null, 7, 'Bahan utama'), -- Bawang Goreng
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000003', 8, 'siung', null, 8, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000004', 5, 'siung', null, 9, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000013', 4, 'butir', null, 10, 'Bumbu dasar'), -- Kemiri
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000044', 1, 'sdt', null, 11, 'Bumbu dasar'), -- Ketumbar
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000031', 1, 'ruas', null, 12, 'Bumbu dasar'), -- Kunyit
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000030', 1, 'ruas', null, 13, 'Bumbu dasar'), -- Jahe
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000010', 1.5, 'sdt', null, 14, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000018', '00000000-0000-4000-8000-200000000011', 2, 'sdm', null, 15, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000018', 4), ('00000000-0000-4000-8000-300000000018', 12); -- Ayam · Berkuah

-- Tumis Kangkung (original) by Hendra Wijaya
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000019', '00000000-0000-4000-8000-100000000007', 'Tumis Kangkung',
   'Kangkung ditumis cepat dengan bawang putih, cabai, terasi, dan saus tiram. Hijau, renyah, dan wangi.',
   'https://images.unsplash.com/photo-1707271914006-627b89038143?w=1080&q=80&auto=format&fit=crop',
   5, 10, 'mudah', 2, 'published',
   null,
   '[
     {
       "title": "Siangi kangkung",
       "text": "Petik kangkung, buang batang yang keras, cuci bersih dan tiriskan.",
       "minutes": 4
     },
     {
       "title": "Tumis bumbu",
       "text": "Tumis bawang merah, bawang putih, cabai merah, dan terasi hingga harum.",
       "minutes": 2
     },
     {
       "title": "Masak kangkung",
       "text": "Masukkan kangkung, saus tiram, dan garam. Aduk cepat dengan api besar hingga layu.",
       "minutes": 3
     },
     {
       "title": "Sajikan",
       "text": "Angkat segera agar kangkung tetap hijau, sajikan hangat.",
       "minutes": 1
     }
   ]'::jsonb,
   '2026-05-09 18:30:00+07', '2026-05-09 18:30:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000019', '00000000-0000-4000-8000-200000000038', 250, 'gram', null, 0, 'Bahan utama'), -- Kangkung
  ('00000000-0000-4000-8000-300000000019', '00000000-0000-4000-8000-200000000005', 2, 'buah', null, 1, 'Bahan utama'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000019', '00000000-0000-4000-8000-200000000022', 1, 'sdm', null, 2, 'Bahan utama'), -- Saus Tiram
  ('00000000-0000-4000-8000-300000000019', '00000000-0000-4000-8000-200000000051', 0.5, 'sdt', null, 3, 'Bahan utama'), -- Terasi
  ('00000000-0000-4000-8000-300000000019', '00000000-0000-4000-8000-200000000003', 3, 'siung', null, 4, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000019', '00000000-0000-4000-8000-200000000004', 4, 'siung', null, 5, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000019', '00000000-0000-4000-8000-200000000010', 0.25, 'sdt', null, 6, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000019', '00000000-0000-4000-8000-200000000011', 2, 'sdm', null, 7, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000019', 5), ('00000000-0000-4000-8000-300000000019', 15); -- Sayur · Tumisan

-- Udang Saus Tiram (original) by Ayu Lestari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-100000000009', 'Udang Saus Tiram',
   'Udang segar ditumis dengan bawang bombay, saus tiram, dan kecap manis. Gurih manis dan siap dalam 20 menit.',
   'https://images.unsplash.com/photo-1743297907354-15385f7be4ae?w=1080&q=80&auto=format&fit=crop',
   10, 10, 'mudah', 3, 'published',
   null,
   '[
     {
       "title": "Bersihkan udang",
       "text": "Kupas udang, sisakan ekornya, buang kotoran di punggung. Lumuri jeruk nipis.",
       "minutes": 8
     },
     {
       "title": "Tumis aromatik",
       "text": "Tumis bawang putih, bawang bombay, dan jahe hingga harum.",
       "minutes": 3
     },
     {
       "title": "Masak udang",
       "text": "Masukkan udang, masak hingga berubah merah.",
       "minutes": 3
     },
     {
       "title": "Bumbui",
       "text": "Tambahkan saus tiram, kecap manis, merica, dan sedikit air. Masak hingga saus mengental.",
       "minutes": 4
     },
     {
       "title": "Sajikan",
       "text": "Taburi daun bawang dan sajikan dengan nasi hangat.",
       "minutes": 1
     }
   ]'::jsonb,
   '2026-06-14 19:30:00+07', '2026-06-14 19:30:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-200000000015', 300, 'gram', null, 0, 'Bahan utama'), -- Udang
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-200000000021', 1, 'buah', null, 1, 'Bahan utama'), -- Bawang Bombay
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-200000000022', 3, 'sdm', null, 2, 'Bahan utama'), -- Saus Tiram
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-200000000007', 1, 'sdm', null, 3, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-200000000030', 1, 'ruas', null, 4, 'Bahan utama'), -- Jahe
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-200000000045', 0.5, 'buah', null, 5, 'Bahan utama'), -- Jeruk Nipis
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-200000000012', 1, 'batang', null, 6, 'Bahan utama'), -- Daun Bawang
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-200000000004', 4, 'siung', null, 7, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-200000000043', 0.25, 'sdt', null, 8, 'Bumbu dasar'), -- Merica
  ('00000000-0000-4000-8000-300000000020', '00000000-0000-4000-8000-200000000011', 2, 'sdm', null, 9, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000020', 10), ('00000000-0000-4000-8000-300000000020', 15); -- Seafood · Tumisan

-- Tahu Bacem (original) by Bagus Santoso
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-100000000002', 'Tahu Bacem',
   'Tahu direbus dalam air kelapa berbumbu gula merah dan kecap hingga meresap, lalu digoreng sebentar. Manis legit khas Yogyakarta.',
   'https://images.unsplash.com/photo-1658372776607-936e37b8d79a?w=1080&q=80&auto=format&fit=crop',
   10, 35, 'mudah', 4, 'published',
   null,
   '[
     {
       "title": "Haluskan bumbu",
       "text": "Haluskan bawang merah, bawang putih, dan ketumbar.",
       "minutes": 5
     },
     {
       "title": "Rebus bacem",
       "text": "Rebus tahu dengan bumbu halus, gula merah, kecap manis, asam jawa, lengkuas, daun salam, dan 500 ml air.",
       "minutes": 5
     },
     {
       "title": "Masak hingga menyusut",
       "text": "Masak dengan api kecil hingga air habis dan bumbu meresap, sekitar 25 menit.",
       "minutes": 25
     },
     {
       "title": "Goreng",
       "text": "Goreng tahu sebentar hingga kecokelatan. Sajikan hangat.",
       "minutes": 5
     }
   ]'::jsonb,
   '2025-11-22 14:00:00+07', '2025-11-22 14:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000034', 8, 'buah', null, 0, 'Bahan utama'), -- Tahu
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000009', 75, 'gram', null, 1, 'Bahan utama'), -- Gula Merah
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000007', 2, 'sdm', null, 2, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000053', 10, 'gram', null, 3, 'Bahan utama'), -- Asam Jawa
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000029', 1, 'ruas', null, 4, 'Bahan utama'), -- Lengkuas
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000032', 2, 'lembar', null, 5, 'Bahan utama'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000003', 6, 'siung', null, 6, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000004', 4, 'siung', null, 7, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000044', 1, 'sdt', null, 8, 'Bumbu dasar'), -- Ketumbar
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000010', 1, 'sdt', null, 9, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000021', '00000000-0000-4000-8000-200000000011', 200, 'ml', 'untuk menggoreng', 10, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000021', 8), ('00000000-0000-4000-8000-300000000021', 17); -- Kedelai · Lauk

-- Nasi Goreng Seafood (variation of Nasi Goreng Kampung) by Bagus Santoso
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-100000000002', 'Nasi Goreng Seafood',
   'Variasi nasi goreng kampung dengan udang dan cumi segar. Kecap manis dikurangi dan ditambah saus tiram agar rasa laut lebih menonjol.',
   'https://images.unsplash.com/photo-1630914441929-0d8ea69f95e6?w=1080&q=80&auto=format&fit=crop',
   10, 20, 'sedang', 2, 'published',
   'Telur tetap dipakai, tapi saya menambahkan udang dan cumi, mengurangi kecap manis menjadi 1 sdm agar rasa laut lebih terasa, dan menambahkan saus tiram. Cabai merah saya hilangkan supaya manisnya seafood tidak tertutup pedas.',
   '[
     {
       "title": "Siapkan bumbu",
       "text": "Haluskan kasar bawang merah dan bawang putih dengan ulekan. Bersihkan udang dan potong cumi bentuk cincin.",
       "minutes": 6
     },
     {
       "title": "Tumis bumbu dan seafood",
       "text": "Tumis bumbu halus hingga harum, lalu masukkan udang dan cumi. Masak hingga berubah warna, sekitar 3 menit.",
       "minutes": 5
     },
     {
       "title": "Masak telur",
       "text": "Sisihkan seafood ke tepi wajan, masukkan telur lalu orak-arik hingga setengah matang.",
       "minutes": 2
     },
     {
       "title": "Masukkan nasi",
       "text": "Masukkan nasi, kecap manis, dan saus tiram. Aduk rata dengan api besar selama 3 menit.",
       "minutes": 4
     },
     {
       "title": "Bumbui",
       "text": "Taburkan garam, aduk terus hingga nasi kering dan harum.",
       "minutes": 2
     },
     {
       "title": "Sajikan",
       "text": "Taburi daun bawang dan sajikan dengan irisan jeruk nipis bila suka.",
       "minutes": 1
     }
   ]'::jsonb,
   '2026-09-20 19:15:00+07', '2026-09-20 19:15:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000002', 2, 'piring', 'sebaiknya nasi dingin', 0, 'Bahan utama'), -- Nasi Putih
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000001', 2, 'butir', null, 1, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 2, 'Bahan utama'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000007', 1, 'sdm', null, 3, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000015', 150, 'gram', 'kupas', 4, 'Bahan utama'), -- Udang
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000016', 100, 'gram', 'potong cincin', 5, 'Bahan utama'), -- Cumi
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000022', 1, 'sdm', null, 6, 'Bahan utama'), -- Saus Tiram
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000012', 1, 'batang', 'iris tipis', 7, 'Bahan utama'), -- Daun Bawang
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000003', 4, 'siung', null, 8, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 9, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000022', '00000000-0000-4000-8000-200000000011', 3, 'sdm', null, 10, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000022', 1), ('00000000-0000-4000-8000-300000000022', 11); -- Nasi · Hidangan Utama

-- Nasi Goreng Pete (variation of Nasi Goreng Kampung) by Ayu Lestari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-100000000009', 'Nasi Goreng Pete',
   'Nasi goreng kampung dengan petai dan terasi yang ditumis bersama bumbu. Aromanya kuat dan rasanya lebih pedas.',
   'https://images.unsplash.com/photo-1691322161487-0331fae404af?w=1080&q=80&auto=format&fit=crop',
   10, 15, 'mudah', 2, 'published',
   'Menambahkan petai, cabai rawit, dan sedikit terasi bakar ke bumbu ulek. Takaran bahan lain sama seperti resep asli, hanya rasanya jadi lebih pedas dan beraroma.',
   '[
     {
       "title": "Siapkan bumbu",
       "text": "Haluskan bawang merah, bawang putih, cabai merah, cabai rawit, dan terasi. Belah petai menjadi dua.",
       "minutes": 5
     },
     {
       "title": "Tumis bumbu dan petai",
       "text": "Tumis bumbu halus hingga harum, masukkan petai dan masak hingga sedikit layu.",
       "minutes": 4
     },
     {
       "title": "Masak telur",
       "text": "Sisihkan bumbu ke tepi wajan, orak-arik telur hingga setengah matang.",
       "minutes": 2
     },
     {
       "title": "Masukkan nasi",
       "text": "Masukkan nasi dingin, kecap manis, dan garam. Aduk rata dengan api besar.",
       "minutes": 5
     },
     {
       "title": "Sajikan",
       "text": "Taburi daun bawang dan sajikan dengan kerupuk.",
       "minutes": 1
     }
   ]'::jsonb,
   '2026-09-28 20:00:00+07', '2026-09-28 20:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000002', 2, 'piring', null, 0, 'Bahan utama'), -- Nasi Putih
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000001', 2, 'butir', null, 1, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 2, 'Bahan utama'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000007', 2, 'sdm', null, 3, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000012', 1, 'batang', null, 4, 'Bahan utama'), -- Daun Bawang
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000005', 3, 'buah', null, 5, 'Bahan utama'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000050', 15, 'butir', 'belah dua', 6, 'Bahan utama'), -- Petai
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000006', 3, 'buah', null, 7, 'Bahan utama'), -- Cabai Rawit
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000003', 4, 'siung', null, 8, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000051', 0.5, 'sdt', 'bakar', 9, 'Bumbu dasar'), -- Terasi
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 10, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000023', '00000000-0000-4000-8000-200000000011', 3, 'sdm', null, 11, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000023', 1), ('00000000-0000-4000-8000-300000000023', 11); -- Nasi · Hidangan Utama

-- Nasi Goreng Teri (variation of Nasi Goreng Kampung) by Dewi Anggraini
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000024', '00000000-0000-4000-8000-100000000008', 'Nasi Goreng Teri',
   'Nasi goreng kampung versi anak kos: telur dikurangi, diganti ikan teri goreng yang renyah dan asin gurih.',
   'https://images.unsplash.com/photo-1642972420043-4736c570a716?w=1080&q=80&auto=format&fit=crop',
   10, 15, 'mudah', 2, 'published',
   'Telur dikurangi menjadi 1 butir dan ditambah 50 gram ikan teri goreng. Garam tidak dipakai lagi karena teri sudah cukup asin.',
   '[
     {
       "title": "Goreng teri",
       "text": "Cuci ikan teri, tiriskan, lalu goreng hingga renyah. Sisihkan.",
       "minutes": 5
     },
     {
       "title": "Siapkan bumbu",
       "text": "Haluskan bawang merah, bawang putih, dan cabai merah.",
       "minutes": 3
     },
     {
       "title": "Tumis bumbu",
       "text": "Tumis bumbu dengan sisa minyak teri hingga harum. Orak-arik telur di tengah wajan.",
       "minutes": 3
     },
     {
       "title": "Masukkan nasi",
       "text": "Masukkan nasi dingin dan kecap manis. Aduk hingga rata, tanpa tambahan garam karena teri sudah asin.",
       "minutes": 4
     },
     {
       "title": "Sajikan",
       "text": "Campurkan teri goreng dan daun bawang, aduk sebentar, lalu sajikan.",
       "minutes": 1
     }
   ]'::jsonb,
   '2026-10-03 12:30:00+07', '2026-10-03 12:30:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000024', '00000000-0000-4000-8000-200000000002', 2, 'piring', null, 0, 'Bahan utama'), -- Nasi Putih
  ('00000000-0000-4000-8000-300000000024', '00000000-0000-4000-8000-200000000001', 1, 'butir', null, 1, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000024', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 2, 'Bahan utama'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000024', '00000000-0000-4000-8000-200000000007', 2, 'sdm', null, 3, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000024', '00000000-0000-4000-8000-200000000012', 1, 'batang', null, 4, 'Bahan utama'), -- Daun Bawang
  ('00000000-0000-4000-8000-300000000024', '00000000-0000-4000-8000-200000000005', 3, 'buah', null, 5, 'Bahan utama'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000024', '00000000-0000-4000-8000-200000000062', 50, 'gram', null, 6, 'Bahan utama'), -- Ikan Teri
  ('00000000-0000-4000-8000-300000000024', '00000000-0000-4000-8000-200000000003', 4, 'siung', null, 7, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000024', '00000000-0000-4000-8000-200000000011', 4, 'sdm', null, 8, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000024', 1), ('00000000-0000-4000-8000-300000000024', 11); -- Nasi · Hidangan Utama

-- Mie Goreng Jawa (variation of Mie Goreng) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-100000000001', 'Mie Goreng Jawa',
   'Mie goreng ala bakmi Jawa dengan ayam suwir, kol, tomat, dan bumbu kemiri. Dimasak di wajan besar sampai sedikit gosong.',
   'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=1080&q=80&auto=format&fit=crop',
   10, 20, 'sedang', 2, 'published',
   'Sawi hijau diganti kol dan tomat, ditambah ayam suwir dan kemiri pada bumbu. Kecap manis dinaikkan menjadi 4 sdm agar lebih manis seperti bakmi Jawa.',
   '[
     {
       "title": "Siapkan bahan",
       "text": "Rebus ayam lalu suwir. Rebus mie hingga lentur dan tiriskan. Iris kol dan tomat.",
       "minutes": 7
     },
     {
       "title": "Haluskan bumbu",
       "text": "Haluskan bawang merah, bawang putih, dan kemiri sangrai.",
       "minutes": 3
     },
     {
       "title": "Tumis bumbu",
       "text": "Tumis bumbu halus hingga harum, masukkan ayam suwir dan telur, orak-arik.",
       "minutes": 4
     },
     {
       "title": "Masak mie",
       "text": "Masukkan kol, tomat, dan mie. Tuang kecap manis dan garam, aduk dengan api besar hingga sedikit kering.",
       "minutes": 5
     },
     {
       "title": "Sajikan",
       "text": "Taburi daun bawang dan sajikan dengan acar timun.",
       "minutes": 1
     }
   ]'::jsonb,
   '2026-02-22 18:00:00+07', '2026-02-22 18:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000019', 200, 'gram', null, 0, 'Bahan utama'), -- Mie Telur
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000001', 2, 'butir', null, 1, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000017', 100, 'gram', 'rebus dan suwir', 2, 'Bahan utama'), -- Ayam
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000023', 2, 'lembar', null, 3, 'Bahan utama'), -- Kol
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000025', 1, 'buah', null, 4, 'Bahan utama'), -- Tomat
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000007', 4, 'sdm', null, 5, 'Bahan utama'), -- Kecap Manis
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000012', 1, 'batang', null, 6, 'Bahan utama'), -- Daun Bawang
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 7, 'Bahan utama'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000013', 2, 'butir', 'sangrai', 8, 'Bumbu dasar'), -- Kemiri
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000003', 4, 'siung', null, 9, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 10, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000025', '00000000-0000-4000-8000-200000000011', 3, 'sdm', null, 11, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000025', 6), ('00000000-0000-4000-8000-300000000025', 11); -- Mie · Hidangan Utama

-- Soto Ayam Lamongan (variation of Soto Ayam) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-100000000001', 'Soto Ayam Lamongan',
   'Soto ayam kuah kuning pekat ala Lamongan dengan taburan koya gurih. Tanpa tauge, lebih banyak kunyit dan bawang putih.',
   'https://images.unsplash.com/photo-1681378128359-a5c2492a3535?w=1080&q=80&auto=format&fit=crop',
   15, 45, 'sedang', 4, 'published',
   'Tauge saya hilangkan dan ditambah taburan koya khas Lamongan. Kunyit dinaikkan menjadi 3 ruas dan bawang putih menjadi 6 siung supaya kuahnya lebih kuning dan pekat.',
   '[
     {
       "title": "Rebus ayam",
       "text": "Rebus ayam bersama serai, daun salam, dan daun jeruk hingga matang. Angkat ayam, saring kaldu.",
       "minutes": 25
     },
     {
       "title": "Tumis bumbu",
       "text": "Haluskan bawang merah, bawang putih, kunyit, jahe, kemiri, dan merica, lalu tumis hingga harum.",
       "minutes": 5
     },
     {
       "title": "Masak kuah",
       "text": "Masukkan bumbu ke kaldu, bumbui garam, didihkan 10 menit hingga kuah kuning pekat.",
       "minutes": 10
     },
     {
       "title": "Siapkan isian",
       "text": "Goreng dan suwir ayam. Seduh soun, iris kol, rebus telur.",
       "minutes": 8
     },
     {
       "title": "Sajikan",
       "text": "Tata isian di mangkuk, siram kuah, taburi koya, seledri, dan bawang goreng.",
       "minutes": 2
     }
   ]'::jsonb,
   '2026-04-05 10:00:00+07', '2026-04-05 10:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000017', 500, 'gram', null, 0, 'Bahan utama'), -- Ayam
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000064', 50, 'gram', null, 1, 'Bahan utama'), -- Soun
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000023', 3, 'lembar', null, 2, 'Bahan utama'), -- Kol
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000001', 2, 'butir', null, 3, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000063', 2, 'batang', null, 4, 'Bahan utama'), -- Seledri
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000045', 1, 'buah', null, 5, 'Bahan utama'), -- Jeruk Nipis
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000057', 2, 'sdm', null, 6, 'Bahan utama'), -- Bawang Goreng
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000065', 4, 'sdm', null, 7, 'Bahan utama'), -- Koya
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000003', 6, 'siung', null, 8, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000004', 6, 'siung', null, 9, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000031', 3, 'ruas', null, 10, 'Bumbu dasar'), -- Kunyit
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000030', 1, 'ruas', null, 11, 'Bumbu dasar'), -- Jahe
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000013', 3, 'butir', null, 12, 'Bumbu dasar'), -- Kemiri
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000043', 0.5, 'sdt', null, 13, 'Bumbu dasar'), -- Merica
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000028', 2, 'batang', null, 14, 'Bumbu dasar'), -- Serai
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000032', 2, 'lembar', null, 15, 'Bumbu dasar'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000033', 3, 'lembar', null, 16, 'Bumbu dasar'), -- Daun Jeruk
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000010', 1.5, 'sdt', null, 17, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000026', '00000000-0000-4000-8000-200000000011', 2, 'sdm', null, 18, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000026', 2), ('00000000-0000-4000-8000-300000000026', 12); -- Sup · Berkuah

-- Rendang Ayam (variation of Rendang Sapi) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-100000000001', 'Rendang Ayam',
   'Rendang dengan daging ayam yang lebih cepat empuk. Bumbu dan santan sama seperti rendang sapi, waktu masak jauh lebih singkat.',
   'https://images.unsplash.com/photo-1791013010510-41a6fc1911ac?w=1080&q=80&auto=format&fit=crop',
   20, 100, 'sedang', 4, 'published',
   'Daging sapi diganti ayam, sehingga waktu masak berkurang dari 4 jam menjadi sekitar 2 jam. Santan dikurangi menjadi 1 liter dan cabai merah menjadi 10 buah agar pas untuk 4 porsi.',
   '[
     {
       "title": "Haluskan bumbu",
       "text": "Haluskan bawang merah, bawang putih, cabai merah, jahe, kunyit, lengkuas, dan ketumbar.",
       "minutes": 12
     },
     {
       "title": "Siapkan ayam",
       "text": "Potong ayam menjadi 12 bagian, cuci dan tiriskan.",
       "minutes": 8
     },
     {
       "title": "Rebus dengan santan",
       "text": "Masak santan bersama bumbu halus, serai, daun salam, dan daun jeruk hingga mendidih sambil diaduk.",
       "minutes": 15
     },
     {
       "title": "Masak ayam",
       "text": "Masukkan ayam, masak dengan api kecil hingga kuah menyusut dan berminyak.",
       "minutes": 60
     },
     {
       "title": "Keringkan bumbu",
       "text": "Aduk terus hingga bumbu mengering dan berwarna cokelat tua.",
       "minutes": 25
     }
   ]'::jsonb,
   '2026-06-28 08:00:00+07', '2026-06-28 08:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000017', 1000, 'gram', 'potong 12', 0, 'Bahan utama'), -- Ayam
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000027', 1000, 'ml', null, 1, 'Bahan utama'), -- Santan
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000028', 2, 'batang', null, 2, 'Bahan utama'), -- Serai
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000032', 3, 'lembar', null, 3, 'Bahan utama'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000033', 4, 'lembar', null, 4, 'Bahan utama'), -- Daun Jeruk
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000003', 10, 'siung', null, 5, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000004', 5, 'siung', null, 6, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000005', 10, 'buah', null, 7, 'Bumbu dasar'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000030', 1, 'ruas', null, 8, 'Bumbu dasar'), -- Jahe
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000031', 1, 'ruas', null, 9, 'Bumbu dasar'), -- Kunyit
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000029', 2, 'ruas', null, 10, 'Bumbu dasar'), -- Lengkuas
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000044', 1, 'sdt', null, 11, 'Bumbu dasar'), -- Ketumbar
  ('00000000-0000-4000-8000-300000000027', '00000000-0000-4000-8000-200000000010', 1.5, 'sdt', null, 12, 'Bumbu dasar'); -- Garam
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000027', 4), ('00000000-0000-4000-8000-300000000027', 11); -- Ayam · Hidangan Utama

-- Capcay Kuah Seafood (variation of Capcay) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-100000000001', 'Capcay Kuah Seafood',
   'Capcay berkuah kental dengan udang dan cumi sebagai pengganti ayam. Kuahnya dikentalkan sedikit tepung terigu.',
   'https://images.unsplash.com/photo-1678831654352-41a08dd16859?w=1080&q=80&auto=format&fit=crop',
   10, 15, 'mudah', 3, 'published',
   'Ayam diganti udang dan cumi, lalu capcay dibuat berkuah dengan tambahan 300 ml air yang dikentalkan 1 sdm tepung terigu.',
   '[
     {
       "title": "Potong sayuran",
       "text": "Iris wortel, kol, sawi hijau, dan bawang bombay. Bersihkan udang dan cumi.",
       "minutes": 7
     },
     {
       "title": "Tumis aromatik",
       "text": "Tumis bawang putih dan bawang bombay hingga harum.",
       "minutes": 2
     },
     {
       "title": "Masak seafood",
       "text": "Masukkan udang dan cumi, masak hingga berubah warna.",
       "minutes": 3
     },
     {
       "title": "Masukkan sayur dan kuah",
       "text": "Tambahkan wortel, kol, sawi, 300 ml air, saus tiram, kecap asin, dan merica. Didihkan.",
       "minutes": 6
     },
     {
       "title": "Kentalkan",
       "text": "Larutkan tepung terigu dengan sedikit air, tuang ke kuah sambil diaduk hingga mengental.",
       "minutes": 2
     }
   ]'::jsonb,
   '2026-07-19 18:00:00+07', '2026-07-19 18:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000024', 1, 'buah', null, 0, 'Bahan utama'), -- Wortel
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000023', 4, 'lembar', null, 1, 'Bahan utama'), -- Kol
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000052', 2, 'batang', null, 2, 'Bahan utama'), -- Sawi Hijau
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000015', 150, 'gram', null, 3, 'Bahan utama'), -- Udang
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000016', 100, 'gram', null, 4, 'Bahan utama'), -- Cumi
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000021', 0.5, 'buah', null, 5, 'Bahan utama'), -- Bawang Bombay
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000022', 2, 'sdm', null, 6, 'Bahan utama'), -- Saus Tiram
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000008', 1, 'sdm', null, 7, 'Bahan utama'), -- Kecap Asin
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000040', 1, 'sdm', null, 8, 'Bahan utama'), -- Tepung Terigu
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000004', 4, 'siung', null, 9, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000043', 0.5, 'sdt', null, 10, 'Bumbu dasar'), -- Merica
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 11, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000028', '00000000-0000-4000-8000-200000000011', 2, 'sdm', null, 12, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000028', 5), ('00000000-0000-4000-8000-300000000028', 12); -- Sayur · Berkuah

-- Gado-Gado Siram (variation of Gado-Gado) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-100000000001', 'Gado-Gado Siram',
   'Gado-gado ala Jakarta dengan bumbu kacang yang dimasak encer lalu disiram hangat. Memakai kangkung dan tanpa lontong.',
   'https://images.unsplash.com/photo-1592041547077-c110ce62c029?w=1080&q=80&auto=format&fit=crop',
   15, 20, 'mudah', 3, 'published',
   'Bumbu kacang dimasak dengan 250 ml air lalu disiramkan hangat, bukan diulek di cobek. Lontong tidak dipakai, ditambah kangkung rebus dan taburan bawang goreng.',
   '[
     {
       "title": "Rebus sayuran",
       "text": "Rebus kangkung, kacang panjang, kol, dan kentang. Seduh tauge.",
       "minutes": 10
     },
     {
       "title": "Goreng lauk",
       "text": "Goreng tahu dan tempe, potong-potong.",
       "minutes": 7
     },
     {
       "title": "Masak bumbu kacang",
       "text": "Haluskan kacang tanah, cabai rawit, bawang putih, dan gula merah. Masak dengan 250 ml air dan garam hingga mendidih dan sedikit kental.",
       "minutes": 10
     },
     {
       "title": "Siram dan sajikan",
       "text": "Tata sayuran, tahu, tempe, timun, dan telur. Siram bumbu kacang hangat, taburi bawang goreng dan kerupuk.",
       "minutes": 3
     }
   ]'::jsonb,
   '2026-08-23 12:00:00+07', '2026-08-23 12:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000038', 100, 'gram', null, 0, 'Bahan utama'), -- Kangkung
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000049', 5, 'batang', null, 1, 'Bahan utama'), -- Kacang Panjang
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000023', 3, 'lembar', null, 2, 'Bahan utama'), -- Kol
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000037', 100, 'gram', null, 3, 'Bahan utama'), -- Tauge
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000046', 2, 'buah', null, 4, 'Bahan utama'), -- Kentang
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000034', 2, 'buah', null, 5, 'Bahan utama'), -- Tahu
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000035', 100, 'gram', null, 6, 'Bahan utama'), -- Tempe
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000026', 1, 'buah', null, 7, 'Bahan utama'), -- Timun
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000001', 2, 'butir', 'rebus', 8, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000056', null, 'secukupnya', null, 9, 'Bahan utama'), -- Kerupuk
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000057', 2, 'sdm', null, 10, 'Bahan utama'), -- Bawang Goreng
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000036', 150, 'gram', 'goreng', 11, 'Bumbu dasar'), -- Kacang Tanah
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000006', 4, 'buah', null, 12, 'Bumbu dasar'), -- Cabai Rawit
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000004', 2, 'siung', null, 13, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000009', 30, 'gram', null, 14, 'Bumbu dasar'), -- Gula Merah
  ('00000000-0000-4000-8000-300000000029', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 15, 'Bumbu dasar'); -- Garam
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000029', 5), ('00000000-0000-4000-8000-300000000029', 14); -- Sayur · Salad

-- Sayur Lodeh (draft) by Sari Wulandari
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-100000000001', 'Sayur Lodeh',
   'Sayur santan berisi labu siam, kacang panjang, tempe, dan tahu dengan bumbu bawang dan lengkuas.',
   null,
   15, 30, 'mudah', 4, 'draft',
   null,
   '[
     {
       "title": "Potong bahan",
       "text": "Potong labu siam, kacang panjang, tempe, dan tahu.",
       "minutes": 10
     },
     {
       "title": "Tumis bumbu",
       "text": "Haluskan bawang merah, bawang putih, cabai merah, dan kemiri, lalu tumis hingga harum.",
       "minutes": 5
     },
     {
       "title": "Masak dengan santan",
       "text": "Masukkan bumbu ke santan bersama lengkuas dan daun salam. Masukkan sayur, tempe, dan tahu.",
       "minutes": 20
     },
     {
       "title": "Bumbui",
       "text": "Tambahkan gula merah dan garam, masak hingga sayur empuk.",
       "minutes": 5
     }
   ]'::jsonb,
   '2026-10-10 20:00:00+07', '2026-10-12 07:30:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000047', 1, 'buah', null, 0, 'Bahan utama'), -- Labu Siam
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000049', 5, 'batang', null, 1, 'Bahan utama'), -- Kacang Panjang
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000035', 100, 'gram', null, 2, 'Bahan utama'), -- Tempe
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000034', 2, 'buah', null, 3, 'Bahan utama'), -- Tahu
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000027', 700, 'ml', null, 4, 'Bahan utama'), -- Santan
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000029', 1, 'ruas', null, 5, 'Bahan utama'), -- Lengkuas
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000032', 2, 'lembar', null, 6, 'Bahan utama'), -- Daun Salam
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000009', 10, 'gram', null, 7, 'Bahan utama'), -- Gula Merah
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000003', 6, 'siung', null, 8, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 9, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000005', 2, 'buah', null, 10, 'Bumbu dasar'), -- Cabai Merah
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000013', 2, 'butir', null, 11, 'Bumbu dasar'), -- Kemiri
  ('00000000-0000-4000-8000-300000000030', '00000000-0000-4000-8000-200000000010', 1, 'sdt', null, 12, 'Bumbu dasar'); -- Garam
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000030', 5), ('00000000-0000-4000-8000-300000000030', 12); -- Sayur · Berkuah

-- Perkedel Kentang (draft) by Dewi Anggraini
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000031', '00000000-0000-4000-8000-100000000008', 'Perkedel Kentang',
   'Perkedel kentang goreng dengan daun bawang dan merica. Masih dicoba takaran telurnya.',
   null,
   15, 20, 'mudah', 4, 'draft',
   null,
   '[
     {
       "title": "Goreng kentang",
       "text": "Kupas dan potong kentang, goreng hingga matang lalu haluskan selagi panas.",
       "minutes": 15
     },
     {
       "title": "Campur adonan",
       "text": "Campur kentang dengan bawang putih goreng, daun bawang, merica, garam, dan kuning telur.",
       "minutes": 5
     },
     {
       "title": "Bentuk",
       "text": "Bentuk adonan bulat pipih.",
       "minutes": 5
     },
     {
       "title": "Goreng",
       "text": "Celupkan ke putih telur lalu goreng hingga kecokelatan.",
       "minutes": 10
     }
   ]'::jsonb,
   '2026-10-08 21:00:00+07', '2026-10-08 21:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000031', '00000000-0000-4000-8000-200000000046', 4, 'buah', null, 0, 'Bahan utama'), -- Kentang
  ('00000000-0000-4000-8000-300000000031', '00000000-0000-4000-8000-200000000001', 1, 'butir', null, 1, 'Bahan utama'), -- Telur
  ('00000000-0000-4000-8000-300000000031', '00000000-0000-4000-8000-200000000012', 1, 'batang', null, 2, 'Bahan utama'), -- Daun Bawang
  ('00000000-0000-4000-8000-300000000031', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 3, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000031', '00000000-0000-4000-8000-200000000043', 0.5, 'sdt', null, 4, 'Bumbu dasar'), -- Merica
  ('00000000-0000-4000-8000-300000000031', '00000000-0000-4000-8000-200000000010', 0.5, 'sdt', null, 5, 'Bumbu dasar'), -- Garam
  ('00000000-0000-4000-8000-300000000031', '00000000-0000-4000-8000-200000000011', 250, 'ml', 'untuk menggoreng', 6, 'Bumbu dasar'); -- Minyak Goreng
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000031', 5), ('00000000-0000-4000-8000-300000000031', 17); -- Sayur · Lauk

-- Sayur Sop (archived) by Wulan Pertiwi
insert into recipes (id, user_id, title, description, image_url, prep_time_minutes, cook_time_minutes, difficulty, servings, status, change_summary, steps, created_at, updated_at) values
  ('00000000-0000-4000-8000-300000000032', '00000000-0000-4000-8000-100000000006', 'Sayur Sop',
   'Sup sayur bening dengan wortel, kentang, kol, dan buncis. Diarsipkan karena penulis menggabungkannya ke resep lain.',
   'https://images.unsplash.com/photo-1666307545948-c0104580dd19?w=1080&q=80&auto=format&fit=crop',
   10, 25, 'mudah', 4, 'archived',
   null,
   '[
     {
       "title": "Potong sayuran",
       "text": "Potong wortel, kentang, kol, dan buncis.",
       "minutes": 8
     },
     {
       "title": "Tumis bumbu",
       "text": "Tumis bawang putih dan bawang merah hingga harum.",
       "minutes": 2
     },
     {
       "title": "Rebus",
       "text": "Didihkan 1 liter air, masukkan tumisan bawang, wortel, dan kentang.",
       "minutes": 12
     },
     {
       "title": "Masukkan sayur hijau",
       "text": "Masukkan buncis dan kol, bumbui garam dan merica, masak hingga empuk.",
       "minutes": 8
     },
     {
       "title": "Sajikan",
       "text": "Taburi seledri dan bawang goreng.",
       "minutes": 1
     }
   ]'::jsonb,
   '2025-09-27 11:00:00+07', '2026-05-02 09:00:00+07');
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note, position, section) values
  ('00000000-0000-4000-8000-300000000032', '00000000-0000-4000-8000-200000000024', 2, 'buah', null, 0, 'Bahan utama'), -- Wortel
  ('00000000-0000-4000-8000-300000000032', '00000000-0000-4000-8000-200000000046', 2, 'buah', null, 1, 'Bahan utama'), -- Kentang
  ('00000000-0000-4000-8000-300000000032', '00000000-0000-4000-8000-200000000023', 3, 'lembar', null, 2, 'Bahan utama'), -- Kol
  ('00000000-0000-4000-8000-300000000032', '00000000-0000-4000-8000-200000000048', 100, 'gram', null, 3, 'Bahan utama'), -- Buncis
  ('00000000-0000-4000-8000-300000000032', '00000000-0000-4000-8000-200000000063', 1, 'batang', null, 4, 'Bahan utama'), -- Seledri
  ('00000000-0000-4000-8000-300000000032', '00000000-0000-4000-8000-200000000004', 3, 'siung', null, 5, 'Bumbu dasar'), -- Bawang Putih
  ('00000000-0000-4000-8000-300000000032', '00000000-0000-4000-8000-200000000003', 3, 'siung', null, 6, 'Bumbu dasar'), -- Bawang Merah
  ('00000000-0000-4000-8000-300000000032', '00000000-0000-4000-8000-200000000043', 0.5, 'sdt', null, 7, 'Bumbu dasar'), -- Merica
  ('00000000-0000-4000-8000-300000000032', '00000000-0000-4000-8000-200000000010', 1, 'sdt', null, 8, 'Bumbu dasar'); -- Garam
insert into recipe_categories (recipe_id, category_id) values ('00000000-0000-4000-8000-300000000032', 2), ('00000000-0000-4000-8000-300000000032', 12); -- Sup · Berkuah

-- Graph relations (no "uses": recipe_ingredients already represents those) ---
insert into node_relations (source_type, source_id, target_type, target_id, relation_type, label, created_by) values
  -- Nasi Goreng Seafood -> Nasi Goreng Kampung
  ('recipe', '00000000-0000-4000-8000-300000000022', 'recipe', '00000000-0000-4000-8000-300000000001', 'variation_of',
   'Ditambah udang, cumi, dan saus tiram; kecap manis dikurangi', '00000000-0000-4000-8000-100000000002'),
  -- Nasi Goreng Pete -> Nasi Goreng Kampung
  ('recipe', '00000000-0000-4000-8000-300000000023', 'recipe', '00000000-0000-4000-8000-300000000001', 'variation_of',
   'Ditambah petai, cabai rawit, dan terasi bakar', '00000000-0000-4000-8000-100000000009'),
  -- Nasi Goreng Teri -> Nasi Goreng Kampung
  ('recipe', '00000000-0000-4000-8000-300000000024', 'recipe', '00000000-0000-4000-8000-300000000001', 'variation_of',
   'Ditambah ikan teri goreng; telur dikurangi', '00000000-0000-4000-8000-100000000008'),
  -- Mie Goreng Jawa -> Mie Goreng
  ('recipe', '00000000-0000-4000-8000-300000000025', 'recipe', '00000000-0000-4000-8000-300000000011', 'variation_of',
   'Ala bakmi Jawa: ayam suwir, kol, tomat, dan kemiri', '00000000-0000-4000-8000-100000000001'),
  -- Soto Ayam Lamongan -> Soto Ayam
  ('recipe', '00000000-0000-4000-8000-300000000026', 'recipe', '00000000-0000-4000-8000-300000000002', 'variation_of',
   'Versi Lamongan dengan koya, tanpa tauge', '00000000-0000-4000-8000-100000000001'),
  -- Rendang Ayam -> Rendang Sapi
  ('recipe', '00000000-0000-4000-8000-300000000027', 'recipe', '00000000-0000-4000-8000-300000000003', 'variation_of',
   'Daging sapi diganti ayam, waktu masak lebih singkat', '00000000-0000-4000-8000-100000000001'),
  -- Capcay Kuah Seafood -> Capcay
  ('recipe', '00000000-0000-4000-8000-300000000028', 'recipe', '00000000-0000-4000-8000-300000000006', 'variation_of',
   'Ayam diganti udang dan cumi, dibuat berkuah', '00000000-0000-4000-8000-100000000001'),
  -- Gado-Gado Siram -> Gado-Gado
  ('recipe', '00000000-0000-4000-8000-300000000029', 'recipe', '00000000-0000-4000-8000-300000000005', 'variation_of',
   'Bumbu kacang dimasak lalu disiram hangat', '00000000-0000-4000-8000-100000000001'),
  -- Nasi Goreng Kampung -> Nasi Goreng Jawa
  ('recipe', '00000000-0000-4000-8000-300000000001', 'recipe', '00000000-0000-4000-8000-300000000007', 'similar_to',
   'Sama-sama nasi goreng: 4 bahan sama, teknik tumis api besar', '00000000-0000-4000-8000-100000000001'),
  -- Mie Goreng -> Nasi Goreng Kampung
  ('recipe', '00000000-0000-4000-8000-300000000011', 'recipe', '00000000-0000-4000-8000-300000000001', 'similar_to',
   'Sama-sama digoreng dengan kecap manis, telur, dan bawang putih', '00000000-0000-4000-8000-100000000005'),
  -- Opor Ayam -> Soto Ayam
  ('recipe', '00000000-0000-4000-8000-300000000018', 'recipe', '00000000-0000-4000-8000-300000000002', 'similar_to',
   'Sama-sama ayam berkuah dengan bumbu kuning, serai, dan daun salam', '00000000-0000-4000-8000-100000000003'),
  -- Semur Daging -> Rendang Sapi
  ('recipe', '00000000-0000-4000-8000-300000000009', 'recipe', '00000000-0000-4000-8000-300000000003', 'similar_to',
   'Sama-sama daging sapi yang dimasak lama dengan rempah', '00000000-0000-4000-8000-100000000004'),
  -- Tumis Kangkung -> Capcay
  ('recipe', '00000000-0000-4000-8000-300000000019', 'recipe', '00000000-0000-4000-8000-300000000006', 'similar_to',
   'Sama-sama sayur tumis api besar dengan bawang putih dan saus tiram', '00000000-0000-4000-8000-100000000007'),
  -- Telur Balado -> Telur Dadar
  ('recipe', '00000000-0000-4000-8000-300000000013', 'recipe', '00000000-0000-4000-8000-300000000012', 'similar_to',
   'Sama-sama lauk telur sederhana untuk makan sehari-hari', '00000000-0000-4000-8000-100000000001'),
  -- Tahu Bacem -> Tempe Orek
  ('recipe', '00000000-0000-4000-8000-300000000021', 'recipe', '00000000-0000-4000-8000-300000000014', 'similar_to',
   'Sama-sama lauk kedelai bercita rasa manis dari kecap dan gula merah', '00000000-0000-4000-8000-100000000002'),
  -- Sambal Matah -> Sambal Terasi
  ('recipe', '00000000-0000-4000-8000-300000000015', 'recipe', '00000000-0000-4000-8000-300000000017', 'similar_to',
   'Sama-sama sambal pelengkap dari cabai rawit, bawang merah, dan terasi', '00000000-0000-4000-8000-100000000001'),
  -- Ayam Bakar Kecap -> Semur Daging
  ('recipe', '00000000-0000-4000-8000-300000000004', 'recipe', '00000000-0000-4000-8000-300000000009', 'similar_to',
   'Sama-sama dimasak dengan kecap manis hingga bumbu meresap', '00000000-0000-4000-8000-100000000005'),
  -- Udang Saus Tiram -> Capcay
  ('recipe', '00000000-0000-4000-8000-300000000020', 'recipe', '00000000-0000-4000-8000-300000000006', 'similar_to',
   'Sama-sama tumisan cepat dengan saus tiram dan bawang putih', '00000000-0000-4000-8000-100000000009'),
  -- Opor Ayam -> Rendang Sapi
  ('recipe', '00000000-0000-4000-8000-300000000018', 'recipe', '00000000-0000-4000-8000-300000000003', 'inspired_by',
   'Santan dan rempahnya mengikuti rendang, tetapi dimasak singkat dan tetap berkuah', '00000000-0000-4000-8000-100000000003'),
  -- Ayam Bakar Kecap -> Tahu Bacem
  ('recipe', '00000000-0000-4000-8000-300000000004', 'recipe', '00000000-0000-4000-8000-300000000021', 'inspired_by',
   'Ayam diungkep bumbu manis gula merah dan kecap seperti tahu bacem sebelum dibakar', '00000000-0000-4000-8000-100000000005'),
  -- Telur Balado -> Sambal Terasi
  ('recipe', '00000000-0000-4000-8000-300000000013', 'recipe', '00000000-0000-4000-8000-300000000017', 'inspired_by',
   'Bumbu balado dikembangkan dari sambal ulek cabai merah dan tomat', '00000000-0000-4000-8000-100000000001'),
  -- Nasi Goreng Kampung -> Acar Timun
  ('recipe', '00000000-0000-4000-8000-300000000001', 'recipe', '00000000-0000-4000-8000-300000000016', 'pairs_with',
   'Acar timun yang segar menyeimbangkan nasi goreng yang gurih dan manis', '00000000-0000-4000-8000-100000000001'),
  -- Soto Ayam -> Sambal Terasi
  ('recipe', '00000000-0000-4000-8000-300000000002', 'recipe', '00000000-0000-4000-8000-300000000017', 'pairs_with',
   'Sambal menambah pedas pada kuah soto yang ringan', '00000000-0000-4000-8000-100000000003'),
  -- Nasi Uduk -> Tempe Orek
  ('recipe', '00000000-0000-4000-8000-300000000010', 'recipe', '00000000-0000-4000-8000-300000000014', 'pairs_with',
   'Lauk klasik pendamping nasi uduk di pagi hari', '00000000-0000-4000-8000-100000000009'),
  -- Nasi Uduk -> Telur Balado
  ('recipe', '00000000-0000-4000-8000-300000000010', 'recipe', '00000000-0000-4000-8000-300000000013', 'pairs_with',
   'Telur balado pedas manis cocok dengan nasi uduk yang gurih santan', '00000000-0000-4000-8000-100000000009'),
  -- Ayam Bakar Kecap -> Sambal Terasi
  ('recipe', '00000000-0000-4000-8000-300000000004', 'recipe', '00000000-0000-4000-8000-300000000017', 'pairs_with',
   'Ayam bakar manis paling nikmat dicocol sambal terasi', '00000000-0000-4000-8000-100000000005'),
  -- Rendang Sapi -> Tumis Kangkung
  ('recipe', '00000000-0000-4000-8000-300000000003', 'recipe', '00000000-0000-4000-8000-300000000019', 'pairs_with',
   'Tumis kangkung yang segar mengimbangi rendang yang kaya rempah', '00000000-0000-4000-8000-100000000004'),
  -- Semur Daging -> Acar Timun
  ('recipe', '00000000-0000-4000-8000-300000000009', 'recipe', '00000000-0000-4000-8000-300000000016', 'pairs_with',
   'Acar timun menyegarkan semur yang manis dan pekat', '00000000-0000-4000-8000-100000000004'),
  -- Sayur Asem -> Tempe Orek
  ('recipe', '00000000-0000-4000-8000-300000000008', 'recipe', '00000000-0000-4000-8000-300000000014', 'pairs_with',
   'Pasangan makan siang rumahan: sayur asem segar dan tempe orek manis', '00000000-0000-4000-8000-100000000001'),
  -- Telur -> Daun Bawang
  ('ingredient', '00000000-0000-4000-8000-200000000001', 'ingredient', '00000000-0000-4000-8000-200000000012', 'pairs_with',
   'Taburan daun bawang menambah aroma pada telur dadar dan orak-arik', '00000000-0000-4000-8000-100000000010'),
  -- Kecap Manis -> Cabai Rawit
  ('ingredient', '00000000-0000-4000-8000-200000000007', 'ingredient', '00000000-0000-4000-8000-200000000006', 'pairs_with',
   'Dasar sambal kecap sederhana untuk cocolan', '00000000-0000-4000-8000-100000000010'),
  -- Serai -> Lengkuas
  ('ingredient', '00000000-0000-4000-8000-200000000028', 'ingredient', '00000000-0000-4000-8000-200000000029', 'pairs_with',
   'Duo rempah untuk kuah soto, opor, dan bumbu ungkep', '00000000-0000-4000-8000-100000000010'),
  -- Kacang Tanah -> Gula Merah
  ('ingredient', '00000000-0000-4000-8000-200000000036', 'ingredient', '00000000-0000-4000-8000-200000000009', 'pairs_with',
   'Dasar bumbu kacang untuk gado-gado dan pecel', '00000000-0000-4000-8000-100000000010'),
  -- Santan -> Daun Salam
  ('ingredient', '00000000-0000-4000-8000-200000000027', 'ingredient', '00000000-0000-4000-8000-200000000032', 'pairs_with',
   'Daun salam menjaga aroma santan tetap harum saat dimasak lama', '00000000-0000-4000-8000-100000000010'),
  -- Terasi -> Cabai Merah
  ('ingredient', '00000000-0000-4000-8000-200000000051', 'ingredient', '00000000-0000-4000-8000-200000000005', 'pairs_with',
   'Fondasi sambal dan bumbu tumis yang gurih pedas', '00000000-0000-4000-8000-100000000010'),
  -- Cabai Merah -> Cabai Rawit
  ('ingredient', '00000000-0000-4000-8000-200000000005', 'ingredient', '00000000-0000-4000-8000-200000000006', 'substitute_for',
   'Lebih pedas · 1 cabai rawit untuk 2–3 cabai merah', '00000000-0000-4000-8000-100000000010'),
  -- Kemiri -> Kacang Mete
  ('ingredient', '00000000-0000-4000-8000-200000000013', 'ingredient', '00000000-0000-4000-8000-200000000014', 'substitute_for',
   'Pengental bumbu · 2 kacang mete untuk 1 kemiri', '00000000-0000-4000-8000-100000000010'),
  -- Udang -> Ayam
  ('ingredient', '00000000-0000-4000-8000-200000000015', 'ingredient', '00000000-0000-4000-8000-200000000017', 'substitute_for',
   'Pakai ayam suwir dengan takaran yang sama', '00000000-0000-4000-8000-100000000010'),
  -- Mie Telur -> Mie Kering
  ('ingredient', '00000000-0000-4000-8000-200000000019', 'ingredient', '00000000-0000-4000-8000-200000000020', 'substitute_for',
   'Takaran sama, rebus sedikit lebih lama', '00000000-0000-4000-8000-100000000010'),
  -- Daun Bawang -> Bawang Bombay
  ('ingredient', '00000000-0000-4000-8000-200000000012', 'ingredient', '00000000-0000-4000-8000-200000000021', 'substitute_for',
   'Aroma bawang · ¼ buah bombay, iris tipis', '00000000-0000-4000-8000-100000000010'),
  -- Kecap Manis -> Kecap Asin
  ('ingredient', '00000000-0000-4000-8000-200000000007', 'ingredient', '00000000-0000-4000-8000-200000000008', 'substitute_for',
   'Campur dengan gula merah, 1:1', '00000000-0000-4000-8000-100000000010'),
  -- Telur -> Tahu
  ('ingredient', '00000000-0000-4000-8000-200000000001', 'ingredient', '00000000-0000-4000-8000-200000000034', 'substitute_for',
   'Orak-arik, isian · 60 g tahu, dihancurkan', '00000000-0000-4000-8000-100000000010'),
  -- Telur -> Biji Rami
  ('ingredient', '00000000-0000-4000-8000-200000000001', 'ingredient', '00000000-0000-4000-8000-200000000041', 'substitute_for',
   'Pengikat adonan · 1 sdm + 3 sdm air', '00000000-0000-4000-8000-100000000010'),
  -- Telur -> Pisang
  ('ingredient', '00000000-0000-4000-8000-200000000001', 'ingredient', '00000000-0000-4000-8000-200000000039', 'substitute_for',
   'Kue & pancake · ½ buah, dilumatkan', '00000000-0000-4000-8000-100000000010'),
  -- Telur -> Tepung Terigu
  ('ingredient', '00000000-0000-4000-8000-200000000001', 'ingredient', '00000000-0000-4000-8000-200000000040', 'substitute_for',
   'Adonan gorengan · 2 sdm + 3 sdm air', '00000000-0000-4000-8000-100000000010'),
  -- Gula Merah -> Gula Pasir
  ('ingredient', '00000000-0000-4000-8000-200000000009', 'ingredient', '00000000-0000-4000-8000-200000000042', 'substitute_for',
   'Takaran sama, warna dan aroma lebih ringan', '00000000-0000-4000-8000-100000000010'),
  -- Jeruk Nipis -> Asam Jawa
  ('ingredient', '00000000-0000-4000-8000-200000000045', 'ingredient', '00000000-0000-4000-8000-200000000053', 'substitute_for',
   'Rasa asam · 1 sdt air asam untuk 1 buah jeruk nipis', '00000000-0000-4000-8000-100000000010'),
  -- Tempe -> Tahu
  ('ingredient', '00000000-0000-4000-8000-200000000035', 'ingredient', '00000000-0000-4000-8000-200000000034', 'substitute_for',
   'Takaran sama, goreng dulu agar tidak hancur', '00000000-0000-4000-8000-100000000010'),
  -- Daging Sapi -> Ayam
  ('ingredient', '00000000-0000-4000-8000-200000000018', 'ingredient', '00000000-0000-4000-8000-200000000017', 'substitute_for',
   'Takaran sama, waktu masak dipersingkat sekitar setengahnya', '00000000-0000-4000-8000-100000000010'),
  -- Kacang Tanah -> Kacang Mete
  ('ingredient', '00000000-0000-4000-8000-200000000036', 'ingredient', '00000000-0000-4000-8000-200000000014', 'substitute_for',
   'Bumbu kacang lebih lembut, takaran sama', '00000000-0000-4000-8000-100000000010'),
  -- Lengkuas -> Jahe
  ('ingredient', '00000000-0000-4000-8000-200000000029', 'ingredient', '00000000-0000-4000-8000-200000000030', 'substitute_for',
   'Pakai setengah takaran karena aromanya lebih tajam', '00000000-0000-4000-8000-100000000010'),
  -- Bawang Merah -> Bawang Bombay
  ('ingredient', '00000000-0000-4000-8000-200000000003', 'ingredient', '00000000-0000-4000-8000-200000000021', 'substitute_for',
   '½ buah bombay untuk 5 siung bawang merah', '00000000-0000-4000-8000-100000000010');

-- Bookmarks and pantry for Sari ----------------------------------------------
insert into saved_recipes (user_id, recipe_id, created_at) values
  ('00000000-0000-4000-8000-100000000001', '00000000-0000-4000-8000-300000000002', '2026-05-20 08:00:00+07'), -- Soto Ayam
  ('00000000-0000-4000-8000-100000000001', '00000000-0000-4000-8000-300000000003', '2026-06-02 19:30:00+07'), -- Rendang Sapi
  ('00000000-0000-4000-8000-100000000001', '00000000-0000-4000-8000-300000000007', '2026-09-13 07:45:00+07'), -- Nasi Goreng Jawa
  ('00000000-0000-4000-8000-100000000001', '00000000-0000-4000-8000-300000000005', '2026-09-25 12:10:00+07'), -- Gado-Gado
  ('00000000-0000-4000-8000-100000000001', '00000000-0000-4000-8000-300000000020', '2026-10-01 18:00:00+07'); -- Udang Saus Tiram
insert into pantry_items (user_id, ingredient_id, created_at) values
  ('00000000-0000-4000-8000-100000000001', '00000000-0000-4000-8000-200000000001', '2026-10-01 07:00:00+07'), -- Telur
  ('00000000-0000-4000-8000-100000000001', '00000000-0000-4000-8000-200000000002', '2026-10-01 07:00:00+07'), -- Nasi Putih
  ('00000000-0000-4000-8000-100000000001', '00000000-0000-4000-8000-200000000004', '2026-10-01 07:00:00+07'), -- Bawang Putih
  ('00000000-0000-4000-8000-100000000001', '00000000-0000-4000-8000-200000000007', '2026-10-01 07:00:00+07'); -- Kecap Manis

commit;
