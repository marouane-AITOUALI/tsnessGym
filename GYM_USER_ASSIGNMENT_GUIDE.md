# Guide d'assignation d'utilisateurs aux gyms

## 🏋️ Fonctionnalités disponibles

### 1. **Assigner un utilisateur à une gym**

**Endpoint :** `POST /api/gyms/:gymId/assign-user`

**Permissions :**
- ✅ **SUPER_ADMIN** : Peut assigner n'importe quel utilisateur à n'importe quelle gym
- ✅ **GYM_OWNER** : Peut assigner des utilisateurs uniquement à SA gym (celle dont il est propriétaire)

**Exemple de requête :**
```bash
curl -X POST http://localhost:3000/api/gyms/GYM_ID_HERE/assign-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"userId": "USER_ID_HERE"}'
```

**Réponse de succès :**
```json
{
  "message": "User assigned to gym successfully",
  "user": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "gymId": "gym_id"
  }
}
```

### 2. **Récupérer tous les utilisateurs d'une gym**

**Endpoint :** `GET /api/gyms/:gymId/users`

**Permissions :**
- ✅ **SUPER_ADMIN** : Peut voir les utilisateurs de n'importe quelle gym
- ✅ **GYM_OWNER** : Peut voir les utilisateurs uniquement de SA gym

**Exemple de requête :**
```bash
curl -X GET http://localhost:3000/api/gyms/GYM_ID_HERE/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse de succès :**
```json
[
  {
    "_id": "user1_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "USER",
    "gymId": {
      "_id": "gym_id",
      "name": "FitGym Pro",
      "location": "Paris"
    }
  },
  {
    "_id": "user2_id", 
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "role": "USER",
    "gymId": {
      "_id": "gym_id",
      "name": "FitGym Pro", 
      "location": "Paris"
    }
  }
]
```

### 3. **Retirer un utilisateur d'une gym**

**Endpoint :** `DELETE /api/gyms/users/:userId`

**Permissions :**
- ✅ **SUPER_ADMIN** : Peut retirer n'importe quel utilisateur de n'importe quelle gym
- ✅ **GYM_OWNER** : Peut retirer des utilisateurs uniquement de SA gym

**Exemple de requête :**
```bash
curl -X DELETE http://localhost:3000/api/gyms/users/USER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. **Récupérer ses gyms (utilisateur connecté)**

**Endpoint :** `GET /api/gyms/my-gyms`

**Permissions :**
- ✅ **Tous les utilisateurs connectés**

**Logique :**
- **GYM_OWNER** : Récupère les gyms dont il est propriétaire + sa gym assignée (si différente)
- **USER** : Récupère la gym à laquelle il est assigné

**Exemple de requête :**
```bash
curl -X GET http://localhost:3000/api/gyms/my-gyms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔑 Workflow typique

### Scénario 1 : Admin assigne un utilisateur à une gym
1. **Admin se connecte** : `POST /api/auth/login`
2. **Admin récupère la liste des gyms** : `GET /api/gyms`
3. **Admin assigne un utilisateur** : `POST /api/gyms/:gymId/assign-user`
4. **Vérifier l'assignation** : `GET /api/gyms/:gymId/users`

### Scénario 2 : Gym Owner gère ses utilisateurs
1. **Gym Owner se connecte** : `POST /api/auth/login`
2. **Récupère ses gyms** : `GET /api/gyms/my-gyms`
3. **Assigne un utilisateur à sa gym** : `POST /api/gyms/:gymId/assign-user`
4. **Consulte ses utilisateurs** : `GET /api/gyms/:gymId/users`

### Scénario 3 : Utilisateur consulte sa gym
1. **User se connecte** : `POST /api/auth/login`
2. **Consulte sa gym** : `GET /api/gyms/my-gyms`

## ⚠️ Erreurs possibles

- **403 Forbidden** : Vous n'avez pas les permissions pour cette action
- **404 Not Found** : Gym ou utilisateur non trouvé
- **400 Bad Request** : Données manquantes (userId)

## 🎯 Résumé des permissions

| Rôle | Assigner user | Voir users gym | Retirer user | Voir ses gyms |
|------|---------------|----------------|--------------|---------------|
| **SUPER_ADMIN** | ✅ Toutes gyms | ✅ Toutes gyms | ✅ Toutes gyms | ✅ |
| **GYM_OWNER** | ✅ Sa gym seulement | ✅ Sa gym seulement | ✅ Sa gym seulement | ✅ |
| **USER** | ❌ | ❌ | ❌ | ✅ Sa gym assignée |
