import { useRef, useState } from "react";
import CallScreen from "./calls/CallScreen";
import { createCallSession } from "./calls/callService";

const demoChats = [
  { id: 1, name: "احمد", message: "سلام، خوبی؟", time: "۹:۳۰", unread: 2, color: "green" },
  { id: 2, name: "فاطمه", message: "عکس را فرستادم", time: "دیروز", unread: 0, color: "blue" },
  { id: 3, name: "گروه خانواده", message: "محمد: تشکر", time: "دیروز", unread: 0, color: "orange" }
];

export default function App() {
  const [page, setPage] = useState("chats");
  const [active, setActive] = useState(demoChats[0]);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, from: "them", text: "سلام! به افغان چت خوش آمدی." },
    { id: 2, from: "me", text: "سلام، تشکر!" }
  ]);
  const [notice, setNotice] = useState("");
  const filePicker = useRef(null);
  const recorder = useRef(null);
  const [recording, setRecording] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [myStatuses, setMyStatuses] = useState([]);
  const [callSession, setCallSession] = useState(null);
  const [displayName, setDisplayName] = useState("حساب من");
  const [about, setAbout] = useState("خوش آمدی");
  const [language, setLanguage] = useState("دری");
  const [theme, setTheme] = useState("روشن");
  const [privacy, setPrivacy] = useState({ lastSeen: true, photo: true, receipts: true, groups: false });
  const [notifications, setNotifications] = useState({ messages: true, groups: true, preview: true, vibration: false });

  function openCall(contact, media) {
    setCallSession(createCallSession({ contact, media }));
  }

  function sendMessage(event) {
    event.preventDefault();
    const value = message.trim();
    if (!value) return;
    setMessages((items) => [...items, { id: Date.now(), from: "me", text: value }]);
    setMessage("");
  }

  function addAttachment(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "file";
    setMessages((items) => [...items, { id: Date.now(), from: "me", type: kind, url, name: file.name }]);
    event.target.value = "";
  }

  async function toggleRecording() {
    if (recording && recorder.current) { recorder.current.stop(); setRecording(false); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setNotice("ضبط صدا در این مرورگر پشتیبانی نمی‌شود."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      const chunks = [];
      media.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      media.onstop = () => {
        const blob = new Blob(chunks, { type: media.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setMessages((items) => [...items, { id: Date.now(), from: "me", type: "audio", url }]);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.current = media; media.start(); setRecording(true);
    } catch { setNotice("برای ضبط پیام صوتی، اجازهٔ استفاده از میکروفون را بده."); }
  }

  function findFriend(event) {
    event.preventDefault();
    const value = phone.trim();
    if (!value) { setNotice("لطفاً شماره را با کود کشور وارد کن؛ مانند +93700000000"); return; }
    setNotice("جست‌وجوی واقعی شماره هنوز به سرور و پایگاه اطلاعاتی وصل نشده است. این بخش فعلاً ظاهر و فرم آزمایشی دارد.");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <header className="brand"><div className="brand-mark">اچ</div><div><h1>افغان چت</h1><p>Afghan Chat</p></div></header>
        <div className="profile"><div className="avatar self">ع</div><div><strong>{displayName}</strong><span>{about}</span></div></div>
        <div className="side-actions">
          <button className={page === "chats" ? "side-action active" : "side-action"} onClick={() => setPage("chats")}>گفتگوها</button>
          <button className={page === "friends" ? "side-action active" : "side-action"} onClick={() => setPage("friends")}>دوستان</button>
          <button className={page === "status" ? "side-action active" : "side-action"} onClick={() => setPage("status")}>وضعیت</button>
          <button className={page === "calls" ? "side-action active" : "side-action"} onClick={() => setPage("calls")}>تماس‌ها</button>
          <button className={page === "settings" ? "side-action active" : "side-action"} onClick={() => setPage("settings")}>تنظیمات</button>
        </div>
        {page === "chats" && <><div className="section-title">گفتگوها <span>۳</span></div><nav className="chat-list" aria-label="گفتگوها">{demoChats.map((chat) => <button className={active.id === chat.id ? "chat-item selected" : "chat-item"} key={chat.id} onClick={() => setActive(chat)}><div className={"avatar " + chat.color}>{chat.name.slice(0, 1)}</div><div className="chat-copy"><strong>{chat.name}</strong><span>{chat.message}</span></div><div className="chat-meta"><time>{chat.time}</time>{chat.unread > 0 && <i>{chat.unread}</i>}</div></button>)}</nav></>}
        <div className="sidebar-note">نسخهٔ آزمایشی افغان چت</div>
      </aside>
      {page === "chats" ? <section className="conversation">
        <header className="conversation-head"><div className="avatar green">{active.name.slice(0, 1)}</div><div className="contact-title"><strong>{active.name}</strong><span>گفتگوی آزمایشی</span></div><div className="call-actions"><button type="button" title="تماس صوتی" onClick={() => openCall(active.name, "voice")}>☎</button><button type="button" title="تماس تصویری" onClick={() => openCall(active.name, "video")}>▣</button></div><button className="more" aria-label="گزینه‌ها">•••</button></header>
        <div className="messages"><div className="date-chip">امروز</div>{messages.map((item) => <div className={"bubble-row " + (item.from === "me" ? "mine" : "")} key={item.id}><div className="bubble">{item.type === "image" ? <img className="message-media" src={item.url} alt="عکس فرستاده‌شده" /> : item.type === "video" ? <video className="message-media" src={item.url} controls /> : item.type === "audio" ? <audio src={item.url} controls /> : item.type === "file" ? <a href={item.url} download={item.name}>{item.name}</a> : item.text}<small>{item.from === "me" ? "در همین گوشی" : "دریافت شد"}</small></div>{item.from === "me" && <button className="delete" title="حذف پیام" onClick={() => setMessages((all) => all.filter((m) => m.id !== item.id))}>حذف</button>}</div>)}</div>
        <form className="composer" onSubmit={sendMessage}><input ref={filePicker} className="hidden-file" type="file" accept="image/*,video/*,audio/*" onChange={addAttachment} /><button className="attach" type="button" title="فرستادن عکس یا ویدیو" onClick={() => filePicker.current?.click()}>＋</button><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="پیامت را بنویس..." aria-label="متن پیام" /><button className={recording ? "record recording" : "record"} type="button" title={recording ? "پایان ضبط" : "ضبط پیام صوتی"} onClick={toggleRecording}>{recording ? "■" : "🎙"}</button><button className="send" type="submit">ارسال</button></form>
        {notice && <button className="notice chat-notice" onClick={() => setNotice("")}>{notice}  ✕</button>}<p className="demo-warning">عکس، ویدیو و صدای ضبط‌شده فعلاً فقط در همین گوشی نمایش داده می‌شود؛ برای ارسال واقعی به دیگران سرور لازم است.</p>
      </section> : page === "status" ? <section className="content-page"><h2>وضعیت‌ها</h2><p>عکس، ویدیو یا نوشته‌ات را به مدت ۲۴ ساعت با دوستان شریک کن.</p><form className="friend-form" onSubmit={(e) => {e.preventDefault(); if(statusText.trim()){setMyStatuses((items)=>[statusText.trim(),...items]);setStatusText("");}}}><label htmlFor="status-text">نوشتن وضعیت من</label><textarea id="status-text" value={statusText} onChange={(e)=>setStatusText(e.target.value)} placeholder="امروز چه خبر؟" rows="3"/><button className="send" type="submit">انتشار آزمایشی وضعیت</button></form><div className="status-list"><h3>وضعیت من</h3>{myStatuses.length ? myStatuses.map((s,i)=><div className="status-card" key={i}><strong>من · همین حالا</strong><p>{s}</p></div>) : <div className="status-card">هنوز وضعیتی منتشر نکرده‌ای.</div>}<h3>وضعیت دوستان</h3><div className="status-card"><b>احمد</b><p>الحمدلله برای یک روز تازه</p></div><div className="status-card"><b>فاطمه</b><p>یک روز زیبا و پر از امید 🌿</p></div></div><p className="demo-warning">وضعیت‌ها فعلاً آزمایشی و فقط در همین صفحه هستند؛ حذف خودکار ۲۴ ساعته بعداً با سرور فعال می‌شود.</p></section> : page === "calls" ? <section className="content-page"><h2>تماس‌ها</h2><p>تماس‌های صوتی و تصویری اخیر.</p><div className="settings-list"><div className="call-row"><span>احمد · تماس صوتی</span><small>امروز، ۱۰:۳۰</small><button onClick={()=>openCall("احمد", "voice")}>☎ آماده‌سازی</button></div><div className="call-row"><span>فاطمه · تماس تصویری</span><small>دیروز، ۱۸:۴۵</small><button onClick={()=>openCall("فاطمه", "video")}>▣ آماده‌سازی</button></div></div>{notice && <p className="notice">{notice}</p>}<p className="demo-warning">فهرست تماس‌ها نمونه است؛ تماس واقعی هنوز فعال نیست.</p></section> : page === "friends" ? <section className="content-page">
        <h2>افزودن دوستان</h2><p>شماره دوستت را با کود کشور وارد کن تا حساب افغان چت او جست‌وجو شود.</p>
        <form className="friend-form" onSubmit={findFriend}><label htmlFor="friend-phone">شماره تلفن</label><input id="friend-phone" dir="ltr" value={phone} onChange={(e) => {setPhone(e.target.value);setNotice("");}} placeholder="+93700000000" /><button className="send" type="submit">جست‌وجوی دوست</button></form>
        <div className="help-card"><strong>دوستت افغان چت ندارد؟</strong><p>می‌توانی بعداً لینک دعوت را برایش بفرستی.</p></div>
        {notice && <p className="notice">{notice}</p>}
        <p className="demo-warning">جست‌وجوی واقعی نیازمند سرور و اتصال امن به شماره‌های ثبت‌شده است.</p>
      </section> : <section className="content-page settings-page"><h2>تنظیمات</h2><p>حساب و برنامهٔ افغان چت را مدیریت کن.</p>
        <div className="settings-group"><h3>پروفایل من</h3><label>نام نمایشی<input value={displayName} onChange={e=>setDisplayName(e.target.value)} /></label><label>دربارهٔ من<input value={about} onChange={e=>setAbout(e.target.value)} /></label><small>تغییرات فعلاً در همین گوشی نمایش داده می‌شود.</small></div>
        <div className="settings-group"><h3>حریم خصوصی</h3>
          <label className="setting-toggle"><span>نمایش آخرین بازدید</span><input type="checkbox" checked={privacy.lastSeen} onChange={e=>setPrivacy(p=>({...p,lastSeen:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>نمایش عکس پروفایل</span><input type="checkbox" checked={privacy.photo} onChange={e=>setPrivacy(p=>({...p,photo:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>رسید خواندن پیام</span><input type="checkbox" checked={privacy.receipts} onChange={e=>setPrivacy(p=>({...p,receipts:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>اجازه افزودن به گروه‌ها</span><input type="checkbox" checked={privacy.groups} onChange={e=>setPrivacy(p=>({...p,groups:e.target.checked}))}/></label>
        </div>
        <div className="settings-group"><h3>اعلان‌ها</h3>
          <label className="setting-toggle"><span>اعلان پیام‌ها</span><input type="checkbox" checked={notifications.messages} onChange={e=>setNotifications(p=>({...p,messages:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>اعلان گروه‌ها</span><input type="checkbox" checked={notifications.groups} onChange={e=>setNotifications(p=>({...p,groups:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>نمایش متن پیام</span><input type="checkbox" checked={notifications.preview} onChange={e=>setNotifications(p=>({...p,preview:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>لرزش</span><input type="checkbox" checked={notifications.vibration} onChange={e=>setNotifications(p=>({...p,vibration:e.target.checked}))}/></label>
        </div>
        <div className="settings-group"><h3>زبان و ظاهر</h3><label>زبان برنامه<select value={language} onChange={e=>setLanguage(e.target.value)}><option>دری</option><option>پشتو</option><option>English</option></select></label><label>رنگ برنامه<select value={theme} onChange={e=>setTheme(e.target.value)}><option>روشن</option><option>تاریک</option><option>مطابق گوشی</option></select></label><p className="setting-hint">انتخاب‌ها ذخیرهٔ آزمایشی هستند؛ پشتیبانی کامل چندزبانه و حالت تاریک در مرحلهٔ بعد تکمیل می‌شود.</p></div>
        <div className="settings-group"><h3>حافظه و اینترنت</h3><p>دانلود خودکار رسانه و پشتیبان‌گیری پس از راه‌اندازی سرور فعال می‌شود.</p></div>
        <p className="demo-warning">تنظیمات حساب و حریم خصوصی فعلاً روی سرور ذخیره نمی‌شوند.</p></section>}
      {callSession && <CallScreen session={callSession} onClose={() => setCallSession(null)} />}
    </main>
  );
}
