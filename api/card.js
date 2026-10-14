const crypto = require('crypto');

module.exports = async (req, res) => {
  try {
    const { put, list } = await import('@vercel/blob');

    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!b || typeof b !== 'object') return res.status(400).json({ error: 'bad body' });
      const id = crypto.randomBytes(5).toString('hex');
      const data = {
        i: String(b.i || '').slice(0, 500),
        c: String(b.c || '').slice(0, 500),
        p: typeof b.p === 'string' && b.p.length < 4000000 ? b.p : undefined,
      };
      await put('cards/' + id + '.json', JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });
      return res.status(200).json({ id });
    }

    const id = String(req.query.id || '');
    if (!/^[a-f0-9]{10}$/.test(id)) return res.status(400).json({ error: 'bad id' });
    const { blobs } = await list({ prefix: 'cards/' + id + '.json' });
    if (!blobs.length) return res.status(404).json({ error: 'not found' });
    const r = await fetch(blobs[0].url);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(await r.text());
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
