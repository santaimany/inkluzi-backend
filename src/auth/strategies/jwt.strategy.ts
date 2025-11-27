import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
          private readonly configService: ConfigService,
          private readonly prisma: PrismaService,
    ) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>('JWT_SECRET') ?? 'defaultSecret',
      });
    }

    async validate(payload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
                sppgProfile: true,
                schoolProfile:true,
            },
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        return {
            userId: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            sppgProfile: user.sppgProfile,
            schoolProfile: user.schoolProfile,
        }

    }
}