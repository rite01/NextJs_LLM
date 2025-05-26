# 🛍️ Dynamic Faceted Search App

A robust, scalable, and developer-friendly full-stack faceted search solution built using **Next.js 14**, **Node.js**, and **MongoDB**. Designed with clean separation of concerns, dynamic schema-driven filters, and an intuitive UX for browsing categorized listings.

---

## 🚀 Features

- 🔍 **Full-text Search**: MongoDB text indexes on titles & descriptions
- 🧠 **Dynamic Faceted Filtering**: Category-driven attribute schema
- 🏷️ **Custom Attribute Filtering**: Supports key-value pair filters (e.g. size=9, brand=Sony)
- 🤖 **Natural Language Parsing**: Uses `compromise` NLP to extract filters from user queries
- 🧩 **Modular Architecture**: Easily extensible category & attribute model
- 📄 **Skeleton Loaders & Error Boundaries**: Smooth UX with fallback UI
- 🔁 **Pagination + Relevance Sorting**: Text score + recent-first
- 🐳 **1-Command Bootstrapping**: Minimal DX friction for setup & seeding

---

## 🧱 Tech Stack

| Layer     | Technology                                                                                 |
| --------- | ------------------------------------------------------------------------------------------ |
| Frontend  | Next.js 14 (App Router, Client Components)                                                 |
| Backend   | Node.js + Express (via Next.js API routes)                                                 |
| API Layer | Next.js API Routes                                                                         |
| Database  | MongoDB + Mongoose                                                                         |
| Language  | TypeScript                                                                                 |
| Styling   | CSS Modules                                                                                |
| NLP       | [`compromise`](https://github.com/spencermountain/compromise) for natural language parsing |

---

## ⚙️ Setup

```bash
git clone https://github.com/rite01/NextJs_LLM.git
cd faceted-search-app
npm install
npm run dev && npm run seed
```
