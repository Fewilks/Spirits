import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

// Helper to check and initialize Gemini
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

import { fallbackMetaDecks } from './src/data/fallbackDecks';

const app = express();
const PORT = 3000;

app.use(express.json());

// 1. Meta Decks list (simulating Limitless TCG live meta)
const metaDecks = fallbackMetaDecks;

// 2. Default iconic cards database to fallback on when external APIs fail
const fallbackCards = [
  { id: 'sv3-125', name: 'Charizard ex', imageUrl: 'https://images.pokemontcg.io/sv3/125.png', setCode: 'sv3', setName: 'Obsidian Flames', setNumber: '125' },
  { id: 'sv1-81', name: 'Miraidon ex', imageUrl: 'https://images.pokemontcg.io/sv1/81.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '81' },
  { id: 'sv1-86', name: 'Gardevoir ex', imageUrl: 'https://images.pokemontcg.io/sv1/86.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '86' },
  { id: 'sv4-163', name: 'Roaring Moon ex', imageUrl: 'https://images.pokemontcg.io/sv4/163.png', setCode: 'sv4', setName: 'Paradox Rift', setNumber: '163' },
  { id: 'sv3-135', name: 'Pidgeot ex', imageUrl: 'https://images.pokemontcg.io/sv3/135.png', setCode: 'sv3', setName: 'Obsidian Flames', setNumber: '135' },
  { id: 'sv5-157', name: 'Prime Catcher', imageUrl: 'https://images.pokemontcg.io/sv5/157.png', setCode: 'sv5', setName: 'Temporal Forces', setNumber: '157' },
  { id: 'pgo-55', name: 'Snorlax', imageUrl: 'https://images.pokemontcg.io/pgo/55.png', setCode: 'pgo', setName: 'Pokémon GO', setNumber: '55' },
  { id: 'sv3-124', name: 'Charmeleon', imageUrl: 'https://images.pokemontcg.io/sv3/124.png', setCode: 'sv3', setName: 'Obsidian Flames', setNumber: '124' },
  { id: 'sv3-26', name: 'Charmander', imageUrl: 'https://images.pokemontcg.io/sv3/26.png', setCode: 'sv3', setName: 'Obsidian Flames', setNumber: '26' },
  { id: 'sv3-207', name: 'Pidgey', imageUrl: 'https://images.pokemontcg.io/sv3/207.png', setCode: 'sv3', setName: 'Obsidian Flames', setNumber: '207' },
  { id: 'sv45-80', name: 'Iono', imageUrl: 'https://images.pokemontcg.io/sv45/80.png', setCode: 'sv45', setName: 'Paldean Fates', setNumber: '80' },
  { id: 'sv1-166', name: 'Arven', imageUrl: 'https://images.pokemontcg.io/sv1/166.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '166' },
  { id: 'sv1-172', name: 'Boss\'s Orders', imageUrl: 'https://images.pokemontcg.io/sv1/172.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '172' },
  { id: 'sv1-196', name: 'Ultra Ball', imageUrl: 'https://images.pokemontcg.io/sv1/196.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '196' },
  { id: 'sv1-191', name: 'Rare Candy', imageUrl: 'https://images.pokemontcg.io/sv1/191.png', setCode: 'sv1', setName: 'Scarlet & Violet Base Set', setNumber: '191' },
  { id: 'sv6-123', name: 'Raging Bolt ex', imageUrl: 'https://images.pokemontcg.io/sv6/123.png', setCode: 'sv6', setName: 'Twilight Masquerade', setNumber: '123' },
  { id: 'sv6-25', name: 'Teal Mask Ogerpon ex', imageUrl: 'https://images.pokemontcg.io/sv6/25.png', setCode: 'sv6', setName: 'Twilight Masquerade', setNumber: '25' },
  { id: 'sv4-170', name: 'Professor Sada\'s Vitality', imageUrl: 'https://images.pokemontcg.io/sv4/170.png', setCode: 'sv4', setName: 'Paradox Rift', setNumber: '170' },
  { id: 'sv4-163-item', name: 'Earthen Vessel', imageUrl: 'https://images.pokemontcg.io/sv4/163.png', setCode: 'sv4', setName: 'Paradox Rift', setNumber: '163' },
  { id: 'sit-139', name: 'Lugia VSTAR', imageUrl: 'https://images.pokemontcg.io/sit/139.png', setCode: 'sit', setName: 'Silver Tempest', setNumber: '139' },
  { id: 'sit-147', name: 'Archeops', imageUrl: 'https://images.pokemontcg.io/sit/147.png', setCode: 'sit', setName: 'Silver Tempest', setNumber: '147' },
  { id: 'sv5-137', name: 'Cinccino', imageUrl: 'https://images.pokemontcg.io/sv5/137.png', setCode: 'sv5', setName: 'Temporal Forces', setNumber: '137' }
];

// Helper to look up an image link or search pokemontcg.io
async function findCardInTcgio(name: string, set?: string, number?: string): Promise<{ id: string; name: string; imageUrl: string; setCode: string; setName: string; setNumber: string } | null> {
  try {
    let queryStr = `name:"${name}"`;
    if (set && set.length > 1) {
      queryStr += ` set.id:${set.toLowerCase()}`;
    }
    if (number) {
      queryStr += ` number:${number}`;
    }

    const encodedQuery = encodeURIComponent(queryStr);
    const url = `https://api.pokemontcg.io/v2/cards?q=${encodedQuery}&pageSize=1`;
    console.log('Querying Pokemontcg.io:', url);

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const card = data.data[0];
        return {
          id: card.id,
          name: card.name,
          imageUrl: card.images.small || card.images.large,
          setCode: card.set.id,
          setName: card.set.name,
          setNumber: card.number
        };
      }
    }
  } catch (err) {
    console.error('Error fetching card from pokemontcg.io:', err);
  }
  return null;
}

// Dynamic scraper to fetch the latest Pokemon TCG metagame standings from Limitless TCG
async function fetchMetaFromLimitless(): Promise<any[]> {
  try {
    const response = await fetch('https://limitlesstcg.com/decks', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Limitless responded with ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const parsedDecks: any[] = [];

    // Limitless TCG decks page has tables, usually table.striped, table.decks or similar
    // Let's loop through table rows
    $('table tr').each((i, rowElem) => {
      const row = $(rowElem);
      
      // Look for a link like <a href="/decks/13">Charizard ex</a> or <a href="/decks/details/pikachu-ex">Pikachu ex</a>
      const deckLink = row.find('a[href*="/decks/"]').first();
      if (!deckLink.length) return;

      const href = deckLink.attr('href') || '';
      
      // Filter out utility links
      if (
        href.includes('/completed') || 
        href.includes('/history') || 
        href.includes('/about') || 
        href.includes('/cards') || 
        href.includes('/types') ||
        href.includes('/setup') ||
        href.includes('/register')
      ) {
        return;
      }

      const deckName = deckLink.text().trim();
      if (!deckName || ['Decks', 'Tournaments', 'Cards', 'Stats', 'About', 'Contact', 'Home', 'Log In', 'Register'].includes(deckName)) {
        return;
      }

      // Extract all numbers with % sign in the row cells
      const percentages: number[] = [];
      row.find('td').each((j, tdElem) => {
        const tdText = $(tdElem).text().trim();
        const match = tdText.match(/(\d+(?:\.\d+)?)\s*%/);
        if (match) {
          percentages.push(parseFloat(match[1]));
        }
      });

      const share = percentages[0] || 0;
      const winRate = percentages[1] || 50.0;

      // Extract image if present
      let imgUrl = '';
      const imgElem = row.find('img').first();
      if (imgElem.length) {
        imgUrl = imgElem.attr('src') || '';
        if (imgUrl && !imgUrl.startsWith('http')) {
          imgUrl = 'https://limitlesstcg.com' + imgUrl;
        }
      }

      // Check if we already have this deck to prevent duplicates
      if (parsedDecks.some(d => d.name === deckName)) {
        return;
      }

      parsedDecks.push({
        name: deckName,
        share,
        winRate,
        imageUrl: imgUrl || undefined,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    });

    console.log('Successfully scraped decks from Limitless TCG. Count:', parsedDecks.length);
    return parsedDecks;
  } catch (err) {
    console.error('Failed to scrape Limitless TCG live meta using cheerio:', err);
    return [];
  }
}

// REST APIs
function mapSetCodeToTcgIo(set: string): string {
  const s = (set || '').toLowerCase();
  const maps: Record<string, string> = {
    ssp: 'sv8',
    scr: 'sv7',
    sfa: 'sv6a',
    twm: 'sv6',
    tef: 'sv5',
    saf: 'sv5a',
    paf: 'sv4a',
    par: 'sv4',
    obf: 'sv3',
    sv1: 'sv1',
    sv2: 'sv2',
    sv3: 'sv3',
    sv4: 'sv4',
    sv5: 'sv5',
    sv6: 'sv6',
    sv7: 'sv7',
    sv8: 'sv8',
    sit: 'sit',
    lor: 'lor',
    pgo: 'pgo',
    asr: 'asr',
    brs: 'brs',
    fus: 'fus',
    cel: 'cel',
    cre: 'cre',
    bst: 'bst',
    shf: 'shf',
    viv: 'viv',
    daa: 'daa',
    rca: 'rca',
    ssh: 'ssh'
  };
  return maps[s] || s;
}

function formatLimitlessDecklist(decklist: any): string {
  let listStr = '';
  
  if (decklist.pokemon && decklist.pokemon.length > 0) {
    const total = decklist.pokemon.reduce((acc: number, p: any) => acc + (p.count || 0), 0);
    listStr += `Pokémon: ${total}\n`;
    decklist.pokemon.forEach((p: any) => {
      listStr += `${p.count} ${p.name} ${p.set || ''} ${p.number || ''}\n`.trim() + '\n';
    });
    listStr += '\n';
  }
  
  if (decklist.trainer && decklist.trainer.length > 0) {
    const total = decklist.trainer.reduce((acc: number, p: any) => acc + (p.count || 0), 0);
    listStr += `Trainer: ${total}\n`;
    decklist.trainer.forEach((t: any) => {
      listStr += `${t.count} ${t.name} ${t.set || ''} ${t.number || ''}\n`.trim() + '\n';
    });
    listStr += '\n';
  }
  
  if (decklist.energy && decklist.energy.length > 0) {
    const total = decklist.energy.reduce((acc: number, p: any) => acc + (p.count || 0), 0);
    listStr += `Energy: ${total}\n`;
    decklist.energy.forEach((e: any) => {
      listStr += `${e.count} ${e.name} ${e.set || ''} ${e.number || ''}\n`.trim() + '\n';
    });
  }
  
  return listStr.trim();
}

app.get('/api/pokemon/meta', async (req, res) => {
  try {
    const scraped = await fetchMetaFromLimitless();
    if (scraped && scraped.length > 0) {
      // Enrich the scraped decks with cards, descriptions, and high-quality images from our fallback list or API
      const enrichedDecks = [];
      for (const deck of scraped) {
        // Find if we have a matching fallback deck to copy descriptions/lists
        const matchedFallback = fallbackMetaDecks.find(
          fd => fd.name.toLowerCase() === deck.name.toLowerCase() || 
                deck.name.toLowerCase().includes(fd.name.toLowerCase()) ||
                fd.name.toLowerCase().includes(deck.name.toLowerCase())
        );

        let imageUrl = deck.imageUrl;
        if (!imageUrl && matchedFallback) {
          imageUrl = matchedFallback.imageUrl;
        }

        // If still no image, let's search pokemontcg.io for a high-res image of the main Pokemon!
        if (!imageUrl) {
          const tcgioCard = await findCardInTcgio(deck.name);
          if (tcgioCard) {
            imageUrl = tcgioCard.imageUrl;
          }
        }

        enrichedDecks.push({
          name: deck.name,
          archetype: matchedFallback ? matchedFallback.archetype : `${deck.name} (H-On Standard)`,
          share: deck.share,
          winRate: deck.winRate,
          imageUrl: imageUrl || 'https://images.pokemontcg.io/sv1/81.png', // fallback
          updatedAt: deck.updatedAt || new Date().toISOString().split('T')[0],
          description: matchedFallback ? matchedFallback.description : `Um deck competitivo destacado no metagame do Limitless TCG, focado em ${deck.name}. O formato padrão atual utiliza o bloco H-on.`,
          cards: matchedFallback ? matchedFallback.cards : [
            { name: `${deck.name}`, count: 4 }
          ],
          rawList: matchedFallback ? matchedFallback.rawList : `Pokémon: 4\n4 ${deck.name}\n\nTrainer: 0\n\nEnergy: 0`
        });
      }

      return res.json({
        decks: enrichedDecks,
        tournamentName: 'Standard Metagame (Limitless TCG Live Scraping)'
      });
    }
  } catch (err) {
    console.error('Error in live meta api route:', err);
  }

  // Fallback to local decks if scrape fails or returns empty
  return res.json({
    decks: fallbackMetaDecks,
    tournamentName: 'Standard Metagame (Local Fallback)'
  });
});

// Search Pokémon cards via pokemontcg.io with local fallbacks and pagination support
app.get('/api/pokemon/search', async (req, res) => {
  const queryParam = (req.query.q as string) || '';
  const setParam = (req.query.set as string) || '';
  const pageParam = parseInt(req.query.page as string || '1', 10);
  const pageSizeParam = parseInt(req.query.pageSize as string || '60', 10);

  try {
    let qString = '';
    if (queryParam) {
      qString += `name:"*${queryParam}*"`;
    }
    if (setParam) {
      if (qString) qString += ' ';
      qString += `set.id:${setParam}`;
    }

    console.log(`Searching cards for: q="${queryParam}" set="${setParam}" page=${pageParam} pageSize=${pageSizeParam}`);
    const encodedQuery = encodeURIComponent(qString);
    const url = qString 
      ? `https://api.pokemontcg.io/v2/cards?q=${encodedQuery}&page=${pageParam}&pageSize=${pageSizeParam}&orderBy=name`
      : `https://api.pokemontcg.io/v2/cards?page=${pageParam}&pageSize=${pageSizeParam}&orderBy=name`;

    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      return res.json({
        data: data.data || [],
        totalCount: data.totalCount || 0
      });
    }
  } catch (error) {
    console.error('External API failed, falling back to local list:', error);
  }

  // Local fallback search (matches only on name if q is specified)
  let matched = fallbackCards;
  if (queryParam) {
    const lowerQuery = queryParam.toLowerCase();
    matched = fallbackCards.filter(c => c.name.toLowerCase().includes(lowerQuery));
  }
  if (setParam) {
    matched = matched.filter(c => c.setCode === setParam);
  }

  const start = (pageParam - 1) * pageSizeParam;
  const end = start + pageSizeParam;
  const paginated = matched.slice(start, end);

  // Format fallbacks to look like pokemontcg.io response format
  const formatted = paginated.map(card => ({
    id: card.id,
    name: card.name,
    images: { small: card.imageUrl, large: card.imageUrl },
    set: { id: card.setCode, name: card.setName },
    number: card.setNumber
  }));

  res.json({
    data: formatted,
    totalCount: matched.length
  });
});

// Fetch all available Pokémon TCG sets
app.get('/api/pokemon/sets', async (req, res) => {
  try {
    const response = await fetch('https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate');
    if (response.ok) {
      const data = await response.json();
      
      // Filter for competitive format: Scarlet & Violet series or release date >= 2023-03-31
      const formatted = data.data
        .filter((s: any) => s.releaseDate >= '2023-03-31' || s.series === 'Scarlet & Violet')
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          series: s.series,
          releaseDate: s.releaseDate,
          logo: s.images.logo,
          symbol: s.images.symbol
        }));
      return res.json(formatted);
    }
  } catch (err) {
    console.error('Error fetching sets from pokemontcg.io:', err);
  }
  // Return robust, modern fallbacks if it fails (Scarlet & Violet standard sets)
  res.json([
    { id: 'pre', name: 'Prismatic Evolutions', series: 'Scarlet & Violet', releaseDate: '2025-01-17' },
    { id: 'ssp', name: 'Surging Sparks', series: 'Scarlet & Violet', releaseDate: '2024-11-08' },
    { id: 'scr', name: 'Stellar Crown', series: 'Scarlet & Violet', releaseDate: '2024-09-13' },
    { id: 'sfa', name: 'Shrouded Fable', series: 'Scarlet & Violet', releaseDate: '2024-08-02' },
    { id: 'sv6', name: 'Twilight Masquerade', series: 'Scarlet & Violet', releaseDate: '2024-05-24' },
    { id: 'sv5', name: 'Temporal Forces', series: 'Scarlet & Violet', releaseDate: '2024-03-22' },
    { id: 'sv45', name: 'Paldean Fates', series: 'Scarlet & Violet', releaseDate: '2024-01-26' },
    { id: 'sv4', name: 'Paradox Rift', series: 'Scarlet & Violet', releaseDate: '2023-11-03' },
    { id: 'sv3', name: 'Obsidian Flames', series: 'Scarlet & Violet', releaseDate: '2023-08-11' },
    { id: 'sv2', name: 'Paldea Evolved', series: 'Scarlet & Violet', releaseDate: '2023-06-09' },
    { id: 'sv1', name: 'Scarlet & Violet', series: 'Scarlet & Violet', releaseDate: '2023-03-31' }
  ]);
});

// Parse TCG Live / Limitless text lists using Gemini (with advanced Regex fallback)
app.post('/api/pokemon/parse-deck', async (req, res) => {
  const { deckText } = req.body;
  if (!deckText || typeof deckText !== 'string' || deckText.trim().length === 0) {
    return res.status(400).json({ error: 'Falta o texto da lista do deck' });
  }

  console.log('Parsing decklist. Text length:', deckText.length);

  // Attempt Gemini parsing first
  const ai = getGeminiClient();
  if (ai) {
    try {
      console.log('Using Gemini 3.5 Flash for list parsing');
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Analise a seguinte lista de deck exportada do Pokémon TCG Live ou Limitless. Identifique cada carta, sua quantidade, abreviação do set/coleção, número da carta e categorize-a estritamente como 'Pokémon', 'Treinador' ou 'Energia'.
        
Aqui está o texto do deck:
"""
${deckText}
"""`,
        config: {
          systemInstruction: 'Você é um analisador especialista em Pokémon TCG. Extraia a lista de cartas do deck em formato JSON puro. Classifique os itens em português: "Pokémon", "Treinador" ou "Energia". Mapeie os nomes das coleções para seus códigos padrão de 3 ou 4 letras (ex: OBF, TEF, PAF, SVI, SVE, BRS). Retorne APENAS um array JSON válido.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'Nome em inglês ou português da carta (ex: "Charizard ex" ou "Charmander")' },
                count: { type: Type.INTEGER, description: 'Quantidade desta carta' },
                set: { type: Type.STRING, description: 'Código do set (ex: OBF, SVI)' },
                number: { type: Type.STRING, description: 'Número da carta no set' },
                type: { type: Type.STRING, description: 'Categoria: "Pokémon", "Treinador" ou "Energia"' }
              },
              required: ['name', 'count', 'type']
            }
          }
        }
      });

      const parsedJson = JSON.parse(response.text.trim());
      console.log('Gemini parsed success. Count of cards:', parsedJson.length);

      // Supplement images
      const supplemented = [];
      for (const card of parsedJson) {
        // Try looking up in fallback cards
        const localCard = fallbackCards.find(c => c.name.toLowerCase() === card.name.toLowerCase());
        let imageUrl = localCard ? localCard.imageUrl : `https://images.pokemontcg.io/${card.set ? card.set.toLowerCase() : 'sv1'}/${card.number || '1'}.png`;
        
        // Let's do a quick lazy fetch from tcgio for Pokémons to get high-quality images
        if (card.type === 'Pokémon' && !localCard) {
          const tcgioCard = await findCardInTcgio(card.name, card.set, card.number);
          if (tcgioCard) {
            imageUrl = tcgioCard.imageUrl;
          }
        }

        supplemented.push({
          ...card,
          imageUrl
        });
      }

      return res.json(supplemented);
    } catch (err) {
      console.error('Gemini parsing failed, switching to regex parser:', err);
    }
  }

  // Regex Fallback Parser (Very comprehensive, handles EN and PT formats)
  try {
    console.log('Using Regex parser');
    const lines = deckText.split('\n');
    const cards: any[] = [];
    let currentCategory: 'Pokémon' | 'Treinador' | 'Energia' = 'Pokémon';

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('pokémon:') || lowerLine.startsWith('pokemon:')) {
        currentCategory = 'Pokémon';
        continue;
      }
      if (lowerLine.startsWith('treinador:') || lowerLine.startsWith('trainer:') || lowerLine.startsWith('trainers:')) {
        currentCategory = 'Treinador';
        continue;
      }
      if (lowerLine.startsWith('energia:') || lowerLine.startsWith('energy:')) {
        currentCategory = 'Energia';
        continue;
      }

      // Pattern: "3 Charizard ex OBF 125" or "4 Ultra Ball SVI 196" or "1 Prime Catcher TEF 157"
      // Also match without set/number: "3 Charmander"
      const match = line.match(/^(\d+)\s+(.+?)(?:\s+([A-Z]{3,4}|[a-z]{3,4})\s+(\d+))?$/);
      if (match) {
        const count = parseInt(match[1], 10);
        let name = match[2].trim();
        const set = match[3] ? match[3].toUpperCase() : undefined;
        const number = match[4] || undefined;

        // Strip any trailing type tags (like "ex", "VSTAR", "V")
        let cleanName = name;

        // Try mapping to fallback
        const localCard = fallbackCards.find(c => c.name.toLowerCase().includes(cleanName.toLowerCase()));
        const imageUrl = localCard ? localCard.imageUrl : `https://images.pokemontcg.io/${set ? set.toLowerCase() : 'sv1'}/${number || '1'}.png`;

        cards.push({
          name: cleanName,
          count,
          set,
          number,
          type: currentCategory,
          imageUrl
        });
      } else {
        // Try simple line match like "6 Basic Fire Energy" or "4 Iono"
        const simpleMatch = line.match(/^(\d+)\s+(.+)$/);
        if (simpleMatch) {
          const count = parseInt(simpleMatch[1], 10);
          const name = simpleMatch[2].trim();
          cards.push({
            name,
            count,
            type: currentCategory,
            imageUrl: 'https://images.pokemontcg.io/sv1/166.png' // default fallback
          });
        }
      }
    }

    res.json(cards);
  } catch (error) {
    console.error('Regex parser failed:', error);
    res.status(500).json({ error: 'Erro ao processar lista do deck' });
  }
});

// Start server
async function start() {
  console.log('--- Spirits TCG Server Starting ---');
  console.log(`NODE_ENV: "${process.env.NODE_ENV}"`);
  console.log(`Cwd: "${process.cwd()}"`);

  // Request logger middleware
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });

  // Vite Dev integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('Using Vite Dev Middleware mode');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Using Production Static Serving mode');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Spirits TCG Portal server running on port ${PORT}`);
  });
}

start();
