/* =========================================================================
   Sayable Kiosk Kit: QR generator.
   Builds the Android Enterprise device-owner provisioning payload for Fully
   Kiosk Browser and renders it as a QR code, entirely in this page. Wi-Fi
   credentials never leave the browser. Uses the vendored qrcode-generator
   library (Kazuhiko Arase, MIT).
   ========================================================================= */
(function () {
  "use strict";

  // Verified constants. The signature checksum is the SHA-256 of Fully's APK
  // signing certificate (unchanged 2016-2041, so this QR survives releases);
  // the download URL is a versioned build the vendor keeps hosted.
  var PAYLOAD_BASE = {
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

  var ssidEl = document.getElementById("wifi-ssid");
  var passEl = document.getElementById("wifi-pass");
  var secEl = document.getElementById("wifi-sec");
  var qrEl = document.getElementById("qr-out");
  var noteEl = document.getElementById("qr-note");
  var codeEl = document.getElementById("payload-json");
  if (!qrEl) return;

  function buildPayload() {
    var p = {};
    for (var k in PAYLOAD_BASE) p[k] = PAYLOAD_BASE[k];
    var ssid = ssidEl && ssidEl.value.trim();
    if (ssid) {
      p["android.app.extra.PROVISIONING_WIFI_SSID"] = ssid;
      var sec = secEl ? secEl.value : "WPA";
      if (sec !== "NONE") {
        p["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"] = sec;
        var pass = passEl ? passEl.value : "";
        if (pass) p["android.app.extra.PROVISIONING_WIFI_PASSWORD"] = pass;
      } else {
        p["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"] = "NONE";
      }
    }
    return p;
  }

  function render() {
    var payload = buildPayload();
    var json = JSON.stringify(payload);
    try {
      var qr = qrcode(0, "M");
      qr.addData(json);
      qr.make();
      qrEl.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
      var svg = qrEl.querySelector("svg");
      if (svg) {
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "Setup QR code for the tablet");
      }
      if (noteEl) {
        noteEl.textContent = payload["android.app.extra.PROVISIONING_WIFI_SSID"]
          ? "Wi-Fi “" + payload["android.app.extra.PROVISIONING_WIFI_SSID"] + "” is included — the tablet will connect by itself."
          : "No Wi-Fi in the code — the tablet will ask you to pick a network during setup. That works fine too.";
      }
    } catch (e) {
      qrEl.textContent = "Could not draw the QR code — try shorter Wi-Fi details.";
    }
    if (codeEl) codeEl.textContent = JSON.stringify(payload, null, 2);
  }

  ["input", "change"].forEach(function (evt) {
    [ssidEl, passEl, secEl].forEach(function (el) {
      if (el) el.addEventListener(evt, render);
    });
  });

  render();
})();
