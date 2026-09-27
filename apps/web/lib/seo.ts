import type {Metadata} from "next";
export const siteUrl="https://saas-juridico-theta.vercel.app";
export function pageMetadata(title:string,description:string,path:string,index=true):Metadata{return {title,description,alternates:{canonical:path},robots:{index,follow:index},openGraph:{title,description,url:path,type:"website",locale:"pt_BR",siteName:"JurisVia",images:["/opengraph-image"]},twitter:{card:"summary_large_image",title,description,images:["/opengraph-image"]}}}
export function safeJsonLd(value:unknown){return JSON.stringify(value).replace(/</g,"\\u003c")}
export function webpageJsonLd(name:string,description:string,path:string){
 const page={"@context":"https://schema.org","@type":"WebPage",name,description,url:`${siteUrl}${path}`,inLanguage:"pt-BR"};
 return path==="/"?page:{...page,breadcrumb:{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Início",item:siteUrl},{"@type":"ListItem",position:2,name,item:`${siteUrl}${path}`}]}};
}
