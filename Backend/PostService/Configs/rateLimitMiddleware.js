const { getRedisClient } = require("../Configs/cacheRedis");  

const TOKEN_BUCKET_LUA = `
local key = KEYS[1]                          -- the Redis key for this IP's bucket
local capacity = tonumber(ARGV[1])           -- max tokens the bucket can hold (burst size)
local refill_rate = tonumber(ARGV[2])        -- tokens added per second
local now = tonumber(ARGV[3])                -- current time in ms, passed from Node
local cost = tonumber(ARGV[4])               -- tokens this request consumes (usually 1)

local data = redis.call("HMGET", key, "tokens", "ts")  -- read both fields from the hash
local tokens = tonumber(data[1])             -- tokens left at last update (nil if new)
local ts = tonumber(data[2])                 -- time of last update (nil if new)

if tokens == nil then                        -- first request ever from this IP
  tokens = capacity                          -- start with a full bucket
  ts = now                                   -- no time has passed yet
end

local elapsed = math.max(0, now - ts) / 1000 -- seconds since last request (never negative)
tokens = math.min(capacity, tokens + elapsed * refill_rate) -- add earned tokens, cap at capacity

local allowed = 0                            -- assume rejected
if tokens >= cost then                       -- enough tokens for this request?
  tokens = tokens - cost                     -- spend them
  allowed = 1                                -- mark as allowed
end

redis.call("HSET", key, "tokens", tokens, "ts", now)  -- save new token count and timestamp
redis.call("PEXPIRE", key, math.ceil(capacity / refill_rate * 1000) * 2) -- auto-delete idle buckets (2x full-refill time)

return { allowed, tostring(tokens) }         -- tostring keeps the decimal part (Redis would truncate a number)
`;

const rateLimiter = ({ capacity = 5, refillRate = 1, path = "all", cost = 1 } = {}) => {
  
  return async (req, res, next) => {
    try {
      const redis = getRedisClient();                      
      const key = `tokenbucket:${path}:ip:${req.ip}`;      

      const [allowed, remaining] = await redis.eval(       
        TOKEN_BUCKET_LUA,  // script source
        1,                 // number of KEYS (the rest are ARGV)
        key,               // KEYS[1]
        capacity,          // ARGV[1]
        refillRate,        // ARGV[2]
        Date.now(),        // ARGV[3]: current time in ms
        cost               // ARGV[4]
      );

      const tokensLeft = Math.floor(Number(remaining));     

      res.set({
        "X-RateLimit-Limit": capacity,                      
        "X-RateLimit-Remaining": tokensLeft,                
      });

      if (!allowed) {                                      
        const retryAfter = Math.ceil((cost - Number(remaining)) / refillRate);  
        res.set("Retry-After", retryAfter);                
        return res.status(429).json({                   
          success: false,
          message: "Too many requests. Try again after a few moments",
          retryAfter,
        });
      }

      next();                                              
    } catch (err) {
      console.error("Rate limiter Redis error:", err);     
      next();                                               
    }
  };
};

module.exports = rateLimiter;