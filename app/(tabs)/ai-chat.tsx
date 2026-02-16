import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { PaperPlaneRight, Sparkle, User, Robot, Trash } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getAllTransactions, getAllCategories, getMonthlyStats } from '@/database';
import { sendChatMessage, ChatMessage, FinancialContext } from '@/services/aiService';
import { StatusBar } from 'react-native';

interface UIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isTyping?: boolean;
}

const QUICK_PROMPTS = [
    { emoji: '📊', text: 'Bu ay ne kadar harcadım?' },
    { emoji: '📈', text: 'Aylık finansal özet ver' },
    { emoji: '💡', text: 'Tasarruf önerisi ver' },
    { emoji: '📋', text: 'Harcama kategori analizi yap' },
    { emoji: '🎯', text: 'Bütçe planı öner' },
];

// Typing animation component
function TypingText({ text, onComplete, style }: { text: string; onComplete: () => void; style: any }) {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const scrollViewRef = useRef<ScrollView | null>(null);

    useEffect(() => {
        indexRef.current = 0;
        setDisplayedText('');

        const interval = setInterval(() => {
            indexRef.current += 1;
            const nextChunk = text.slice(0, indexRef.current);
            setDisplayedText(nextChunk);

            if (indexRef.current >= text.length) {
                clearInterval(interval);
                onComplete();
            }
        }, 15); // 15ms per character

        return () => clearInterval(interval);
    }, [text]);

    return <Text style={style}>{displayedText}▍</Text>;
}

