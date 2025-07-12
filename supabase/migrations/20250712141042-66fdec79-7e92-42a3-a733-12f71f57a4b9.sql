-- Forcer le nettoyage complet avec CASCADE
TRUNCATE public.user_roles CASCADE;
TRUNCATE public.profiles CASCADE;

-- Supprimer manuellement tous les utilisateurs auth s'il en reste
DO $$
BEGIN
  DELETE FROM auth.users;
END $$;

-- Maintenant créer le compte admin
INSERT INTO auth.users (
  id,
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
  'admin@entreprise.ma',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  'authenticated',
  'authenticated'
);

-- Obtenir l'ID du nouvel utilisateur et créer son profil
WITH new_admin AS (
  SELECT id FROM auth.users WHERE email = 'admin@entreprise.ma'
)
INSERT INTO public.profiles (user_id, email, first_name, last_name, department, position, must_change_password)
SELECT id, 'admin@entreprise.ma', 'Admin', 'Principal', 'Direction', 'Administrateur', true
FROM new_admin;

-- Assigner le rôle
WITH new_admin AS (
  SELECT id FROM auth.users WHERE email = 'admin@entreprise.ma'
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM new_admin;