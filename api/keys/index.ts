import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    switch (req.method) {
        case 'GET':
            return handleGet(req, res);
        case 'POST':
            return handlePost(req, res);
        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
    try {
        const { data, error } = await supabase
            .from('proxy_keys')
            .select('id, key, region, lifetime');

        if (error) throw error;
        
        // Map database response to ProxyKey type
        const keys = data.map(item => ({
            id: item.id,
            key: item.key,
            region: item.region,
            lifetime: item.lifetime,
        }));
        
        // Set Cache-Control headers to prevent caching on browsers and CDNs
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.status(200).json(keys);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch keys', error: error.message });
    }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
    try {
        const { region, lifetime } = req.body;
        const apiKey = `proxy_live_${randomBytes(16).toString('hex')}`;

        const { data, error } = await supabase
            .from('proxy_keys')
            .insert({ key: apiKey, region, lifetime })
            .select('id, key, region, lifetime')
            .single();

        if (error) throw error;
        
        const newKey = {
          id: data.id,
          key: data.key,
          region: data.region,
          lifetime: data.lifetime,
        };

        res.status(201).json(newKey);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to generate key', error: error.message });
    }
}