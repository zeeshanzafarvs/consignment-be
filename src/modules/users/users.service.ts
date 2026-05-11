import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepository.find({ relations: ['branch'] });
  }

  async findAllForBranch(branchId: string) {
    return this.userRepository.find({ 
      where: { branchId },
      relations: ['branch']
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: ['branch']
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ 
      where: { email },
      relations: ['branch']
    });
  }

   async create(data: {
     name: string;
     email: string;
     password: string;
     role: UserRole;
     branchId?: string;
   }, currentUser: User) {
     // Only Admin can create users
     if (currentUser.role !== UserRole.ADMIN) {
       throw new ForbiddenException('Only admins can create users');
     }

     // Only Admin can create Branch Manager or Site Officer
     if (data.role === UserRole.SITE_OFFICER || data.role === UserRole.BRANCH_MANAGER) {
       if (currentUser.role !== UserRole.ADMIN) {
         throw new ForbiddenException('Only admins can create branch managers or site officers');
       }
     }

     // Admin cannot create another Admin
     if (data.role === UserRole.ADMIN) {
       throw new BadRequestException('Cannot create admin users');
     }

    // Check if email already exists
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      branchId: data.branchId || null,
      isActive: true,
    } as Partial<User>);

    return this.userRepository.save(user);
  }

   async update(id: string, data: {
     name?: string;
     email?: string;
     role?: UserRole;
     branchId?: string | null;
   }, currentUser: User) {
     const user = await this.findOne(id);

     // Authorization checks
     if (currentUser.role === UserRole.SITE_OFFICER) {
       throw new ForbiddenException('Site officers cannot update users');
     }

     // Branch managers can only update users in their branch
     if (currentUser.role === UserRole.BRANCH_MANAGER) {
       if (user.branchId !== currentUser.branchId) {
         throw new ForbiddenException('Branch managers can only update users in their branch');
       }
     }

     // Prevent changing to Admin
     if (data.role === UserRole.ADMIN) {
       throw new BadRequestException('Cannot change role to admin');
     }

    // Check for email conflict if email is being changed
    if (data.email && data.email !== user.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update fields
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.role) user.role = data.role;
    if (data.branchId !== undefined) user.branchId = data.branchId || null;

    return this.userRepository.save(user);
  }

  async deactivate(id: string, currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    // Prevent self-deactivation
    if (id === currentUser.id) {
      throw new BadRequestException('Cannot deactivate yourself');
    }

    const user = await this.findOne(id);
    user.isActive = false;
    return this.userRepository.save(user);
  }

  async activate(id: string, currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can activate users');
    }

    const user = await this.findOne(id);
    user.isActive = true;
    return this.userRepository.save(user);
  }

  async resetPassword(id: string, newPassword: string, currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can reset passwords');
    }

    const user = await this.findOne(id);
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    return this.userRepository.save(user);
  }

  async assignBranch(id: string, branchId: string | null | undefined, currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can assign branches');
    }

    const user = await this.findOne(id);
    user.branchId = branchId || null;
    return this.userRepository.save(user);
  }

  async remove(id: string, currentUser: User) {
    // Prevent self-deletion
    if (id === currentUser.id) {
      throw new BadRequestException('Cannot delete yourself');
    }

    const user = await this.findOne(id);
    return this.userRepository.remove(user);
  }
}