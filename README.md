# TechHive

TechHive is a full-featured e-commerce web application built with Node.js, Express, EJS, MongoDB, and Tailwind CSS. It includes separate customer and admin experiences with authentication, product browsing, cart and wishlist management, checkout, wallet and coupon flows, order management, offer and  sales reports .

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

## Prerequisites

- Node.js 20 or newer
- MongoDB connection string
- Razorpay credentials
- Google OAuth credentials
- Brevo API credentials

## Installation

```bash
npm install
```

```

Start :

```bash
npm run start
```

For development:

```bash
npm run dev
```
