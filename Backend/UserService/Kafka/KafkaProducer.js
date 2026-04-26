const { KafkaRedpanda } = require("./KafkaInstance");
 
const kafkaConsumer = KafkaRedpanda.consumer({groupId: "posts-service-group"})

const kafkaProducer = KafkaRedpanda.producer()
const connectKafkaProducer = async()=>{
 
    try{
        await kafkaProducer.connect();
        console.log("Kafka Producer connected")
    }
     catch(err){
        console.log("Kafka Error ", err.message)
     }
     
}

const connectKafkaPostSubscriber = async () => {
  await kafkaConsumer.connect()
  await kafkaConsumer.subscribe({
    topic: "posts",
    fromBeginning: true
  })
  await kafkaConsumer.run({
    eachMessage: async ({topic, partition, message}) => {
      const topicInfo = `topic: ${topic} (${partition}|${message.offset})`
      const messageInfo = `key: ${message.key?.toString()}, value: ${message.value?.toString()}`
      console.log(`Message consumed: ${topicInfo}, ${messageInfo}`)
    },
  })
}

const getKafkaProducer = ()=>{
    return kafkaProducer;
}

module.exports = {getKafkaProducer,connectKafkaProducer}