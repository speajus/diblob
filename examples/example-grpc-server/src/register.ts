import type { Container } from "@speajus/diblob";
import { grpcServiceRegistry } from "@speajus/diblob-connect";
import { databaseClient } from "@speajus/diblob-drizzle";
import { userService, UserServiceImpl } from "./user-service";
import { UserService } from "./generated/user_pb";

export function registerUserService(container: Container): void {
    
    
  container.register(userService, UserServiceImpl, databaseClient);

  grpcServiceRegistry.registerService(UserService, userService);
  
}