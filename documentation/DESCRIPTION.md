# SMARTROOM PROJECT
Application web et mobile de réservation intelligente de salles en entreprise.

Elle vise à optimiser l’utilisation des espaces, simplifier la planification des
réunions et éviter les conflits de réservation, tout en offrant une expérience
fluide et connectée aux outils de l’entreprise (SSO, calendriers,
messageries)

Créée par Antoine NAVETTE, Hugo SCHENK et Livia KOLETZKI (+ Frédéric BOUTOU, parti trop tôt.)

## Architecture
### ARCHITECTURAL DRIVERS
**Fonctionnels**
- Authentification & rôles ;
- Création de réservations en temps réel (date/heure/durée), récurrence, privée/publique, nb participants... ;
- Recherche avec filtres (capacité, équipement, bâtiment/étage, disponibilité) ;
- Favoris ;
- Plan interactif ;
- Mes réservations (passées/futures, modifier, annuler, gérer récurrence...) ;
- Intégration calendriers ;
- Notifications ;
- Gestion des salles (matériel, maintenance...);
- Guide utilisateur ;
- Statistiques et rapports d’occupation

**Qualité**
- Performance & réactivité (recherche rapide, autosuggest, disponibilité en temps réel) ;
- Cohérence : invariants métiers (pas de conflit, capacité respectée, exceptions correctes) ;
- Simplicité d’utilisation (UX intuitive) ;
- Sécurité des données (droits, authentification) ;
- Maintenabilité et évolutivité ;
- Rapidité de réponse (< 2 s)

**Technologiques**
- Stockage : DB relationnelle (index roomId + start/end) ;
- Intégrations possibles : SSO (SAML/OIDC), calendriers (Graph/Google), messagerie
(SMTP/Graph/Slack), plan (service carto interne) ;
- Événementiel : événements ReservationCreated|Updated|Cancelled ;
- Hébergement sur serveur interne ou cloud

**Organisationnels**
- Onboarding & formation : guide utilisateur, tutoriels, FAQ ;
- Support & exploitation : runbook incidents, etc. ;
- Utilisation interne à l’entreprise ;
- Petites équipes de développement ;
- Budget limité mais volonté d’évolution future

### FACTEURS DE SELECTION
#### Principaux critères issus des Architectural Drivers :
Sécurité des données : authentification, gestion des droits, protection des informations
Performance & réactivité : rapidité de réponse, disponibilité en temps réel
Évolutivité & maintenabilité : architecture modulaire, documentation claire
Scalabilité / Hébergement : capacité à s’adapter à la charge, choix interne ou cloud
Interopérabilité : intégrations externes (SSO, calendriers, messagerie)
Contexte organisationnel : équipe réduite, budget limité, usage interne

#### Hiérarchisation et impact sur l’architecture :
| Facteur                       | Importance | Impact principal                                              |
|------------------------------|------------|----------------------------------------------------------------|
| Sécurité des données         | 4/5        | Authentification forte, isolation des environnements          |
| Performance & réactivité     | 4/5        | Indexation BDD, cache, architecture orientée événements       |
| Évolutivité & maintainabilité | 3/5        | Modules découplés, documentation claire                       |
| Simplicité / Budget limité   | 3/5        | Solutions internes, limiter la complexité                     |
| Scalabilité / Hébergement    | 2/5        | Choix entre serveur interne ou cloud                          |
| Interopérabilité             | 2/5        | API REST, intégrations SSO/Graph/SMTP                         |

Ces priorités orientent les choix techniques futurs : une architecture simple, sécurisée et performante,
adaptée aux ressources limitées mais ouverte à l’évolution.

### IDENTIFICATION DES RISQUES
| Famille d’architectures     | Risque global estimé   | Impact potentiel sur SmartRoom                                         |
|-----------------------------|--------------------------|-------------------------------------------------------------------------|
| Classiques                  | Modéré                   | Peu risquées au départ, mais évolutivité limitée à moyen terme         |
| Modulaires                  | Faible à modéré          | Bon équilibre entre complexité et évolutivité                           |
| Centrées domaine            | Modéré à élevé           | Architecture robuste mais complexe pour une petite équipe              |
| Distribuées / Cloud         | Élevé                    | Surdimensionnées pour un projet interne et limité en ressources        |
| Flux / Données              | Modéré                   | Adaptées aux gros volumes de données, peu utiles ici                   |
| Comportementales            | Élevé                    | Très techniques, difficiles à maintenir                                 |
| Modernes / Cloud Web        | Modéré à élevé           | Complexes à gérer pour plusieurs fronts et backends                    |

##### **Risques techniques**
Choisir une architecture trop complexe (microservices, event-driven, etc.)
→ Risque de retards, erreurs de conception et difficultés d’intégration.

##### **Risques structurels**
Mauvais découpage du code ou couplage fort entre les composants
→ Rend la maintenance difficile et augmente le risque de régressions lors des mises à jour.

##### **Risques liés à l’équipe**
Compétences limitées sur certaines architectures avancées
→ Allonge la courbe d’apprentissage et le temps de développement.

##### **Risques d’infrastructure**
Dépendance excessive au cloud ou à des services externes
→ Risque de coûts cachés, de pannes ou de complexité de déploiement.

##### **Risques d’évolutivité**
Architecture trop rigide ou difficile à adapter
→ Peut entraîner une réécriture partielle du projet à moyen terme.

### CHOIX DE L'ARCHITECTURE
Clean architecture

### CHOIX DES TECHNOS
- Web Language: Typescript
- Frameworks and Libraries: React, NodeJS(+Express)
- Development tools: Git, Docker
- Databases: PostgreSQL, Redis

Front-End: React, Tailwind
Back-End: NodeJS(+Express), Redis, PostgreSQL
Déploiement: Docker, Docker Compose