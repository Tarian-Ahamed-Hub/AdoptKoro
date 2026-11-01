require("dotenv").config();
const { Kafka } = require("kafkajs");

const KafkaRedpanda = new Kafka({
  clientId: "chat-service",
  brokers: [process.env.KAFKA_URL],
  connectionTimeout: 10000,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.ca,
    cert: process.env.ac,
    key: process.env.ak,
  },
});

module.exports = { KafkaRedpanda };