export default function AIChatScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

    const [messages, setMessages] = useState<UIMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Merhaba! 👋 Gelir ve giderleriniz hakkında sorularınızı sorun, size yardımcı olayım.',
        },
    ]);
    const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

    const getFinancialContext = async (): Promise<FinancialContext> => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const [transactions, categories, stats] = await Promise.all([
            getAllTransactions(),
            getAllCategories(),
            getMonthlyStats(year, month),
        ]);

        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

        const recentTransactions = transactions.slice(0, 15).map(t => ({
            type: t.type,
            amount: t.amount,
            category: categoryMap.get(t.category_id) || 'Bilinmiyor',
            date: t.date,
            description: t.description,
        }));

        const categoryBreakdown = stats.byCategory.map(c => ({
            category: categoryMap.get(c.category_id) || c.category_id,
            total: c.total,
            type: c.type || 'expense',
        }));

        return {
            totalIncome: stats.totalIncome,
            totalExpense: stats.totalExpense,
            balance: stats.balance,
            transactionCount: transactions.length,
            recentTransactions,
            categoryBreakdown,
        };
    };

    const handleSend = async (text?: string) => {
        const messageText = (text || inputText).trim();
        if (!messageText || isLoading) return;

        const userMessage: UIMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const context = await getFinancialContext();
            const response = await sendChatMessage(messageText, conversationHistory, context);

            const assistantId = (Date.now() + 1).toString();

            const assistantMessage: UIMessage = {
                id: assistantId,
                role: 'assistant',
                content: response,
                isTyping: true,
            };

            setMessages(prev => [...prev, assistantMessage]);
            setTypingMessageId(assistantId);

            // Update conversation history
            setConversationHistory(prev => [
                ...prev,
                { role: 'user', content: messageText },
                { role: 'assistant', content: response },
            ]);
        } catch (error: any) {
            const errorMessage: UIMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `⚠️ ${error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'}`,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTypingComplete = useCallback(() => {
        setTypingMessageId(null);
        setMessages(prev =>
            prev.map(m => m.isTyping ? { ...m, isTyping: false } : m)
        );
    }, []);

    const handleClearChat = () => {
        setMessages([
            {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Sohbet temizlendi. 🔄 Nasıl yardımcı olabilirim?',
            },
        ]);
        setConversationHistory([]);
        setTypingMessageId(null);
    };

    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    // Also scroll during typing
    useEffect(() => {
        if (typingMessageId) {
            const interval = setInterval(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 200);
            return () => clearInterval(interval);
        }
    }, [typingMessageId]);

    const showQuickPrompts = messages.length <= 1;
    const isBusy = isLoading || typingMessageId !== null;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : (StatusBar.currentHeight || 0) + 10}
        >
            {/* Header */}
            <View style={[styles.headerSection, { paddingTop: insets.top + 8 }]}>
                <View style={styles.headerLeft}>
                    <View style={[styles.headerIconBg, { backgroundColor: colors.tint + '10' }]}>
                        <Sparkle size={20} color={colors.tint} weight="fill" />
                    </View>
                    <Text style={[styles.pageTitle, { color: colors.text }]}>AI Asistan</Text>
                </View>
                {messages.length > 1 && (
                    <TouchableOpacity
                        style={[styles.clearButton, { backgroundColor: colors.surfaceAlt }]}
                        onPress={handleClearChat}
                    >
                        <Trash size={16} color={colors.textSecondary} weight="regular" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((message) => (
                    <View key={message.id} style={styles.messageRow}>
                        {message.role === 'assistant' && (
                            <View style={[styles.avatar, { backgroundColor: colors.tint + '10' }]}>
                                <Robot size={16} color={colors.tint} weight="regular" />
                            </View>
                        )}
                        <View
                            style={[
                                styles.messageBubble,
                                message.role === 'user'
                                    ? [styles.userMessage, { backgroundColor: colors.tint }]
                                    : [styles.assistantMessage, { backgroundColor: colors.surface }],
                            ]}
                        >
                            {message.isTyping && message.id === typingMessageId ? (
                                <TypingText
                                    text={message.content}
                                    onComplete={handleTypingComplete}
                                    style={[styles.messageText, { color: colors.text }]}
                                />
                            ) : (
                                <Text
                                    style={[
                                        styles.messageText,
                                        { color: message.role === 'user' ? '#FFFFFF' : colors.text },
                                    ]}
                                >
                                    {message.content}
                                </Text>
                            )}
                        </View>
                        {message.role === 'user' && (
                            <View style={[styles.avatar, { backgroundColor: colors.tint + '20' }]}>
                                <User size={16} color={colors.tint} weight="regular" />
                            </View>
                        )}
                    </View>
                ))}

                {isLoading && !typingMessageId && (
                    <View style={styles.messageRow}>
                        <View style={[styles.avatar, { backgroundColor: colors.tint + '10' }]}>
                            <Robot size={16} color={colors.tint} weight="regular" />
                        </View>
                        <View style={[styles.messageBubble, styles.assistantMessage, { backgroundColor: colors.surface }]}>
                            <View style={styles.typingIndicator}>
                                <View style={[styles.typingDot, { backgroundColor: colors.tint, opacity: 0.4 }]} />
                                <View style={[styles.typingDot, { backgroundColor: colors.tint, opacity: 0.6 }]} />
                                <View style={[styles.typingDot, { backgroundColor: colors.tint, opacity: 0.8 }]} />
                            </View>
                        </View>
                    </View>
                )}

                {/* Quick Prompts */}
                {showQuickPrompts && (
                    <View style={styles.quickPrompts}>
                        <Text style={[styles.quickPromptsTitle, { color: colors.textSecondary }]}>
                            HIZLI SORULAR
                        </Text>
                        {QUICK_PROMPTS.map((prompt, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.quickPromptButton, {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                }]}
                                onPress={() => handleSend(prompt.text)}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.quickPromptEmoji}>{prompt.emoji}</Text>
                                <Text style={[styles.quickPromptText, { color: colors.text }]}>
                                    {prompt.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputContainer, {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 12),
            }]}>
                <View style={[styles.inputWrapper, {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Mesajınızı yazın..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        maxLength={1000}
                        editable={!isBusy}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, {
                            backgroundColor: inputText.trim() && !isBusy ? colors.tint : colors.tint + '30',
                        }]}
                        onPress={() => handleSend()}
                        disabled={!inputText.trim() || isBusy}
                    >
                        <PaperPlaneRight size={18} color="#FFFFFF" weight="fill" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageTitle: {
        fontSize: 20,
        fontFamily: 'DMSerifDisplay_400Regular',
    },
    clearButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 12,
        gap: 8,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 14,
        borderRadius: 18,
    },
    userMessage: {
        alignSelf: 'flex-end',
        marginLeft: 'auto',
        borderBottomRightRadius: 4,
    },
    assistantMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 21,
    },
    typingIndicator: {
        flexDirection: 'row',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    quickPrompts: {
        marginTop: 16,
        gap: 8,
    },
    quickPromptsTitle: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 1.5,
        marginBottom: 4,
        marginLeft: 4,
    },
    quickPromptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        gap: 10,
    },
    quickPromptEmoji: {
        fontSize: 16,
    },
    quickPromptText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 24,
        borderWidth: 1,
        paddingLeft: 16,
        paddingRight: 6,
        paddingVertical: 6,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        maxHeight: 80,
        paddingVertical: 6,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
