<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Architecture Frontend - Google Drive PWA

## Principes Directeurs

Ce document guide les décisions d'architecture et les patterns à respecter dans ce projet frontend React/TypeScript.

### Philosophie de Base

- **Pas de DDD côté frontend** : Le DDD et l'hexagonale sont des patterns backend. Le frontend n'a pas besoin de modéliser un domaine métier complexe.
- **Séparation claire des couches** : Séparer business logic (métier), état (state management), et présentation (composants UI).
- **Adapter Pattern pour les appels API** : Les composants ne communiquent jamais directement avec le serveur. Tous les appels API passent par une couche d'adaptation centralisée.

---

## Gestion de l'État

### État Serveur vs État UI

Le frontend gère deux types d'état distincts, et c'est crucial de ne pas les mélanger.

#### État Serveur (TanStack Query)
Toute donnée qui existe sur le serveur (fichiers, métadonnées utilisateur, etc.) doit être gérée par **TanStack Query**.

**Quand utiliser TanStack Query :**
- Données que tu fetchs depuis l'API
- Données que tu dois synchroniser avec le serveur
- Cache, invalidation, optimistic updates

**Exemple :**
```typescript
// features/files/api/useFiles.ts
import { useQuery } from '@tanstack/react-query';
import { filesAdapter } from './filesAdapter';

export function useFiles(folderId: string) {
  return useQuery({
    queryKey: ['files', folderId],
    queryFn: () => filesAdapter.getFiles(folderId),
  });
}
```

#### État UI (Zustand / Context API)
Seul l'état purement client doit aller dans Zustand ou Context : modales ouvertes, filtres sélectionnés, onglets actifs, etc.

**Quand utiliser Zustand/Context :**
- État de l'UI qui n'existe que côté client
- État partagé entre plusieurs composants UI
- Pas de synchronisation serveur requise

**Exemple :**
```typescript
// features/files/ui/filesPanelStore.ts
import { create } from 'zustand';

export const useFilesPanelStore = create((set) => ({
  selectedFileId: null,
  setSelectedFileId: (id: string | null) => set({ selectedFileId: id }),
  isDetailsPanelOpen: false,
  toggleDetailsPanel: () =>
    set((state) => ({ isDetailsPanelOpen: !state.isDetailsPanelOpen })),
}));
```

---

## Couche d'Adaptation API (Ports & Adapters)

La couche d'adaptation API est **le seul point d'entrée** vers le serveur. C'est là que réside la vraie discipline architecturale du frontend.

### Règles Strictes

1. **Pas d'appels directs à l'API** : Les composants ne font jamais `fetch()` ou `axios()` directement.
2. **Adapter centralisé** : Chaque feature a un ou plusieurs adapters qui encapsulent les appels.
3. **Types stricts** : Les adapters retournent des types TypeScript bien définis, pas des `any`.
4. **Une source de vérité** : Si ton API change, tu modifies un adapter, et tout te cascades proprement.

### Structure d'un Adapter

```typescript
// features/files/api/filesAdapter.ts
import { apiClient } from '@/shared/api/apiClient';
import type { FileDTO } from './types';

export const filesAdapter = {
  async getFiles(folderId: string): Promise {
    const response = await apiClient.get(`/folders/${folderId}/files`);
    return response.data;
  },

  async uploadFile(folderId: string, file: File): Promise {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      `/folders/${folderId}/files`,
      formData
    );
    return response.data;
  },

  async deleteFile(fileId: string): Promise {
    await apiClient.delete(`/files/${fileId}`);
  },
};
```

### Types pour les Adapters

```typescript
// features/files/api/types.ts
export interface FileDTO {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
}
```

---

## Internationalisation (i18n)

