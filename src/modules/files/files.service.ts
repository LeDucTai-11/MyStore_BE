import { BadRequestException, Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FilesService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async uploadProfile(req: any, file: Express.Multer.File) {
    const folderName = `${this.configService.get('CLOUDINARY_FOLDER')}/users/${
      req.user.email
    }`;
    const uploadOptions = {
      folder: folderName,
      public_id: 'profile_image',
      allowed_formats: ['jpg', 'png'],
    };
    const uploadedFile = await this.cloudinaryService.uploadFile(
      file,
      uploadOptions,
    );
    return this.prismaService.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        avatarUrl: uploadedFile.url,
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

  async uploadFile(file: Express.Multer.File, object: string) {
    if (!object || object.split(':').length != 2) {
      throw new BadRequestException('Object is not valid');
    }
    const [typeObj, id] = object.split(':');
    const folderName = `${this.configService.get(
      'CLOUDINARY_FOLDER',
    )}/${typeObj}`;
    const uploadOptions = {
      folder: folderName,
      public_id: 'image',
      allowed_formats: ['jpg', 'png'],
    };
    const uploadedFile = await this.cloudinaryService.uploadFile(
      file,
      uploadOptions,
    );
  }
}
