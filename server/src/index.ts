import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

// import { sendEmail } from "./utils/sendEmail";
// import { User } from "./entities/User";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "lilReddit2",
    username: "postgres",
    password: "0611",
    logging: true,
    synchronize: true,
    entities: [Post, User],
  });

  //await orm.em.nativeDelete(User, {});
  // await Post.delete({});

  const app = express();

  const RedisStore = connectRedis(session);

  const redisClient = new Redis("redis://default:redispw@localhost:49153");

  redisClient.on("connect", () => console.log("Connected to Redis!"));
  redisClient.on("error", (err: Error) =>
    console.log("Redis Client Error", err)
  );

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
    context: ({ req, res }) => ({ req, res, redisClient }),
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
