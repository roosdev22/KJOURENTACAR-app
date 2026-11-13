# K-JOU RENT A CAR — Instructions permanentes pour GitHub Copilot

## 1. Identité du projet

K-JOU RENT A CAR est un projet académique de gestion de location de véhicules. Son identité visuelle est **Premium Automotive Technology** : prestige automobile, technologie moderne et professionnalisme.

La marque doit inspirer :
- confiance et sérieux dans les opérations de location ;
- qualité et prestige automobile sans ostentation ;
- précision, clarté et efficacité technologique.

La personnalité est hybride. Ne pas transformer l'application en site de concession automobile de luxe, en tableau de bord SaaS générique ou en interface futuriste excessive.

## 2. Charte graphique obligatoire

### Palette de référence

| Token | Valeur | Usage |
|---|---|---|
| `--kjou-red` | `#B4232F` | Marque, action primaire, accent ciblé |
| `--kjou-red-hover` | `#941C27` | Survol et état actif du rouge |
| `--kjou-carbon` | `#17191C` | Sidebar sombre, titres et surfaces foncées |
| `--kjou-white` | `#FFFFFF` | Cartes et surfaces principales |
| `--kjou-mist` | `#F4F5F6` | Fond général clair |
| `--kjou-border` | `#E3E6E8` | Bordures et séparateurs |
| `--kjou-text` | `#202327` | Texte principal |
| `--kjou-muted` | `#64748B` | Texte secondaire |
| `--kjou-success` | `#16845B` | Succès et états positifs |
| `--kjou-warning` | `#B7791F` | Avertissements |
| `--kjou-danger` | `#B4232F` | Erreurs et états critiques |

Le rouge est un accent, pas un fond universel. Le noir carbone donne de la structure. Le blanc et le gris brume assurent la lisibilité. Ne pas employer les couleurs de statut comme décoration.

### Typographie

- **Manrope** : titres, chiffres de synthèse et éléments éditoriaux.
- **Inter** : textes courants, formulaires, tableaux, libellés et aides.
- Si le dépôt utilise déjà une stratégie de chargement des polices, l'étudier et la réutiliser avant toute modification.
- Ne pas ajouter une dépendance de police ou un service externe sans vérifier les choix existants.

Échelle indicative : titre de page 28–32 px ; titre de section 18–22 px ; texte courant 14–16 px ; métadonnées 12–13 px. Adapter au responsive et à la densité réelle de la page.

### Formes et densité

- Cartes : rayon généralement 12–16 px, bordure discrète, ombre légère ou inexistante.
- Boutons : rayon généralement 8–10 px, libellé explicite, états hover/focus/disabled visibles.
- Champs : bordure fine, libellé persistant, focus accessible et cohérent.
- Tableaux : compacts mais respirants, alignement stable, en-têtes lisibles.
- Sidebar : thème sombre carbone par défaut, accents rouges mesurés.
- Éviter les grands espaces vides, les cartes excessivement hautes et les animations décoratives.
- Préférer une hiérarchie visuelle nette à une accumulation d'effets.

## 3. Contexte technique connu

Le projet utilise notamment :
- Frontend : React, TypeScript, Vite, Tailwind CSS, React Router.
- Icônes déjà présentes : `lucide-react` et `react-icons`.
- Backend : Django et Django REST Framework.
- Authentification : JWT avec cookies HttpOnly et requêtes frontend avec credentials.
- Application organisée par espaces de rôles : Client, Agent, Gestionnaire, Admin et Super Admin.

Les versions, scripts, alias, routes, composants, conventions et configurations réellement présents dans le dépôt font autorité. Vérifier les fichiers du projet avant de supposer un détail.

## 4. Règles de protection fonctionnelle — non négociables

Pour une demande de design ou de refonte visuelle :

1. Ne pas modifier le backend, les modèles, serializers, vues, permissions, services, migrations ou règles métier.
2. Ne pas modifier les routes, gardes d'accès, rôles, redirections ou flux d'authentification.
3. Ne pas changer les contrats API, méthodes HTTP, URL, noms de champs, payloads, paramètres, réponses attendues ou gestion des cookies.
4. Ne pas modifier les calculs financiers, montants, devises, taux, statuts, disponibilité des véhicules, paiements, remboursements ou transitions de réservation.
5. Ne pas remplacer des données réelles par des données fictives, ni coder en dur un nom d'utilisateur, un rôle ou une statistique.
6. Ne pas supprimer une action, une validation, un état de chargement, un message d'erreur ou un comportement existant pour simplifier l'interface.
7. Ne pas changer les permissions en masquant simplement un élément visuel. La sécurité demeure une responsabilité du backend.
8. Si une amélioration visuelle semble exiger un changement fonctionnel, s'arrêter, expliquer la dépendance et demander une autorisation explicite.

