import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class RegisterRuntimeUserDto {
  @ApiProperty({
    example: "user@example.com",
    description: "최종 사용자 이메일",
  })
  @IsEmail({}, { message: "올바른 이메일 형식이 아닙니다." })
  @IsNotEmpty({ message: "이메일은 필수 입력 항목입니다." })
  email: string;

  @ApiProperty({
    example: "password123!",
    description: "최종 사용자 비밀번호 (6자 이상)",
  })
  @IsString()
  @IsNotEmpty({ message: "비밀번호는 필수 입력 항목입니다." })
  @MinLength(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." })
  password: string;

  @ApiPropertyOptional({
    example: "user",
    description: "사용자 권한/역할 (eg. admin, manager, user)",
    default: "user",
  })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({
    example: { name: "홍길동", department: "개발팀" },
    description: "커스텀 프로필 메타데이터 (JSON)",
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RuntimeLoginDto {
  @ApiProperty({
    example: "user@example.com",
    description: "최종 사용자 이메일",
  })
  @IsEmail({}, { message: "올바른 이메일 형식이 아닙니다." })
  @IsNotEmpty({ message: "이메일은 필수 입력 항목입니다." })
  email: string;

  @ApiProperty({
    example: "password123!",
    description: "최종 사용자 비밀번호",
  })
  @IsString()
  @IsNotEmpty({ message: "비밀번호는 필수 입력 항목입니다." })
  password: string;
}
