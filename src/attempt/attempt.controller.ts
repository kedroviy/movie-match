import { Controller } from '@nestjs/common';
import { AttemptService } from './attempt.service';

@Controller('attempt')
export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}
}
