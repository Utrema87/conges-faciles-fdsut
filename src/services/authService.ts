/**
 * Service d'Authentification
 * 
 * Ce service encapsule toute la logique d'authentification avec Supabase Auth,
 * incluant la gestion des sessions, le chargement des profils utilisateur,
 * et la synchronisation des métadonnées.
 */

import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';
import { Session, AuthError } from '@supabase/supabase-js';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
  requiresEmailVerification?: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordUpdateRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface SessionInfo {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  expiresAt: Date | null;
}

// ============================================================================
// SERVICE D'AUTHENTIFICATION
// ============================================================================

export class AuthService {
  /**
   * Connexion avec email et mot de passe
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error),
        };
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: 'Session invalide',
        };
      }

      // Charger le profil complet de l'utilisateur
      const user = await this.loadUserProfile(data.user.id);

      if (!user) {
        return {
          success: false,
          error: 'Impossible de charger le profil utilisateur',
        };
      }

      return {
        success: true,
        user,
        session: data.session,
      };
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      return {
        success: false,
        error: 'Une erreur inattendue est survenue',
      };
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  static async signup(signupData: SignupData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            department: signupData.department || '',
            position: signupData.position || '',
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error),
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Impossible de créer le compte',
        };
      }

      // Vérifier si la confirmation par email est requise
      const requiresVerification = !data.session;

      if (data.session) {
        const user = await this.loadUserProfile(data.user.id);
        return {
          success: true,
          user: user || undefined,
          session: data.session,
        };
      }

      return {
        success: true,
        requiresEmailVerification: requiresVerification,
      };
    } catch (error) {
      console.error('[AuthService] Signup error:', error);
      return {
        success: false,
        error: 'Une erreur inattendue est survenue',
      };
    }
  }

  /**
   * Déconnexion
   */
  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      throw error;
    }
  }

  /**
   * Obtenir la session courante
   */
  static async getCurrentSession(): Promise<SessionInfo> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return {
          user: null,
          session: null,
          isAuthenticated: false,
          expiresAt: null,
        };
      }

      const user = await this.loadUserProfile(session.user.id);

      return {
        user,
        session,
        isAuthenticated: !!user,
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
      };
    } catch (error) {
      console.error('[AuthService] Get session error:', error);
      return {
        user: null,
        session: null,
        isAuthenticated: false,
        expiresAt: null,
      };
    }
  }

  /**
   * Rafraîchir la session
   */
  static async refreshSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        return null;
      }

      return data.session;
    } catch (error) {
      console.error('[AuthService] Refresh session error:', error);
      return null;
    }
  }

  /**
   * Demander une réinitialisation de mot de passe
   */
  static async requestPasswordReset(request: PasswordResetRequest): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error),
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('[AuthService] Password reset request error:', error);
      return {
        success: false,
        error: 'Une erreur inattendue est survenue',
      };
    }
  }

  /**
   * Mettre à jour le mot de passe
   */
  static async updatePassword(request: PasswordUpdateRequest): Promise<AuthResponse> {
    try {
      if (request.newPassword !== request.confirmPassword) {
        return {
          success: false,
          error: 'Les mots de passe ne correspondent pas',
        };
      }

      const { error } = await supabase.auth.updateUser({
        password: request.newPassword,
      });

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error),
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('[AuthService] Update password error:', error);
      return {
        success: false,
        error: 'Une erreur inattendue est survenue',
      };
    }
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  static async hasRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', role)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('[AuthService] Check role error:', error);
      return false;
    }
  }

  /**
   * Obtenir tous les rôles d'un utilisateur
   */
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error || !data) {
        return [];
      }

      return data.map(r => r.role as UserRole);
    } catch (error) {
      console.error('[AuthService] Get user roles error:', error);
      return [];
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES - HELPERS
  // ============================================================================

  /**
   * Charger le profil complet de l'utilisateur avec ses rôles
   */
  private static async loadUserProfile(userId: string): Promise<User | null> {
    try {
      // Récupérer le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        console.error('[AuthService] Profile load error:', profileError);
        return null;
      }

      // Récupérer les rôles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('[AuthService] Roles load error:', rolesError);
      }

      // Prendre le premier rôle ou 'employee' par défaut
      const userRole = (roles?.[0]?.role as UserRole) || 'employee';

      // Construire l'objet User
      const user: User = {
        id: userId,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: userRole,
        department: profile.department || '',
        position: profile.position || '',
        leaveBalance: 30, // TODO: Récupérer depuis une table de soldes de congés
      };

      return user;
    } catch (error) {
      console.error('[AuthService] Load user profile error:', error);
      return null;
    }
  }

  /**
   * Convertir les erreurs Supabase en messages utilisateur
   */
  private static getErrorMessage(error: AuthError): string {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Email ou mot de passe incorrect',
      'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
      'User already registered': 'Cet email est déjà utilisé',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
      'Invalid email': 'Adresse email invalide',
      'Signup requires a valid password': 'Mot de passe requis',
    };

    return errorMessages[error.message] || error.message || 'Une erreur est survenue';
  }
}

// ============================================================================
// HOOKS ET LISTENERS
// ============================================================================

/**
 * Type pour les callbacks d'événements d'authentification
 */
export type AuthEventCallback = (event: string, session: Session | null) => void;

/**
 * Écouter les changements d'état d'authentification
 */
export function onAuthStateChange(callback: AuthEventCallback): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );

  // Retourner une fonction de nettoyage
  return () => subscription.unsubscribe();
}

/**
 * Vérifier si une session est expirée
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session?.expires_at) return true;
  
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  
  return expiresAt <= now;
}

/**
 * Obtenir le temps restant avant expiration (en minutes)
 */
export function getSessionTimeRemaining(session: Session | null): number {
  if (!session?.expires_at) return 0;
  
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  
  return Math.max(0, Math.floor(diffMs / 1000 / 60));
}
