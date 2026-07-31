<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend Architecture — PetHealth

## Guiding Principles

This document drives the architectural decisions and the patterns to follow in this React/TypeScript frontend.

### Core Philosophy

- **No DDD on the frontend**: DDD and hexagonal architecture are backend patterns. The frontend has no complex business domain to model.
- **Clear separation of layers**: keep business logic, state management and presentation (UI components) apart.
- **Adapter Pattern for API calls**: components never talk to the server directly. Every API call goes through a centralized adapter layer.

---

## State Management

### Server State vs UI State

The frontend deals with two distinct kinds of state, and mixing them up is the mistake to avoid.

#### Server State (TanStack Query)
Any data that lives on the server (files, user metadata, etc.) must be managed by **TanStack Query**.

**When to use TanStack Query:**
- Data you fetch from the API
- Data you must keep in sync with the server
- Caching, invalidation, optimistic updates

**Example:**
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

#### UI State (Zustand / Context API)
Only purely client-side state belongs in Zustand or Context: open modals, selected filters, active tabs, etc.

**When to use Zustand/Context:**
- UI state that only exists on the client
- State shared across several UI components
- No server synchronization required

**Example:**
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

## API Adapter Layer (Ports & Adapters)

The API adapter layer is **the only entry point** to the server. This is where the frontend's real architectural discipline lives.

### Strict Rules

1. **No direct API calls**: components never call `fetch()` or `axios()` themselves.
2. **Centralized adapter**: each feature has one or more adapters encapsulating its calls.
3. **Strict types**: adapters return well-defined TypeScript types, never `any`.
4. **One source of truth**: when the API changes, you edit one adapter and the change cascades cleanly.

### Structure of an Adapter

```typescript
// features/files/api/filesAdapter.ts
import { apiClient } from '@/shared/api/apiClient';
import type { FileDTO } from './types';

export const filesAdapter = {
  async getFiles(folderId: string): Promise<FileDTO[]> {
    const response = await apiClient.get(`/folders/${folderId}/files`);
    return response.data;
  },

  async uploadFile(folderId: string, file: File): Promise<FileDTO> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      `/folders/${folderId}/files`,
      formData
    );
    return response.data;
  },

  async deleteFile(fileId: string): Promise<void> {
    await apiClient.delete(`/files/${fileId}`);
  },
};
```

### Types for Adapters

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

## Internationalization (i18n)

The app ships in **English** (default) and **Spanish**. i18n relies on **next-intl** in
cookie mode (no locale in the URL — the app sits behind auth, so there is no SEO
concern): a `NEXT_LOCALE` cookie set by the `LanguageSwitcher`, otherwise
`Accept-Language` negotiation, otherwise `en`. Config lives in `src/i18n/`, messages in
`messages/{en,es}.json`.

### Strict Rules

1. **No hardcoded text in components**: every user-visible string (labels, placeholders,
   `aria-label`s, error messages, loading states…) goes through `useTranslations`
   (client and synchronous RSC) or `getTranslations` (async RSC, metadata).
2. **Every new key is added in ALL languages**: `messages/en.json` **and**
   `messages/es.json` must stay in sync (same keys, same structure). A key missing from
   one language is a bug.
3. **Plurals and interpolations in ICU** inside the messages, not in the code:
   `"memberCount": "{count, plural, one {# member} other {# members}}"` — never
   `count > 1 ? 'members' : 'member'` inside a component.
4. **Helpers never return labels**: a function in `entities/*/lib.ts` returns structured
   data (e.g. `petAge()` → `{ unit, value }`); the component does the translating. For
   enums, use dynamic keys (`t(\`species.${species}\`)`).
5. **User data is never translated**: anything coming from the API that the user typed
   in (household name, document types…) is displayed as-is.
6. **Key naming by domain** (`login.*`, `household.modal.*`, `pets.empty.*`…), aligned
   with the features — no catch-all keys.

**Adding a language** = create `messages/<locale>.json` + add the locale to
`src/i18n/config.ts` (`LOCALES`). Nothing else to touch.

---

## Folder Organization (Feature-Sliced Design)

Organize `src/` by feature, each feature being a self-contained business domain.

