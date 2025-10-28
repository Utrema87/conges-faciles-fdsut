-- Supprimer l'admin de démo existant pour permettre la création d'un nouvel admin
DELETE FROM public.user_roles WHERE user_id = 'ff8f925d-8bd1-46ef-aaf9-3773e7839e5d';
DELETE FROM public.profiles WHERE user_id = 'ff8f925d-8bd1-46ef-aaf9-3773e7839e5d';