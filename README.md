# @teyfix/next-i18n

A lightweight i18n solution for Next.js with built-in MDX support and type-safe
translations.

> [!CAUTION] CAUTION  
> Client side translations (e.g. `useTranslations`) not implemented!

## Why?

- **Lightweight**: No bloated dependencies
- **MDX Support**: Import locale-specific MDX files as React components
- **Type-Safe**: Full TypeScript support with autocomplete
- **Simple**: Minimal setup, straightforward API

## Installation

```sh
bun add teyfix/next-i18n
```

Your `package.json` will include:

```json
{
  "dependencies": {
    "@teyfix/next-i18n": "teyfix/next-i18n"
  }
}
```

## Setup

### 1. Create Translation Files

Create a `lang/` directory at your project root:

```txt
lang/
├── en/
│   └── home/
│       ├── _index.yaml
│       └── hero.mdx
└── tr/
    └── home/
        ├── _index.yaml
        └── hero.mdx
```

**Example `_index.yaml`:**

```yaml
header:
  title: Home
  greetings: Hello {name}!
aside:
  menu:
    - href: /home
      label: Home
    - href: /about
      label: About
```

**Example `hero.mdx`:**

```mdx
## Welcome to Our Site

This is **markdown** content that will be rendered as a React component.
```

### 2. Configure the Compiler

Create `src/i18n/compiler.ts`:

```ts
import { resolve } from "node:path";
import { createCompiler } from "@teyfix/next-i18n/compiler";

export const compiler = createCompiler({
  input: resolve(process.cwd(), "lang"),
  output: resolve(process.cwd(), "messages"),
  ref: "$ref", // Special key to reference MDX files
});

compiler();
```

### 3. Add Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "i18n": "bun src/i18n/compiler.ts",
    "i18n:watch": "nodemon -w lang -e md,mdx,yml,yaml,json -x 'bun i18n'"
  }
}
```

### 4. Run the Compiler

```sh
bun i18n
```

This generates:

```txt
messages/
├── en.json           # Compiled translations
├── en.typings.ts     # TypeScript types
├── en/
│   └── home/
│       └── hero.mdx  # Copied MDX files
├── tr.json
├── tr.typings.ts
└── tr/
    └── home/
        └── hero.mdx
```

### 5. Configure Next.js

**Update `next.config.ts`:**

```ts
const nextConfig = {
  transpilePackages: ["@teyfix/next-i18n"],
};

export default nextConfig;
```

**Update `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "paths": {
      "@/messages/*": ["./messages/*"]
    }
  }
}
```

### 6. Create i18n Server Helper

Create `src/i18n/server.ts`:

```tsx
import { createIntl, type IntlImport } from "@teyfix/next-i18n/server";
import type { MessagesEn } from "@/messages/en.typings";
import type { MessagesTr } from "@/messages/tr.typings";

export const { withLocale, getTranslations } = createIntl({
  locales: ["tr", "en"],
  defaultLocale: "tr",
  localeParam: "locale", // Route param for locale (e.g., /[locale]/page)

  // Import translation JSON files
  loader: async (locale) =>
    import(`@/messages/${locale}.json`) as IntlImport<MessagesTr | MessagesEn>,

  // Import MDX files referenced with $ref
  refLoader: async (ref) => import(`@/messages/${ref.path}`),
});
```

## Usage

### Basic Page Setup

Create a page at `src/app/[locale]/home/page.tsx`:

```tsx
import { withLocale, getTranslations } from "@/i18n/server";

async function HomePage() {
  // Get translations for the 'home' namespace (fully type-safe)
  const t = await getTranslations("home");

  return (
    <section>
      <header>
        {/* Access via property */}
        <h1>{t.header.title}</h1>

        {/* Or via function call */}
        <h1>{t("header.title")}</h1>
      </header>

      <aside>
        <ul>
          {/* Access arrays and objects directly */}
          {t.aside.menu.map(({ href, label }) => (
            <li key={href}>
              <a href={href}>{label}</a>
            </li>
          ))}
        </ul>
      </aside>

      <main>
        {/* Interpolation with parameters */}
        <p>{t.header.greetings({ name: "John" })}</p>
        <p>{t("header.greetings", { name: "John" })}</p>
      </main>

      {/* Render MDX as React component (type-safe) */}
      <t.Hero />
    </section>
  );
}

// Wrap with withLocale to enable locale context
export default withLocale(HomePage);
```

### Development Workflow

During development, run the watcher to auto-compile on changes:

```sh
bun i18n:watch
```

This watches all `.md`, `.mdx`, `.yml`, `.yaml`, and `.json` files in the
`lang/` directory.

## Features

### ✅ Type-Safe Translations

- Full autocomplete for translation keys
- Type-safe parameters for interpolations
- TypeScript errors for missing translations

### ✅ MDX Components

- Reference MDX files in your YAML with `$ref`
- Import them as React components
- Full Next.js MDX support

### ✅ Flexible Access

- Property access: `t.header.title`
- Function access: `t("header.title")`
- Direct object/array access for custom rendering

### ❌ Not Yet Implemented

- Pluralization
- Rich text/markup interpolation

## Building and Deployment

### Static Generation

For static site generation, you **must** export `generateStaticParams` to
pre-render all locale routes:

```tsx
// src/app/[locale]/layout.tsx or page.tsx
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "tr" },
    // Add all your locales here
  ];
}
```

### Build Pipeline

```json
{
  "scripts": {
    "i18n": "bun src/i18n/compiler.ts",
    "build": "bun i18n && next build"
  }
}
```

> [!IMPORTANT] IMPORTANT  
> You must run the compiler before building to ensure translations are
> up-to-date

This ensures:

- All translations are compiled from `lang/` to `messages/`
- TypeScript types are generated
- MDX files are copied to the output directory

### Deployment Requirements

The `messages/` directory **must be included** in your deployment:

- ✅ Commit `messages/` to version control, OR
- ✅ Run `bun i18n` in your CI/CD pipeline before building

The `messages/` folder contains:

- Compiled JSON translations (loaded at runtime)
- TypeScript type definitions (build-time only)
- MDX files (loaded as React components at runtime)

**Example CI/CD workflow:**

```yaml
# .github/workflows/deploy.yml
- name: Install dependencies
  run: bun install

- name: Compile translations
  run: bun i18n

- name: Build Next.js
  run: bun run build
```

### Vercel/Netlify

If using platforms like Vercel or Netlify, update your build command:

```json
{
  "scripts": {
    "build": "bun i18n && next build"
  }
}
```

The platform will automatically include `messages/` in the deployment since it's
generated during the build.

## Notes

This is a **lightweight i18n loader**, not a complete i18n framework. It focuses
on:

- Type-safe translations
- MDX support without heavy dependencies
- Simple, predictable behavior

For complex i18n needs (pluralization, ICU message format, etc.), consider more
comprehensive solutions.

## License

MIT
