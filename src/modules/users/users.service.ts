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
import { Pagination, forceDataToArray, getOrderBy } from 'src/core/utils';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  async findByUserName(userName: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        username: userName,
        deletedAt: null,
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
    const { take, skip } = queryData;
    const query: any = {
      where: {
        ...(queryData.search
          ? {
              OR: [
                {
                  firstName: {
                    contains: queryData.search,
                  },
                },
                {
                  lastName: {
                    contains: queryData.search,
                  },
                },
                {
                  email: {
                    contains: queryData.search,
                  },
                },
              ],
            }
          : {}),
      },
      take,
      skip,
      orderBy: queryData.order ? getOrderBy(queryData.order) : undefined,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
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
      query.where.deletedAt = queryData.active == 'true' ? null : { not: null };
    }
    if (queryData.roles) {
      const roles = forceDataToArray(queryData.roles).map((role) =>
        Number(role),
      );
      const userRoles: any = {
        some: {
          roleId: {
            in: roles,
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
    return Pagination.of(take, skip, total, users);
  }

  async findByID(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
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
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
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
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
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
    if (
      (await this.findByEmail(createUserDTO.email)) ||
      (await this.findByUserName(createUserDTO.username))
    ) {
      throw new BadRequestException(
        'The email or username has already exist !',
      );
    }
    const hashedPassword = await argon.hash(createUserDTO.password);
    createUserDTO.password = hashedPassword;
    return this.prismaService.user.create({
      data: {
        ...createUserDTO,
        userRoles: {
          create: {
            roleId: isUser ? Role.User : Role.Staff,
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
        avatarUrl: true,
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
          deletedAt: null,
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
          avatarUrl: true,
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
          deletedAt: null,
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
          avatarUrl: true,
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
        deletedAt: null,
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
        avatarUrl: true,
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

  async getRolesByReq(req: any) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: req.user.id,
      },
      select: {
        userRoles: true,
      },
    });
    return user.userRoles;
  }
}
