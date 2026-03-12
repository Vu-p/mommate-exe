# Mommate - Professional Caregiver Ecosystem

Mommate is a trusted ecosystem connecting new mothers with professional caregivers to ensure a scientific and safe postpartum journey.

## Features

- **Hero Section**: Engaging introduction with search capabilities.
- **Service Navigation**: Easy access to various care services (Many-sitter, Home wellness, Bathing, etc.).
- **Top Values**: Higlighting the reasons to trust Mommate.
- **Carer Showcasing**: Meet our specialist caregivers.
- **Testimonials**: Real reviews from mothers.
- **Newsletter**: Stay updated with the latest news.
- **Authentication**: Seamless Login and Sign-up flow with dynamic highlighting.

## Tech Stack

- **Frontend**: React, Vite, Framer Motion (for animations), Lucide React (for icons).
- **Styling**: Vanilla CSS with modern variables.
- **Navigation**: React Router DOM with Search Params for state management.

## Project Structure

```text
mommate-exe/
├── front-end/ # Frontend React application
└── back-end/  # Backend server application
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Frontend Setup

1. Navigate to the `front-end` directory:
   ```bash
   cd front-end
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Deployment (Vercel & Render)

#### Frontend (Vercel - Free & No Card Required)

1.  Sign in to **[vercel.com](https://vercel.com/)** with GitHub.
2.  **Add New Project** -> Select `mommate-exe`.
3.  **IMPORTANT**: In the "Project Settings", set the **Root Directory** to `front-end`.
4.  Vercel will automatically build and deploy.

#### Backend (Future Setup)

When the backend is ready, you can deploy it to **Render** or **Railway** as a separate service. The frontend will connect to it via an environment variable (e.g., `VITE_API_URL`).

## License

All Rights Reserved.
