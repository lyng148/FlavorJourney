import { Global, Module } from '@nestjs/common';
import AllExceptionsFilter from './filters/all-exception.filter';
import HttpExceptionFilter from './filters/http-exception.filter';


@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: 'APP_FILTER',
      useClass: AllExceptionsFilter,
    },
    {
      provide: 'APP_FILTER',
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [],
})
export class CommonModule {}
