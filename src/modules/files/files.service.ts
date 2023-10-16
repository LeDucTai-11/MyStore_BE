import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { isEnumValue } from 'src/core/utils';
import { UploadFileEnum } from 'src/core/enum/uploadFileEnum';

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
    const uploadedFile = await this.cloudinaryService.uploadFile(file, uploadOptions);
    return {
      url: uploadedFile.url
    };
  }

  async uploadFile(file: Express.Multer.File, object: string) {
    if (!object || object.split(':').length != 2) {
      throw new BadRequestException('Object is not valid');
    }
    const [typeObj, id] = object.split(':');
    if (!isEnumValue(UploadFileEnum, typeObj)) {
      throw new BadRequestException(
        `TypeUpload must be in: ${Object.values(
          UploadFileEnum,
        )}. Your value is: '${typeObj}'`,
      );
    }

    const foundObject = await this.prismaService[typeObj].findFirst({
      where: {
        id: id,
      },
    });
    if (!foundObject) {
      throw new NotFoundException(`The ${typeObj} with ID:${id} was not found`);
    }

    const folderName = `${this.configService.get(
      'CLOUDINARY_FOLDER',
    )}/${typeObj}/${id}`;
    const uploadOptions = {
      folder: folderName,
      public_id: 'image',
      allowed_formats: ['jpg', 'png'],
    };
    const uploadedFile = await this.cloudinaryService.uploadFile(file, uploadOptions);
    return {
      url: uploadedFile.url
    };
  }
}
