const {Redis} = require('ioredis');
 
 

let cacheRedis = null;

const connectRedis = ()=>{
    const redisCacheURL = process.env.REDIS_CACHE_URL;

    if(redisCacheURL){
        cacheRedis = new Redis(redisCacheURL)

        cacheRedis.on('connect',()=>console.log("CACHE Redis: connected"));
        cacheRedis.on('ready', () => console.log('CACHE Redis: Ready to accept commands'));
        cacheRedis.ping()
        .then(reply => console.log('CACHE Redis PING reply:', reply))   
        .catch(err => console.error('CACHE Redis PING failed:', err))
    }
    else{
        console.log("Cache Redis url is absent in env")
    }
}

const getRedisClient = () => {
  if (!cacheRedis) throw new Error("Redis client is not initialized");
  return cacheRedis;
};
 
const shutdownRedis = async () => {
  if (!cacheRedis) return;

  try {
    console.log("Closing CACHE Redis connection...");
    await cacheRedis.quit();  
    console.log("CACHE Redis connection closed");
  } catch (err) {
    console.error("Error while closing CACHE Redis:", err);
  }
};




module.exports = {cacheRedis,connectRedis,shutdownRedis,getRedisClient}