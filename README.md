# AWS Migration Tracker Dashboard

This is a dashboard application for tracking the progress of AWS migrations. It provides a comprehensive overview of SPAs, microservices, and team progress, with a clean, modern interface.

## Features

- **Responsive Design:** A fully responsive layout that works on all screen sizes.
- **Dark Mode:** A beautiful dark mode that is easy on the eyes.
- **Data Visualization:** Interactive charts and graphs to visualize migration progress.
- **Filtering and Searching:** Powerful filtering and searching capabilities to quickly find the information you need.
- **Persistent State:** The application remembers your theme, sidebar, and filter preferences.
- **Settings Modal:** A centralized location to manage your application settings.
- **Page Transitions:** Smooth, animated transitions between pages.

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/aws-dashboard.git
   ```
2. Navigate to the project directory:
    ```sh
    cd aws-dashboard
    ```
3. Install the dependencies:
    ```sh
    npm install
    ```
### Environment Variables
Create a .env.local file in the root of the project and add the following environment variables:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/main-data
NEXT_PUBLIC_SUMMARY_API_URL=http://localhost:8080/api/summary-data
```
## Running the Application
To run the application in development mode, use the following command:
```
npm run dev
```
## Built With
- [Next.js](https://nextjs.org/) - React framework for building server-side rendered and static websites.
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
- [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript that compiles to plain JavaScript.
- [Framer Motion](https://www.framer.com/motion/) - A production-ready motion library for React.
- [Zustand](https://zustand-demo.pmnd.rs/) - A small, fast, and scalable state-management solution.
- [Recharts](https://recharts.org/) - A composable charting library built on React components.
- [Lucide React](https://lucide.dev/) - A beautiful and consistent icon toolkit.
