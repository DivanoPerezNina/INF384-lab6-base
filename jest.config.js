module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  // Requisito 7.1: el pipeline falla si la cobertura de líneas baja de 80 %.
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};
