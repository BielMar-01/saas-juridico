export function validateBootstrapConfig(input:{email?:string;databaseUrl?:string;production:boolean;confirmation?:string}):void;
export function bootstrapSuperAdmin(db:{query(sql:string,values?:unknown[]):Promise<{rows:Array<Record<string,unknown>>}>},email:string):Promise<{user:Record<string,unknown>;administrator:Record<string,unknown>}>;
