
 
const { addChat } = require("../Controllers/privateControllers/messageController")
const { KafkaRedpanda } = require("./KafkaInstance")



const kafkaChatConsumer = KafkaRedpanda.consumer(
    {
    groupId: "chat-service-group",
    maxBytesPerPartition: 10 *1024 * 1024,
    }
)
const connectKafkaChatSubscriber = async () => {
try{
     await kafkaChatConsumer.connect()
      console.log("Kafka Post Consumer Connected")
  await kafkaChatConsumer.subscribe({
    topic: "chat",
    fromBeginning: true
  })

    await kafkaChatConsumer.run({
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
            resolveOffset(message.offset);
          } catch (err) {
            console.error("Invalid message JSON:", message.value.toString());
            break;
          }
          processed++;
        }
       // console.log(batchArray);
        if (batchArray.length > 0) {
           addChat(batchArray);
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

 
module.exports = {connectKafkaChatSubscriber}