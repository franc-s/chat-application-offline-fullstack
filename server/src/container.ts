import { PrismaClient } from '@prisma/client';

// Repositories
import { UserRepository } from './repositories/UserRepository.js';
import { GroupRepository } from './repositories/GroupRepository.js';
import { MessageRepository } from './repositories/MessageRepository.js';
import { MembershipRepository } from './repositories/MembershipRepository.js';

// Services
import { UserService } from './services/UserService.js';
import { GroupService } from './services/GroupService.js';
import { MessageService } from './services/MessageService.js';
import { EventService } from './services/EventService.js';

// Controllers
import { UserController } from './controllers/UserController.js';
import { GroupController } from './controllers/GroupController.js';
import { MessageController } from './controllers/MessageController.js';
import { EventController } from './controllers/EventController.js';

export class Container {
  private static instance: Container;
  
  // Infrastructure
  public readonly prisma: PrismaClient;
  
  // Repositories
  public readonly userRepository: UserRepository;
  public readonly groupRepository: GroupRepository;
  public readonly messageRepository: MessageRepository;
  public readonly membershipRepository: MembershipRepository;
  
  // Services
  public readonly userService: UserService;
  public readonly groupService: GroupService;
  public readonly messageService: MessageService;
  public readonly eventService: EventService;
  
  // Controllers
  public readonly userController: UserController;
  public readonly groupController: GroupController;
  public readonly messageController: MessageController;
  public readonly eventController: EventController;

  private constructor() {
    // Infrastructure
    this.prisma = new PrismaClient();
    
    // Repositories
    this.userRepository = new UserRepository(this.prisma);
    this.groupRepository = new GroupRepository(this.prisma);
    this.messageRepository = new MessageRepository(this.prisma);
    this.membershipRepository = new MembershipRepository(this.prisma);
    
    // Services
    this.userService = new UserService(this.userRepository);
    this.groupService = new GroupService(
      this.groupRepository, 
      this.userService, 
      this.membershipRepository
    );
    this.messageService = new MessageService(
      this.messageRepository,
      this.groupRepository,
      this.userService,
      this.membershipRepository
    );
    this.eventService = new EventService(
      this.messageService,
      this.groupService
    );
    
    // Controllers
    this.userController = new UserController(this.userService);
    this.groupController = new GroupController(this.groupService);
    this.messageController = new MessageController(this.messageService);
    this.eventController = new EventController(this.eventService);
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
