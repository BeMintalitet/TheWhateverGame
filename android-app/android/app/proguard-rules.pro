# THE WHATEVER GAME — R8 rules
# The app is a WebView shell, so almost nothing Java-side is reachable by name.
# These keeps exist because reflection is used by Capacitor and the ad SDK.

# --- Capacitor: plugins are discovered and invoked reflectively ---
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep class com.whatevergame.app.** { *; }

# --- Google Mobile Ads / UMP ---
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.ump.** { *; }
-dontwarn com.google.android.gms.**

# --- Community AdMob plugin ---
-keep class com.getcapacitor.community.admob.** { *; }

# --- WebView JS bridge ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- keep annotations & signatures R8 would otherwise drop ---
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod

# quieter builds
-dontwarn org.apache.cordova.**
