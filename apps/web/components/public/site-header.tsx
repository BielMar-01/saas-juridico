"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {primaryNavigation,site} from "@/lib/public-site";
import {CloseIcon,MenuIcon} from "./icons";
import {ThemeControl} from "./theme-control";
export function SiteHeader(){
 const pathname=usePathname(),[open,setOpen]=useState(false),menuButton=useRef<HTMLButtonElement>(null),firstLink=useRef<HTMLAnchorElement>(null);
 const homeAnchor=(hash:string)=>pathname==="/" ? hash : `/${hash}`;
 const current=(href:string)=>href==="/" ? pathname==="/" : pathname===href||pathname.startsWith(`${href}/`);
 useEffect(()=>{if(!open)return;firstLink.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==="Escape"){setOpen(false);menuButton.current?.focus()}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[open]);
 function follow(e:React.MouseEvent<HTMLAnchorElement>,href:string){const url=new URL(href,location.href),same=url.pathname===location.pathname&&Boolean(url.hash);setOpen(false);if(!same)return;e.preventDefault();requestAnimationFrame(()=>{const target=document.querySelector<HTMLElement>(url.hash);if(!target)return;history.pushState(null,"",url.hash);target.focus({preventScroll:true});target.scrollIntoView({block:"start"})})}
 return <header className="site-header"><div className="container header-inner"><Link className="wordmark" href="/" aria-label={`${site.name}, início`}>{site.name} <span>nome provisório</span></Link><nav className="desktop-nav" aria-label="Navegação principal">{primaryNavigation.map(link=><Link key={link.href} href={link.href} aria-current={current(link.href)?"page":undefined}>{link.label}</Link>)}</nav><div className="header-actions"><ThemeControl/><Link className="button button-secondary header-demo" href={homeAnchor("#demonstracao")}>Ver demonstração</Link><Link className="button button-primary header-primary" href="/contato">Conversar</Link><button ref={menuButton} className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open?"Fechar menu":"Abrir menu"} onClick={()=>setOpen(v=>!v)}>{open?<CloseIcon/>:<MenuIcon/>}</button></div></div><nav id="mobile-navigation" className="mobile-nav" aria-label="Navegação móvel" hidden={!open}><div className="container mobile-nav-inner">{primaryNavigation.map((link,i)=><Link key={link.href} ref={i===0?firstLink:undefined} href={link.href} aria-current={current(link.href)?"page":undefined} onClick={e=>follow(e,link.href)}>{link.label}</Link>)}<div className="mobile-nav-actions"><Link className="button button-secondary" href={homeAnchor("#demonstracao")} onClick={e=>follow(e,homeAnchor("#demonstracao"))}>Ver demonstração</Link><Link className="button button-primary" href="/contato" onClick={e=>follow(e,"/contato")}>Conversar</Link></div></div></nav></header>
}
