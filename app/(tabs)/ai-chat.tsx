import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getAllTransactions, getAllCategories, getMonthlyStats } from '@/database';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function AIChatScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

    // Calculate bottom offset for tab bar
    const tabBarHeight = 60 + insets.bottom;

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Merhaba! Ben finansal asistanınızım. Gelir ve giderleriniz hakkında sorularınızı sorabilirsiz. Örneğin:\n\n• "Bu ay ne kadar harcadım?"\n• "En çok hangi kategoride harcama yapıyorum?"\n• "Tasarruf önerisi ver"',
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const getFinancialContext = async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const [transactions, categories, stats] = await Promise.all([
            getAllTransactions(),
            getAllCategories(),
            getMonthlyStats(year, month),
        ]);

        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

        const recentTransactions = transactions.slice(0, 10).map(t => ({
            type: t.type,
            amount: t.amount,
            category: categoryMap.get(t.category_id) || 'Bilinmiyor',
            date: t.date,
            description: t.description,
        }));

        return {
            monthlyStats: stats,
            recentTransactions,
            totalTransactions: transactions.length,
        };
    };

    const generateResponse = async (userMessage: string): Promise<string> => {
        const context = await getFinancialContext();

        // Simple rule-based responses (placeholder for AI integration)
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('harcadım') || lowerMessage.includes('gider')) {
            return `Bu ay toplam ${context.monthlyStats.totalExpense.toLocaleString('tr-TR')} ₺ harcama yaptınız.\n\nGelir: ${context.monthlyStats.totalIncome.toLocaleString('tr-TR')} ₺\nGider: ${context.monthlyStats.totalExpense.toLocaleString('tr-TR')} ₺\nBakiye: ${context.monthlyStats.balance.toLocaleString('tr-TR')} ₺`;
        }

        if (lowerMessage.includes('kategori') || lowerMessage.includes('en çok')) {
            const byCategory = context.monthlyStats.byCategory;
            if (byCategory.length === 0) {
                return 'Henüz yeterli veri yok. Birkaç işlem ekledikten sonra kategori analizi yapabilirim.';
            }
            const sorted = byCategory.sort((a, b) => b.total - a.total);
            const top = sorted[0];
            return `En çok harcama yaptığınız kategori: ${top.category_id}\nToplam: ${top.total.toLocaleString('tr-TR')} ₺`;
        }

        if (lowerMessage.includes('tasarruf') || lowerMessage.includes('öneri')) {
            const savings = context.monthlyStats.balance;
            if (savings > 0) {
                return `Tebrikler! Bu ay ${savings.toLocaleString('tr-TR')} ₺ tasarruf ettiniz. 🎉\n\nÖneri: Bu tutarı yatırım hesabınıza aktarmayı düşünebilirsiniz.`;
            } else {
                return `Bu ay ${Math.abs(savings).toLocaleString('tr-TR')} ₺ açık verdiniz.\n\nÖneri: Gereksiz abonelikleri ve düzenli giderleri gözden geçirin.`;
            }
        }

        if (lowerMessage.includes('özet') || lowerMessage.includes('durum')) {
            return `📊 Bu Ay Özeti:\n\n💰 Gelir: ${context.monthlyStats.totalIncome.toLocaleString('tr-TR')} ₺\n💸 Gider: ${context.monthlyStats.totalExpense.toLocaleString('tr-TR')} ₺\n📈 Bakiye: ${context.monthlyStats.balance.toLocaleString('tr-TR')} ₺\n📝 Toplam İşlem: ${context.totalTransactions}`;
        }

        return 'Gelir ve giderleriniz hakkında soru sorabilirsiniz. Örneğin "Bu ay ne kadar harcadım?" veya "Tasarruf önerisi ver" diyebilirsiniz.';
    };

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await generateResponse(userMessage.content);
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Bir hata oluştu. Lütfen tekrar deneyin.',
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
            >
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={[
                            styles.messageBubble,
                            message.role === 'user'
                                ? [styles.userMessage, { backgroundColor: colors.tint }]
                                : [styles.assistantMessage, { backgroundColor: colors.surface, borderColor: colors.border }],
                        ]}
                    >
                        <Text
                            style={[
                                styles.messageText,
                                { color: message.role === 'user' ? '#FFFFFF' : colors.text },
                            ]}
                        >
                            {message.content}
                        </Text>
                    </View>
                ))}
                {isLoading && (
                    <View style={[styles.messageBubble, styles.assistantMessage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <ActivityIndicator size="small" color={colors.tint} />
                    </View>
                )}
            </ScrollView>

            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    marginBottom: tabBarHeight,
                }
            ]}>
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Mesajınızı yazın..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: colors.tint, opacity: inputText.trim() ? 1 : 0.5 }]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || isLoading}
                >
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 14,
        borderRadius: 16,
        marginBottom: 8,
    },
    userMessage: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    assistantMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        maxHeight: 100,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
