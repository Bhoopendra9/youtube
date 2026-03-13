const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Management API",
      version: "1.0.0",
      description: "Production-ready REST API documentation using Swagger"
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:3000/api/v1",
        description: "API Server"
      }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "123" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" }
          }
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" }
          }
        }
      }
    },

    security: [{ bearerAuth: [] }]
  },

  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJsdoc(options);
