import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'evfeedback-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}