-- Assigner le rôle admin à l'utilisateur existant
INSERT INTO public.user_roles (user_id, role)
VALUES ('cb46b7c7-85d0-445c-8d47-22b136ede67a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;