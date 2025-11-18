const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class UserModel {
    static async create(userData) {
        const { first_name, last_name, email, password, auth_type = "email", google_id = null, url_photo = null } = userData;
        const id = uuidv4();

        const query = `
      INSERT INTO users (id, first_name, last_name, email, password, auth_type, google_id, created_at, updated_at, url_photo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8)
      RETURNING id, first_name, last_name, email, created_at, updated_at
    `;

        const values = [id, first_name, last_name, email, password, auth_type, google_id, url_photo];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = "SELECT * FROM users WHERE email = $1";
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async findByGoogleId(googleId) {
        const query = "SELECT * FROM users WHERE google_id = $1";
        const result = await pool.query(query, [googleId]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = "SELECT id, first_name, last_name, email, created_at, updated_at FROM users WHERE id = $1";
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async updateLastLogin(id) {
        const query = "UPDATE users SET updated_at = NOW() WHERE id = $1";
        await pool.query(query, [id]);
    }
}

module.exports = UserModel;
