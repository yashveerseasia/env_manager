export type ShareStatus = 'active' | 'revoked' | 'expired';

export interface EnvShareCreatePayload {
  password: string;
  expires_at?: string | null;
  max_views: number;
  max_downloads: number;
  one_time: boolean;
  whitelisted_ips?: string[] | null;
}

export interface EnvShareResponse {
  share_url: string;
  expires_at: string | null;
  max_views: number;
  max_downloads: number;
  one_time: boolean;
  whitelisted_ips: string[] | null;
}

export interface EnvShareRecord {
  id: number;
  environment_id: number;
  token: string;
  expires_at: string | null;
  max_views: number;
  max_downloads: number;
  view_count: number;
  download_count: number;
  one_time: boolean;
  is_active: boolean;
  whitelisted_ips: string[] | null;
  created_at: string;
}

export interface EnvVariableForShare {
  key: string;
  value: string;
  is_secret: boolean;
}

export interface EnvShareViewResponse {
  environment_id: number;
  variables: EnvVariableForShare[];
}


