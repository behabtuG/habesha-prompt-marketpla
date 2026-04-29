# 🚀 Telegram AI Prompt Marketplace

A **production-ready AI prompt marketplace** built for **Telegram Mini Apps**, supporting **Telegram Stars**, **TON blockchain payments**, and secure content access.

---

## ✨ Features

- 🛒 Prompt marketplace with categories & search
- ⭐ Telegram Stars payments
- ⚡ TON blockchain payments
- 🔐 Secure JWT authentication
- 🚀 Redis-based access caching
- 🛠 Admin prompt approval & moderation
- 🔄 Purchase verification & refund-ready architecture

---

## 🧱 Tech Stack

### Backend

- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- Telegram Bot API
- TON Blockchain

### Frontend

- Next.js (App Router)
- Tailwind CSS
- React Query
- Zustand
- shadcn/ui

---

## 🔐 Security Highlights

- Telegram webhook signature verification
- Required & optional JWT guards
- Payment race-condition protection
- Redis-based access control & cache invalidation
- Encrypted prompt content storage

---

## 🛠️ Installation, Setup & Run (ALL IN ONE)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/behabtuG/telegram-prompt-marketplace.git
cd telegram-prompt-marketplace
```

# 2️⃣ Install Dependencies

# Backend

- cd backend
- npm install
- cd ..

# Frontend

- cd frontend
- npm install
- cd ..

# Telegram Bot

- cd telegram-bot
- npm install
- cd ..

# 3️⃣ Environment Variables

# backend/.env

- DATABASE_URL=postgresql://postgres:password@localhost:5432/telegram_prompts
- JWT_SECRET=super_secret_key
- REDIS_URL=redis://localhost:6379
- TELEGRAM_BOT_TOKEN=your_bot_token
- TELEGRAM_WEBHOOK_SECRET=your_webhook_secret
- ENCRYPTION_KEY=your_32_char_encryption_key

# frontend/.env.local

- NEXT_PUBLIC_API_URL=http://localhost:3000

# 4️⃣ Database Migration (Prisma)

- cd backend
- npx prisma generate
- npx prisma migrate dev --name init
- cd ..

# 5️⃣ Start Services

# Start HTTPS tunnel for Telegram

- ngrok http 3000

# Start Backend

- cd backend
- npm run start:dev

# Start Frontend

- cd frontend
- npm run dev

# Start Telegram Bot

- cd telegram-bot
- npm run dev

# 📦 Notes

- Redis must be running before backend startup

- Telegram webhooks require HTTPS (ngrok)

- Purchases unlock prompts only when status = COMPLETED

- Prompt content is AES-encrypted at rest

# 👨‍💻 Author

Behabtu Getnet Walle
Senior Software Engineer | Full-Stack Developer
