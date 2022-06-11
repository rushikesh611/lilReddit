import { Request, Response } from "express";
import { Redis } from "ioredis";

export type MyContext = {
  // @ts-ignore
  req: Request & { session: Express.Session };
  redisClient: Redis;
  res: Response;
};
