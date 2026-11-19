import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
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

  const [active, setActive] = useState({ id: null, name: "گفتگوی تازه", photo: "" });
  const [conversations, setConversations] = useState([]);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [messages, setMessages] = useState([]);
  const [notice, setNotice] = useState("");
  const filePicker = useRef(null);
  const recorder = useRef(null);
  const [recording, setRecording] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [myStatuses, setMyStatuses] = useState([]);
  const [callSession, setCallSession] = useState(null);
  const [displayName, setDisplayName] = useState("حساب من");
  const [username, setUsername] = useState("");
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
  const [phoneNumber,setPhoneNumber] = useState("");
  const [phoneOtp,setPhoneOtp] = useState("");
  const [phoneOtpSent,setPhoneOtpSent] = useState(false);
  const [loggedIn,setLoggedIn] = useState(false);
  const [profileImage,setProfileImage] = useState("");
  const statusPicker = useRef(null);
  const avatarPicker = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      setLoggedIn(Boolean(user));
      if (user) {
        setDisplayName(user.user_metadata?.display_name || user.email?.split("@")[0] || "کاربر افغان چت");
        setPage("chats");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      setLoggedIn(Boolean(user));
      if (user) {
        setDisplayName(user.user_metadata?.display_name || user.email?.split("@")[0] || "کاربر افغان چت");
        setPage("chats");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser?.id) { setUsername(""); return; }
    supabase.from("profiles").select("username,display_name,about,avatar_url")
      .eq("id", authUser.id).maybeSingle().then(({ data }) => {
        if (data) {
          setUsername(data.username || "");
          setDisplayName(data.display_name || authUser.email?.split("@")[0] || "کاربر افغان چت");
          setAbout(data.about || "");
          setProfileImage(data.avatar_url || "");
        }
      });
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser?.id) { setConversations([]); setMessages([]); return; }
    let cancelled = false;
    async function loadConversations() {
      const { data, error } = await supabase
        .from("conversation_members")
        .select("conversation_id, conversations(id,title,is_group,created_at)")
        .eq("user_id", authUser.id);
      if (error) { setNotice("بارگذاری گفتگوها انجام نشد: " + error.message); return; }
      const items = [];
      for (const row of data || []) {
        const conversation = row.conversations;
        if (!conversation) continue;
        const { data: members } = await supabase
          .from("conversation_members").select("user_id")
          .eq("conversation_id", conversation.id);
        const otherId = (members || []).find((member) => member.user_id !== authUser.id)?.user_id;
        let name = conversation.title || "گفتگوی تازه";
        if (otherId) {
          const { data: profile } = await supabase.from("profiles")
            .select("display_name").eq("id", otherId).maybeSingle();
          if (profile?.display_name) name = profile.display_name;
        }
        items.push({ ...conversation, name, photo: "" });
      }
      if (cancelled) return;
      setConversations(items);
      setActive((current) => items.find((item) => item.id === current?.id) || items[0] || { id: null, name: "هنوز گفتگویی نداری", photo: "" });
    }
    loadConversations();
    return () => { cancelled = true; };
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser?.id || !active?.id) { setMessages([]); return; }
    let cancelled = false;
    const loadMessages = async () => {
      const { data, error } = await supabase.from("messages").select("*")
        .eq("conversation_id", active.id).order("created_at", { ascending: true });
      if (error) { setNotice("خواندن پیام‌ها انجام نشد: " + error.message); return; }
      const mapped = await Promise.all((data || []).map(async (item) => {
        let mediaUrl = item.media_url;
        if (mediaUrl && item.message_type !== "text" && !/^https?:\\/\\//.test(mediaUrl)) {
          const { data: signed } = await supabase.storage.from("chat-media").createSignedUrl(mediaUrl, 3600);
          mediaUrl = signed?.signedUrl || "";
        }
        return {
          id: item.id, from: item.sender_id === authUser.id ? "me" : "them",
          text: item.body, type: item.message_type, url: mediaUrl,
          createdAt: new Date(item.created_at).getTime()
        };
      }));
      if (!cancelled) setMessages(mapped);
    };
    loadMessages();
    const channel = supabase.channel("messages-" + active.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: "conversation_id=eq." + active.id }, loadMessages)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [authUser?.id, active?.id]);

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !authUser?.id) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setNotice("عکس باید JPG، PNG یا WebP و کمتر از ۵ مگابایت باشد.");
      return;
    }
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const objectPath = authUser.id + "/avatar." + extension;
    setNotice("در حال ذخیره عکس پروفایل...");
    const { error: uploadError } = await supabase.storage.from("avatars").upload(objectPath, file, {
      contentType: file.type, upsert: true
    });
    if (uploadError) { setNotice("ذخیره عکس انجام نشد: " + uploadError.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(objectPath);
    const avatarUrl = data.publicUrl + "?v=" + Date.now();
    const { error: profileError } = await supabase.from("profiles")
      .upsert({ id: authUser.id, avatar_url: avatarUrl, updated_at: new Date().toISOString() });
    if (profileError) { setNotice("ذخیره نشانی عکس انجام نشد: " + profileError.message); return; }
    setProfileImage(avatarUrl);
    setNotice("");
  }

  async function saveProfile() {
    if (!authUser?.id) return;
    const cleanName = displayName.trim();
    if (!cleanName) { setNotice("نام نمایشی را وارد کن."); return; }
    const { error } = await supabase.from("profiles").update({
      display_name: cleanName,
      about: about.trim(),
      updated_at: new Date().toISOString()
    }).eq("id", authUser.id);
    if (error) { setNotice("ذخیرهٔ پروفایل انجام نشد: " + error.message); return; }
    setDisplayName(cleanName);
    setNotice("پروفایل با موفقیت ذخیره شد.");
  }

  async function sendPhoneCode() {
    const digits = phoneNumber.replace(/[^0-9]/g, "");
    if (digits.length < 6) { setNotice("شماره تلفن را درست وارد کن."); return; }
    const fullPhone = loginCountry + digits.replace(/^0+/, "");
    setAuthBusy(true);
    setNotice("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setPhoneOtpSent(true);
      setNotice("کُد تأیید ارسال شد. کُد پیامک را وارد کن.");
    } catch (error) {
      setNotice("ارسال کُد انجام نشد: " + (error.message || "تنظیمات پیامک هنوز کامل نیست."));
    } finally { setAuthBusy(false); }
  }

  async function verifyPhoneCode() {
    const digits = phoneNumber.replace(/[^0-9]/g, "");
    const fullPhone = loginCountry + digits.replace(/^0+/, "");
    if (!/^\d{6}$/.test(phoneOtp.trim())) { setNotice("کُد باید ۶ رقم باشد."); return; }
    setAuthBusy(true);
    setNotice("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: phoneOtp.trim(),
        type: "sms"
      });
      if (error) throw error;
      setNotice("");
    } catch (error) {
      setNotice("کُد درست نیست یا اعتبارش تمام شده است: " + error.message);
    } finally { setAuthBusy(false); }
  }

  async function loginWithGoogle() {
    setAuthBusy(true);
    setNotice("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) { setNotice("ورود گوگل هنوز در تنظیمات Supabase فعال نشده است: " + error.message); setAuthBusy(false); }
  }

  function openCall(contact, media) {
    setCallSession(createCallSession({ contact, media }));
  }

  async function sendMessage(event) {
    event.preventDefault();
    const value = message.trim();
    if (!value || !authUser?.id || !active?.id) return;
    const { error } = await supabase.from("messages").insert({
      conversation_id: active.id, sender_id: authUser.id, body: value, message_type: "text"
    });
    if (error) { setNotice("پیام فرستاده نشد: " + error.message); return; }
    setMessage("");
    setNotice("");
  }

  async function deleteMessage(id) {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) setNotice("حذف پیام انجام نشد: " + error.message);
  }

  async function addAttachment(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !authUser?.id || !active?.id) return;
    if (file.size > 25 * 1024 * 1024) { setNotice("حجم فایل باید کمتر از ۲۵ مگابایت باشد."); return; }
    const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "file";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-90) || "attachment";
    const objectPath = active.id + "/" + authUser.id + "/" + Date.now() + "-" + safeName;
    setNotice("در حال بارگذاری فایل...");
    const { error: uploadError } = await supabase.storage.from("chat-media").upload(objectPath, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (uploadError) { setNotice("بارگذاری فایل انجام نشد: " + uploadError.message); return; }
    const { error: messageError } = await supabase.from("messages").insert({
      conversation_id: active.id, sender_id: authUser.id, body: file.name,
      message_type: kind, media_url: objectPath
    });
    if (messageError) {
      await supabase.storage.from("chat-media").remove([objectPath]);
      setNotice("ثبت پیام انجام نشد: " + messageError.message);
      return;
    }
    setNotice("");
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

  async function findFriend(event) {
    event.preventDefault();
    const value = phone.trim();
    if (!value) { setNotice("شماره تلفن یا نام کاربری دوستت را وارد کن."); return; }
    setNotice("");
    const normalizedPhone = value.replace(/[\s()-]/g, "");
    let friend = null;
    let lookupError = null;
    if (/^\+(93|98)[0-9]{7,12}$/.test(normalizedPhone)) {
      const { data, error } = await supabase.rpc("find_user_by_phone", { p_phone: normalizedPhone });
      lookupError = error;
      friend = Array.isArray(data) ? data[0] : data;
    } else {
      const usernameValue = value.replace(/^@/, "");
      const { data, error } = await supabase.from("profiles")
        .select("id,username,display_name").eq("username", usernameValue).maybeSingle();
      lookupError = error;
      friend = data;
    }
    if (lookupError || !friend) {
      setNotice("این شماره یا نام کاربری پیدا نشد. دوستت باید اول در افغان‌چت حساب ساخته و شماره‌اش را تأیید کرده باشد.");
      return;
    }
    if (friend.id === authUser.id) { setNotice("این نام کاربری متعلق به خودت است."); return; }
    const { data: conversation, error: createError } = await supabase.from("conversations")
      .insert({ title: friend.display_name, is_group: false, created_by: authUser.id })
      .select("id,title,is_group,created_at").single();
    if (createError) { setNotice("ساخت گفتگو انجام نشد: " + createError.message); return; }
    const { error: membersError } = await supabase.from("conversation_members").insert([
      { conversation_id: conversation.id, user_id: authUser.id },
      { conversation_id: conversation.id, user_id: friend.id }
    ]);
    if (membersError) { setNotice("افزودن عضو انجام نشد: " + membersError.message); return; }
    const item = { ...conversation, name: friend.display_name, photo: "" };
    setConversations((items) => [item, ...items]);
    setActive(item);
    setPage("chats");
    setMobileChatOpen(true);
    setPhone("");
  }


  // Never render chats, settings, or navigation until Supabase confirms a signed-in user.
  if (!authUser) {
    return (
      <main className="app-shell">
        <section className="welcome-screen" dir="rtl">
          <div className="welcome-card">
            <div className="welcome-logo"><img src="/afghan-chat-logo.svg" alt="لوگوی افغان چت" /></div>
            <p className="welcome-kicker">ارتباط نزدیک‌تر، با افغان‌چت</p>
            <h1>ورود به افغان چت</h1>
            <p className="welcome-intro">برای ورود، شماره را تأیید کن یا از حساب گوگل استفاده کن.</p>
            <button className="google-signin" type="button" onClick={loginWithGoogle} disabled={authBusy}><span className="google-g">G</span><span>{authBusy ? "در حال اتصال..." : "ادامه با حساب گوگل"}</span></button>
            <div className="welcome-divider"><span>یا ورود با شماره تلفن</span></div>
            <div className="settings-group country-preview">
              <label className="login-label" htmlFor="login-country">کشور و پیش‌شماره</label>
              <select id="login-country" value={loginCountry} onChange={e=>{setLoginCountry(e.target.value);setPhoneOtpSent(false);setPhoneOtp("");}}>
                <option value="+93">🇦🇫 افغانستان +93</option><option value="+98">🇮🇷 ایران +98</option>
                <option value="+92">پاکستان +92</option><option value="+992">تاجیکستان +992</option>
                <option value="+998">ازبکستان +998</option><option value="+993">ترکمنستان +993</option>
                <option value="+90">ترکیه +90</option><option value="+971">امارات +971</option>
                <option value="+966">عربستان سعودی +966</option><option value="+91">هند +91</option>
              </select>
            </div>
            <label className="login-label" htmlFor="login-phone">شماره تلفن</label>
            <input id="login-phone" type="tel" dir="ltr" autoComplete="tel-national" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} placeholder="شماره خود را وارد کن" disabled={phoneOtpSent} />
            {!phoneOtpSent ? <button className="phone-signin" type="button" onClick={sendPhoneCode} disabled={authBusy}>{authBusy ? "در حال ارسال..." : "ارسال کُد تأیید"}</button> : <>
              <label className="login-label" htmlFor="login-otp">کُد شش‌رقمی پیامک</label>
              <input id="login-otp" type="text" inputMode="numeric" autoComplete="one-time-code" dir="ltr" maxLength={6} value={phoneOtp} onChange={e=>setPhoneOtp(e.target.value.replace(/[^0-9]/g,""))} placeholder="کُد پیامک" />
              <button className="phone-signin" type="button" onClick={verifyPhoneCode} disabled={authBusy}>{authBusy ? "در حال بررسی..." : "تأیید کُد و ورود"}</button>
              <button className="back-link" type="button" onClick={()=>{setPhoneOtpSent(false);setPhoneOtp("");setNotice("");}}>تغییر شماره</button>
            </>}
            {notice && <p className="notice" role="alert">{notice}</p>}
            <p className="security-note">بدون تأیید کُد پیامک یا تأیید حساب گوگل، ورود انجام نمی‌شود. ورود آزمایشی با شماره‌های ثابت فقط پس از ثبت همان شماره‌ها و کُدها در تنظیمات امن Supabase ممکن است.</p>
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
        <div className="profile"><button className="avatar self avatar-button" type="button" onClick={()=>avatarPicker.current?.click()}>{profileImage ? <img src={profileImage} alt="عکس پروفایل"/> : <img src="/afghan-chat-logo.svg" alt="عکس پروفایل افغان چت"/>}</button><input ref={avatarPicker} className="hidden-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar}/><div><strong>{displayName}</strong><span dir="ltr">@{username || "..."}</span></div></div>
        <div className="side-actions">
          <button className={page === "chats" ? "side-action active" : "side-action"} onClick={() => {setPage("chats");setMobileChatOpen(false);}}>گفتگوها</button>
          <button className={page === "friends" ? "side-action active" : "side-action"} onClick={() => setPage("friends")}>دوستان</button>
          <button className={page === "status" ? "side-action active" : "side-action"} onClick={() => setPage("status")}>وضعیت</button>
          <button className={page === "calls" ? "side-action active" : "side-action"} onClick={() => setPage("calls")}>تماس‌ها</button>
          <button className={page === "groups" ? "side-action active" : "side-action"} onClick={() => setPage("groups")}>گروه‌ها</button>
          <button className={page === "account" ? "side-action active" : "side-action"} onClick={() => setPage("account")}>ورود</button>
          <button className={page === "settings" ? "side-action active" : "side-action"} onClick={() => setPage("settings")}>تنظیمات</button>
        </div>
        {page === "chats" && <><div className="section-title"><span>گفتگوها</span><button className="new-message" type="button" onClick={()=>setPage("friends")}>＋ پیام جدید</button></div><nav className="chat-list" aria-label="گفتگوها">{conversations.map((chat) => <button className={active.id === chat.id ? "chat-item selected" : "chat-item"} key={chat.id} onClick={() => {setActive(chat);setMobileChatOpen(true);}}><div className={"avatar " + chat.color}>{chat.photo && <img src={chat.photo} alt={chat.name}/>}</div><div className="chat-copy"><strong>{chat.name}</strong><span>{chat.message}</span></div><div className="chat-meta"><time>{chat.time}</time>{chat.unread > 0 && <i>{chat.unread}</i>}</div></button>)}{conversations.length===0 && <p className="setting-hint">هنوز گفتگویی نداری؛ از بخش دوستان نام کاربری دوستت را جست‌وجو کن.</p>}</nav></>}
        <div className="sidebar-note">نسخهٔ آزمایشی افغان چت</div>
      </aside>}
      {page === "chats" ? <section className="conversation">
        <header className="conversation-head"><button className="mobile-back" type="button" onClick={()=>setMobileChatOpen(false)} aria-label="بازگشت به گفتگوها">‹</button><div className="avatar green">{active.photo ? <img src={active.photo} alt={active.name}/> : active.name.slice(0, 1)}</div><div className="contact-title"><strong>{active.name}</strong><span>گفتگوی آزمایشی</span></div><div className="call-actions"><button type="button" title="تماس صوتی" onClick={() => openCall(active.name, "voice")}>☎</button><button type="button" title="تماس تصویری" onClick={() => openCall(active.name, "video")}>▣</button></div><button className="more" aria-label="گزینه‌ها">•••</button></header>
        <div className="messages"><div className="date-chip">امروز</div>{messages.map((item) => <div className={"bubble-row " + (item.from === "me" ? "mine" : "")} key={item.id}><div className="bubble">{item.type === "image" ? <img className="message-media" src={item.url} alt="عکس فرستاده‌شده" /> : item.type === "video" ? <video className="message-media" src={item.url} controls /> : item.type === "audio" ? <audio src={item.url} controls /> : item.type === "file" ? <a href={item.url} download={item.name}>{item.name}</a> : item.text}<small>{item.from === "me" ? "در همین گوشی" : "دریافت شد"}</small></div>{item.from === "me" && <button className="delete" title="حذف پیام" onClick={() => deleteMessage(item.id)}>حذف</button>}</div>)}</div>
        <form className="composer" onSubmit={sendMessage}><input ref={filePicker} className="hidden-file" type="file" accept="image/*,video/*,audio/*" onChange={addAttachment} /><button className="attach" type="button" title="فرستادن عکس یا ویدیو" onClick={() => filePicker.current?.click()}>＋</button><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="پیامت را بنویس..." aria-label="متن پیام" /><button className={recording ? "record recording" : "record"} type="button" title={recording ? "پایان ضبط" : "ضبط پیام صوتی"} onClick={toggleRecording}>{recording ? "■" : "🎙"}</button><button className="send" type="submit">ارسال</button></form>
        {notice && <button className="notice chat-notice" onClick={() => setNotice("")}>{notice}  ✕</button>}<p className="demo-warning">پیام‌های متنی این گفتگو در Supabase ذخیره و با اعضای گفتگو همگام می‌شوند.</p>
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
        <h2>افزودن دوستان</h2><p>شمارهٔ تأییدشدهٔ افغانستان یا ایران، یا نام کاربری دوستت را وارد کن.</p>
        <form className="friend-form" onSubmit={findFriend}><label htmlFor="friend-phone">شمارهٔ تلفن یا نام کاربری دوست</label><input id="friend-phone" dir="ltr" value={phone} onChange={(e) => {setPhone(e.target.value);setNotice("");}} placeholder="+937XXXXXXXXX یا نام‌کاربری" /><button className="send" type="submit">جست‌وجوی دوست</button></form>
        <div className="help-card"><strong>دوستت افغان چت ندارد؟</strong><p>می‌توانی بعداً لینک دعوت را برایش بفرستی.</p></div>
        {notice && <p className="notice">{notice}</p>}
        <p className="demo-warning">برای جست‌وجو با شماره، دوستت باید شمارهٔ ‎+93 یا ‎+98 خود را در افغان‌چت تأیید کرده باشد.</p>
      </section> : page === "settings" ? <section className="content-page settings-page"><h2>تنظیمات</h2><p>حساب و برنامهٔ افغان چت را مدیریت کن.</p>
        <div className="settings-group"><h3>پروفایل من</h3><label>نام نمایشی<input value={displayName} onChange={e=>setDisplayName(e.target.value)} /></label><label>دربارهٔ من<input value={about} onChange={e=>setAbout(e.target.value)} /></label><small>نام کاربری تو: @{username || "در حال بارگذاری"} — آن را برای افزودن دوست به او بده.</small><button className="send" type="button" onClick={saveProfile}>ذخیرهٔ تغییرات پروفایل</button>{notice && <p className="notice">{notice}</p>}</div>
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
      {page === "account" && <section className="content-page"><h2>حساب من</h2><p>{authUser?.email || "حساب افغان‌چت"}</p><div className="settings-group"><p>ورود با Supabase فعال است. ورود با شماره تلفن پس از تنظیم سرویس پیامک فعال می‌شود.</p><button className="send" type="button" onClick={async()=>{await supabase.auth.signOut();setPage("welcome");}}>خروج از حساب</button></div></section>}
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
