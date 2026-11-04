require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("./config/db");

const users = [
  { name: "Admin User",   email: "admin@erp.com",   password: "Admin@123",   role: "Admin" },
  { name: "Manager User", email: "manager@erp.com", password: "Manager@123", role: "Manager" },
  { name: "Worker User",  email: "worker@erp.com",  password: "Worker@123",  role: "Worker" },
];

(async () => {
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id)
       VALUES ($1, $2, $3, (SELECT id FROM roles WHERE name = $4))
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, hash, u.role]
    );
    console.log("Added", u.email);
  }
  await pool.end();
})().catch((err) => { console.error(err.message); process.exit(1); });