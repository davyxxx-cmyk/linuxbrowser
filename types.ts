export enum SecurityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  PARANOID = 'PARANOID'
}

export interface SystemStatus {
  cpuUsage: number;
  memoryUsage: number;
  activeTabs: number;
  netNsCreated: number;
  uptime: string;
}

export interface SecurityModule {
  id: string;
  name: string;
  enabled: boolean;
  status: 'active' | 'warning' | 'error';
  description: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  component: string;
  message: string;
}

export interface ProcessNode {
  name: string;
  pid: number;
  type: 'launcher' | 'browser' | 'sandbox' | 'network';
  children?: ProcessNode[];
}