import React, { useState, useEffect } from 'react';

interface PokemonSpriteProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isStatic?: boolean;
  key?: React.Key;
}

export const getPokemonSpriteUrl = (pokemonName: string, isStatic: boolean = true): string => {
  if (!pokemonName) return isStatic 
    ? 'https://play.pokemonshowdown.com/sprites/dex/substitute.png'
    : 'https://play.pokemonshowdown.com/sprites/ani/substitute.gif';
  
  let name = pokemonName.toLowerCase().trim();
  
  // Ignore "mega" prefix if present
  if (name.startsWith('mega ')) {
    name = name.substring(5).trim();
  } else if (name.startsWith('mega-')) {
    name = name.substring(5).trim();
  } else {
    name = name.replace(/\bmega\b/gi, '').trim();
  }
  
  // Remove suffixes typical of cards
  name = name.replace(/\bex\b/gi, '');
  name = name.replace(/\bvstar\b/gi, '');
  name = name.replace(/\bvmax\b/gi, '');
  name = name.replace(/\bv\b/gi, '');
  name = name.replace(/\bgmax\b/gi, '');
  name = name.replace(/\btera\b/gi, '');
  name = name.replace(/\bprime\b/gi, '');
  name = name.replace(/\bbaby\b/gi, '');
  name = name.replace(/\bdeck\b/gi, '');
  name = name.replace(/[^a-z0-9\s-]/g, ''); // remove punctuation
  name = name.trim();
  name = name.replace(/\s+/g, '-'); // replace space with dash

  // Special mappings
  if (name === 'teal-mask-ogerpon') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/ogerpon-teal.png' : 'https://play.pokemonshowdown.com/sprites/ani/ogerpon-teal.gif';
  if (name === 'raging-bolt') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/ragingbolt.png' : 'https://play.pokemonshowdown.com/sprites/ani/ragingbolt.gif';
  if (name === 'iron-valiant') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/ironvaliant.png' : 'https://play.pokemonshowdown.com/sprites/ani/ironvaliant.gif';
  if (name === 'gholdengo') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/gholdengo.png' : 'https://play.pokemonshowdown.com/sprites/ani/gholdengo.gif';
  if (name === 'roaring-moon') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/roaringmoon.png' : 'https://play.pokemonshowdown.com/sprites/ani/roaringmoon.gif';
  if (name === 'chien-pao') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/chienpao.png' : 'https://play.pokemonshowdown.com/sprites/ani/chienpao.gif';
  if (name === 'dragapult') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/dragapult.png' : 'https://play.pokemonshowdown.com/sprites/ani/dragapult.gif';
  if (name === 'miraidon') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/miraidon.png' : 'https://play.pokemonshowdown.com/sprites/ani/miraidon.gif';
  if (name === 'charizard') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/charizard.png' : 'https://play.pokemonshowdown.com/sprites/ani/charizard.gif';
  if (name === 'pidgeot') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/pidgeot.png' : 'https://play.pokemonshowdown.com/sprites/ani/pidgeot.gif';
  if (name === 'gengar-gmax') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/gengar.png' : 'https://play.pokemonshowdown.com/sprites/ani/gengar.gif';
  if (name === 'terapagos') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/terapagos.png' : 'https://play.pokemonshowdown.com/sprites/ani/terapagos.gif';
  if (name === 'archaludon') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/archaludon.png' : 'https://play.pokemonshowdown.com/sprites/ani/archaludon.gif';
  if (name === 'ceruledge') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/ceruledge.png' : 'https://play.pokemonshowdown.com/sprites/ani/ceruledge.gif';
  if (name === 'gouging-fire') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/gougingfire.png' : 'https://play.pokemonshowdown.com/sprites/ani/gougingfire.gif';
  if (name === 'iron-hands') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/ironhands.png' : 'https://play.pokemonshowdown.com/sprites/ani/ironhands.gif';
  if (name === 'iron-crown') return isStatic ? 'https://play.pokemonshowdown.com/sprites/dex/ironcrown.png' : 'https://play.pokemonshowdown.com/sprites/ani/ironcrown.gif';

  return isStatic 
    ? `https://play.pokemonshowdown.com/sprites/dex/${name}.png`
    : `https://play.pokemonshowdown.com/sprites/ani/${name}.gif`;
};

export default function PokemonSprite({ name, className = '', size = 'md', isStatic = true }: PokemonSpriteProps) {
  const [src, setSrc] = useState<string>(getPokemonSpriteUrl(name, isStatic));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setSrc(getPokemonSpriteUrl(name, isStatic));
    setHasError(false);
  }, [name, isStatic]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  const handleImgError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback to substitute static sprite
      setSrc('https://play.pokemonshowdown.com/sprites/dex/substitute.png');
    }
  };

  return (
    <div className={`flex items-center justify-center overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}>
      <img
        id={`sprite-${(name || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        src={src}
        alt={name || 'sprite'}
        className="max-w-full max-h-full object-contain filter drop-shadow-[0_2px_4px_rgba(139,92,246,0.3)]"
        onError={handleImgError}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
