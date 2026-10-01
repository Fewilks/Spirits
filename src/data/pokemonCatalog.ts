import { getTCGdexImageUrl, getAuthenticCardImageUrl, normalizeTPCiSetCode, registerCollectionCards } from '../utils/cardImages';
import { SET_SYNC_TABLE, SetSyncEntry } from '../utils/setSync';

export interface PokemonSet {
  id: string;          // Official PTCGL uppercase 3-4 letter code (e.g. "TWM", "OBF", "SSP", "ASC", "CRZ", "SIT")
  ptcglCode: string;   // Official PTCGL uppercase code
  localId?: string;    // Secondary / pokemontcg.io identifier (e.g. "sv6", "sv3", "swsh12pt5")
  name: string;
  series: string;
  releaseDate?: string;
  logo?: string;
  symbol?: string;
  era?: string;
  regulationMark?: string;
}

export interface CatalogCard {
  id: string;          // e.g. "TWM-130", "OBF-125"
  name: string;
  imageUrl: string;
  setCode: string;     // PTCGL set code (e.g. "TWM", "OBF")
  setName: string;
  setNumber: string;
  tpciCode?: string;   // e.g. "TWM 130"
  tpciSetCode?: string;// e.g. "TWM"
  localSetId?: string; // e.g. "sv6"
}

function getEraSeriesLabel(era: string): string {
  switch (era) {
    case 'anniv': return 'Celebrações de 30 Anos';
    case 'me': return 'Mega Evolution (2025-2026)';
    case 'sv': return 'Scarlet & Violet (2023-2025)';
    case 'swsh': return 'Sword & Shield (2020-2023)';
    case 'sm': return 'Sun & Moon (2017-2019)';
    case 'xy': return 'XY (2014-2016)';
    case 'bw': return 'Black & White (2011-2013)';
    case 'hgss': return 'HeartGold & SoulSilver';
    case 'col': return 'Call of Legends';
    case 'dp': return 'Diamond & Pearl';
    case 'ex': return 'EX Series';
    case 'base': return 'Classic / Base';
    case 'tcgp': return 'Pokémon TCG Pocket';
    default: return 'Outras Coleções';
  }
}

const ERA_ORDER: Record<string, number> = {
  'anniv': 1,
  'me': 2,
  'sv': 3,
  'swsh': 4,
  'sm': 5,
  'xy': 6,
  'bw': 7,
  'col': 8,
  'hgss': 9,
  'dp': 10,
  'ex': 11,
  'base': 12,
  'tcgp': 13
};

// Master list of ALL Pokémon TCG collections using PTCGL official codes as primary
export const COMPREHENSIVE_SETS: PokemonSet[] = [...SET_SYNC_TABLE]
  .sort((a, b) => (ERA_ORDER[a.era] || 99) - (ERA_ORDER[b.era] || 99))
  .map((e: SetSyncEntry) => {
    const formattedName = e.namePt && e.namePt !== e.name
      ? `${e.namePt} (${e.name} - ${e.tpci})`
      : `${e.name} (${e.tpci})`;
    return {
      id: e.tpci,
      ptcglCode: e.tpci,
      localId: e.ptcgIo || e.tcgdexSet || e.tpci.toLowerCase(),
      name: formattedName,
      series: getEraSeriesLabel(e.era),
      era: e.era,
      regulationMark: e.regulationMark,
      logo: e.tcgdexSeries && e.tcgdexSet ? `https://assets.tcgdex.net/en/${e.tcgdexSeries}/${e.tcgdexSet}/logo` : undefined,
      symbol: e.tcgdexSeries && e.tcgdexSet ? `https://assets.tcgdex.net/univ/${e.tcgdexSeries}/${e.tcgdexSet}/symbol` : undefined
    };
  });

// Dynamic lookup maps based on SET_SYNC_TABLE
export const TPCI_TO_LOCAL_SET_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const e of SET_SYNC_TABLE) {
    map[e.tpci.toUpperCase()] = e.ptcgIo || e.tcgdexSet || e.tpci.toLowerCase();
    if (e.tcgdexSet) map[e.tcgdexSet.toUpperCase()] = e.ptcgIo || e.tcgdexSet;
  }
  return map;
})();

export const LOCAL_TO_TPCI_SET_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const e of SET_SYNC_TABLE) {
    map[e.tpci.toLowerCase()] = e.tpci;
    if (e.ptcgIo) map[e.ptcgIo.toLowerCase()] = e.tpci;
    if (e.tcgdexSet) map[e.tcgdexSet.toLowerCase()] = e.tpci;
  }
  // Extra common aliases
  map['pre'] = 'PRE';
  map['sv8pt5'] = 'PRE';
  map['sv08.5'] = 'PRE';
  map['jtg'] = 'JTG';
  map['sv09'] = 'JTG';
  map['sv9'] = 'JTG';
  map['dri'] = 'DRI';
  map['sv10'] = 'DRI';
  map['blk'] = 'BLK';
  map['sv10.5b'] = 'BLK';
  map['wht'] = 'WHT';
  map['sv10.5w'] = 'WHT';
  map['ssp'] = 'SSP';
  map['sv08'] = 'SSP';
  map['scr'] = 'SCR';
  map['sv07'] = 'SCR';
  map['sfa'] = 'SFA';
  map['sv06.5'] = 'SFA';
  map['twm'] = 'TWM';
  map['sv06'] = 'TWM';
  map['tef'] = 'TEF';
  map['sv05'] = 'TEF';
  map['paf'] = 'PAF';
  map['sv04.5'] = 'PAF';
  map['par'] = 'PAR';
  map['sv04'] = 'PAR';
  map['mew'] = 'MEW';
  map['sv03.5'] = 'MEW';
  map['sv3pt5'] = 'MEW';
  map['obf'] = 'OBF';
  map['sv03'] = 'OBF';
  map['pal'] = 'PAL';
  map['sv02'] = 'PAL';
  map['svi'] = 'SVI';
  map['sv01'] = 'SVI';
  map['crz'] = 'CRZ';
  map['swsh12pt5'] = 'CRZ';
  map['swsh12.5'] = 'CRZ';
  map['sit'] = 'SIT';
  map['swsh12'] = 'SIT';
  map['lor'] = 'LOR';
  map['swsh11'] = 'LOR';
  map['asr'] = 'ASR';
  map['swsh10'] = 'ASR';
  map['brs'] = 'BRS';
  map['swsh09'] = 'BRS';
  map['swsh9'] = 'BRS';
  map['fst'] = 'FST';
  map['swsh08'] = 'FST';
  map['swsh8'] = 'FST';
  map['evs'] = 'EVS';
  map['swsh07'] = 'EVS';
  map['cre'] = 'CRE';
  map['swsh06'] = 'CRE';
  map['bst'] = 'BST';
  map['swsh05'] = 'BST';
  map['shf'] = 'SHF';
  map['swsh04.5'] = 'SHF';
  map['viv'] = 'VIV';
  map['swsh04'] = 'VIV';
  map['cpa'] = 'CPA';
  map['swsh03.5'] = 'CPA';
  map['daa'] = 'DAA';
  map['swsh03'] = 'DAA';
  map['rcl'] = 'RCL';
  map['swsh02'] = 'RCL';
  map['ssh'] = 'SSH';
  map['swsh01'] = 'SSH';
  map['cel'] = 'CEL';
  map['pgo'] = 'PGO';
  return map;
})();

