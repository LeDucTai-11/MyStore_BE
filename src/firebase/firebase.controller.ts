import { Controller, Get } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('firebase')
@Controller('firebase')
export class FirebaseController {
  constructor(private firebaseService: FirebaseService) {}
}
