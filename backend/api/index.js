const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { AppModule } = require('../dist/app.module');
const { I18nValidationPipe } = require('nestjs-i18n');
const { join } = require('path');
const express = require('express');

let cachedApp;

async function createApp() {
    if (cachedApp) {
        return cachedApp;
    }

    const expressApp = express();
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressApp),
    );

    // Global validation pipe
    app.useGlobalPipes(
        new I18nValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: false,
        }),
    );

    // Serve static files for uploads (if directory exists)
    try {
        app.useStaticAssets(join(__dirname, '..', 'uploads'), {
            prefix: '/uploads/',
        });
    } catch {
        // Ignore if uploads directory doesn't exist
        console.warn('Uploads directory not found, skipping static assets');
    }

    app.setGlobalPrefix('api');

    // CORS configuration
    const allowedOrigins = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',')
        : [
            'http://localhost:5173',
            'https://localhost:5173',
            /^https:\/\/.*\.vercel\.app$/,
        ];

    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            // Check if origin matches allowed patterns
            const isAllowed = allowedOrigins.some((allowed) => {
                if (allowed instanceof RegExp) {
                    return allowed.test(origin);
                }
                if (typeof allowed === 'string' && allowed.includes('*')) {
                    const pattern = allowed.replace(/\*/g, '.*');
                    return new RegExp(`^${pattern}$`).test(origin);
                }
                return allowed === origin;
            });

            callback(null, isAllowed);
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
    });

    await app.init();
    cachedApp = expressApp;
    return expressApp;
}

module.exports = async function handler(req, res) {
    const app = await createApp();
    app(req, res);
};
