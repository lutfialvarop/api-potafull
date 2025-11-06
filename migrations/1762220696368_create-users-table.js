exports.shorthands = undefined;

exports.up = (pgm) => {
    // Create users table
    pgm.createTable("users", {
        id: {
            type: "VARCHAR(50)",
            primaryKey: true,
            notNull: true,
        },
        first_name: {
            type: "VARCHAR(255)",
            notNull: true,
        },
        last_name: {
            type: "VARCHAR(255)",
            notNull: true,
        },
        email: {
            type: "VARCHAR(255)",
            notNull: true,
            unique: true,
        },
        password: {
            type: "VARCHAR(255)",
            notNull: false,
        },
        auth_type: {
            type: "VARCHAR(20)",
            notNull: true,
            default: "email",
        },
        google_id: {
            type: "VARCHAR(255)",
            notNull: false,
            unique: true,
        },
        created_at: {
            type: "TIMESTAMP",
            notNull: true,
            default: pgm.func("CURRENT_TIMESTAMP"),
        },
        updated_at: {
            type: "TIMESTAMP",
            notNull: true,
            default: pgm.func("CURRENT_TIMESTAMP"),
        },
    });

    // Create indexes
    pgm.createIndex("users", "email", {
        name: "idx_users_email",
    });

    pgm.createIndex("users", "google_id", {
        name: "idx_users_google_id",
    });

    pgm.createIndex("users", "auth_type", {
        name: "idx_users_auth_type",
    });

    // Add comment
    pgm.sql(`
    COMMENT ON TABLE users IS 'Table untuk menyimpan data user';
    COMMENT ON COLUMN users.auth_type IS 'Tipe autentikasi: email atau google';
  `);
};

exports.down = (pgm) => {
    // Drop indexes first
    pgm.dropIndex("users", "auth_type", {
        name: "idx_users_auth_type",
        ifExists: true,
    });

    pgm.dropIndex("users", "google_id", {
        name: "idx_users_google_id",
        ifExists: true,
    });

    pgm.dropIndex("users", "email", {
        name: "idx_users_email",
        ifExists: true,
    });

    // Drop table
    pgm.dropTable("users", { ifExists: true });
};
