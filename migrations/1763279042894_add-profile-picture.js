exports.shorthands = undefined;

exports.up = (pgm) => {
    // Add profile_picture column to users table
    pgm.addColumn("users", {
        url_photo: {
            type: "TEXT",
            notNull: false,
        },
    });
};

exports.down = (pgm) => {
    pgm.dropColumn("users", "url_photo");
};
