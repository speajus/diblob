import type { Container } from "@speajus/diblob";
import { grpcServiceRegistry } from "@speajus/diblob-connect";
import { UserService } from "./generated/user_pb";
import { UserServiceImpl, userService } from "./user-service";

export function registerUserService(container: Container): void {
    
    
  container.register(userService, UserServiceImpl);

  grpcServiceRegistry.registerService(UserService, userService);
  
}