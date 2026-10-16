import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Salon Management System API",
      version: "1.0.0",
      description:
        "API documentation for the Salon Management System",
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;