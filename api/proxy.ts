import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { apiKey, url } = req.query;

    if (!apiKey || typeof apiKey !== 'string' || !url || typeof url !== 'string') {
        return res.status(400).json({ error: 'apiKey and url query parameters are required' });
    }

    try {
        // 1. Validate API Key
        // Query is simplified to only check for the key's existence as expiration check is removed.
        const { data: keyData, error: keyError } = await supabase
            .from('proxy_keys')
            .select('lifetime')
            .eq('key', apiKey)
            .single();

        if (keyError || !keyData) {
            console.error('Supabase query returned an error or key not found:', keyError);
            return res.status(403).json({ error: 'Invalid or incorrect API Key' });
        }

        // 2. Expiration check based on creation date is removed due to missing 'created_at' column.
        // A simple check for a non-zero lifetime could be added here if needed, but for now, all keys are treated as active.

        // 3. Fetch the target URL
        const headers = { ...req.headers };
        delete headers.host;
        delete headers['x-vercel-deployment-url'];
        delete headers['x-vercel-id'];
        delete headers['x-real-ip'];
        delete headers['x-forwarded-for'];
        delete headers['x-forwarded-proto'];
        
        const targetResponse = await fetch(url, {
           headers: headers as HeadersInit,
           method: req.method,
           body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
           redirect: 'follow'
        });

        // 4. Stream the response back to the client
        res.status(targetResponse.status);
        targetResponse.headers.forEach((value, name) => {
            if (!['content-encoding', 'transfer-encoding'].includes(name.toLowerCase())) {
                res.setHeader(name, value);
            }
        });
        
        const body = await targetResponse.arrayBuffer();
        res.send(Buffer.from(body));

    } catch (fetchError: any) {
        console.error('Error during fetch operation:', fetchError);
        res.status(502).json({ error: 'Bad Gateway: Failed to fetch the target URL', details: fetchError.message });
    }
}