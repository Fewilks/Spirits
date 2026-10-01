// ============================================================================
// pokemonLocalApi.ts — Interceptor de API TCG para GitHub Pages e offline
// ============================================================================
// Garante que 100% das coleções (Base até Mega Evolution & 30 Anos & Pocket)
// e cartas pesquisadas estejam disponíveis para o usuário no GitHub Pages,
// com suporte a busca por coleção, busca por nome, busca por código PTCGL
// e fallback transparente entre TCGdex, PokémonTCG.io e catálogo local.

import { 
  COMPREHENSIVE_SETS, 
  MODERN_CARDS_CATALOG, 
  normalizeSearchTerm,
  TPCI_TO_LOCAL_SET_MAP,
  LOCAL_TO_TPCI_SET_MAP,
  SET_QUERY_ALIASES 
} from '../data/pokemonCatalog';
import { 
  SET_SYNC_TABLE, 
  findSet, 
  tcgdexUrl, 
  ptcgIoUrl, 
  limitlessUrl, 
  CARD_BACK_URL 
} from '../utils/setSync';
import { 
  normalizePokemonCard, 
  normalizeSetToPTCGLCode, 
  normalizeCardNumber 
} from './cardNormalizationService';
import { isStaticDeployment } from './limitlessApi';

// ----------------------------------------------------------------------------
// 1. MAPA DINÂMICO COMPLETO PARA TCGDEX (TODAS AS COLEÇÕES HISTÓRICAS E MODERNAS)
// ----------------------------------------------------------------------------

const SET_TO_TCGDEX_MAP: Record<string, { series: string; set: string }> = (() => {
  const map: Record<string, { series: string; set: string }> = {};
  for (const e of SET_SYNC_TABLE) {
    if (!e.tcgdexSeries || !e.tcgdexSet) continue;
    const entry = { series: e.tcgdexSeries, set: e.tcgdexSet };
    map[e.tpci] = entry;
    map[e.tpci.toUpperCase()] = entry;
    map[e.tpci.toLowerCase()] = entry;
    map[e.tcgdexSet] = entry;
    map[e.tcgdexSet.toLowerCase()] = entry;
    if (e.ptcgIo) {
      map[e.ptcgIo] = entry;
      map[e.ptcgIo.toLowerCase()] = entry;
    }
  }
  return map;
})();

// Helper para montar scan de alta resolução
function resolveCardImageUrl(setCode: string, setNumber: string | number, lang: 'pt' | 'en' = 'pt'): string {
  if (!setCode || !setNumber) return CARD_BACK_URL;
  const tcgdex = tcgdexUrl(setCode, setNumber, lang);
  if (tcgdex) return tcgdex;
  const ptIo = ptcgIoUrl(setCode, setNumber);
  if (ptIo) return ptIo;
  const lim = limitlessUrl(setCode, setNumber);
  if (lim) return lim;
  return CARD_BACK_URL;
}

// Cache em memória para sets e pesquisas completas
const TCGDEX_SET_CACHE = new Map<string, any[]>();
const CARD_QUERY_CACHE = new Map<string, any[]>();

/**
 * Busca todas as cartas de uma coleção específica no TCGdex com fallback no Pokemontcg.io
 */
