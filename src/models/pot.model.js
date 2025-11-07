const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class PotModel {
    static async create(potData) {
        const { id, user_id, type_pot_id } = potData;

        const query = `
      INSERT INTO pots (id, user_id, type_pot_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, user_id, type_pot_id, created_at, updated_at
    `;

        const values = [id, user_id, type_pot_id];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findById(id) {
        const query = "SELECT * FROM pots WHERE id = $1";
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findByUserId(userId) {
        const query = `
      SELECT p.*, tp.name as type_name, tp.max_water
      FROM pots p
      LEFT JOIN type_pots tp ON p.type_pot_id = tp.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    static async findByIdAndUserId(potId, userId) {
        const query = `
      SELECT p.*, tp.name as type_name, tp.max_water
      FROM pots p
      LEFT JOIN type_pots tp ON p.type_pot_id = tp.id
      WHERE p.id = $1 AND p.user_id = $2
    `;
        const result = await pool.query(query, [potId, userId]);
        return result.rows[0];
    }

    static async update(id, userId) {
        const query = `
      UPDATE pots 
      SET user_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
        const result = await pool.query(query, [userId, id]);

        return result.rows[0];
    }

    static async delete(id, userId) {
        const query = "DELETE FROM pots WHERE id = $1 AND user_id = $2 RETURNING *";
        const result = await pool.query(query, [id, userId]);
        return result.rows[0];
    }
}

class DetailPotModel {
    static async create(detailData) {
        const { pot_id, n, p, k, temperature, moisture, ph, salinity, conductivity, water_level, soil_health } = detailData;

        const id = uuidv4();

        const query = `
      INSERT INTO detail_pots (
        id, pot_id, n, p, k, temperature, moisture, ph,
        salinity, conductivity, water_level, soil_health,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;

        const values = [id, pot_id, n, p, k, temperature, moisture, ph, salinity, conductivity, water_level, soil_health];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getLatestByPotId(potId) {
        const query = `
      SELECT * FROM detail_pots
      WHERE pot_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
        const result = await pool.query(query, [potId]);
        return result.rows[0];
    }

    static async getHistoryByPotId(potId, limit = 100) {
        const query = `
      SELECT * FROM detail_pots
      WHERE pot_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
        const result = await pool.query(query, [potId, limit]);
        return result.rows;
    }
}

class TypePotModel {
    static async findAll() {
        const query = "SELECT * FROM type_pots ORDER BY name ASC";
        const result = await pool.query(query);
        return result.rows;
    }

    static async findById(id) {
        const query = "SELECT * FROM type_pots WHERE id = $1";
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = {
    PotModel,
    DetailPotModel,
    TypePotModel,
};
