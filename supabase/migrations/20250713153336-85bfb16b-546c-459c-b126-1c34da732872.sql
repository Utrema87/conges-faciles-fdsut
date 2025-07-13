-- Nettoyer complètement en désactivant temporairement les triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Nettoyer toutes les tables
TRUNCATE public.user_roles CASCADE;
TRUNCATE public.profiles CASCADE;
DELETE FROM auth.users;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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

-- Mettre à jour le profil créé par le trigger
UPDATE public.profiles 
SET 
  department = 'Direction',
  position = 'Administrateur',
  must_change_password = false
WHERE email = 'admin@demo.com';

-- Assigner le rôle admin
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles 
WHERE email = 'admin@demo.com';