async function fetchTcgdexCompleteSet(
  tcgdexSetId: string,
  series: string,
  tpciSetCode: string,
  setNameFallback: string
): Promise<any[]> {
  const cacheKey = `${series}-${tcgdexSetId}`.toLowerCase();
  if (TCGDEX_SET_CACHE.has(cacheKey)) {
    return TCGDEX_SET_CACHE.get(cacheKey)!;
  }

  let cardsData: any[] = [];
  const ptNameMap = new Map<string, string>();
  const ptImageMap = new Map<string, string>();

  // 1. Tentar TCGdex em Português e Inglês com timeout
  try {
    const ptController = new AbortController();
    const ptTimer = setTimeout(() => ptController.abort(), 6000);
    const enController = new AbortController();
    const enTimer = setTimeout(() => enController.abort(), 6000);

    const [ptResult, enResult] = await Promise.allSettled([
      fetch(`https://api.tcgdex.net/v2/pt/sets/${tcgdexSetId}`, { signal: ptController.signal }).then(r => r.ok ? r.json() : null),
      fetch(`https://api.tcgdex.net/v2/en/sets/${tcgdexSetId}`, { signal: enController.signal }).then(r => r.ok ? r.json() : null),
    ]);
    clearTimeout(ptTimer);
    clearTimeout(enTimer);

    const ptData = ptResult.status === 'fulfilled' ? ptResult.value : null;
    const enData = enResult.status === 'fulfilled' ? enResult.value : null;

    if (ptData?.cards && Array.isArray(ptData.cards)) {
      for (const c of ptData.cards) {
        const rawNum = String(c.localId || c.id?.split('-')[1] || '').trim();
        const cleanNum = rawNum.replace(/^0+/, '') || '1';
        if (cleanNum && c.name) ptNameMap.set(cleanNum, c.name);
        if (cleanNum && c.image) ptImageMap.set(cleanNum, `${c.image}/high.webp`);
      }
      cardsData = ptData.cards;
    }

    if (enData?.cards && Array.isArray(enData.cards) && enData.cards.length > cardsData.length) {
      cardsData = enData.cards;
    }
  } catch (err) {
    console.warn('[pokemonLocalApi] Erro na consulta TCGdex do set:', err);
  }

  // 2. Se TCGdex retornou cartas, mapear
  if (cardsData.length > 0) {
    const isSvOrMe = series === 'sv' || series === 'me';
    const mapped = cardsData.map((c: any) => {
      const rawLocalId = String(c.localId || c.id?.split('-')[1] || '').trim();
      const cleanNum = rawLocalId.replace(/^0+/, '') || '1';
      const formattedNum = isSvOrMe && /^\d+$/.test(rawLocalId) ? cleanNum.padStart(3, '0') : rawLocalId;

      let imageUrl = ptImageMap.get(cleanNum) || '';
      if (!imageUrl) {
        if (c.image) imageUrl = `${c.image}/high.webp`;
        else imageUrl = resolveCardImageUrl(tpciSetCode, formattedNum, 'pt');
      }

      const finalName = ptNameMap.get(cleanNum) || c.name;

      return {
        id: `${tpciSetCode}-${formattedNum}`,
        localId: c.id || `${tcgdexSetId}-${formattedNum}`,
        name: finalName,
        imageUrl,
        setCode: tpciSetCode,
        setName: setNameFallback,
        setNumber: formattedNum,
        tpciCode: `${tpciSetCode} ${formattedNum}`,
        tpciSetCode,
        localSetId: tcgdexSetId,
      };
    });

    TCGDEX_SET_CACHE.set(cacheKey, mapped);
    return mapped;
  }

  // 3. Fallback no PokémonTCG.io se o set não estiver no TCGdex
  const setEntry = findSet(tpciSetCode);
  if (setEntry?.ptcgIo) {
    try {
      const ioController = new AbortController();
      const ioTimer = setTimeout(() => ioController.abort(), 6000);
      const ioRes = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setEntry.ptcgIo}&pageSize=250`, {
        signal: ioController.signal
      });
      clearTimeout(ioTimer);

      if (ioRes.ok) {
        const ioData = await ioRes.json();
        if (Array.isArray(ioData?.data) && ioData.data.length > 0) {
          const mappedIo = ioData.data.map((c: any) => ({
            id: `${tpciSetCode}-${c.number}`,
            localId: c.id,
            name: c.name,
            imageUrl: c.images?.small || c.images?.large || resolveCardImageUrl(tpciSetCode, c.number),
            setCode: tpciSetCode,
            setName: setNameFallback || c.set?.name || tpciSetCode,
            setNumber: c.number,
            tpciCode: `${tpciSetCode} ${c.number}`,
            tpciSetCode,
            localSetId: setEntry.ptcgIo,
          }));
          TCGDEX_SET_CACHE.set(cacheKey, mappedIo);
          return mappedIo;
        }
      }
    } catch {
      // Ignora erro suavemente
    }
  }

  // 4. Fallback no catálogo local consolidado
  const localMatches = MODERN_CARDS_CATALOG.filter(c => 
    c.setCode.toUpperCase() === tpciSetCode.toUpperCase() ||
    (c.localSetId && c.localSetId.toLowerCase() === tcgdexSetId.toLowerCase())
  );
  if (localMatches.length > 0) {
    TCGDEX_SET_CACHE.set(cacheKey, localMatches);
    return localMatches;
  }

  return [];
}

/**
 * Busca cartas por nome através de TCGdex, Pokemontcg.io e catálogo local
 */
async function searchCardsByQuery(nameQuery: string): Promise<any[]> {
  const normQ = normalizeSearchTerm(nameQuery);
  if (!normQ) return [];

  const cacheKey = normQ;
  if (CARD_QUERY_CACHE.has(cacheKey)) {
    return CARD_QUERY_CACHE.get(cacheKey)!;
  }

  const resultsMap = new Map<string, any>();

  // 1. Catálogo local instantâneo
  const localMatches = MODERN_CARDS_CATALOG.filter(c => {
    const cn = normalizeSearchTerm(c.name);
    return cn.includes(normQ) || c.id.toLowerCase().includes(normQ);
  });
  for (const c of localMatches) {
    const key = `${c.setCode}-${c.setNumber}`.toUpperCase();
    resultsMap.set(key, c);
  }

  // 2. Consulta paralela na API pública do TCGdex (pt e en) e Pokemontcg.io
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);

    const [ptRes, enRes, ioRes] = await Promise.allSettled([
      fetch(`https://api.tcgdex.net/v2/pt/cards?name=${encodeURIComponent(nameQuery)}`, { signal: controller.signal })
        .then(r => r.ok ? r.json() : []),
      fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(nameQuery)}`, { signal: controller.signal })
        .then(r => r.ok ? r.json() : []),
      fetch(`https://api.pokemontcg.io/v2/cards?q=name:"*${encodeURIComponent(nameQuery)}*"&pageSize=40`, { signal: controller.signal })
        .then(r => r.ok ? r.json() : { data: [] })
    ]);
    clearTimeout(timer);

    // Processa TCGdex PT
    const ptCards = ptRes.status === 'fulfilled' && Array.isArray(ptRes.value) ? ptRes.value : [];
    for (const c of ptCards) {
      if (!c.name) continue;
      const rawId = String(c.id || '');
      const rawSetPart = rawId.includes('-') ? rawId.substring(0, rawId.lastIndexOf('-')) : '';
      const setEntry = findSet(rawSetPart) || findSet(c.localId);
      const tpciCode = setEntry?.tpci || rawSetPart.toUpperCase() || 'SVI';
      const cleanNum = String(c.localId || '').replace(/^0+/, '') || '1';
      const isSvOrMe = setEntry?.era === 'sv' || setEntry?.era === 'me';
      const formattedNum = isSvOrMe && /^\d+$/.test(cleanNum) ? cleanNum.padStart(3, '0') : cleanNum;

      const cardKey = `${tpciCode}-${formattedNum}`.toUpperCase();
      const imgUrl = c.image ? `${c.image}/high.webp` : resolveCardImageUrl(tpciCode, formattedNum, 'pt');

      resultsMap.set(cardKey, {
        id: cardKey,
        localId: c.id,
        name: c.name,
        imageUrl: imgUrl,
        setCode: tpciCode,
        setName: setEntry?.namePt || setEntry?.name || tpciCode,
        setNumber: formattedNum,
        tpciCode: `${tpciCode} ${formattedNum}`,
        tpciSetCode: tpciCode,
        localSetId: setEntry?.ptcgIo || rawSetPart
      });
    }

    // Processa TCGdex EN (para cartas não traduzidas no TCGdex PT)
    const enCards = enRes.status === 'fulfilled' && Array.isArray(enRes.value) ? enRes.value : [];
    for (const c of enCards) {
      if (!c.name) continue;
      const rawId = String(c.id || '');
      const rawSetPart = rawId.includes('-') ? rawId.substring(0, rawId.lastIndexOf('-')) : '';
      const setEntry = findSet(rawSetPart) || findSet(c.localId);
      const tpciCode = setEntry?.tpci || rawSetPart.toUpperCase() || 'SVI';
      const cleanNum = String(c.localId || '').replace(/^0+/, '') || '1';
      const isSvOrMe = setEntry?.era === 'sv' || setEntry?.era === 'me';
      const formattedNum = isSvOrMe && /^\d+$/.test(cleanNum) ? cleanNum.padStart(3, '0') : cleanNum;

      const cardKey = `${tpciCode}-${formattedNum}`.toUpperCase();
      if (!resultsMap.has(cardKey)) {
        const imgUrl = c.image ? `${c.image}/high.webp` : resolveCardImageUrl(tpciCode, formattedNum, 'en');
        resultsMap.set(cardKey, {
          id: cardKey,
          localId: c.id,
          name: c.name,
          imageUrl: imgUrl,
          setCode: tpciCode,
          setName: setEntry?.namePt || setEntry?.name || tpciCode,
          setNumber: formattedNum,
          tpciCode: `${tpciCode} ${formattedNum}`,
          tpciSetCode: tpciCode,
          localSetId: setEntry?.ptcgIo || rawSetPart
        });
      }
    }

    // Processa Pokemontcg.io
    const ioData = ioRes.status === 'fulfilled' && ioRes.value?.data ? ioRes.value.data : [];
    for (const c of ioData) {
      if (!c.name) continue;
      const setEntry = findSet(c.set?.id) || findSet(c.set?.name);
      const tpciCode = setEntry?.tpci || c.set?.id?.toUpperCase() || 'SVI';
      const cleanNum = String(c.number || '').replace(/^0+/, '') || '1';
      const isSvOrMe = setEntry?.era === 'sv' || setEntry?.era === 'me';
      const formattedNum = isSvOrMe && /^\d+$/.test(cleanNum) ? cleanNum.padStart(3, '0') : cleanNum;

      const cardKey = `${tpciCode}-${formattedNum}`.toUpperCase();
      if (!resultsMap.has(cardKey)) {
        const imgUrl = c.images?.small || c.images?.large || resolveCardImageUrl(tpciCode, formattedNum, 'en');
        resultsMap.set(cardKey, {
          id: cardKey,
          localId: c.id,
          name: c.name,
          imageUrl: imgUrl,
          setCode: tpciCode,
          setName: setEntry?.namePt || c.set?.name || setEntry?.name || tpciCode,
          setNumber: formattedNum,
          tpciCode: `${tpciCode} ${formattedNum}`,
          tpciSetCode: tpciCode,
          localSetId: c.set?.id
        });
      }
    }
  } catch (err) {
    console.warn('[pokemonLocalApi] Erro na busca remota por nome:', err);
  }

  const finalCards = Array.from(resultsMap.values());

  // Ordenar priorizando correspondências exatas e cartas recentes
  finalCards.sort((a, b) => {
    const aExact = normalizeSearchTerm(a.name) === normQ ? 1 : 0;
    const bExact = normalizeSearchTerm(b.name) === normQ ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    return (b.id || '').localeCompare(a.id || '');
  });

  CARD_QUERY_CACHE.set(cacheKey, finalCards);
  return finalCards;
}

