import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import dotenv from "dotenv";
import { DynamicSwaggerService } from "./modules/schema/dynamic-swagger.service";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle("BakeApp Engine API")
    .setDescription("No-Code App Builder BakeApp Core Backend Document")
    .setVersion("1.0")
    .build();

  const baseDocument = SwaggerModule.createDocument(app, config);

  const dynamicSwaggerService = app.get(DynamicSwaggerService);
  dynamicSwaggerService.setupSwagger(app, baseDocument);

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`BakeApp Engine Backend running on ${port}`);
}

bootstrap();
