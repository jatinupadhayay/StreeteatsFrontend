[street eat’s.pdf](https://github.com/user-attachments/files/25138386/street.eat.s.pdf)
# Street Eats Frontend(Aahar) 🍔

Experience the future of street food delivery with the Street Eats Frontend. Built with modern web technologies, this application provides a seamless and responsive interface for Customers, Vendors, and Delivery Partners.

## 🚀 Live Demo

Check out the live application here: **[Street Eats Live(Aahar)](https://streeteats-frontend-hdpn.vercel.app/)**

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [Project Structure](#-project-structure)

## ✨ Features

- **User Roles**: Dedicated interfaces for Customers, Vendors, and Delivery Partners.
- **Real-time Updates**: Live order tracking and status updates using Socket.io.
- **Interactive Maps**: Real-time location tracking for deliveries.
- **Secure Payments**: Integrated Razorpay and UPI payment options.
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices.
- **Dark Mode**: Sleek dark mode support for better visual experience.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Maps**: [Leaflet](https://leafletjs.com/), [React Leaflet](https://react-leaflet.js.org/)
- **State Management**: React Context & Hooks
- **Form Handling**: React Hook Form, Zod

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** or **pnpm**

You also need the **Street Eats Backend** running locally or accessible via a URL.

## 📦 Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/jatinupadhayay/StreeteatsFrontend.git
    cd StreeteatsFrontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

## 🔐 Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# API URL for the Backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
# Or for production:
# NEXT_PUBLIC_API_URL=https://streeteatsbackend.onrender.com/api
```

## 🚀 Running the App

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build

To create a production build:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm start
# or
yarn start
```

## 📂 Project Structure

```bash
StreeteatsFrontend/
├── app/                  # Next.js App Router pages and layouts
├── components/           # Reusable UI components
│   ├── ui/               # Base UI components (buttons, inputs, etc.)
│   ├── user/             # Customer-specific components
│   ├── vendor/           # Vendor-specific components
│   └── delivery/         # Delivery-specific components
├── contexts/             # React Context providers (Auth, Socket, etc.)
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries and API configuration
├── public/               # Static assets
└── styles/               # Global styles
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
Designe_Thinking Of StreetEAts(Ahar)-[Profile.pdf](https://github.com/user-attachments/files/25138348/Profile.pdf)


