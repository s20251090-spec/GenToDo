import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import FloatingActionButton from './FloatingActionButton';
import { trpc } from '@/lib/trpc';

export default function AIChatModule({ onBack, storage, saveStorage }: { onBack: () => void; storage: any; saveStorage: (next: any) => void }) {
  const [messages, setMessages] = useState<{role:'user'|'ai',content:string}[]>([]);
  const [input, setInput] = useState('');
  const [showModal, setShowModal] = useState<'master'|'daily'|'modify'|null>(null);
  const [modalInput, setModalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const generateMutation = trpc.ai.generate.useMutation();

  useEffect(() => {
    setMessages(storage?.chatHistory || []);
  }, [storage?.chatHistory]);

  const nextMessages = useMemo(() => [...messages], [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    const updated = [...nextMessages, { role: 'user' as const, content: text }];
    setMessages(updated);
    setInput('');
    setIsLoading(true);
    setErrorText('');
    try {
      const prompt = `你是学习计划助手，请基于以下历史对话回复，简明、可执行。\n${updated.map((m) => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`).join('\n')}`;
      const result = await generateMutation.mutateAsync({ prompt });
      const finalMessages = [...updated, { role: 'ai' as const, content: result.result }];
      setMessages(finalMessages);
      saveStorage({ ...storage, chatHistory: finalMessages });
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'AI 请求失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!showModal || !modalInput.trim()) return;
    const typeLabel = showModal === 'master' ? '总体学习计划' : showModal === 'daily' ? '每日学习计划' : '计划修改建议';
    const result = await generateMutation.mutateAsync({ prompt: `请根据以下要求生成${typeLabel}，输出 markdown：\n${modalInput}` });
    const newPlan = { id: String(Date.now()), name: `${typeLabel}-${new Date().toLocaleDateString('zh-CN')}`, content: result.result, time: new Date().toISOString() };
    saveStorage({ ...storage, planList: [...(storage.planList || []), newPlan] });
    setModalInput('');
    setShowModal(null);
  };

  return <div className="h-full flex flex-col bg-white text-[#1D2129]">
    <style>{`::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}`}</style>
    <header className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-white z-30">
      <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"><ArrowLeft size={18}/></button>
      <button onClick={() => setMessages([])} className="px-3 py-1.5 rounded-[40px] bg-[#E8F3FF] text-[#165DFF] text-sm font-medium">New Chat</button>
    </header>
    <main className="flex-1 overflow-y-auto px-4 py-4">
      {messages.length===0 ? <div className="h-full flex flex-col items-center justify-center text-center gap-4">
        <h2 className="text-2xl font-bold">Hello! What can I help you with today?</h2>
      </div> : <div className="flex flex-col gap-3">{messages.map((m,i)=><div key={i} className={`max-w-[85%] px-4 py-3 rounded-2xl ${m.role==='user'?'self-end bg-[#165DFF] text-white':'self-start bg-gray-100'}`}>{m.content}</div>)}</div>}
    </main>
    <footer className="w-full px-4 py-3 border-t border-gray-100 bg-white z-20">
      <div className="w-full flex items-center gap-2">
        <input maxLength={500} value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&send()} className="flex-1 px-4 py-3 rounded-[40px] border border-gray-200 bg-gray-50" placeholder="请输入你的问题..."/>
        <span className="text-xs text-gray-400">{input.length}/500</span>
        <button onClick={send} disabled={isLoading} className="w-12 h-12 rounded-full bg-[#165DFF] text-white disabled:opacity-50">➤</button>
      </div>
      {isLoading && <p className="text-xs text-gray-500 mt-2">AI 正在思考...</p>}
      {errorText && <p className="text-xs text-red-500 mt-2">{errorText}</p>}
    </footer>
    <nav className="w-full px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-between z-30">
      <button onClick={onBack} className="text-[#165DFF] text-xs">Home</button><button onClick={() => setShowModal('master')} className="text-xs text-gray-400">Plans</button><button className="text-xs text-gray-400">History</button><button className="text-xs text-gray-400">Mine</button>
    </nav>
    <FloatingActionButton
      bottom="88px"
      right="24px"
      onMasterPlanClick={() => setShowModal('master')}
      onDailyPlanClick={() => setShowModal('daily')}
      onModifyPlanClick={() => setShowModal('modify')}
    />
    {showModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"><div className="bg-white rounded-[32px] p-6 w-full max-w-lg"><h3 className="font-bold mb-3">{showModal==='master'?'Master Study Plan':showModal==='daily'?'Daily Study Plan':'Modify Study Plan'}</h3><textarea value={modalInput} onChange={(e) => setModalInput(e.target.value)} className="w-full border rounded-2xl p-3 min-h-[120px]" placeholder="Input requirements..."/><div className="mt-3 flex gap-2 justify-end"><button onClick={()=>setShowModal(null)} className="px-4 py-2 rounded-[40px] border">Cancel</button><button onClick={handleGeneratePlan} className="px-4 py-2 rounded-[40px] bg-[#165DFF] text-white">Generate Plan</button></div></div></div>}
  </div>;
}
