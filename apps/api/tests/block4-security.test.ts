import {describe,expect,it} from "vitest";
import {requireRecentAuthentication,requireWritableOrganization} from "../src/auth/permissions.js";
describe("Block 4 critical guards",()=>{
 it("requires AAL2 and a recent authentication",()=>{const now=2_000;expect(()=>requireRecentAuthentication({aal:"aal1",authenticatedAt:now},900,now)).toThrow();expect(()=>requireRecentAuthentication({aal:"aal2",authenticatedAt:1_000},900,now)).toThrow();expect(()=>requireRecentAuthentication({aal:"aal2",authenticatedAt:1_500},900,now)).not.toThrow();expect(()=>requireRecentAuthentication({aal:"aal2",authenticatedAt:now+1},900,now)).toThrow();});
 it("allows reads but blocks common writes for non-active organizations",()=>{expect(()=>requireWritableOrganization("ACTIVE")).not.toThrow();expect(()=>requireWritableOrganization("SUSPENDED")).toThrow();expect(()=>requireWritableOrganization("ARCHIVED")).toThrow();});
});
