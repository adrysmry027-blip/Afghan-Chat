import { getCallReadiness } from "./callService";

export default function CallScreen({ session, onClose }) {
  const readiness = getCallReadiness();
  if (!session) return null;

  return (
    <div className="call-overlay" role="dialog" aria-modal="true" aria-labelledby="call-title">
      <section className="call-panel">
        <div className="call-symbol">{session.media === "video" ? "▣" : "☎"}</div>
        <p className="call-eyebrow">افغان چت · بخش تماس</p>
        <h2 id="call-title">{session.contact}</h2>
        <p className="call-mode">{session.media === "video" ? "تماس تصویری" : "تماس صوتی"}</p>
        <div className="call-status"><span className="status-dot" /> آماده‌سازی تماس</div>
        <div className="call-disabled-note">
          <strong>تماس واقعی هنوز وصل نیست</strong>
          <p>این صفحه برای آماده‌سازی رابط تماس است. فعلاً هیچ زنگی زده نمی‌شود و میکروفون یا کمره فعال نمی‌گردد.</p>
        </div>
        <div className="call-checks">
          <span>سرور تماس: {readiness.signalingReady ? "آماده" : "وصل نشده"}</span>
          <span>صوت: {readiness.voiceReady ? "آماده" : "غیرفعال"}</span>
          <span>تصویر: {readiness.videoReady ? "آماده" : "غیرفعال"}</span>
        </div>
        <button className="call-close" type="button" onClick={onClose}>بستن صفحه تماس</button>
      </section>
    </div>
  );
}
