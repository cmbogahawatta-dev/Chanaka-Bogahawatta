import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Apple,
  Play,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  Shield,
  FileCode,
  Terminal,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
  Check,
  AlertTriangle,
  QrCode,
  Share2,
  Tv,
  Eye,
  Camera,
  FolderArchive,
  Laptop
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

interface PublishAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'android' | 'ios' | 'pwa' | 'export' | 'preview';
}

export const PublishAppModal: React.FC<PublishAppModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'android'
}) => {
  const { currentEnterprise } = useFleet();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pwa' | 'export' | 'preview'>(initialTab);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<'iphone16' | 'pixel9' | 'ipad'>('iphone16');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyText = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const androidManifestSnippet = `<!-- Add to android/app/src/main/AndroidManifest.xml inside <manifest> -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

<!-- Inside <application> tag -->
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="FleetTrack"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="true">
</application>`;

  const iosInfoPlistSnippet = `<!-- Add to ios/App/App/Info.plist inside <dict> -->
<key>NSCameraUsageDescription</key>
<string>FleetTrack requires camera access to scan and OCR driving licenses, vehicle registration documents, and capture inspection photos.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>FleetTrack needs photo library access to upload vehicle condition images and fuel receipt invoices.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>FleetTrack saves exported running charts, fuel expense reports, and vehicle handover summaries to your photo library.</string>

<key>UIViewControllerBasedStatusBarAppearance</key>
<true/>
<key>UIStatusBarStyle</key>
<string>UIStatusBarStyleDarkContent</string>`;

  const capacitorConfigSnippet = `{
  "appId": "io.fleettrack.app",
  "appName": "FleetTrack",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "cleartext": true
  },
  "android": {
    "allowMixedContent": true
  },
  "ios": {
    "scheme": "FleetTrack",
    "contentInset": "always"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 1500,
      "backgroundColor": "#020617"
    },
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#0f172a"
    }
  }
}`;

  const privacyPolicyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Privacy Policy - FleetTrack Vehicle Management</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #1e293b; margin-top: 24px; }
  </style>
</head>
<body>
  <h1>Privacy Policy for FleetTrack</h1>
  <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
  <p>FleetTrack is committed to protecting the privacy and security of your organization's fleet and driver data.</p>
  <h2>1. Information We Process</h2>
  <ul>
    <li><strong>Vehicle & Fleet Records:</strong> Registration numbers, odometer readings, service history, and fuel expenses.</li>
    <li><strong>Driver Profiles:</strong> Driver names, contact details, driving license numbers, and appointment logs.</li>
    <li><strong>Camera & Document OCR:</strong> Camera access is used strictly on-device to capture license cards, vehicle books, and inspection photos.</li>
  </ul>
  <h2>2. Data Security & Multi-Tenant Isolation</h2>
  <p>Each enterprise operates within an isolated workspace. No cross-organization data sharing occurs.</p>
  <h2>3. Contact & Support</h2>
  <p>For questions, contact support@fleettrack.io</p>
</body>
</html>`;

  const handleDownloadPublishKit = () => {
    // Package JSON metadata bundle
    const kitData = {
      name: "FleetTrack-Mobile-Publishing-Kit",
      version: "1.0.0",
      appId: "io.fleettrack.app",
      android: {
        package: "io.fleettrack.app",
        manifestSnippet: androidManifestSnippet,
        releaseBuildCommand: "./gradlew assembleRelease bundleRelease"
      },
      ios: {
        bundleIdentifier: "io.fleettrack.app",
        infoPlistSnippet: iosInfoPlistSnippet,
        target: "iOS 14.0+"
      },
      capacitorConfig: JSON.parse(capacitorConfigSnippet),
      storeListing: {
        title: "FleetTrack - Company Vehicle & Fleet Manager",
        shortDescription: "Track company vehicle running charts, fuel logs, maintenance schedules, and driver handovers with AI document OCR.",
        keywords: "fleet management, vehicle tracking, running chart, fuel log, mileage tracker, driver handover, vehicle maintenance, car expense",
        category: "Business / Productivity"
      }
    };

    const blob = new Blob([JSON.stringify(kitData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FleetTrack-AppStore-Publishing-Kit.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://fleettrack.app';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Publish to App Store & Google Play</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Native Mobile Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Packaging, Capacitor setup, store assets, and mobile optimization for iOS & Android
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-4 pt-2 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('android')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'android'
                ? 'text-emerald-400 border-emerald-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            Google Play Store (Android)
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ios'
                ? 'text-blue-400 border-blue-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Apple className="w-4 h-4 text-blue-400" />
            Apple App Store (iOS)
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'text-amber-400 border-amber-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            Direct Mobile Install (PWA)
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'export'
                ? 'text-indigo-400 border-indigo-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-indigo-400" />
            Publishing Kit & Code Snippets
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'preview'
                ? 'text-purple-400 border-purple-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4 text-purple-400" />
            Device Simulator
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* TAB 1: GOOGLE PLAY STORE (ANDROID) */}
          {activeTab === 'android' && (
            <div className="space-y-6">
              {/* Overview Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
                    <h3 className="text-sm font-bold text-white">Google Play Store Publishing Workflow</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Build an official Android App Bundle (<strong>.aab</strong>) or standalone <strong>.apk</strong> powered by Capacitor to publish directly to the Google Play Console.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                    App ID: io.fleettrack.app
                  </span>
                </div>
              </div>

              {/* Step by Step Android Deployment Instructions */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" /> Step-by-Step Android CLI & Build Commands
                </h4>

                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold">1</span>
                      Install Capacitor & Android Platform
                    </span>
                    <button
                      onClick={() => handleCopyText('npm i @capacitor/core @capacitor/android @capacitor/cli', 'cmd-1')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                    >
                      {copiedSection === 'cmd-1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSection === 'cmd-1' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
                    npm i @capacitor/core @capacitor/android @capacitor/cli
                  </pre>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold">2</span>
                      Compile Production Web Assets & Add Android
                    </span>
                    <button
                      onClick={() => handleCopyText('npm run build && npx cap add android', 'cmd-2')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                    >
                      {copiedSection === 'cmd-2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSection === 'cmd-2' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
                    npm run build && npx cap add android
                  </pre>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold">3</span>
                      Sync & Open in Android Studio
                    </span>
                    <button
                      onClick={() => handleCopyText('npx cap sync android && npx cap open android', 'cmd-3')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                    >
                      {copiedSection === 'cmd-3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSection === 'cmd-3' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
                    npx cap sync android && npx cap open android
                  </pre>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold">4</span>
                      Generate Release Keystore for Google Play
                    </span>
                    <button
                      onClick={() => handleCopyText('keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias fleettrack-key', 'cmd-4')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                    >
                      {copiedSection === 'cmd-4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSection === 'cmd-4' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
                    keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias fleettrack-key
                  </pre>
                </div>
              </div>

              {/* AndroidManifest.xml Snippet */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    Android Camera & Storage Permissions (AndroidManifest.xml)
                  </span>
                  <button
                    onClick={() => handleCopyText(androidManifestSnippet, 'manifest-snippet')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-700"
                  >
                    {copiedSection === 'manifest-snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSection === 'manifest-snippet' ? 'Copied Snippet' : 'Copy Code'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
                  {androidManifestSnippet}
                </pre>
              </div>

              {/* Play Store Listing Metadata */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" /> Google Play Console Listing Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 font-semibold block mb-0.5">App Name</span>
                    <span className="text-white font-medium">FleetTrack - Company Vehicle Manager</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 font-semibold block mb-0.5">Category</span>
                    <span className="text-white font-medium">Business / Auto & Vehicles</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 sm:col-span-2">
                    <span className="text-slate-400 font-semibold block mb-0.5">Short Description (80 chars max)</span>
                    <span className="text-white font-medium">Track vehicle running charts, fuel logs, service reminders, and driver transfers.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPLE APP STORE (IOS) */}
          {activeTab === 'ios' && (
            <div className="space-y-6">
              {/* Overview Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Apple className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Apple App Store Publishing Workflow</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Build native iOS project via Capacitor, configure Xcode signing, camera permissions, and submit to App Store Connect / TestFlight.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold">
                    Bundle ID: io.fleettrack.app
                  </span>
                </div>
              </div>

              {/* Step by Step iOS Instructions */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" /> Step-by-Step iOS CLI & Xcode Commands
                </h4>

                {/* Step 1 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-bold">1</span>
                      Install Capacitor & iOS Platform
                    </span>
                    <button
                      onClick={() => handleCopyText('npm i @capacitor/core @capacitor/ios @capacitor/cli', 'cmd-ios-1')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                    >
                      {copiedSection === 'cmd-ios-1' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSection === 'cmd-ios-1' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-blue-300 overflow-x-auto border border-slate-800">
                    npm i @capacitor/core @capacitor/ios @capacitor/cli
                  </pre>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-bold">2</span>
                      Build Web App & Add iOS Project
                    </span>
                    <button
                      onClick={() => handleCopyText('npm run build && npx cap add ios', 'cmd-ios-2')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                    >
                      {copiedSection === 'cmd-ios-2' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSection === 'cmd-ios-2' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-blue-300 overflow-x-auto border border-slate-800">
                    npm run build && npx cap add ios
                  </pre>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-bold">3</span>
                      Open in Xcode for Signing & Archiving
                    </span>
                    <button
                      onClick={() => handleCopyText('npx cap sync ios && npx cap open ios', 'cmd-ios-3')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-700"
                    >
                      {copiedSection === 'cmd-ios-3' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSection === 'cmd-ios-3' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-blue-300 overflow-x-auto border border-slate-800">
                    npx cap sync ios && npx cap open ios
                  </pre>
                </div>
              </div>

              {/* iOS Info.plist Permissions Snippet */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    Apple Privacy Descriptions (ios/App/App/Info.plist)
                  </span>
                  <button
                    onClick={() => handleCopyText(iosInfoPlistSnippet, 'plist-snippet')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-700"
                  >
                    {copiedSection === 'plist-snippet' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSection === 'plist-snippet' ? 'Copied Snippet' : 'Copy Code'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
                  {iosInfoPlistSnippet}
                </pre>
              </div>

              {/* App Store Connect Metadata */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" /> App Store Connect Submission Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 font-semibold block mb-0.5">Primary Category</span>
                    <span className="text-white font-medium">Business / Navigation</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 font-semibold block mb-0.5">App Store Icon</span>
                    <span className="text-white font-medium">1024 x 1024 px (PNG with no alpha)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 sm:col-span-2">
                    <span className="text-slate-400 font-semibold block mb-0.5">Keywords (100 chars max)</span>
                    <span className="text-white font-medium font-mono text-[11px]">fleet,vehicle,mileage,fuel,running chart,driver,logbook,car maintenance,odometer</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT MOBILE PWA INSTALL */}
          {activeTab === 'pwa' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Instant Installation on Android & iPhone</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    FleetTrack is fully configured as an installable Progressive Web App (PWA). Drivers and staff can install it directly onto their phone's home screen without downloading from stores.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyText(appUrl, 'app-url')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copiedSection === 'app-url' ? 'URL Copied!' : 'Copy App URL'}
                  </button>
                </div>
              </div>

              {/* Visual Install Instructions for Both Operating Systems */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* iPhone / iOS Safari instructions */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Apple className="w-4 h-4 text-slate-200" />
                    <span>How to Install on iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="space-y-2.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                    <li>Open this app in <strong>Safari</strong> on your iPhone or iPad.</li>
                    <li>
                      Tap the <strong className="text-blue-400">Share</strong> button at the bottom of the screen (<span className="font-mono">⎕↑</span>).
                    </li>
                    <li>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> (<span className="font-mono">⊞</span>).</li>
                    <li>Tap <strong className="text-blue-400">Add</strong> in the top right corner.</li>
                  </ol>
                  <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
                    Runs full screen with offline cache and native gesture navigation!
                  </div>
                </div>

                {/* Android Chrome instructions */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                    <span>How to Install on Android (Chrome / Edge)</span>
                  </div>
                  <ol className="space-y-2.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                    <li>Open this app in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong>.</li>
                    <li>
                      Tap the <strong className="text-emerald-400">three dots menu (︙)</strong> in the top right corner.
                    </li>
                    <li>Tap <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</li>
                    <li>Follow the prompt to install the native standalone icon.</li>
                  </ol>
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    Includes Web App Manifest with camera OCR & trip shortcuts!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PUBLISHING KIT EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Download Mobile Publishing Package</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Export the full configuration bundle including Capacitor configs, Android Manifest snippets, iOS Info.plist descriptions, privacy policy, and store descriptions.
                  </p>
                </div>
                <button
                  onClick={handleDownloadPublishKit}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  {downloadSuccess ? 'Downloaded Kit!' : 'Export Publishing Kit (.JSON)'}
                </button>
              </div>

              {/* Config Files Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Included Configuration Assets</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">capacitor.config.json</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">Cross-platform build config for Android Studio & Xcode</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Privacy Policy Document</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">Compliant privacy policy required by App Store & Play Console</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">OCR & Camera Permissions</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">Pre-configured Info.plist & AndroidManifest.xml tags</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">PWA Service Worker & Manifest</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">Full offline static caching and home screen icon definitions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DEVICE SIMULATOR */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>Choose Mobile Viewport:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDevice('iphone16')}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                      selectedDevice === 'iphone16'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    iPhone 16 Pro (393px)
                  </button>
                  <button
                    onClick={() => setSelectedDevice('pixel9')}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                      selectedDevice === 'pixel9'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Google Pixel 9 (412px)
                  </button>
                  <button
                    onClick={() => setSelectedDevice('ipad')}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                      selectedDevice === 'ipad'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    iPad Mini (768px)
                  </button>
                </div>
              </div>

              {/* Device Frame Simulation */}
              <div className="flex justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800 overflow-x-auto">
                <div
                  className={`bg-slate-900 rounded-[36px] border-[6px] border-slate-700 shadow-2xl overflow-hidden flex flex-col transition-all relative ${
                    selectedDevice === 'iphone16'
                      ? 'w-[393px] h-[640px]'
                      : selectedDevice === 'pixel9'
                      ? 'w-[412px] h-[640px]'
                      : 'w-[720px] h-[640px]'
                  }`}
                >
                  {/* Dynamic Island / Notch */}
                  <div className="h-6 bg-slate-950 w-full flex items-center justify-between px-6 shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">09:41</span>
                    {selectedDevice === 'iphone16' && (
                      <div className="w-24 h-3.5 bg-black rounded-full mx-auto" />
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* App Live Preview Iframe */}
                  <iframe
                    src="/"
                    title="Live Device Simulator"
                    className="w-full flex-1 border-0 bg-slate-950"
                  />

                  {/* Home Indicator Bar */}
                  <div className="h-4 bg-slate-950 w-full flex items-center justify-center shrink-0">
                    <div className="w-28 h-1 bg-slate-600 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Ready for iOS App Store & Google Play Store compilation</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
