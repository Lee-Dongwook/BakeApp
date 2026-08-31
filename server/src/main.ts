import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import dotenv from "dotenv";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle("BakeApp Engine API")
    .setDescription("No-Code App Builder BakeApp Core Backend Document")
    .setVersion("1.0")
    .addTag("Dynamic Schema (동적 DDL)")
    .addTag("Dynamic Data (동적 CRUD)")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`BakeApp Engine Backend running on ${port}`);
}

bootstrap();
