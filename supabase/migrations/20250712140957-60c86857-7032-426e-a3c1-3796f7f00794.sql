-- Créer un compte admin simple et fonctionnel
-- Cette approche utilise les fonctionnalités natives de Supabase

-- D'abord, on insère l'utilisateur dans auth.users avec les champs requis uniquement
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
  '{"first_name": "Admin", "last_name": "System"}',
  'authenticated',
  'authenticated'
);

-- Ensuite on récupère l'ID de cet utilisateur et on crée son profil
INSERT INTO public.profiles (user_id, email, first_name, last_name, department, position, must_change_password)
SELECT 
  id,
  'admin@entreprise.ma',
  'Admin',
  'System',
  'IT',
  'Administrateur',
  true
FROM auth.users 
WHERE email = 'admin@entreprise.ma';

-- Enfin on lui assigne le rôle admin
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'admin'::app_role
FROM auth.users 
WHERE email = 'admin@entreprise.ma';