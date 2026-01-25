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


const getKafkaProducer = ()=>{
    return kafkaProducer;
}

module.exports = {getKafkaProducer,connectKafkaProducer}