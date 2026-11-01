const { Kafka } = require("kafkajs");

const KafkaRedpanda = new Kafka({
  clientId: "posts-service",
  brokers: [process.env.KAFKA_URL],
  connectionTimeout: 10000, // default 1000ms is tight for a cloud TLS handshake
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.ca,
    cert: process.env.ac,
    key: process.env.ak,
  },
});

module.exports = { KafkaRedpanda };