import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function AIChatModule({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<{role:'user'|'ai',content:string}[]>([]);
  const [input, setInput] = useState('');
  const [showModal, setShowModal] = useState<'master'|'daily'|'modify'|null>(null);

  const send = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m)=>[...m,{role:'user',content:text}]);
    setInput('');
    setTimeout(()=>setMessages((m)=>[...m,{role:'ai',content:'I can help you make study plans. Open tools with + button.'}]),700);
  };

  return <div className="h-full flex flex-col bg-white text-[#1D2129]">
    <style>{`::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}`}</style>
    <header className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white z-30">
      <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"><ArrowLeft size={18}/></button>
      <button className="px-3 py-1.5 rounded-[40px] bg-[#E8F3FF] text-[#165DFF] text-sm font-medium">New Chat</button>
    </header>
    <main className="flex-1 overflow-y-auto px-4 py-4">
      {messages.length===0 ? <div className="h-full flex flex-col items-center justify-center text-center gap-4">
        <h2 className="text-2xl font-bold">Hello! What can I help you with today?</h2>
      </div> : <div className="flex flex-col gap-3">{messages.map((m,i)=><div key={i} className={`max-w-[85%] px-4 py-3 rounded-2xl ${m.role==='user'?'self-end bg-[#165DFF] text-white':'self-start bg-gray-100'}`}>{m.content}</div>)}</div>}
    </main>
    <footer className="w-full px-4 py-3 border-t border-gray-100 bg-white z-20">
      <div className="w-full flex items-center gap-2">
        <input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&send()} className="flex-1 px-4 py-3 rounded-[40px] border border-gray-200 bg-gray-50" placeholder="Type your message here..."/>
        <button onClick={send} className="w-12 h-12 rounded-full bg-[#165DFF] text-white">➤</button>
      </div>
    </footer>
    <nav className="w-full px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-between z-30">
      <button className="text-[#165DFF] text-xs">Home</button><button className="text-xs text-gray-400">Plans</button><button className="text-xs text-gray-400">History</button><button className="text-xs text-gray-400">Mine</button>
    </nav>
    <div className="fixed right-6 bottom-24 z-40">
      <button onClick={() => setShowModal('daily')} className="w-14 h-14 rounded-full bg-[#165DFF] text-white shadow-lg">+</button>
    </div>
    {showModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"><div className="bg-white rounded-[32px] p-6 w-full max-w-lg"><h3 className="font-bold mb-3">{showModal==='master'?'Master Study Plan':showModal==='daily'?'Daily Study Plan':'Modify Study Plan'}</h3><textarea className="w-full border rounded-2xl p-3 min-h-[120px]" placeholder="Input requirements..."/><div className="mt-3 flex gap-2 justify-end"><button onClick={()=>setShowModal(null)} className="px-4 py-2 rounded-[40px] border">Cancel</button><button className="px-4 py-2 rounded-[40px] bg-[#165DFF] text-white">Generate Plan</button></div></div></div>}
  </div>;
}
