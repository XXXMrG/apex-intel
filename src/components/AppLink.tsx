import type { AnchorHTMLAttributes } from 'react'
import { Link as WouterLink } from 'wouter'

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string }

export function Link({ to, ...props }: AppLinkProps) {
  return <WouterLink href={to} {...props} />
}
