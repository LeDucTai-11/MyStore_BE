import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDTO, UpdateUserDTO } from './dto';
import * as argon from 'argon2';
import { Role } from 'src/core/enum/roles.enum';
import { Pagination } from 'src/core/utils';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  async findByUserName(userName: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        username: userName,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
    return user;
  }

  async findAll(queryData: any) {
    const limit = Number(queryData.limit) || 10;
    const offset = Number(queryData.offset) || 0;
    const roles = queryData.roles.map((role) => Number(role));
    const query: any = {
      where: {
        ...(queryData.key
          ? {
              OR: [
                {
                  firstName: {
                    contains: queryData.key,
                  },
                },
                {
                  lastName: {
                    contains: queryData.key,
                  },
                },
                {
                  email: {
                    contains: queryData.key,
                  },
                },
              ],
            }
          : {}),
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        address: true,
        userRoles: {
          select: {
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            deletedAt: null,
          },
        },
        createdAt: true,
      },
    };
    if (queryData.active !== undefined) {
      query.where.deletedAt = (queryData.active == "true") ? null : { not: null };
    }
    if (queryData.roles) {
      const userRoles: any = {
        some: {
          roleId: {
            in: roles
          },
        },
      };
      query.where.userRoles = userRoles;
    }
    const [total, users] = await Promise.all([
      this.prismaService.user.count({
        where: query.where,
      }),
      this.prismaService.user.findMany(query),
    ]);
    return Pagination.of(limit, offset, total, users);
  }

  async findByID(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        address: true,
        userRoles: {
          select: {
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            deletedAt: null,
          },
        },
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found with ID: ' + id);
    }
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        address: true,
        passwordResetToken: true,
        passwordResetExpiration: true,
        userRoles: {
          select: {
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            deletedAt: null,
          },
        },
        createdAt: true,
      },
    });
    return user;
  }

  async findByResetPasswordToken(resetPasswordToken: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        passwordResetToken: resetPasswordToken,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        address: true,
        passwordResetToken: true,
        passwordResetExpiration: true,
        userRoles: {
          select: {
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            deletedAt: null,
          },
        },
        createdAt: true,
      },
    });
    return user;
  }

  async createUser(createUserDTO: CreateUserDTO, isUser = true) {
    const hashedPassword = await argon.hash(createUserDTO.password);
    createUserDTO.password = hashedPassword;
    return this.prismaService.user.create({
      data: {
        ...createUserDTO,
        userRoles: {
          create: {
            roleId: isUser ? Role.User : Role.Cashier,
          },
        },
        userCart: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        address: true,
        userRoles: {
          select: {
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            deletedAt: null,
          },
        },
        createdAt: true,
      },
    });
  }

  async updateResetPassword(
    userID: string,
    resetPasswordToken: string,
    resetPasswordExpiration: Date,
  ) {
    try {
      return await this.prismaService.user.update({
        where: {
          id: userID,
        },
        data: {
          passwordResetToken: resetPasswordToken,
          passwordResetExpiration: resetPasswordExpiration,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          gender: true,
          phone: true,
          address: true,
          userRoles: {
            select: {
              roleId: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            where: {
              deletedAt: null,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e) {
      throw new HttpException(e.message, 500, {
        cause: new Error('Some Error'),
      });
    }
  }

  async updatePassword(userID: string, password: string) {
    const hashedPassword = await argon.hash(password);
    try {
      return await this.prismaService.user.update({
        where: {
          id: userID,
        },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          gender: true,
          phone: true,
          address: true,
          userRoles: {
            select: {
              roleId: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            where: {
              deletedAt: null,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e) {
      throw new HttpException(e.message, 500, {
        cause: new Error('Some Error'),
      });
    }
  }

  async updateProfile(req: any, updateUserDTO: UpdateUserDTO) {
    if (updateUserDTO.email) {
      const user = await this.findByEmail(updateUserDTO.email);
      if (user && user.id !== req.user.id) {
        throw new BadRequestException('The email has already exist !');
      }
    }
    return await this.prismaService.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        ...updateUserDTO,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        gender: true,
        phone: true,
        address: true,
        userRoles: {
          select: {
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            deletedAt: null,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
