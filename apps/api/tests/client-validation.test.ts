import { describe,expect,it } from "vitest";
import { isClientDocumentValid } from "../src/clients/validation.js";

describe("client identity validation",()=>{
it("accepts CPF only for individual clients",()=>{expect(isClientDocumentValid("INDIVIDUAL","529.982.247-25")).toBe(true);expect(isClientDocumentValid("LEGAL_ENTITY","529.982.247-25")).toBe(false);});
it("accepts CNPJ only for legal entities",()=>{expect(isClientDocumentValid("LEGAL_ENTITY","11.222.333/0001-81")).toBe(true);expect(isClientDocumentValid("INDIVIDUAL","11.222.333/0001-81")).toBe(false);});
it("allows clients without a document",()=>{expect(isClientDocumentValid("INDIVIDUAL",null)).toBe(true);expect(isClientDocumentValid("LEGAL_ENTITY",undefined)).toBe(true);});
});
