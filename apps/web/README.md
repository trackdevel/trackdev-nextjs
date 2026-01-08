# TrackDev Web App

Next.js web application for TrackDev project management.

## Features

- ⚡ Next.js 14 with App Router
- 🎨 Tailwind CSS for styling
- 🔐 JWT authentication
- 📦 Shared packages with mobile app
- 🔄 React Server Components

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Build shared packages first
pnpm build:packages
```

### Development

```bash
# Start development server
pnpm dev:web

# Or from this directory
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
apps/web/
├── src/
│   └── app/                # Next.js App Router
│       ├── (auth)/         # Auth-related pages
│       │   ├── login/
│       │   └── register/
│       ├── dashboard/      # Dashboard page
│       ├── projects/       # Projects pages
│       ├── layout.tsx      # Root layout
│       ├── page.tsx        # Home page
│       ├── providers.tsx   # Context providers
│       └── globals.css     # Global styles
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS config
├── postcss.config.js       # PostCSS config
└── package.json
```

## Configuration

### Environment Variables

Create a `.env.local` file from the example:

```bash
cp .env.local.example .env.local
```

Configure:
- `NEXT_PUBLIC_API_URL`: Your Spring Boot API URL

## Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Styling

The app uses Tailwind CSS with custom utility classes defined in `globals.css`:

```tsx
// Button styles
<button className="btn-primary">Primary Button</button>
<button className="btn-secondary">Secondary Button</button>
<button className="btn-outline">Outline Button</button>

// Form elements
<input className="input" placeholder="Enter text" />
<label className="label">Label</label>

// Cards
<div className="card">Card content</div>
```

## Authentication

Authentication is handled via the `@trackdev/api-client` package:

```tsx
import { useAuth } from '@trackdev/api-client';

function Component() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Use auth state and methods
}
```

## API Integration

API calls are made using the shared API client:

```tsx
import { projectsApi, useQuery } from '@trackdev/api-client';

function ProjectsList() {
  const { data, isLoading } = useQuery(() => projectsApi.getAll());
  
  // Render projects
}
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Server Components](https://react.dev/reference/react/use-server)
