import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
    private s3Client: S3Client;
    private bucketName: string;
    private endpoint: string;

    constructor(private configService: ConfigService) {
        const region = this.configService.get<string>('AWS_REGION');
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
        const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
        const endpoint = this.configService.get<string>('EXTERNAL_S3_ENDPOINT');

        if (!region || !accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
            throw new Error('AWS S3 configuration is missing. Please check your environment variables.');
        }

        this.s3Client = new S3Client({
            endpoint,
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            forcePathStyle: true,
        });
        this.bucketName = bucketName;
        this.endpoint = endpoint;
    }

    async uploadDishImage(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new BadRequestException('画像ファイルが必要です');
        }

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('無効な画像形式です。JPEG、PNG、またはWEBPのみ許可されています');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new BadRequestException('画像サイズは5MB以下である必要があります');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = file.originalname.split('.').pop();
        const filename = `dishes/dish_${timestamp}_${randomString}.${extension}`;

        try {
            // Upload to S3
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: filename,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read', // Make file publicly accessible
            });

            await this.s3Client.send(command);

            // Return S3-compatible URL using the external endpoint
            return `${this.endpoint}/${this.bucketName}/${filename}`;
        } catch (error) {
            console.error('S3 upload error:', error);
            throw new BadRequestException('画像のアップロードに失敗しました');
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            // Extract key from URL
            const urlParts = fileUrl.split('/');
            const key = urlParts.slice(3).join('/'); // Get everything after domain

            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);
        } catch (error) {
            console.error('Error deleting file from S3:', error);
            // Don't throw error, just log it
        }
    }
}
