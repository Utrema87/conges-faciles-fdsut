-- Nettoyer complètement pour repartir à zéro
TRUNCATE public.user_roles CASCADE;
TRUNCATE public.profiles CASCADE;
DELETE FROM auth.users;

-- Créer le compte admin avec les paramètres demandés
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
  'sileymanedia45@gmail.com',
  crypt('Admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "Principal"}',
  'authenticated',
  'authenticated'
);

-- Le trigger handle_new_user va automatiquement créer le profil
-- Maintenant on met à jour le profil avec les bonnes informations
UPDATE public.profiles 
SET 
  department = 'Direction',
  position = 'Administrateur',
  must_change_password = false
WHERE email = 'sileymanedia45@gmail.com';

-- Assigner le rôle admin
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles 
WHERE email = 'sileymanedia45@gmail.com';