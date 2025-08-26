// Browser detection utilities for popup handling

export function isSafari(): boolean {
  return !!navigator.userAgent.match('Safari/...') &&
         !navigator.userAgent.match('Chrome/...') &&
         !navigator.userAgent.match('Chromium/...') &&
         !navigator.userAgent.match('Epiphany/...');
}

export function isFirefox(): boolean {
  return !!navigator.userAgent.match('Firefox/...') &&
         !navigator.userAgent.match('Seamonkey/...');
}

export function isChrome(): boolean {
  return !!navigator.userAgent.match('Chrome/...') &&
         !navigator.userAgent.match('Chromium/...') &&
         !navigator.userAgent.match('Edg/...') &&
         !navigator.userAgent.match('OPR/...');
}

export function isEdge(): boolean {
  return !!navigator.userAgent.match('Edg/...');
}

export function isChromium(): boolean {
  return !!navigator.userAgent.match('Chromium/...');
}

export function isOpera(): boolean {
  return !!navigator.userAgent.match('OPR/...');
}

export function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    isSafari: isSafari(),
    isFirefox: isFirefox(),
    isChrome: isChrome(),
    isEdge: isEdge(),
    isChromium: isChromium(),
    isOpera: isOpera()
  };
}
