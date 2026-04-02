
const { addPosts } = require("./KafkaController")
const { KafkaRedpanda } = require("./KafkaInstance")
 


const kafkaPostConsumer = KafkaRedpanda.consumer(
    {
    groupId: "post-service-group",
    maxBytesPerPartition: 10 *1024 * 1024,
    }
)
// const kafkaPostConsumer = KafkaRedpanda.consumer({
//    groupId:"id",
//    maxBytesPerPartition:10*1024*1024 //10 mb
// })

const connectKafkaPostSubscriber = async () => {
try{
     await kafkaPostConsumer.connect()
      console.log("Kafka Post Consumer Connected")

      await kafkaPostConsumer.subscribe({
        topic: "posts",
        fromBeginning: true
      })
       
   
    await kafkaPostConsumer.run({
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
       // console.log(batchArray);
        if (batchArray.length > 0) {
           addPosts(batchArray);
        }
        

        await commitOffsetsIfNecessary();
        await heartbeat();
      },
    });

  //  await kafkaPostConsumer.run({
  //   eachBatchAutoResolve:false,
  //   eachBatch: async({batch,resolveOffset,heartbeat,commitOffsetsIfNecessary})=>{
  //         //batch.messages contains messages
  //         //eachMessage.offset is its offset
  //         //eachMessage.value is the value passed from producer
  //         //resolveOffset(message.offset)
  //         //finnaly commitOffsetIfNecessary();
  //         //await heartbeat() to let kafka know that the consumer is alive

  //   }
  // })

}
catch(err){
    console.log("Error : Kafka Post Consumer ",err.message)
}
 
}

 
module.exports = {connectKafkaPostSubscriber}