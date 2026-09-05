import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { GeneratorService } from "./generator.service";
import { GeneratorController } from "./generator.controller";

@Module({
  imports: [AuthModule],
  providers: [GeneratorService],
  controllers: [GeneratorController],
  exports: [GeneratorService],
})
export class GeneratorModule {}
