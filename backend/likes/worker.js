import { DurableObject } from 'cloudflare:workers';
import { initialize, readCounter, addHeart, isVisitorId } from './counter.js';

export class PortfolioLikes extends DurableObject {
    constructor(ctx, env) {
        super(ctx, env);
        initialize(ctx.storage);
    }
    async fetch(request) {
        if (request.method === 'GET') {
            return Response.json(readCounter(this.ctx.storage, new URL(request.url).searchParams.get('visitorId')));
        }
        const payload = await request.text();
        if (payload.length > 1024) return Response.json({error:'Request too large'}, {status:413});
        let body;
        try { body = JSON.parse(payload); } catch { return Response.json({error:'Invalid JSON'}, {status:400}); }
        if (!isVisitorId(body?.visitorId)) return Response.json({error:'Invalid visitor ID'}, {status:400});
        return Response.json(addHeart(this.ctx.storage, body.visitorId));
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname !== '/api/likes') return new Response('Not found', {status:404});
        const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim());
        const origin = request.headers.get('Origin');
        if (origin && !allowed.includes(origin)) return new Response('Origin not allowed', {status:403});
        const headers = {
            'Cache-Control':'no-store',
            'Vary':'Origin',
            ...(origin ? {'Access-Control-Allow-Origin':origin} : {}),
            'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers':'Content-Type',
        };
        if (request.method === 'OPTIONS') return new Response(null, {status:204,headers});
        if (!['GET','POST'].includes(request.method)) return new Response('Method not allowed', {status:405,headers:{...headers,Allow:'GET, POST, OPTIONS'}});
        if (request.method === 'POST' && !origin) return new Response('Origin required', {status:403,headers});
        if (request.method === 'POST' && Number(request.headers.get('Content-Length') || 0) > 1024) return new Response('Request too large', {status:413,headers});
        if (request.method === 'POST' && !request.headers.get('Content-Type')?.startsWith('application/json')) return new Response('JSON required', {status:415,headers});
        try {
            // One named object provides a single persistent total for the entire portfolio.
            const id = env.LIKES.idFromName('mahesh-portfolio');
            const response = await env.LIKES.get(id).fetch(request);
            return new Response(response.body, {status:response.status,headers:{...headers,'Content-Type':'application/json'}});
        } catch {
            return Response.json({error:'Counter temporarily unavailable'}, {status:503,headers});
        }
    },
};
