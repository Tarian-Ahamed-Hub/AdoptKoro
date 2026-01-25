const { addUsers } = require("./KafkaController")
const { KafkaRedpanda } = require("./KafkaInstance")
 


const kafkaRegistrationConsumer = KafkaRedpanda.consumer(
    {
    groupId: "registration-consumer-interaction",
    maxBytesPerPartition: 1024 * 1024,

    }
)
const connectKafkaRegistrationSubscriber = async () => {
try{
     await kafkaRegistrationConsumer.connect()
      console.log("Kafka Registration Consumer Connected")
  await kafkaRegistrationConsumer.subscribe({
    topic: "registration",
    fromBeginning: true
  })

    await kafkaRegistrationConsumer.run({
      eachBatchAutoResolve: false,
      eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary }) => {
        const batchArray = [];
        const maxMessages = 1000; 
        let processed = 0;

        for (const message of batch.messages) {
          if (processed >= maxMessages) break;

          try {
            const data = JSON.parse(message.value.toString()); 
            batchArray.push(data); 
          } catch (err) {
            console.error("Invalid message JSON:", message.value.toString());
          }

          resolveOffset(message.offset);
          processed++;
        }
        console.log(batchArray);
        if (batchArray.length > 0) {
           addUsers(batchArray);
        }
        

        await commitOffsetsIfNecessary();
        await heartbeat();
      },
    });

 

}
catch(err){
    console.log("Error : Kafka Post Consumer ",err.message)
}
 
}

 
module.exports = {connectKafkaRegistrationSubscriber}