export interface ConfirmedAuthIdentity{authUserId:string;email:string;name:string}
export function validateBootstrapConfig(input:{email?:string;databaseUrl?:string;supabaseUrl?:string;supabaseSecretKey?:string;production:boolean;confirmation?:string;mode?:string}):void;
export function normalizeEmail(value:unknown):string;
export function fetchConfirmedAuthIdentity(input:{baseUrl:string;secretKey:string;email:string;fetchImpl?:(url:URL,init:unknown)=>Promise<{ok:boolean;json():Promise<unknown>}>}):Promise<ConfirmedAuthIdentity>;
export function bootstrapSuperAdmin(db:{query(sql:string,values?:unknown[]):Promise<{rows:Array<Record<string,unknown>>}>},identity:ConfirmedAuthIdentity):Promise<{user:Record<string,unknown>;administrator:Record<string,unknown>;created:boolean;replayed:boolean}>;
export function runBootstrapTransaction(db:{query(sql:string,values?:unknown[]):Promise<{rows:Array<Record<string,unknown>>}>},identity:ConfirmedAuthIdentity):Promise<{user:Record<string,unknown>;administrator:Record<string,unknown>;created:boolean;replayed:boolean}>;
