import { Injectable, BadRequestException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { Express } from "express";

@Injectable()
export class LocalStorageService {
  private readonly uploadDir = path.join(process.cwd(), "uploads");

  constructor() {
    // 업로드 디렉토리가 없으면 자동 생성
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(projectId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("업로드된 파일이 없습니다.");
    }

    const projectDir = path.join(this.uploadDir, projectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginalName = Buffer.from(
      file.originalname,
      "latin1",
    ).toString("utf8");
    const filename = `${uniqueSuffix}-${sanitizedOriginalName}`;
    const filePath = path.join(projectDir, filename);

    try {
      fs.writeFileSync(filePath, file.buffer);
      const relativeKey = `projects/${projectId}/${filename}`;
      return {
        success: true,
        key: relativeKey,
        originalName: sanitizedOriginalName,
        size: file.size,
      };
    } catch (error: any) {
      throw new BadRequestException(`파일 저장 실패: ${error.message}`);
    }
  }

  getFilePath(key: string): string {
    const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.join(
      this.uploadDir,
      safeKey.replace(/^projects\//, ""),
    );

    if (!fs.existsSync(fullPath)) {
      throw new BadRequestException("파일을 찾을 수 없습니다.");
    }
    return fullPath;
  }

  async deleteFile(key: string) {
    try {
      const fullPath = this.getFilePath(key);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return { success: true, key };
    } catch (error: any) {
      throw new BadRequestException(`파일 삭제 실패: ${error.message}`);
    }
  }
}
