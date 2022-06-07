import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import "reflect-metadata";
import { UserResolver } from "./resolvers/user";
import cors from "cors";

import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
// import { sendEmail } from "./utils/sendEmail";
// import { User } from "./entities/User";

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  //await orm.em.nativeDelete(User, {});
  await orm.getMigrator().up();

  const app = express();

  const RedisStore = connectRedis(session);
  //const redisClient = redis.createClient({ legacyMode: true });
  const redisClient = new Redis("redis://default:redispw@localhost:49153");

  redisClient.on("connect", () => console.log("Connected to Redis!"));
  redisClient.on("error", (err: Error) =>
    console.log("Redis Client Error", err)
  );
  // redisClient.connect();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redisClient as any, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        secure: __prod__, // only set cookie on https
        sameSite: "lax", // can be used in cross-origin requests
      },
      saveUninitialized: false,
      secret: "adohiondabpoqwqwyih",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(4000, () => {
    console.log("Server started on localhost:4000");
  });
};

main().catch((err) => {
  console.error(err);
});
