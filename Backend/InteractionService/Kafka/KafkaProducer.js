const { KafkaRedpanda } = require("./KafkaInstance");



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
let isProducerAlive = false;
kafkaProducer.on(kafkaProducer.events.CONNECT, () => {
    isProducerAlive = true;
    console.log('Kafka Producer: Connected');
});

kafkaProducer.on(kafkaProducer.events.DISCONNECT, () => {
    isProducerAlive = false;
    console.error('Kafka Producer: Disconnected');
});

const getKafkaProducer = ()=>{
    return kafkaProducer;
}
const checkStatus = ()=>{
    return isProducerAlive;
}

module.exports = {getKafkaProducer,connectKafkaProducer,checkStatus}