// ----------------------------------------------------------------------------
// 2. META DECKS (fallback padrão)
// ----------------------------------------------------------------------------

const metaDecks = [
  { name: 'Pikachu ex', archetype: 'Pikachu ex / Latias ex / Magneton', share: 18.2, winRate: 55.4, imageUrl: 'https://images.pokemontcg.io/sv8/57.png', updatedAt: '2024-11-08', description: 'O deck do momento após Surging Sparks.', cards: [], rawList: '' },
  { name: 'Regidrago VSTAR', archetype: 'Regidrago VSTAR / Teal Mask Ogerpon', share: 14.5, winRate: 53.8, imageUrl: 'https://images.pokemontcg.io/swsh12/136.png', updatedAt: '2023-06-09', description: 'Extremamente versátil.', cards: [], rawList: '' },
  { name: 'Raging Bolt ex', archetype: 'Raging Bolt ex / Teal Mask Ogerpon', share: 13.2, winRate: 52.9, imageUrl: 'https://images.pokemontcg.io/sv5/123.png', updatedAt: '2024-03-22', description: 'Dano explosivo ilimitado.', cards: [], rawList: '' },
  { name: 'Terapagos ex', archetype: 'Terapagos ex / Pidgeot ex / Dusknoir', share: 15.1, winRate: 53.6, imageUrl: 'https://images.pokemontcg.io/sv7/128.png', updatedAt: '2024-09-13', description: 'Area Zero Underdepths + Dusknoir.', cards: [], rawList: '' },
  { name: 'Ceruledge ex', archetype: 'Ceruledge ex / Dusknoir / Pecharunt', share: 12.8, winRate: 52.8, imageUrl: 'https://images.pokemontcg.io/sv8/36.png', updatedAt: '2024-11-08', description: 'Descarte em massa de energias.', cards: [], rawList: '' },
  { name: 'Dragapult ex', archetype: 'Dragapult ex / Pidgeot ex', share: 10.4, winRate: 51.9, imageUrl: 'https://images.pokemontcg.io/sv6/130.png', updatedAt: '2024-05-24', description: 'Dano cirúrgico.', cards: [], rawList: '' },
];

