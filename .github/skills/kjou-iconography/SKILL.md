---
name: kjou-iconography
description: "Conçoit, audite et intègre l'iconographie distinctive de K-JOU RENT A CAR : SVG personnalisés, système de traits cohérent, icônes Lucide fonctionnelles et pictogrammes dédiés à la flotte, la location, la remise de véhicule, les contrats et la maintenance. À utiliser pour créer ou revoir des icônes et leur bibliothèque React."
---

# K-JOU Iconography

## Mission

Créer un langage iconographique original et cohérent pour K-JOU RENT A CAR, sans perdre la lisibilité des icônes fonctionnelles.

## Stratégie de bibliothèque

1. Utiliser `lucide-react` pour les actions universelles et les affordances usuelles : recherche, retour, fermeture, édition, suppression, calendrier, paramètres, navigation.
2. Créer des SVG personnalisés K-JOU pour les concepts distinctifs de la location automobile.
3. Ne pas introduire Phosphor, Iconoir, Hugeicons ou une autre bibliothèque sans audit, justification et autorisation.
4. Ne pas mélanger plusieurs familles dans une même zone d'interface.

## Concepts prioritaires pour les SVG originaux

- Parc automobile : véhicule ou composition de flotte.
- Réservation/location : véhicule associé à une période.
- Remise/restitution : clé, véhicule et transfert.
- Contrat : document de location et signature.
- Maintenance : véhicule et outil/inspection.
- Facturation : document financier associé à une location.

Ces concepts sont des directions de conception, pas une obligation de dessiner tous les pictogrammes dès la première intervention.

## Grammaire visuelle

- Style vectoriel minimal, précis, premium et immédiatement reconnaissable.
- Silhouettes géométriques simples ; éviter les détails qui disparaissent à petite taille.
- Épaisseur de trait cohérente au sein d'une même famille. Choisir la valeur après comparaison avec les icônes existantes.
- Extrémités et jonctions cohérentes (arrondies ou nettes, mais pas mélangées arbitrairement).
- Utiliser le rouge K-JOU avec parcimonie ; une version monochrome doit rester possible.
- Prévoir les tailles utiles 16, 20, 24 et 32 px lorsque le dessin le permet.
- Les icônes doivent rester lisibles en thème clair et dans la sidebar carbone.

## Intégration React/SVG

Avant de créer un composant :
1. Examiner l'organisation actuelle des composants UI et les conventions d'export.
2. Vérifier s'il existe déjà un registre ou une abstraction d'icônes.
3. Choisir un emplacement qui respecte la structure réelle, sans créer un dossier parallèle inutile.
4. Utiliser `viewBox` stable, `width`/`height` pilotables et `currentColor` lorsque pertinent.
5. Éviter les dimensions codées en dur qui empêchent le redimensionnement.
6. Ne pas mettre d'information essentielle uniquement dans un SVG décoratif.
7. Ajouter un nom accessible pour une icône informative ; masquer une icône purement décorative aux technologies d'assistance.
8. Tester les tailles et les contrastes dans le contexte réel d'utilisation.

## Qualité graphique

Chaque proposition doit être examinée selon :
- reconnaissance immédiate ;
- cohérence avec la famille ;
- lisibilité à 16–20 px ;
- distinction suffisante des autres pictogrammes ;
- alignement optique ;
- contraste et adaptabilité ;
- absence de détails décoratifs superflus.

Ne pas produire une collection d'icônes qui ne diffèrent que par un petit détail ou qui réutilisent systématiquement une voiture générique.

## Workflow

1. Demander ou identifier le concept exact et son action associée.
2. Vérifier si une icône existante couvre déjà correctement le besoin.
3. Définir la silhouette et le sens avant le dessin.
4. Créer le SVG ou composant React en respectant les conventions du dépôt.
5. Prévoir les variantes nécessaires (taille, couleur, état).
6. Intégrer dans une seule zone pilote.
7. Vérifier rendu, accessibilité et cohérence avant de généraliser.

## Protection fonctionnelle

Ne pas modifier les handlers, routes, permissions, noms d'actions ou comportements lors d'un remplacement d'icône. Une icône de suppression ne doit pas apparaître sur une action qui ne supprime pas. Ne jamais utiliser un pictogramme pour masquer une action ou une permission réellement disponible.
