/* =========================================================================
   Sayable Kiosk Kit: QR renderer.
   One fixed Android Enterprise device-owner provisioning payload for Fully
   Kiosk Browser, drawn as a QR code in the browser. Nothing personal is in
   the code (Wi-Fi is chosen on the tablet during setup). Uses the vendored
   qrcode-generator library (Kazuhiko Arase, MIT).
   ========================================================================= */
(function () {
  "use strict";

  // Verified constants. The signature checksum is the SHA-256 of Fully's APK
  // signing certificate (unchanged 2016-2041, so this QR survives releases);
  // the download URL is a versioned build the vendor keeps hosted.
  var PAYLOAD = {
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
      "de.ozerov.fully/de.ozerov.fully.DeviceOwnerReceiver",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
      "https://www.fully-kiosk.com/files/2026/02/Fully-Kiosk-Browser-v1.60.1.apk",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM":
      "v5qeE-1xQK9yWNys3tA3l3YFCwuNQwWzSoJfHeXQ42I",
    "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
    "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
    "android.app.extra.PROVISIONING_KEEP_SCREEN_ON": true,
    "android.app.extra.PROVISIONING_SKIP_EDUCATION_SCREENS": true,
    "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
      FULLY_SETTINGS_DOWNLOAD_LOCATION: "https://sayable.systems/kit/fully-settings.json"
    }
  };

  var qrEl = document.getElementById("qr-out");
  var codeEl = document.getElementById("payload-json");
  if (!qrEl) return;

  try {
    var qr = qrcode(0, "M");
    qr.addData(JSON.stringify(PAYLOAD));
    qr.make();
    qrEl.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
    var svg = qrEl.querySelector("svg");
    if (svg) {
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Setup QR code for the tablet");
    }
  } catch (e) {
    qrEl.textContent = "Could not draw the QR code — please reload the page.";
  }
  if (codeEl) codeEl.textContent = JSON.stringify(PAYLOAD, null, 2);
})();
