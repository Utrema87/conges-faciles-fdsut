-- Supprimer le profil orphelin qui bloque la création d'admin
DELETE FROM public.profiles WHERE email = 'abaldia0@gmail.com' AND user_id = 'cb46b7c7-85d0-445c-8d47-22b136ede67a';