import { Injectable } from '@nestjs/common';
import { ensureReadable, loadDriverUser } from '../../common/access/user-access.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BalanceService } from '../balance/balance.service.js';
import { DeletionService } from './deletion.service.js';
import { StatsService } from './stats.service.js';

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export const MENU_ITEMS = [
  { key: 'personal_data', label: 'البيانات الشخصية', icon: 'user' },
  { key: 'subscriptions', label: 'الباقات', icon: 'crown' },
  { key: 'ratings', label: 'التقييمات والشارات', icon: 'star' },
  { key: 'settings', label: 'الإعدادات والأمان', icon: 'settings' },
  { key: 'support', label: 'الدعم الفني', icon: 'headset' },
  { key: 'account_status', label: 'حالة الحساب', icon: 'shield' },
  { key: 'terms', label: 'الشروط وسياسة الخصوصية', icon: 'file-text' },
  { key: 'about', label: 'عن تطبيق مسار', icon: 'info' },
  { key: 'delete_account', label: 'حذف الحساب', icon: 'trash' },
];

function formatMemberSince(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  return `${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function deriveBadges({
  stats,
  punctualityRate,
  totalRatings,
  vehicle,
}: {
  stats: Record<string, number>;
  punctualityRate: number;
  totalRatings: number;
  vehicle: { isVerified: boolean } | null;
}): string[] {
  const badges: string[] = [];
  const avg = Number(stats.avg_rating || 0);
  if (avg >= 4.5 && (stats.completed_trips || 0) >= 10) badges.push('سائق محترف');
  if (punctualityRate >= 90 && totalRatings >= 5) badges.push('ملتزم بالمواعيد');
  if ((stats.no_show_rate || 0) < 5) badges.push('قيادة آمنة');
  if (avg >= 4.8) badges.push('تعامل ممتاز');
  if (vehicle && vehicle.isVerified === true) badges.push('مركبة نظيفة');
  return badges;
}

// Port of Main Server/Services/driverProfileService.ts.
@Injectable()
export class DriverProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: StatsService,
    private readonly balance: BalanceService,
    private readonly deletion: DeletionService,
  ) {}

  private async computePunctualityRate(rateeId: string): Promise<number> {
    const total = await this.prisma.rating.count({
      where: { rateeId, isVisible: { not: false } },
    });
    if (!total) return 0;
    const onTime = await this.prisma.rating.count({
      where: { rateeId, isVisible: { not: false }, wasLate: false },
    });
    return Math.round((onTime / total) * 100);
  }

  async getFullProfile(driverId: string): Promise<Record<string, unknown>> {
    const user = (await loadDriverUser(this.prisma, driverId)) as unknown as Record<string, unknown>;
    ensureReadable({ status: user.status as string });

    const [driverProfile, vehicle, lifetime] = await Promise.all([
      this.prisma.driverProfile.findFirst({ where: { driverId } }),
      this.prisma.vehicle.findFirst({ where: { driverId } }),
      this.stats.lifetime(driverId),
    ]);

    let subscription: Record<string, unknown> | null = null;
    try {
      subscription = await this.balance.findCurrentSubscription(driverId);
    } catch {
      subscription = null;
    }

    const punctualityRate = await this.computePunctualityRate(driverId);
    const totalRatings = await this.prisma.rating.count({
      where: { rateeId: driverId, isVisible: { not: false } },
    });

    const s = lifetime.stats as unknown as Record<string, number>;
    return {
      driver: {
        id: user.id,
        full_name: (user.fullName as string | null) ?? null,
        display_name: (user.displayName as string | null) ?? null,
        phone: user.phone,
        email: (user.email as string | null) ?? null,
        profile_picture_url: (user.avatarUrl as string | null) ?? null,
        national_id: (driverProfile?.nationalID as string | null) ?? null,
        age: user.age == null ? null : Number(user.age),
        gender: (user.gender as string | null) ?? null,
        joined_at: user.createdAt,
        member_since: formatMemberSince(user.createdAt as Date | null),
        is_verified: user.isVerified === true,
        verification_status: user.verificationStatus,
      },
      vehicle: vehicle
        ? {
            vehicle_id: vehicle.id,
            make: vehicle.manufacturer,
            model: vehicle.model,
            year: vehicle.modelYear ?? null,
            color: vehicle.color ?? null,
            plate_number: vehicle.plateNumber,
            total_seats: vehicle.seats,
            verified: vehicle.isVerified === true,
            vehicle_type: vehicle.vehicleType ?? null,
          }
        : null,
      subscription: this.buildSubscriptionCard(subscription),
      stats: {
        total_trips_completed: s.completed_trips ?? 0,
        average_rating: Number(s.avg_rating ?? (user.avgRating as number | null) ?? 0),
        total_ratings: totalRatings,
        punctuality_rate: punctualityRate,
        no_show_rate: s.no_show_rate ?? 0,
        response_rate: s.response_rate ?? null,
        badges: deriveBadges({
          stats: s,
          punctualityRate,
          totalRatings,
          vehicle: vehicle ? { isVerified: vehicle.isVerified } : null,
        }),
      },
      menu_items: MENU_ITEMS,
    };
  }

  private buildSubscriptionCard(
    subscription: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!subscription) return null;
    const status = subscription.status as string;
    const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt as string) : null;
    const isActive = status === 'active' && (!expiresAt || expiresAt > new Date());
    if (!isActive) return null;
    const planName = (subscription.planName as string | null) ?? null;
    return {
      tier: planName && planName.toLowerCase().includes('pro') ? 'pro' : 'free',
      price: Number(subscription.planCost || 0),
      currency: 'JOD',
      plan_name: planName,
      expires_at: (subscription.expiresAt as Date | null) ?? null,
      days_remaining: expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : null,
      is_active: true,
    };
  }

  async getAccountStatus(driverId: string): Promise<Record<string, unknown>> {
    const user = (await loadDriverUser(this.prisma, driverId)) as unknown as Record<string, unknown>;
    ensureReadable({ status: user.status as string });

    const now = new Date();
    const activePenalties = await this.prisma.penalty.findMany({
      where: {
        userId: driverId,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { startsAt: 'desc' },
    });

    const hasDeletionRequest = await this.deletion.hasPendingRequest(driverId);
    const suspension = activePenalties.find((p) => p.type === 'suspension');
    const status = user.status as string;

    return {
      status,
      verification_status: user.verificationStatus,
      is_verified: user.isVerified === true,
      is_suspended: status === 'suspended',
      is_banned: status === 'banned',
      suspension_details: suspension
        ? { reason: suspension.reason, starts_at: suspension.startsAt, ends_at: suspension.endsAt }
        : null,
      active_penalties: activePenalties.map((p) => ({
        id: p.id,
        type: p.type,
        reason: p.reason,
        created_at: p.createdAt ?? null,
        expires_at: p.endsAt ?? null,
      })),
      is_deletion_requested: hasDeletionRequest,
      can_delete: status !== 'banned' && !hasDeletionRequest,
      can_logout: true,
    };
  }
}
