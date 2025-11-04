import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { id } = req.query;

        if (!id || Array.isArray(id)) {
            return res.status(400).json({ message: 'Invalid key ID provided.' });
        }

        const { error } = await supabase
            .from('proxy_keys')
            .delete()
            .match({ id: id });

        if (error) throw error;

        res.status(204).end(); // 204 No Content for successful deletion
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to delete key', error: error.message });
    }
}
