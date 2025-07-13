-- Mettre à jour le mot de passe pour le compte admin
UPDATE auth.users 
SET encrypted_password = crypt('Admin123', gen_salt('bf'))
WHERE email = 'sileymanedia45@gmail.com';