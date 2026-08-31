import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { DynamicDataService } from "./dynamic-data.service";

@Controller("api/dynamic-data")
export class DynamicDataController {
  constructor(private readonly dataService: DynamicDataService) {}

  @Post(":projectId/:tableName")
  async create(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Body() body: Record<string, any>,
  ) {
    return this.dataService.create(projectId, tableName, body);
  }

  @Get(":projectId/:tableName")
  async findAll(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.dataService.findAll(
      projectId,
      tableName,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(":projectId/:tableName/:id")
  async findOne(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Param("id") id: string,
  ) {
    return this.dataService.findOne(projectId, tableName, id);
  }

  @Patch(":projectId/:tableName/:id")
  async update(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Param("id") id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.dataService.update(projectId, tableName, id, body);
  }

  @Delete(":projectId/:tableName/:id")
  async remove(
    @Param("projectId") projectId: string,
    @Param("tableName") tableName: string,
    @Param("id") id: string,
  ) {
    return this.dataService.remove(projectId, tableName, id);
  }
}
