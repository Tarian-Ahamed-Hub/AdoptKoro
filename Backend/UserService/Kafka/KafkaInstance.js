const { Kafka } = require("kafkajs");

const KafkaRedpanda = new Kafka({
  clientId: "posts-service",
  brokers: [process.env.KAFKA_URL], // kafka-38b3568f-tarian-04d3.f.aivencloud.com:19229
  connectionTimeout: 10000,
  requestTimeout: 30000,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.ca.replace(/\\n/g, "\n"),
    cert: process.env.ac.replace(/\\n/g, "\n"),
    key: process.env.ak.replace(/\\n/g, "\n"),
  },
});

module.exports = { KafkaRedpanda };