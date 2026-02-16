const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'google/gemini-2.0-flash-001';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface FinancialContext {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
    recentTransactions: {
        type: string;
        amount: number;
        category: string;
        date: string;
        description: string;
    }[];
    categoryBreakdown: { category: string; total: number; type: string }[];
}

const SYSTEM_PROMPT = `Sen kişisel finans asistanısın.

KATI KURALLAR:
- Türkçe yanıt ver, para birimi ₺
- KISA VE NET cevaplar ver. Maksimum 3-4 cümle.
- Gereksiz açıklama, giriş cümlesi veya tekrar YAPMA
- Sorulan soruya doğrudan cevap ver, konu dışına çıkma
- Rakamları ver, uzun analizlerden kaçın
- Emoji kullan ama abartma (max 2-3)
- "Tabii ki", "Elbette", "Memnuniyetle" gibi dolgu ifadeler KULLANMA
- Listelemeler en fazla 3-4 madde olsun`;

function buildContextMessage(context: FinancialContext): string {
    const recentTxList = context.recentTransactions
        .map(t => `- ${t.type === 'income' ? '💰' : '💸'} ${t.description}: ${t.amount.toLocaleString('tr-TR')} ₺ (${t.category}, ${new Date(t.date).toLocaleDateString('tr-TR')})`)
        .join('\n');

    const categoryList = context.categoryBreakdown
        .map(c => `- ${c.category}: ${c.total.toLocaleString('tr-TR')} ₺ (${c.type === 'income' ? 'Gelir' : 'Gider'})`)
        .join('\n');

    return `Kullanıcının güncel finansal verileri:

📊 Bu Ay Özeti:
- Toplam Gelir: ${context.totalIncome.toLocaleString('tr-TR')} ₺
- Toplam Gider: ${context.totalExpense.toLocaleString('tr-TR')} ₺
- Bakiye: ${context.balance.toLocaleString('tr-TR')} ₺
- Toplam İşlem Sayısı: ${context.transactionCount}

📋 Son İşlemler:
${recentTxList || '- Henüz işlem yok'}

📊 Kategori Dağılımı:
${categoryList || '- Henüz veri yok'}`;
}

export async function sendChatMessage(
    userMessage: string,
    conversationHistory: ChatMessage[],
    context: FinancialContext
): Promise<string> {
    const contextMessage = buildContextMessage(context);

    const messages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: contextMessage },
        ...conversationHistory,
        { role: 'user', content: userMessage },
    ];

    try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://income-tracker.app',
                'X-Title': 'Gelir Takip AI Asistan',
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                max_tokens: 300,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('[AIService] API Error:', response.status, errorData);
            throw new Error(`API hatası: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        }

        throw new Error('Yanıt alınamadı');
    } catch (error: any) {
        console.error('[AIService] Error:', error);
        if (error.message.includes('network') || error.message.includes('fetch')) {
            throw new Error('İnternet bağlantınızı kontrol edin.');
        }
        throw error;
    }
}

export type { ChatMessage, FinancialContext };
