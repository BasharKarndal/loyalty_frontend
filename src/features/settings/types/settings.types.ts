export interface UserSettings {
  id: string;
  user_id: string;
  cafe_name: string;
  logo_url: string | null;
  currency: string;
  visit_reward_target: number;
  points_reward_target: number;
  currency_per_point: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserSettingsPayload {
  cafe_name: string;
  currency: string;
  visit_reward_target: number;
  points_reward_target: number;
  currency_per_point: number;
}

export interface LoyaltyConfig {
  visitRewardTarget: number;
  pointsRewardTarget: number;
  currency: string;
  currencyPerPoint: number;
}
