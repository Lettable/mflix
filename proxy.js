// proxy.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/api/movie/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const r = await fetch(`https://api.rgshows.me/main/movie/${id}`, {
            headers: {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-GB,en;q=0.9',
                'origin': 'https://www.vidsrc.wtf',
                'referer': 'https://www.vidsrc.wtf/',
                'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'sec-gpc': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
            }
        });
        const json = await r.json();
        res.json(json);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Proxy running on http://localhost:3000'));
