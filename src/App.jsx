import { useState } from "react";

const demoChats = [
  { id: 1, name: "احمد", message: "سلام، خوبی؟", time: "۹:۳۰", unread: 2, color: "green" },
  { id: 2, name: "فاطمه", message: "عکس را فرستادم", time: "دیروز", unread: 0, color: "blue" },
  { id: 3, name: "گروه خانواده", message: "محمد: تشکر", time: "دیروز", unread: 0, color: "orange" }
];

export default function App() {
  const [active, setActive] = useState(demoChats[0]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, from: "them", text: "سلام! به افغان چت خوش آمدی." },
    { id: 2, from: "me", text: "سلام، تشکر!" }
  ]);

  function sendMessage(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    setMessages((items) => [...items, { id: Date.now(), from: "me", text }]);
    setMessage("");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <header className="brand">
          <div className="brand-mark">اچ</div>
          <div><h1>افغان چت</h1><p>Afghan Chat</p></div>
        </header>
        <div className="profile"><div className="avatar self">ع</div><div><strong>حساب من</strong><span>خوش آمدی</span></div></div>
        <div className="section-title">گفتگوها <span>۳</span></div>
        <nav className="chat-list" aria-label="گفتگوها">
          {demoChats.map((chat) => (
            <button className={active.id === chat.id ? "chat-item selected" : "chat-item"} key={chat.id} onClick={() => setActive(chat)}>
              <div className={"avatar " + chat.color}>{chat.name.slice(0, 1)}</div>
              <div className="chat-copy"><strong>{chat.name}</strong><span>{chat.message}</span></div>
              <div className="chat-meta"><time>{chat.time}</time>{chat.unread > 0 && <i>{chat.unread}</i>}</div>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">نسخهٔ آغازین افغان چت</div>
      </aside>

      <section className="conversation">
        <header className="conversation-head">
          <div className="avatar green">{active.name.slice(0, 1)}</div>
          <div><strong>{active.name}</strong><span>گفتگوی آزمایشی</span></div>
          <button className="more" aria-label="گزینه‌ها">•••</button>
        </header>
        <div className="messages">
          <div className="date-chip">امروز</div>
          {messages.map((item) => (
            <div className={"bubble-row " + (item.from === "me" ? "mine" : "")} key={item.id}>
              <div className="bubble">{item.text}<small>{item.from === "me" ? "ارسال شد" : "دریافت شد"}</small></div>
              {item.from === "me" && <button className="delete" title="حذف پیام" onClick={() => setMessages((all) => all.filter((m) => m.id !== item.id))}>حذف</button>}
            </div>
          ))}
        </div>
        <form className="composer" onSubmit={sendMessage}>
          <button className="attach" type="button" title="ارسال فایل (به‌زودی)">＋</button>
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="پیامت را بنویس..." aria-label="متن پیام" />
          <button className="send" type="submit">ارسال</button>
        </form>
        <p className="demo-warning">این نسخه نمایشی است؛ پیام‌ها هنوز به کاربران دیگر فرستاده نمی‌شوند.</p>
      </section>
    </main>
  );
}