L'application est proposée en **anglais** (défaut) et en **espagnol**. L'i18n repose sur
**next-intl** en mode cookie (pas de locale dans l'URL — l'app est derrière l'auth, pas
d'enjeu SEO) : cookie `NEXT_LOCALE` posé par le `LanguageSwitcher`, sinon négociation
`Accept-Language`, sinon `en`. Config dans `src/i18n/`, messages dans `messages/{en,es}.json`.

### Règles Strictes

1. **Aucun texte en dur dans les composants** : toute chaîne visible par l'utilisateur
   (labels, placeholders, `aria-label`, messages d'erreur, états de chargement…) passe par
   `useTranslations` (client et RSC synchrones) ou `getTranslations` (RSC async, metadata).
2. **Chaque nouvelle clé est ajoutée dans TOUTES les langues** : `messages/en.json` **et**
   `messages/es.json` doivent rester synchrones (mêmes clés, même structure). Une clé
   manquante dans une langue est un bug.
3. **Pluriels et interpolations en ICU** dans les messages, pas dans le code :
   `"memberCount": "{count, plural, one {# member} other {# members}}"` — jamais de
   `count > 1 ? 'members' : 'member'` dans un composant.
4. **Les helpers ne retournent jamais de libellés** : une fonction de `entities/*/lib.ts`
   retourne des données structurées (ex. `petAge()` → `{ unit, value }`), c'est le composant
   qui traduit. Pour les enums, utiliser des clés dynamiques (`t(\`species.${species}\`)`).
5. **Les données utilisateur ne se traduisent pas** : ce qui vient de l'API et a été saisi
   par l'utilisateur (nom du foyer, types de documents…) s'affiche tel quel.
6. **Nommage des clés par domaine** (`login.*`, `household.modal.*`, `pets.empty.*`…),
   aligné sur les features — pas de clés fourre-tout.

**Ajouter une langue** = créer `messages/<locale>.json` + ajouter la locale dans
`src/i18n/config.ts` (`LOCALES`). Rien d'autre à toucher.

---

## Organisation des Dossiers (Feature-Sliced Design)

Organise ton `src/` par feature, chaque feature étant un domaine métier self-contained.

src/
├── app/                       # Couche application
│   ├── App.tsx               # Root component
│   ├── providers.tsx          # Providers (React Query, Zustand, etc.)
│   └── index.tsx             # Entry point
│
├── pages/                     # Pages / Layouts (Next.js pages ou routes)
│   ├── dashboard/
│   │   └── page.tsx
│   ├── files/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
│
├── features/                  # Features (métier)
│   ├── files/
│   │   ├── api/              # ⭐ Adapter API + types
│   │   │   ├── filesAdapter.ts
│   │   │   └── types.ts
│   │   ├── model/            # ⭐ Business logic hooks
│   │   │   ├── useFiles.ts
│   │   │   ├── useUploadFile.ts
│   │   │   └── types.ts
│   │   ├── ui/               # Composants UI de la feature
│   │   │   ├── FileList.tsx
│   │   │   ├── FileItem.tsx
│   │   │   ├── filesPanelStore.ts (state UI)
│   │   │   └── styles.module.css
│   │   └── index.ts          # Public API de la feature
│   │
│   └── auth/
│       ├── api/
│       ├── model/
│       ├── ui/
│       └── index.ts
│
├── entities/                  # Domaines métier partagés (User, Folder, etc.)
│   ├── user/
│   │   ├── types.ts
│   │   └── index.ts
│   └── folder/
│       ├── types.ts
│       └── index.ts
│
├── shared/                    # Code réutilisable
│   ├── api/
│   │   ├── apiClient.ts      # Instance axios/fetch configurée
│   │   └── interceptors.ts
│   ├── ui/                    # Composants UI génériques
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── Input.tsx
│   ├── hooks/                 # Hooks génériques (pas métier)
│   │   ├── useAsync.ts
│   │   └── useDebounce.ts
│   ├── lib/                   # Utilitaires
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── styles/
│       └── globals.css
│
└── types/                     # Types globaux partagés
└── global.ts

### Public API d'une Feature (`index.ts`)

Chaque feature exporte une **public API** claire. Cela signifie que les autres features savent exactement ce qu'elles peuvent utiliser.

```typescript
// features/files/index.ts
export { FileList, FileItem } from './ui';
export { useFiles, useUploadFile } from './model';
export type { File, UploadProgressEvent } from './api/types';

// ❌ N'exporte PAS les adapters directs
// ❌ N'exporte PAS les stores UI internes
```

---

## Patterns de Composants

### Composants Métier (avec logique métier)

```typescript
// features/files/ui/FileList.tsx
import { useFiles } from '../model/useFiles';
import { FileItem } from './FileItem';

export function FileList({ folderId }: { folderId: string }) {
  const { data: files, isLoading, error } = useFiles(folderId);

  if (isLoading) return ;
  if (error) return ;

  return (
    
  );
}
```

### Composants de Présentation (dumb components)

```typescript
// features/files/ui/FileItem.tsx
import type { FileDTO } from '../api/types';

interface FileItemProps {
  file: FileDTO;
  onSelect?: (fileId: string) => void;
  isSelected?: boolean;
}

export function FileItem({ file, onSelect, isSelected }: FileItemProps) {
  return (
    
  );
}
```

---

## Hooks Métier (`model/` layer)

Les hooks métier contiennent la logique métier et orchestre TanStack Query + état UI.

```typescript
// features/files/model/useUploadFile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAdapter } from '../api/filesAdapter';

export function useUploadFile(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => filesAdapter.uploadFile(folderId, file),
    onSuccess: () => {
      // Invalide le cache TanStack Query
      queryClient.invalidateQueries({
        queryKey: ['files', folderId],
      });
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });
}
```

---

## Règles de Dépendance

### Direction des imports (stricte)

- **Pages** importent de **Features** et **Shared**
- **Features** importent de **Entities**, **Shared**, et (rarement) d'autres **Features**
- **Entities** importent de **Shared** et d'autres **Entities**
- **Shared** ne dépend de rien d'autre

### ❌ Interdictions

- `features/` n'importe jamais de `pages/`
- `features/` n'importe jamais d'autres `features/` sauf si c'est justifié (et même là, c'est un signal)
- Les composants UI n'importent jamais d'adapters directement

---

## Configuration TypeScript

```json
// tsconfig.json (paths)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/app/*": ["src/app/*"],
      "@/pages/*": ["src/pages/*"],
      "@/features/*": ["src/features/*"],
      "@/entities/*": ["src/entities/*"],
      "@/shared/*": ["src/shared/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

---

## Checklist pour les Nouvelles Features

Quand tu crées une nouvelle feature :

- [ ] Crée le dossier `features/[name]` avec les sous-dossiers `api/`, `model/`, `ui/`
- [ ] Définis les types DTO dans `api/types.ts`
- [ ] Crée l'adapter dans `api/[name]Adapter.ts`
- [ ] Crée les hooks métier dans `model/use*.ts`
- [ ] Crée les composants UI dans `ui/`
- [ ] Ajoute les textes dans `messages/en.json` ET `messages/es.json` (aucun texte en dur)
- [ ] Exporte la public API dans `index.ts`
- [ ] Documente tout comportement non évident dans le code

---

## Références

- [Feature-Sliced Design](https://feature-sliced.design/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [next-intl Docs](https://next-intl.dev)