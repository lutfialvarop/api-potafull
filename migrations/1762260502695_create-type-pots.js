exports.shorthands = undefined;

exports.up = (pgm) => {
    // Create type_pots table
    pgm.createTable("type_pots", {
        id: {
            type: "VARCHAR(50)",
            primaryKey: true,
            notNull: true,
        },
        name: {
            type: "VARCHAR(255)",
            notNull: true,
        },
        max_water: {
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
};

exports.down = (pgm) => {
    // Drop type_pots table
    pgm.dropTable("type_pots", { ifExists: true, cascade: true });
};
