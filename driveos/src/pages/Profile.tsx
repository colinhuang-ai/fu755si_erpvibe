import {
  KeyRound, Bell, CalendarDays, ClipboardCheck, FileText, LogOut, Moon, Phone, RotateCcw, Siren, Star, TriangleAlert, Truck, Wrench
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VCHECK } from '../data/config';
import { MOCK_TODAY } from '../lib/clock';
import { vcCriticalLeft, vcDone } from '../lib/domain';
import { daysBetween, dm, dmy, fmt } from '../lib/format';
import { useStore } from '../store';
import { viError } from '../lib/supabase';
import type { ReqKind, Settings } from '../types';
import { Cell, Group, Pill, RCheck, Screen, Segmented, Switch } from '../ui/kit';
import { useUI } from '../ui/overlay';

const REQ: Record<ReqKind, { t: string; c: string }> = {
  incident: { t: 'Sự cố', c: 'var(--red)' }, leave: { t: 'Nghỉ phép', c: 'var(--purple)' }, complaint: { t: 'Khiếu nại KPI', c: 'var(--orange)' },
  renew: { t: 'Gia hạn', c: 'var(--blue)' }, sos: { t: 'SOS', c: 'var(--red)' }
};

const RST = {
  new: { t: 'Đã gửi', tone: 'orange' }, processing: { t: 'Đang xử lý', tone: 'blue' },
  done: { t: 'Đã xử lý', tone: 'green' }, rejected: { t: 'Từ chối', tone: 'red' }
} as const;