// ----------------------------------------------------------------------------
// 3. HANDLERS DOS ENDPOINTS
// ----------------------------------------------------------------------------

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleMeta(): Promise<Response> {
  return jsonResponse({
    decks: metaDecks,
    tournamentName: 'Standard format meta (Local Database / Fallback)',
  });
}

async function handleSets(): Promise<Response> {
  // Retorna TODAS as coleções do catálogo abrangente
  return jsonResponse(COMPREHENSIVE_SETS);
}

async function handleSearch(params: URLSearchParams): Promise<Response> {
  const rawQuery = (params.get('q') || '').trim();
  const rawSet = (params.get('set') || '').trim();

  if (!rawQuery && !rawSet) {
    // Se ambos estiverem vazios, retorna as cartas de destaque do catálogo
    return jsonResponse(MODERN_CARDS_CATALOG.slice(0, 18));
  }

  const normQuery = normalizeSearchTerm(rawQuery);
  const normSet = normalizeSearchTerm(rawSet);

  let resolvedSetId = rawSet ? (TPCI_TO_LOCAL_SET_MAP[rawSet.toUpperCase()] || rawSet.toLowerCase()) : '';
  let resolvedNumber = '';
  let nameQuery = rawQuery;

  // 1. Verifica se a query é um alias de coleção (ex: "realeza absoluta" -> "CRZ")
  if (!resolvedSetId && SET_QUERY_ALIASES[normQuery]) {
    const aliasCode = SET_QUERY_ALIASES[normQuery];
    resolvedSetId = TPCI_TO_LOCAL_SET_MAP[aliasCode] || aliasCode.toLowerCase();
    nameQuery = '';
  }

  // 2. Detecta código oficial como "OBF 125", "CRZ 160", "ASC 085", "SVI 166"
  const codeMatch = rawQuery.match(/^([A-Za-z0-9.-]{2,7})[- ]+(\d+|promo)$/i);
  if (codeMatch) {
    const setToken = codeMatch[1].toUpperCase();
    const setEntry = findSet(setToken);
    resolvedSetId = setEntry?.ptcgIo || setEntry?.tcgdexSet || TPCI_TO_LOCAL_SET_MAP[setToken] || setToken.toLowerCase();
    resolvedNumber = codeMatch[2];
    nameQuery = '';
  } else {
    // Detecta padrão "Charizard ex OBF 125"
    const ptcglNameMatch = rawQuery.match(/^(.+?)\s+([A-Za-z]{2,5})\s+(\d+)$/i);
    if (ptcglNameMatch) {
      nameQuery = ptcglNameMatch[1].trim();
      const setToken = ptcglNameMatch[2].toUpperCase();
      const setEntry = findSet(setToken);
      resolvedSetId = setEntry?.ptcgIo || setEntry?.tcgdexSet || TPCI_TO_LOCAL_SET_MAP[setToken] || setToken.toLowerCase();
      resolvedNumber = ptcglNameMatch[3];
    }
  }

  // CASO A: Coleção específica solicitada ou detectada
  if (resolvedSetId || rawSet) {
    const targetSet = rawSet || resolvedSetId;
    const setEntry = findSet(targetSet) || findSet(resolvedSetId);
    const tcgdexMapping =
      SET_TO_TCGDEX_MAP[targetSet] ||
      SET_TO_TCGDEX_MAP[targetSet.toUpperCase()] ||
      SET_TO_TCGDEX_MAP[targetSet.toLowerCase()] ||
      (setEntry?.tcgdexSeries && setEntry?.tcgdexSet ? { series: setEntry.tcgdexSeries, set: setEntry.tcgdexSet } : null);

    const tpciSetCode = setEntry?.tpci || (LOCAL_TO_TPCI_SET_MAP[targetSet.toLowerCase()] || targetSet.toUpperCase());
    const setName = setEntry?.namePt || setEntry?.name || tpciSetCode;

    try {
      let allCards: any[] = [];
      if (tcgdexMapping) {
        allCards = await fetchTcgdexCompleteSet(tcgdexMapping.set, tcgdexMapping.series, tpciSetCode, setName);
      } else if (setEntry?.ptcgIo) {
        allCards = await fetchTcgdexCompleteSet(setEntry.ptcgIo, setEntry.era || 'sv', tpciSetCode, setName);
      }

      if (allCards.length > 0) {
        let results = allCards;

        if (resolvedNumber) {
          const targetClean = resolvedNumber.replace(/^0+/, '');
          results = results.filter(c =>
            c.setNumber === resolvedNumber ||
            String(c.setNumber).replace(/^0+/, '') === targetClean
          );
        }

        if (nameQuery) {
          const nq = normalizeSearchTerm(nameQuery);
          results = results.filter(c => normalizeSearchTerm(c.name).includes(nq));
        }

        if (results.length > 0) return jsonResponse(results);
      }
    } catch (err) {
      console.warn('[pokemonLocalApi] Erro na busca por set:', err);
    }
  }

  // CASO B: Busca global por nome (Todas as Coleções)
  if (nameQuery || rawQuery) {
    try {
      const searchResults = await searchCardsByQuery(nameQuery || rawQuery);
      if (searchResults.length > 0) {
        let filtered = searchResults;
        if (resolvedNumber) {
          const targetClean = resolvedNumber.replace(/^0+/, '');
          filtered = filtered.filter(c =>
            c.setNumber === resolvedNumber ||
            String(c.setNumber).replace(/^0+/, '') === targetClean
          );
        }
        if (filtered.length > 0) {
          return jsonResponse(filtered);
        }
      }
    } catch (err) {
      console.warn('[pokemonLocalApi] Erro na busca por query:', err);
    }
  }

  // CASO C: Fallback final com catálogo local
  const normQ = normalizeSearchTerm(nameQuery || rawQuery);
  const matched = MODERN_CARDS_CATALOG.filter(c => {
    const cardSetCode = (c.setCode || '').toLowerCase();
    const cardName = normalizeSearchTerm(c.name || '');

    if (resolvedSetId) {
      const setMatches =
        cardSetCode === resolvedSetId.toLowerCase() ||
        cardSetCode === (LOCAL_TO_TPCI_SET_MAP[resolvedSetId.toLowerCase()] || '').toLowerCase() ||
        (c.localSetId && c.localSetId.toLowerCase() === resolvedSetId.toLowerCase());
      if (!setMatches) return false;
    }

    if (normQ) {
      return cardName.includes(normQ) || (c.setNumber && String(c.setNumber).includes(normQ));
    }
    return true;
  });

  return jsonResponse(matched);
}

