export function getIngressBackendByRegion(url: URL) {
  const region = url.searchParams.get('region')
  switch (region) {
    case 'eu':
      return 'eu.fpjs'
    case 'ap':
      return 'ap.fpjs'
    case 'us':
    default:
      return 'fpjs'
  }
}