// Comprehensive aliases for colloquial, Portuguese, and English queries
export const SET_QUERY_ALIASES: Record<string, string> = {
  // 30th Anniversary & Mega Evolution
  'celebracoes de 30 anos': '30TH',
  'celebrações de 30 anos': '30TH',
  'celebracoes 30 anos': '30TH',
  '30 anos': '30TH',
  '30th': '30TH',
  '30c': '30TH',
  '30th celebration': '30TH',
  'colecao classica de 30 anos': '30TH-C',
  'coleção clássica de 30 anos': '30TH-C',
  '30th-c': '30TH-C',
  'herois excelsor': 'ASC',
  'herois excelsos': 'ASC',
  'heróis excelsos': 'ASC',
  'herois': 'ASC',
  'ascended heroes': 'ASC',
  'asc': 'ASC',
  'fogo fantasmagorico': 'PFL',
  'fogo fantasmagórico': 'PFL',
  'fantasmagorico': 'PFL',
  'fantasmagórico': 'PFL',
  'phantasmal flames': 'PFL',
  'pfl': 'PFL',
  'ordem perfeita': 'POR',
  'perfect order': 'POR',
  'equilibrio perfeito': 'POR',
  'equilíbrio perfeito': 'POR',
  'por': 'POR',
  'mega evolucao': 'MEG',
  'mega evolução': 'MEG',
  'megaevolução': 'MEG',
  'megaevolucao': 'MEG',
  'mega evolution': 'MEG',
  'meg': 'MEG',
  'caos ascendente': 'CRI',
  'chaos rising': 'CRI',
  'cri': 'CRI',
  'escuridao total': 'PBL',
  'escuridão total': 'PBL',
  'escuridao absoluta': 'PBL',
  'pitch black': 'PBL',
  'pbl': 'PBL',

  // Scarlet & Violet (2023-2025)
  'evolucoes prismaticas': 'PRE',
  'evoluções prismáticas': 'PRE',
  'prismatic evolutions': 'PRE',
  'pre': 'PRE',
  'jornada em conjunto': 'JTG',
  'amigos de jornada': 'JTG',
  'amigos de jornado': 'JTG',
  'amigos jornada': 'JTG',
  'journey together': 'JTG',
  'jtg': 'JTG',
  'rivais destinados': 'DRI',
  'rivais predestinados': 'DRI',
  'rivais predestinado': 'DRI',
  'destined rivals': 'DRI',
  'dri': 'DRI',
  'raio negro': 'BLK',
  'raio preto': 'BLK',
  'black bolt': 'BLK',
  'blk': 'BLK',
  'fogo branco': 'WHT',
  'chama branca': 'WHT',
  'white flare': 'WHT',
  'wht': 'WHT',
  'faiscas impetuosas': 'SSP',
  'faíscas impetuosas': 'SSP',
  'fagulhas impetuosas': 'SSP',
  'surging sparks': 'SSP',
  'ssp': 'SSP',
  'coroa estelar': 'SCR',
  'stellar crown': 'SCR',
  'scr': 'SCR',
  'fabulas nebulosas': 'SFA',
  'fábulas nebulosas': 'SFA',
  'shrouded fable': 'SFA',
  'sfa': 'SFA',
  'mascaras do crepusculo': 'TWM',
  'máscaras do crepúsculo': 'TWM',
  'twilight masquerade': 'TWM',
  'twm': 'TWM',
  'forcas temporais': 'TEF',
  'forças temporais': 'TEF',
  'temporal forces': 'TEF',
  'tef': 'TEF',
  'destinos de paldea': 'PAF',
  'paldean fates': 'PAF',
  'paf': 'PAF',
  'fenda paradoxal': 'PAR',
  'paradox rift': 'PAR',
  'par': 'PAR',
  '151': 'MEW',
  'pokemon 151': 'MEW',
  'mew': 'MEW',
  'obsidiana em chamas': 'OBF',
  'obsidian flames': 'OBF',
  'obf': 'OBF',
  'evolucoes em paldea': 'PAL',
  'evoluções em paldea': 'PAL',
  'paldea evolved': 'PAL',
  'pal': 'PAL',
  'escarlate e violeta': 'SVI',
  'scarlet and violet': 'SVI',
  'scarlet & violet': 'SVI',
  'svi': 'SVI',

  // Sword & Shield (2020-2023)
  'realeza absoluta': 'CRZ',
  'zenite real': 'CRZ',
  'crown zenith': 'CRZ',
  'crz': 'CRZ',
  'tempestade prateada': 'SIT',
  'silver tempest': 'SIT',
  'sit': 'SIT',
  'origem perdida': 'LOR',
  'lost origin': 'LOR',
  'lor': 'LOR',
  'pokemon go': 'PGO',
  'pokémon go': 'PGO',
  'pgo': 'PGO',
  'estrelas radiantes': 'ASR',
  'resplendor astral': 'ASR',
  'astral radiance': 'ASR',
  'asr': 'ASR',
  'astros cintilantes': 'BRS',
  'brilliant stars': 'BRS',
  'brs': 'BRS',
  'golpe fusao': 'FST',
  'golpe fusão': 'FST',
  'fusion strike': 'FST',
  'fst': 'FST',
  'celebracoes': 'CEL',
  'celebrações': 'CEL',
  'celebrations': 'CEL',
  'cel': 'CEL',
  'ceus em evolucao': 'EVS',
  'céus em evolução': 'EVS',
  'evolving skies': 'EVS',
  'evs': 'EVS',
  'reinado arrepiante': 'CRE',
  'chilling reign': 'CRE',
  'cre': 'CRE',
  'estilos de batalha': 'BST',
  'battle styles': 'BST',
  'bst': 'BST',
  'destinos brilhantes': 'SHF',
  'shining fates': 'SHF',
  'shf': 'SHF',
  'voltagem vivida': 'VIV',
  'voltagem vívida': 'VIV',
  'vivid voltage': 'VIV',
  'viv': 'VIV',
  'caminho do campeao': 'CPA',
  'caminho do campeão': 'CPA',
  "champion's path": 'CPA',
  'cpa': 'CPA',
  'escuridao incandescente': 'DAA',
  'escuridão incandescente': 'DAA',
  'darkness ablaze': 'DAA',
  'daa': 'DAA',
  'rixa rebelde': 'RCL',
  'golpe rebelde': 'RCL',
  'rebel clash': 'RCL',
  'rcl': 'RCL',
  'espada e escudo': 'SSH',
  'sword and shield': 'SSH',
  'sword & shield': 'SSH',
  'ssh': 'SSH',

  // Sun & Moon (2017-2019)
  'eclipse cosmico': 'CEC',
  'eclipse cósmico': 'CEC',
  'cosmic eclipse': 'CEC',
  'cec': 'CEC',
  'destinos ocultos': 'HIF',
  'hidden fates': 'HIF',
  'hif': 'HIF',
  'sintonia mental': 'UNM',
  'unified minds': 'UNM',
  'unm': 'UNM',
  'elos inquebraveis': 'UNB',
  'elos inquebráveis': 'UNB',
  'unbroken bonds': 'UNB',
  'unb': 'UNB',
  'uniao de aliados': 'TEU',
  'união de aliados': 'TEU',
  'team up': 'TEU',
  'teu': 'TEU',
  'trovoes perdidos': 'LOT',
  'trovões perdidos': 'LOT',
  'lost thunder': 'LOT',
  'lot': 'LOT',

  // XY
  'evolucoes': 'EVO',
  'evoluções': 'EVO',
  'evolutions': 'EVO',
  'evo': 'EVO',
  'cerco de vapor': 'STS',
  'steam siege': 'STS',
  'fusao de destinos': 'FCO',
  'fates collide': 'FCO',
  'geracoes': 'GEN',
  'geraçoes': 'GEN',
  'generations': 'GEN',
  'turbo colisao': 'BKP',
  'breakpoint': 'BKP',
  'turbo revolucao': 'BKT',
  'breakthrough': 'BKT',
  'origens ancestrais': 'AOR',
  'ancient origins': 'AOR',
  'ceus estrondosos': 'ROS',
  'roaring skies': 'ROS',
  'conflito primitivo': 'PRC',
  'primal clash': 'PRC',
  'forca fantasma': 'PHF',
  'phantom forces': 'PHF',
  'punhos furiosos': 'FFI',
  'furious fists': 'FFI',
  'flash de fogo': 'FLF',
  'flashfire': 'FLF',
  'xy': 'XY',
};

