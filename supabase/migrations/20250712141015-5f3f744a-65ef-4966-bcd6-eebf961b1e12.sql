-- Nettoyer tous les comptes existants pour repartir à zéro
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
DELETE FROM auth.users;

-- Créer un seul compte admin propre
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
  '00000000-0000-0000-0000-000000000001',
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

-- Créer le profil admin
INSERT INTO public.profiles (user_id, email, first_name, last_name, department, position, must_change_password)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@entreprise.ma',
  'Admin',
  'Principal',
  'Direction',
  'Administrateur',
  true
);

-- Assigner le rôle admin
INSERT INTO public.user_roles (user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin'::app_role
);