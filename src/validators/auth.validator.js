const Joi = require("joi");

const authValidator = {
    register: (data) => {
        const schema = Joi.object({
            first_name: Joi.string().min(2).max(255).required(),
            last_name: Joi.string().min(2).max(255).required(),
            email: Joi.string().email().max(255).required(),
            password: Joi.string().min(8).max(255).required(),
        });
        return schema.validate(data);
    },

    login: (data) => {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        });
        return schema.validate(data);
    },

    googleAuth: (data) => {
        const schema = Joi.object({
            id_token: Joi.string().required(),
        });
        return schema.validate(data);
    },
};

module.exports = authValidator;
