# mythayun-mvp

## 1. Vue d'Ensemble

### 1.1 Description

MythaYun est une plateforme web destinée à améliorer l'expérience des fans de football. Elle combine des fonctionnalités innovantes telles que :

- **Scores en direct**
- **Détails des matchs**
- **Guides de stade communautaires**
- **Actualités officielles** issues des fédérations de football
- **Assistance voyage**
- **Soirées de visionnage virtuelles**.

### 1.2 Fonctionnalités MVP

1. Authentification et gestion des profils utilisateurs.
2. Sélection et gestion des équipes favorites.
3. Écran d'accueil avec scores en direct et actualités.
4. Détails des matchs : compositions, statistiques, chronologie.
5. Guides de stade : informations pratiques et guides communautaires.
6. Assistance voyage : transport, hébergement et conseils locaux.
7. Soirées de visionnage virtuelles : chat textuel et synchronisation avec les matchs.
8. Intégration d'un flux d'actualités officielles (FIFA, UEFA, etc.).

## 2. Architecture

### 2.1 Architecture Globale

L'architecture de MythaYun repose sur une approche monolithique pour le MVP, avec une séparation claire entre le frontend et le backend. Voici les principaux composants :

- **Frontend :** Développé avec Next.js (React), utilisant Tailwind CSS pour le style et SWR/React Query pour la gestion des données en temps réel.
- **Backend :** Next.js API Routes, avec Prisma pour interagir avec une base de données MongoDB Atlas.
- **Authentification :** NextAuth.js intégré avec Auth0 pour une gestion sécurisée des utilisateurs.
- **Temps réel :** Pusher pour les mises à jour en direct (scores, chat, notifications).
- **Services externes :**
  - [Football-data.org](http://football-data.org/) pour les données sportives.
  - Cloudinary pour la gestion des médias.
  - Mapbox GL pour les cartes interactives.
  - Flux RSS pour les actualités officielles.

### 2.2 Déploiement

- **Hébergement :** Vercel pour le frontend et backend.
- **CI/CD :** GitHub Actions pour automatiser les tests et les déploiements.

### 2.3 Contraintes Techniques

- **Performance :**
  - LCP < 1.5s sur mobile.
  - TTI < 3.2s.
  - Bundle initial < 150KB.
- **Scalabilité :**
  - Support de 10K utilisateurs simultanés.
  - Gestion de 20 matchs en temps réel.
- **Données :**
  - Cache optimisé pour limiter les requêtes API (max 1000/jour).
  - Réactivité < 1s pour les événements critiques.

### 2.4 Structure du Projet
