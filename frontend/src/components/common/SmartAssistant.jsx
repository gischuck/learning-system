import React, { useState, useRef, useEffect } from 'react';

const SmartAssistant = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState(() => {
    // 从localStorage加载历史对话
    const saved = localStorage.getItem('assistantMessages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : [
          { role: 'assistant', content: '你好！我是智慧助手，可以帮你管理学习规划数据。你可以问我：\n- 查看作业/课程/笔记\n- 添加新作业/课程\n- 统计信息\n- 等等...' }
        ];
      } catch {
        return [
          { role: 'assistant', content: '你好！我是智慧助手，可以帮你管理学习规划数据。你可以问我：\n- 查看作业/课程/笔记\n- 添加新作业/课程\n- 统计信息\n- 等等...' }
        ];
      }
    }
    return [
      { role: 'assistant', content: '你好！我是智慧助手，可以帮你管理学习规划数据。你可以问我：\n- 查看作业/课程/笔记\n- 添加新作业/课程\n- 统计信息\n- 等等...' }
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 保存对话历史到localStorage
  useEffect(() => {
    localStorage.setItem('assistantMessages', JSON.stringify(messages));
  }, [messages]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 清空对话历史
  const clearHistory = () => {
    setMessages([
      { role: 'assistant', content: '对话已清空。有什么我可以帮你的？' }
    ]);
  };

  const handleSend = async () => {
    if (!query.trim()) return;
    
    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      // 调用后端 AI 接口，发送对话历史
      const token = localStorage.getItem('token');
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: query,
          history: messages // 发送历史对话
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，处理失败：' + result.message }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，连接失败：' + error.message }]);
    }
    
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl">🤖</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">智慧助手</h3>
              <p className="text-xs text-gray-500">AI 驱动的学习管理助手 · 对话有记忆</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearHistory} className="text-sm text-gray-400 hover:text-gray-600 px-2 py-1">清空</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入你的问题或指令..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !query.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => setQuery('查看今天的作业')} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">查看今天的作业</button>
            <button onClick={() => setQuery('本周有多少课外班？')} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">本周课外班</button>
            <button onClick={() => setQuery('添加一个作业：明天完成数学练习册第 10 页')} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">添加作业</button>
            <button onClick={() => setQuery('最近有什么比赛要报名？')} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">比赛提醒</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAssistant;