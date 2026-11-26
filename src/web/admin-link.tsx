// Lien de navigation interne injecté (CLP : `Link` de react-router-dom). Par défaut une ancre ; `/admin-shell-router` branche le routeur.
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

export type AdminLinkProps = { to: string; className?: string; style?: CSSProperties; children: ReactNode };
export type AdminLinkComponent = (props: AdminLinkProps) => ReactNode;

const AnchorLink: AdminLinkComponent = ({ to, className, style, children }) => <a href={to} className={className} style={style}>{children}</a>;

export const AdminLinkContext = createContext<AdminLinkComponent>(AnchorLink);
export const useAdminLink = () => useContext(AdminLinkContext);
