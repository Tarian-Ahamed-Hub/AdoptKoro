const {Kafka} = require("kafkajs")

const KafkaRedpanda = new Kafka({
  clientId: 'chat-service-prod',
  brokers: [process.env.KAFKA_URL],
  ssl: {},
  sasl: {
    mechanism: process.env.KAFKA_MECHANISM,
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASS,
  }
})


module.exports = {KafkaRedpanda}