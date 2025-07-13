-- Nettoyer complètement la base de données
TRUNCATE public.user_roles CASCADE;
TRUNCATE public.profiles CASCADE;
DELETE FROM auth.users;

-- Créer un nouveau compte admin
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@demo.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "Demo"}',
  'authenticated',
  'authenticated'
);

-- Créer le profil admin
INSERT INTO public.profiles (user_id, email, first_name, last_name, department, position, must_change_password)
SELECT 
  id,
  email,
  'Admin',
  'Demo', 
  'Direction',
  'Administrateur',
  false
FROM auth.users 
WHERE email = 'admin@demo.com';

-- Assigner le rôle admin
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'admin'::app_role
FROM auth.users 
WHERE email = 'admin@demo.com';