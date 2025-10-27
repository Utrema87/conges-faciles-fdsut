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
  // Créer un nouvel utilisateur
  async createUser(userData: CreateUserData) {
    try {
      // 1. Créer le compte d'authentification via l'API admin
      // Note: Cela nécessite les privilèges admin dans Supabase
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Utilisateur non créé");

      const userId = authData.user.id;

      // 2. Créer le profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          department: userData.department,
          position: userData.position
        });

      if (profileError) throw profileError;

      // 3. Assigner le rôle
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: userData.role
        });

      if (roleError) throw roleError;

      return { success: true, userId };
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

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.user_id).map(r => ({ role: r.role })) || []
      })) || [];
      
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

      const userIds = userRoles?.map(r => r.user_id) || [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds)
        .order('first_name');

      if (error) throw error;
      
      const usersWithRoles = data?.map(profile => ({
        ...profile,
        roles: [{ role }]
      })) || [];

      return usersWithRoles;
    } catch (error) {
      console.error('Erreur récupération utilisateurs par rôle:', error);
      return [];
    }
  },

  // Supprimer un utilisateur
  async deleteUser(userId: string) {
    try {
      // Supabase gère les suppressions en cascade via les foreign keys
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Erreur suppression utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  // Mettre à jour un utilisateur
  async updateUser(userId: string, updates: Partial<UserProfile>) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: updates.first_name,
          last_name: updates.last_name,
          department: updates.department,
          position: updates.position
        })
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
        .insert({
          user_id: userId,
          role: newRole
        });

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

      const distribution = data.reduce((acc: Record<string, number>, { role }) => {
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
