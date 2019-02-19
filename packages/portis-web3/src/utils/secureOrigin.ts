export function validateSecureOrigin() {
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const isSecureOrigin = location.protocol === 'https:';
  const isSecure = isLocalhost || isSecureOrigin;

  if (!isSecure) {
    throw `[Portis] Access to the WebCrypto API is restricted to secure origins.\nIf this is a development environment please use http://localhost:${
      location.port
    } instead.\nOtherwise, please use an SSL certificate.`;
  }
}
