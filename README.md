# 🗳️ Voting App – Norwegian Political Party Poll

A fullstack web application where users can register, log in, and vote for Norwegian political parties. Results are displayed in real-time.

[**Live demo**](https://voting-app-bcvi.onrender.com/)

---

## ⚙️ Features

- 🔐 User registration & login (JWT + bcrypt)
- 🗳️ One vote per user
- 📊 Real-time vote results per party
- 🌐 Hosted on Render

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Auth:** bcryptjs, JWT
- **Hosting:** Render
- **Other:** CORS, dotenv, pg

---

## 🚀 Getting Started

To run this project locally:

1. **Clone the repo:**
   ```bash
   git clone https://github.com/KovalDenys1/Voting-app.git
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory with the following:
   ```
   DATABASE_URL=your_postgres_connection_string
   JWT_SECRET=your_secret_key
   ```

4. **Start the server:**
   ```bash
   node index.js
   ```

5. Open your browser at `http://localhost:PORT`

---

## 🧩 Database Schema (PostgreSQL)

Create the required tables before running the app:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE parties (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  username TEXT REFERENCES users(username),
  party TEXT REFERENCES parties(name)
);
```

You can add some initial parties like this:

```sql
INSERT INTO parties (name) VALUES
('Arbeiderpartiet'),
('Høyre'),
('Fremskrittspartiet'),
('Senterpartiet'),
('Miljøpartiet De Grønne');
```

---

## 📬 Contact

Feel free to connect:

- [LinkedIn](https://www.linkedin.com/in/denys-koval-8b219223a/)
- [Telegram](https://t.me/kovaldenys1)

---

> Made with passion and curiosity by Denys Koval