src/
├── app/                       # Application layer
│   ├── App.tsx               # Root component
│   ├── providers.tsx          # Providers (React Query, Zustand, etc.)
│   └── index.tsx             # Entry point
│
├── pages/                     # Pages / Layouts (Next.js pages or routes)
│   ├── dashboard/
│   │   └── page.tsx
│   ├── files/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
│
├── features/                  # Features (business)
│   ├── files/
│   │   ├── api/              # ⭐ API adapter + types
│   │   │   ├── filesAdapter.ts
│   │   │   └── types.ts
│   │   ├── model/            # ⭐ Business logic hooks
│   │   │   ├── useFiles.ts
│   │   │   ├── useUploadFile.ts
│   │   │   └── types.ts
│   │   ├── ui/               # UI components of the feature
│   │   │   ├── FileList.tsx
│   │   │   ├── FileItem.tsx
│   │   │   ├── filesPanelStore.ts (UI state)
│   │   │   └── styles.module.css
│   │   └── index.ts          # Public API of the feature
│   │
│   └── auth/
│       ├── api/
│       ├── model/
│       ├── ui/
│       └── index.ts
│
├── entities/                  # Shared business domains (User, Folder, etc.)
│   ├── user/
│   │   ├── types.ts
│   │   └── index.ts
│   └── folder/
│       ├── types.ts
│       └── index.ts
│
├── shared/                    # Reusable code
│   ├── api/
│   │   ├── apiClient.ts      # Configured axios/fetch instance
│   │   └── interceptors.ts
│   ├── ui/                    # Generic UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── Input.tsx
│   ├── hooks/                 # Generic hooks (not business)
│   │   ├── useAsync.ts
│   │   └── useDebounce.ts
│   ├── lib/                   # Utilities
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── styles/
│       └── globals.css
│
└── types/                     # Shared global types
└── global.ts

### Public API of a Feature (`index.ts`)

Each feature exposes a clear **public API**. That way other features know exactly what they are allowed to use.

```typescript
// features/files/index.ts
export { FileList, FileItem } from './ui';
export { useFiles, useUploadFile } from './model';
export type { File, UploadProgressEvent } from './api/types';

// ❌ Do NOT export the adapters directly
// ❌ Do NOT export internal UI stores
```

---

## Component Patterns

### Business Components (with business logic)

```typescript
// features/files/ui/FileList.tsx
import { useFiles } from '../model/useFiles';
import { FileItem } from './FileItem';

export function FileList({ folderId }: { folderId: string }) {
  const { data: files, isLoading, error } = useFiles(folderId);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState error={error} />;

  return (
    <ul>
      {files?.map((file) => (
        <FileItem key={file.id} file={file} />
      ))}
    </ul>
  );
}
```

### Presentational Components (dumb components)

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
    <li aria-selected={isSelected} onClick={() => onSelect?.(file.id)}>
      {file.name}
    </li>
  );
}
```

---

## Business Hooks (`model/` layer)

Business hooks hold the business logic and orchestrate TanStack Query + UI state.

```typescript
// features/files/model/useUploadFile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAdapter } from '../api/filesAdapter';

export function useUploadFile(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => filesAdapter.uploadFile(folderId, file),
    onSuccess: () => {
      // Invalidate the TanStack Query cache
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

## Dependency Rules

### Import direction (strict)

- **Pages** import from **Features** and **Shared**
- **Features** import from **Entities**, **Shared**, and (rarely) other **Features**
- **Entities** import from **Shared** and other **Entities**
- **Shared** depends on nothing else

### ❌ Forbidden

- `features/` never imports from `pages/`
- `features/` never imports from another `features/` unless justified (and even then, it's a smell)
- UI components never import adapters directly

---

## TypeScript Configuration

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

## Checklist for New Features

When you create a new feature:

- [ ] Create the `features/[name]` folder with the `api/`, `model/`, `ui/` subfolders
- [ ] Define the DTO types in `api/types.ts`
- [ ] Create the adapter in `api/[name]Adapter.ts`
- [ ] Create the business hooks in `model/use*.ts`
- [ ] Create the UI components in `ui/`
- [ ] Add the strings to `messages/en.json` AND `messages/es.json` (no hardcoded text)
- [ ] Export the public API in `index.ts`
- [ ] Document any non-obvious behavior in the code

---

## References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [next-intl Docs](https://next-intl.dev)
