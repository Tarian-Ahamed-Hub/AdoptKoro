const {Kafka} = require("kafkajs")

const KafkaRedpanda = new Kafka({
  brokers: [process.env.KAFKA_URL],
  ssl: {},
  sasl: {
    mechanism: process.env.KAFKA_MECHANISM,
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASS,
  }
})


module.exports = {KafkaRedpanda}