-- Solution: utiliser le trigger automatique à notre avantage
-- D'abord nettoyer complètement
TRUNCATE public.user_roles CASCADE;
TRUNCATE public.profiles CASCADE;
DELETE FROM auth.users;

-- Créer l'utilisateur admin avec les métadonnées pour le trigger
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
  '{"first_name": "Admin", "last_name": "Principal"}',
  'authenticated',
  'authenticated'
);

-- Le trigger a créé le profil, maintenant on le met à jour avec les bonnes infos
UPDATE public.profiles 
SET 
  department = 'Direction',
  position = 'Administrateur',
  must_change_password = true
WHERE email = 'admin@entreprise.ma';

-- Assigner le rôle admin
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles 
WHERE email = 'admin@entreprise.ma';