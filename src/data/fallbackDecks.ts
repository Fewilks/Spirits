import { MetaDeck } from '../types';

export const fallbackMetaDecks: MetaDeck[] = [
  {
    name: 'Pikachu ex',
    archetype: 'Pikachu ex / Latias ex / Magneton (H-On)',
    share: 18.5,
    winRate: 54.8,
    imageUrl: 'https://images.pokemontcg.io/sv8/54.png',
    updatedAt: '2026-06-30',
    description: 'O deck número 1 do formato H-On Standard. Pikachu ex bate 300 de dano massivo e previne o próprio nocaute quando está com HP cheio através da habilidade Resolute Heart. Ele é energizado instantaneamente a partir do descarte pela habilidade Overcharge do Magneton (SSP 052), enquanto Latias ex (SSP 076) fornece recuo gratuito para todos os seus Pokémons basic.',
    cards: [
      { name: 'Pikachu ex (SSP 054)', count: 3 },
      { name: 'Latias ex (SSP 076)', count: 1 },
      { name: 'Magneton (SSP 052)', count: 3 }
    ],
    rawList: `Pokémon: 14\n3 Pikachu ex SSP 54\n1 Latias ex SSP 76\n3 Magnemite SSP 51\n3 Magneton SSP 52\n2 Hoothoot SCR 114\n2 Noctowl SCR 115\n\nTrainer: 34\n4 Professor's Research SV8a 118\n4 Lacey SSP 185\n3 Boss's Orders SV8a 121\n4 Buddy-Buddy Poffin TEF 144\n4 Nest Ball SV8a 123\n4 Ultra Ball SV8a 124\n2 Super Rod SV8a 126\n2 Switch SV8a 127\n1 Prime Catcher TEF 157\n1 Sparking Crystal SCR 142\n2 Gravity Mountain SFA 74\n3 Night Stretcher SFA 61\n\nEnergy: 12\n12 Basic Lightning Energy SVE 4`
  },
  {
    name: 'Terapagos ex',
    archetype: 'Terapagos ex / Noctowl / Dusknoir (H-On)',
    share: 16.2,
    winRate: 53.5,
    imageUrl: 'https://images.pokemontcg.io/sv7/128.png',
    updatedAt: '2026-06-30',
    description: 'Uma força absurda no formato Standard atual. Terapagos ex (SCR 128) usa o ataque Unified Beatdown para desferir danos colossais baseados no número de Pokémons em seu banco. O banco é expandido para até 8 vagas através do estádio Area Zero Underdepths (SCR 131). Noctowl (SCR 115) busca qualquer 2 cartas de Treinador ao evoluir se você tiver um Pokémon Tera em jogo.',
    cards: [
      { name: 'Terapagos ex (SCR 128)', count: 3 },
      { name: 'Noctowl (SCR 115)', count: 3 },
      { name: 'Area Zero Underdepths (SCR 131)', count: 4 }
    ],
    rawList: `Pokémon: 19\n3 Terapagos ex SCR 128\n3 Hoothoot SCR 114\n3 Noctowl SCR 115\n2 Duskull SFA 18\n1 Dusclops SFA 19\n2 Dusknoir SFA 20\n2 Bouffalant SSP 145\n1 Fan Rotom SCR 118\n2 Teal Mask Ogerpon ex TWM 25\n\nTrainer: 31\n4 Professor's Research SV8a 118\n3 Lacey SSP 185\n2 Boss's Orders SV8a 121\n1 Briar SCR 132\n4 Buddy-Buddy Poffin TEF 144\n4 Nest Ball SV8a 123\n4 Ultra Ball SV8a 124\n3 Glass Trumpet SSP 188\n2 Super Rod SV8a 126\n1 Prime Catcher TEF 157\n3 Area Zero Underdepths SCR 131\n\nEnergy: 10\n4 Basic Grass Energy SVE 1\n4 Basic Water Energy SVE 3\n2 Basic Lightning Energy SVE 4`
  },
  {
    name: 'Ceruledge ex',
    archetype: 'Ceruledge ex / Dusknoir (H-On)',
    share: 14.8,
    winRate: 52.9,
    imageUrl: 'https://images.pokemontcg.io/sv8/34.png',
    updatedAt: '2026-06-30',
    description: 'Completamente focado no descarte rápido e agressividade pura. O ataque Abyssal Slash do Ceruledge ex (SSP 034) causa 100 de dano mais 30 adicionais para cada energia de Fogo na sua pilha de descarte. Ele é potencializado pela linha do Dusknoir (SFA 020) que coloca contadores de dano extras de surpresa no oponente usando a habilidade Cursed Blast.',
    cards: [
      { name: 'Ceruledge ex (SSP 034)', count: 4 },
      { name: 'Dusknoir (SFA 020)', count: 2 },
      { name: 'Charcadet (SSP 032)', count: 4 }
    ],
    rawList: `Pokémon: 16\n4 Charcadet SSP 32\n4 Ceruledge ex SSP 34\n2 Duskull SFA 18\n1 Dusclops SFA 19\n2 Dusknoir SFA 20\n3 Noctowl SCR 115\n\nTrainer: 32\n4 Professor's Research SV8a 118\n4 Lacey SSP 185\n2 Boss's Orders SV8a 121\n4 Ultra Ball SV8a 124\n4 Nest Ball SV8a 123\n4 Earthen Vessel SV8a 122\n2 Super Rod SV8a 126\n4 Night Stretcher SFA 61\n3 Switch SV8a 127\n1 Prime Catcher TEF 157\n4 Pokestop SV8a 128\n\nEnergy: 12\n12 Basic Fire Energy SVE 2`
  },
  {
    name: 'Archaludon ex',
    archetype: 'Archaludon ex / Metagross / Jasmine (H-On)',
    share: 13.5,
    winRate: 52.2,
    imageUrl: 'https://images.pokemontcg.io/sv8/130.png',
    updatedAt: '2026-06-30',
    description: 'O colosso de Metal dominante no formato Standard de Bloco H. Archaludon ex (SSP 130) acelera energias de Metal da pilha de descarte usando sua habilidade Metal Empire ao entrar em jogo, e bate fantásticos 220 de dano curando a si mesmo. Fortificado pelo suporte defensivo de Jasmine\'s Gaze para reduzir todo dano recebido.',
    cards: [
      { name: 'Archaludon ex (SSP 130)', count: 3 },
      { name: 'Duraludon (SSP 129)', count: 3 },
      { name: "Jasmine's Gaze (SSP 181)", count: 2 }
    ],
    rawList: `Pokémon: 15\n3 Duraludon SSP 129\n3 Archaludon ex SSP 130\n3 Beldum SSP 119\n3 Metagross SSP 121\n1 Fezandipiti ex TWM 96\n2 Teal Mask Ogerpon ex TWM 25\n\nTrainer: 33\n4 Professor's Research SV8a 118\n3 Jasmine's Gaze SSP 181\n3 Boss's Orders SV8a 121\n4 Nest Ball SV8a 123\n4 Ultra Ball SV8a 124\n4 Rare Candy SV8a 125\n3 Buddy-Buddy Poffin TEF 144\n2 Super Rod SV8a 126\n2 Night Stretcher SFA 61\n1 Prime Catcher TEF 157\n3 Area Zero Underdepths SCR 131\n\nEnergy: 12\n12 Basic Metal Energy SVE 8`
  },
  {
    name: 'Raging Bolt ex',
    archetype: 'Raging Bolt ex / Teal Mask Ogerpon (H-On)',
    share: 12.9,
    winRate: 51.8,
    imageUrl: 'https://images.pokemontcg.io/sv5/123.png',
    updatedAt: '2026-06-30',
    description: 'Adaptado perfeitamente para o formato H-On. Com a rotação de Sada, o deck agora utiliza aceleração através do Teal Mask Ogerpon ex (TWM 025) com sua habilidade Teal Dance e transferências cirúrgicas via Energy Switch, mantendo a explosão do ataque Bellowing Thunder de Raging Bolt ex (TEF 123) para nocautear qualquer Pokémon de um golpe só.',
    cards: [
      { name: 'Raging Bolt ex (TEF 123)', count: 4 },
      { name: 'Teal Mask Ogerpon ex (TWM 025)', count: 4 },
      { name: 'Energy Switch (SV8a 129)', count: 4 }
    ],
    rawList: `Pokémon: 12\n4 Raging Bolt ex TEF 123\n4 Teal Mask Ogerpon ex TWM 25\n1 Fezandipiti ex TWM 96\n1 Flutter Mane TEF 78\n2 Noctowl SCR 115\n\nTrainer: 35\n4 Lacey SSP 185\n4 Professor's Research SV8a 118\n2 Boss's Orders SV8a 121\n4 Earthen Vessel SV8a 122\n4 Nest Ball SV8a 123\n4 Ultra Ball SV8a 124\n4 Energy Switch SV8a 129\n3 Bravery Charm SV8a 130\n1 Prime Catcher TEF 157\n2 Super Rod SV8a 126\n2 Night Stretcher SFA 61\n1 Pokestop SV8a 128\n\nEnergy: 13\n6 Basic Grass Energy SVE 1\n4 Basic Lightning Energy SVE 4\n3 Basic Fighting Energy SVE 6`
  },
  {
    name: 'Dragapult ex',
    archetype: 'Dragapult ex / Noctowl / Charizard (H-On)',
    share: 11.5,
    winRate: 51.2,
    imageUrl: 'https://images.pokemontcg.io/sv6/130.png',
    updatedAt: '2026-06-30',
    description: 'Um dos atacantes mais táticos e temidos de todo o Standard. Dragapult ex (TWM 130) bate 200 de dano massivo no ativo com Phantom Dive e distribui 6 contadores de dano (60 de dano) livremente entre os Pokémons do banco do oponente. Usado em conjunto com Noctowl (SCR 115) para uma consistência inabalável na busca por recursos.',
    cards: [
      { name: 'Dragapult ex (TWM 130)', count: 3 },
      { name: 'Drakloak (TWM 129)', count: 3 },
      { name: 'Noctowl (SCR 115)', count: 3 }
    ],
    rawList: `Pokémon: 16\n3 Dreepy TWM 128\n3 Drakloak TWM 129\n3 Dragapult ex TWM 130\n3 Hoothoot SCR 114\n3 Noctowl SCR 115\n1 Fezandipiti ex TWM 96\n\nTrainer: 32\n4 Professor's Research SV8a 118\n4 Lacey SSP 185\n2 Boss's Orders SV8a 121\n4 Buddy-Buddy Poffin TEF 144\n4 Nest Ball SV8a 123\n4 Ultra Ball SV8a 124\n4 Rare Candy SV8a 125\n2 Super Rod SV8a 126\n1 Prime Catcher TEF 157\n3 Area Zero Underdepths SCR 131\n\nEnergy: 12\n8 Basic Psychic Energy SVE 13\n4 Basic Fire Energy SVE 2`
  }
];
