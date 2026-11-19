import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import CallScreen from "./calls/CallScreen";
import { createCallSession } from "./calls/callService";

const demoChats = [
  { id: 1, name: "احمد", message: "سلام، خوبی؟", time: "۹:۳۰", unread: 2, color: "green", photo: "https://i.pravatar.cc/120?img=12" },
  { id: 2, name: "فاطمه", message: "عکس را فرستادم", time: "دیروز", unread: 0, color: "blue", photo: "https://i.pravatar.cc/120?img=47" },
  { id: 3, name: "گروه خانواده", message: "محمد: تشکر", time: "دیروز", unread: 0, color: "orange", photo: "https://i.pravatar.cc/120?img=_group" }
];

export default function App() {
  const [page, setPage] = useState("welcome");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const confirmation = useRef(null);
  const recaptcha = useRef(null);
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
  const [chatPrefs,setChatPrefs] = useState({ wallpaper:"پیش‌فرض",fontSize:"متوسط",saveMedia:false,backup:true });
  const [dataPrefs,setDataPrefs] = useState({ wifi:true,mobile:false,saver:false });
  const [securityPrefs,setSecurityPrefs] = useState({ twoStep:false,showSecurity:true });
  const [groups, setGroups] = useState([{id:1,name:"گروه خانواده",members:["من","احمد","فاطمه"]}]);
  const [groupName,setGroupName] = useState("");
  const [groupMember,setGroupMember] = useState("");
  const [statusMedia,setStatusMedia] = useState(null);
  const [statusAudience,setStatusAudience] = useState("همهٔ دوستان");
  const [statusReplies,setStatusReplies] = useState({});
  const [loginCountry,setLoginCountry] = useState("+93");
  const [loginPhone,setLoginPhone] = useState("");
  const [loginCode,setLoginCode] = useState("");
  const [loginStep,setLoginStep] = useState(false);
  const [loggedIn,setLoggedIn] = useState(false);
  const [profileImage,setProfileImage] = useState("");
  const statusPicker = useRef(null);
  const avatarPicker = useRef(null);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setAuthUser(user);
    setLoggedIn(Boolean(user));
    if (user) { setDisplayName(user.displayName || user.phoneNumber || "کاربر افغان چت"); setPage("chats"); }
  }), []);

  async function loginWithGoogle() {
    setAuthBusy(true);
    try { await signInWithPopup(auth, googleProvider); setNotice(""); }
    catch (error) { const messages = { "auth/network-request-failed": "اتصال به گوگل برقرار نشد. اینترنت گوشی را بررسی کن و اگر شبکه دسترسی به گوگل را محدود کرده، با اینترنت یا VPN پایدار دوباره تلاش کن.", "auth/popup-blocked": "پنجرهٔ ورود گوگل باز نشد. برنامه را در مرورگر اصلی باز کن و دوباره تلاش کن.", "auth/unauthorized-domain": "دامنهٔ برنامه در Firebase برای ورود گوگل مجاز نشده است؛ تنظیمات Firebase باید اصلاح شود.", "auth/operation-not-allowed": "ورود با گوگل در Firebase فعال نیست؛ باید از بخش Authentication فعال شود." }; setNotice(messages[error.code] || `ورود گوگل ناموفق شد: ${error.message}`); }
    finally { setAuthBusy(false); }
  }

  async function requestPhoneCode() {
    const digits = loginPhone.replace(/\\D/g, "");
    if (!digits) { setNotice("شماره تلفن را وارد کن."); return; }
    const fullPhone = `${loginCountry}${digits}`;
    setAuthBusy(true);
    try {
      // Dispose of any previous widget before binding a new verifier to the same DOM element.
      if (recaptcha.current) {
        recaptcha.current.clear();
        recaptcha.current = null;
      }
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) throw new Error("بخش تأیید امنیتی پیدا نشد. صفحه را دوباره باز کن.");
      recaptchaContainer.replaceChildren();
      const verifier = new RecaptchaVerifier(auth, recaptchaContainer, { size: "invisible" });
      recaptcha.current = verifier;
      await verifier.render();
      confirmation.current = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setLoginStep(true);
      setNotice("کد تأیید به شماره‌ات پیامک شد.");
    } catch (error) {
      confirmation.current = null;
      try { recaptcha.current?.clear(); } catch {}
      recaptcha.current = null;
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (recaptchaContainer) recaptchaContainer.replaceChildren();
      const authErrors = { "auth/network-request-failed": "اتصال به سرور تأیید شماره برقرار نشد. اینترنت گوشی را بررسی کن؛ اگر شبکه دسترسی به Firebase/Google را بسته، با اینترنت یا VPN پایدار دوباره امتحان کن.", "auth/invalid-phone-number": "شماره تلفن درست نیست؛ شماره را بدون صفر اول و با کشور درست وارد کن.", "auth/too-many-requests": "درخواست‌های زیادی فرستاده شده؛ کمی صبر کن و بعد دوباره تلاش کن.", "auth/operation-not-allowed": "ورود با شماره تلفن در Firebase فعال نیست؛ باید از بخش Authentication فعال شود.", "auth/unauthorized-domain": "دامنهٔ برنامه در Firebase مجاز نشده است." }; setNotice(authErrors[error.code] || `ارسال کد انجام نشد: ${error.message}`);
    } finally { setAuthBusy(false); }
  }

  async function verifyPhoneCode() {
    if (!confirmation.current || !loginCode.trim()) { setNotice("کد پیامک‌شده را وارد کن."); return; }
    setAuthBusy(true);
    try { await confirmation.current.confirm(loginCode.trim()); setNotice(""); }
    catch (error) { setNotice(`کد تأیید درست نیست: ${error.message}`); }
    finally { setAuthBusy(false); }
  }

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

  // Never render chats, settings, or navigation until Firebase confirms a signed-in user.
  if (!authUser) {
    return (
      <main className="app-shell">
        <section className="welcome-screen" dir="rtl">
          <div className="welcome-card">
            <div className="welcome-logo"><img src="/afghan-chat-logo.svg" alt="لوگوی افغان چت" /></div>
            <p className="welcome-kicker">ارتباط نزدیک‌تر، با افغان‌چت</p>
            <h1>خوش آمدید به افغان چت</h1>
            <p className="welcome-intro">برای ورود، یکی از روش‌های تأیید هویت را انتخاب کنید.</p>
            <button className="google-signin" type="button" onClick={loginWithGoogle} disabled={authBusy}>
              <span className="google-g">G</span><span>{authBusy ? "در حال اتصال..." : "ورود با حساب گوگل"}</span>
            </button>
            <div className="welcome-divider"><span>یا</span></div>
            <label className="login-label">کشور و پیش‌شماره</label>
            <select value={loginCountry} onChange={e=>setLoginCountry(e.target.value)} aria-label="کشور">
              <option value="+93">افغانستان ‎+93</option>
              <option value="+98">ایران ‎+98</option>
            </select>
            <label className="login-label" htmlFor="login-phone">شماره تلفن</label>
            <input id="login-phone" dir="ltr" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} placeholder="شماره تلفن خود را وارد کنید" />
            {loginStep && <>
              <label className="login-label" htmlFor="login-code">کد تأیید پیامک</label>
              <input id="login-code" dir="ltr" inputMode="numeric" autoComplete="one-time-code" value={loginCode} onChange={e=>setLoginCode(e.target.value)} placeholder="کد شش‌رقمی" />
            </>}
            <div id="recaptcha-container"></div>
            <button className="phone-signin" type="button" onClick={loginStep ? verifyPhoneCode : requestPhoneCode} disabled={authBusy}>
              {authBusy ? "لطفاً صبر کنید..." : loginStep ? "تأیید کد و ورود" : "دریافت کد ورود"}
            </button>
            {notice && <p className="notice" role="alert">{notice}</p>}
            <p className="security-note">بدون تأیید حساب گوگل یا کد پیامکی، ورود به افغان‌چت ممکن نیست. رمز جیمیل را فقط در صفحهٔ رسمی گوگل وارد کنید؛ افغان‌چت آن را دریافت نمی‌کند.</p>
            <small>Afghan Chat</small>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={(theme === "تاریک" ? "app-shell dark-theme" : theme === "مطابق گوشی" ? "app-shell system-theme" : "app-shell") + (mobileChatOpen ? " mobile-chat-open" : "")}>
      {page === "welcome" ? <section className="welcome-screen" dir="rtl">
        <div className="welcome-card">
          <div className="welcome-logo"><img src="/afghan-chat-logo.svg" alt="لوگوی افغان چت" /></div>
          <p className="welcome-kicker">ارتباط نزدیک‌تر، با افغان‌چت</p>
          <h1>خوش آمدید به افغان چت</h1>
          <p className="welcome-intro">برای ادامه، یکی از روش‌های ورود را انتخاب کنید.</p>
          <button className="google-signin" type="button" onClick={loginWithGoogle} disabled={authBusy}><span className="google-g">G</span><span>{authBusy ? "در حال اتصال..." : "ورود با گوگل"}</span></button>
          <button className="phone-signin" type="button" onClick={()=>setPage("account")}><span>☎</span><span>ورود با شماره تلفن</span></button>
          <div className="welcome-divider"><span>ورود آسان و امن</span></div>
          <p className="welcome-foot">با ورود به افغان‌چت، می‌توانی با دوستان و خانواده‌ات در ارتباط باشی.</p>
          <small>نسخهٔ آزمایشی · Afghan Chat</small>
        </div>
      </section> : page === "google-login" ? <section className="welcome-screen" dir="rtl"><div className="welcome-card login-card"><button className="back-link" type="button" onClick={()=>setPage("welcome")}>← بازگشت</button><div className="google-g large">G</div><h1>ورود امن با گوگل</h1><p className="welcome-intro">برای ورود، حساب گوگل را در صفحهٔ رسمی انتخاب کن.</p><button className="send" type="button" disabled={authBusy} onClick={loginWithGoogle}>{authBusy ? "در حال اتصال..." : "ادامه با Google"}</button><p className="security-note">رمز جیمیل را در افغان‌چت وارد نکن؛ تأیید هویت در صفحهٔ رسمی گوگل انجام می‌شود.</p>{notice && <p className="notice">{notice}</p>}</div></section>: null}
      {!["welcome","google-login"].includes(page) && <aside className="sidebar">
        <header className="brand"><div className="brand-mark"><img src="/afghan-chat-logo.svg" alt="لوگوی افغان چت" /></div><div><h1>افغان چت</h1><p>Afghan Chat</p></div></header>
        <div className="profile"><button className="avatar self avatar-button" type="button" onClick={()=>avatarPicker.current?.click()}>{profileImage ? <img src={profileImage} alt="عکس پروفایل"/> : <img src="/afghan-chat-logo.svg" alt="عکس پروفایل افغان چت"/>}</button><input ref={avatarPicker} className="hidden-file" type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)setProfileImage(URL.createObjectURL(file));}}/><div><strong>{displayName}</strong><span>{about}</span></div></div>
        <div className="side-actions">
          <button className={page === "chats" ? "side-action active" : "side-action"} onClick={() => {setPage("chats");setMobileChatOpen(false);}}>گفتگوها</button>
          <button className={page === "friends" ? "side-action active" : "side-action"} onClick={() => setPage("friends")}>دوستان</button>
          <button className={page === "status" ? "side-action active" : "side-action"} onClick={() => setPage("status")}>وضعیت</button>
          <button className={page === "calls" ? "side-action active" : "side-action"} onClick={() => setPage("calls")}>تماس‌ها</button>
          <button className={page === "groups" ? "side-action active" : "side-action"} onClick={() => setPage("groups")}>گروه‌ها</button>
          <button className={page === "account" ? "side-action active" : "side-action"} onClick={() => setPage("account")}>ورود</button>
          <button className={page === "settings" ? "side-action active" : "side-action"} onClick={() => setPage("settings")}>تنظیمات</button>
        </div>
        {page === "chats" && <><div className="section-title"><span>گفتگوها</span><button className="new-message" type="button" onClick={()=>setPage("friends")}>＋ پیام جدید</button></div><nav className="chat-list" aria-label="گفتگوها">{demoChats.map((chat) => <button className={active.id === chat.id ? "chat-item selected" : "chat-item"} key={chat.id} onClick={() => {setActive(chat);setMobileChatOpen(true);}}><div className={"avatar " + chat.color}>{chat.photo && <img src={chat.photo} alt={chat.name}/>}</div><div className="chat-copy"><strong>{chat.name}</strong><span>{chat.message}</span></div><div className="chat-meta"><time>{chat.time}</time>{chat.unread > 0 && <i>{chat.unread}</i>}</div></button>)}</nav></>}
        <div className="sidebar-note">نسخهٔ آزمایشی افغان چت</div>
      </aside>}
      {page === "chats" ? <section className="conversation">
        <header className="conversation-head"><button className="mobile-back" type="button" onClick={()=>setMobileChatOpen(false)} aria-label="بازگشت به گفتگوها">‹</button><div className="avatar green">{active.photo ? <img src={active.photo} alt={active.name}/> : active.name.slice(0, 1)}</div><div className="contact-title"><strong>{active.name}</strong><span>گفتگوی آزمایشی</span></div><div className="call-actions"><button type="button" title="تماس صوتی" onClick={() => openCall(active.name, "voice")}>☎</button><button type="button" title="تماس تصویری" onClick={() => openCall(active.name, "video")}>▣</button></div><button className="more" aria-label="گزینه‌ها">•••</button></header>
        <div className="messages"><div className="date-chip">امروز</div>{messages.map((item) => <div className={"bubble-row " + (item.from === "me" ? "mine" : "")} key={item.id}><div className="bubble">{item.type === "image" ? <img className="message-media" src={item.url} alt="عکس فرستاده‌شده" /> : item.type === "video" ? <video className="message-media" src={item.url} controls /> : item.type === "audio" ? <audio src={item.url} controls /> : item.type === "file" ? <a href={item.url} download={item.name}>{item.name}</a> : item.text}<small>{item.from === "me" ? "در همین گوشی" : "دریافت شد"}</small></div>{item.from === "me" && <button className="delete" title="حذف پیام" onClick={() => setMessages((all) => all.filter((m) => m.id !== item.id))}>حذف</button>}</div>)}</div>
        <form className="composer" onSubmit={sendMessage}><input ref={filePicker} className="hidden-file" type="file" accept="image/*,video/*,audio/*" onChange={addAttachment} /><button className="attach" type="button" title="فرستادن عکس یا ویدیو" onClick={() => filePicker.current?.click()}>＋</button><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="پیامت را بنویس..." aria-label="متن پیام" /><button className={recording ? "record recording" : "record"} type="button" title={recording ? "پایان ضبط" : "ضبط پیام صوتی"} onClick={toggleRecording}>{recording ? "■" : "🎙"}</button><button className="send" type="submit">ارسال</button></form>
        {notice && <button className="notice chat-notice" onClick={() => setNotice("")}>{notice}  ✕</button>}<p className="demo-warning">عکس، ویدیو و صدای ضبط‌شده فعلاً فقط در همین گوشی نمایش داده می‌شود؛ برای ارسال واقعی به دیگران سرور لازم است.</p>
      </section> : page === "status" ? <section className="content-page"><h2>وضعیت‌ها</h2><p>عکس، ویدیو یا نوشته‌ات را به مدت ۲۴ ساعت با دوستان شریک کن.</p>
        <input ref={statusPicker} className="hidden-file" type="file" accept="image/*,video/*" onChange={e=>{const file=e.target.files?.[0];if(file)setStatusMedia({url:URL.createObjectURL(file),type:file.type.startsWith("video/")?"video":"image",name:file.name});}}/>
        <form className="friend-form" onSubmit={e=>{e.preventDefault();if(statusText.trim()||statusMedia){setMyStatuses(items=>[{id:Date.now(),text:statusText.trim(),media:statusMedia,audience:statusAudience},...items]);setStatusText("");setStatusMedia(null);}}}>
          <label htmlFor="status-text">نوشتن وضعیت من</label><textarea id="status-text" value={statusText} onChange={e=>setStatusText(e.target.value)} placeholder="امروز چه خبر؟" rows="3"/>
          {statusMedia && <div className="status-preview">{statusMedia.type==="video"?<video src={statusMedia.url} controls/>:<img src={statusMedia.url} alt="پیش‌نمایش وضعیت"/>}<button type="button" onClick={()=>setStatusMedia(null)}>حذف رسانه</button></div>}
          <button className="secondary-action" type="button" onClick={()=>statusPicker.current?.click()}>＋ افزودن عکس یا ویدیو</button>
          <label>چه کسانی ببینند؟<select value={statusAudience} onChange={e=>setStatusAudience(e.target.value)}><option>همهٔ دوستان</option><option>فقط دوستان منتخب</option><option>فقط خودم</option></select></label>
          <button className="send" type="submit">انتشار آزمایشی وضعیت</button></form>
        <div className="status-list"><h3>وضعیت من</h3>{myStatuses.length?myStatuses.map((s,i)=><div className="status-card" key={s.id||i}><strong>من · همین حالا</strong>{s.text&&<p>{s.text}</p>}{s.media&&(s.media.type==="video"?<video className="status-media" src={s.media.url} controls/>:<img className="status-media" src={s.media.url} alt="وضعیت من"/>)}<small>مخاطبان: {s.audience||"همهٔ دوستان"}</small></div>):<div className="status-card">هنوز وضعیتی منتشر نکرده‌ای.</div>}
          <h3>وضعیت دوستان</h3>{[{name:"احمد",text:"الحمدلله برای یک روز تازه"},{name:"فاطمه",text:"یک روز زیبا و پر از امید 🌿"}].map((s,i)=><div className="status-card" key={s.name}><b>{s.name}</b><p>{s.text}</p><div className="status-tools"><button onClick={()=>setStatusReplies(r=>({...r,[s.name]:"❤️"}))}>❤️ واکنش</button><button onClick={()=>setStatusReplies(r=>({...r,[s.name]:r[s.name]==="پاسخ خصوصی"?"":"پاسخ خصوصی"}))}>پاسخ خصوصی</button></div>{statusReplies[s.name]&&<small>{statusReplies[s.name]} · فقط برای صاحب وضعیت</small>}</div>)}</div>
        <p className="demo-warning">وضعیت‌ها و واکنش‌ها آزمایشی‌اند و هنوز برای دیگران فرستاده نمی‌شوند.</p></section> : page === "calls" ? <section className="content-page"><h2>تماس‌ها</h2><p>تماس‌های صوتی و تصویری اخیر.</p><div className="settings-list"><div className="call-row"><span>احمد · تماس صوتی</span><small>امروز، ۱۰:۳۰</small><button onClick={()=>openCall("احمد", "voice")}>☎ آماده‌سازی</button></div><div className="call-row"><span>فاطمه · تماس تصویری</span><small>دیروز، ۱۸:۴۵</small><button onClick={()=>openCall("فاطمه", "video")}>▣ آماده‌سازی</button></div></div>{notice && <p className="notice">{notice}</p>}<p className="demo-warning">فهرست تماس‌ها نمونه است؛ تماس واقعی هنوز فعال نیست.</p></section> : page === "friends" ? <section className="content-page">
        <h2>افزودن دوستان</h2><p>شماره دوستت را با کود کشور وارد کن تا حساب افغان چت او جست‌وجو شود.</p>
        <form className="friend-form" onSubmit={findFriend}><label htmlFor="friend-phone">شماره تلفن</label><input id="friend-phone" dir="ltr" value={phone} onChange={(e) => {setPhone(e.target.value);setNotice("");}} placeholder="+93700000000" /><button className="send" type="submit">جست‌وجوی دوست</button></form>
        <div className="help-card"><strong>دوستت افغان چت ندارد؟</strong><p>می‌توانی بعداً لینک دعوت را برایش بفرستی.</p></div>
        {notice && <p className="notice">{notice}</p>}
        <p className="demo-warning">جست‌وجوی واقعی نیازمند سرور و اتصال امن به شماره‌های ثبت‌شده است.</p>
      </section> : page === "settings" ? <section className="content-page settings-page"><h2>تنظیمات</h2><p>حساب و برنامهٔ افغان چت را مدیریت کن.</p>
        <div className="settings-group"><h3>پروفایل من</h3><label>نام نمایشی<input value={displayName} onChange={e=>setDisplayName(e.target.value)} /></label><label>دربارهٔ من<input value={about} onChange={e=>setAbout(e.target.value)} /></label><small>تغییرات فعلاً در همین گوشی نمایش داده می‌شود.</small></div>
        <div className="settings-group"><h3>حریم خصوصی</h3>
          <label className="setting-toggle"><span>نمایش آخرین بازدید</span><input type="checkbox" checked={privacy.lastSeen} onChange={e=>setPrivacy(p=>({...p,lastSeen:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>نمایش عکس پروفایل</span><input type="checkbox" checked={privacy.photo} onChange={e=>setPrivacy(p=>({...p,photo:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>نمایش بخش دربارهٔ من</span><input type="checkbox" checked={privacy.about??true} onChange={e=>setPrivacy(p=>({...p,about:e.target.checked}))}/></label>
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
        <div className="settings-group"><h3>گفتگوها</h3>
          <label>پس‌زمینهٔ گفتگو<select value={chatPrefs.wallpaper} onChange={e=>setChatPrefs(p=>({...p,wallpaper:e.target.value}))}><option>پیش‌فرض</option><option>سبز روشن</option><option>ساده و سفید</option><option>تیره</option></select></label>
          <label>اندازهٔ نوشته<select value={chatPrefs.fontSize} onChange={e=>setChatPrefs(p=>({...p,fontSize:e.target.value}))}><option>کوچک</option><option>متوسط</option><option>بزرگ</option></select></label>
          <label className="setting-toggle"><span>ذخیرهٔ رسانه در گالری</span><input type="checkbox" checked={chatPrefs.saveMedia} onChange={e=>setChatPrefs(p=>({...p,saveMedia:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>پشتیبان‌گیری از گفتگوها</span><input type="checkbox" checked={chatPrefs.backup} onChange={e=>setChatPrefs(p=>({...p,backup:e.target.checked}))}/></label>
        </div>
        <div className="settings-group"><h3>حافظه و مصرف اینترنت</h3>
          <label className="setting-toggle"><span>دانلود خودکار با وای‌فای</span><input type="checkbox" checked={dataPrefs.wifi} onChange={e=>setDataPrefs(p=>({...p,wifi:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>دانلود خودکار با اینترنت موبایل</span><input type="checkbox" checked={dataPrefs.mobile} onChange={e=>setDataPrefs(p=>({...p,mobile:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>صرفه‌جویی در مصرف اینترنت</span><input type="checkbox" checked={dataPrefs.saver} onChange={e=>setDataPrefs(p=>({...p,saver:e.target.checked}))}/></label>
          <p className="setting-hint">این گزینه‌ها در نسخهٔ نمایشی هستند؛ دانلود خودکار و پشتیبان‌گیری واقعی پس از اتصال سرور فعال می‌شوند.</p>
        </div>
        <div className="settings-group"><h3>حساب و امنیت</h3>
          <label className="setting-toggle"><span>تأیید دومرحله‌ای</span><input type="checkbox" checked={securityPrefs.twoStep} onChange={e=>setSecurityPrefs(p=>({...p,twoStep:e.target.checked}))}/></label>
          <label className="setting-toggle"><span>نمایش هشدارهای امنیتی</span><input type="checkbox" checked={securityPrefs.showSecurity} onChange={e=>setSecurityPrefs(p=>({...p,showSecurity:e.target.checked}))}/></label>
          <p className="setting-hint">امنیت حساب و تأیید دومرحله‌ای پس از فعال‌شدن ورود واقعی تنظیم می‌شود.</p>
        </div>
        <div className="settings-group"><h3>کمک و دربارهٔ افغان چت</h3><p>نسخهٔ آزمایشی رابط کاربری افغان چت</p><p>برای پشتیبانی و گزارش مشکل، این بخش در نسخهٔ اصلی تکمیل می‌شود.</p><small>نسخه ۰.۱ · Afghan Chat</small></div>

        <p className="demo-warning">تنظیمات حساب و حریم خصوصی فعلاً روی سرور ذخیره نمی‌شوند.</p></section> : null}
      {page === "groups" && <section className="content-page"><h2>گروه‌ها</h2><p>گروه تازه بساز و اعضا را اضافه کن.</p><form className="friend-form" onSubmit={e=>{e.preventDefault();if(groupName.trim()){setGroups(gs=>[{id:Date.now(),name:groupName.trim(),members:["من",...(groupMember.trim()?[groupMember.trim()]:[])]},...gs]);setGroupName("");setGroupMember("");}}}><label>نام گروه</label><input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="مثلاً گروه دوستان"/><label>نام یک عضو (اختیاری)</label><input value={groupMember} onChange={e=>setGroupMember(e.target.value)} placeholder="نام دوست"/><button className="send" type="submit">ساخت گروه</button></form><div className="status-list"><h3>گروه‌های من</h3>{groups.map(g=><div className="status-card" key={g.id}><strong>{g.name}</strong><p>{g.members.length} عضو: {g.members.join("، ")}</p><button className="text-action" onClick={()=>setGroups(gs=>gs.filter(x=>x.id!==g.id))}>حذف گروه آزمایشی</button></div>)}</div><p className="demo-warning">ساخت و حذف گروه فعلاً فقط در همین گوشی انجام می‌شود.</p></section>}
      {page === "account" && <section className="content-page"><h2>ورود به افغان چت</h2><p>با شمارهٔ افغانستان یا ایران، یا حساب گوگل وارد شو.</p><div className="settings-group"><h3>ورود با شماره تلفن</h3><label>کشور<select value={loginCountry} onChange={e=>setLoginCountry(e.target.value)}><option value="+93">افغانستان +93</option><option value="+98">ایران +98</option></select></label><label>شماره تلفن<input dir="ltr" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} placeholder="700000000"/></label>{loginStep&&<label>کد آزمایشی<input dir="ltr" value={loginCode} onChange={e=>setLoginCode(e.target.value)} placeholder="کد یک‌بارمصرف"/></label>}<div id="recaptcha-container"></div><button className="send" disabled={authBusy} onClick={loginStep?verifyPhoneCode:requestPhoneCode}>{authBusy?"لطفاً صبر کن...":loginStep?"تأیید کد پیامک‌شده":"دریافت کد واقعی"}</button><button className="secondary-action" type="button" onClick={loginWithGoogle}>ادامه با Google</button>{authUser&&<p className="login-success">وارد شده‌ای: {authUser.phoneNumber || authUser.email}</p>}{notice&&<p className="notice">{notice}</p>}</div><p className="setting-hint">برای پیامک، شماره باید با کود کشور درست باشد و دامنهٔ برنامه در تنظیمات Firebase مجاز باشد. پیامک ممکن است سهمیهٔ محدود داشته باشد.</p></section>}
      {page === "more" && <section className="content-page more-page"><h2>بیشتر</h2><p>بخش‌های دیگر افغان چت</p><div className="more-menu">
        <button onClick={()=>setPage("friends")}><span>👥</span><strong>دوستان</strong><small>یافتن و افزودن دوست</small><b>‹</b></button>
        <button onClick={()=>setPage("groups")}><span>👨‍👩‍👧‍👦</span><strong>گروه‌ها</strong><small>ساخت و مدیریت گروه‌ها</small><b>‹</b></button>
        <button onClick={()=>setPage("account")}><span>🔐</span><strong>ورود</strong><small>ورود به حساب افغان چت</small><b>‹</b></button>
        <button onClick={()=>setPage("settings")}><span>⚙️</span><strong>تنظیمات</strong><small>حریم خصوصی و ظاهر برنامه</small><b>‹</b></button>
      </div></section>}
      <nav className="mobile-bottom-nav" aria-label="منوی اصلی">
        <button className={["chats","friends","groups","account"].includes(page)?"active":""} onClick={()=>{setPage("chats");setMobileChatOpen(false);}}><span>☷</span><b>گفتگوها</b></button>
        <button className={page==="status"?"active":""} onClick={()=>{setPage("status");setMobileChatOpen(false);}}><span>◉</span><b>وضعیت</b></button>
        <button className={page==="calls"?"active":""} onClick={()=>{setPage("calls");setMobileChatOpen(false);}}><span>☎</span><b>تماس‌ها</b></button>
        <button className={["more","settings"].includes(page)?"active":""} onClick={()=>{setPage("more");setMobileChatOpen(false);}}><span>☰</span><b>بیشتر</b></button>
      </nav>
      {callSession && <CallScreen session={callSession} onClose={() => setCallSession(null)} />}
    </main>
  );
}