async function handleParseDeck(body: string): Promise<Response> {
  const lines = String(body || '').split('\n');
  const cards: any[] = [];
  let currentCategory: 'Pokémon' | 'Treinador' | 'Energia' = 'Pokémon';

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const lowerLine = line.toLowerCase();
    if (lowerLine.startsWith('pokémon:') || lowerLine.startsWith('pokemon:')) { currentCategory = 'Pokémon'; continue; }
    if (lowerLine.startsWith('treinador:') || lowerLine.startsWith('trainer:') || lowerLine.startsWith('trainers:')) { currentCategory = 'Treinador'; continue; }
    if (lowerLine.startsWith('energia:') || lowerLine.startsWith('energy:')) { currentCategory = 'Energia'; continue; }

    const match = line.match(/^(\d+)\s+(.+?)(?:\s+([A-Z]{3,4}|[a-z]{3,4})\s+(\d+))?$/);
    if (match) {
      const count = parseInt(match[1], 10);
      const name = match[2].trim();
      const set = match[3] ? match[3].toUpperCase() : undefined;
      const number = match[4] || undefined;

      const imageUrl = set && number
        ? resolveCardImageUrl(set, number)
        : CARD_BACK_URL;

      cards.push({ name, count, set, number, type: currentCategory, imageUrl });
    } else {
      const simpleMatch = line.match(/^(\d+)\s+(.+)$/);
      if (simpleMatch) {
        cards.push({
          name: simpleMatch[2].trim(),
          count: parseInt(simpleMatch[1], 10),
          type: currentCategory,
          imageUrl: CARD_BACK_URL,
        });
      }
    }
  }

  return jsonResponse(cards);
}