// Complete modern cards catalog using official PTCGL codes as primary and authentic TCGdex scans
export const MODERN_CARDS_CATALOG: CatalogCard[] = [
  // --- HERÓIS EXCELSOS (ASC - 2026) ---
  { id: 'ASC-085', name: 'Mega Lucario ex', imageUrl: getTCGdexImageUrl('ASC', '085'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '085', tpciCode: 'ASC 085', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-120', name: 'Mega Lucario ex (Ilustração Especial Rara)', imageUrl: getTCGdexImageUrl('ASC', '120'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '120', tpciCode: 'ASC 120', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-092', name: 'Mega Gardevoir ex', imageUrl: getTCGdexImageUrl('ASC', '092'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '092', tpciCode: 'ASC 092', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-068', name: 'Mega Greninja ex', imageUrl: getTCGdexImageUrl('ASC', '068'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '068', tpciCode: 'ASC 068', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-010', name: 'Mega Meganium ex', imageUrl: getTCGdexImageUrl('ASC', '010'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '010', tpciCode: 'ASC 010', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-024', name: 'Mega Feraligatr ex', imageUrl: getTCGdexImageUrl('ASC', '024'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '024', tpciCode: 'ASC 024', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-035', name: 'Mega Emboar ex', imageUrl: getTCGdexImageUrl('ASC', '035'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '035', tpciCode: 'ASC 035', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-101', name: 'Zygarde ex', imageUrl: getTCGdexImageUrl('ASC', '101'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '101', tpciCode: 'ASC 101', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-016', name: 'Budew', imageUrl: getTCGdexImageUrl('ASC', '016'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '016', tpciCode: 'ASC 016', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-039', name: 'Psyduck', imageUrl: getTCGdexImageUrl('ASC', '039'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '039', tpciCode: 'ASC 039', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-142', name: 'Fezandipiti ex', imageUrl: getTCGdexImageUrl('ASC', '142'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '142', tpciCode: 'ASC 142', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-181', name: 'Air Balloon', imageUrl: getTCGdexImageUrl('ASC', '181'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '181', tpciCode: 'ASC 181', tpciSetCode: 'ASC', localSetId: 'asc' },
  { id: 'ASC-196', name: 'Night Stretcher', imageUrl: getTCGdexImageUrl('ASC', '196'), setCode: 'ASC', setName: 'Heróis Excelsos (Ascended Heroes)', setNumber: '196', tpciCode: 'ASC 196', tpciSetCode: 'ASC', localSetId: 'asc' },

  // --- FOGO FANTASMAGÓRICO (PFL - 2025) ---
  { id: 'PFL-013', name: 'Mega Charizard X ex', imageUrl: getTCGdexImageUrl('PFL', '013'), setCode: 'PFL', setName: 'Fogo Fantasmagórico (Phantasmal Flames)', setNumber: '013', tpciCode: 'PFL 013', tpciSetCode: 'PFL', localSetId: 'pfl' },
  { id: 'PFL-130', name: 'Mega Charizard X ex (Ilustração Rara)', imageUrl: getTCGdexImageUrl('PFL', '130'), setCode: 'PFL', setName: 'Fogo Fantasmagórico (Phantasmal Flames)', setNumber: '130', tpciCode: 'PFL 130', tpciSetCode: 'PFL', localSetId: 'pfl' },
  { id: 'PFL-025', name: 'Mega Blaziken ex', imageUrl: getTCGdexImageUrl('PFL', '025'), setCode: 'PFL', setName: 'Fogo Fantasmagórico (Phantasmal Flames)', setNumber: '025', tpciCode: 'PFL 025', tpciSetCode: 'PFL', localSetId: 'pfl' },
  { id: 'PFL-038', name: 'Mega Camerupt ex', imageUrl: getTCGdexImageUrl('PFL', '038'), setCode: 'PFL', setName: 'Fogo Fantasmagórico (Phantasmal Flames)', setNumber: '038', tpciCode: 'PFL 038', tpciSetCode: 'PFL', localSetId: 'pfl' },
  { id: 'PFL-045', name: 'Mega Houndoom ex', imageUrl: getTCGdexImageUrl('PFL', '045'), setCode: 'PFL', setName: 'Fogo Fantasmagórico (Phantasmal Flames)', setNumber: '045', tpciCode: 'PFL 045', tpciSetCode: 'PFL', localSetId: 'pfl' },
  { id: 'PFL-052', name: 'Ceruledge ex', imageUrl: getTCGdexImageUrl('PFL', '052'), setCode: 'PFL', setName: 'Fogo Fantasmagórico (Phantasmal Flames)', setNumber: '052', tpciCode: 'PFL 052', tpciSetCode: 'PFL', localSetId: 'pfl' },
  { id: 'PFL-060', name: 'Chandelure ex', imageUrl: getTCGdexImageUrl('PFL', '060'), setCode: 'PFL', setName: 'Fogo Fantasmagórico (Phantasmal Flames)', setNumber: '060', tpciCode: 'PFL 060', tpciSetCode: 'PFL', localSetId: 'pfl' },
  { id: 'PFL-087', name: 'Dawn', imageUrl: getTCGdexImageUrl('PFL', '087'), setCode: 'PFL', setName: 'Fogo Fantasmagórico (Phantasmal Flames)', setNumber: '087', tpciCode: 'PFL 087', tpciSetCode: 'PFL', localSetId: 'pfl' },
  { id: 'PFL-091', name: 'Jumbo Ice Cream', imageUrl: getTCGdexImageUrl('PFL', '091'), setCode: 'PFL', setName: 'Fogo Fantasmagórico (Phantasmal Flames)', setNumber: '091', tpciCode: 'PFL 091', tpciSetCode: 'PFL', localSetId: 'pfl' },

  // --- ORDEM PERFEITA (POR - 2026) ---
  { id: 'POR-001', name: 'Mega Zygarde Forma Completa ex', imageUrl: getTCGdexImageUrl('POR', '001'), setCode: 'POR', setName: 'Ordem Perfeita (Perfect Order)', setNumber: '001', tpciCode: 'POR 001', tpciSetCode: 'POR', localSetId: 'por' },
  { id: 'POR-028', name: 'Mega Clefable ex', imageUrl: getTCGdexImageUrl('POR', '028'), setCode: 'POR', setName: 'Ordem Perfeita (Perfect Order)', setNumber: '028', tpciCode: 'POR 028', tpciSetCode: 'POR', localSetId: 'por' },
  { id: 'POR-042', name: 'Mega Starmie ex', imageUrl: getTCGdexImageUrl('POR', '042'), setCode: 'POR', setName: 'Ordem Perfeita (Perfect Order)', setNumber: '042', tpciCode: 'POR 042', tpciSetCode: 'POR', localSetId: 'por' },
  { id: 'POR-058', name: 'Mega Absol ex', imageUrl: getTCGdexImageUrl('POR', '058'), setCode: 'POR', setName: 'Ordem Perfeita (Perfect Order)', setNumber: '058', tpciCode: 'POR 058', tpciSetCode: 'POR', localSetId: 'por' },
  { id: 'POR-072', name: 'Mega Steelix ex', imageUrl: getTCGdexImageUrl('POR', '072'), setCode: 'POR', setName: 'Ordem Perfeita (Perfect Order)', setNumber: '072', tpciCode: 'POR 072', tpciSetCode: 'POR', localSetId: 'por' },
  { id: 'POR-089', name: 'Mega Metagross ex', imageUrl: getTCGdexImageUrl('POR', '089'), setCode: 'POR', setName: 'Ordem Perfeita (Perfect Order)', setNumber: '089', tpciCode: 'POR 089', tpciSetCode: 'POR', localSetId: 'por' },
  { id: 'POR-062', name: 'Meowth ex', imageUrl: getTCGdexImageUrl('POR', '062'), setCode: 'POR', setName: 'Ordem Perfeita (Perfect Order)', setNumber: '062', tpciCode: 'POR 062', tpciSetCode: 'POR', localSetId: 'por' },
  { id: 'POR-095', name: 'Xerneas ex', imageUrl: getTCGdexImageUrl('POR', '095'), setCode: 'POR', setName: 'Ordem Perfeita (Perfect Order)', setNumber: '095', tpciCode: 'POR 095', tpciSetCode: 'POR', localSetId: 'por' },
  { id: 'POR-104', name: 'Yveltal ex', imageUrl: getTCGdexImageUrl('POR', '104'), setCode: 'POR', setName: 'Ordem Perfeita (Perfect Order)', setNumber: '104', tpciCode: 'POR 104', tpciSetCode: 'POR', localSetId: 'por' },
  { id: 'POR-081', name: 'Poké Pad', imageUrl: getTCGdexImageUrl('POR', '081'), setCode: 'POR', setName: 'Ordem Perfeita (Perfect Order)', setNumber: '081', tpciCode: 'POR 081', tpciSetCode: 'POR', localSetId: 'por' },

  // --- MEGA EVOLUÇÃO BASE (MEG - 2025) ---
  { id: 'MEG-015', name: 'Mega Charizard Y ex', imageUrl: getTCGdexImageUrl('MEG', '015'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '015', tpciCode: 'MEG 015', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-002', name: 'Mega Venusaur ex', imageUrl: getTCGdexImageUrl('MEG', '002'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '002', tpciCode: 'MEG 002', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-031', name: 'Mega Blastoise ex', imageUrl: getTCGdexImageUrl('MEG', '031'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '031', tpciCode: 'MEG 031', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-049', name: 'Mega Gengar ex', imageUrl: getTCGdexImageUrl('MEG', '049'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '049', tpciCode: 'MEG 049', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-088', name: 'Mega Rayquaza ex', imageUrl: getTCGdexImageUrl('MEG', '088'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '088', tpciCode: 'MEG 088', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-099', name: 'Mega Mewtwo X ex', imageUrl: getTCGdexImageUrl('MEG', '099'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '099', tpciCode: 'MEG 099', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-100', name: 'Mega Mewtwo Y ex', imageUrl: getTCGdexImageUrl('MEG', '100'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '100', tpciCode: 'MEG 100', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-104', name: 'Mega Kangaskhan ex', imageUrl: getTCGdexImageUrl('MEG', '104'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '104', tpciCode: 'MEG 104', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-077', name: 'Mega Tyranitar ex', imageUrl: getTCGdexImageUrl('MEG', '077'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '077', tpciCode: 'MEG 077', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-065', name: 'Mega Scizor ex', imageUrl: getTCGdexImageUrl('MEG', '065'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '065', tpciCode: 'MEG 065', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-082', name: 'Mega Aerodactyl ex', imageUrl: getTCGdexImageUrl('MEG', '082'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '082', tpciCode: 'MEG 082', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-090', name: 'Mega Salamence ex', imageUrl: getTCGdexImageUrl('MEG', '090'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '090', tpciCode: 'MEG 090', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-084', name: 'Mega Lopunny ex', imageUrl: getTCGdexImageUrl('MEG', '084'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '084', tpciCode: 'MEG 084', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-080', name: 'Mega Gallade ex', imageUrl: getTCGdexImageUrl('MEG', '080'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '080', tpciCode: 'MEG 080', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-083', name: 'Mega Diancie ex', imageUrl: getTCGdexImageUrl('MEG', '083'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '083', tpciCode: 'MEG 083', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-091', name: 'Mega Latias ex', imageUrl: getTCGdexImageUrl('MEG', '091'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '091', tpciCode: 'MEG 091', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-092', name: 'Mega Latios ex', imageUrl: getTCGdexImageUrl('MEG', '092'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '092', tpciCode: 'MEG 092', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-054', name: 'Abra', imageUrl: getTCGdexImageUrl('MEG', '054'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '054', tpciCode: 'MEG 054', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-055', name: 'Kadabra', imageUrl: getTCGdexImageUrl('MEG', '055'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '055', tpciCode: 'MEG 055', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-056', name: 'Alakazam', imageUrl: getTCGdexImageUrl('MEG', '056'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '056', tpciCode: 'MEG 056', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-114', name: 'Boss\'s Orders', imageUrl: getTCGdexImageUrl('MEG', '114'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '114', tpciCode: 'MEG 114', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-119', name: 'Lillie\'s Determination', imageUrl: getTCGdexImageUrl('MEG', '119'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '119', tpciCode: 'MEG 119', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-125', name: 'Rare Candy', imageUrl: getTCGdexImageUrl('MEG', '125'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '125', tpciCode: 'MEG 125', tpciSetCode: 'MEG', localSetId: 'meg' },
  { id: 'MEG-131', name: 'Ultra Ball', imageUrl: getTCGdexImageUrl('MEG', '131'), setCode: 'MEG', setName: 'Mega Evolução (Mega Evolution)', setNumber: '131', tpciCode: 'MEG 131', tpciSetCode: 'MEG', localSetId: 'meg' },

  // --- CAOS ASCENDENTE & ESCURIDÃO TOTAL (CRI & PBL - 2026) ---
  { id: 'CRI-050', name: 'Mega Darkrai ex', imageUrl: getTCGdexImageUrl('CRI', '050'), setCode: 'CRI', setName: 'Caos Ascendente (Chaos Rising)', setNumber: '050', tpciCode: 'CRI 050', tpciSetCode: 'CRI', localSetId: 'cri' },
  { id: 'CRI-082', name: 'Special Red Card', imageUrl: getTCGdexImageUrl('CRI', '082'), setCode: 'CRI', setName: 'Caos Ascendente (Chaos Rising)', setNumber: '082', tpciCode: 'CRI 082', tpciSetCode: 'CRI', localSetId: 'cri' },
  { id: 'PBL-050', name: 'Mega Hydreigon ex', imageUrl: getTCGdexImageUrl('PBL', '050'), setCode: 'PBL', setName: 'Escuridão Total (Pitch Black)', setNumber: '050', tpciCode: 'PBL 050', tpciSetCode: 'PBL', localSetId: 'pbl' },

  // --- EVOLUÇÕES PRISMÁTICAS (PRE - 2025) ---
  { id: 'PRE-075', name: 'Eevee ex (Stellar)', imageUrl: getTCGdexImageUrl('PRE', '075'), setCode: 'PRE', setName: 'Evoluções Prismáticas (Prismatic Evolutions)', setNumber: '075', tpciCode: 'PRE 075', tpciSetCode: 'PRE', localSetId: 'sv8pt5' },
  { id: 'PRE-060', name: 'Umbreon ex', imageUrl: getTCGdexImageUrl('PRE', '060'), setCode: 'PRE', setName: 'Evoluções Prismáticas (Prismatic Evolutions)', setNumber: '060', tpciCode: 'PRE 060', tpciSetCode: 'PRE', localSetId: 'sv8pt5' },
  { id: 'PRE-042', name: 'Sylveon ex', imageUrl: getTCGdexImageUrl('PRE', '042'), setCode: 'PRE', setName: 'Evoluções Prismáticas (Prismatic Evolutions)', setNumber: '042', tpciCode: 'PRE 042', tpciSetCode: 'PRE', localSetId: 'sv8pt5' },
  { id: 'PRE-035', name: 'Espeon ex', imageUrl: getTCGdexImageUrl('PRE', '035'), setCode: 'PRE', setName: 'Evoluções Prismáticas (Prismatic Evolutions)', setNumber: '035', tpciCode: 'PRE 035', tpciSetCode: 'PRE', localSetId: 'sv8pt5' },
  { id: 'PRE-020', name: 'Vaporeon ex', imageUrl: getTCGdexImageUrl('PRE', '020'), setCode: 'PRE', setName: 'Evoluções Prismáticas (Prismatic Evolutions)', setNumber: '020', tpciCode: 'PRE 020', tpciSetCode: 'PRE', localSetId: 'sv8pt5' },
  { id: 'PRE-025', name: 'Jolteon ex', imageUrl: getTCGdexImageUrl('PRE', '025'), setCode: 'PRE', setName: 'Evoluções Prismáticas (Prismatic Evolutions)', setNumber: '025', tpciCode: 'PRE 025', tpciSetCode: 'PRE', localSetId: 'sv8pt5' },
  { id: 'PRE-015', name: 'Flareon ex', imageUrl: getTCGdexImageUrl('PRE', '015'), setCode: 'PRE', setName: 'Evoluções Prismáticas (Prismatic Evolutions)', setNumber: '015', tpciCode: 'PRE 015', tpciSetCode: 'PRE', localSetId: 'sv8pt5' },

  // --- JORNADA EM CONJUNTO & RIVAIS DESTINADOS (JTG & DRI - 2025) ---
  { id: 'JTG-010', name: 'Red\'s Pikachu ex', imageUrl: getTCGdexImageUrl('JTG', '010'), setCode: 'JTG', setName: 'Jornada em Conjunto (Journey Together)', setNumber: '010', tpciCode: 'JTG 010', tpciSetCode: 'JTG', localSetId: 'sv9' },
  { id: 'JTG-024', name: 'Blaziken ex', imageUrl: getTCGdexImageUrl('JTG', '024'), setCode: 'JTG', setName: 'Jornada em Conjunto (Journey Together)', setNumber: '024', tpciCode: 'JTG 024', tpciSetCode: 'JTG', localSetId: 'sv9' },
  { id: 'JTG-056', name: 'Lillie\'s Clefairy ex', imageUrl: getTCGdexImageUrl('JTG', '056'), setCode: 'JTG', setName: 'Jornada em Conjunto (Journey Together)', setNumber: '056', tpciCode: 'JTG 056', tpciSetCode: 'JTG', localSetId: 'sv9' },
  { id: 'JTG-086', name: 'Cynthia\'s Garchomp ex', imageUrl: getTCGdexImageUrl('JTG', '086'), setCode: 'JTG', setName: 'Jornada em Conjunto (Journey Together)', setNumber: '086', tpciCode: 'JTG 086', tpciSetCode: 'JTG', localSetId: 'sv9' },
  { id: 'JTG-085', name: 'Cynthia\'s Gabite', imageUrl: getTCGdexImageUrl('JTG', '085'), setCode: 'JTG', setName: 'Jornada em Conjunto (Journey Together)', setNumber: '085', tpciCode: 'JTG 085', tpciSetCode: 'JTG', localSetId: 'sv9' },
  { id: 'JTG-084', name: 'Cynthia\'s Gible', imageUrl: getTCGdexImageUrl('JTG', '084'), setCode: 'JTG', setName: 'Jornada em Conjunto (Journey Together)', setNumber: '084', tpciCode: 'JTG 084', tpciSetCode: 'JTG', localSetId: 'sv9' },
  { id: 'JTG-008', name: 'Cynthia\'s Roserade', imageUrl: getTCGdexImageUrl('JTG', '008'), setCode: 'JTG', setName: 'Jornada em Conjunto (Journey Together)', setNumber: '008', tpciCode: 'JTG 008', tpciSetCode: 'JTG', localSetId: 'sv9' },
  { id: 'DRI-011', name: 'Dwebble', imageUrl: getTCGdexImageUrl('DRI', '011'), setCode: 'DRI', setName: 'Rivais Destinados (Destined Rivals)', setNumber: '011', tpciCode: 'DRI 011', tpciSetCode: 'DRI', localSetId: 'sv9pt5' },
  { id: 'DRI-012', name: 'Crustle', imageUrl: getTCGdexImageUrl('DRI', '012'), setCode: 'DRI', setName: 'Rivais Destinados (Destined Rivals)', setNumber: '012', tpciCode: 'DRI 012', tpciSetCode: 'DRI', localSetId: 'sv9pt5' },
  { id: 'DRI-020', name: 'Red\'s Charizard ex', imageUrl: getTCGdexImageUrl('DRI', '020'), setCode: 'DRI', setName: 'Rivais Destinados (Destined Rivals)', setNumber: '020', tpciCode: 'DRI 020', tpciSetCode: 'DRI', localSetId: 'sv9pt5' },
  { id: 'DRI-136', name: 'Marnie\'s Grimmsnarl ex', imageUrl: getTCGdexImageUrl('DRI', '136'), setCode: 'DRI', setName: 'Rivais Destinados (Destined Rivals)', setNumber: '136', tpciCode: 'DRI 136', tpciSetCode: 'DRI', localSetId: 'sv9pt5' },

  // --- STAPLES DO FORMATO STANDARD ATUAL (SCARLET & VIOLET) ---
  { id: 'SSP-054', name: 'Pikachu ex', imageUrl: getTCGdexImageUrl('SSP', '054'), setCode: 'SSP', setName: 'Surging Sparks', setNumber: '054', tpciCode: 'SSP 054', tpciSetCode: 'SSP', localSetId: 'sv8' },
  { id: 'SSP-034', name: 'Ceruledge ex', imageUrl: getTCGdexImageUrl('SSP', '034'), setCode: 'SSP', setName: 'Surging Sparks', setNumber: '034', tpciCode: 'SSP 034', tpciSetCode: 'SSP', localSetId: 'sv8' },
  { id: 'SSP-076', name: 'Latias ex', imageUrl: getTCGdexImageUrl('SSP', '076'), setCode: 'SSP', setName: 'Surging Sparks', setNumber: '076', tpciCode: 'SSP 076', tpciSetCode: 'SSP', localSetId: 'sv8' },
  { id: 'SCR-128', name: 'Terapagos ex', imageUrl: getTCGdexImageUrl('SCR', '128'), setCode: 'SCR', setName: 'Stellar Crown', setNumber: '128', tpciCode: 'SCR 128', tpciSetCode: 'SCR', localSetId: 'sv7' },
  { id: 'SCR-131', name: 'Area Zero Underdepths', imageUrl: getTCGdexImageUrl('SCR', '131'), setCode: 'SCR', setName: 'Stellar Crown', setNumber: '131', tpciCode: 'SCR 131', tpciSetCode: 'SCR', localSetId: 'sv7' },
  { id: 'SFA-020', name: 'Dusknoir', imageUrl: getTCGdexImageUrl('SFA', '020'), setCode: 'SFA', setName: 'Shrouded Fable', setNumber: '020', tpciCode: 'SFA 020', tpciSetCode: 'SFA', localSetId: 'sv6pt5' },
  { id: 'SFA-096', name: 'Fezandipiti ex', imageUrl: getTCGdexImageUrl('SFA', '096'), setCode: 'SFA', setName: 'Shrouded Fable', setNumber: '096', tpciCode: 'SFA 096', tpciSetCode: 'SFA', localSetId: 'sv6pt5' },
  { id: 'TWM-130', name: 'Dragapult ex', imageUrl: getTCGdexImageUrl('TWM', '130'), setCode: 'TWM', setName: 'Twilight Masquerade', setNumber: '130', tpciCode: 'TWM 130', tpciSetCode: 'TWM', localSetId: 'sv6' },
  { id: 'TWM-025', name: 'Teal Mask Ogerpon ex', imageUrl: getTCGdexImageUrl('TWM', '025'), setCode: 'TWM', setName: 'Twilight Masquerade', setNumber: '025', tpciCode: 'TWM 025', tpciSetCode: 'TWM', localSetId: 'sv6' },
  { id: 'TWM-095', name: 'Munkidori', imageUrl: getTCGdexImageUrl('TWM', '095'), setCode: 'TWM', setName: 'Twilight Masquerade', setNumber: '095', tpciCode: 'TWM 095', tpciSetCode: 'TWM', localSetId: 'sv6' },
  { id: 'TEF-123', name: 'Raging Bolt ex', imageUrl: getTCGdexImageUrl('TEF', '123'), setCode: 'TEF', setName: 'Temporal Forces', setNumber: '123', tpciCode: 'TEF 123', tpciSetCode: 'TEF', localSetId: 'sv5' },
  { id: 'TEF-144', name: 'Buddy-Buddy Poffin', imageUrl: getTCGdexImageUrl('TEF', '144'), setCode: 'TEF', setName: 'Temporal Forces', setNumber: '144', tpciCode: 'TEF 144', tpciSetCode: 'TEF', localSetId: 'sv5' },
  { id: 'TEF-157', name: 'Prime Catcher', imageUrl: getTCGdexImageUrl('TEF', '157'), setCode: 'TEF', setName: 'Temporal Forces', setNumber: '157', tpciCode: 'TEF 157', tpciSetCode: 'TEF', localSetId: 'sv5' },
  { id: 'OBF-125', name: 'Charizard ex', imageUrl: getTCGdexImageUrl('OBF', '125'), setCode: 'OBF', setName: 'Obsidian Flames', setNumber: '125', tpciCode: 'OBF 125', tpciSetCode: 'OBF', localSetId: 'sv3' },
  { id: 'OBF-225', name: 'Pidgeot ex', imageUrl: getTCGdexImageUrl('OBF', '225'), setCode: 'OBF', setName: 'Obsidian Flames', setNumber: '225', tpciCode: 'OBF 225', tpciSetCode: 'OBF', localSetId: 'sv3' },
  { id: 'MEW-151', name: 'Mew ex', imageUrl: getTCGdexImageUrl('MEW', '151'), setCode: 'MEW', setName: '151', setNumber: '151', tpciCode: 'MEW 151', tpciSetCode: 'MEW', localSetId: 'sv3pt5' },
  { id: 'PAL-185', name: 'Iono', imageUrl: getTCGdexImageUrl('PAL', '185'), setCode: 'PAL', setName: 'Paldea Evolved', setNumber: '185', tpciCode: 'PAL 185', tpciSetCode: 'PAL', localSetId: 'sv2' },
  { id: 'PAL-172', name: 'Boss\'s Orders', imageUrl: getTCGdexImageUrl('PAL', '172'), setCode: 'PAL', setName: 'Paldea Evolved', setNumber: '172', tpciCode: 'PAL 172', tpciSetCode: 'PAL', localSetId: 'sv2' },
  { id: 'PAL-188', name: 'Super Rod', imageUrl: getTCGdexImageUrl('PAL', '188'), setCode: 'PAL', setName: 'Paldea Evolved', setNumber: '188', tpciCode: 'PAL 188', tpciSetCode: 'PAL', localSetId: 'sv2' },
  { id: 'SVI-166', name: 'Arven', imageUrl: getTCGdexImageUrl('SVI', '166'), setCode: 'SVI', setName: 'Scarlet & Violet Base', setNumber: '166', tpciCode: 'SVI 166', tpciSetCode: 'SVI', localSetId: 'sv1' },
  { id: 'SVI-181', name: 'Nest Ball', imageUrl: getTCGdexImageUrl('SVI', '181'), setCode: 'SVI', setName: 'Scarlet & Violet Base', setNumber: '181', tpciCode: 'SVI 181', tpciSetCode: 'SVI', localSetId: 'sv1' },
  { id: 'SVI-196', name: 'Ultra Ball', imageUrl: getTCGdexImageUrl('SVI', '196'), setCode: 'SVI', setName: 'Scarlet & Violet Base', setNumber: '196', tpciCode: 'SVI 196', tpciSetCode: 'SVI', localSetId: 'sv1' },
  { id: 'SVI-191', name: 'Rare Candy', imageUrl: getTCGdexImageUrl('SVI', '191'), setCode: 'SVI', setName: 'Scarlet & Violet Base', setNumber: '191', tpciCode: 'SVI 191', tpciSetCode: 'SVI', localSetId: 'sv1' },
  { id: 'SVI-189', name: "Professor's Research", imageUrl: getTCGdexImageUrl('SVI', '189'), setCode: 'SVI', setName: 'Scarlet & Violet Base', setNumber: '189', tpciCode: 'SVI 189', tpciSetCode: 'SVI', localSetId: 'sv1' },
  { id: 'PAR-160', name: 'Counter Catcher', imageUrl: getTCGdexImageUrl('PAR', '160'), setCode: 'PAR', setName: 'Paradox Rift', setNumber: '160', tpciCode: 'PAR 160', tpciSetCode: 'PAR', localSetId: 'sv4' },
  { id: 'PAR-163', name: 'Earthen Vessel', imageUrl: getTCGdexImageUrl('PAR', '163'), setCode: 'PAR', setName: 'Paradox Rift', setNumber: '163', tpciCode: 'PAR 163', tpciSetCode: 'PAR', localSetId: 'sv4' },
  { id: 'PAR-170', name: "Professor Sada's Vitality", imageUrl: getTCGdexImageUrl('PAR', '170'), setCode: 'PAR', setName: 'Paradox Rift', setNumber: '170', tpciCode: 'PAR 170', tpciSetCode: 'PAR', localSetId: 'sv4' },
  { id: 'PAR-124', name: 'Roaring Moon ex', imageUrl: getTCGdexImageUrl('PAR', '124'), setCode: 'PAR', setName: 'Paradox Rift', setNumber: '124', tpciCode: 'PAR 124', tpciSetCode: 'PAR', localSetId: 'sv4' },
  { id: 'PAR-070', name: 'Iron Hands ex', imageUrl: getTCGdexImageUrl('PAR', '070'), setCode: 'PAR', setName: 'Paradox Rift', setNumber: '070', tpciCode: 'PAR 070', tpciSetCode: 'PAR', localSetId: 'sv4' },
  { id: 'PAR-139', name: 'Gholdengo ex', imageUrl: getTCGdexImageUrl('PAR', '139'), setCode: 'PAR', setName: 'Paradox Rift', setNumber: '139', tpciCode: 'PAR 139', tpciSetCode: 'PAR', localSetId: 'sv4' },
  { id: 'SFA-061', name: 'Night Stretcher', imageUrl: getTCGdexImageUrl('SFA', '061'), setCode: 'SFA', setName: 'Shrouded Fable', setNumber: '061', tpciCode: 'SFA 061', tpciSetCode: 'SFA', localSetId: 'sv6pt5' },
  { id: 'SFA-039', name: 'Pecharunt ex', imageUrl: getTCGdexImageUrl('SFA', '039'), setCode: 'SFA', setName: 'Shrouded Fable', setNumber: '039', tpciCode: 'SFA 039', tpciSetCode: 'SFA', localSetId: 'sv6pt5' },
  { id: 'TEF-038', name: 'Gouging Fire ex', imageUrl: getTCGdexImageUrl('TEF', '038'), setCode: 'TEF', setName: 'Temporal Forces', setNumber: '038', tpciCode: 'TEF 038', tpciSetCode: 'TEF', localSetId: 'sv5' },
  { id: 'TEF-081', name: 'Iron Crown ex', imageUrl: getTCGdexImageUrl('TEF', '081'), setCode: 'TEF', setName: 'Temporal Forces', setNumber: '081', tpciCode: 'TEF 081', tpciSetCode: 'TEF', localSetId: 'sv5' },

  // --- STAPLES SWORD & SHIELD (SWSH) ---
  { id: 'CRZ-020', name: 'Radiant Charizard', imageUrl: getTCGdexImageUrl('CRZ', '020'), setCode: 'CRZ', setName: 'Crown Zenith', setNumber: '020', tpciCode: 'CRZ 020', tpciSetCode: 'CRZ', localSetId: 'swsh12pt5' },
  { id: 'SIT-136', name: 'Regidrago VSTAR', imageUrl: getTCGdexImageUrl('SIT', '136'), setCode: 'SIT', setName: 'Silver Tempest', setNumber: '136', tpciCode: 'SIT 136', tpciSetCode: 'SIT', localSetId: 'swsh12' },
  { id: 'SIT-139', name: 'Lugia VSTAR', imageUrl: getTCGdexImageUrl('SIT', '139'), setCode: 'SIT', setName: 'Silver Tempest', setNumber: '139', tpciCode: 'SIT 139', tpciSetCode: 'SIT', localSetId: 'swsh12' },
  { id: 'SIT-059', name: 'Radiant Alakazam', imageUrl: getTCGdexImageUrl('SIT', '059'), setCode: 'SIT', setName: 'Silver Tempest', setNumber: '059', tpciCode: 'SIT 059', tpciSetCode: 'SIT', localSetId: 'swsh12' },
  { id: 'LOR-131', name: 'Giratina VSTAR', imageUrl: getTCGdexImageUrl('LOR', '131'), setCode: 'LOR', setName: 'Lost Origin', setNumber: '131', tpciCode: 'LOR 131', tpciSetCode: 'LOR', localSetId: 'swsh11' },
  { id: 'LOR-079', name: 'Comfey', imageUrl: getTCGdexImageUrl('LOR', '079'), setCode: 'LOR', setName: 'Lost Origin', setNumber: '079', tpciCode: 'LOR 079', tpciSetCode: 'LOR', localSetId: 'swsh11' },
  { id: 'LOR-070', name: 'Sableye', imageUrl: getTCGdexImageUrl('LOR', '070'), setCode: 'LOR', setName: 'Lost Origin', setNumber: '070', tpciCode: 'LOR 070', tpciSetCode: 'LOR', localSetId: 'swsh11' },
  { id: 'LOR-050', name: 'Cramorant', imageUrl: getTCGdexImageUrl('LOR', '050'), setCode: 'LOR', setName: 'Lost Origin', setNumber: '050', tpciCode: 'LOR 050', tpciSetCode: 'LOR', localSetId: 'swsh11' },
  { id: 'LOR-155', name: "Colress's Experiment", imageUrl: getTCGdexImageUrl('LOR', '155'), setCode: 'LOR', setName: 'Lost Origin', setNumber: '155', tpciCode: 'LOR 155', tpciSetCode: 'LOR', localSetId: 'swsh11' },
  { id: 'LOR-162', name: 'Lost Vacuum', imageUrl: getTCGdexImageUrl('LOR', '162'), setCode: 'LOR', setName: 'Lost Origin', setNumber: '162', tpciCode: 'LOR 162', tpciSetCode: 'LOR', localSetId: 'swsh11' },
  { id: 'LOR-163', name: 'Mirage Gate', imageUrl: getTCGdexImageUrl('LOR', '163'), setCode: 'LOR', setName: 'Lost Origin', setNumber: '163', tpciCode: 'LOR 163', tpciSetCode: 'LOR', localSetId: 'swsh11' },
  { id: 'ASR-046', name: 'Radiant Greninja', imageUrl: getTCGdexImageUrl('ASR', '046'), setCode: 'ASR', setName: 'Astral Radiance', setNumber: '046', tpciCode: 'ASR 046', tpciSetCode: 'ASR', localSetId: 'swsh10' },
  { id: 'BRS-122', name: 'Arceus VSTAR', imageUrl: getTCGdexImageUrl('BRS', '122'), setCode: 'BRS', setName: 'Brilliant Stars', setNumber: '122', tpciCode: 'BRS 122', tpciSetCode: 'BRS', localSetId: 'swsh9' },
  { id: 'BRS-041', name: 'Manaphy', imageUrl: getTCGdexImageUrl('BRS', '041'), setCode: 'BRS', setName: 'Brilliant Stars', setNumber: '041', tpciCode: 'BRS 041', tpciSetCode: 'BRS', localSetId: 'swsh9' },
  { id: 'FST-225', name: 'Battle VIP Pass', imageUrl: getTCGdexImageUrl('FST', '225'), setCode: 'FST', setName: 'Fusion Strike', setNumber: '225', tpciCode: 'FST 225', tpciSetCode: 'FST', localSetId: 'swsh8' },
  { id: 'FST-114', name: 'Mew VMAX', imageUrl: getTCGdexImageUrl('FST', '114'), setCode: 'FST', setName: 'Fusion Strike', setNumber: '114', tpciCode: 'FST 114', tpciSetCode: 'FST', localSetId: 'swsh8' },
  { id: 'CEL-005', name: 'Pikachu', imageUrl: getTCGdexImageUrl('CEL', '005'), setCode: 'CEL', setName: 'Celebrations', setNumber: '005', tpciCode: 'CEL 005', tpciSetCode: 'CEL', localSetId: 'cel25' },
  { id: '30TH-C-001', name: 'Charizard', imageUrl: getTCGdexImageUrl('30TH-C', '001'), setCode: '30TH-C', setName: 'Coleção Clássica de 30 Anos', setNumber: '001', tpciCode: '30TH-C 001', tpciSetCode: '30TH-C', localSetId: '30th-c' },
  { id: '30TH-C-008', name: 'Pikachu & Zekrom GX', imageUrl: getTCGdexImageUrl('30TH-C', '008'), setCode: '30TH-C', setName: 'Coleção Clássica de 30 Anos', setNumber: '008', tpciCode: '30TH-C 008', tpciSetCode: '30TH-C', localSetId: '30th-c' }
];

export function normalizeSearchTerm(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const MODERN_MEGA_SET_IDS = new Set(['asc', 'pfl', 'por', 'meg', 'cri', 'pbl']);

/**
 * Executes a fast, 100% reliable local search against the modern Pokémon catalog.
 * Guarantees that whether on GitHub Pages, offline, or when backend API returns 404,
 * the user can ALWAYS browse and search modern sets and Mega Evolution cards with PTCGL formats.
 */
export function searchCardsLocally(rawQuery: string, rawSet: string): CatalogCard[] {
  const normQuery = normalizeSearchTerm(rawQuery);
  const normSet = normalizeSearchTerm(rawSet);

  const tpciFromRawSet = rawSet ? normalizeTPCiSetCode(rawSet) : '';
  let resolvedSetToken = tpciFromRawSet;
  let resolvedNumber = '';
  let queryText = normQuery;

  // Check aliases for set queries (e.g. "herois excelsor" -> "ASC")
  if (!resolvedSetToken && SET_QUERY_ALIASES[normQuery]) {
    resolvedSetToken = (LOCAL_TO_TPCI_SET_MAP[SET_QUERY_ALIASES[normQuery]] || SET_QUERY_ALIASES[normQuery]).toUpperCase();
    queryText = '';
  }

  // Detect TPCi code search like "ASC 085" or "PFL 013" or "TWM 130"
  const codeMatch = rawQuery.match(/^([A-Za-z0-9.-]{2,7})[- ]+(\d+|promo)$/i);
  if (codeMatch) {
    resolvedSetToken = normalizeTPCiSetCode(codeMatch[1]);
    resolvedNumber = codeMatch[2].replace(/^0+/, '') || '1';
    queryText = '';
  }

  const isMegaSearch = queryText.includes('mega') || 
                       MODERN_MEGA_SET_IDS.has(resolvedSetToken.toLowerCase()) || 
                       MODERN_MEGA_SET_IDS.has(normSet);

  const matched = MODERN_CARDS_CATALOG.filter(c => {
    const cardSetCode = (c.setCode || '').toUpperCase();
    const cardLocalSet = (c.localSetId || '').toLowerCase();
    const cardSetName = normalizeSearchTerm(c.setName || '');
    const cardName = normalizeSearchTerm(c.name || '');

    // Set filter
    if (resolvedSetToken) {
      const setMatches = cardSetCode === resolvedSetToken ||
                         cardLocalSet === resolvedSetToken.toLowerCase() ||
                         cardSetCode.toLowerCase().includes(normSet) ||
                         cardSetName.includes(normSet);
      if (!setMatches) return false;
    }

    // Number filter
    if (resolvedNumber) {
      const cardNum = String(c.setNumber).replace(/^0+/, '');
      if (cardNum !== resolvedNumber && c.setNumber !== resolvedNumber) {
        return false;
      }
    }

    // Query text filter
    if (queryText) {
      if (SET_QUERY_ALIASES[queryText]) {
        const aliasTarget = (LOCAL_TO_TPCI_SET_MAP[SET_QUERY_ALIASES[queryText]] || SET_QUERY_ALIASES[queryText]).toUpperCase();
        if (cardSetCode === aliasTarget) return true;
      }
      const nameMatches = cardName.includes(queryText);
      const setMatches = cardSetCode.toLowerCase().includes(queryText) || cardSetName.includes(queryText);
      const numMatches = c.setNumber && String(c.setNumber).includes(queryText);
      const megaMatches = isMegaSearch && cardName.includes('mega');
      return nameMatches || setMatches || numMatches || megaMatches;
    }

    return true;
  });

  // If user searched for "mega" and we have mega cards, sort them to the very top
  if (isMegaSearch) {
    return matched.sort((a, b) => {
      const aIsMega = a.name.toLowerCase().includes('mega') ? 1 : 0;
      const bIsMega = b.name.toLowerCase().includes('mega') ? 1 : 0;
      return bIsMega - aIsMega;
    });
  }

  return matched;
}

// Auto-seed collection registry with modern meta cards
try {
  registerCollectionCards(MODERN_CARDS_CATALOG);
} catch {
  // safe fallback
}
