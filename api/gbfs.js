// Proxy GBFS — contourne les restrictions CORS des APIs de micro-mobilité
// Déployé sur Vercel (gratuit, sans backend à gérer)

export default async function handler(req, res) {
  // Autoriser les requêtes depuis n'importe quelle origine (notre app GitHub Pages)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: 'Paramètre "url" manquant' });
    return;
  }

  // Whitelist de domaines autorisés — sécurité anti-abus
  const allowedDomains = [
    'data.lime.bike',
    'platform.tier-services.io',
    'gbfs.tier-services.io',
    'gbfs.api.ridedott.com',
    'gbfs.ridedott.com',
    'mds.bird.co',
    'api.voiapp.io',
    'api.jcdecaux.com',
    'api.cyclocity.fr',
    'gbfs.theta.fifteen.eu',
    'api.omega.fifteen.eu',
    'opendata.paris.fr',
    'proxy.transport.data.gouv.fr',
    'bdx.mecatran.com',
    'services.rideyego.com',
  ];

  let targetUrl;
  try {
    targetUrl = new URL(url);
  } catch (e) {
    res.status(400).json({ error: 'URL invalide' });
    return;
  }

  const isAllowed = allowedDomains.some(domain => targetUrl.hostname.endsWith(domain));
  if (!isAllowed) {
    res.status(403).json({ error: 'Domaine non autorisé' });
    return;
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Mobio Proxy)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Upstream error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate'); // cache 15s côté Vercel
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Échec de la requête vers l\'API source', detail: e.message });
  }
}
