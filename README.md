# TechHive

TechHive is a full-featured e-commerce web application built with Node.js, Express, EJS, MongoDB, and Tailwind CSS. It includes separate customer and admin experiences with authentication, product browsing, cart and wishlist management, checkout, wallet and coupon flows, order management, offers, sales reports, and Razorpay payments.

## Project Overview

- Customer storefront with landing, home, category, product, search, cart, wishlist, checkout, wallet, coupons, orders, address management, and account pages.
- Admin panel for managing products, categories, customers, coupons, offers, orders, dashboard analytics, sales reports, and referral settings.
- Authentication flows for user login/signup/forgot password and admin login.
- Payment integration with Razorpay.
- Email-related workflows with Brevo.
- Google OAuth support for sign-in.
- Server-side rendering with EJS and static asset delivery from the `static` directory.

## Tech Stack

- Backend: Node.js, Express
- Templating: EJS
- Database: MongoDB with Mongoose
- Styling: Tailwind CSS
- Authentication: express-session, Passport, JWT, bcryptjs, Google OAuth
- Payments: Razorpay
- File uploads: Multer
- Email: Brevo
- Reporting/exports: ExcelJS, PDFKit
- Security/ops: Helmet, nocache, compression
- Tooling: ESLint, Prettier, Nodemon, Concurrently, Docker

## Features

- User registration, login, logout, and password recovery
- Google authentication
- Product listing, product detail pages, category browsing, and search
- Cart, wishlist, checkout, and order tracking
- Wallet and coupon handling
- Product reviews and ratings
- Address book management
- Admin product/category/customer/order management
- Offer and coupon management
- Sales reporting and dashboard analytics
- Referral settings management
- Responsive storefront and admin views

## Folder Structure

```text
TechHive/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── db/
│   ├── constants/
│   ├── controller/
│   │   ├── authentication/
│   │   ├── admin/
│   │   └── user/
│   ├── routes/
│   ├── middlewares/
│   ├── model/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── views/
│   │   ├── admin/
│   │   ├── user/
│   │   └── partials/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tailwind.config.js
├── eslint.config.js
├── static/
│   ├── images/
│   ├── fonts/
│   ├── js/
│   ├── styles/
│   ├── tailwind/
│   └── uploads/
└── README.md
```

## Key Directories

- `src/app.js`: Express app setup, middleware registration, and route mounting.
- `src/server.js`: HTTP server bootstrap, MongoDB connection, and graceful shutdown.
- `src/routes/`: Route definitions for user and admin flows.
- `src/controller/`: Request handlers grouped by domain.
- `src/model/`: Mongoose models for users, products, orders, carts, wallets, coupons, and more.
- `src/views/`: EJS templates for storefront and admin interfaces.
- `static/`: Public assets, compiled Tailwind output, client-side scripts, fonts, and uploads.
- `src/middlewares/`: Auth guards, request helpers, logging, and shared middleware.
- `src/utils/`: Environment, logging, validation, referral, Razorpay, and helper utilities.

## Prerequisites

- Node.js 20 or newer
- MongoDB connection string
- Razorpay credentials
- Google OAuth credentials
- Brevo API credentials
- Session secret

## Environment Variables

Create a `.env` file in the project root with the required values:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_google_callback_url
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_sender_email
BREVO_SENDER_NAME=your_sender_name
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
SESSIONSECRET=your_session_secret
ADMIN_EMAIL=admin_email
ADMIN_PASSWORD=admin_password
```

## Installation

```bash
npm install
```

```

## Available Scripts

- `npm run dev`: Runs Tailwind in watch mode and starts the server with Nodemon.
- `npm run dev:server`: Starts only the server with Nodemon.
- `npm run tailwind`: Watches Tailwind input and rebuilds the CSS bundle.
- `npm run build:css`: Generates a minified Tailwind CSS bundle.
- `npm run start`: Starts the app using the `.env` file.
- `npm run start:prod`: Builds CSS and starts the production server.
- `npm run lint`: Lints and auto-fixes JavaScript files.
- `npm run format`: Formats the codebase with Prettier.

## Run Locally

1. Install dependencies.
2. Add the environment variables.
3. Make sure MongoDB is running and reachable.
4. Build the CSS if needed:

```bash
npm run build:css
```

5. Start the app:

```bash
npm run start
```

For development:

```bash
npm run dev
```
