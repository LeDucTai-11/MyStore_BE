import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from 'src/core/enum/roles.enum';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ShipperService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByID(id: string) {
    const shipper = await this.prismaService.user.findUnique({
      where: {
        id: id,
        userRoles: {
          some: {
            roleId: {
              in: [Role.Shipper],
            },
          },
        },
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
        createdAt: true,
      },
    });
    if (!shipper) {
      throw new NotFoundException('Shipper not found with ID: ' + id);
    }
    return shipper;
  }
}
