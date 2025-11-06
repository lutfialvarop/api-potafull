exports.shorthands = undefined;

exports.up = (pgm) => {
    // Create pots table
    pgm.createTable("pots", {
        id: {
            type: "VARCHAR(10)",
            primaryKey: true,
            notNull: true,
        },
        user_id: {
            type: "VARCHAR(50)",
            notNull: true,
            references: "users(id)",
            onDelete: "CASCADE",
        },
        type_pot_id: {
            type: "VARCHAR(50)",
            notNull: true,
            references: "type_pots(id)",
            onDelete: "RESTRICT",
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

    pgm.createIndex("pots", "user_id", {
        name: "idx_pots_user_id",
    });

    pgm.createIndex("pots", "type_pot_id", {
        name: "idx_pots_type_pot_id",
    });
};

exports.down = (pgm) => {
    // Drop indexes
    pgm.dropIndex("pots", "type_pot_id", {
        name: "idx_pots_type_pot_id",
        ifExists: true,
    });

    pgm.dropIndex("pots", "user_id", {
        name: "idx_pots_user_id",
        ifExists: true,
    });

    pgm.dropTable("pots", { ifExists: true, cascade: true });
};
