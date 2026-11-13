---
name: premium-frontend-design
description: "Conçoit et améliore les interfaces React de K-JOU RENT A CAR avec une esthétique Premium Automotive Technology : pages, dashboards, formulaires, tableaux, navigation responsive et états UX. À utiliser pour toute demande de redesign, modernisation ou amélioration visuelle du frontend."
---

# Premium Frontend Design

## Mission

Concevoir des interfaces React qui semblent conçues spécifiquement pour une entreprise de location automobile : précises, sobres, efficaces et haut de gamme.

## Avant de coder

1. Lire le composant complet et ses dépendances directes.
2. Identifier le rôle utilisateur et la tâche principale de la page.
3. Repérer les données, props, états, callbacks, validations, appels API, permissions et routes.
4. Examiner les composants UI et styles déjà disponibles.
5. Définir une hiérarchie visuelle avant de modifier le JSX.
6. Conserver les comportements existants sauf demande fonctionnelle explicite.

Ne pas remplacer une page complète avant d'avoir compris son fonctionnement. Ne pas inventer de données pour remplir l'écran.

## Direction visuelle

Appliquer la personnalité Premium Automotive Technology :
- rouge K-JOU `#B4232F` pour les accents et actions principales ;
- noir carbone `#17191C` pour la navigation sombre et les éléments structurants ;
- blanc `#FFFFFF` et gris brume `#F4F5F6` pour les surfaces ;
- Manrope pour les titres et Inter pour le contenu ;
- bordures discrètes, ombres limitées et rayons maîtrisés.

La navigation latérale utilise le noir carbone par défaut. L'état actif doit être évident sans transformer toute la sidebar en surface rouge.

## Composition d'une page

Organiser la page selon le besoin réel, pas selon un template rigide :
- titre et contexte de page ;
- action principale clairement identifiée ;
- filtres ou contrôles pertinents ;
- contenu métier prioritaire ;
- informations secondaires et métadonnées.

Éviter d'ajouter des cartes KPI si elles n'aident pas la tâche. Les tableaux et listes doivent rester denses, lisibles et actionnables. Les formulaires doivent avoir des groupes logiques, des labels persistants et des erreurs compréhensibles.

## États UX obligatoires

Préserver ou concevoir les états pertinents :
- chargement ;
- vide (avec explication et prochaine action si utile) ;
- erreur (message compréhensible et possibilité de réessayer si adaptée) ;
- succès/confirmation ;
- désactivé ;
- validation de formulaire ;
- pagination ou chargement progressif lorsque le composant l'utilise.

Ne pas afficher un succès avant la confirmation réelle de l'opération. Ne pas remplacer un message métier précis par un message générique.

## Responsive

Vérifier au minimum :
- grand écran desktop ;
- largeur tablette ;
- petit écran mobile.

Adapter les colonnes, espacements, navigation et tableaux. Ne pas simplement réduire toutes les tailles. Si un tableau doit défiler horizontalement, préserver ses en-têtes et les actions essentielles. Éviter que les boutons importants sortent de l'écran.

## Accessibilité et interaction

- Contraste suffisant pour textes, bordures et contrôles.
- Focus clavier visible.
- Libellés associés aux champs.
- Boutons avec noms d'action explicites.
- Icônes décoratives ignorées par les lecteurs d'écran.
- Ne pas utiliser la couleur seule pour transmettre un état.
- Animations courtes et discrètes ; respecter la préférence de réduction des animations.

## React et CSS

- Respecter les conventions et dépendances du dépôt.
- Réutiliser les composants existants au lieu de créer des doublons.
- Ne pas utiliser `any`.
- Ne pas introduire de `useEffect` pour synchroniser un état qui peut être dérivé.
- Ne pas créer d'effets ou d'états inutiles.
- Ne pas installer de bibliothèque avant d'avoir vérifié les dépendances disponibles.
- Ne pas réécrire la configuration Tailwind, Vite ou TypeScript pour une simple amélioration visuelle.

## Anti-patterns à éviter

- dashboards SaaS interchangeables ;
- gradients et effets glassmorphism sans raison ;
- grandes cartes vides avec chiffres surdimensionnés ;
- emojis dans l'interface ;
- animations longues ;
- titres marketing vagues ;
- composants trop hauts ou espacements disproportionnés ;
- contenu fictif ou hardcodé ;
- changements fonctionnels dissimulés dans une refonte CSS.

## Validation

Après modification :
1. relire le diff ;
2. confirmer que les appels API, routes, permissions, données et callbacks n'ont pas changé ;
3. lancer le contrôle frontend pertinent défini dans `package.json` ;
4. vérifier visuellement les états principaux et le responsive si un navigateur est disponible ;
5. signaler clairement tout contrôle non effectué.

Livrer une interface qui améliore réellement la tâche utilisateur, pas seulement une capture d'écran séduisante.