Une demande explicitement fonctionnelle peut autoriser un changement fonctionnel, mais seulement dans le périmètre demandé. Ne jamais élargir implicitement ce périmètre.

## 5. Méthode obligatoire avant modification

1. Identifier la page, le composant et le parcours utilisateur concernés.
2. Lire le fichier complet et les composants, hooks, types, API et styles directement liés.
3. Repérer les comportements à préserver : props, états, callbacks, validations, permissions, appels API, navigation et messages.
4. Examiner les composants UI réutilisables et les tokens existants.
5. Proposer une modification minimale et cohérente avec la structure existante.
6. Modifier seulement les fichiers nécessaires.
7. Relire le diff et vérifier qu'aucune logique non demandée n'a changé.
8. Exécuter les contrôles disponibles et pertinents, en utilisant les scripts réellement définis dans `frontend/package.json`.

Ne pas lancer une longue série de diagnostics sans lien avec le changement. Ne pas prétendre qu'un test a réussi s'il n'a pas été exécuté.

## 6. Standards React et TypeScript

- Respecter les types existants et les conventions du dépôt.
- Ne jamais utiliser `any` pour faire taire une erreur. Préférer un type explicite, `unknown` avec narrowing, ou un type déjà défini.
- Ne pas introduire de `useEffect` qui appelle `setState` pour dériver une valeur calculable pendant le rendu.
- Éviter les effets dont les dépendances ou le cycle de vie ne sont pas justifiés.
- Ne pas dupliquer un état qui peut être dérivé des props ou d'un état existant.
- Préserver les noms et signatures publics des composants sauf nécessité autorisée.
- Respecter les règles ESLint et TypeScript déjà configurées.
- Ne pas installer une bibliothèque si les dépendances actuelles suffisent.
- Préserver les imports et alias réellement configurés.

## 7. Système d'icônes

- Utiliser `lucide-react` comme bibliothèque fonctionnelle existante par défaut.
- Créer des SVG personnalisés K-JOU pour les concepts de marque ou les fonctions métier qui méritent une signature visuelle.
- Ne pas mélanger arbitrairement plusieurs familles d'icônes.
- Ne pas remplacer en masse les icônes existantes sans audit et validation.
- Les icônes doivent être cohérentes en taille, épaisseur, alignement, contraste et comportement.
- Utiliser des icônes Lucide existantes pour les actions universelles (recherche, fermeture, retour, édition, paramètres, etc.).
- Réserver les SVG originaux aux concepts distinctifs : silhouette de flotte, remise de véhicule, clé de location, dossier/contrat, parcours de location.
- Les SVG doivent être vectoriels, propres, accessibles et maintenables. Éviter les détails illisibles à 16–20 px.
- Une icône décorative est masquée aux lecteurs d'écran ; une icône porteuse de sens reçoit un nom accessible ou un libellé visible.

## 8. UX, accessibilité et responsive

- Concevoir d'abord pour les tâches réelles de chaque rôle.
- Afficher les informations importantes avec une hiérarchie claire.
- Prévoir les états chargement, vide, erreur, succès, désactivé et confirmation.
- Ne pas dépendre uniquement de la couleur pour transmettre un statut.
- Préserver les libellés visibles, les focus clavier et les contrastes suffisants.
- Respecter `prefers-reduced-motion` si des animations sont ajoutées.
- Vérifier les vues étroites sans casser les tableaux, formulaires ou actions.
- Ne pas réduire la densité métier au point de rendre l'administration lente.

## 9. Principes de conception anti-générique

Éviter :
- les dégradés violets/bleus et les halos lumineux utilisés sans raison ;
- les cartes clonées avec une icône générique et un gros chiffre ;
- les graphiques fictifs et les statistiques inventées ;
- les emojis dans l'interface ;
- les animations spectaculaires sans valeur fonctionnelle ;
- les composants surdimensionnés, les arrondis excessifs et les espaces artificiels ;
- la reproduction d'un template SaaS sans lien avec la location automobile.

Privilégier :
- une composition propre à chaque parcours ;
- des données métier authentiques ;
- des détails éditoriaux sobres liés à l'automobile ;
- des composants cohérents mais pas uniformes au point d'effacer les besoins de chaque rôle ;
- une signature visuelle discrète et répétable.

## 10. Format de livraison attendu

À la fin d'une tâche, communiquer :
1. les fichiers modifiés ;
2. ce qui a changé visuellement ;
3. les comportements fonctionnels préservés ;
4. les commandes de vérification réellement exécutées et leurs résultats ;
5. les limites ou contrôles non exécutés.

Fournir des modifications ciblées et du code complet lorsqu'un fichier doit être remplacé. Ne pas dire « terminé » si des contrôles indispensables restent à faire.
