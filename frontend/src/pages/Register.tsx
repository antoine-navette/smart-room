import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Icon } from '../components/ui/Icon';

export default function Register() {
    return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4 font-body-md py-12">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                    <Link to="/" className="inline-block mb-6 group">
                        <span
                            className="font-headline-xl font-black text-5xl text-on-primary tracking-widest uppercase"
                            style={{ textShadow: '4px 4px 0 #1a1c1c' }}
                        >
                            SmartRoom
                        </span>
                    </Link>
                    <h2 className="font-headline-lg font-black text-[32px] text-surface-container-lowest uppercase">
                        Créer un compte
                    </h2>
                    <p className="font-body-lg font-bold text-primary-fixed-dim mt-2">
                        Rejoignez-nous pour gérer vos réservations
                    </p>
                </div>

                <div className="bg-surface-container-lowest border-[3px] border-on-surface neo-shadow flex flex-col">
                    <div className="bg-tertiary-fixed border-b-[3px] border-on-surface text-center py-6">
                        <Icon name="person_add" className="text-[64px] text-on-tertiary-fixed mb-2" />
                        <h3 className="font-headline-md font-bold text-[24px] text-on-tertiary-fixed">Inscription</h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">
                                        Nom
                                    </label>
                                    <Input placeholder="Dupont" />
                                </div>
                                <div>
                                    <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">
                                        Prénom
                                    </label>
                                    <Input placeholder="Jean" />
                                </div>
                            </div>

                            <div>
                                <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">
                                    Email
                                </label>
                                <Input type="email" placeholder="jean.dupont@entreprise.com" />
                            </div>

                            <div>
                                <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">
                                    Mot de passe
                                </label>
                                <Input type="password" placeholder="••••••••" />
                            </div>

                            <div>
                                <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">
                                    Genre
                                </label>
                                <div className="relative">
                                    <Icon
                                        name="wc"
                                        className="absolute left-3 top-3 text-on-surface-variant pointer-events-none"
                                    />
                                    <select className="flex h-12 w-full bg-white pl-10 pr-4 py-2 text-base border-[3px] border-on-surface shadow-[4px_4px_0px_0px_#1A1D5C] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#1A1D5C] transition-all disabled:cursor-not-allowed disabled:opacity-50 font-body appearance-none cursor-pointer">
                                        <option value="" disabled selected>
                                            Sélectionnez votre genre
                                        </option>
                                        <option value="homme">Homme</option>
                                        <option value="femme">Femme</option>
                                        <option value="non-renseigne">Non-renseigné</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button className="w-full bg-primary text-on-primary font-headline-md font-bold text-[20px] py-3 border-[3px] border-on-surface neo-shadow neo-shadow-hover neo-shadow-active transition-all flex justify-center items-center gap-2">
                            <Icon name="how_to_reg" />
                            S'inscrire
                        </button>

                        <div className="text-center mt-4">
                            <Link to="/login" className="font-label-bold font-bold text-primary hover:underline">
                                Déjà un compte ? Se connecter
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link to="/" className="font-label-bold font-bold text-on-primary hover:underline">
                        ← Continuer sans se connecter
                    </Link>
                </div>
            </div>
        </div>
    );
}
