import { User, UserDocument } from "../models/User";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import { TokenPayload } from "../types";

export class AuthService {
  async register(email: string, username: string, password: string) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) throw ApiError.conflict("Email already in use");

    const existingUsername = await User.findOne({ username });
    if (existingUsername) throw ApiError.conflict("Username already taken");

    const user = await User.create({ email, username, password });
    const tokens = this.generateTokens(user);

    return { user: user.toJSON(), ...tokens };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw ApiError.unauthorized("Invalid credentials");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized("Invalid credentials");

    const tokens = this.generateTokens(user);
    return { user: user.toJSON(), ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await User.findById(payload.id);
      if (!user) throw ApiError.unauthorized("User not found");

      const tokens = this.generateTokens(user);
      return tokens;
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    return user.toJSON();
  }

  private generateTokens(user: UserDocument) {
    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
    };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }
}

export const authService = new AuthService();