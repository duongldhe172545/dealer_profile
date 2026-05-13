const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const env = require('../config/env');

function applySchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);
  console.log('  ✓ Schema applied');
}

function seedAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (existing) {
    console.log('  ✓ Admin already exists, skip seeding');
    return;
  }

  const passwordHash = bcrypt.hashSync(env.seedAdmin.password, env.bcrypt.rounds);
  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, status)
    VALUES (?, ?, ?, 'admin', 'active')
  `).run(env.seedAdmin.username, passwordHash, 'Quản trị viên');

  console.log(`  ✓ Created admin: ${env.seedAdmin.username}`);
}

function run() {
  console.log('Migrating database...');
  applySchema();
  seedAdmin();
  console.log('Done.');
}

if (require.main === module) {
  try {
    run();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

module.exports = run;
