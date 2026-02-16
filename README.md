# Street Eats Frontend(Aahar) 🍔

<h1>Login/Sign_Up</h1><img width="1715" height="854" alt="Screenshot 2026-02-07 033202" src="https://github.com/user-attachments/assets/79066eff-fbb3-496d-ab4f-d189eceeebec" />

<h1>Customer_Platform <h1/> <img width="527" height="570" alt="Screenshot 2026-02-07 032252" src="https://github.com/user-attachments/assets/e52c1722-7df6-4b4c-a240-72f6ddff7063" /><img width="523" height="548" alt="Screenshot 2026-02-07 032310" src="https://github.com/user-attachments/assets/decb2109-d6ce-47ab-94ef-bc0d63523128" />
<h1>Vendor_Platform<h1/><img width="551" height="630" alt="Screenshot 2026-02-07 032402" src="https://github.com/user-attachments/assets/ba179490-dc5e-4fdd-87e8-9cd585cc2e20" /><img width="543" height="285" alt="Screenshot 2026-02-07 032416" src="https://github.com/user-attachments/assets/8e0d065b-ee51-4371-8cd0-d0d78a4476e7" />
<img width="585" height="644" alt="Screenshot 2026-02-07 032428" src="https://github.com/user-attachments/assets/f2c13fdf-b02e-4bba-b020-eb719019d39d" />
<img width="549" height="426" alt="Screenshot 2026-02-07 032524" src="https://github.com/user-attachments/assets/d84e6d3d-9cf1-4ecb-b1bc-f47d7c7153c2" />


[streeteat’s.pdf](https://github.com/user-attachments/files/25138386/street.eat.s.pdf)

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
├── components/ui/        # Base UI components (buttons, inputs, etc.)
├── components/user/      # Customer-specific components
├── components/vendor/    # Vendor-specific components
├── components/delivery/  # Delivery-specific components
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


Design_Thinking Of StreetEAts(Ahar)-[Profile.pdf](https://github.com/user-attachments/files/25138348/Profile.pdf)
