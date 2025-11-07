const Joi = require("joi");

const potValidator = {
    addPot: (data) => {
        const schema = Joi.object({
            pot_id: Joi.string().length(10).required(),
        });
        return schema.validate(data);
    },
};

module.exports = potValidator;
