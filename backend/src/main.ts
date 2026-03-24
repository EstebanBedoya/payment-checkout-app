import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Helmet: OWASP security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Swagger UI needs inline styles
          imgSrc: ["'self'", 'data:'],             // Swagger UI uses data: URIs
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],                  // Restrict fetch/XHR origins
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],              // Clickjacking prevention
          baseUri: ["'self'"],                     // Prevent <base> tag hijacking
          formAction: ["'self'"],                  // Restrict form submission targets
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      // Helmet v8 auto-sets: X-Content-Type-Options, X-Frame-Options,
      // X-DNS-Prefetch-Control, X-Permitted-Cross-Domain-Policies, Referrer-Policy,
      // Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy
    }),
  )

  // Permissions-Policy — not covered by Helmet
  app.use((_req: any, res: any, next: any) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(self)',
    )
    next()
  })

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )

  app.setGlobalPrefix('api/v1')

  const config = new DocumentBuilder()
    .setTitle('Checkout API')
    .setDescription('Payment checkout API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))

  await app.listen(process.env.PORT ?? 3001)
  console.log(`API running on http://localhost:${process.env.PORT ?? 3001}/api/v1`)
  console.log(`Swagger  at  http://localhost:${process.env.PORT ?? 3001}/api/docs`)
}
bootstrap()
