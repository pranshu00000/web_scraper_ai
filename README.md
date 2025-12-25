# BeyondChats Blog Project

A full-stack application that processes articles using AI and displays them in a modern web interface.

## 🏗 Architecture

The project consists of three main components:
- **Backend**: A Laravel API that manages article data and serves content.
- **Frontend**: A React application that provides a user-friendly interface for reading articles.
- **Processor**: A Node.js script that utilizes Gemini AI to process and enhance article content.

```mermaid
graph TD
    User[User] -->|View Articles| Frontend[Frontend (React)]
    Frontend -->|API Requests| Backend[Backend (Laravel)]
    Backend <-->|Read/Write| DB[(Database)]
    Processor[Processor (Node.js)] -->|Fetch & Process| External[External Sources]
    Processor -->|AI Enhancement| Gemini[Gemini API]
    Processor -->|Save Processed Data| Backend
```

## 🚀 Local Setup Instructions

Follow these steps to set up the project locally.

### Prerequisites
- PHP >= 8.2
- Composer
- Node.js & npm
- MySQL/MariaDB (or SQLite)

### 1. Backend Setup (Laravel)

```bash
cd backend

# Install dependencies
composer install

# Environment setup
cp .env.example .env
# Edit .env to configure your database settings

# Generate application key
php artisan key:generate

# Run migrations (ensure database exists)
php artisan migrate

# Start the server
php artisan serve
```

### 2. Frontend Setup (React)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Processor Setup

```bash
cd processor

# Install dependencies
npm install

# Configure environment if needed (create .env)
# GEMINI_API_KEY=your_key_here

# Run the processor
node index.js
```

## 🌐 Live Demo

Check out the live version of the project here: [Live Link Placeholder](https://example.com)

## 📁 Repository Structure

- `/backend` - Laravel API application
- `/frontend` - React frontend application
- `/processor` - Node.js article processing scripts
