import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        toast.success("Connexion réussie !");
      } else {
        toast.error("Identifiants incorrects");
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleForgotPassword = () => {
    toast.info("Fonctionnalité de récupération de mot de passe en développement");
  };

  // Boutons de démonstration pour tester différents rôles
  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("demo123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md">
        {/* Logo FDSUT */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary rounded-full mb-4">
            <span className="text-2xl font-bold text-primary-foreground">FDSUT</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Système de Gestion des Congés
          </h1>
          <p className="text-muted-foreground mt-2">
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Boutons de démonstration */}
        <Card className="mb-4 bg-accent/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Mode Démonstration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => quickLogin('amadou.diallo@fdsut.com')}
              >
                Employé
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => quickLogin('fatou.ndiaye@fdsut.com')}
              >
                Chef Cellule
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => quickLogin('ousmane.ba@fdsut.com')}
              >
                Chef Service
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => quickLogin('awa.sarr@fdsut.com')}
              >
                RH
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => quickLogin('ibrahima.fall@fdsut.com')}
            >
              Administrateur
            </Button>
          </CardContent>
        </Card>

        {/* Formulaire de connexion */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour accéder au système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@fdsut.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-4 pt-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Connexion en cours..." : "Se connecter"}
                </Button>
                
                <Button 
                  type="button"
                  variant="ghost"
                  className="w-full text-primary hover:text-primary"
                  onClick={handleForgotPassword}
                >
                  Mot de passe oublié ?
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>© 2024 FDSUT - Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;