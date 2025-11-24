import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types";

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  position: string;
  cellule?: string;
  service?: string;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string | null;
  position: string | null;
  user_id: string;
  roles?: { role: string }[];
}

export const adminService = {
  // Créer un nouvel utilisateur via Edge Function
  async createUser(userData: CreateUserData) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `https://gazgeminiofjtbunnclv.supabase.co/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            department: userData.department,
            position: userData.position,
          }),
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

      return { success: true, userId: result.userId };
    } catch (error: any) {
      console.error('Erreur création utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  // Récupérer tous les utilisateurs avec leurs rôles
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      if (error) throw error;
      
      // Récupérer les rôles séparément
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        roles: (roles || []).filter(r => r.user_id === profile.user_id).map(r => ({ role: String(r.role) }))
      }));
      
      return usersWithRoles;
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      return [];
    }
  },

  // Récupérer les utilisateurs par rôle
  async getUsersByRole(role: UserRole): Promise<UserProfile[]> {
    try {
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', role);

      if (roleError) throw roleError;

      const userIds = (userRoles || []).map(r => r.user_id);
      
      if (userIds.length === 0) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds)
        .order('first_name');

      if (error) throw error;
      
      const usersWithRoles = (data || []).map(profile => ({
        ...profile,
        roles: [{ role: String(role) }]
      }));

      return usersWithRoles;
    } catch (error) {
      console.error('Erreur récupération utilisateurs par rôle:', error);
      return [];
    }
  },

  // Supprimer un utilisateur via Edge Function
  async deleteUser(userId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `https://gazgeminiofjtbunnclv.supabase.co/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erreur suppression utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  // Mettre à jour un utilisateur
  async updateUser(userId: string, updates: Partial<UserProfile>) {
    try {
      const updateData: Record<string, any> = {};
      if (updates.first_name !== undefined) updateData.first_name = updates.first_name;
      if (updates.last_name !== undefined) updateData.last_name = updates.last_name;
      if (updates.department !== undefined) updateData.department = updates.department;
      if (updates.position !== undefined) updateData.position = updates.position;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Erreur mise à jour utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  // Mettre à jour le rôle d'un utilisateur
  async updateUserRole(userId: string, newRole: UserRole) {
    try {
      // Supprimer l'ancien rôle
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Ajouter le nouveau rôle
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role: newRole as any
        }]);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Erreur mise à jour rôle:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtenir les statistiques
  async getStatistics() {
    try {
      // Compter les utilisateurs
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // Compter les demandes de congés
      const { count: requestCount, error: requestError } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true });

      if (requestError) throw requestError;

      // Compter les demandes en attente
      const { count: pendingCount, error: pendingError } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .like('status', 'pending%');

      if (pendingError) throw pendingError;

      return {
        totalUsers: userCount || 0,
        totalRequests: requestCount || 0,
        pendingRequests: pendingCount || 0,
      };
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      return {
        totalUsers: 0,
        totalRequests: 0,
        pendingRequests: 0,
      };
    }
  },

  // Obtenir le nombre d'utilisateurs par rôle
  async getRoleDistribution() {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role');

      if (error) throw error;

      const distribution = (data || []).reduce((acc: Record<string, number>, item) => {
        const role = String(item.role);
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      return distribution;
    } catch (error) {
      console.error('Erreur distribution des rôles:', error);
      return {};
    }
  }
};
