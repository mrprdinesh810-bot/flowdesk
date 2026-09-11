import { Capacitor, registerPlugin } from '@capacitor/core';

export interface FlowDeskNativePluginInterface {
  exitApp(): Promise<void>;
  canRequestPackageInstalls(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  downloadAndInstallApk(options: { downloadUrl: string }): Promise<{ success: boolean; message: string }>;
}

const FlowDeskNative = registerPlugin<FlowDeskNativePluginInterface>('FlowDeskNative');

export const nativeBridge = {
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  },

  getPlatform(): string {
    return Capacitor.getPlatform();
  },

  async exitApp(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await FlowDeskNative.exitApp();
      } catch (err) {
        console.warn('exitApp failed:', err);
      }
    }
  },

  async canRequestPackageInstalls(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      const res = await FlowDeskNative.canRequestPackageInstalls();
      return res.canInstall;
    } catch (err) {
      console.warn('canRequestPackageInstalls check failed:', err);
      return true;
    }
  },

  async openInstallPermissionSettings(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await FlowDeskNative.openInstallPermissionSettings();
      } catch (err) {
        console.warn('openInstallPermissionSettings failed:', err);
      }
    }
  },

  async downloadAndInstallApk(downloadUrl: string): Promise<{ success: boolean; message: string }> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Native APK installation is only supported on Android devices.');
    }
    return FlowDeskNative.downloadAndInstallApk({ downloadUrl });
  },
};
