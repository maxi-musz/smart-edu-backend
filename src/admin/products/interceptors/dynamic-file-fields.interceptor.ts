import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PRODUCT_VALIDATION_LIMITS } from '../constants/validation-limits';

@Injectable()
export class DynamicFileFieldsInterceptor implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const query = request.query;
        
        // Get the number of images from query parameter, default to max allowed
        const imageCount = query.imageCount ? 
            Math.min(parseInt(query.imageCount), PRODUCT_VALIDATION_LIMITS.MAX_IMAGES_PER_BOOK) : 
            PRODUCT_VALIDATION_LIMITS.MAX_IMAGES_PER_BOOK;

        const fileFields: Array<{ name: string; maxCount: number }> = [];
        
        // Generate file fields for the specified number of images
        for (let imageIndex = 0; imageIndex < imageCount; imageIndex++) {
            const fieldName = `display_images[${imageIndex}]`;
            fileFields.push({ name: fieldName, maxCount: 1 });
        }

        const InterceptorClass = FileFieldsInterceptor(fileFields);
        const fileFieldsInterceptor = new InterceptorClass();
        
        return fileFieldsInterceptor.intercept(context, next);
    }
} 