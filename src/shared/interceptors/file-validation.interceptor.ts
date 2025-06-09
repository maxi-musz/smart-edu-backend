import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const files = request.files;

        if (!files) {
            return next.handle();
        }

        // Check each file in each field
        Object.keys(files).forEach(fieldName => {
            const fileArray = files[fieldName];
            if (!Array.isArray(fileArray)) return;

            fileArray.forEach(file => {
                // Check file size
                if (file.size > MAX_FILE_SIZE) {
                    throw new BadRequestException(`File ${file.originalname} is too large. Maximum size is 5MB`);
                }

                // Check file type
                if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
                    throw new BadRequestException(
                        `File ${file.originalname} has invalid type. Allowed types are: jpg, jpeg, png, pdf, docx`
                    );
                }
            });
        });

        return next.handle();
    }
} 