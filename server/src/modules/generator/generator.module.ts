import { Module } from "@nestjs/common";
import { GeneratorService } from "./generator.service";
import { GeneratorController } from "./generator.controller";

@Module({
  providers: [GeneratorService],
  controllers: [GeneratorController],
  exports: [GeneratorService],
})
export class GeneratorModule {}
