const { Kafka } = require("kafkajs");
const fs = require("fs");
 
const KafkaRedpanda = new Kafka({
  clientId: "posts-service",
  brokers: [process.env.KAFKA_URL], 

  ssl: {
  rejectUnauthorized: true,
  ca: process.env.ca,
  cert: process.env.ac,
  key: process.env.ak,
}
});

module.exports = { KafkaRedpanda };