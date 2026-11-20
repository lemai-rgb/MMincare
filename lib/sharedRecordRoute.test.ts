import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getClaims: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getClaims: mocks.getClaims }, rpc: mocks.rpc }) }));
import { createSharedRecord } from './sharedRecordRoute';
describe('Caretaker record route', () => {
 beforeEach(() => { vi.resetAllMocks(); mocks.getClaims.mockResolvedValue({data:{claims:{sub:'caretaker'}}}); });
 const request = () => new Request('http://localhost', {method:'POST',body:JSON.stringify({visit_date:'2026-01-01'})});
 it('rejects unsigned users before RPC', async () => { mocks.getClaims.mockResolvedValue({data:null}); expect((await createSharedRecord(request(),'pet','medical-records')).status).toBe(401); expect(mocks.rpc).not.toHaveBeenCalled(); });
 it('uses user-scoped RPC and returns the database projection', async () => { mocks.rpc.mockResolvedValue({data:{medical_record:{record_id:'id'}},error:null}); const response=await createSharedRecord(request(),'pet','medical-records'); expect(response.status).toBe(201); expect(mocks.rpc).toHaveBeenCalledWith('add_shared_pet_record',{p_pet_id:'pet',p_kind:'medical-records',p_body:{visit_date:'2026-01-01'}}); expect(await response.json()).toEqual({medical_record:{record_id:'id'}}); });
 it.each([['42501',403],['22023',400],['XX000',500]])('maps %s without leaking SQL details', async (code,status) => { mocks.rpc.mockResolvedValue({error:{code,message:'private SQL'}}); const response=await createSharedRecord(request(),'pet','medical-records'); expect(response.status).toBe(status); expect(JSON.stringify(await response.json())).not.toContain('private SQL'); });
});
