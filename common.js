import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = "https://ocbwmjgwwvtiqekmzxzj.supabase.co";
export const SUPABASE_KEY = "sb_publishable_ReDc9jgVxbWfBXzdUSaqxg_LQCg8w5z";
export const ADMIN_API = "https://ocbwmjgwwvtiqekmzxzj.supabase.co/functions/v1/eum-admin-api";
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
});
export function deviceId(){
  let id=localStorage.getItem('eum_device_id');
  if(!id){id=crypto.randomUUID();localStorage.setItem('eum_device_id',id)}return id;
}
export function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export async function loadAll(){
  const [cfg,kw,qs,fb]=await Promise.all([
    sb.from('eum_event_config').select('*').eq('id',1).single(),
    sb.from('eum_keywords').select('id,word,created_at'),
    sb.from('eum_questions').select('id,body,author,is_pinned,is_answered,is_hidden,like_count,created_at').eq('is_hidden',false),
    sb.from('eum_feedback').select('id,body,created_at').order('created_at',{ascending:false})
  ]);
  if(cfg.error)throw cfg.error;if(kw.error)throw kw.error;if(qs.error)throw qs.error;if(fb.error)throw fb.error;
  return {config:cfg.data,keywords:kw.data||[],questions:qs.data||[],feedback:fb.data||[]};
}
export function keywordCounts(rows){const m={};for(const r of rows){const w=(r.word||'').trim();if(w)m[w]=(m[w]||0)+1}return Object.entries(m).sort((a,b)=>b[1]-a[1]);}
export function cloudHTML(entries,large=false){
  if(!entries.length)return '<span class="help">아직 등록된 키워드가 없습니다.</span>';
  const max=entries[0][1];return entries.map(([w,n],i)=>{const ratio=n/max;const size=(large?20:16)+Math.round((large?38:28)*ratio);const opacity=Math.max(.48,ratio);
  return `<span class="word" title="${esc(w)} ${n}회" style="font-size:${size}px;font-weight:${i<3?800:650};opacity:${opacity};color:${i<3?'var(--accent)':'var(--text)'}">${esc(w)}</span>`}).join('');
}
export function subscribe(refresh){return sb.channel('eum-live-'+crypto.randomUUID())
.on('postgres_changes',{event:'*',schema:'public',table:'eum_keywords'},refresh)
.on('postgres_changes',{event:'*',schema:'public',table:'eum_questions'},refresh)
.on('postgres_changes',{event:'*',schema:'public',table:'eum_question_likes'},refresh)
.on('postgres_changes',{event:'*',schema:'public',table:'eum_event_config'},refresh).subscribe();}
export function formatTime(v){return new Date(v).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}