export default function Profile() {
  const { s, update, reset, signOut } = useStore();
  const { openSheet, confirm, toast } = useUI();
  const nav = useNavigate();
  const v = s.vehicle;
  const DRIVER = s.driver;
  const setS = <K extends keyof Settings>(k: K, val: Settings[K]) => update(d => { d.settings[k] = val; });

  const doReset = async () => {
    const r = await confirm({
      title: 'Đặt lại dữ liệu demo?', message: 'Mọi thay đổi bạn đã thực hiện sẽ bị xóa và khôi phục dữ liệu mẫu ban đầu.',
      actions: [{ label: 'Hủy', value: 'cancel', style: 'cancel' }, { label: 'Đặt lại', value: 'ok', style: 'destructive' }]
    });
    if (r !== 'ok') return;
    try { await reset(); toast('Đã khôi phục dữ liệu demo'); nav('/'); }
    catch (e) { toast(`Không đặt lại được: ${viError(e)}`, 'error'); }
  };

  const doSignOut = async () => {
    const r = await confirm({ title: 'Đăng xuất khỏi DriverOS?', actions: [{ label: 'Hủy', value: 'cancel', style: 'cancel' }, { label: 'Đăng xuất', value: 'ok', style: 'destructive' }] });
    if (r === 'ok') { nav('/'); await signOut(); }
  };

  return (
    <Screen title="Cá nhân" back={{ label: 'Hôm nay', to: '/' }}>
      <Group>
        <div className="cell profile-cell">
          <span className="avatar" style={{ width: 62, height: 62, fontSize: 24 }}>{DRIVER.initials}</span>
          <div className="cell-main">
            <div className="p-name">{DRIVER.name}</div>
            <div className="cell-sub">Mã NV {DRIVER.id} · {DRIVER.team}</div>
            <div className="row" style={{ gap: 6, marginTop: 6 }}>
              <Pill tone="yellow" icon={Star}>{String(DRIVER.rating).replace('.', ',')}</Pill>
              <Pill tone="blue">GPLX hạng FC</Pill>
              <Pill>Từ {DRIVER.since}</Pill>
            </div>
          </div>
        </div>
      </Group>

      <div className="card mx stats4" style={{ marginBottom: 28 }}>
        <div><b>{DRIVER.trips}</b><span>Chuyến năm nay</span></div>
        <div><b>{fmt(DRIVER.km)}</b><span>Km an toàn</span></div>
        <div><b>{DRIVER.incidents}</b><span>Sự cố</span></div>
        <div><b>{DRIVER.leaveLeft}</b><span>Ngày phép</span></div>
      </div>

      <Group header="Thông tin cá nhân">
        <Cell title="Điện thoại" detail={DRIVER.phone} />
        <Cell title="Ngày sinh" detail={DRIVER.dob} />
        <Cell title="Công ty" detail={DRIVER.company} />
      </Group>

      <Group header="Phương tiện được giao">
        <Cell icon={Truck} tint="var(--indigo)" title={v.plate} subtitle={v.model} />
        <Cell title="Cấu hình bồn" detail={`${v.compartments.length} khoang · ${fmt(v.compartments.reduce((a, b) => a + b, 0))} L`} />
        <Cell title="Hạn đăng kiểm" detail={dmy(v.registry)} />
        <Cell title="Kiểm định bồn" detail={dmy(v.tankInspect)} />
        <Cell title="Bảo dưỡng tiếp theo" detail={`còn ${fmt(v.nextService - v.odo)} km`} />
      </Group>

      <Group header="Nhiệm vụ ngoài chuyến">
        {s.tasks.map(t => {
          const d = daysBetween(MOCK_TODAY, t.due);
          return (
            <Cell key={t.id} sepLeft={52} leading={<RCheck on={t.done} />} title={t.title}
              subtitle={<span style={{ color: !t.done && d <= 1 ? 'var(--red)' : undefined }}>Hạn {dm(t.due)}{!t.done && d <= 1 ? (d === 1 ? ' · ngày mai' : ' · hôm nay') : ''}</span>}
              onClick={() => update(x => { const y = x.tasks.find(z => z.id === t.id); if (y) y.done = !y.done; })} />
          );
        })}
      </Group>

      <Group header="Công việc khác">
        <Cell icon={ClipboardCheck} tint="var(--green)" title="Kiểm tra xe trước chuyến" chevron onClick={() => openSheet('vcheck')}
          trailing={vcCriticalLeft(s) ? <Pill tone="orange">{vcDone(s)}/{VCHECK.length}</Pill> : <Pill tone="green">Đạt</Pill>} />
        <Cell icon={Wrench} tint="var(--gray)" title="Báo sự cố / hỏng xe" chevron onClick={() => openSheet('incident')} />
        <Cell icon={CalendarDays} tint="var(--purple)" title="Xin nghỉ phép" chevron onClick={() => openSheet('leave')} />
        <Cell icon={FileText} tint="var(--teal)" title="Giấy tờ & chứng chỉ" chevron onClick={() => nav('/learn?tab=certs')} />
        <Cell icon={Phone} tint="var(--blue)" title="Gọi điều độ" subtitle={DRIVER.dispatcher.name} chevron href={`tel:${DRIVER.dispatcher.phone}`} />
        <Cell icon={Siren} tint="var(--red)" title="SOS khẩn cấp" chevron onClick={() => openSheet('sos')} />
      </Group>

      {s.requests.length > 0 && (
        <Group header="Yêu cầu đã gửi">
          {[...s.requests].reverse().map(r => (
            <Cell key={r.id} icon={r.kind === 'incident' || r.kind === 'sos' ? TriangleAlert : FileText} tint={REQ[r.kind].c}
              title={r.title} subtitle={r.response ? `Phản hồi: ${r.response}` : `${REQ[r.kind].t} · ${r.detail}`}
              trailing={<Pill tone={RST[r.status ?? 'new'].tone}>{RST[r.status ?? 'new'].t}</Pill>} />
          ))}
        </Group>
      )}

      <Group header="Cài đặt" footer="Chế độ đang lái tạm khóa mọi thao tác nhập liệu để bạn tập trung lái xe an toàn.">
        <Cell icon={Moon} tint="var(--indigo)" title="Giao diện"
          trailing={<Segmented small value={s.settings.theme} onChange={t => setS('theme', t)} options={[['auto', 'Tự động'], ['light', 'Sáng'], ['dark', 'Tối']]} />} />
        <Cell icon={Bell} tint="var(--red)" title="Thông báo đẩy" trailing={<Switch on={s.settings.push} onChange={x => setS('push', x)} label="Thông báo đẩy" />} />
        <Cell icon={Truck} tint="var(--orange)" title="Chế độ đang lái" trailing={<Switch on={s.settings.driving} onChange={x => setS('driving', x)} label="Chế độ đang lái" />} />
      </Group>

      <Group footer="DriverOS 1.0 · dữ liệu lưu trên Supabase. Đặt lại sẽ xóa thay đổi của bạn và tạo lại bộ dữ liệu mẫu.">
        <Cell icon={KeyRound} tint="var(--blue)" title="Đổi mật khẩu" chevron onClick={() => openSheet('password')} />
        <Cell icon={RotateCcw} tint="var(--gray)" title="Đặt lại dữ liệu demo" tone="blue" onClick={doReset} />
        <Cell icon={LogOut} tint="var(--red)" title="Đăng xuất" subtitle={DRIVER.email} tone="red" onClick={doSignOut} />
      </Group>
    </Screen>
  );
}
