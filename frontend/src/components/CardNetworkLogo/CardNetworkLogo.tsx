import { type CardNetwork } from '../../utils/luhn'
import './CardNetworkLogo.css'

export function CardNetworkLogo({ network }: { network: CardNetwork }) {
  if (network === 'UNKNOWN') return null
  return (
    <span className={`card-logo card-logo--${network.toLowerCase()}`}>
      <img src={`/icons/${network.toLowerCase()}.svg`} alt={network} />
    </span>
  )
}
