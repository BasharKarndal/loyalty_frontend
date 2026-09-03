import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@shared/lib/apiError';
import { LOYALTY_DEFAULTS } from '@shared/lib/loyalty';
import { settingsApi } from './settings.api';
import type { LoyaltyConfig, UpdateUserSettingsPayload } from '../types/settings.types';

export const settingsKeys = {
  all: ['settings'] as const,
  mine: () => [...settingsKeys.all, 'me'] as const,
  logo: () => [...settingsKeys.all, 'logo'] as const,
};

export function toLoyaltyConfig(settings?: {
  visit_reward_target: number;
  points_reward_target: number;
  currency: string;
  currency_per_point: number;
} | null): LoyaltyConfig {
  return {
    visitRewardTarget: settings?.visit_reward_target ?? LOYALTY_DEFAULTS.visitRewardTarget,
    pointsRewardTarget: settings?.points_reward_target ?? LOYALTY_DEFAULTS.pointsRewardTarget,
    currency: settings?.currency ?? LOYALTY_DEFAULTS.currency,
    currencyPerPoint: Number(settings?.currency_per_point ?? LOYALTY_DEFAULTS.currencyPerPoint),
  };
}

export const useSettingsQuery = (enabled = true) =>
  useQuery({
    queryKey: settingsKeys.mine(),
    queryFn: settingsApi.getMine,
    staleTime: 60_000,
    enabled,
  });

export const useLoyaltyConfig = () => {
  const query = useSettingsQuery();
  const config = useMemo(() => toLoyaltyConfig(query.data), [query.data]);
  return { ...query, config };
};

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserSettingsPayload) => settingsApi.updateMine(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.mine() });
      toast.success('تم حفظ الإعدادات');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'تعذر حفظ الإعدادات')),
  });
};

export const useUploadLogoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.mine() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.logo() });
      toast.success('تم رفع الشعار');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'تعذر رفع الشعار')),
  });
};

export const useDeleteLogoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => settingsApi.deleteLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.mine() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.logo() });
      toast.success('تم حذف الشعار');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'تعذر حذف الشعار')),
  });
};

export const useLogoSrc = (enabled = true) => {
  const { data: settings } = useSettingsQuery();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !settings?.logo_url) {
      setSrc(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    settingsApi
      .fetchLogoBlob()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enabled, settings?.logo_url, settings?.updated_at]);

  return src;
};
