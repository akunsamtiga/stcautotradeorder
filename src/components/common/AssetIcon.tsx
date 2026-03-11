// components/common/AssetIcon.tsx 

'use client'
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface AssetIconProps {
  asset: {
    icon?: string
    name: string
    symbol: string
    category?: 'normal' | 'crypto'
    cryptoConfig?: {
      baseCurrency: string
    }
  }
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

const ICON_SIZE_CLASSES = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10'
}

const TEXT_SIZE_CLASSES = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl'
}

// FIX: Ganti cryptologos.cc → jsdelivr.net/gh/spothq/cryptocurrency-icons
// cryptologos.cc memblokir hotlink dari domain lain (referrer check),
// sehingga onError terpicu dan tampil fallback teks "Blank".
// jsdelivr CDN tidak ada referrer restriction.
const getCryptoIconUrl = (baseCurrency: string): string => {
  const currency = baseCurrency.toUpperCase()

  const iconMap: Record<string, string> = {
    'BTC':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png',
    'ETH':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png',
    'BNB':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/bnb.png',
    'XRP':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xrp.png',
    'ADA':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ada.png',
    'SOL':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/sol.png',
    'DOT':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/dot.png',
    'DOGE': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/doge.png',
    'MATIC':'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/matic.png',
    'LTC':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ltc.png',
    'AVAX': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/avax.png',
    'LINK': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/link.png',
    'UNI':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/uni.png',
    'ATOM': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/atom.png',
    'XLM':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xlm.png',
    'TRX':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/trx.png',
    'ETC':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/etc.png',
    'NEAR': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/near.png',
    'APT':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/apt.png',
    'ARB':  'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/arb.png',
  }

  // Return empty string jika tidak ada di map — supaya jatuh ke fallback huruf
  return iconMap[currency] || ''
}

export default function AssetIcon({
  asset,
  size = 'md',
  className = '',
  showFallback = true
}: AssetIconProps) {
  const [imageError, setImageError] = useState(false)

  // FIX: Jika asset.icon adalah URL dari cryptologos.cc, ganti dengan CDN yang aman.
  // Aset lama di Firestore mungkin masih menyimpan URL cryptologos.cc.
  let iconUrl = asset.icon

  // Override URL cryptologos.cc yang tersimpan di Firestore dengan CDN baru
  if (iconUrl && iconUrl.includes('cryptologos.cc') && asset.cryptoConfig?.baseCurrency) {
    iconUrl = getCryptoIconUrl(asset.cryptoConfig.baseCurrency)
  }

  // Jika tidak ada icon dari Firestore, generate dari baseCurrency
  if (!iconUrl && asset.category === 'crypto' && asset.cryptoConfig?.baseCurrency) {
    iconUrl = getCryptoIconUrl(asset.cryptoConfig.baseCurrency)
  }

  // Tampilkan gambar jika ada URL dan belum error
  if (iconUrl && !imageError) {
    return (
      <div className={`${SIZE_CLASSES[size]} rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}>
        <img
          src={iconUrl}
          alt={`${asset.name} icon`}
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  // FIX: Fallback yang proper — tampilkan inisial currency, bukan teks "Blank"
  if (showFallback) {
    const label = asset.category === 'crypto' && asset.cryptoConfig?.baseCurrency
      ? asset.cryptoConfig.baseCurrency.slice(0, 3).toUpperCase()
      : asset.symbol.slice(0, 2).toUpperCase()

    return (
      <div className={`${SIZE_CLASSES[size]} rounded-lg bg-gradient-to-br ${
        asset.category === 'crypto'
          ? 'from-orange-400 to-yellow-500'
          : 'from-blue-400 to-purple-500'
      } flex items-center justify-center text-white font-bold flex-shrink-0 ${className} ${TEXT_SIZE_CLASSES[size]}`}>
        {asset.category === 'crypto' ? (
          <span>{label}</span>
        ) : (
          <TrendingUp className={ICON_SIZE_CLASSES[size]} />
        )}
      </div>
    )
  }

  return null
}