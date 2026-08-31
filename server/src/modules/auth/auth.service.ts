import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseService } from "../../config/supabase.service";

export interface AuthCredentialsDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async signUp(dto: AuthCredentialsDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new BadRequestException(`회원가입 실패: ${error.message}`);
    }

    return {
      message: "회원가입 성공",
      user: data.user,
    };
  }

  // 2. 빌더 로그인
  async signIn(dto: AuthCredentialsDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new UnauthorizedException(`로그인 실패: ${error.message}`);
    }

    return {
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      user: data.user,
    };
  }

  async validateUser(accessToken: string) {
    const supabase = this.supabaseService.getClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      throw new UnauthorizedException("유효하지 않거나 만료된 토큰입니다.");
    }

    return user;
  }
}
