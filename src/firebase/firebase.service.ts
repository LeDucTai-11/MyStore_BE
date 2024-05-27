import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  child,
  get,
  getDatabase,
  push,
  ref,
  runTransaction,
  set,
} from 'firebase/database';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { logger } from 'src/logger';

@Injectable()
export class FirebaseService {
  private readonly firebaseApp: FirebaseApp;

  constructor(private readonly configService: ConfigService) {
    if (!this.firebaseApp) {
      const firebaseConfig = {
        apiKey: this.configService.get<string>('FIREBASE_API_KEY'),
        authDomain: this.configService.get<string>('FIREBASE_AUTH_DOMAIN'),
        databaseURL: this.configService.get<string>('FIREBASE_DATABASE_URL'),
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        storageBucket: this.configService.get<string>(
          'FIREBASE_STORAGE_BUCKET',
        ),
        messagingSenderId: this.configService.get<string>(
          'FIREBASE_MESSAGING_SENDER_ID',
        ),
        appId: this.configService.get<string>('FIREBASE_APP_ID'),
      };

      // Initialize Firebase
      this.firebaseApp = initializeApp(firebaseConfig);
    }
  }

  getFirebaseInstance() {
    return this.firebaseApp;
  }

  async getDataFromFirebase(path: string): Promise<any> {
    const dbRef = ref(getDatabase(this.firebaseApp));
    return get(child(dbRef, path))
      .then((snapshot) => {
        if (snapshot.exists()) {
          console.log(snapshot.val());
          return snapshot.val();
        } else {
          console.log('No data available');
        }
      })
      .catch((error) => {
        logger.error('Error getting data from Firebase', error.stack);
        throw new Error('Failed to get data from Firebase');
      });
  }

  async sendDataToFirebase(path: string, data: any): Promise<void> {
    try {
      const db = getDatabase(this.firebaseApp);
      set(ref(db, path), data);
      console.log('Data sent successfully:', data);
    } catch (error) {
      logger.error('Error sending data to Firebase', error.stack);
      throw new BadRequestException('Failed to send data to Firebase');
    }
  }
}
