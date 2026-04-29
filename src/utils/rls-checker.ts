 import { supabase } from "@/integrations/supabase/client";
 
 export interface RLSTestResult {
   name: string;
   table: string;
   operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
   expected: 'success' | 'failure';
   actual: 'success' | 'failure';
   passed: boolean;
   error?: any;
 }
 
 export async function runRLSTests(): Promise<RLSTestResult[]> {
   const results: RLSTestResult[] = [];
 
   const { data: { user } } = await supabase.auth.getUser();
 
   // Test 1: Anonymous users cannot read private audit logs (if they exist)
   try {
     const { data, error } = await supabase.from('audit_logs').select('*').limit(1);
     results.push({
       name: 'Anon cannot read audit logs',
       table: 'audit_logs',
       operation: 'SELECT',
       expected: 'failure',
       actual: error ? 'failure' : 'success',
       passed: !!error,
       error
     });
   } catch (e) {
     results.push({ name: 'Anon cannot read audit logs', table: 'audit_logs', operation: 'SELECT', expected: 'failure', actual: 'failure', passed: true });
   }
 
   // Test 2: Users cannot update site_settings unless admin
   try {
     const { error } = await supabase.from('site_settings').update({ value: 'hacked' }).eq('key', 'site_info');
     results.push({
       name: 'Non-admin cannot update site settings',
       table: 'site_settings',
       operation: 'UPDATE',
       expected: 'failure',
       actual: error ? 'failure' : 'success',
       passed: !!error,
       error
     });
   } catch (e) {
     results.push({ name: 'Non-admin cannot update site settings', table: 'site_settings', operation: 'UPDATE', expected: 'failure', actual: 'failure', passed: true });
   }
 
   // Test 3: Users cannot delete bids of others
   try {
     // Try to delete a random bid (assuming RLS prevents it if not owner/admin)
     const { error } = await supabase.from('bids').delete().neq('id', '00000000-0000-0000-0000-000000000000');
     results.push({
       name: 'Cannot delete bids of others',
       table: 'bids',
       operation: 'DELETE',
       expected: 'failure',
       actual: error ? 'failure' : 'success',
       passed: !!error,
       error
     });
   } catch (e) {
     results.push({ name: 'Cannot delete bids of others', table: 'bids', operation: 'DELETE', expected: 'failure', actual: 'failure', passed: true });
   }
 
   // Test 4: Can read public events
   try {
     const { data, error } = await supabase.from('events').select('id').limit(1);
     results.push({
       name: 'Can read public events',
       table: 'events',
       operation: 'SELECT',
       expected: 'success',
       actual: error ? 'failure' : 'success',
       passed: !error,
       error
     });
   } catch (e) {
     results.push({ name: 'Can read public events', table: 'events', operation: 'SELECT', expected: 'success', actual: 'failure', passed: false, error: e });
   }
 
   return results;
 }