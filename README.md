# FitChallenge

Système de gestion de salles d'entraînement et défis sportifs avec MongoDB et Express.

## Fonctionnalités

### Super Admin

- Gestion des salles d'entraînement (création, modification, suppression, approbation)
- Gestion des types d'exercices
- Création de badges et récompenses
- Gestion des utilisateurs

### Propriétaire de salle

- Gestion des informations de sa salle de sport
- Proposition de défis spécifiques à sa salle
- Suivi des performances de sa salle

### Utilisateur client

- Création et partage de défis d'entraînement
- Exploration et participation aux défis
- Suivi de l'entraînement et progression
- Défis sociaux avec amis
- Récompenses et badges

## Installation

1. Installer les dépendances :

```bash
npm install
```

2. Démarrer MongoDB avec Docker :

```bash
docker-compose up -d
```

3. Compiler et démarrer l'application :

```bash
npm run build
npm start
```

## Variables d'environnement

Créer un fichier `.env` avec :

```
MONGO_URI=mongodb://localhost:27500
MONGO_USERNAME=esgi
MONGO_PASSWORD=true5ecur3
MONGO_DB_NAME=fitchallenge
PORT=3000
```
"# tsnessGym" 
