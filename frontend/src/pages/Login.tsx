import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { useAuth } from '../auth/AuthProvider';

export default function Login() {
  const navigate = useNavigate();
  const { login, status, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard', {
        replace: true,
      });
    }
  }, [navigate, status, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('SUBMIT_START', { email, password });

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      console.log('BEFORE_LOGIN');
      const loggedUser = await login({ email, password });
      console.log('LOGIN_SUCCESS', loggedUser);

      navigate(loggedUser.role === 'ADMIN' ? '/admin' : '/dashboard', {
        replace: true,
      });
    } catch (error) {
      console.log('LOGIN_ERROR', error);
      setErrorMessage('Identifiant ou mot de passe invalide.');
    } finally {
      console.log('SUBMIT_END');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4 font-body-md">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block mb-6 group">
            <span
              className="font-headline-xl font-black text-5xl text-on-primary"
              style={{ textShadow: '4px 4px 0 #1a1c1c' }}
            >
              SmartRoom
            </span>
          </Link>
          <h2 className="font-headline-lg font-black text-[32px] text-surface-container-lowest uppercase">Bienvenue</h2>
          <p className="font-body-lg font-bold text-primary-fixed-dim mt-2">
            Connectez-vous pour gérer vos réservations
          </p>
        </div>

        <div className="bg-surface-container-lowest border-[3px] border-on-surface neo-shadow flex flex-col">
          <div className="bg-secondary-fixed border-b-[3px] border-on-surface text-center py-6">
            <span className="material-symbols-outlined text-[64px] text-on-secondary-fixed mb-2">account_circle</span>
            <h3 className="font-headline-md font-bold text-[24px] text-on-secondary-fixed">Connexion</h3>
          </div>

          <div className="p-8 space-y-6">
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                <div>
                  <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">
                    Identifiant / Email
                  </label>
                  <Input
                    type="email"
                    placeholder="jean.dupont@entreprise.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">Mot de passe</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {errorMessage ? (
                <p className="text-sm font-bold text-on-error-container bg-error-container neo-border p-3">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                onClick={()=> console.log("BOUTTON_CLICK")}
                disabled={isSubmitting}
                className="w-full bg-primary text-on-primary font-headline-md font-bold text-[20px] py-3 border-[3px] border-on-surface neo-shadow neo-shadow-hover neo-shadow-active transition-all rounded-DEFAULT flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">login</span>
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            {/* <div className="text-center mt-4 flex flex-col gap-2">
              <a href="#" className="font-label-bold font-bold text-primary hover:underline">
                Mot de passe oublié ?
              </a>
              <Link
                to="/register"
                className="font-label-bold font-bold text-on-surface-variant hover:text-primary hover:underline"
              >
                Pas encore de compte ? S'inscrire
              </Link>
            </div> */}
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="font-label-bold font-bold text-on-primary hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
