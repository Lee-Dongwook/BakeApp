const ACCESS_TOKEN_KEY = "bakeapp.accessToken";

/** 인증 토큰의 저장·조회 위치를 한곳에서 관리합니다. */
export const tokenStorage = {
  get: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  set: (accessToken: string) =>
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
  clear: () => localStorage.removeItem(ACCESS_TOKEN_KEY),
};
