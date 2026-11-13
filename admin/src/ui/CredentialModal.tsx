import { useState } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';
import type { Credential } from '../lib/accounts';
import { Btn, Modal } from './kit';

/** Hiện thông tin đăng nhập vừa tạo — mật khẩu chỉ hiện một lần */
export function CredentialModal({ cred, title, onClose }: { cred: Credential; title: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = `Đăng nhập: ${cred.login}\nMật khẩu: ${cred.password}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { /* trình duyệt chặn clipboard */ }
  };
  return (
    <Modal title={title} onClose={onClose}
      footer={<><Btn icon={copied ? Check : Copy} onClick={copy}>{copied ? 'Đã sao chép' : 'Sao chép'}</Btn><Btn kind="primary" onClick={onClose}>Xong</Btn></>}>
      <div className="cred">
        <KeyRound size={22} color="var(--orange)" />
        <dl className="kv" style={{ flex: 1 }}>
          <dt>Đăng nhập</dt><dd className="b">{cred.login}</dd>
          <dt>Mật khẩu</dt><dd><span className="pw">{cred.password}</span></dd>
        </dl>
      </div>
      {cred.reused && <div className="muted small" style={{ marginTop: 10 }}>Email này đã có tài khoản từ trước — đã đặt mật khẩu mới và kích hoạt lại.</div>}
      <div className="note" style={{ marginTop: 12 }}>Mật khẩu chỉ hiện một lần. Hãy gửi cho người dùng qua kênh riêng và nhắc họ đổi mật khẩu sau khi đăng nhập.</div>
    </Modal>
  );
}
