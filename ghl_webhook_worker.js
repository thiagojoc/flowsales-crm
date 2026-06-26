/**
 * Flow Sales — Cloudflare Worker
 * Recebe webhook do GHL quando novo lead entra e registra no Firebase
 *
 * Deploy:
 *  1. Acesse https://dash.cloudflare.com → Workers & Pages → Create Worker
 *  2. Cole este código e clique em Deploy
 *  3. Copie a URL gerada (ex: https://flowsales-leads.SEU-DOMINIO.workers.dev)
 *  4. No GHL: Settings → Webhooks → Add Webhook → cole a URL → evento: Contact Created
 *
 * Para cada escritório, adicione o campo "firm_id" no pipeline do GHL,
 * ou edite FIRM_ID_MAP abaixo para mapear por pipeline/tag.
 */

const FB_API_KEY = 'AIzaSyBTqzj-9-AOI181sPCKvRsVGDujkWogIGI';
const FB_PROJECT = 'flowbody-30162';

// Mapeamento opcional: se o GHL mandar uma tag ou pipeline específico,
// mapeia para o firm ID correspondente no Firebase.
// Ex: { 'pipeline_escritorio_silva': 'firm_abc123' }
// Deixe vazio para usar o campo "firm_id" que o GHL mandar no payload.
const FIRM_ID_MAP = {};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return new Response('Flow Sales Webhook ✅', { status: 200 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response('Bad JSON', { status: 400 });
    }

    // Extrair dados do lead (GHL envia campos assim)
    const name   = body.first_name || body.name || body.contact_name || 'Lead sem nome';
    const phone  = body.phone || body.phone_number || '';
    const email  = body.email || '';
    const source = body.source || body.utm_source || 'GHL';
    const now    = new Date().toISOString();
    const nowBR  = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo',
                     day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });

    // Determinar firm_id
    let firmId = body.firm_id || body.custom_field_firm_id;
    if (!firmId && body.pipeline_id) firmId = FIRM_ID_MAP[body.pipeline_id];
    if (!firmId && body.tags) {
      const tag = (body.tags || []).find(t => FIRM_ID_MAP[t]);
      if (tag) firmId = FIRM_ID_MAP[tag];
    }

    if (!firmId) {
      // Sem firm_id, registra no log mas retorna 200 para o GHL não reenviar
      console.log('Webhook sem firm_id:', JSON.stringify(body));
      return new Response(JSON.stringify({ ok: true, msg: 'sem firm_id mapeado' }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ler doc atual do Firebase
    const readUrl = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/flowsales_crm/${firmId}?key=${FB_API_KEY}`;
    const readRes = await fetch(readUrl);
    if (!readRes.ok) {
      return new Response('Erro ao ler Firebase', { status: 502 });
    }
    const doc = await readRes.json();
    const fields = doc.fields || {};

    // Ler notifs atuais
    const notifs = parseArray(fields.notifs);
    const nid = 'lead_' + Date.now();
    notifs.unshift({
      id: nid,
      title: `Novo lead: ${name}`,
      sub: (phone ? phone + ' · ' : '') + nowBR + (source ? ' · ' + source : ''),
      read: false,
      ts: now
    });
    // Manter só 50 notificações
    if (notifs.length > 50) notifs.length = 50;

    // Gravar de volta (PATCH com updateMask)
    const patchUrl = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/flowsales_crm/${firmId}?key=${FB_API_KEY}&updateMask.fieldPaths=notifs&updateMask.fieldPaths=__ts`;
    const patchBody = {
      fields: {
        notifs: toFsArray(notifs),
        __ts: { integerValue: Date.now().toString() }
      }
    };

    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchBody)
    });

    if (!patchRes.ok) {
      const err = await patchRes.text();
      console.error('Patch error:', err);
      return new Response('Erro ao gravar Firebase: ' + err, { status: 502 });
    }

    console.log(`Lead registrado: ${name} → ${firmId}`);
    return new Response(JSON.stringify({ ok: true, lead: name, firm: firmId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
};

// ── Helpers Firestore ────────────────────────────────────────────────────────

function parseArray(field) {
  if (!field || !field.arrayValue) return [];
  return (field.arrayValue.values || []).map(v => {
    if (v.mapValue) {
      const obj = {};
      Object.entries(v.mapValue.fields || {}).forEach(([k, fv]) => {
        obj[k] = parseFv(fv);
      });
      return obj;
    }
    return parseFv(v);
  });
}

function parseFv(fv) {
  if (fv.stringValue  !== undefined) return fv.stringValue;
  if (fv.integerValue !== undefined) return parseInt(fv.integerValue);
  if (fv.booleanValue !== undefined) return fv.booleanValue;
  return '';
}

function toFsValue(v) {
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number')  return { integerValue: v.toString() };
  if (typeof v === 'string')  return { stringValue: v };
  if (Array.isArray(v))       return { arrayValue: { values: v.map(toFsValue) } };
  if (v && typeof v === 'object') {
    const fields = {};
    Object.entries(v).forEach(([k, val]) => { fields[k] = toFsValue(val); });
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function toFsArray(arr) {
  return { arrayValue: { values: arr.map(toFsValue) } };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
