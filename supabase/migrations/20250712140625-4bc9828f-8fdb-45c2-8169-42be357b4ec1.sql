-- Créer un compte admin initial
-- Note: Vous devrez ensuite vous connecter avec ce compte et changer le mot de passe

-- Insérer un utilisateur admin dans auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@votre-organisation.com',
  crypt('AdminTemp123!', gen_salt('bf')), -- Mot de passe temporaire: AdminTemp123!
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Admin","last_name":"Principal"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Récupérer l'ID de l'utilisateur admin créé
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@votre-organisation.com' LIMIT 1
)
-- Insérer le profil admin
INSERT INTO public.profiles (user_id, email, first_name, last_name, department, position, must_change_password)
SELECT 
  id,
  'admin@votre-organisation.com',
  'Admin',
  'Principal',
  'Direction',
  'Administrateur',
  true
FROM admin_user;

-- Assigner le rôle admin
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@votre-organisation.com' LIMIT 1
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM admin_user;