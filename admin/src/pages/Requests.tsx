import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Check, ClipboardList, MessageSquareWarning, Play, RefreshCw, Siren, Wrench, X, type LucideIcon } from 'lucide-react';
import { REQ_KIND, REQ_ST } from '../lib/config';
import { timeAgo } from '../lib/format';
import { useQuery, useRealtime } from '../lib/query';
import { must, sb } from '../lib/supabase';
import type { Req, ReqKind, ReqStatus } from '../types';
import { Btn, Card, Empty, Loading, Pill, Segmented, Tile } from '../ui/kit';
import { useFeedback } from '../ui/feedback';

const ICON: Record<ReqKind, LucideIcon> = { sos: Siren, incident: Wrench, leave: CalendarDays, complaint: MessageSquareWarning, renew: RefreshCw };
type F = 'open' | ReqStatus | 'all';

export default function Requests() {
  const { run, confirm } = useFeedback();
  const [f, setF] = useState<F>('open');
  const [kind, setKind] = useState<'all' | ReqKind>('all');
  const q = useQuery(async () => must(await sb.from('requests').select('*, drivers(full_name, code)').order('created_at', { ascending: false })) as Req[], []);
  useRealtime(['requests'], q.reload);

  if (!q.data) return <div className="page"><h1>Yêu cầu & sự cố</h1>{q.error ? <div className="error-box mt">{q.error}</div> : <Loading />}</div>;
  const all = q.data;
  const inF = (r: Req, k: F) => (k === 'all' ? true : k === 'open' ? r.status === 'new' || r.status === 'processing' : r.status === k);
  const rows = all.filter(r => inF(r, f) && (kind === 'all' || r.kind === kind))
    .sort((a, b) => Number(b.kind === 'sos' && b.status === 'new') - Number(a.kind === 'sos' && a.status === 'new'));

  const setStatus = async (r: Req, status: ReqStatus) => {
    let response: string | null = r.response;
    if (status === 'done' || status === 'rejected') {
      response = await confirm({
        title: status === 'done' ? 'Hoàn tất yêu cầu' : 'Từ chối yêu cầu', ok: status === 'done' ? 'Hoàn tất' : 'Từ chối', danger: status === 'rejected',
        message: `${REQ_KIND[r.kind].label} · ${r.drivers?.full_name}: ${r.title}`,
        input: {
          label: 'Phản hồi cho lái xe', required: true,
          presets: r.kind === 'leave' ? ['Đã duyệt nghỉ, điều độ sắp xếp người thay', 'Không duyệt do thiếu người'] :
            r.kind === 'incident' ? ['Đã điều xe cứu hộ', 'Đã đổi xe, chờ điều độ gọi'] : ['Đã xử lý xong', 'Đã liên hệ trực tiếp']
        }
      });
      if (!response) return;
    }
    await run(async () => { must(await sb.from('requests').update({ status, response }).eq('id', r.id)); q.reload(); },
      status === 'processing' ? 'Đã tiếp nhận' : status === 'done' ? 'Đã hoàn tất' : 'Đã từ chối');
  };
  const count = (k: F) => all.filter(r => inF(r, k)).length;

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Yêu cầu & sự cố</h1><div className="sub">SOS, báo sự cố, nghỉ phép, khiếu nại KPI, gia hạn giấy tờ — lái xe thấy phản hồi ngay trong app</div></div>
      </div>
      <div className="toolbar">
        <Segmented value={f} onChange={setF} options={[['open', 'Cần xử lý', count('open')], ['done', 'Đã xong'], ['rejected', 'Từ chối'], ['all', 'Tất cả']]} />
        <Segmented value={kind} onChange={setKind} options={[['all', 'Mọi loại'], ...(Object.keys(REQ_KIND) as ReqKind[]).map(k => [k, REQ_KIND[k].label] as [ReqKind, string])]} />
      </div>
      {rows.length ? (
        <div className="col" style={{ gap: 10 }}>
          {rows.map(r => (
            <div key={r.id} className={`card req ${r.kind === 'sos' && r.status === 'new' ? 'sos' : ''}`}>
              <Tile lg icon={ICON[r.kind]} color={REQ_KIND[r.kind].color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  <b>{r.title}</b><Pill tone={REQ_ST[r.status].tone}>{REQ_ST[r.status].t}</Pill>
                  <span className="muted small">{REQ_KIND[r.kind].label} · {timeAgo(r.created_at)}</span>
                </div>
                <div className="small" style={{ marginTop: 2 }}><Link to={`/drivers/${r.driver_id}`}>{r.drivers?.full_name}</Link> <span className="muted">· {r.drivers?.code}</span></div>
                {r.detail && <div style={{ marginTop: 6 }}>{r.detail}</div>}
                {r.response && <div className="muted small" style={{ marginTop: 6 }}>Phản hồi: {r.response}{r.handled_at ? ` · ${timeAgo(r.handled_at)}` : ''}</div>}
              </div>
              <div className="row">
                {r.status === 'new' && <Btn size="sm" icon={Play} onClick={() => setStatus(r, 'processing')}>Tiếp nhận</Btn>}
                {(r.status === 'new' || r.status === 'processing') && <>
                  <Btn size="sm" kind="success" icon={Check} onClick={() => setStatus(r, 'done')}>Hoàn tất</Btn>
                  <Btn size="sm" kind="danger" icon={X} onClick={() => setStatus(r, 'rejected')}>Từ chối</Btn>
                </>}
              </div>
            </div>
          ))}
        </div>
      ) : <Card><Empty icon={ClipboardList} text="Không có yêu cầu nào" /></Card>}
    </div>
  );
}
