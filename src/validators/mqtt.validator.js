const Joi = require("joi");

const mqttValidator = {
    subscribe: (data) => {
        const schema = Joi.object({
            topic: Joi.string().min(1).required(),
        });
        return schema.validate(data);
    },

    publish: (data) => {
        const schema = Joi.object({
            topic: Joi.string().min(1).required(),
            message: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
            qos: Joi.number().valid(0, 1, 2).optional(),
            retain: Joi.boolean().optional(),
        });
        return schema.validate(data);
    },
};

module.exports = mqttValidator;
