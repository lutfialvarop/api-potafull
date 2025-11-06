exports.shorthands = undefined;

exports.up = (pgm) => {
    // Create detail_pots table
    pgm.createTable("detail_pots", {
        id: {
            type: "VARCHAR(50)",
            primaryKey: true,
            notNull: true,
        },
        pot_id: {
            type: "VARCHAR(10)",
            notNull: true,
            references: "pots(id)",
            onDelete: "CASCADE",
        },
        n: {
            type: "INTEGER",
            notNull: true,
        },
        p: {
            type: "INTEGER",
            notNull: true,
        },
        k: {
            type: "INTEGER",
            notNull: true,
        },
        temperature: {
            type: "FLOAT(10)",
            notNull: true,
        },
        moisture: {
            type: "FLOAT(10)",
            notNull: true,
        },
        ph: {
            type: "FLOAT(10)",
            notNull: true,
        },
        salinity: {
            type: "FLOAT(10)",
            notNull: true,
        },
        conductivity: {
            type: "FLOAT(10)",
            notNull: true,
        },
        water_level: {
            type: "FLOAT(10)",
            notNull: true,
        },
        soil_health: {
            type: "FLOAT(10)",
            notNull: true,
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

    pgm.createIndex("detail_pots", "pot_id", {
        name: "idx_detail_pots_pot_id",
    });

    pgm.createIndex("detail_pots", "created_at", {
        name: "idx_detail_pots_created_at",
    });
};

exports.down = (pgm) => {
    // Drop indexes
    pgm.dropIndex("detail_pots", "created_at", {
        name: "idx_detail_pots_created_at",
        ifExists: true,
    });

    pgm.dropIndex("detail_pots", "pot_id", {
        name: "idx_detail_pots_pot_id",
        ifExists: true,
    });

    pgm.dropTable("detail_pots", { ifExists: true, cascade: true });
};
