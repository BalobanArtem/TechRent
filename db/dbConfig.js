const sql = require('mssql');

const config = {
  user: 'Artem',
  password: '12345',
  server: 'Artem',
  database: 'TechRent',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

module.exports = {
  sql,
  config
};
