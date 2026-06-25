
# TechHive

TechHive is a full-featured e-commerce web application built with Node.js, Express, MongoDB, EJS, and Tailwind CSS.

It provides a complete online shopping experience with separate customer and admin panels, secure authentication, payment integration, order management, coupon and wallet systems, and sales analytics.

---

## Features

* User registration and authentication
* Google OAuth authentication
* Product catalog with category filtering and search
* Shopping cart and wishlist
* Secure checkout with Razorpay integration
* Order management and order tracking
* Wallet and coupon system
* Product reviews and ratings
* Address management
* Admin dashboard with analytics
* Product, category, customer, and order management
* Offer and coupon management
* Sales reports with PDF and Excel export
* Responsive customer and admin interfaces

---

## Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Express Session
* Passport.js
* JWT Authentication
* bcryptjs
* Razorpay
* Brevo Email Service
* Multer
* Helmet
* Compression

### Frontend

* EJS
* Tailwind CSS
* JavaScript

### Development Tools

* Docker
* ESLint
* Prettier
* Nodemon
* Concurrently

---

## Project Structure

```text
TechHive/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── constants/
│   ├── controller/
│   │   ├── admin/
│   │   ├── authentication/
│   │   └── user/
│   ├── db/
│   ├── middlewares/
│   ├── model/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   └── views/
│       ├── admin/
│       ├── partials/
│       └── user/
│
├── static/
│   ├── fonts/
│   ├── images/
│   ├── js/
│   ├── styles/
│   ├── tailwind/
│   └── uploads/
│
├── Dockerfile
├── docker-compose.yml
├── eslint.config.js
├── package.json
├── tailwind.config.js
└── README.md
```
