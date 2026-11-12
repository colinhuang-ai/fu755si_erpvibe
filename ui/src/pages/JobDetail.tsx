import { useParams } from 'react-router-dom';
import { CircleCheck, Container, MapPin, Navigation, Phone, Truck, User } from 'lucide-react';
import { etaInfo, TripSteps } from '../components/common';
import { LOSS_LIMIT } from '../data/mock';
import { MOCK_TODAY } from '../lib/clock';
import { isBulk, jobStatus, lossOf, vcCriticalLeft } from '../lib/domain';
import { dm, dow, fmt, money, pct, sum, WD } from '../lib/format';
import { useStore } from '../store';
import type { Job } from '../types';
import { Btn, Cell, Empty, Group, Pill, RCheck, Screen } from '../ui/kit';
import { useUI } from '../ui/overlay';

const NEXT = ['Nhận chuyến', 'Bắt đầu lấy hàng', 'Ghi nhận nạp & xuất bến', 'Đã tới điểm giao', 'Xả hàng & xác nhận'];

export default function JobDetail() {
  const { id } = useParams();
  const { s, update } = useStore();
  const { openSheet, confirm, toast } = useUI();
  const j = s.jobs.find(x => x.id === id);

  if (!j) {
    return (
      <Screen title="Chuyến" large={false} back={{ label: 'Công việc', to: '/jobs' }}>
        <Empty icon={Truck} title="Không tìm thấy chuyến" />
      </Screen>
    );
  }
  const st = jobStatus(j);
  const eta = etaInfo(j);
  const loss = lossOf(j);
  const unit = isBulk(j) ? 'L' : 'thùng';
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(j.to.addr);
  const set = (fn: (d: Job) => void) => update(d => { const x = d.jobs.find(y => y.id === j.id); if (x) fn(x); });

  const advance = async () => {
    if (j.status === 0) {
      set(x => { x.status = 1; });
      return toast(`Đã nhận chuyến ${j.id}`);
    }
    if (j.status === 1) {
      const left = vcCriticalLeft(s);
      if (left > 0) {
        const v = await confirm({
          title: 'Chưa kiểm tra xe',
          message: `Còn ${left} hạng mục bắt buộc trong checklist trước chuyến chưa đạt. Không thể bắt đầu lấy hàng.`,
          actions: [{ label: 'Để sau', value: 'cancel', style: 'cancel' }, { label: 'Kiểm tra ngay', value: 'go' }]
        });
        if (v === 'go') openSheet('vcheck');
        return;
      }
      set(x => { x.status = 2; });
      return toast(`Bắt đầu lấy hàng tại ${j.from.name}`, 'info');
    }
    if (j.status === 2) {
      const left = j.checks.filter(c => c.ph === 'pickup' && !c.done).length;
      if (left) {
        return confirm({ title: 'Chưa hoàn tất kiểm tra tại kho', message: `Còn ${left} mục kiểm tra tại kho chưa đánh dấu.` });
      }
      return openSheet('load', { id: j.id, mode: 'load' });
    }
    if (j.status === 3) {
      set(x => { x.status = 4; });
      return toast('Đã tới điểm giao · nhớ nối dây tiếp địa', 'info');
    }
    if (j.status === 4) {
      const left = j.checks.filter(c => c.ph === 'deliver' && !c.sign && !c.done).length;
      if (left) {
        return confirm({ title: 'Chưa hoàn tất kiểm tra tại điểm giao', message: `Còn ${left} mục cần đánh dấu trước khi xả hàng.` });
      }
      return openSheet('load', { id: j.id, mode: 'unload' });
    }
  };

  const toggle = (i: number) => {
    if (j.status === 5 || j.checks[i].sign) return;
    set(x => { x.checks[i].done = !x.checks[i].done; });
  };

  const checks = (ph: 'pickup' | 'deliver') => j.checks.map((c, i) => c.ph !== ph ? null : (
    <Cell key={i} sepLeft={52} leading={<RCheck on={c.done} />} title={c.t}
      subtitle={c.sign && !c.done ? 'Tự động hoàn thành khi người nhận xác nhận' : undefined}
      onClick={c.sign ? undefined : () => toggle(i)} />
  ));

  const action = j.status < 5 && !j.rejected ? (
    <>
      {j.status === 0 && <Btn kind="gray" onClick={() => openSheet('reject', { id: j.id })} style={{ flex: '0 0 auto' }}>Từ chối</Btn>}
      <Btn block onClick={advance}>{NEXT[j.status]}</Btn>
    </>
  ) : undefined;

  return (
    <Screen title={j.id} large={false} back={{ label: 'Công việc', to: '/jobs' }} action={action}>
      <div className="detail-head">
        <div className="row" style={{ gap: 6 }}>
          <Pill tone={st.tone}>{st.t}</Pill>
          {eta && <Pill tone={eta.tone}>{eta.t}</Pill>}
          {j.lateMin > 0 && <Pill tone="red">Giao trễ {j.lateMin} phút</Pill>}
        </div>
        <h2>{j.to.name}</h2>
        <div className="sum-sub">{WD[dow(j.date)]}, {dm(j.date)}{j.date === MOCK_TODAY ? ' (hôm nay)' : ''} · Hẹn giao {j.to.eta}</div>
      </div>

      {j.rejected ? (
        <Group footer="Điều phối sẽ phân công lại chuyến này.">
          <Cell title="Bạn đã từ chối chuyến" subtitle={`${j.rejected.reason}${j.rejected.note ? ' · ' + j.rejected.note : ''}`} tone="red" />
        </Group>
      ) : (
        <div className="card mx" style={{ marginBottom: 28 }}><TripSteps status={j.status} /></div>
      )}

      {j.status === 5 && (
        <Group>
          <Cell icon={CircleCheck} tint="var(--green)" title="Đã hoàn tất chuyến" subtitle={`Xác nhận bởi ${j.confirmBy ?? 'người nhận'} · phụ cấp ${money(j.fee)}`} />
        </Group>
      )}

      <Group header={`Lộ trình · ${j.km} km`}>
        <Cell icon={Container} tint="var(--blue)" title={j.from.name} subtitle={j.from.addr} detail={j.from.time} />
        <Cell icon={MapPin} tint="var(--orange)" title={j.to.name} subtitle={j.to.addr} detail={j.to.eta} />
        <Cell icon={User} tint="var(--gray)" title={j.to.who} subtitle="Người nhận hàng"
          trailing={<a className="circle-btn" href={`tel:${j.to.phone}`} aria-label="Gọi người nhận"><Phone size={17} strokeWidth={2.4} /></a>} />
        <Cell icon={Navigation} tint="var(--blue)" title="Chỉ đường tới điểm giao" tone="blue" href={mapUrl} chevron />
      </Group>

      <Group header={`Hàng hóa · ${fmt(sum(j.cargo, c => c.qty))} ${unit}`}
        footer={loss ? `Hao hụt ${fmt(loss.loss)} L (${pct(loss.rate, 2)}) · ngưỡng cho phép ${pct(LOSS_LIMIT)}${j.deviationNote ? ' · ' + j.deviationNote : ''}` : undefined}
        footerTone={loss?.over ? 'red' : undefined}>
        {j.cargo.map((c, i) => (
          <Cell key={i} title={c.item}
            subtitle={[c.label, c.loaded != null && `nạp ${fmt(c.loaded)}`, c.delivered != null && `xả ${fmt(c.delivered)}`].filter(Boolean).join(' · ')}
            detail={`${fmt(c.qty)} ${c.unit}`} />
        ))}
      </Group>

      <Group header="Kiểm tra tại kho">{checks('pickup')}</Group>
      <Group header="Kiểm tra tại điểm giao">{checks('deliver')}</Group>

      <Group header="Thông tin chuyến" footer={j.note}>
        <Cell title="Phương tiện" detail={j.vehicle.split(' · ')[0]} />
        {j.seal && <Cell title="Số chì niêm phong" detail={j.seal} />}
        <Cell title="Phụ cấp chuyến" detail={money(j.fee)} />
      </Group>
    </Screen>
  );
}