// ----------------------------------------------------------------------------
// 4. INTERCEPTOR DE FETCH CLIENT-SIDE
// ----------------------------------------------------------------------------

let _installed = false;

async function handleLocalApi(url: string, init?: RequestInit): Promise<Response> {
  const u = new URL(url, 'http://local');
  const path = u.pathname;
  const method = (init?.method || 'GET').toUpperCase();

  try {
    if (/\/api\/health\/?$/.test(path)) return jsonResponse({ status: 'ok' });
    if (/\/api\/pokemon\/meta\/?$/.test(path)) return handleMeta();
    if (/\/api\/pokemon\/sets\/?$/.test(path)) return handleSets();
    if (/\/api\/pokemon\/search\/?$/.test(path)) return handleSearch(u.searchParams);
    if (/\/api\/pokemon\/parse-deck\/?$/.test(path) && method === 'POST') {
      let bodyText = '';
      try {
        const parsed = init?.body ? JSON.parse(String(init.body)) : {};
        bodyText = parsed.deckText || '';
      } catch { /* ignora */ }
      return handleParseDeck(bodyText);
    }
    return jsonResponse({ error: 'Endpoint não suportado', path }, 404);
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
}

export function installPokemonApiInterceptor(): void {
  if (typeof window === 'undefined') return;
  if (_installed) return;

  try {
    const originalFetch = window.fetch ? window.fetch.bind(window) : fetch.bind(globalThis);
    const staticDeployment = isStaticDeployment();

    const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let url = '';
      if (typeof input === 'string') url = input;
      else if (input instanceof URL) url = input.toString();
      else if (input && typeof input === 'object' && 'url' in input) url = (input as Request).url;

      if (/\/api\/pokemon\//.test(url) || /\/api\/health/.test(url)) {
        // Se já sabemos que é ambiente estático (como GitHub Pages), atende diretamente sem atraso de 404
        if (staticDeployment) {
          return handleLocalApi(url, init);
        }

        // Tenta o servidor real primeiro se acessível
        try {
          const resp = await originalFetch(input, init);
          if (resp && resp.ok) {
            return resp;
          }
        } catch {
          // Servidor indisponível ou ambiente estático
        }
        return handleLocalApi(url, init);
      }

      return originalFetch(input, init);
    };

    let overridden = false;

    // 1. Tentar Object.defineProperty no window
    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
      });
      overridden = true;
    } catch {
      // Ignora erro se protegido
    }

    // 2. Se não conseguiu, tentar no Window.prototype
    if (!overridden && typeof Window !== 'undefined' && Window.prototype) {
      try {
        Object.defineProperty(Window.prototype, 'fetch', {
          value: customFetch,
          writable: true,
          configurable: true,
        });
        overridden = true;
      } catch {
        // Ignora erro
      }
    }

    // 3. Tentar globalThis como fallback
    if (!overridden && typeof globalThis !== 'undefined') {
      try {
        (globalThis as any).fetch = customFetch;
        overridden = true;
      } catch {
        // Ignora erro
      }
    }

    _installed = true;
    if (overridden) {
      console.info('[pokemonLocalApi] Interceptor client-side instalado com sucesso (suporte total GitHub Pages).');
    }
  } catch (err) {
    console.warn('[pokemonLocalApi] Falha suave ao registrar interceptor:', err);
  }
}
